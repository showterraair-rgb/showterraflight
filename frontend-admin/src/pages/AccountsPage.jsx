import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountsApi } from '../services/finance.api';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MoneyAmount from '../components/common/MoneyAmount';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_COLORS } from '../utils/finance';
import { usePermission } from '../hooks/usePermission';

export default function AccountsPage() {
  const { can } = usePermission();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.summary().then(({ data }) => setSummary(data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Accounts</h2>
          <p className="text-sm text-slate-500">Where your money is located — Cash, Bank, bKash, Nagad</p>
        </div>
        <div className="flex gap-2">
          {can('transfers:create') && (
            <Link to="/transfers" className="btn-secondary">Transfers</Link>
          )}
        </div>
      </div>

      <StatCard
        label="Total Available Balance"
        value={<MoneyAmount amount={summary?.totalBalance} size="lg" />}
        accent="blue"
        subtext="Sum of all active accounts"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary?.accounts?.map((acc) => (
          <Link key={acc.id} to={`/accounts/${acc.id}/statement`} className="block">
            <div className={`card border-l-4 ${ACCOUNT_TYPE_COLORS[acc.type] || 'border-l-slate-400'} transition hover:shadow-md`}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {ACCOUNT_TYPE_LABELS[acc.type] || acc.name}
              </p>
              <MoneyAmount amount={acc.currentBalance} size="lg" className="mt-2" />
              <p className="mt-1 text-xs text-slate-400">Opening: <MoneyAmount amount={acc.openingBalance} size="sm" className="inline-flex" /></p>
              <p className="mt-3 text-xs font-medium text-brand-600">View statement →</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
