import * as cmsService from '../services/cms.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listPages = asyncHandler(async (_req, res) => {
  const data = await cmsService.listPages();
  res.json({ success: true, data });
});

export const getPage = asyncHandler(async (req, res) => {
  const data = await cmsService.getPageByKey(req.params.pageKey);
  res.json({ success: true, data });
});

export const updatePage = asyncHandler(async (req, res) => {
  const data = await cmsService.updatePage(req.params.pageKey, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Page updated' });
});

export const listNotices = asyncHandler(async (req, res) => {
  const data = await cmsService.listNotices(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const getNotice = asyncHandler(async (req, res) => {
  const data = await cmsService.getNoticeById(req.params.id);
  res.json({ success: true, data });
});

export const createNotice = asyncHandler(async (req, res) => {
  const data = await cmsService.createNotice(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Notice created' });
});

export const updateNotice = asyncHandler(async (req, res) => {
  const data = await cmsService.updateNotice(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Notice updated' });
});

export const deleteNotice = asyncHandler(async (req, res) => {
  const data = await cmsService.deleteNotice(req.params.id, req.user.id, req);
  res.json({ success: true, data });
});

export const getSettings = asyncHandler(async (_req, res) => {
  const data = await cmsService.getCompanySettings();
  res.json({ success: true, data });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const data = await cmsService.updateCompanySettings(req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Settings updated' });
});

export const updateLogo = asyncHandler(async (req, res) => {
  const data = await cmsService.updateLogo(req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Logo updated' });
});

export default {
  listPages,
  getPage,
  updatePage,
  listNotices,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
  getSettings,
  updateSettings,
  updateLogo,
};
