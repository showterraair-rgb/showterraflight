import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { agentApi } from '../services/agent.api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/constants';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await agentApi.notifications({ limit: 50 });
      setItems(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAll = async () => {
    await agentApi.markAllRead();
    load();
  };

  const markOne = async (id) => {
    await agentApi.markRead(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button type="button" onClick={markAll} className="btn-secondary">Mark all read</button>
      </div>
      {loading ? <LoadingSkeleton /> : items.length === 0 ? (
        <EmptyState title="No notifications" message="Updates about your bookings will appear here." />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id} className={`card ${n.isRead ? 'opacity-70' : 'border-brand-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{n.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
                  {n.relatedBookingId && <Link to={`/bookings/${n.relatedBookingId}`} className="mt-2 inline-block text-sm text-brand-600">View booking</Link>}
                </div>
                {!n.isRead && <button type="button" className="text-xs text-brand-600" onClick={() => markOne(n.id)}>Mark read</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
