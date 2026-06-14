import * as securityService from '../services/security.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const loginLogs = asyncHandler(async (req, res) => {
  const data = await securityService.listLoginLogs(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const auditLogs = asyncHandler(async (req, res) => {
  const data = await securityService.listAuditLogs(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const overview = asyncHandler(async (_req, res) => {
  const data = await securityService.getSecurityOverview();
  res.json({ success: true, data });
});

export const getSettings = asyncHandler(async (_req, res) => {
  const data = await securityService.getSettings();
  res.json({ success: true, data });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const data = await securityService.updateSettings(req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Security settings updated' });
});

export const prepareMfa = asyncHandler(async (req, res) => {
  const data = await securityService.prepareMfa(req.user.id);
  res.json({ success: true, data });
});

export default { loginLogs, auditLogs, overview, getSettings, updateSettings, prepareMfa };
