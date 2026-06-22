import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

export const listPaymentRequestQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(['pending', 'paid', 'cancelled']).optional(),
  customerId: objectId.optional(),
  bookingId: objectId.optional(),
});

export const createPaymentRequestSchema = z.object({
  customerId: objectId,
  bookingId: objectId.optional(),
  amount: z.coerce.number().min(0.01),
  dueDate: z.string().min(1),
  notes: z.string().max(2000).optional(),
  sendNotification: z.boolean().optional().default(true),
});

export const recordPaymentRequestSchema = z.object({
  accountId: objectId,
  paymentDate: z.string().optional(),
  paymentMethod: z.string().max(50).optional(),
  referenceNumber: z.string().max(100).optional(),
});

export const cancelPaymentRequestSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const paymentRequestIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
});

export default {
  listPaymentRequestQuerySchema,
  createPaymentRequestSchema,
  recordPaymentRequestSchema,
  cancelPaymentRequestSchema,
  paymentRequestIdParamSchema,
};
