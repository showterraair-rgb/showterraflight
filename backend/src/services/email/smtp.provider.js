import nodemailer from 'nodemailer';
import env from '../../config/env.js';
import { getEmailSettingsRaw } from '../notificationSettings.service.js';

function resolveEmailSettings(settings) {
  return {
    smtpHost: settings.smtpHost || env.email?.smtpHost || '',
    smtpPort: settings.smtpPort ?? env.email?.smtpPort ?? 587,
    username: settings.username || env.email?.username || '',
    password: settings.password || env.email?.password || '',
    encryption: settings.encryption || env.email?.encryption || 'tls',
    fromEmail: settings.fromEmail || env.email?.fromEmail || settings.username || '',
    fromName: settings.fromName || env.email?.fromName || 'Show Terra Flight',
    replyTo: settings.replyTo || settings.fromEmail || env.email?.fromEmail || '',
    isEnabled: settings.isEnabled ?? env.email?.enabled ?? false,
  };
}

/**
 * SMTP email sender — Gmail and other providers via nodemailer.
 */
export async function sendSmtpEmail({ to, subject, text, html, replyTo }) {
  const settings = resolveEmailSettings(await getEmailSettingsRaw());
  const recipient = String(to || '').trim();

  if (!recipient) {
    return { success: false, error: 'Missing recipient', channel: 'email' };
  }

  if (!settings.isEnabled || !settings.smtpHost || !settings.username || !settings.password) {
    console.log('[SMTP:stub]', subject, '→', recipient, text?.slice(0, 120));
    return {
      success: false,
      channel: 'email',
      error: 'Email not configured (SMTP host, user, and password required)',
      mocked: true,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.encryption === 'ssl',
      auth: {
        user: settings.username,
        pass: settings.password,
      },
      ...(settings.encryption === 'tls' ? { requireTLS: true } : {}),
    });

    const info = await transporter.sendMail({
      from: `"${settings.fromName}" <${settings.fromEmail || settings.username}>`,
      to: recipient,
      subject: subject || 'Show Terra Flight',
      text: text || '',
      html: html || (text ? text.replace(/\n/g, '<br>') : ''),
      replyTo: replyTo || settings.replyTo || undefined,
    });

    console.log('[SMTP:sent]', recipient, info.messageId);
    return {
      success: true,
      channel: 'email',
      messageId: info.messageId || `smtp-${Date.now()}`,
      provider: 'smtp',
    };
  } catch (err) {
    console.error('[SMTP:failed]', recipient, err.message);
    return { success: false, channel: 'email', error: err.message || 'Email send failed' };
  }
}

export default { sendSmtpEmail };
