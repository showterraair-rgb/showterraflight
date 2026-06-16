import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { agentBookingsApi } from '../services/agents.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { usePermission } from '../hooks/usePermission';

const STATUSES = ['pending', 'processing', 'confirmed', 'cancelled', 'reissued', 'refunded'];

export default function AgentBookingDetailPage() {
  const { id } = useParams();
  const { can } = usePermission();
  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    agentBookingsApi.get(id).then(({ data }) => {
      setBooking(data.data);
      setStatus(data.data.status);
      setNote(data.data.adminNotes || '');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async () => {
    await agentBookingsApi.updateStatus(id, { status, adminNotes: note });
    setMsg('Status updated');
    load();
  };

  const uploadTicket = async () => {
    if (!file) return;
    await agentBookingsApi.uploadTicket(id, file);
    setMsg('Ticket uploaded');
    setFile(null);
    load();
  };

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!booking) return <p>Not found</p>;

  return (
    <div className="space-y-6">
      <Link to="/agent-bookings" className="text-sm text-brand-600">← Agent bookings</Link>
      <div className="card">
        <h2 className="font-mono text-xl font-bold">{booking.bookingRef}</h2>
        <p className="text-sm text-slate-500">{booking.agentCompany} · {booking.route}</p>
        <StatusBadge status={booking.status} label={booking.status} />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
          <p>Airline: {booking.airline} {booking.flightNumber}</p>
          <p>Total: {booking.currency} {booking.totalFare?.toLocaleString()}</p>
          <p>PNR: {booking.pnr || '—'}</p>
          <p>Passengers: {booking.passengerCount}</p>
        </div>
        {booking.ticketUrl && <a href={booking.ticketUrl} target="_blank" rel="noreferrer" className="btn-primary mt-4 inline-block">Download ticket</a>}
      </div>

      {can('agent-bookings:manage') && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Admin actions</h3>
          {msg && <p className="text-sm text-green-700">{msg}</p>}
          <select className="input-field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <textarea rows={3} className="input-field" placeholder="Admin notes" value={note} onChange={(e) => setNote(e.target.value)} />
          <button type="button" onClick={updateStatus} className="btn-primary">Update status</button>
          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button type="button" onClick={uploadTicket} disabled={!file} className="btn-secondary">Upload ticket</button>
          </div>
        </div>
      )}
    </div>
  );
}
