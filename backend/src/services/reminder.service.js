import Reminder from '../models/Reminder.js';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Expense from '../models/Expense.js';
import ApiError from '../utils/ApiError.js';
import { parsePaginationQuery, buildPaginationResponse } from '../utils/pagination.js';
import { sendNotification, resolveReminderChannel } from './notification.service.js';
import { triggerNotificationEvent } from './notificationOrchestrator.service.js';
import { buildBookingNotificationContext } from '../utils/notificationContext.js';
import { logAudit } from './audit.service.js';

function formatReminder(doc) {
  return {
    id: doc._id.toString(),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    dueDate: doc.dueDate,
    status: doc.status,
    priority: doc.priority,
    customerId: doc.customer?._id?.toString() || doc.customer?.toString(),
    customerName: doc.customer?.name,
    supplierId: doc.supplier?._id?.toString() || doc.supplier?.toString(),
    supplierName: doc.supplier?.name,
    bookingId: doc.booking?._id?.toString() || doc.booking?.toString(),
    bookingNumber: doc.booking?.bookingNumber,
    orderId: doc.order?.toString(),
    expenseId: doc.expense?.toString(),
    assignedToId: doc.assignedTo?._id?.toString() || doc.assignedTo?.toString(),
    assignedToName: doc.assignedTo?.name,
    sentAt: doc.sentAt,
    failedAt: doc.failedAt,
    failureReason: doc.failureReason,
    deliveryChannel: doc.deliveryChannel,
    attemptCount: doc.attemptCount || 0,
    completedAt: doc.completedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const POPULATE = [
  { path: 'customer', select: 'name phone email' },
  { path: 'supplier', select: 'name phone email' },
  { path: 'booking', select: 'bookingNumber departureDate route' },
  { path: 'assignedTo', select: 'name email' },
];

export async function listReminders(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'dueDate');
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.priority) filter.priority = query.priority;
  if (query.customerId) filter.customer = query.customerId;
  if (query.supplierId) filter.supplier = query.supplierId;
  if (query.from || query.to) {
    filter.dueDate = {};
    if (query.from) filter.dueDate.$gte = new Date(query.from);
    if (query.to) filter.dueDate.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    Reminder.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(limit).lean(),
    Reminder.countDocuments(filter),
  ]);

  return {
    items: items.map(formatReminder),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getReminderById(id) {
  const doc = await Reminder.findById(id).populate(POPULATE).lean();
  if (!doc) throw ApiError.notFound('Reminder not found');
  return formatReminder(doc);
}

export async function createManualReminder(data, userId, req) {
  const reminder = await Reminder.create({
    type: 'manual_task',
    title: data.title,
    message: data.message || '',
    dueDate: new Date(data.dueDate),
    priority: data.priority || 'medium',
    assignedTo: data.assignedToId,
    customer: data.customerId,
    supplier: data.supplierId,
    booking: data.bookingId,
    status: 'pending',
    createdBy: userId,
  });

  await logAudit({
    action: 'create',
    module: 'reminders',
    entityType: 'Reminder',
    entityId: reminder._id,
    description: `Manual reminder created: ${data.title}`,
    userId,
    req,
  });

  return getReminderById(reminder._id);
}

export async function updateReminderStatus(id, { status }, userId, req) {
  const reminder = await Reminder.findById(id);
  if (!reminder) throw ApiError.notFound('Reminder not found');

  reminder.status = status;
  if (status === 'completed') {
    reminder.completedAt = new Date();
    reminder.completedBy = userId;
  }
  if (status === 'dismissed') {
    reminder.completedAt = new Date();
    reminder.completedBy = userId;
  }
  await reminder.save();

  await logAudit({
    action: 'update',
    module: 'reminders',
    entityType: 'Reminder',
    entityId: reminder._id,
    description: `Reminder marked ${status}`,
    userId,
    req,
  });

  return getReminderById(id);
}

async function upsertReminder({ type, title, message, dueDate, priority, customer, supplier, booking, expense }) {
  const startOfDay = new Date(dueDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dueDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await Reminder.findOne({
    type,
    customer: customer || undefined,
    supplier: supplier || undefined,
    booking: booking || undefined,
    expense: expense || undefined,
    dueDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'sent'] },
  });

  if (existing) {
    existing.title = title;
    existing.message = message;
    existing.priority = priority || existing.priority;
    await existing.save();
    return existing;
  }

  return Reminder.create({
    type,
    title,
    message,
    dueDate,
    priority: priority || 'medium',
    customer,
    supplier,
    booking,
    expense,
    status: 'pending',
  });
}

export async function generateCustomerDueReminders() {
  const bookings = await Booking.find({
    customerDue: { $gt: 0 },
    status: { $nin: ['cancelled', 'completed'] },
  })
    .populate('customer', 'name phone email')
    .lean();

  let created = 0;
  for (const b of bookings) {
    await upsertReminder({
      type: 'customer_due',
      title: `Customer due: ${b.bookingNumber}`,
      message: `${b.customer?.name || 'Customer'} owes BDT ${b.customerDue} for booking ${b.bookingNumber} (${b.route}).`,
      dueDate: new Date(),
      priority: b.customerDue > 50000 ? 'high' : 'medium',
      customer: b.customer?._id,
      booking: b._id,
    });
    created += 1;
  }
  return { type: 'customer_due', generated: created };
}

export async function generateTravelReminders(daysBefore = 3) {
  const target = new Date();
  target.setDate(target.getDate() + daysBefore);
  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);

  const bookings = await Booking.find({
    departureDate: { $gte: start, $lte: end },
    status: { $in: ['confirmed', 'ticket_issued', 'delivered'] },
  })
    .populate('customer', 'name phone')
    .lean();

  let created = 0;
  for (const b of bookings) {
    await upsertReminder({
      type: 'booking_travel',
      title: `Travel in ${daysBefore} days: ${b.bookingNumber}`,
      message: `${b.customer?.name || 'Passenger'} travels ${b.route} on ${new Date(b.departureDate).toLocaleDateString()}. PNR: ${b.pnr || 'N/A'}.`,
      dueDate: new Date(),
      priority: 'high',
      customer: b.customer?._id,
      booking: b._id,
    });
    created += 1;
  }
  return { type: 'booking_travel', generated: created };
}

export async function generateSupplierPayableReminders() {
  const bookings = await Booking.find({
    supplierPayable: { $gt: 0 },
    status: { $nin: ['cancelled'] },
  })
    .populate('supplier', 'name phone email')
    .lean();

  let created = 0;
  for (const b of bookings) {
    if (!b.supplier) continue;
    await upsertReminder({
      type: 'supplier_payable',
      title: `Supplier payable: ${b.bookingNumber}`,
      message: `Pay ${b.supplier.name} BDT ${b.supplierPayable} for booking ${b.bookingNumber}.`,
      dueDate: new Date(),
      priority: 'medium',
      supplier: b.supplier._id,
      booking: b._id,
    });
    created += 1;
  }
  return { type: 'supplier_payable', generated: created };
}

export async function generateRecurringExpenseReminders() {
  const expenses = await Expense.find({
    isRecurring: true,
    isVoided: false,
    nextDueDate: { $lte: new Date() },
  })
    .populate('category', 'name')
    .lean();

  let created = 0;
  for (const e of expenses) {
    await upsertReminder({
      type: 'recurring_expense',
      title: `Recurring expense due: ${e.title}`,
      message: `${e.title} (BDT ${e.amount}) is due. Category: ${e.category?.name || 'N/A'}.`,
      dueDate: e.nextDueDate || new Date(),
      priority: 'medium',
      expense: e._id,
    });
    created += 1;
  }
  return { type: 'recurring_expense', generated: created };
}

export async function sendPendingReminders() {
  const pending = await Reminder.find({ status: 'pending', dueDate: { $lte: new Date() } })
    .populate('customer supplier booking')
    .limit(50);

  let sent = 0;
  let failed = 0;

  for (const reminder of pending) {
    if (reminder.type === 'customer_due' && reminder.booking) {
      reminder.attemptCount = (reminder.attemptCount || 0) + 1;
      try {
        const result = await triggerNotificationEvent('payment_due_reminder', buildBookingNotificationContext(
          reminder.booking,
          reminder.customer,
          { dueAmount: reminder.booking.customerDue ?? 0 }
        ));
        if (result?.sent > 0 || result?.results?.some((r) => r.success)) {
          reminder.status = 'sent';
          reminder.sentAt = new Date();
          sent += 1;
        } else if (result?.skipped) {
          reminder.status = 'sent';
          reminder.sentAt = new Date();
          sent += 1;
        } else {
          reminder.status = 'failed';
          reminder.failedAt = new Date();
          reminder.failureReason = result?.error || 'No notification channels available';
          failed += 1;
        }
      } catch (err) {
        reminder.status = 'failed';
        reminder.failedAt = new Date();
        reminder.failureReason = err.message;
        failed += 1;
      }
      await reminder.save();
      continue;
    }

    const channel = resolveReminderChannel(reminder.type);
    const to =
      reminder.customer?.phone ||
      reminder.customer?.email ||
      reminder.supplier?.phone ||
      reminder.supplier?.email ||
      'admin@showterraair.com';

    reminder.attemptCount = (reminder.attemptCount || 0) + 1;
    reminder.deliveryChannel = channel;

    try {
      const result = await sendNotification({
        channel,
        to,
        subject: reminder.title,
        message: reminder.message,
        metadata: { reminderId: reminder._id.toString(), type: reminder.type },
      });

      if (result.success) {
        reminder.status = 'sent';
        reminder.sentAt = new Date();
        sent += 1;
      } else {
        reminder.status = 'failed';
        reminder.failedAt = new Date();
        reminder.failureReason = result.error || 'Delivery failed';
        failed += 1;
      }
    } catch (err) {
      reminder.status = 'failed';
      reminder.failedAt = new Date();
      reminder.failureReason = err.message;
      failed += 1;
    }

    await reminder.save();
  }

  return { sent, failed, processed: pending.length };
}

export async function runAllGenerators() {
  const results = await Promise.all([
    generateCustomerDueReminders(),
    generateTravelReminders(3),
    generateTravelReminders(1),
    generateSupplierPayableReminders(),
    generateRecurringExpenseReminders(),
  ]);
  return results;
}

export default {
  listReminders,
  getReminderById,
  createManualReminder,
  updateReminderStatus,
  generateCustomerDueReminders,
  generateTravelReminders,
  generateSupplierPayableReminders,
  generateRecurringExpenseReminders,
  sendPendingReminders,
  runAllGenerators,
};
