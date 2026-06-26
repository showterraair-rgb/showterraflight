import env from '../../config/env.js';

function getWasenderConfig() {
  return {
    apiUrl: process.env.WASENDER_API_URL || 'https://wasenderapi.com/api/send-message',
    apiKey: process.env.WASENDER_API_KEY || '',
    enabled: process.env.WASENDER_ENABLED === 'true',
  };
}

/**
 * WhatsApp via Wasender API — https://wasenderapi.com/
 * Set WASENDER_API_KEY and WASENDER_ENABLED=true when ready.
 */
export async function sendWasenderMessage({ to, message }) {
  const config = getWasenderConfig();
  const phone = String(to || '').replace(/\D/g, '');

  if (!phone) {
    return { success: false, error: 'Missing phone number', channel: 'whatsapp' };
  }

  if (!config.enabled || !config.apiKey) {
    console.log('[Wasender:stub]', phone, message?.slice(0, 100));
    return {
      success: true,
      channel: 'whatsapp',
      messageId: `wasender-stub-${Date.now()}`,
      mocked: true,
      note: 'Set WASENDER_API_KEY and WASENDER_ENABLED=true',
    };
  }

  try {
    const res = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ to: phone, text: message }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, channel: 'whatsapp', error: data.message || data.error || res.statusText };
    }
    return { success: true, channel: 'whatsapp', messageId: data.id || data.messageId || `wasender-${Date.now()}`, raw: data };
  } catch (err) {
    return { success: false, channel: 'whatsapp', error: err.message };
  }
}

export default { sendWasenderMessage, getWasenderConfig };
