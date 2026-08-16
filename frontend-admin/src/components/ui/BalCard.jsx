import { C, fontMono, fontSans } from '../../theme/tokens';

export default function BalCard({ name, icon, currency, amount, accentColor, sub }) {
  return (
    <div
      className="flex flex-col gap-2.5 rounded-[10px] border p-4"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-[34px] w-[34px] items-center justify-center rounded-lg"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {icon}
        </div>
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: C.subtle, ...fontSans }}
        >
          {sub ?? 'Balance'}
        </span>
      </div>
      <div>
        <div className="mb-1 text-xs font-medium" style={{ color: C.muted, ...fontSans }}>{name}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-xs" style={{ color: C.muted, ...fontMono }}>{currency}</span>
          <span
            className="text-[22px] font-semibold tracking-tight"
            style={{ color: C.indigo, ...fontMono }}
          >
            {amount}
          </span>
        </div>
      </div>
    </div>
  );
}
