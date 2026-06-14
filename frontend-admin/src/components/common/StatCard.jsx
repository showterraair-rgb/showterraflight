export default function StatCard({ label, value, subtext, accent = 'blue' }) {
  const accents = {
    blue: 'border-l-brand-600',
    green: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    red: 'border-l-red-500',
    slate: 'border-l-slate-400',
  };

  return (
    <div className={`card border-l-4 ${accents[accent] || accents.blue}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
}
