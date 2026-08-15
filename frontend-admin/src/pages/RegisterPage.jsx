import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/auth.api';
export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: '',
contactPerson: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !form.companyName ||
!form.contactPerson ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError('Please fill in all fields.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
try {
  await authApi.register({
    companyName: form.companyName,
contactPerson: form.contactPerson,
    email: form.email,
    phone: form.phone,
    password: form.password,
  });

  alert('Registration successful!');
  navigate('/login');
} catch (err) {
  setError(
    err.response?.data?.message ||
    'Registration failed. Please try again.'
  );
}
    
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-600 text-lg font-bold text-white">
            STA
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Show Terra Air
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create your account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-6 shadow-sm space-y-4"
        >
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
            Name="CompanyName
            </label>
            <input
              type="text"
              name="companyName"
              value={form.CompanyName}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter company name"
            />
          </div>
<div>
  <label className="mb-1 block text-sm font-medium">
    Contact Person
  </label>
  <input
    type="text"
    name="contactPerson"
    value={form.contactPerson}
    onChange={handleChange}
    className="input-field"
    placeholder="Enter contact person name"
  />
</div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter password again"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
          >
            Register
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full text-sm font-medium text-green-700 hover:underline"
          >
            Back to Login
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Kanaighat, Sylhet — Show Terra Air Management System
        </p>
      </div>
    </div>
  );
}