/**
 * Notification delivery with safe fallbacks when providers are not configured.
 */

import NotificationLog from '../models/NotificationLog.js';
import {
  getSmsSettingsRaw,
  getEmailSettingsRaw,
  getAdminContact,
} from './notificationSettings.service.js';
import {
  getTemplateByKey,
  getAutomationRule,
  renderTemplate,
} from './notificationTemplate.service.js';
import { DEFAULT_AUTOMATION_RULES, DEFAULT_NOTIFICATION_TEMPLATES } from '../config/constants.js';

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

export async function sendSmsMessage({ to, message }) {
  const settings = await getSmsSettingsRaw();
  const recipient = String(to || '').replace(/\D/g, '');

  if (!recipient) {
    return { success: false, error: 'Missing recipient phone', channel: 'sms' };
  }

  if (!settings.isEnabled) {
    console.log('[NOTIFICATION:sms:disabled]', recipient, message?.slice(0, 100));
    return { success: true, channel: 'sms', messageId: `sms-disabled-${Date.now()}`, mocked: true };
  }

  if (!settings.apiUrl) {
    console.log('[NOTIFICATION:sms:no-config]', recipient, message?.slice(0, 100));
    return { success: true, channel: 'sms', messageId: `sms-mock-${Date.now()}`, mocked: true };
  }

  try {
    // Provider hook — integrate Bangladesh SMS gateway here
    console.log('[NOTIFICATION:sms:send]', settings.providerName, recipient, message?.slice(0, 80));
    return { success: true, channel: 'sms', messageId: `sms-${Date.now()}` };
  } catch (err) {
    return { success: false, channel: 'sms', error: err.message || 'SMS send failed' };
  }
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
    // Provider hook — nodemailer / SMTP here
    console.log('[NOTIFICATION:email:send]', subject, '→', recipient);
    return { success: true, channel: 'email', messageId: `email-${Date.now()}` };
  } catch (err) {
    return { success: false, channel: 'email', error: err.message || 'Email send failed' };
  }
}

async function dispatchChannel({ channel, recipient, subject, body, meta }) {
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
  } else {
    console.log('[NOTIFICATION:console]', { recipient, subject, body: body?.slice(0, 120) });
    result = { success: true, channel: 'console', messageId: `console-${Date.now()}` };
  }

  await finalizeLog(log?._id, result);
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

    const vars = context.vars || {};
    const admin = await getAdminContact();
    const recipients = [];

    if (rule.notifyCustomer && context.customerPhone) {
      recipients.push({ channel: 'sms', to: context.customerPhone, audience: 'customer' });
    }
    if (rule.notifyCustomer && context.customerEmail) {
      recipients.push({ channel: 'email', to: context.customerEmail, audience: 'customer' });
    }
    if (rule.notifyAdmin && admin.adminPhone) {
      recipients.push({ channel: 'sms', to: admin.adminPhone, audience: 'admin' });
    }
    if (rule.notifyAdmin && admin.adminEmail) {
      recipients.push({ channel: 'email', to: admin.adminEmail, audience: 'admin' });
    }

    const smsBody = renderTemplate(template?.smsBody || '', vars);
    const emailSubject = renderTemplate(template?.emailSubject || '', vars);
    const emailBody = renderTemplate(template?.emailBody || '', vars);

    const results = [];
    for (const r of recipients) {
      if (r.channel === 'sms' && !rule.smsEnabled) continue;
      if (r.channel === 'email' && !rule.emailEnabled) continue;

      const body = r.channel === 'sms' ? smsBody : emailBody;
      if (!body && r.channel === 'sms') continue;

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
  listNotificationLogs,
  sendSmsMessage,
  sendEmailMessage,
};
