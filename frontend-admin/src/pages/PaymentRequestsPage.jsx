import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { paymentRequestsApi, accountsApi } from '../services/finance.api';
import { customersApi, bookingsApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { usePermission } from '../hooks/usePermission';
import MoneyAmount from '../components/common/MoneyAmount';
import { formatDate } from '../utils/date';

const STATUS_LABELS = { pending: 'Pending', paid: 'Paid', cancelled: 'Cancelled' };

export default function PaymentRequestsPage() {
  const { can } = usePermission();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [createOpen, setCreateOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const createForm = useForm({
    defaultValues: {
      dueDate: new Date().toISOString().slice(0, 10),
      sendNotification: true,
    },
  });
  const recordForm = useForm({
    defaultValues: {
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Bank Transfer',
    },
  });

  const selectedCustomer = createForm.watch('customerId');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await paymentRequestsApi.list(params);
      setItems(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    customersApi.list({ limit: 100 }).then(({ data }) => setCustomers(data.data));
    accountsApi.list().then(({ data }) => setAccounts(data.data || []));
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      bookingsApi.list({ customerId: selectedCustomer, limit: 50 }).then(({ data }) => setBookings(data.data));
    } else {
      setBookings([]);
    }
  }, [selectedCustomer]);

  const onCreate = async (values) => {
    setError('');
    try {
      await paymentRequestsApi.create({
        ...values,
        amount: Number(values.amount),
        bookingId: values.bookingId || undefined,
        sendNotification: Boolean(values.sendNotification),
      });
      setCreateOpen(false);
      createForm.reset({ dueDate: new Date().toISOString().slice(0, 10), sendNotification: true });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    }
  };

  const onRecord = async (values) => {
    setError('');
    try {
      await paymentRequestsApi.record(selected.id, values);
      setRecordOpen(false);
      setSelected(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleCancel = async (row) => {
    const reason = window.prompt(`Cancel request ${row.requestNumber}? Reason (optional):`);
    if (reason === null) return;
    try {
      await paymentRequestsApi.cancel(row.id, { reason: reason || undefined });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed');
    }
  };

  const columns = [
    { key: 'number', label: 'Request #', render: (r) => <span className="font-mono text-xs">{r.requestNumber}</span> },
    { key: 'customer', label: 'Customer', render: (r) => r.customerName },
    { key: 'booking', label: 'Booking', render: (r) => r.bookingNumber ? (
      <Link to={`/bookings/${r.booking}`} className="text-brand-600 hover:underline">{r.bookingNumber}</Link>
    ) : '—' },
    { key: 'amount', label: 'Amount', render: (r) => <MoneyAmount amount={r.amount} size="sm" className="font-medium" /> },
    { key: 'dueDate', label: 'Due Date', render: (r) => formatDate(r.dueDate) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'paid' ? 'success' : r.status === 'pending' ? 'pending' : 'cancelled'} label={STATUS_LABELS[r.status]} /> },
    {
      key: 'actions',
      label: '',
      render: (r) => r.status === 'pending' && can('payments:customer') ? (
        <div className="flex gap-2">
          <button type="button" onClick={() => { setSelected(r); setError(''); recordForm.reset({ paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'Bank Transfer' }); setRecordOpen(true); }} className="text-xs text-brand-600 hover:underline">Record</button>
          <button type="button" onClick={() => handleCancel(r)} className="text-xs text-red-600 hover:underline">Cancel</button>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payment Requests</h2>
          <p className="text-sm text-slate-500">Send due payment reminders to customers via SMS/WhatsApp</p>
        </div>
        {can('payments:customer') && (
          <button type="button" onClick={() => { setError(''); setCreateOpen(true); }} className="btn-primary">Send Payment Request</button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {['pending', 'paid', 'cancelled', ''].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {s ? STATUS_LABELS[s] : 'All'}
          </button>
        ))}
      </div>

      <div className="card p-0">
        <DataTable columns={columns} data={items} loading={loading} emptyTitle="No payment requests" />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Send Payment Request" wide
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" form="payment-request-form" className="btn-primary">Send Request</button>
          </div>
        )}
      >
        <form id="payment-request-form" onSubmit={createForm.handleSubmit(onCreate)} className="grid gap-3 sm:grid-cols-2">
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium">Customer *</label>
            <select className="input-field" {...createForm.register('customerId', { required: true })}>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Booking (optional)</label>
            <select className="input-field" {...createForm.register('bookingId')}>
              <option value="">On-account / no booking</option>
              {bookings.map((b) => <option key={b.id} value={b.id}>{b.bookingNumber} — Due ৳{b.customerDue?.toLocaleString()}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Amount (৳) *</label>
            <input type="number" min="0.01" step="0.01" className="input-field" {...createForm.register('amount', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Due Date *</label>
            <input type="date" className="input-field" {...createForm.register('dueDate', { required: true })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea rows={2} className="input-field" {...createForm.register('notes')} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" {...createForm.register('sendNotification')} />
            Notify customer (SMS / email / WhatsApp if configured)
          </label>
        </form>
      </Modal>

      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title={`Record payment — ${selected?.requestNumber || ''}`}
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRecordOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" form="record-request-form" className="btn-primary">Record Payment</button>
          </div>
        )}
      >
        {selected && (
          <form id="record-request-form" onSubmit={recordForm.handleSubmit(onRecord)} className="space-y-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-sm text-slate-600">Amount: <strong>৳{selected.amount?.toLocaleString()}</strong> from {selected.customerName}</p>
            <div>
              <label className="mb-1 block text-sm font-medium">Receiving Account *</label>
              <select className="input-field" {...recordForm.register('accountId', { required: true })}>
                <option value="">Select account</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Payment Date</label>
              <input type="date" className="input-field" {...recordForm.register('paymentDate')} />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
