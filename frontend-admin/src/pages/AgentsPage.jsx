import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { agentsApi } from '../services/agents.api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import RowActions from '../components/common/RowActions';
import StatusBadge from '../components/common/StatusBadge';
import SummaryStatCard from '../components/common/SummaryStatCard';
import PrimaryBtn from '../components/ui/PrimaryBtn';
import { usePermission } from '../hooks/usePermission';
import { C, fontDisplay, fontSans } from '../theme/tokens';

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

  const activeCount = items.filter((r) => r.isActive).length;
  const balanceSum = items.reduce((s, r) => s + Number(r.currentBalance || 0), 0);
  const bookingsSum = items.reduce((s, r) => s + Number(r.bookingsCount || 0), 0);

  const columns = [
    { key: 'agentId', label: 'Agent ID', render: (r) => <span className="font-mono text-xs font-semibold text-sta-teal">{r.agentId}</span> },
    { key: 'companyName', label: 'Company', render: (r) => (
      <Link to={`/agents/${r.id}`} className="font-semibold text-sta-indigo hover:text-sta-teal">{r.companyName}</Link>
    ) },
    { key: 'contactPerson', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'agentType', label: 'Type', render: (r) => (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
        style={{ background: C.violetLight, color: C.violet }}
      >
        {AGENT_TYPES[r.agentType] || r.agentType}
      </span>
    ) },
    { key: 'currentBalance', label: 'Balance', render: (r) => (
      <span className="font-mono text-xs font-semibold tabular-nums">৳{(r.currentBalance || 0).toLocaleString()}</span>
    ) },
    { key: 'isActive', label: 'Active', render: (r) => <StatusBadge status={r.isActive ? 'success' : 'cancelled'} label={r.isActive ? 'Yes' : 'No'} /> },
    { key: 'bookingsCount', label: 'Bookings', render: (r) => <span className="font-mono text-xs">{r.bookingsCount ?? 0}</span> },
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
          <h2 className="text-xl font-bold" style={{ color: C.indigo, ...fontDisplay }}>B2B Agents</h2>
          <p className="text-sm" style={{ color: C.muted, ...fontSans }}>Travel agencies who purchase tickets from Show Terra Flight</p>
        </div>
        {can('agents:manage') && (
          <PrimaryBtn
            label="New Agent"
            icon={<Plus size={12} />}
            onClick={() => { reset(); setError(''); setModalOpen(true); }}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <SummaryStatCard label="On this page" count={items.length} color="indigo" />
        <SummaryStatCard label="Active" count={activeCount} color="green" />
        <SummaryStatCard label="Bookings (page)" count={bookingsSum} color="teal" />
        <SummaryStatCard label="Balance sum" amount={balanceSum} color="amber" />
        <SummaryStatCard label="All agents" count={pagination?.total} color="blue" />
      </div>

      <div className="overflow-hidden rounded-[10px] border border-sta-border bg-sta-surface">
        <div className="border-b border-sta-border p-4">
          <input
            type="search"
            placeholder="Search…"
            className="input-field max-w-xs"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <DataTable columns={columns} data={items} loading={loading} emptyMessage="No agents yet" />
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 border-t border-sta-border p-4">
            <button type="button" disabled={page <= 1} className="btn-secondary" onClick={() => setPage(page - 1)}>Prev</button>
            <span className="py-2 text-sm text-sta-muted">Page {page} / {pagination.totalPages}</span>
            <button type="button" disabled={page >= pagination.totalPages} className="btn-secondary" onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Agent" wide>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {error && <p className="text-sm" style={{ color: C.red }}>{error}</p>}
          <input className="input-field" placeholder="Company name *" {...register('companyName', { required: true })} />
          <input className="input-field" placeholder="Contact person *" {...register('contactPerson', { required: true })} />
          <input type="email" className="input-field" placeholder="Email *" {...register('email', { required: true })} />
          <input className="input-field" placeholder="Phone *" {...register('phone', { required: true })} />
          <input className="input-field" placeholder="WhatsApp number" {...register('whatsapp')} />
          <p className="-mt-2 text-xs" style={{ color: C.muted }}>Optional. Used for WhatsApp contact if different from phone.</p>
          <select className="input-field" {...register('agentType')}>
            <option value="regular">Regular</option>
            <option value="corporate">Corporate</option>
            <option value="franchise">Franchise</option>
          </select>
          <input type="number" className="input-field font-mono" placeholder="Credit limit" {...register('creditLimit')} />
          <div>
            <input type="password" className="input-field" placeholder="Password *" {...register('password', { required: true, minLength: 10 })} />
            <p className="mt-1 text-xs" style={{ color: C.muted }}>At least 10 characters with uppercase, lowercase, and a number (e.g. Agent@123456)</p>
          </div>
          <textarea className="input-field" placeholder="Internal notes" {...register('notes')} />
          <PrimaryBtn type="submit" label={isSubmitting ? 'Creating…' : 'Create Agent'} disabled={isSubmitting} />
        </form>
      </Modal>
    </div>
  );
}
