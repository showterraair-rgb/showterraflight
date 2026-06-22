import Setting from '../models/Setting.js';

const ENDPOINTS = {
  sandbox: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout',
  live: 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout',
};

let cachedToken = null;
let tokenExpiresAt = 0;

function baseUrl(isSandbox) {
  return isSandbox ? ENDPOINTS.sandbox : ENDPOINTS.live;
}

export async function getBkashConfig() {
  const setting = await Setting.findOne({ key: 'company' }).lean();
  const cfg = setting?.gatewaySettings?.bkash || {};
  return {
    enabled: Boolean(cfg.enabled),
    isSandbox: cfg.isSandbox !== false,
    appKey: String(cfg.appKey || '').trim(),
    appSecret: String(cfg.appSecret || '').trim(),
    username: String(cfg.username || '').trim(),
    password: String(cfg.password || '').trim(),
    settlementAccountId: cfg.settlementAccountId?.toString?.() || cfg.settlementAccountId || null,
  };
}

export function isBkashConfigured(config) {
  return Boolean(
    config.appKey
    && config.appSecret
    && config.username
    && config.password
    && config.settlementAccountId
  );
}

async function grantBkashToken(config) {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60_000) {
    return cachedToken;
  }

  const url = `${baseUrl(config.isSandbox)}/token/grant`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      username: config.username,
      password: config.password,
    },
    body: JSON.stringify({
      app_key: config.appKey,
      app_secret: config.appSecret,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.statusCode !== '0000') {
    throw new Error(data.statusMessage || data.errorMessage || 'bKash token grant failed');
  }

  cachedToken = data.id_token;
  tokenExpiresAt = now + Number(data.expires_in || 3600) * 1000;
  return cachedToken;
}

export async function createBkashPayment({
  amount,
  tranId,
  customerPhone,
  callbackUrl,
}) {
  const config = await getBkashConfig();
  if (!config.enabled) throw new Error('bKash is not enabled');
  if (!isBkashConfigured(config)) {
    throw new Error('bKash credentials are not configured');
  }

  const token = await grantBkashToken(config);
  const url = `${baseUrl(config.isSandbox)}/create`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-APP-Key': config.appKey,
    },
    body: JSON.stringify({
      mode: '0011',
      payerReference: customerPhone || '01700000000',
      callbackURL: callbackUrl,
      amount: Number(amount).toFixed(2),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: tranId,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.statusCode !== '0000') {
    throw new Error(data.statusMessage || data.errorMessage || 'bKash payment creation failed');
  }

  return {
    paymentId: data.paymentID,
    gatewayUrl: data.bkashURL,
    raw: data,
  };
}

export async function queryBkashPayment(paymentId) {
  const config = await getBkashConfig();
  const token = await grantBkashToken(config);
  const url = `${baseUrl(config.isSandbox)}/payment/status/${encodeURIComponent(paymentId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: token,
      'X-APP-Key': config.appKey,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.statusMessage || data.errorMessage || 'bKash payment query failed');
  }
  return data;
}

export async function executeBkashPayment(paymentId) {
  const config = await getBkashConfig();
  const token = await grantBkashToken(config);
  const url = `${baseUrl(config.isSandbox)}/execute`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-APP-Key': config.appKey,
    },
    body: JSON.stringify({ paymentID: paymentId }),
  });
  const data = await res.json();
  if (!res.ok || data.statusCode !== '0000') {
    throw new Error(data.statusMessage || data.errorMessage || 'bKash payment execute failed');
  }
  return data;
}

export default {
  getBkashConfig,
  isBkashConfigured,
  createBkashPayment,
  queryBkashPayment,
  executeBkashPayment,
};
