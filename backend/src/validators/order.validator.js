import { z } from 'zod';
import {
  ORDER_SOURCES,
  ORDER_STATUSES,
  JOURNEY_TYPES,
  TRAVEL_CLASSES,
  APPROVAL_STATUSES,
} from '../config/constants.js';
import { bdPhoneString } from '../utils/bdPhoneSchema.js';

function roundTripRefine(schema) {
  return schema.refine((d) => d.journeyType !== 'round_trip' || d.returnDate, {
    message: 'Return date required for round trip',
    path: ['returnDate'],
  });
}

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  approvalStatus: z.enum(APPROVAL_STATUSES).optional(),
  source: z.enum(ORDER_SOURCES).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  isFromWebsite: z.enum(['true', 'false']).optional(),
});

const createOrderBaseSchema = z.object({
  customerId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  customerName: z.string().min(2).max(100).trim(),
  customerPhone: bdPhoneString(),
  customerEmail: z.string().email().trim().toLowerCase().optional().or(z.literal('')),
  source: z.enum(ORDER_SOURCES).default('phone'),
  status: z.enum(ORDER_STATUSES).default('inquiry'),
  journeyType: z.enum(JOURNEY_TYPES).default('one_way'),
  fromDestination: z.string().min(2).max(100).trim(),
  toDestination: z.string().min(2).max(100).trim(),
  journeyDate: z.string().min(1),
  returnDate: z.string().optional(),
  passengerCount: z.coerce.number().int().min(1).max(20).default(1),
  travelClass: z.enum(TRAVEL_CLASSES).default('economy'),
  quotedSalePrice: z.coerce.number().min(0).optional(),
  requestNotes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
  nextFollowUpDate: z.string().optional(),
  assignedTo: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});

export const createOrderSchema = roundTripRefine(createOrderBaseSchema);

export const updateOrderSchema = roundTripRefine(createOrderBaseSchema.partial().omit({ source: true }));

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(1000).optional(),
  cancelReason: z.string().max(500).optional(),
});

export const followUpSchema = z.object({
  note: z.string().min(1).max(2000),
  nextFollowUpDate: z.string().optional(),
});

export const linkCustomerSchema = z.object({
  customerId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  createCustomer: z.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
});

export default {
  listQuerySchema,
  createOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  followUpSchema,
  linkCustomerSchema,
  idParamSchema,
};
