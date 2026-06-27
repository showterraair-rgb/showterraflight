import { useCallback, useEffect, useState } from 'react';
import { reportsApi } from '../services/phase5.api';
import { accountsApi } from '../services/finance.api';
import { customersApi, suppliersApi } from '../services/crm.api';
import { agentsApi } from '../services/agents.api';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MoneyAmount from '../components/common/MoneyAmount';
import { formatDate } from '../utils/date';
import { downloadBlob } from '../utils/download';
import { usePermission } from '../hooks/usePermission';

const REPORTS = [
  { key: 'sales-summary', label: 'Sales report', filters: ['from', 'to'] },
  { key: 'booking-profit', label: 'Booking profit', filters: ['from', 'to', 'status', 'customer', 'supplier'] },
  { key: 'customer-due', label: 'Customer due', filters: ['customer', 'status'] },
  { key: 'supplier-payable', label: 'Supplier payable', filters: ['supplier', 'status'] },
  { key: 'expense-category', label: 'Expense by category', filters: ['from', 'to'] },
  { key: 'account-statement', label: 'Account statement', filters: ['from', 'to', 'account'] },
  { key: 'income-vs-expense', label: 'Cash flow', filters: ['from', 'to'] },
  { key: 'account-balance', label: 'Account balance', filters: [] },
  { key: 'monthly-summary', label: 'Monthly summary', filters: ['year'] },
  { key: 'void-report', label: 'Void report', filters: ['from', 'to'] },
  { key: 'refund-report', label: 'Refund report', filters: ['from', 'to'] },
  { key: 'reissue-report', label: 'Reissue report', filters: ['from', 'to'] },
  { key: 'agent-due', label: 'Agent due', filters: ['agent'] },
  { key: 'brl-bdt-daily', label: 'BRL/BDT daily', filters: ['from', 'to'] },
];

function buildColumns(rows) {
  if (!rows?.length) return [];
  return Object.keys(rows[0]).map((key) => ({
    key,
    label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
    render: (r) => {
      const v = r[key];
      if (typeof v === 'number' && (key.includes('amount') || key.includes('Price') || key.includes('profit') || key.includes('Due') || key.includes('Payable') || key.includes('total') || key.includes('Balance') || key.includes('income') || key.includes('expense') || key.includes('net') || key.includes('sales'))) {
        return <MoneyAmount amount={v} size="sm" />;
      }
      if (v instanceof Date || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v))) {
        return formatDate(v);
      }
      return v ?? '—';
    },
  }));
}

export default function ReportsPage() {
  const { can } = usePermission();
  const [selected, setSelected] = useState('booking-profit');
  const [filters, setFilters] = useState({ from: '', to: '', year: new Date().getFullYear() });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [agents, setAgents] = useState([]);

  const reportMeta = REPORTS.find((r) => r.key === selected);

  useEffect(() => {
    Promise.all([
      accountsApi.list(),
      customersApi.list({ limit: 100 }),
      suppliersApi.list({ limit: 100 }),
      agentsApi.list({ limit: 100 }),
    ]).then(([acc, cust, sup, agt]) => {
      setAccounts(acc.data.data);
      setCustomers(cust.data.data);
      setSuppliers(sup.data.data);
      setAgents(agt.data.data);
    }).catch(() => {});
  }, []);

  const runReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.status) params.status = filters.status;
      if (filters.customerId) params.customerId = filters.customerId;
      if (filters.supplierId) params.supplierId = filters.supplierId;
      if (filters.agentId) params.agentId = filters.agentId;
      if (filters.accountId) params.accountId = filters.accountId;
      if (filters.year) params.year = filters.year;

      const { data } = await reportsApi.run(selected, params);
      setResult(data.data);
    } finally {
      setLoading(false);
    }
  }, [selected, filters]);

  useEffect(() => { runReport(); }, [runReport]);

  const exportCsv = async () => {
    const params = { ...filters };
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
    const { data } = await reportsApi.exportCsv(selected, params);
    downloadBlob(data, `${selected}-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportPdf = async () => {
    const params = { ...filters };
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
    const { data } = await reportsApi.exportPdf(selected, params);
    downloadBlob(data, `${selected}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const columns = buildColumns(result?.rows);
  const summaryCards = [];

  if (result?.totals) {
    summaryCards.push({ label: 'Total profit', value: <MoneyAmount amount={result.totals.profit} size="lg" /> });
    summaryCards.push({ label: 'Customer due', value: <MoneyAmount amount={result.totals.customerDue} size="lg" /> });
  }
  if (result?.totals?.count != null) summaryCards.push({ label: 'Records', value: result.totals.count });
  if (result?.totals?.refundAmount != null) summaryCards.push({ label: 'Total refund', value: <MoneyAmount amount={result.totals.refundAmount} size="lg" /> });
  if (result?.totals?.bookingCount != null) summaryCards.push({ label: 'Bookings', value: result.totals.bookingCount });
  if (result?.totals?.totalSaleBDT != null) summaryCards.push({ label: 'Total sale (BDT)', value: <MoneyAmount amount={result.totals.totalSaleBDT} size="lg" /> });
  if (result?.totals?.totalSaleBRL != null) summaryCards.push({ label: 'Total sale (BRL)', value: `R$ ${Number(result.totals.totalSaleBRL).toFixed(2)}` });
  if (result?.totalDue != null) summaryCards.push({ label: 'Total due', value: <MoneyAmount amount={result.totalDue} size="lg" /> });
  if (result?.totalPayable != null) summaryCards.push({ label: 'Total payable', value: <MoneyAmount amount={result.totalPayable} size="lg" /> });
  if (result?.net != null) summaryCards.push({ label: 'Net', value: <MoneyAmount amount={result.net} size="lg" /> });
  if (result?.totalBalance != null) summaryCards.push({ label: 'Total balance', value: <MoneyAmount amount={result.totalBalance} size="lg" /> });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {REPORTS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setSelected(r.key)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${selected === r.key ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">{reportMeta?.label} filters</h3>
        <div className="flex flex-wrap gap-3">
          {reportMeta?.filters.includes('from') && (
            <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          )}
          {reportMeta?.filters.includes('to') && (
            <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
          )}
          {reportMeta?.filters.includes('year') && (
            <input type="number" className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm" value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))} />
          )}
          {reportMeta?.filters.includes('status') && (
            <input placeholder="Status" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={filters.status || ''} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} />
          )}
          {reportMeta?.filters.includes('customer') && (
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={filters.customerId || ''} onChange={(e) => setFilters((f) => ({ ...f, customerId: e.target.value }))}>
              <option value="">All customers</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {reportMeta?.filters.includes('supplier') && (
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={filters.supplierId || ''} onChange={(e) => setFilters((f) => ({ ...f, supplierId: e.target.value }))}>
              <option value="">All suppliers</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {reportMeta?.filters.includes('agent') && (
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={filters.agentId || ''} onChange={(e) => setFilters((f) => ({ ...f, agentId: e.target.value }))}>
              <option value="">All agents</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.companyName || a.agentId}</option>)}
            </select>
          )}
          {reportMeta?.filters.includes('account') && (
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={filters.accountId || ''} onChange={(e) => setFilters((f) => ({ ...f, accountId: e.target.value }))}>
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <button type="button" onClick={runReport} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">Run</button>
          {can('reports:export') && (
            <>
              <button type="button" onClick={exportCsv} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Export CSV</button>
              <button type="button" onClick={exportPdf} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Export PDF</button>
            </>
          )}
        </div>
      </div>

      {summaryCards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((c) => (
            <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">{c.label}</p>
              <div className="text-lg font-semibold text-slate-900">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable columns={columns} rows={result?.rows || []} emptyMessage="No data for selected filters" />
      )}
    </div>
  );
}
