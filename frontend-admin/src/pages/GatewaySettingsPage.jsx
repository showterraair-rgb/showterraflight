import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { gatewayApi, accountsApi } from '../services/finance.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePermission } from '../hooks/usePermission';
import { ACCOUNT_TYPE_LABELS } from '../utils/finance';

export default function GatewaySettingsPage() {
  const { can } = usePermission();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [gatewayStatus, setGatewayStatus] = useState(null);

  const form = useForm({
    defaultValues: {
      sslcommerzEnabled: false,
      sslcommerzSandbox: true,
      sslcommerzStoreId: '',
      sslcommerzStorePassword: '',
      sslcommerzSettlementAccountId: '',
      bkashEnabled: false,
      bkashSandbox: true,
      bkashAppKey: '',
      bkashAppSecret: '',
      bkashUsername: '',
      bkashPassword: '',
      bkashSettlementAccountId: '',
    },
  });

  useEffect(() => {
    Promise.all([gatewayApi.getSettings(), accountsApi.list()])
      .then(([gRes, aRes]) => {
        const g = gRes.data.data || {};
        const ssl = g.sslcommerz || {};
        const bk = g.bkash || {};
        form.reset({
          sslcommerzEnabled: Boolean(ssl.enabled),
          sslcommerzSandbox: ssl.isSandbox !== false,
          sslcommerzStoreId: ssl.storeId || '',
          sslcommerzStorePassword: ssl.storePassword || '',
          sslcommerzSettlementAccountId: ssl.settlementAccountId || '',
          bkashEnabled: Boolean(bk.enabled),
          bkashSandbox: bk.isSandbox !== false,
          bkashAppKey: bk.appKey || '',
          bkashAppSecret: bk.appSecret || '',
          bkashUsername: bk.username || '',
          bkashPassword: bk.password || '',
          bkashSettlementAccountId: bk.settlementAccountId || '',
        });
        setAccounts((aRes.data.data || []).filter((a) => a.isActive !== false));
        setGatewayStatus(g.status || null);
      })
      .finally(() => setLoading(false));
  }, [form]);

  const onSubmit = async (values) => {
    setError('');
    setSaved('');
    try {
      await gatewayApi.updateSettings({
        gatewaySettings: {
          sslcommerz: {
            enabled: values.sslcommerzEnabled,
            isSandbox: values.sslcommerzSandbox,
            storeId: values.sslcommerzStoreId,
            storePassword: values.sslcommerzStorePassword,
            settlementAccountId: values.sslcommerzSettlementAccountId || undefined,
          },
          bkash: {
            enabled: values.bkashEnabled,
            isSandbox: values.bkashSandbox,
            appKey: values.bkashAppKey,
            appSecret: values.bkashAppSecret,
            username: values.bkashUsername,
            password: values.bkashPassword,
            settlementAccountId: values.bkashSettlementAccountId || undefined,
          },
        },
      });
      setSaved('Gateway settings saved');
      const { data } = await gatewayApi.getSettings();
      setGatewayStatus(data.data?.status || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;

  const accountLabel = (a) => `${a.name} (${ACCOUNT_TYPE_LABELS[a.type] || a.type})`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/settings/payment" className="text-sm text-brand-600 hover:underline">← Payment Settings</Link>
        <h2 className="mt-2 text-xl font-bold text-slate-900">Online Payment Gateway</h2>
        <p className="text-sm text-slate-500">
          Save credentials when ready. Until API keys are added, manual payments still work normally.
        </p>
        {gatewayStatus && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full px-3 py-1 ${gatewayStatus.sslcommerz?.ready ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
              SSLCommerz: {gatewayStatus.sslcommerz?.ready ? 'Ready' : gatewayStatus.sslcommerz?.configured ? 'Enabled (check settings)' : 'Not configured'}
            </span>
            <span className={`rounded-full px-3 py-1 ${gatewayStatus.bkash?.ready ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
              bKash: {gatewayStatus.bkash?.ready ? 'Ready' : gatewayStatus.bkash?.configured ? 'Enabled (check settings)' : 'Not configured'}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {saved && <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{saved}</div>}

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">SSLCommerz</h3>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('sslcommerzEnabled')} disabled={!can('settings:manage')} />
              Enabled
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...form.register('sslcommerzSandbox')} disabled={!can('settings:manage')} />
            Sandbox mode
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Store ID</label>
              <input className="input-field" {...form.register('sslcommerzStoreId')} disabled={!can('settings:manage')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Store Password</label>
              <input type="password" className="input-field" {...form.register('sslcommerzStorePassword')} disabled={!can('settings:manage')} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Settlement Account</label>
              <select className="input-field" {...form.register('sslcommerzSettlementAccountId')} disabled={!can('settings:manage')}>
                <option value="">Select account to credit</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{accountLabel(a)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card space-y-4 opacity-80">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">bKash Checkout</h3>
              <p className="text-xs text-slate-500">Tokenized checkout API — functions ready, add credentials when available</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('bkashEnabled')} disabled={!can('settings:manage')} />
              Enabled
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...form.register('bkashSandbox')} disabled={!can('settings:manage')} />
            Sandbox mode
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">App Key</label>
              <input className="input-field" {...form.register('bkashAppKey')} disabled={!can('settings:manage')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">App Secret</label>
              <input type="password" className="input-field" {...form.register('bkashAppSecret')} disabled={!can('settings:manage')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Username</label>
              <input className="input-field" {...form.register('bkashUsername')} disabled={!can('settings:manage')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input type="password" className="input-field" {...form.register('bkashPassword')} disabled={!can('settings:manage')} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Settlement Account</label>
              <select className="input-field" {...form.register('bkashSettlementAccountId')} disabled={!can('settings:manage')}>
                <option value="">Select account to credit</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{accountLabel(a)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {can('settings:manage') && (
          <button type="submit" className="btn-primary">Save Gateway Settings</button>
        )}
      </form>
    </div>
  );
}
