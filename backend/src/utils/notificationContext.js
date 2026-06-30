export function formatDateValue(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function buildOrderNotificationContext(order, extra = {}) {
  const route = order.fromDestination && order.toDestination
    ? `${order.fromDestination} → ${order.toDestination}`
    : extra.route || '';

  return {
    orderId: order._id?.toString?.() || order.id,
    customerPhone: order.customerPhone || extra.customerPhone,
    customerWhatsapp: extra.customerWhatsapp || order.customerPhone || extra.customerPhone,
    customerEmail: order.customerEmail || extra.customerEmail,
    vars: {
      orderNumber: order.orderNumber || '',
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      route,
      ...extra.vars,
    },
  };
}

export function buildBookingNotificationContext(booking, customer, extra = {}) {
  const route = booking.route
    || (booking.fromDestination && booking.toDestination
      ? `${booking.fromDestination} → ${booking.toDestination}`
      : '');

  return {
    bookingId: booking._id?.toString?.() || booking.id,
    orderId: booking.order?._id?.toString?.() || booking.order?.toString?.() || null,
    customerId: booking.customer?._id?.toString?.() || booking.customer?.toString?.() || customer?._id?.toString?.(),
    customerPhone: customer?.phone || booking.customerPhone || '',
    customerWhatsapp: customer?.whatsapp || customer?.phone || booking.customerPhone || '',
    customerEmail: customer?.email || '',
    vars: {
      customerName: customer?.name || booking.customerName || '',
      bookingNumber: booking.bookingNumber || '',
      salePrice: booking.salePrice ?? 0,
      route,
      departureDate: formatDateValue(booking.departureDate),
      pnr: booking.pnr || '',
      dueAmount: booking.customerDue ?? extra.dueAmount ?? 0,
      duePaymentDate: formatDateValue(booking.duePaymentAt) || 'N/A',
      amountPaid: booking.amountPaid ?? 0,
      referenceNumber: booking.bookingNumber || extra.vars?.referenceNumber || '',
      ...extra.vars,
    },
  };
}

export function buildPaymentNotificationContext(payment, customer, booking, extra = {}) {
  return {
    customerPaymentId: payment._id?.toString?.() || payment.id,
    bookingId: booking?._id?.toString?.() || booking?.id || payment.booking?.toString?.(),
    customerId: customer?._id?.toString?.() || customer?.id || payment.customer?.toString?.(),
    customerPhone: customer?.phone || '',
    customerWhatsapp: customer?.whatsapp || customer?.phone || '',
    customerEmail: customer?.email || '',
    vars: {
      customerName: customer?.name || '',
      bookingNumber: booking?.bookingNumber || payment.bookingNumber || '',
      amount: payment.amount ?? 0,
      paymentNumber: payment.paymentNumber || '',
      ...extra.vars,
    },
  };
}

export function attachSupplierToContext(ctx, supplier, booking = {}) {
  if (!supplier) return ctx;
  return {
    ...ctx,
    supplierId: supplier._id?.toString?.() || supplier.id,
    supplierPhone: supplier.phone || '',
    supplierWhatsapp: supplier.whatsapp || supplier.phone || '',
    supplierEmail: supplier.email || '',
    vars: {
      ...ctx.vars,
      supplierName: supplier.company || supplier.name || '',
      payableAmount: booking.supplierPayable ?? ctx.vars?.payableAmount ?? 0,
    },
  };
}
