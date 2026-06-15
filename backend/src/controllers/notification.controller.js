import * as notificationSettingsService from '../services/notificationSettings.service.js';
import * as notificationTemplateService from '../services/notificationTemplate.service.js';
import {
  sendTestSms,
  sendTestEmail,
  listNotificationLogs,
  getSmsBalance,
} from '../services/notificationOrchestrator.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const getSmsSettings = asyncHandler(async (_req, res) => {
  const data = await notificationSettingsService.getSmsSettings();
  res.json({ success: true, data });
});

export const updateSmsSettings = asyncHandler(async (req, res) => {
  const data = await notificationSettingsService.updateSmsSettings(req.body, req.user.id, req);
  res.json({ success: true, data, message: 'SMS settings saved' });
});

export const testSms = asyncHandler(async (req, res) => {
  const result = await sendTestSms(req.body);
  if (!result.success) throw ApiError.badRequest(result.error || 'Test SMS failed');
  res.json({ success: true, data: result, message: 'Test SMS dispatched' });
});

export const smsBalance = asyncHandler(async (_req, res) => {
  const result = await getSmsBalance();
  if (!result.success) throw ApiError.badRequest(result.error || 'Could not fetch SMS balance');
  res.json({ success: true, data: result });
});

export const getEmailSettings = asyncHandler(async (_req, res) => {
  const data = await notificationSettingsService.getEmailSettings();
  res.json({ success: true, data });
});

export const updateEmailSettings = asyncHandler(async (req, res) => {
  const data = await notificationSettingsService.updateEmailSettings(req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Email settings saved' });
});

export const testEmail = asyncHandler(async (req, res) => {
  const result = await sendTestEmail(req.body);
  if (!result.success) throw ApiError.badRequest(result.error || 'Test email failed');
  res.json({ success: true, data: result, message: 'Test email dispatched' });
});

export const listTemplates = asyncHandler(async (_req, res) => {
  const data = await notificationTemplateService.listTemplates();
  res.json({ success: true, data });
});

export const getTemplate = asyncHandler(async (req, res) => {
  const data = await notificationTemplateService.getTemplateByKey(req.params.templateKey);
  res.json({ success: true, data });
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const data = await notificationTemplateService.updateTemplate(
    req.params.templateKey,
    req.body,
    req.user.id,
    req
  );
  res.json({ success: true, data, message: 'Template saved' });
});

export const listAutomationRules = asyncHandler(async (_req, res) => {
  const data = await notificationTemplateService.listAutomationRules();
  res.json({ success: true, data });
});

export const updateAutomationRule = asyncHandler(async (req, res) => {
  const data = await notificationTemplateService.updateAutomationRule(
    req.params.eventType,
    req.body,
    req.user.id,
    req
  );
  res.json({ success: true, data, message: 'Automation rule saved' });
});

export const listLogs = asyncHandler(async (req, res) => {
  const data = await listNotificationLogs(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export default {
  getSmsSettings,
  updateSmsSettings,
  testSms,
  smsBalance,
  getEmailSettings,
  updateEmailSettings,
  testEmail,
  listTemplates,
  getTemplate,
  updateTemplate,
  listAutomationRules,
  updateAutomationRule,
  listLogs,
};
