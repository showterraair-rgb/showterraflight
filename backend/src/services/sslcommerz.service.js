import Setting from '../models/Setting.js';

const ENDPOINTS = {
  sandbox: {
    init: 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php',
    validate: 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php',
  },
  live: {
    init: 'https://securepay.sslcommerz.com/gwprocess/v4/api.php',
    validate: 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php',
  },
};

export async function getSslcommerzConfig() {
  const setting = await Setting.findOne({ key: 'company' }).lean();
  const cfg = setting?.gatewaySettings?.sslcommerz || {};
  return {
    enabled: Boolean(cfg.enabled),
    isSandbox: cfg.isSandbox !== false,
    storeId: String(cfg.storeId || '').trim(),
    storePassword: String(cfg.storePassword || '').trim(),
    settlementAccountId: cfg.settlementAccountId?.toString?.() || cfg.settlementAccountId || null,
  };
}

function endpoints(isSandbox) {
  return isSandbox ? ENDPOINTS.sandbox : ENDPOINTS.live;
}

export async function initiateSslcommerzSession({
  tranId,
  amount,
  customer,
  productName,
  urls,
}) {
  const config = await getSslcommerzConfig();
  if (!config.enabled) throw new Error('SSLCommerz is not enabled');
  if (!config.storeId || !config.storePassword) {
    throw new Error('SSLCommerz store credentials are not configured');
  }

  const { init: initUrl } = endpoints(config.isSandbox);
  const params = new URLSearchParams({
    store_id: config.storeId,
    store_passwd: config.storePassword,
    total_amount: Number(amount).toFixed(2),
    currency: 'BDT',
    tran_id: tranId,
    success_url: urls.success,
    fail_url: urls.fail,
    cancel_url: urls.cancel,
    ipn_url: urls.ipn,
    cus_name: customer.name || 'Customer',
    cus_email: customer.email || 'showterraair@gmail.com',
    cus_phone: customer.phone || '01700000000',
    product_name: productName || 'Air Ticket',
    product_category: 'Air Ticket',
    product_profile: 'general',
    shipping_method: 'NO',
    num_of_item: '1',
  });

  const res = await fetch(initUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();
  if (data.status !== 'SUCCESS') {
    throw new Error(data.failedreason || data.status || 'SSLCommerz session creation failed');
  }
  return {
    sessionKey: data.sessionkey,
    gatewayUrl: data.GatewayPageURL,
    raw: data,
  };
}

export async function validateSslcommerzPayment(valId) {
  const config = await getSslcommerzConfig();
  if (!config.storeId || !config.storePassword) {
    throw new Error('SSLCommerz store credentials are not configured');
  }
  const { validate: validateUrl } = endpoints(config.isSandbox);
  const url = `${validateUrl}?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(config.storeId)}&store_passwd=${encodeURIComponent(config.storePassword)}&format=json`;
  const res = await fetch(url);
  return res.json();
}

export default { getSslcommerzConfig, initiateSslcommerzSession, validateSslcommerzPayment };
