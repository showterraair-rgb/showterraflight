import env from '../../config/env.js';
import { canonicalBdPhone } from '../../utils/phoneUtils.js';
import { getWhatsAppSettingsRaw } from '../notificationSettings.service.js';

const DEFAULT_API_URL = 'https://www.wasenderapi.com/api/send-message';

/** Wasender expects E.164: +8801741148529 */
export function formatWasenderRecipient(raw, defaultCountryCode = '880') {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';

  const canonical = canonicalBdPhone(raw) || digits;
  if (canonical.startsWith('880') && canonical.length >= 12) {
    return `+${canonical}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `+${defaultCountryCode}${digits.slice(1)}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return digits.startsWith('+') ? digits : `+${digits}`;
  }
  return `+${canonical}`;
}

export function buildWasenderAuthHeader(apiKey) {
  const key = String(apiKey || '').trim();
  if (!key) return '';
  // Session API keys use "Bearer <key>" (NOT "Bearer token <key>").
  return `Bearer ${key}`;
}

export async function resolveWasenderConfig() {
  let dbSettings = {};
  try {
    dbSettings = await getWhatsAppSettingsRaw();
  } catch {
    dbSettings = {};
  }

  const apiKey = (
    process.env.WASENDER_API_KEY
    || env.wasender?.apiKey
    || dbSettings.wasenderApiKey
    || ''
  ).trim();

  const apiUrl = (
    process.env.WASENDER_API_URL
    || env.wasender?.apiUrl
    || dbSettings.wasenderApiUrl
    || DEFAULT_API_URL
  ).trim();

  const envEnabled = process.env.WASENDER_ENABLED === 'true'
    || env.wasender?.enabled
    || Boolean(process.env.WASENDER_API_KEY);

  const dbEnabled = dbSettings.provider === 'wasender' && Boolean(dbSettings.isEnabled);

  return {
    apiUrl,
    apiKey,
    sessionId: dbSettings.wasenderSessionId || '',
    defaultCountryCode: dbSettings.defaultCountryCode || env.whatsapp?.defaultCountryCode || '880',
    enabled: Boolean(apiKey) && (envEnabled || dbEnabled || Boolean(apiKey)),
    isConfigured: Boolean(apiKey),
  };
}

/** @deprecated Prefer resolveWasenderConfig() */
export function getWasenderConfig() {
  const apiKey = process.env.WASENDER_API_KEY || env.wasender?.apiKey || '';
  return {
    apiUrl: process.env.WASENDER_API_URL || env.wasender?.apiUrl || DEFAULT_API_URL,
    apiKey,
    enabled: process.env.WASENDER_ENABLED === 'true' || env.wasender?.enabled || Boolean(apiKey),
  };
}

export function isWasenderConfigured() {
  return Boolean(process.env.WASENDER_API_KEY || env.wasender?.apiKey);
}

export async function isWasenderConfiguredAsync() {
  const config = await resolveWasenderConfig();
  return config.isConfigured;
}

function parseWasenderError(data, statusText) {
  return data?.message || data?.error || data?.msg || statusText || 'Wasender API request failed';
}

function parseWasenderSuccess(data) {
  const msgId = data?.data?.msgId
    || data?.data?.id
    || data?.msgId
    || data?.id
    || data?.messageId
    || '';
  return String(msgId || `wasender-${Date.now()}`);
}

/**
 * WhatsApp via Wasender API — https://wasenderapi.com/
 * @see https://wasenderapi.com/api-docs/messages/send-text-message
 */
export async function sendWasenderMessage({ to, message, apiKey, apiUrl, defaultCountryCode } = {}) {
  const config = await resolveWasenderConfig();
  const resolvedKey = apiKey || config.apiKey;
  const resolvedUrl = apiUrl || config.apiUrl;
  const phone = formatWasenderRecipient(to, defaultCountryCode || config.defaultCountryCode);
  const text = String(message || '').trim();

  if (!phone) {
    return { success: false, error: 'Invalid phone number', channel: 'whatsapp' };
  }
  if (!text) {
    return { success: false, error: 'WhatsApp message text required', channel: 'whatsapp' };
  }

  if (!resolvedKey) {
    return {
      success: false,
      channel: 'whatsapp',
      error: 'Wasender API not configured (add session API key in WhatsApp settings or WASENDER_API_KEY in .env)',
      mocked: true,
    };
  }

  try {
    const res = await fetch(resolvedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: buildWasenderAuthHeader(resolvedKey),
      },
      body: JSON.stringify({ to: phone, text }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
      const errMsg = parseWasenderError(data, res.statusText);
      console.error('[Wasender:failed]', phone, errMsg, data);
      return { success: false, channel: 'whatsapp', error: errMsg, raw: data };
    }

    const messageId = parseWasenderSuccess(data);
    console.log('[Wasender:sent]', phone, messageId, data?.data?.status || 'ok');
    return {
      success: true,
      channel: 'whatsapp',
      messageId,
      provider: 'wasender',
      status: data?.data?.status || 'sent',
      raw: data,
    };
  } catch (err) {
    console.error('[Wasender:error]', err.message);
    return { success: false, channel: 'whatsapp', error: err.message };
  }
}

/** Check session connectivity (optional health check). */
export async function getWasenderSessionStatus() {
  const config = await resolveWasenderConfig();
  if (!config.apiKey) {
    return { success: false, error: 'Wasender API key not configured' };
  }

  try {
    const res = await fetch('https://www.wasenderapi.com/api/status', {
      headers: { Authorization: buildWasenderAuthHeader(config.apiKey) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      return { success: false, error: parseWasenderError(data, res.statusText), raw: data };
    }
    return { success: true, data: data.data || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export default {
  sendWasenderMessage,
  resolveWasenderConfig,
  getWasenderConfig,
  isWasenderConfigured,
  isWasenderConfiguredAsync,
  getWasenderSessionStatus,
  formatWasenderRecipient,
};
