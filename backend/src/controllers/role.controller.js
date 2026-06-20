import * as roleService from '../services/role.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listRoles = asyncHandler(async (_req, res) => {
  const data = await roleService.listRoles();
  res.json({ success: true, data });
});

export const getPermissionMatrix = asyncHandler(async (_req, res) => {
  const data = await roleService.getPermissionMatrix();
  res.json({ success: true, data });
});

export const updateRolePermissions = asyncHandler(async (req, res) => {
  const data = await roleService.updateRolePermissions(
    req.params.roleName,
    req.body,
    req.user.id,
    req
  );
  res.json({ success: true, data, message: 'Role permissions updated' });
});

export default {
  listRoles,
  getPermissionMatrix,
  updateRolePermissions,
};
