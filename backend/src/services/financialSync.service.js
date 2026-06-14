import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import CustomerPayment from '../models/CustomerPayment.js';
import SupplierPayment from '../models/SupplierPayment.js';
import { derivePaymentStatus } from './ledger.service.js';

/**
 * Recalculate booking payment statuses after amountPaid/supplierPaid change.
 */
export async function syncBookingFinancials(bookingId, session) {
  const booking = await Booking.findById(bookingId).session(session);
  if (!booking) return;

  const purchaseTotal = (booking.purchasePrice || 0) + (booking.directCosts || 0);
  booking.paymentStatus = derivePaymentStatus(booking.amountPaid, booking.salePrice);
  booking.supplierPaymentStatus = derivePaymentStatus(booking.supplierPaid, purchaseTotal);
  await booking.save({ session });

  await syncCustomerTotals(booking.customer, session);
  if (booking.supplier) await syncSupplierTotals(booking.supplier, session);
}

export async function syncCustomerTotals(customerId, session) {
  if (!customerId) return;

  const bookings = await Booking.find({ customer: customerId }).session(session).lean();
  const payments = await CustomerPayment.find({ customer: customerId, isVoided: false }).session(session).lean();

  const totalSales = bookings.reduce((s, b) => s + (b.salePrice || 0), 0);
  const totalDue = bookings.reduce((s, b) => s + (b.customerDue || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);

  await Customer.updateOne(
    { _id: customerId },
    { totalSales, totalDue, totalPaid },
    { session }
  );
}

export async function syncSupplierTotals(supplierId, session) {
  if (!supplierId) return;

  const bookings = await Booking.find({ supplier: supplierId }).session(session).lean();
  const payments = await SupplierPayment.find({ supplier: supplierId, isVoided: false }).session(session).lean();

  const totalPayable = bookings.reduce((s, b) => s + (b.supplierPayable || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);

  await Supplier.updateOne(
    { _id: supplierId },
    { totalPayable, totalPaid },
    { session }
  );
}

export default { syncBookingFinancials, syncCustomerTotals, syncSupplierTotals };
