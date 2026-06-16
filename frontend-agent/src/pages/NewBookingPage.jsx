import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentApi } from '../services/agent.api';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../hooks/useCurrency';
import DualCurrencyAmount from '../components/DualCurrencyAmount';
import { AIRLINES, PASSENGER_TITLES } from '../utils/constants';

const emptyPassenger = {
  title: 'Mr',
  firstName: '',
  lastName: '',
  dob: '',
  passportNumber: '',
  passportExpiry: '',
  nationality: 'Bangladeshi',
};

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function NewBookingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { brlRate } = useCurrency();
  const [submitting, setSubmitting] = useState(false);
  const [airlineCustom, setAirlineCustom] = useState('');
  const [ticketFile, setTicketFile] = useState(null);
  const [rateTouched, setRateTouched] = useState(false);
  const [rateError, setRateError] = useState('');
  const [form, setForm] = useState({
    flightNumber: '',
    airline: AIRLINES[0],
    fromCity: 'DAC',
    toCity: '',
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: '',
    travelClass: 'economy',
    pnr: '',
    passengers: [{ ...emptyPassenger }],
    baseFareBRL: '',
    taxBRL: '',
    markupBRL: '',
    bdtRate: '',
    bookingType: 'standard',
    specialRequests: '',
    baggageAllowance: '',
    mealPreference: 'None',
    seatPreference: 'No Preference',
    ticketIssued: false,
  });

  const effectiveRate = Number(form.bdtRate || brlRate) || 0;
  const passengerCount = Math.max(1, form.passengers.length);

  const totalFareBRL = useMemo(() => {
    const base = Number(form.baseFareBRL) || 0;
    const tax = Number(form.taxBRL) || 0;
    const markup = Number(form.markupBRL) || 0;
    return (base + tax) * passengerCount + markup;
  }, [form.baseFareBRL, form.taxBRL, form.markupBRL, passengerCount]);

  const totalFareBDT = useMemo(() => totalFareBRL * effectiveRate, [totalFareBRL, effectiveRate]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updatePassenger = (idx, key, value) => {
    setForm((f) => {
      const passengers = [...f.passengers];
      passengers[idx] = { ...passengers[idx], [key]: value };
      return { ...f, passengers };
    });
  };

  const addPassenger = () => setForm((f) => ({ ...f, passengers: [...f.passengers, { ...emptyPassenger }] }));

  const removePassenger = (idx) => {
    if (form.passengers.length <= 1) return;
    setForm((f) => ({ ...f, passengers: f.passengers.filter((_, i) => i !== idx) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!effectiveRate || effectiveRate <= 0) {
      setRateError('BDT rate must be greater than 0');
      return;
    }
    if (!Number(form.baseFareBRL) || Number(form.baseFareBRL) <= 0) {
      toast('Base fare must be a positive number', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const airline = form.airline === 'Other' ? airlineCustom : form.airline;
      const payload = {
        ...form,
        airline,
        baseFareBRL: Number(form.baseFareBRL),
        taxBRL: Number(form.taxBRL) || 0,
        markupBRL: Number(form.markupBRL) || 0,
        bdtRate: effectiveRate,
      };

      if (ticketFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (k === 'passengers') fd.append('passengers', JSON.stringify(v));
          else if (v !== '' && v != null) fd.append(k, v);
        });
        fd.append('ticketFile', ticketFile);
        await agentApi.createBookingWithFile(fd);
      } else {
        await agentApi.createBooking(payload);
      }

      toast('Ticket request submitted — pending admin confirmation');
      navigate('/bookings');
    } catch (err) {
      toast(err.response?.data?.message || 'Submit failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const displayRate = form.bdtRate !== '' && rateTouched ? form.bdtRate : (form.bdtRate || brlRate);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">New Booking</h1>
      <form onSubmit={onSubmit} className="space-y-6">
        <section className="card space-y-4">
          <h2 className="font-semibold text-brand-700">Flight Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium">Flight Number *</label><input className="input-field" required value={form.flightNumber} onChange={(e) => setField('flightNumber', e.target.value)} /></div>
            <div>
              <label className="mb-1 block text-sm font-medium">Airline *</label>
              <select className="input-field" value={form.airline} onChange={(e) => setField('airline', e.target.value)}>
                {AIRLINES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {form.airline === 'Other' && <input className="input-field mt-2" placeholder="Airline name" value={airlineCustom} onChange={(e) => setAirlineCustom(e.target.value)} required />}
            </div>
            <div><label className="mb-1 block text-sm font-medium">From *</label><input className="input-field uppercase" required value={form.fromCity} onChange={(e) => setField('fromCity', e.target.value.toUpperCase())} /></div>
            <div><label className="mb-1 block text-sm font-medium">To *</label><input className="input-field uppercase" required value={form.toCity} onChange={(e) => setField('toCity', e.target.value.toUpperCase())} /></div>
            <div><label className="mb-1 block text-sm font-medium">Departure Date *</label><input type="date" className="input-field" required value={form.departureDate} onChange={(e) => setField('departureDate', e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Departure Time</label><input type="time" className="input-field" value={form.departureTime} onChange={(e) => setField('departureTime', e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Arrival Date</label><input type="date" className="input-field" value={form.arrivalDate} onChange={(e) => setField('arrivalDate', e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Arrival Time</label><input type="time" className="input-field" value={form.arrivalTime} onChange={(e) => setField('arrivalTime', e.target.value)} /></div>
            <div>
              <label className="mb-1 block text-sm font-medium">Travel Class</label>
              <select className="input-field" value={form.travelClass} onChange={(e) => setField('travelClass', e.target.value)}>
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </div>
            <div><label className="mb-1 block text-sm font-medium">PNR / Booking Ref</label><input className="input-field uppercase" value={form.pnr} onChange={(e) => setField('pnr', e.target.value.toUpperCase())} /></div>
          </div>
        </section>

        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-brand-700">Passengers</h2>
            <button type="button" onClick={addPassenger} className="btn-secondary">+ Add Passenger</button>
          </div>
          {form.passengers.map((p, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Passenger {idx + 1}</p>
                {form.passengers.length > 1 && <button type="button" className="text-xs text-red-600" onClick={() => removePassenger(idx)}>Remove</button>}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <select className="input-field" value={p.title} onChange={(e) => updatePassenger(idx, 'title', e.target.value)}>
                  {PASSENGER_TITLES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <input className="input-field" placeholder="First name *" required value={p.firstName} onChange={(e) => updatePassenger(idx, 'firstName', e.target.value)} />
                <input className="input-field" placeholder="Last name *" required value={p.lastName} onChange={(e) => updatePassenger(idx, 'lastName', e.target.value)} />
                <input type="date" className="input-field" value={p.dob} onChange={(e) => updatePassenger(idx, 'dob', e.target.value)} />
                <input className="input-field" placeholder="Passport number *" required value={p.passportNumber} onChange={(e) => updatePassenger(idx, 'passportNumber', e.target.value)} />
                <input type="date" className="input-field" value={p.passportExpiry} onChange={(e) => updatePassenger(idx, 'passportExpiry', e.target.value)} />
                <input className="input-field sm:col-span-3" placeholder="Nationality" value={p.nationality} onChange={(e) => updatePassenger(idx, 'nationality', e.target.value)} />
              </div>
            </div>
          ))}
        </section>

        <section className="card space-y-4">
          <h2 className="font-semibold text-brand-700">Pricing (BRL)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Base Fare (per pax) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">R$</span>
                <input type="number" min={0.01} step="0.01" className="input-field pl-10" required value={form.baseFareBRL} onChange={(e) => setField('baseFareBRL', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tax (per pax)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">R$</span>
                <input type="number" min={0} step="0.01" className="input-field pl-10" value={form.taxBRL} onChange={(e) => setField('taxBRL', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Agent Markup</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">R$</span>
                <input type="number" min={0} step="0.01" className="input-field pl-10" value={form.markupBRL} onChange={(e) => setField('markupBRL', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <label className="mb-1 block text-sm font-medium">BDT Exchange Rate *</label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600">1 BRL = ৳</span>
              <input
                type="number"
                min={0.01}
                step="0.01"
                className="input-field w-32"
                value={displayRate}
                onChange={(e) => {
                  setRateTouched(true);
                  setField('bdtRate', e.target.value);
                  setRateError(Number(e.target.value) > 0 ? '' : 'BDT rate must be greater than 0');
                }}
                required
              />
              <span className="text-sm text-slate-500">৳ per BRL</span>
            </div>
            {rateError && <p className="mt-1 text-xs text-red-600">{rateError}</p>}
            <p className="mt-2 text-xs text-slate-500">
              100 BRL = ৳ {fmt(100 * effectiveRate)} at this rate
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Total Amount</p>
            <DualCurrencyAmount totalBRL={totalFareBRL} totalBDT={totalFareBDT} size="lg" className="mt-2" />
            <p className="mt-2 text-xs text-slate-500">Rate used: 1 BRL = ৳ {fmt(effectiveRate)}</p>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="font-semibold text-brand-700">Additional Info</h2>
          <textarea rows={3} className="input-field" placeholder="Special requests" value={form.specialRequests} onChange={(e) => setField('specialRequests', e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-3">
            <input className="input-field" placeholder="Baggage allowance" value={form.baggageAllowance} onChange={(e) => setField('baggageAllowance', e.target.value)} />
            <select className="input-field" value={form.mealPreference} onChange={(e) => setField('mealPreference', e.target.value)}>
              {['None', 'Veg', 'Non-Veg', 'Halal'].map((m) => <option key={m}>{m}</option>)}
            </select>
            <select className="input-field" value={form.seatPreference} onChange={(e) => setField('seatPreference', e.target.value)}>
              {['No Preference', 'Window', 'Aisle'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="font-semibold text-brand-700">Booking Type</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <select className="input-field" value={form.bookingType} onChange={(e) => setField('bookingType', e.target.value)}>
              <option value="standard">Standard Booking</option>
              <option value="reissue">Reissue</option>
              <option value="refund">Refund Request</option>
              <option value="void">Void</option>
            </select>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.ticketIssued} onChange={(e) => setField('ticketIssued', e.target.checked)} /> Ticket already issued</label>
            <input type="file" accept="application/pdf,image/*" className="text-sm sm:col-span-2" onChange={(e) => setTicketFile(e.target.files?.[0] || null)} />
          </div>
        </section>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
          {submitting ? 'Submitting…' : 'Confirm Ticket Request'}
        </button>
      </form>
    </div>
  );
}
