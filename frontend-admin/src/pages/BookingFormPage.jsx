import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookingsApi, ordersApi, customersApi, suppliersApi } from '../services/crm.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS } from '../utils/constants';

function buildSchema(fromOrder) {
  return z.object({
    customerId: fromOrder
      ? z.string().optional()
      : z.string().min(1, 'Customer required'),
    supplierId: z.string().optional(),
    airline: z.string().min(2),
    route: z.string().min(2, 'Route is required'),
    sector: z.string().optional(),
    departureDate: z.string().min(1),
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
}

function parseRoute(route) {
  const trimmed = String(route || '').trim();
  const match = trimmed.match(/^(.+?)\s*(?:→|->|—|-)\s*(.+)$/);
  if (match) {
    return { fromDestination: match[1].trim(), toDestination: match[2].trim() };
  }
  return { fromDestination: trimmed, toDestination: trimmed };
}

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
  const [orderMeta, setOrderMeta] = useState(null);
  const [linkedBooking, setLinkedBooking] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');

  const schema = useMemo(() => buildSchema(Boolean(orderId) && !isEdit), [orderId, isEdit]);

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
            purchasePrice: b.purchasePrice || 0,
            salePrice: b.salePrice || 0,
            directCosts: b.directCosts || 0,
            notes: b.notes || '',
            status: b.status,
            ticketCopyPath: b.ticketCopyPath || '',
            ticketCopyFileName: b.ticketCopyFileName || '',
          });
          setOrderMeta({
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
      return;
    }

    if (!orderId) return;

    setLoadingData(true);
    ordersApi.get(orderId)
      .then(({ data }) => {
        const o = data.data;
        if (o.linkedBooking) {
          setLinkedBooking(o.linkedBooking);
          return;
        }
        setOrderMeta({
          journeyType: o.journeyType || 'one_way',
          travelClass: o.travelClass || 'economy',
          returnDate: o.returnDate?.slice(0, 10) || '',
          customerName: o.customerName,
          customerPhone: o.customerPhone,
        });
        if (o.customerDetails) {
          setCustomers((prev) => mergeCustomer(prev, o.customerDetails));
        }
        form.reset({
          customerId: o.customerDetails?.id || o.customer || '',
          airline: `${o.fromDestination}-${o.toDestination}`,
          route: `${o.fromDestination} → ${o.toDestination}`,
          departureDate: o.journeyDate?.slice(0, 10),
          passengerCount: o.passengerCount,
          salePrice: o.quotedSalePrice || 0,
          purchasePrice: 0,
          directCosts: 0,
          notes: o.internalNotes || '',
          status: 'confirmed',
        });
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Failed to load order'))
      .finally(() => setLoadingData(false));
  }, [orderId, editId, isEdit, form]);

  const watchPrices = form.watch(['purchasePrice', 'salePrice', 'directCosts']);
  const profit = (watchPrices[1] || 0) - (watchPrices[0] || 0) - (watchPrices[2] || 0);
  const projectedDue = Math.max(0, (watchPrices[1] || 0) - (paymentSummary?.amountPaid || 0));
  const projectedPayable = Math.max(0, (watchPrices[0] || 0) + (watchPrices[2] || 0) - (paymentSummary?.supplierPaid || 0));

  const onSubmit = async (values) => {
    if (linkedBooking) return;
    setError('');
    try {
      const { fromDestination, toDestination } = parseRoute(values.route);
      const payload = {
        ...values,
        supplierId: values.supplierId || undefined,
        customerId: values.customerId || undefined,
        journeyType: orderMeta?.journeyType || 'one_way',
        travelClass: orderMeta?.travelClass || 'economy',
        returnDate: orderMeta?.returnDate || undefined,
        fromDestination,
        toDestination,
      };
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

  const backLink = isEdit ? `/bookings/${editId}` : orderId ? '/orders' : '/bookings';
  const title = isEdit ? 'Edit Booking' : orderId ? 'Create Booking from Order' : 'New Booking';

  if (linkedBooking) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Link to="/orders" className="text-sm text-brand-600 hover:underline">← Back to Orders</Link>
        <div className="card space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Booking already exists</h2>
          <p className="text-sm text-slate-600">
            This order already has booking <strong>{linkedBooking.bookingNumber}</strong>.
          </p>
          <Link to={`/bookings/${linkedBooking.id}`} className="btn-primary inline-block">
            View booking
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to={backLink} className="text-sm text-brand-600 hover:underline">← Back</Link>
        <h2 className="mt-2 text-xl font-bold text-slate-900">{title}</h2>
        {orderId && orderMeta && (
          <p className="mt-1 text-sm text-slate-500">
            Order customer: {orderMeta.customerName} ({orderMeta.customerPhone})
            {!form.watch('customerId') && ' — customer will be created automatically on save'}
          </p>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="card space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {loadError && <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{loadError}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Customer {orderId ? '' : '*'}
            </label>
            <select className="input-field" {...form.register('customerId')}>
              <option value="">{orderId ? 'Auto from order contact' : 'Select customer'}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
            {form.formState.errors.customerId && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.customerId.message}</p>
            )}
            {!customers.length && !orderId && !loadError && (
              <p className="mt-1 text-xs text-slate-500">
                No customers yet.{' '}
                <Link to="/customers" className="text-brand-600 hover:underline">Add a customer first</Link>
              </p>
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
            {form.formState.errors.route && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.route.message}</p>
            )}
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
          <h3 className="text-sm font-semibold text-slate-900">Pricing</h3>
          <p className="mt-1 text-xs text-slate-500">
            Customer and supplier payments are recorded separately under Payments.
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
                <div><p className="text-xs text-slate-500">Customer Due</p><p className="text-lg font-bold text-red-600">৳{projectedDue.toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-500">Supplier Payable</p><p className="text-lg font-bold text-amber-700">৳{projectedPayable.toLocaleString()}</p></div>
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
          <button type="submit" className="btn-primary" disabled={Boolean(loadError && orderId)}>
            {isEdit ? 'Save Changes' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}
