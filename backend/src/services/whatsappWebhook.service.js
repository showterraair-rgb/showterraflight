import NotificationLog from '../models/NotificationLog.js';
import WhatsAppWebhookEvent from '../models/WhatsAppWebhookEvent.js';
import { getWhatsAppSettingsRaw } from './notificationSettings.service.js';

const STATUS_MAP = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
};

export function verifyWebhookChallenge(query, verifyToken) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  if (mode === 'subscribe' && token && verifyToken && token === verifyToken) {
    return { verified: true, challenge: String(challenge || '') };
  }
  return { verified: false };
}

async function linkStatusToNotificationLog(providerMessageId, status, errorMessage = '') {
  if (!providerMessageId) return null;

  const mapped = STATUS_MAP[status] || status;
  const log = await NotificationLog.findOne({
    channel: 'whatsapp',
    providerMessageId,
  });

  if (log) {
    const update = { status: mapped };
    if (errorMessage) update.errorMessage = errorMessage;
    if (mapped === 'sent' || mapped === 'delivered' || mapped === 'read') {
      update.sentAt = log.sentAt || new Date();
    }
    await NotificationLog.findByIdAndUpdate(log._id, update);
    return log._id;
  }

  return null;
}

export async function processWebhookPayload(body) {
  const entries = body?.entry || [];
  const results = [];

  for (const entry of entries) {
    for (const change of entry?.changes || []) {
      const value = change?.value || {};

      for (const statusUpdate of value.statuses || []) {
        const providerMessageId = statusUpdate.id || '';
        const recipient = statusUpdate.recipient_id || '';
        const status = statusUpdate.status || '';
        const errorMessage = statusUpdate.errors?.[0]?.message || '';

        const notificationLogId = await linkStatusToNotificationLog(
          providerMessageId,
          status,
          errorMessage
        );

        const event = await WhatsAppWebhookEvent.create({
          eventType: 'status',
          providerMessageId,
          recipient,
          status,
          payload: statusUpdate,
          notificationLog: notificationLogId,
          processed: true,
        });

        results.push({ type: 'status', id: event._id.toString(), status });
      }

      for (const message of value.messages || []) {
        const event = await WhatsAppWebhookEvent.create({
          eventType: 'message',
          providerMessageId: message.id || '',
          recipient: message.from || '',
          status: message.type || 'received',
          payload: message,
          processed: false,
        });
        results.push({ type: 'message', id: event._id.toString() });
      }
    }
  }

  if (!results.length && body) {
    await WhatsAppWebhookEvent.create({
      eventType: 'unknown',
      payload: body,
      processed: false,
    });
  }

  return results;
}

export async function getWebhookVerifyToken() {
  const settings = await getWhatsAppSettingsRaw();
  return settings.webhookVerifyToken || '';
}

export default {
  verifyWebhookChallenge,
  processWebhookPayload,
  getWebhookVerifyToken,
};
