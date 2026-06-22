import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { expensesApi, accountsApi } from '../services/finance.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { usePermission } from '../hooks/usePermission';
import MoneyAmount from '../components/common/MoneyAmount';
import { formatDate } from '../utils/date';
import { PAYMENT_METHODS } from '../utils/finance';

export default function ExpensesPage() {
  const { can } = usePermission();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [billFile, setBillFile] = useState(null);

  const form = useForm({
    defaultValues: {
      expenseDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Cash',
      amount: 0,
      isRecurring: false,
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await expensesApi.list({ page, limit: 20 });
      setItems(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    Promise.all([
      expensesApi.listCategories(),
      accountsApi.list(),
    ]).then(([catRes, accRes]) => {
      setCategories(catRes.data.data);
      setAccounts(accRes.data.data);
    });
  }, []);

  const onSubmit = async (values) => {
    setError('');
    try {
      const { data } = await expensesApi.create({
        categoryId: values.categoryId,
        title: values.title,
        amount: Number(values.amount),
        expenseDate: values.expenseDate,
        accountId: values.accountId,
        paymentMethod: values.paymentMethod,
        referenceNumber: values.referenceNumber,
        notes: values.notes,
        isRecurring: values.isRecurring,
        recurringFrequency: values.isRecurring ? values.recurringFrequency : undefined,
      });
      if (billFile && data.data?.id) {
        await expensesApi.uploadBill(data.data.id, billFile);
      }
      setModalOpen(false);
      setBillFile(null);
      form.reset({ expenseDate: new Date().toISOString().slice(0, 10), paymentMethod: 'Cash', amount: 0, isRecurring: false });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record expense');
    }
  };

  const handleVoid = async (row) => {
    const reason = window.prompt(`Void expense ${row.expenseNumber}? Enter reason (optional):`);
    if (reason === null) return;
    try {
      const { data } = await expensesApi.void(row.id, { reason: reason || undefined });
      alert(data.message || 'Expense voided');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Void failed');
    }
  };

  const columns = [
    { key: 'number', label: 'Expense #', render: (r) => <span className="font-mono text-xs">{r.expenseNumber}</span> },
    { key: 'title', label: 'Title', render: (r) => r.title },
    { key: 'category', label: 'Category', render: (r) => r.categoryName },
    { key: 'account', label: 'Paid From', render: (r) => r.accountName },
    { key: 'amount', label: 'Amount', render: (r) => <MoneyAmount amount={r.amount} size="sm" className="font-medium text-red-600" /> },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.expenseDate) },
    { key: 'bill', label: 'Bill', render: (r) => r.billUrl ? (
      <a href={r.billUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline">View</a>
    ) : '—' },
    { key: 'recurring', label: 'Recurring', render: (r) => r.isRecurring ? 'Yes' : '—' },
    {
      key: 'actions',
      label: '',
      render: (r) => can('expenses:create') ? (
        <button type="button" onClick={() => handleVoid(r)} className="text-xs text-red-600 hover:underline">Void</button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Expenses</h2>
          <p className="text-sm text-slate-500">Office and operational expenses — decreases account balance</p>
        </div>
        {can('expenses:create') && (
          <button type="button" onClick={() => { setError(''); setModalOpen(true); }} className="btn-primary">Add Expense</button>
        )}
      </div>

      <div className="card p-0">
        <DataTable columns={columns} data={items} loading={loading} emptyTitle="No expenses" emptyDescription="Record office rent, utilities, and other costs." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Expense"
        wide
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" form="expense-form" className="btn-primary">Save Expense</button>
          </div>
        )}
      >
        <form id="expense-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Title *</label>
              <input className="input-field" placeholder="e.g. March office rent" {...form.register('title', { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category *</label>
              <select className="input-field" {...form.register('categoryId', { required: true })}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Amount (৳) *</label>
              <input type="number" min="0.01" className="input-field" {...form.register('amount', { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Expense Date *</label>
              <input type="date" className="input-field" {...form.register('expenseDate', { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Pay From Account *</label>
              <select className="input-field" {...form.register('accountId', { required: true })}>
                <option value="">Select account</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} (৳{a.currentBalance?.toLocaleString()})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Payment Method</label>
              <select className="input-field" {...form.register('paymentMethod')}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Reference #</label>
              <input className="input-field" {...form.register('referenceNumber')} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="isRecurring" {...form.register('isRecurring')} />
              <label htmlFor="isRecurring" className="text-sm">Recurring expense</label>
            </div>
            {form.watch('isRecurring') && (
              <div>
                <label className="mb-1 block text-sm font-medium">Frequency</label>
                <select className="input-field" {...form.register('recurringFrequency')}>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Bill / receipt (PDF or image)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="input-field"
                onChange={(e) => setBillFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea rows={2} className="input-field" {...form.register('notes')} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
