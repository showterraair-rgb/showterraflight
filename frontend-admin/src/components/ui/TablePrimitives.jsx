import { useState } from 'react';
import { Download, Search, X } from 'lucide-react';
import { useBP } from '../../hooks/useBreakpoint';
import { C, fontMono, fontSans } from '../../theme/tokens';

export function TH({ children, w, right }) {
  return (
    <div
      style={{
        width: w, minWidth: w, flexShrink: 0,
        fontSize: 10, fontWeight: 600, color: C.muted,
        textTransform: 'uppercase', letterSpacing: '0.06em', ...fontSans,
        textAlign: right ? 'right' : 'left', padding: '0 8px',
      }}
    >
      {children}
    </div>
  );
}

export function TD({ children, w, right, mono, color }) {
  return (
    <div
      style={{
        width: w, minWidth: w, flexShrink: 0,
        fontSize: 12, color: color ?? C.text,
        padding: '0 8px', textAlign: right ? 'right' : 'left',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        ...(mono ? fontMono : fontSans),
      }}
    >
      {children}
    </div>
  );
}

export function SummaryStrip({ tiles }) {
  const bp = useBP();
  const isMobile = bp === 'mobile';
  return (
    <div
      style={{
        display: 'flex', background: C.surface,
        borderBottom: `1px solid ${C.border}`, flexShrink: 0, overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {tiles.map((s, i) => (
        <div
          key={s.label}
          style={{
            flex: '1 1 0', minWidth: isMobile ? 100 : 120,
            padding: isMobile ? '10px 14px' : '12px 20px',
            borderRight: i < tiles.length - 1 ? `1px solid ${C.border}` : 'none',
            borderTop: `3px solid ${s.color}`,
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', ...fontSans }}>
            {s.label}
          </div>
          <div
            style={{
              fontSize: isMobile ? (s.mono ? 13 : 18) : (s.mono ? 15 : 22),
              fontWeight: 700, color: s.color, marginTop: 2, lineHeight: 1, ...fontMono,
            }}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableToolbar({
  search, onSearch, children, onExport, exportLabel = 'Export', placeholder = 'Search…',
}) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '10px 20px', background: C.surface,
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          flex: '0 1 240px', background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: 6, padding: '6px 10px',
        }}
      >
        <Search size={12} color={C.muted} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: C.text, ...fontSans }}
        />
        {search && (
          <button type="button" onClick={() => onSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <X size={11} color={C.muted} />
          </button>
        )}
      </div>
      {children}
      <div style={{ flex: 1 }} />
      {onExport && (
        <button
          type="button"
          onClick={onExport}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface,
            color: C.muted, fontSize: 12, cursor: 'pointer', ...fontSans,
          }}
        >
          <Download size={13} /> {exportLabel}
        </button>
      )}
    </div>
  );
}

export function ActionBtn({ label, color = C.teal, icon, onClick, type = 'button' }) {
  const [h, setH] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
        borderRadius: 5, border: `1px solid ${color}44`,
        background: h ? `${color}22` : `${color}11`,
        color, fontSize: 11, fontWeight: 500, cursor: 'pointer', ...fontSans,
      }}
    >
      {icon}{label}
    </button>
  );
}

export function MobileCard({ title, sub, badge, badgeColor, fields, actions, leftAccent }) {
  return (
    <div
      style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: '14px 16px', marginBottom: 10,
        borderLeft: leftAccent ? `3px solid ${leftAccent}` : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.indigo, ...fontSans }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 1, ...fontSans }}>{sub}</div>}
        </div>
        {badge && (
          <span
            style={{
              fontSize: 10, fontWeight: 600, color: badgeColor ?? C.teal,
              background: `${badgeColor ?? C.teal}18`, padding: '2px 8px', borderRadius: 10, ...fontSans,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: actions ? 10 : 0 }}>
        {fields.map((f) => (
          <div key={f.label}>
            <div style={{ fontSize: 9, fontWeight: 600, color: C.subtle, textTransform: 'uppercase', letterSpacing: '0.06em', ...fontSans }}>
              {f.label}
            </div>
            <div style={{ fontSize: 12, color: f.color ?? C.text, marginTop: 1, ...(f.mono ? fontMono : fontSans) }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          {actions}
        </div>
      )}
    </div>
  );
}
