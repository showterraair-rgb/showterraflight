/**
 * Meta WhatsApp Cloud API provider.
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api
 */

function buildTemplateComponents(bodyParams = []) {
  if (!bodyParams.length) return [];
  return [
    {
      type: 'body',
      parameters: bodyParams.map((text) => ({
        type: 'text',
        text: String(text ?? '').slice(0, 1024),
      })),
    },
  ];
}

export async function sendMetaWhatsAppTemplate({
  graphApiBase,
  phoneNumberId,
  accessToken,
  to,
  templateName,
  languageCode = 'en',
  bodyParams = [],
}) {
  const url = `${graphApiBase}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: buildTemplateComponents(bodyParams),
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errMsg = data?.error?.message || data?.error?.error_user_msg || `HTTP ${response.status}`;
    return {
      success: false,
      error: errMsg,
      raw: data,
      httpStatus: response.status,
    };
  }

  const messageId = data?.messages?.[0]?.id || '';
  return {
    success: true,
    messageId,
    raw: data,
    httpStatus: response.status,
  };
}

export async function sendMetaWhatsAppText({
  graphApiBase,
  phoneNumberId,
  accessToken,
  to,
  text,
}) {
  const url = `${graphApiBase}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: String(text || '').slice(0, 4096) },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errMsg = data?.error?.message || data?.error?.error_user_msg || `HTTP ${response.status}`;
    return {
      success: false,
      error: errMsg,
      raw: data,
      httpStatus: response.status,
    };
  }

  return {
    success: true,
    messageId: data?.messages?.[0]?.id || '',
    raw: data,
    httpStatus: response.status,
  };
}

export default {
  sendMetaWhatsAppTemplate,
  sendMetaWhatsAppText,
  buildTemplateComponents,
};
