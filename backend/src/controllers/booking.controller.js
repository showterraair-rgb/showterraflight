import * as bookingService from '../services/booking.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await bookingService.listBookings(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await bookingService.getBookingById(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await bookingService.createBooking(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Booking created' });
});

export const createFromOrder = asyncHandler(async (req, res) => {
  const data = await bookingService.createBookingFromOrder(
    req.params.orderId,
    req.body,
    req.user.id,
    req
  );
  res.status(201).json({ success: true, data, message: 'Booking created from order' });
});

export const update = asyncHandler(async (req, res) => {
  const data = await bookingService.updateBooking(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Booking updated' });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const data = await bookingService.updateBookingStatus(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Booking status updated' });
});

export const addNote = asyncHandler(async (req, res) => {
  const data = await bookingService.addBookingNote(req.params.id, req.body.note, req.user.id, req);
  res.json({ success: true, data, message: 'Note added' });
});

export const getTimeline = asyncHandler(async (req, res) => {
  const data = await bookingService.getBookingTimeline(req.params.id);
  res.json({ success: true, data });
});

export default {
  list,
  getById,
  create,
  createFromOrder,
  update,
  updateStatus,
  addNote,
  getTimeline,
};
