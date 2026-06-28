import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import { bookingsApi } from '../../services/crm.api';
import { accountsApi } from '../../services/finance.api';
import { usePermission } from '../../hooks/usePermission';

const TERMINAL = ['voided', 'refunded', 'reissued', 'cancelled'];

export default function BookingRrvPanel({ booking, onDone }) {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [voidOpen, setVoidOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [reissueOpen, setReissueOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [voidForm, setVoidForm] = useState({ reason: '', voidPayments: false });
  const [refundForm, setRefundForm] = useState({ reason: '', penalty: 0, refundAmount: '', accountId: '' });
  const [reissueForm, setReissueForm] = useState({
    reason: '',
    departureDate: booking.departureDate?.slice?.(0, 10) || '',
    pnr: '',
    salePrice: booking.salePrice || 0,
    purchasePrice: booking.purchasePrice || 0,
  });

  const isTerminal = TERMINAL.includes(booking.status);
  const canVoid = !isTerminal && ['draft', 'confirmed'].includes(booking.status) && !booking.ticketCopyUrl;
  const canRefund = !isTerminal && ['ticket_issued', 'delivered', 'completed'].includes(booking.status);
  const canReissue = !isTerminal && ['confirmed', 'ticket_issued', 'delivered', 'completed'].includes(booking.status);
  const refundPending = Boolean(booking.rrvNote && !booking.rrvProcessedAt && canRefund);

  useEffect(() => {
    if (refundOpen) {
      accountsApi.list().then(({ data }) => setAccounts(data.data || []));
    }
  }, [refundOpen]);

  useEffect(() => {
    if (refundOpen) {
      const paid = booking.amountPaid || 0;
      const penalty = Number(refundForm.penalty) || 0;
      setRefundForm((f) => ({ ...f, refundAmount: String(Math.max(0, paid - penalty)) }));
    }
  }, [refundOpen, refundForm.penalty, booking.amountPaid]);

  useEffect(() => {
    if (refundOpen && refundPending) {
      setRefundForm((f) => ({
        ...f,
        reason: booking.rrvNote || f.reason,
        penalty: booking.rrvPenalty ?? f.penalty,
      }));
    }
  }, [refundOpen, refundPending, booking.rrvNote, booking.rrvPenalty]);

  if (!can('bookings:update') || isTerminal) return null;

  const handleVoid = async () => {
    setError('');
    setLoading(true);
    try {
      await bookingsApi.void(booking.id, voidForm);
      setVoidOpen(false);
      onDone?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Void failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundRequest = async () => {
    setError('');
    setLoading(true);
    try {
      await bookingsApi.refundRequest(booking.id, {
        reason: refundForm.reason,
        penalty: Number(refundForm.penalty) || 0,
      });
      setRefundOpen(false);
      onDone?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Refund request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    setError('');
    setLoading(true);
    try {
      const amount = Number(refundForm.refundAmount) || 0;
      await bookingsApi.refund(booking.id, {
        reason: refundForm.reason,
        penalty: Number(refundForm.penalty) || 0,
        refundAmount: amount > 0 ? amount : undefined,
        accountId: amount > 0 ? refundForm.accountId : undefined,
      });
      setRefundOpen(false);
      onDone?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Refund failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReissue = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await bookingsApi.reissue(booking.id, {
        ...reissueForm,
        salePrice: Number(reissueForm.salePrice),
        purchasePrice: Number(reissueForm.purchasePrice),
      });
      setReissueOpen(false);
      const newId = data.data?.newBooking?.id;
      if (newId) navigate(`/bookings/${newId}`);
      else onDone?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Reissue failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card space-y-3">
        <h3 className="font-semibold text-slate-900">Refund / Reissue / Void</h3>
        {booking.parentBooking && (
          <p className="text-sm text-slate-600">
            Reissued from{' '}
            <Link to={`/bookings/${booking.parentBooking}`} className="text-brand-600 hover:underline">
              {booking.parentBookingNumber || booking.parentBooking}
            </Link>
          </p>
        )}
        {booking.rrvNote && (
          <p className={`rounded-lg px-3 py-2 text-sm ${refundPending ? 'bg-amber-50 text-amber-900' : 'bg-slate-50 text-slate-700'}`}>
            {refundPending ? 'Pending refund: ' : ''}{booking.rrvNote}
            {refundPending && booking.rrvPenalty > 0 && ` (penalty ৳${booking.rrvPenalty.toLocaleString()})`}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {canVoid && (
            <button type="button" onClick={() => { setError(''); setVoidOpen(true); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Void
            </button>
          )}
          {canRefund && (
            <button type="button" onClick={() => { setError(''); setRefundOpen(true); }} className={`rounded-lg border px-4 py-2 text-sm font-medium ${refundPending ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100' : 'border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100'}`}>
              {refundPending ? 'Approve refund' : 'Refund'}
            </button>
          )}
          {canReissue && can('bookings:create') && (
            <button type="button" onClick={() => { setError(''); setReissueOpen(true); }} className="rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-100">
              Re-Issue
            </button>
          )}
        </div>
      </div>

      <Modal open={voidOpen} onClose={() => setVoidOpen(false)} title="Void booking"
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setVoidOpen(false)} className="btn-secondary">Cancel</button>
            <button type="button" onClick={handleVoid} disabled={loading} className="btn-primary">Void booking</button>
          </div>
        )}
      >
        <div className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-sm text-slate-600">Void before ticket issue. Cancels the booking without refund settlement.</p>
          <textarea rows={3} className="input-field" placeholder="Reason (optional)" value={voidForm.reason} onChange={(e) => setVoidForm((f) => ({ ...f, reason: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={voidForm.voidPayments} onChange={(e) => setVoidForm((f) => ({ ...f, voidPayments: e.target.checked }))} />
            Also void linked customer/supplier payments
          </label>
        </div>
      </Modal>

      <Modal open={refundOpen} onClose={() => setRefundOpen(false)} title={refundPending ? 'Approve & pay refund' : 'Refund booking'} wide
        footer={(
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setRefundOpen(false)} className="btn-secondary">Cancel</button>
            {!refundPending && (
              <button type="button" onClick={handleRefundRequest} disabled={loading} className="btn-secondary">Submit request only</button>
            )}
            <button type="button" onClick={handleRefund} disabled={loading} className="btn-primary">
              {refundPending ? 'Approve & pay refund' : 'Process refund'}
            </button>
          </div>
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          {refundPending && (
            <p className="sm:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              A refund request is pending. Confirm amounts below, then approve and pay.
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Penalty (৳)</label>
            <input type="number" min="0" className="input-field" value={refundForm.penalty} onChange={(e) => setRefundForm((f) => ({ ...f, penalty: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Refund to customer (৳)</label>
            <input type="number" min="0" className="input-field" value={refundForm.refundAmount} onChange={(e) => setRefundForm((f) => ({ ...f, refundAmount: e.target.value }))} />
            <p className="mt-1 text-xs text-slate-500">Paid: ৳{(booking.amountPaid || 0).toLocaleString()}</p>
          </div>
          {Number(refundForm.refundAmount) > 0 && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Pay from account *</label>
              <select className="input-field" value={refundForm.accountId} onChange={(e) => setRefundForm((f) => ({ ...f, accountId: e.target.value }))}>
                <option value="">Select account</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} (৳{a.currentBalance?.toLocaleString()})</option>)}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Reason</label>
            <textarea rows={2} className="input-field" value={refundForm.reason} onChange={(e) => setRefundForm((f) => ({ ...f, reason: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal open={reissueOpen} onClose={() => setReissueOpen(false)} title="Re-issue booking" wide
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setReissueOpen(false)} className="btn-secondary">Cancel</button>
            <button type="button" onClick={handleReissue} disabled={loading} className="btn-primary">Create reissue</button>
          </div>
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium">New departure date</label>
            <input type="date" className="input-field" value={reissueForm.departureDate} onChange={(e) => setReissueForm((f) => ({ ...f, departureDate: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">New PNR</label>
            <input className="input-field" value={reissueForm.pnr} onChange={(e) => setReissueForm((f) => ({ ...f, pnr: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Customer price (৳)</label>
            <input type="number" min="0" className="input-field" value={reissueForm.salePrice} onChange={(e) => setReissueForm((f) => ({ ...f, salePrice: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Agent / purchase price (৳)</label>
            <input type="number" min="0" className="input-field" value={reissueForm.purchasePrice} onChange={(e) => setReissueForm((f) => ({ ...f, purchasePrice: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Note</label>
            <textarea rows={2} className="input-field" value={reissueForm.reason} onChange={(e) => setReissueForm((f) => ({ ...f, reason: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </>
  );
}
