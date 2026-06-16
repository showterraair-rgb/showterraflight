import * as agentAuthService from '../services/agentAuth.service.js';
import * as agentBookingService from '../services/agentBooking.service.js';
import * as agentReportService from '../services/agentReport.service.js';
import * as agentNotificationService from '../services/agentNotification.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import env from '../config/env.js';

export const login = asyncHandler(async (req, res) => {
  const result = await agentAuthService.agentLogin(req.body);
  res.cookie(env.jwt.agentCookieName, result.token, result.cookieOptions);
  res.json({ success: true, data: result.agent, message: 'Login successful' });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(env.jwt.agentCookieName, { path: '/' });
  res.json({ success: true, message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  const data = await agentAuthService.getAgentProfile(req.agent.id);
  res.json({ success: true, data });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const data = await agentAuthService.agentForgotPassword(req.body.email);
  res.json({ success: true, data, message: data.message });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const data = await agentAuthService.agentResetPassword(req.body);
  res.json({ success: true, data, message: data.message });
});

export const getProfile = asyncHandler(async (req, res) => {
  const data = await agentAuthService.getAgentProfile(req.agent.id);
  res.json({ success: true, data });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = await agentAuthService.updateAgentProfile(req.agent.id, req.body);
  res.json({ success: true, data, message: 'Profile updated' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const data = await agentAuthService.changeAgentPassword(req.agent.id, req.body);
  res.json({ success: true, data, message: data.message });
});

export const dashboard = asyncHandler(async (req, res) => {
  const data = await agentBookingService.getAgentDashboardStats(req.agent.id);
  res.json({ success: true, data });
});

export const createBooking = asyncHandler(async (req, res) => {
  const data = await agentBookingService.createAgentBooking(req.agent.id, req.body, req.file);
  res.status(201).json({ success: true, data, message: 'Ticket request submitted' });
});

export const listBookings = asyncHandler(async (req, res) => {
  const result = await agentBookingService.listAgentBookings(req.agent.id, req.query);
  res.json({ success: true, data: result.items, pagination: result.pagination });
});

export const getBooking = asyncHandler(async (req, res) => {
  const data = await agentBookingService.getAgentBookingById(req.params.id, req.agent.id);
  res.json({ success: true, data });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const data = await agentBookingService.cancelAgentBooking(req.params.id, req.agent.id);
  res.json({ success: true, data, message: 'Booking cancelled' });
});

export const downloadBookingPdf = asyncHandler(async (req, res) => {
  const { generateAgentBookingPdf } = await import('../services/pdf.service.js');
  const { buffer, filename } = await generateAgentBookingPdf(req.params.id, req.agent.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

export const exportReportPdf = asyncHandler(async (req, res) => {
  const { generateAgentReportPdf } = await import('../services/pdf.service.js');
  const { buffer, filename } = await generateAgentReportPdf(req.agent.id, req.query);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

export const reportSummary = asyncHandler(async (req, res) => {
  const data = await agentReportService.getAgentReportSummary(req.agent.id, req.query);
  res.json({ success: true, data });
});

export const reportMonthly = asyncHandler(async (req, res) => {
  const data = await agentReportService.getAgentMonthlyReport(req.agent.id, req.query);
  res.json({ success: true, data });
});

export const reportAirlines = asyncHandler(async (req, res) => {
  const data = await agentReportService.getAgentAirlineReport(req.agent.id, req.query);
  res.json({ success: true, data });
});

export const statement = asyncHandler(async (req, res) => {
  const data = await agentNotificationService.getAgentStatement(req.agent.id, req.query);
  res.json({ success: true, data: data.items, agent: data.agent, pagination: data.pagination });
});

export const listNotifications = asyncHandler(async (req, res) => {
  const result = await agentNotificationService.listAgentNotifications(req.agent.id, req.query);
  res.json({ success: true, data: result.items, unreadCount: result.unreadCount, pagination: result.pagination });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const data = await agentNotificationService.markNotificationRead(req.agent.id, req.params.id);
  res.json({ success: true, data });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const data = await agentNotificationService.markAllNotificationsRead(req.agent.id);
  res.json({ success: true, data, message: data.message });
});

export default {
  login,
  logout,
  forgotPassword,
  resetPassword,
  me,
  getProfile,
  updateProfile,
  changePassword,
  dashboard,
  createBooking,
  listBookings,
  getBooking,
  cancelBooking,
  downloadBookingPdf,
  exportReportPdf,
  reportSummary,
  reportMonthly,
  reportAirlines,
  statement,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
