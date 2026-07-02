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
  senderId: '09617626936',
};

export default function SmsSettingsPage() {
  const { can } = usePermission();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [testTo, setTestTo] = useState('01741148529');
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [serverIp, setServerIp] = useState('');
  const [serverIpLoading, setServerIpLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      providerName: BULKSMSBD_DEFAULTS.providerName,
      apiUrl: BULKSMSBD_DEFAULTS.apiUrl,
      balanceUrl: BULKSMSBD_DEFAULTS.balanceUrl,
      apiKey: '',
      senderId: BULKSMSBD_DEFAULTS.senderId,
      isMasking: false,
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

  const fetchServerIp = useCallback(async () => {
    setServerIpLoading(true);
    try {
      const { data } = await notificationsApi.getSmsServerIp();
      setServerIp(data.data?.ip || '');
    } catch {
      setServerIp('');
    } finally {
      setServerIpLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) fetchServerIp();
  }, [loading, fetchServerIp]);

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

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">IP whitelist required (error 1032)</p>
        <p className="mt-1 text-xs text-amber-900">
          BulkSMSBD blocks SMS until your <strong>server outbound IP</strong> is whitelisted. Balance checks work without this; sending does not.
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-amber-900">
          <li>Log in at <strong>bulksmsbd.net</strong></li>
          <li>Open <strong>Phonebook → IP White List</strong></li>
          <li>Set <strong>Source IP Checking</strong> to <strong>Enable</strong></li>
          <li>Type: <strong>API</strong></li>
          <li>Add IP: <strong className="font-mono">{serverIp || '187.77.144.38'}</strong> (must match error message exactly)</li>
          <li>Confirm row status is <strong>Active</strong>, then retry test SMS</li>
        </ol>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs">
            Server outbound IP:{' '}
            <strong className="font-mono">{serverIpLoading ? '…' : (serverIp || 'unknown')}</strong>
          </span>
          <button type="button" onClick={fetchServerIp} disabled={serverIpLoading} className="btn-secondary text-xs py-1">
            Refresh IP
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <p className="font-medium">BulkSMSBD API format</p>
        <p className="mt-1 font-mono text-[11px] break-all">
          http://bulksmsbd.net/api/smsapi?api_key=KEY&amp;type=text&amp;number=88017XXXXXXXX&amp;senderid=09617626936&amp;message=...
        </p>
        <p className="mt-2 text-xs text-sky-800">
          Non-masking: senderid must be <strong>01/09XXXXXXXXX</strong> (not 880...). Masking: approved brand name (max 11 chars).
        </p>
        <p className="mt-1 text-xs text-sky-800">
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

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('isMasking')} disabled={!editable} />
          Masking SMS (brand name sender)
        </label>
        <p className="text-xs text-slate-500">
          Leave unchecked for <strong>non-masking</strong> dedicated number. API sends as 01/09XXXXXXXXX even if you enter 880...
        </p>

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
            <input {...form.register('senderId')} disabled={!editable} className="input mt-1 w-full font-mono text-xs" placeholder="09617626936" />
            <p className="mt-1 text-xs text-slate-500">Non-masking: dedicated number (e.g. 09617626936). Do not use 880... prefix.</p>
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
