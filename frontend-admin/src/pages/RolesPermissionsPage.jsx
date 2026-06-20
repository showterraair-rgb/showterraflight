import { useCallback, useEffect, useState } from 'react';
import { rolesApi } from '../services/roles.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePermission } from '../hooks/usePermission';
import { USER_ROLE_LABELS } from '../utils/constants';

export default function RolesPermissionsPage() {
  const { can } = usePermission();
  const [loading, setLoading] = useState(true);
  const [matrix, setMatrix] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [draftPerms, setDraftPerms] = useState([]);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await rolesApi.getMatrix();
      setMatrix(data.data);
      const first = data.data?.roles?.[0];
      if (first && !selectedRole) {
        setSelectedRole(first.name);
        setDraftPerms(first.permissions || []);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!matrix || !selectedRole) return;
    const role = matrix.roles.find((r) => r.name === selectedRole);
    setDraftPerms(role?.permissions || []);
  }, [selectedRole, matrix]);

  const togglePerm = (perm) => {
    if (selectedRole === 'admin') return;
    setDraftPerms((prev) => (
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    ));
  };

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      await rolesApi.update(selectedRole, { permissions: draftPerms });
      setMsg('Role permissions saved');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !matrix) return <LoadingSpinner className="py-20" />;

  const editable = can('roles:manage');
  const roleMeta = matrix?.roles?.find((r) => r.name === selectedRole);
  const isSuperAdmin = selectedRole === 'admin';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Roles & Permissions</h2>
        <p className="text-sm text-slate-500">
          Configure module and action access per employee category. Changes apply on next login (or immediately for new requests).
        </p>
      </div>

      {msg && <p className="text-sm text-brand-700">{msg}</p>}

      <div className="card flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="text-slate-600">Role</span>
          <select
            className="input mt-1 min-w-[220px]"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            {(matrix?.roles || []).map((r) => (
              <option key={r.name} value={r.name}>{USER_ROLE_LABELS[r.name] || r.label || r.name}</option>
            ))}
          </select>
        </label>
        {roleMeta?.isSystem && (
          <p className="text-xs text-amber-700">Super Admin has full access and cannot be edited here.</p>
        )}
        {editable && !isSuperAdmin && (
          <button type="button" onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save permissions'}
          </button>
        )}
      </div>

      {isSuperAdmin ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Super Admin role uses wildcard access to all modules and actions.
        </div>
      ) : (
        <div className="space-y-4">
          {(matrix?.modules || []).map((mod) => (
            <div key={mod.key} className="card">
              <h3 className="text-sm font-semibold text-slate-900">{mod.label}</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {mod.permissions.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={draftPerms.includes(perm)}
                      disabled={!editable}
                      onChange={() => togglePerm(perm)}
                    />
                    <span title={matrix.permissionLabels?.[perm] || perm}>{perm}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
