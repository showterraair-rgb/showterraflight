import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Radio, Plus, Play, Square, ExternalLink, Copy, Eye, Pencil, Trash2, Video,
} from 'lucide-react';
import { liveStreamsApi } from '../services/liveStream.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import SummaryStatCard from '../components/common/SummaryStatCard';
import PrimaryBtn from '../components/ui/PrimaryBtn';
import { FormSection } from '../components/ui/FormPrimitives';
import { usePermission } from '../hooks/usePermission';
import { formatDate } from '../utils/date';
import { C, fontDisplay, fontSans } from '../theme/tokens';

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube Live' },
  { value: 'facebook', label: 'Facebook Live' },
  { value: 'custom', label: 'Custom / HLS' },
];

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'live', label: 'Live' },
  { value: 'ended', label: 'Ended' },
];

const emptyForm = {
  title: '',
  description: '',
  platform: 'youtube',
  streamUrl: '',
  embedUrl: '',
  thumbnailUrl: '',
  status: 'draft',
  scheduledAt: '',
  isPublished: false,
  isFeatured: false,
  showOnHomepage: false,
  chatEnabled: true,
  sortOrder: 0,
};

function statusKey(status) {
  if (status === 'live') return 'success';
  if (status === 'scheduled') return 'pending';
  if (status === 'ended') return 'cancelled';
  return 'draft';
}

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function publicLiveUrl() {
  if (typeof window === 'undefined') return '/live';
  const origin = window.location.origin.replace(/:\d+$/, '').replace(/\/\/admin\./, '//');
  // Prefer same host /live when admin is on same domain; fall back to relative path hint
  return `${window.location.protocol}//${window.location.hostname.replace(/^admin\./, '')}/live`;
}

export default function LiveStreamPage() {
  const { can } = usePermission();
  const canManage = can('livestream:manage');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', platform: '', search: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRow, setPreviewRow] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const form = useForm({ defaultValues: emptyForm });
  const watchEmbed = form.watch('embedUrl');
  const watchStream = form.watch('streamUrl');
  const watchPlatform = form.watch('platform');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.platform) params.platform = filters.platform;
      if (filters.search) params.search = filters.search;
      const [listRes, sumRes] = await Promise.all([
        liveStreamsApi.list(params),
        liveStreamsApi.summary(),
      ]);
      setItems(listRes.data.data || []);
      setPagination(listRes.data.pagination);
      setSummary(sumRes.data.data);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.reset(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    form.reset({
      title: row.title || '',
      description: row.description || '',
      platform: row.platform || 'youtube',
      streamUrl: row.streamUrl || '',
      embedUrl: row.embedUrl || '',
      thumbnailUrl: row.thumbnailUrl || '',
      status: row.status || 'draft',
      scheduledAt: toLocalInput(row.scheduledAt),
      isPublished: Boolean(row.isPublished),
      isFeatured: Boolean(row.isFeatured),
      showOnHomepage: Boolean(row.showOnHomepage),
      chatEnabled: row.chatEnabled !== false,
      sortOrder: row.sortOrder ?? 0,
    });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setError('');
    const payload = {
      ...values,
      sortOrder: Number(values.sortOrder) || 0,
      scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : '',
    };
    try {
      if (editing) await liveStreamsApi.update(editing.id, payload);
      else await liveStreamsApi.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const handleGoLive = async (row) => {
    if (!window.confirm(`Go live with "${row.title}"?\nThis ends any other live stream and publishes this one.`)) return;
    setBusyId(row.id);
    try {
      await liveStreamsApi.goLive(row.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Go live failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleEnd = async (row) => {
    if (!window.confirm(`End live stream "${row.title}"?`)) return;
    setBusyId(row.id);
    try {
      await liveStreamsApi.end(row.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'End stream failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    try {
      await liveStreamsApi.remove(row.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const copyPublicLink = async () => {
    const url = publicLiveUrl();
    try {
      await navigator.clipboard.writeText(url);
      alert(`Copied: ${url}`);
    } catch {
      prompt('Public live page URL:', url);
    }
  };

  const previewSrc = useMemo(() => {
    if (watchEmbed) return watchEmbed;
    return '';
  }, [watchEmbed]);

  const columns = [
    {
      key: 'title',
      label: 'Stream',
      render: (r) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sta-indigo">{r.title}</span>
            {r.status === 'live' && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: C.red }}>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
              </span>
            )}
            {r.isFeatured && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ background: C.tealLight, color: C.teal }}>Featured</span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-sta-muted">{r.description || '—'}</p>
        </div>
      ),
    },
    {
      key: 'platform',
      label: 'Platform',
      render: (r) => (
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ background: C.blueLight, color: C.blue }}>
          {r.platform}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={statusKey(r.status)} label={r.status} />,
    },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (r) => (
        <span className="font-mono text-xs text-sta-muted">
          {r.status === 'live' && r.startedAt ? `Started ${formatDate(r.startedAt)}` : null}
          {r.status === 'scheduled' && r.scheduledAt ? formatDate(r.scheduledAt) : null}
          {r.status === 'ended' && r.endedAt ? `Ended ${formatDate(r.endedAt)}` : null}
          {r.status === 'draft' ? '—' : null}
        </span>
      ),
    },
    {
      key: 'visibility',
      label: 'Visibility',
      render: (r) => (
        <div className="text-xs text-sta-muted">
          {r.isPublished ? 'Published' : 'Hidden'}
          {r.showOnHomepage ? ' · Homepage' : ''}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      stickyRight: true,
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            className="rounded-md p-1.5 text-sta-muted hover:bg-sta-bg hover:text-sta-indigo"
            title="Preview"
            onClick={() => { setPreviewRow(r); setPreviewOpen(true); }}
          >
            <Eye size={14} />
          </button>
          {canManage && (
            <>
              <button
                type="button"
                className="rounded-md p-1.5 text-sta-muted hover:bg-sta-bg hover:text-sta-indigo"
                title="Edit"
                onClick={() => openEdit(r)}
              >
                <Pencil size={14} />
              </button>
              {r.status !== 'live' && r.status !== 'ended' && (
                <button
                  type="button"
                  disabled={busyId === r.id}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                  style={{ background: C.red }}
                  onClick={() => handleGoLive(r)}
                >
                  <Play size={12} /> Go Live
                </button>
              )}
              {r.status === 'live' && (
                <button
                  type="button"
                  disabled={busyId === r.id}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                  style={{ background: C.indigo }}
                  onClick={() => handleEnd(r)}
                >
                  <Square size={12} /> End
                </button>
              )}
              <button
                type="button"
                className="rounded-md p-1.5 text-sta-muted hover:bg-red-50 hover:text-sta-red"
                title="Delete"
                onClick={() => handleDelete(r)}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: C.indigo, ...fontDisplay }}>Live Stream</h2>
          <p className="text-sm" style={{ color: C.muted, ...fontSans }}>
            Schedule, go live, and publish streams to the public site
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={copyPublicLink} className="btn-secondary inline-flex items-center gap-1.5">
            <Copy size={13} /> Public link
          </button>
          <a
            href="/live"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex items-center gap-1.5"
          >
            <ExternalLink size={13} /> Open /live
          </a>
          {canManage && (
            <PrimaryBtn label="New Stream" icon={<Plus size={12} />} onClick={openCreate} />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <SummaryStatCard label="Live now" count={summary?.live ?? 0} color="red" />
        <SummaryStatCard label="Scheduled" count={summary?.scheduled ?? 0} color="amber" />
        <SummaryStatCard label="Draft" count={summary?.draft ?? 0} color="indigo" />
        <SummaryStatCard label="Ended" count={summary?.ended ?? 0} color="blue" />
        <SummaryStatCard label="Published" count={summary?.published ?? 0} color="teal" />
      </div>

      {summary?.live > 0 && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-[10px] border px-4 py-3"
          style={{ borderColor: '#fecaca', background: C.redLight }}
        >
          <Radio size={18} style={{ color: C.red }} className="animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: C.red }}>Broadcast in progress</p>
            <p className="text-xs" style={{ color: C.muted }}>
              Viewers on the public /live page will see the featured live stream.
            </p>
          </div>
          {items.filter((i) => i.status === 'live').map((r) => (
            <button
              key={r.id}
              type="button"
              className="btn-secondary text-xs"
              onClick={() => { setPreviewRow(r); setPreviewOpen(true); }}
            >
              Preview “{r.title}”
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-[10px] border border-sta-border bg-sta-surface">
        <div className="flex flex-wrap gap-3 border-b border-sta-border p-4">
          <input
            type="search"
            placeholder="Search streams…"
            className="input-field max-w-xs"
            value={filters.search}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
          />
          <select
            className="input-field max-w-[160px]"
            value={filters.status}
            onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
          >
            {STATUSES.map((s) => <option key={s.value || 'all'} value={s.value}>{s.label}</option>)}
          </select>
          <select
            className="input-field max-w-[160px]"
            value={filters.platform}
            onChange={(e) => { setFilters((f) => ({ ...f, platform: e.target.value })); setPage(1); }}
          >
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyTitle="No live streams yet"
          emptyDescription="Create a stream, add your YouTube or Facebook live URL, then Go Live."
        />
        {pagination && (
          <div className="border-t border-sta-border p-4">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Live Stream' : 'New Live Stream'}
        wide
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" form="livestream-form" className="btn-primary">
              {editing ? 'Save changes' : 'Create stream'}
            </button>
          </div>
        )}
      >
        <form id="livestream-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg px-3 py-2 text-sm" style={{ background: C.redLight, color: C.red }}>{error}</div>
          )}

          <FormSection title="Stream details" icon={<Video size={14} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Title *</label>
                <input className="input-field" {...form.register('title', { required: true })} placeholder="e.g. Umrah fare live Q&A" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Description</label>
                <textarea rows={3} className="input-field" {...form.register('description')} placeholder="Shown on the public live page" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Platform</label>
                <select className="input-field" {...form.register('platform')}>
                  {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Status</label>
                <select className="input-field" {...form.register('status')}>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>
                  {watchPlatform === 'custom' ? 'HLS / stream URL' : 'Watch URL'} *
                </label>
                <input
                  className="input-field font-mono text-xs"
                  placeholder={
                    watchPlatform === 'youtube'
                      ? 'https://www.youtube.com/watch?v=… or /live/…'
                      : watchPlatform === 'facebook'
                        ? 'https://www.facebook.com/…/videos/…'
                        : 'https://…/stream.m3u8'
                  }
                  {...form.register('streamUrl')}
                />
                <p className="mt-1 text-xs" style={{ color: C.muted }}>
                  Paste the public watch link — embed URL is derived automatically when possible.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Embed URL (optional override)</label>
                <input className="input-field font-mono text-xs" placeholder="https://www.youtube.com/embed/…" {...form.register('embedUrl')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Thumbnail URL</label>
                <input className="input-field font-mono text-xs" {...form.register('thumbnailUrl')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Scheduled at</label>
                <input type="datetime-local" className="input-field font-mono" {...form.register('scheduledAt')} />
              </div>
            </div>
          </FormSection>

          <FormSection title="Visibility" icon={<Radio size={14} />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
                <input type="checkbox" {...form.register('isPublished')} /> Published on public site
              </label>
              <label className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
                <input type="checkbox" {...form.register('isFeatured')} /> Featured stream
              </label>
              <label className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
                <input type="checkbox" {...form.register('showOnHomepage')} /> Show on homepage banner
              </label>
              <label className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
                <input type="checkbox" {...form.register('chatEnabled')} /> Enable platform chat (YouTube)
              </label>
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: C.indigo }}>Sort order</label>
                <input type="number" className="input-field font-mono max-w-[120px]" {...form.register('sortOrder')} />
              </div>
            </div>
            {(previewSrc || watchStream) && (
              <div className="mt-4 overflow-hidden rounded-lg border border-sta-border bg-black aspect-video">
                {previewSrc && !previewSrc.includes('.m3u8') ? (
                  <iframe
                    title="Embed preview"
                    src={previewSrc}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center text-sm text-white/70">
                    {watchStream?.includes('.m3u8')
                      ? 'HLS streams play on the public page with a native video player.'
                      : 'Save to generate embed, or paste an embed URL to preview here.'}
                  </div>
                )}
              </div>
            )}
          </FormSection>
        </form>
      </Modal>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewRow?.title || 'Preview'}
        wide
      >
        {previewRow?.embedUrl && !previewRow.embedUrl.includes('.m3u8') ? (
          <div className="aspect-video overflow-hidden rounded-lg bg-black">
            <iframe
              title={previewRow.title}
              src={previewRow.embedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="rounded-lg border border-sta-border p-6 text-sm text-sta-muted">
            {previewRow?.streamUrl
              ? `Stream URL: ${previewRow.streamUrl}`
              : 'No embed URL configured for this stream.'}
          </div>
        )}
        {previewRow?.description && (
          <p className="mt-3 text-sm" style={{ color: C.text }}>{previewRow.description}</p>
        )}
      </Modal>
    </div>
  );
}
