import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { notificationsApi } from '../services/notifications.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePermission } from '../hooks/usePermission';
import { BD_PHONE_HELP, BD_PHONE_PLACEHOLDER } from '../utils/phone';

const BULKSMSBD_DEFAULTS = {
  providerName: 'BulkSMSBD',
  apiUrl: 'http://bulksmsbd.net/api/smsapi',
  balanceUrl: 'http://bulksmsbd.net/api/getBalanceApi',
  senderId: '8809648909214',
};

export default function SmsSettingsPage() {
  const { can } = usePermission();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [testTo, setTestTo] = useState('01741148529');
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      providerName: BULKSMSBD_DEFAULTS.providerName,
      apiUrl: BULKSMSBD_DEFAULTS.apiUrl,
      balanceUrl: BULKSMSBD_DEFAULTS.balanceUrl,
      apiKey: '',
      senderId: BULKSMSBD_DEFAULTS.senderId,
      isEnabled: true,
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.getSmsSettings();
      form.reset({
        ...BULKSMSBD_DEFAULTS,
        ...data.data,
        apiKey: data.data?.apiKey || '',
      });
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
      const { data } = await notificationsApi.testSms({ to: testTo, message: 'Test SMS from Show Terra Flight admin.' });
      if (data.mocked) {
        setMsg('SMS logged only — enable gateway and save API key + sender ID');
        return;
      }
      if (!data.success) throw new Error(data.message || 'Test failed');
      setMsg(`Test SMS sent (ID: ${data.data?.messageId || 'ok'})`);
    } catch (err) {
      setMsg(err.response?.data?.message || err.message || 'Test failed');
    }
  };

  const fetchBalance = async () => {
    setBalanceLoading(true);
    setMsg('');
    try {
      const { data } = await notificationsApi.getSmsBalance();
      if (!data.success) throw new Error(data.message || 'Balance check failed');
      setBalance(data.data?.balance ?? data.data?.raw ?? '—');
    } catch (err) {
      setMsg(err.response?.data?.message || err.message || 'Could not fetch balance');
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
        <Link to="/settings/notifications" className="text-xs font-medium text-brand-600 hover:underline">← All notification settings</Link>
        <h2 className="mt-2 text-xl font-bold text-slate-900">SMS Settings</h2>
        <p className="text-sm text-slate-500">
          BulkSMSBD gateway for booking reminders and payment alerts.
        </p>
      </div>

      <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <p className="font-medium">BulkSMSBD API format</p>
        <p className="mt-1 font-mono text-[11px] break-all">
          http://bulksmsbd.net/api/smsapi?api_key=KEY&amp;type=text&amp;number=88017XXXXXXXX&amp;senderid=8809648909214&amp;message=...
        </p>
        <p className="mt-2 text-xs text-sky-800">
          Whitelist your server IP in BulkSMSBD Phonebook or SMS will fail with error 1032.
        </p>
      </div>

      {msg && (
        <p className={`text-sm ${msg.includes('sent') || msg.includes('saved') ? 'text-green-700' : 'text-red-700'}`}>
          {msg}
        </p>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="card space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" {...form.register('isEnabled')} disabled={!editable} />
          Enable SMS notifications
        </label>

        <label className="block text-sm">
          <span className="text-slate-600">API URL (send)</span>
          <input {...form.register('apiUrl')} disabled={!editable} className="input mt-1 w-full font-mono text-xs" />
        </label>

        <label className="block text-sm">
          <span className="text-slate-600">Balance API URL</span>
          <input {...form.register('balanceUrl')} disabled={!editable} className="input mt-1 w-full font-mono text-xs" placeholder="http://bulksmsbd.net/api/getBalanceApi" />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">API key *</span>
            <input {...form.register('apiKey')} disabled={!editable} className="input mt-1 w-full font-mono text-xs" autoComplete="off" placeholder="From BulkSMSBD dashboard" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Sender ID *</span>
            <input {...form.register('senderId')} disabled={!editable} className="input mt-1 w-full font-mono text-xs" placeholder="8809648909214" />
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
          <p className="text-xs text-slate-500">{BD_PHONE_HELP}</p>
          <div className="flex flex-wrap gap-2">
            <input
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              className="input min-w-[200px] flex-1"
              placeholder={BD_PHONE_PLACEHOLDER}
            />
            <button type="button" onClick={sendTest} className="btn-secondary">Send test</button>
          </div>
        </div>
      )}
    </div>
  );
}
