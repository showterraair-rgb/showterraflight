import { Link } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';

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
