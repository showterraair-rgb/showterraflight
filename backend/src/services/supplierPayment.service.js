import Supplier from '../models/Supplier.js';
import Booking from '../models/Booking.js';
import SupplierPayment from '../models/SupplierPayment.js';
import ApiError from '../utils/ApiError.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
  buildSearchFilter,
} from '../utils/pagination.js';
import { withTransaction, postDebit, derivePaymentStatus } from './ledger.service.js';
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
    }

    const paymentNumber = await generateSupplierPaymentNumber();
    const purchaseTotal = booking
      ? (booking.purchasePrice || 0) + (booking.directCosts || 0)
      : 0;
    let status = 'paid';
    if (booking) {
      const newPaid = (booking.supplierPaid || 0) + data.amount;
      status = derivePaymentStatus(newPaid, purchaseTotal);
    }

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
        notes: data.notes || '',
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
      booking.supplierPaid = (booking.supplierPaid || 0) + data.amount;
      if (!booking.supplier) booking.supplier = data.supplierId;
      await booking.save({ session });
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

export default { listSupplierPayments, getSupplierPaymentById, createSupplierPayment };
