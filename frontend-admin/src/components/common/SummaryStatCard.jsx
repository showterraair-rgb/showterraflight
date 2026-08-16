import MoneyAmount from './MoneyAmount';
import { C, fontMono, fontSans } from '../../theme/tokens';

const COLOR_MAP = {
  green: C.green,
  red: C.red,
  blue: C.blue,
  amber: C.amber,
  teal: C.teal,
  slate: C.muted,
  indigo: C.indigo,
  violet: C.violet,
};

export default function SummaryStatCard({ label, amount, count, color = 'slate', subtitle }) {
  const accent = COLOR_MAP[color] || C.muted;

  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 120,
        padding: '12px 16px',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        borderTop: `3px solid ${accent}`,
      }}
    >
      <p
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: C.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          ...fontSans,
        }}
      >
        {label}
      </p>
      {amount != null && (
        <div className="mt-1">
          <MoneyAmount amount={amount} size="lg" />
        </div>
      )}
      {count != null && amount == null && (
        <p style={{ marginTop: 4, fontSize: 22, fontWeight: 700, color: accent, ...fontMono }}>
          {count.toLocaleString()}
        </p>
      )}
      {count != null && amount != null && (
        <p style={{ marginTop: 2, fontSize: 11, color: C.subtle, ...fontSans }}>
          {count.toLocaleString()} bookings
        </p>
      )}
      {subtitle && (
        <p style={{ marginTop: 4, fontSize: 11, color: C.subtle, ...fontSans }}>{subtitle}</p>
      )}
    </div>
  );
}
