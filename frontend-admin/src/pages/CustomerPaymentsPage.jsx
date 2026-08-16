import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Check, CreditCard } from 'lucide-react';
import { paymentsApi, accountsApi } from '../services/finance.api';
import { customersApi, bookingsApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import { usePermission } from '../hooks/usePermission';
import { useBP } from '../hooks/useBreakpoint';
import MoneyAmount from '../components/common/MoneyAmount';
import { formatDate } from '../utils/date';
import { PAYMENT_METHODS } from '../utils/finance';
import { FormSection } from '../components/ui/FormPrimitives';
import PrimaryBtn from '../components/ui/PrimaryBtn';
import SummaryStatCard from '../components/common/SummaryStatCard';
import { C, fontDisplay, fontMono, fontSans } from '../theme/tokens';

export function CustomerPaymentsList({
  title = 'Record Receipt',
  description = 'Log an incoming payment — increases account balance',
  showRecordButton = true,
  forceInstantModal = false,
}) {
  const { can } = usePermission();
  const bp = useBP();
  const isNarrow = bp === 'mobile' || bp === 'tablet';
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
  const [error, setError] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const form = useForm({
    defaultValues: {
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Cash',
      amount: 0,
      onAccount: false,
    },
  });

  const selectedCustomer = form.watch('customerId');
  const onAccount = form.watch('onAccount');
  const showInlineForm = showRecordButton && can('payments:customer');
  const [page, setPage] = useState(1);

  const loadPayments = useCallback(async () => {
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

  useEffect(() => { loadPayments(); }, [loadPayments]);

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
    if (!bookingIdParam || !can('payments:customer')) return;
    let cancelled = false;
    bookingsApi.get(bookingIdParam).then(({ data }) => {
      if (cancelled) return;
      const b = data.data;
      setPrefillBooking(b);
      form.setValue('customerId', b.customer || '');
      form.setValue('bookingId', b.id);
      if (b.customerDue > 0) form.setValue('amount', b.customerDue);
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
      setReceiptFile(null);
      setPrefillBooking(null);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      if (bookingIdParam) setSearchParams({});
      form.reset({ paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'Cash', amount: 0, onAccount: false });
      loadPayments();
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
      loadPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Void failed');
    }
  };

  const handleReceiptUpload = async (row, file) => {
    if (!file) return;
    try {
      await paymentsApi.uploadCustomerReceipt(row.id, file);
      loadPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Receipt upload failed');
    }
  };

  const columns = [
    { key: 'number', label: 'Payment #', render: (r) => <span className="font-mono text-xs font-semibold text-sta-teal">{r.paymentNumber}</span> },
    { key: 'customer', label: 'Customer', render: (r) => r.customerName },
    { key: 'booking', label: 'Booking', render: (r) => r.bookingNumber || '—' },
    { key: 'account', label: 'Received In', render: (r) => r.accountName },
    { key: 'amount', label: 'Amount', render: (r) => <MoneyAmount amount={r.amount} size="sm" className="font-medium text-sta-green" /> },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.paymentDate) },
    { key: 'receipt', label: 'Receipt', render: (r) => r.receiptUrl ? (
      <a href={r.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sta-teal hover:underline">View</a>
    ) : '—' },
    { key: 'status', label: 'Status', render: (r) => (
      <StatusBadge status={r.status === 'voided' ? 'cancelled' : r.status === 'completed' || r.status === 'posted' ? 'success' : r.status} label={r.status} />
    ) },
    {
      key: 'actions',
      label: '',
      render: (r) => can('payments:customer') ? (
        <div className="flex flex-col items-start gap-1">
          <label className="cursor-pointer text-xs text-sta-teal hover:underline">
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
          <button type="button" onClick={() => handleVoid(r)} className="text-xs text-sta-red hover:underline">Void</button>
        </div>
      ) : null,
    },
  ];

  const recent = items.slice(0, 6);
  const pageTitle = instantMode && showRecordButton ? 'Instant Payment' : title;
  const pageTotal = items.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const activeCount = items.filter((r) => r.status !== 'voided').length;

  const paymentForm = (
    <form id="customer-payment-form" onSubmit={form.handleSubmit(onSubmit)}>
      {error && (
        <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: C.redLight, color: C.red }}>{error}</div>
      )}
      <FormSection title="Payment Details" icon={<CreditCard size={14} />}>
        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(2, 1fr)', gap: '12px 16px' }}>
          <div style={{ gridColumn: isNarrow ? undefined : 'span 2' }}>
            <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Customer *</label>
            <select className="input-field" {...form.register('customerId', { required: true })}>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Booking *</label>
            <select className="input-field" {...form.register('bookingId')} disabled={onAccount}>
              <option value="">Select booking</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>{b.bookingNumber} — Due ৳{b.customerDue?.toLocaleString()}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm" style={{ color: C.text, ...fontSans }}>
              <input type="checkbox" {...form.register('onAccount')} />
              On-account advance (no booking link)
            </label>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Receiving Account *</label>
            <select className="input-field" {...form.register('accountId', { required: true })}>
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} (৳{a.currentBalance?.toLocaleString()})</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Amount (৳) *</label>
            <input type="number" min="0.01" step="0.01" className="input-field font-mono" {...form.register('amount', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Payment Date *</label>
            <input type="date" className="input-field font-mono" {...form.register('paymentDate', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Method</label>
            <select className="input-field" {...form.register('paymentMethod')}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Reference #</label>
            <input className="input-field font-mono" {...form.register('referenceNumber')} />
          </div>
          <div style={{ gridColumn: isNarrow ? undefined : 'span 2' }}>
            <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Notes</label>
            <textarea rows={2} className="input-field" {...form.register('notes')} />
          </div>
          <div style={{ gridColumn: isNarrow ? undefined : 'span 2' }}>
            <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Receipt (optional)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="block w-full text-sm text-sta-muted file:mr-3 file:rounded-md file:border-0 file:bg-sta-indigo file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            />
            <p className="mt-1 text-xs" style={{ color: C.muted }}>PDF or image, max 8MB</p>
          </div>
        </div>
      </FormSection>

      <div
        className="flex flex-wrap items-center justify-end gap-3 rounded-[10px] border px-5 py-4"
        style={{ background: C.surface, borderColor: C.border }}
      >
        {savedFlash && (
          <span style={{ fontSize: 12, color: C.green, display: 'flex', alignItems: 'center', gap: 4, marginRight: 'auto', ...fontSans }}>
            <Check size={13} /> Saved
          </span>
        )}
        <PrimaryBtn type="submit" label="Record Payment" icon={<Check size={13} />} />
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      {prefillBooking && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border px-4 py-3 text-sm"
          style={{ borderColor: `${C.teal}44`, background: C.tealLight, color: C.indigo }}
        >
          <span>
            Recording payment for booking <strong>{prefillBooking.bookingNumber}</strong>
            {prefillBooking.customerDue > 0 && <> — due ৳{prefillBooking.customerDue.toLocaleString()}</>}
          </span>
          <Link to={`/bookings/${prefillBooking.id}`} className="font-medium hover:underline" style={{ color: C.teal }}>View booking</Link>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: C.indigo, ...fontDisplay }}>{pageTitle}</h2>
          <p className="text-sm" style={{ color: C.muted, ...fontSans }}>{description}</p>
        </div>
        {!showInlineForm && can('payments:customer') && (
          <Link to="/payments/customers" className="btn-primary">Record Receipt</Link>
        )}
      </div>

      {!showInlineForm && (
        <div className="flex flex-wrap gap-3">
          <SummaryStatCard label="On this page" count={items.length} color="teal" />
          <SummaryStatCard label="Active" count={activeCount} color="green" />
          <SummaryStatCard label="Page total" amount={pageTotal} color="green" />
          <SummaryStatCard label="All receipts" count={pagination?.total} color="indigo" />
        </div>
      )}

      {showInlineForm && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isNarrow ? '1fr' : '1fr 340px',
            gap: 20,
            alignItems: 'start',
          }}
        >
          <div>{paymentForm}</div>
          <div>
            <div
              style={{
                fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: 10, ...fontSans,
              }}
            >
              Recent Receipts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recent.length ? recent.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.indigo, ...fontSans }}>{r.customerName}</div>
                      <div style={{ ...fontMono, fontSize: 10, color: C.muted, marginTop: 2 }}>{r.paymentNumber}</div>
                    </div>
                    <span style={{ ...fontMono, fontSize: 13, fontWeight: 700, color: C.green }}>
                      ৳ {Number(r.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 10, color: C.subtle, ...fontSans }}>
                      {r.paymentMethod || r.accountName} · {formatDate(r.paymentDate)}
                    </span>
                    {r.bookingNumber && (
                      <span style={{ ...fontMono, fontSize: 10, color: C.teal }}>{r.bookingNumber}</span>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-sm" style={{ color: C.muted }}>No receipts yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        {showInlineForm && (
          <div
            style={{
              fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 10, ...fontSans,
            }}
          >
            Payment History
          </div>
        )}
        <div className="overflow-hidden rounded-[10px] border border-sta-border bg-sta-surface">
          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            emptyTitle="No customer payments"
            emptyDescription="Record a payment when a customer pays."
          />
          {pagination && (
            <div className="border-t border-sta-border p-4">
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerPaymentsPage() {
  return <CustomerPaymentsList />;
}
