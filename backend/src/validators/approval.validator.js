import { z } from 'zod';
import { APPROVAL_STATUSES } from '../config/constants.js';

export const updateApprovalSchema = z.object({
  approvalStatus: z.enum(APPROVAL_STATUSES),
  note: z.string().max(1000).optional(),
});

export const publicPassportUploadSchema = z.object({
  orderNumber: z.string().min(5).max(50).trim(),
});

export default { updateApprovalSchema, publicPassportUploadSchema };
