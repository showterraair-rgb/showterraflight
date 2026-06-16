import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { agentApi } from '../services/agent.api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { BOOKING_STATUS_LABELS, formatCurrency, formatDate } from '../utils/constants';

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agentApi.getBooking(id).then(({ data }) => setBooking(data.data)).finally(() => setLoading(false));
  }, [id]);

  const cancel = async () => {
    if (!window.confirm('Cancel this booking request?')) return;
    try {
      await agentApi.cancelBooking(id);
      toast('Booking cancelled');
      navigate('/bookings');
    } catch (err) {
      toast(err.response?.data?.message || 'Cancel failed', 'error');
    }
  };

  if (loading) return <LoadingSkeleton rows={8} />;
  if (!booking) return <p>Booking not found</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/bookings" className="text-sm text-brand-600">← Back to bookings</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-mono">{booking.bookingRef}</h1>
          <StatusBadge status={booking.status} label={BOOKING_STATUS_LABELS[booking.status]} />
        </div>
        {['pending', 'processing'].includes(booking.status) && (
          <button type="button" onClick={cancel} className="btn-secondary text-red-600">Cancel Request</button>
        )}
        {booking.ticketUrl && (
          <a href={booking.ticketUrl} target="_blank" rel="noreferrer" className="btn-primary">Download Ticket</a>
        )}
      </div>

      <div className="card grid gap-3 sm:grid-cols-2 text-sm">
        <p><span className="text-slate-500">Route:</span> {booking.route}</p>
        <p><span className="text-slate-500">Airline:</span> {booking.airline} {booking.flightNumber}</p>
        <p><span className="text-slate-500">Departure:</span> {formatDate(booking.departureDate)} {booking.departureTime}</p>
        <p><span className="text-slate-500">PNR:</span> {booking.pnr || '—'}</p>
        <p><span className="text-slate-500">Class:</span> {booking.travelClass}</p>
        <p><span className="text-slate-500">Total:</span> {formatCurrency(booking.totalFare, booking.currency)}</p>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Passengers</h2>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500"><th>Name</th><th>Passport</th><th>Nationality</th></tr></thead>
          <tbody>
            {booking.passengers.map((p, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2">{p.title} {p.firstName} {p.lastName}</td>
                <td className="py-2">{p.passportNumber}</td>
                <td className="py-2">{p.nationality || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {booking.adminNotes && (
        <div className="card"><h2 className="mb-2 font-semibold">Admin notes</h2><p className="text-sm text-slate-700">{booking.adminNotes}</p></div>
      )}

      <div className="card">
        <h2 className="mb-3 font-semibold">Status timeline</h2>
        <ul className="space-y-2 text-sm">
          {(booking.statusTimeline || []).map((t, i) => (
            <li key={i} className="flex gap-3 border-l-2 border-brand-200 pl-3">
              <span className="font-medium capitalize">{t.status}</span>
              <span className="text-slate-500">{t.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
