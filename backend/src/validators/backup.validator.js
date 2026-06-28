import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const backupIdParamSchema = z.object({
  id: objectId,
});

export const restoreRequestSchema = z.object({
  confirmPhrase: z.literal('RESTORE'),
  note: z.string().max(500).optional(),
});

export default { backupIdParamSchema, restoreRequestSchema };
