import * as adminAgentService from '../services/adminAgent.service.js';
import * as agentBookingService from '../services/agentBooking.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req, res) => {
  const data = await adminAgentService.createAgent(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Agent created' });
});

export const list = asyncHandler(async (req, res) => {
  const result = await adminAgentService.listAgents(req.query);
  res.json({ success: true, data: result.items, pagination: result.pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await adminAgentService.getAgentById(req.params.id);
  res.json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await adminAgentService.updateAgent(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Agent updated' });
});

export const toggle = asyncHandler(async (req, res) => {
  const data = await adminAgentService.toggleAgent(req.params.id, req.user.id, req);
  res.json({ success: true, data, message: 'Agent status updated' });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await adminAgentService.deleteAgent(req.params.id, req.user.id, req);
  res.json({ success: true, data, message: data.message });
});

export const agentBookings = asyncHandler(async (req, res) => {
  const result = await agentBookingService.listAgentBookings(req.params.id, req.query);
  res.json({ success: true, data: result.items, pagination: result.pagination });
});

export const listAllBookings = asyncHandler(async (req, res) => {
  const result = await agentBookingService.listAllAgentBookings(req.query);
  res.json({ success: true, data: result.items, pagination: result.pagination });
});

export const getBooking = asyncHandler(async (req, res) => {
  const data = await agentBookingService.getAgentBookingById(req.params.id);
  res.json({ success: true, data });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const data = await agentBookingService.updateAgentBookingStatus(req.params.id, req.body, req.user.id);
  res.json({ success: true, data, message: 'Booking status updated' });
});

export const uploadTicket = asyncHandler(async (req, res) => {
  const data = await agentBookingService.uploadAgentBookingTicket(req.params.id, req.file, req.user.id);
  res.json({ success: true, data, message: 'Ticket uploaded' });
});

export const addBookingNote = asyncHandler(async (req, res) => {
  const data = await agentBookingService.addAgentBookingNote(req.params.id, req.body.note, req.user.id);
  res.json({ success: true, data, message: 'Note added' });
});

export const downloadBookingPdf = asyncHandler(async (req, res) => {
  const { generateAgentBookingPdf } = await import('../services/pdf.service.js');
  const { buffer, filename } = await generateAgentBookingPdf(req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

export const getLedger = asyncHandler(async (req, res) => {
  const data = await adminAgentService.getAgentLedger(req.params.agentId, req.query);
  res.json({ success: true, data: data.items, agent: data.agent, pagination: data.pagination });
});

export const addTransaction = asyncHandler(async (req, res) => {
  const data = await adminAgentService.addAgentTransaction(req.params.agentId, req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Transaction recorded' });
});

export default {
  create,
  list,
  getById,
  update,
  toggle,
  remove,
  agentBookings,
  listAllBookings,
  getBooking,
  updateBookingStatus,
  uploadTicket,
  addBookingNote,
  downloadBookingPdf,
  getLedger,
  addTransaction,
};
