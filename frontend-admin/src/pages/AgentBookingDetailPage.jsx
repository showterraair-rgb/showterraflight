import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { agentBookingsApi } from '../services/agents.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import DualCurrencyAmount, { getBookingAmounts } from '../components/common/DualCurrencyAmount';
import { usePermission } from '../hooks/usePermission';

const STATUSES = ['pending', 'processing', 'confirmed', 'cancelled', 'reissued', 'refunded'];

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

  const amounts = getBookingAmounts(booking);
  const count = booking.passengerCount || booking.passengers?.length || 1;
  const rate = amounts.bdtRate;
  const baseTotalBRL = amounts.baseFareBRL * count;
  const taxTotalBRL = amounts.taxBRL * count;

  return (
    <div className="space-y-6">
      <Link to="/agent-bookings" className="text-sm text-brand-600">← Agent bookings</Link>
      <div className="card">
        <h2 className="font-mono text-xl font-bold">{booking.bookingRef}</h2>
        <p className="text-sm text-slate-500">{booking.agentCompany} · {booking.route}</p>
        <StatusBadge status={booking.status} label={booking.status} />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
          <p>Airline: {booking.airline} {booking.flightNumber}</p>
          <div>
            <span className="text-slate-500">Total: </span>
            <DualCurrencyAmount totalBRL={amounts.totalBRL} totalBDT={amounts.totalBDT} size="md" className="inline-flex" />
          </div>
          <p>PNR: {booking.pnr || '—'}</p>
          <p>Passengers: {booking.passengerCount}</p>
        </div>
        {booking.ticketUrl && <a href={booking.ticketUrl} target="_blank" rel="noreferrer" className="btn-primary mt-4 inline-block">Download ticket</a>}
      </div>

      <div className="card overflow-x-auto">
        <h3 className="mb-3 font-semibold">Price Breakdown</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-2 pr-4">Item</th>
              <th className="pb-2 pr-4">BRL (R$)</th>
              <th className="pb-2">BDT (৳)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Base Fare</td>
              <td className="py-2 pr-4">R$ {fmt(baseTotalBRL)}</td>
              <td className="py-2">৳ {fmt(baseTotalBRL * rate)}</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Tax</td>
              <td className="py-2 pr-4">R$ {fmt(taxTotalBRL)}</td>
              <td className="py-2">৳ {fmt(taxTotalBRL * rate)}</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Agent Markup</td>
              <td className="py-2 pr-4">R$ {fmt(amounts.markupBRL)}</td>
              <td className="py-2">৳ {fmt(amounts.markupBRL * rate)}</td>
            </tr>
            <tr className="font-semibold">
              <td className="py-2 pr-4">TOTAL</td>
              <td className="py-2 pr-4">R$ {fmt(amounts.totalBRL)}</td>
              <td className="py-2">৳ {fmt(amounts.totalBDT)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate-500">Rate at booking: 1 BRL = ৳ {fmt(rate)}</p>
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
