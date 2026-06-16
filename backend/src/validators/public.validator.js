import { z } from 'zod';
import { JOURNEY_TYPES, TRAVEL_CLASSES } from '../config/constants.js';

export const bookingRequestSchema = z
  .object({
    customerName: z.string().min(2, 'Name is required').max(100).trim(),
    customerPhone: z.string().min(10, 'Valid phone number required').max(20).trim(),
    customerEmail: z.string().email('Invalid email').trim().toLowerCase().optional().or(z.literal('')),
    journeyType: z.enum(JOURNEY_TYPES),
    fromDestination: z.string().min(2, 'From destination is required').max(100).trim(),
    toDestination: z.string().min(2, 'To destination is required').max(100).trim(),
    journeyDate: z.string().min(1, 'Journey date is required'),
    returnDate: z.string().optional().or(z.literal('')),
    passengerCount: z.coerce.number().int().min(1).max(20).default(1),
    travelClass: z.enum(TRAVEL_CLASSES).default('economy'),
    preferredCurrency: z.enum(['BDT', 'BRL']).optional().default('BDT'),
    requestNotes: z.string().max(2000).optional().default(''),
  })
  .refine(
    (data) => {
      if (data.journeyType === 'round_trip' && !data.returnDate) {
        return false;
      }
      return true;
    },
    { message: 'Return date is required for round trip', path: ['returnDate'] }
  );

export default bookingRequestSchema;
