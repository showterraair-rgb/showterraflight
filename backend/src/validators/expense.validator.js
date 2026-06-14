import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  accountId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const createExpenseSchema = z.object({
  categoryId: z.string().regex(/^[a-f\d]{24}$/i),
  title: z.string().min(2).max(200).trim(),
  amount: z.coerce.number().min(0.01),
  expenseDate: z.string().min(1),
  accountId: z.string().regex(/^[a-f\d]{24}$/i),
  paymentMethod: z.string().max(50).optional(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  billFilePath: z.string().max(500).optional(),
  billFileName: z.string().max(255).optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  nextDueDate: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
});

export default { listQuerySchema, createExpenseSchema, idParamSchema };
