import { useCallback, useEffect, useState } from 'react';
import { backupApi } from '../services/phase5.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import { usePermission } from '../hooks/usePermission';
import { formatDate } from '../utils/date';

function formatBytes(n) {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function BackupPage() {
  const { can } = usePermission();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, stratRes] = await Promise.all([
        backupApi.list({ page, limit: 20 }),
        backupApi.strategy(),
      ]);
      setItems(listRes.data.data);
      setPagination(listRes.data.pagination);
      setStrategy(stratRes.data.data);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const triggerBackup = async () => {
    setRunning(true);
    setMsg('');
    try {
      const { data } = await backupApi.trigger();
      setMsg(data.message || 'Backup completed');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Backup failed');
    } finally {
      setRunning(false);
    }
  };

  const columns = [
    { key: 'fileName', label: 'File' },
    { key: 'backupType', label: 'Type', render: (r) => <span className="capitalize">{r.backupType}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'fileSize', label: 'Size', render: (r) => formatBytes(r.fileSize) },
    { key: 'startedAt', label: 'Started', render: (r) => formatDate(r.startedAt) },
    { key: 'completedAt', label: 'Completed', render: (r) => formatDate(r.completedAt) },
  ];

  return (
    <div className="space-y-4">
      {strategy && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p><strong>Schedule:</strong> {strategy.schedule} (Asia/Dhaka)</p>
          <p><strong>Directory:</strong> {strategy.directory}</p>
          <p><strong>Methods:</strong> {strategy.methods?.join(', ')}</p>
          <p><strong>Restore:</strong> {strategy.restore?.note}</p>
          <p><strong>Offsite:</strong> {strategy.offsite?.note}</p>
        </div>
      )}

      {can('backup:manage') && (
        <button type="button" onClick={triggerBackup} disabled={running} className="btn-primary">
          {running ? 'Running backup…' : 'Run manual backup'}
        </button>
      )}

      {msg && <p className="text-sm text-brand-700">{msg}</p>}

      <DataTable columns={columns} rows={items} loading={loading} emptyMessage="No backup logs yet" />
      {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
    </div>
  );
}
