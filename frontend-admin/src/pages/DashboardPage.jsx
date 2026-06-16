import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { dashboardApi } from '../services/auth.api';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../hooks/useCurrency';
import { usePermission } from '../hooks/usePermission';

export default function DashboardPage() {
  const { can } = usePermission();
  const { convert, format, brlRate } = useCurrency();
  const [displayCurrency, setDisplayCurrency] = useState('BDT');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState(null);
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [summaryRes, activityRes, alertsRes] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getRecentActivity(),
          dashboardApi.getAlerts(),
        ]);
        setSummary(summaryRes.data.data);
        setActivity(activityRes.data.data);
        setAlerts(alertsRes.data.data);
      } catch (err) {
        console.error('Dashboard load failed', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner className="py-20" />;

  const s = summary?.summary || {};
  const money = (amountBDT) => format(convert(amountBDT, 'BDT', displayCurrency), displayCurrency);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Business Overview</h2>
          <p className="text-sm text-slate-500">Today — {dayjs().format('dddd, MMMM D, YYYY')}</p>
        </div>
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
      </div>
      {displayCurrency === 'BRL' && (
        <p className="text-xs text-slate-500">1 BRL = ৳ {Number(brlRate).toFixed(2)} (current rate)</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Orders" value={s.todayOrders ?? 0} accent="blue" />
        <StatCard label="Website Requests" value={s.websiteInquiries ?? 0} accent="blue" subtext="Open inquiries from showterraflight.com" />
        <StatCard label="Pending Purchases" value={s.pendingPurchases ?? 0} accent="amber" />
        <StatCard label="Issued Tickets" value={s.issuedTickets ?? 0} accent="green" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending Reminders" value={s.pendingReminders ?? 0} accent="slate" />
        <StatCard label="Customer Due" value={money(s.customerDue)} accent="red" />
        <StatCard label="Supplier Payable" value={money(s.supplierPayable)} accent="amber" />
        <StatCard label="Gross Profit" value={money(s.grossProfit)} accent="green" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Net Position" value={money(s.netPosition)} accent="blue" subtext="Total account balance" />
        <StatCard label="Total Sales" value={money(s.totalSales)} accent="blue" />
        <StatCard label="Total Purchase" value={money(s.totalPurchase)} accent="slate" />
        <StatCard label="Expense Total" value={money(s.expenseTotal)} accent="red" />
      </div>

      {can('accounts:view') && summary?.accountBalances?.length > 0 && (
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Account Balances</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.accountBalances.map((acc) => (
              <div key={acc.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">{acc.name}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(acc.balance)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Recent Orders</h3>
            {can('orders:view') && (
              <Link to="/orders" className="text-xs font-semibold text-brand-600 hover:underline">View all</Link>
            )}
          </div>
          {activity?.orders?.length ? (
            <ul className="divide-y divide-slate-100">
              {activity.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {o.orderNumber}
                      {o.isFromWebsite && (
                        <span className="ml-2 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-800">Web</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{o.customerName}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
                    {o.status.replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No orders yet" description="Website booking requests and manual orders appear here." />
          )}
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Recent Bookings</h3>
          {activity?.bookings?.length ? (
            <ul className="divide-y divide-slate-100">
              {activity.bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{b.bookingNumber}</p>
                    <p className="text-xs text-slate-500">{b.airline} — {b.route}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-700">{formatCurrency(b.salePrice)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No bookings yet" description="Bookings will appear here once created." />
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Alerts & Follow-ups</h3>
        {alerts?.followUps?.length || alerts?.reminders?.length ? (
          <div className="space-y-3">
            {alerts.followUps?.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-amber-900">Follow-up: {f.orderNumber}</p>
                  <p className="text-xs text-amber-700">{f.customerName}</p>
                </div>
                <p className="text-xs text-amber-600">
                  {f.nextFollowUpDate ? dayjs(f.nextFollowUpDate).format('MMM D') : '—'}
                </p>
              </div>
            ))}
            {alerts.reminders?.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                <p className="text-sm font-medium text-blue-900">{r.title}</p>
                <p className="text-xs text-blue-600">{dayjs(r.dueDate).format('MMM D')}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No alerts" description="Follow-ups and reminders will show here." icon="✓" />
        )}
      </div>
    </div>
  );
}
