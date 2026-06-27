export default function StatCard({ label, value, subtext, accent = 'blue' }) {
  const accents = {
    blue: 'border-l-brand-600',
    green: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    red: 'border-l-red-500',
    slate: 'border-l-slate-400 dark:border-l-slate-500',
  };

  return (
    <div className={`card border-l-4 ${accents[accent] || accents.blue}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-2 text-2xl font-bold tabular-nums text-primary">{value}</div>
      {subtext && <p className="mt-1 text-xs text-muted">{subtext}</p>}
    </div>
  );
}
