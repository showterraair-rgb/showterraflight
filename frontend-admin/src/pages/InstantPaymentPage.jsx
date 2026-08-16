import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Check, SendHorizonal } from 'lucide-react';
import { paymentsApi, accountsApi } from '../services/finance.api';
import { customersApi, bookingsApi } from '../services/crm.api';
import { usePermission } from '../hooks/usePermission';
import { PAYMENT_METHODS } from '../utils/finance';
import { FormSection } from '../components/ui/FormPrimitives';
import PrimaryBtn from '../components/ui/PrimaryBtn';
import { C, fontDisplay, fontMono, fontSans } from '../theme/tokens';

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InstantPaymentPage() {
  const { can } = usePermission();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const form = useForm({
    defaultValues: {
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Cash',
      amount: '',
      onAccount: false,
    },
  });

  const selectedCustomer = form.watch('customerId');
  const onAccount = form.watch('onAccount');

  useEffect(() => {
    Promise.all([accountsApi.list(), customersApi.list({ limit: 100 })]).then(([aRes, cRes]) => {
      setAccounts(aRes.data.data || []);
      setCustomers(cRes.data.data || []);
    });
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      bookingsApi.list({ customerId: selectedCustomer, limit: 50 }).then(({ data }) => setBookings(data.data || []));
    } else {
      setBookings([]);
    }
  }, [selectedCustomer]);

  if (!can('payments:customer')) {
    return <p className="text-sm text-sta-muted">You do not have permission to record payments.</p>;
  }

  const onSubmit = async (values) => {
    setError('');
    try {
      const payload = {
        ...values,
        amount: Number(values.amount),
        bookingId: values.onAccount ? undefined : (values.bookingId || undefined),
        onAccount: Boolean(values.onAccount),
      };
      const { data: res } = await paymentsApi.createCustomer(payload);
      const payment = res.data;
      const customer = customers.find((c) => c.id === values.customerId);
      setResult({
        amount: payload.amount,
        customerName: customer?.name || 'Customer',
        method: values.paymentMethod,
        paymentNumber: payment?.paymentNumber || '—',
      });
      form.reset({
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'Cash',
        amount: '',
        onAccount: false,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send payment');
    }
  };

  return (
    <div style={{ padding: '8px 0 32px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {result ? (
          <div
            style={{
              background: C.surface, border: `1px solid ${C.green}44`, borderRadius: 12,
              padding: '40px 32px', textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56, height: 56, borderRadius: '50%', background: C.greenLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}
            >
              <Check size={24} color={C.green} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.indigo, ...fontDisplay }}>Payment Recorded</div>
            <div style={{ ...fontMono, fontSize: 22, fontWeight: 700, color: C.green, margin: '12px 0 4px' }}>
              ৳ {fmt(result.amount)}
            </div>
            <div style={{ fontSize: 12, color: C.muted, ...fontSans }}>
              {result.method} · {result.customerName}
            </div>
            <div style={{ ...fontMono, fontSize: 10, color: C.subtle, marginTop: 8 }}>{result.paymentNumber}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setResult(null)}
                style={{
                  padding: '9px 24px', borderRadius: 6, border: `1px solid ${C.border}`,
                  background: C.surface, color: C.muted, fontSize: 13, cursor: 'pointer', ...fontSans,
                }}
              >
                New Payment
              </button>
              <button
                type="button"
                onClick={() => navigate('/payments/history')}
                style={{
                  padding: '9px 24px', borderRadius: 6, border: 'none',
                  background: C.indigo, color: '#fff', fontSize: 13, cursor: 'pointer', ...fontSans,
                }}
              >
                View History
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.indigo, ...fontDisplay }}>Instant Payment</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted, ...fontSans }}>
                Record a customer payment quickly — same ledger as Record Receipt
              </p>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {error && (
                <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: C.redLight, color: C.red }}>{error}</div>
              )}
              <FormSection title="Instant Payment" icon={<SendHorizonal size={14} />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Customer *</label>
                    <select className="input-field" {...form.register('customerId', { required: true })}>
                      <option value="">Select customer</option>
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Amount (৳) *</label>
                    <input type="number" min="0.01" step="0.01" className="input-field font-mono" {...form.register('amount', { required: true })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Payment Method</label>
                    <select className="input-field" {...form.register('paymentMethod')}>
                      {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Receiving Account *</label>
                      <select className="input-field" {...form.register('accountId', { required: true })}>
                        <option value="">Select account</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Booking (optional)</label>
                      <select className="input-field" {...form.register('bookingId')} disabled={onAccount}>
                        <option value="">None</option>
                        {bookings.map((b) => (
                          <option key={b.id} value={b.id}>{b.bookingNumber}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
                    <input type="checkbox" {...form.register('onAccount')} />
                    On-account advance (no booking link)
                  </label>
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Payment Date *</label>
                    <input type="date" className="input-field font-mono" {...form.register('paymentDate', { required: true })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Note</label>
                    <input className="input-field" placeholder="Payment description…" {...form.register('notes')} />
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <PrimaryBtn type="submit" label="Record Payment Now" icon={<SendHorizonal size={13} />} />
                  </div>
                </div>
              </FormSection>
            </form>
            <p className="mt-3 text-center text-xs" style={{ color: C.muted }}>
              Prefer the full form?{' '}
              <Link to="/payments/customers" className="font-medium hover:underline" style={{ color: C.teal }}>Record Receipt</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
