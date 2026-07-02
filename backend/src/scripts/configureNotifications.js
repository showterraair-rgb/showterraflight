/**
 * Apply BulkSMSBD + Wasender + Gmail SMTP credentials from environment to MongoDB.
 *
 * Usage (on VPS after setting backend/.env):
 *   node src/scripts/configureNotifications.js
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import SmsSetting from '../models/SmsSetting.js';
import EmailSetting from '../models/EmailSetting.js';
import WhatsAppSetting from '../models/WhatsAppSetting.js';
import Setting from '../models/Setting.js';
import { BULKSMSBD_DEFAULTS } from '../services/sms/bulksmsbd.provider.js';

async function run() {
  const smsKey = env.sms.apiKey;
  const smsSender = env.sms.senderId;
  const wasenderKey = env.wasender.apiKey;
  const smtpUser = env.email.username;
  const smtpPass = env.email.password;

  if (!smsKey && !wasenderKey && !smtpUser) {
    console.error('Set BULKSMSBD_API_KEY, WASENDER_API_KEY, and/or SMTP_USER in backend/.env first.');
    process.exit(1);
  }

  await mongoose.connect(env.mongodbUri);

  if (smsKey && smsSender) {
    const sms = await SmsSetting.findOneAndUpdate(
      { key: 'sms' },
      {
        $set: {
          key: 'sms',
          providerName: BULKSMSBD_DEFAULTS.providerName,
          apiUrl: env.sms.apiUrl,
          balanceUrl: env.sms.balanceUrl,
          apiKey: smsKey,
          senderId: smsSender,
          isMasking: env.sms.isMasking,
          isEnabled: env.sms.enabled !== false,
        },
      },
      { upsert: true, new: true }
    ).lean();
    console.log('SMS enabled (BulkSMSBD):', sms.isEnabled);
    console.log('Sender ID:', sms.senderId);
    console.log('API URL:', sms.apiUrl || env.sms.apiUrl);
  }

  if (wasenderKey) {
    const wa = await WhatsAppSetting.findOneAndUpdate(
      { key: 'whatsapp' },
      {
        $set: {
          key: 'whatsapp',
          provider: 'wasender',
          wasenderApiKey: wasenderKey,
          wasenderApiUrl: env.wasender.apiUrl,
          isEnabled: true,
          defaultCountryCode: env.whatsapp.defaultCountryCode || '880',
          defaultLanguageCode: env.whatsapp.defaultLanguageCode || 'en',
        },
      },
      { upsert: true, new: true }
    ).lean();
    console.log('WhatsApp enabled (Wasender):', wa.isEnabled);
    console.log('Wasender API URL:', wa.wasenderApiUrl || env.wasender.apiUrl);
  }

  if (smtpUser && smtpPass) {
    const email = await EmailSetting.findOneAndUpdate(
      { key: 'email' },
      {
        $set: {
          key: 'email',
          smtpHost: env.email.smtpHost || 'smtp.gmail.com',
          smtpPort: env.email.smtpPort || 587,
          username: smtpUser,
          password: smtpPass,
          encryption: env.email.encryption || 'tls',
          fromEmail: env.email.fromEmail || smtpUser,
          fromName: env.email.fromName || 'Show Terra Flight',
          replyTo: env.email.fromEmail || smtpUser,
          isEnabled: true,
        },
      },
      { upsert: true, new: true }
    ).lean();
    console.log('Email SMTP enabled:', email.isEnabled);
    console.log('SMTP host:', email.smtpHost);
    console.log('From:', email.fromEmail);
  }

  const adminEmail = env.email.fromEmail || smtpUser;
  if (adminEmail) {
    await Setting.findOneAndUpdate(
      { key: 'company' },
      {
        $set: {
          'company.ownerEmail': adminEmail,
          'company.email': adminEmail,
        },
      },
      { upsert: false }
    );
    console.log('Company admin email set to:', adminEmail);
  }

  await mongoose.disconnect();
  console.log('\nDone. Restart API: pm2 reload sta-api');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
