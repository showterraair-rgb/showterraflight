import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customersApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { usePermission } from '../hooks/usePermission';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().min(10, 'Phone required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  nid: z.string().optional(),
  passportNo: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

const empty = { name: '', phone: '', email: '', address: '', nid: '', passportNo: '', notes: '', tags: '' };

export default function CustomersPage() {
  const { can } = usePermission();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
      const { data } = await customersApi.list({ page, limit: 20, search: search || undefined });
      setItems(data.data);
      setPagination(data.pagination);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

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
      email: row.email || '',
      address: row.address || '',
      nid: row.nid || '',
      passportNo: row.passportNo || '',
      notes: row.notes || '',
      tags: (row.tags || []).join(', '),
    });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (form) => {
    setError('');
    const payload = {
      ...form,
      email: form.email || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
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

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email', render: (r) => r.email || '—' },
    { key: 'totalDue', label: 'Due', render: (r) => `৳${(r.totalDue || 0).toLocaleString()}` },
    {
      key: 'actions',
      label: '',
      render: (r) =>
        can('customers:update') ? (
          <button type="button" onClick={() => openEdit(r)} className="text-sm text-brand-600 hover:underline">
            Edit
          </button>
        ) : null,
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
        <div className="border-b border-slate-200 p-4">
          <input
            type="search"
            placeholder="Search name, phone, email..."
            className="input-field max-w-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'} wide>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input className="input-field" {...register('name')} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone *</label>
              <input className="input-field" {...register('phone')} />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input className="input-field" {...register('email')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">NID</label>
              <input className="input-field" {...register('nid')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Passport No</label>
              <input className="input-field" {...register('passportNo')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tags (comma separated)</label>
              <input className="input-field" {...register('tags')} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Address</label>
              <input className="input-field" {...register('address')} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea rows={3} className="input-field" {...register('notes')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
