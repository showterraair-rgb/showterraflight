import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { notificationsApi } from '../services/notifications.api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePermission } from '../hooks/usePermission';

const EVENT_LABELS = {
  website_order_created: 'Website order received (customer)',
  manual_order_created: 'Manual booking created',
  admin_new_booking_alert: 'New website order (admin alert)',
  booking_approved: 'Booking approved',
  ticket_issued: 'Ticket issued',
  payment_received: 'Payment received',
  payment_due_reminder: 'Payment due reminder',
  booking_canceled: 'Booking canceled',
};

export default function NotificationTemplatesPage() {
  const { can } = usePermission();
  const [templates, setTemplates] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState('');

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      smsBody: '',
      emailSubject: '',
      emailBody: '',
      isActive: true,
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tplRes, ruleRes] = await Promise.all([
        notificationsApi.listTemplates(),
        notificationsApi.listAutomation(),
      ]);
      setTemplates(tplRes.data.data || []);
      setRules(ruleRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (tpl) => {
    setSelected(tpl);
    form.reset({
      name: tpl.name,
      description: tpl.description || '',
      smsBody: tpl.smsBody || '',
      emailSubject: tpl.emailSubject || '',
      emailBody: tpl.emailBody || '',
      isActive: tpl.isActive !== false,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    if (!selected) return;
    setMsg('');
    try {
      await notificationsApi.updateTemplate(selected.templateKey, values);
      setMsg('Template saved');
      setModalOpen(false);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Save failed');
    }
  };

  const updateRule = async (eventType, patch) => {
    setMsg('');
    try {
      const current = rules.find((r) => r.eventType === eventType) || {};
      await notificationsApi.updateAutomation(eventType, { ...current, ...patch });
      load();
      setMsg('Automation rule updated');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Rule update failed');
    }
  };

  const editable = can('notifications:manage') || can('settings:manage');

  const templateColumns = [
    { key: 'name', label: 'Template' },
    { key: 'templateKey', label: 'Key', render: (r) => <code className="text-xs">{r.templateKey}</code> },
    { key: 'isActive', label: 'Status', render: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} label={r.isActive ? 'Active' : 'Inactive'} /> },
    {
      key: 'actions',
      label: '',
      render: (r) => editable && (
        <button type="button" onClick={() => openEdit(r)} className="text-xs font-medium text-brand-600">Edit</button>
      ),
    },
  ];

  if (loading && !templates.length) return <LoadingSpinner className="py-20" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Notification Templates</h2>
        <p className="text-sm text-slate-500">Edit SMS and email content. Use placeholders like {'{{customerName}}'}, {'{{bookingNumber}}'}.</p>
      </div>

      {msg && <p className="text-sm text-brand-700">{msg}</p>}

      <DataTable columns={templateColumns} data={templates} loading={loading} emptyMessage="No templates" />

      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Automation rules</h3>
        <p className="text-xs text-slate-500">Control who receives notifications and which channels are used per event.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-4">Event</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Admin</th>
                <th className="py-2 pr-4">SMS</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.eventType} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium">{EVENT_LABELS[rule.eventType] || rule.eventType}</td>
                  {['notifyCustomer', 'notifyAdmin', 'smsEnabled', 'emailEnabled', 'isEnabled'].map((field) => (
                    <td key={field} className="py-2 pr-4">
                      <input
                        type="checkbox"
                        checked={Boolean(rule[field])}
                        disabled={!editable}
                        onChange={(e) => updateRule(rule.eventType, { [field]: e.target.checked })}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Edit: ${selected?.name || ''}`}
        wide
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" form="notification-template-form" className="btn-primary">Save template</button>
          </div>
        )}
      >
        <form id="notification-template-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <label className="block text-sm">
            <span className="text-slate-600">Name</span>
            <input {...form.register('name', { required: true })} className="input mt-1 w-full" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Description</span>
            <input {...form.register('description')} className="input mt-1 w-full" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('isActive')} />
            Template active
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">SMS body</span>
            <textarea {...form.register('smsBody')} rows={3} className="input mt-1 w-full font-mono text-xs" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Email subject</span>
            <input {...form.register('emailSubject')} className="input mt-1 w-full" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Email body</span>
            <textarea {...form.register('emailBody')} rows={6} className="input mt-1 w-full font-mono text-xs" />
          </label>
        </form>
      </Modal>
    </div>
  );
}
