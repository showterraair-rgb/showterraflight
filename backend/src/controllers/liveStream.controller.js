import * as liveStreamService from '../services/liveStream.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const summary = asyncHandler(async (_req, res) => {
  const data = await liveStreamService.getSummary();
  res.json({ success: true, data });
});

export const list = asyncHandler(async (req, res) => {
  const data = await liveStreamService.listStreams(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await liveStreamService.getStreamById(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await liveStreamService.createStream(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Live stream created' });
});

export const update = asyncHandler(async (req, res) => {
  const data = await liveStreamService.updateStream(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Live stream updated' });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await liveStreamService.deleteStream(req.params.id, req.user.id, req);
  res.json({ success: true, data });
});

export const goLive = asyncHandler(async (req, res) => {
  const data = await liveStreamService.goLive(req.params.id, req.user.id, req);
  res.json({ success: true, data, message: 'Stream is now live' });
});

export const end = asyncHandler(async (req, res) => {
  const data = await liveStreamService.endStream(req.params.id, req.user.id, req);
  res.json({ success: true, data, message: 'Stream ended' });
});

export const publicFeed = asyncHandler(async (_req, res) => {
  const data = await liveStreamService.getPublicFeed();
  res.json({ success: true, data });
});

export default {
  summary,
  list,
  getById,
  create,
  update,
  remove,
  goLive,
  end,
  publicFeed,
};
