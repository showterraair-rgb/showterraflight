import { X } from 'lucide-react';
import { C, fontSans } from '../../theme/tokens';

export default function SlideOver({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(20,33,61,0.35)', zIndex: 200 }}
      />
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 320,
          background: C.surface, zIndex: 201, display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
        }}
      >
        <div
          style={{
            padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: C.indigo, ...fontSans }}>{title}</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>{children}</div>
      </div>
    </>
  );
}
