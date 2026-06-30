import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { bookingsApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import RowActions from '../components/common/RowActions';
import SummaryStatCard from '../components/common/SummaryStatCard';
import { usePermission } from '../hooks/usePermission';
import { useFieldPermission } from '../hooks/useFieldPermission';
import { formatDate, formatDateTime } from '../utils/date';
import MoneyAmount, { getBookingMoney } from '../components/common/MoneyAmount';
import { downloadBlob } from '../utils/download';
import ReminderChannelButtons from '../components/common/ReminderChannelButtons';
import { BOOKING_STATUS_LABELS, APPROVAL_STATUS_LABELS } from '../utils/constants';

const DEFAULT_FILTERS = {
  search: '',
  status: '',
  paymentStatus: '',
  supplierPaymentStatus: '',
  approvalStatus: '',
  dateFrom: '',
  dateTo: '',
  bookingDateFrom: '',
  bookingDateTo: '',
  hasCustomerDue: '',
  hasSupplierDue: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

function customerReminderChannels(row) {
  return {
    sms: Boolean(row.customerPhone),
    email: Boolean(row.customerEmail),
    whatsapp: Boolean(row.customerPhone || row.customerWhatsapp),
  };
}

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'ticket_issued', label: 'Ticketed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'refunded', label: 'Refund' },
  { key: 'voided', label: 'Void' },
  { key: 'reissued', label: 'Reissue' },
  { key: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_LABELS = { paid: 'Paid', partial: 'Partial', unpaid: 'Due' };

function renderPassengerCell(r) {
  const name = r.passengerName || r.passengers?.[0]?.fullName || '—';
  const count = r.passengerCount || r.passengers?.length || 0;
  const extra = count > 1 ? ` (+${count - 1})` : '';
  const label = `${name}${extra}`;
  return <span className="max-w-[10rem] truncate text-xs" title={label}>{label}</span>;
}

export function BookingsListView({
  productCategory,
  title = 'Booking History',
  description = 'Search by PNR, booking number, airline, or customer.',
  newBookingPath = '/bookings/new',
  fixedStatus = '',
  invoicedOnly = false,
  hideStatusTabs = false,
  showRrvColumns = false,
  invoiceFocus = false,
  hideNewButton = false,
}) {
  const { can } = usePermission();
  const financeFields = useFieldPermission('finance');
  const [searchParams] = useSearchParams();
  const refundPendingFilter = searchParams.get('refundPending') === '1';
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    status: fixedStatus || '',
  });
  const [page, setPage] = useState(1);

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS, status: fixedStatus || '' });
    setPage(1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      if (productCategory) params.productCategory = productCategory;
      if (invoicedOnly) params.invoiced = 'true';
      if (fixedStatus) params.status = fixedStatus;
      if (refundPendingFilter) params.refundPending = 'true';
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const [listRes, sumRes] = await Promise.all([
        bookingsApi.list(params),
        bookingsApi.summary(params),
      ]);
      setItems(listRes.data.data);
      setPagination(listRes.data.pagination);
      setSummary(sumRes.data.data);
    } finally {
      setLoading(false);
    }
  }, [page, filters, productCategory, fixedStatus, invoicedOnly, refundPendingFilter]);

  useEffect(() => { load(); }, [load]);

  const handlePdf = async (row) => {
    try {
      const { data } = await bookingsApi.downloadInvoicePdf(row.id);
      downloadBlob(data, `${row.bookingNumber}-invoice.pdf`);
    } catch (err) {
      alert(err.response?.data?.message || 'PDF download failed');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete booking ${row.bookingNumber}?`)) return;
    try {
      await bookingsApi.delete(row.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const ledgerColumns = productCategory === 'air' && !showRrvColumns && !invoiceFocus;

  const columns = [
    { key: 'bookingNumber', label: 'Booking #', render: (r) => (
      <Link to={`/bookings/${r.id}`} className="font-mono text-xs font-medium text-brand-600 hover:underline">{r.bookingNumber}</Link>
    ) },
    ...(ledgerColumns ? [{ key: 'passengerName', label: 'Passenger', render: renderPassengerCell }] : []),
    { key: 'customerName', label: 'Customer' },
    { key: 'route', label: 'Route' },
    { key: 'pnr', label: 'PNR', render: (r) => r.pnr || '—' },
    ...(ledgerColumns ? [{ key: 'ticketNumber', label: 'Ticket #', render: (r) => (
      <span className="font-mono text-xs">{r.ticketNumber || '—'}</span>
    ) }] : []),
    { key: 'airline', label: productCategory === 'hotel' ? 'Hotel' : productCategory === 'esim' ? 'Provider' : 'Airline' },
    { key: 'departureDate', label: productCategory === 'hotel' ? 'Check-in' : 'Flight Date', render: (r) => formatDate(r.departureDate) },
    ...(!financeFields.hidden ? [
      {
        key: 'salePrice',
        label: 'Customer Price',
        render: (r) => {
          const m = getBookingMoney(r);
          return <MoneyAmount totalBRL={m.saleBRL} totalBDT={m.saleBDT} size="sm" />;
        },
      },
      {
        key: 'purchasePrice',
        label: 'Agent Price',
        render: (r) => {
          const m = getBookingMoney(r);
          return <MoneyAmount totalBRL={m.purchaseBRL} totalBDT={m.purchaseBDT ?? r.purchasePrice} size="sm" />;
        },
      },
      ...(ledgerColumns ? [{
        key: 'amountPaid',
        label: 'Received',
        render: (r) => <MoneyAmount amount={r.amountPaid} size="sm" className={r.amountPaid > 0 ? 'text-green-700 dark:text-green-400' : ''} />,
      }, {
        key: 'supplierPaid',
        label: 'Supplier Paid',
        render: (r) => <MoneyAmount amount={r.supplierPaid} size="sm" className={(r.supplierPaid ?? 0) > 0 ? 'text-slate-700 dark:text-slate-300' : ''} />,
      }] : []),
      { key: 'customerDue', label: 'Due', render: (r) => <MoneyAmount amount={r.customerDue} size="sm" className={r.customerDue > 0 ? 'text-red-600 dark:text-red-400' : ''} /> },
      ...(ledgerColumns ? [
        {
          key: 'supplierPayable',
          label: 'Supplier Due',
          render: (r) => {
            const m = getBookingMoney(r);
            return <MoneyAmount totalBRL={m.supplierDueBRL} totalBDT={m.supplierDueBDT ?? r.supplierPayable} size="sm" className={(r.supplierPayable ?? 0) > 0 ? 'text-amber-700 dark:text-amber-400' : ''} />;
          },
        },
        {
          key: 'profit',
          label: 'Profit',
          render: (r) => {
            const m = getBookingMoney(r);
            const profit = m.profitBDT ?? r.profit ?? 0;
            return <MoneyAmount totalBRL={m.profitBRL} totalBDT={profit} size="sm" className={profit >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-red-600 dark:text-red-400'} />;
          },
        },
        {
          key: 'duePaymentAt',
          label: 'Pay By',
          render: (r) => (r.duePaymentAt ? formatDate(r.duePaymentAt) : '—'),
        },
      ] : []),
    ] : []),
    ...(!ledgerColumns ? [{ key: 'passengerCount', label: 'PAX' }] : []),
    { key: 'paymentStatus', label: 'Payment', render: (r) => (
      <StatusBadge status={r.paymentStatus === 'paid' ? 'success' : r.paymentStatus === 'partial' ? 'pending' : 'cancelled'} label={PAYMENT_LABELS[r.paymentStatus] || r.paymentStatus} />
    ) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={BOOKING_STATUS_LABELS[r.status]} /> },
    ...(showRrvColumns ? [
      {
        key: 'rrvProcessedAt',
        label: 'Processed',
        render: (r) => (r.rrvProcessedAt ? formatDateTime(r.rrvProcessedAt) : formatDate(r.updatedAt)),
      },
      {
        key: 'rrvNote',
        label: 'Note',
        render: (r) => <span className="max-w-[12rem] truncate text-xs text-slate-600" title={r.rrvNote}>{r.rrvNote || '—'}</span>,
      },
      ...(financeFields.hidden ? [] : [{
        key: 'rrvAmount',
        label: 'Penalty / Refund',
        render: (r) => {
          if (r.status === 'refunded' && r.rrvRefundAmount) {
            return <MoneyAmount amount={r.rrvRefundAmount} size="sm" className="text-teal-700" />;
          }
          if (r.rrvPenalty) return <MoneyAmount amount={r.rrvPenalty} size="sm" />;
          return '—';
        },
      }]),
    ] : []),
    ...(invoiceFocus ? [
      { key: 'createdAt', label: 'Issued', render: (r) => formatDate(r.createdAt) },
    ] : []),
    { key: 'approvalStatus', label: 'Approval', render: (r) => (
      <StatusBadge status={r.approvalStatus || 'pending'} label={APPROVAL_STATUS_LABELS[r.approvalStatus || 'pending']} />
    ) },
    ...(ledgerColumns ? [{
      key: 'remind',
      label: 'Remind',
      stickyRight: true,
      cellClassName: 'bg-white dark:bg-slate-900',
      render: (r) => (
        <ReminderChannelButtons
          variant="icons"
          size="sm"
          channelAvailability={customerReminderChannels(r)}
          disabled={!r.customer}
          onSend={(channels) => bookingsApi.remind(r.id, { channels, target: 'customer' })}
        />
      ),
    }] : []),
    {
      key: 'actions',
      label: 'Actions',
      stickyRight: true,
      cellClassName: '',
      render: (r) => (
        <RowActions
          items={[
            can('bookings:view') && { type: 'link', label: 'View', to: `/bookings/${r.id}` },
            can('bookings:update') && { type: 'link', label: 'Edit', to: `/bookings/${r.id}/edit`, variant: 'muted' },
            can('bookings:view') && { type: 'button', label: invoiceFocus ? 'PDF' : 'Invoice', onClick: () => handlePdf(r), variant: 'muted' },
            can('bookings:delete') && { type: 'button', label: 'Delete', onClick: () => handleDelete(r), variant: 'danger' },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {productCategory === 'air' && !fixedStatus && (
            <>
              <Link to="/bookings/partial-payments" className="btn-secondary text-sm">Partial Payments</Link>
              {!refundPendingFilter && (
                <Link to="/bookings?refundPending=1" className="btn-secondary text-sm">Pending Refunds</Link>
              )}
            </>
          )}
          {can('bookings:create') && !hideNewButton && (
            <Link to={newBookingPath} className="btn-primary">New Booking</Link>
          )}
        </div>
      </div>

      {refundPendingFilter && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Showing bookings with <strong>pending refund requests</strong> awaiting approval.
          <Link to="/bookings" className="ml-2 font-medium text-brand-600 hover:underline dark:text-brand-400">Clear filter</Link>
        </div>
      )}

      {summary && !financeFields.hidden && !invoiceFocus && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <SummaryStatCard label="Ticketed" amount={summary.ticketed?.amount} count={summary.ticketed?.count} color="teal" />
          {!fixedStatus && (
            <>
              <SummaryStatCard label="Refund" amount={summary.refunded?.amount} count={summary.refunded?.count} color="teal" />
              <SummaryStatCard label="Reissue" amount={summary.reissued?.amount} count={summary.reissued?.count} color="indigo" />
              <SummaryStatCard label="Void" amount={summary.voided?.amount} count={summary.voided?.count} color="slate" />
            </>
          )}
          <SummaryStatCard label="Total Due" amount={summary.totalDue} color="red" />
          <SummaryStatCard label="Total Paid" amount={summary.totalPaid} color="green" />
        </div>
      )}

      {summary && invoiceFocus && !financeFields.hidden && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStatCard label="Invoiced tickets" amount={summary.ticketed?.amount} count={summary.ticketed?.count} color="teal" />
          <SummaryStatCard label="Total sale" amount={summary.totalSale} color="indigo" />
          <SummaryStatCard label="Collected" amount={summary.totalPaid} color="green" />
          <SummaryStatCard label="Outstanding due" amount={summary.totalDue} color="red" />
        </div>
      )}

      <div className="card p-0">
        {!hideStatusTabs && !fixedStatus && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key || 'all'}
              type="button"
              onClick={() => { setFilters((f) => ({ ...f, status: tab.key })); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filters.status === tab.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        )}
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Search</label>
            <input
              type="search"
              placeholder="Booking #, PNR, ticket, passenger..."
              className="input-field w-full"
              value={filters.search}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Customer pay</label>
            <select className="input-field w-auto min-w-[8rem]" value={filters.paymentStatus} onChange={(e) => { setFilters((f) => ({ ...f, paymentStatus: e.target.value })); setPage(1); }}>
              <option value="">All</option>
              <option value="paid">Fully paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Due</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Supplier pay</label>
            <select className="input-field w-auto min-w-[8rem]" value={filters.supplierPaymentStatus} onChange={(e) => { setFilters((f) => ({ ...f, supplierPaymentStatus: e.target.value })); setPage(1); }}>
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Due</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Approval</label>
            <select className="input-field w-auto min-w-[8rem]" value={filters.approvalStatus} onChange={(e) => { setFilters((f) => ({ ...f, approvalStatus: e.target.value })); setPage(1); }}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="checking">Checking</option>
              <option value="processing">Processing</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Sort</label>
            <select
              className="input-field w-auto min-w-[10rem]"
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split(':');
                setFilters((f) => ({ ...f, sortBy, sortOrder }));
                setPage(1);
              }}
            >
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="departureDate:desc">Flight date ↓</option>
              <option value="departureDate:asc">Flight date ↑</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Flight from</label>
            <input type="date" className="input-field w-auto" value={filters.dateFrom} onChange={(e) => { setFilters((f) => ({ ...f, dateFrom: e.target.value })); setPage(1); }} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Flight to</label>
            <input type="date" className="input-field w-auto" value={filters.dateTo} onChange={(e) => { setFilters((f) => ({ ...f, dateTo: e.target.value })); setPage(1); }} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Booked from</label>
            <input type="date" className="input-field w-auto" value={filters.bookingDateFrom} onChange={(e) => { setFilters((f) => ({ ...f, bookingDateFrom: e.target.value })); setPage(1); }} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Booked to</label>
            <input type="date" className="input-field w-auto" value={filters.bookingDateTo} onChange={(e) => { setFilters((f) => ({ ...f, bookingDateTo: e.target.value })); setPage(1); }} />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={filters.hasCustomerDue === 'true'}
              onChange={(e) => { setFilters((f) => ({ ...f, hasCustomerDue: e.target.checked ? 'true' : '' })); setPage(1); }}
            />
            Customer due only
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={filters.hasSupplierDue === 'true'}
              onChange={(e) => { setFilters((f) => ({ ...f, hasSupplierDue: e.target.checked ? 'true' : '' })); setPage(1); }}
            />
            Supplier due only
          </label>
          <button type="button" className="btn-secondary mb-0.5 text-sm" onClick={resetFilters}>Clear filters</button>
        </div>
        <DataTable columns={columns} data={items} loading={loading} emptyTitle="No bookings" emptyDescription="Create a booking or adjust filters." />
        {pagination && <div className="border-t border-slate-200 p-4"><Pagination pagination={pagination} onPageChange={setPage} /></div>}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <BookingsListView
      productCategory="air"
      title="Booking Ledger"
      description="Flight bookings — search by PNR, ticket, passenger, booking number, or route."
      newBookingPath="/bookings/new"
    />
  );
}
