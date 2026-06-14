import Supplier from '../models/Supplier.js';

import Booking from '../models/Booking.js';

import SupplierPayment from '../models/SupplierPayment.js';

import ApiError from '../utils/ApiError.js';

import {

  parsePaginationQuery,

  buildPaginationResponse,

  buildSearchFilter,

} from '../utils/pagination.js';

import { withTransaction, postDebit, postCredit, derivePaymentStatus } from './ledger.service.js';

import { generateSupplierPaymentNumber } from './numberGenerator.service.js';

import { syncBookingFinancials, syncSupplierTotals } from './financialSync.service.js';

import { logAudit } from './audit.service.js';



function formatPayment(doc) {

  return {

    id: doc._id.toString(),

    paymentNumber: doc.paymentNumber,

    supplier: doc.supplier?._id?.toString() || doc.supplier?.toString(),

    supplierName: doc.supplier?.name,

    booking: doc.booking?._id?.toString() || doc.booking?.toString() || null,

    bookingNumber: doc.booking?.bookingNumber,

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



export async function listSupplierPayments(query) {

  const { page, limit, skip, sort } = parsePaginationQuery(query, 'paymentDate');

  const filter = { isVoided: false, ...buildSearchFilter(query.search, ['paymentNumber', 'referenceNumber']) };



  if (query.supplierId) filter.supplier = query.supplierId;

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

    SupplierPayment.find(filter)

      .sort(sort)

      .skip(skip)

      .limit(limit)

      .populate('supplier', 'name')

      .populate('booking', 'bookingNumber')

      .populate('account', 'name type')

      .lean(),

    SupplierPayment.countDocuments(filter),

  ]);



  return {

    items: items.map(formatPayment),

    pagination: buildPaginationResponse({ page, limit, total }),

  };

}



export async function getSupplierPaymentById(id) {

  const payment = await SupplierPayment.findOne({ _id: id, isVoided: false })

    .populate('supplier', 'name company totalPayable')

    .populate('booking', 'bookingNumber purchasePrice supplierPaid supplierPayable')

    .populate('account', 'name type')

    .lean();



  if (!payment) throw ApiError.notFound('Payment not found');

  return formatPayment(payment);

}



export async function createSupplierPayment(data, userId, req) {

  return withTransaction(async (session) => {

    const supplier = await Supplier.findById(data.supplierId).session(session);

    if (!supplier) throw ApiError.notFound('Supplier not found');



    let booking = null;

    if (data.bookingId) {

      booking = await Booking.findById(data.bookingId).session(session);

      if (!booking) throw ApiError.notFound('Booking not found');

      if (booking.supplier && booking.supplier.toString() !== data.supplierId) {

        throw ApiError.badRequest('Booking is linked to a different supplier');

      }



      if (!data.onAccount) {
        const paidAgg = await SupplierPayment.aggregate([
          { $match: { booking: booking._id, isVoided: false } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]).session(session);
        const paidSoFar = paidAgg[0]?.total || 0;
        const purchaseTotal = (booking.purchasePrice || 0) + (booking.directCosts || 0);
        const payable = Math.max(0, purchaseTotal - paidSoFar);
        if (data.amount > payable + 0.001) {
          throw ApiError.badRequest(
            `Amount exceeds supplier payable (৳${payable}). Mark as on-account or reduce amount.`
          );
        }
      }

    }



    const paymentNumber = await generateSupplierPaymentNumber();

    const purchaseTotal = booking

      ? (booking.purchasePrice || 0) + (booking.directCosts || 0)

      : 0;

    const status = booking

      ? derivePaymentStatus((booking.supplierPaid || 0) + data.amount, purchaseTotal)

      : 'paid';



    const [payment] = await SupplierPayment.create(

      [{

        paymentNumber,

        supplier: data.supplierId,

        booking: data.bookingId,

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



    await postDebit({

      type: 'supplier_payment',

      accountId: data.accountId,

      amount: data.amount,

      transactionDate: new Date(data.paymentDate),

      paymentMethod: data.paymentMethod,

      referenceNumber: data.referenceNumber,

      notes: data.notes || `Supplier payment ${paymentNumber}`,

      supplierId: data.supplierId,

      bookingId: data.bookingId,

      supplierPaymentId: payment._id,

      userId,

    }, session);



    if (booking) {

      if (!booking.supplier) {

        booking.supplier = data.supplierId;

        await booking.save({ session });

      }

      await syncBookingFinancials(booking._id, session);

    } else {

      await syncSupplierTotals(data.supplierId, session);

    }



    await logAudit({

      action: 'create',

      module: 'payments',

      entityType: 'SupplierPayment',

      entityId: payment._id,

      description: `Supplier payment ${paymentNumber}: ৳${data.amount}`,

      userId,

      req,

    });



    const populated = await SupplierPayment.findById(payment._id)

      .populate('supplier', 'name')

      .populate('booking', 'bookingNumber')

      .populate('account', 'name')

      .lean();



    return formatPayment(populated);

  });

}



export async function voidSupplierPayment(id, { reason } = {}, userId, req) {

  return withTransaction(async (session) => {

    const payment = await SupplierPayment.findOne({ _id: id, isVoided: false }).session(session);

    if (!payment) throw ApiError.notFound('Payment not found');



    payment.isVoided = true;

    await payment.save({ session });



    await postCredit({

      type: 'refund',

      accountId: payment.account,

      amount: payment.amount,

      transactionDate: new Date(),

      notes: reason || `Void supplier payment ${payment.paymentNumber}`,

      supplierId: payment.supplier,

      bookingId: payment.booking,

      supplierPaymentId: payment._id,

      userId,

    }, session);



    if (payment.booking) {

      await syncBookingFinancials(payment.booking, session);

    } else {

      await syncSupplierTotals(payment.supplier, session);

    }



    await logAudit({

      action: 'delete',

      module: 'payments',

      entityType: 'SupplierPayment',

      entityId: payment._id,

      description: `Voided supplier payment ${payment.paymentNumber}`,

      userId,

      req,

    });



    return { id, voided: true, message: 'Supplier payment voided' };

  });

}



export default { listSupplierPayments, getSupplierPaymentById, createSupplierPayment, voidSupplierPayment };


