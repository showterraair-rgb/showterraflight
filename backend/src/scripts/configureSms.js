/**
 * Apply BulkSMSBD credentials from environment to MongoDB SMS settings.
 * Usage (on VPS):
 *   BULKSMSBD_API_KEY=your_key BULKSMSBD_SENDER_ID=8809648909214 BULKSMSBD_ENABLED=true node src/scripts/configureSms.js
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import SmsSetting from '../models/SmsSetting.js';
import { BULKSMSBD_DEFAULTS } from '../services/sms/bulksmsbd.provider.js';

async function run() {
  const apiKey = env.sms.apiKey;
  const senderId = env.sms.senderId;

  if (!apiKey || !senderId) {
    console.error('Set BULKSMSBD_API_KEY and BULKSMSBD_SENDER_ID in backend/.env first.');
    process.exit(1);
  }

  await mongoose.connect(env.mongodbUri);

  const doc = await SmsSetting.findOneAndUpdate(
    { key: 'sms' },
    {
      $set: {
        key: 'sms',
        providerName: BULKSMSBD_DEFAULTS.providerName,
        apiUrl: env.sms.apiUrl,
        apiKey,
        senderId,
        isEnabled: process.env.BULKSMSBD_ENABLED !== 'false',
      },
    },
    { upsert: true, new: true }
  ).lean();

  console.log('SMS settings saved for provider:', doc.providerName);
  console.log('Sender ID:', doc.senderId);
  console.log('Enabled:', doc.isEnabled);
  console.log('API URL:', doc.apiUrl);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
