import { useState } from 'react';
import { usePermission } from '../../hooks/usePermission';

const CHANNELS = [
  { key: 'sms', label: 'SMS', className: 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100' },
  { key: 'email', label: 'Email', className: 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100' },
  { key: 'whatsapp', label: 'WhatsApp', className: 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100' },
];

export default function ReminderChannelButtons({ onSend, disabled = false, size = 'sm' }) {
  const { can } = usePermission();
  const [sending, setSending] = useState(null);
  const [msg, setMsg] = useState('');

  if (!can('reminders:manage') && !can('notifications:manage')) return null;

  const handle = async (channel) => {
    if (disabled || sending) return;
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

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {CHANNELS.map((ch) => (
        <button
          key={ch.key}
          type="button"
          disabled={disabled || Boolean(sending)}
          onClick={() => handle(ch.key)}
          className={`rounded border font-medium transition disabled:opacity-40 ${btnClass} ${ch.className}`}
        >
          {sending === ch.key ? '…' : ch.label}
        </button>
      ))}
      {msg && <span className={`text-[10px] ${msg === 'Sent' ? 'text-green-600' : 'text-red-600'}`}>{msg}</span>}
    </div>
  );
}
