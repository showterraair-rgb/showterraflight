import { useCallback, useEffect, useState } from 'react';
import { agentApi } from '../services/agent.api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { formatCurrency, formatDate } from '../utils/constants';
import { useAuthStore } from '../store/authStore';

export default function StatementPage() {
  const agent = useAuthStore((s) => s.agent);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ dateFrom: '', dateTo: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await agentApi.statement({ dateFrom: range.dateFrom || undefined, dateTo: range.dateTo || undefined, limit: 50 });
      setItems(data.data);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Account Statement</h1>
      <p className="text-sm text-slate-600">Current balance: <strong>{formatCurrency(agent?.currentBalance)}</strong></p>
      <div className="flex gap-3">
        <input type="date" className="input-field w-auto" value={range.dateFrom} onChange={(e) => setRange({ ...range, dateFrom: e.target.value })} />
        <input type="date" className="input-field w-auto" value={range.dateTo} onChange={(e) => setRange({ ...range, dateTo: e.target.value })} />
      </div>
      {loading ? <LoadingSkeleton /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="py-2">{formatDate(t.date)}</td>
                  <td className="py-2">{t.description}</td>
                  <td className="py-2 text-red-600">{t.debit ? formatCurrency(t.debit) : '—'}</td>
                  <td className="py-2 text-green-700">{t.credit ? formatCurrency(t.credit) : '—'}</td>
                  <td className="py-2">{formatCurrency(t.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
