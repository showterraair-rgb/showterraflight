import { gatewayApi } from '../services/finance.api';

function pickGateway(status, preferred) {
  const ready = [];
  if (status.sslcommerz?.ready) ready.push('sslcommerz');
  if (status.bkash?.ready) ready.push('bkash');
  if (!ready.length) return null;
  if (preferred && ready.includes(preferred)) return preferred;
  if (ready.length === 1) return ready[0];
  const choice = window.prompt(
    `Select payment gateway:\n1. SSLCommerz (Card/Mobile Banking)\n2. bKash\n\nEnter 1 or 2`,
    '1'
  );
  if (choice === '2' && ready.includes('bkash')) return 'bkash';
  return ready.includes('sslcommerz') ? 'sslcommerz' : ready[0];
}

export async function startOnlinePayment(payload, preferredGateway) {
  const { data: statusRes } = await gatewayApi.getStatus();
  const status = statusRes.data;
  if (!status.anyReady) {
    throw new Error('Online payment is not configured yet. Add SSLCommerz or bKash API keys under Payment Settings → Online Gateway.');
  }

  const gateway = pickGateway(status, preferredGateway);
  if (!gateway) {
    throw new Error('No payment gateway is ready');
  }

  const { data } = await gatewayApi.initiate({ ...payload, gateway });
  if (!data.data?.gatewayUrl) {
    throw new Error('Payment gateway did not return a checkout URL');
  }
  window.location.href = data.data.gatewayUrl;
}

export default { startOnlinePayment };
