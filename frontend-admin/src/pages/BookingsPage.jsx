import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import RowActions from '../components/common/RowActions';
import { usePermission } from '../hooks/usePermission';
import { formatDate } from '../utils/date';
import { formatCurrency } from '../utils/currency';
import { downloadBlob } from '../utils/download';
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS } from '../utils/constants';

export default function BookingsPage() {
  const { can } = usePermission();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await bookingsApi.list(params);
      setItems(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

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
    if (!window.confirm(`Delete booking ${row.bookingNumber}? This cannot be undone if payments are linked.`)) return;
    try {
      const { data } = await bookingsApi.delete(row.id);
      alert(data.message || 'Booking deleted');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { key: 'bookingNumber', label: 'Booking #', render: (r) => <span className="font-mono text-xs font-medium">{r.bookingNumber}</span> },
    { key: 'customerName', label: 'Customer' },
    { key: 'route', label: 'Route' },
    { key: 'airline', label: 'Airline' },
    { key: 'departureDate', label: 'Departure', render: (r) => formatDate(r.departureDate) },
    { key: 'salePrice', label: 'Sale', render: (r) => formatCurrency(r.salePrice) },
    { key: 'profit', label: 'Profit', render: (r) => <span className={r.profit >= 0 ? 'text-green-700' : 'text-red-600'}>{formatCurrency(r.profit)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={BOOKING_STATUS_LABELS[r.status]} /> },
    {
      key: 'actions',
      label: 'Actions',
      cellClassName: '',
      render: (r) => (
        <RowActions
          items={[
            can('bookings:view') && { type: 'link', label: 'View', to: `/bookings/${r.id}` },
            (can('bookings:update') || can('bookings:view')) && { type: 'link', label: 'Edit', to: `/bookings/${r.id}/edit`, variant: 'muted' },
            can('bookings:view') && { type: 'button', label: 'PDF', onClick: () => handlePdf(r), variant: 'muted' },
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
          <h2 className="text-xl font-bold text-slate-900">Bookings</h2>
          <p className="text-sm text-slate-500">View, edit, download PDF, or delete bookings</p>
        </div>
        {can('bookings:create') && (
          <Link to="/bookings/new" className="btn-primary">New Booking</Link>
        )}
      </div>

      <div className="card p-0">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <input type="search" placeholder="Search PNR, booking #, airline..." className="input-field max-w-xs"
            value={filters.search} onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }} />
          <select className="input-field w-auto" value={filters.status} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}>
            <option value="">All Statuses</option>
            {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <DataTable columns={columns} data={items} loading={loading} emptyTitle="No bookings" emptyDescription="Create a booking from an order or directly." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
