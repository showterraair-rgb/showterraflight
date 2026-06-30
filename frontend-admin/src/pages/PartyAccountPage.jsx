import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { customersApi, suppliersApi } from '../services/crm.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MoneyAmount from '../components/common/MoneyAmount';
import ReminderChannelButtons from '../components/common/ReminderChannelButtons';
import { formatDate } from '../utils/date';
import { usePermission } from '../hooks/usePermission';

function PartyAccountPage({ party }) {
  const { id } = useParams();
  const { can } = usePermission();
  const isCustomer = party === 'customer';
  const api = isCustomer ? customersApi : suppliersApi;
  const listPath = isCustomer ? '/customers' : '/suppliers';
  const recordPaymentPath = isCustomer ? '/payments/customers' : '/payments/suppliers';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await api.getAccount(id);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load account');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => { load(); }, [load]);

  const sendReminder = (bookingId) => (channels) => api.remindBooking(id, bookingId, { channels });

  if (loading) return <LoadingSpinner className="py-20" />;
  if (error) {
    return (
      <div className="space-y-4">
        <Link to={listPath} className="text-sm text-brand-600 hover:underline">← Back</Link>
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  const profile = isCustomer ? data.customer : data.supplier;
  const totalLabel = isCustomer ? 'Total due' : 'Total payable';
  const totalAmount = isCustomer ? profile.totalDue : profile.totalPayable;
  const paidTotal = profile.totalPaid || 0;
  const salesTotal = isCustomer ? profile.totalSales : null;

  return (
    <div className="space-y-6">
      <div>
        <Link to={listPath} className="text-sm text-brand-600 hover:underline">← {isCustomer ? 'Customers' : 'Suppliers'}</Link>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          {isCustomer ? 'Customer Account' : 'Supplier Account'}
        </h2>
        <p className="text-sm text-slate-500">Booking-wise paid and due amounts</p>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{profile.name || profile.company}</h3>
            {profile.company && profile.name && profile.company !== profile.name && (
              <p className="text-sm text-slate-500">{profile.company}</p>
            )}
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Phone</dt><dd>{profile.phone || '—'}</dd></div>
              <div><dt className="text-slate-500">WhatsApp</dt><dd>{profile.whatsapp || '—'}</dd></div>
              <div><dt className="text-slate-500">Email</dt><dd>{profile.email || '—'}</dd></div>
            </dl>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 text-right">
            {salesTotal != null && (
              <div>
                <p className="text-xs uppercase text-slate-500">Total sales</p>
                <MoneyAmount amount={salesTotal} size="md" className="mt-1" />
              </div>
            )}
            <div>
              <p className="text-xs uppercase text-slate-500">Total paid</p>
              <MoneyAmount amount={paidTotal} size="md" className="mt-1 text-green-700" />
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">{totalLabel}</p>
              <MoneyAmount amount={totalAmount} size="md" className={`mt-1 ${totalAmount > 0 ? 'text-red-600' : ''}`} />
            </div>
          </div>
        </div>
        {can(isCustomer ? 'payments:customer' : 'payments:supplier') && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Link to={recordPaymentPath} className="btn-primary text-sm">Record payment</Link>
          </div>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="font-semibold text-slate-900">Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Booking ref</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Departure</th>
                {isCustomer ? (
                  <th className="px-4 py-3">Sale</th>
                ) : (
                  <th className="px-4 py-3">Purchase</th>
                )}
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Due date</th>
                <th className="px-4 py-3">Remind</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">No bookings found</td>
                </tr>
              ) : (
                data.bookings.map((row) => {
                  const total = isCustomer ? row.salePrice : row.purchaseTotal;
                  const hasDue = (row.due || 0) > 0;
                  return (
                    <tr key={row.bookingId} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <Link to={`/bookings/${row.bookingId}`} className="font-mono text-xs font-medium text-brand-600 hover:underline">
                          {row.bookingNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.route || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{row.departureDate ? formatDate(row.departureDate) : '—'}</td>
                      <td className="px-4 py-3"><MoneyAmount amount={total} size="sm" /></td>
                      <td className="px-4 py-3"><MoneyAmount amount={row.amountPaid} size="sm" className="text-green-700" /></td>
                      <td className="px-4 py-3">
                        <MoneyAmount amount={row.due} size="sm" className={hasDue ? 'text-red-600 font-medium' : ''} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.duePaymentAt ? formatDate(row.duePaymentAt) : '—'}</td>
                      <td className="px-4 py-3">
                        <ReminderChannelButtons
                          onSend={sendReminder(row.bookingId)}
                          channelAvailability={{
                            sms: Boolean(data.customer?.phone),
                            email: Boolean(data.customer?.email),
                            whatsapp: Boolean(data.customer?.phone || data.customer?.whatsapp),
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function CustomerAccountPage() {
  return <PartyAccountPage party="customer" />;
}

export function SupplierAccountPage() {
  return <PartyAccountPage party="supplier" />;
}

export default PartyAccountPage;
