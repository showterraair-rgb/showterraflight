import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { securityApi } from '../services/phase5.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { usePermission } from '../hooks/usePermission';
import { formatDate } from '../utils/date';

export default function SecurityPage() {
  const { can } = usePermission();
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [loginLogs, setLoginLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loginPagination, setLoginPagination] = useState(null);
  const [auditPagination, setAuditPagination] = useState(null);
  const [loginPage, setLoginPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [msg, setMsg] = useState('');

  const form = useForm();

  const loadOverview = useCallback(async () => {
    const { data } = await securityApi.overview();
    setOverview(data.data);
  }, []);

  const loadLoginLogs = useCallback(async () => {
    const { data } = await securityApi.loginLogs({ page: loginPage, limit: 20 });
    setLoginLogs(data.data);
    setLoginPagination(data.pagination);
  }, [loginPage]);

  const loadAuditLogs = useCallback(async () => {
    const { data } = await securityApi.auditLogs({ page: auditPage, limit: 20 });
    setAuditLogs(data.data);
    setAuditPagination(data.pagination);
  }, [auditPage]);

  const loadSettings = useCallback(async () => {
    const { data } = await securityApi.getSettings();
    form.reset(data.data);
  }, [form]);

  useEffect(() => {
    if (tab === 'overview') loadOverview();
    if (tab === 'login') loadLoginLogs();
    if (tab === 'audit') loadAuditLogs();
    if (tab === 'settings') loadSettings();
  }, [tab, loadOverview, loadLoginLogs, loadAuditLogs, loadSettings]);

  const saveSettings = async (values) => {
    setMsg('');
    try {
      await securityApi.updateSettings(values);
      setMsg('Security settings saved');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Save failed');
    }
  };

  const prepareMfa = async () => {
    const { data } = await securityApi.prepareMfa();
    setMsg(data.data?.message || 'MFA placeholder ready');
  };

  const loginColumns = [
    { key: 'email', label: 'Email' },
    { key: 'userName', label: 'User' },
    { key: 'success', label: 'Result', render: (r) => <StatusBadge status={r.success ? 'success' : 'failed'} label={r.success ? 'Success' : 'Failed'} /> },
    { key: 'failureReason', label: 'Reason', render: (r) => r.failureReason || '—' },
    { key: 'ipAddress', label: 'IP' },
    { key: 'createdAt', label: 'When', render: (r) => formatDate(r.createdAt) },
  ];

  const auditColumns = [
    { key: 'action', label: 'Action', render: (r) => <StatusBadge status={r.action} label={r.action} /> },
    { key: 'module', label: 'Module' },
    { key: 'description', label: 'Description' },
    { key: 'userName', label: 'User' },
    { key: 'createdAt', label: 'When', render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['overview', 'login', 'audit', 'settings'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-2 text-sm capitalize ${tab === t ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
          >
            {t === 'login' ? 'Login activity' : t}
          </button>
        ))}
      </div>

      {msg && <p className="text-sm text-brand-700">{msg}</p>}

      {tab === 'overview' && overview && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Failed logins (24h)" value={overview.failedLogins24h} />
            <StatCard label="Successful logins (24h)" value={overview.successfulLogins24h} />
            <StatCard label="MFA-enabled admins" value={overview.mfaEnabledAdmins} />
            <StatCard label="Session timeout (min)" value={overview.sessionTimeoutMinutes} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold">Recent audit events</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {overview.recentAudit?.map((a, i) => (
                <li key={i}>{formatDate(a.createdAt)} — {a.userName}: {a.description}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'login' && (
        <>
          <DataTable columns={loginColumns} rows={loginLogs} emptyMessage="No login logs" />
          {loginPagination && <Pagination pagination={loginPagination} onPageChange={setLoginPage} />}
        </>
      )}

      {tab === 'audit' && (
        <>
          <DataTable columns={auditColumns} rows={auditLogs} emptyMessage="No audit logs" />
          {auditPagination && <Pagination pagination={auditPagination} onPageChange={setAuditPage} />}
        </>
      )}

      {tab === 'settings' && can('settings:manage') && (
        <form onSubmit={form.handleSubmit(saveSettings)} className="max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div><label className="mb-1 block text-sm font-medium">Min password length</label><input type="number" className="input-field" {...form.register('minPasswordLength', { valueAsNumber: true })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('requireUppercase')} /> Require uppercase</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('requireLowercase')} /> Require lowercase</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('requireNumber')} /> Require number</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('requireSpecialChar')} /> Require special character</label>
          <div><label className="mb-1 block text-sm font-medium">Session timeout (minutes)</label><input type="number" className="input-field" {...form.register('sessionTimeoutMinutes', { valueAsNumber: true })} /></div>
          <div><label className="mb-1 block text-sm font-medium">Max login attempts</label><input type="number" className="input-field" {...form.register('maxLoginAttempts', { valueAsNumber: true })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('mfaRequiredForAdmin')} /> Require MFA for admin (when enabled)</label>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Save settings</button>
            <button type="button" onClick={prepareMfa} className="btn-secondary">Prepare MFA (admin)</button>
          </div>
        </form>
      )}
    </div>
  );
}
