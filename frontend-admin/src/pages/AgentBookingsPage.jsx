import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { agentBookingsApi, agentsApi } from '../services/agents.api';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';

const STATUS_LABELS = { pending: 'Pending', processing: 'Processing', confirmed: 'Confirmed', cancelled: 'Cancelled', reissued: 'Reissued', refunded: 'Refunded' };

export default function AgentBookingsPage({ agentScoped = false }) {
  const { id: agentId } = useParams();
  const [items, setItems] = useState([]);
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (agentScoped && agentId) {
        const [{ data: a }, { data: b }] = await Promise.all([
          agentsApi.get(agentId),
          agentsApi.bookings(agentId, { limit: 50, status: status || undefined }),
        ]);
        setAgent(a.data);
        setItems(b.data);
      } else {
        const { data } = await agentBookingsApi.list({ limit: 50, status: status || undefined });
        setItems(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [agentScoped, agentId, status]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'bookingRef', label: 'Ref', render: (r) => <Link to={`/agent-bookings/${r.id}`} className="font-mono text-xs text-brand-600">{r.bookingRef}</Link> },
    { key: 'agentCompany', label: 'Agent' },
    { key: 'route', label: 'Route' },
    { key: 'airline', label: 'Airline' },
    { key: 'pnr', label: 'PNR', render: (r) => r.pnr || '—' },
    { key: 'passengerCount', label: 'Pax' },
    { key: 'totalFare', label: 'Total', render: (r) => `${r.currency} ${(r.totalFare || 0).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={STATUS_LABELS[r.status]} /> },
    { key: 'createdAt', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-4">
      {agentScoped && (
        <Link to={`/agents/${agentId}`} className="text-sm text-brand-600">← {agent?.companyName || 'Agent'}</Link>
      )}
      <h2 className="text-xl font-bold">{agentScoped ? 'Agent bookings' : 'Agent Bookings'}</h2>
      <select className="input-field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All statuses</option>
        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <DataTable columns={columns} data={items} loading={loading} emptyMessage="No agent bookings" />
    </div>
  );
}
