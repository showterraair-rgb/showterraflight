import dayjs from 'dayjs';
import Booking from '../models/Booking.js';
import Account from '../models/Account.js';
import Expense from '../models/Expense.js';
import Reminder from '../models/Reminder.js';
import NotificationLog from '../models/NotificationLog.js';
import BackupLog from '../models/BackupLog.js';
import { hasPermission } from '../config/permissions.js';

const ACTIVE_BOOKING_STATUSES = { $nin: ['voided', 'cancelled', 'refunded'] };

function startOfToday() {
  return dayjs().startOf('day').toDate();
}

function endOfToday() {
  return dayjs().endOf('day').toDate();
}

function paymentAlertColor(booking) {
  if (booking.paymentStatus === 'paid' || (booking.customerDue || 0) <= 0) return 'green';
  if (booking.duePaymentAt) {
    const due = dayjs(booking.duePaymentAt);
    if (due.isBefore(dayjs())) return 'red';
    if (due.isBefore(dayjs().add(3, 'day'))) return 'yellow';
  }
  if (booking.paymentStatus === 'partial') return 'yellow';
  return 'red';
}

export async function getPaymentAlerts(limit = 20) {
  const bookings = await Booking.find({
    customerDue: { $gt: 0 },
    status: { $nin: ['cancelled', 'voided', 'refunded'] },
  })
    .sort({ duePaymentAt: 1, departureDate: 1 })
    .limit(limit)
    .populate('customer', 'name phone email')
    .lean();

  return bookings.map((b) => ({
    id: b._id.toString(),
    bookingNumber: b.bookingNumber,
    customerName: b.customer?.name,
    customerPhone: b.customer?.phone,
    customerEmail: b.customer?.email,
    customerDue: b.customerDue,
    duePaymentAt: b.duePaymentAt,
    departureDate: b.departureDate,
    paymentStatus: b.paymentStatus,
    alertColor: paymentAlertColor(b),
  }));
}

export async function getDashboardSummary(user) {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [
    todayBookings,
    pendingBookings,
    issuedTickets,
    totalActiveBookings,
    voidedCount,
    refundedCount,
    reissuedCount,
    dueCollectionCount,
    dueSupplierCount,
    bookingAggregates,
    expenseTotal,
    accounts,
    pendingReminders,
    failedNotifications24h,
    lastBackup,
  ] = await Promise.all([
    Booking.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
    Booking.countDocuments({ status: { $in: ['draft', 'confirmed'] } }),
    Booking.countDocuments({ status: { $in: ['ticket_issued', 'delivered', 'completed'] } }),
    Booking.countDocuments({ status: ACTIVE_BOOKING_STATUSES }),
    Booking.countDocuments({ status: 'voided' }),
    Booking.countDocuments({ status: 'refunded' }),
    Booking.countDocuments({ status: 'reissued' }),
    Booking.countDocuments({ customerDue: { $gt: 0 }, status: ACTIVE_BOOKING_STATUSES }),
    Booking.countDocuments({ supplierPayable: { $gt: 0 }, status: ACTIVE_BOOKING_STATUSES }),
    Booking.aggregate([
      { $match: { status: ACTIVE_BOOKING_STATUSES } },
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
    NotificationLog.countDocuments({
      status: 'failed',
      createdAt: { $gte: dayjs().subtract(24, 'hour').toDate() },
    }),
    BackupLog.findOne().sort({ createdAt: -1 }).select('status fileName completedAt errorMessage createdAt').lean(),
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
    totalActiveBookings,
    voidedCount,
    refundedCount,
    reissuedCount,
    dueCollectionCount,
    dueSupplierCount,
    customerDue: agg.customerDue,
    supplierPayable: agg.supplierPayable,
    totalSales: agg.totalSales,
    totalPurchase: agg.totalPurchase,
    grossProfit: agg.grossProfit,
    expenseTotal: expenses,
    netPosition: totalAccountBalance,
    pendingReminders,
    failedNotifications24h,
    lastBackupStatus: lastBackup?.status || 'unknown',
    lastBackupAt: lastBackup?.completedAt || lastBackup?.createdAt || null,
  };

  const result = { summary };

  if (hasPermission(user.role, 'accounts:view', user.permissions)) {
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
  const todayStart = dayjs().startOf('day').toDate();

  const [dueReminders, paymentAlerts, supplierAlerts, failedNotifications, lastFailedBackup] = await Promise.all([
    Reminder.find({ status: 'pending', dueDate: { $lte: dayjs().add(7, 'day').toDate() } })
      .sort({ dueDate: 1 })
      .limit(5)
      .select('title type dueDate priority')
      .lean(),
    getPaymentAlerts(10),
    Booking.find({
      supplierPayable: { $gt: 0 },
      status: ACTIVE_BOOKING_STATUSES,
      departureDate: { $lt: todayStart },
    })
      .sort({ departureDate: 1 })
      .limit(8)
      .populate('supplier', 'name company phone')
      .select('bookingNumber supplierPayable departureDate route supplierName')
      .lean(),
    NotificationLog.find({ status: 'failed' })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('eventType channel recipient errorMessage createdAt')
      .lean(),
    BackupLog.findOne({ status: 'failed' }).sort({ createdAt: -1 }).lean(),
  ]);

  return {
    reminders: dueReminders.map((r) => ({
      id: r._id.toString(),
      title: r.title,
      type: r.type,
      dueDate: r.dueDate,
      priority: r.priority,
    })),
    paymentAlerts,
    supplierAlerts: supplierAlerts.map((b) => ({
      id: b._id.toString(),
      bookingNumber: b.bookingNumber,
      supplierName: b.supplier?.company || b.supplier?.name || '',
      supplierPayable: b.supplierPayable,
      departureDate: b.departureDate,
      route: b.route,
    })),
    failedNotifications: failedNotifications.map((n) => ({
      id: n._id.toString(),
      eventType: n.eventType,
      channel: n.channel,
      recipient: n.recipient,
      errorMessage: n.errorMessage,
      createdAt: n.createdAt,
    })),
    backupFailure: lastFailedBackup ? {
      id: lastFailedBackup._id.toString(),
      fileName: lastFailedBackup.fileName,
      errorMessage: lastFailedBackup.errorMessage,
      createdAt: lastFailedBackup.createdAt,
    } : null,
  };
}

export default { getDashboardSummary, getRecentActivity, getDashboardAlerts, getPaymentAlerts };
