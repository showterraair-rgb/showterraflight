import * as reminderService from '../services/reminder.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await reminderService.listReminders(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await reminderService.getReminderById(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await reminderService.createManualReminder(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Reminder created' });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const data = await reminderService.updateReminderStatus(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Reminder updated' });
});

export const runGenerators = asyncHandler(async (_req, res) => {
  const data = await reminderService.runAllGenerators();
  res.json({ success: true, data, message: 'Reminder generators executed' });
});

export const sendPending = asyncHandler(async (_req, res) => {
  const data = await reminderService.sendPendingReminders();
  res.json({ success: true, data, message: 'Pending reminders processed' });
});

export default { list, getById, create, updateStatus, runGenerators, sendPending };
