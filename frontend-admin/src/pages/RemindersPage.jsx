import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { remindersApi } from '../services/phase5.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { usePermission } from '../hooks/usePermission';
import { formatDate } from '../utils/date';

const REMINDER_TYPES = [
  { value: '', label: 'All types' },
  { value: 'customer_due', label: 'Customer due' },
  { value: 'booking_travel', label: 'Travel date' },
  { value: 'supplier_payable', label: 'Supplier payable' },
  { value: 'recurring_expense', label: 'Recurring expense' },
  { value: 'manual_task', label: 'Manual task' },
];

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'completed', label: 'Completed' },
  { value: 'dismissed', label: 'Dismissed' },
];

export default function RemindersPage() {
  const { can } = usePermission();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [jobMsg, setJobMsg] = useState('');

  const form = useForm({
    defaultValues: {
      dueDate: new Date().toISOString().slice(0, 10),
      priority: 'medium',
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      if (!params.status) delete params.status;
      if (!params.type) delete params.type;
      const { data } = await remindersApi.list(params);
      setItems(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (values) => {
    setError('');
    try {
      await remindersApi.create(values);
      setModalOpen(false);
      form.reset({ dueDate: new Date().toISOString().slice(0, 10), priority: 'medium' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create reminder');
    }
  };

  const markStatus = async (id, status) => {
    await remindersApi.updateStatus(id, { status });
    load();
  };

  const runJobs = async (action) => {
    setJobMsg('');
    try {
      const fn = action === 'generate' ? remindersApi.runGenerators : remindersApi.sendPending;
      const { data } = await fn();
      setJobMsg(data.message || 'Job completed');
      load();
    } catch (err) {
      setJobMsg(err.response?.data?.message || 'Job failed');
    }
  };

  const columns = [
    { key: 'type', label: 'Type', render: (r) => <span className="capitalize text-xs">{r.type.replace(/_/g, ' ')}</span> },
    { key: 'title', label: 'Title' },
    { key: 'dueDate', label: 'Due', render: (r) => formatDate(r.dueDate) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'priority', label: 'Priority', render: (r) => <StatusBadge status={r.priority} label={r.priority} /> },
    {
      key: 'actions',
      label: '',
      render: (r) =>
        can('reminders:manage') && r.status === 'pending' ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => markStatus(r.id, 'completed')} className="text-xs text-green-600 hover:underline">Complete</button>
            <button type="button" onClick={() => markStatus(r.id, 'dismissed')} className="text-xs text-slate-500 hover:underline">Dismiss</button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={filters.status}
            onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={filters.type}
            onChange={(e) => { setFilters((f) => ({ ...f, type: e.target.value })); setPage(1); }}
          >
            {REMINDER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {can('reminders:manage') && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => runJobs('generate')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Run generators</button>
            <button type="button" onClick={() => runJobs('send')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Send pending</button>
            <button type="button" onClick={() => setModalOpen(true)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">New reminder</button>
          </div>
        )}
      </div>

      {jobMsg && <p className="text-sm text-brand-700">{jobMsg}</p>}

      <DataTable columns={columns} rows={items} loading={loading} emptyMessage="No reminders found" />
      {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Manual reminder">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input className="input-field" {...form.register('title', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Message</label>
            <textarea className="input-field" rows={3} {...form.register('message')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Due date</label>
              <input type="date" className="input-field" {...form.register('dueDate', { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Priority</label>
              <select className="input-field" {...form.register('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
