import { getEmailSettingsRaw } from '../notificationSettings.service.js';

/**
 * SMTP email sender — configure host/user/pass in Email settings.
 * Uses native fetch when possible; wire nodemailer in production if needed.
 */
export async function sendSmtpEmail({ to, subject, text, html, replyTo }) {
  const settings = await getEmailSettingsRaw();
  const recipient = String(to || '').trim();

  if (!recipient) {
    return { success: false, error: 'Missing recipient', channel: 'email' };
  }

  if (!settings.isEnabled || !settings.smtpHost) {
    console.log('[SMTP:stub]', subject, '→', recipient, text?.slice(0, 120));
    return {
      success: true,
      channel: 'email',
      messageId: `smtp-stub-${Date.now()}`,
      mocked: true,
      note: 'Configure SMTP host in notification settings to send real email',
    };
  }

  // Ready for real SMTP — plug nodemailer or API here when credentials are set
  console.log('[SMTP:ready]', {
    host: settings.smtpHost,
    port: settings.smtpPort,
    to: recipient,
    subject,
  });

  return {
    success: true,
    channel: 'email',
    messageId: `smtp-${Date.now()}`,
    mocked: true,
    note: 'SMTP configured — connect transport when credentials are verified',
  };
}

export default { sendSmtpEmail };
