import { useCallback, useEffect, useState } from 'react';
import { backupApi } from '../services/phase5.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { usePermission } from '../hooks/usePermission';
import { formatDate } from '../utils/date';
import { downloadBlob } from '../utils/download';

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
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restorePhrase, setRestorePhrase] = useState('');
  const [restoreNote, setRestoreNote] = useState('');
  const [runbook, setRunbook] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

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

  const handleDownload = async (row) => {
    setDownloadingId(row.id);
    try {
      const { data } = await backupApi.download(row.id);
      downloadBlob(data, row.fileName);
    } catch (err) {
      alert(err.response?.data?.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const openRestore = (row) => {
    setRestoreTarget(row);
    setRestorePhrase('');
    setRestoreNote('');
    setRunbook(null);
  };

  const closeRestore = () => {
    setRestoreTarget(null);
    setRunbook(null);
  };

  const submitRestoreRequest = async () => {
    if (restorePhrase !== 'RESTORE') {
      alert('Type RESTORE to confirm');
      return;
    }
    setRestoreLoading(true);
    try {
      const { data } = await backupApi.requestRestore(restoreTarget.id, {
        confirmPhrase: 'RESTORE',
        note: restoreNote || undefined,
      });
      setRunbook(data.data.runbook);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Restore request failed');
    } finally {
      setRestoreLoading(false);
    }
  };

  const columns = [
    { key: 'fileName', label: 'File' },
    { key: 'backupType', label: 'Type', render: (r) => <span className="capitalize">{r.backupType}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'fileSize', label: 'Size', render: (r) => formatBytes(r.fileSize) },
    { key: 'offsitePath', label: 'Offsite', render: (r) => r.offsitePath || '—' },
    { key: 'restoreStatus', label: 'Restore', render: (r) => (r.restoreStatus && r.restoreStatus !== 'none' ? r.restoreStatus : '—') },
    { key: 'startedAt', label: 'Started', render: (r) => formatDate(r.startedAt) },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        r.status === 'success' && can('backup:manage') ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50"
              disabled={downloadingId === r.id}
              onClick={() => handleDownload(r)}
            >
              {downloadingId === r.id ? 'Downloading…' : 'Download'}
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400"
              onClick={() => openRestore(r)}
            >
              Restore guide
            </button>
          </div>
        ) : null
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {strategy && (
        <div className="card text-sm text-muted">
          <p><strong className="text-primary">Schedule:</strong> {strategy.schedule} (Asia/Dhaka)</p>
          <p><strong className="text-primary">Directory:</strong> {strategy.directory}</p>
          <p><strong className="text-primary">Methods:</strong> {strategy.methods?.join(', ')}</p>
          <p><strong className="text-primary">Restore:</strong> {strategy.restore?.note}</p>
          <p><strong className="text-primary">Offsite:</strong> {strategy.offsite?.note}</p>
          {strategy.offsite?.enabled && (
            <p className="mt-1 text-xs">
              {strategy.offsite.localDir && <>Local: {strategy.offsite.localDir}<br /></>}
              {strategy.offsite.rsyncTarget && <>Rsync: {strategy.offsite.rsyncTarget}</>}
            </p>
          )}
        </div>
      )}

      {can('backup:manage') && (
        <button type="button" onClick={triggerBackup} disabled={running} className="btn-primary">
          {running ? 'Running backup…' : 'Run manual backup'}
        </button>
      )}

      {msg && <p className="text-sm text-brand-700 dark:text-brand-300">{msg}</p>}

      <DataTable columns={columns} rows={items} loading={loading} emptyMessage="No backup logs yet" />
      {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}

      <Modal
        open={Boolean(restoreTarget)}
        onClose={closeRestore}
        title={runbook ? 'Restore runbook' : 'Request restore'}
        footer={runbook ? (
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={closeRestore}>Close</button>
        ) : (
          <button
            type="button"
            className="btn-primary w-full sm:w-auto"
            disabled={restoreLoading}
            onClick={submitRestoreRequest}
          >
            {restoreLoading ? 'Generating…' : 'Generate runbook'}
          </button>
        )}
      >
        {restoreTarget && !runbook && (
          <div className="space-y-3 text-sm">
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              Restoring replaces all database data. Stop the API on the server before running mongorestore.
            </p>
            <p><strong className="text-primary">File:</strong> {restoreTarget.fileName}</p>
            <label className="block">
              <span className="mb-1 block font-medium text-primary">Type RESTORE to confirm</span>
              <input className="input-field" value={restorePhrase} onChange={(e) => setRestorePhrase(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block font-medium text-primary">Note (optional)</span>
              <textarea className="input-field" rows={2} value={restoreNote} onChange={(e) => setRestoreNote(e.target.value)} />
            </label>
          </div>
        )}
        {runbook && (
          <div className="space-y-3 text-sm">
            <p className="font-semibold text-red-700 dark:text-red-400">{runbook.warning}</p>
            <ol className="list-decimal space-y-1 pl-5 text-muted">
              {runbook.steps?.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
            {runbook.command && (
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{runbook.command}</pre>
            )}
            {runbook.scriptPath && (
              <p className="text-muted">Script: <code className="text-primary">{runbook.scriptPath}</code></p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
