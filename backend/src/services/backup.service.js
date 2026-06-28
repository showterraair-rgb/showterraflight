import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import mongoose from 'mongoose';
import BackupLog from '../models/BackupLog.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { parsePaginationQuery, buildPaginationResponse } from '../utils/pagination.js';
import { logAudit } from './audit.service.js';

const execFileAsync = promisify(execFile);

function formatBackupLog(doc) {
  return {
    id: doc._id.toString(),
    fileName: doc.fileName,
    filePath: doc.filePath,
    fileSize: doc.fileSize,
    status: doc.status,
    backupType: doc.backupType,
    startedAt: doc.startedAt,
    completedAt: doc.completedAt,
    errorMessage: doc.errorMessage,
    triggeredById: doc.triggeredBy?.toString(),
    restoreNotes: doc.restoreNotes,
    restoreStatus: doc.restoreStatus || 'none',
    restoreRequestedAt: doc.restoreRequestedAt,
    restoreRequestedById: doc.restoreRequestedBy?.toString(),
    offsitePath: doc.offsitePath,
    checksum: doc.checksum,
    createdAt: doc.createdAt,
  };
}

async function ensureBackupDir() {
  const dir = path.resolve(env.backup.dir);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function computeChecksum(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function resolveBackupPath(filePath) {
  const backupRoot = path.resolve(env.backup.dir);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(backupRoot + path.sep) && resolved !== backupRoot) {
    throw ApiError.forbidden('Invalid backup file path');
  }
  return resolved;
}

function buildRestoreRunbook(backup) {
  const filePath = backup.filePath;
  const fileName = backup.fileName;
  const isMongodumpArchive = fileName.endsWith('.archive.gz') || fileName.endsWith('.gz');

  if (isMongodumpArchive) {
    return {
      method: 'mongorestore',
      warning: 'Stop the API (pm2 stop sta-api) before restore. --drop replaces ALL database data.',
      steps: [
        'Download the backup file from admin panel or copy from server backup directory.',
        'On the VPS: cd /var/www/showterraflight && pm2 stop sta-api',
        'Restore: mongorestore --uri="$MONGODB_URI" --archive=PATH_TO_FILE --gzip --drop',
        'Or use: bash deploy/scripts/restore-mongodb.sh PATH_TO_FILE',
        'Verify data, then: pm2 start sta-api',
      ],
      command: `mongorestore --uri="$MONGODB_URI" --archive="${filePath}" --gzip --drop`,
      scriptPath: 'deploy/scripts/restore-mongodb.sh',
    };
  }

  return {
    method: 'json-import',
    warning: 'JSON export backups require manual import per collection. Prefer mongodump archives for full restore.',
    steps: [
      'Download the JSON backup file.',
      'Review collections in the file before importing.',
      'Import selected collections using mongoimport or a custom script on staging first.',
    ],
    command: null,
    scriptPath: null,
  };
}

async function syncOffsite(sourcePath) {
  const offsiteDir = env.backup.offsiteDir?.trim();
  const rsyncTarget = env.backup.rsyncTarget?.trim();

  if (offsiteDir) {
    await fs.mkdir(offsiteDir, { recursive: true });
    const dest = path.join(offsiteDir, path.basename(sourcePath));
    await fs.copyFile(sourcePath, dest);
    if (rsyncTarget) {
      try {
        await execFileAsync('rsync', ['-az', dest, rsyncTarget], { timeout: 120000 });
        return { offsitePath: dest, rsyncTarget, synced: true };
      } catch (err) {
        return { offsitePath: dest, rsyncTarget, synced: false, rsyncError: err.message };
      }
    }
    return { offsitePath: dest, synced: true };
  }

  if (rsyncTarget) {
    try {
      await execFileAsync('rsync', ['-az', sourcePath, rsyncTarget], { timeout: 120000 });
      return { offsitePath: rsyncTarget, synced: true };
    } catch (err) {
      return { offsitePath: '', synced: false, rsyncError: err.message };
    }
  }

  return null;
}

async function tryMongoDump(outputDir, fileName) {
  const uri = env.mongodbUri;
  const archivePath = path.join(outputDir, fileName);

  try {
    await execFileAsync('mongodump', ['--uri', uri, '--archive=' + archivePath, '--gzip'], {
      timeout: 300000,
    });
    const stat = await fs.stat(archivePath);
    return { filePath: archivePath, fileSize: stat.size, method: 'mongodump' };
  } catch {
    return null;
  }
}

async function jsonExportFallback(outputDir, fileName) {
  const filePath = path.join(outputDir, fileName.replace('.gz', '.json'));
  const collections = mongoose.connection.db.listCollections();
  const exportData = { exportedAt: new Date().toISOString(), collections: {} };

  for await (const coll of collections) {
    const name = coll.collectionName;
    if (name.startsWith('system.')) continue;
    exportData.collections[name] = await mongoose.connection.db.collection(name).find({}).toArray();
  }

  await fs.writeFile(filePath, JSON.stringify(exportData), 'utf8');
  const stat = await fs.stat(filePath);
  return { filePath, fileSize: stat.size, method: 'json-export' };
}

export async function runBackup({ backupType = 'scheduled', userId = null, req = null } = {}) {
  const dir = await ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `sta-backup-${timestamp}.archive.gz`;

  const log = await BackupLog.create({
    fileName,
    filePath: path.join(dir, fileName),
    status: 'in_progress',
    backupType,
    triggeredBy: userId,
  });

  try {
    let result = await tryMongoDump(dir, fileName);
    if (!result) {
      result = await jsonExportFallback(dir, fileName);
      log.fileName = path.basename(result.filePath);
      log.filePath = result.filePath;
    }

    const checksum = await computeChecksum(result.filePath);

    const offsite = await syncOffsite(result.filePath);

    log.status = 'success';
    log.fileSize = result.fileSize;
    log.completedAt = new Date();
    log.checksum = checksum;
    log.offsitePath = offsite?.offsitePath || '';
    log.restoreNotes = `Backup created via ${result.method}.${offsite?.synced ? ' Offsite copy synced.' : ''}${offsite?.rsyncError ? ` Offsite rsync warning: ${offsite.rsyncError}` : ''} Download from admin panel or restore with deploy/scripts/restore-mongodb.sh`;
    await log.save();

    if (userId && req) {
      await logAudit({
        action: 'backup',
        module: 'backup',
        entityType: 'BackupLog',
        entityId: log._id,
        description: `${backupType} backup completed (${result.method})`,
        userId,
        req,
      });
    }

    return formatBackupLog(log.toObject());
  } catch (err) {
    log.status = 'failed';
    log.errorMessage = err.message;
    log.completedAt = new Date();
    await log.save();
    throw ApiError.internal(`Backup failed: ${err.message}`);
  }
}

export async function listBackups(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'startedAt');
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.backupType) filter.backupType = query.backupType;

  const [items, total] = await Promise.all([
    BackupLog.find(filter).populate('triggeredBy', 'name email').sort(sort).skip(skip).limit(limit).lean(),
    BackupLog.countDocuments(filter),
  ]);

  return {
    items: items.map(formatBackupLog),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getBackupById(id) {
  const doc = await BackupLog.findById(id).populate('triggeredBy', 'name email').lean();
  if (!doc) throw ApiError.notFound('Backup log not found');
  return formatBackupLog(doc);
}

export async function getBackupStrategy() {
  const directory = path.resolve(env.backup.dir);
  const offsiteEnabled = Boolean(env.backup.offsiteDir || env.backup.rsyncTarget);
  return {
    schedule: env.backup.cron,
    directory,
    methods: ['mongodump (preferred)', 'json-export (fallback)'],
    offsite: {
      enabled: offsiteEnabled,
      localDir: env.backup.offsiteDir || null,
      rsyncTarget: env.backup.rsyncTarget || null,
      note: offsiteEnabled
        ? 'Successful backups are copied offsite after creation.'
        : 'Set BACKUP_OFFSITE_DIR and/or BACKUP_RSYNC_TARGET in backend/.env to enable offsite sync.',
    },
    restore: {
      automated: false,
      downloadEnabled: true,
      note: 'Download a backup from the list, then run restore on the VPS using the generated runbook. Automated restore is disabled for safety.',
      scriptPath: 'deploy/scripts/restore-mongodb.sh',
    },
  };
}

export async function getBackupDownloadPath(id) {
  const doc = await BackupLog.findById(id);
  if (!doc) throw ApiError.notFound('Backup log not found');
  if (doc.status !== 'success') throw ApiError.badRequest('Only successful backups can be downloaded');

  const filePath = resolveBackupPath(doc.filePath);
  try {
    await fs.access(filePath);
  } catch {
    throw ApiError.notFound('Backup file not found on disk');
  }

  return { filePath, fileName: doc.fileName, checksum: doc.checksum };
}

export async function requestRestore(id, { note } = {}, userId, req) {
  const doc = await BackupLog.findById(id);
  if (!doc) throw ApiError.notFound('Backup log not found');
  if (doc.status !== 'success') throw ApiError.badRequest('Only successful backups can be restored');

  resolveBackupPath(doc.filePath);
  try {
    await fs.access(doc.filePath);
  } catch {
    throw ApiError.notFound('Backup file not found on disk');
  }

  const runbook = buildRestoreRunbook(doc);
  doc.restoreStatus = 'requested';
  doc.restoreRequestedAt = new Date();
  doc.restoreRequestedBy = userId;
  doc.restoreNotes = [
    doc.restoreNotes,
    note ? `Restore requested: ${note}` : 'Restore requested from admin panel.',
    `Runbook method: ${runbook.method}`,
  ].filter(Boolean).join('\n');
  await doc.save();

  await logAudit({
    action: 'restore',
    module: 'backup',
    entityType: 'BackupLog',
    entityId: doc._id,
    description: `Restore requested for backup ${doc.fileName}`,
    userId,
    req,
  });

  return {
    backup: formatBackupLog(doc.toObject()),
    runbook,
  };
}

export default {
  runBackup,
  listBackups,
  getBackupById,
  getBackupStrategy,
  getBackupDownloadPath,
  requestRestore,
};
