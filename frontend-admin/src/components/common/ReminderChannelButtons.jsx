import { useState } from 'react';
import { usePermission } from '../../hooks/usePermission';

const CHANNELS = [
  {
    key: 'sms',
    label: 'SMS',
    title: 'Send SMS reminder',
    className: 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      </svg>
    ),
  },
  {
    key: 'email',
    label: 'Email',
    title: 'Send email reminder',
    className: 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 4h16v16H4z" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    ),
  },
  {
    key: 'whatsapp',
    label: 'WA',
    title: 'Send WhatsApp reminder',
    className: 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 0 1-4.09-1.13l-.295-.176-2.868.86.86-2.868-.176-.295A7.96 7.96 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
      </svg>
    ),
  },
];

export default function ReminderChannelButtons({
  onSend,
  disabled = false,
  size = 'sm',
  variant = 'buttons',
  channelAvailability = null,
}) {
  const { can } = usePermission();
  const [sending, setSending] = useState(null);
  const [msg, setMsg] = useState('');

  if (!can('reminders:manage') && !can('notifications:manage')) return null;

  const isChannelEnabled = (key) => {
    if (!channelAvailability) return true;
    return channelAvailability[key] !== false;
  };

  const handle = async (channel) => {
    if (disabled || sending || !isChannelEnabled(channel)) return;
    setSending(channel);
    setMsg('');
    try {
      await onSend([channel]);
      setMsg('Sent');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    } finally {
      setSending(null);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const btnClass = size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs';
  const iconBtnClass = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <div className="flex flex-wrap items-center gap-1">
      {CHANNELS.map((ch) => {
        const channelDisabled = disabled || Boolean(sending) || !isChannelEnabled(ch.key);
        if (variant === 'icons') {
          return (
            <button
              key={ch.key}
              type="button"
              title={channelDisabled && !isChannelEnabled(ch.key) ? `${ch.title} (not available)` : ch.title}
              disabled={channelDisabled}
              onClick={() => handle(ch.key)}
              className={`inline-flex items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${iconBtnClass} ${ch.className}`}
            >
              {sending === ch.key ? <span className="text-[10px]">…</span> : ch.icon}
            </button>
          );
        }
        return (
          <button
            key={ch.key}
            type="button"
            disabled={channelDisabled}
            onClick={() => handle(ch.key)}
            className={`rounded border font-medium transition disabled:opacity-40 ${btnClass} ${ch.className}`}
          >
            {sending === ch.key ? '…' : ch.label}
          </button>
        );
      })}
      {msg && <span className={`text-[10px] ${msg === 'Sent' ? 'text-green-600' : 'text-red-600'}`}>{msg}</span>}
    </div>
  );
}
