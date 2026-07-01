/**
 * Remove all operational CRM data: bookings, orders, payments, customers,
 * suppliers, agents, and related ledger entries.
 *
 * KEEPS: admin users, roles, accounts (cash/bank), expenses, CMS, settings,
 * notification templates, audit logs.
 *
 * Usage:
 *   node src/scripts/clearBusinessData.js           # dry-run (preview only)
 *   node src/scripts/clearBusinessData.js --confirm # execute deletion
 */
import mongoose from 'mongoose';
import env from '../config/env.js';
import Booking from '../models/Booking.js';
import BookingOperation from '../models/BookingOperation.js';
import Order from '../models/Order.js';
import Ticket from '../models/Ticket.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import CustomerPayment from '../models/CustomerPayment.js';
import SupplierPayment from '../models/SupplierPayment.js';
import PaymentRequest from '../models/PaymentRequest.js';
import GatewayPayment from '../models/GatewayPayment.js';
import Transfer from '../models/Transfer.js';
import AccountTransaction from '../models/AccountTransaction.js';
import Account from '../models/Account.js';
import Reminder from '../models/Reminder.js';
import NotificationLog from '../models/NotificationLog.js';
import Agent from '../models/Agent.js';
import AgentBooking from '../models/AgentBooking.js';
import AgentTransaction from '../models/AgentTransaction.js';
import AgentNotification from '../models/AgentNotification.js';

const CONFIRMED = process.argv.includes('--confirm');

const PURGE_MODELS = [
  { name: 'Notification logs (booking/order/customer)', model: NotificationLog, filter: {} },
  { name: 'Reminders', model: Reminder, filter: {} },
  { name: 'Gateway payments', model: GatewayPayment, filter: {} },
  { name: 'Payment requests', model: PaymentRequest, filter: {} },
  { name: 'Customer payments', model: CustomerPayment, filter: {} },
  { name: 'Supplier payments', model: SupplierPayment, filter: {} },
  { name: 'Account transfers', model: Transfer, filter: {} },
  { name: 'Account transactions (full ledger)', model: AccountTransaction, filter: {} },
  { name: 'Booking operations', model: BookingOperation, filter: {} },
  { name: 'Tickets', model: Ticket, filter: {} },
  { name: 'Bookings', model: Booking, filter: {} },
  { name: 'Orders', model: Order, filter: {} },
  { name: 'Agent notifications', model: AgentNotification, filter: {} },
  { name: 'Agent bookings', model: AgentBooking, filter: {} },
  { name: 'Agent transactions', model: AgentTransaction, filter: {} },
  { name: 'Agents', model: Agent, filter: {} },
  { name: 'Customers', model: Customer, filter: {} },
  { name: 'Suppliers', model: Supplier, filter: {} },
];

async function countAll() {
  const rows = [];
  for (const item of PURGE_MODELS) {
    const count = await item.model.countDocuments(item.filter);
    rows.push({ name: item.name, count });
  }
  return rows;
}

async function purgeAll() {
  const results = [];
  for (const item of PURGE_MODELS) {
    const res = await item.model.deleteMany(item.filter);
    results.push({ name: item.name, deleted: res.deletedCount ?? 0 });
  }
  return results;
}

async function resetAccountBalances() {
  const accounts = await Account.find().select('_id name openingBalance').lean();
  let updated = 0;
  for (const acc of accounts) {
    await Account.updateOne(
      { _id: acc._id },
      {
        $set: {
          currentBalance: acc.openingBalance ?? 0,
          lastClosingDate: null,
          lastClosingBalance: null,
        },
      }
    );
    updated += 1;
  }
  return updated;
}

async function run() {
  await mongoose.connect(env.mongodbUri);
  console.log('Connected to MongoDB\n');

  const preview = await countAll();
  const total = preview.reduce((sum, row) => sum + row.count, 0);

  console.log('Records to delete:');
  for (const row of preview) {
    console.log(`  ${row.name}: ${row.count}`);
  }
  console.log(`  TOTAL: ${total}\n`);

  if (!CONFIRMED) {
    console.log('Dry run only. Re-run with --confirm to delete all data listed above.');
    console.log('Account balances will be reset to opening balance after purge.');
    await mongoose.disconnect();
    return;
  }

  if (total === 0) {
    console.log('Nothing to delete.');
    await mongoose.disconnect();
    return;
  }

  console.log('Deleting...');
  const deleted = await purgeAll();
  for (const row of deleted) {
    console.log(`  ✓ ${row.name}: ${row.deleted} removed`);
  }

  const accountsReset = await resetAccountBalances();
  console.log(`\n✓ Reset ${accountsReset} account balance(s) to opening balance`);
  console.log('\nKept: users, roles, accounts, expenses, CMS, company settings, notification config.');
  console.log('Done.');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
