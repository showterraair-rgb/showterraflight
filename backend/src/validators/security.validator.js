import { z } from 'zod';

export const updateSecuritySettingsSchema = z.object({
  minPasswordLength: z.number().min(8).max(128).optional(),
  requireUppercase: z.boolean().optional(),
  requireLowercase: z.boolean().optional(),
  requireNumber: z.boolean().optional(),
  requireSpecialChar: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().min(5).max(480).optional(),
  maxLoginAttempts: z.number().min(3).max(20).optional(),
  lockoutMinutes: z.number().min(5).max(120).optional(),
  mfaRequiredForAdmin: z.boolean().optional(),
  auditRetentionDays: z.number().min(30).max(3650).optional(),
});

export default { updateSecuritySettingsSchema };
