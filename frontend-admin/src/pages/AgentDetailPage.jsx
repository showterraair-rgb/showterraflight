import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { agentsApi, agentAccountingApi } from '../services/agents.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MoneyAmount from '../components/common/MoneyAmount';

export default function AgentDetailPage() {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agentsApi.get(id).then(({ data }) => setAgent(data.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!agent) return <p>Agent not found</p>;

  return (
    <div className="space-y-6">
      <Link to="/agents" className="text-sm text-brand-600">← Agents</Link>
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{agent.companyName}</h2>
            <p className="font-mono text-sm text-slate-500">{agent.agentId}</p>
          </div>
          <StatusBadge status={agent.isActive ? 'success' : 'cancelled'} label={agent.isActive ? 'Active' : 'Inactive'} />
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <div><dt className="text-slate-500">Contact</dt><dd>{agent.contactPerson}</dd></div>
          <div><dt className="text-slate-500">Email</dt><dd>{agent.email}</dd></div>
          <div><dt className="text-slate-500">Phone</dt><dd>{agent.phone}</dd></div>
          <div><dt className="text-slate-500">WhatsApp</dt><dd>{agent.whatsapp || '—'}</dd></div>
          <div><dt className="text-slate-500">Balance</dt><dd><MoneyAmount amount={agent.currentBalance} size="sm" /></dd></div>
          <div><dt className="text-slate-500">Credit limit</dt><dd><MoneyAmount amount={agent.creditLimit} size="sm" /></dd></div>
          <div><dt className="text-slate-500">Bookings</dt><dd>{agent.bookingsCount || 0}</dd></div>
        </dl>
        {agent.notes && <p className="mt-4 text-sm text-slate-600"><strong>Notes:</strong> {agent.notes}</p>}
        <div className="mt-6 flex gap-2">
          <Link to={`/agents/${id}/bookings`} className="btn-secondary">View bookings</Link>
          <Link to={`/agent-accounting/${id}`} className="btn-primary">Accounting</Link>
        </div>
      </div>
    </div>
  );
}
