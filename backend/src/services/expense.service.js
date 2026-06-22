import Expense from '../models/Expense.js';
import ExpenseCategory from '../models/ExpenseCategory.js';
import ApiError from '../utils/ApiError.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
  buildSearchFilter,
} from '../utils/pagination.js';
import { withTransaction, postDebit, postCredit } from './ledger.service.js';
import { generateExpenseNumber } from './numberGenerator.service.js';
import { logAudit } from './audit.service.js';

function formatExpense(doc) {
  return {
    id: doc._id.toString(),
    expenseNumber: doc.expenseNumber,
    category: doc.category?._id?.toString() || doc.category?.toString(),
    categoryName: doc.category?.name,
    title: doc.title,
    amount: doc.amount,
    expenseDate: doc.expenseDate,
    account: doc.account?._id?.toString() || doc.account?.toString(),
    accountName: doc.account?.name,
    paymentMethod: doc.paymentMethod || '',
    referenceNumber: doc.referenceNumber || '',
    notes: doc.notes || '',
    billFilePath: doc.billFilePath || '',
    billFileName: doc.billFileName || '',
    billUrl: doc.billFilePath ? `/uploads/${String(doc.billFilePath).replace(/^uploads\//, '')}` : '',
    isRecurring: doc.isRecurring,
    recurringFrequency: doc.recurringFrequency,
    nextDueDate: doc.nextDueDate,
    createdAt: doc.createdAt,
  };
}

export async function listExpenseCategories() {
  const categories = await ExpenseCategory.find({ isActive: true }).sort({ name: 1 }).lean();
  return categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    isSystem: c.isSystem,
  }));
}

export async function listExpenses(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'expenseDate');
  const filter = { isVoided: false, ...buildSearchFilter(query.search, ['expenseNumber', 'title', 'referenceNumber']) };

  if (query.categoryId) filter.category = query.categoryId;
  if (query.accountId) filter.account = query.accountId;

  if (query.dateFrom || query.dateTo) {
    filter.expenseDate = {};
    if (query.dateFrom) filter.expenseDate.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.expenseDate.$lte = end;
    }
  }

  const [items, total] = await Promise.all([
    Expense.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('category', 'name')
      .populate('account', 'name type')
      .lean(),
    Expense.countDocuments(filter),
  ]);

  return {
    items: items.map(formatExpense),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getExpenseById(id) {
  const expense = await Expense.findOne({ _id: id, isVoided: false })
    .populate('category', 'name')
    .populate('account', 'name type')
    .lean();

  if (!expense) throw ApiError.notFound('Expense not found');
  return formatExpense(expense);
}

export async function createExpense(data, userId, req) {
  return withTransaction(async (session) => {
    const category = await ExpenseCategory.findById(data.categoryId).session(session);
    if (!category) throw ApiError.notFound('Expense category not found');

    const expenseNumber = await generateExpenseNumber();

    const [expense] = await Expense.create(
      [{
        expenseNumber,
        category: data.categoryId,
        title: data.title,
        amount: data.amount,
        expenseDate: new Date(data.expenseDate),
        account: data.accountId,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        notes: data.notes || '',
        billFilePath: data.billFilePath,
        billFileName: data.billFileName,
        isRecurring: data.isRecurring || false,
        recurringFrequency: data.recurringFrequency,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
        createdBy: userId,
      }],
      { session }
    );

    await postDebit({
      type: 'expense',
      accountId: data.accountId,
      amount: data.amount,
      transactionDate: new Date(data.expenseDate),
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      notes: data.notes || `Expense: ${data.title}`,
      expenseId: expense._id,
      userId,
    }, session);

    await logAudit({
      action: 'create',
      module: 'expenses',
      entityType: 'Expense',
      entityId: expense._id,
      description: `Expense ${expenseNumber}: ${data.title} — ৳${data.amount}`,
      userId,
      req,
    });

    const populated = await Expense.findById(expense._id)
      .populate('category', 'name')
      .populate('account', 'name')
      .lean();

    return formatExpense(populated);
  });
}

export async function voidExpense(id, { reason } = {}, userId, req) {
  return withTransaction(async (session) => {
    const expense = await Expense.findOne({ _id: id, isVoided: false }).session(session);
    if (!expense) throw ApiError.notFound('Expense not found');

    expense.isVoided = true;
    await expense.save({ session });

    await postCredit({
      type: 'refund',
      accountId: expense.account,
      amount: expense.amount,
      transactionDate: new Date(),
      notes: reason || `Void expense ${expense.expenseNumber}`,
      expenseId: expense._id,
      userId,
    }, session);

    await logAudit({
      action: 'delete',
      module: 'expenses',
      entityType: 'Expense',
      entityId: expense._id,
      description: `Voided expense ${expense.expenseNumber}`,
      userId,
      req,
    });

    return { id, voided: true, message: 'Expense voided' };
  });
}

export async function uploadExpenseBill(id, file, userId, req) {
  const expense = await Expense.findOne({ _id: id, isVoided: false });
  if (!expense) throw ApiError.notFound('Expense not found');
  if (!file) throw ApiError.badRequest('No bill file uploaded');

  expense.billFilePath = `expense-bills/${file.filename}`;
  expense.billFileName = file.originalname;
  await expense.save();

  await logAudit({
    action: 'update',
    module: 'expenses',
    entityType: 'Expense',
    entityId: expense._id,
    description: `Bill uploaded for expense ${expense.expenseNumber}`,
    userId,
    req,
  });

  return getExpenseById(id);
}

export default { listExpenseCategories, listExpenses, getExpenseById, createExpense, voidExpense, uploadExpenseBill };
