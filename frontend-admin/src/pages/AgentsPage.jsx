import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { agentsApi } from '../services/agents.api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import RowActions from '../components/common/RowActions';
import StatusBadge from '../components/common/StatusBadge';
import { usePermission } from '../hooks/usePermission';

const AGENT_TYPES = { regular: 'Regular', corporate: 'Corporate', franchise: 'Franchise' };

export default function AgentsPage() {
  const { can } = usePermission();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const form = useForm({ defaultValues: { agentType: 'regular', creditLimit: 0, initialBalance: 0, isActive: true } });
  const { register, handleSubmit, reset, formState: { isSubmitting } } = form;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await agentsApi.list({ page, limit: 20, search: search || undefined });
      setItems(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (values) => {
    setError('');
    try {
      await agentsApi.create({
        ...values,
        creditLimit: values.creditLimit === '' || values.creditLimit == null ? 0 : Number(values.creditLimit),
        initialBalance: values.initialBalance === '' || values.initialBalance == null ? 0 : Number(values.initialBalance),
      });
      setModalOpen(false);
      reset();
      load();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        setError(apiErrors.map((e) => `${e.field}: ${e.message}`).join(' · '));
      } else {
        setError(err.response?.data?.message || 'Create failed');
      }
    }
  };

  const columns = [
    { key: 'agentId', label: 'Agent ID', render: (r) => <span className="font-mono text-xs font-medium">{r.agentId}</span> },
    { key: 'companyName', label: 'Company' },
    { key: 'contactPerson', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'agentType', label: 'Type', render: (r) => AGENT_TYPES[r.agentType] || r.agentType },
    { key: 'currentBalance', label: 'Balance', render: (r) => `৳${(r.currentBalance || 0).toLocaleString()}` },
    { key: 'isActive', label: 'Active', render: (r) => <StatusBadge status={r.isActive ? 'success' : 'cancelled'} label={r.isActive ? 'Yes' : 'No'} /> },
    { key: 'bookingsCount', label: 'Bookings' },
    {
      key: 'actions',
      label: 'Actions',
      stickyRight: true,
      render: (r) => (
        <RowActions items={[
          can('agents:view') && { type: 'link', label: 'View', to: `/agents/${r.id}` },
          can('agents:manage') && { type: 'button', label: r.isActive ? 'Deactivate' : 'Activate', onClick: async () => { await agentsApi.toggle(r.id); load(); }, variant: 'muted' },
        ]} />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">B2B Agents</h2>
          <p className="text-sm text-slate-500">Travel agencies who purchase tickets from Show Terra Flight</p>
        </div>
        {can('agents:manage') && <button type="button" onClick={() => { reset(); setError(''); setModalOpen(true); }} className="btn-primary">New Agent</button>}
      </div>
      <input type="search" placeholder="Search…" className="input-field max-w-xs" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      <DataTable columns={columns} data={items} loading={loading} emptyMessage="No agents yet" />
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button type="button" disabled={page <= 1} className="btn-secondary" onClick={() => setPage(page - 1)}>Prev</button>
          <span className="py-2 text-sm">Page {page} / {pagination.totalPages}</span>
          <button type="button" disabled={page >= pagination.totalPages} className="btn-secondary" onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Agent">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input className="input-field" placeholder="Company name *" {...register('companyName', { required: true })} />
          <input className="input-field" placeholder="Contact person *" {...register('contactPerson', { required: true })} />
          <input type="email" className="input-field" placeholder="Email *" {...register('email', { required: true })} />
          <input className="input-field" placeholder="Phone *" {...register('phone', { required: true })} />
          <input className="input-field" placeholder="WhatsApp number" {...register('whatsapp')} />
          <p className="text-xs text-slate-500 -mt-2">Optional. Used for WhatsApp contact if different from phone.</p>
          <select className="input-field" {...register('agentType')}><option value="regular">Regular</option><option value="corporate">Corporate</option><option value="franchise">Franchise</option></select>
          <input type="number" className="input-field" placeholder="Credit limit" {...register('creditLimit')} />
          <div>
            <input type="password" className="input-field" placeholder="Password *" {...register('password', { required: true, minLength: 10 })} />
            <p className="mt-1 text-xs text-slate-500">At least 10 characters with uppercase, lowercase, and a number (e.g. Agent@123456)</p>
          </div>
          <textarea className="input-field" placeholder="Internal notes" {...register('notes')} />
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">Create Agent</button>
        </form>
      </Modal>
    </div>
  );
}
