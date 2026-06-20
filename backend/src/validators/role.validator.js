import { z } from 'zod';
import { ROLES } from '../config/constants.js';

export const roleNameParamSchema = z.object({
  roleName: z.enum(Object.values(ROLES)),
});

export const updateRolePermissionsSchema = z.object({
  label: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().max(80)).min(0),
});

export default {
  roleNameParamSchema,
  updateRolePermissionsSchema,
};
