import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookingsApi, customersApi, suppliersApi } from '../services/crm.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DualCurrencyAmount from '../components/common/DualCurrencyAmount';
import { useCurrency } from '../hooks/useCurrency';
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS } from '../utils/constants';

const schema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  supplierId: z.string().optional(),
  airline: z.string().min(2),
  route: z.string().min(2, 'Route is required'),
  sector: z.string().optional(),
  departureDate: z.string().min(1),
  passengerCount: z.coerce.number().min(1),
  pnr: z.string().optional(),
  ticketNumber: z.string().optional(),
  purchasePriceBRL: z.coerce.number().min(0),
  salePriceBRL: z.coerce.number().min(0),
  directCostsBRL: z.coerce.number().min(0),
  bdtRate: z.coerce.number().positive('BDT rate must be greater than 0'),
  notes: z.string().optional(),
  status: z.enum(['draft', 'confirmed', 'ticket_issued', 'delivered', 'completed', 'cancelled']),
});

function parseRoute(route) {
  const trimmed = String(route || '').trim();
  const match = trimmed.match(/^(.+?)\s*(?:→|->|—|-)\s*(.+)$/);
  if (match) {
    return { fromDestination: match[1].trim(), toDestination: match[2].trim() };
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
    return p.directCostsBRL ?? 0;
  }
  if (booking.originalCurrency === 'BRL') {
    if (field === 'purchase') return booking.originalPurchasePrice ?? booking.purchasePrice ?? 0;
    if (field === 'sale') return booking.originalSalePrice ?? booking.salePrice ?? 0;
    return booking.originalDirectCosts ?? booking.directCosts ?? 0;
  }
  const bdt = field === 'purchase' ? booking.purchasePrice : field === 'sale' ? booking.salePrice : booking.directCosts;
  return rate > 0 ? Number(bdt || 0) / rate : Number(bdt || 0);
}

export default function BookingFormPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEdit = Boolean(editId);
  const { brlRate } = useCurrency();

  const [loadingData, setLoadingData] = useState(isEdit);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [travelMeta, setTravelMeta] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [rateError, setRateError] = useState('');
  const [ticketFile, setTicketFile] = useState(null);
  const [existingTicket, setExistingTicket] = useState(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      passengerCount: 1,
      purchasePriceBRL: 0,
      salePriceBRL: 0,
      directCostsBRL: 0,
      bdtRate: brlRate,
      status: 'confirmed',
    },
  });

  useEffect(() => {
    if (brlRate && !form.getValues('bdtRate')) {
      form.setValue('bdtRate', brlRate);
    }
  }, [brlRate, form]);

  const mergeCustomer = (list, extra) => {
    if (!extra?.id) return list;
    if (list.some((c) => c.id === extra.id)) return list;
    return [{ id: extra.id, name: extra.name, phone: extra.phone }, ...list];
  };

  useEffect(() => {
    setLoadError('');
    Promise.all([
      customersApi.list({ limit: 100, isActive: 'true' }),
      suppliersApi.list({ limit: 100 }),
    ])
      .then(([cRes, sRes]) => {
        setCustomers(cRes.data.data || []);
        setSuppliers(sRes.data.data || []);
      })
      .catch((err) => {
        setCustomers([]);
        setSuppliers([]);
        setLoadError(err.response?.data?.message || 'Could not load customers or suppliers');
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoadingData(true);
      bookingsApi.get(editId)
        .then(({ data }) => {
          const b = data.data;
          const rate = b.bdtRateAtBooking ?? b.exchangeRateAtBooking ?? b.pricing?.bdtRateAtBooking ?? brlRate;
          form.reset({
            customerId: b.customer || '',
            supplierId: b.supplier || '',
            airline: b.airline,
            route: b.route,
            sector: b.sector || '',
            departureDate: b.departureDate?.slice(0, 10),
            passengerCount: b.passengerCount,
            pnr: b.pnr || '',
            ticketNumber: b.ticketNumber || '',
            purchasePriceBRL: brlFromStored(b, 'purchase', rate),
            salePriceBRL: brlFromStored(b, 'sale', rate),
            directCostsBRL: brlFromStored(b, 'direct', rate),
            bdtRate: rate,
            notes: b.notes || '',
            status: b.status,
          });
          setExistingTicket(b.ticketCopyUrl ? { url: b.ticketCopyUrl, name: b.ticketCopyFileName } : null);
          setTravelMeta({
            journeyType: b.journeyType || 'one_way',
            travelClass: b.travelClass || 'economy',
            returnDate: b.returnDate?.slice(0, 10) || '',
          });
          if (b.customerName) {
            setCustomers((prev) => mergeCustomer(prev, {
              id: b.customer,
              name: b.customerName,
              phone: b.customerPhone,
            }));
          }
          setPaymentSummary({
            amountPaid: b.amountPaid || 0,
            supplierPaid: b.supplierPaid || 0,
            customerDue: b.computed?.customerDue ?? b.customerDue ?? 0,
            supplierPayable: b.computed?.supplierPayable ?? b.supplierPayable ?? 0,
          });
        })
        .catch((err) => setLoadError(err.response?.data?.message || 'Failed to load booking'))
        .finally(() => setLoadingData(false));
    }
  }, [editId, isEdit, form, brlRate]);

  const watchPrices = form.watch(['purchasePriceBRL', 'salePriceBRL', 'directCostsBRL', 'bdtRate']);
  const purchaseBRL = Number(watchPrices[0]) || 0;
  const saleBRL = Number(watchPrices[1]) || 0;
  const costsBRL = Number(watchPrices[2]) || 0;
  const effectiveRate = Number(watchPrices[3] || brlRate) || 0;

  const profitBRL = saleBRL - purchaseBRL - costsBRL;
  const profitBDT = profitBRL * effectiveRate;
  const saleBDT = saleBRL * effectiveRate;
  const projectedDueBDT = Math.max(0, saleBDT - (paymentSummary?.amountPaid || 0));
  const projectedDueBRL = effectiveRate > 0 ? projectedDueBDT / effectiveRate : projectedDueBDT;
  const projectedPayableBDT = Math.max(0, (purchaseBRL + costsBRL) * effectiveRate - (paymentSummary?.supplierPaid || 0));
  const projectedPayableBRL = effectiveRate > 0 ? projectedPayableBDT / effectiveRate : projectedPayableBDT;

  const onSubmit = async (values) => {
    if (!effectiveRate || effectiveRate <= 0) {
      setRateError('BDT rate must be greater than 0');
      return;
    }
    setError('');
    try {
      const { fromDestination, toDestination } = parseRoute(values.route);
      const payload = {
        ...values,
        supplierId: values.supplierId || undefined,
        customerId: values.customerId || undefined,
        journeyType: travelMeta?.journeyType || 'one_way',
        travelClass: travelMeta?.travelClass || 'economy',
        returnDate: travelMeta?.returnDate || undefined,
        fromDestination,
        toDestination,
      };
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
  const title = isEdit ? 'Edit Booking' : 'New Booking';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to={backLink} className="text-sm text-brand-600 hover:underline">← Back</Link>
        <h2 className="mt-2 text-xl font-bold text-slate-900">{title}</h2>
        {!isEdit && (
          <p className="mt-1 text-sm text-slate-500">
            No customer yet?{' '}
            <Link to="/customers" className="font-medium text-brand-600 hover:underline">Add a customer first</Link>
          </p>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="card space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {loadError && <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{loadError}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Customer *</label>
            <select className="input-field" {...form.register('customerId')}>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
            {form.formState.errors.customerId && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.customerId.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Supplier / Agent</label>
            <select className="input-field" {...form.register('supplierId')}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Airline / Carrier *</label>
            <input className="input-field" placeholder="e.g. Emirates, Biman" {...form.register('airline')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Route *</label>
            <input className="input-field uppercase" placeholder="e.g. DAC → DXB" {...form.register('route')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Sector</label>
            <input className="input-field" {...form.register('sector')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Departure Date *</label>
            <input type="date" className="input-field" {...form.register('departureDate')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Passengers</label>
            <input type="number" min={1} className="input-field" {...form.register('passengerCount')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select className="input-field" {...form.register('status')}>
              {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">PNR</label>
            <input className="input-field" {...form.register('pnr')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Ticket Number</label>
            <input className="input-field" {...form.register('ticketNumber')} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Pricing (BRL)</h3>
          <p className="mt-1 text-xs text-slate-500">
            Enter amounts in BRL. Customer and supplier payments are recorded separately under Payments.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Purchase Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                <input type="number" min={0} step="0.01" className="input-field pl-9" {...form.register('purchasePriceBRL')} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Sale Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                <input type="number" min={0} step="0.01" className="input-field pl-9" {...form.register('salePriceBRL')} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Direct Costs</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                <input type="number" min={0} step="0.01" className="input-field pl-9" {...form.register('directCostsBRL')} />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
            <label className="mb-1 block text-xs font-medium">BDT Exchange Rate *</label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600">1 BRL = ৳</span>
              <input
                type="number"
                min={0.01}
                step="0.01"
                className="input-field w-28"
                {...form.register('bdtRate', {
                  onChange: (e) => setRateError(Number(e.target.value) > 0 ? '' : 'BDT rate must be greater than 0'),
                })}
              />
            </div>
            {rateError && <p className="mt-1 text-xs text-red-600">{rateError}</p>}
            <p className="mt-2 text-xs text-slate-500">100 BRL = ৳ {fmt(100 * effectiveRate)} at this rate</p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Est. Profit</p>
              <DualCurrencyAmount totalBRL={profitBRL} totalBDT={profitBDT} size="lg" className="mt-1 text-green-700" />
            </div>
            {isEdit && paymentSummary ? (
              <>
                <div>
                  <p className="text-xs text-slate-500">Customer Due</p>
                  <DualCurrencyAmount totalBRL={projectedDueBRL} totalBDT={projectedDueBDT} size="md" className="mt-1" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Supplier Payable</p>
                  <DualCurrencyAmount totalBRL={projectedPayableBRL} totalBDT={projectedPayableBDT} size="md" className="mt-1" />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2 flex items-center text-xs text-slate-500">
                Record payments after creating the booking
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">Rate used: 1 BRL = ৳ {fmt(effectiveRate)}</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Original Ticket</label>
          <p className="mb-2 text-xs text-slate-500">Upload PDF or image of the issued ticket. Included as a download link on the invoice PDF.</p>
          {existingTicket?.url && (
            <a
              href={existingTicket.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 inline-block text-sm font-medium text-brand-600 hover:underline"
            >
              {existingTicket.name || 'View current ticket'}
            </a>
          )}
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            onChange={(e) => setTicketFile(e.target.files?.[0] || null)}
          />
          {ticketFile && (
            <p className="mt-1 text-xs text-slate-500">Selected: {ticketFile.name}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea rows={3} className="input-field" {...form.register('notes')} />
        </div>

        <div className="flex justify-end gap-2">
          <Link to={backLink} className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={Boolean(loadError)}>
            {isEdit ? 'Save Changes' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}
