import { useCallback, useEffect, useState } from 'react';
import { agentApi } from '../services/agent.api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import DualCurrencyAmount from '../components/DualCurrencyAmount';
import { formatDate } from '../utils/constants';
import { useAuthStore } from '../store/authStore';
import { useCurrency } from '../hooks/useCurrency';

function AmountCell({ amountBDT, brlRate }) {
  if (!amountBDT) return <span className="text-slate-400">—</span>;
  const totalBRL = brlRate > 0 ? amountBDT / brlRate : 0;
  return <DualCurrencyAmount totalBRL={totalBRL} totalBDT={amountBDT} size="sm" />;
}

export default function StatementPage() {
  const agent = useAuthStore((s) => s.agent);
  const { brlRate, ratesUpdatedAt } = useCurrency();
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

  const balanceBRL = brlRate > 0 ? (agent?.currentBalance ?? 0) / brlRate : 0;
  const rateDate = ratesUpdatedAt ? new Date(ratesUpdatedAt).toLocaleDateString() : '—';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Account Statement</h1>
      <p className="text-sm text-slate-600">
        Current balance:{' '}
        <DualCurrencyAmount totalBRL={balanceBRL} totalBDT={agent?.currentBalance ?? 0} size="md" className="inline-flex" />
      </p>
      <p className="text-xs text-slate-500">
        Rate reference: 1 BRL = ৳ {Number(brlRate).toFixed(2)} (updated: {rateDate}). Historical entries use rate at time of transaction.
      </p>
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
                <tr key={t.id} className="border-b border-slate-100 align-top">
                  <td className="py-2">{formatDate(t.date)}</td>
                  <td className="py-2">{t.description}</td>
                  <td className="py-2 text-red-600"><AmountCell amountBDT={t.debit} brlRate={brlRate} /></td>
                  <td className="py-2 text-green-700"><AmountCell amountBDT={t.credit} brlRate={brlRate} /></td>
                  <td className="py-2"><AmountCell amountBDT={t.balanceAfter} brlRate={brlRate} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
