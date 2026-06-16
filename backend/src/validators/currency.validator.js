import { z } from 'zod';

export const updateCurrencySchema = z.object({
  BRL: z.object({
    rateToBase: z.coerce.number().positive('Rate must be greater than zero'),
  }),
});

export default { updateCurrencySchema };
