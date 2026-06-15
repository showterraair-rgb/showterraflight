import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import RowActions from '../components/common/RowActions';
import StatusBadge from '../components/common/StatusBadge';
import { usePermission } from '../hooks/usePermission';
import { formatDateTime } from '../utils/date';
import { USER_ROLES, USER_ROLE_LABELS } from '../utils/constants';

const passwordSchema = z
  .string()
  .min(10, 'At least 10 characters')
  .regex(/[A-Z]/, 'Needs uppercase letter')
  .regex(/[a-z]/, 'Needs lowercase letter')
  .regex(/[0-9]/, 'Needs a number');

function buildSchema(isEdit) {
  return z.object({
    name: z.string().min(2, 'Name required'),
    email: z.string().email('Valid email required'),
    phone: z.string().optional().or(z.literal('')),
    role: z.enum(['admin', 'accountant', 'executive', 'demo']),
    password: isEdit ? passwordSchema.optional().or(z.literal('')) : passwordSchema,
    isActive: z.boolean().optional(),
  });
}

const empty = {
  name: '',
  email: '',
  phone: '',
  role: 'executive',
  password: '',
  isActive: true,
};

function UserFormModal({ editing, open, onClose, onSaved }) {
  const schema = useMemo(() => buildSchema(Boolean(editing)), [editing]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: empty,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editing) {
      reset({
        name: editing.name,
        email: editing.email,
        phone: editing.phone || '',
        role: editing.role,
        password: '',
        isActive: editing.isActive,
      });
    } else {
      reset(empty);
    }
  }, [open, editing, reset]);

  const onSubmit = async (form) => {
    setError('');
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
      };
      if (form.password) payload.password = form.password;
      if (editing) {
        payload.isActive = form.isActive;
        await usersApi.update(editing.id, payload);
      } else {
        await usersApi.create(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit User' : 'New User'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div>
          <label className="mb-1 block text-sm font-medium">Name *</label>
          <input className="input-field" {...register('name')} />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email *</label>
          <input type="email" className="input-field" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <input className="input-field" {...register('phone')} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Role *</label>
          <select className="input-field" {...register('role')}>
            {USER_ROLES.map((r) => <option key={r} value={r}>{USER_ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {editing ? 'New Password (leave blank to keep current)' : 'Password *'}
          </label>
          <input type="password" autoComplete="new-password" className="input-field" {...register('password')} />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          <p className="mt-1 text-xs text-slate-500">Min 10 chars with upper, lower, and a number</p>
        </div>

        {editing && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded border-slate-300" {...register('isActive')} />
            Active account
          </label>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {editing ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function UsersPage() {
  const { can, user: currentUser } = usePermission();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', role: '', isActive: '' });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await usersApi.list(params);
      setItems(data.data);
      setPagination(data.pagination);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setModalOpen(true);
  };

  const handleDeactivate = async (row) => {
    if (!window.confirm(`Deactivate user "${row.name}"? They will no longer be able to log in.`)) return;
    try {
      await usersApi.deactivate(row.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Deactivate failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    { key: 'role', label: 'Role', render: (r) => USER_ROLE_LABELS[r.role] || r.role },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => (
        <StatusBadge
          status={r.isActive ? 'success' : 'cancelled'}
          label={r.isActive ? 'Active' : 'Inactive'}
        />
      ),
    },
    { key: 'lastLoginAt', label: 'Last Login', render: (r) => formatDateTime(r.lastLoginAt) },
    {
      key: 'actions',
      label: 'Actions',
      stickyRight: true,
      cellClassName: '',
      render: (r) => (
        <RowActions
          items={[
            can('users:manage') && { type: 'button', label: 'Edit', onClick: () => openEdit(r), variant: 'muted' },
            can('users:manage') && r.isActive && r.id !== currentUser?.id && {
              type: 'button',
              label: 'Deactivate',
              onClick: () => handleDeactivate(r),
              variant: 'danger',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Users</h2>
          <p className="text-sm text-slate-500">Manage staff accounts, roles, and access to the admin panel</p>
        </div>
        {can('users:manage') && (
          <button type="button" onClick={openCreate} className="btn-primary">New User</button>
        )}
      </div>

      <div className="card p-0">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <input
            type="search"
            placeholder="Search name or email..."
            className="input-field max-w-xs"
            value={filters.search}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
          />
          <select
            className="input-field w-auto"
            value={filters.role}
            onChange={(e) => { setFilters((f) => ({ ...f, role: e.target.value })); setPage(1); }}
          >
            <option value="">All Roles</option>
            {USER_ROLES.map((r) => <option key={r} value={r}>{USER_ROLE_LABELS[r]}</option>)}
          </select>
          <select
            className="input-field w-auto"
            value={filters.isActive}
            onChange={(e) => { setFilters((f) => ({ ...f, isActive: e.target.value })); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <DataTable columns={columns} data={items} loading={loading} emptyMessage="No users found" />
        {pagination && (
          <div className="border-t border-slate-200 p-4">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>

      <UserFormModal
        key={editing?.id || 'new'}
        editing={editing}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
