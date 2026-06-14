import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookingsApi, ordersApi, customersApi, suppliersApi } from '../services/crm.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS } from '../utils/constants';

const schema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  supplierId: z.string().optional(),
  airline: z.string().min(2),
  route: z.string().min(2),
  sector: z.string().optional(),
  departureDate: z.string().min(1),
  returnDate: z.string().optional(),
  passengerCount: z.coerce.number().min(1),
  pnr: z.string().optional(),
  ticketNumber: z.string().optional(),
  purchasePrice: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  directCosts: z.coerce.number().min(0),
  amountPaid: z.coerce.number().min(0),
  supplierPaid: z.coerce.number().min(0),
  notes: z.string().optional(),
  status: z.enum(['draft', 'confirmed', 'ticket_issued', 'delivered', 'completed', 'cancelled']),
  ticketCopyPath: z.string().optional(),
  ticketCopyFileName: z.string().optional(),
});

export default function BookingFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [loadingOrder, setLoadingOrder] = useState(!!orderId);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      passengerCount: 1,
      purchasePrice: 0,
      salePrice: 0,
      directCosts: 0,
      amountPaid: 0,
      supplierPaid: 0,
      status: 'confirmed',
    },
  });

  useEffect(() => {
    Promise.all([
      customersApi.list({ limit: 100 }),
      suppliersApi.list({ limit: 100 }),
    ]).then(([cRes, sRes]) => {
      setCustomers(cRes.data.data);
      setSuppliers(sRes.data.data);
    });
  }, []);

  useEffect(() => {
    if (!orderId) return;
    setLoadingOrder(true);
    ordersApi.get(orderId).then(({ data }) => {
      const o = data.data;
      form.reset({
        customerId: o.customerDetails?.id || o.customer || '',
        airline: `${o.fromDestination}-${o.toDestination}`,
        route: `${o.fromDestination} → ${o.toDestination}`,
        departureDate: o.journeyDate?.slice(0, 10),
        returnDate: o.returnDate?.slice(0, 10) || '',
        passengerCount: o.passengerCount,
        salePrice: o.quotedSalePrice || 0,
        purchasePrice: 0,
        directCosts: 0,
        amountPaid: 0,
        supplierPaid: 0,
        notes: o.internalNotes || '',
        status: 'confirmed',
      });
    }).finally(() => setLoadingOrder(false));
  }, [orderId, form]);

  const watchPrices = form.watch(['purchasePrice', 'salePrice', 'directCosts', 'amountPaid', 'supplierPaid']);
  const profit = (watchPrices[1] || 0) - (watchPrices[0] || 0) - (watchPrices[2] || 0);
  const customerDue = Math.max(0, (watchPrices[1] || 0) - (watchPrices[3] || 0));
  const supplierPayable = Math.max(0, (watchPrices[0] || 0) + (watchPrices[2] || 0) - (watchPrices[4] || 0));

  const onSubmit = async (values) => {
    setError('');
    try {
      const payload = { ...values, supplierId: values.supplierId || undefined };
      if (orderId) {
        const { data } = await bookingsApi.createFromOrder(orderId, payload);
        navigate(`/bookings/${data.data.id}`);
      } else {
        const { data } = await bookingsApi.create(payload);
        navigate(`/bookings/${data.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    }
  };

  if (loadingOrder) return <LoadingSpinner className="py-20" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/bookings" className="text-sm text-brand-600 hover:underline">← Back to Bookings</Link>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          {orderId ? 'Create Booking from Order' : 'New Booking'}
        </h2>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="card space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Customer *</label>
            <select className="input-field" {...form.register('customerId')}>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
            {form.formState.errors.customerId && <p className="mt-1 text-xs text-red-600">{form.formState.errors.customerId.message}</p>}
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
          <div><label className="mb-1 block text-sm font-medium">Airline *</label><input className="input-field" {...form.register('airline')} /></div>
          <div><label className="mb-1 block text-sm font-medium">Route *</label><input className="input-field" {...form.register('route')} /></div>
          <div><label className="mb-1 block text-sm font-medium">Departure Date *</label><input type="date" className="input-field" {...form.register('departureDate')} /></div>
          <div><label className="mb-1 block text-sm font-medium">Return Date</label><input type="date" className="input-field" {...form.register('returnDate')} /></div>
          <div><label className="mb-1 block text-sm font-medium">Passengers</label><input type="number" min={1} className="input-field" {...form.register('passengerCount')} /></div>
          <div><label className="mb-1 block text-sm font-medium">Status</label>
            <select className="input-field" {...form.register('status')}>
              {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div><label className="mb-1 block text-sm font-medium">PNR</label><input className="input-field" {...form.register('pnr')} /></div>
          <div><label className="mb-1 block text-sm font-medium">Ticket Number</label><input className="input-field" {...form.register('ticketNumber')} /></div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Pricing</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div><label className="mb-1 block text-xs font-medium">Purchase Price</label><input type="number" className="input-field" {...form.register('purchasePrice')} /></div>
            <div><label className="mb-1 block text-xs font-medium">Sale Price</label><input type="number" className="input-field" {...form.register('salePrice')} /></div>
            <div><label className="mb-1 block text-xs font-medium">Direct Costs</label><input type="number" className="input-field" {...form.register('directCosts')} /></div>
            <div><label className="mb-1 block text-xs font-medium">Amount Paid (Customer)</label><input type="number" className="input-field" {...form.register('amountPaid')} /></div>
            <div><label className="mb-1 block text-xs font-medium">Supplier Paid</label><input type="number" className="input-field" {...form.register('supplierPaid')} /></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-slate-500">Profit</p><p className="text-lg font-bold text-green-700">৳{profit.toLocaleString()}</p></div>
            <div><p className="text-xs text-slate-500">Customer Due</p><p className="text-lg font-bold text-red-600">৳{customerDue.toLocaleString()}</p></div>
            <div><p className="text-xs text-slate-500">Supplier Payable</p><p className="text-lg font-bold text-amber-700">৳{supplierPayable.toLocaleString()}</p></div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Ticket Copy (placeholder path)</label>
          <input className="input-field" placeholder="File upload coming in later phase" {...form.register('ticketCopyPath')} />
          <p className="mt-1 text-xs text-slate-400">Multer upload will replace this field in a future phase.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea rows={3} className="input-field" {...form.register('notes')} />
        </div>

        <div className="flex justify-end gap-2">
          <Link to="/bookings" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">Create Booking</button>
        </div>
      </form>
    </div>
  );
}
