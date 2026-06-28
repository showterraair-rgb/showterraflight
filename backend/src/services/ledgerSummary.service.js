import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import Account from '../models/Account.js';
import Order from '../models/Order.js';
import Booking from '../models/Booking.js';
import NotificationAutomationRule from '../models/NotificationAutomationRule.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import { DEFAULT_NOTIFICATION_TEMPLATES, DEFAULT_AUTOMATION_RULES } from '../config/constants.js';
import { triggerNotificationEventSafe } from './notificationOrchestrator.service.js';
import { getAdminContact } from './notificationSettings.service.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Asia/Dhaka';

function formatShortAmount(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (Math.abs(v) >= 1000) return `${Math.round(v / 1000)}k`;
  return String(Math.round(v));
}

function sumByType(accounts, types) {
  return accounts
    .filter((a) => types.includes(a.type))
    .reduce((s, a) => s + (a.currentBalance || 0), 0);
}

export async function syncManualBookingNotificationDefaults() {
  const tpl = DEFAULT_NOTIFICATION_TEMPLATES.find((t) => t.templateKey === 'manual_order_created');
  await NotificationAutomationRule.findOneAndUpdate(
    { eventType: 'manual_order_created' },
    {
      eventType: 'manual_order_created',
      notifyCustomer: true,
      notifyAdmin: false,
      smsEnabled: true,
      emailEnabled: true,
      whatsappEnabled: true,
      isEnabled: true,
    },
    { upsert: true }
  );
  if (tpl) {
    await NotificationTemplate.findOneAndUpdate(
      { templateKey: 'manual_order_created' },
      {
        templateKey: tpl.templateKey,
        name: tpl.name,
        smsBody: tpl.smsBody,
        whatsappBody: tpl.whatsappBody || tpl.smsBody,
        emailSubject: tpl.emailSubject,
        emailBody: tpl.emailBody,
        isActive: true,
      },
      { upsert: true }
    );
  }
}

export async function syncRrvNotificationDefaults() {
  const eventTypes = ['void_done', 'reissue_done', 'refund_paid', 'refund_requested', 'refund_approved', 'upcoming_flight'];
  for (const eventType of eventTypes) {
    const tpl = DEFAULT_NOTIFICATION_TEMPLATES.find((t) => t.templateKey === eventType);
    const rule = DEFAULT_AUTOMATION_RULES.find((r) => r.eventType === eventType);
    if (rule) {
      await NotificationAutomationRule.findOneAndUpdate(
        { eventType },
        { eventType, ...rule },
        { upsert: true }
      );
    }
    if (tpl) {
      await NotificationTemplate.findOneAndUpdate(
        { templateKey: eventType },
        {
          templateKey: tpl.templateKey,
          name: tpl.name,
          smsBody: tpl.smsBody,
          whatsappBody: tpl.whatsappBody || tpl.smsBody,
          emailSubject: tpl.emailSubject,
          emailBody: tpl.emailBody,
          isActive: true,
        },
        { upsert: true }
      );
    }
  }
}

export async function syncDailyLedgerNotificationDefaults() {
  const tpl = DEFAULT_NOTIFICATION_TEMPLATES.find((t) => t.templateKey === 'daily_ledger_summary');
  await NotificationAutomationRule.findOneAndUpdate(
    { eventType: 'daily_ledger_summary' },
    {
      eventType: 'daily_ledger_summary',
      notifyCustomer: false,
      notifyAdmin: true,
      smsEnabled: true,
      emailEnabled: false,
      whatsappEnabled: true,
      isEnabled: true,
    },
    { upsert: true }
  );
  if (tpl) {
    await NotificationTemplate.findOneAndUpdate(
      { templateKey: 'daily_ledger_summary' },
      {
        templateKey: tpl.templateKey,
        name: tpl.name,
        smsBody: tpl.smsBody,
        whatsappBody: tpl.whatsappBody || tpl.smsBody,
        emailSubject: tpl.emailSubject,
        emailBody: tpl.emailBody,
        isActive: true,
      },
      { upsert: true }
    );
  }
}

export async function syncBackupFailureNotificationDefaults() {
  const tpl = DEFAULT_NOTIFICATION_TEMPLATES.find((t) => t.templateKey === 'backup_failed');
  const rule = DEFAULT_AUTOMATION_RULES.find((r) => r.eventType === 'backup_failed');
  if (rule) {
    await NotificationAutomationRule.findOneAndUpdate(
      { eventType: 'backup_failed' },
      { eventType: 'backup_failed', ...rule },
      { upsert: true }
    );
  }
  if (tpl) {
    await NotificationTemplate.findOneAndUpdate(
      { templateKey: 'backup_failed' },
      {
        templateKey: tpl.templateKey,
        name: tpl.name,
        smsBody: tpl.smsBody,
        whatsappBody: tpl.whatsappBody || tpl.smsBody,
        emailSubject: tpl.emailSubject,
        emailBody: tpl.emailBody,
        isActive: true,
      },
      { upsert: true }
    );
  }
}

export async function buildDailyLedgerSummary() {
  const start = dayjs().tz(TZ).startOf('day').toDate();
  const end = dayjs().tz(TZ).endOf('day').toDate();
  const reportDate = dayjs().tz(TZ).format('D MMM');

  const activeStatuses = { $nin: ['voided', 'cancelled', 'refunded'] };

  const [accounts, todayOrders, todayBookings, totalBookings, bookingAgg, overdueRows] = await Promise.all([
    Account.find({ isActive: true }).select('name type currentBalance').lean(),
    Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    Booking.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    Booking.countDocuments({ status: activeStatuses }),
    Booking.aggregate([
      { $match: { status: activeStatuses } },
      {
        $group: {
          _id: null,
          customerDue: { $sum: '$customerDue' },
          supplierPayable: { $sum: '$supplierPayable' },
          grossProfit: { $sum: '$profit' },
        },
      },
    ]),
    Booking.find({
      customerDue: { $gt: 0 },
      departureDate: { $lt: start },
      status: activeStatuses,
    }).select('customerDue').lean(),
  ]);

  const totalBalance = accounts.reduce((s, a) => s + (a.currentBalance || 0), 0);
  const bankBalance = sumByType(accounts, ['bank']);
  const cashBalance = sumByType(accounts, ['cash']);
  const mfsBalance = sumByType(accounts, ['bkash', 'nagad']);
  const agg = bookingAgg[0] || { customerDue: 0, supplierPayable: 0, grossProfit: 0 };
  const overdueDue = overdueRows.reduce((s, b) => s + (b.customerDue || 0), 0);

  const shortSummary = [
    `STF ${reportDate}`,
    `Ledger ৳${formatShortAmount(totalBalance)}`,
    `(Bank ৳${formatShortAmount(bankBalance)} Cash ৳${formatShortAmount(cashBalance)} MFS ৳${formatShortAmount(mfsBalance)})`,
    `Bkg ${todayBookings} today / ${totalBookings} active`,
    `Due Cust ৳${formatShortAmount(agg.customerDue)} Sup ৳${formatShortAmount(agg.supplierPayable)}`,
    `Overdue ৳${formatShortAmount(overdueDue)}`,
  ].join(' | ');

  return {
    reportDate,
    totalBalance: Math.round(totalBalance),
    bankBalance: Math.round(bankBalance),
    cashBalance: Math.round(cashBalance),
    mfsBalance: Math.round(mfsBalance),
    todayOrders,
    todayBookings,
    totalBookings,
    customerDue: Math.round(agg.customerDue),
    supplierPayable: Math.round(agg.supplierPayable),
    grossProfit: Math.round(agg.grossProfit),
    overdueDue: Math.round(overdueDue),
    shortSummary,
  };
}

export async function sendDailyLedgerNotifyToAdmin() {
  const summary = await buildDailyLedgerSummary();
  const admin = await getAdminContact();

  if (!admin.adminPhone && !admin.adminWhatsapp) {
    console.warn('[ledger] No admin phone/WhatsApp configured — skipping daily notify');
    return { skipped: true, reason: 'no admin contact' };
  }

  await triggerNotificationEventSafe('daily_ledger_summary', {
    vars: {
      reportDate: summary.reportDate,
      totalBalance: summary.totalBalance,
      bankBalance: summary.bankBalance,
      cashBalance: summary.cashBalance,
      mfsBalance: summary.mfsBalance,
      todayOrders: summary.todayOrders,
      todayBookings: summary.todayBookings,
      totalBookings: summary.totalBookings,
      customerDue: summary.customerDue,
      supplierPayable: summary.supplierPayable,
      grossProfit: summary.grossProfit,
      overdueDue: summary.overdueDue,
      shortSummary: summary.shortSummary,
    },
  });

  console.log('[ledger] Daily admin notify:', summary.shortSummary);
  return { sent: true, summary };
}

/** @deprecated use sendDailyLedgerNotifyToAdmin */
export const sendDailyLedgerSmsToAdmin = sendDailyLedgerNotifyToAdmin;

export default {
  buildDailyLedgerSummary,
  sendDailyLedgerNotifyToAdmin,
  sendDailyLedgerSmsToAdmin,
  syncDailyLedgerNotificationDefaults,
  syncBackupFailureNotificationDefaults,
};
