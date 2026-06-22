import MoneyAmount from './MoneyAmount';

export default function SummaryStatCard({ label, amount, count, color = 'slate', subtitle }) {
  const colors = {
    green: 'border-emerald-500 bg-emerald-50 text-emerald-900',
    red: 'border-red-500 bg-red-50 text-red-900',
    blue: 'border-blue-500 bg-blue-50 text-blue-900',
    amber: 'border-amber-500 bg-amber-50 text-amber-900',
    teal: 'border-teal-500 bg-teal-50 text-teal-900',
    slate: 'border-slate-400 bg-slate-50 text-slate-900',
    indigo: 'border-indigo-500 bg-indigo-50 text-indigo-900',
  };

  return (
    <div className={`rounded-lg border-l-4 p-4 ${colors[color] || colors.slate}`}>
      <p className="text-xs font-semibold uppercase opacity-80">{label}</p>
      {amount != null && (
        <div className="mt-1">
          <MoneyAmount amount={amount} size="lg" />
        </div>
      )}
      {count != null && (
        <p className="mt-1 text-lg font-bold">{count.toLocaleString()}</p>
      )}
      {subtitle && <p className="mt-1 text-xs opacity-75">{subtitle}</p>}
    </div>
  );
}
