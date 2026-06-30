import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customersApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import RowActions from '../components/common/RowActions';
import { usePermission } from '../hooks/usePermission';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().min(10, 'Phone required'),
  whatsapp: z.string().min(10, 'WhatsApp number must be at least 10 digits').optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
});

const empty = { name: '', phone: '', whatsapp: '', email: '' };

export default function CustomersPage() {
  const { can } = usePermission();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: empty,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await customersApi.list({
        page,
        limit: 20,
        search: search || undefined,
        includeArchived: showArchived ? 'true' : undefined,
      });
      setItems(data.data);
      setPagination(data.pagination);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, showArchived]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    reset(empty);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      name: row.name,
      phone: row.phone,
      whatsapp: row.whatsapp || '',
      email: row.email || '',
    });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (form) => {
    setError('');
    const payload = {
      name: form.name,
      phone: form.phone,
      whatsapp: form.whatsapp || undefined,
      email: form.email || undefined,
    };
    try {
      if (editing) {
        await customersApi.update(editing.id, payload);
      } else {
        await customersApi.create(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (row) => {
    const msg = row.totalDue > 0 || row.totalPaid > 0
      ? `Remove customer "${row.name}"? Customers with bookings or payments will be archived; others will be deleted permanently.`
      : `Delete customer "${row.name}" permanently?`;
    if (!window.confirm(msg)) return;
    try {
      const { data } = await customersApi.delete(row.id);
      alert(data.message || 'Customer removed');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => (
      <span className="font-medium text-slate-900">
        <Link to={`/customers/${r.id}/account`} className="hover:text-brand-600">{r.name}</Link>
        {r.isActive === false && (
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">Archived</span>
        )}
      </span>
    ) },
    { key: 'phone', label: 'Phone' },
    { key: 'whatsapp', label: 'WhatsApp', render: (r) => r.whatsapp || '—' },
    { key: 'email', label: 'Email', render: (r) => r.email || '—' },
    { key: 'totalDue', label: 'Due', render: (r) => `৳${(r.totalDue || 0).toLocaleString()}` },
    {
      key: 'actions',
      label: 'Actions',
      stickyRight: true,
      cellClassName: '',
      render: (r) => (
        <RowActions
          items={[
            can('customers:view') && { type: 'link', label: 'Account', to: `/customers/${r.id}/account` },
            can('customers:update') && { type: 'button', label: 'Edit', onClick: () => openEdit(r), variant: 'muted' },
            can('customers:delete') && { type: 'button', label: 'Delete', onClick: () => handleDelete(r), variant: 'danger' },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customers</h2>
          <p className="text-sm text-slate-500">Manage customer profiles and contact details</p>
        </div>
        {can('customers:create') && (
          <button type="button" onClick={openCreate} className="btn-primary">Add Customer</button>
        )}
      </div>

      <div className="card p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <input
            type="search"
            placeholder="Search name, phone, email..."
            className="input-field max-w-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => { setShowArchived(e.target.checked); setPage(1); }}
            />
            Show archived
          </label>
        </div>
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyTitle="No customers found"
          emptyDescription="Add a customer or adjust your search."
        />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Customer' : 'Add Customer'}
        wide
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" form="customer-form" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      >
        <form id="customer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input className="input-field" {...register('name')} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone *</label>
              <input className="input-field" placeholder="e.g. 01674533303" {...register('phone')} />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
              <p className="mt-1 text-xs text-slate-500">Bangladesh mobile (01XXXXXXXXX). Used for SMS.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">WhatsApp Number</label>
              <input className="input-field" placeholder="e.g. 01674533303 (optional)" {...register('whatsapp')} />
              {errors.whatsapp && <p className="mt-1 text-xs text-red-600">{errors.whatsapp.message}</p>}
              <p className="mt-1 text-xs text-slate-500">Leave blank to use phone number for WhatsApp.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input type="email" className="input-field" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
