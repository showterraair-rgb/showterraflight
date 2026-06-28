import * as backupService from '../services/backup.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await backupService.listBackups(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await backupService.getBackupById(req.params.id);
  res.json({ success: true, data });
});

export const trigger = asyncHandler(async (req, res) => {
  const data = await backupService.runBackup({
    backupType: 'manual',
    userId: req.user.id,
    req,
  });
  res.status(201).json({ success: true, data, message: 'Backup completed' });
});

export const strategy = asyncHandler(async (_req, res) => {
  const data = await backupService.getBackupStrategy();
  res.json({ success: true, data });
});

export const download = asyncHandler(async (req, res) => {
  const { filePath, fileName } = await backupService.getBackupDownloadPath(req.params.id);
  res.download(filePath, fileName);
});

export const restoreRequest = asyncHandler(async (req, res) => {
  const data = await backupService.requestRestore(req.params.id, req.body, req.user.id, req);
  res.json({
    success: true,
    data,
    message: 'Restore runbook generated. Follow the steps on the server — automated restore is disabled.',
  });
});

export default { list, getById, trigger, strategy, download, restoreRequest };
