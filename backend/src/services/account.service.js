import Account from '../models/Account.js';
import AccountTransaction from '../models/AccountTransaction.js';
import Transfer from '../models/Transfer.js';
import ApiError from '../utils/ApiError.js';
import { ACCOUNT_TYPE_LABELS, MOBILE_BANKING_TYPES } from '../config/constants.js';
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
    title: doc.title || doc.name,
    name: doc.name,
    accountName: doc.accountName || '',
    type: doc.type,
    typeLabel: ACCOUNT_TYPE_LABELS[doc.type] || doc.name,
    accountNumber: doc.accountNumber || '',
    bankName: doc.bankName || '',
    branchRouting: doc.branchRouting || '',
    mobileNumber: doc.mobileNumber || '',
    mobileBankingType: doc.mobileBankingType || null,
    qrImagePath: doc.qrImagePath || '',
    qrImageUrl: doc.qrImagePath ? `/uploads/${doc.qrImagePath.replace(/^uploads\//, '')}` : '',
    openingBalance: doc.openingBalance,
    currentBalance: doc.currentBalance,
    isActive: doc.isActive,
    status: doc.isActive ? 'active' : 'inactive',
    notes: doc.notes || '',
    lastClosingDate: doc.lastClosingDate,
    lastClosingBalance: doc.lastClosingBalance,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
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

export async function listAccounts(query = {}) {
  const filter = query.includeInactive ? {} : { isActive: true };
  if (query.type) filter.type = query.type;
  if (query.types) {
    const types = String(query.types).split(',').map((t) => t.trim()).filter(Boolean);
    if (types.length) filter.type = { $in: types };
  }
  const accounts = await Account.find(filter).sort({ type: 1, name: 1 }).lean();
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

export async function voidTransfer(id, { reason } = {}, userId, req) {
  return withTransaction(async (session) => {
    const transfer = await Transfer.findOne({ _id: id, isVoided: false }).session(session);
    if (!transfer) throw ApiError.notFound('Transfer not found');

    transfer.isVoided = true;
    await transfer.save({ session });

    await postCredit({
      type: 'refund',
      accountId: transfer.fromAccount,
      relatedAccountId: transfer.toAccount,
      amount: transfer.amount,
      transactionDate: new Date(),
      notes: reason || `Void transfer ${transfer.transferNumber} (return to source)`,
      transferId: transfer._id,
      userId,
    }, session);

    await postDebit({
      type: 'refund',
      accountId: transfer.toAccount,
      relatedAccountId: transfer.fromAccount,
      amount: transfer.amount,
      transactionDate: new Date(),
      notes: reason || `Void transfer ${transfer.transferNumber} (reverse credit)`,
      transferId: transfer._id,
      userId,
    }, session);

    await logAudit({
      action: 'delete',
      module: 'transfers',
      entityType: 'Transfer',
      entityId: transfer._id,
      description: `Voided transfer ${transfer.transferNumber}`,
      userId,
      req,
    });

    return { id, voided: true, message: 'Transfer voided' };
  });
}

export async function createAccount(data, userId, req) {
  return withTransaction(async (session) => {
    const openingBalance = Number(data.openingBalance) || 0;
    const type = data.type;
    let mobileBankingType = data.mobileBankingType || null;
    if (!mobileBankingType && MOBILE_BANKING_TYPES.includes(type)) {
      mobileBankingType = type;
    }

    const [account] = await Account.create(
      [{
        title: data.title || data.name,
        name: data.name,
        accountName: data.accountName || '',
        type,
        accountNumber: data.accountNumber || '',
        bankName: data.bankName || '',
        branchRouting: data.branchRouting || '',
        mobileNumber: data.mobileNumber || '',
        mobileBankingType,
        qrImagePath: data.qrImagePath || '',
        openingBalance,
        currentBalance: openingBalance,
        isActive: data.isActive !== false,
        notes: data.notes || '',
      }],
      { session }
    );

    if (openingBalance !== 0) {
      await createLedgerEntry({
        type: 'opening_balance',
        accountId: account._id,
        amount: Math.abs(openingBalance),
        balanceAfter: account.currentBalance,
        transactionDate: new Date(),
        notes: 'Opening balance',
        userId,
      }, session);
    }

    await logAudit({
      action: 'create',
      module: 'accounts',
      entityType: 'Account',
      entityId: account._id,
      description: `Created account ${account.name}`,
      userId,
      req,
    });

    return formatAccount(account.toObject());
  });
}

export async function updateAccount(id, data, userId, req) {
  const account = await Account.findById(id);
  if (!account) throw ApiError.notFound('Account not found');

  if (data.title !== undefined) account.title = data.title;
  if (data.name !== undefined) account.name = data.name;
  if (data.accountName !== undefined) account.accountName = data.accountName;
  if (data.accountNumber !== undefined) account.accountNumber = data.accountNumber;
  if (data.bankName !== undefined) account.bankName = data.bankName;
  if (data.branchRouting !== undefined) account.branchRouting = data.branchRouting;
  if (data.mobileNumber !== undefined) account.mobileNumber = data.mobileNumber;
  if (data.mobileBankingType !== undefined) account.mobileBankingType = data.mobileBankingType;
  if (data.qrImagePath !== undefined) account.qrImagePath = data.qrImagePath;
  if (data.notes !== undefined) account.notes = data.notes;

  await account.save();

  await logAudit({
    action: 'update',
    module: 'accounts',
    entityType: 'Account',
    entityId: account._id,
    description: `Updated account ${account.name}`,
    userId,
    req,
  });

  return formatAccount(account.toObject());
}

export async function updateAccountStatus(id, { isActive }, userId, req) {
  const account = await Account.findById(id);
  if (!account) throw ApiError.notFound('Account not found');

  account.isActive = Boolean(isActive);
  await account.save();

  await logAudit({
    action: 'update',
    module: 'accounts',
    entityType: 'Account',
    entityId: account._id,
    description: `Account ${account.name} ${account.isActive ? 'activated' : 'deactivated'}`,
    userId,
    req,
  });

  return formatAccount(account.toObject());
}

export default {
  listAccounts,
  getAccountsSummary,
  getAccountById,
  getAccountStatement,
  setOpeningBalance,
  listTransfers,
  createTransfer,
  voidTransfer,
  createAccount,
  updateAccount,
  updateAccountStatus,
};
