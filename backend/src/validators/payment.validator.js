import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  customerId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  bookingId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const createCustomerPaymentSchema = z.object({
  customerId: z.string().regex(/^[a-f\d]{24}$/i),
  bookingId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  orderId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  accountId: z.string().regex(/^[a-f\d]{24}$/i),
  amount: z.coerce.number().min(0.01),
  paymentDate: z.string().min(1),
  paymentMethod: z.string().max(50).optional(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const createSupplierPaymentSchema = z.object({
  supplierId: z.string().regex(/^[a-f\d]{24}$/i),
  bookingId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  accountId: z.string().regex(/^[a-f\d]{24}$/i),
  amount: z.coerce.number().min(0.01),
  paymentDate: z.string().min(1),
  paymentMethod: z.string().max(50).optional(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
});

export default {
  listQuerySchema,
  createCustomerPaymentSchema,
  createSupplierPaymentSchema,
  idParamSchema,
};
