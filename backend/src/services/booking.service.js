import Booking from '../models/Booking.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
  buildSearchFilter,
} from '../utils/pagination.js';
import { generateBookingNumber } from './numberGenerator.service.js';
import { findOrCreateFromOrder } from './customer.service.js';
import { logAudit } from './audit.service.js';

function derivePaymentStatus(amount, total) {
  if (amount <= 0) return 'unpaid';
  if (amount >= total) return 'paid';
  return 'partial';
}

function formatBooking(doc) {
  const purchaseTotal = (doc.purchasePrice || 0) + (doc.directCosts || 0);
  return {
    id: doc._id.toString(),
    bookingNumber: doc.bookingNumber,
    order: doc.order?._id?.toString() || doc.order?.toString() || null,
    orderNumber: doc.order?.orderNumber,
    customer: doc.customer?._id?.toString() || doc.customer?.toString(),
    customerName: doc.customer?.name,
    customerPhone: doc.customer?.phone,
    supplier: doc.supplier?._id?.toString() || doc.supplier?.toString() || null,
    supplierName: doc.supplier?.name,
    airline: doc.airline,
    route: doc.route,
    sector: doc.sector || '',
    departureDate: doc.departureDate,
    returnDate: doc.returnDate,
    passengerCount: doc.passengerCount,
    pnr: doc.pnr || '',
    ticketNumber: doc.ticketNumber || '',
    purchasePrice: doc.purchasePrice,
    salePrice: doc.salePrice,
    directCosts: doc.directCosts,
    profit: doc.profit,
    amountPaid: doc.amountPaid,
    customerDue: doc.customerDue,
    supplierPayable: doc.supplierPayable,
    supplierPaid: doc.supplierPaid,
    paymentStatus: doc.paymentStatus,
    supplierPaymentStatus: doc.supplierPaymentStatus,
    status: doc.status,
    notes: doc.notes || '',
    ticketCopyPath: doc.ticketCopyPath || '',
    ticketCopyFileName: doc.ticketCopyFileName || '',
    statusTimeline: doc.statusTimeline,
    activityNotes: doc.activityNotes,
    createdBy: doc.createdBy?.toString(),
    deliveredAt: doc.deliveredAt,
    completedAt: doc.completedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    computed: {
      profit: doc.profit,
      customerDue: doc.customerDue,
      supplierPayable: doc.supplierPayable,
      purchaseTotal,
    },
  };
}

function buildBookingFilter(query) {
  const filter = { ...buildSearchFilter(query.search, ['bookingNumber', 'pnr', 'ticketNumber', 'airline', 'route']) };

  if (query.status) filter.status = query.status;
  if (query.customerId) filter.customer = query.customerId;
  if (query.supplierId) filter.supplier = query.supplierId;
  if (query.orderId) filter.order = query.orderId;

  if (query.dateFrom || query.dateTo) {
    filter.departureDate = {};
    if (query.dateFrom) filter.departureDate.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.departureDate.$lte = end;
    }
  }

  return filter;
}

function applyPaymentStatuses(booking) {
  booking.paymentStatus = derivePaymentStatus(booking.amountPaid, booking.salePrice);
  booking.supplierPaymentStatus = derivePaymentStatus(booking.supplierPaid, booking.purchasePrice + booking.directCosts);
}

function pushTimeline(booking, status, note, userId) {
  booking.statusTimeline.push({ status, note: note || '', changedBy: userId, changedAt: new Date() });
}

export async function listBookings(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'departureDate');
  const filter = buildBookingFilter(query);

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name phone')
      .populate('supplier', 'name')
      .populate('order', 'orderNumber')
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return {
    items: items.map(formatBooking),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getBookingById(id) {
  const booking = await Booking.findById(id)
    .populate('customer', 'name phone email')
    .populate('supplier', 'name company phone')
    .populate('order', 'orderNumber status source')
    .populate('statusTimeline.changedBy', 'name')
    .populate('activityNotes.createdBy', 'name')
    .lean();

  if (!booking) throw ApiError.notFound('Booking not found');
  return formatBooking(booking);
}

async function createBookingRecord(data, userId, req, orderDoc = null) {
  const bookingNumber = await generateBookingNumber();

  const booking = new Booking({
    bookingNumber,
    order: orderDoc?._id || data.orderId,
    customer: data.customerId,
    supplier: data.supplierId,
    airline: data.airline,
    route: data.route,
    sector: data.sector,
    departureDate: new Date(data.departureDate),
    returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
    passengerCount: data.passengerCount,
    pnr: data.pnr,
    ticketNumber: data.ticketNumber,
    purchasePrice: data.purchasePrice ?? 0,
    salePrice: data.salePrice ?? 0,
    directCosts: data.directCosts ?? 0,
    amountPaid: data.amountPaid ?? 0,
    supplierPaid: data.supplierPaid ?? 0,
    notes: data.notes || '',
    ticketCopyPath: data.ticketCopyPath,
    ticketCopyFileName: data.ticketCopyFileName,
    status: data.status || 'draft',
    createdBy: userId,
    statusTimeline: [{ status: data.status || 'draft', note: 'Booking created', changedBy: userId }],
  });

  applyPaymentStatuses(booking);
  await booking.save();

  if (orderDoc) {
    if (['inquiry', 'quoted'].includes(orderDoc.status)) {
      orderDoc.status = 'pending_purchase';
    }
    await orderDoc.save();
  }

  await logAudit({
    action: 'create',
    module: 'bookings',
    entityType: 'Booking',
    entityId: booking._id,
    description: `Created booking ${booking.bookingNumber}`,
    userId,
    req,
  });

  return getBookingById(booking._id);
}

export async function createBooking(data, userId, req) {
  return createBookingRecord(data, userId, req);
}

export async function createBookingFromOrder(orderId, data, userId, req) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  const existing = await Booking.findOne({ order: orderId });
  if (existing) {
    throw ApiError.badRequest(`Order already has booking ${existing.bookingNumber}`);
  }

  let customerId = data.customerId || order.customer;
  if (!customerId) {
    const customer = await findOrCreateFromOrder(
      { name: order.customerName, phone: order.customerPhone, email: order.customerEmail },
      userId
    );
    customerId = customer._id;
    order.customer = customerId;
  }

  const payload = {
    orderId,
    customerId: customerId.toString(),
    supplierId: data.supplierId,
    airline: data.airline || `${order.fromDestination}-${order.toDestination}`,
    route: data.route || `${order.fromDestination} → ${order.toDestination}`,
    sector: data.sector,
    departureDate: data.departureDate || order.journeyDate.toISOString().slice(0, 10),
    returnDate: data.returnDate || (order.returnDate ? order.returnDate.toISOString().slice(0, 10) : undefined),
    passengerCount: data.passengerCount || order.passengerCount,
    purchasePrice: data.purchasePrice ?? 0,
    salePrice: data.salePrice ?? order.quotedSalePrice ?? 0,
    directCosts: data.directCosts ?? 0,
    amountPaid: data.amountPaid ?? 0,
    supplierPaid: data.supplierPaid ?? 0,
    pnr: data.pnr,
    ticketNumber: data.ticketNumber,
    notes: data.notes || order.internalNotes || '',
    status: data.status || 'confirmed',
    ticketCopyPath: data.ticketCopyPath,
    ticketCopyFileName: data.ticketCopyFileName,
  };

  return createBookingRecord(payload, userId, req, order);
}

export async function updateBooking(id, data, userId, req) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');

  if (data.supplierId !== undefined) booking.supplier = data.supplierId || undefined;
  if (data.airline) booking.airline = data.airline;
  if (data.route) booking.route = data.route;
  if (data.sector !== undefined) booking.sector = data.sector;
  if (data.departureDate) booking.departureDate = new Date(data.departureDate);
  if (data.returnDate !== undefined) booking.returnDate = data.returnDate ? new Date(data.returnDate) : undefined;
  if (data.pnr !== undefined) booking.pnr = data.pnr;
  if (data.ticketNumber !== undefined) booking.ticketNumber = data.ticketNumber;
  if (data.purchasePrice !== undefined) booking.purchasePrice = data.purchasePrice;
  if (data.salePrice !== undefined) booking.salePrice = data.salePrice;
  if (data.directCosts !== undefined) booking.directCosts = data.directCosts;
  if (data.amountPaid !== undefined) booking.amountPaid = data.amountPaid;
  if (data.supplierPaid !== undefined) booking.supplierPaid = data.supplierPaid;
  if (data.notes !== undefined) booking.notes = data.notes;
  if (data.ticketCopyPath !== undefined) booking.ticketCopyPath = data.ticketCopyPath;
  if (data.ticketCopyFileName !== undefined) booking.ticketCopyFileName = data.ticketCopyFileName;
  if (data.passengerCount) booking.passengerCount = data.passengerCount;

  applyPaymentStatuses(booking);
  await booking.save();

  await logAudit({
    action: 'update',
    module: 'bookings',
    entityType: 'Booking',
    entityId: booking._id,
    description: `Updated booking ${booking.bookingNumber}`,
    userId,
    req,
  });

  return getBookingById(id);
}

export async function updateBookingStatus(id, { status, note }, userId, req) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');

  const prev = booking.status;
  booking.status = status;
  pushTimeline(booking, status, note, userId);

  if (status === 'delivered') booking.deliveredAt = new Date();
  if (status === 'completed') booking.completedAt = new Date();

  await booking.save();

  if (booking.order) {
    const order = await Order.findById(booking.order);
    if (order) {
      const statusMap = {
        ticket_issued: 'ticket_added',
        delivered: 'delivered',
        completed: 'closed',
        cancelled: 'cancelled',
      };
      if (statusMap[status]) {
        order.status = statusMap[status];
        if (status === 'closed') order.closedAt = new Date();
        await order.save();
      }
    }
  }

  await logAudit({
    action: 'update',
    module: 'bookings',
    entityType: 'Booking',
    entityId: booking._id,
    description: `Booking ${booking.bookingNumber} status: ${prev} → ${status}`,
    changes: { from: prev, to: status },
    userId,
    req,
  });

  return getBookingById(id);
}

export async function addBookingNote(id, note, userId, req) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');

  booking.activityNotes.push({ note, createdBy: userId });
  await booking.save();

  await logAudit({
    action: 'update',
    module: 'bookings',
    entityType: 'Booking',
    entityId: booking._id,
    description: `Note added to booking ${booking.bookingNumber}`,
    userId,
    req,
  });

  return getBookingById(id);
}

export async function getBookingTimeline(id) {
  const booking = await Booking.findById(id)
    .select('bookingNumber statusTimeline activityNotes')
    .populate('statusTimeline.changedBy', 'name')
    .populate('activityNotes.createdBy', 'name')
    .lean();

  if (!booking) throw ApiError.notFound('Booking not found');

  return {
    bookingNumber: booking.bookingNumber,
    timeline: booking.statusTimeline,
    activityNotes: booking.activityNotes,
  };
}

export default {
  listBookings,
  getBookingById,
  createBooking,
  createBookingFromOrder,
  updateBooking,
  updateBookingStatus,
  addBookingNote,
  getBookingTimeline,
};
