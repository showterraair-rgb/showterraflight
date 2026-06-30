import { canonicalBdPhone } from '../../utils/phoneUtils.js';

export const BULKSMSBD_DEFAULTS = {
  providerName: 'BulkSMSBD',
  apiUrl: 'http://bulksmsbd.net/api/smsapi',
  balanceUrl: 'http://bulksmsbd.net/api/getBalanceApi',
};

/** BulkSMSBD response_code 202 = accepted/sent */
const SUCCESS_CODES = new Set([202, '202']);

const ERROR_HINTS = {
  1032: 'Server IP not whitelisted — add your VPS IP in BulkSMSBD Phonebook',
  1001: 'Invalid API key',
  1002: 'Invalid sender ID',
  1003: 'Invalid phone number',
  1004: 'Insufficient balance',
};

function parseProviderResponse(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    return { success: false, error: 'Empty response from SMS provider' };
  }

  try {
    const json = JSON.parse(trimmed);
    const code = json.response_code ?? json.responseCode ?? json.code ?? json.status;
    const messageId = json.message_id ?? json.messageId ?? json.sms_id ?? json.success_message ?? '';
    const errorMessage = json.error_message ?? json.error ?? json.message ?? '';
    const successMessage = json.success_message ?? '';

    if (SUCCESS_CODES.has(code) || json.success === true) {
      return {
        success: true,
        messageId: String(messageId || successMessage || code || ''),
        raw: json,
      };
    }

    const hint = ERROR_HINTS[code] || ERROR_HINTS[String(code)];
    const detail = errorMessage || hint || `SMS provider error (code ${code ?? 'unknown'})`;

    return {
      success: false,
      error: detail,
      code,
      raw: json,
    };
  } catch {
    if (/^202\b/.test(trimmed) || /success/i.test(trimmed)) {
      return { success: true, messageId: trimmed, raw: trimmed };
    }
    return { success: false, error: trimmed, raw: trimmed };
  }
}

function buildSmsParams({ apiKey, senderId, number, message }) {
  return {
    api_key: apiKey,
    type: 'text',
    number,
    senderid: senderId,
    message: String(message || '').trim(),
  };
}

async function requestGet(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    const text = await res.text();
    return { ok: res.ok, text, status: res.status };
  } catch (err) {
    const message = err.name === 'AbortError' ? 'SMS provider request timed out' : err.message;
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

async function requestPost(url, params, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
      signal: controller.signal,
    });
    const text = await res.text();
    return { ok: res.ok, text, status: res.status };
  } catch (err) {
    const message = err.name === 'AbortError' ? 'SMS provider request timed out' : err.message;
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Build BulkSMSBD request URL (for debugging).
 * @see http://bulksmsbd.net/api/smsapi?api_key=...&type=text&number=...&senderid=...&message=...
 */
export function buildBulkSmsBdUrl({ apiUrl, apiKey, senderId, number, message }) {
  const baseUrl = apiUrl || BULKSMSBD_DEFAULTS.apiUrl;
  const params = new URLSearchParams(buildSmsParams({ apiKey, senderId, number, message }));
  return `${baseUrl}?${params.toString()}`;
}

/**
 * @param {{ apiUrl?: string, apiKey: string, senderId: string, number: string, message: string, method?: 'POST'|'GET' }} params
 */
export async function sendBulkSmsBd({
  apiUrl,
  apiKey,
  senderId,
  number,
  message,
  method = 'POST',
}) {
  const normalized = canonicalBdPhone(number);
  if (!normalized) {
    return { success: false, error: 'Invalid Bangladesh mobile number (use 01XXXXXXXXX or 8801XXXXXXXXX)' };
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
  const params = buildSmsParams({
    apiKey,
    senderId,
    number: normalized,
    message,
  });

  let result;
  if (method === 'GET') {
    result = await requestGet(buildBulkSmsBdUrl({ apiUrl: baseUrl, ...params, apiKey, senderId, number: normalized, message }));
  } else {
    result = await requestPost(baseUrl, params);
    if (!result.ok && !result.text) {
      result = await requestGet(buildBulkSmsBdUrl({ apiUrl: baseUrl, apiKey, senderId, number: normalized, message }));
    }
  }

  if (result.error) {
    return { success: false, error: result.error, channel: 'sms' };
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
  const result = await requestGet(`${baseUrl}?${params.toString()}`);

  if (!result.ok && result.error) {
    return { success: false, error: result.error || 'Balance request failed' };
  }

  const trimmed = String(result.text || '').trim();
  try {
    const json = JSON.parse(trimmed);
    if (json.response_code && !SUCCESS_CODES.has(json.response_code) && json.success !== true) {
      return {
        success: false,
        error: json.error_message || json.message || `Balance error (code ${json.response_code})`,
        raw: json,
      };
    }
    return {
      success: true,
      balance: json.balance ?? json.credit ?? json.data ?? json,
      raw: json,
    };
  } catch {
    return { success: true, balance: trimmed, raw: trimmed };
  }
}

export default { sendBulkSmsBd, getBulkSmsBdBalance, buildBulkSmsBdUrl, BULKSMSBD_DEFAULTS };
