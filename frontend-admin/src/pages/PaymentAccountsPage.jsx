import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { accountsApi } from '../services/finance.api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePermission } from '../hooks/usePermission';
import { formatCurrency } from '../utils/currency';
import { ACCOUNT_TYPE_LABELS } from '../utils/finance';

const ACCOUNT_TYPES = ['cash', 'bank', 'bkash', 'nagad'];

const EMPTY_FORM = {
  title: '',
  name: '',
  accountName: '',
  type: 'cash',
  accountNumber: '',
  bankName: '',
  branchRouting: '',
  mobileNumber: '',
  mobileBankingType: '',
  openingBalance: 0,
  notes: '',
  isActive: true,
};

export default function PaymentAccountsPage() {
  const { can } = usePermission();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const [showInactive, setShowInactive] = useState(true);

  const form = useForm({ defaultValues: EMPTY_FORM });
  const watchType = form.watch('type');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await accountsApi.list({ includeInactive: showInactive ? 'true' : undefined });
      setAccounts(data.data || []);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.reset(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    form.reset({
      title: row.title || row.name,
      name: row.name,
      accountName: row.accountName || '',
      type: row.type,
      accountNumber: row.accountNumber || '',
      bankName: row.bankName || '',
      branchRouting: row.branchRouting || '',
      mobileNumber: row.mobileNumber || '',
      mobileBankingType: row.mobileBankingType || '',
      qrImagePath: row.qrImagePath || '',
      notes: row.notes || '',
      isActive: row.isActive !== false,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setMsg('');
    try {
      const payload = {
        ...values,
        openingBalance: editing ? undefined : Number(values.openingBalance) || 0,
        mobileBankingType: values.mobileBankingType || null,
      };
      if (editing) {
        await accountsApi.update(editing.id, payload);
        setMsg('Account updated');
      } else {
        await accountsApi.create(payload);
        setMsg('Account created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Save failed');
    }
  };

  const toggleStatus = async (row) => {
    try {
      await accountsApi.updateStatus(row.id, { isActive: !row.isActive });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Status update failed');
    }
  };

  const columns = [
    { key: 'title', label: 'Title', render: (r) => r.title || r.name },
    { key: 'type', label: 'Type', render: (r) => ACCOUNT_TYPE_LABELS[r.type] || r.type },
    { key: 'accountName', label: 'Account name', render: (r) => r.accountName || '—' },
    { key: 'accountNumber', label: 'Number', render: (r) => r.accountNumber || r.mobileNumber || '—' },
    { key: 'currentBalance', label: 'Balance', render: (r) => formatCurrency(r.currentBalance) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} label={r.isActive ? 'Active' : 'Inactive'} /> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          <Link to={`/accounts/${r.id}/statement`} className="text-xs font-medium text-brand-600">Statement</Link>
          {can('accounts:manage') && (
            <>
              <button type="button" onClick={() => openEdit(r)} className="text-xs font-medium text-slate-600">Edit</button>
              <button type="button" onClick={() => toggleStatus(r)} className="text-xs font-medium text-slate-600">
                {r.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading && !accounts.length) return <LoadingSpinner className="py-20" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payment Accounts</h2>
          <p className="text-sm text-slate-500">Cash, bank, bKash, and Nagad accounts used for payments and expenses</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Show inactive
          </label>
          {can('accounts:manage') && (
            <button type="button" onClick={openCreate} className="btn-primary">Add account</button>
          )}
        </div>
      </div>

      {msg && <p className="text-sm text-brand-700">{msg}</p>}

      <DataTable columns={columns} data={accounts} loading={loading} emptyMessage="No payment accounts yet" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit payment account' : 'New payment account'} wide>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-600">Title</span>
              <input {...form.register('title')} className="input mt-1 w-full" placeholder="Display title" />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Internal name *</span>
              <input {...form.register('name', { required: true })} className="input mt-1 w-full" />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Account type *</span>
              <select {...form.register('type')} className="input mt-1 w-full" disabled={Boolean(editing)}>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Account holder name</span>
              <input {...form.register('accountName')} className="input mt-1 w-full" />
            </label>
            {(watchType === 'bank') && (
              <>
                <label className="block text-sm">
                  <span className="text-slate-600">Bank name</span>
                  <input {...form.register('bankName')} className="input mt-1 w-full" />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Account number</span>
                  <input {...form.register('accountNumber')} className="input mt-1 w-full" />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="text-slate-600">Branch / routing</span>
                  <input {...form.register('branchRouting')} className="input mt-1 w-full" />
                </label>
              </>
            )}
            {(watchType === 'bkash' || watchType === 'nagad') && (
              <>
                <label className="block text-sm">
                  <span className="text-slate-600">Mobile banking type</span>
                  <select {...form.register('mobileBankingType')} className="input mt-1 w-full">
                    <option value="">Auto ({watchType})</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Mobile number</span>
                  <input {...form.register('mobileNumber')} className="input mt-1 w-full" />
                </label>
              </>
            )}
            {!editing && (
              <label className="block text-sm">
                <span className="text-slate-600">Opening balance</span>
                <input type="number" step="0.01" {...form.register('openingBalance')} className="input mt-1 w-full" />
              </label>
            )}
            <label className="block text-sm sm:col-span-2">
              <span className="text-slate-600">Notes</span>
              <textarea {...form.register('notes')} rows={2} className="input mt-1 w-full" />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-slate-600">QR image path (optional)</span>
              <input {...form.register('qrImagePath')} className="input mt-1 w-full" placeholder="uploads/qr/account.png" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
