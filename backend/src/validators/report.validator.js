import { z } from 'zod';

export const reportQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.string().optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  accountId: z.string().optional(),
  year: z.coerce.number().optional(),
});

export default { reportQuerySchema };
