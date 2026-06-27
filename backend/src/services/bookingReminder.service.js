import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import ApiError from '../utils/ApiError.js';
import { buildBookingNotificationContext } from '../utils/notificationContext.js';
import { buildSupplierBookingNotificationContext } from '../utils/supplierNotificationContext.js';
import { triggerNotificationEventWithChannels } from './notificationOrchestrator.service.js';

const ACTIVE_BOOKING_FILTER = { status: { $nin: ['voided', 'cancelled', 'refunded'] } };

function formatBookingAccountRow(doc, party) {
  const purchaseTotal = (doc.purchasePrice || 0) + (doc.directCosts || 0);
  const row = {
    bookingId: doc._id.toString(),
    bookingNumber: doc.bookingNumber,
    route: doc.route || '',
    departureDate: doc.departureDate,
    status: doc.status,
    duePaymentAt: doc.duePaymentAt,
  };

  if (party === 'customer') {
    return {
      ...row,
      salePrice: doc.salePrice || 0,
      amountPaid: doc.amountPaid || 0,
      due: doc.customerDue || 0,
      paymentStatus: doc.paymentStatus,
    };
  }

  return {
    ...row,
    purchasePrice: doc.purchasePrice || 0,
    directCosts: doc.directCosts || 0,
    purchaseTotal,
    amountPaid: doc.supplierPaid || 0,
    due: doc.supplierPayable || 0,
    paymentStatus: doc.supplierPaymentStatus,
  };
}

export async function getCustomerAccountStatement(customerId) {
  const customer = await Customer.findById(customerId).lean();
  if (!customer) throw ApiError.notFound('Customer not found');

  const bookings = await Booking.find({ customer: customerId, ...ACTIVE_BOOKING_FILTER })
    .sort({ createdAt: -1 })
    .select('bookingNumber route salePrice amountPaid customerDue duePaymentAt departureDate status paymentStatus')
    .lean();

  return {
    customer: {
      id: customer._id.toString(),
      name: customer.name,
      phone: customer.phone,
      whatsapp: customer.whatsapp || '',
      email: customer.email || '',
      totalDue: customer.totalDue || 0,
      totalPaid: customer.totalPaid || 0,
      totalSales: customer.totalSales || 0,
    },
    bookings: bookings.map((b) => formatBookingAccountRow(b, 'customer')),
  };
}

export async function getSupplierAccountStatement(supplierId) {
  const supplier = await Supplier.findById(supplierId).lean();
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const bookings = await Booking.find({ supplier: supplierId, ...ACTIVE_BOOKING_FILTER })
    .sort({ createdAt: -1 })
    .select('bookingNumber route purchasePrice directCosts supplierPaid supplierPayable duePaymentAt departureDate status supplierPaymentStatus')
    .lean();

  return {
    supplier: {
      id: supplier._id.toString(),
      name: supplier.name,
      company: supplier.company || '',
      phone: supplier.phone || '',
      whatsapp: supplier.whatsapp || '',
      email: supplier.email || '',
      totalPayable: supplier.totalPayable || 0,
      totalPaid: supplier.totalPaid || 0,
    },
    bookings: bookings.map((b) => formatBookingAccountRow(b, 'supplier')),
  };
}

export async function sendCustomerBookingReminder(customerId, bookingId, channels) {
  const booking = await Booking.findOne({ _id: bookingId, customer: customerId })
    .populate('customer', 'name phone whatsapp email')
    .lean();
  if (!booking) throw ApiError.notFound('Booking not found for this customer');
  if ((booking.customerDue || 0) <= 0) {
    throw ApiError.badRequest('No customer due on this booking');
  }

  const ctx = buildBookingNotificationContext(booking, booking.customer, {
    vars: { dueAmount: booking.customerDue },
  });
  return triggerNotificationEventWithChannels('payment_due_reminder', ctx, channels);
}

export async function sendSupplierBookingReminder(supplierId, bookingId, channels) {
  const booking = await Booking.findOne({ _id: bookingId, supplier: supplierId })
    .populate('supplier', 'name company phone whatsapp email')
    .lean();
  if (!booking) throw ApiError.notFound('Booking not found for this supplier');
  if ((booking.supplierPayable || 0) <= 0) {
    throw ApiError.badRequest('No supplier payable on this booking');
  }

  const ctx = buildSupplierBookingNotificationContext(booking, booking.supplier);
  return triggerNotificationEventWithChannels('supplier_payable_reminder', ctx, channels);
}
