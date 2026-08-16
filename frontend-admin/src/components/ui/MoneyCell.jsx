import { C, fontMono } from '../../theme/tokens';

export default function MoneyCell({ brl, bdt, positive, negative }) {
  const color = positive ? C.green : negative ? C.red : C.indigo;
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ ...fontMono, fontSize: 12, fontWeight: 600, color }}>{brl}</div>
      {bdt != null && bdt !== '' && (
        <div style={{ ...fontMono, fontSize: 10, color: C.muted, marginTop: 1 }}>{bdt}</div>
      )}
    </div>
  );
}
