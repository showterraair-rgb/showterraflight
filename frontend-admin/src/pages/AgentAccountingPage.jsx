import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { agentsApi, agentAccountingApi } from '../services/agents.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DataTable from '../components/common/DataTable';
import MoneyAmount from '../components/common/MoneyAmount';
import { usePermission } from '../hooks/usePermission';

function AmountCell({ amount }) {
  if (!amount) return <span className="text-slate-400">—</span>;
  return <MoneyAmount amount={amount} size="sm" />;
}

export default function AgentAccountingPage() {
  const { agentId } = useParams();
  const { can } = usePermission();
  const [agents, setAgents] = useState([]);
  const [agent, setAgent] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: 'credit', amount: '', description: '' });

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await agentsApi.list({ limit: 50 });
      setAgents(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLedger = useCallback(async () => {
    if (!agentId) return loadAgents();
    setLoading(true);
    try {
      const [{ data: a }, { data: l }] = await Promise.all([
        agentsApi.get(agentId),
        agentAccountingApi.ledger(agentId, { limit: 50 }),
      ]);
      setAgent(a.data);
      setItems(l.data);
    } finally {
      setLoading(false);
    }
  }, [agentId, loadAgents]);

  useEffect(() => { loadLedger(); }, [loadLedger]);

  const addTxn = async (e) => {
    e.preventDefault();
    await agentAccountingApi.addTransaction(agentId, form);
    setForm({ type: 'credit', amount: '', description: '' });
    loadLedger();
  };

  if (loading) return <LoadingSpinner className="py-20" />;

  if (!agentId) {
    const columns = [
      { key: 'agentId', label: 'Agent ID', render: (r) => <Link to={`/agent-accounting/${r.id}`} className="font-mono text-xs text-brand-600">{r.agentId}</Link> },
      { key: 'companyName', label: 'Company' },
      { key: 'currentBalance', label: 'Balance (BRL / BDT)', render: (r) => <MoneyAmount amount={r.currentBalance} size="sm" /> },
    ];
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Agent Accounting</h2>
        <p className="text-sm text-slate-500">Select an agent to view ledger and add transactions.</p>
        <DataTable columns={columns} data={agents} loading={false} emptyMessage="No agents yet" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to={agentId ? `/agents/${agentId}` : '/agents'} className="text-sm text-brand-600">← Back</Link>
      <div className="card">
        <h2 className="text-xl font-bold">{agent?.companyName}</h2>
        <p className="text-sm">Balance: <MoneyAmount amount={agent?.currentBalance} size="md" className="inline-flex font-semibold" /></p>
      </div>
      {can('agent-accounting:manage') && (
        <form onSubmit={addTxn} className="card grid gap-3 sm:grid-cols-4">
          <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <input type="number" min={0} className="input-field" placeholder="Amount (BDT)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <input className="input-field sm:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <button type="submit" className="btn-primary sm:col-span-4">Add transaction</button>
        </form>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500"><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 align-top">
                <td className="py-2">{new Date(t.date).toLocaleDateString()}</td>
                <td className="py-2">{t.description}</td>
                <td className="py-2 text-red-600"><AmountCell amount={t.debit} /></td>
                <td className="py-2 text-green-700"><AmountCell amount={t.credit} /></td>
                <td className="py-2"><AmountCell amount={t.balanceAfter} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
