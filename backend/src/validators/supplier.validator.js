import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  type: z.enum(['agent', 'supplier', 'airline_office', 'other']).optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  company: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().trim().toLowerCase().optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  contactPerson: z.string().max(100).optional(),
  type: z.enum(['agent', 'supplier', 'airline_office', 'other']).default('agent'),
  paymentTerms: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
});

export default {
  listQuerySchema,
  createSupplierSchema,
  updateSupplierSchema,
  idParamSchema,
};
