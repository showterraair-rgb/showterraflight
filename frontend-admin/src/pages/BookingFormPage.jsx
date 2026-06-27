import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookingsApi, customersApi } from '../services/crm.api';
import { accountsApi } from '../services/finance.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useCurrency } from '../hooks/useCurrency';
import { useFieldPermission } from '../hooks/useFieldPermission';
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS } from '../utils/constants';
import { ACCOUNT_TYPE_LABELS } from '../utils/finance';

const baseSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  airline: z.string().min(2, 'Airline name required'),
  route: z.string().min(2, 'Route is required'),
  departureDate: z.string().min(1, 'Departure date required'),
  passengerCount: z.coerce.number().min(1).max(20),
  pnr: z.string().optional(),
  ticketNumber: z.string().optional(),
  purchasePriceBRL: z.coerce.number().min(0),
  salePriceBRL: z.coerce.number().min(0.01, 'Sale price required'),
  bdtRate: z.coerce.number().positive('BDT rate must be greater than 0'),
  notes: z.string().optional(),
  status: z.enum(['draft', 'confirmed', 'ticket_issued', 'delivered', 'completed', 'cancelled']),
});

const createSchema = baseSchema.extend({
  paymentMode: z.enum(['full', 'due']).default('due'),
  customerPaymentAccountId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.paymentMode === 'full' && !data.customerPaymentAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select payment account for full pay',
      path: ['customerPaymentAccountId'],
    });
  }
});

const EMPTY_PASSENGER = {
  fullName: '',
  email: '',
  phone: '',
  passengerType: 'ADULT',
};

function parseRoute(route) {
  const trimmed = String(route || '').trim();
  const match = trimmed.match(/^(.+?)\s*(?:→|->|—|-)\s*(.+)$/);
  if (match) {
    return { fromDestination: match[1].trim(), toDestination: match[2].trim() };
  }
  const codes = trimmed.match(/^([A-Z]{3})\s*-\s*([A-Z]{3})$/i);
  if (codes) {
    return { fromDestination: codes[1].toUpperCase(), toDestination: codes[2].toUpperCase() };
  }
  return { fromDestination: trimmed, toDestination: trimmed };
}

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function brlFromStored(booking, field, rate) {
  const p = booking.pricing;
  if (p) {
    if (field === 'purchase') return p.purchasePriceBRL ?? 0;
    if (field === 'sale') return p.salePriceBRL ?? 0;
  }
  if (booking.originalCurrency === 'BRL') {
    if (field === 'purchase') return booking.originalPurchasePrice ?? booking.purchasePrice ?? 0;
    if (field === 'sale') return booking.originalSalePrice ?? booking.salePrice ?? 0;
  }
  const bdt = field === 'purchase' ? booking.purchasePrice : booking.salePrice;
  return rate > 0 ? Number(bdt || 0) / rate : Number(bdt || 0);
}

function bdtFromBrl(brl, rate) {
  return Number((Number(brl || 0) * rate).toFixed(2));
}

function brlFromBdt(bdt, rate) {
  return rate > 0 ? Number((Number(bdt || 0) / rate).toFixed(2)) : 0;
}

export default function BookingFormPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEdit = Boolean(editId);
  const { brlRate } = useCurrency();
  const financeFields = useFieldPermission('finance');
  const paymentFields = useFieldPermission('payments');
  const statusFields = useFieldPermission('status');
  const notesFields = useFieldPermission('notes');

  const [loadingData, setLoadingData] = useState(isEdit);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [rateError, setRateError] = useState('');
  const [ticketFile, setTicketFile] = useState(null);
  const [existingTicket, setExistingTicket] = useState(null);
  const [passengers, setPassengers] = useState([{ ...EMPTY_PASSENGER }]);
  const [saleBDT, setSaleBDT] = useState('');
  const [purchaseBDT, setPurchaseBDT] = useState('');
  const [duePaymentAt, setDuePaymentAt] = useState('');

  const form = useForm({
    resolver: zodResolver(isEdit ? baseSchema : createSchema),
    defaultValues: {
      passengerCount: 1,
      purchasePriceBRL: 0,
      salePriceBRL: 0,
      bdtRate: brlRate,
      status: 'confirmed',
      paymentMode: 'due',
      customerPaymentAccountId: '',
    },
  });

  useEffect(() => {
    if (brlRate && !form.getValues('bdtRate')) {
      form.setValue('bdtRate', brlRate);
    }
  }, [brlRate, form]);

  useEffect(() => {
    Promise.all([
      customersApi.list({ limit: 100, isActive: 'true' }),
      accountsApi.list(),
    ])
      .then(([cRes, aRes]) => {
        setCustomers(cRes.data.data || []);
        setAccounts((aRes.data.data || []).filter((a) => a.isActive !== false));
      })
      .catch((err) => {
        setLoadError(err.response?.data?.message || 'Could not load form data');
      });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoadingData(true);
    bookingsApi.get(editId)
      .then(({ data }) => {
        const b = data.data;
        const rate = b.bdtRateAtBooking ?? b.exchangeRateAtBooking ?? b.pricing?.bdtRateAtBooking ?? brlRate;
        const saleBrl = brlFromStored(b, 'sale', rate);
        const purchaseBrl = brlFromStored(b, 'purchase', rate);
        form.reset({
          customerId: b.customer || '',
          airline: b.airline,
          route: b.route,
          departureDate: b.departureDate?.slice(0, 10),
          passengerCount: b.passengerCount,
          pnr: b.pnr || '',
          ticketNumber: b.ticketNumber || '',
          purchasePriceBRL: purchaseBrl,
          salePriceBRL: saleBrl,
          bdtRate: rate,
          notes: b.notes || '',
          status: b.status,
        });
        setSaleBDT(String(bdtFromBrl(saleBrl, rate)));
        setPurchaseBDT(String(bdtFromBrl(purchaseBrl, rate)));
        setExistingTicket(b.ticketCopyUrl ? { url: b.ticketCopyUrl, name: b.ticketCopyFileName } : null);
        if (b.passengers?.length) {
          setPassengers(b.passengers.map((p) => ({
            fullName: p.fullName || '',
            email: p.email || '',
            phone: p.phone || '',
            passengerType: p.passengerType || 'ADULT',
          })));
        } else if (b.passengerCount > 1) {
          setPassengers(Array.from({ length: b.passengerCount }, () => ({ ...EMPTY_PASSENGER })));
        }
        if (b.customerName) {
          setCustomers((prev) => {
            if (prev.some((c) => c.id === b.customer)) return prev;
            return [{ id: b.customer, name: b.customerName, phone: b.customerPhone }, ...prev];
          });
        }
        setPaymentSummary({
          amountPaid: b.amountPaid || 0,
          customerDue: b.computed?.customerDue ?? b.customerDue ?? 0,
        });
        if (b.duePaymentAt) {
          const d = new Date(b.duePaymentAt);
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
          setDuePaymentAt(local.toISOString().slice(0, 16));
        }
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Failed to load booking'))
      .finally(() => setLoadingData(false));
  }, [editId, isEdit, form, brlRate]);

  const effectiveRate = Number(form.watch('bdtRate') || brlRate) || 0;
  const saleBRL = Number(form.watch('salePriceBRL')) || 0;
  const purchaseBRL = Number(form.watch('purchasePriceBRL')) || 0;
  const paymentMode = form.watch('paymentMode');
  const passengerCount = Number(form.watch('passengerCount')) || 1;

  useEffect(() => {
    setPassengers((prev) => {
      if (prev.length === passengerCount) return prev;
      if (prev.length < passengerCount) {
        return [...prev, ...Array.from({ length: passengerCount - prev.length }, () => ({ ...EMPTY_PASSENGER }))];
      }
      return prev.slice(0, passengerCount);
    });
  }, [passengerCount]);

  const updatePassenger = (index, field, value) => {
    setPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const syncSaleFromBdt = (bdt) => {
    setSaleBDT(bdt);
    const brl = brlFromBdt(bdt, effectiveRate);
    form.setValue('salePriceBRL', brl, { shouldValidate: true });
  };

  const syncSaleFromBrl = (brl) => {
    form.setValue('salePriceBRL', Number(brl) || 0, { shouldValidate: true });
    setSaleBDT(String(bdtFromBrl(brl, effectiveRate) || ''));
  };

  const syncPurchaseFromBdt = (bdt) => {
    setPurchaseBDT(bdt);
    form.setValue('purchasePriceBRL', brlFromBdt(bdt, effectiveRate));
  };

  const syncPurchaseFromBrl = (brl) => {
    form.setValue('purchasePriceBRL', Number(brl) || 0);
    setPurchaseBDT(String(bdtFromBrl(brl, effectiveRate) || ''));
  };

  const onRateChange = (rate) => {
    form.setValue('bdtRate', rate);
    setRateError(rate > 0 ? '' : 'BDT rate must be greater than 0');
    if (saleBRL) setSaleBDT(String(bdtFromBrl(saleBRL, rate)));
    if (purchaseBRL) setPurchaseBDT(String(bdtFromBrl(purchaseBRL, rate)));
  };

  const profitBRL = saleBRL - purchaseBRL;
  const profitBDT = profitBRL * effectiveRate;
  const customerDueBDT = isEdit
    ? Math.max(0, paymentSummary?.customerDue || 0)
    : paymentMode === 'full' ? 0 : saleBRL * effectiveRate;

  const accountLabel = (a) => `${a.name} (${ACCOUNT_TYPE_LABELS[a.type] || a.type})`;

  const onSubmit = async (values) => {
    if (!effectiveRate || effectiveRate <= 0) {
      setRateError('BDT rate must be greater than 0');
      return;
    }
    const filledPassengers = passengers
      .filter((p) => p.fullName?.trim())
      .map((p) => ({
        fullName: p.fullName.trim(),
        email: p.email?.trim() || undefined,
        phone: p.phone?.trim() || undefined,
        passengerType: p.passengerType || 'ADULT',
      }));
    if (!filledPassengers.length) {
      setError('Add at least one passenger name');
      return;
    }

    setError('');
    try {
      const { fromDestination, toDestination } = parseRoute(values.route);
      const payload = {
        customerId: values.customerId,
        airline: values.airline,
        route: values.route,
        sector: `${fromDestination}-${toDestination}`,
        fromDestination,
        toDestination,
        departureDate: values.departureDate,
        passengerCount: values.passengerCount,
        passengers: filledPassengers,
        pnr: values.pnr || undefined,
        ticketNumber: values.ticketNumber || undefined,
        purchasePriceBRL: values.purchasePriceBRL,
        salePriceBRL: values.salePriceBRL,
        directCostsBRL: 0,
        bdtRate: values.bdtRate,
        notes: values.notes || undefined,
        status: values.status,
        productCategory: 'air',
        journeyType: 'one_way',
        travelClass: 'economy',
        duePaymentAt: values.paymentMode === 'due' && duePaymentAt ? duePaymentAt : undefined,
      };

      if (!isEdit) {
        payload.customerPaymentStatus = values.paymentMode === 'full' ? 'paid' : 'due';
        payload.customerPaidAmountBRL = values.paymentMode === 'full' ? values.salePriceBRL : 0;
        payload.customerPaymentAccountId = values.paymentMode === 'full'
          ? values.customerPaymentAccountId
          : undefined;
        payload.supplierPaymentStatus = 'due';
        payload.supplierPaidAmountBRL = 0;
      }

      if (isEdit) {
        await bookingsApi.update(editId, payload);
        if (ticketFile) await bookingsApi.uploadTicket(editId, ticketFile);
        navigate(`/bookings/${editId}`);
      } else {
        const { data } = await bookingsApi.create(payload);
        const bookingId = data.data.id;
        if (ticketFile) await bookingsApi.uploadTicket(bookingId, ticketFile);
        navigate(`/bookings/${bookingId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || (isEdit ? 'Failed to update booking' : 'Failed to create booking'));
    }
  };

  if (loadingData) return <LoadingSpinner className="py-20" />;

  const backLink = isEdit ? `/bookings/${editId}` : '/bookings';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to={backLink} className="text-sm text-brand-600 hover:underline">← Back</Link>
        <h2 className="mt-2 text-xl font-bold text-slate-900">{isEdit ? 'Edit Booking' : 'New Booking'}</h2>
        {!isEdit && (
          <p className="mt-1 text-sm text-slate-500">
            No customer yet?{' '}
            <Link to="/customers" className="font-medium text-brand-600 hover:underline">Add a customer first</Link>
          </p>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="card space-y-6">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {loadError && <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{loadError}</div>}

        {/* Customer */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Customer</h3>
          <div>
            <label className="mb-1 block text-sm font-medium">Select Customer *</label>
            <select className="input-field" {...form.register('customerId')}>
              <option value="">Choose customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
            {form.formState.errors.customerId && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.customerId.message}</p>
            )}
          </div>
        </section>

        {/* Flight */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Flight Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Airline Name *</label>
              <input className="input-field" placeholder="e.g. Biman Bangladesh Airlines" {...form.register('airline')} />
              {form.formState.errors.airline && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.airline.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Route *</label>
              <input className="input-field uppercase" placeholder="e.g. DAC - DXB" {...form.register('route')} />
              {form.formState.errors.route && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.route.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Departure Date *</label>
              <input type="date" className="input-field" {...form.register('departureDate')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">PNR</label>
              <input className="input-field" placeholder="Booking reference" {...form.register('pnr')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Ticket Number</label>
              <input className="input-field" placeholder="E-ticket number" {...form.register('ticketNumber')} />
            </div>
            {statusFields.hidden ? null : (
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select className="input-field" disabled={statusFields.readOnly} {...form.register('status')}>
                  {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Passengers */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Passengers</h3>
            <div className="w-24">
              <label className="mb-1 block text-xs font-medium text-slate-500">Count</label>
              <input type="number" min={1} max={20} className="input-field" {...form.register('passengerCount')} />
            </div>
          </div>
          <div className="space-y-3">
            {passengers.map((p, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Passenger {idx + 1}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium">Full Name *</label>
                    <input
                      className="input-field"
                      value={p.fullName}
                      onChange={(e) => updatePassenger(idx, 'fullName', e.target.value)}
                      placeholder="As on passport"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Email</label>
                    <input
                      type="email"
                      className="input-field"
                      value={p.email}
                      onChange={(e) => updatePassenger(idx, 'email', e.target.value)}
                      placeholder="passenger@email.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Phone</label>
                    <input
                      type="tel"
                      className="input-field"
                      value={p.phone}
                      onChange={(e) => updatePassenger(idx, 'phone', e.target.value)}
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Type</label>
                    <select
                      className="input-field"
                      value={p.passengerType}
                      onChange={(e) => updatePassenger(idx, 'passengerType', e.target.value)}
                    >
                      <option value="ADULT">Adult</option>
                      <option value="CHILD">Child</option>
                      <option value="INFANT">Infant</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        {!financeFields.hidden && (
          <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Ticket Price</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Sale Price (BDT) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">৳</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input-field pl-7"
                    value={saleBDT}
                    disabled={financeFields.readOnly}
                    onChange={(e) => syncSaleFromBdt(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Sale Price (BRL) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input-field pl-9"
                    disabled={financeFields.readOnly}
                    {...form.register('salePriceBRL', {
                      onChange: (e) => syncSaleFromBrl(e.target.value),
                    })}
                  />
                </div>
                {form.formState.errors.salePriceBRL && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.salePriceBRL.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Purchase / Cost (BDT)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">৳</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input-field pl-7"
                    value={purchaseBDT}
                    disabled={financeFields.readOnly}
                    onChange={(e) => syncPurchaseFromBdt(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Purchase / Cost (BRL)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input-field pl-9"
                    disabled={financeFields.readOnly}
                    {...form.register('purchasePriceBRL', {
                      onChange: (e) => syncPurchaseFromBrl(e.target.value),
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
              <span className="text-sm text-slate-600">1 BRL = ৳</span>
              <input
                type="number"
                min={0.01}
                step="0.01"
                className="input-field w-28"
                disabled={financeFields.readOnly}
                {...form.register('bdtRate', { onChange: (e) => onRateChange(Number(e.target.value)) })}
              />
              {rateError && <p className="text-xs text-red-600">{rateError}</p>}
            </div>

            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-slate-500">Profit: </span>
                <span className="font-semibold text-green-700">৳ {fmt(profitBDT)} / R$ {fmt(profitBRL)}</span>
              </div>
              {isEdit && paymentSummary && (
                <div>
                  <span className="text-slate-500">Customer due: </span>
                  <span className="font-semibold text-amber-700">৳ {fmt(customerDueBDT)}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Payment */}
        {!isEdit && !paymentFields.hidden && (
          <section className="space-y-3 rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Payment</h3>
            <div className="flex gap-3">
              <label className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-3 text-sm font-medium transition ${paymentMode === 'full' ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                <input type="radio" value="full" className="sr-only" {...form.register('paymentMode')} />
                Full Pay
              </label>
              <label className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-3 text-sm font-medium transition ${paymentMode === 'due' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                <input type="radio" value="due" className="sr-only" {...form.register('paymentMode')} />
                Due Pay
              </label>
            </div>

            {paymentMode === 'full' ? (
              <div>
                <label className="mb-1 block text-sm font-medium">Receive into account *</label>
                <select className="input-field" {...form.register('customerPaymentAccountId')}>
                  <option value="">Select bank / cash / MFS account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{accountLabel(a)}</option>
                  ))}
                </select>
                {form.formState.errors.customerPaymentAccountId && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.customerPaymentAccountId.message}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Full amount ৳ {fmt(saleBRL * effectiveRate)} (R$ {fmt(saleBRL)}) will be recorded as paid.
                </p>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium">Due Payment Date (optional)</label>
                <input
                  type="datetime-local"
                  className="input-field max-w-xs"
                  value={duePaymentAt}
                  onChange={(e) => setDuePaymentAt(e.target.value)}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Customer owes ৳ {fmt(saleBRL * effectiveRate)} — collect later from Payments.
                </p>
              </div>
            )}
          </section>
        )}

        {isEdit && paymentSummary && (
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            To record payments, use{' '}
            <Link to="/payments/customers" className="font-medium underline">Customer Payments</Link>.
          </div>
        )}

        {/* Ticket attachment (no OCR) */}
        <section className="space-y-2">
          <label className="block text-sm font-medium">Ticket Copy (optional)</label>
          <p className="text-xs text-slate-500">Attach PDF or image for records — does not auto-fill fields.</p>
          {existingTicket?.url && (
            <a href={existingTicket.url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-medium text-brand-600 hover:underline">
              {existingTicket.name || 'View current ticket'}
            </a>
          )}
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
            onChange={(e) => setTicketFile(e.target.files?.[0] || null)}
          />
          {ticketFile && <p className="text-xs text-slate-500">Selected: {ticketFile.name}</p>}
        </section>

        {!notesFields.hidden && (
          <div>
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea rows={2} disabled={notesFields.readOnly} className="input-field" placeholder="Internal notes" {...form.register('notes')} />
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Link to={backLink} className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={Boolean(loadError)}>
            {isEdit ? 'Save Changes' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}
