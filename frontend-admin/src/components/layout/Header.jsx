import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Moon, Plane, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../hooks/useCurrency';
import { useBP } from '../../hooks/useBreakpoint';
import IconBtn from '../ui/IconBtn';
import { C, fontDisplay, fontMono, fontSans } from '../../theme/tokens';

const ROLE_LABELS = {
  admin: 'Administrator',
  accountant: 'Accountant',
  executive: 'Executive',
  demo: 'Demo (Read-only)',
};

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'ST';
}

function FxChip({ compact }) {
  const { brlRate, loading } = useCurrency();
  const rate = loading ? '—' : Number(brlRate).toFixed(4);
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: compact ? 5 : 6,
        padding: compact ? '4px 9px' : '5px 10px', borderRadius: 6,
        background: C.bg, border: `1px solid ${C.border}`, flexShrink: 0,
      }}
    >
      <span style={{ ...fontMono, fontSize: 10, color: C.muted }}>R$</span>
      <span style={{ ...fontMono, fontSize: 11, fontWeight: 600, color: C.indigo }}>{rate}</span>
      <span style={{ ...fontMono, fontSize: 10, color: C.border }}>|</span>
      <span style={{ ...fontMono, fontSize: 10, color: C.muted }}>৳1.00</span>
    </div>
  );
}

export default function Header({ title, subtitle, onMenuClick }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const bp = useBP();
  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';
  const avatar = initials(user?.name);

  const openNotifications = () => navigate('/notifications/logs');

  if (isMobile) {
    return (
      <header
        style={{
          height: 52, flexShrink: 0, background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
        }}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: 8, background: C.indigo,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <Plane size={14} color="#fff" style={{ transform: 'rotate(-45deg)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              margin: 0, fontSize: 14, fontWeight: 700, color: C.indigo, ...fontDisplay,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ position: 'relative' }}>
            <IconBtn title="Notifications" onClick={openNotifications}><Bell size={16} /></IconBtn>
            <span
              style={{
                position: 'absolute', top: 5, right: 5, width: 6, height: 6,
                borderRadius: '50%', background: C.red, border: `2px solid ${C.surface}`,
              }}
            />
          </div>
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%', background: C.indigo,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0, ...fontSans,
            }}
          >
            {avatar}
          </div>
        </div>
      </header>
    );
  }

  if (isTablet) {
    return (
      <header
        style={{
          height: 56, flexShrink: 0, background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
        }}
      >
        <button
          type="button"
          onClick={onMenuClick}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            width: 32, height: 32, borderRadius: 6, color: C.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <Menu size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              margin: 0, fontSize: 15, fontWeight: 600, color: C.indigo, ...fontDisplay,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FxChip compact />
          <IconBtn onClick={toggleTheme} title={isDark ? 'Light' : 'Dark'}>
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </IconBtn>
          <div style={{ position: 'relative' }}>
            <IconBtn title="Notifications" onClick={openNotifications}><Bell size={15} /></IconBtn>
            <span
              style={{
                position: 'absolute', top: 5, right: 5, width: 6, height: 6,
                borderRadius: '50%', background: C.red, border: `2px solid ${C.surface}`,
              }}
            />
          </div>
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%', background: C.indigo,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0, ...fontSans,
            }}
          >
            {avatar}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      style={{
        height: 64, flexShrink: 0, background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
      }}
    >
      <button
        type="button"
        onClick={onMenuClick}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 6, color: C.muted, flexShrink: 0,
        }}
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            margin: 0, fontSize: 16, fontWeight: 600, color: C.indigo, ...fontDisplay,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: 0, fontSize: 11, color: C.muted, ...fontSans }}>{subtitle}</p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <FxChip />
        <IconBtn onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </IconBtn>
        <div style={{ position: 'relative' }}>
          <IconBtn title="Notifications" onClick={openNotifications}><Bell size={16} /></IconBtn>
          <span
            style={{
              position: 'absolute', top: 5, right: 5, width: 7, height: 7,
              borderRadius: '50%', background: C.red, border: `2px solid ${C.surface}`,
            }}
          />
        </div>
        <div style={{ width: 1, height: 28, background: C.border, margin: '0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: '50%', background: C.indigo,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, ...fontSans,
            }}
          >
            {avatar}
          </div>
          <div style={fontSans}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.indigo, lineHeight: 1.3 }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.2 }}>
              {ROLE_LABELS[user?.role] || user?.role}
            </div>
          </div>
          <ChevronDown size={13} color={C.muted} />
        </div>
        <div style={{ width: 1, height: 28, background: C.border, margin: '0 4px' }} />
        <button
          type="button"
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            borderRadius: 6, background: 'none', border: `1px solid ${C.border}`,
            cursor: 'pointer', color: C.muted, fontSize: 12, ...fontSans, fontWeight: 500,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.redLight; e.currentTarget.style.color = C.red; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.muted; }}
        >
          <LogOut size={13} />Logout
        </button>
      </div>
    </header>
  );
}
