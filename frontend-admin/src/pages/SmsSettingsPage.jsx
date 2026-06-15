import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { notificationsApi } from '../services/notifications.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePermission } from '../hooks/usePermission';

const BULKSMSBD_DEFAULTS = {
  providerName: 'BulkSMSBD',
  apiUrl: 'http://bulksmsbd.net/api/smsapi',
};

export default function SmsSettingsPage() {
  const { can } = usePermission();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [testTo, setTestTo] = useState('');
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      providerName: BULKSMSBD_DEFAULTS.providerName,
      apiUrl: BULKSMSBD_DEFAULTS.apiUrl,
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
      form.reset({
        ...BULKSMSBD_DEFAULTS,
        ...data.data,
      });
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => { load(); }, [load]);

  const applyBulkSmsPreset = () => {
    form.setValue('providerName', BULKSMSBD_DEFAULTS.providerName);
    form.setValue('apiUrl', BULKSMSBD_DEFAULTS.apiUrl);
  };

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
      const { data } = await notificationsApi.testSms({ to: testTo });
      setMsg(data.mocked ? 'SMS logged only (enable gateway or check config)' : 'Test SMS sent successfully');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Test failed');
    }
  };

  const fetchBalance = async () => {
    setBalanceLoading(true);
    setMsg('');
    try {
      const { data } = await notificationsApi.getSmsBalance();
      setBalance(data.data?.balance ?? data.data?.raw ?? '—');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not fetch balance');
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;

  const editable = can('notifications:manage') || can('settings:manage');

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">SMS Settings</h2>
        <p className="text-sm text-slate-500">
          BulkSMSBD gateway for booking and payment SMS. Numbers must be in format <strong>88017XXXXXXXX</strong>.
        </p>
      </div>

      <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <p className="font-medium">BulkSMSBD quick setup</p>
        <ul className="mt-1 list-inside list-disc text-sky-800">
          <li>API URL: <code className="text-xs">http://bulksmsbd.net/api/smsapi</code></li>
          <li>Paste your API key and approved sender ID below</li>
          <li>Enable SMS, save, then send a test to your phone</li>
        </ul>
        {editable && (
          <button type="button" onClick={applyBulkSmsPreset} className="mt-2 text-xs font-semibold text-brand-700 underline">
            Apply BulkSMSBD defaults
          </button>
        )}
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
          <input {...form.register('apiUrl')} disabled={!editable} className="input mt-1 w-full" placeholder="http://bulksmsbd.net/api/smsapi" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">API key *</span>
            <input {...form.register('apiKey')} disabled={!editable} className="input mt-1 w-full" autoComplete="off" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Sender ID *</span>
            <input {...form.register('senderId')} disabled={!editable} className="input mt-1 w-full" placeholder="8809617626936" />
          </label>
        </div>

        {editable && (
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary">Save settings</button>
            <button type="button" onClick={fetchBalance} disabled={balanceLoading} className="btn-secondary">
              {balanceLoading ? 'Checking…' : 'Check SMS balance'}
            </button>
          </div>
        )}
      </form>

      {balance != null && (
        <p className="text-sm text-slate-600">SMS credit balance: <strong>{String(balance)}</strong></p>
      )}

      {editable && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Test SMS</h3>
          <p className="text-xs text-slate-500">Use Bangladesh format: 017XXXXXXXX or 88017XXXXXXXX</p>
          <div className="flex flex-wrap gap-2">
            <input
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              className="input min-w-[200px] flex-1"
              placeholder="017XXXXXXXX"
            />
            <button type="button" onClick={sendTest} className="btn-secondary">Send test</button>
          </div>
        </div>
      )}
    </div>
  );
}
