import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountsApi } from '../services/finance.api';
import { customersApi, suppliersApi } from '../services/crm.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MoneyAmount from '../components/common/MoneyAmount';
import StatCard from '../components/common/StatCard';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_COLORS } from '../utils/finance';

export default function LedgerPage() {
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      accountsApi.summary(),
      customersApi.list({ limit: 8 }),
      suppliersApi.list({ limit: 8 }),
    ])
      .then(([acc, cust, sup]) => {
        setSummary(acc.data.data);
        setCustomers(cust.data.data || []);
        setSuppliers(sup.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Ledger</h2>
        <p className="text-sm text-slate-500">Account balances, statements, and quick links to receivables and payables.</p>
      </div>

      <StatCard
        label="Total cash & bank balance"
        value={<MoneyAmount amount={summary?.totalBalance} size="lg" />}
        accent="blue"
        subtext="Sum of all active accounts"
      />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Account statements</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary?.accounts?.map((acc) => (
            <Link key={acc.id} to={`/accounts/${acc.id}/statement`} className="block">
              <div className={`card border-l-4 ${ACCOUNT_TYPE_COLORS[acc.type] || 'border-l-slate-400'} transition hover:shadow-md`}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {ACCOUNT_TYPE_LABELS[acc.type] || acc.name}
                </p>
                <p className="mt-1 font-medium text-slate-900">{acc.name}</p>
                <MoneyAmount amount={acc.currentBalance} size="lg" className="mt-2" />
                <p className="mt-2 text-xs font-medium text-brand-600">View statement →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Customer receivables</h3>
            <Link to="/payments/customers" className="text-xs font-medium text-brand-600 hover:underline">All payments</Link>
          </div>
          {customers.length ? (
            <ul className="divide-y divide-slate-100">
              {customers.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <Link to={`/customers`} className="font-medium text-slate-800 hover:text-brand-600">{c.name}</Link>
                  <MoneyAmount amount={c.totalDue || 0} size="sm" className={(c.totalDue || 0) > 0 ? 'text-red-600' : ''} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No customer balances.</p>
          )}
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Supplier payables</h3>
            <Link to="/payments/suppliers" className="text-xs font-medium text-brand-600 hover:underline">All payments</Link>
          </div>
          {suppliers.length ? (
            <ul className="divide-y divide-slate-100">
              {suppliers.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-slate-800">{s.name}</span>
                  <MoneyAmount amount={s.totalPayable || 0} size="sm" className={(s.totalPayable || 0) > 0 ? 'text-amber-700' : ''} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No supplier balances.</p>
          )}
        </div>
      </div>
    </div>
  );
}
