import { env } from '../config/env.js';
import { BULKSMSBD_DEFAULTS } from '../services/sms/bulksmsbd.provider.js';

/**
 * Merge DB SMS settings with optional environment fallbacks.
 * @param {Record<string, unknown>} settings
 */
export function resolveSmsConfig(settings = {}) {
  const apiKey = settings.apiKey || env.sms.apiKey || '';
  const senderId = settings.senderId || env.sms.senderId || '';

  return {
    isEnabled: Boolean(settings.isEnabled),
    providerName: settings.providerName || BULKSMSBD_DEFAULTS.providerName,
    apiUrl: settings.apiUrl || env.sms.apiUrl || BULKSMSBD_DEFAULTS.apiUrl,
    balanceUrl: env.sms.balanceUrl || BULKSMSBD_DEFAULTS.balanceUrl,
    apiKey,
    senderId,
    username: settings.username || '',
    password: settings.password || '',
    isConfigured: Boolean(apiKey && senderId),
  };
}

export default { resolveSmsConfig };
