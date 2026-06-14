import { z } from 'zod';
import { REMINDER_TYPES, REMINDER_STATUSES } from '../config/constants.js';

export const listReminderQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  status: z.enum(REMINDER_STATUSES).optional(),
  type: z.enum(REMINDER_TYPES).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const createReminderSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().max(2000).optional(),
  dueDate: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignedToId: z.string().optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  bookingId: z.string().optional(),
});

export const updateReminderStatusSchema = z.object({
  status: z.enum(REMINDER_STATUSES),
});

export default { listReminderQuerySchema, createReminderSchema, updateReminderStatusSchema };
