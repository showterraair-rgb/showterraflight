import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ordersApi, customersApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import RowActions from '../components/common/RowActions';
import { usePermission } from '../hooks/usePermission';
import { formatDate } from '../utils/date';
import {
  ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_SOURCES, ORDER_SOURCE_LABELS,
  JOURNEY_TYPES, JOURNEY_LABELS, TRAVEL_CLASSES, CLASS_LABELS,
  APPROVAL_STATUS_LABELS,
} from '../utils/constants';
import ApprovalControls from '../components/bookings/ApprovalPanel';
import PassportUpload from '../components/bookings/PassportUpload';
import { BD_PHONE_HELP, BD_PHONE_PLACEHOLDER, formatPhoneOnBlur, isValidBdMobile } from '../utils/phone';

const schema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(1, 'Phone required').refine(isValidBdMobile, { message: BD_PHONE_HELP }),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerId: z.string().optional(),
  source: z.enum(['website', 'phone', 'whatsapp', 'walk_in']),
  journeyType: z.enum(['one_way', 'round_trip', 'multi_city']),
  fromDestination: z.string().min(2),
  toDestination: z.string().min(2),
  journeyDate: z.string().min(1),
  returnDate: z.string().optional(),
  passengerCount: z.coerce.number().min(1),
  travelClass: z.enum(['economy', 'premium_economy', 'business', 'first']),
  quotedSalePrice: z.coerce.number().optional(),
  requestNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
}).refine((d) => d.journeyType !== 'round_trip' || d.returnDate, {
  message: 'Return date required for round trip',
  path: ['returnDate'],
});

export default function OrdersPage() {
  const { can } = usePermission();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', source: '', isFromWebsite: '' });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customersError, setCustomersError] = useState('');

  const form = useForm({ resolver: zodResolver(schema), defaultValues: {
    source: 'phone', journeyType: 'one_way', travelClass: 'economy', passengerCount: 1,
  }});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await ordersApi.list(params);
      setItems(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const loadCustomers = useCallback(async () => {
    setCustomersError('');
    try {
      const all = [];
      let pageNum = 1;
      let totalPages = 1;
      do {
        const { data } = await customersApi.list({ page: pageNum, limit: 100 });
        all.push(...(data.data || []));
        totalPages = data.pagination?.totalPages || 1;
        pageNum += 1;
      } while (pageNum <= totalPages);
      setCustomers(all);
    } catch (err) {
      setCustomers([]);
      setCustomersError(err.response?.data?.message || 'Could not load customers');
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const mergeCustomer = (list, extra) => {
    if (!extra?.id) return list;
    if (list.some((c) => c.id === extra.id)) return list;
    return [{ id: extra.id, name: extra.name, phone: extra.phone, email: extra.email }, ...list];
  };

  const applyCustomer = (customerId) => {
    form.setValue('customerId', customerId || '');
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      form.setValue('customerName', customer.name);
      form.setValue('customerPhone', customer.phone || '');
      form.setValue('customerEmail', customer.email || '');
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ source: 'phone', journeyType: 'one_way', travelClass: 'economy', passengerCount: 1 });
    setError('');
    loadCustomers();
    setModalOpen(true);
  };

  const openEdit = async (row) => {
    setEditing(row);
    setDetail(null);
    try {
      const { data } = await ordersApi.get(row.id);
      setDetail(data.data);
      if (data.data.customerDetails) {
        setCustomers((prev) => mergeCustomer(prev, data.data.customerDetails));
      } else if (row.customer) {
        setCustomers((prev) => mergeCustomer(prev, {
          id: row.customer,
          name: row.customerName,
          phone: row.customerPhone,
          email: row.customerEmail,
        }));
      }
    } catch {
      setDetail(row);
    }
    form.reset({
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerEmail: row.customerEmail || '',
      customerId: row.customer || '',
      source: row.source,
      journeyType: row.journeyType,
      fromDestination: row.fromDestination,
      toDestination: row.toDestination,
      journeyDate: row.journeyDate?.slice(0, 10),
      returnDate: row.returnDate?.slice(0, 10) || '',
      passengerCount: row.passengerCount,
      travelClass: row.travelClass,
      quotedSalePrice: row.quotedSalePrice,
      requestNotes: row.requestNotes,
      internalNotes: row.internalNotes,
      nextFollowUpDate: row.nextFollowUpDate?.slice(0, 10) || '',
    });
    setError('');
    loadCustomers();
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setError('');
    try {
      const payload = { ...values, customerEmail: values.customerEmail || undefined, customerId: values.customerId || undefined };
      if (editing) await ordersApi.update(editing.id, payload);
      else await ordersApi.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete order ${row.orderNumber}? This cannot be undone.`)) return;
    try {
      const { data } = await ordersApi.delete(row.id);
      alert(data.message || 'Order deleted');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { key: 'orderNumber', label: 'Order #', render: (r) => <span className="font-mono text-xs font-medium">{r.orderNumber}</span> },
    { key: 'customerName', label: 'Customer' },
    { key: 'route', label: 'Route', render: (r) => `${r.fromDestination} → ${r.toDestination}` },
    { key: 'journeyDate', label: 'Travel Date', render: (r) => formatDate(r.journeyDate) },
    { key: 'source', label: 'Source', render: (r) => (
      <span className="inline-flex flex-wrap items-center gap-1">
        <span>{ORDER_SOURCE_LABELS[r.source] || r.source}</span>
        {r.isFromWebsite && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
            Website
          </span>
        )}
      </span>
    ) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={ORDER_STATUS_LABELS[r.status]} /> },
    { key: 'approvalStatus', label: 'Approval', render: (r) => (
      <StatusBadge status={r.approvalStatus || 'pending'} label={APPROVAL_STATUS_LABELS[r.approvalStatus || 'pending']} />
    ) },
    {
      key: 'actions',
      label: 'Actions',
      stickyRight: true,
      cellClassName: '',
      render: (r) => (
        <RowActions
          items={[
            can('orders:view') && { type: 'button', label: 'View', onClick: () => openEdit(r) },
            can('orders:update') && { type: 'button', label: 'Edit', onClick: () => openEdit(r), variant: 'muted' },
            can('orders:delete') && { type: 'button', label: 'Delete', onClick: () => handleDelete(r), variant: 'danger' },
            can('bookings:create') && !['closed', 'cancelled'].includes(r.status) && !r.linkedBooking && {
              type: 'link',
              label: 'Booking',
              to: `/bookings/new?orderId=${r.id}`,
              variant: 'muted',
            },
            can('bookings:view') && r.linkedBooking && {
              type: 'link',
              label: r.linkedBooking.bookingNumber,
              to: `/bookings/${r.linkedBooking.id}`,
              variant: 'muted',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Orders</h2>
          <p className="text-sm text-slate-500">Website booking requests (ORD-) and manual inquiries — convert to a booking when ticket is confirmed</p>
        </div>
        {can('orders:create') && (
          <button type="button" onClick={openCreate} className="btn-primary">New Order</button>
        )}
      </div>

      <div className="card p-0">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <input type="search" placeholder="Search..." className="input-field max-w-xs" value={filters.search}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }} />
          <select className="input-field w-auto" value={filters.status} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}>
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
          </select>
          <select className="input-field w-auto" value={filters.source} onChange={(e) => { setFilters((f) => ({ ...f, source: e.target.value })); setPage(1); }}>
            <option value="">All Sources</option>
            {ORDER_SOURCES.map((s) => <option key={s} value={s}>{ORDER_SOURCE_LABELS[s]}</option>)}
          </select>
          <select className="input-field w-auto" value={filters.isFromWebsite} onChange={(e) => { setFilters((f) => ({ ...f, isFromWebsite: e.target.value })); setPage(1); }}>
            <option value="">All Orders</option>
            <option value="true">Website Only</option>
            <option value="false">Manual Only</option>
          </select>
        </div>
        <DataTable columns={columns} data={items} loading={loading} emptyTitle="No orders" emptyDescription="Create an order or wait for website requests." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? (can('orders:update') ? 'Edit Order' : 'View Order') : 'New Order'}
        wide
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">{can('orders:update') || !editing ? 'Cancel' : 'Close'}</button>
            {((!editing && can('orders:create')) || (editing && can('orders:update'))) && (
              <button type="submit" form="order-form" className="btn-primary">Save Order</button>
            )}
          </div>
        )}
      >
        <form id="order-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <fieldset disabled={Boolean(editing && !can('orders:update'))} className="space-y-4 disabled:opacity-90">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Customer *</label>
              <select
                className="input-field"
                value={form.watch('customerId') || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) {
                    applyCustomer(id);
                  } else {
                    form.setValue('customerId', '');
                  }
                }}
              >
                <option value="">Select existing customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                ))}
              </select>
              {!customers.length && !customersError && (
                <p className="mt-1 text-xs text-slate-500">
                  No customers found.{' '}
                  <Link to="/customers" className="text-brand-600 hover:underline">Add a customer first</Link>
                  {' '}or enter details below.
                </p>
              )}
              {customersError && (
                <p className="mt-1 text-xs text-red-600">{customersError}</p>
              )}
            </div>
            <div><label className="mb-1 block text-sm font-medium">Customer Name *</label><input className="input-field" {...form.register('customerName')} /></div>
            <div><label className="mb-1 block text-sm font-medium">Phone *</label><input className="input-field" placeholder={BD_PHONE_PLACEHOLDER} {...form.register('customerPhone')} onBlur={(e) => form.setValue('customerPhone', formatPhoneOnBlur(e.target.value), { shouldValidate: true })} />{form.formState.errors.customerPhone && <p className="mt-1 text-xs text-red-600">{form.formState.errors.customerPhone.message}</p>}<p className="mt-1 text-xs text-slate-500">{BD_PHONE_HELP}</p></div>
            <div><label className="mb-1 block text-sm font-medium">Email</label><input className="input-field" {...form.register('customerEmail')} /></div>
            {!editing && (
              <div>
                <label className="mb-1 block text-sm font-medium">Source</label>
                <select className="input-field" {...form.register('source')}>
                  {ORDER_SOURCES.map((s) => <option key={s} value={s}>{ORDER_SOURCE_LABELS[s]}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Journey Type</label>
              <select className="input-field" {...form.register('journeyType')}>
                {JOURNEY_TYPES.map((t) => <option key={t} value={t}>{JOURNEY_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Class</label>
              <select className="input-field" {...form.register('travelClass')}>
                {TRAVEL_CLASSES.map((c) => <option key={c} value={c}>{CLASS_LABELS[c]}</option>)}
              </select>
            </div>
            <div><label className="mb-1 block text-sm font-medium">From *</label><input className="input-field" {...form.register('fromDestination')} /></div>
            <div><label className="mb-1 block text-sm font-medium">To *</label><input className="input-field" {...form.register('toDestination')} /></div>
            <div><label className="mb-1 block text-sm font-medium">Journey Date *</label><input type="date" className="input-field" {...form.register('journeyDate')} /></div>
            <div><label className="mb-1 block text-sm font-medium">Return Date</label><input type="date" className="input-field" {...form.register('returnDate')} /></div>
            <div><label className="mb-1 block text-sm font-medium">Passengers</label><input type="number" min={1} className="input-field" {...form.register('passengerCount')} /></div>
            <div><label className="mb-1 block text-sm font-medium">Quoted Price (৳)</label><input type="number" className="input-field" {...form.register('quotedSalePrice')} /></div>
            <div><label className="mb-1 block text-sm font-medium">Next Follow-up</label><input type="date" className="input-field" {...form.register('nextFollowUpDate')} /></div>
            <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium">Customer Notes</label><textarea rows={2} className="input-field" {...form.register('requestNotes')} /></div>
            <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium">Internal Notes</label><textarea rows={2} className="input-field" {...form.register('internalNotes')} /></div>
          </div>
          </fieldset>

          {editing && detail && (
            <div className="mt-6 space-y-4 border-t border-slate-200 pt-4">
              {detail.linkedBooking && (
                <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                  Linked booking:{' '}
                  <Link to={`/bookings/${detail.linkedBooking.id}`} className="font-medium underline">
                    {detail.linkedBooking.bookingNumber}
                  </Link>
                </div>
              )}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-900">Approval workflow</h4>
                <ApprovalControls
                  approvalStatus={detail.approvalStatus}
                  disabled={!can('orders:update')}
                  onUpdate={async (payload) => {
                    const { data } = await ordersApi.updateApproval(editing.id, payload);
                    setDetail(data.data);
                    load();
                  }}
                />
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-900">Passport copy</h4>
                <PassportUpload
                  record={detail}
                  disabled={!can('orders:update')}
                  onUpload={async (file) => {
                    const { data } = await ordersApi.uploadPassport(editing.id, file);
                    setDetail(data.data);
                    load();
                  }}
                />
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
