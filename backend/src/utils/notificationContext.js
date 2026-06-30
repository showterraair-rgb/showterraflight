import { resolveContactChannels } from './phoneUtils.js';

export function formatDateValue(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export { resolveContactChannels };

function withCustomerContacts(ctx, phone, whatsapp, email) {
  const { smsPhone, waPhone } = resolveContactChannels({ phone, whatsapp });
  return {
    ...ctx,
    customerPhone: smsPhone,
    customerWhatsapp: waPhone,
    customerEmail: email || ctx.customerEmail || '',
    vars: {
      ...ctx.vars,
      customerPhone: phone || ctx.vars?.customerPhone || '',
    },
  };
}

function withSupplierContacts(ctx, supplier) {
  if (!supplier) return ctx;
  const { smsPhone, waPhone } = resolveContactChannels({
    phone: supplier.phone,
    whatsapp: supplier.whatsapp,
  });
  return {
    ...ctx,
    supplierId: supplier._id?.toString?.() || supplier.id,
    supplierPhone: smsPhone,
    supplierWhatsapp: waPhone,
    supplierEmail: supplier.email || '',
    vars: {
      ...ctx.vars,
      supplierName: supplier.company || supplier.name || '',
    },
  };
}

export function buildOrderNotificationContext(order, extra = {}) {
  const route = order.fromDestination && order.toDestination
    ? `${order.fromDestination} → ${order.toDestination}`
    : extra.route || '';

  const base = {
    orderId: order._id?.toString?.() || order.id,
    customerEmail: order.customerEmail || extra.customerEmail,
    vars: {
      orderNumber: order.orderNumber || '',
      customerName: order.customerName || '',
      route,
      ...extra.vars,
    },
  };

  return withCustomerContacts(
    base,
    order.customerPhone || extra.customerPhone,
    extra.customerWhatsapp || order.customerPhone || extra.customerPhone,
    order.customerEmail || extra.customerEmail
  );
}

export function buildBookingNotificationContext(booking, customer, extra = {}) {
  const route = booking.route
    || (booking.fromDestination && booking.toDestination
      ? `${booking.fromDestination} → ${booking.toDestination}`
      : '');

  const base = {
    bookingId: booking._id?.toString?.() || booking.id,
    orderId: booking.order?._id?.toString?.() || booking.order?.toString?.() || null,
    customerId: booking.customer?._id?.toString?.() || booking.customer?.toString?.() || customer?._id?.toString?.(),
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

  return withCustomerContacts(
    base,
    customer?.phone || booking.customerPhone || '',
    customer?.whatsapp || customer?.phone || booking.customerPhone || '',
    customer?.email || ''
  );
}

export function buildPaymentNotificationContext(payment, customer, booking, extra = {}) {
  const base = {
    customerPaymentId: payment._id?.toString?.() || payment.id,
    bookingId: booking?._id?.toString?.() || booking?.id || payment.booking?.toString?.(),
    customerId: customer?._id?.toString?.() || customer?.id || payment.customer?.toString?.(),
    vars: {
      customerName: customer?.name || '',
      bookingNumber: booking?.bookingNumber || payment.bookingNumber || '',
      amount: payment.amount ?? 0,
      paymentNumber: payment.paymentNumber || '',
      ...extra.vars,
    },
  };

  return withCustomerContacts(
    base,
    customer?.phone || '',
    customer?.whatsapp || customer?.phone || '',
    customer?.email || ''
  );
}

export function attachSupplierToContext(ctx, supplier, booking = {}) {
  const next = withSupplierContacts(ctx, supplier);
  return {
    ...next,
    vars: {
      ...next.vars,
      payableAmount: booking.supplierPayable ?? ctx.vars?.payableAmount ?? 0,
    },
  };
}
