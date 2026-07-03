/**
 * Notification delivery with safe fallbacks when providers are not configured.
 */

import NotificationLog from '../models/NotificationLog.js';
import env from '../config/env.js';
import {
  getSmsSettingsRaw,
  getEmailSettingsRaw,
  getWhatsAppSettingsRaw,
  getAdminContact,
  getCompanyNotificationVars,
} from './notificationSettings.service.js';
import {
  getTemplateByKey,
  getAutomationRule,
  renderTemplate,
} from './notificationTemplate.service.js';
import {
  DEFAULT_AUTOMATION_RULES,
  DEFAULT_NOTIFICATION_TEMPLATES,
  DEFAULT_WHATSAPP_PARAM_KEYS,
} from '../config/constants.js';
import { sendBulkSmsBd, getBulkSmsBdBalance, buildBulkSmsBdUrl, normalizeBulkSmsBdSenderId, displayBulkSmsBdSenderId, BULKSMSBD_DEFAULTS } from './sms/bulksmsbd.provider.js';
import { sendMetaWhatsAppTemplate, sendMetaWhatsAppText } from './whatsapp/metaCloud.provider.js';
import { sendWasenderMessage, isWasenderConfiguredAsync } from './whatsapp/wasender.provider.js';
import { sendSmtpEmail } from './email/smtp.provider.js';
import { resolveSmsConfig } from '../utils/smsConfig.js';
import { resolveWhatsAppConfig } from '../utils/whatsappConfig.js';
import { normalizeWaPhone, canonicalBdPhone } from '../utils/phoneUtils.js';
import { getServerOutboundIp } from '../utils/serverIp.js';
import ApiError from '../utils/ApiError.js';

const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

async function createLogEntry(payload) {
  try {
    const [log] = await NotificationLog.create([payload]);
    return log;
  } catch (err) {
    console.error('[notification] failed to create log', err.message);
    return null;
  }
}

async function finalizeLog(logId, result) {
  if (!logId) return;
  try {
    await NotificationLog.findByIdAndUpdate(logId, {
      status: result.success ? 'sent' : 'failed',
      errorMessage: result.error || '',
      providerMessageId: result.messageId || '',
      sentAt: result.success ? new Date() : undefined,
    });
  } catch (err) {
    console.error('[notification] failed to update log', err.message);
  }
}

async function isDuplicateSend({ eventType, channel, recipient, bookingId, orderId }) {
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
  const filter = {
    eventType,
    channel,
    recipient,
    status: { $in: ['pending', 'sent', 'delivered', 'read'] },
    createdAt: { $gte: since },
  };
  if (bookingId) filter.booking = bookingId;
  else if (orderId) filter.order = orderId;
  else return false;

  const existing = await NotificationLog.findOne(filter).lean();
  return Boolean(existing);
}

function parseParamKeys(template, eventType) {
  const fromTemplate = String(template?.whatsappParamKeys || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  if (fromTemplate.length) return fromTemplate;
  return DEFAULT_WHATSAPP_PARAM_KEYS[eventType] || ['customerName'];
}

function buildWhatsAppBodyParams(template, eventType, vars) {
  const keys = parseParamKeys(template, eventType);
  return keys.map((key) => {
    const val = vars[key];
    return val != null ? String(val) : '';
  });
}

export async function sendSmsMessage({ to, message }) {
  const settings = resolveSmsConfig(await getSmsSettingsRaw());
  const recipient = canonicalBdPhone(to);

  if (!recipient) {
    return { success: false, error: 'Invalid or missing recipient phone', channel: 'sms' };
  }

  if (!settings.isEnabled) {
    console.log('[NOTIFICATION:sms:disabled]', recipient, message?.slice(0, 100));
    return { success: true, channel: 'sms', messageId: `sms-disabled-${Date.now()}`, mocked: true };
  }

  if (!settings.isConfigured) {
    console.log('[NOTIFICATION:sms:no-config]', recipient, message?.slice(0, 100));
    return { success: false, channel: 'sms', error: 'SMS gateway not configured (BulkSMSBD API key and sender ID required)' };
  }

  try {
    const result = await sendBulkSmsBd({
      apiUrl: settings.apiUrl,
      apiKey: settings.apiKey,
      senderId: settings.senderId,
      isMasking: settings.isMasking,
      number: recipient,
      message,
    });

    if (!result.success) {
      console.error('[NOTIFICATION:sms:failed]', recipient, result.error);
    } else {
      console.log('[NOTIFICATION:sms:sent]', settings.providerName, recipient, result.messageId);
    }

    return {
      success: result.success,
      channel: 'sms',
      messageId: result.messageId || '',
      error: result.error,
      provider: settings.providerName,
      mocked: false,
    };
  } catch (err) {
    return { success: false, channel: 'sms', error: err.message || 'SMS send failed' };
  }
}

export async function getSmsBalance() {
  const settings = resolveSmsConfig(await getSmsSettingsRaw());
  if (!settings.apiKey) {
    return { success: false, error: 'SMS API key is not configured' };
  }
  return getBulkSmsBdBalance({
    apiKey: settings.apiKey,
    balanceUrl: settings.balanceUrl,
  });
}

export async function getSmsDiagnostics() {
  const settings = resolveSmsConfig(await getSmsSettingsRaw());
  const [balance, serverIp] = await Promise.all([
    settings.apiKey
      ? getBulkSmsBdBalance({ apiKey: settings.apiKey, balanceUrl: settings.balanceUrl })
      : Promise.resolve({ success: false, error: 'SMS API key is not configured' }),
    getServerOutboundIp(),
  ]);

  const apiSenderId = normalizeBulkSmsBdSenderId(
    settings.senderId || BULKSMSBD_DEFAULTS.senderId,
    { isMasking: settings.isMasking },
  );

  const maskedKey = settings.apiKey ? `${settings.apiKey.slice(0, 4)}…` : '';

  return {
    isConfigured: settings.isConfigured,
    isEnabled: settings.isEnabled,
    isMasking: settings.isMasking,
    apiUrl: settings.apiUrl,
    balanceUrl: settings.balanceUrl,
    displaySenderId: displayBulkSmsBdSenderId(settings.senderId || BULKSMSBD_DEFAULTS.senderId, {
      isMasking: settings.isMasking,
    }),
    apiSenderId,
    apiKeyPreview: maskedKey,
    balance,
    serverIp: serverIp.success ? serverIp.ip : null,
    sampleRequestUrl: settings.apiKey && apiSenderId
      ? buildBulkSmsBdUrl({
        apiUrl: settings.apiUrl,
        apiKey: 'YOUR_API_KEY',
        senderId: apiSenderId,
        number: '8801674533303',
        message: 'TestSMS',
        isMasking: settings.isMasking,
      })
      : null,
  };
}

export async function sendEmailMessage({ to, subject, message, replyTo }) {
  const settings = await getEmailSettingsRaw();
  const recipient = String(to || '').trim();

  if (!recipient) {
    return { success: false, error: 'Missing recipient email', channel: 'email' };
  }

  if (!settings.isEnabled && !env.email.enabled) {
    console.log('[NOTIFICATION:email:disabled]', subject, '→', recipient);
    return { success: true, channel: 'email', messageId: `email-disabled-${Date.now()}`, mocked: true };
  }

  return sendSmtpEmail({ to: recipient, subject, text: message, replyTo });
}

export async function sendWhatsAppMessage({
  to,
  templateName,
  languageCode,
  bodyParams = [],
  textFallback = '',
}) {
  const rawSettings = await getWhatsAppSettingsRaw();
  const settings = resolveWhatsAppConfig(rawSettings);
  const recipient = normalizeWaPhone(to, settings.defaultCountryCode);
  const messageText = String(textFallback || '').trim()
    || (bodyParams.length ? bodyParams.filter(Boolean).join(' — ') : '');

  if (!recipient) {
    return { success: false, error: 'Missing recipient phone', channel: 'whatsapp' };
  }

  const wasenderReady = await isWasenderConfiguredAsync();
  const waEnabled = settings.isEnabled || wasenderReady;
  if (!waEnabled) {
    console.log('[NOTIFICATION:whatsapp:disabled]', recipient, templateName || messageText?.slice(0, 80));
    return { success: true, channel: 'whatsapp', messageId: `wa-disabled-${Date.now()}`, mocked: true };
  }

  // Wasender API — primary provider for all WhatsApp text notifications
  if (wasenderReady) {
    if (!messageText) {
      return { success: false, channel: 'whatsapp', error: 'WhatsApp message text required' };
    }
    const result = await sendWasenderMessage({ to: recipient, message: messageText });
    if (!result.success) {
      console.error('[NOTIFICATION:whatsapp:wasender-failed]', recipient, result.error);
    }
    return result;
  }

  if (!settings.isConfigured) {
    console.log('[NOTIFICATION:whatsapp:no-config]', recipient);
    return {
      success: false,
      channel: 'whatsapp',
      error: 'WhatsApp not configured (Wasender API or Meta Cloud)',
    };
  }

  try {
    let result;
    if (templateName) {
      result = await sendMetaWhatsAppTemplate({
        graphApiBase: settings.graphApiBase,
        phoneNumberId: settings.phoneNumberId,
        accessToken: settings.accessToken,
        to: recipient,
        templateName,
        languageCode: languageCode || settings.defaultLanguageCode,
        bodyParams,
      });
    } else if (messageText) {
      result = await sendMetaWhatsAppText({
        graphApiBase: settings.graphApiBase,
        phoneNumberId: settings.phoneNumberId,
        accessToken: settings.accessToken,
        to: recipient,
        text: messageText,
      });
    } else {
      return {
        success: false,
        channel: 'whatsapp',
        error: 'WhatsApp template name or text message required',
      };
    }

    if (!result.success) {
      console.error('[NOTIFICATION:whatsapp:failed]', recipient, result.error);
    } else {
      console.log('[NOTIFICATION:whatsapp:sent]', recipient, result.messageId);
    }

    return {
      success: result.success,
      channel: 'whatsapp',
      messageId: result.messageId || '',
      error: result.error,
      mocked: false,
    };
  } catch (err) {
    return { success: false, channel: 'whatsapp', error: err.message || 'WhatsApp send failed' };
  }
}

async function dispatchChannel({ channel, recipient, subject, body, meta }) {
  if (await isDuplicateSend({
    eventType: meta.eventType,
    channel,
    recipient,
    bookingId: meta.bookingId,
    orderId: meta.orderId,
  })) {
    console.log('[NOTIFICATION:dedupe]', meta.eventType, channel, recipient);
    return { success: true, channel, skipped: true, deduped: true };
  }

  const log = await createLogEntry({
    eventType: meta.eventType,
    templateKey: meta.templateKey,
    channel,
    recipient,
    subject: subject || '',
    body: body || '',
    status: 'pending',
    order: meta.orderId,
    booking: meta.bookingId,
    customer: meta.customerId,
    customerPayment: meta.customerPaymentId,
    metadata: {
      ...(meta.vars || {}),
      whatsappTemplateName: meta.whatsappTemplateName || '',
      whatsappTemplateLanguage: meta.whatsappTemplateLanguage || '',
      whatsappBodyParams: meta.whatsappBodyParams || [],
      whatsappTextFallback: meta.whatsappTextFallback || '',
    },
  });

  let result;
  if (channel === 'sms') {
    result = await sendSmsMessage({ to: recipient, message: body });
  } else if (channel === 'email') {
    result = await sendEmailMessage({ to: recipient, subject, message: body, replyTo: meta.replyTo });
  } else if (channel === 'whatsapp') {
    result = await sendWhatsAppMessage({
      to: recipient,
      templateName: meta.whatsappTemplateName,
      languageCode: meta.whatsappTemplateLanguage,
      bodyParams: meta.whatsappBodyParams,
      textFallback: meta.whatsappTextFallback,
    });
  } else {
    console.log('[NOTIFICATION:console]', { recipient, subject, body: body?.slice(0, 120) });
    result = { success: true, channel: 'console', messageId: `console-${Date.now()}` };
  }

  if (!result.skipped) {
    await finalizeLog(log?._id, result);
  }
  return result;
}

async function resolveTemplate(eventType) {
  try {
    return await getTemplateByKey(eventType);
  } catch {
    return DEFAULT_NOTIFICATION_TEMPLATES.find((t) => t.templateKey === eventType) || null;
  }
}

async function resolveRule(eventType) {
  const rule = await getAutomationRule(eventType);
  return rule || DEFAULT_AUTOMATION_RULES.find((r) => r.eventType === eventType) || null;
}

function audiencePrefix(audience) {
  if (audience === 'supplier') return 'supplier';
  if (audience === 'agent') return 'agent';
  if (audience === 'admin') return 'admin';
  return null;
}

function renderAudienceSmsBody(template, vars, audience) {
  const prefix = audiencePrefix(audience);
  const raw = (prefix && template?.[`${prefix}SmsBody`]) || template?.smsBody || '';
  return renderTemplate(raw, vars);
}

function renderAudienceEmail(template, vars, audience) {
  const prefix = audiencePrefix(audience);
  return {
    subject: renderTemplate(
      (prefix && template?.[`${prefix}EmailSubject`]) || template?.emailSubject || '',
      vars
    ),
    body: renderTemplate(
      (prefix && template?.[`${prefix}EmailBody`]) || template?.emailBody || '',
      vars
    ),
  };
}

function renderAudienceWhatsappBody(template, vars, audience) {
  const prefix = audiencePrefix(audience);
  const raw = (prefix && template?.[`${prefix}WhatsappBody`])
    || template?.whatsappBody
    || template?.smsBody
    || '';
  return renderTemplate(raw, vars);
}

/**
 * Fire notification for an event — never throws to caller.
 */
export async function triggerNotificationEvent(eventType, context = {}) {
  return triggerNotificationEventWithChannels(eventType, context, ['sms', 'email', 'whatsapp'], { useAutomationRule: true });
}

/**
 * Send notification on selected channels (manual admin reminders).
 * @param {string[]} channels - 'sms' | 'email' | 'whatsapp'
 */
export async function triggerNotificationEventWithChannels(
  eventType,
  context = {},
  channels = ['sms', 'email', 'whatsapp'],
  { useAutomationRule = false, strictDelivery = false } = {}
) {
  try {
    const rule = await resolveRule(eventType);
    if (useAutomationRule && rule?.isEnabled === false) {
      return { skipped: true, reason: 'rule disabled' };
    }

    const template = await resolveTemplate(eventType);
    if (useAutomationRule && template?.isActive === false) {
      return { skipped: true, reason: 'template inactive' };
    }

    const companyVars = await getCompanyNotificationVars();
    const vars = { ...companyVars, ...(context.vars || {}) };
    const admin = await getAdminContact();
    const channelSet = new Set(channels || ['sms', 'email', 'whatsapp']);
    const recipientType = context.recipientType || 'customer';
    const recipients = [];

    const notifyCustomer = useAutomationRule
      ? Boolean(rule?.notifyCustomer)
      : recipientType === 'customer';
    const notifySupplier = useAutomationRule
      ? Boolean(rule?.notifySupplier)
      : recipientType === 'supplier';
    const notifyAgent = useAutomationRule
      ? Boolean(rule?.notifyAgent)
      : recipientType === 'agent';

    const shouldNotifyCustomer = useAutomationRule ? notifyCustomer : recipientType === 'customer';
    const shouldNotifySupplier = useAutomationRule ? notifySupplier : recipientType === 'supplier';

    if (shouldNotifyCustomer) {
      if (context.customerPhone && channelSet.has('sms')) {
        recipients.push({ channel: 'sms', to: context.customerPhone, audience: 'customer' });
      }
      const customerWhatsapp = context.customerWhatsapp || context.customerPhone;
      if (customerWhatsapp && channelSet.has('whatsapp')) {
        recipients.push({ channel: 'whatsapp', to: customerWhatsapp, audience: 'customer' });
      }
      if (context.customerEmail && channelSet.has('email')) {
        recipients.push({ channel: 'email', to: context.customerEmail, audience: 'customer' });
      }
    }

    if (shouldNotifySupplier) {
      if (context.supplierPhone && channelSet.has('sms')) {
        recipients.push({ channel: 'sms', to: context.supplierPhone, audience: 'supplier' });
      }
      const supplierWhatsapp = context.supplierWhatsapp || context.supplierPhone;
      if (supplierWhatsapp && channelSet.has('whatsapp')) {
        recipients.push({ channel: 'whatsapp', to: supplierWhatsapp, audience: 'supplier' });
      }
      if (context.supplierEmail && channelSet.has('email')) {
        recipients.push({ channel: 'email', to: context.supplierEmail, audience: 'supplier' });
      }
    }

    if ((useAutomationRule && notifyAgent) || recipientType === 'agent') {
      if (context.agentPhone && channelSet.has('sms')) {
        recipients.push({ channel: 'sms', to: context.agentPhone, audience: 'agent' });
      }
      const agentWhatsapp = context.agentWhatsapp || context.agentPhone;
      if (agentWhatsapp && channelSet.has('whatsapp')) {
        recipients.push({ channel: 'whatsapp', to: agentWhatsapp, audience: 'agent' });
      }
      if (context.agentEmail && channelSet.has('email')) {
        recipients.push({ channel: 'email', to: context.agentEmail, audience: 'agent' });
      }
    }

    if (useAutomationRule && rule?.notifyAdmin && admin.adminPhone) {
      recipients.push({ channel: 'sms', to: admin.adminPhone, audience: 'admin' });
      recipients.push({ channel: 'whatsapp', to: admin.adminWhatsapp || admin.adminPhone, audience: 'admin' });
    }
    if (useAutomationRule && rule?.notifyAdmin && admin.adminEmail) {
      recipients.push({ channel: 'email', to: admin.adminEmail, audience: 'admin' });
    }

    const whatsappTemplateName = template?.whatsappTemplateName || '';
    const whatsappTemplateLanguage = template?.whatsappTemplateLanguage || 'en';
    const whatsappBodyParams = buildWhatsAppBodyParams(template, eventType, vars);
    const wasenderReady = await isWasenderConfiguredAsync();

    const results = [];
    for (const r of recipients) {
      if (useAutomationRule) {
        if (r.channel === 'sms' && !rule.smsEnabled) continue;
        if (r.channel === 'email' && !rule.emailEnabled) continue;
        if (r.channel === 'whatsapp' && !rule.whatsappEnabled) continue;
      }

      const smsBody = renderAudienceSmsBody(template, vars, r.audience);
      const emailRendered = renderAudienceEmail(template, vars, r.audience);
      const whatsappTextFallback = renderAudienceWhatsappBody(template, vars, r.audience);

      if (r.channel === 'sms' && !smsBody) continue;
      if (r.channel === 'whatsapp' && !whatsappTemplateName && !whatsappTextFallback) continue;

      const body = r.channel === 'sms'
        ? smsBody
        : r.channel === 'email'
          ? emailRendered.body
          : whatsappTextFallback;

      let result = await dispatchChannel({
        channel: r.channel,
        recipient: r.to,
        subject: emailRendered.subject,
        body,
        meta: {
          eventType,
          templateKey: eventType,
          orderId: context.orderId,
          bookingId: context.bookingId,
          customerId: context.customerId,
          customerPaymentId: context.customerPaymentId,
          replyTo: admin.adminEmail,
          vars,
          whatsappTemplateName: wasenderReady ? '' : whatsappTemplateName,
          whatsappTemplateLanguage,
          whatsappBodyParams,
          whatsappTextFallback: r.channel === 'whatsapp' ? whatsappTextFallback : '',
        },
      });
      if (strictDelivery && result.success && result.mocked) {
        result = {
          ...result,
          success: false,
          error: result.error || `${r.channel} is disabled or not configured`,
        };
      }
      results.push({ ...result, audience: r.audience, channel: r.channel });
    }

    if (!results.length) {
      return { skipped: true, reason: 'no recipients or channels available', results: [] };
    }

    const delivered = results.filter((r) => r.success && !r.mocked);
    return { sent: delivered.length, results };
  } catch (err) {
    console.error('[notification] trigger failed', eventType, err.message);
    return { error: err.message };
  }
}

export function triggerNotificationEventSafe(eventType, context) {
  return triggerNotificationEvent(eventType, context).catch((err) => {
    console.error('[notification] unhandled', eventType, err.message);
    return { error: err.message };
  });
}

export async function sendTestSms({ to, message }) {
  return sendSmsMessage({ to, message: message || 'Test SMS from Show Terra Flight admin panel.' });
}

export async function sendTestEmail({ to, subject, message }) {
  return sendEmailMessage({
    to,
    subject: subject || 'Test email — Show Terra Flight',
    message: message || 'This is a test email from Show Terra Flight admin panel.',
  });
}

export async function sendTestWhatsApp({ to, templateName, message }) {
  const text = message || 'Test WhatsApp from Show Terra Flight admin panel.';
  if (await isWasenderConfiguredAsync()) {
    return sendWasenderMessage({ to, message: text });
  }

  const rawSettings = await getWhatsAppSettingsRaw();
  const settings = resolveWhatsAppConfig(rawSettings);
  const name = templateName || settings.testTemplateName || 'hello_world';

  if (name === 'hello_world' || !message) {
    return sendWhatsAppMessage({ to, templateName: name, languageCode: settings.defaultLanguageCode, textFallback: text });
  }

  return sendWhatsAppMessage({
    to,
    templateName: name,
    languageCode: settings.defaultLanguageCode,
    bodyParams: [message],
    textFallback: text,
  });
}

export async function retryNotificationLog(logId) {
  const log = await NotificationLog.findById(logId);
  if (!log) throw ApiError.notFound('Notification log not found');
  if (log.status !== 'failed') throw ApiError.badRequest('Only failed notifications can be retried');

  await NotificationLog.findByIdAndUpdate(logId, {
    status: 'pending',
    errorMessage: '',
    providerMessageId: '',
    sentAt: undefined,
  });

  const meta = log.metadata || {};
  let result;
  if (log.channel === 'sms') {
    result = await sendSmsMessage({ to: log.recipient, message: log.body });
  } else if (log.channel === 'email') {
    result = await sendEmailMessage({ to: log.recipient, subject: log.subject, message: log.body });
  } else if (log.channel === 'whatsapp') {
    result = await sendWhatsAppMessage({
      to: log.recipient,
      templateName: meta.whatsappTemplateName || '',
      languageCode: meta.whatsappTemplateLanguage,
      bodyParams: meta.whatsappBodyParams || [],
      textFallback: meta.whatsappTextFallback || log.body,
    });
  } else {
    result = { success: true, channel: 'console', messageId: `console-retry-${Date.now()}` };
  }

  await finalizeLog(logId, result);

  const updated = await NotificationLog.findById(logId).lean();
  return {
    id: updated._id.toString(),
    status: updated.status,
    errorMessage: updated.errorMessage,
    providerMessageId: updated.providerMessageId || '',
    sentAt: updated.sentAt,
    success: result.success,
  };
}

export async function listNotificationLogs(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.channel) filter.channel = query.channel;
  if (query.eventType) filter.eventType = query.eventType;
  if (query.bookingId) filter.booking = query.bookingId;
  if (query.orderId) filter.order = query.orderId;

  const [items, total] = await Promise.all([
    NotificationLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    NotificationLog.countDocuments(filter),
  ]);

  return {
    items: items.map((l) => ({
      id: l._id.toString(),
      eventType: l.eventType,
      templateKey: l.templateKey,
      channel: l.channel,
      recipient: l.recipient,
      subject: l.subject,
      body: l.body?.slice(0, 200),
      status: l.status,
      errorMessage: l.errorMessage,
      providerMessageId: l.providerMessageId || '',
      orderId: l.order?.toString(),
      bookingId: l.booking?.toString(),
      customerId: l.customer?.toString(),
      sentAt: l.sentAt,
      createdAt: l.createdAt,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export default {
  triggerNotificationEvent,
  triggerNotificationEventWithChannels,
  triggerNotificationEventSafe,
  sendTestSms,
  sendTestEmail,
  sendTestWhatsApp,
  listNotificationLogs,
  retryNotificationLog,
  sendSmsMessage,
  sendEmailMessage,
  sendWhatsAppMessage,
  getSmsBalance,
  getSmsDiagnostics,
};
