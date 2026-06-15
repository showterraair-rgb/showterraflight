import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import Account from '../models/Account.js';
import Order from '../models/Order.js';
import Booking from '../models/Booking.js';
import { triggerNotificationEventSafe } from './notificationOrchestrator.service.js';
import { getAdminContact } from './notificationSettings.service.js';

dayjs.extend(utc);
dayjs.extend(timezone);

function formatShortAmount(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (Math.abs(v) >= 1000) return `${Math.round(v / 1000)}k`;
  return String(Math.round(v));
}

export async function buildDailyLedgerSummary() {
  const tz = 'Asia/Dhaka';
  const start = dayjs().tz(tz).startOf('day').toDate();
  const end = dayjs().tz(tz).endOf('day').toDate();
  const reportDate = dayjs().tz(tz).format('D MMM');

  const [accounts, todayOrders, todayBookings, bookingAgg] = await Promise.all([
    Account.find({ isActive: true }).select('currentBalance').lean(),
    Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    Booking.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    Booking.aggregate([
      {
        $group: {
          _id: null,
          customerDue: { $sum: '$customerDue' },
          supplierPayable: { $sum: '$supplierPayable' },
          grossProfit: { $sum: '$profit' },
        },
      },
    ]),
  ]);

  const totalBalance = accounts.reduce((s, a) => s + (a.currentBalance || 0), 0);
  const agg = bookingAgg[0] || { customerDue: 0, supplierPayable: 0, grossProfit: 0 };

  return {
    reportDate,
    totalBalance,
    todayOrders,
    todayBookings,
    customerDue: agg.customerDue,
    supplierPayable: agg.supplierPayable,
    grossProfit: agg.grossProfit,
    smsPreview: `STF ${reportDate}: Acct ৳${formatShortAmount(totalBalance)} | Ord ${todayOrders} Bkg ${todayBookings} | Due ৳${formatShortAmount(agg.customerDue)} Sup ৳${formatShortAmount(agg.supplierPayable)}`,
  };
}

export async function sendDailyLedgerSmsToAdmin() {
  const summary = await buildDailyLedgerSummary();
  const admin = await getAdminContact();

  if (!admin.adminPhone) {
    console.warn('[ledger] No admin phone configured — skipping daily SMS');
    return { skipped: true, reason: 'no admin phone' };
  }

  await triggerNotificationEventSafe('daily_ledger_summary', {
    vars: {
      reportDate: summary.reportDate,
      totalBalance: Math.round(summary.totalBalance),
      todayOrders: summary.todayOrders,
      todayBookings: summary.todayBookings,
      customerDue: Math.round(summary.customerDue),
      supplierPayable: Math.round(summary.supplierPayable),
      grossProfit: Math.round(summary.grossProfit),
    },
  });

  console.log('[ledger] Daily SMS sent:', summary.smsPreview);
  return { sent: true, summary };
}

export default { buildDailyLedgerSummary, sendDailyLedgerSmsToAdmin };
