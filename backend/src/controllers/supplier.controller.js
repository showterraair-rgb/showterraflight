import * as supplierService from '../services/supplier.service.js';
import * as bookingReminderService from '../services/bookingReminder.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await supplierService.listSuppliers(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await supplierService.getSupplierById(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await supplierService.createSupplier(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Supplier created' });
});

export const update = asyncHandler(async (req, res) => {
  const data = await supplierService.updateSupplier(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Supplier updated' });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await supplierService.deleteSupplier(req.params.id, req.user.id, req);
  res.json({ success: true, data, message: data.message });
});

export const getAccount = asyncHandler(async (req, res) => {
  const data = await bookingReminderService.getSupplierAccountStatement(req.params.id);
  res.json({ success: true, data });
});

export const remindBooking = asyncHandler(async (req, res) => {
  const result = await bookingReminderService.sendSupplierBookingReminder(
    req.params.id,
    req.params.bookingId,
    req.body.channels
  );
  if (!result.ok) {
    return res.status(400).json({
      success: false,
      message: result.message,
      data: result.data,
    });
  }
  res.json({ success: true, data: result.data, message: result.message });
});

export default { list, getById, create, update, remove, getAccount, remindBooking };
