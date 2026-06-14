import { z } from 'zod';
import { ACCOUNT_TYPES, MOBILE_BANKING_TYPES, NOTIFICATION_EVENT_TYPES } from '../config/constants.js';

export const createAccountSchema = z.object({
  title: z.string().max(120).optional(),
  name: z.string().min(1).max(120),
  accountName: z.string().max(120).optional(),
  type: z.enum(ACCOUNT_TYPES),
  accountNumber: z.string().max(80).optional(),
  bankName: z.string().max(120).optional(),
  branchRouting: z.string().max(120).optional(),
  mobileNumber: z.string().max(30).optional(),
  mobileBankingType: z.enum(MOBILE_BANKING_TYPES).nullable().optional(),
  qrImagePath: z.string().max(500).optional(),
  openingBalance: z.coerce.number().optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const updateAccountSchema = createAccountSchema.partial().omit({ openingBalance: true });

export const accountStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateSmsSettingsSchema = z.object({
  providerName: z.string().max(120).optional(),
  apiUrl: z.string().max(500).optional(),
  apiKey: z.string().max(500).optional(),
  apiToken: z.string().max(500).optional(),
  senderId: z.string().max(50).optional(),
  username: z.string().max(120).optional(),
  password: z.string().max(200).optional(),
  isEnabled: z.boolean().optional(),
});

export const updateEmailSettingsSchema = z.object({
  smtpHost: z.string().max(200).optional(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  username: z.string().max(200).optional(),
  password: z.string().max(200).optional(),
  encryption: z.enum(['none', 'tls', 'ssl']).optional(),
  fromEmail: z.string().email().optional().or(z.literal('')),
  fromName: z.string().max(120).optional(),
  replyTo: z.string().email().optional().or(z.literal('')),
  isEnabled: z.boolean().optional(),
});

export const testSmsSchema = z.object({
  to: z.string().min(6).max(30),
  message: z.string().max(500).optional(),
});

export const testEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  smsBody: z.string().max(2000).optional(),
  emailSubject: z.string().max(200).optional(),
  emailBody: z.string().max(5000).optional(),
  isActive: z.boolean().optional(),
});

export const updateAutomationSchema = z.object({
  notifyCustomer: z.boolean().optional(),
  notifyAdmin: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
});

export const templateKeyParamSchema = z.object({
  templateKey: z.enum(NOTIFICATION_EVENT_TYPES),
});

export const eventTypeParamSchema = z.object({
  eventType: z.enum(NOTIFICATION_EVENT_TYPES),
});

export const notificationLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(['pending', 'sent', 'failed']).optional(),
  channel: z.enum(['sms', 'email', 'console']).optional(),
  eventType: z.enum(NOTIFICATION_EVENT_TYPES).optional(),
  bookingId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  orderId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});

export default {
  createAccountSchema,
  updateAccountSchema,
  accountStatusSchema,
  updateSmsSettingsSchema,
  updateEmailSettingsSchema,
  testSmsSchema,
  testEmailSchema,
  updateTemplateSchema,
  updateAutomationSchema,
  templateKeyParamSchema,
  eventTypeParamSchema,
  notificationLogQuerySchema,
};
