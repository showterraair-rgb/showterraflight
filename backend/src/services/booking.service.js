import Booking from '../models/Booking.js';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import CustomerPayment from '../models/CustomerPayment.js';
import SupplierPayment from '../models/SupplierPayment.js';
import ApiError from '../utils/ApiError.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
  buildSearchFilter,
} from '../utils/pagination.js';
import { generateBookingNumber } from './numberGenerator.service.js';
import { findOrCreateFromOrder } from './customer.service.js';
import { logAudit } from './audit.service.js';
import { triggerNotificationEventSafe } from './notificationOrchestrator.service.js';
import { buildBookingNotificationContext } from '../utils/notificationContext.js';
import { syncBookingFinancials, syncCustomerTotals, syncSupplierTotals } from './financialSync.service.js';
import { applyApprovalUpdate, applyPassportFile, fireApprovalSms } from './approval.service.js';
import { APPROVAL_STATUS_LABELS } from '../config/constants.js';
import { getCurrencyRatesMap } from './currency.service.js';
import { buildBookingCurrencySnapshot, normalizeLegacyBookingPricing } from '../utils/currencyUtils.js';
import Account from '../models/Account.js';
import { createCustomerPayment } from './customerPayment.service.js';
import { createSupplierPayment } from './supplierPayment.service.js';

function derivePaymentStatus(amount, total) {
  if (amount <= 0) return 'unpaid';
  if (amount >= total) return 'paid';
  return 'partial';
}

function formatBooking(doc) {
  const purchaseTotal = (doc.purchasePrice || 0) + (doc.directCosts || 0);
  const pricing = normalizeLegacyBookingPricing(doc);
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
    journeyType: doc.journeyType || 'one_way',
    fromDestination: doc.fromDestination || '',
    toDestination: doc.toDestination || '',
    travelClass: doc.travelClass || 'economy',
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
    originalCurrency: doc.originalCurrency || 'BDT',
    exchangeRateAtBooking: doc.exchangeRateAtBooking ?? doc.bdtRateAtBooking,
    bdtRateAtBooking: doc.bdtRateAtBooking ?? doc.exchangeRateAtBooking,
    pricing,
    amountPaid: doc.amountPaid,
    customerDue: doc.customerDue,
    supplierPayable: doc.supplierPayable,
    supplierPaid: doc.supplierPaid,
    paymentStatus: doc.paymentStatus,
    supplierPaymentStatus: doc.supplierPaymentStatus,
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
    notes: doc.notes || '',
    ticketCopyPath: doc.ticketCopyPath || '',
    ticketCopyFileName: doc.ticketCopyFileName || '',
    ticketCopyUrl: doc.ticketCopyPath ? `/uploads/${String(doc.ticketCopyPath).replace(/^uploads\//, '')}` : '',
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
      profitBRL: pricing.profitBRL,
      profitBDT: pricing.profitBDT,
      customerDueBRL: pricing.customerDueBRL,
      customerDueBDT: pricing.customerDueBDT,
      supplierPayableBRL: pricing.supplierPayableBRL,
      supplierPayableBDT: pricing.supplierPayableBDT,
    },
  };
}

async function resolveBookingCurrencyFields(data) {
  if (data.purchasePriceBRL != null || data.salePriceBRL != null || data.bdtRate != null) {
    const rates = await getCurrencyRatesMap();
    return buildBookingCurrencySnapshot({
      purchasePriceBRL: data.purchasePriceBRL ?? data.originalPurchasePrice ?? 0,
      salePriceBRL: data.salePriceBRL ?? data.originalSalePrice ?? 0,
      directCostsBRL: data.directCostsBRL ?? data.originalDirectCosts ?? 0,
      bdtRate: data.bdtRate ?? data.bdtRateAtBooking ?? rates.BRL,
    });
  }
  return {};
}

function buildBookingFilter(query) {
  const filter = { ...buildSearchFilter(query.search, ['bookingNumber', 'pnr', 'ticketNumber', 'airline', 'route']) };

  if (query.status) filter.status = query.status;
  if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
  if (query.customerId) filter.customer = query.customerId;
  if (query.supplierId) filter.supplier = query.supplierId;
  if (query.orderId) filter.order = query.orderId;

  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

  if (query.bookingDateFrom || query.bookingDateTo) {
    filter.createdAt = {};
    if (query.bookingDateFrom) filter.createdAt.$gte = new Date(query.bookingDateFrom);
    if (query.bookingDateTo) {
      const end = new Date(query.bookingDateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

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

async function fireBookingNotification(eventType, booking, customerDoc = null, extra = {}) {
  try {
    const customer = customerDoc || (booking.customer
      ? await Customer.findById(booking.customer).lean()
      : null);
    triggerNotificationEventSafe(eventType, buildBookingNotificationContext(booking, customer, extra));
  } catch (err) {
    console.error('[notification] booking context failed', eventType, err.message);
  }
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

export async function getBookingsSummary(query = {}) {
  const filter = buildBookingFilter(query);
  const bookings = await Booking.find(filter).select(
    'status salePrice amountPaid customerDue profit paymentStatus createdAt departureDate'
  ).lean();

  const ticketedStatuses = ['ticket_issued', 'delivered', 'completed'];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const summary = {
    total: bookings.length,
    totalSale: 0,
    totalPaid: 0,
    totalDue: 0,
    totalProfit: 0,
    ticketed: { count: 0, amount: 0 },
    cancelled: { count: 0, amount: 0 },
    draft: { count: 0, amount: 0 },
    partialDue: { count: 0, amount: 0 },
    unpaidDue: { count: 0, amount: 0 },
    todayDue: { count: 0, amount: 0 },
    overdueDue: { count: 0, amount: 0 },
  };

  for (const b of bookings) {
    const sale = b.salePrice || 0;
    const paid = b.amountPaid || 0;
    const due = b.customerDue || 0;

    summary.totalSale += sale;
    summary.totalPaid += paid;
    summary.totalDue += due;
    summary.totalProfit += b.profit || 0;

    if (ticketedStatuses.includes(b.status)) {
      summary.ticketed.count += 1;
      summary.ticketed.amount += sale;
    } else if (b.status === 'cancelled') {
      summary.cancelled.count += 1;
      summary.cancelled.amount += sale;
    } else if (b.status === 'draft') {
      summary.draft.count += 1;
      summary.draft.amount += sale;
    }

    if (due > 0.01) {
      if (b.paymentStatus === 'partial') {
        summary.partialDue.count += 1;
        summary.partialDue.amount += due;
      }
      if (b.paymentStatus === 'unpaid') {
        summary.unpaidDue.count += 1;
        summary.unpaidDue.amount += due;
      }
      const dep = b.departureDate ? new Date(b.departureDate) : null;
      if (dep && dep >= todayStart && dep <= todayEnd) {
        summary.todayDue.count += 1;
        summary.todayDue.amount += due;
      } else if (dep && dep < todayStart) {
        summary.overdueDue.count += 1;
        summary.overdueDue.amount += due;
      }
    }
  }

  return summary;
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

async function resolveAccountPaymentMethod(accountId) {
  const account = await Account.findById(accountId).lean();
  if (!account) throw ApiError.notFound('Payment account not found');
  if (!account.isActive) throw ApiError.badRequest('Selected payment account is inactive');
  const methodByType = {
    cash: 'Cash',
    bank: 'Bank Transfer',
    bkash: 'bKash',
    nagad: 'Nagad',
  };
  return {
    account,
    paymentMethod: methodByType[account.type] || 'Bank Transfer',
  };
}

async function recordInitialBookingPayments(booking, data, userId, req) {
  const rate = Number(booking.bdtRateAtBooking || booking.exchangeRateAtBooking || 1);
  const paymentDate = data.departureDate
    ? String(data.departureDate).slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const autoNote = `Auto-created from booking ${booking.bookingNumber}`;

  const customerPaidBRL = Number(data.customerPaidAmountBRL) || 0;
  if (customerPaidBRL > 0.001) {
    const amountBDT = Math.round(customerPaidBRL * rate * 100) / 100;
    if (amountBDT > (booking.salePrice || 0) + 0.01) {
      throw ApiError.badRequest('Customer paid amount exceeds booking sale price');
    }
    const { paymentMethod } = await resolveAccountPaymentMethod(data.customerPaymentAccountId);
    await createCustomerPayment(
      {
        customerId: booking.customer.toString(),
        bookingId: booking._id.toString(),
        accountId: data.customerPaymentAccountId,
        amount: amountBDT,
        paymentDate,
        paymentMethod,
        notes: autoNote,
        onAccount: false,
      },
      userId,
      req
    );
  }

  const supplierPaidBRL = Number(data.supplierPaidAmountBRL) || 0;
  if (supplierPaidBRL > 0.001) {
    if (!booking.supplier) {
      throw ApiError.badRequest('Supplier is required to record a supplier payment');
    }
    const purchaseTotalBDT = (booking.purchasePrice || 0) + (booking.directCosts || 0);
    const amountBDT = Math.round(supplierPaidBRL * rate * 100) / 100;
    if (amountBDT > purchaseTotalBDT + 0.01) {
      throw ApiError.badRequest('Supplier paid amount exceeds purchase total');
    }
    const { paymentMethod } = await resolveAccountPaymentMethod(data.supplierPaymentAccountId);
    await createSupplierPayment(
      {
        supplierId: booking.supplier.toString(),
        bookingId: booking._id.toString(),
        accountId: data.supplierPaymentAccountId,
        amount: amountBDT,
        paymentDate,
        paymentMethod,
        notes: autoNote,
        onAccount: false,
      },
      userId,
      req
    );
  }
}

async function createBookingRecord(data, userId, req, orderDoc = null) {
  const bookingNumber = await generateBookingNumber();
  const currencyFields = await resolveBookingCurrencyFields(data);

  const booking = new Booking({
    bookingNumber,
    order: orderDoc?._id || data.orderId,
    customer: data.customerId,
    supplier: data.supplierId,
    journeyType: data.journeyType || 'one_way',
    fromDestination: data.fromDestination || '',
    toDestination: data.toDestination || '',
    travelClass: data.travelClass || 'economy',
    airline: data.airline,
    route: data.route,
    sector: data.sector,
    departureDate: new Date(data.departureDate),
    returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
    passengerCount: data.passengerCount,
    pnr: data.pnr,
    ticketNumber: data.ticketNumber,
    purchasePrice: currencyFields.purchasePrice ?? data.purchasePrice ?? 0,
    salePrice: currencyFields.salePrice ?? data.salePrice ?? 0,
    directCosts: currencyFields.directCosts ?? data.directCosts ?? 0,
    ...currencyFields,
    amountPaid: 0,
    supplierPaid: 0,
    notes: data.notes || '',
    ticketCopyPath: data.ticketCopyPath,
    ticketCopyFileName: data.ticketCopyFileName,
    status: data.status || 'draft',
    createdBy: userId,
    approvalStatus: orderDoc?.approvalStatus || 'pending',
    approvalTimeline: orderDoc?.approvalTimeline?.length
      ? [...orderDoc.approvalTimeline]
      : [{ status: 'pending', note: 'Booking created', changedBy: userId, changedAt: new Date() }],
    passportFilePath: orderDoc?.passportFilePath,
    passportFileName: orderDoc?.passportFileName,
    passportMimeType: orderDoc?.passportMimeType,
    passportUploadedAt: orderDoc?.passportUploadedAt,
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

  await fireBookingNotification('admin_manual_booking_alert', booking, null, {
    vars: { approvalStatus: APPROVAL_STATUS_LABELS[booking.approvalStatus || 'pending'] },
  });
  if (!orderDoc) {
    fireApprovalSms(booking, 'booking');
    await fireBookingNotification('manual_order_created', booking);
  }

  const hasInitialPayment =
    (Number(data.customerPaidAmountBRL) || 0) > 0
    || (Number(data.supplierPaidAmountBRL) || 0) > 0;

  if (hasInitialPayment) {
    await recordInitialBookingPayments(booking, data, userId, req);
  } else {
    await syncBookingFinancials(booking._id);
  }

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
    journeyType: data.journeyType || order.journeyType,
    fromDestination: data.fromDestination || order.fromDestination,
    toDestination: data.toDestination || order.toDestination,
    travelClass: data.travelClass || order.travelClass,
    airline: data.airline || `${order.fromDestination}-${order.toDestination}`,
    route: data.route || `${order.fromDestination} → ${order.toDestination}`,
    sector: data.sector,
    departureDate: data.departureDate || order.journeyDate.toISOString().slice(0, 10),
    returnDate: data.returnDate || (order.returnDate ? order.returnDate.toISOString().slice(0, 10) : undefined),
    passengerCount: data.passengerCount || order.passengerCount,
    purchasePrice: data.purchasePrice ?? 0,
    salePrice: data.salePrice ?? order.quotedSalePrice ?? 0,
    directCosts: data.directCosts ?? 0,
    pnr: data.pnr,
    ticketNumber: data.ticketNumber,
    notes: data.notes || order.internalNotes || '',
    status: data.status || 'confirmed',
    ticketCopyPath: data.ticketCopyPath,
    ticketCopyFileName: data.ticketCopyFileName,
    customerPaymentStatus: data.customerPaymentStatus,
    customerPaidAmountBRL: data.customerPaidAmountBRL,
    customerPaymentAccountId: data.customerPaymentAccountId,
    supplierPaymentStatus: data.supplierPaymentStatus,
    supplierPaidAmountBRL: data.supplierPaidAmountBRL,
    supplierPaymentAccountId: data.supplierPaymentAccountId,
  };

  return createBookingRecord(payload, userId, req, order);
}

export async function updateBooking(id, data, userId, req) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');

  const prevCustomer = booking.customer?.toString();
  const prevSupplier = booking.supplier?.toString();
  const hadTicket = Boolean(booking.ticketCopyPath);

  if (data.supplierId !== undefined) booking.supplier = data.supplierId || undefined;
  if (data.customerId) booking.customer = data.customerId;
  if (data.journeyType) booking.journeyType = data.journeyType;
  if (data.fromDestination !== undefined) booking.fromDestination = data.fromDestination;
  if (data.toDestination !== undefined) booking.toDestination = data.toDestination;
  if (data.travelClass) booking.travelClass = data.travelClass;
  if (data.airline) booking.airline = data.airline;
  if (data.route) booking.route = data.route;
  if (data.sector !== undefined) booking.sector = data.sector;
  if (data.departureDate) booking.departureDate = new Date(data.departureDate);
  if (data.returnDate !== undefined) booking.returnDate = data.returnDate ? new Date(data.returnDate) : undefined;
  if (data.pnr !== undefined) booking.pnr = data.pnr;
  if (data.ticketNumber !== undefined) booking.ticketNumber = data.ticketNumber;
  const currencyFields = await resolveBookingCurrencyFields(data);
  if (currencyFields.purchasePrice != null) {
    Object.assign(booking, currencyFields);
  } else {
    if (data.purchasePrice !== undefined) booking.purchasePrice = data.purchasePrice;
    if (data.salePrice !== undefined) booking.salePrice = data.salePrice;
    if (data.directCosts !== undefined) booking.directCosts = data.directCosts;
  }
  if (data.notes !== undefined) booking.notes = data.notes;
  if (data.ticketCopyPath !== undefined) booking.ticketCopyPath = data.ticketCopyPath;
  if (data.ticketCopyFileName !== undefined) booking.ticketCopyFileName = data.ticketCopyFileName;
  if (data.passengerCount) booking.passengerCount = data.passengerCount;

  if (data.status && data.status !== booking.status) {
    pushTimeline(booking, data.status, 'Updated via edit form', userId);
    booking.status = data.status;
    if (data.status === 'delivered') booking.deliveredAt = new Date();
    if (data.status === 'completed') booking.completedAt = new Date();
  }

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

  if (data.ticketCopyPath && !hadTicket) {
    await fireBookingNotification('ticket_issued', booking);
  }

  await syncBookingFinancials(id);
  if (prevCustomer && prevCustomer !== booking.customer?.toString()) {
    await syncCustomerTotals(prevCustomer);
  }
  if (prevSupplier && prevSupplier !== booking.supplier?.toString()) {
    await syncSupplierTotals(prevSupplier);
  }

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

  if (status === 'confirmed' && prev !== 'confirmed') {
    await fireBookingNotification('booking_approved', booking);
  }
  if (status === 'ticket_issued' && prev !== 'ticket_issued') {
    await fireBookingNotification('ticket_issued', booking);
  }
  if (status === 'cancelled' && prev !== 'cancelled') {
    await fireBookingNotification('booking_canceled', booking);
  }

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
    .select('bookingNumber statusTimeline approvalTimeline activityNotes')
    .populate('statusTimeline.changedBy', 'name')
    .populate('approvalTimeline.changedBy', 'name')
    .populate('activityNotes.createdBy', 'name')
    .lean();

  if (!booking) throw ApiError.notFound('Booking not found');

  return {
    bookingNumber: booking.bookingNumber,
    timeline: booking.statusTimeline,
    approvalTimeline: booking.approvalTimeline || [],
    activityNotes: booking.activityNotes,
  };
}

export async function deleteBooking(id, userId, req) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');

  const [customerPayCount, supplierPayCount] = await Promise.all([
    CustomerPayment.countDocuments({ booking: id }),
    SupplierPayment.countDocuments({ booking: id }),
  ]);

  if (customerPayCount || supplierPayCount) {
    throw ApiError.badRequest('Cannot delete booking with linked payment records. Remove payments first.');
  }

  const bookingNumber = booking.bookingNumber;
  const customerId = booking.customer;
  const supplierId = booking.supplier;
  await Booking.findByIdAndDelete(id);

  if (customerId) await syncCustomerTotals(customerId);
  if (supplierId) await syncSupplierTotals(supplierId);

  await logAudit({
    action: 'delete',
    module: 'bookings',
    entityType: 'Booking',
    entityId: id,
    description: `Deleted booking ${bookingNumber}`,
    userId,
    req,
  });

  return { id, deleted: true, message: 'Booking deleted' };
}

export async function updateBookingApproval(id, data, userId, req) {
  const booking = await Booking.findById(id).populate('customer', 'name phone email');
  if (!booking) throw ApiError.notFound('Booking not found');

  const changed = applyApprovalUpdate(booking, data, userId);
  if (!changed) return getBookingById(id);

  await booking.save();

  await logAudit({
    action: 'update',
    module: 'bookings',
    entityType: 'Booking',
    entityId: booking._id,
    description: `Booking ${booking.bookingNumber} approval → ${booking.approvalStatus}`,
    userId,
    req,
  });

  fireApprovalSms(booking, 'booking', { customer: booking.customer });
  return getBookingById(id);
}

export async function uploadBookingPassport(id, file, userId, req) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (!file) throw ApiError.badRequest('No passport file uploaded');

  applyPassportFile(booking, {
    path: `passports/${file.filename}`,
    fileName: file.originalname,
    mimeType: file.mimetype,
  });

  await booking.save();

  await logAudit({
    action: 'update',
    module: 'bookings',
    entityType: 'Booking',
    entityId: booking._id,
    description: `Passport uploaded for booking ${booking.bookingNumber}`,
    userId,
    req,
  });

  return getBookingById(id);
}

export async function uploadBookingTicketCopy(id, file, userId, req) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (!file) throw ApiError.badRequest('No ticket file uploaded');

  const hadTicket = Boolean(booking.ticketCopyPath);
  booking.ticketCopyPath = `tickets/${file.filename}`;
  booking.ticketCopyFileName = file.originalname;
  await booking.save();

  await logAudit({
    action: 'update',
    module: 'bookings',
    entityType: 'Booking',
    entityId: booking._id,
    description: `Ticket copy uploaded for booking ${booking.bookingNumber}`,
    userId,
    req,
  });

  if (!hadTicket) {
    await fireBookingNotification('ticket_issued', booking);
  }

  return getBookingById(id);
}

export default {
  listBookings,
  getBookingsSummary,
  getBookingById,
  createBooking,
  createBookingFromOrder,
  updateBooking,
  updateBookingStatus,
  updateBookingApproval,
  uploadBookingPassport,
  uploadBookingTicketCopy,
  addBookingNote,
  getBookingTimeline,
  deleteBooking,
};
