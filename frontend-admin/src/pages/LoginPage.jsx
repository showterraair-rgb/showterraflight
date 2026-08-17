import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../services/auth.api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const passwordSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const otpRequestSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
}).refine((d) => d.email || d.phone, { message: 'Email or phone required' });

const otpVerifySchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  code: z.string().length(6, 'Enter 6-digit code'),
}).refine((d) => d.email || d.phone, { message: 'Email or phone required' });

function authErrorMessage(err) {
  const status = err.response?.status;
  const msg = err.response?.data?.message;
  if (status === 429) return msg || 'Too many attempts. Wait 15 minutes, then try again.';
  if (status === 401) return msg || 'Invalid email or password.';
  return msg || 'Login failed. Please try again.';
}

export default function LoginPage() {
  const { login, loginWithOtp, isAuthenticated, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState('');
  const [otpStep, setOtpStep] = useState('request');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });
  const otpRequestForm = useForm({ resolver: zodResolver(otpRequestSchema) });
  const otpVerifyForm = useForm({ resolver: zodResolver(otpVerifySchema) });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;
  }

  const onPasswordLogin = async (data) => {
    setError('');
    setSubmitting(true);
    try {
      await login(data);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onRequestOtp = async (data) => {
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      const payload = data.email ? { email: data.email } : { phone: data.phone };
      const { data: res } = await authApi.requestOtp(payload);
      setInfo(res.message || 'Code sent');
      otpVerifyForm.setValue('email', data.email || '');
      otpVerifyForm.setValue('phone', data.phone || '');
      setOtpStep('verify');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyOtp = async (data) => {
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        code: data.code,
        ...(data.email ? { email: data.email } : { phone: data.phone }),
      };
      await loginWithOtp(payload);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      
      <div className="absolute right-20 top-4 flex gap-2">
  <button
    type="button"
    onClick={() => setMode('password')}
    className="rounded-lg border px-4 py-2 font-medium"
  >
    Login
  </button>

  <button
    type="button"
    onClick={() => navigate('/register')}
    className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white"
  >
    Register
  </button>
</div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">STA</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Show Terra Air</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Welcome Login into your account</p>
        </div>

        

        <div className="card space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</div>}
          {info && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950/50 dark:text-green-300">{info}</div>}

          {mode === 'password' ? (
            
            <form onSubmit={passwordForm.handleSubmit(onPasswordLogin)} className="space-y-4">
              
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input type="email" className="input-field" {...passwordForm.register('email')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Password</label>
                <input type="password" className="input-field" {...passwordForm.register('password')} />
              </div><div className="text-right">
  <button
    type="button"
    onClick={() => setMode('otp')}
    className="text-sm font-medium"
  >
    Forgot password?
  </button>
</div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? 'Signing in…' : 'Login'}</button>
            </form>
          ) : otpStep === 'request' ? (
            <form onSubmit={otpRequestForm.handleSubmit(onRequestOtp)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input type="email" className="input-field" {...otpRequestForm.register('email')} />
              </div>
              <p className="text-center text-xs text-slate-400">or</p>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input className="input-field" placeholder="01XXXXXXXXX" {...otpRequestForm.register('phone')} />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">Send OTP Code</button>
            </form>
          ) : (
            <form onSubmit={otpVerifyForm.handleSubmit(onVerifyOtp)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">6-digit code</label>
                <input className="input-field text-center font-mono text-lg tracking-widest" maxLength={6} {...otpVerifyForm.register('code')} />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">Verify & Sign In</button>
              <button type="button" className="w-full text-sm text-brand-600 hover:underline" onClick={() => setOtpStep('request')}>Request new code</button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Kanaighat, Sylhet — Show Terra Air Management System
        </p>
      </div>
    </div>
  );
}
