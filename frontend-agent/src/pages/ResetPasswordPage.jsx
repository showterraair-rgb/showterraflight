import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { agentAuthApi } from '../services/agent.api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await agentAuthApi.resetPassword({ token, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-lg font-bold">Set new password</h1>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <input type="password" className="input-field" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading || !token} className="btn-primary w-full">Update password</button>
        </form>
        <Link to="/login" className="mt-4 inline-block text-sm text-brand-600">Back to login</Link>
      </div>
    </div>
  );
}
