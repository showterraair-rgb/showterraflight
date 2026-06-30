import { env } from '../config/env.js';
import { BULKSMSBD_DEFAULTS } from '../services/sms/bulksmsbd.provider.js';

/**
 * Merge DB SMS settings with environment fallbacks.
 * @param {Record<string, unknown>} settings
 */
export function resolveSmsConfig(settings = {}) {
  const apiKey = String(settings.apiKey || env.sms.apiKey || '').trim();
  const senderId = String(settings.senderId || env.sms.senderId || '').trim();
  const envEnabled = env.sms.enabled || Boolean(env.sms.apiKey && env.sms.senderId);
  const dbEnabled = Boolean(settings.isEnabled);
  const isConfigured = Boolean(apiKey && senderId);

  return {
    isEnabled: dbEnabled || envEnabled,
    providerName: settings.providerName || BULKSMSBD_DEFAULTS.providerName,
    apiUrl: settings.apiUrl || env.sms.apiUrl || BULKSMSBD_DEFAULTS.apiUrl,
    balanceUrl: settings.balanceUrl || env.sms.balanceUrl || BULKSMSBD_DEFAULTS.balanceUrl,
    apiKey,
    senderId,
    username: settings.username || '',
    password: settings.password || '',
    isConfigured,
  };
}

export default { resolveSmsConfig };
