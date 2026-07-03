import { canonicalBdPhone } from '../../utils/phoneUtils.js';
import { extractIpFromBulkSmsBdError } from '../../utils/serverIp.js';

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
  1002: 'Invalid sender ID — check it is approved and active in BulkSMSBD',
  1003: 'Invalid phone number',
  1004: 'Insufficient balance',
  1005: 'Sender ID not registered on BulkSMSBD — verify format and approval',
  1013: 'Sender ID not linked to your API key',
  1014: 'Sender type not found for this API key',
  1015: 'No valid gateway for this sender ID',
};

function digitsOnly(raw) {
  return String(raw || '').replace(/\D/g, '');
}

/** Non-masking = dedicated number (01/09XXXXXXXXX). Masking = approved brand text. */
export function inferBulkSmsBdSenderMode(senderId) {
  const trimmed = String(senderId || '').trim();
  if (!trimmed) return 'non_masking';
  if (/[A-Za-z]/.test(trimmed)) return 'masking';
  return 'non_masking';
}

/**
 * BulkSMSBD non-masking senderid must be 01XXXXXXXXX (not 880...).
 * @see https://bulksmsbd.com/bulksms-api-bangladesh.php
 */
export function normalizeBulkSmsBdSenderId(raw, { isMasking } = {}) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';

  const masking = isMasking ?? inferBulkSmsBdSenderMode(trimmed) === 'masking';
  if (masking) {
    return trimmed.slice(0, 11);
  }

  const digits = digitsOnly(trimmed);
  if (!digits) return trimmed;

  if (digits.startsWith('880') && digits.length >= 12) {
    return `0${digits.slice(3, 13)}`;
  }
  if (digits.startsWith('0') && digits.length >= 10) {
    return digits.slice(0, 11);
  }
  if (digits.length === 10) {
    return `0${digits}`;
  }
  return digits.slice(0, 11);
}

function formatSenderIdError(rawSenderId, isMasking) {
  const normalized = normalizeBulkSmsBdSenderId(rawSenderId, { isMasking });
  if (isMasking || inferBulkSmsBdSenderMode(rawSenderId) === 'masking') {
    return 'Masking sender ID not found on BulkSMSBD. Use your approved brand name exactly as shown in the dashboard.';
  }
  const intl = normalized ? `+880${normalized.slice(1)}` : '';
  return normalized
    ? `Sender ID not registered on BulkSMSBD (API uses ${normalized} from ${intl || rawSenderId}). Confirm ${normalized} is Active in Sender ID Management.`
    : 'Non-masking sender ID not found on BulkSMSBD. Register your dedicated number in Sender ID Management.';
}

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
    let detail = errorMessage || hint || `SMS provider error (code ${code ?? 'unknown'})`;

    if (String(code) === '1032' || code === 1032) {
      const blockedIp = extractIpFromBulkSmsBdError(errorMessage) || extractIpFromBulkSmsBdError(detail);
      detail = blockedIp
        ? `BulkSMSBD blocked server IP ${blockedIp}. Whitelist it in Phonebook → IP White List (Type: API, Status: Active).`
        : (hint || detail);
    }

    if (
      String(code) === '1005' || code === 1005
      || /is_masking/i.test(errorMessage)
      || /is_masking/i.test(detail)
    ) {
      detail = hint || 'Sender ID not registered on BulkSMSBD (internal is_masking error).';
    }

    return {
      success: false,
      error: detail,
      code,
      blockedIp: extractIpFromBulkSmsBdError(errorMessage),
      raw: json,
    };
  } catch {
    if (/^202\b/.test(trimmed) || /success/i.test(trimmed)) {
      return { success: true, messageId: trimmed, raw: trimmed };
    }
    if (/is_masking/i.test(trimmed)) {
      return {
        success: false,
        error: 'Sender ID not registered on BulkSMSBD. For non-masking use 01XXXXXXXXX (not 880...).',
        code: 1005,
        raw: trimmed,
      };
    }
    return { success: false, error: trimmed, raw: trimmed };
  }
}

function buildSmsParams({ apiKey, senderId, number, message, isMasking }) {
  const apiSenderId = normalizeBulkSmsBdSenderId(senderId, { isMasking });
  return {
    api_key: apiKey,
    type: 'text',
    number,
    senderid: apiSenderId,
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
export function buildBulkSmsBdUrl({ apiUrl, apiKey, senderId, number, message, isMasking }) {
  const baseUrl = apiUrl || BULKSMSBD_DEFAULTS.apiUrl;
  const params = new URLSearchParams(buildSmsParams({ apiKey, senderId, number, message, isMasking }));
  return `${baseUrl}?${params.toString()}`;
}

/**
 * @param {{ apiUrl?: string, apiKey: string, senderId: string, number: string, message: string, method?: 'POST'|'GET', isMasking?: boolean }} params
 */
export async function sendBulkSmsBd({
  apiUrl,
  apiKey,
  senderId,
  number,
  message,
  method = 'POST',
  isMasking = false,
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
  const apiSenderId = normalizeBulkSmsBdSenderId(senderId, { isMasking });
  if (!apiSenderId) {
    return { success: false, error: 'SMS sender ID is not configured' };
  }

  const params = buildSmsParams({
    apiKey,
    senderId,
    number: normalized,
    message,
    isMasking,
  });

  let result;
  if (method === 'GET') {
    result = await requestGet(buildBulkSmsBdUrl({
      apiUrl: baseUrl, apiKey, senderId, number: normalized, message, isMasking,
    }));
  } else {
    result = await requestPost(baseUrl, params);
    if (!result.ok && !result.text) {
      result = await requestGet(buildBulkSmsBdUrl({
        apiUrl: baseUrl, apiKey, senderId, number: normalized, message, isMasking,
      }));
    }
  }

  if (result.error) {
    return { success: false, error: result.error, channel: 'sms' };
  }

  const parsed = parseProviderResponse(result.text);
  if (
    !parsed.success
    && (
      parsed.code === 1005
      || parsed.code === '1005'
      || parsed.code === 1002
      || parsed.code === '1002'
      || /is_masking/i.test(parsed.error || '')
    )
  ) {
    parsed.error = formatSenderIdError(senderId, isMasking);
    parsed.apiSenderId = apiSenderId;
  }
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
    const balance = json.balance ?? json.credit ?? json.data?.balance ?? json.data;
    return {
      success: true,
      balance: balance ?? json,
      raw: json,
    };
  } catch {
    return { success: true, balance: trimmed, raw: trimmed };
  }
}

export default {
  sendBulkSmsBd,
  getBulkSmsBdBalance,
  buildBulkSmsBdUrl,
  normalizeBulkSmsBdSenderId,
  inferBulkSmsBdSenderMode,
  BULKSMSBD_DEFAULTS,
};
