import { canonicalBdPhone } from '../../utils/phoneUtils.js';
import { extractIpFromBulkSmsBdError } from '../../utils/serverIp.js';

/**
 * BulkSMSBD official API (bulksmsbd.net → Developers).
 * @see https://bulksmsbd.com/bulksms-api-bangladesh.php
 *
 * Send:  GET/POST http://bulksmsbd.net/api/smsapi
 *   api_key, type=text, number=88017XXXXXXXX, senderid=8809648909214, message
 * Balance: GET/POST http://bulksmsbd.net/api/getBalanceApi?api_key=...
 */
export const BULKSMSBD_DEFAULTS = {
  providerName: 'BulkSMSBD',
  apiUrl: 'http://bulksmsbd.net/api/smsapi',
  balanceUrl: 'http://bulksmsbd.net/api/getBalanceApi',
  senderId: '8809648909214',
};

/** BulkSMSBD response_code 202 = accepted/sent */
const SUCCESS_CODES = new Set([202, '202']);

const ERROR_HINTS = {
  1032: 'Server IP not whitelisted — add your VPS IP in BulkSMSBD Phonebook → IP White List (Type: API)',
  1001: 'Invalid API key',
  1002: 'Sender ID not correct or disabled — use exact value from BulkSMSBD Developers page',
  1003: 'Invalid phone number — use 88017XXXXXXXX format',
  1004: 'Insufficient balance',
  1005: 'Sender ID not registered on BulkSMSBD — copy senderid from Developers dashboard',
  1013: 'Sender ID not linked to your API key',
  1014: 'Sender type not found for this API key',
  1015: 'No valid gateway for this sender ID',
};

function digitsOnly(raw) {
  return String(raw || '').replace(/\D/g, '');
}

/** Masking = alphanumeric brand. Non-masking = dedicated numeric sender. */
export function inferBulkSmsBdSenderMode(senderId) {
  const trimmed = String(senderId || '').trim();
  if (!trimmed) return 'non_masking';
  if (/[A-Za-z]/.test(trimmed)) return 'masking';
  return 'non_masking';
}

/**
 * API senderid per BulkSMSBD Developers dashboard (non-masking): 8809648909214
 * Masking: approved brand text (max 11 chars).
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
    return digits.slice(0, 13);
  }
  if (digits.startsWith('0') && digits.length >= 10) {
    return `880${digits.slice(1, 11)}`;
  }
  if (digits.length === 10) {
    return `880${digits}`;
  }
  return digits.slice(0, 13);
}

/** Display/storage: +8809648909214 */
export function displayBulkSmsBdSenderId(raw, { isMasking } = {}) {
  const api = normalizeBulkSmsBdSenderId(raw, { isMasking });
  if (!api) return '';
  if (isMasking || inferBulkSmsBdSenderMode(raw) === 'masking') return api;
  if (api.startsWith('880')) return `+${api}`;
  return api;
}

function formatSenderIdError(rawSenderId, isMasking) {
  const apiId = normalizeBulkSmsBdSenderId(rawSenderId, { isMasking });
  if (isMasking || inferBulkSmsBdSenderMode(rawSenderId) === 'masking') {
    return 'Masking sender ID not found. Copy the approved brand name exactly from BulkSMSBD → Sender ID.';
  }
  return apiId
    ? `Sender ID "${apiId}" not found on BulkSMSBD. Use the exact senderid from Developers page (e.g. 8809648909214).`
    : 'Sender ID not configured. Set the approved senderid from BulkSMSBD Developers dashboard.';
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
      detail = hint || 'Sender ID not registered on BulkSMSBD. Use senderid from Developers dashboard.';
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
        error: 'Sender ID not registered. Use exact senderid from BulkSMSBD Developers page (8809648909214 format).',
        code: 1005,
        raw: trimmed,
      };
    }
    return { success: false, error: trimmed, raw: trimmed };
  }
}

function buildSmsParams({ apiKey, senderId, number, message, isMasking }) {
  return {
    api_key: apiKey,
    type: 'text',
    number,
    senderid: normalizeBulkSmsBdSenderId(senderId, { isMasking }),
    message: String(message || '').trim(),
  };
}

async function requestGet(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    const text = await res.text();
    return { ok: res.ok, text, status: res.status, method: 'GET' };
  } catch (err) {
    const message = err.name === 'AbortError' ? 'SMS provider request timed out' : err.message;
    return { ok: false, error: message, method: 'GET' };
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
    return { ok: res.ok, text, status: res.status, method: 'POST' };
  } catch (err) {
    const message = err.name === 'AbortError' ? 'SMS provider request timed out' : err.message;
    return { ok: false, error: message, method: 'POST' };
  } finally {
    clearTimeout(timer);
  }
}

export function buildBulkSmsBdUrl({ apiUrl, apiKey, senderId, number, message, isMasking }) {
  const baseUrl = apiUrl || BULKSMSBD_DEFAULTS.apiUrl;
  const params = new URLSearchParams(buildSmsParams({ apiKey, senderId, number, message, isMasking }));
  return `${baseUrl}?${params.toString()}`;
}

async function dispatchSms(baseUrl, params, { apiUrl, apiKey, senderId, number, message, isMasking }) {
  const getUrl = buildBulkSmsBdUrl({ apiUrl: baseUrl, apiKey, senderId, number, message, isMasking });

  let result = await requestGet(getUrl);
  if (!result.error && result.text) {
    const parsed = parseProviderResponse(result.text);
    if (parsed.success) return { ...result, parsed };
  }

  result = await requestPost(baseUrl, params);
  if (!result.error && result.text) {
    const parsed = parseProviderResponse(result.text);
    if (parsed.success) return { ...result, parsed };
    if (result.text.trim()) return { ...result, parsed };
  }

  if (!result.text && !result.error) {
    result = await requestGet(getUrl);
  }

  return {
    ...result,
    parsed: parseProviderResponse(result.text || ''),
  };
}

/**
 * @param {{ apiUrl?: string, apiKey: string, senderId: string, number: string, message: string, isMasking?: boolean }} params
 */
export async function sendBulkSmsBd({
  apiUrl,
  apiKey,
  senderId,
  number,
  message,
  isMasking = false,
}) {
  const normalized = canonicalBdPhone(number);
  if (!normalized) {
    return { success: false, error: 'Invalid Bangladesh mobile number (use +88017… or 017…)' };
  }
  if (!apiKey) {
    return { success: false, error: 'SMS API key is not configured' };
  }
  const apiSenderId = normalizeBulkSmsBdSenderId(senderId, { isMasking });
  if (!apiSenderId) {
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
    isMasking,
  });

  const { error, parsed, method } = await dispatchSms(baseUrl, params, {
    apiUrl: baseUrl,
    apiKey,
    senderId,
    number: normalized,
    message,
    isMasking,
  });

  if (error) {
    return { success: false, error, channel: 'sms' };
  }

  const result = { ...parsed };
  if (
    !result.success
    && (
      result.code === 1005
      || result.code === '1005'
      || result.code === 1002
      || result.code === '1002'
      || /is_masking/i.test(result.error || '')
    )
  ) {
    result.error = formatSenderIdError(senderId, isMasking);
    result.apiSenderId = apiSenderId;
  }

  return {
    ...result,
    channel: 'sms',
    provider: BULKSMSBD_DEFAULTS.providerName,
    recipient: normalized,
    apiSenderId,
    requestMethod: method,
  };
}

export async function getBulkSmsBdBalance({ apiKey, balanceUrl }) {
  if (!apiKey) {
    return { success: false, error: 'SMS API key is not configured' };
  }

  const baseUrl = balanceUrl || BULKSMSBD_DEFAULTS.balanceUrl;
  const url = `${baseUrl}?${new URLSearchParams({ api_key: apiKey }).toString()}`;
  const result = await requestGet(url);

  if (result.error) {
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

/** Run balance + optional test send (for scripts / diagnostics). */
export async function testBulkSmsBdConnection({
  apiKey,
  senderId,
  apiUrl,
  balanceUrl,
  testNumber,
  testMessage = 'Test SMS from Show Terra Flight',
  isMasking = false,
  send = false,
}) {
  const balance = await getBulkSmsBdBalance({ apiKey, balanceUrl });
  const apiSenderId = normalizeBulkSmsBdSenderId(senderId || BULKSMSBD_DEFAULTS.senderId, { isMasking });
  const out = {
    balance,
    apiSenderId,
    displaySenderId: displayBulkSmsBdSenderId(senderId || BULKSMSBD_DEFAULTS.senderId, { isMasking }),
    sampleUrl: testNumber
      ? buildBulkSmsBdUrl({
        apiUrl,
        apiKey,
        senderId: apiSenderId,
        number: canonicalBdPhone(testNumber),
        message: testMessage,
        isMasking,
      }).replace(apiKey, '***')
      : null,
  };

  if (send && testNumber && apiKey) {
    out.send = await sendBulkSmsBd({
      apiUrl,
      apiKey,
      senderId: senderId || BULKSMSBD_DEFAULTS.senderId,
      number: testNumber,
      message: testMessage,
      isMasking,
    });
  }

  return out;
}

export default {
  sendBulkSmsBd,
  getBulkSmsBdBalance,
  buildBulkSmsBdUrl,
  normalizeBulkSmsBdSenderId,
  displayBulkSmsBdSenderId,
  inferBulkSmsBdSenderMode,
  testBulkSmsBdConnection,
  BULKSMSBD_DEFAULTS,
};
