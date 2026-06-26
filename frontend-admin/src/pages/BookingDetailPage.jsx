import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bookingsApi } from '../services/crm.api';
import { paymentsApi } from '../services/finance.api';
import { startOnlinePayment } from '../utils/gatewayPay';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { usePermission } from '../hooks/usePermission';
import { formatDate, formatDateTime } from '../utils/date';
import MoneyAmount from '../components/common/MoneyAmount';
import { downloadBlob } from '../utils/download';
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS, JOURNEY_LABELS, CLASS_LABELS, APPROVAL_STATUS_LABELS } from '../utils/constants';
import ApprovalControls from '../components/bookings/ApprovalPanel';
import PassportUpload from '../components/bookings/PassportUpload';
import BookingRrvPanel from '../components/bookings/BookingRrvPanel';
import ScheduleChangePanel from '../components/bookings/ScheduleChangePanel';
import { useFieldPermission } from '../hooks/useFieldPermission';

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermission();
  const financeFields = useFieldPermission('finance');
  const [booking, setBooking] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [note, setNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [voucherOpen, setVoucherOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, tRes, cpRes, spRes] = await Promise.all([
        bookingsApi.get(id),
        bookingsApi.getTimeline(id),
        paymentsApi.listCustomer({ bookingId: id, limit: 10 }).catch(() => ({ data: { data: [] } })),
        paymentsApi.listSupplier({ bookingId: id, limit: 10 }).catch(() => ({ data: { data: [] } })),
      ]);
      setBooking(bRes.data.data);
      setTimeline(tRes.data.data);
      setNewStatus(bRes.data.data.status);
      setCustomerPayments(cpRes.data.data || []);
      setSupplierPayments(spRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async () => {
    try {
      await bookingsApi.updateStatus(id, { status: newStatus });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await bookingsApi.addNote(id, { note });
      setNote('');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add note');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const { data } = await bookingsApi.downloadInvoicePdf(id);
      downloadBlob(data, `${booking?.bookingNumber || 'booking'}-invoice.pdf`);
    } catch (err) {
      alert(err.response?.data?.message || 'PDF download failed');
    }
  };

  const handleDownloadETicket = async () => {
    try {
      const { data } = await bookingsApi.downloadETicketPdf(id);
      downloadBlob(data, `${booking?.bookingNumber || 'booking'}-e-ticket.pdf`);
    } catch (err) {
      alert(err.response?.data?.message || 'E-Ticket download failed');
    }
  };

  const handlePayOnline = async () => {
    try {
      await startOnlinePayment({
        customerId: booking.customer,
        bookingId: booking.id,
        amount: booking.customerDue,
      });
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Could not start online payment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete booking ${booking?.bookingNumber}? This cannot be undone if no payments are linked.`)) return;
    try {
      const { data } = await bookingsApi.delete(id);
      alert(data.message || 'Booking deleted');
      navigate('/bookings');
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!booking) return <p>Booking not found</p>;

  const p = booking.pricing || {};
  const rate = p.bdtRateAtBooking ?? booking.bdtRateAtBooking ?? booking.exchangeRateAtBooking;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/bookings" className="text-sm text-brand-600 hover:underline">← Back to Bookings</Link>
          <h2 className="mt-2 text-xl font-bold text-slate-900">{booking.bookingNumber}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusBadge status={booking.status} label={BOOKING_STATUS_LABELS[booking.status]} />
            <StatusBadge status={booking.approvalStatus || 'pending'} label={APPROVAL_STATUS_LABELS[booking.approvalStatus || 'pending']} />
            {booking.orderNumber && (
              <span className="text-sm text-slate-500">Order: {booking.orderNumber}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <button type="button" onClick={() => setVoucherOpen((o) => !o)} className="btn-primary text-sm">
              Voucher / Invoice ▾
            </button>
            {voucherOpen && (
              <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button type="button" className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { handleDownloadPdf(); setVoucherOpen(false); }}>
                  Customer Invoice (PDF)
                </button>
                <button type="button" className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { handleDownloadETicket(); setVoucherOpen(false); }}>
                  E-Ticket (PDF)
                </button>
                {booking.ticketCopyUrl && (
                  <a href={booking.ticketCopyUrl} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm hover:bg-slate-50" onClick={() => setVoucherOpen(false)}>
                    Uploaded Ticket Copy
                  </a>
                )}
              </div>
            )}
          </div>
          {can('payments:customer') && booking.customerDue > 0 && (
            <>
              <button type="button" onClick={handlePayOnline} className="btn-secondary text-sm">Pay Online</button>
              <Link to={`/payments/customers?bookingId=${id}`} className="btn-secondary text-sm">Record Payment</Link>
            </>
          )}
          {can('bookings:update') && (
            <Link to={`/bookings/${id}/edit`} className="btn-primary text-sm">Edit Booking</Link>
          )}
          {can('bookings:delete') && (
            <button type="button" onClick={handleDelete} className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              Delete
            </button>
          )}
        </div>
      </div>

      {!financeFields.hidden && (
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card border-l-4 border-l-green-500">
          <p className="text-xs font-medium uppercase text-slate-500">Profit</p>
          <MoneyAmount
            totalBRL={p.profitBRL ?? booking.computed?.profitBRL}
            totalBDT={p.profitBDT ?? booking.computed?.profit ?? booking.profit}
            size="lg"
            className="mt-2 text-green-700"
          />
        </div>
        <div className="card border-l-4 border-l-red-500">
          <p className="text-xs font-medium uppercase text-slate-500">Customer Due</p>
          <MoneyAmount
            totalBRL={p.customerDueBRL ?? booking.computed?.customerDueBRL}
            totalBDT={p.customerDueBDT ?? booking.computed?.customerDue ?? booking.customerDue}
            size="lg"
            className="mt-2"
          />
        </div>
        <div className="card border-l-4 border-l-amber-500">
          <p className="text-xs font-medium uppercase text-slate-500">Supplier Payable</p>
          <MoneyAmount
            totalBRL={p.supplierPayableBRL ?? booking.computed?.supplierPayableBRL}
            totalBDT={p.supplierPayableBDT ?? booking.computed?.supplierPayable ?? booking.supplierPayable}
            size="lg"
            className="mt-2"
          />
        </div>
      </div>
      )}

      <BookingRrvPanel booking={booking} onDone={load} />

      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-900">Approval workflow</h3>
        <ApprovalControls
          approvalStatus={booking.approvalStatus}
          disabled={!can('bookings:update')}
          onUpdate={async (payload) => {
            await bookingsApi.updateApproval(id, payload);
            load();
          }}
        />
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold text-slate-900">Passport copy</h3>
        <PassportUpload
          record={booking}
          disabled={!can('bookings:update')}
          onUpload={async (file) => {
            await bookingsApi.uploadPassport(id, file);
            load();
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-3">
          <h3 className="font-semibold text-slate-900">Travel Details</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">Customer</dt><dd>{booking.customerName} ({booking.customerPhone})</dd>
            <dt className="text-slate-500">Supplier</dt><dd>{booking.supplierName || '—'}</dd>
            <dt className="text-slate-500">Journey</dt><dd>{JOURNEY_LABELS[booking.journeyType] || booking.journeyType || '—'}</dd>
            <dt className="text-slate-500">Class</dt><dd>{CLASS_LABELS[booking.travelClass] || booking.travelClass || '—'}</dd>
            <dt className="text-slate-500">From</dt><dd>{booking.fromDestination || '—'}</dd>
            <dt className="text-slate-500">To</dt><dd>{booking.toDestination || '—'}</dd>
            <dt className="text-slate-500">Airline</dt><dd>{booking.airline}</dd>
            <dt className="text-slate-500">Route</dt><dd>{booking.route}</dd>
            <dt className="text-slate-500">Departure</dt><dd>{formatDate(booking.departureDate)}</dd>
            {booking.returnDate && (
              <>
                <dt className="text-slate-500">Return</dt><dd>{formatDate(booking.returnDate)}</dd>
              </>
            )}
            <dt className="text-slate-500">PNR</dt><dd>{booking.pnr || '—'}</dd>
            <dt className="text-slate-500">Ticket #</dt><dd>{booking.ticketNumber || '—'}</dd>
            <dt className="text-slate-500">Passengers</dt><dd>{booking.passengerCount}</dd>
          </dl>
          {booking.passengers?.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">E-Ticket</th>
                    <th className="py-2">Baggage</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.passengers.map((p, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 pr-3">{p.title} {p.fullName}</td>
                      <td className="py-2 pr-3">{p.passengerType}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{p.eTicketNumber || '—'}</td>
                      <td className="py-2">{p.checkInBaggage} / {p.cabinBaggage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {booking.flightSegment && (
            <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-sm">
              {booking.flightSegment.flightNumber && <><dt className="text-slate-500">Flight</dt><dd>{booking.flightSegment.flightNumber}</dd></>}
              {booking.flightSegment.departureTime && <><dt className="text-slate-500">Dep. Time</dt><dd>{booking.flightSegment.departureTime}</dd></>}
              {booking.flightSegment.arrivalTime && <><dt className="text-slate-500">Arr. Time</dt><dd>{booking.flightSegment.arrivalTime}</dd></>}
              {booking.flightSegment.duration && <><dt className="text-slate-500">Duration</dt><dd>{booking.flightSegment.duration}</dd></>}
            </dl>
          )}
        </div>

        <div className="card space-y-3">
          <h3 className="font-semibold text-slate-900">Financial Summary</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">Purchase Price</dt>
            <dd><MoneyAmount totalBRL={p.purchasePriceBRL} totalBDT={p.purchasePriceBDT ?? booking.purchasePrice} size="sm" /></dd>
            <dt className="text-slate-500">Sale Price</dt>
            <dd><MoneyAmount totalBRL={p.salePriceBRL} totalBDT={p.salePriceBDT ?? booking.salePrice} size="sm" /></dd>
            <dt className="text-slate-500">Direct Costs</dt>
            <dd><MoneyAmount totalBRL={p.directCostsBRL} totalBDT={p.directCostsBDT ?? booking.directCosts} size="sm" /></dd>
            <dt className="text-slate-500">Amount Paid</dt>
            <dd><MoneyAmount amount={booking.amountPaid} size="sm" /></dd>
            <dt className="text-slate-500">Supplier Paid</dt>
            <dd><MoneyAmount amount={booking.supplierPaid} size="sm" /></dd>
            <dt className="text-slate-500">Payment Status</dt><dd className="capitalize">{booking.paymentStatus}</dd>
            {booking.duePaymentAt && (
              <>
                <dt className="text-slate-500">Due Payment</dt>
                <dd>{formatDateTime(booking.duePaymentAt)}</dd>
              </>
            )}
            <dt className="text-slate-500">Supplier Payment</dt><dd className="capitalize">{booking.supplierPaymentStatus}</dd>
          </dl>
          {booking.fareTotals && (
            <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-sm">
              <dt className="text-slate-500">Sale (BDT/USD/BRL)</dt>
              <dd>৳ {Number(booking.fareTotals.sale?.bdt || 0).toLocaleString()} / ${Number(booking.fareTotals.sale?.usd || 0).toFixed(2)} / R$ {Number(booking.fareTotals.sale?.brl || 0).toFixed(2)}</dd>
              <dt className="text-slate-500">Full Due</dt>
              <dd>৳ {Number(booking.fareTotals.fullDue?.bdt || booking.customerDue || 0).toLocaleString()}</dd>
              <dt className="text-slate-500">Balance</dt>
              <dd>৳ {Number(booking.fareTotals.balance?.bdt || booking.customerDue || 0).toLocaleString()}</dd>
            </dl>
          )}
          {rate && (
            <p className="text-xs text-slate-500">Rate at booking: 1 BRL = ৳ {Number(rate).toFixed(2)}</p>
          )}
          {booking.ticketCopyUrl && (
            <a
              href={booking.ticketCopyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm font-medium text-brand-600 hover:underline"
            >
              Download original ticket{booking.ticketCopyFileName ? `: ${booking.ticketCopyFileName}` : ''}
            </a>
          )}
        </div>
      </div>

      {can('payments:customer') && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="mb-3 font-semibold text-slate-900">Customer Payments</h3>
            {customerPayments.length ? (
              <ul className="space-y-2">
                {customerPayments.map((p) => (
                  <li key={p.id} className="flex justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">
                    <span>{p.paymentNumber} — {formatDate(p.paymentDate)}</span>
                    <MoneyAmount amount={p.amount} size="sm" className="font-medium text-green-700" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No customer payments linked to this booking.</p>
            )}
          </div>
          <div className="card">
            <h3 className="mb-3 font-semibold text-slate-900">Supplier Payments</h3>
            {supplierPayments.length ? (
              <ul className="space-y-2">
                {supplierPayments.map((p) => (
                  <li key={p.id} className="flex justify-between rounded-lg bg-red-50 px-3 py-2 text-sm">
                    <span>{p.paymentNumber} — {formatDate(p.paymentDate)}</span>
                    <MoneyAmount amount={p.amount} size="sm" className="font-medium text-red-600" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No supplier payments linked to this booking.</p>
            )}
          </div>
        </div>
      )}

      {can('bookings:update') && booking.productCategory === 'air' && (
        <ScheduleChangePanel booking={booking} onDone={load} />
      )}

      {can('bookings:update') && (
        <div className="card">
          <h3 className="mb-3 font-semibold text-slate-900">Update Status</h3>
          <div className="flex flex-wrap gap-3">
            <select className="input-field w-auto" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>)}
            </select>
            <button type="button" onClick={handleStatusUpdate} className="btn-primary">Update Status</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="mb-3 font-semibold text-slate-900">Activity Notes</h3>
        {can('bookings:update') && (
          <div className="mb-4 flex gap-2">
            <input className="input-field flex-1" placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="button" onClick={handleAddNote} className="btn-primary">Add</button>
          </div>
        )}
        <ul className="space-y-2">
          {timeline?.activityNotes?.length ? timeline.activityNotes.map((n, i) => (
            <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <p>{n.note}</p>
              <p className="mt-1 text-xs text-slate-400">{n.createdBy?.name || 'Staff'} — {formatDateTime(n.createdAt)}</p>
            </li>
          )) : <p className="text-sm text-slate-500">No notes yet.</p>}
        </ul>
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold text-slate-900">Approval Timeline</h3>
        <ul className="space-y-2">
          {timeline?.approvalTimeline?.length ? timeline.approvalTimeline.map((t, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3 text-sm">
              <StatusBadge status={t.status} label={APPROVAL_STATUS_LABELS[t.status] || t.status} />
              <span className="text-slate-500">{formatDateTime(t.changedAt)}</span>
              {t.note && <span className="text-slate-600">— {t.note}</span>}
            </li>
          )) : <p className="text-sm text-slate-500">No approval steps yet.</p>}
        </ul>
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold text-slate-900">Status Timeline</h3>
        <ul className="space-y-2">
          {timeline?.timeline?.map((t, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <StatusBadge status={t.status} label={BOOKING_STATUS_LABELS[t.status]} />
              <span className="text-slate-500">{formatDateTime(t.changedAt)}</span>
              {t.note && <span className="text-slate-600">— {t.note}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
