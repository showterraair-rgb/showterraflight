import * as customerService from '../services/customer.service.js';
import * as bookingReminderService from '../services/bookingReminder.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await customerService.listCustomers(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await customerService.getCustomerById(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await customerService.createCustomer(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Customer created' });
});

export const update = asyncHandler(async (req, res) => {
  const data = await customerService.updateCustomer(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Customer updated' });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await customerService.deleteCustomer(req.params.id, req.user.id, req);
  res.json({ success: true, data, message: data.message });
});

export const getAccount = asyncHandler(async (req, res) => {
  const data = await bookingReminderService.getCustomerAccountStatement(req.params.id);
  res.json({ success: true, data });
});

export const remindBooking = asyncHandler(async (req, res) => {
  const result = await bookingReminderService.sendCustomerBookingReminder(
    req.params.id,
    req.params.bookingId,
    req.body.channels
  );
  if (result.error || result.skipped || !result.sent) {
    const failed = result.results?.find((r) => !r.success);
    return res.status(400).json({
      success: false,
      message: result.reason || result.error || failed?.error || 'Reminder could not be sent',
      data: result,
    });
  }
  res.json({ success: true, data: result, message: 'Reminder sent' });
});

export default { list, getById, create, update, remove, getAccount, remindBooking };
