import { z } from 'zod';
import {
  AGENT_TYPES,
  AGENT_BOOKING_STATUSES,
  AGENT_BOOKING_TYPES,
  AGENT_TRAVEL_CLASSES,
  AGENT_PASSENGER_TITLES,
  AGENT_MEAL_PREFERENCES,
  AGENT_SEAT_PREFERENCES,
  AGENT_TRANSACTION_TYPES,
} from '../config/agentConstants.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');

const passwordBase = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128)
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number');
export const agentRegisterSchema = z.object({
  companyName: z.string().min(2).max(150).trim(),
  contactPerson: z.string().min(2).max(100).trim(),
  email: z.string().email().trim().toLowerCase(),
  phone: z.string().min(10).max(20).trim(),
  whatsapp: z.string().min(10).max(20).trim().optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  password: passwordBase,
});
export const agentLoginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
});

export const agentForgotPasswordSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
});

export const agentResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordBase,
});

export const updateAgentProfileSchema = z.object({
  companyName: z.string().min(2).max(150).optional(),
  contactPerson: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
  whatsapp: z.string().min(10).max(20).trim().optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export const changeAgentPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordBase,
});

const passengerSchema = z.object({
  title: z.enum(AGENT_PASSENGER_TITLES),
  firstName: z.string().min(1).max(80).trim(),
  lastName: z.string().min(1).max(80).trim(),
  dob: z.string().optional(),
  passportNumber: z.string().min(1).max(50).trim(),
  passportExpiry: z.string().optional(),
  nationality: z.string().max(80).optional(),
});

export const createAgentBookingSchema = z.object({
  flightNumber: z.string().min(1).max(20).trim(),
  airline: z.string().min(2).max(100).trim(),
  fromCity: z.string().min(2).max(100).trim(),
  toCity: z.string().min(2).max(100).trim(),
  departureDate: z.string().min(1),
  departureTime: z.string().optional(),
  arrivalDate: z.string().optional(),
  arrivalTime: z.string().optional(),
  travelClass: z.enum(AGENT_TRAVEL_CLASSES).default('economy'),
  pnr: z.string().max(50).optional(),
  passengers: z.array(passengerSchema).min(1),
  baseFareBRL: z.coerce.number().min(0).optional(),
  taxBRL: z.coerce.number().min(0).optional(),
  markupBRL: z.coerce.number().min(0).optional(),
  bdtRate: z.coerce.number().positive('BDT rate must be greater than 0'),
  baseFare: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
  agentMarkup: z.coerce.number().min(0).optional(),
  bookingType: z.enum(AGENT_BOOKING_TYPES).default('standard'),
  specialRequests: z.string().max(2000).optional(),
  baggageAllowance: z.string().max(200).optional(),
  mealPreference: z.enum(AGENT_MEAL_PREFERENCES).optional(),
  seatPreference: z.enum(AGENT_SEAT_PREFERENCES).optional(),
  ticketIssued: z.coerce.boolean().optional(),
}).superRefine((data, ctx) => {
  const base = data.baseFareBRL ?? data.baseFare;
  if (base == null || Number(base) <= 0) {
    ctx.addIssue({ code: 'custom', path: ['baseFareBRL'], message: 'Base fare must be a positive number' });
  }
});

export const listAgentBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.enum(AGENT_BOOKING_STATUSES).optional(),
  airline: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  agentId: objectId.optional(),
});

export const reportQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  year: z.coerce.number().int().optional(),
});

export const createAgentSchema = z.object({
  companyName: z.string().min(2).max(150).trim(),
  contactPerson: z.string().min(2).max(100).trim(),
  email: z.string().email().trim().toLowerCase(),
  phone: z.string().min(10).max(20).trim(),
  whatsapp: z.string().min(10).max(20).trim().optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  agentType: z.enum(AGENT_TYPES).default('regular'),
  creditLimit: z.coerce.number().min(0).optional(),
  initialBalance: z.coerce.number().optional(),
  password: passwordBase,
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export const updateAgentSchema = createAgentSchema.partial().extend({
  password: passwordBase.optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(AGENT_BOOKING_STATUSES),
  adminNotes: z.string().max(2000).optional(),
});

export const addBookingNoteSchema = z.object({
  note: z.string().min(1).max(2000),
});

export const addTransactionSchema = z.object({
  type: z.enum(AGENT_TRANSACTION_TYPES),
  amount: z.coerce.number().positive(),
  description: z.string().min(1).max(500).trim(),
  bookingRef: z.string().optional(),
});

export const listAgentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  agentType: z.enum(AGENT_TYPES).optional(),
});

export const idParamSchema = z.object({ id: objectId });

export const agentIdParamSchema = z.object({ agentId: objectId });

export default {
  agentLoginSchema,
  agentForgotPasswordSchema,
  agentResetPasswordSchema,
  updateAgentProfileSchema,
  changeAgentPasswordSchema,
  createAgentBookingSchema,
  listAgentBookingsQuerySchema,
  reportQuerySchema,
  createAgentSchema,
  updateAgentSchema,
  updateBookingStatusSchema,
  addBookingNoteSchema,
  addTransactionSchema,
  listAgentsQuerySchema,
  idParamSchema,
  agentIdParamSchema,
};
