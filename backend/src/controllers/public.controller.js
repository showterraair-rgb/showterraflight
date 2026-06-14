import * as publicService from '../services/public.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getCompanySettings = asyncHandler(async (_req, res) => {
  const data = await publicService.getCompanySettings();

  res.json({ success: true, data });
});

export const getCmsPage = asyncHandler(async (req, res) => {
  const data = await publicService.getCmsPage(req.params.pageKey);

  res.json({ success: true, data });
});

export const getNotices = asyncHandler(async (req, res) => {
  const data = await publicService.getPublishedNotices({ type: req.query.type });

  res.json({ success: true, data });
});

export const createBookingRequest = asyncHandler(async (req, res) => {
  const data = await publicService.createBookingRequest(req.body);

  res.status(201).json({
    success: true,
    data,
    message: data.message,
  });
});

export default {
  getCompanySettings,
  getCmsPage,
  getNotices,
  createBookingRequest,
};
