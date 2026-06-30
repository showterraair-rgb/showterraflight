import env from '../../config/env.js';
import { normalizeWaPhone } from '../../utils/phoneUtils.js';

export function getWasenderConfig() {
  const apiKey = process.env.WASENDER_API_KEY || env.wasender?.apiKey || '';
  return {
    apiUrl: process.env.WASENDER_API_URL || env.wasender?.apiUrl || 'https://www.wasenderapi.com/api/send-message',
    apiKey,
    enabled: process.env.WASENDER_ENABLED === 'true'
      || env.wasender?.enabled
      || Boolean(apiKey),
  };
}

export function isWasenderConfigured() {
  const config = getWasenderConfig();
  return Boolean(config.enabled && config.apiKey);
}

/**
 * WhatsApp via Wasender API — https://wasenderapi.com/
 */
export async function sendWasenderMessage({ to, message }) {
  const config = getWasenderConfig();
  const phone = normalizeWaPhone(to);

  if (!phone) {
    return { success: false, error: 'Invalid phone number', channel: 'whatsapp' };
  }

  if (!config.enabled || !config.apiKey) {
    console.log('[Wasender:stub]', phone, message?.slice(0, 100));
    return {
      success: false,
      channel: 'whatsapp',
      error: 'Wasender API not configured (set WASENDER_API_KEY)',
      mocked: true,
    };
  }

  try {
    const res = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ to: phone, text: message }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = data.message || data.error || data.msg || res.statusText;
      console.error('[Wasender:failed]', phone, errMsg);
      return { success: false, channel: 'whatsapp', error: errMsg, raw: data };
    }
    console.log('[Wasender:sent]', phone, data.id || data.messageId || 'ok');
    return {
      success: true,
      channel: 'whatsapp',
      messageId: data.id || data.messageId || data.data?.id || `wasender-${Date.now()}`,
      provider: 'wasender',
      raw: data,
    };
  } catch (err) {
    console.error('[Wasender:error]', err.message);
    return { success: false, channel: 'whatsapp', error: err.message };
  }
}

export default { sendWasenderMessage, getWasenderConfig, isWasenderConfigured };
