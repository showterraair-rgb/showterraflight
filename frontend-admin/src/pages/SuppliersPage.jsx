import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suppliersApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import RowActions from '../components/common/RowActions';
import { usePermission } from '../hooks/usePermission';
import { SUPPLIER_TYPES } from '../utils/constants';
import { BD_PHONE_HELP, BD_PHONE_PLACEHOLDER, formatPhoneOnBlur, isValidBdMobile } from '../utils/phone';
import PrimaryBtn from '../components/ui/PrimaryBtn';
import SummaryStatCard from '../components/common/SummaryStatCard';
import { C, fontDisplay, fontSans } from '../theme/tokens';
import { Plus } from 'lucide-react';

const schema = z.object({
  company: z.string().min(2, 'Company name required'),
  phone: z.string().optional().or(z.literal('')).refine((v) => !v || isValidBdMobile(v), { message: BD_PHONE_HELP }),
  whatsapp: z.string().optional().or(z.literal('')).refine((v) => !v || isValidBdMobile(v), { message: BD_PHONE_HELP }),
  email: z.string().email().optional().or(z.literal('')),
  type: z.enum(['agent', 'supplier', 'airline_office', 'other']),
  notes: z.string().optional(),
});

const empty = { company: '', phone: '', whatsapp: '', email: '', type: 'supplier', notes: '' };

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

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
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
      company: row.company || row.name || '',
      phone: row.phone || '',
      whatsapp: row.whatsapp || '',
      email: row.email || '',
      type: row.type || 'supplier',
      notes: row.notes || '',
    });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (form) => {
    setError('');
    try {
      const company = form.company.trim();
      const payload = {
        name: company,
        company,
        phone: form.phone || undefined,
        whatsapp: form.whatsapp || undefined,
        email: form.email || undefined,
        type: form.type,
        notes: form.notes || undefined,
      };
      if (editing) await suppliersApi.update(editing.id, payload);
      else await suppliersApi.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete supplier "${row.company || row.name}"? Linked bookings or payments will be archived instead.`)) return;
    try {
      const { data } = await suppliersApi.delete(row.id);
      alert(data.message || 'Supplier removed');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const typeCounts = SUPPLIER_TYPES.reduce((acc, t) => {
    acc[t] = items.filter((r) => r.type === t).length;
    return acc;
  }, {});

  const columns = [
    { key: 'company', label: 'Company', render: (r) => (
      <Link to={`/suppliers/${r.id}/account`} className="font-semibold text-sta-indigo hover:text-sta-teal">{r.company || r.name}</Link>
    ) },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    { key: 'whatsapp', label: 'WhatsApp', render: (r) => r.whatsapp || '—' },
    { key: 'email', label: 'Email', render: (r) => r.email || '—' },
    { key: 'type', label: 'Type', render: (r) => (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase capitalize"
        style={{ background: C.blueLight, color: C.blue }}
      >
        {r.type?.replace('_', ' ')}
      </span>
    ) },
    {
      key: 'actions',
      label: 'Actions',
      stickyRight: true,
      cellClassName: '',
      render: (r) => (
        <RowActions
          items={[
            can('suppliers:view') && { type: 'link', label: 'Account', to: `/suppliers/${r.id}/account` },
            can('suppliers:update') && { type: 'button', label: 'Edit', onClick: () => openEdit(r), variant: 'muted' },
            can('suppliers:delete') && { type: 'button', label: 'Delete', onClick: () => handleDelete(r), variant: 'danger' },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: C.indigo, ...fontDisplay }}>Suppliers</h2>
          <p className="text-sm" style={{ color: C.muted, ...fontSans }}>GDS portals, airline offices, and ticket sources you buy from — not B2B agents</p>
        </div>
        {can('suppliers:create') && (
          <PrimaryBtn label="Add Supplier" icon={<Plus size={12} />} onClick={openCreate} />
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <SummaryStatCard label="On this page" count={items.length} color="indigo" />
        <SummaryStatCard label="Airlines / offices" count={(typeCounts.airline_office || 0) + (typeCounts.supplier || 0)} color="blue" />
        <SummaryStatCard label="Agents (type)" count={typeCounts.agent || 0} color="teal" />
        <SummaryStatCard label="All suppliers" count={pagination?.total} color="green" />
      </div>

      <div className="overflow-hidden rounded-[10px] border border-sta-border bg-sta-surface">
        <div className="border-b border-sta-border p-4">
          <input
            type="search"
            placeholder="Search..."
            className="input-field max-w-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <DataTable columns={columns} data={items} loading={loading} emptyTitle="No suppliers" emptyDescription="Add a supplier to get started." />
        {pagination && (
          <div className="border-t border-sta-border p-4">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Supplier' : 'Add Supplier'}
        wide
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" form="supplier-form" disabled={isSubmitting} className="btn-primary">Save</button>
          </div>
        )}
      >
        <form id="supplier-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg px-3 py-2 text-sm" style={{ background: C.redLight, color: C.red }}>{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Company *</label>
              <input className="input-field" {...register('company')} />
              {errors.company && <p className="mt-1 text-xs text-red-600">{errors.company.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                className="input-field"
                placeholder={BD_PHONE_PLACEHOLDER}
                {...register('phone')}
                onBlur={(e) => setValue('phone', formatPhoneOnBlur(e.target.value), { shouldValidate: true })}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
              <p className="mt-1 text-xs text-slate-500">{BD_PHONE_HELP}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">WhatsApp Number</label>
              <input
                className="input-field"
                placeholder={`${BD_PHONE_PLACEHOLDER} (optional)`}
                {...register('whatsapp')}
                onBlur={(e) => setValue('whatsapp', formatPhoneOnBlur(e.target.value), { shouldValidate: true })}
              />
              {errors.whatsapp && <p className="mt-1 text-xs text-red-600">{errors.whatsapp.message}</p>}
              <p className="mt-1 text-xs text-slate-500">Leave blank to use phone for WhatsApp.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input type="email" className="input-field" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
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
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea rows={3} className="input-field" {...register('notes')} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
