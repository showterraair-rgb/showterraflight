import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import CustomerPayment from '../models/CustomerPayment.js';
import SupplierPayment from '../models/SupplierPayment.js';
import { derivePaymentStatus } from './ledger.service.js';

function applySession(query, session) {
  return session ? query.session(session) : query;
}

/**
 * Derive amountPaid / supplierPaid from payment records (single source of truth).
 */
export async function recalculateBookingPaidFromPayments(bookingId, session = null) {
  const booking = await applySession(Booking.findById(bookingId), session);
  if (!booking) return null;

  const [customerPayments, supplierPayments] = await Promise.all([
    applySession(CustomerPayment.find({ booking: bookingId, isVoided: false }), session).lean(),
    applySession(SupplierPayment.find({ booking: bookingId, isVoided: false }), session).lean(),
  ]);

  booking.amountPaid = customerPayments.reduce((s, p) => {
    const amt = p.amount || 0;
    return s + (p.isRefund ? -amt : amt);
  }, 0);
  booking.amountPaid = Math.max(0, booking.amountPaid);
  booking.supplierPaid = supplierPayments.reduce((s, p) => s + (p.amount || 0), 0);

  const purchaseTotal = (booking.purchasePrice || 0) + (booking.directCosts || 0);
  booking.paymentStatus = derivePaymentStatus(booking.amountPaid, booking.salePrice);
  booking.supplierPaymentStatus = derivePaymentStatus(booking.supplierPaid, purchaseTotal);

  await booking.save(session ? { session } : undefined);
  return booking;
}

/**
 * Recalculate booking payment statuses and sync customer/supplier aggregates.
 */
export async function syncBookingFinancials(bookingId, session = null) {
  await recalculateBookingPaidFromPayments(bookingId, session);

  const booking = await applySession(Booking.findById(bookingId), session);
  if (!booking) return;

  await syncCustomerTotals(booking.customer, session);
  if (booking.supplier) await syncSupplierTotals(booking.supplier, session);
}

export async function syncCustomerTotals(customerId, session = null) {
  if (!customerId) return;

  const bookings = await applySession(Booking.find({ customer: customerId }), session).lean();
  const payments = await applySession(
    CustomerPayment.find({ customer: customerId, isVoided: false }),
    session
  ).lean();

  const totalSales = bookings.reduce((s, b) => s + (b.salePrice || 0), 0);
  const totalDue = bookings.reduce((s, b) => s + (b.customerDue || 0), 0);
  const totalPaid = payments.reduce((s, p) => {
    const amt = p.amount || 0;
    return s + (p.isRefund ? -amt : amt);
  }, 0);

  await Customer.updateOne(
    { _id: customerId },
    { totalSales, totalDue, totalPaid },
    session ? { session } : undefined
  );
}

export async function syncSupplierTotals(supplierId, session = null) {
  if (!supplierId) return;

  const bookings = await applySession(Booking.find({ supplier: supplierId }), session).lean();
  const payments = await applySession(
    SupplierPayment.find({ supplier: supplierId, isVoided: false }),
    session
  ).lean();

  const totalPayable = bookings.reduce((s, b) => s + (b.supplierPayable || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);

  await Supplier.updateOne(
    { _id: supplierId },
    { totalPayable, totalPaid },
    session ? { session } : undefined
  );
}

export default {
  recalculateBookingPaidFromPayments,
  syncBookingFinancials,
  syncCustomerTotals,
  syncSupplierTotals,
};
