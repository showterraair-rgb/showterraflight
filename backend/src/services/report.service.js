import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Expense from '../models/Expense.js';
import Account from '../models/Account.js';
import AccountTransaction from '../models/AccountTransaction.js';
import CustomerPayment from '../models/CustomerPayment.js';
import SupplierPayment from '../models/SupplierPayment.js';
import { ACCOUNT_TYPE_LABELS } from '../config/constants.js';

function parseDateRange(query) {
  const range = {};
  if (query.from) range.$gte = new Date(query.from);
  if (query.to) {
    const end = new Date(query.to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
}

function exportMeta(reportKey, rows, columns) {
  return {
    reportKey,
    generatedAt: new Date().toISOString(),
    rowCount: rows.length,
    columns,
    rows,
    export: {
      csvReady: true,
      pdfReady: true,
      suggestedFilename: `${reportKey}-${new Date().toISOString().slice(0, 10)}`,
    },
  };
}

export async function bookingProfitReport(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.customerId) filter.customer = query.customerId;
  if (query.supplierId) filter.supplier = query.supplierId;
  const dateRange = parseDateRange(query);
  if (dateRange) filter.departureDate = dateRange;

  const bookings = await Booking.find(filter)
    .populate('customer', 'name')
    .populate('supplier', 'name')
    .sort({ departureDate: -1 })
    .lean();

  const rows = bookings.map((b) => ({
    bookingNumber: b.bookingNumber,
    customer: b.customer?.name || '',
    supplier: b.supplier?.name || '',
    route: b.route,
    departureDate: b.departureDate,
    status: b.status,
    salePrice: b.salePrice,
    purchasePrice: b.purchasePrice,
    directCosts: b.directCosts,
    profit: b.profit,
    customerDue: b.customerDue,
    supplierPayable: b.supplierPayable,
  }));

  const totals = rows.reduce(
    (acc, r) => ({
      salePrice: acc.salePrice + r.salePrice,
      purchasePrice: acc.purchasePrice + r.purchasePrice,
      directCosts: acc.directCosts + r.directCosts,
      profit: acc.profit + r.profit,
      customerDue: acc.customerDue + r.customerDue,
      supplierPayable: acc.supplierPayable + r.supplierPayable,
    }),
    { salePrice: 0, purchasePrice: 0, directCosts: 0, profit: 0, customerDue: 0, supplierPayable: 0 }
  );

  return {
    ...exportMeta('booking-profit', rows, Object.keys(rows[0] || {})),
    totals,
  };
}

export async function customerDueReport(query) {
  const filter = { customerDue: { $gt: 0 }, status: { $nin: ['cancelled', 'completed'] } };
  if (query.customerId) filter.customer = query.customerId;
  if (query.status) filter.status = query.status;

  const bookings = await Booking.find(filter)
    .populate('customer', 'name phone email')
    .sort({ customerDue: -1 })
    .lean();

  const rows = bookings.map((b) => ({
    bookingNumber: b.bookingNumber,
    customer: b.customer?.name || '',
    phone: b.customer?.phone || '',
    route: b.route,
    departureDate: b.departureDate,
    salePrice: b.salePrice,
    amountPaid: b.amountPaid,
    customerDue: b.customerDue,
    paymentStatus: b.paymentStatus,
    status: b.status,
  }));

  const totalDue = rows.reduce((s, r) => s + r.customerDue, 0);

  return { ...exportMeta('customer-due', rows, Object.keys(rows[0] || {})), totalDue };
}

export async function supplierPayableReport(query) {
  const filter = { supplierPayable: { $gt: 0 }, status: { $nin: ['cancelled'] } };
  if (query.supplierId) filter.supplier = query.supplierId;
  if (query.status) filter.status = query.status;

  const bookings = await Booking.find(filter)
    .populate('supplier', 'name phone')
    .sort({ supplierPayable: -1 })
    .lean();

  const rows = bookings.map((b) => ({
    bookingNumber: b.bookingNumber,
    supplier: b.supplier?.name || '',
    route: b.route,
    departureDate: b.departureDate,
    purchasePrice: b.purchasePrice,
    supplierPaid: b.supplierPaid,
    supplierPayable: b.supplierPayable,
    supplierPaymentStatus: b.supplierPaymentStatus,
    status: b.status,
  }));

  const totalPayable = rows.reduce((s, r) => s + r.supplierPayable, 0);

  return { ...exportMeta('supplier-payable', rows, Object.keys(rows[0] || {})), totalPayable };
}

export async function expenseCategoryReport(query) {
  const filter = { isVoided: false };
  const dateRange = parseDateRange(query);
  if (dateRange) filter.expenseDate = dateRange;

  const expenses = await Expense.find(filter).populate('category', 'name').lean();

  const byCategory = {};
  for (const e of expenses) {
    const key = e.category?.name || 'Uncategorized';
    if (!byCategory[key]) byCategory[key] = { category: key, count: 0, total: 0 };
    byCategory[key].count += 1;
    byCategory[key].total += e.amount;
  }

  const rows = Object.values(byCategory).sort((a, b) => b.total - a.total);
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return { ...exportMeta('expense-category', rows, ['category', 'count', 'total']), grandTotal };
}

export async function accountStatementReport(query) {
  if (!query.accountId) {
    return { ...exportMeta('account-statement', [], []), message: 'accountId required' };
  }

  const filter = { account: query.accountId };
  const dateRange = parseDateRange(query);
  if (dateRange) filter.transactionDate = dateRange;

  const account = await Account.findById(query.accountId).lean();
  const transactions = await AccountTransaction.find(filter)
    .sort({ transactionDate: -1, createdAt: -1 })
    .lean();

  const rows = transactions.map((t) => ({
    transactionNumber: t.transactionNumber,
    type: t.type,
    amount: t.amount,
    balanceAfter: t.balanceAfter,
    transactionDate: t.transactionDate,
    paymentMethod: t.paymentMethod || '',
    referenceNumber: t.referenceNumber || '',
    notes: t.notes || '',
  }));

  return {
    ...exportMeta('account-statement', rows, Object.keys(rows[0] || {})),
    account: account
      ? {
          name: account.name,
          type: account.type,
          typeLabel: ACCOUNT_TYPE_LABELS[account.type],
          currentBalance: account.currentBalance,
        }
      : null,
  };
}

export async function incomeVsExpenseSummary(query) {
  const dateRange = parseDateRange(query) || {};
  const from = dateRange.$gte || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = dateRange.$lte || new Date();

  const [customerPayments, supplierPayments, expenses] = await Promise.all([
    CustomerPayment.find({ paymentDate: { $gte: from, $lte: to }, isVoided: false }).lean(),
    SupplierPayment.find({ paymentDate: { $gte: from, $lte: to }, isVoided: false }).lean(),
    Expense.find({ expenseDate: { $gte: from, $lte: to }, isVoided: false }).lean(),
  ]);

  const cashIn = customerPayments.reduce((s, p) => s + p.amount, 0);
  const supplierOut = supplierPayments.reduce((s, p) => s + p.amount, 0);
  const operatingExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalOut = supplierOut + operatingExpenses;
  const netCash = cashIn - totalOut;

  const rows = [
    { label: 'Customer payments (cash in)', amount: cashIn },
    { label: 'Supplier / ticket payments (cash out)', amount: supplierOut },
    { label: 'Operating expenses (cash out)', amount: operatingExpenses },
    { label: 'Net cash flow', amount: netCash },
  ];

  return {
    ...exportMeta('income-vs-expense', rows, ['label', 'amount']),
    title: 'Cash flow summary',
    period: { from, to },
    income: cashIn,
    supplierPayments: supplierOut,
    expenseTotal: operatingExpenses,
    net: netCash,
  };
}

export async function accountBalanceSummary() {
  const accounts = await Account.find({ isActive: true }).sort({ type: 1 }).lean();

  const rows = accounts.map((a) => ({
    name: a.name,
    type: a.type,
    typeLabel: ACCOUNT_TYPE_LABELS[a.type],
    currentBalance: a.currentBalance,
    openingBalance: a.openingBalance,
  }));

  const totalBalance = rows.reduce((s, r) => s + r.currentBalance, 0);

  return { ...exportMeta('account-balance', rows, Object.keys(rows[0] || {})), totalBalance };
}

export async function monthlySummary(query) {
  const year = parseInt(query.year || new Date().getFullYear(), 10);
  const months = [];

  for (let m = 0; m < 12; m += 1) {
    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 0, 23, 59, 59, 999);

    const [payments, supplierPayments, expenses, bookings] = await Promise.all([
      CustomerPayment.aggregate([
        { $match: { paymentDate: { $gte: start, $lte: end }, isVoided: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      SupplierPayment.aggregate([
        { $match: { paymentDate: { $gte: start, $lte: end }, isVoided: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { expenseDate: { $gte: start, $lte: end }, isVoided: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Booking.aggregate([
        { $match: { departureDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, profit: { $sum: '$profit' }, sales: { $sum: '$salePrice' } } },
      ]),
    ]);

    const cashIn = payments[0]?.total || 0;
    const supplierOut = supplierPayments[0]?.total || 0;
    const expenseOut = expenses[0]?.total || 0;

    months.push({
      month: m + 1,
      monthLabel: start.toLocaleString('en', { month: 'short' }),
      cashIn,
      supplierPayments: supplierOut,
      operatingExpenses: expenseOut,
      netCashFlow: cashIn - supplierOut - expenseOut,
      bookingProfit: bookings[0]?.profit || 0,
      bookingSales: bookings[0]?.sales || 0,
      // legacy keys for existing UI
      income: cashIn,
      expenses: expenseOut,
      net: cashIn - supplierOut - expenseOut,
    });
  }

  return { ...exportMeta('monthly-summary', months, Object.keys(months[0] || {})), year };
}

const REPORT_HANDLERS = {
  'booking-profit': bookingProfitReport,
  'customer-due': customerDueReport,
  'supplier-payable': supplierPayableReport,
  'expense-category': expenseCategoryReport,
  'account-statement': accountStatementReport,
  'income-vs-expense': incomeVsExpenseSummary,
  'account-balance': accountBalanceSummary,
  'monthly-summary': monthlySummary,
};

export async function runReport(reportKey, query) {
  const handler = REPORT_HANDLERS[reportKey];
  if (!handler) return null;
  return handler(query);
}

export function listAvailableReports() {
  return Object.keys(REPORT_HANDLERS).map((key) => ({
    key,
    label: key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
}

export default { runReport, listAvailableReports, ...REPORT_HANDLERS };
