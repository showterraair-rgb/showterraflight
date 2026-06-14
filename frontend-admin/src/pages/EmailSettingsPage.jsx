import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { notificationsApi } from '../services/notifications.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePermission } from '../hooks/usePermission';

export default function EmailSettingsPage() {
  const { can } = usePermission();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [testTo, setTestTo] = useState('');

  const form = useForm({
    defaultValues: {
      smtpHost: '',
      smtpPort: 587,
      username: '',
      password: '',
      encryption: 'tls',
      fromEmail: '',
      fromName: '',
      replyTo: '',
      isEnabled: false,
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.getEmailSettings();
      form.reset(data.data);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (values) => {
    setMsg('');
    try {
      await notificationsApi.updateEmailSettings({
        ...values,
        smtpPort: Number(values.smtpPort) || 587,
      });
      setMsg('Email settings saved');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Save failed');
    }
  };

  const sendTest = async () => {
    setMsg('');
    try {
      await notificationsApi.testEmail({ to: testTo });
      setMsg('Test email dispatched (check server logs if SMTP not configured)');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Test failed');
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;

  const editable = can('notifications:manage') || can('settings:manage');

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Email Settings</h2>
        <p className="text-sm text-slate-500">SMTP configuration for customer and admin email notifications</p>
      </div>

      {msg && <p className="text-sm text-brand-700">{msg}</p>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="card space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" {...form.register('isEnabled')} disabled={!editable} />
          Enable email notifications
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">SMTP host</span>
            <input {...form.register('smtpHost')} disabled={!editable} className="input mt-1 w-full" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Port</span>
            <input type="number" {...form.register('smtpPort')} disabled={!editable} className="input mt-1 w-full" />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-slate-600">Encryption</span>
          <select {...form.register('encryption')} disabled={!editable} className="input mt-1 w-full">
            <option value="none">None</option>
            <option value="tls">TLS</option>
            <option value="ssl">SSL</option>
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">Username</span>
            <input {...form.register('username')} disabled={!editable} className="input mt-1 w-full" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Password</span>
            <input type="password" {...form.register('password')} disabled={!editable} className="input mt-1 w-full" />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">From email</span>
            <input {...form.register('fromEmail')} disabled={!editable} className="input mt-1 w-full" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">From name</span>
            <input {...form.register('fromName')} disabled={!editable} className="input mt-1 w-full" />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-slate-600">Reply-to</span>
          <input {...form.register('replyTo')} disabled={!editable} className="input mt-1 w-full" />
        </label>

        {editable && <button type="submit" className="btn-primary">Save settings</button>}
      </form>

      {editable && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Test email</h3>
          <div className="flex flex-wrap gap-2">
            <input
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              className="input flex-1 min-w-[200px]"
              placeholder="recipient@example.com"
            />
            <button type="button" onClick={sendTest} className="btn-secondary">Send test</button>
          </div>
        </div>
      )}
    </div>
  );
}
