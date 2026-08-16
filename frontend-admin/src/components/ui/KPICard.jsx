import { C, fontMono, fontSans } from '../../theme/tokens';

export default function KPICard({
  label,
  value,
  currency,
  sub,
  delta,
  deltaUp,
  accentColor,
  size = 'md',
}) {
  const numSize = size === 'lg' ? 30 : size === 'sm' ? 20 : 24;
  return (
    <div
      className="flex overflow-hidden rounded-[10px] border"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <div className="w-1 shrink-0" style={{ background: accentColor }} />
      <div className="min-w-0 flex-1" style={{ padding: size === 'lg' ? '20px' : '14px 16px' }}>
        <div
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: C.muted, ...fontSans }}
        >
          {label}
        </div>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-1">
          {currency && (
            <span className="text-[11px]" style={{ color: C.muted, ...fontMono }}>{currency}</span>
          )}
          <span
            className="font-semibold leading-tight tracking-tight"
            style={{ fontSize: numSize, color: C.indigo, ...fontMono }}
          >
            {value}
          </span>
        </div>
        {(delta || sub) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {delta && (
              <span
                className="rounded px-1.5 py-px text-[10px] font-medium"
                style={{
                  color: deltaUp ? C.green : C.red,
                  background: deltaUp ? C.greenLight : C.redLight,
                  ...fontSans,
                }}
              >
                {deltaUp ? '▲' : '▼'} {delta}
              </span>
            )}
            {sub && <span className="text-[10px]" style={{ color: C.subtle, ...fontSans }}>{sub}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
