import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Repeat2, ReceiptText, Building2, Users,
  BarChart2, Bell, Globe, Settings, Database, Plane, ChevronDown, Radio,
} from 'lucide-react';
import { C, fontDisplay, fontMono, fontSans } from '../../theme/tokens';

const STORAGE_KEY = 'sta-nav-expanded';

const ICONS = {
  dashboard: <LayoutDashboard size={15} />,
  bookings: <FileText size={15} />,
  ticketOps: <Repeat2 size={15} />,
  receipts: <ReceiptText size={15} />,
  payments: <Building2 size={15} />,
  parties: <Users size={15} />,
  reports: <BarChart2 size={15} />,
  notifications: <Bell size={15} />,
  cms: <Globe size={15} />,
  livestream: <Radio size={15} />,
  administration: <Settings size={15} />,
  backup: <Database size={15} />,
  customers: <Users size={15} />,
  suppliers: <Building2 size={15} />,
  accounts: <FileText size={15} />,
  reminders: <Bell size={15} />,
  users: <Users size={15} />,
};

function readStoredExpanded() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredExpanded(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function pathMatches(pathname, path) {
  if (!path) return false;
  const clean = path.split('?')[0];
  if (clean === '/bookings') return pathname === '/bookings';
  return pathname === clean || pathname.startsWith(`${clean}/`);
}

function nodeContainsPath(node, pathname) {
  if (node.path && pathMatches(pathname, node.path)) return true;
  return (node.children || []).some((child) => nodeContainsPath(child, pathname));
}

function collectActiveKeys(nodes, pathname, prefix = '') {
  const keys = [];
  for (const node of nodes || []) {
    const key = node.id || node.path || node.label;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (nodeContainsPath(node, pathname)) keys.push(fullKey);
    if (node.children?.length) {
      keys.push(...collectActiveKeys(node.children, pathname, fullKey));
    }
  }
  return keys;
}

function STAWordmark({ collapsed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
      <div
        style={{
          width: 32, height: 32, borderRadius: 7, flexShrink: 0,
          background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Plane size={15} color="#fff" style={{ transform: 'rotate(-45deg)' }} />
      </div>
      {!collapsed && (
        <div style={{ ...fontDisplay, lineHeight: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Show Terra
          </div>
          <div style={{ fontSize: 9, fontWeight: 500, color: C.teal, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2, whiteSpace: 'nowrap' }}>
            Air · B2B Admin
          </div>
        </div>
      )}
    </div>
  );
}

function GroupHeader({ label, icon, open, groupActive, collapsed, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        gap: 9, padding: collapsed ? '9px 0' : '8px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: hover && !collapsed ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: 'none', borderRadius: 6, cursor: 'pointer',
        marginBottom: 1, outline: 'none',
      }}
    >
      <span style={{ color: groupActive ? C.teal : '#8FA3BF', display: 'flex', flexShrink: 0 }}>{icon}</span>
      {!collapsed && (
        <>
          <span
            style={{
              flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 600,
              color: groupActive ? '#D4DCE9' : '#8FA3BF',
              textTransform: 'uppercase', letterSpacing: '0.07em', ...fontSans,
            }}
          >
            {label}
          </span>
          <ChevronDown
            size={12}
            color="#4A6080"
            style={{ transition: 'transform 0.18s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', flexShrink: 0 }}
          />
        </>
      )}
    </button>
  );
}

function SidebarLeaf({ label, icon, active, collapsed, depth, to, onClick, end }) {
  const [hover, setHover] = useState(false);
  const pl = collapsed ? 0 : depth === 1 ? 28 : 10;

  const style = {
    width: '100%', display: 'flex', alignItems: 'center',
    gap: 9, paddingTop: 7, paddingBottom: 7,
    paddingLeft: collapsed ? 0 : pl,
    paddingRight: collapsed ? 0 : 10,
    justifyContent: collapsed ? 'center' : 'flex-start',
    background: active ? 'rgba(14,149,148,0.12)' : hover ? 'rgba(255,255,255,0.04)' : 'transparent',
    border: 'none',
    borderLeft: !collapsed && active ? `3px solid ${C.teal}` : '3px solid transparent',
    borderRadius: collapsed ? 0 : 6,
    cursor: 'pointer', outline: 'none', marginBottom: 1,
    position: 'relative', textDecoration: 'none',
  };

  const content = (
    <>
      {icon && (
        <span style={{ color: active ? C.teal : '#7A90AD', display: 'flex', flexShrink: 0 }}>{icon}</span>
      )}
      {!collapsed && (
        <span
          style={{
            flex: 1, textAlign: 'left', fontSize: 13,
            fontWeight: active ? 500 : 400,
            color: active ? '#FFFFFF' : hover ? '#C8D5E8' : '#8FA3BF',
            ...fontSans, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>
      )}
      {collapsed && active && (
        <span
          style={{
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            width: 3, height: 20, background: C.teal, borderRadius: '0 2px 2px 0',
          }}
        />
      )}
    </>
  );

  if (to) {
    return (
      <NavLink
        to={to}
        end={end}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        title={collapsed ? label : undefined}
        style={({ isActive }) => ({
          ...style,
          background: isActive ? 'rgba(14,149,148,0.12)' : hover ? 'rgba(255,255,255,0.04)' : 'transparent',
          borderLeft: !collapsed && isActive ? `3px solid ${C.teal}` : '3px solid transparent',
        })}
      >
        {({ isActive }) => (
          <>
            {icon && (
              <span style={{ color: isActive ? C.teal : '#7A90AD', display: 'flex', flexShrink: 0 }}>{icon}</span>
            )}
            {!collapsed && (
              <span
                style={{
                  flex: 1, textAlign: 'left', fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#FFFFFF' : hover ? '#C8D5E8' : '#8FA3BF',
                  ...fontSans, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {label}
              </span>
            )}
            {collapsed && isActive && (
              <span
                style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 20, background: C.teal, borderRadius: '0 2px 2px 0',
                }}
              />
            )}
          </>
        )}
      </NavLink>
    );
  }

  return (
    <button
      type="button"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={style}
    >
      {content}
    </button>
  );
}

function NavGroup({ group, expanded, onToggle, onClose, pathname, collapsed }) {
  const groupKey = group.id;
  const isActive = nodeContainsPath(group, pathname);
  const isOpen = Boolean(expanded[groupKey]);

  return (
    <div>
      <GroupHeader
        label={group.label}
        icon={ICONS[group.icon] || <FileText size={15} />}
        open={isOpen}
        groupActive={isActive}
        collapsed={collapsed}
        onClick={() => !collapsed && onToggle(groupKey)}
      />
      {isOpen && !collapsed && (
        <div style={{ marginBottom: 2 }}>
          {group.children.map((child) => {
            if (child.children?.length) {
              return (
                <div key={child.id || child.label}>
                  {child.children.map((leaf) => (
                    <SidebarLeaf
                      key={leaf.path || leaf.label}
                      label={leaf.label}
                      to={leaf.path}
                      depth={1}
                      collapsed={false}
                      onClick={onClose}
                      end={leaf.path === '/bookings'}
                    />
                  ))}
                </div>
              );
            }
            return (
              <SidebarLeaf
                key={child.path || child.label}
                label={child.label}
                to={child.path}
                depth={1}
                collapsed={false}
                onClick={onClose}
                end={child.path === '/bookings'}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * @param {object} props
 * @param {Array} props.groups
 * @param {boolean} [props.isOpen] mobile/tablet drawer open
 * @param {() => void} [props.onClose]
 * @param {boolean} [props.collapsed] icon-rail mode (desktop collapse / tablet)
 * @param {'fixed'|'static'} [props.mode]
 */
export default function Sidebar({
  groups,
  isOpen = false,
  onClose,
  collapsed = false,
  mode = 'fixed',
}) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => readStoredExpanded());

  const activeKeys = useMemo(
    () => collectActiveKeys(groups, location.pathname),
    [groups, location.pathname]
  );

  useEffect(() => {
    if (!activeKeys.length) return;
    setExpanded((prev) => {
      const next = { ...prev };
      activeKeys.forEach((key) => {
        const parts = key.split('.');
        for (let i = 1; i <= parts.length; i += 1) {
          next[parts.slice(0, i).join('.')] = true;
        }
      });
      writeStoredExpanded(next);
      return next;
    });
  }, [activeKeys]);

  const toggleKey = useCallback((key) => {
    setExpanded((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      writeStoredExpanded(next);
      return next;
    });
  }, []);

  const sidebarW = collapsed ? 72 : 260;

  const aside = (
    <aside
      style={{
        width: sidebarW,
        minWidth: sidebarW,
        background: C.indigo,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1), min-width 0.2s cubic-bezier(0.4,0,0.2,1)',
        borderRight: `1px solid ${C.indigo700}`,
        position: mode === 'fixed' ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        transform: mode === 'fixed' && !isOpen && !collapsed ? undefined : undefined,
      }}
      className={mode === 'fixed' ? (isOpen || collapsed === false ? '' : '') : ''}
    >
      <div
        style={{
          padding: collapsed ? '18px 0' : '18px 16px',
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: `1px solid ${C.indigo700}`,
          flexShrink: 0,
        }}
      >
        <STAWordmark collapsed={collapsed} />
      </div>

      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: collapsed ? '10px 0' : '10px 8px',
          scrollbarWidth: 'none',
        }}
      >
        {groups.map((group) => (
          group.children?.length ? (
            <NavGroup
              key={group.id}
              group={group}
              expanded={expanded}
              onToggle={toggleKey}
              onClose={onClose}
              pathname={location.pathname}
              collapsed={collapsed}
            />
          ) : (
            <SidebarLeaf
              key={group.id}
              label={group.label}
              icon={ICONS[group.icon] || <LayoutDashboard size={15} />}
              to={group.path}
              depth={0}
              collapsed={collapsed}
              onClick={onClose}
              end={group.path === '/dashboard'}
            />
          )
        ))}
      </nav>

      {!collapsed && (
        <div style={{ borderTop: `1px solid ${C.indigo700}`, padding: '10px 16px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: '#3D5070', ...fontMono, letterSpacing: '0.04em' }}>
            STA Admin v2.4.1
          </div>
        </div>
      )}
    </aside>
  );

  if (mode === 'static') {
    return aside;
  }

  // Mobile/tablet overlay drawer (full width when open)
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(20,33,61,0.35)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        style={{
          position: 'fixed',
          inset: '0 auto 0 0',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <aside
          style={{
            width: 260,
            minWidth: 260,
            background: C.indigo,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            borderRight: `1px solid ${C.indigo700}`,
          }}
        >
          <div style={{ padding: '18px 16px', borderBottom: `1px solid ${C.indigo700}`, flexShrink: 0 }}>
            <STAWordmark collapsed={false} />
          </div>
          <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', scrollbarWidth: 'none' }}>
            {groups.map((group) => (
              group.children?.length ? (
                <NavGroup
                  key={group.id}
                  group={group}
                  expanded={expanded}
                  onToggle={toggleKey}
                  onClose={onClose}
                  pathname={location.pathname}
                  collapsed={false}
                />
              ) : (
                <SidebarLeaf
                  key={group.id}
                  label={group.label}
                  icon={ICONS[group.icon] || <LayoutDashboard size={15} />}
                  to={group.path}
                  depth={0}
                  collapsed={false}
                  onClick={onClose}
                  end={group.path === '/dashboard'}
                />
              )
            ))}
          </nav>
          <div style={{ borderTop: `1px solid ${C.indigo700}`, padding: '10px 16px' }}>
            <div style={{ fontSize: 10, color: '#3D5070', ...fontMono }}>STA Admin v2.4.1</div>
          </div>
        </aside>
      </div>
    </>
  );
}

/** Desktop / tablet icon-rail sidebar (always visible) */
export function DesktopSidebar({ groups, collapsed, onClose }) {
  return (
    <Sidebar
      groups={groups}
      collapsed={collapsed}
      onClose={onClose}
      mode="static"
      isOpen
    />
  );
}
