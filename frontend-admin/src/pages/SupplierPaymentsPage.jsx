import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { paymentsApi, accountsApi } from '../services/finance.api';
import { suppliersApi, bookingsApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { usePermission } from '../hooks/usePermission';
import MoneyAmount from '../components/common/MoneyAmount';
import { formatDate } from '../utils/date';
import { PAYMENT_METHODS } from '../utils/finance';

export default function SupplierPaymentsPage() {
  const { can } = usePermission();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);

  const form = useForm({
    defaultValues: {
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Bank Transfer',
      amount: 0,
    },
  });

  const selectedSupplier = form.watch('supplierId');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await paymentsApi.listSupplier({ page, limit: 20 });
      setItems(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    Promise.all([
      accountsApi.list(),
      suppliersApi.list({ limit: 100 }),
    ]).then(([aRes, sRes]) => {
      setAccounts(aRes.data.data);
      setSuppliers(sRes.data.data);
    });
  }, []);

  useEffect(() => {
    if (selectedSupplier) {
      bookingsApi.list({ supplierId: selectedSupplier, limit: 50 }).then(({ data }) => setBookings(data.data));
    } else {
      setBookings([]);
    }
  }, [selectedSupplier]);

  const onSubmit = async (values) => {
    setError('');
    try {
      const { data: res } = await paymentsApi.createSupplier({
        ...values,
        amount: Number(values.amount),
        bookingId: values.onAccount ? undefined : (values.bookingId || undefined),
        onAccount: Boolean(values.onAccount),
      });
      if (receiptFile && res.data?.id) {
        await paymentsApi.uploadSupplierReceipt(res.data.id, receiptFile);
      }
      setModalOpen(false);
      setReceiptFile(null);
      form.reset({ paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'Bank Transfer', amount: 0, onAccount: false });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleVoid = async (row) => {
    const reason = window.prompt(`Void payment ${row.paymentNumber}? Enter reason (optional):`);
    if (reason === null) return;
    try {
      const { data } = await paymentsApi.voidSupplier(row.id, { reason: reason || undefined });
      alert(data.message || 'Payment voided');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Void failed');
    }
  };

  const handleReceiptUpload = async (row, file) => {
    if (!file) return;
    try {
      await paymentsApi.uploadSupplierReceipt(row.id, file);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Receipt upload failed');
    }
  };

  const onAccount = form.watch('onAccount');

  const columns = [
    { key: 'number', label: 'Payment #', render: (r) => <span className="font-mono text-xs">{r.paymentNumber}</span> },
    { key: 'supplier', label: 'Supplier', render: (r) => r.supplierName },
    { key: 'booking', label: 'Booking', render: (r) => r.bookingNumber || '—' },
    { key: 'account', label: 'Paid From', render: (r) => r.accountName },
    { key: 'amount', label: 'Amount', render: (r) => <MoneyAmount amount={r.amount} size="sm" className="font-medium text-red-600" /> },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.paymentDate) },
    { key: 'receipt', label: 'Receipt', render: (r) => r.receiptUrl ? (
      <a href={r.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline">View</a>
    ) : '—' },
    { key: 'status', label: 'Status', render: (r) => <span className="capitalize">{r.status}</span> },
    {
      key: 'actions',
      label: '',
      render: (r) => can('payments:supplier') ? (
        <div className="flex flex-col items-start gap-1">
          <label className="cursor-pointer text-xs text-brand-600 hover:underline">
            {r.receiptUrl ? 'Replace receipt' : 'Upload receipt'}
            <input
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => {
                handleReceiptUpload(r, e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          <button type="button" onClick={() => handleVoid(r)} className="text-xs text-red-600 hover:underline">Void</button>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Supplier Payments</h2>
          <p className="text-sm text-slate-500">Pay suppliers/agents — decreases account balance</p>
        </div>
        {can('payments:supplier') && (
          <button type="button" onClick={() => { setError(''); setModalOpen(true); }} className="btn-primary">Record Payment</button>
        )}
      </div>

      <div className="card p-0">
        <DataTable columns={columns} data={items} loading={loading} emptyTitle="No supplier payments" emptyDescription="Record payments made to ticket suppliers." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Supplier Payment"
        wide
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" form="supplier-payment-form" className="btn-primary">Record Payment</button>
          </div>
        )}
      >
        <form id="supplier-payment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Supplier *</label>
              <select className="input-field" {...form.register('supplierId', { required: true })}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Booking *</label>
              <select className="input-field" {...form.register('bookingId')} disabled={onAccount}>
                <option value="">Select booking</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>{b.bookingNumber} — Payable ৳{b.supplierPayable?.toLocaleString()}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register('onAccount')} />
                On-account advance (no booking link)
              </label>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Paying Account *</label>
              <select className="input-field" {...form.register('accountId', { required: true })}>
                <option value="">Select account</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} (৳{a.currentBalance?.toLocaleString()})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Amount (৳) *</label>
              <input type="number" min="0.01" step="0.01" className="input-field" {...form.register('amount', { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Payment Date *</label>
              <input type="date" className="input-field" {...form.register('paymentDate', { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Method</label>
              <select className="input-field" {...form.register('paymentMethod')}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Reference #</label>
              <input className="input-field" {...form.register('referenceNumber')} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea rows={2} className="input-field" {...form.register('notes')} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Receipt (optional)</label>
              <input type="file" accept="image/*,application/pdf" className="input-field py-1.5" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
              <p className="mt-1 text-xs text-slate-500">PDF or image, max 8MB</p>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
