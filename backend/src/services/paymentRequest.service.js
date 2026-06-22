import PaymentRequest from '../models/PaymentRequest.js';
import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
} from '../utils/pagination.js';
import { generatePaymentRequestNumber } from './numberGenerator.service.js';
import { createCustomerPayment } from './customerPayment.service.js';
import { logAudit } from './audit.service.js';
import { triggerNotificationEventSafe } from './notificationOrchestrator.service.js';
import { buildBookingNotificationContext } from '../utils/notificationContext.js';

function formatPaymentRequest(doc) {
  return {
    id: doc._id.toString(),
    requestNumber: doc.requestNumber,
    customer: doc.customer?._id?.toString() || doc.customer?.toString(),
    customerName: doc.customer?.name,
    customerPhone: doc.customer?.phone,
    booking: doc.booking?._id?.toString() || doc.booking?.toString() || null,
    bookingNumber: doc.booking?.bookingNumber,
    amount: doc.amount,
    dueDate: doc.dueDate,
    status: doc.status,
    notes: doc.notes || '',
    customerPayment: doc.customerPayment?.toString() || null,
    sentAt: doc.sentAt,
    paidAt: doc.paidAt,
    cancelledAt: doc.cancelledAt,
    cancelReason: doc.cancelReason || '',
    createdAt: doc.createdAt,
  };
}

export async function listPaymentRequests(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'dueDate');
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.customerId) filter.customer = query.customerId;
  if (query.bookingId) filter.booking = query.bookingId;

  const [items, total] = await Promise.all([
    PaymentRequest.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name phone')
      .populate('booking', 'bookingNumber customerDue')
      .lean(),
    PaymentRequest.countDocuments(filter),
  ]);

  return {
    items: items.map(formatPaymentRequest),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getPaymentRequestById(id) {
  const doc = await PaymentRequest.findById(id)
    .populate('customer', 'name phone email')
    .populate('booking', 'bookingNumber salePrice customerDue')
    .lean();
  if (!doc) throw ApiError.notFound('Payment request not found');
  return formatPaymentRequest(doc);
}

export async function createPaymentRequest(data, userId, req) {
  const customer = await Customer.findById(data.customerId);
  if (!customer) throw ApiError.notFound('Customer not found');

  let booking = null;
  if (data.bookingId) {
    booking = await Booking.findById(data.bookingId);
    if (!booking) throw ApiError.notFound('Booking not found');
    if (booking.customer.toString() !== data.customerId) {
      throw ApiError.badRequest('Booking does not belong to this customer');
    }
  }

  const requestNumber = await generatePaymentRequestNumber();
  const request = await PaymentRequest.create({
    requestNumber,
    customer: data.customerId,
    booking: data.bookingId,
    amount: data.amount,
    dueDate: new Date(data.dueDate),
    notes: data.notes || '',
    sentAt: data.sendNotification !== false ? new Date() : undefined,
    createdBy: userId,
  });

  if (data.sendNotification !== false && customer.phone) {
    const ctx = booking
      ? buildBookingNotificationContext(booking, customer, { vars: { dueAmount: String(data.amount) } })
      : {
          customerName: customer.name,
          customerPhone: customer.phone,
          dueAmount: String(data.amount),
          bookingNumber: requestNumber,
        };
    triggerNotificationEventSafe('payment_due_reminder', ctx);
  }

  await logAudit({
    action: 'create',
    module: 'payments',
    entityType: 'PaymentRequest',
    entityId: request._id,
    description: `Payment request ${requestNumber} — ৳${data.amount}`,
    userId,
    req,
  });

  return getPaymentRequestById(request._id);
}

export async function cancelPaymentRequest(id, { reason } = {}, userId, req) {
  const request = await PaymentRequest.findById(id);
  if (!request) throw ApiError.notFound('Payment request not found');
  if (request.status !== 'pending') throw ApiError.badRequest('Only pending requests can be cancelled');

  request.status = 'cancelled';
  request.cancelledAt = new Date();
  request.cancelReason = reason || '';
  await request.save();

  await logAudit({
    action: 'update',
    module: 'payments',
    entityType: 'PaymentRequest',
    entityId: request._id,
    description: `Cancelled payment request ${request.requestNumber}`,
    userId,
    req,
  });

  return getPaymentRequestById(id);
}

export async function recordPaymentForRequest(id, data, userId, req) {
  const request = await PaymentRequest.findById(id);
  if (!request) throw ApiError.notFound('Payment request not found');
  if (request.status !== 'pending') throw ApiError.badRequest('Request is not pending');

  const payment = await createCustomerPayment({
    customerId: request.customer.toString(),
    bookingId: request.booking?.toString(),
    accountId: data.accountId,
    amount: request.amount,
    paymentDate: data.paymentDate || new Date().toISOString().slice(0, 10),
    paymentMethod: data.paymentMethod || 'Bank Transfer',
    referenceNumber: data.referenceNumber,
    notes: `Payment for request ${request.requestNumber}`,
    onAccount: !request.booking,
  }, userId, req);

  request.status = 'paid';
  request.paidAt = new Date();
  request.customerPayment = payment.id;
  await request.save();

  await logAudit({
    action: 'update',
    module: 'payments',
    entityType: 'PaymentRequest',
    entityId: request._id,
    description: `Payment recorded for request ${request.requestNumber}`,
    userId,
    req,
  });

  return { request: await getPaymentRequestById(id), payment };
}

export default {
  listPaymentRequests,
  getPaymentRequestById,
  createPaymentRequest,
  cancelPaymentRequest,
  recordPaymentForRequest,
};
