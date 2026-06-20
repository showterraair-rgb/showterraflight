import { hasPermission } from '../config/permissions.js';
import ApiError from '../utils/ApiError.js';

/**
 * Require at least one of the given permissions.
 */
export function authorize(...requiredPermissions) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    const allowed = requiredPermissions.some((permission) =>
      hasPermission(req.user.role, permission, req.user.permissions)
    );

    if (!allowed) {
      return next(ApiError.forbidden('You do not have permission for this action'));
    }

    next();
  };
}

export default authorize;
