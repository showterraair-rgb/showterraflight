import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  includeInactive: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((v) => v === true || v === 'true'),
  type: z.enum(['cash', 'bank', 'bkash', 'nagad']).optional(),
  types: z.string().optional(),
});

export const openingBalanceSchema = z.object({
  openingBalance: z.coerce.number(),
  notes: z.string().max(500).optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
});

export const createTransferSchema = z.object({
  fromAccountId: z.string().regex(/^[a-f\d]{24}$/i),
  toAccountId: z.string().regex(/^[a-f\d]{24}$/i),
  amount: z.coerce.number().min(0.01),
  transferDate: z.string().min(1),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
}).refine((d) => d.fromAccountId !== d.toAccountId, {
  message: 'Cannot transfer to the same account',
  path: ['toAccountId'],
});

export { createAccountSchema, updateAccountSchema, accountStatusSchema } from './notification.validator.js';

export default { listQuerySchema, openingBalanceSchema, idParamSchema, createTransferSchema };
