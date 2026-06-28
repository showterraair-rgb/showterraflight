import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

export function CustomerPaymentsList({
  title = 'Customer Payments',
  description = 'Record payments received — increases account balance',
  showRecordButton = true,
  forceInstantModal = false,
}) {
  const { can } = usePermission();
  const [searchParams, setSearchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('bookingId');
  const instantMode = forceInstantModal || searchParams.get('instant') === '1';
  const [prefillBooking, setPrefillBooking] = useState(null);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);

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
      const params = { page, limit: 20 };
      if (bookingIdParam) params.bookingId = bookingIdParam;
      const { data } = await paymentsApi.listCustomer(params);
      setItems(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, bookingIdParam]);

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

  useEffect(() => {
    if (instantMode && can('payments:customer')) {
      setModalOpen(true);
    }
  }, [instantMode, can]);

  useEffect(() => {
    if (!bookingIdParam || !can('payments:customer')) return;
    let cancelled = false;
    bookingsApi.get(bookingIdParam).then(({ data }) => {
      if (cancelled) return;
      const b = data.data;
      setPrefillBooking(b);
      form.setValue('customerId', b.customer || '');
      form.setValue('bookingId', b.id);
      if (b.customerDue > 0) form.setValue('amount', b.customerDue);
      setModalOpen(true);
    }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingIdParam]);

  const onSubmit = async (values) => {
    setError('');
    try {
      const { data: res } = await paymentsApi.createCustomer({
        ...values,
        amount: Number(values.amount),
        bookingId: values.onAccount ? undefined : (values.bookingId || undefined),
        onAccount: Boolean(values.onAccount),
      });
      if (receiptFile && res.data?.id) {
        await paymentsApi.uploadCustomerReceipt(res.data.id, receiptFile);
      }
      setModalOpen(false);
      setReceiptFile(null);
      setPrefillBooking(null);
      if (bookingIdParam) setSearchParams({});
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

  const handleReceiptUpload = async (row, file) => {
    if (!file) return;
    try {
      await paymentsApi.uploadCustomerReceipt(row.id, file);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Receipt upload failed');
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
    { key: 'receipt', label: 'Receipt', render: (r) => r.receiptUrl ? (
      <a href={r.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline">View</a>
    ) : '—' },
    { key: 'status', label: 'Status', render: (r) => <span className="capitalize">{r.status}</span> },
    {
      key: 'actions',
      label: '',
      render: (r) => can('payments:customer') ? (
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
      {prefillBooking && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          <span>
            Recording payment for booking <strong>{prefillBooking.bookingNumber}</strong>
            {prefillBooking.customerDue > 0 && <> — due ৳{prefillBooking.customerDue.toLocaleString()}</>}
          </span>
          <Link to={`/bookings/${prefillBooking.id}`} className="text-brand-700 hover:underline">View booking</Link>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{instantMode && showRecordButton ? 'Instant Payment' : title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        {showRecordButton && can('payments:customer') && (
          <button type="button" onClick={() => { setError(''); setModalOpen(true); }} className="btn-primary">Record Payment</button>
        )}
      </div>

      <div className="card p-0">
        <DataTable columns={columns} data={items} loading={loading} emptyTitle="No customer payments" emptyDescription="Record a payment when a customer pays." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPrefillBooking(null);
          if (bookingIdParam) setSearchParams({});
        }}
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

export default function CustomerPaymentsPage() {
  return <CustomerPaymentsList />;
}
