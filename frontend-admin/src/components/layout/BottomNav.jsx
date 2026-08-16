import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Menu, Plane, ReceiptText, Users, X, ChevronRight } from 'lucide-react';
import { C, fontDisplay, fontSans } from '../../theme/tokens';

const BOTTOM_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={21} /> },
  { id: 'bookings', label: 'Bookings', path: '/bookings', icon: <Plane size={21} /> },
  { id: 'receipts', label: 'Receipts', path: '/payments/customers', icon: <ReceiptText size={21} /> },
  { id: 'customers', label: 'Parties', path: '/customers', icon: <Users size={21} /> },
  { id: '__more__', label: 'More', path: null, icon: <Menu size={21} /> },
];

function MobileMoreMenu({ groups, onClose, onNav }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: C.surface, zIndex: 400,
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: C.indigo, ...fontDisplay }}>Menu</span>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
          <X size={22} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {groups.map((entry) => {
          if (!entry.children?.length) {
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => { onNav(entry.path); onClose(); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 8, background: 'none', border: 'none',
                  cursor: 'pointer', marginBottom: 2, color: C.text, ...fontSans, fontSize: 13,
                }}
              >
                {entry.label}
              </button>
            );
          }
          return (
            <div key={entry.id} style={{ marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 9, fontWeight: 700, color: C.subtle, textTransform: 'uppercase',
                  letterSpacing: '0.08em', padding: '8px 16px 4px', ...fontSans,
                }}
              >
                {entry.label}
              </div>
              {entry.children.map((c) => (
                <button
                  key={c.path || c.label}
                  type="button"
                  onClick={() => { onNav(c.path); onClose(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 20px', borderRadius: 8, background: 'none', border: 'none',
                    cursor: 'pointer', marginBottom: 2, color: C.text, ...fontSans, fontSize: 13,
                  }}
                >
                  <ChevronRight size={14} color={C.muted} />
                  {c.label}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BottomNav({ groups }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {moreOpen && (
        <MobileMoreMenu
          groups={groups}
          onClose={() => setMoreOpen(false)}
          onNav={(path) => path && navigate(path)}
        />
      )}
      <nav
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 62,
          background: C.surface, borderTop: `1px solid ${C.border}`,
          display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {BOTTOM_ITEMS.map((item) => {
          const isActive = item.path && (
            item.path === '/bookings'
              ? location.pathname === '/bookings'
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
          );
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === '__more__') setMoreOpen(true);
                else if (item.path) navigate(item.path);
              }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 3, background: 'none', border: 'none',
                cursor: 'pointer', color: isActive ? C.teal : C.muted,
                fontSize: 10, fontWeight: isActive ? 700 : 400, paddingBottom: 2, ...fontSans,
              }}
            >
              <span style={{ color: isActive ? C.teal : C.muted }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
