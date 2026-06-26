import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../services/crm.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, formatDateTime } from '../utils/date';
import MoneyAmount from '../components/common/MoneyAmount';

const ALERT_STYLES = {
  green: 'border-green-200 bg-green-50',
  yellow: 'border-amber-200 bg-amber-50',
  red: 'border-red-200 bg-red-50',
};

function dueAlert(row) {
  if (!row.customerDue || row.customerDue <= 0) return 'green';
  if (!row.duePaymentAt) return 'yellow';
  const due = new Date(row.duePaymentAt);
  if (due < new Date()) return 'red';
  const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  if (due < threeDays) return 'yellow';
  return 'green';
}

export default function UpcomingFlightsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi.upcoming({ limit: 100 })
      .then(({ data }) => setItems(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Upcoming Flights</h2>
        <p className="text-sm text-slate-500">Sorted by nearest departure date</p>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Departure</th>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">PNR</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Payment Due</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const color = dueAlert(row);
              return (
                <tr key={row.id} className={`border-b border-slate-100 ${ALERT_STYLES[color]}`}>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.departureDate)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/bookings/${row.id}`} className="font-mono text-brand-600 hover:underline">{row.bookingNumber}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{row.customerName}</div>
                    <div className="text-xs text-slate-500">{row.customerPhone} · {row.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3">{row.airline} — {row.route}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.pnr || '—'}</td>
                  <td className="px-4 py-3">
                    {row.customerDue > 0 ? <MoneyAmount amount={row.customerDue} size="sm" /> : 'Paid'}
                  </td>
                  <td className="px-4 py-3 text-xs">{row.duePaymentAt ? formatDateTime(row.duePaymentAt) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!items.length && <p className="p-8 text-center text-sm text-slate-500">No upcoming flights</p>}
      </div>
    </div>
  );
}
