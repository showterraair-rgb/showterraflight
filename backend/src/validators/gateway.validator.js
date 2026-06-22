import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const optionalObjectId = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  objectId.optional()
);

export const initiateSslcommerzSchema = z.object({
  customerId: objectId,
  amount: z.coerce.number().min(0.01).optional(),
  bookingId: optionalObjectId,
  paymentRequestId: optionalObjectId,
});

export const initiateGatewaySchema = initiateSslcommerzSchema.extend({
  gateway: z.enum(['sslcommerz', 'bkash']).optional().default('sslcommerz'),
});

export const initiateBkashSchema = initiateSslcommerzSchema;

export const gatewayTranParamSchema = z.object({
  tran_id: z.string().min(3),
});

export const updateGatewaySettingsSchema = z.object({
  gatewaySettings: z.object({
    sslcommerz: z.object({
      enabled: z.boolean().optional(),
      isSandbox: z.boolean().optional(),
      storeId: z.string().max(100).optional(),
      storePassword: z.string().max(200).optional(),
      settlementAccountId: optionalObjectId,
    }).optional(),
    bkash: z.object({
      enabled: z.boolean().optional(),
      isSandbox: z.boolean().optional(),
      appKey: z.string().max(200).optional(),
      appSecret: z.string().max(200).optional(),
      username: z.string().max(100).optional(),
      password: z.string().max(200).optional(),
      settlementAccountId: optionalObjectId,
    }).optional(),
  }),
});

export default {
  initiateSslcommerzSchema,
  initiateBkashSchema,
  initiateGatewaySchema,
  gatewayTranParamSchema,
  updateGatewaySettingsSchema,
};
