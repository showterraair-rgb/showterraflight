import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { BOOKING_STATUS_LABELS, APPROVAL_STATUS_LABELS } from '../utils/constants';

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
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: fixedStatus || '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: '',
  });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      if (productCategory) params.productCategory = productCategory;
      if (invoicedOnly) params.invoiced = 'true';
      if (fixedStatus) params.status = fixedStatus;
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
  }, [page, filters, productCategory, fixedStatus, invoicedOnly]);

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

  const columns = [
    { key: 'bookingNumber', label: 'Booking #', render: (r) => (
      <Link to={`/bookings/${r.id}`} className="font-mono text-xs font-medium text-brand-600 hover:underline">{r.bookingNumber}</Link>
    ) },
    { key: 'customerName', label: 'Customer' },
    { key: 'route', label: 'Route' },
    { key: 'pnr', label: 'PNR', render: (r) => r.pnr || '—' },
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
      { key: 'customerDue', label: 'Due', render: (r) => <MoneyAmount amount={r.customerDue} size="sm" className={r.customerDue > 0 ? 'text-red-600' : ''} /> },
    ] : []),
    { key: 'passengerCount', label: 'PAX' },
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
            <Link to="/bookings/partial-payments" className="btn-secondary text-sm">Partial Payments</Link>
          )}
          {can('bookings:create') && !hideNewButton && (
            <Link to={newBookingPath} className="btn-primary">New Booking</Link>
          )}
        </div>
      </div>

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
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <input
            type="search"
            placeholder="Booking #, PNR, airline..."
            className="input-field max-w-[200px]"
            value={filters.search}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
          />
          <select className="input-field w-auto" value={filters.paymentStatus} onChange={(e) => { setFilters((f) => ({ ...f, paymentStatus: e.target.value })); setPage(1); }}>
            <option value="">All payments</option>
            <option value="paid">Fully paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Due</option>
          </select>
          <input type="date" className="input-field w-auto" value={filters.dateFrom} onChange={(e) => { setFilters((f) => ({ ...f, dateFrom: e.target.value })); setPage(1); }} title="Flight from" />
          <input type="date" className="input-field w-auto" value={filters.dateTo} onChange={(e) => { setFilters((f) => ({ ...f, dateTo: e.target.value })); setPage(1); }} title="Flight to" />
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
      title="Booking History"
      description="Flight bookings — search by PNR, booking number, airline, or customer."
      newBookingPath="/bookings/new"
    />
  );
}
