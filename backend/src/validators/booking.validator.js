import { z } from 'zod';
import { BOOKING_STATUSES, JOURNEY_TYPES, TRAVEL_CLASSES, APPROVAL_STATUSES } from '../config/constants.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const optionalObjectId = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  objectId.optional()
);

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
  status: z.enum(BOOKING_STATUSES).optional(),
  approvalStatus: z.enum(APPROVAL_STATUSES).optional(),
  customerId: objectId.optional(),
  supplierId: objectId.optional(),
  orderId: objectId.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const createBookingBaseSchema = z.object({
  orderId: objectId.optional(),
  customerId: objectId,
  supplierId: objectId.optional(),
  journeyType: z.enum(JOURNEY_TYPES).default('one_way'),
  fromDestination: z.string().min(2).max(100).trim(),
  toDestination: z.string().min(2).max(100).trim(),
  travelClass: z.enum(TRAVEL_CLASSES).default('economy'),
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
  purchasePriceBRL: z.coerce.number().min(0).optional(),
  salePriceBRL: z.coerce.number().min(0).optional(),
  directCostsBRL: z.coerce.number().min(0).optional(),
  bdtRate: z.coerce.number().positive().optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(BOOKING_STATUSES).default('draft'),
  ticketCopyPath: z.string().max(500).optional(),
  ticketCopyFileName: z.string().max(255).optional(),
});

export const createBookingSchema = roundTripRefine(createBookingBaseSchema);

/** From-order: customerId optional — backend auto-creates from order contact */
export const createBookingFromOrderSchema = roundTripRefine(
  createBookingBaseSchema.partial().extend({
    customerId: optionalObjectId,
    fromDestination: z.string().min(2).max(100).trim().optional(),
    toDestination: z.string().min(2).max(100).trim().optional(),
    airline: z.string().min(2).max(100).trim().optional(),
    route: z.string().min(2).max(200).trim().optional(),
    departureDate: z.string().min(1).optional(),
  })
);

export const updateBookingSchema = roundTripRefine(
  createBookingBaseSchema.partial().omit({ orderId: true }).extend({
    customerId: optionalObjectId,
  })
);

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
  createBookingFromOrderSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  addBookingNoteSchema,
  fromOrderParamSchema,
  idParamSchema,
};
