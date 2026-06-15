import Order from '../models/Order.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
  buildSearchFilter,
} from '../utils/pagination.js';
import { generateOrderNumber } from './numberGenerator.service.js';
import { findOrCreateFromOrder } from './customer.service.js';
import { logAudit } from './audit.service.js';
import { triggerNotificationEventSafe } from './notificationOrchestrator.service.js';
import { buildOrderNotificationContext } from '../utils/notificationContext.js';
import { applyApprovalUpdate, applyPassportFile, fireApprovalSms } from './approval.service.js';
import { APPROVAL_STATUS_LABELS } from '../config/constants.js';

function formatOrder(doc) {
  return {
    id: doc._id.toString(),
    orderNumber: doc.orderNumber,
    customer: doc.customer?._id?.toString() || doc.customer?.toString() || null,
    customerName: doc.customerName,
    customerPhone: doc.customerPhone,
    customerEmail: doc.customerEmail || '',
    source: doc.source,
    status: doc.status,
    approvalStatus: doc.approvalStatus || 'pending',
    approvalTimeline: doc.approvalTimeline?.map((t) => ({
      status: t.status,
      note: t.note || '',
      changedBy: t.changedBy?.toString?.() || t.changedBy,
      changedAt: t.changedAt,
    })) || [],
    passportFilePath: doc.passportFilePath || '',
    passportFileName: doc.passportFileName || '',
    passportMimeType: doc.passportMimeType || '',
    passportUploadedAt: doc.passportUploadedAt,
    passportUrl: doc.passportFilePath ? `/uploads/${String(doc.passportFilePath).replace(/^uploads\//, '')}` : '',
    journeyType: doc.journeyType,
    fromDestination: doc.fromDestination,
    toDestination: doc.toDestination,
    journeyDate: doc.journeyDate,
    returnDate: doc.returnDate,
    passengerCount: doc.passengerCount,
    travelClass: doc.travelClass,
    quotedSalePrice: doc.quotedSalePrice,
    requestNotes: doc.requestNotes || '',
    internalNotes: doc.internalNotes || '',
    nextFollowUpDate: doc.nextFollowUpDate,
    isFromWebsite: doc.isFromWebsite,
    assignedTo: doc.assignedTo?._id?.toString() || doc.assignedTo?.toString() || null,
    assignedToName: doc.assignedTo?.name,
    createdBy: doc.createdBy?.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    followUpNotes: doc.followUpNotes?.map((n) => ({
      note: n.note,
      nextFollowUpDate: n.nextFollowUpDate,
      createdBy: n.createdBy?.toString(),
      createdAt: n.createdAt,
    })),
  };
}

function buildOrderFilter(query) {
  const filter = { ...buildSearchFilter(query.search, ['orderNumber', 'customerName', 'customerPhone', 'fromDestination', 'toDestination']) };

  if (query.status) filter.status = query.status;
  if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
  if (query.source) filter.source = query.source;
  if (query.isFromWebsite === 'true') filter.isFromWebsite = true;
  if (query.isFromWebsite === 'false') filter.isFromWebsite = false;

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  return filter;
}

export async function listOrders(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query);
  const filter = buildOrderFilter(query);

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name')
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    items: items.map(formatOrder),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getOrderById(id) {
  const order = await Order.findById(id).populate('assignedTo', 'name').populate('customer', 'name phone email').lean();
  if (!order) throw ApiError.notFound('Order not found');

  const booking = await Booking.findOne({ order: id }).select('bookingNumber status _id').lean();

  return {
    ...formatOrder(order),
    customerDetails: order.customer
      ? { id: order.customer._id.toString(), name: order.customer.name, phone: order.customer.phone, email: order.customer.email }
      : null,
    linkedBooking: booking
      ? { id: booking._id.toString(), bookingNumber: booking.bookingNumber, status: booking.status }
      : null,
  };
}

export async function createOrder(data, userId, req) {
  const orderNumber = await generateOrderNumber();

  let customerId = data.customerId;
  if (!customerId && data.customerPhone) {
    const customer = await findOrCreateFromOrder(
      { name: data.customerName, phone: data.customerPhone, email: data.customerEmail },
      userId
    );
    customerId = customer._id;
  }

  const order = await Order.create({
    orderNumber,
    customer: customerId,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail || undefined,
    source: data.source,
    status: data.status,
    journeyType: data.journeyType,
    fromDestination: data.fromDestination,
    toDestination: data.toDestination,
    journeyDate: new Date(data.journeyDate),
    returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
    passengerCount: data.passengerCount,
    travelClass: data.travelClass,
    quotedSalePrice: data.quotedSalePrice,
    requestNotes: data.requestNotes || '',
    internalNotes: data.internalNotes || '',
    nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : undefined,
    assignedTo: data.assignedTo,
    createdBy: userId,
    isFromWebsite: false,
    approvalStatus: 'pending',
    approvalTimeline: [{ status: 'pending', note: 'Order created', changedBy: userId, changedAt: new Date() }],
  });

  await logAudit({
    action: 'create',
    module: 'orders',
    entityType: 'Order',
    entityId: order._id,
    description: `Created order ${order.orderNumber}`,
    userId,
    req,
  });

  const ctx = buildOrderNotificationContext(order, {
    vars: { approvalStatus: APPROVAL_STATUS_LABELS.pending },
  });
  triggerNotificationEventSafe('admin_manual_order_alert', ctx);
  fireApprovalSms(order, 'order');

  return formatOrder(order.toObject());
}

export async function updateOrder(id, data, userId, req) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');

  if (['closed', 'cancelled'].includes(order.status) && data.status !== order.status) {
    throw ApiError.badRequest('Cannot modify a closed or cancelled order');
  }

  if (data.customerId) order.customer = data.customerId;
  if (data.customerName) order.customerName = data.customerName;
  if (data.customerPhone) order.customerPhone = data.customerPhone;
  if (data.customerEmail !== undefined) order.customerEmail = data.customerEmail || undefined;
  if (data.journeyType) order.journeyType = data.journeyType;
  if (data.fromDestination) order.fromDestination = data.fromDestination;
  if (data.toDestination) order.toDestination = data.toDestination;
  if (data.journeyDate) order.journeyDate = new Date(data.journeyDate);
  if (data.returnDate !== undefined) order.returnDate = data.returnDate ? new Date(data.returnDate) : undefined;
  if (data.passengerCount) order.passengerCount = data.passengerCount;
  if (data.travelClass) order.travelClass = data.travelClass;
  if (data.quotedSalePrice !== undefined) order.quotedSalePrice = data.quotedSalePrice;
  if (data.requestNotes !== undefined) order.requestNotes = data.requestNotes;
  if (data.internalNotes !== undefined) order.internalNotes = data.internalNotes;
  if (data.nextFollowUpDate !== undefined) {
    order.nextFollowUpDate = data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : undefined;
  }
  if (data.assignedTo) order.assignedTo = data.assignedTo;

  await order.save();

  await logAudit({
    action: 'update',
    module: 'orders',
    entityType: 'Order',
    entityId: order._id,
    description: `Updated order ${order.orderNumber}`,
    userId,
    req,
  });

  return formatOrder(order.toObject());
}

export async function updateOrderStatus(id, { status, note, cancelReason }, userId, req) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');

  const prevStatus = order.status;
  order.status = status;

  if (status === 'cancelled') {
    order.cancelledAt = new Date();
    order.cancelReason = cancelReason || note || '';
  }
  if (status === 'closed') order.closedAt = new Date();

  if (note) {
    order.followUpNotes.push({
      note: `[Status: ${prevStatus} → ${status}] ${note}`,
      createdBy: userId,
    });
  }

  await order.save();

  await logAudit({
    action: 'update',
    module: 'orders',
    entityType: 'Order',
    entityId: order._id,
    description: `Order ${order.orderNumber} status changed to ${status}`,
    changes: { from: prevStatus, to: status },
    userId,
    req,
  });

  return formatOrder(order.toObject());
}

export async function addFollowUp(id, { note, nextFollowUpDate }, userId, req) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');

  order.followUpNotes.push({ note, nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined, createdBy: userId });
  if (nextFollowUpDate) order.nextFollowUpDate = new Date(nextFollowUpDate);

  await order.save();

  await logAudit({
    action: 'update',
    module: 'orders',
    entityType: 'Order',
    entityId: order._id,
    description: `Follow-up added to order ${order.orderNumber}`,
    userId,
    req,
  });

  return formatOrder(order.toObject());
}

/** Link website order to customer record and move into managed pipeline */
export async function linkOrderCustomer(id, { customerId, createCustomer }, userId, req) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');

  if (customerId) {
    order.customer = customerId;
  } else if (createCustomer !== false) {
    const customer = await findOrCreateFromOrder(
      { name: order.customerName, phone: order.customerPhone, email: order.customerEmail },
      userId
    );
    order.customer = customer._id;
  }

  if (order.status === 'inquiry') {
    order.status = 'quoted';
  }

  await order.save();

  await logAudit({
    action: 'update',
    module: 'orders',
    entityType: 'Order',
    entityId: order._id,
    description: `Linked customer to order ${order.orderNumber}`,
    userId,
    req,
  });

  return formatOrder(order.toObject());
}

export async function deleteOrder(id, userId, req) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');

  const linkedBooking = await Booking.findOne({ order: id }).select('_id bookingNumber').lean();
  if (linkedBooking) {
    throw ApiError.badRequest(`Cannot delete order — linked booking ${linkedBooking.bookingNumber} exists. Delete the booking first.`);
  }

  await Order.findByIdAndDelete(id);
  await logAudit({
    action: 'delete',
    module: 'orders',
    entityType: 'Order',
    entityId: id,
    description: `Deleted order ${order.orderNumber}`,
    userId,
    req,
  });
  return { id, deleted: true, message: 'Order deleted' };
}

export async function updateOrderApproval(id, data, userId, req) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');

  const changed = applyApprovalUpdate(order, data, userId);
  if (!changed) return formatOrder(order.toObject());

  await order.save();

  await logAudit({
    action: 'update',
    module: 'orders',
    entityType: 'Order',
    entityId: order._id,
    description: `Order ${order.orderNumber} approval → ${order.approvalStatus}`,
    userId,
    req,
  });

  fireApprovalSms(order, 'order');
  return formatOrder(order.toObject());
}

export async function uploadOrderPassport(id, file, userId, req) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');
  if (!file) throw ApiError.badRequest('No passport file uploaded');

  applyPassportFile(order, {
    path: `passports/${file.filename}`,
    fileName: file.originalname,
    mimeType: file.mimetype,
  });

  await order.save();

  await logAudit({
    action: 'update',
    module: 'orders',
    entityType: 'Order',
    entityId: order._id,
    description: `Passport uploaded for order ${order.orderNumber}`,
    userId,
    req,
  });

  return formatOrder(order.toObject());
}

export default {
  listOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  updateOrderApproval,
  uploadOrderPassport,
  addFollowUp,
  linkOrderCustomer,
  deleteOrder,
};
