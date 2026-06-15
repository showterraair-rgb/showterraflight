import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { accountsApi } from '../services/finance.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { usePermission } from '../hooks/usePermission';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { ACCOUNT_TYPE_LABELS } from '../utils/finance';

export default function TransfersPage() {
  const { can } = usePermission();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  const form = useForm({
    defaultValues: {
      transferDate: new Date().toISOString().slice(0, 10),
      amount: 0,
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await accountsApi.listTransfers({ page, limit: 20 });
      setItems(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    accountsApi.list().then(({ data }) => setAccounts(data.data));
  }, []);

  const onSubmit = async (values) => {
    setError('');
    if (values.fromAccountId === values.toAccountId) {
      setError('Cannot transfer to the same account');
      return;
    }
    try {
      await accountsApi.createTransfer({
        ...values,
        amount: Number(values.amount),
      });
      setModalOpen(false);
      form.reset({ transferDate: new Date().toISOString().slice(0, 10), amount: 0 });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed');
    }
  };

  const handleVoid = async (row) => {
    const reason = window.prompt(`Void transfer ${row.transferNumber}? Enter reason (optional):`);
    if (reason === null) return;
    try {
      const { data } = await accountsApi.voidTransfer(row.id, { reason: reason || undefined });
      alert(data.message || 'Transfer voided');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Void failed');
    }
  };

  const columns = [
    { key: 'number', label: 'Transfer #', render: (r) => <span className="font-mono text-xs">{r.transferNumber}</span> },
    { key: 'from', label: 'From', render: (r) => r.fromAccount?.name || ACCOUNT_TYPE_LABELS[r.fromAccount?.type] },
    { key: 'to', label: 'To', render: (r) => r.toAccount?.name || ACCOUNT_TYPE_LABELS[r.toAccount?.type] },
    { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.transferDate) },
    { key: 'ref', label: 'Reference', render: (r) => r.referenceNumber || '—' },
    {
      key: 'actions',
      label: '',
      render: (r) => can('transfers:create') ? (
        <button type="button" onClick={() => handleVoid(r)} className="text-xs text-red-600 hover:underline">Void</button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/accounts" className="text-sm text-brand-600 hover:underline">← Accounts</Link>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Account Transfers</h2>
          <p className="text-sm text-slate-500">Move money between Cash, Bank, bKash, and Nagad</p>
        </div>
        {can('transfers:create') && (
          <button type="button" onClick={() => { setError(''); setModalOpen(true); }} className="btn-primary">New Transfer</button>
        )}
      </div>

      <div className="card p-0">
        <DataTable columns={columns} data={items} loading={loading} emptyTitle="No transfers" emptyDescription="Transfer money between your accounts." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Transfer Between Accounts"
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" form="transfer-form" className="btn-primary">Complete Transfer</button>
          </div>
        )}
      >
        <form id="transfer-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div>
            <label className="mb-1 block text-sm font-medium">From Account *</label>
            <select className="input-field" {...form.register('fromAccountId', { required: true })}>
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} — ৳{a.currentBalance?.toLocaleString()}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">To Account *</label>
            <select className="input-field" {...form.register('toAccountId', { required: true })}>
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} — ৳{a.currentBalance?.toLocaleString()}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Amount (৳) *</label>
            <input type="number" min="0.01" className="input-field" {...form.register('amount', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Transfer Date *</label>
            <input type="date" className="input-field" {...form.register('transferDate', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Reference #</label>
            <input className="input-field" {...form.register('referenceNumber')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea rows={2} className="input-field" {...form.register('notes')} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
