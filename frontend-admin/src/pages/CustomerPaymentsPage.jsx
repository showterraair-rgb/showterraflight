import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { paymentsApi, accountsApi } from '../services/finance.api';
import { customersApi, bookingsApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { usePermission } from '../hooks/usePermission';
import MoneyAmount from '../components/common/MoneyAmount';
import { formatDate } from '../utils/date';
import { PAYMENT_METHODS } from '../utils/finance';

export default function CustomerPaymentsPage() {
  const { can } = usePermission();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  const form = useForm({
    defaultValues: {
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Cash',
      amount: 0,
    },
  });

  const selectedCustomer = form.watch('customerId');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await paymentsApi.listCustomer({ page, limit: 20 });
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
      customersApi.list({ limit: 100 }),
    ]).then(([aRes, cRes]) => {
      setAccounts(aRes.data.data);
      setCustomers(cRes.data.data);
    });
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      bookingsApi.list({ customerId: selectedCustomer, limit: 50 }).then(({ data }) => setBookings(data.data));
    } else {
      setBookings([]);
    }
  }, [selectedCustomer]);

  const onSubmit = async (values) => {
    setError('');
    try {
      await paymentsApi.createCustomer({
        ...values,
        amount: Number(values.amount),
        bookingId: values.onAccount ? undefined : (values.bookingId || undefined),
        onAccount: Boolean(values.onAccount),
      });
      setModalOpen(false);
      form.reset({ paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'Cash', amount: 0, onAccount: false });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleVoid = async (row) => {
    const reason = window.prompt(`Void payment ${row.paymentNumber}? Enter reason (optional):`);
    if (reason === null) return;
    try {
      const { data } = await paymentsApi.voidCustomer(row.id, { reason: reason || undefined });
      alert(data.message || 'Payment voided');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Void failed');
    }
  };

  const onAccount = form.watch('onAccount');

  const columns = [
    { key: 'number', label: 'Payment #', render: (r) => <span className="font-mono text-xs">{r.paymentNumber}</span> },
    { key: 'customer', label: 'Customer', render: (r) => r.customerName },
    { key: 'booking', label: 'Booking', render: (r) => r.bookingNumber || '—' },
    { key: 'account', label: 'Received In', render: (r) => r.accountName },
    { key: 'amount', label: 'Amount', render: (r) => <MoneyAmount amount={r.amount} size="sm" className="font-medium text-green-700" /> },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.paymentDate) },
    { key: 'status', label: 'Status', render: (r) => <span className="capitalize">{r.status}</span> },
    {
      key: 'actions',
      label: '',
      render: (r) => can('payments:customer') ? (
        <button type="button" onClick={() => handleVoid(r)} className="text-xs text-red-600 hover:underline">Void</button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customer Payments</h2>
          <p className="text-sm text-slate-500">Record payments received — increases account balance</p>
        </div>
        {can('payments:customer') && (
          <button type="button" onClick={() => { setError(''); setModalOpen(true); }} className="btn-primary">Record Payment</button>
        )}
      </div>

      <div className="card p-0">
        <DataTable columns={columns} data={items} loading={loading} emptyTitle="No customer payments" emptyDescription="Record a payment when a customer pays." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Customer Payment"
        wide
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" form="customer-payment-form" className="btn-primary">Record Payment</button>
          </div>
        )}
      >
        <form id="customer-payment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Customer *</label>
              <select className="input-field" {...form.register('customerId', { required: true })}>
                <option value="">Select customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Booking *</label>
              <select className="input-field" {...form.register('bookingId')} disabled={onAccount}>
                <option value="">Select booking</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>{b.bookingNumber} — Due ৳{b.customerDue?.toLocaleString()}</option>
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
              <label className="mb-1 block text-sm font-medium">Receiving Account *</label>
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
          </div>
        </form>
      </Modal>
    </div>
  );
}
