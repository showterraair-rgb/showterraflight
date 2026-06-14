import Account from '../models/Account.js';
import AccountTransaction from '../models/AccountTransaction.js';
import Transfer from '../models/Transfer.js';
import ApiError from '../utils/ApiError.js';
import { ACCOUNT_TYPE_LABELS } from '../config/constants.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
} from '../utils/pagination.js';
import {
  withTransaction,
  postCredit,
  postDebit,
  createLedgerEntry,
} from './ledger.service.js';
import { generateTransferNumber } from './numberGenerator.service.js';
import { logAudit } from './audit.service.js';

function formatAccount(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    type: doc.type,
    typeLabel: ACCOUNT_TYPE_LABELS[doc.type] || doc.name,
    accountNumber: doc.accountNumber || '',
    bankName: doc.bankName || '',
    mobileNumber: doc.mobileNumber || '',
    openingBalance: doc.openingBalance,
    currentBalance: doc.currentBalance,
    isActive: doc.isActive,
    notes: doc.notes || '',
    lastClosingDate: doc.lastClosingDate,
    lastClosingBalance: doc.lastClosingBalance,
  };
}

function formatTransaction(doc) {
  return {
    id: doc._id.toString(),
    transactionNumber: doc.transactionNumber,
    type: doc.type,
    accountId: doc.account?.toString(),
    relatedAccountId: doc.relatedAccount?.toString(),
    amount: doc.amount,
    balanceAfter: doc.balanceAfter,
    transactionDate: doc.transactionDate,
    paymentMethod: doc.paymentMethod || '',
    referenceNumber: doc.referenceNumber || '',
    notes: doc.notes || '',
    customerId: doc.customer?.toString(),
    supplierId: doc.supplier?.toString(),
    bookingId: doc.booking?.toString(),
    createdAt: doc.createdAt,
  };
}

export async function listAccounts() {
  const accounts = await Account.find({ isActive: true }).sort({ type: 1 }).lean();
  return accounts.map(formatAccount);
}

export async function getAccountsSummary() {
  const accounts = await listAccounts();
  const totalBalance = accounts.reduce((s, a) => s + (a.currentBalance || 0), 0);
  return { accounts, totalBalance };
}

export async function getAccountById(id) {
  const account = await Account.findById(id).lean();
  if (!account) throw ApiError.notFound('Account not found');
  return formatAccount(account);
}

export async function getAccountStatement(id, query) {
  const account = await Account.findById(id);
  if (!account) throw ApiError.notFound('Account not found');

  const { page, limit, skip, sort } = parsePaginationQuery(query, 'transactionDate');
  const filter = { account: id };

  if (query.dateFrom || query.dateTo) {
    filter.transactionDate = {};
    if (query.dateFrom) filter.transactionDate.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.transactionDate.$lte = end;
    }
  }

  const [transactions, total] = await Promise.all([
    AccountTransaction.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name')
      .populate('supplier', 'name')
      .lean(),
    AccountTransaction.countDocuments(filter),
  ]);

  return {
    account: formatAccount(account.toObject()),
    transactions: transactions.map(formatTransaction),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function setOpeningBalance(id, { openingBalance, notes }, userId, req) {
  return withTransaction(async (session) => {
    const account = await Account.findById(id).session(session);
    if (!account) throw ApiError.notFound('Account not found');

    const diff = openingBalance - (account.openingBalance || 0);
    account.openingBalance = openingBalance;

    if (diff !== 0) {
      account.currentBalance = (account.currentBalance || 0) + diff;
      await account.save({ session });

      await createLedgerEntry({
        type: diff > 0 ? 'opening_balance' : 'adjustment',
        accountId: account._id,
        amount: Math.abs(diff),
        balanceAfter: account.currentBalance,
        transactionDate: new Date(),
        notes: notes || 'Opening balance adjustment',
        userId,
      }, session);
    } else {
      await account.save({ session });
    }

    await logAudit({
      action: 'update',
      module: 'accounts',
      entityType: 'Account',
      entityId: account._id,
      description: `Opening balance set for ${account.name}`,
      changes: { openingBalance },
      userId,
      req,
    });

    return formatAccount(account.toObject());
  });
}

export async function listTransfers(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'transferDate');
  const filter = { isVoided: false };

  if (query.dateFrom || query.dateTo) {
    filter.transferDate = {};
    if (query.dateFrom) filter.transferDate.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.transferDate.$lte = end;
    }
  }

  const [items, total] = await Promise.all([
    Transfer.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('fromAccount', 'name type')
      .populate('toAccount', 'name type')
      .lean(),
    Transfer.countDocuments(filter),
  ]);

  return {
    items: items.map((t) => ({
      id: t._id.toString(),
      transferNumber: t.transferNumber,
      fromAccount: { id: t.fromAccount._id.toString(), name: t.fromAccount.name, type: t.fromAccount.type },
      toAccount: { id: t.toAccount._id.toString(), name: t.toAccount.name, type: t.toAccount.type },
      amount: t.amount,
      transferDate: t.transferDate,
      referenceNumber: t.referenceNumber || '',
      notes: t.notes || '',
      createdAt: t.createdAt,
    })),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function createTransfer(data, userId, req) {
  return withTransaction(async (session) => {
    const transferNumber = await generateTransferNumber();

    const [transfer] = await Transfer.create(
      [{
        transferNumber,
        fromAccount: data.fromAccountId,
        toAccount: data.toAccountId,
        amount: data.amount,
        transferDate: new Date(data.transferDate),
        referenceNumber: data.referenceNumber,
        notes: data.notes || '',
        createdBy: userId,
      }],
      { session }
    );

    await postDebit({
      type: 'transfer_out',
      accountId: data.fromAccountId,
      relatedAccountId: data.toAccountId,
      amount: data.amount,
      transactionDate: new Date(data.transferDate),
      referenceNumber: data.referenceNumber,
      notes: data.notes || `Transfer to account`,
      transferId: transfer._id,
      userId,
    }, session);

    await postCredit({
      type: 'transfer_in',
      accountId: data.toAccountId,
      relatedAccountId: data.fromAccountId,
      amount: data.amount,
      transactionDate: new Date(data.transferDate),
      referenceNumber: data.referenceNumber,
      notes: data.notes || `Transfer from account`,
      transferId: transfer._id,
      userId,
    }, session);

    await logAudit({
      action: 'create',
      module: 'transfers',
      entityType: 'Transfer',
      entityId: transfer._id,
      description: `Transfer ${transferNumber}: ৳${data.amount}`,
      userId,
      req,
    });

    const populated = await Transfer.findById(transfer._id)
      .populate('fromAccount', 'name type')
      .populate('toAccount', 'name type')
      .lean();

    return {
      id: populated._id.toString(),
      transferNumber: populated.transferNumber,
      fromAccount: { id: populated.fromAccount._id.toString(), name: populated.fromAccount.name },
      toAccount: { id: populated.toAccount._id.toString(), name: populated.toAccount.name },
      amount: populated.amount,
      transferDate: populated.transferDate,
      referenceNumber: populated.referenceNumber,
      notes: populated.notes,
    };
  });
}

export default {
  listAccounts,
  getAccountsSummary,
  getAccountById,
  getAccountStatement,
  setOpeningBalance,
  listTransfers,
  createTransfer,
};
