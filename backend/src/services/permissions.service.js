import Role from '../models/Role.js';
import {
  ROLE_PERMISSIONS,
  mergePermissionOverrides,
} from '../config/permissions.js';
import { buildFieldAccessMap } from '../config/fieldPermissions.js';
import { ROLE_LABELS } from '../config/constants.js';

/**
 * Resolve effective permissions for a user document.
 * Prefers DB Role.permissions when non-empty; falls back to static ROLE_PERMISSIONS.
 */
export async function resolveUserPermissions(user) {
  let base = ROLE_PERMISSIONS[user.role] || [];

  const roleDoc = await Role.findOne({ name: user.role, isActive: true }).lean();
  if (roleDoc?.permissions?.length) {
    base = roleDoc.permissions;
  }

  const overrides = user.permissionOverrides || {};
  const permissions = mergePermissionOverrides(base, overrides);

  return permissions;
}

export async function resolveUserAccess(user) {
  const permissions = await resolveUserPermissions(user);
  const fieldAccess = buildFieldAccessMap(permissions);

  return {
    permissions,
    fieldAccess,
    roleLabel: ROLE_LABELS[user.role] || user.role,
  };
}

export default {
  resolveUserPermissions,
  resolveUserAccess,
};
