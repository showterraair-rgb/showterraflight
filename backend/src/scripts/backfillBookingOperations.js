/**
 * Backfill BookingOperation records from legacy booking ledger fields.
 * Also sets passengerName and saleType where missing.
 *
 * Run:
 *   node src/scripts/backfillBookingOperations.js
 *   node src/scripts/backfillBookingOperations.js --dry-run
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { backfillBookingOperations } from '../services/bookingOperation.service.js';
import { syncRrvNotificationDefaults } from '../services/ledgerSummary.service.js';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  const dryRun = process.argv.includes('--dry-run');

  await mongoose.connect(uri);
  console.log(`Connected. Backfilling booking operations${dryRun ? ' (dry run)' : ''}...`);

  await syncRrvNotificationDefaults();
  console.log('RRV notification templates/rules synced.');

  const stats = await backfillBookingOperations({ dryRun });
  console.log(JSON.stringify(stats, null, 2));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
