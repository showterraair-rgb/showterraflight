import mongoose from 'mongoose';
import Account from '../models/Account.js';
import AccountTransaction from '../models/AccountTransaction.js';
import ApiError from '../utils/ApiError.js';
import { generateTransactionNumber } from './numberGenerator.service.js';
import { isTransactionNotSupported, sessionOptions, withSession } from '../utils/mongoSession.js';

export function derivePaymentStatus(paid, total) {
  if (!paid || paid <= 0) return 'unpaid';
  if (paid >= total) return 'paid';
  return 'partial';
}

/**
 * Run callback inside a MongoDB transaction when supported; otherwise run without one.
 */
export async function withTransaction(fn) {
  const session = await mongoose.startSession();
  let fnCompleted = false;
  try {
    session.startTransaction();
    const result = await fn(session);
    fnCompleted = true;
    await session.commitTransaction();
    return result;
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (!fnCompleted && isTransactionNotSupported(err)) {
      return fn(null);
    }
    throw err;
  } finally {
    session.endSession();
  }
}

async function getActiveAccount(accountId, session) {
  const account = await withSession(Account.findById(accountId), session);
  if (!account || !account.isActive) {
    throw ApiError.badRequest('Account not found or inactive');
  }
  return account;
}

/**
 * Credit (increase) account balance.
 */
export async function creditAccount(accountId, amount, session) {
  if (amount <= 0) throw ApiError.badRequest('Amount must be positive');
  const account = await getActiveAccount(accountId, session);
  account.currentBalance = (account.currentBalance || 0) + amount;
  await account.save(sessionOptions(session));
  return { account, balanceAfter: account.currentBalance };
}

/**
 * Debit (decrease) account balance.
 */
export async function debitAccount(accountId, amount, session) {
  if (amount <= 0) throw ApiError.badRequest('Amount must be positive');
  const account = await getActiveAccount(accountId, session);
  if ((account.currentBalance || 0) < amount) {
    throw ApiError.badRequest(`Insufficient balance in ${account.name}`);
  }
  account.currentBalance -= amount;
  await account.save(sessionOptions(session));
  return { account, balanceAfter: account.currentBalance };
}

/**
 * Create a ledger entry. Caller must already have adjusted balance.
 */
export async function createLedgerEntry(data, session) {
  const transactionNumber = await generateTransactionNumber();

  const entry = await AccountTransaction.create(
    [{
      transactionNumber,
      type: data.type,
      account: data.accountId,
      relatedAccount: data.relatedAccountId,
      amount: data.amount,
      balanceAfter: data.balanceAfter,
      transactionDate: data.transactionDate,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      notes: data.notes || '',
      order: data.orderId,
      booking: data.bookingId,
      customer: data.customerId,
      supplier: data.supplierId,
      expense: data.expenseId,
      transfer: data.transferId,
      customerPayment: data.customerPaymentId,
      supplierPayment: data.supplierPaymentId,
      createdBy: data.userId,
    }],
    sessionOptions(session)
  );

  return entry[0];
}

/**
 * Post credit transaction: increase account + ledger entry.
 */
export async function postCredit(params, session) {
  const { balanceAfter } = await creditAccount(params.accountId, params.amount, session);
  return createLedgerEntry({ ...params, balanceAfter }, session);
}

/**
 * Post debit transaction: decrease account + ledger entry.
 */
export async function postDebit(params, session) {
  const { balanceAfter } = await debitAccount(params.accountId, params.amount, session);
  return createLedgerEntry({ ...params, balanceAfter }, session);
}

export default {
  withTransaction,
  creditAccount,
  debitAccount,
  createLedgerEntry,
  postCredit,
  postDebit,
  derivePaymentStatus,
};
