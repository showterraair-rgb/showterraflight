import { formatDateValue } from './notificationContext.js';

export function buildSupplierBookingNotificationContext(booking, supplier, extra = {}) {
  const purchaseTotal = (booking.purchasePrice || 0) + (booking.directCosts || 0);
  const supplierName = supplier?.company || supplier?.name || '';

  return {
    recipientType: 'supplier',
    bookingId: booking._id?.toString?.() || booking.id,
    supplierId: booking.supplier?._id?.toString?.() || booking.supplier?.toString?.() || supplier?._id?.toString?.(),
    supplierPhone: supplier?.phone || '',
    supplierWhatsapp: supplier?.whatsapp || supplier?.phone || '',
    supplierEmail: supplier?.email || '',
    vars: {
      supplierName,
      bookingNumber: booking.bookingNumber || '',
      route: booking.route || '',
      payableAmount: booking.supplierPayable ?? extra.payableAmount ?? 0,
      amountPaid: booking.supplierPaid ?? 0,
      purchaseTotal,
      duePaymentDate: formatDateValue(booking.duePaymentAt) || 'N/A',
      ...extra.vars,
    },
  };
}

export function buildSupplierPaymentNotificationContext(payment, supplier, booking, extra = {}) {
  return {
    recipientType: 'supplier',
    supplierId: supplier?._id?.toString?.() || supplier?.id || payment.supplier?.toString?.(),
    supplierPhone: supplier?.phone || '',
    supplierWhatsapp: supplier?.whatsapp || supplier?.phone || '',
    supplierEmail: supplier?.email || '',
    bookingId: booking?._id?.toString?.() || booking?.id || payment.booking?.toString?.(),
    vars: {
      supplierName: supplier?.company || supplier?.name || '',
      paymentNumber: payment.paymentNumber || '',
      amount: payment.amount ?? 0,
      bookingNumber: booking?.bookingNumber || payment.bookingNumber || '',
      route: booking?.route || '',
      ...extra.vars,
    },
  };
}
