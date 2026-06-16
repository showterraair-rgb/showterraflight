import { useEffect, useState } from 'react';
import { agentApi } from '../services/agent.api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { formatDate } from '../utils/constants';

export default function ProfilePage() {
  const { agent, fetchMe } = useAuthStore();
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agentApi.profile().then(({ data }) => setForm(data.data)).finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await agentApi.updateProfile(form);
      await fetchMe();
      toast('Profile updated');
    } catch (err) {
      toast(err.response?.data?.message || 'Update failed', 'error');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      await agentApi.changePassword(pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      toast('Password changed');
    } catch (err) {
      toast(err.response?.data?.message || 'Password change failed', 'error');
    }
  };

  if (loading || !form) return <LoadingSkeleton rows={6} />;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="card text-sm text-slate-600">
        <p>Agent ID: <strong className="text-slate-900">{agent?.agentId}</strong></p>
        <p>Member since: {formatDate(agent?.createdAt)}</p>
      </div>
      <form onSubmit={saveProfile} className="card space-y-4">
        <h2 className="font-semibold">Company details</h2>
        {['companyName', 'contactPerson', 'phone', 'address', 'city', 'country'].map((k) => (
          <div key={k}><label className="mb-1 block text-sm capitalize">{k.replace(/([A-Z])/g, ' $1')}</label><input className="input-field" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
        ))}
        <p className="text-sm text-slate-500">Email: {form.email} (contact admin to change)</p>
        <button type="submit" className="btn-primary">Save profile</button>
      </form>
      <form onSubmit={savePassword} className="card space-y-4">
        <h2 className="font-semibold">Change password</h2>
        <input type="password" className="input-field" placeholder="Current password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} required />
        <input type="password" className="input-field" placeholder="New password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} required />
        <button type="submit" className="btn-secondary">Update password</button>
      </form>
    </div>
  );
}
