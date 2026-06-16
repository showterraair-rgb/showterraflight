export default function StatusBadge({ status, label }) {
  const colors = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-sky-100 text-sky-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-700',
    reissued: 'bg-purple-100 text-purple-800',
    refunded: 'bg-slate-200 text-slate-700',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
      {label || status}
    </span>
  );
}
