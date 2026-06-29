import { z } from 'zod';
import { BOOKING_STATUSES, JOURNEY_TYPES, TRAVEL_CLASSES, APPROVAL_STATUSES, PRODUCT_CATEGORIES } from '../config/constants.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const optionalObjectId = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  objectId.optional()
);

const passengerSchema = z.object({
  title: z.string().max(10).optional(),
  fullName: z.string().min(1).max(120).trim(),
  email: z.string().email().max(120).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  passengerType: z.enum(['ADULT', 'CHILD', 'INFANT']).optional(),
  eTicketNumber: z.string().max(50).optional(),
  checkInBaggage: z.string().max(20).optional(),
  cabinBaggage: z.string().max(20).optional(),
});

const flightSegmentSchema = z.object({
  airlinePnr: z.string().max(50).optional(),
  flightNumber: z.string().max(20).optional(),
  aircraft: z.string().max(50).optional(),
  departureTime: z.string().max(10).optional(),
  arrivalTime: z.string().max(10).optional(),
  fromAirportName: z.string().max(200).optional(),
  toAirportName: z.string().max(200).optional(),
  duration: z.string().max(30).optional(),
  distance: z.string().max(30).optional(),
  stops: z.string().max(30).optional(),
});

const fareBreakdownSchema = z.object({
  baseFare: z.coerce.number().min(0).optional(),
  taxes: z.coerce.number().min(0).optional(),
  aitVat: z.coerce.number().min(0).optional(),
  extraBaggage: z.coerce.number().min(0).optional(),
  bundleCost: z.coerce.number().min(0).optional(),
  grandTotal: z.coerce.number().min(0).optional(),
});

const eTicketFields = {
  passengers: z.array(passengerSchema).max(20).optional(),
  flightSegment: flightSegmentSchema.optional(),
  fareBreakdown: fareBreakdownSchema.optional(),
};

function roundTripRefine(schema) {
  return schema.refine((d) => d.journeyType !== 'round_trip' || d.returnDate, {
    message: 'Return date required for round trip',
    path: ['returnDate'],
  });
}

const fareAmountSchema = z.object({
  bdt: z.coerce.number().min(0).optional(),
  usd: z.coerce.number().min(0).optional(),
  brl: z.coerce.number().min(0).optional(),
});

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
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
  invoiced: z.enum(['true', 'false']).optional(),
  bookingDateFrom: z.string().optional(),
  bookingDateTo: z.string().optional(),
  productCategory: z.enum(PRODUCT_CATEGORIES).optional(),
  refundPending: z.enum(['true', 'false']).optional(),
});

export const createBookingBaseSchema = z.object({
  orderId: objectId.optional(),
  customerId: objectId,
  supplierId: objectId.optional(),
  productCategory: z.enum(PRODUCT_CATEGORIES).default('air'),
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
  duePaymentAt: z.string().optional(),
  usdRateAtBooking: z.coerce.number().positive().optional(),
  fareSale: fareAmountSchema.optional(),
  farePurchase: fareAmountSchema.optional(),
  fareCosts: fareAmountSchema.optional(),
  farePaid: fareAmountSchema.optional(),
  ...eTicketFields,
});

const initialPaymentFields = {
  customerPaymentStatus: z.enum(['due', 'paid']).optional().default('due'),
  customerPaidAmountBRL: z.coerce.number().min(0).optional().default(0),
  customerPaymentAccountId: optionalObjectId,
  supplierPaymentStatus: z.enum(['due', 'paid']).optional().default('due'),
  supplierPaidAmountBRL: z.coerce.number().min(0).optional().default(0),
  supplierPaymentAccountId: optionalObjectId,
};

function validateInitialPayments(schema) {
  return schema.superRefine((data, ctx) => {
    const saleBRL = Number(data.salePriceBRL ?? data.salePrice ?? 0);
    const purchaseBRL = Number(data.purchasePriceBRL ?? data.purchasePrice ?? 0);
    const costsBRL = Number(data.directCostsBRL ?? data.directCosts ?? 0);
    const purchaseTotalBRL = purchaseBRL + costsBRL;
    const customerPaidBRL = Number(data.customerPaidAmountBRL) || 0;
    const supplierPaidBRL = Number(data.supplierPaidAmountBRL) || 0;

    if (customerPaidBRL > saleBRL + 0.001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Customer paid amount cannot exceed sale price',
        path: ['customerPaidAmountBRL'],
      });
    }
    if (customerPaidBRL > 0 && !data.customerPaymentAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Payment account is required when customer paid amount is greater than 0',
        path: ['customerPaymentAccountId'],
      });
    }
    if (supplierPaidBRL > purchaseTotalBRL + 0.001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Supplier paid amount cannot exceed purchase price plus direct costs',
        path: ['supplierPaidAmountBRL'],
      });
    }
    if (supplierPaidBRL > 0 && !data.supplierId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Supplier is required when recording a supplier payment',
        path: ['supplierId'],
      });
    }
    if (supplierPaidBRL > 0 && !data.supplierPaymentAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Payment account is required when supplier paid amount is greater than 0',
        path: ['supplierPaymentAccountId'],
      });
    }
    const customerDueBRL = Math.max(0, saleBRL - customerPaidBRL);
    if (customerDueBRL > 0.001 && !data.duePaymentAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Due payment date is required when customer owes a balance',
        path: ['duePaymentAt'],
      });
    }
  });
}

export const createBookingSchema = validateInitialPayments(
  roundTripRefine(createBookingBaseSchema.extend(initialPaymentFields))
);

/** From-order: customerId optional — backend auto-creates from order contact */
export const createBookingFromOrderSchema = validateInitialPayments(
  roundTripRefine(
    createBookingBaseSchema.partial().extend({
      customerId: optionalObjectId,
      fromDestination: z.string().min(2).max(100).trim().optional(),
      toDestination: z.string().min(2).max(100).trim().optional(),
      airline: z.string().min(2).max(100).trim().optional(),
      route: z.string().min(2).max(200).trim().optional(),
      departureDate: z.string().min(1).optional(),
      ...initialPaymentFields,
    })
  )
);

export const updateBookingSchema = roundTripRefine(
  createBookingBaseSchema.partial().omit({ orderId: true }).extend({
    customerId: optionalObjectId,
    purchasePriceBRL: z.coerce.number().min(0).optional(),
    salePriceBRL: z.coerce.number().min(0).optional(),
    directCostsBRL: z.coerce.number().min(0).optional(),
    bdtRate: z.coerce.number().positive().optional(),
    duePaymentAt: z.string().optional(),
  }).superRefine((data, ctx) => {
    const saleBRL = data.salePriceBRL ?? data.salePrice;
    if (saleBRL == null) return;
    const customerPaidBRL = Number(data.customerPaidAmountBRL) || 0;
    const customerDueBRL = Math.max(0, Number(saleBRL) - customerPaidBRL);
    if (customerDueBRL > 0.001 && !data.duePaymentAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Due payment date is required when customer owes a balance',
        path: ['duePaymentAt'],
      });
    }
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

export const scheduleChangeSchema = z.object({
  departureDate: z.string().optional(),
  route: z.string().max(200).optional(),
  fromDestination: z.string().max(100).optional(),
  toDestination: z.string().max(100).optional(),
  airline: z.string().max(100).optional(),
  pnr: z.string().max(50).optional(),
  flightSegment: flightSegmentSchema.optional(),
  note: z.string().max(1000).optional(),
  notifyCustomer: z.boolean().optional().default(true),
});

export const voidBookingSchema = z.object({
  reason: z.string().max(1000).optional(),
  voidPayments: z.boolean().optional().default(false),
});

export const refundBookingSchema = z.object({
  reason: z.string().max(1000).optional(),
  penalty: z.coerce.number().min(0).optional().default(0),
  refundAmount: z.coerce.number().min(0).optional(),
  accountId: objectId.optional(),
  paymentDate: z.string().optional(),
});

export const refundRequestSchema = z.object({
  reason: z.string().max(1000).optional(),
  penalty: z.coerce.number().min(0).optional().default(0),
});

export const reissueBookingSchema = z.object({
  reason: z.string().max(1000).optional(),
  journeyType: z.enum(JOURNEY_TYPES).optional(),
  fromDestination: z.string().min(2).max(100).trim().optional(),
  toDestination: z.string().min(2).max(100).trim().optional(),
  travelClass: z.enum(TRAVEL_CLASSES).optional(),
  airline: z.string().min(2).max(100).trim().optional(),
  route: z.string().min(2).max(200).trim().optional(),
  sector: z.string().max(100).optional(),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  passengerCount: z.coerce.number().int().min(1).max(20).optional(),
  pnr: z.string().max(50).optional(),
  ticketNumber: z.string().max(50).optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  salePrice: z.coerce.number().min(0).optional(),
  directCosts: z.coerce.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

const bulkImportRowSchema = z.object({
  row: z.coerce.number().optional(),
  fileName: z.string().optional(),
  customerId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  customerPhone: z.string().min(10).optional(),
  airline: z.string().min(2),
  route: z.string().min(2),
  sector: z.string().optional(),
  fromDestination: z.string().optional(),
  toDestination: z.string().optional(),
  departureDate: z.string().min(1),
  pnr: z.string().optional(),
  ticketNumber: z.string().optional(),
  passengerCount: z.coerce.number().int().min(1).max(20).optional(),
  passengers: z.array(z.object({
    title: z.string().optional(),
    fullName: z.string().optional(),
    passengerType: z.string().optional(),
    eTicketNumber: z.string().optional(),
  })).optional(),
  purchasePriceBRL: z.coerce.number().min(0).optional(),
  salePriceBRL: z.coerce.number().min(0).optional(),
  bdtRate: z.coerce.number().positive().optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(['draft', 'confirmed', 'ticket_issued']).optional(),
  flightSegment: z.record(z.any()).optional(),
}).refine((row) => row.customerId || row.customerPhone, {
  message: 'customerId or customerPhone required',
});

export const bulkImportExecuteSchema = z.object({
  rows: z.array(bulkImportRowSchema).min(1).max(100),
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
  voidBookingSchema,
  refundBookingSchema,
  refundRequestSchema,
  reissueBookingSchema,
  bulkImportExecuteSchema,
};
