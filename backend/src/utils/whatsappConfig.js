import env from '../config/env.js';

export function resolveWhatsAppConfig(settings = {}) {
  const accessToken = settings.accessToken || env.whatsapp.accessToken || '';
  const phoneNumberId = settings.phoneNumberId || env.whatsapp.phoneNumberId || '';
  const businessAccountId = settings.businessAccountId || env.whatsapp.businessAccountId || '';
  const webhookVerifyToken = settings.webhookVerifyToken || env.whatsapp.webhookVerifyToken || '';
  const apiVersion = settings.apiVersion || env.whatsapp.apiVersion || 'v21.0';
  const defaultCountryCode = settings.defaultCountryCode || env.whatsapp.defaultCountryCode || '880';
  const defaultLanguageCode = settings.defaultLanguageCode || env.whatsapp.defaultLanguageCode || 'en';
  const testTemplateName = settings.testTemplateName || env.whatsapp.testTemplateName || 'hello_world';
  const isEnabled = settings.isEnabled ?? env.whatsapp.enabled ?? false;

  return {
    accessToken,
    phoneNumberId,
    businessAccountId,
    webhookVerifyToken,
    apiVersion,
    defaultCountryCode,
    defaultLanguageCode,
    testTemplateName,
    isEnabled: Boolean(isEnabled),
    isConfigured: Boolean(accessToken && phoneNumberId),
    graphApiBase: `https://graph.facebook.com/${apiVersion}`,
  };
}

export default { resolveWhatsAppConfig };
