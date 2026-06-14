import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';

export function usePermission(requiredPermissions = []) {
  const { user } = useAuth();

  const can = (permission) => hasPermission(user?.permissions, user?.role, [permission]);

  const canAny = requiredPermissions.length
    ? hasPermission(user?.permissions, user?.role, requiredPermissions)
    : true;

  return { can, canAny, user };
}

export default usePermission;
