import { useEffect, useState } from 'react';
import { APPROVAL_STATUSES, APPROVAL_STATUS_LABELS } from '../../utils/constants';
import StatusBadge from '../common/StatusBadge';

const STEP_ORDER = APPROVAL_STATUSES;

export function ApprovalStepper({ currentStatus }) {
  const idx = STEP_ORDER.indexOf(currentStatus || 'pending');

  return (
    <ol className="flex flex-wrap items-center gap-1 sm:gap-2">
      {STEP_ORDER.map((step, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <li key={step} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && <span className="text-slate-300">→</span>}
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                active
                  ? 'bg-brand-600 text-white'
                  : done
                    ? 'bg-green-100 text-green-800'
                    : 'bg-slate-100 text-slate-500'
              }`}
            >
              {APPROVAL_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function ApprovalControls({ approvalStatus, onUpdate, disabled }) {
  const [status, setStatus] = useState(approvalStatus || 'pending');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(approvalStatus || 'pending');
  }, [approvalStatus]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({ approvalStatus: status, note: note || undefined });
      setNote('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <ApprovalStepper currentStatus={approvalStatus} />
      {!disabled && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Set approval stage</label>
            <select className="input-field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
              {APPROVAL_STATUSES.map((s) => (
                <option key={s} value={s}>{APPROVAL_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500">Note (optional)</label>
            <input className="input-field" placeholder="Internal note for this step" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : 'Update & SMS Customer'}
          </button>
        </div>
      )}
      {approvalStatus && (
        <StatusBadge status={approvalStatus} label={APPROVAL_STATUS_LABELS[approvalStatus]} />
      )}
    </div>
  );
}

export default ApprovalControls;
