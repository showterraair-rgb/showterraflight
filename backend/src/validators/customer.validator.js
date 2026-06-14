import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  phone: z.string().min(10).max(20).trim(),
  email: z.string().email().trim().toLowerCase().optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  nid: z.string().max(50).optional(),
  passportNo: z.string().max(50).optional(),
  tags: z.array(z.string().trim()).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
});

export default {
  listQuerySchema,
  createCustomerSchema,
  updateCustomerSchema,
  idParamSchema,
};
