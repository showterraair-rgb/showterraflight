/**
 * One-time script: recalculate booking paid amounts from payment records
 * and sync all customer/supplier totals.
 *
 * Run: node src/scripts/recalculateFinancials.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import {
  recalculateBookingPaidFromPayments,
  syncCustomerTotals,
  syncSupplierTotals,
} from '../services/financialSync.service.js';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected. Recalculating financials...');

  const bookings = await Booking.find().select('_id bookingNumber').lean();
  for (const b of bookings) {
    await recalculateBookingPaidFromPayments(b._id);
    console.log(`  Booking ${b.bookingNumber}`);
  }

  const customers = await Customer.find().select('_id name').lean();
  for (const c of customers) {
    await syncCustomerTotals(c._id);
  }

  const suppliers = await Supplier.find().select('_id name').lean();
  for (const s of suppliers) {
    await syncSupplierTotals(s._id);
  }

  console.log(`Done. ${bookings.length} bookings, ${customers.length} customers, ${suppliers.length} suppliers synced.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
