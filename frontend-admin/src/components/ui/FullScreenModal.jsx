import { X } from 'lucide-react';
import { C, fontSans } from '../../theme/tokens';

export default function FullScreenModal({ open, onClose, title, children, onApply }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: C.surface, zIndex: 300,
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}
      >
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
          <X size={20} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.indigo, ...fontSans }}>{title}</span>
        <button
          type="button"
          onClick={() => { onApply?.(); onClose(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.teal, ...fontSans }}
        >
          Apply
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>{children}</div>
    </div>
  );
}
