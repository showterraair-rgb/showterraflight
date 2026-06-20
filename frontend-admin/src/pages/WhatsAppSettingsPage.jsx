import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { notificationsApi } from '../services/notifications.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePermission } from '../hooks/usePermission';

export default function WhatsAppSettingsPage() {
  const { can } = usePermission();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [testTo, setTestTo] = useState('');
  const [testTemplate, setTestTemplate] = useState('hello_world');

  const form = useForm({
    defaultValues: {
      accessToken: '',
      phoneNumberId: '',
      businessAccountId: '',
      webhookVerifyToken: '',
      apiVersion: 'v21.0',
      defaultCountryCode: '880',
      defaultLanguageCode: 'en',
      testTemplateName: 'hello_world',
      isEnabled: false,
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.getWhatsAppSettings();
      form.reset(data.data);
      setTestTemplate(data.data?.testTemplateName || 'hello_world');
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
      const { data } = await notificationsApi.testWhatsApp({ to: testTo, templateName: testTemplate });
      setMsg(data.mocked ? 'WhatsApp logged only (enable gateway or check config)' : 'Test WhatsApp sent');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Test failed');
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;

  const editable = can('notifications:manage') || can('settings:manage');
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  const webhookUrl = apiBase.startsWith('http')
    ? `${apiBase.replace(/\/$/, '')}/webhooks/whatsapp`
    : `${window.location.origin}${apiBase.replace(/\/$/, '')}/webhooks/whatsapp`;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">WhatsApp Settings</h2>
        <p className="text-sm text-slate-500">
          Meta WhatsApp Business Cloud API for transactional booking and payment messages.
        </p>
      </div>

      <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <p className="font-medium">Webhook URL (Meta Developer Console)</p>
        <p className="mt-1 break-all font-mono text-xs">{webhookUrl}</p>
        <p className="mt-2 text-xs">Use the same verify token you save below. Subscribe to <strong>messages</strong> field.</p>
      </div>

      {msg && <p className="text-sm text-brand-700">{msg}</p>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="card space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" {...form.register('isEnabled')} disabled={!editable} />
          Enable WhatsApp notifications
        </label>

        <label className="block text-sm">
          <span className="text-slate-600">Access token *</span>
          <input {...form.register('accessToken')} disabled={!editable} className="input mt-1 w-full font-mono text-xs" autoComplete="off" placeholder="EAA..." />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">Phone number ID *</span>
            <input {...form.register('phoneNumberId')} disabled={!editable} className="input mt-1 w-full" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Business account ID</span>
            <input {...form.register('businessAccountId')} disabled={!editable} className="input mt-1 w-full" />
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-slate-600">Webhook verify token *</span>
          <input {...form.register('webhookVerifyToken')} disabled={!editable} className="input mt-1 w-full" autoComplete="off" />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="text-slate-600">API version</span>
            <input {...form.register('apiVersion')} disabled={!editable} className="input mt-1 w-full" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Country code</span>
            <input {...form.register('defaultCountryCode')} disabled={!editable} className="input mt-1 w-full" placeholder="880" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Language</span>
            <input {...form.register('defaultLanguageCode')} disabled={!editable} className="input mt-1 w-full" placeholder="en" />
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-slate-600">Default test template</span>
          <input {...form.register('testTemplateName')} disabled={!editable} className="input mt-1 w-full" placeholder="hello_world" />
        </label>

        {editable && (
          <button type="submit" className="btn-primary">Save settings</button>
        )}
      </form>

      {editable && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Test WhatsApp</h3>
          <p className="text-xs text-slate-500">Uses approved template (default: hello_world). Phone: 017XXXXXXXX or 88017XXXXXXXX</p>
          <div className="flex flex-wrap gap-2">
            <input
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              className="input min-w-[200px] flex-1"
              placeholder="017XXXXXXXX"
            />
            <input
              value={testTemplate}
              onChange={(e) => setTestTemplate(e.target.value)}
              className="input min-w-[140px]"
              placeholder="hello_world"
            />
            <button type="button" onClick={sendTest} className="btn-secondary">Send test</button>
          </div>
        </div>
      )}
    </div>
  );
}
