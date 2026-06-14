import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  notes: z.string().optional(),
  status: z.enum(['draft', 'confirmed', 'ticket_issued', 'delivered', 'completed', 'cancelled']),
  ticketCopyPath: z.string().optional(),
  ticketCopyFileName: z.string().optional(),
});

export default function BookingFormPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEdit = Boolean(editId);
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [loadingData, setLoadingData] = useState(isEdit || !!orderId);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [error, setError] = useState('');

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      passengerCount: 1,
      purchasePrice: 0,
      salePrice: 0,
      directCosts: 0,
      status: 'confirmed',
    },
  });

  useEffect(() => {
    Promise.all([
      customersApi.list({ limit: 200 }),
      suppliersApi.list({ limit: 200 }),
    ]).then(([cRes, sRes]) => {
      setCustomers(cRes.data.data);
      setSuppliers(sRes.data.data);
    });
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoadingData(true);
      bookingsApi.get(editId).then(({ data }) => {
        const b = data.data;
        form.reset({
          customerId: b.customer || '',
          supplierId: b.supplier || '',
          airline: b.airline,
          route: b.route,
          sector: b.sector || '',
          departureDate: b.departureDate?.slice(0, 10),
          returnDate: b.returnDate?.slice(0, 10) || '',
          passengerCount: b.passengerCount,
          pnr: b.pnr || '',
          ticketNumber: b.ticketNumber || '',
          purchasePrice: b.purchasePrice || 0,
          salePrice: b.salePrice || 0,
          directCosts: b.directCosts || 0,
          notes: b.notes || '',
          status: b.status,
          ticketCopyPath: b.ticketCopyPath || '',
          ticketCopyFileName: b.ticketCopyFileName || '',
        });
        setPaymentSummary({
          amountPaid: b.amountPaid || 0,
          supplierPaid: b.supplierPaid || 0,
          customerDue: b.computed?.customerDue ?? b.customerDue ?? 0,
          supplierPayable: b.computed?.supplierPayable ?? b.supplierPayable ?? 0,
        });
      }).finally(() => setLoadingData(false));
      return;
    }

    if (!orderId) return;
    setLoadingData(true);
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
        notes: o.internalNotes || '',
        status: 'confirmed',
      });
    }).finally(() => setLoadingData(false));
  }, [orderId, editId, isEdit, form]);

  const watchPrices = form.watch(['purchasePrice', 'salePrice', 'directCosts']);
  const profit = (watchPrices[1] || 0) - (watchPrices[0] || 0) - (watchPrices[2] || 0);
  const projectedDue = Math.max(0, (watchPrices[1] || 0) - (paymentSummary?.amountPaid || 0));
  const projectedPayable = Math.max(0, (watchPrices[0] || 0) + (watchPrices[2] || 0) - (paymentSummary?.supplierPaid || 0));

  const onSubmit = async (values) => {
    setError('');
    try {
      const payload = { ...values, supplierId: values.supplierId || undefined };
      if (isEdit) {
        await bookingsApi.update(editId, payload);
        navigate(`/bookings/${editId}`);
      } else if (orderId) {
        const { data } = await bookingsApi.createFromOrder(orderId, payload);
        navigate(`/bookings/${data.data.id}`);
      } else {
        const { data } = await bookingsApi.create(payload);
        navigate(`/bookings/${data.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || (isEdit ? 'Failed to update booking' : 'Failed to create booking'));
    }
  };

  if (loadingData) return <LoadingSpinner className="py-20" />;

  const backLink = isEdit ? `/bookings/${editId}` : '/bookings';
  const title = isEdit ? 'Edit Booking' : orderId ? 'Create Booking from Order' : 'New Booking';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to={backLink} className="text-sm text-brand-600 hover:underline">← Back</Link>
        <h2 className="mt-2 text-xl font-bold text-slate-900">{title}</h2>
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
          <div><label className="mb-1 block text-sm font-medium">Sector</label><input className="input-field" {...form.register('sector')} /></div>
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
          <p className="mt-1 text-xs text-slate-500">
            Customer and supplier payments are recorded separately under Payments — they update account balances automatically.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div><label className="mb-1 block text-xs font-medium">Purchase Price</label><input type="number" className="input-field" {...form.register('purchasePrice')} /></div>
            <div><label className="mb-1 block text-xs font-medium">Sale Price</label><input type="number" className="input-field" {...form.register('salePrice')} /></div>
            <div><label className="mb-1 block text-xs font-medium">Direct Costs</label><input type="number" className="input-field" {...form.register('directCosts')} /></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-slate-500">Est. Profit</p><p className="text-lg font-bold text-green-700">৳{profit.toLocaleString()}</p></div>
            {isEdit && paymentSummary ? (
              <>
                <div><p className="text-xs text-slate-500">Customer Due (from payments)</p><p className="text-lg font-bold text-red-600">৳{projectedDue.toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-500">Supplier Payable (from payments)</p><p className="text-lg font-bold text-amber-700">৳{projectedPayable.toLocaleString()}</p></div>
              </>
            ) : (
              <div className="col-span-2 flex items-center justify-center text-xs text-slate-500">
                Record payments after creating the booking
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Ticket Copy Path</label>
          <input className="input-field" placeholder="/uploads/tickets/..." {...form.register('ticketCopyPath')} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea rows={3} className="input-field" {...form.register('notes')} />
        </div>

        <div className="flex justify-end gap-2">
          <Link to={backLink} className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">{isEdit ? 'Save Changes' : 'Create Booking'}</button>
        </div>
      </form>
    </div>
  );
}
