import dayjs from 'dayjs';
import Booking from '../models/Booking.js';
import Account from '../models/Account.js';
import Expense from '../models/Expense.js';
import Reminder from '../models/Reminder.js';
import { hasPermission } from '../config/permissions.js';

function startOfToday() {
  return dayjs().startOf('day').toDate();
}

function endOfToday() {
  return dayjs().endOf('day').toDate();
}

export async function getDashboardSummary(user) {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [
    todayBookings,
    pendingBookings,
    issuedTickets,
    bookingAggregates,
    expenseTotal,
    accounts,
    pendingReminders,
  ] = await Promise.all([
    Booking.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
    Booking.countDocuments({ status: { $in: ['draft', 'confirmed'] } }),
    Booking.countDocuments({ status: { $in: ['ticket_issued', 'delivered', 'completed'] } }),
    Booking.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$salePrice' },
          totalPurchase: { $sum: '$purchasePrice' },
          totalDirectCosts: { $sum: '$directCosts' },
          grossProfit: { $sum: '$profit' },
          customerDue: { $sum: '$customerDue' },
          supplierPayable: { $sum: '$supplierPayable' },
        },
      },
    ]),
    Expense.aggregate([{ $match: { isVoided: false } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Account.find({ isActive: true }).select('name type currentBalance').sort({ type: 1 }).lean(),
    Reminder.countDocuments({ status: 'pending', dueDate: { $lte: dayjs().add(7, 'day').toDate() } }),
  ]);

  const agg = bookingAggregates[0] || {
    totalSales: 0,
    totalPurchase: 0,
    totalDirectCosts: 0,
    grossProfit: 0,
    customerDue: 0,
    supplierPayable: 0,
  };

  const expenses = expenseTotal[0]?.total || 0;
  const totalAccountBalance = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const summary = {
    todayBookings,
    pendingBookings,
    issuedTickets,
    customerDue: agg.customerDue,
    supplierPayable: agg.supplierPayable,
    totalSales: agg.totalSales,
    totalPurchase: agg.totalPurchase,
    grossProfit: agg.grossProfit,
    expenseTotal: expenses,
    netPosition: totalAccountBalance,
    pendingReminders,
  };

  const result = { summary };

  if (hasPermission(user.role, 'accounts:view')) {
    result.accountBalances = accounts.map((a) => ({
      id: a._id.toString(),
      name: a.name,
      type: a.type,
      balance: a.currentBalance,
    }));
    result.totalAccountBalance = totalAccountBalance;
  }

  return result;
}

export async function getRecentActivity() {
  const recentBookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('bookingNumber airline route status salePrice createdAt customer')
    .populate('customer', 'name')
    .lean();

  return {
    bookings: recentBookings.map((b) => ({
      id: b._id.toString(),
      bookingNumber: b.bookingNumber,
      customerName: b.customer?.name || '',
      airline: b.airline,
      route: b.route,
      status: b.status,
      salePrice: b.salePrice,
      createdAt: b.createdAt,
    })),
  };
}

export async function getDashboardAlerts() {
  const dueReminders = await Reminder.find({ status: 'pending', dueDate: { $lte: dayjs().add(7, 'day').toDate() } })
    .sort({ dueDate: 1 })
    .limit(5)
    .select('title type dueDate priority')
    .lean();

  return {
    reminders: dueReminders.map((r) => ({
      id: r._id.toString(),
      title: r.title,
      type: r.type,
      dueDate: r.dueDate,
      priority: r.priority,
    })),
  };
}

export default { getDashboardSummary, getRecentActivity, getDashboardAlerts };
