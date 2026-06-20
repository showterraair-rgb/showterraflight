import Role from '../models/Role.js';
import ApiError from '../utils/ApiError.js';
import {
  PERMISSIONS,
  PERMISSION_MODULES,
  ROLE_PERMISSIONS,
} from '../config/permissions.js';
import { ROLE_LABELS, ROLES } from '../config/constants.js';
import { logAudit } from './audit.service.js';

function formatRole(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    label: doc.label || ROLE_LABELS[doc.name] || doc.name,
    description: doc.description || '',
    permissions: doc.permissions || ROLE_PERMISSIONS[doc.name] || [],
    isActive: Boolean(doc.isActive),
    isSystem: doc.name === ROLES.ADMIN,
    updatedAt: doc.updatedAt,
  };
}

export async function listRoles() {
  const items = await Role.find({ isActive: true }).sort({ name: 1 }).lean();
  if (!items.length) {
    return Object.values(ROLES).map((name) => ({
      id: null,
      name,
      label: ROLE_LABELS[name] || name,
      description: '',
      permissions: ROLE_PERMISSIONS[name] || [],
      isActive: true,
      isSystem: name === ROLES.ADMIN,
    }));
  }
  return items.map(formatRole);
}

export async function getPermissionMatrix() {
  return {
    modules: PERMISSION_MODULES,
    permissionLabels: PERMISSIONS,
    roles: await listRoles(),
  };
}

export async function updateRolePermissions(roleName, data, userId, req) {
  if (roleName === ROLES.ADMIN) {
    throw ApiError.badRequest('Super Admin permissions cannot be modified');
  }

  if (!Object.values(ROLES).includes(roleName)) {
    throw ApiError.notFound('Role not found');
  }

  const permissions = Array.isArray(data.permissions) ? data.permissions : [];
  const invalid = permissions.filter((p) => p !== '*' && !PERMISSIONS[p]);
  if (invalid.length) {
    throw ApiError.badRequest(`Unknown permissions: ${invalid.join(', ')}`);
  }

  const before = await Role.findOne({ name: roleName }).lean();

  const doc = await Role.findOneAndUpdate(
    { name: roleName },
    {
      $set: {
        name: roleName,
        label: data.label || ROLE_LABELS[roleName] || roleName,
        description: data.description ?? '',
        permissions,
        isActive: true,
      },
      $setOnInsert: { name: roleName },
    },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  await logAudit({
    action: 'update',
    module: 'roles',
    entityType: 'Role',
    entityId: doc._id,
    description: `Updated permissions for role ${roleName}`,
    userId,
    req,
    changes: {
      before: before?.permissions || ROLE_PERMISSIONS[roleName],
      after: permissions,
    },
  });

  return formatRole(doc);
}

export default {
  listRoles,
  getPermissionMatrix,
  updateRolePermissions,
};
