import crypto from 'crypto';
import env from '../config/env.js';
import GatewayPayment from '../models/GatewayPayment.js';
import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';
import PaymentRequest from '../models/PaymentRequest.js';
import ApiError from '../utils/ApiError.js';
import { initiateSslcommerzSession, validateSslcommerzPayment, getSslcommerzConfig } from './sslcommerz.service.js';
import { createBkashPayment, queryBkashPayment, getBkashConfig, isBkashConfigured } from './bkash.service.js';
import { getGatewayStatus, isSslcommerzConfigured } from './gatewayStatus.service.js';
import { createCustomerPayment } from './customerPayment.service.js';
import { recordPaymentForRequest } from './paymentRequest.service.js';
import { logAudit } from './audit.service.js';

function adminResultUrls(tranId) {
  const adminBase = env.cors.adminUrl.replace(/\/$/, '');
  const q = encodeURIComponent(tranId);
  return {
    adminSuccess: `${adminBase}/payments/gateway/result?status=success&tran_id=${q}`,
    adminFail: `${adminBase}/payments/gateway/result?status=failed&tran_id=${q}`,
    adminCancel: `${adminBase}/payments/gateway/result?status=cancelled&tran_id=${q}`,
  };
}

function buildSslcommerzUrls(tranId) {
  const base = `${env.apiPublicUrl}${env.apiPrefix}/public/payments/gateway/sslcommerz`;
  const admin = adminResultUrls(tranId);
  return {
    ipn: `${base}/ipn`,
    success: `${base}/success?tran_id=${encodeURIComponent(tranId)}`,
    fail: `${base}/fail?tran_id=${encodeURIComponent(tranId)}`,
    cancel: `${base}/cancel?tran_id=${encodeURIComponent(tranId)}`,
    ...admin,
  };
}

function buildBkashUrls(tranId) {
  const base = `${env.apiPublicUrl}${env.apiPrefix}/public/payments/gateway/bkash`;
  const admin = adminResultUrls(tranId);
  return {
    callback: `${base}/callback?tran_id=${encodeURIComponent(tranId)}`,
    ...admin,
  };
}

function generateTranId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `STA-${stamp}-${rand}`;
}

function formatGatewayPayment(doc) {
  return {
    id: doc._id.toString(),
    transactionId: doc.transactionId,
    gateway: doc.gateway,
    status: doc.status,
    amount: doc.amount,
    currency: doc.currency,
    customer: doc.customer?._id?.toString() || doc.customer?.toString(),
    customerName: doc.customer?.name,
    booking: doc.booking?._id?.toString() || doc.booking?.toString() || null,
    bookingNumber: doc.booking?.bookingNumber,
    paymentRequest: doc.paymentRequest?._id?.toString() || doc.paymentRequest?.toString() || null,
    gatewayUrl: doc.gatewayUrl || '',
    customerPayment: doc.customerPayment?.toString() || null,
    completedAt: doc.completedAt,
    failureReason: doc.failureReason || '',
    createdAt: doc.createdAt,
  };
}

async function loadPopulatedGateway(tranId) {
  const doc = await GatewayPayment.findOne({ transactionId: tranId })
    .populate('customer', 'name phone email')
    .populate('booking', 'bookingNumber')
    .lean();
  if (!doc) throw ApiError.notFound('Gateway payment not found');
  return formatGatewayPayment(doc);
}

export async function getGatewayPaymentByTranId(tranId) {
  return loadPopulatedGateway(tranId);
}

export { getGatewayStatus };

async function prepareGatewayPayment(data) {
  const customer = await Customer.findById(data.customerId);
  if (!customer) throw ApiError.notFound('Customer not found');

  let amount = Number(data.amount);
  let booking = null;
  let paymentRequest = null;

  if (data.paymentRequestId) {
    paymentRequest = await PaymentRequest.findById(data.paymentRequestId);
    if (!paymentRequest) throw ApiError.notFound('Payment request not found');
    if (paymentRequest.status !== 'pending') throw ApiError.badRequest('Payment request is not pending');
    amount = paymentRequest.amount;
    if (paymentRequest.customer.toString() !== customer._id.toString()) {
      throw ApiError.badRequest('Customer does not match payment request');
    }
  }

  if (data.bookingId) {
    booking = await Booking.findById(data.bookingId);
    if (!booking) throw ApiError.notFound('Booking not found');
    if (booking.customer.toString() !== customer._id.toString()) {
      throw ApiError.badRequest('Customer does not match booking');
    }
    if (!data.paymentRequestId) {
      const due = booking.customerDue ?? Math.max(0, (booking.salePrice || 0) - (booking.amountPaid || 0));
      if (amount > due + 0.01) throw ApiError.badRequest('Amount exceeds customer due');
      if (!amount || amount <= 0) amount = due;
    }
  }

  if (!amount || amount <= 0) throw ApiError.badRequest('Payment amount must be greater than 0');

  const productName = booking
    ? `Booking ${booking.bookingNumber}`
    : paymentRequest
      ? `Payment Request ${paymentRequest.requestNumber}`
      : `Payment — ${customer.name}`;

  return { customer, amount, booking, paymentRequest, productName };
}

async function markGatewayFailed(record, reason, payload = {}) {
  if (record.status === 'success') return record;
  record.status = 'failed';
  record.failureReason = reason || '';
  record.gatewayResponse = payload;
  record.completedAt = new Date();
  await record.save();
  return record;
}

async function completeGatewayPayment(record, { paymentMethod, referenceNumber, gatewayResponse = {} }, userId = null, req = null) {
  if (record.status === 'success') return loadPopulatedGateway(record.transactionId);

  let customerPayment;
  if (record.paymentRequest) {
    const result = await recordPaymentForRequest(
      record.paymentRequest.toString(),
      {
        accountId: record.settlementAccount.toString(),
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod,
        referenceNumber,
      },
      userId || record.createdBy,
      req
    );
    customerPayment = result.payment;
  } else {
    customerPayment = await createCustomerPayment(
      {
        customerId: record.customer.toString(),
        bookingId: record.booking?.toString(),
        accountId: record.settlementAccount.toString(),
        amount: record.amount,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod,
        referenceNumber,
        notes: `Online payment ${record.transactionId}`,
        onAccount: !record.booking,
      },
      userId || record.createdBy,
      req
    );
  }

  record.status = 'success';
  record.bankTransactionId = referenceNumber || '';
  record.gatewayResponse = gatewayResponse;
  record.customerPayment = customerPayment.id || customerPayment._id;
  record.completedAt = new Date();
  await record.save();
  return loadPopulatedGateway(record.transactionId);
}

export async function initiateSslcommerzPayment(data, userId, req) {
  const config = await getSslcommerzConfig();
  if (!config.enabled) throw ApiError.badRequest('SSLCommerz is not enabled');
  if (!isSslcommerzConfigured(config)) {
    throw ApiError.badRequest('SSLCommerz API credentials are not configured yet');
  }

  const { customer, amount, booking, paymentRequest, productName } = await prepareGatewayPayment(data);
  const tranId = generateTranId();
  const urls = buildSslcommerzUrls(tranId);

  const session = await initiateSslcommerzSession({
    tranId,
    amount,
    customer,
    productName,
    urls: {
      success: urls.success,
      fail: urls.fail,
      cancel: urls.cancel,
      ipn: urls.ipn,
    },
  });

  await GatewayPayment.create({
    transactionId: tranId,
    gateway: 'sslcommerz',
    status: 'initiated',
    amount,
    currency: 'BDT',
    customer: customer._id,
    booking: booking?._id || paymentRequest?.booking,
    paymentRequest: paymentRequest?._id,
    sessionKey: session.sessionKey,
    gatewayUrl: session.gatewayUrl,
    settlementAccount: config.settlementAccountId,
    createdBy: userId,
  });

  await logAudit({
    action: 'create',
    module: 'payments',
    entityType: 'GatewayPayment',
    entityId: tranId,
    description: `SSLCommerz payment initiated ${tranId} — ৳${amount}`,
    userId,
    req,
  });

  return { transactionId: tranId, gatewayUrl: session.gatewayUrl, amount, gateway: 'sslcommerz' };
}

export async function initiateBkashPayment(data, userId, req) {
  const config = await getBkashConfig();
  if (!config.enabled) throw ApiError.badRequest('bKash is not enabled');
  if (!isBkashConfigured(config)) {
    throw ApiError.badRequest('bKash API credentials are not configured yet');
  }

  const { customer, amount, booking, paymentRequest } = await prepareGatewayPayment(data);
  const tranId = generateTranId();
  const urls = buildBkashUrls(tranId);

  const session = await createBkashPayment({
    amount,
    tranId,
    customerPhone: customer.phone,
    callbackUrl: urls.callback,
  });

  await GatewayPayment.create({
    transactionId: tranId,
    gateway: 'bkash',
    status: 'initiated',
    amount,
    currency: 'BDT',
    customer: customer._id,
    booking: booking?._id || paymentRequest?.booking,
    paymentRequest: paymentRequest?._id,
    sessionKey: session.paymentId,
    gatewayUrl: session.gatewayUrl,
    settlementAccount: config.settlementAccountId,
    createdBy: userId,
  });

  await logAudit({
    action: 'create',
    module: 'payments',
    entityType: 'GatewayPayment',
    entityId: tranId,
    description: `bKash payment initiated ${tranId} — ৳${amount}`,
    userId,
    req,
  });

  return { transactionId: tranId, gatewayUrl: session.gatewayUrl, amount, gateway: 'bkash' };
}

export async function initiateGatewayPayment(data, userId, req) {
  const gateway = data.gateway || 'sslcommerz';
  if (gateway === 'bkash') return initiateBkashPayment(data, userId, req);
  return initiateSslcommerzPayment(data, userId, req);
}

export async function completeSslcommerzPayment(tranId, validation, userId = null, req = null) {
  const record = await GatewayPayment.findOne({ transactionId: tranId });
  if (!record) throw ApiError.notFound('Gateway payment not found');
  if (record.status === 'success') return loadPopulatedGateway(tranId);

  const status = validation?.status;
  if (!['VALID', 'VALIDATED'].includes(status)) {
    await markGatewayFailed(record, validation?.status || 'Validation failed', validation);
    throw ApiError.badRequest('Payment validation failed');
  }

  const paidAmount = Number(validation.amount);
  if (Math.abs(paidAmount - record.amount) > 0.05) {
    await markGatewayFailed(record, 'Amount mismatch', validation);
    throw ApiError.badRequest('Paid amount does not match');
  }

  if (validation.tran_id !== record.transactionId) {
    await markGatewayFailed(record, 'Transaction ID mismatch', validation);
    throw ApiError.badRequest('Transaction ID mismatch');
  }

  record.valId = validation.val_id || record.valId;
  return completeGatewayPayment(
    record,
    {
      paymentMethod: 'SSLCommerz',
      referenceNumber: validation.bank_tran_id || validation.tran_id,
      gatewayResponse: validation,
    },
    userId,
    req
  );
}

export async function handleSslcommerzIpn(payload) {
  const tranId = payload.tran_id;
  if (!tranId) return { ok: false, message: 'Missing tran_id' };

  const record = await GatewayPayment.findOne({ transactionId: tranId });
  if (!record) return { ok: false, message: 'Unknown transaction' };
  if (record.status === 'success') return { ok: true, message: 'Already processed' };

  if (payload.status !== 'VALID') {
    await markGatewayFailed(record, payload.status || 'IPN not valid', payload);
    return { ok: false, message: 'Payment not valid' };
  }

  const valId = payload.val_id;
  if (!valId) return { ok: false, message: 'Missing val_id' };

  const validation = await validateSslcommerzPayment(valId);
  await completeSslcommerzPayment(tranId, validation);
  return { ok: true, message: 'Payment recorded' };
}

export async function handleBkashCallback(query) {
  const tranId = query.tran_id;
  const paymentId = query.paymentID || query.paymentId;
  const status = query.status;
  const urls = buildBkashUrls(tranId || '');

  const record = await GatewayPayment.findOne({ transactionId: tranId });
  if (!record) return urls.adminFail;
  if (record.status === 'success') return urls.adminSuccess;

  if (status !== 'success' && status !== 'Success') {
    await markGatewayFailed(record, status || 'bKash payment not successful', query);
    return status === 'cancel' ? urls.adminCancel : urls.adminFail;
  }

  try {
    const paymentStatus = await queryBkashPayment(paymentId || record.sessionKey);
    if (paymentStatus.transactionStatus !== 'Completed') {
      await markGatewayFailed(record, paymentStatus.transactionStatus || 'Not completed', paymentStatus);
      return urls.adminFail;
    }

    const paidAmount = Number(paymentStatus.amount);
    if (Math.abs(paidAmount - record.amount) > 0.05) {
      await markGatewayFailed(record, 'Amount mismatch', paymentStatus);
      return urls.adminFail;
    }

    await completeGatewayPayment(
      record,
      {
        paymentMethod: 'bKash',
        referenceNumber: paymentStatus.trxID || paymentId,
        gatewayResponse: paymentStatus,
      }
    );
    return urls.adminSuccess;
  } catch (err) {
    await markGatewayFailed(record, err.message || 'bKash verification failed', query);
    return urls.adminFail;
  }
}

export async function handleSslcommerzRedirect(tranId, outcome) {
  const urls = buildSslcommerzUrls(tranId);
  const record = await GatewayPayment.findOne({ transactionId: tranId });
  if (!record) return urls.adminFail;
  if (record.status === 'success') return urls.adminSuccess;
  if (outcome === 'cancel') {
    if (record.status === 'initiated') {
      record.status = 'cancelled';
      record.completedAt = new Date();
      await record.save();
    }
    return urls.adminCancel;
  }
  if (outcome === 'fail') {
    if (record.status === 'initiated') {
      await markGatewayFailed(record, 'Customer returned from failed payment page');
    }
    return urls.adminFail;
  }
  return record.status === 'success' ? urls.adminSuccess : urls.adminFail;
}

export default {
  initiateGatewayPayment,
  initiateSslcommerzPayment,
  initiateBkashPayment,
  handleSslcommerzIpn,
  handleBkashCallback,
  handleSslcommerzRedirect,
  getGatewayPaymentByTranId,
  getGatewayStatus,
  completeSslcommerzPayment,
};
