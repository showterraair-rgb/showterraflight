import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Plane, Clock, X, RefreshCw, Repeat2, Check, TrendingUp, Receipt,
  PiggyBank, Banknote, Phone, Landmark, WalletCards, SendHorizonal, CreditCard,
} from 'lucide-react';
import { dashboardApi } from '../services/auth.api';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import DualCurrencyAmount from '../components/common/DualCurrencyAmount';
import StatTile from '../components/ui/StatTile';
import BalCard from '../components/ui/BalCard';
import SectionHead from '../components/ui/SectionHead';
import RGrid from '../components/ui/RGrid';
import QuickActionBar from '../components/ui/QuickActionBar';
import { useCurrency } from '../hooks/useCurrency';
import { usePermission } from '../hooks/usePermission';
import { useBP } from '../hooks/useBreakpoint';
import { C, fontDisplay, fontMono, fontSans } from '../theme/tokens';

function fmtNum(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ACCENT_CYCLE = [C.teal, C.green, C.blue, C.violet, C.amber, C.indigo];
const ACCENT_ICONS = [
  <Phone size={16} key="p" />,
  <Banknote size={16} key="b" />,
  <WalletCards size={16} key="w" />,
  <Landmark size={16} key="l" />,
  <SendHorizonal size={16} key="s" />,
  <CreditCard size={16} key="c" />,
];

export default function DashboardPage() {
  const { can } = usePermission();
  const bp = useBP();
  const isMobile = bp === 'mobile';
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
  const dateStr = dayjs().format('dddd, D MMMM YYYY');
  const rateStr = Number(brlRate).toFixed(4);
  const live = Boolean(ratesUpdatedAt);

  const moneySub = (amountBDT) => `৳ ${fmtMoney(amountBDT)}`;
  const moneyVal = (amountBDT) => fmtMoney(brlFromBdt(amountBDT));

  const balances = summary?.accountBalances || [];
  const combinedBdt = balances.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const combinedBrl = brlFromBdt(combinedBdt);

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 16, gap: 12, flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.indigo, ...fontDisplay }}>
            Business Overview
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: C.muted, ...fontSans }}>{dateStr}</span>
            <span style={{ ...fontMono, fontSize: 11, color: C.teal, fontWeight: 600 }}>
              R$ 1 = ৳ {rateStr}
            </span>
            <span
              style={{
                ...fontMono, fontSize: 10, color: C.green, background: C.greenLight,
                padding: '1px 7px', borderRadius: 10,
              }}
            >
              ● {live ? 'Live' : 'Cached'}
            </span>
          </div>
        </div>
      </div>

      <QuickActionBar />

      {/* Operations — keep live KPI labels */}
      <SectionHead title="Today's Bookings" />
      <RGrid cols={isMobile ? 2 : 4} gap={10}>
        <StatTile label="Today's Bookings" value={fmtNum(s.todayBookings)} icon={<Plane size={22} style={{ transform: 'rotate(-45deg)' }} />} color={C.teal} />
        <StatTile label="Pending Bookings" value={fmtNum(s.pendingBookings)} icon={<Clock size={22} />} color={C.amber} />
        <StatTile label="Issued Tickets" value={fmtNum(s.issuedTickets)} icon={<Check size={22} />} color={C.green} />
        <StatTile label="Active Bookings" value={fmtNum(s.totalActiveBookings)} icon={<Plane size={22} />} color={C.indigo600} />
      </RGrid>

      <div style={{ height: 20 }} />
      <SectionHead title="Operations Status" />
      <RGrid cols={isMobile ? 2 : 6} gap={10}>
        <StatTile label="Voided" value={fmtNum(s.voidedCount)} icon={<X size={22} />} color={C.red} />
        <StatTile label="Refunded" value={fmtNum(s.refundedCount)} icon={<RefreshCw size={22} />} color={C.violet} />
        <StatTile label="Reissued" value={fmtNum(s.reissuedCount)} icon={<Repeat2 size={22} />} color={C.blue} />
        <StatTile label="Pending Refunds" value={fmtNum(s.pendingRefundRequests)} icon={<Clock size={22} />} color={C.amber} sub="Awaiting approval" />
        <StatTile label="Due Collections" value={fmtNum(s.dueCollectionCount)} icon={<Banknote size={22} />} color={C.red} />
        <StatTile label="Supplier Due" value={fmtNum(s.dueSupplierCount)} icon={<BuildingIcon />} color={C.amber} />
      </RGrid>

      <div style={{ height: 20 }} />
      <SectionHead title="Financial Summary" />
      <RGrid cols={isMobile ? 1 : 3} gap={10}>
        <StatTile label="Total Sales" value={moneyVal(s.totalSales)} currency="R$" icon={<TrendingUp size={26} />} color={C.teal} sub={moneySub(s.totalSales)} />
        <StatTile label="Total Purchase" value={moneyVal(s.totalPurchase)} currency="R$" icon={<Receipt size={26} />} color={C.amber} sub={moneySub(s.totalPurchase)} />
        <StatTile label="Expense Total" value={moneyVal(s.expenseTotal)} currency="R$" icon={<PiggyBank size={26} />} color={C.red} sub={moneySub(s.expenseTotal)} />
      </RGrid>
      <div style={{ height: 10 }} />
      <RGrid cols={isMobile ? 1 : 3} gap={10}>
        <StatTile label="Customer Due" value={moneyVal(s.customerDue)} currency="R$" icon={<Banknote size={26} />} color={C.red} sub={moneySub(s.customerDue)} />
        <StatTile label="Supplier Payable" value={moneyVal(s.supplierPayable)} currency="R$" icon={<Receipt size={26} />} color={C.amber} sub={moneySub(s.supplierPayable)} />
        <StatTile label="Gross Profit" value={moneyVal(s.grossProfit)} currency="R$" icon={<TrendingUp size={26} />} color={C.green} sub={moneySub(s.grossProfit)} />
      </RGrid>
      <div style={{ height: 10 }} />
      <RGrid cols={isMobile ? 1 : 3} gap={10}>
        <StatTile label="Net Position" value={moneyVal(s.netPosition)} currency="R$" icon={<Banknote size={26} />} color={C.blue} sub={moneySub(s.netPosition)} />
        <StatTile label="Pending Reminders" value={fmtNum(s.pendingReminders)} icon={<Clock size={22} />} color={C.indigo600} />
        <StatTile
          label="Failed Notifications (24h)"
          value={fmtNum(s.failedNotifications24h)}
          icon={<X size={22} />}
          color={s.failedNotifications24h > 0 ? C.red : C.green}
        />
      </RGrid>

      {/* Account Balances */}
      {can('accounts:view') && balances.length > 0 && (
        <>
          <div style={{ height: 20 }} />
          <SectionHead
            title="Account Balances"
            action={
              <Link
                to="/settings/payment-accounts"
                style={{
                  fontSize: 11, color: C.teal, background: 'none',
                  border: `1px solid ${C.teal}44`, borderRadius: 5,
                  padding: '3px 10px', textDecoration: 'none', ...fontSans, fontWeight: 500,
                }}
              >
                Manage →
              </Link>
            }
          />
          <RGrid cols={isMobile ? 2 : Math.min(balances.length, 6)} gap={10}>
            {balances.map((acc, i) => (
              <BalCard
                key={acc.id}
                name={acc.name}
                icon={ACCENT_ICONS[i % ACCENT_ICONS.length]}
                currency="৳"
                amount={fmtMoney(acc.balance)}
                accentColor={ACCENT_CYCLE[i % ACCENT_CYCLE.length]}
                sub={acc.type || 'Account'}
              />
            ))}
          </RGrid>
          <div
            style={{
              marginTop: 10, padding: '14px 20px', background: C.indigo, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: '#8FA3BF', ...fontSans }}>
              Combined balance across all accounts
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#4A6080', ...fontSans, marginBottom: 2 }}>TOTAL (BRL)</div>
                <div style={{ ...fontMono, fontSize: 18, fontWeight: 600, color: '#fff' }}>
                  R$ {fmtMoney(combinedBrl)}
                </div>
              </div>
              <div style={{ width: 1, height: 32, background: C.indigo700 }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#4A6080', ...fontSans, marginBottom: 2 }}>TOTAL (BDT)</div>
                <div style={{ ...fontMono, fontSize: 18, fontWeight: 600, color: C.teal }}>
                  ৳ {fmtMoney(combinedBdt)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent Bookings + alerts — keep live functionality, restyle cards */}
      <div style={{ height: 24 }} />
      <div className="card">
        <div className="mb-4 flex items-center justify-between gap-2">
          <SectionHead title="Recent Bookings" />
          {can('bookings:view') && (
            <Link to="/bookings" className="text-xs font-semibold" style={{ color: C.teal }}>View all</Link>
          )}
        </div>
        {activity?.bookings?.length ? (
          <ul className="divide-y" style={{ borderColor: C.border }}>
            {activity.bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <Link to={`/bookings/${b.id}`} className="text-sm font-medium hover:underline" style={{ color: C.teal, ...fontMono }}>
                    {b.bookingNumber}
                  </Link>
                  <p className="text-xs" style={{ color: C.muted }}>
                    {b.customerName || '—'} · {b.airline} — {b.route}
                  </p>
                </div>
                <DualCurrencyAmount totalBRL={brlFromBdt(b.salePrice)} totalBDT={b.salePrice ?? 0} size="sm" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No bookings yet" description="Create a customer, then add a booking from the Bookings page." />
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold" style={{ color: C.indigo, ...fontDisplay }}>Payment Alerts</h3>
            {can('bookings:view') && (
              <Link to="/bookings/upcoming" className="text-xs font-semibold" style={{ color: C.teal }}>Upcoming flights</Link>
            )}
          </div>
          {alerts?.paymentAlerts?.length ? (
            <div className="space-y-2">
              {alerts.paymentAlerts.map((a) => {
                const styles = {
                  green: { border: C.greenLight, bg: C.greenLight, color: C.green },
                  yellow: { border: C.amberLight, bg: C.amberLight, color: '#92400e' },
                  red: { border: C.redLight, bg: C.redLight, color: C.red },
                };
                const st = styles[a.alertColor] || styles.yellow;
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                    style={{ borderColor: st.border, background: st.bg, color: st.color }}
                  >
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
          <h3 className="mb-4 text-sm font-semibold" style={{ color: C.indigo, ...fontDisplay }}>Reminders</h3>
          {alerts?.reminders?.length ? (
            <div className="space-y-3">
              {alerts.reminders.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: C.blueLight }}>
                  <p className="text-sm font-medium" style={{ color: C.indigo }}>{r.title}</p>
                  <p className="text-xs" style={{ color: C.blue }}>{dayjs(r.dueDate).format('MMM D')}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No reminders due" description="Upcoming reminders will show here." icon="✓" />
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {alerts?.pendingRefunds?.length > 0 && (
          <div className="card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold" style={{ color: C.indigo, ...fontDisplay }}>Pending Refund Requests</h3>
              {can('bookings:view') && (
                <Link to="/bookings/pending-refunds" className="text-xs font-semibold" style={{ color: C.teal }}>View all</Link>
              )}
            </div>
            <div className="space-y-2">
              {alerts.pendingRefunds.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3" style={{ borderColor: C.amberLight, background: C.amberLight }}>
                  <div>
                    <Link to={`/bookings/${b.id}`} className="text-sm font-medium hover:underline" style={{ color: '#92400e' }}>{b.bookingNumber}</Link>
                    <p className="text-xs" style={{ color: '#92400e' }}>{b.customerName} · {b.route || '—'}</p>
                    {b.rrvNote && <p className="mt-1 text-xs" style={{ color: '#b45309' }}>{b.rrvNote}</p>}
                  </div>
                  <div className="text-right text-xs" style={{ color: '#92400e' }}>
                    <p>Paid ৳ {Number(b.amountPaid || 0).toLocaleString()}</p>
                    {b.rrvPenalty > 0 && <p className="opacity-80">Penalty ৳ {Number(b.rrvPenalty).toLocaleString()}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold" style={{ color: C.indigo, ...fontDisplay }}>Supplier Payable Alerts</h3>
            {can('bookings:view') && (
              <Link to="/bookings" className="text-xs font-semibold" style={{ color: C.teal }}>All bookings</Link>
            )}
          </div>
          {alerts?.supplierAlerts?.length ? (
            <div className="space-y-2">
              {alerts.supplierAlerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border px-4 py-3" style={{ borderColor: C.amberLight, background: C.amberLight }}>
                  <div>
                    <Link to={`/bookings/${a.id}`} className="text-sm font-medium hover:underline" style={{ color: '#92400e' }}>{a.bookingNumber}</Link>
                    <p className="text-xs" style={{ color: '#92400e' }}>{a.supplierName} · {a.route || '—'}</p>
                  </div>
                  <div className="text-right text-xs" style={{ color: '#92400e' }}>
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
            <h3 className="text-sm font-semibold" style={{ color: C.indigo, ...fontDisplay }}>Failed Notifications</h3>
            {can('notifications:view') && (
              <Link to="/notifications/logs?status=failed" className="text-xs font-semibold" style={{ color: C.teal }}>View logs</Link>
            )}
          </div>
          {alerts?.failedNotifications?.length ? (
            <div className="space-y-2">
              {alerts.failedNotifications.map((n) => (
                <div key={n.id} className="rounded-lg border px-4 py-3" style={{ borderColor: C.redLight, background: C.redLight }}>
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={n.channel} label={n.channel} />
                    <span className="text-xs" style={{ color: C.red }}>{dayjs(n.createdAt).format('MMM D, h:mm A')}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium" style={{ color: C.red }}>{n.eventType} → {n.recipient}</p>
                  {n.errorMessage && <p className="mt-1 text-xs" style={{ color: C.red }}>{n.errorMessage}</p>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent failures" description="Failed SMS, email, or WhatsApp sends appear here." icon="✓" />
          )}
          {alerts?.backupFailure && (
            <div className="mt-4 rounded-lg border px-4 py-3" style={{ borderColor: C.red, background: C.redLight }}>
              <p className="text-sm font-semibold" style={{ color: C.red }}>Backup failure</p>
              <p className="mt-1 text-xs" style={{ color: C.red }}>{alerts.backupFailure.errorMessage || 'Last backup job failed'}</p>
              {can('settings:manage') && (
                <Link to="/backup" className="mt-2 inline-block text-xs font-semibold hover:underline" style={{ color: C.red }}>Open backup</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BuildingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
