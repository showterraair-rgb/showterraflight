import { useEffect, useState } from 'react';
import { currencyApi } from '../services/currency.api';

export default function CurrencySettingsPage() {
  const [brlRate, setBrlRate] = useState('22.50');
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    currencyApi.getSettings()
      .then(({ data }) => {
        setBrlRate(String(data.data.currencies.BRL.rateToBase));
        setUpdatedAt(data.data.currenciesUpdatedAt || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const previewBDT = (Number(brlRate) || 0) * 100;

  const onSave = async (e) => {
    e.preventDefault();
    const rate = Number(brlRate);
    if (!rate || rate <= 0) {
      setMsg('Rate must be a positive number');
      return;
    }
    if (!window.confirm('Changing the rate only affects new bookings. Existing bookings keep their booking-time rate. Continue?')) return;

    setSaving(true);
    setMsg('');
    try {
      const { data } = await currencyApi.updateBRLRate(rate);
      setBrlRate(String(data.data.currencies.BRL.rateToBase));
      setUpdatedAt(data.data.currenciesUpdatedAt);
      setMsg(data.message || 'Rate saved');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="py-10 text-center text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Currency & Exchange Rates</h2>
        <p className="text-sm text-slate-500">BDT is the base currency. Set how many BDT equal 1 BRL.</p>
      </div>

      <form onSubmit={onSave} className="card space-y-4">
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p><strong>Base currency:</strong> BDT (Bangladeshi Taka) ৳</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">BRL (Brazilian Real) R$</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">1 BRL = ৳</span>
            <input
              type="number"
              min={0.01}
              step="0.01"
              className="input-field flex-1"
              value={brlRate}
              onChange={(e) => setBrlRate(e.target.value)}
              required
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Preview: 100 BRL = ৳ {previewBDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} at current rate
          </p>
        </div>

        {updatedAt && (
          <p className="text-xs text-slate-500">Last updated: {new Date(updatedAt).toLocaleString()}</p>
        )}

        {msg && <p className={`text-sm ${msg.includes('fail') || msg.includes('must') ? 'text-red-600' : 'text-green-700'}`}>{msg}</p>}

        <button type="submit" disabled={saving} className="btn-primary">Save Rate</button>
      </form>
    </div>
  );
}
