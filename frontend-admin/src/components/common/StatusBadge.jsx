import { STATUS_COLORS } from '../../utils/constants';

export default function StatusBadge({ status, label }) {
  const text = label || status?.replace(/_/g, ' ');
  const color = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${color}`}>
      {text}
    </span>
  );
}
