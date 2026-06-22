import { getSslcommerzConfig } from './sslcommerz.service.js';
import { getBkashConfig, isBkashConfigured } from './bkash.service.js';

export function isSslcommerzConfigured(config) {
  return Boolean(config.storeId && config.storePassword && config.settlementAccountId);
}

export async function getGatewayStatus() {
  const ssl = await getSslcommerzConfig();
  const bk = await getBkashConfig();
  const sslReady = ssl.enabled && isSslcommerzConfigured(ssl);
  const bkReady = bk.enabled && isBkashConfigured(bk);
  return {
    sslcommerz: {
      enabled: ssl.enabled,
      configured: isSslcommerzConfigured(ssl),
      isSandbox: ssl.isSandbox,
      ready: sslReady,
    },
    bkash: {
      enabled: bk.enabled,
      configured: isBkashConfigured(bk),
      isSandbox: bk.isSandbox,
      ready: bkReady,
    },
    anyReady: sslReady || bkReady,
  };
}

export function maskGatewaySettings(gatewaySettings = {}) {
  const ssl = gatewaySettings.sslcommerz || {};
  const bk = gatewaySettings.bkash || {};
  return {
    sslcommerz: {
      enabled: Boolean(ssl.enabled),
      isSandbox: ssl.isSandbox !== false,
      storeId: ssl.storeId || '',
      storePassword: ssl.storePassword ? '••••••••' : '',
      hasStorePassword: Boolean(ssl.storePassword),
      settlementAccountId: ssl.settlementAccountId?.toString?.() || ssl.settlementAccountId || '',
    },
    bkash: {
      enabled: Boolean(bk.enabled),
      isSandbox: bk.isSandbox !== false,
      appKey: bk.appKey || '',
      appSecret: bk.appSecret ? '••••••••' : '',
      hasAppSecret: Boolean(bk.appSecret),
      username: bk.username || '',
      password: bk.password ? '••••••••' : '',
      hasPassword: Boolean(bk.password),
      settlementAccountId: bk.settlementAccountId?.toString?.() || bk.settlementAccountId || '',
    },
  };
}

export default { getGatewayStatus, maskGatewaySettings, isSslcommerzConfigured };
