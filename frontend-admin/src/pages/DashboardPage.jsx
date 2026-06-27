import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { dashboardApi } from '../services/auth.api';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import DualCurrencyAmount from '../components/common/DualCurrencyAmount';
import { useCurrency } from '../hooks/useCurrency';
import { usePermission } from '../hooks/usePermission';

export default function DashboardPage() {
  const { can } = usePermission();
  const { brlFromBdt, brlRate, ratesUpdatedAt } = useCurrency();
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
  const rateDate = ratesUpdatedAt ? dayjs(ratesUpdatedAt).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

  const dualMoney = (amountBDT) => (
    <DualCurrencyAmount totalBRL={brlFromBdt(amountBDT)} totalBDT={amountBDT ?? 0} size="lg" />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Business Overview</h2>
          <p className="text-sm text-slate-500">Today — {dayjs().format('dddd, MMMM D, YYYY')}</p>
          <p className="mt-1 text-xs text-slate-500">Exchange rate: 1 BRL = ৳ {Number(brlRate).toFixed(2)} (updated: {rateDate})</p>
        </div>
        {can('bookings:create') && (
          <Link to="/bookings/new" className="btn-primary">New Booking</Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Bookings" value={s.todayBookings ?? 0} accent="blue" />
        <StatCard label="Pending Bookings" value={s.pendingBookings ?? 0} accent="amber" />
        <StatCard label="Issued Tickets" value={s.issuedTickets ?? 0} accent="green" />
        <StatCard label="Active Bookings" value={s.totalActiveBookings ?? 0} accent="slate" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Voided" value={s.voidedCount ?? 0} accent="red" />
        <StatCard label="Refunded" value={s.refundedCount ?? 0} accent="amber" />
        <StatCard label="Reissued" value={s.reissuedCount ?? 0} accent="blue" />
        <StatCard label="Due Collections" value={s.dueCollectionCount ?? 0} accent="red" subtext="Bookings with customer due" />
        <StatCard label="Supplier Due" value={s.dueSupplierCount ?? 0} accent="amber" subtext="Bookings with payable" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending Reminders" value={s.pendingReminders ?? 0} accent="slate" />
        <StatCard
          label="Failed Notifications (24h)"
          value={s.failedNotifications24h ?? 0}
          accent={s.failedNotifications24h > 0 ? 'red' : 'green'}
        />
        <StatCard
          label="Last Backup"
          value={s.lastBackupStatus === 'success' ? 'OK' : s.lastBackupStatus === 'failed' ? 'Failed' : '—'}
          accent={s.lastBackupStatus === 'failed' ? 'red' : 'green'}
          subtext={s.lastBackupAt ? dayjs(s.lastBackupAt).format('MMM D, h:mm A') : 'No backup recorded'}
        />
        <StatCard label="Customer Due" value={dualMoney(s.customerDue)} accent="red" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Supplier Payable" value={dualMoney(s.supplierPayable)} accent="amber" />
        <StatCard label="Gross Profit" value={dualMoney(s.grossProfit)} accent="green" />
        <StatCard label="Net Position" value={dualMoney(s.netPosition)} accent="blue" subtext="Total account balance" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Sales" value={dualMoney(s.totalSales)} accent="blue" />
        <StatCard label="Total Purchase" value={dualMoney(s.totalPurchase)} accent="slate" />
        <StatCard label="Expense Total" value={dualMoney(s.expenseTotal)} accent="red" />
      </div>

      {can('accounts:view') && summary?.accountBalances?.length > 0 && (
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Account Balances</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.accountBalances.map((acc) => (
              <div key={acc.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">{acc.name}</p>
                <DualCurrencyAmount totalBRL={brlFromBdt(acc.balance)} totalBDT={acc.balance ?? 0} size="md" className="mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Recent Bookings</h3>
          {can('bookings:view') && (
            <Link to="/bookings" className="text-xs font-semibold text-brand-600 hover:underline">View all</Link>
          )}
        </div>
        {activity?.bookings?.length ? (
          <ul className="divide-y divide-slate-100">
            {activity.bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <Link to={`/bookings/${b.id}`} className="text-sm font-medium text-brand-600 hover:underline">{b.bookingNumber}</Link>
                  <p className="text-xs text-slate-500">{b.customerName || '—'} · {b.airline} — {b.route}</p>
                </div>
                <DualCurrencyAmount totalBRL={brlFromBdt(b.salePrice)} totalBDT={b.salePrice ?? 0} size="sm" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No bookings yet" description="Create a customer, then add a booking from the Bookings page." />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Payment Alerts</h3>
            {can('bookings:view') && (
              <Link to="/bookings/upcoming" className="text-xs font-semibold text-brand-600 hover:underline">Upcoming flights</Link>
            )}
          </div>
          {alerts?.paymentAlerts?.length ? (
            <div className="space-y-2">
              {alerts.paymentAlerts.map((a) => {
                const styles = {
                  green: 'border-green-200 bg-green-50 text-green-900',
                  yellow: 'border-amber-200 bg-amber-50 text-amber-900',
                  red: 'border-red-200 bg-red-50 text-red-900',
                };
                return (
                  <div key={a.id} className={`flex items-center justify-between rounded-lg border px-4 py-3 ${styles[a.alertColor] || styles.yellow}`}>
                    <div>
                      <Link to={`/bookings/${a.id}`} className="text-sm font-medium hover:underline">{a.bookingNumber}</Link>
                      <p className="text-xs opacity-80">{a.customerName} · Due ৳ {Number(a.customerDue || 0).toLocaleString()}</p>
                    </div>
                    <p className="text-xs">{a.duePaymentAt ? dayjs(a.duePaymentAt).format('MMM D, h:mm A') : 'No due date'}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No payment alerts" description="Outstanding balances with due dates appear here." icon="✓" />
          )}
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Reminders</h3>
          {alerts?.reminders?.length ? (
            <div className="space-y-3">
              {alerts.reminders.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                  <p className="text-sm font-medium text-blue-900">{r.title}</p>
                  <p className="text-xs text-blue-600">{dayjs(r.dueDate).format('MMM D')}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No reminders due" description="Upcoming reminders will show here." icon="✓" />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Supplier Payable Alerts</h3>
            {can('bookings:view') && (
              <Link to="/bookings" className="text-xs font-semibold text-brand-600 hover:underline">All bookings</Link>
            )}
          </div>
          {alerts?.supplierAlerts?.length ? (
            <div className="space-y-2">
              {alerts.supplierAlerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <div>
                    <Link to={`/bookings/${a.id}`} className="text-sm font-medium text-amber-900 hover:underline">{a.bookingNumber}</Link>
                    <p className="text-xs text-amber-800">{a.supplierName} · {a.route || '—'}</p>
                  </div>
                  <div className="text-right text-xs text-amber-900">
                    <p>Due ৳ {Number(a.supplierPayable || 0).toLocaleString()}</p>
                    {a.departureDate && <p className="opacity-80">Flown {dayjs(a.departureDate).format('MMM D')}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No overdue supplier payables" description="Past-departure bookings with supplier balance appear here." icon="✓" />
          )}
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Failed Notifications</h3>
            {can('notifications:view') && (
              <Link to="/notifications/logs?status=failed" className="text-xs font-semibold text-brand-600 hover:underline">View logs</Link>
            )}
          </div>
          {alerts?.failedNotifications?.length ? (
            <div className="space-y-2">
              {alerts.failedNotifications.map((n) => (
                <div key={n.id} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={n.channel} label={n.channel} />
                    <span className="text-xs text-red-700">{dayjs(n.createdAt).format('MMM D, h:mm A')}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-red-900">{n.eventType} → {n.recipient}</p>
                  {n.errorMessage && <p className="mt-1 text-xs text-red-700">{n.errorMessage}</p>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent failures" description="Failed SMS, email, or WhatsApp sends appear here." icon="✓" />
          )}
          {alerts?.backupFailure && (
            <div className="mt-4 rounded-lg border border-red-300 bg-red-100 px-4 py-3">
              <p className="text-sm font-semibold text-red-900">Backup failure</p>
              <p className="mt-1 text-xs text-red-800">{alerts.backupFailure.errorMessage || 'Last backup job failed'}</p>
              {can('settings:manage') && (
                <Link to="/backup" className="mt-2 inline-block text-xs font-semibold text-red-700 hover:underline">Open backup</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
