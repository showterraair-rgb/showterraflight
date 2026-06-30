/**
 * One-time / maintenance: normalize customer & supplier phone numbers to 01XXXXXXXXX.
 *
 * Usage: node src/scripts/normalizePartyPhones.js
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Order from '../models/Order.js';
import { localBdPhone, isValidBdMobile } from '../utils/phoneUtils.js';

async function normalizeCollection(Model, label) {
  const docs = await Model.find({}).select('phone whatsapp customerPhone').lean();
  let updated = 0;

  for (const doc of docs) {
    const patch = {};
    if (doc.phone) {
      const local = localBdPhone(doc.phone);
      if (local && isValidBdMobile(local) && local !== doc.phone) patch.phone = local;
    }
    if (doc.whatsapp) {
      const local = localBdPhone(doc.whatsapp);
      if (local && isValidBdMobile(local) && local !== doc.whatsapp) patch.whatsapp = local;
    }
    if (doc.customerPhone) {
      const local = localBdPhone(doc.customerPhone);
      if (local && isValidBdMobile(local) && local !== doc.customerPhone) patch.customerPhone = local;
    }
    if (Object.keys(patch).length) {
      await Model.updateOne({ _id: doc._id }, { $set: patch });
      updated += 1;
    }
  }

  console.log(`${label}: ${updated} record(s) normalized`);
  return updated;
}

async function run() {
  await mongoose.connect(env.mongodbUri);
  const total =
    (await normalizeCollection(Customer, 'Customers'))
    + (await normalizeCollection(Supplier, 'Suppliers'))
    + (await normalizeCollection(Order, 'Orders'));
  console.log(`Done. ${total} total record(s) updated.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
