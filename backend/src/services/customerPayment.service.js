import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';
import CustomerPayment from '../models/CustomerPayment.js';
import ApiError from '../utils/ApiError.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
  buildSearchFilter,
} from '../utils/pagination.js';
import { withTransaction, postCredit, derivePaymentStatus } from './ledger.service.js';
import { generateCustomerPaymentNumber } from './numberGenerator.service.js';
import { syncBookingFinancials, syncCustomerTotals } from './financialSync.service.js';
import { logAudit } from './audit.service.js';

function formatPayment(doc) {
  return {
    id: doc._id.toString(),
    paymentNumber: doc.paymentNumber,
    customer: doc.customer?._id?.toString() || doc.customer?.toString(),
    customerName: doc.customer?.name,
    booking: doc.booking?._id?.toString() || doc.booking?.toString() || null,
    bookingNumber: doc.booking?.bookingNumber,
    order: doc.order?.toString() || null,
    account: doc.account?._id?.toString() || doc.account?.toString(),
    accountName: doc.account?.name,
    amount: doc.amount,
    paymentDate: doc.paymentDate,
    paymentMethod: doc.paymentMethod || '',
    referenceNumber: doc.referenceNumber || '',
    notes: doc.notes || '',
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

export async function listCustomerPayments(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'paymentDate');
  const filter = { isVoided: false, ...buildSearchFilter(query.search, ['paymentNumber', 'referenceNumber']) };

  if (query.customerId) filter.customer = query.customerId;
  if (query.bookingId) filter.booking = query.bookingId;

  if (query.dateFrom || query.dateTo) {
    filter.paymentDate = {};
    if (query.dateFrom) filter.paymentDate.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.paymentDate.$lte = end;
    }
  }

  const [items, total] = await Promise.all([
    CustomerPayment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name phone')
      .populate('booking', 'bookingNumber')
      .populate('account', 'name type')
      .lean(),
    CustomerPayment.countDocuments(filter),
  ]);

  return {
    items: items.map(formatPayment),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getCustomerPaymentById(id) {
  const payment = await CustomerPayment.findOne({ _id: id, isVoided: false })
    .populate('customer', 'name phone email totalDue')
    .populate('booking', 'bookingNumber salePrice amountPaid customerDue profit')
    .populate('account', 'name type')
    .lean();

  if (!payment) throw ApiError.notFound('Payment not found');
  return formatPayment(payment);
}

export async function createCustomerPayment(data, userId, req) {
  return withTransaction(async (session) => {
    const customer = await Customer.findById(data.customerId).session(session);
    if (!customer) throw ApiError.notFound('Customer not found');

    let booking = null;
    if (data.bookingId) {
      booking = await Booking.findById(data.bookingId).session(session);
      if (!booking) throw ApiError.notFound('Booking not found');
      if (booking.customer.toString() !== data.customerId) {
        throw ApiError.badRequest('Booking does not belong to this customer');
      }
    }

    const paymentNumber = await generateCustomerPaymentNumber();
    let status = 'paid';
    if (booking) {
      const newPaid = (booking.amountPaid || 0) + data.amount;
      status = derivePaymentStatus(newPaid, booking.salePrice);
    }

    const [payment] = await CustomerPayment.create(
      [{
        paymentNumber,
        customer: data.customerId,
        booking: data.bookingId,
        order: data.orderId,
        account: data.accountId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        notes: data.notes || '',
        status,
        createdBy: userId,
      }],
      { session }
    );

    await postCredit({
      type: 'customer_payment',
      accountId: data.accountId,
      amount: data.amount,
      transactionDate: new Date(data.paymentDate),
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      notes: data.notes || `Customer payment ${paymentNumber}`,
      customerId: data.customerId,
      bookingId: data.bookingId,
      orderId: data.orderId,
      customerPaymentId: payment._id,
      userId,
    }, session);

    if (booking) {
      booking.amountPaid = (booking.amountPaid || 0) + data.amount;
      await booking.save({ session });
      await syncBookingFinancials(booking._id, session);
    } else {
      await syncCustomerTotals(data.customerId, session);
    }

    await logAudit({
      action: 'create',
      module: 'payments',
      entityType: 'CustomerPayment',
      entityId: payment._id,
      description: `Customer payment ${paymentNumber}: ৳${data.amount}`,
      userId,
      req,
    });

    const populated = await CustomerPayment.findById(payment._id)
      .populate('customer', 'name')
      .populate('booking', 'bookingNumber')
      .populate('account', 'name')
      .lean();

    return formatPayment(populated);
  });
}

export default { listCustomerPayments, getCustomerPaymentById, createCustomerPayment };
