import LiveStream from '../models/LiveStream.js';
import ApiError from '../utils/ApiError.js';
import { parsePaginationQuery, buildPaginationResponse } from '../utils/pagination.js';
import { deriveEmbedUrl } from '../utils/liveStreamEmbed.js';
import { logAudit } from './audit.service.js';

function formatStream(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description || '',
    platform: doc.platform,
    streamUrl: doc.streamUrl || '',
    embedUrl: doc.embedUrl || '',
    thumbnailUrl: doc.thumbnailUrl || '',
    status: doc.status,
    scheduledAt: doc.scheduledAt || null,
    startedAt: doc.startedAt || null,
    endedAt: doc.endedAt || null,
    isPublished: Boolean(doc.isPublished),
    isFeatured: Boolean(doc.isFeatured),
    showOnHomepage: Boolean(doc.showOnHomepage),
    chatEnabled: doc.chatEnabled !== false,
    sortOrder: doc.sortOrder ?? 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function normalizePayload(data = {}) {
  const payload = { ...data };
  if (payload.scheduledAt === '' || payload.scheduledAt === null) {
    payload.scheduledAt = undefined;
  } else if (payload.scheduledAt) {
    payload.scheduledAt = new Date(payload.scheduledAt);
  }
  const platform = payload.platform;
  const streamUrl = payload.streamUrl;
  const embedUrl = payload.embedUrl;
  if (platform !== undefined || streamUrl !== undefined || embedUrl !== undefined) {
    payload.embedUrl = deriveEmbedUrl(
      platform || 'youtube',
      streamUrl ?? '',
      embedUrl ?? ''
    );
  }
  return payload;
}

async function clearOtherFeatured(exceptId) {
  const filter = exceptId ? { _id: { $ne: exceptId }, isFeatured: true } : { isFeatured: true };
  await LiveStream.updateMany(filter, { $set: { isFeatured: false } });
}

async function endOtherLive(exceptId) {
  const filter = exceptId
    ? { _id: { $ne: exceptId }, status: 'live' }
    : { status: 'live' };
  await LiveStream.updateMany(filter, {
    $set: { status: 'ended', endedAt: new Date() },
  });
}

export async function getSummary() {
  const [draft, scheduled, live, ended, published] = await Promise.all([
    LiveStream.countDocuments({ status: 'draft' }),
    LiveStream.countDocuments({ status: 'scheduled' }),
    LiveStream.countDocuments({ status: 'live' }),
    LiveStream.countDocuments({ status: 'ended' }),
    LiveStream.countDocuments({ isPublished: true }),
  ]);
  return { draft, scheduled, live, ended, published, total: draft + scheduled + live + ended };
}

export async function listStreams(query = {}) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'createdAt');
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.platform) filter.platform = query.platform;
  if (query.isPublished === 'true') filter.isPublished = true;
  if (query.isPublished === 'false') filter.isPublished = false;
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    LiveStream.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    LiveStream.countDocuments(filter),
  ]);

  return {
    items: items.map(formatStream),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getStreamById(id) {
  const doc = await LiveStream.findById(id).lean();
  if (!doc) throw ApiError.notFound('Live stream not found');
  return formatStream(doc);
}

export async function createStream(data, userId, req) {
  const payload = normalizePayload(data);
  if (payload.status === 'live') {
    await endOtherLive(null);
    payload.startedAt = payload.startedAt || new Date();
  }
  if (payload.isFeatured) {
    await clearOtherFeatured(null);
  }

  const doc = await LiveStream.create({
    ...payload,
    createdBy: userId,
    updatedBy: userId,
  });

  await logAudit({
    action: 'create',
    module: 'livestream',
    entityType: 'LiveStream',
    entityId: doc._id,
    description: `Live stream created: ${doc.title}`,
    userId,
    req,
  });

  return formatStream(doc.toObject());
}

export async function updateStream(id, data, userId, req) {
  const existing = await LiveStream.findById(id);
  if (!existing) throw ApiError.notFound('Live stream not found');

  const payload = normalizePayload({
    ...data,
    platform: data.platform ?? existing.platform,
    streamUrl: data.streamUrl !== undefined ? data.streamUrl : existing.streamUrl,
    embedUrl: data.embedUrl !== undefined ? data.embedUrl : existing.embedUrl,
  });

  if (payload.status === 'live' && existing.status !== 'live') {
    await endOtherLive(id);
    payload.startedAt = new Date();
    payload.endedAt = null;
  }
  if (payload.status === 'ended' && existing.status !== 'ended') {
    payload.endedAt = new Date();
  }
  if (payload.isFeatured) {
    await clearOtherFeatured(id);
  }

  Object.assign(existing, payload, { updatedBy: userId });
  await existing.save();

  await logAudit({
    action: 'update',
    module: 'livestream',
    entityType: 'LiveStream',
    entityId: id,
    description: `Live stream updated: ${existing.title}`,
    userId,
    req,
  });

  return formatStream(existing.toObject());
}

export async function deleteStream(id, userId, req) {
  const doc = await LiveStream.findByIdAndDelete(id);
  if (!doc) throw ApiError.notFound('Live stream not found');

  await logAudit({
    action: 'delete',
    module: 'livestream',
    entityType: 'LiveStream',
    entityId: id,
    description: `Live stream deleted: ${doc.title}`,
    userId,
    req,
  });

  return { message: 'Live stream deleted' };
}

export async function goLive(id, userId, req) {
  const doc = await LiveStream.findById(id);
  if (!doc) throw ApiError.notFound('Live stream not found');
  if (!doc.streamUrl && !doc.embedUrl) {
    throw ApiError.badRequest('Add a stream or embed URL before going live');
  }

  await endOtherLive(id);
  doc.status = 'live';
  doc.startedAt = new Date();
  doc.endedAt = undefined;
  doc.isPublished = true;
  doc.isFeatured = true;
  doc.embedUrl = deriveEmbedUrl(doc.platform, doc.streamUrl, doc.embedUrl);
  doc.updatedBy = userId;
  await clearOtherFeatured(id);
  await doc.save();

  await logAudit({
    action: 'update',
    module: 'livestream',
    entityType: 'LiveStream',
    entityId: id,
    description: `Live stream went live: ${doc.title}`,
    userId,
    req,
  });

  return formatStream(doc.toObject());
}

export async function endStream(id, userId, req) {
  const doc = await LiveStream.findById(id);
  if (!doc) throw ApiError.notFound('Live stream not found');
  if (doc.status !== 'live') {
    throw ApiError.badRequest('Stream is not currently live');
  }

  doc.status = 'ended';
  doc.endedAt = new Date();
  doc.updatedBy = userId;
  await doc.save();

  await logAudit({
    action: 'update',
    module: 'livestream',
    entityType: 'LiveStream',
    entityId: id,
    description: `Live stream ended: ${doc.title}`,
    userId,
    req,
  });

  return formatStream(doc.toObject());
}

/** Public: current live + upcoming + recent ended */
export async function getPublicFeed() {
  const [live, upcoming, recent, homepage] = await Promise.all([
    LiveStream.findOne({ status: 'live', isPublished: true })
      .sort({ isFeatured: -1, startedAt: -1 })
      .lean(),
    LiveStream.find({
      status: 'scheduled',
      isPublished: true,
      $or: [
        { scheduledAt: { $gte: new Date() } },
        { scheduledAt: null },
      ],
    })
      .sort({ scheduledAt: 1, sortOrder: 1 })
      .limit(10)
      .lean(),
    LiveStream.find({ status: 'ended', isPublished: true })
      .sort({ endedAt: -1 })
      .limit(6)
      .lean(),
    LiveStream.findOne({
      showOnHomepage: true,
      isPublished: true,
      status: { $in: ['live', 'scheduled'] },
    })
      .sort({ status: 1, isFeatured: -1 })
      .lean(),
  ]);

  return {
    live: formatStream(live),
    upcoming: upcoming.map(formatStream),
    recent: recent.map(formatStream),
    homepage: formatStream(homepage) || formatStream(live),
  };
}

export default {
  getSummary,
  listStreams,
  getStreamById,
  createStream,
  updateStream,
  deleteStream,
  goLive,
  endStream,
  getPublicFeed,
};
