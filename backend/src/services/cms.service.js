import CmsPage from '../models/CmsPage.js';
import CmsNotice from '../models/CmsNotice.js';
import Setting from '../models/Setting.js';
import ApiError from '../utils/ApiError.js';
import { CMS_PAGE_KEYS } from '../config/constants.js';
import { parsePaginationQuery, buildPaginationResponse } from '../utils/pagination.js';
import { logAudit } from './audit.service.js';

function formatPage(doc) {
  return {
    id: doc._id.toString(),
    pageKey: doc.pageKey,
    title: doc.title,
    slug: doc.slug,
    content: doc.content || {},
    sections: doc.sections || [],
    isPublished: doc.isPublished,
    seo: doc.seo || {},
    updatedAt: doc.updatedAt,
  };
}

function formatNotice(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    content: doc.content,
    type: doc.type,
    isPublished: doc.isPublished,
    isPinned: doc.isPinned,
    publishDate: doc.publishDate,
    expireDate: doc.expireDate,
    sortOrder: doc.sortOrder,
    updatedAt: doc.updatedAt,
  };
}

export async function listPages() {
  const pages = await CmsPage.find().sort({ pageKey: 1 }).lean();
  return pages.map(formatPage);
}

export async function getPageByKey(pageKey) {
  const page = await CmsPage.findOne({ pageKey }).lean();
  if (!page) throw ApiError.notFound(`CMS page "${pageKey}" not found`);
  return formatPage(page);
}

export async function updatePage(pageKey, data, userId, req) {
  if (!CMS_PAGE_KEYS.includes(pageKey)) {
    throw ApiError.badRequest('Invalid page key');
  }

  const update = {
    title: data.title,
    slug: data.slug,
    content: data.content,
    sections: data.sections,
    isPublished: data.isPublished,
    seo: data.seo,
    updatedBy: userId,
  };

  const page = await CmsPage.findOneAndUpdate({ pageKey }, update, { new: true, upsert: true, runValidators: true }).lean();

  await logAudit({
    action: 'update',
    module: 'cms',
    entityType: 'CmsPage',
    entityId: page._id,
    description: `CMS page updated: ${pageKey}`,
    userId,
    req,
  });

  return formatPage(page);
}

export async function listNotices(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'publishDate');
  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.isPublished !== undefined) filter.isPublished = query.isPublished === 'true';

  const [items, total] = await Promise.all([
    CmsNotice.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    CmsNotice.countDocuments(filter),
  ]);

  return {
    items: items.map(formatNotice),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getNoticeById(id) {
  const notice = await CmsNotice.findById(id).lean();
  if (!notice) throw ApiError.notFound('Notice not found');
  return formatNotice(notice);
}

export async function createNotice(data, userId, req) {
  const notice = await CmsNotice.create({
    ...data,
    updatedBy: userId,
  });

  await logAudit({
    action: 'create',
    module: 'cms',
    entityType: 'CmsNotice',
    entityId: notice._id,
    description: `CMS notice created: ${data.title}`,
    userId,
    req,
  });

  return formatNotice(notice.toObject());
}

export async function updateNotice(id, data, userId, req) {
  const notice = await CmsNotice.findByIdAndUpdate(
    id,
    { ...data, updatedBy: userId },
    { new: true, runValidators: true }
  ).lean();

  if (!notice) throw ApiError.notFound('Notice not found');

  await logAudit({
    action: 'update',
    module: 'cms',
    entityType: 'CmsNotice',
    entityId: notice._id,
    description: `CMS notice updated: ${notice.title}`,
    userId,
    req,
  });

  return formatNotice(notice);
}

export async function deleteNotice(id, userId, req) {
  const notice = await CmsNotice.findByIdAndDelete(id);
  if (!notice) throw ApiError.notFound('Notice not found');

  await logAudit({
    action: 'delete',
    module: 'cms',
    entityType: 'CmsNotice',
    entityId: id,
    description: `CMS notice deleted: ${notice.title}`,
    userId,
    req,
  });

  return { message: 'Notice deleted' };
}

export async function getCompanySettings() {
  let setting = await Setting.findOne({ key: 'company' }).lean();
  if (!setting) {
    setting = (await Setting.create({ key: 'company' })).toObject();
  }
  return {
    company: setting.company,
    logo: setting.logo || {},
    socialLinks: setting.socialLinks || {},
    paymentDetails: setting.paymentDetails || {},
    orderNumberPrefix: setting.orderNumberPrefix,
    bookingNumberPrefix: setting.bookingNumberPrefix,
    invoicePrefix: setting.invoicePrefix,
  };
}

export async function updateCompanySettings(data, userId, req) {
  const update = { updatedBy: userId };
  if (data.company) update.company = data.company;
  if (data.socialLinks) update.socialLinks = data.socialLinks;
  if (data.logo) update.logo = data.logo;
  if (data.paymentDetails) update.paymentDetails = data.paymentDetails;

  const setting = await Setting.findOneAndUpdate(
    { key: 'company' },
    update,
    { new: true, upsert: true }
  ).lean();

  await logAudit({
    action: 'update',
    module: 'cms',
    entityType: 'Setting',
    description: 'Company/contact CMS settings updated',
    userId,
    req,
  });

  return {
    company: setting.company,
    logo: setting.logo || {},
    socialLinks: setting.socialLinks || {},
    paymentDetails: setting.paymentDetails || {},
  };
}

export async function updateLogo({ filePath, fileName, altText }, userId, req) {
  const setting = await Setting.findOneAndUpdate(
    { key: 'company' },
    {
      logo: { filePath, fileName, altText: altText || 'Show Terra Air' },
      updatedBy: userId,
    },
    { new: true, upsert: true }
  ).lean();

  await logAudit({
    action: 'update',
    module: 'cms',
    entityType: 'Setting',
    description: 'Logo path updated',
    userId,
    req,
  });

  return setting.logo;
}

export async function restoreHomeDefaults(userId, req) {
  const { seedHomeMedia } = await import('../seeds/seedHomeMedia.js');
  const { buildFullHomeSeedContent } = await import('../config/fullHomeSeedContent.js');
  seedHomeMedia();
  return updatePage('home', {
    title: 'Home',
    slug: 'home',
    isPublished: true,
    content: buildFullHomeSeedContent(),
  }, userId, req);
}

export default {
  listPages,
  getPageByKey,
  updatePage,
  listNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  getCompanySettings,
  updateCompanySettings,
  updateLogo,
  restoreHomeDefaults,
};
