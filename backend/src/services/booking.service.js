import Booking from '../models/Booking.js';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
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
import { buildBookingNotificationContext, attachSupplierToContext } from '../utils/notificationContext.js';
import { syncBookingFinancials, syncCustomerTotals, syncSupplierTotals } from './financialSync.service.js';
import { applyApprovalUpdate, applyPassportFile, fireApprovalSms } from './approval.service.js';
import { APPROVAL_STATUS_LABELS, BOOKING_STATUS_LABELS } from '../config/constants.js';
import { getCurrencyRatesMap } from './currency.service.js';
import { buildBookingCurrencySnapshot, normalizeLegacyBookingPricing, brlToBdtRounded } from '../utils/currencyUtils.js';
import { buildFareRates, computeFareTotals } from '../utils/fareCurrency.js';
import { extractTicketFromFile } from './ticketExtract.service.js';
import Account from '../models/Account.js';
import { createCustomerPayment, createCustomerRefund, voidCustomerPayment } from './customerPayment.service.js';
import { createSupplierPayment, voidSupplierPayment } from './supplierPayment.service.js';
import {
  recordIssueOperation,
  recordVoidOperation,
  recordRefundOperation,
  recordRefundRequestOperation,
  recordReissueOperation,
} from './bookingOperation.service.js';

function derivePaymentStatus(amount, total) {
  if (amount <= 0) return 'unpaid';
  if (amount >= total) return 'paid';
  return 'partial';
}

function formatBooking(doc) {
  const purchaseTotal = (doc.purchasePrice || 0) + (doc.directCosts || 0);
  const pricing = normalizeLegacyBookingPricing(doc);
  const rates = buildFareRates({
    bdtRate: doc.bdtRateAtBooking ?? doc.exchangeRateAtBooking,
    usdRate: doc.usdRateAtBooking,
  });
  const fareTotals = computeFareTotals(doc, rates);
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
    passengerName: doc.passengerName || doc.passengers?.[0]?.fullName || '',
    passengers: doc.passengers || [],
    flightSegment: doc.flightSegment || null,
    fareBreakdown: doc.fareBreakdown || null,
    fareSale: doc.fareSale || null,
    farePurchase: doc.farePurchase || null,
    fareCosts: doc.fareCosts || null,
    farePaid: doc.farePaid || null,
    fareTotals,
    usdRateAtBooking: doc.usdRateAtBooking,
    duePaymentAt: doc.duePaymentAt,
    ocrExtractedAt: doc.ocrExtractedAt,
    scheduleChangeHistory: doc.scheduleChangeHistory || [],
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
    bookingType: doc.bookingType || 'standard',
    productCategory: doc.productCategory || 'air',
    parentBooking: doc.parentBooking?._id?.toString() || doc.parentBooking?.toString() || null,
    parentBookingNumber: doc.parentBooking?.bookingNumber || null,
    rrvNote: doc.rrvNote || '',
    rrvPenalty: doc.rrvPenalty || 0,
    rrvRefundAmount: doc.rrvRefundAmount || 0,
    rrvProcessedAt: doc.rrvProcessedAt,
    refundRequestPending: Boolean(
      doc.rrvNote
      && !doc.rrvProcessedAt
      && ['ticket_issued', 'delivered', 'completed'].includes(doc.status)
    ),
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
      bdtRate: data.bdtRate ?? data.bdtRateAtBooking,
      rates,
    });
  }
  return {};
}

function toBookingDate(value, label) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
  return date;
}

function buildBookingFilter(query) {
  const andParts = [];
  const searchPart = buildSearchFilter(query.search, ['bookingNumber', 'pnr', 'ticketNumber', 'airline', 'route', 'passengerName']);
  if (Object.keys(searchPart).length) andParts.push(searchPart);

  const filter = {};

  if (query.status) {
    filter.status = query.status;
  } else if (query.invoiced === 'true' || query.invoiced === true) {
    filter.status = { $in: ['ticket_issued', 'delivered', 'completed'] };
  }
  if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
  if (query.customerId) filter.customer = query.customerId;
  if (query.supplierId) filter.supplier = query.supplierId;
  if (query.orderId) filter.order = query.orderId;

  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

  if (query.productCategory) {
    if (query.productCategory === 'air') {
      andParts.push({
        $or: [
          { productCategory: 'air' },
          { productCategory: { $exists: false } },
          { productCategory: null },
        ],
      });
    } else {
      filter.productCategory = query.productCategory;
    }
  }

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

  if (query.refundPending === 'true' || query.refundPending === true) {
    filter.status = { $in: ['ticket_issued', 'delivered', 'completed'] };
    filter.rrvNote = { $exists: true, $nin: ['', null] };
    filter.rrvProcessedAt = null;
  }

  if (andParts.length) {
    filter.$and = [...(filter.$and || []), ...andParts];
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

const TERMINAL_STATUSES = ['voided', 'refunded', 'reissued', 'cancelled'];

async function syncLinkedOrderStatus(booking, status) {
  if (!booking.order) return;
  const order = await Order.findById(booking.order);
  if (!order) return;
  const statusMap = {
    ticket_issued: 'ticket_added',
    delivered: 'delivered',
    completed: 'closed',
    cancelled: 'cancelled',
    voided: 'cancelled',
    refunded: 'cancelled',
    reissued: 'cancelled',
  };
  if (statusMap[status]) {
    order.status = statusMap[status];
    if (status === 'closed') order.closedAt = new Date();
    if (['cancelled', 'voided', 'refunded', 'reissued'].includes(status)) {
      order.cancelledAt = order.cancelledAt || new Date();
    }
    await order.save();
  }
}

async function fireBookingNotification(eventType, booking, customerDoc = null, extra = {}) {
  try {
    const customer = customerDoc || (booking.customer
      ? await Customer.findById(booking.customer).lean()
      : null);
    let ctx = buildBookingNotificationContext(booking, customer, extra);
    const supplierId = booking.supplier?._id || booking.supplier;
    if (supplierId) {
      const supplier = booking.supplier?.phone || booking.supplier?.name
        ? (typeof booking.supplier.toObject === 'function' ? booking.supplier.toObject() : booking.supplier)
        : await Supplier.findById(supplierId).lean();
      ctx = attachSupplierToContext(ctx, supplier, booking);
    }
    triggerNotificationEventSafe(eventType, ctx);
  } catch (err) {
    console.error('[notification] booking context failed', eventType, err.message);
  }
}

const BOOKING_STATUS_EVENTS = {
  cancelled: 'booking_canceled',
  confirmed: 'booking_approved',
  ticket_issued: 'ticket_issued',
  delivered: 'booking_delivered',
  completed: 'booking_delivered',
};

async function fireBookingStatusNotification(status, prevStatus, booking, extra = {}) {
  if (!status || status === prevStatus) return;
  const eventType = BOOKING_STATUS_EVENTS[status];
  if (!eventType) return;
  const statusLabel = BOOKING_STATUS_LABELS[status] || status;
  await fireBookingNotification(eventType, booking, null, {
    vars: { statusLabel, ...extra.vars },
  });
}

const BOOKING_UPDATE_NOTIFY_FIELDS = new Set([
  'supplierId', 'customerId', 'journeyType', 'fromDestination', 'toDestination',
  'travelClass', 'airline', 'route', 'sector', 'departureDate', 'returnDate',
  'pnr', 'ticketNumber', 'purchasePrice', 'salePrice', 'directCosts',
  'purchasePriceBRL', 'salePriceBRL', 'directCostsBRL', 'notes',
  'passengerCount', 'passengers', 'duePaymentAt',
]);

function hasMeaningfulBookingUpdate(data) {
  return Object.keys(data).some((key) => BOOKING_UPDATE_NOTIFY_FIELDS.has(key));
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
    voided: { count: 0, amount: 0 },
    refunded: { count: 0, amount: 0 },
    reissued: { count: 0, amount: 0 },
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
    } else if (b.status === 'voided') {
      summary.voided.count += 1;
      summary.voided.amount += sale;
    } else if (b.status === 'refunded') {
      summary.refunded.count += 1;
      summary.refunded.amount += sale;
    } else if (b.status === 'reissued') {
      summary.reissued.count += 1;
      summary.reissued.amount += sale;
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
    .populate('parentBooking', 'bookingNumber status')
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
    const amountBDT = brlToBdtRounded(customerPaidBRL, rate);
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
    const amountBDT = brlToBdtRounded(supplierPaidBRL, rate);
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
  const customerDoc = await Customer.findById(data.customerId).select('name').lean();
  if (!customerDoc) {
    throw ApiError.badRequest('Customer not found');
  }

  const bookingNumber = await generateBookingNumber();
  const currencyFields = await resolveBookingCurrencyFields(data);
  const departureDate = toBookingDate(data.departureDate, 'departure date');
  const returnDate = data.returnDate ? toBookingDate(data.returnDate, 'return date') : undefined;
  const duePaymentAt = data.duePaymentAt ? toBookingDate(data.duePaymentAt, 'due payment date') : undefined;

  const booking = new Booking({
    bookingNumber,
    order: orderDoc?._id || data.orderId,
    customer: data.customerId,
    supplier: data.supplierId,
    passengerName: data.passengers?.[0]?.fullName || customerDoc.name || '',
    journeyType: data.journeyType || 'one_way',
    fromDestination: data.fromDestination || '',
    toDestination: data.toDestination || '',
    travelClass: data.travelClass || 'economy',
    airline: data.airline,
    route: data.route,
    sector: data.sector,
    departureDate,
    returnDate,
    passengerCount: data.passengers?.length || data.passengerCount,
    passengers: data.passengers?.length ? data.passengers : undefined,
    flightSegment: data.flightSegment || undefined,
    fareBreakdown: data.fareBreakdown || (data.salePrice ? { grandTotal: data.salePrice } : undefined),
    fareSale: data.fareSale,
    farePurchase: data.farePurchase,
    fareCosts: data.fareCosts,
    usdRateAtBooking: data.usdRateAtBooking,
    duePaymentAt,
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
    bookingType: data.bookingType || 'standard',
    productCategory: data.productCategory || 'air',
    parentBooking: data.parentBookingId || data.parentBooking,
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

  const hasInitialPayment =
    (Number(data.customerPaidAmountBRL) || 0) > 0
    || (Number(data.supplierPaidAmountBRL) || 0) > 0;

  try {
    if (hasInitialPayment) {
      await recordInitialBookingPayments(booking, data, userId, req);
    } else {
      await syncBookingFinancials(booking._id);
    }
  } catch (paymentErr) {
    await Booking.findByIdAndDelete(booking._id);
    throw paymentErr;
  }

  await fireBookingNotification('admin_manual_booking_alert', booking, null, {
    vars: { approvalStatus: APPROVAL_STATUS_LABELS[booking.approvalStatus || 'pending'] },
  });

  const refreshed = await Booking.findById(booking._id).lean();
  if (!orderDoc) {
    await fireBookingNotification('manual_order_created', refreshed);
  } else if (refreshed.status !== 'draft') {
    await fireBookingNotification('manual_order_created', refreshed);
  }

  try {
    await recordIssueOperation(await Booking.findById(booking._id), userId);
  } catch (err) {
    console.error('[booking] issue operation record failed', err.message);
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
  const prevStatus = booking.status;
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
  if (data.departureDate) booking.departureDate = toBookingDate(data.departureDate, 'departure date');
  if (data.returnDate !== undefined) {
    booking.returnDate = data.returnDate ? toBookingDate(data.returnDate, 'return date') : undefined;
  }
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
  if (data.passengers !== undefined) {
    booking.passengers = data.passengers;
    if (data.passengers.length) booking.passengerCount = data.passengers.length;
  }
  if (data.flightSegment !== undefined) booking.flightSegment = data.flightSegment;
  if (data.fareBreakdown !== undefined) booking.fareBreakdown = data.fareBreakdown;
  if (data.fareSale !== undefined) booking.fareSale = data.fareSale;
  if (data.farePurchase !== undefined) booking.farePurchase = data.farePurchase;
  if (data.fareCosts !== undefined) booking.fareCosts = data.fareCosts;
  if (data.farePaid !== undefined) booking.farePaid = data.farePaid;
  if (data.usdRateAtBooking !== undefined) booking.usdRateAtBooking = data.usdRateAtBooking;
  if (data.duePaymentAt !== undefined) {
    booking.duePaymentAt = data.duePaymentAt ? toBookingDate(data.duePaymentAt, 'due payment date') : undefined;
  }

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
  } else if (data.status && data.status !== prevStatus) {
    await fireBookingStatusNotification(data.status, prevStatus, booking);
  } else if (hasMeaningfulBookingUpdate(data)) {
    await fireBookingNotification('booking_updated', booking);
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

  await syncLinkedOrderStatus(booking, status);

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

  if (status === 'cancelled' && prev !== 'cancelled') {
    await fireBookingNotification('booking_canceled', booking);
  }
  if (status === 'confirmed' && prev !== 'confirmed') {
    await fireBookingNotification('booking_approved', booking);
  }
  if (status === 'ticket_issued' && prev !== 'ticket_issued') {
    await fireBookingNotification('ticket_issued', booking);
  }
  if ((status === 'delivered' || status === 'completed') && !['delivered', 'completed'].includes(prev)) {
    await fireBookingStatusNotification(status, prev, booking);
  }

  return getBookingById(id);
}

export async function voidBooking(id, { reason, voidPayments = false } = {}, userId, req) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (TERMINAL_STATUSES.includes(booking.status)) {
    throw ApiError.badRequest('Booking is already closed or processed');
  }
  if (!['draft', 'confirmed'].includes(booking.status)) {
    throw ApiError.badRequest('Void is only allowed before ticket is issued');
  }
  if (booking.ticketCopyPath) {
    throw ApiError.badRequest('Remove ticket copy or use refund after ticket is issued');
  }

  if (voidPayments) {
    const customerPayments = await CustomerPayment.find({ booking: id, isVoided: false });
    for (const p of customerPayments) {
      await voidCustomerPayment(p._id.toString(), { reason: reason || 'Booking voided' }, userId, req);
    }
    const supplierPayments = await SupplierPayment.find({ booking: id, isVoided: false });
    for (const p of supplierPayments) {
      await voidSupplierPayment(p._id.toString(), { reason: reason || 'Booking voided' }, userId, req);
    }
  }

  booking.bookingType = 'void';
  booking.status = 'voided';
  booking.rrvNote = reason || '';
  booking.rrvProcessedAt = new Date();
  booking.rrvProcessedBy = userId;
  pushTimeline(booking, 'voided', reason || 'Booking voided', userId);
  await booking.save();

  await syncLinkedOrderStatus(booking, 'voided');

  await logAudit({
    action: 'update',
    module: 'bookings',
    entityType: 'Booking',
    entityId: booking._id,
    description: `Voided booking ${booking.bookingNumber}`,
    userId,
    req,
  });

  try {
    await recordVoidOperation(booking, reason, userId);
    await fireBookingNotification('void_done', booking);
  } catch (err) {
    console.error('[booking] void operation record failed', err.message);
  }

  return getBookingById(id);
}

export async function requestRefundBooking(id, data, userId, req) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (TERMINAL_STATUSES.includes(booking.status)) {
    throw ApiError.badRequest('Booking is already closed or processed');
  }
  if (!['ticket_issued', 'delivered', 'completed'].includes(booking.status)) {
    throw ApiError.badRequest('Refund request requires ticket to be issued');
  }
  if (booking.rrvNote && !booking.rrvProcessedAt) {
    throw ApiError.badRequest('A refund request is already pending approval');
  }

  const penalty = Math.max(0, Number(data.penalty) || 0);
  const paid = booking.amountPaid || 0;
  const proposedRefund = Math.max(0, paid - penalty);

  booking.rrvNote = data.reason || 'Refund requested';
  booking.rrvPenalty = penalty;
  pushTimeline(booking, 'refund_requested', booking.rrvNote, userId);
  await booking.save();

  await recordRefundRequestOperation(booking, { penalty, reason: data.reason }, userId);
  await fireBookingNotification('refund_requested', booking, null, {
    vars: { penalty, refundAmount: proposedRefund, reason: data.reason || '' },
  });

  await logAudit({
    action: 'update',
    module: 'bookings',
    entityType: 'Booking',
    entityId: booking._id,
    description: `Refund requested for ${booking.bookingNumber}`,
    userId,
    req,
  });

  return getBookingById(id);
}

export async function refundBooking(id, data, userId, req) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (TERMINAL_STATUSES.includes(booking.status)) {
    throw ApiError.badRequest('Booking is already closed or processed');
  }
  if (!['ticket_issued', 'delivered', 'completed'].includes(booking.status)) {
    throw ApiError.badRequest('Refund requires ticket to be issued');
  }

  const penalty = Math.max(0, Number(data.penalty) || 0);
  const paid = booking.amountPaid || 0;
  const maxRefund = Math.max(0, paid - penalty);
  const refundAmount = data.refundAmount != null
    ? Math.min(Math.max(0, Number(data.refundAmount)), maxRefund)
    : maxRefund;

  const hadPendingRequest = Boolean(booking.rrvNote && !booking.rrvProcessedAt);

  if (hadPendingRequest) {
    await fireBookingNotification('refund_approved', booking, null, {
      vars: { penalty, refundAmount, reason: data.reason || booking.rrvNote || '' },
    });
  }

  if (refundAmount > 0.01) {
    if (!data.accountId) throw ApiError.badRequest('Payment account is required for refund payout');
    const { paymentMethod } = await resolveAccountPaymentMethod(data.accountId);
    await createCustomerRefund({
      customerId: booking.customer.toString(),
      bookingId: id,
      accountId: data.accountId,
      amount: refundAmount,
      paymentDate: data.paymentDate || new Date().toISOString().slice(0, 10),
      paymentMethod,
      notes: data.reason ? `Refund: ${data.reason}` : `Refund for ${booking.bookingNumber}`,
    }, userId, req);
  }

  booking.bookingType = 'refund';
  booking.status = 'refunded';
  booking.rrvNote = data.reason || booking.rrvNote || '';
  booking.rrvPenalty = penalty;
  booking.rrvRefundAmount = refundAmount;
  booking.rrvProcessedAt = new Date();
  booking.rrvProcessedBy = userId;
  pushTimeline(booking, 'refunded', data.reason || `Refund ৳${refundAmount}`, userId);
  await booking.save();

  await syncLinkedOrderStatus(booking, 'refunded');

  await logAudit({
    action: 'update',
    module: 'bookings',
    entityType: 'Booking',
    entityId: booking._id,
    description: `Refunded booking ${booking.bookingNumber} — ৳${refundAmount}`,
    userId,
    req,
  });

  try {
    await recordRefundOperation(booking, { penalty, refundAmount, reason: data.reason }, userId);
    await fireBookingNotification('refund_paid', booking, null, {
      vars: { refundAmount, penalty },
    });
  } catch (err) {
    console.error('[booking] refund operation record failed', err.message);
  }

  return getBookingById(id);
}

export async function reissueBooking(id, data, userId, req) {
  const original = await Booking.findById(id);
  if (!original) throw ApiError.notFound('Booking not found');
  if (TERMINAL_STATUSES.includes(original.status)) {
    throw ApiError.badRequest('Booking is already closed or processed');
  }
  if (!['ticket_issued', 'delivered', 'completed', 'confirmed'].includes(original.status)) {
    throw ApiError.badRequest('Reissue requires a confirmed or ticketed booking');
  }

  const reissuePayload = {
    customerId: original.customer.toString(),
    supplierId: original.supplier?.toString(),
    journeyType: data.journeyType || original.journeyType,
    fromDestination: data.fromDestination || original.fromDestination,
    toDestination: data.toDestination || original.toDestination,
    travelClass: data.travelClass || original.travelClass,
    airline: data.airline || original.airline,
    route: data.route || original.route,
    sector: data.sector || original.sector,
    departureDate: data.departureDate || original.departureDate?.toISOString?.().slice(0, 10),
    returnDate: data.returnDate || (original.returnDate ? original.returnDate.toISOString().slice(0, 10) : undefined),
    passengerCount: data.passengerCount || original.passengerCount,
    pnr: data.pnr || '',
    ticketNumber: data.ticketNumber || '',
    purchasePrice: data.purchasePrice ?? original.purchasePrice,
    salePrice: data.salePrice ?? original.salePrice,
    directCosts: data.directCosts ?? original.directCosts,
    notes: data.notes || `Reissue from ${original.bookingNumber}`,
    status: 'confirmed',
    bookingType: 'standard',
    parentBookingId: id,
  };

  const newBooking = await createBookingRecord(reissuePayload, userId, req);

  original.bookingType = 'reissue';
  original.status = 'reissued';
  original.rrvNote = data.reason || `Reissued as ${newBooking.bookingNumber}`;
  original.rrvProcessedAt = new Date();
  original.rrvProcessedBy = userId;
  pushTimeline(original, 'reissued', original.rrvNote, userId);
  await original.save();

  await syncLinkedOrderStatus(original, 'reissued');

  await logAudit({
    action: 'update',
    module: 'bookings',
    entityType: 'Booking',
    entityId: original._id,
    description: `Reissued ${original.bookingNumber} → ${newBooking.bookingNumber}`,
    userId,
    req,
  });

  try {
    const newDoc = await Booking.findById(newBooking.id || newBooking._id);
    await recordReissueOperation(original, newDoc || { ...newBooking, _id: newBooking.id }, data.reason, userId);
    await fireBookingNotification('reissue_done', original, null, {
      vars: { newBookingNumber: newBooking.bookingNumber },
    });
  } catch (err) {
    console.error('[booking] reissue operation record failed', err.message);
  }

  return { original: await getBookingById(id), newBooking };
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

  await fireBookingNotification('passport_received', booking, null, {
    vars: { referenceNumber: booking.bookingNumber },
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

export async function listUpcomingFlights(query = {}) {
  const limit = Math.min(Number(query.limit) || 50, 100);
  const now = new Date();
  const filter = {
    productCategory: 'air',
    departureDate: { $gte: now },
    status: { $nin: ['cancelled', 'voided', 'refunded'] },
  };
  if (query.customerId) filter.customer = query.customerId;

  const items = await Booking.find(filter)
    .sort({ departureDate: 1 })
    .limit(limit)
    .populate('customer', 'name phone email')
    .lean();

  return items.map((b) => ({
    id: b._id.toString(),
    bookingNumber: b.bookingNumber,
    customerName: b.customer?.name,
    customerPhone: b.customer?.phone,
    customerEmail: b.customer?.email,
    airline: b.airline,
    route: b.route,
    fromDestination: b.fromDestination,
    toDestination: b.toDestination,
    departureDate: b.departureDate,
    pnr: b.pnr,
    status: b.status,
    customerDue: b.customerDue,
    duePaymentAt: b.duePaymentAt,
    passengerCount: b.passengerCount,
  }));
}

export async function extractTicketData(file) {
  if (!file) throw ApiError.badRequest('No ticket file uploaded');
  const filePath = file.path;
  const extracted = await extractTicketFromFile(filePath, file.mimetype);
  return extracted;
}

export async function recordScheduleChange(id, data, userId, req) {
  const booking = await Booking.findById(id).populate('customer', 'name phone email');
  if (!booking) throw ApiError.notFound('Booking not found');

  const previousDepartureDate = booking.departureDate;
  const previousRoute = booking.route;

  if (data.departureDate) booking.departureDate = new Date(data.departureDate);
  if (data.route) booking.route = data.route;
  if (data.fromDestination) booking.fromDestination = data.fromDestination;
  if (data.toDestination) booking.toDestination = data.toDestination;
  if (data.airline) booking.airline = data.airline;
  if (data.pnr !== undefined) booking.pnr = data.pnr;
  if (data.flightSegment) booking.flightSegment = { ...booking.flightSegment?.toObject?.() || booking.flightSegment || {}, ...data.flightSegment };

  let ticketPath = '';
  let ticketName = '';
  if (data.ticketCopyPath) {
    ticketPath = data.ticketCopyPath;
    ticketName = data.ticketCopyFileName || '';
    booking.ticketCopyPath = ticketPath;
    booking.ticketCopyFileName = ticketName;
  }

  booking.scheduleChangeHistory = booking.scheduleChangeHistory || [];
  booking.scheduleChangeHistory.push({
    previousDepartureDate,
    newDepartureDate: booking.departureDate,
    previousRoute,
    newRoute: booking.route,
    ticketCopyPath: ticketPath,
    ticketCopyFileName: ticketName,
    note: data.note || 'Schedule changed',
    changedBy: userId,
    changedAt: new Date(),
  });

  pushTimeline(booking, booking.status, data.note || 'Schedule changed', userId);
  await booking.save();

  await fireBookingNotification('schedule_change', booking, null, {
    vars: {
      previousDate: previousDepartureDate?.toISOString?.()?.slice(0, 10) || '',
      newDate: booking.departureDate?.toISOString?.()?.slice(0, 10) || '',
      route: booking.route,
    },
  });

  await logAudit({
    action: 'update',
    module: 'bookings',
    entityType: 'Booking',
    entityId: booking._id,
    description: `Schedule change recorded for ${booking.bookingNumber}`,
    userId,
    req,
  });

  return getBookingById(id);
}

export async function uploadBookingTicketCopyWithExtract(id, file, userId, req) {
  const result = await uploadBookingTicketCopy(id, file, userId, req);
  if (!file) return result;

  try {
    const extracted = await extractTicketFromFile(file.path, file.mimetype);
    const booking = await Booking.findById(id);
    if (booking && extracted.confidence > 0) {
      if (extracted.pnr) booking.pnr = extracted.pnr;
      if (extracted.airline) booking.airline = extracted.airline;
      if (extracted.route) booking.route = extracted.route;
      if (extracted.fromDestination) booking.fromDestination = extracted.fromDestination;
      if (extracted.toDestination) booking.toDestination = extracted.toDestination;
      if (extracted.departureDate) booking.departureDate = new Date(extracted.departureDate);
      if (extracted.ticketNumber) booking.ticketNumber = extracted.ticketNumber;
      if (extracted.passengers?.length) {
        booking.passengers = extracted.passengers;
        booking.passengerCount = extracted.passengers.length;
      }
      if (extracted.flightNumber) {
        booking.flightSegment = {
          ...(booking.flightSegment?.toObject?.() || booking.flightSegment || {}),
          flightNumber: extracted.flightNumber,
          airlinePnr: extracted.pnr || booking.pnr,
        };
      }
      booking.ocrExtractedAt = new Date();
      booking.ocrSource = file.originalname;
      await booking.save();
    }
    return { ...result, extracted };
  } catch {
    return result;
  }
}

export default {
  listBookings,
  getBookingsSummary,
  getBookingById,
  createBooking,
  createBookingFromOrder,
  updateBooking,
  updateBookingStatus,
  voidBooking,
  requestRefundBooking,
  refundBooking,
  reissueBooking,
  updateBookingApproval,
  uploadBookingPassport,
  uploadBookingTicketCopy,
  uploadBookingTicketCopyWithExtract,
  extractTicketData,
  listUpcomingFlights,
  recordScheduleChange,
  addBookingNote,
  getBookingTimeline,
  deleteBooking,
};
