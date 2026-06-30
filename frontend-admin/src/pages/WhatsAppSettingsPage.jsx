import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { notificationsApi } from '../services/notifications.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePermission } from '../hooks/usePermission';

export default function WhatsAppSettingsPage() {
  const { can } = usePermission();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [testTo, setTestTo] = useState('01741148529');
  const [testMessage, setTestMessage] = useState('Test WhatsApp from Show Terra Flight admin.');
  const [sessionStatus, setSessionStatus] = useState(null);

  const form = useForm({
    defaultValues: {
      provider: 'wasender',
      wasenderApiKey: '',
      wasenderApiUrl: 'https://www.wasenderapi.com/api/send-message',
      wasenderSessionId: '96259',
      defaultCountryCode: '880',
      defaultLanguageCode: 'en',
      isEnabled: true,
      accessToken: '',
      phoneNumberId: '',
      businessAccountId: '',
      webhookVerifyToken: '',
      apiVersion: 'v21.0',
      testTemplateName: 'hello_world',
    },
  });

  const provider = form.watch('provider');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.getWhatsAppSettings();
      form.reset({
        ...form.getValues(),
        ...data.data,
        wasenderApiKey: data.data?.wasenderApiKey || '',
        accessToken: data.data?.accessToken || '',
      });
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (values) => {
    setMsg('');
    try {
      await notificationsApi.updateWhatsAppSettings(values);
      setMsg('WhatsApp settings saved');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Save failed');
    }
  };

  const sendTest = async () => {
    setMsg('');
    try {
      const { data } = await notificationsApi.testWhatsApp({
        to: testTo,
        message: testMessage,
      });
      if (!data.success) throw new Error(data.message || 'Test failed');
      setMsg(data.mocked ? 'Logged only — enable Wasender or check API key' : `Test sent (ID: ${data.data?.messageId || 'ok'})`);
    } catch (err) {
      setMsg(err.response?.data?.message || err.message || 'Test failed');
    }
  };

  const checkStatus = async () => {
    setMsg('');
    try {
      const { data } = await notificationsApi.getWasenderStatus();
      setSessionStatus(data.data);
      setMsg(data.data?.status ? `Session: ${data.data.status}` : 'Status checked');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not check session status');
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;

  const editable = can('notifications:manage') || can('settings:manage');

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link to="/settings/notifications" className="text-xs font-medium text-brand-600 hover:underline">← All notification settings</Link>
        <h2 className="mt-2 text-xl font-bold text-slate-900">WhatsApp Settings</h2>
        <p className="text-sm text-slate-500">
          WasenderAPI for booking reminders, payment alerts, and customer notifications.
        </p>
      </div>

      <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-900">
        <p className="font-medium">Wasender session: Show Terra Air</p>
        <p className="mt-1 text-xs">
          Copy the <strong>API Access Token</strong> from your{' '}
          <a href="https://wasenderapi.com/whatsapp/manage/96259" target="_blank" rel="noreferrer" className="underline">
            Wasender session page
          </a>{' '}
          (🔑 icon). Phone: +8801741148529
        </p>
      </div>

      {msg && <p className="text-sm text-brand-700">{msg}</p>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="card space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" {...form.register('isEnabled')} disabled={!editable} />
          Enable WhatsApp notifications
        </label>

        <label className="block text-sm">
          <span className="text-slate-600">Provider</span>
          <select {...form.register('provider')} disabled={!editable} className="input mt-1 w-full">
            <option value="wasender">WasenderAPI (recommended)</option>
            <option value="meta">Meta Cloud API (legacy)</option>
          </select>
        </label>

        {provider === 'wasender' && (
          <>
            <label className="block text-sm">
              <span className="text-slate-600">Wasender session API key *</span>
              <input
                {...form.register('wasenderApiKey')}
                disabled={!editable}
                className="input mt-1 w-full font-mono text-xs"
                autoComplete="off"
                placeholder="Paste API access token from session page"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-slate-600">API URL</span>
                <input {...form.register('wasenderApiUrl')} disabled={!editable} className="input mt-1 w-full font-mono text-xs" />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Session ID</span>
                <input {...form.register('wasenderSessionId')} disabled={!editable} className="input mt-1 w-full" placeholder="96259" />
              </label>
            </div>

            <label className="block text-sm">
              <span className="text-slate-600">Default country code</span>
              <input {...form.register('defaultCountryCode')} disabled={!editable} className="input mt-1 w-full max-w-[120px]" placeholder="880" />
            </label>
          </>
        )}

        {provider === 'meta' && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-600">Meta WhatsApp Business Cloud API</p>
            <label className="block text-sm">
              <span className="text-slate-600">Access token</span>
              <input {...form.register('accessToken')} disabled={!editable} className="input mt-1 w-full font-mono text-xs" autoComplete="off" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-slate-600">Phone number ID</span>
                <input {...form.register('phoneNumberId')} disabled={!editable} className="input mt-1 w-full" />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Business account ID</span>
                <input {...form.register('businessAccountId')} disabled={!editable} className="input mt-1 w-full" />
              </label>
            </div>
          </div>
        )}

        {editable && (
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary">Save settings</button>
            <button type="button" onClick={checkStatus} className="btn-secondary">Check session status</button>
          </div>
        )}
      </form>

      {sessionStatus && (
        <div className="card text-xs text-slate-600">
          <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(sessionStatus, null, 2)}</pre>
        </div>
      )}

      {editable && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Test WhatsApp</h3>
          <p className="text-xs text-slate-500">Sends a plain text message via Wasender. Use 017XXXXXXXX or +88017XXXXXXXX</p>
          <div className="flex flex-wrap gap-2">
            <input
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              className="input min-w-[200px] flex-1"
              placeholder="01741148529"
            />
            <input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="input min-w-[200px] flex-[2]"
              placeholder="Test message"
            />
            <button type="button" onClick={sendTest} className="btn-secondary">Send test</button>
          </div>
        </div>
      )}
    </div>
  );
}
