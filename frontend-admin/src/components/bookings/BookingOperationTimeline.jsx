import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import MoneyAmount from '../common/MoneyAmount';
import { formatDateTime } from '../../utils/date';

const OPERATION_LABELS = {
  ISSUE: 'Issue',
  REISSUE: 'Reissue',
  VOID: 'Void',
  REFUND: 'Refund',
  CANCEL_REFUND: 'Cancel Refund',
};

const OPERATION_ACCENTS = {
  ISSUE: 'green',
  REISSUE: 'blue',
  VOID: 'red',
  REFUND: 'amber',
  CANCEL_REFUND: 'slate',
};

const OPERATION_STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const OPERATION_STATUS_ACCENTS = {
  draft: 'slate',
  pending: 'amber',
  approved: 'blue',
  completed: 'green',
  cancelled: 'red',
};

export default function BookingOperationTimeline({ operations = [], loading = false }) {
  if (loading) {
    return <p className="text-sm text-slate-500">Loading ticket operations…</p>;
  }

  if (!operations.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No ticket operations recorded yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {operations.map((op) => (
        <li
          key={op.id}
          className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={OPERATION_ACCENTS[op.operationType] || 'slate'}
                label={OPERATION_LABELS[op.operationType] || op.operationType}
              />
              {op.status && op.status !== 'completed' && (
                <StatusBadge
                  status={OPERATION_STATUS_ACCENTS[op.status] || 'slate'}
                  label={OPERATION_STATUS_LABELS[op.status] || op.status}
                />
              )}
              {op.operationNumber && op.operationNumber !== '—' && (
                <span className="font-mono text-xs text-slate-600">{op.operationNumber}</span>
              )}
              {op.legacy && (
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                  Legacy
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">{formatDateTime(op.operationDate || op.createdAt)}</span>
          </div>

          {(op.oldTicketNumber || op.newTicketNumber) && (
            <p className="mt-2 text-sm text-slate-700">
              {op.oldTicketNumber && <>From <span className="font-mono">{op.oldTicketNumber}</span></>}
              {op.oldTicketNumber && op.newTicketNumber && ' → '}
              {op.newTicketNumber && <>To <span className="font-mono">{op.newTicketNumber}</span></>}
            </p>
          )}

          <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
            {(op.saleAdjustmentBRL > 0 || op.supplierAdjustmentBRL > 0) && (
              <>
                {op.saleAdjustmentBRL > 0 && (
                  <span>Sale adj. R$ {Number(op.saleAdjustmentBRL).toFixed(2)}</span>
                )}
                {op.supplierAdjustmentBRL > 0 && (
                  <span>Supplier adj. R$ {Number(op.supplierAdjustmentBRL).toFixed(2)}</span>
                )}
              </>
            )}
            {op.refundAmountBRL > 0 && (
              <span className="text-amber-700">
                Refund R$ {Number(op.refundAmountBRL).toFixed(2)}
              </span>
            )}
            {(op.penaltyBRL > 0 || op.serviceChargeBRL > 0) && (
              <span>
                {op.penaltyBRL > 0 && `Penalty R$ ${Number(op.penaltyBRL).toFixed(2)}`}
                {op.penaltyBRL > 0 && op.serviceChargeBRL > 0 && ' · '}
                {op.serviceChargeBRL > 0 && `Fee R$ ${Number(op.serviceChargeBRL).toFixed(2)}`}
              </span>
            )}
          </div>

          {op.exchangeRateBrlToBdt > 0 && (op.receivedAdjustmentBRL > 0 || op.payableAdjustmentBRL > 0) && (
            <div className="mt-2 flex flex-wrap gap-4 text-xs">
              {op.receivedAdjustmentBRL > 0 && (
                <span>
                  Received{' '}
                  <MoneyAmount
                    totalBRL={op.receivedAdjustmentBRL}
                    totalBDT={op.receivedAdjustmentBRL * op.exchangeRateBrlToBdt}
                    size="sm"
                  />
                </span>
              )}
              {op.payableAdjustmentBRL > 0 && (
                <span>
                  Payable{' '}
                  <MoneyAmount
                    totalBRL={op.payableAdjustmentBRL}
                    totalBDT={op.payableAdjustmentBRL * op.exchangeRateBrlToBdt}
                    size="sm"
                  />
                </span>
              )}
            </div>
          )}

          {op.remarks && <p className="mt-2 text-xs text-slate-500">{op.remarks}</p>}

          {op.legacyChildBooking && (
            <p className="mt-2 text-xs">
              Linked booking{' '}
              <Link to={`/bookings/${op.legacyChildBooking}`} className="font-medium text-brand-600 hover:underline">
                {op.legacyChildBookingNumber || op.legacyChildBooking}
              </Link>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
