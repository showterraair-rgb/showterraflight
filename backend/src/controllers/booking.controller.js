import * as bookingService from '../services/booking.service.js';
import * as bookingOperationService from '../services/bookingOperation.service.js';
import * as bulkImportService from '../services/bulkImport.service.js';
import * as bookingReminderService from '../services/bookingReminder.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import fs from 'fs';

export const list = asyncHandler(async (req, res) => {
  const data = await bookingService.listBookings(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const summary = asyncHandler(async (req, res) => {
  const data = await bookingService.getBookingsSummary(req.query);
  res.json({ success: true, data });
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

export const voidBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.voidBooking(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Booking voided' });
});

export const refundBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.refundBooking(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Booking refunded' });
});

export const requestRefundBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.requestRefundBooking(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Refund request submitted' });
});

export const reissueBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.reissueBooking(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Booking reissued' });
});

export const addNote = asyncHandler(async (req, res) => {
  const data = await bookingService.addBookingNote(req.params.id, req.body.note, req.user.id, req);
  res.json({ success: true, data, message: 'Note added' });
});

export const getTimeline = asyncHandler(async (req, res) => {
  const data = await bookingService.getBookingTimeline(req.params.id);
  res.json({ success: true, data });
});

export const getOperations = asyncHandler(async (req, res) => {
  const result = await bookingOperationService.listBookingOperations(req.params.id);
  res.json({ success: true, data: result.items, bookingNumber: result.bookingNumber });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await bookingService.deleteBooking(req.params.id, req.user.id, req);
  res.json({ success: true, data, message: data.message });
});

export const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const { generateBookingInvoicePdf } = await import('../services/pdf.service.js');
  const { buffer, filename } = await generateBookingInvoicePdf(req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

export const downloadETicketPdf = asyncHandler(async (req, res) => {
  const { generateBookingETicketPdf } = await import('../services/pdf.service.js');
  const { buffer, filename } = await generateBookingETicketPdf(req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

export const updateApproval = asyncHandler(async (req, res) => {
  const data = await bookingService.updateBookingApproval(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Approval status updated' });
});

export const uploadPassport = asyncHandler(async (req, res) => {
  const data = await bookingService.uploadBookingPassport(req.params.id, req.file, req.user.id, req);
  res.json({ success: true, data, message: 'Passport uploaded' });
});

export const uploadTicketCopy = asyncHandler(async (req, res) => {
  const data = await bookingService.uploadBookingTicketCopyWithExtract(req.params.id, req.file, req.user.id, req);
  res.json({ success: true, data, message: 'Ticket copy uploaded' });
});

export const extractTicket = asyncHandler(async (req, res) => {
  try {
    const data = await bookingService.extractTicketData(req.file);
    res.json({ success: true, data, message: 'Ticket data extracted — verify before saving' });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

export const upcoming = asyncHandler(async (req, res) => {
  const data = await bookingService.listUpcomingFlights(req.query);
  res.json({ success: true, data });
});

export const bulkImportCsvTemplate = asyncHandler(async (_req, res) => {
  const csv = bulkImportService.csvTemplateContent();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="booking-import-template.csv"');
  res.send(csv);
});

export const bulkImportCsvPreview = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    return res.status(400).json({ success: false, message: 'CSV file required' });
  }
  const data = await bulkImportService.previewCsvImport(req.file.buffer);
  res.json({ success: true, data });
});

export const bulkImportExecute = asyncHandler(async (req, res) => {
  const data = await bulkImportService.executeBulkImport(req.body.rows, req.user.id, req);
  res.json({
    success: true,
    data,
    message: `Imported ${data.created} booking(s)${data.failed ? `, ${data.failed} failed` : ''}`,
  });
});

export const bulkImportTickets = asyncHandler(async (req, res) => {
  const data = await bulkImportService.bulkExtractTickets(req.files);
  res.json({ success: true, data, message: `Processed ${data.total} ticket PDF(s)` });
});

export const scheduleChange = asyncHandler(async (req, res) => {
  const data = await bookingService.recordScheduleChange(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Schedule change recorded' });
});

export const scheduleChangeWithTicket = asyncHandler(async (req, res) => {
  const ticketCopyPath = req.file ? `tickets/${req.file.filename}` : undefined;
  const ticketCopyFileName = req.file?.originalname;
  let extracted = null;
  if (req.file) {
    extracted = await bookingService.extractTicketData(req.file);
  }
  const data = await bookingService.recordScheduleChange(
    req.params.id,
    {
      ...req.body,
      ...extracted,
      ticketCopyPath,
      ticketCopyFileName,
      note: req.body.note || 'Schedule changed with new ticket',
    },
    req.user.id,
    req
  );
  res.json({ success: true, data, extracted, message: 'Schedule change recorded with new ticket' });
});

export const remind = asyncHandler(async (req, res) => {
  const result = await bookingReminderService.sendBookingReminder(
    req.params.id,
    req.body.channels,
    req.body.target || 'customer'
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

export default {
  list,
  getById,
  create,
  createFromOrder,
  update,
  updateStatus,
  voidBooking,
  requestRefundBooking,
  refundBooking,
  reissueBooking,
  updateApproval,
  uploadPassport,
  uploadTicketCopy,
  extractTicket,
  upcoming,
  bulkImportCsvTemplate,
  bulkImportCsvPreview,
  bulkImportExecute,
  bulkImportTickets,
  scheduleChange,
  scheduleChangeWithTicket,
  remind,
  addNote,
  getTimeline,
  getOperations,
  remove,
  downloadInvoicePdf,
  downloadETicketPdf,
};
