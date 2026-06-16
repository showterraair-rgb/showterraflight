import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { agentApi } from '../services/agent.api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import StatusBadge from '../components/StatusBadge';
import DualCurrencyAmount from '../components/DualCurrencyAmount';
import { useCurrency } from '../hooks/useCurrency';
import { BOOKING_STATUS_LABELS, formatDate } from '../utils/constants';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState('BDT');
  const { rates, brlRate } = useCurrency();

  useEffect(() => {
    agentApi.dashboard().then(({ data }) => setStats(data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton rows={6} />;

  const cards = [
    { label: 'Total Bookings', value: stats?.totalBookings || 0, isMoney: false },
    { label: 'Pending', value: stats?.pending || 0, isMoney: false },
    { label: 'Confirmed', value: stats?.confirmed || 0, isMoney: false },
    { label: 'Cancelled', value: stats?.cancelled || 0, isMoney: false },
    { label: 'Total Spent', value: stats?.totalSpent || 0, isMoney: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5 text-sm">
            {['BDT', 'BRL'].map((c) => (
              <button
                key={c}
                type="button"
                className={`rounded-md px-3 py-1 ${displayCurrency === c ? 'bg-brand-600 text-white' : 'text-slate-600'}`}
                onClick={() => setDisplayCurrency(c)}
              >
                {c} {c === 'BDT' ? '৳' : 'R$'}
              </button>
            ))}
          </div>
          <Link to="/bookings/new" className="btn-primary">New Booking</Link>
          <Link to="/reports" className="btn-secondary">Reports</Link>
        </div>
      </div>
      {displayCurrency === 'BRL' && (
        <p className="text-xs text-slate-500">1 BRL = ৳ {Number(brlRate).toFixed(2)} (current rate)</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xs font-medium uppercase text-slate-500">{c.label}</p>
            {c.isMoney ? (
              <DualCurrencyAmount
                className="mt-2"
                amountBDT={c.value}
                showIn={displayCurrency}
                rates={rates}
                primaryClassName="text-2xl font-bold text-slate-900"
              />
            ) : (
              <p className="mt-2 text-2xl font-bold text-slate-900">{c.value}</p>
            )}
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
                <td className="py-2 pr-4">
                  <DualCurrencyAmount
                    amountBDT={b.totalFareBDT ?? b.totalFare}
                    originalAmount={b.originalTotalFare ?? b.totalFare}
                    originalCurrency={b.originalCurrency ?? b.currency}
                    exchangeRate={b.exchangeRateAtBooking}
                    showIn={displayCurrency}
                    rates={rates}
                    primaryClassName="text-sm font-medium"
                    secondaryClassName="text-xs text-slate-500"
                  />
                </td>
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
