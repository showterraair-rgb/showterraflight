import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suppliersApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { usePermission } from '../hooks/usePermission';
import { SUPPLIER_TYPES } from '../utils/constants';

const schema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  type: z.enum(['agent', 'supplier', 'airline_office', 'other']),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

const empty = { name: '', company: '', phone: '', email: '', address: '', contactPerson: '', type: 'agent', paymentTerms: '', notes: '' };

export default function SuppliersPage() {
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
      const { data } = await suppliersApi.list({ page, limit: 20, search: search || undefined });
      setItems(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); reset(empty); setError(''); setModalOpen(true); };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      name: row.name,
      company: row.company || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
      contactPerson: row.contactPerson || '',
      type: row.type || 'agent',
      paymentTerms: row.paymentTerms || '',
      notes: row.notes || '',
    });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (form) => {
    setError('');
    try {
      const payload = { ...form, email: form.email || undefined };
      if (editing) await suppliersApi.update(editing.id, payload);
      else await suppliersApi.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete supplier "${row.name}"? Linked bookings or payments will be archived instead.`)) return;
    try {
      const { data } = await suppliersApi.delete(row.id);
      alert(data.message || 'Supplier removed');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'company', label: 'Company', render: (r) => r.company || '—' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    { key: 'type', label: 'Type', render: (r) => <span className="capitalize">{r.type?.replace('_', ' ')}</span> },
    { key: 'paymentTerms', label: 'Payment Terms', render: (r) => r.paymentTerms || '—' },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex gap-2">
          {can('suppliers:update') && (
            <button type="button" onClick={() => openEdit(r)} className="text-sm text-brand-600 hover:underline">Edit</button>
          )}
          {can('suppliers:delete') && (
            <button type="button" onClick={() => handleDelete(r)} className="text-sm text-red-600 hover:underline">Delete</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Suppliers & Agents</h2>
          <p className="text-sm text-slate-500">Manage ticket suppliers and airline agents</p>
        </div>
        {can('suppliers:create') && (
          <button type="button" onClick={openCreate} className="btn-primary">Add Supplier</button>
        )}
      </div>

      <div className="card p-0">
        <div className="border-b border-slate-200 p-4">
          <input type="search" placeholder="Search..." className="input-field max-w-sm" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <DataTable columns={columns} data={items} loading={loading} emptyTitle="No suppliers" emptyDescription="Add a supplier to get started." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} wide>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input className="input-field" {...register('name')} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Company</label>
              <input className="input-field" {...register('company')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input className="input-field" {...register('phone')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input className="input-field" {...register('email')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Contact Person</label>
              <input className="input-field" {...register('contactPerson')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select className="input-field" {...register('type')}>
                {SUPPLIER_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Payment Terms</label>
              <input className="input-field" placeholder="e.g. Pay within 7 days" {...register('paymentTerms')} />
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
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
