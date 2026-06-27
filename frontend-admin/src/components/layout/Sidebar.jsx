import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const STORAGE_KEY = 'sta-nav-expanded';

const ICONS = {
  dashboard: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  ),
  bookings: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  customers: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  suppliers: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  accounts: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  payments: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  reminders: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  reports: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  users: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
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
    // ignore quota errors
  }
}

function pathMatches(pathname, path) {
  if (path === '/bookings') return pathname === '/bookings';
  return pathname === path || pathname.startsWith(`${path}/`);
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

function Chevron({ open, className = '' }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function NavItemLink({ item, onClose, nested = false, subNested = false }) {
  const pad = subNested ? 'pl-14' : nested ? 'pl-10' : '';
  return (
    <NavLink
      to={item.path}
      end={item.path === '/bookings'}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center rounded-lg text-sm font-medium transition ${pad} px-3 py-2 ${
          isActive
            ? 'bg-brand-50 text-brand-700'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`
      }
    >
      {item.label}
    </NavLink>
  );
}

function NavSubGroup({ node, nodeKey, expanded, onToggle, onClose, pathname, depth = 1 }) {
  const isActive = nodeContainsPath(node, pathname);
  const isOpen = Boolean(expanded[nodeKey]);

  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(nodeKey)}
        className={`flex w-full items-center gap-2 rounded-lg py-2 pl-10 pr-3 text-left text-xs font-semibold uppercase tracking-wide transition ${
          isActive && !isOpen
            ? 'text-brand-700'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
        aria-expanded={isOpen}
      >
        <span className="flex-1">{node.label}</span>
        <Chevron open={isOpen} className="h-3.5 w-3.5" />
      </button>
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <ul className="overflow-hidden space-y-0.5">
          {node.children.map((child) => (
            <NavTreeItem
              key={child.id || child.path || child.label}
              node={child}
              nodeKey={`${nodeKey}.${child.id || child.path || child.label}`}
              expanded={expanded}
              onToggle={onToggle}
              onClose={onClose}
              pathname={pathname}
              depth={depth + 1}
            />
          ))}
        </ul>
      </div>
    </li>
  );
}

function NavTreeItem({ node, nodeKey, expanded, onToggle, onClose, pathname, depth = 1 }) {
  if (node.children?.length) {
    return (
      <NavSubGroup
        node={node}
        nodeKey={nodeKey}
        expanded={expanded}
        onToggle={onToggle}
        onClose={onClose}
        pathname={pathname}
        depth={depth}
      />
    );
  }
  return (
    <li>
      <NavItemLink item={node} onClose={onClose} nested subNested={depth >= 2} />
    </li>
  );
}

function NavGroup({ group, expanded, onToggle, onClose, pathname }) {
  const groupKey = group.id;
  const isActive = nodeContainsPath(group, pathname);
  const isOpen = Boolean(expanded[groupKey]);

  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(groupKey)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
          isActive && !isOpen
            ? 'bg-brand-50/60 text-brand-700'
            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        }`}
        aria-expanded={isOpen}
      >
        <span className="text-slate-400">{ICONS[group.icon]}</span>
        <span className="flex-1">{group.label}</span>
        <Chevron open={isOpen} />
      </button>
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <ul className="mt-1 overflow-hidden space-y-0.5">
          {group.children.map((child) => (
            <NavTreeItem
              key={child.id || child.path || child.label}
              node={child}
              nodeKey={`${groupKey}.${child.id || child.path || child.label}`}
              expanded={expanded}
              onToggle={onToggle}
              onClose={onClose}
              pathname={pathname}
              depth={1}
            />
          ))}
        </ul>
      </div>
    </li>
  );
}

export default function Sidebar({ groups, isOpen, onClose }) {
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

  const collapseAll = useCallback(() => {
    setExpanded({});
    writeStoredExpanded({});
  }, []);

  const expandAll = useCallback(() => {
    const next = {};
    groups.forEach((group) => {
      if (group.children?.length) {
        next[group.id] = true;
        const walk = (nodes, prefix) => {
          nodes.forEach((node) => {
            const key = `${prefix}.${node.id || node.path || node.label}`;
            if (node.children?.length) {
              next[key] = true;
              walk(node.children, key);
            }
          });
        };
        walk(group.children, group.id);
      }
    });
    setExpanded(next);
    writeStoredExpanded(next);
  }, [groups]);

  const anyExpanded = Object.values(expanded).some(Boolean);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            STA
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Show Terra Air</p>
            <p className="text-xs text-slate-500">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {groups.map((group) => (
              group.children?.length ? (
                <NavGroup
                  key={group.id}
                  group={group}
                  expanded={expanded}
                  onToggle={toggleKey}
                  onClose={onClose}
                  pathname={location.pathname}
                />
              ) : (
                <li key={group.id}>
                  <NavItemLink item={group} onClose={onClose} />
                </li>
              )
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-200 px-3 py-3">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={expandAll}
              className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAll}
              disabled={!anyExpanded}
              className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              Collapse all
            </button>
          </div>
          <p className="mt-2 px-1 text-xs text-slate-400">Show Terra Air v1.0</p>
        </div>
      </aside>
    </>
  );
}
