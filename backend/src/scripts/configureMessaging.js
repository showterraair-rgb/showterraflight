/**
 * Configure BulkSMSBD + email/WhatsApp from environment or CLI flags.
 *
 * Usage on VPS:
 *   BULKSMSBD_API_KEY=your_key BULKSMSBD_SENDER_ID=8809648909214 BULKSMSBD_ENABLED=true node src/scripts/configureMessaging.js
 *
 * Or pass flags (avoid storing secrets in shell history when possible):
 *   node src/scripts/configureMessaging.js --api-key=YOUR_KEY --sender-id=8809648909214
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import SmsSetting from '../models/SmsSetting.js';
import { BULKSMSBD_DEFAULTS } from '../services/sms/bulksmsbd.provider.js';

function readArg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

async function configureSms() {
  const apiKey = readArg('api-key') || env.sms.apiKey;
  const senderId = readArg('sender-id') || env.sms.senderId;
  const enabled = process.env.BULKSMSBD_ENABLED !== 'false';

  if (!apiKey || !senderId) {
    console.warn('SMS: skipped — set BULKSMSBD_API_KEY and BULKSMSBD_SENDER_ID in .env or pass --api-key / --sender-id');
    return false;
  }

  await SmsSetting.findOneAndUpdate(
    { key: 'sms' },
    {
      $set: {
        key: 'sms',
        providerName: BULKSMSBD_DEFAULTS.providerName,
        apiUrl: env.sms.apiUrl,
        apiKey,
        senderId,
        isEnabled: enabled,
      },
    },
    { upsert: true, new: true }
  );

  console.log('SMS configured — BulkSMSBD enabled:', enabled);
  console.log('Sender ID:', senderId);
  return true;
}

async function run() {
  await mongoose.connect(env.mongodbUri);
  await configureSms();
  await mongoose.disconnect();
  console.log('\nNext: node src/scripts/configureNotifications.js (email/WhatsApp from .env)');
  console.log('Then: node src/scripts/syncNotificationDefaults.js');
  console.log('Restart: pm2 reload sta-api');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
