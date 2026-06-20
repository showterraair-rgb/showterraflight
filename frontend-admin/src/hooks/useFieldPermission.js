import { useAuth } from '../context/AuthContext';
import {
  resolveFieldGroupMode,
  isFieldHidden,
  isFieldReadOnly,
} from '../utils/fieldPermissions';

export function useFieldPermission(groupKey) {
  const { user } = useAuth();
  const fieldAccess = user?.fieldAccess || {};
  const mode = resolveFieldGroupMode(fieldAccess, groupKey);

  return {
    mode,
    hidden: isFieldHidden(fieldAccess, groupKey),
    readOnly: isFieldReadOnly(fieldAccess, groupKey),
    editable: mode === 'editable',
  };
}

export default useFieldPermission;
