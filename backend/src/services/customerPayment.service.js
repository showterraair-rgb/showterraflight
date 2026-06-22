import Customer from '../models/Customer.js';

import Booking from '../models/Booking.js';

import CustomerPayment from '../models/CustomerPayment.js';

import ApiError from '../utils/ApiError.js';

import {

  parsePaginationQuery,

  buildPaginationResponse,

  buildSearchFilter,

} from '../utils/pagination.js';

import { withTransaction, postCredit, postDebit, derivePaymentStatus } from './ledger.service.js';

import { generateCustomerPaymentNumber } from './numberGenerator.service.js';

import { syncBookingFinancials, syncCustomerTotals } from './financialSync.service.js';

import { logAudit } from './audit.service.js';

import { triggerNotificationEventSafe } from './notificationOrchestrator.service.js';

import { buildPaymentNotificationContext } from '../utils/notificationContext.js';



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

    isRefund: Boolean(doc.isRefund),

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



      if (!data.onAccount) {
        const paidAgg = await CustomerPayment.aggregate([
          { $match: { booking: booking._id, isVoided: false } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]).session(session);
        const paidSoFar = paidAgg[0]?.total || 0;
        const due = Math.max(0, (booking.salePrice || 0) - paidSoFar);
        if (data.amount > due + 0.001) {
          throw ApiError.badRequest(
            `Amount exceeds customer due (৳${due}). Mark as on-account advance or reduce amount.`
          );
        }
      }

    }



    const paymentNumber = await generateCustomerPaymentNumber();

    const status = booking

      ? derivePaymentStatus((booking.amountPaid || 0) + data.amount, booking.salePrice)

      : 'paid';



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

        notes: data.notes || (data.onAccount && !data.bookingId ? '[On-account advance]' : ''),

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

      .populate('customer', 'name phone email')

      .populate('booking', 'bookingNumber')

      .populate('account', 'name')

      .lean();



    triggerNotificationEventSafe(

      'payment_received',

      buildPaymentNotificationContext(populated, populated.customer, populated.booking)

    );



    return formatPayment(populated);

  });

}



export async function createCustomerRefund(data, userId, req) {

  return withTransaction(async (session) => {

    const customer = await Customer.findById(data.customerId).session(session);

    if (!customer) throw ApiError.notFound('Customer not found');



    const booking = await Booking.findById(data.bookingId).session(session);

    if (!booking) throw ApiError.notFound('Booking not found');

    if (booking.customer.toString() !== data.customerId) {

      throw ApiError.badRequest('Booking does not belong to this customer');

    }



    if (data.amount <= 0) throw ApiError.badRequest('Refund amount must be positive');



    const paymentNumber = await generateCustomerPaymentNumber();

    const [payment] = await CustomerPayment.create(

      [{

        paymentNumber,

        customer: data.customerId,

        booking: data.bookingId,

        account: data.accountId,

        amount: data.amount,

        paymentDate: new Date(data.paymentDate || Date.now()),

        paymentMethod: data.paymentMethod || 'Bank Transfer',

        referenceNumber: data.referenceNumber,

        notes: data.notes || '[Customer refund]',

        status: 'paid',

        isRefund: true,

        createdBy: userId,

      }],

      { session }

    );



    await postDebit({

      type: 'refund',

      accountId: data.accountId,

      amount: data.amount,

      transactionDate: new Date(data.paymentDate || Date.now()),

      paymentMethod: data.paymentMethod || 'Bank Transfer',

      referenceNumber: data.referenceNumber,

      notes: data.notes || `Refund ${paymentNumber}`,

      customerId: data.customerId,

      bookingId: data.bookingId,

      customerPaymentId: payment._id,

      userId,

    }, session);



    await syncBookingFinancials(data.bookingId, session);



    await logAudit({

      action: 'create',

      module: 'payments',

      entityType: 'CustomerPayment',

      entityId: payment._id,

      description: `Customer refund ${paymentNumber} — ৳${data.amount}`,

      userId,

      req,

    });



    const populated = await CustomerPayment.findById(payment._id)

      .populate('customer', 'name phone')

      .populate('booking', 'bookingNumber')

      .populate('account', 'name type')

      .session(session)

      .lean();



    return formatPayment(populated);

  });

}



export async function voidCustomerPayment(id, { reason } = {}, userId, req) {

  return withTransaction(async (session) => {

    const payment = await CustomerPayment.findOne({ _id: id, isVoided: false }).session(session);

    if (!payment) throw ApiError.notFound('Payment not found');



    payment.isVoided = true;

    await payment.save({ session });



    await postDebit({

      type: 'refund',

      accountId: payment.account,

      amount: payment.amount,

      transactionDate: new Date(),

      notes: reason || `Void customer payment ${payment.paymentNumber}`,

      customerId: payment.customer,

      bookingId: payment.booking,

      customerPaymentId: payment._id,

      userId,

    }, session);



    if (payment.booking) {

      await syncBookingFinancials(payment.booking, session);

    } else {

      await syncCustomerTotals(payment.customer, session);

    }



    await logAudit({

      action: 'delete',

      module: 'payments',

      entityType: 'CustomerPayment',

      entityId: payment._id,

      description: `Voided customer payment ${payment.paymentNumber}`,

      userId,

      req,

    });



    return { id, voided: true, message: 'Customer payment voided' };

  });

}



export default { listCustomerPayments, getCustomerPaymentById, createCustomerPayment, createCustomerRefund, voidCustomerPayment };


