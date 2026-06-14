import * as dashboardService from '../services/dashboard.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardSummary(req.user);

  res.json({ success: true, data });
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const data = await dashboardService.getRecentActivity();

  res.json({ success: true, data });
});

export const getAlerts = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardAlerts();

  res.json({ success: true, data });
});

export default { getSummary, getRecentActivity, getAlerts };
