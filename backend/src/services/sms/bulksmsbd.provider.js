import { normalizeBdPhone } from '../../utils/phoneUtils.js';

export const BULKSMSBD_DEFAULTS = {
  providerName: 'BulkSMSBD',
  apiUrl: 'http://bulksmsbd.net/api/smsapi',
  balanceUrl: 'http://bulksmsbd.net/api/getBalanceApi',
};

function parseProviderResponse(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    return { success: false, error: 'Empty response from SMS provider' };
  }

  try {
    const json = JSON.parse(trimmed);
    const code = json.response_code ?? json.responseCode ?? json.code ?? json.status;
    const messageId = json.message_id ?? json.messageId ?? json.sms_id ?? '';
    const message = json.message ?? json.error_message ?? json.error ?? '';

    if (code === 202 || code === '202' || json.success === true) {
      return { success: true, messageId: String(messageId || ''), raw: json };
    }

    return {
      success: false,
      error: message || `SMS provider error (code ${code ?? 'unknown'})`,
      raw: json,
    };
  } catch {
    if (/^202\b/.test(trimmed) || /success/i.test(trimmed)) {
      return { success: true, messageId: trimmed, raw: trimmed };
    }
    return { success: false, error: trimmed, raw: trimmed };
  }
}

async function requestUrl(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, text, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true, text };
  } catch (err) {
    const message = err.name === 'AbortError' ? 'SMS provider request timed out' : err.message;
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {{ apiUrl?: string, apiKey: string, senderId: string, number: string, message: string }} params
 */
export async function sendBulkSmsBd({ apiUrl, apiKey, senderId, number, message }) {
  const normalized = normalizeBdPhone(number);
  if (!normalized) {
    return { success: false, error: 'Invalid phone number' };
  }
  if (!apiKey) {
    return { success: false, error: 'SMS API key is not configured' };
  }
  if (!senderId) {
    return { success: false, error: 'SMS sender ID is not configured' };
  }
  if (!message?.trim()) {
    return { success: false, error: 'SMS message is empty' };
  }

  const baseUrl = apiUrl || BULKSMSBD_DEFAULTS.apiUrl;
  const params = new URLSearchParams({
    api_key: apiKey,
    type: 'text',
    number: normalized,
    senderid: senderId,
    message: message.trim(),
  });

  const result = await requestUrl(`${baseUrl}?${params.toString()}`);
  if (!result.ok) {
    return { success: false, error: result.error || 'SMS request failed' };
  }

  const parsed = parseProviderResponse(result.text);
  return {
    ...parsed,
    channel: 'sms',
    provider: BULKSMSBD_DEFAULTS.providerName,
    recipient: normalized,
  };
}

/**
 * @param {{ apiKey: string, balanceUrl?: string }} params
 */
export async function getBulkSmsBdBalance({ apiKey, balanceUrl }) {
  if (!apiKey) {
    return { success: false, error: 'SMS API key is not configured' };
  }

  const baseUrl = balanceUrl || BULKSMSBD_DEFAULTS.balanceUrl;
  const params = new URLSearchParams({ api_key: apiKey });
  const result = await requestUrl(`${baseUrl}?${params.toString()}`);

  if (!result.ok) {
    return { success: false, error: result.error || 'Balance request failed' };
  }

  const trimmed = String(result.text || '').trim();
  try {
    const json = JSON.parse(trimmed);
    return {
      success: true,
      balance: json.balance ?? json.credit ?? json.data ?? json,
      raw: json,
    };
  } catch {
    return { success: true, balance: trimmed, raw: trimmed };
  }
}

export default { sendBulkSmsBd, getBulkSmsBdBalance, BULKSMSBD_DEFAULTS };
