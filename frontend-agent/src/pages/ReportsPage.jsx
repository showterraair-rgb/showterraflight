import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { agentApi } from '../services/agent.api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useCurrency } from '../hooks/useCurrency';
import DualCurrencyAmount from '../components/DualCurrencyAmount';
import { formatCurrency } from '../utils/constants';

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

export default function ReportsPage() {
  const { convert, format, rates, brlRate } = useCurrency();
  const [displayCurrency, setDisplayCurrency] = useState('BDT');
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

  const exportCsv = () => {
    if (!summary?.byAirline?.length) return;
    const header = [
      `Report Currency: ${displayCurrency}`,
      `Exchange Rate Used: 1 BRL = ${brlRate} BDT`,
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
      '',
      'Airline,Bookings,Revenue (BDT),Revenue (Display)',
    ];
    const rows = summary.byAirline.map((a) => [
      a.airline,
      a.count,
      a.revenue,
      convert(a.revenue, 'BDT', displayCurrency).toFixed(2),
    ]);
    const blob = new Blob([[...header, ...rows.map((r) => r.join(','))].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent-report.csv';
    a.click();
  };

  if (loading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5 text-sm">
            {['BDT', 'BRL'].map((c) => (
              <button key={c} type="button" className={`rounded-md px-3 py-1 ${displayCurrency === c ? 'bg-brand-600 text-white' : 'text-slate-600'}`} onClick={() => setDisplayCurrency(c)}>{c}</button>
            ))}
          </div>
          <button type="button" onClick={exportCsv} className="btn-secondary">Export CSV</button>
        </div>
      </div>
      <div className="flex gap-3">
        <input type="date" className="input-field w-auto" value={range.dateFrom} onChange={(e) => setRange({ ...range, dateFrom: e.target.value })} />
        <input type="date" className="input-field w-auto" value={range.dateTo} onChange={(e) => setRange({ ...range, dateTo: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card"><p className="text-xs text-slate-500">Total bookings</p><p className="text-2xl font-bold">{summary?.totalBookings || 0}</p></div>
        <div className="card">
          <p className="text-xs text-slate-500">Revenue</p>
          <DualCurrencyAmount amountBDT={summary?.totalRevenue} showIn={displayCurrency} rates={rates} primaryClassName="text-2xl font-bold" />
        </div>
        <div className="card"><p className="text-xs text-slate-500">Confirmed</p><p className="text-2xl font-bold">{summary?.confirmed || 0}</p></div>
        <div className="card"><p className="text-xs text-slate-500">Pending</p><p className="text-2xl font-bold">{summary?.pending || 0}</p></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card h-72">
          <h2 className="mb-4 font-semibold">Monthly volume</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={monthly}><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="bookings" fill="#1e40af" /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card h-72">
          <h2 className="mb-4 font-semibold">By airline</h2>
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
