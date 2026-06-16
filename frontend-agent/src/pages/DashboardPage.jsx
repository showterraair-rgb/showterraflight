import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { agentApi } from '../services/agent.api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import StatusBadge from '../components/StatusBadge';
import { BOOKING_STATUS_LABELS, formatCurrency, formatDate } from '../utils/constants';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agentApi.dashboard().then(({ data }) => setStats(data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton rows={6} />;

  const cards = [
    { label: 'Total Bookings', value: stats?.totalBookings || 0 },
    { label: 'Pending', value: stats?.pending || 0 },
    { label: 'Confirmed', value: stats?.confirmed || 0 },
    { label: 'Cancelled', value: stats?.cancelled || 0 },
    { label: 'Total Spent', value: formatCurrency(stats?.totalSpent) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/bookings/new" className="btn-primary">New Booking</Link>
          <Link to="/reports" className="btn-secondary">Reports</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xs font-medium uppercase text-slate-500">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-4 font-semibold">Recent bookings</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-2 pr-4">Ref</th>
              <th className="pb-2 pr-4">Route</th>
              <th className="pb-2 pr-4">Total</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {(stats?.recent || []).map((b) => (
              <tr key={b.id} className="border-b border-slate-100">
                <td className="py-2 pr-4"><Link to={`/bookings/${b.id}`} className="font-mono text-brand-600">{b.bookingRef}</Link></td>
                <td className="py-2 pr-4">{b.route}</td>
                <td className="py-2 pr-4">{formatCurrency(b.totalFare, b.currency)}</td>
                <td className="py-2 pr-4"><StatusBadge status={b.status} label={BOOKING_STATUS_LABELS[b.status]} /></td>
                <td className="py-2">{formatDate(b.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
