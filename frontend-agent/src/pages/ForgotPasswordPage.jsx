import { useState } from 'react';
import { Link } from 'react-router-dom';
import { agentAuthApi } from '../services/agent.api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await agentAuthApi.forgotPassword(email);
      setMsg(data.message);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-lg font-bold">Reset password</h1>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <input type="email" className="input-field" placeholder="Agent email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit" disabled={loading} className="btn-primary w-full">Send reset link</button>
        </form>
        {msg && <p className="mt-4 text-sm text-slate-600">{msg}</p>}
        <Link to="/login" className="mt-4 inline-block text-sm text-brand-600">Back to login</Link>
      </div>
    </div>
  );
}
