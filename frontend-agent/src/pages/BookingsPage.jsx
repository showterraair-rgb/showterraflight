import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { agentApi } from '../services/agent.api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { BOOKING_STATUS_LABELS, formatCurrency, formatDate } from '../utils/constants';

export default function BookingsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 20, search: filters.search || undefined, status: filters.status || undefined };
      const { data } = await agentApi.listBookings(params);
      setItems(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <Link to="/bookings/new" className="btn-primary">New Booking</Link>
      </div>
      <div className="flex flex-wrap gap-3">
        <input className="input-field max-w-xs" placeholder="Search PNR, route…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        <select className="input-field w-auto" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">All statuses</option>
          {Object.entries(BOOKING_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {loading ? <LoadingSkeleton /> : items.length === 0 ? (
        <EmptyState title="No bookings yet" message="Submit your first ticket request." action={<Link to="/bookings/new" className="btn-primary">New Booking</Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="pb-2">Ref</th><th className="pb-2">Route</th><th className="pb-2">Airline</th><th className="pb-2">PNR</th><th className="pb-2">Pax</th><th className="pb-2">Total</th><th className="pb-2">Status</th><th className="pb-2">Date</th></tr></thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-b border-slate-100">
                  <td className="py-2"><Link to={`/bookings/${b.id}`} className="font-mono text-brand-600">{b.bookingRef}</Link></td>
                  <td className="py-2">{b.route}</td>
                  <td className="py-2">{b.airline}</td>
                  <td className="py-2">{b.pnr || '—'}</td>
                  <td className="py-2">{b.passengerCount}</td>
                  <td className="py-2">{formatCurrency(b.totalFare, b.currency)}</td>
                  <td className="py-2"><StatusBadge status={b.status} label={BOOKING_STATUS_LABELS[b.status]} /></td>
                  <td className="py-2">{formatDate(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button type="button" disabled={filters.page <= 1} className="btn-secondary" onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Prev</button>
              <span className="py-2 text-sm">Page {filters.page} / {pagination.totalPages}</span>
              <button type="button" disabled={filters.page >= pagination.totalPages} className="btn-secondary" onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
