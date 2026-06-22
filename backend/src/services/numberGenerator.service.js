import Setting from '../models/Setting.js';
import Order from '../models/Order.js';
import Booking from '../models/Booking.js';
import AccountTransaction from '../models/AccountTransaction.js';
import CustomerPayment from '../models/CustomerPayment.js';
import SupplierPayment from '../models/SupplierPayment.js';
import Expense from '../models/Expense.js';
import PaymentRequest from '../models/PaymentRequest.js';
import Transfer from '../models/Transfer.js';
import Agent from '../models/Agent.js';
import AgentBooking from '../models/AgentBooking.js';

/**
 * Generate sequential document numbers: PREFIX-YYYYMM-0001
 */
export async function generateOrderNumber() {
  const settings = await Setting.findOne({ key: 'company' }).lean();
  const prefix = settings?.orderNumberPrefix || 'ORD';

  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const pattern = new RegExp(`^${prefix}-${yearMonth}-`);

  const lastOrder = await Order.findOne({ orderNumber: pattern })
    .sort({ orderNumber: -1 })
    .select('orderNumber')
    .lean();

  let seq = 1;
  if (lastOrder?.orderNumber) {
    const parts = lastOrder.orderNumber.split('-');
    seq = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `${prefix}-${yearMonth}-${String(seq).padStart(4, '0')}`;
}

export async function generateBookingNumber() {
  const settings = await Setting.findOne({ key: 'company' }).lean();
  const prefix = settings?.bookingNumberPrefix || 'BKG';

  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const pattern = new RegExp(`^${prefix}-${yearMonth}-`);

  const last = await Booking.findOne({ bookingNumber: pattern })
    .sort({ bookingNumber: -1 })
    .select('bookingNumber')
    .lean();

  let seq = 1;
  if (last?.bookingNumber) {
    const parts = last.bookingNumber.split('-');
    seq = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `${prefix}-${yearMonth}-${String(seq).padStart(4, '0')}`;
}

async function generateSequentialNumber(model, field, prefix) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const pattern = new RegExp(`^${prefix}-${yearMonth}-`);

  const last = await model.findOne({ [field]: pattern })
    .sort({ [field]: -1 })
    .select(field)
    .lean();

  let seq = 1;
  if (last?.[field]) {
    const parts = last[field].split('-');
    seq = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `${prefix}-${yearMonth}-${String(seq).padStart(4, '0')}`;
}

export async function generateTransactionNumber() {
  return generateSequentialNumber(AccountTransaction, 'transactionNumber', 'TXN');
}

export async function generateCustomerPaymentNumber() {
  return generateSequentialNumber(CustomerPayment, 'paymentNumber', 'CP');
}

export async function generateSupplierPaymentNumber() {
  return generateSequentialNumber(SupplierPayment, 'paymentNumber', 'SP');
}

export async function generateExpenseNumber() {
  return generateSequentialNumber(Expense, 'expenseNumber', 'EXP');
}

export async function generateTransferNumber() {
  return generateSequentialNumber(Transfer, 'transferNumber', 'TRF');
}

export async function generatePaymentRequestNumber() {
  return generateSequentialNumber(PaymentRequest, 'requestNumber', 'PRQ');
}

export async function generateAgentId() {
  const last = await Agent.findOne({ agentId: /^STA-\d+$/ })
    .sort({ agentId: -1 })
    .select('agentId')
    .lean();

  let seq = 1;
  if (last?.agentId) {
    seq = parseInt(last.agentId.replace('STA-', ''), 10) + 1;
  }
  return `STA-${String(seq).padStart(4, '0')}`;
}

export async function generateAgentBookingRef() {
  const last = await AgentBooking.findOne({ bookingRef: /^STA-BK-\d+$/ })
    .sort({ bookingRef: -1 })
    .select('bookingRef')
    .lean();

  let seq = 1;
  if (last?.bookingRef) {
    seq = parseInt(last.bookingRef.replace('STA-BK-', ''), 10) + 1;
  }
  return `STA-BK-${String(seq).padStart(6, '0')}`;
}

export default generateOrderNumber;
