import Setting from '../models/Setting.js';
import CmsPage from '../models/CmsPage.js';
import CmsNotice from '../models/CmsNotice.js';
import Order from '../models/Order.js';
import { generateOrderNumber } from './numberGenerator.service.js';
import ApiError from '../utils/ApiError.js';
import { COMPANY_DEFAULTS } from '../config/constants.js';

export async function getCompanySettings() {
  const settings = await Setting.findOne({ key: 'company' }).lean();

  const company = settings?.company || COMPANY_DEFAULTS;
  const logo = settings?.logo?.filePath
    ? { url: `/uploads/${settings.logo.filePath.replace(/^uploads\//, '')}`, altText: settings.logo.altText }
    : null;

  return {
    company: {
      name: company.name,
      address: company.address,
      email: company.email,
      whatsapp: company.whatsapp,
      directorName: company.directorName,
      directorPhone: company.directorPhone,
      ownerEmail: company.ownerEmail,
      currency: company.currency,
      timezone: company.timezone,
    },
    logo,
    socialLinks: settings?.socialLinks || {},
  };
}

export async function getCmsPage(pageKey) {
  const page = await CmsPage.findOne({ pageKey, isPublished: true }).lean();

  if (!page) {
    throw ApiError.notFound(`Page "${pageKey}" not found`);
  }

  return {
    pageKey: page.pageKey,
    title: page.title,
    slug: page.slug,
    content: page.content,
    sections: page.sections,
    seo: page.seo,
    updatedAt: page.updatedAt,
  };
}

export async function getPublishedNotices({ type } = {}) {
  const now = new Date();
  const filter = {
    isPublished: true,
    publishDate: { $lte: now },
    $or: [{ expireDate: null }, { expireDate: { $exists: false } }, { expireDate: { $gt: now } }],
  };

  if (type) {
    filter.type = type;
  }

  const notices = await CmsNotice.find(filter)
    .sort({ isPinned: -1, sortOrder: 1, publishDate: -1 })
    .select('title content type isPinned publishDate')
    .lean();

  return notices.map((n) => ({
    id: n._id.toString(),
    title: n.title,
    content: n.content,
    type: n.type,
    isPinned: n.isPinned,
    publishDate: n.publishDate,
  }));
}

export async function createBookingRequest(data) {
  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail || undefined,
    source: 'website',
    status: 'inquiry',
    journeyType: data.journeyType,
    fromDestination: data.fromDestination,
    toDestination: data.toDestination,
    journeyDate: new Date(data.journeyDate),
    returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
    passengerCount: data.passengerCount,
    travelClass: data.travelClass,
    requestNotes: data.requestNotes || '',
    isFromWebsite: true,
    websiteBookingId: orderNumber,
  });

  return {
    orderNumber: order.orderNumber,
    message: 'Your booking request has been submitted. We will contact you shortly.',
  };
}

export default {
  getCompanySettings,
  getCmsPage,
  getPublishedNotices,
  createBookingRequest,
};
