import { z } from 'zod';

const passwordBase = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordBase,
});

export const requestOtpSchema = z.object({
  email: z.string().email().trim().toLowerCase().optional(),
  phone: z.string().min(6).max(20).trim().optional(),
}).refine((d) => d.email || d.phone, { message: 'Email or phone is required' });

export const verifyOtpSchema = z.object({
  email: z.string().email().trim().toLowerCase().optional(),
  phone: z.string().min(6).max(20).trim().optional(),
  code: z.string().length(6).regex(/^\d{6}$/, 'Enter 6-digit code'),
}).refine((d) => d.email || d.phone, { message: 'Email or phone is required' });

export default { loginSchema, changePasswordSchema, requestOtpSchema, verifyOtpSchema };
