import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { notificationsJobsApi } from '../services/phase5.api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CARDS = [
  {
    title: 'WhatsApp Settings',
    description: 'Meta WhatsApp Cloud API — access token, phone number ID, webhook, and test messages.',
    path: '/settings/whatsapp',
    permissions: ['notifications:view', 'notifications:manage', 'settings:manage'],
    accent: 'border-emerald-200 bg-emerald-50',
  },
  {
    title: 'SMS Settings',
    description: 'BulkSMSBD gateway for booking and payment SMS.',
    path: '/settings/sms',
    permissions: ['notifications:view', 'notifications:manage', 'settings:manage'],
    accent: 'border-sky-200 bg-sky-50',
  },
  {
    title: 'Email Settings',
    description: 'SMTP configuration for transactional email.',
    path: '/settings/email',
    permissions: ['notifications:view', 'notifications:manage', 'settings:manage'],
    accent: 'border-violet-200 bg-violet-50',
  },
  {
    title: 'Notification Templates',
    description: 'SMS, email, and WhatsApp message templates plus automation rules.',
    path: '/settings/notification-templates',
    permissions: ['notifications:view', 'notifications:manage', 'settings:manage'],
    accent: 'border-amber-200 bg-amber-50',
  },
  {
    title: 'Notification Logs',
    description: 'Delivery history for SMS, WhatsApp, and email.',
    path: '/notifications/logs',
    permissions: ['notifications:view', 'notifications:manage', 'settings:manage'],
    accent: 'border-slate-200 bg-slate-50',
  },
];

export default function NotificationsHubPage() {
  const { can, canAny } = usePermission(['notifications:view', 'notifications:manage', 'settings:manage']);
  const canManage = can('notifications:manage') || can('settings:manage');

  const [preview, setPreview] = useState('');
  const [jobLoading, setJobLoading] = useState(false);
  const [jobMessage, setJobMessage] = useState('');
  const [jobError, setJobError] = useState('');

  async function handlePreviewLedger() {
    setJobLoading(true);
    setJobError('');
    setJobMessage('');
    try {
      const { data } = await notificationsJobsApi.previewDailyLedger();
      setPreview(data.data?.shortSummary || data.data?.message || JSON.stringify(data.data, null, 2));
    } catch (err) {
      setJobError(err.response?.data?.message || 'Preview failed');
      setPreview('');
    } finally {
      setJobLoading(false);
    }
  }

  async function handleSendLedger() {
    if (!window.confirm('Send the daily ledger summary via SMS and WhatsApp to admin contacts now?')) return;
    setJobLoading(true);
    setJobError('');
    setJobMessage('');
    try {
      const { data } = await notificationsJobsApi.triggerDailyLedger();
      setJobMessage(data.message || 'Daily summary sent');
      if (data.data?.shortSummary) setPreview(data.data.shortSummary);
    } catch (err) {
      setJobError(err.response?.data?.message || 'Send failed');
    } finally {
      setJobLoading(false);
    }
  }

  const visible = CARDS.filter((c) => c.permissions.some((p) => can(p)));

  if (!canAny) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        You do not have permission to view notification settings.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
        <p className="text-sm text-slate-500">
          Configure WhatsApp, SMS, email, templates, and view delivery logs.
        </p>
      </div>

      {canManage && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Daily ledger summary (11 PM)</h3>
            <p className="mt-1 text-xs text-slate-600">
              Short SMS + WhatsApp summary of ledger, bookings, bank/cash/MFS, and dues. Scheduled nightly at 11:00 PM (Asia/Dhaka).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary text-sm" disabled={jobLoading} onClick={handlePreviewLedger}>
              Preview message
            </button>
            <button type="button" className="btn-primary text-sm" disabled={jobLoading} onClick={handleSendLedger}>
              Send now
            </button>
          </div>
          {jobLoading && <LoadingSpinner className="py-4" />}
          {jobMessage && <p className="text-sm text-green-800">{jobMessage}</p>}
          {jobError && <p className="text-sm text-red-700">{jobError}</p>}
          {preview && (
            <pre className="whitespace-pre-wrap rounded-lg border border-indigo-100 bg-white p-3 text-xs text-slate-800">{preview}</pre>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            className={`block rounded-xl border p-4 transition hover:shadow-md ${card.accent}`}
          >
            <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
            <p className="mt-1 text-xs text-slate-600">{card.description}</p>
            <span className="mt-3 inline-block text-xs font-semibold text-brand-700">Open →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
