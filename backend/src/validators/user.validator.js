import { z } from 'zod';
import { ROLES } from '../config/constants.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');

const passwordBase = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

const permissionOverridesSchema = z.object({
  grants: z.array(z.string().max(80)).optional(),
  denies: z.array(z.string().max(80)).optional(),
}).optional();

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  role: z.enum(Object.values(ROLES)).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().trim().toLowerCase(),
  phone: z.string().min(6).max(20).trim().optional().or(z.literal('')),
  password: passwordBase,
  role: z.enum(Object.values(ROLES)).default(ROLES.SALES_EXECUTIVE),
  department: z.string().max(120).trim().optional(),
  designation: z.string().max(120).trim().optional(),
  notes: z.string().max(2000).trim().optional(),
  jobRegistrationNumber: z.string().max(80).trim().optional(),
  permissionOverrides: permissionOverridesSchema,
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  email: z.string().email().trim().toLowerCase().optional(),
  phone: z.string().min(6).max(20).trim().optional().or(z.literal('')),
  role: z.enum(Object.values(ROLES)).optional(),
  department: z.string().max(120).trim().optional(),
  designation: z.string().max(120).trim().optional(),
  notes: z.string().max(2000).trim().optional(),
  jobRegistrationNumber: z.string().max(80).trim().optional(),
  permissionOverrides: permissionOverridesSchema,
  isActive: z.boolean().optional(),
  password: passwordBase.optional(),
});

export const setUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const idParamSchema = z.object({
  id: objectId,
});

export default {
  listQuerySchema,
  createUserSchema,
  updateUserSchema,
  setUserStatusSchema,
  idParamSchema,
};
