import { useCallback, useEffect, useState } from 'react';
import { notificationsApi } from '../services/notifications.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/date';

const STATUS_OPTIONS = ['', 'pending', 'sent', 'failed'];
const CHANNEL_OPTIONS = ['', 'sms', 'email', 'console'];

export default function NotificationLogsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [channel, setChannel] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.listLogs({
        page,
        limit: 25,
        status: status || undefined,
        channel: channel || undefined,
      });
      setItems(data.data || []);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, status, channel]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'createdAt', label: 'When', render: (r) => formatDate(r.createdAt) },
    { key: 'eventType', label: 'Event', render: (r) => <code className="text-xs">{r.eventType}</code> },
    { key: 'channel', label: 'Channel', render: (r) => <StatusBadge status={r.channel} label={r.channel} /> },
    { key: 'recipient', label: 'Recipient' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={r.status} /> },
    { key: 'subject', label: 'Subject', render: (r) => r.subject || '—' },
    { key: 'errorMessage', label: 'Error', render: (r) => r.errorMessage || '—' },
    { key: 'bookingId', label: 'Booking', render: (r) => r.bookingId || '—' },
  ];

  if (loading && !items.length) return <LoadingSpinner className="py-20" />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Notification Logs</h2>
        <p className="text-sm text-slate-500">History of SMS and email delivery attempts</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input">
          {STATUS_OPTIONS.map((s) => (
            <option key={s || 'all'} value={s}>{s ? s : 'All statuses'}</option>
          ))}
        </select>
        <select value={channel} onChange={(e) => { setChannel(e.target.value); setPage(1); }} className="input">
          {CHANNEL_OPTIONS.map((c) => (
            <option key={c || 'all'} value={c}>{c ? c : 'All channels'}</option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} data={items} loading={loading} emptyMessage="No notification logs yet" />
      {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
    </div>
  );
}
