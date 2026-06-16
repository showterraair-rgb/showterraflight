import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentApi } from '../services/agent.api';
import { useToast } from '../context/ToastContext';
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

export default function NewBookingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [airlineCustom, setAirlineCustom] = useState('');
  const [ticketFile, setTicketFile] = useState(null);
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
    baseFare: 0,
    tax: 0,
    agentMarkup: 0,
    currency: 'BDT',
    bookingType: 'standard',
    specialRequests: '',
    baggageAllowance: '',
    mealPreference: 'None',
    seatPreference: 'No Preference',
    ticketIssued: false,
  });

  const totalFare = useMemo(() => {
    const count = Math.max(1, form.passengers.length);
    return (Number(form.baseFare) + Number(form.tax)) * count + Number(form.agentMarkup || 0);
  }, [form.baseFare, form.tax, form.agentMarkup, form.passengers.length]);

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
    setSubmitting(true);
    try {
      const airline = form.airline === 'Other' ? airlineCustom : form.airline;
      const payload = { ...form, airline, totalFare };

      if (ticketFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (k === 'passengers') fd.append('passengers', JSON.stringify(v));
          else fd.append(k, v);
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
          <h2 className="font-semibold text-brand-700">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium">Base fare (per pax)</label><input type="number" min={0} className="input-field" value={form.baseFare} onChange={(e) => setField('baseFare', e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Tax (per pax)</label><input type="number" min={0} className="input-field" value={form.tax} onChange={(e) => setField('tax', e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Agent markup</label><input type="number" min={0} className="input-field" value={form.agentMarkup} onChange={(e) => setField('agentMarkup', e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Currency</label><select className="input-field" value={form.currency} onChange={(e) => setField('currency', e.target.value)}><option value="BDT">BDT</option><option value="USD">USD</option></select></div>
            <div className="sm:col-span-2 rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-500">Total fare</p><p className="text-2xl font-bold">{form.currency} {totalFare.toLocaleString()}</p></div>
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
