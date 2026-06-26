import { useState } from 'react';
import { bookingsApi } from '../../services/crm.api';

export default function ScheduleChangePanel({ booking, onDone }) {
  const [file, setFile] = useState(null);
  const [departureDate, setDepartureDate] = useState(booking.departureDate?.slice(0, 10) || '');
  const [route, setRoute] = useState(booking.route || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (file) {
        await bookingsApi.scheduleChangeWithTicket(booking.id, file, {
          departureDate,
          route,
          note: note || 'Schedule changed with new ticket',
        });
      } else {
        await bookingsApi.scheduleChange(booking.id, { departureDate, route, note });
      }
      setFile(null);
      setNote('');
      onDone?.();
      alert('Schedule change saved and notifications queued');
    } catch (err) {
      alert(err.response?.data?.message || 'Schedule change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-slate-900">Schedule Change</h3>
      <p className="text-xs text-slate-500">Upload new ticket, update flight details, notify customer and staff.</p>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">New Departure Date</label>
          <input type="date" className="input-field" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Route</label>
          <input className="input-field" value={route} onChange={(e) => setRoute(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium">New Ticket (PDF/image — OCR auto-fill)</label>
          <input type="file" accept=".pdf,image/*" className="input-field" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium">Note</label>
          <textarea rows={2} className="input-field" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={loading} className="btn-primary text-sm">{loading ? 'Saving…' : 'Save Schedule Change'}</button>
        </div>
      </form>
      {booking.scheduleChangeHistory?.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">History</p>
          <ul className="space-y-2 text-xs text-slate-600">
            {booking.scheduleChangeHistory.map((h, i) => (
              <li key={i} className="rounded bg-slate-50 px-3 py-2">
                {h.previousRoute} → {h.newRoute} · {h.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
