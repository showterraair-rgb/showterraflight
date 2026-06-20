import { Router } from 'express';
import * as roleController from '../controllers/role.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import { roleNameParamSchema, updateRolePermissionsSchema } from '../validators/role.validator.js';

const router = Router();

router.get('/', authorize('users:view', 'roles:manage'), roleController.listRoles);
router.get('/matrix', authorize('roles:manage'), roleController.getPermissionMatrix);
router.put(
  '/:roleName',
  authorize('roles:manage'),
  validate(roleNameParamSchema, 'params'),
  validate(updateRolePermissionsSchema),
  roleController.updateRolePermissions
);

export default router;
