/**
 * Notification delivery abstraction.
 * Replace channel implementations when email/SMS/WhatsApp providers are configured.
 */

const CHANNELS = ['console', 'email', 'sms', 'whatsapp'];

export async function sendNotification({ channel = 'console', to, subject, message, metadata = {} }) {
  const payload = { channel, to, subject, message, metadata, sentAt: new Date() };

  switch (channel) {
    case 'email':
      return sendEmail(payload);
    case 'sms':
      return sendSms(payload);
    case 'whatsapp':
      return sendWhatsApp(payload);
    case 'console':
    default:
      return sendConsole(payload);
  }
}

async function sendConsole({ to, subject, message, metadata }) {
  console.log('[NOTIFICATION:console]', { to, subject, message: message?.slice(0, 120), ...metadata });
  return { success: true, channel: 'console', messageId: `console-${Date.now()}` };
}

async function sendEmail(payload) {
  // Provider hook: nodemailer, SendGrid, etc.
  console.log('[NOTIFICATION:email:mock]', payload.subject, '→', payload.to);
  return { success: true, channel: 'email', messageId: `email-mock-${Date.now()}` };
}

async function sendSms(payload) {
  console.log('[NOTIFICATION:sms:mock]', payload.to, payload.message?.slice(0, 80));
  return { success: true, channel: 'sms', messageId: `sms-mock-${Date.now()}` };
}

async function sendWhatsApp(payload) {
  console.log('[NOTIFICATION:whatsapp:mock]', payload.to, payload.message?.slice(0, 80));
  return { success: true, channel: 'whatsapp', messageId: `wa-mock-${Date.now()}` };
}

export function resolveReminderChannel(type) {
  if (type === 'customer_due' || type === 'booking_travel') return 'whatsapp';
  if (type === 'supplier_payable') return 'console';
  return 'console';
}

export default { sendNotification, resolveReminderChannel, CHANNELS };
