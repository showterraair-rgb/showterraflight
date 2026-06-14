import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { notificationsApi } from '../services/notifications.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePermission } from '../hooks/usePermission';

export default function SmsSettingsPage() {
  const { can } = usePermission();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [testTo, setTestTo] = useState('');

  const form = useForm({
    defaultValues: {
      providerName: '',
      apiUrl: '',
      apiKey: '',
      apiToken: '',
      senderId: '',
      username: '',
      password: '',
      isEnabled: false,
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.getSmsSettings();
      form.reset(data.data);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (values) => {
    setMsg('');
    try {
      await notificationsApi.updateSmsSettings(values);
      setMsg('SMS settings saved');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Save failed');
    }
  };

  const sendTest = async () => {
    setMsg('');
    try {
      await notificationsApi.testSms({ to: testTo });
      setMsg('Test SMS dispatched (check server logs if provider not configured)');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Test failed');
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;

  const editable = can('notifications:manage') || can('settings:manage');

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">SMS Settings</h2>
        <p className="text-sm text-slate-500">Configure your SMS gateway for booking and payment notifications</p>
      </div>

      {msg && <p className="text-sm text-brand-700">{msg}</p>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="card space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" {...form.register('isEnabled')} disabled={!editable} />
          Enable SMS notifications
        </label>

        <label className="block text-sm">
          <span className="text-slate-600">Provider name</span>
          <input {...form.register('providerName')} disabled={!editable} className="input mt-1 w-full" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">API URL</span>
          <input {...form.register('apiUrl')} disabled={!editable} className="input mt-1 w-full" placeholder="https://..." />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">API key</span>
            <input {...form.register('apiKey')} disabled={!editable} className="input mt-1 w-full" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">API token</span>
            <input {...form.register('apiToken')} disabled={!editable} className="input mt-1 w-full" />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-slate-600">Sender ID</span>
          <input {...form.register('senderId')} disabled={!editable} className="input mt-1 w-full" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">Username</span>
            <input {...form.register('username')} disabled={!editable} className="input mt-1 w-full" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Password</span>
            <input type="password" {...form.register('password')} disabled={!editable} className="input mt-1 w-full" placeholder="Leave blank to keep" />
          </label>
        </div>

        {editable && (
          <button type="submit" className="btn-primary">Save settings</button>
        )}
      </form>

      {editable && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Test SMS</h3>
          <div className="flex flex-wrap gap-2">
            <input
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              className="input flex-1 min-w-[200px]"
              placeholder="Phone number e.g. 017XXXXXXXX"
            />
            <button type="button" onClick={sendTest} className="btn-secondary">Send test</button>
          </div>
        </div>
      )}
    </div>
  );
}
