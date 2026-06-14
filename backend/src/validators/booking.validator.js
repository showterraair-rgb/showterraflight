import { z } from 'zod';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '../config/constants.js';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.enum(BOOKING_STATUSES).optional(),
  customerId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  supplierId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  orderId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const createBookingSchema = z.object({
  orderId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  customerId: z.string().regex(/^[a-f\d]{24}$/i),
  supplierId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  airline: z.string().min(2).max(100).trim(),
  route: z.string().min(2).max(200).trim(),
  sector: z.string().max(100).optional(),
  departureDate: z.string().min(1),
  returnDate: z.string().optional(),
  passengerCount: z.coerce.number().int().min(1).max(20).default(1),
  pnr: z.string().max(50).optional(),
  ticketNumber: z.string().max(50).optional(),
  purchasePrice: z.coerce.number().min(0).default(0),
  salePrice: z.coerce.number().min(0).default(0),
  directCosts: z.coerce.number().min(0).default(0),
  notes: z.string().max(2000).optional(),
  status: z.enum(BOOKING_STATUSES).default('draft'),
  ticketCopyPath: z.string().max(500).optional(),
  ticketCopyFileName: z.string().max(255).optional(),
});

export const updateBookingSchema = createBookingSchema.partial().omit({ orderId: true });

export const updateBookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  note: z.string().max(1000).optional(),
});

export const addBookingNoteSchema = z.object({
  note: z.string().min(1).max(2000),
});

export const fromOrderParamSchema = z.object({
  orderId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid order ID'),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
});

export default {
  listQuerySchema,
  createBookingSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  addBookingNoteSchema,
  fromOrderParamSchema,
  idParamSchema,
};
