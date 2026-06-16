import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { agentApi } from '../services/agent.api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useCurrency } from '../hooks/useCurrency';
import DualCurrencyAmount from '../components/DualCurrencyAmount';
import { formatCurrency } from '../utils/constants';

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

function DualTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="rounded-lg border bg-white p-2 text-sm shadow">
      <p className="font-medium">{label}</p>
      {row?.revenueBRL != null && (
        <p>R$ {Number(row.revenueBRL).toLocaleString('en-US', { minimumFractionDigits: 2 })} | ৳ {Number(row.revenueBDT ?? row.revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
      )}
      {payload[0]?.dataKey === 'bookings' && <p>{payload[0].value} bookings</p>}
    </div>
  );
}

export default function ReportsPage() {
  const { brlRate, ratesUpdatedAt } = useCurrency();
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ dateFrom: '', dateTo: '' });

  useEffect(() => {
    setLoading(true);
    const params = { dateFrom: range.dateFrom || undefined, dateTo: range.dateTo || undefined };
    Promise.all([
      agentApi.reportSummary(params),
      agentApi.reportMonthly({ year: new Date().getFullYear() }),
    ]).then(([s, m]) => {
      setSummary(s.data.data);
      setMonthly(m.data.data.months || []);
    }).finally(() => setLoading(false));
  }, [range]);

  const currentRate = summary?.currentBdtRate ?? brlRate;

  const exportCsv = () => {
    if (!summary?.byAirline?.length) return;
    const header = [
      'All BDT values use rate at time of each booking',
      `Current rate reference: 1 BRL = ${currentRate} BDT`,
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
      '',
      'Airline,Bookings,Revenue (BRL),Revenue (BDT)',
    ];
    const rows = summary.byAirline.map((a) => [
      a.airline,
      a.count,
      (a.revenueBRL ?? 0).toFixed(2),
      (a.revenueBDT ?? a.revenue ?? 0).toFixed(2),
    ]);
    const blob = new Blob([[...header, ...rows.map((r) => r.join(','))].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent-report.csv';
    a.click();
  };

  if (loading) return <LoadingSkeleton rows={6} />;

  const rateDate = ratesUpdatedAt ? new Date(ratesUpdatedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-xs text-slate-500">Exchange rate: 1 BRL = ৳ {Number(currentRate).toFixed(2)} (updated: {rateDate})</p>
        </div>
        <button type="button" onClick={exportCsv} className="btn-secondary">Export CSV</button>
      </div>
      <div className="flex gap-3">
        <input type="date" className="input-field w-auto" value={range.dateFrom} onChange={(e) => setRange({ ...range, dateFrom: e.target.value })} />
        <input type="date" className="input-field w-auto" value={range.dateTo} onChange={(e) => setRange({ ...range, dateTo: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card"><p className="text-xs text-slate-500">Total bookings</p><p className="text-2xl font-bold">{summary?.totalBookings || 0}</p></div>
        <div className="card">
          <p className="text-xs text-slate-500">Revenue</p>
          <DualCurrencyAmount
            totalBRL={summary?.totalRevenueBRL ?? 0}
            totalBDT={summary?.totalRevenueBDT ?? summary?.totalRevenue ?? 0}
            size="lg"
            className="mt-2"
          />
        </div>
        <div className="card"><p className="text-xs text-slate-500">Confirmed</p><p className="text-2xl font-bold">{summary?.confirmed || 0}</p></div>
        <div className="card"><p className="text-xs text-slate-500">Pending</p><p className="text-2xl font-bold">{summary?.pending || 0}</p></div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-4 font-semibold">By airline</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-2">Airline</th>
              <th className="pb-2">Bookings</th>
              <th className="pb-2">Revenue (BRL)</th>
              <th className="pb-2">Revenue (BDT)</th>
            </tr>
          </thead>
          <tbody>
            {(summary?.byAirline || []).map((a) => (
              <tr key={a.airline} className="border-b border-slate-100">
                <td className="py-2">{a.airline}</td>
                <td className="py-2">{a.count}</td>
                <td className="py-2">{formatCurrency(a.revenueBRL ?? 0, 'BRL')}</td>
                <td className="py-2">{formatCurrency(a.revenueBDT ?? a.revenue ?? 0, 'BDT')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card h-72">
          <h2 className="mb-4 font-semibold">Monthly volume</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={monthly}><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="bookings" fill="#1e40af" /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card h-72">
          <h2 className="mb-4 font-semibold">Monthly revenue (R$)</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={monthly}>
              <XAxis dataKey="label" />
              <YAxis label={{ value: 'Revenue (R$)', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<DualTooltip />} />
              <Bar dataKey="revenueBRL" fill="#1e40af" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card h-72 lg:col-span-2">
          <h2 className="mb-4 font-semibold">By airline (share)</h2>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={summary?.byAirline || []} dataKey="count" nameKey="airline" cx="50%" cy="50%" outerRadius={80} label>
                {(summary?.byAirline || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
