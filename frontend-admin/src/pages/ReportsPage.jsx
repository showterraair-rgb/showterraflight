import { useCallback, useEffect, useState } from 'react';
import { reportsApi } from '../services/phase5.api';
import { accountsApi } from '../services/finance.api';
import { customersApi, suppliersApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { usePermission } from '../hooks/usePermission';

const REPORTS = [
  { key: 'booking-profit', label: 'Booking profit', filters: ['from', 'to', 'status', 'customer', 'supplier'] },
  { key: 'customer-due', label: 'Customer due', filters: ['customer', 'status'] },
  { key: 'supplier-payable', label: 'Supplier payable', filters: ['supplier', 'status'] },
  { key: 'expense-category', label: 'Expense by category', filters: ['from', 'to'] },
  { key: 'account-statement', label: 'Account statement', filters: ['from', 'to', 'account'] },
  { key: 'income-vs-expense', label: 'Income vs expense', filters: ['from', 'to'] },
  { key: 'account-balance', label: 'Account balance', filters: [] },
  { key: 'monthly-summary', label: 'Monthly summary', filters: ['year'] },
];

function buildColumns(rows) {
  if (!rows?.length) return [];
  return Object.keys(rows[0]).map((key) => ({
    key,
    label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
    render: (r) => {
      const v = r[key];
      if (typeof v === 'number' && (key.includes('amount') || key.includes('Price') || key.includes('profit') || key.includes('Due') || key.includes('Payable') || key.includes('total') || key.includes('Balance') || key.includes('income') || key.includes('expense') || key.includes('net') || key.includes('sales'))) {
        return formatCurrency(v);
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

  const reportMeta = REPORTS.find((r) => r.key === selected);

  useEffect(() => {
    Promise.all([
      accountsApi.list(),
      customersApi.list({ limit: 200 }),
      suppliersApi.list({ limit: 200 }),
    ]).then(([acc, cust, sup]) => {
      setAccounts(acc.data.data);
      setCustomers(cust.data.data);
      setSuppliers(sup.data.data);
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
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selected}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const columns = buildColumns(result?.rows);
  const summaryCards = [];

  if (result?.totals) {
    summaryCards.push({ label: 'Total profit', value: formatCurrency(result.totals.profit) });
    summaryCards.push({ label: 'Customer due', value: formatCurrency(result.totals.customerDue) });
  }
  if (result?.totalDue != null) summaryCards.push({ label: 'Total due', value: formatCurrency(result.totalDue) });
  if (result?.totalPayable != null) summaryCards.push({ label: 'Total payable', value: formatCurrency(result.totalPayable) });
  if (result?.net != null) summaryCards.push({ label: 'Net', value: formatCurrency(result.net) });
  if (result?.totalBalance != null) summaryCards.push({ label: 'Total balance', value: formatCurrency(result.totalBalance) });

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
          {reportMeta?.filters.includes('account') && (
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={filters.accountId || ''} onChange={(e) => setFilters((f) => ({ ...f, accountId: e.target.value }))}>
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <button type="button" onClick={runReport} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">Run</button>
          {can('reports:export') && (
            <button type="button" onClick={exportCsv} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Export CSV</button>
          )}
        </div>
      </div>

      {summaryCards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((c) => (
            <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">{c.label}</p>
              <p className="text-lg font-semibold text-slate-900">{c.value}</p>
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
