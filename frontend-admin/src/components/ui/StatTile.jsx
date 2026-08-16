import { C, fontMono, fontSans } from '../../theme/tokens';

export default function StatTile({
  label,
  value,
  currency,
  icon,
  color = C.teal,
  sub,
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-[10px]"
      style={{ background: C.indigo, boxShadow: '0 2px 8px rgba(20,33,61,0.18)' }}
    >
      <div className="px-3.5 py-1.5" style={{ background: color }}>
        <span
          className="text-[10px] font-bold uppercase tracking-wider text-white"
          style={fontSans}
        >
          {label}
        </span>
      </div>
      <div className="flex min-h-[60px] items-end justify-between px-4 py-3">
        <div>
          {currency && (
            <div className="mb-0.5 text-[10px]" style={{ color: '#8FA3BF', ...fontMono }}>{currency}</div>
          )}
          <div
            className="text-[22px] font-bold leading-tight tracking-tight text-white"
            style={fontMono}
          >
            {value}
          </div>
          {sub && (
            <div className="mt-1 text-[10px]" style={{ color: '#8FA3BF', ...fontSans }}>{sub}</div>
          )}
        </div>
        {icon && <div style={{ color, opacity: 0.75 }}>{icon}</div>}
      </div>
    </div>
  );
}
