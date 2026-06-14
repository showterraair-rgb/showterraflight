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

    log.status = 'success';
    log.fileSize = result.fileSize;
    log.completedAt = new Date();
    log.checksum = checksum;
    log.restoreNotes = `Backup created via ${result.method}. Restore manually using mongorestore or JSON import. Offsite sync not configured.`;
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
  return {
    schedule: env.backup.cron,
    directory: path.resolve(env.backup.dir),
    methods: ['mongodump (preferred)', 'json-export (fallback)'],
    offsite: {
      enabled: false,
      note: 'Offsite sync placeholder — configure S3/FTP in Phase 6 deployment.',
    },
    restore: {
      automated: false,
      note: 'Restore is manual-only. Use mongorestore or admin-guided JSON import.',
    },
  };
}

export default { runBackup, listBackups, getBackupById, getBackupStrategy };
