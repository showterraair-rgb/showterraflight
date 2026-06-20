import SmsSetting from '../models/SmsSetting.js';
import EmailSetting from '../models/EmailSetting.js';
import WhatsAppSetting from '../models/WhatsAppSetting.js';
import Setting from '../models/Setting.js';
import { COMPANY_DEFAULTS } from '../config/constants.js';
import { logAudit } from './audit.service.js';

const SMS_DEFAULTS = {
  providerName: 'BulkSMSBD',
  apiUrl: 'http://bulksmsbd.net/api/smsapi',
  apiKey: '',
  apiToken: '',
  senderId: '',
  username: '',
  password: '',
  isEnabled: false,
};

const EMAIL_DEFAULTS = {
  smtpHost: '',
  smtpPort: 587,
  username: '',
  password: '',
  encryption: 'tls',
  fromEmail: '',
  fromName: 'Show Terra Flight',
  replyTo: '',
  isEnabled: false,
};

const WHATSAPP_DEFAULTS = {
  accessToken: '',
  phoneNumberId: '',
  businessAccountId: '',
  webhookVerifyToken: '',
  apiVersion: 'v21.0',
  defaultCountryCode: '880',
  defaultLanguageCode: 'en',
  testTemplateName: 'hello_world',
  isEnabled: false,
};

function formatSms(doc) {
  if (!doc) return { ...SMS_DEFAULTS };
  return {
    providerName: doc.providerName || '',
    apiUrl: doc.apiUrl || '',
    apiKey: doc.apiKey || '',
    apiToken: doc.apiToken || '',
    senderId: doc.senderId || '',
    username: doc.username || '',
    password: doc.password ? '********' : '',
    isEnabled: Boolean(doc.isEnabled),
    updatedAt: doc.updatedAt,
  };
}

function formatEmail(doc) {
  if (!doc) return { ...EMAIL_DEFAULTS };
  return {
    smtpHost: doc.smtpHost || '',
    smtpPort: doc.smtpPort ?? 587,
    username: doc.username || '',
    password: doc.password ? '********' : '',
    encryption: doc.encryption || 'tls',
    fromEmail: doc.fromEmail || '',
    fromName: doc.fromName || '',
    replyTo: doc.replyTo || '',
    isEnabled: Boolean(doc.isEnabled),
    updatedAt: doc.updatedAt,
  };
}

function formatWhatsApp(doc) {
  if (!doc) return { ...WHATSAPP_DEFAULTS };
  return {
    accessToken: doc.accessToken ? '********' : '',
    phoneNumberId: doc.phoneNumberId || '',
    businessAccountId: doc.businessAccountId || '',
    webhookVerifyToken: doc.webhookVerifyToken ? '********' : '',
    apiVersion: doc.apiVersion || 'v21.0',
    defaultCountryCode: doc.defaultCountryCode || '880',
    defaultLanguageCode: doc.defaultLanguageCode || 'en',
    testTemplateName: doc.testTemplateName || 'hello_world',
    isEnabled: Boolean(doc.isEnabled),
    updatedAt: doc.updatedAt,
  };
}

export async function getSmsSettings() {
  const doc = await SmsSetting.findOne({ key: 'sms' }).lean();
  return formatSms(doc);
}

export async function updateSmsSettings(data, userId, req) {
  const update = { ...data, updatedBy: userId };
  if (update.password === '********') delete update.password;

  const doc = await SmsSetting.findOneAndUpdate(
    { key: 'sms' },
    { $set: update, $setOnInsert: { key: 'sms' } },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  await logAudit({
    action: 'update',
    module: 'settings',
    entityType: 'SmsSetting',
    entityId: doc._id,
    description: 'SMS settings updated',
    userId,
    req,
  });

  return formatSms(doc);
}

export async function getEmailSettings() {
  const doc = await EmailSetting.findOne({ key: 'email' }).lean();
  return formatEmail(doc);
}

export async function updateEmailSettings(data, userId, req) {
  const update = { ...data, updatedBy: userId };
  if (update.password === '********') delete update.password;

  const doc = await EmailSetting.findOneAndUpdate(
    { key: 'email' },
    { $set: update, $setOnInsert: { key: 'email' } },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  await logAudit({
    action: 'update',
    module: 'settings',
    entityType: 'EmailSetting',
    entityId: doc._id,
    description: 'Email settings updated',
    userId,
    req,
  });

  return formatEmail(doc);
}

export async function getWhatsAppSettings() {
  const doc = await WhatsAppSetting.findOne({ key: 'whatsapp' }).lean();
  return formatWhatsApp(doc);
}

export async function updateWhatsAppSettings(data, userId, req) {
  const existing = await WhatsAppSetting.findOne({ key: 'whatsapp' }).lean();
  const update = { ...data, updatedBy: userId };
  if (update.accessToken === '********') delete update.accessToken;
  else if (!update.accessToken && existing?.accessToken) delete update.accessToken;
  if (update.webhookVerifyToken === '********') delete update.webhookVerifyToken;
  else if (!update.webhookVerifyToken && existing?.webhookVerifyToken) delete update.webhookVerifyToken;

  const doc = await WhatsAppSetting.findOneAndUpdate(
    { key: 'whatsapp' },
    { $set: update, $setOnInsert: { key: 'whatsapp' } },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  await logAudit({
    action: 'update',
    module: 'settings',
    entityType: 'WhatsAppSetting',
    entityId: doc._id,
    description: 'WhatsApp settings updated',
    userId,
    req,
  });

  return formatWhatsApp(doc);
}

export async function getWhatsAppSettingsRaw() {
  const doc = await WhatsAppSetting.findOne({ key: 'whatsapp' }).lean();
  return doc ? { ...WHATSAPP_DEFAULTS, ...doc } : { ...WHATSAPP_DEFAULTS };
}

export async function getSmsSettingsRaw() {
  const doc = await SmsSetting.findOne({ key: 'sms' }).lean();
  return doc ? { ...SMS_DEFAULTS, ...doc } : { ...SMS_DEFAULTS };
}

export async function getEmailSettingsRaw() {
  const doc = await EmailSetting.findOne({ key: 'email' }).lean();
  return doc ? { ...EMAIL_DEFAULTS, ...doc } : { ...EMAIL_DEFAULTS };
}

export async function getCompanyNotificationVars() {
  const settings = await Setting.findOne({ key: 'company' }).lean();
  const company = settings?.company || COMPANY_DEFAULTS;
  return {
    companyName: company.name || company.tradeName || 'Show Terra Flight',
    supportNumber: company.whatsapp || company.directorPhone || company.phone || '',
  };
}

export async function getAdminContact() {
  const settings = await Setting.findOne({ key: 'company' }).lean();
  const company = settings?.company || COMPANY_DEFAULTS;
  return {
    adminEmail: company.ownerEmail || company.email || '',
    adminPhone: company.directorPhone || company.whatsapp || '',
    adminWhatsapp: company.whatsapp || '',
  };
}

export default {
  getSmsSettings,
  updateSmsSettings,
  getEmailSettings,
  updateEmailSettings,
  getWhatsAppSettings,
  updateWhatsAppSettings,
  getSmsSettingsRaw,
  getEmailSettingsRaw,
  getWhatsAppSettingsRaw,
  getAdminContact,
  getCompanyNotificationVars,
};
