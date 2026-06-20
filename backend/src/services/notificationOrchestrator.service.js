/**
 * Notification delivery with safe fallbacks when providers are not configured.
 */

import NotificationLog from '../models/NotificationLog.js';
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
import { sendBulkSmsBd, getBulkSmsBdBalance } from './sms/bulksmsbd.provider.js';
import { sendMetaWhatsAppTemplate, sendMetaWhatsAppText } from './whatsapp/metaCloud.provider.js';
import { resolveSmsConfig } from '../utils/smsConfig.js';
import { resolveWhatsAppConfig } from '../utils/whatsappConfig.js';
import { normalizeWaPhone } from '../utils/phoneUtils.js';

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
  const recipient = String(to || '').replace(/\D/g, '');

  if (!recipient) {
    return { success: false, error: 'Missing recipient phone', channel: 'sms' };
  }

  if (!settings.isEnabled) {
    console.log('[NOTIFICATION:sms:disabled]', recipient, message?.slice(0, 100));
    return { success: true, channel: 'sms', messageId: `sms-disabled-${Date.now()}`, mocked: true };
  }

  if (!settings.isConfigured) {
    console.log('[NOTIFICATION:sms:no-config]', recipient, message?.slice(0, 100));
    return { success: false, channel: 'sms', error: 'SMS gateway not configured (API key and sender ID required)' };
  }

  try {
    const result = await sendBulkSmsBd({
      apiUrl: settings.apiUrl,
      apiKey: settings.apiKey,
      senderId: settings.senderId,
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

export async function sendEmailMessage({ to, subject, message, replyTo }) {
  const settings = await getEmailSettingsRaw();
  const recipient = String(to || '').trim();

  if (!recipient) {
    return { success: false, error: 'Missing recipient email', channel: 'email' };
  }

  if (!settings.isEnabled) {
    console.log('[NOTIFICATION:email:disabled]', subject, '→', recipient);
    return { success: true, channel: 'email', messageId: `email-disabled-${Date.now()}`, mocked: true };
  }

  if (!settings.smtpHost) {
    console.log('[NOTIFICATION:email:no-config]', subject, '→', recipient);
    return { success: true, channel: 'email', messageId: `email-mock-${Date.now()}`, mocked: true };
  }

  try {
    console.log('[NOTIFICATION:email:send]', subject, '→', recipient);
    return { success: true, channel: 'email', messageId: `email-${Date.now()}` };
  } catch (err) {
    return { success: false, channel: 'email', error: err.message || 'Email send failed' };
  }
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

  if (!recipient) {
    return { success: false, error: 'Missing recipient phone', channel: 'whatsapp' };
  }

  if (!settings.isEnabled) {
    console.log('[NOTIFICATION:whatsapp:disabled]', recipient, templateName || textFallback?.slice(0, 80));
    return { success: true, channel: 'whatsapp', messageId: `wa-disabled-${Date.now()}`, mocked: true };
  }

  if (!settings.isConfigured) {
    console.log('[NOTIFICATION:whatsapp:no-config]', recipient);
    return {
      success: false,
      channel: 'whatsapp',
      error: 'WhatsApp Cloud API not configured (access token and phone number ID required)',
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
    } else if (textFallback) {
      result = await sendMetaWhatsAppText({
        graphApiBase: settings.graphApiBase,
        phoneNumberId: settings.phoneNumberId,
        accessToken: settings.accessToken,
        to: recipient,
        text: textFallback,
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
    metadata: meta.vars || {},
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

/**
 * Fire notification for an event — never throws to caller.
 */
export async function triggerNotificationEvent(eventType, context = {}) {
  try {
    const rule = await resolveRule(eventType);
    if (!rule?.isEnabled) return { skipped: true, reason: 'rule disabled' };

    const template = await resolveTemplate(eventType);
    if (!template?.isActive && template?.isActive !== undefined) {
      return { skipped: true, reason: 'template inactive' };
    }

    const companyVars = await getCompanyNotificationVars();
    const vars = { ...companyVars, ...(context.vars || {}) };
    const admin = await getAdminContact();
    const recipients = [];

    if (rule.notifyCustomer && context.customerPhone) {
      recipients.push({ channel: 'sms', to: context.customerPhone, audience: 'customer' });
      recipients.push({ channel: 'whatsapp', to: context.customerPhone, audience: 'customer' });
    }
    if (rule.notifyCustomer && context.customerEmail) {
      recipients.push({ channel: 'email', to: context.customerEmail, audience: 'customer' });
    }
    if (rule.notifyAdmin && admin.adminPhone) {
      recipients.push({ channel: 'sms', to: admin.adminPhone, audience: 'admin' });
      recipients.push({ channel: 'whatsapp', to: admin.adminWhatsapp || admin.adminPhone, audience: 'admin' });
    }
    if (rule.notifyAdmin && admin.adminEmail) {
      recipients.push({ channel: 'email', to: admin.adminEmail, audience: 'admin' });
    }

    const smsBody = renderTemplate(template?.smsBody || '', vars);
    const emailSubject = renderTemplate(template?.emailSubject || '', vars);
    const emailBody = renderTemplate(template?.emailBody || '', vars);
    const whatsappTemplateName = template?.whatsappTemplateName || '';
    const whatsappTemplateLanguage = template?.whatsappTemplateLanguage || 'en';
    const whatsappBodyParams = buildWhatsAppBodyParams(template, eventType, vars);
    const whatsappTextFallback = renderTemplate(template?.whatsappBody || template?.smsBody || '', vars);

    const results = [];
    for (const r of recipients) {
      if (r.channel === 'sms' && !rule.smsEnabled) continue;
      if (r.channel === 'email' && !rule.emailEnabled) continue;
      if (r.channel === 'whatsapp' && !rule.whatsappEnabled) continue;

      if (r.channel === 'sms' && !smsBody) continue;
      if (r.channel === 'whatsapp' && !whatsappTemplateName && !whatsappTextFallback) continue;

      const body = r.channel === 'sms'
        ? smsBody
        : r.channel === 'email'
          ? emailBody
          : whatsappTextFallback;

      const result = await dispatchChannel({
        channel: r.channel,
        recipient: r.to,
        subject: emailSubject,
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
          whatsappTemplateName,
          whatsappTemplateLanguage,
          whatsappBodyParams,
          whatsappTextFallback: r.channel === 'whatsapp' && !whatsappTemplateName ? whatsappTextFallback : '',
        },
      });
      results.push({ ...result, audience: r.audience });
    }

    return { sent: results.length, results };
  } catch (err) {
    console.error('[notification] trigger failed', eventType, err.message);
    return { error: err.message };
  }
}

export function triggerNotificationEventSafe(eventType, context) {
  triggerNotificationEvent(eventType, context).catch((err) => {
    console.error('[notification] unhandled', eventType, err.message);
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
  const rawSettings = await getWhatsAppSettingsRaw();
  const settings = resolveWhatsAppConfig(rawSettings);
  const name = templateName || settings.testTemplateName || 'hello_world';

  if (name === 'hello_world' || !message) {
    return sendWhatsAppMessage({ to, templateName: name, languageCode: settings.defaultLanguageCode });
  }

  return sendWhatsAppMessage({
    to,
    templateName: name,
    languageCode: settings.defaultLanguageCode,
    bodyParams: [message],
  });
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
  triggerNotificationEventSafe,
  sendTestSms,
  sendTestEmail,
  sendTestWhatsApp,
  listNotificationLogs,
  sendSmsMessage,
  sendEmailMessage,
  sendWhatsAppMessage,
  getSmsBalance,
};
