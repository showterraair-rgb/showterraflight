import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { dashboardApi } from '../services/auth.api';
import { reportsApi } from '../services/phase5.api';
import { bookingsApi } from '../services/crm.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import SummaryStatCard from '../components/common/SummaryStatCard';
import DualCurrencyAmount from '../components/common/DualCurrencyAmount';
import { useCurrency } from '../hooks/useCurrency';
import { useFieldPermission } from '../hooks/useFieldPermission';

export default function BusinessSummaryPage() {
  const { brlFromBdt, brlRate } = useCurrency();
  const financeFields = useFieldPermission('finance');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [sales, setSales] = useState(null);
  const [bookingSummary, setBookingSummary] = useState(null);
  const [monthRange, setMonthRange] = useState({
    from: dayjs().startOf('month').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD'),
  });

  const [upcomingCount, setUpcomingCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, salesRes, bookSumRes, upcomingRes] = await Promise.all([
        dashboardApi.getSummary(),
        reportsApi.run('sales-summary', monthRange),
        bookingsApi.summary({ productCategory: 'air' }),
        bookingsApi.upcoming({ limit: 1 }),
      ]);
      setDashboard(dashRes.data.data);
      setSales(salesRes.data.data);
      setBookingSummary(bookSumRes.data.data);
      setUpcomingCount(Array.isArray(upcomingRes.data.data) ? upcomingRes.data.data.length : 0);
    } finally {
      setLoading(false);
    }
  }, [monthRange]);

  useEffect(() => { load(); }, [load]);

  if (loading && !dashboard) return <LoadingSpinner className="py-20" />;

  const s = dashboard?.summary || {};
  const cards = sales?.cards || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Business Summary</h2>
          <p className="text-sm text-slate-500">Sales, collections, ticketing activity, and upcoming flights at a glance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" className="input-field w-auto" value={monthRange.from} onChange={(e) => setMonthRange((r) => ({ ...r, from: e.target.value }))} />
          <span className="text-slate-400">to</span>
          <input type="date" className="input-field w-auto" value={monthRange.to} onChange={(e) => setMonthRange((r) => ({ ...r, to: e.target.value }))} />
        </div>
      </div>

      {!financeFields.hidden && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Period sales" value={<DualCurrencyAmount totalBRL={brlFromBdt(cards.totalSale)} totalBDT={cards.totalSale ?? 0} size="lg" />} accent="green" />
          <StatCard label="Customer due" value={<DualCurrencyAmount totalBRL={brlFromBdt(s.customerDue)} totalBDT={s.customerDue ?? 0} size="lg" />} accent="red" />
          <StatCard label="Supplier payable" value={<DualCurrencyAmount totalBRL={brlFromBdt(s.supplierPayable)} totalBDT={s.supplierPayable ?? 0} size="lg" />} accent="amber" />
          <StatCard label="Net position" value={<DualCurrencyAmount totalBRL={brlFromBdt(s.netPosition)} totalBDT={s.netPosition ?? 0} size="lg" />} accent="blue" />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <SummaryStatCard label="Ticketed" amount={bookingSummary?.ticketed?.amount} count={bookingSummary?.ticketed?.count} color="teal" />
        <SummaryStatCard label="Refunds" amount={bookingSummary?.refunded?.amount} count={bookingSummary?.refunded?.count} color="teal" />
        <SummaryStatCard label="Reissues" amount={bookingSummary?.reissued?.amount} count={bookingSummary?.reissued?.count} color="indigo" />
        <SummaryStatCard label="Voids" amount={bookingSummary?.voided?.amount} count={bookingSummary?.voided?.count} color="slate" />
        <SummaryStatCard label="Partial due" amount={bookingSummary?.partialDue?.amount} count={bookingSummary?.partialDue?.count} color="amber" />
        <SummaryStatCard label="Overdue due" amount={bookingSummary?.overdueDue?.amount} count={bookingSummary?.overdueDue?.count} color="red" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link to="/bookings/upcoming" className="card transition hover:border-brand-200 hover:shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Upcoming flights</p>
          <p className="mt-1 text-2xl font-bold text-brand-700">{upcomingCount}</p>
          <p className="mt-1 text-xs text-slate-500">View schedule →</p>
        </Link>
        <Link to="/bookings/invoices" className="card transition hover:border-brand-200 hover:shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Invoices (ticketed)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{bookingSummary?.ticketed?.count ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">Download invoice PDFs →</p>
        </Link>
        <Link to="/finance/ledger" className="card transition hover:border-brand-200 hover:shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Ledger</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">৳ {(s.netPosition ?? 0).toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">Account statements →</p>
        </Link>
      </div>

      <p className="text-xs text-slate-400">Rate: 1 BRL = ৳ {Number(brlRate).toFixed(2)}</p>
    </div>
  );
}
