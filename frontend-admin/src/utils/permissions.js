/**
 * Sidebar navigation — grouped menus with permission checks.
 * Items with `children` render as collapsible sub-groups.
 */

export const NAV_GROUPS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    permissions: ['dashboard:view'],
  },
  {
    id: 'customers',
    label: 'Customers',
    path: '/customers',
    icon: 'customers',
    permissions: ['customers:view'],
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: 'bookings',
    children: [
      { label: 'Booking History', path: '/bookings', permissions: ['bookings:view'] },
      { label: 'New Booking', path: '/bookings/new', permissions: ['bookings:create'] },
      { label: 'Bulk Import', path: '/bookings/bulk-import', permissions: ['bookings:create'] },
      { label: 'Upcoming Flights', path: '/bookings/upcoming', permissions: ['bookings:view'] },
      { label: 'Partial Payments', path: '/bookings/partial-payments', permissions: ['bookings:view', 'payments:customer'] },
      {
        id: 'ticketing',
        label: 'Ticketing',
        children: [
          { label: 'Voids', path: '/bookings/voids', permissions: ['bookings:view'] },
          { label: 'Refunds', path: '/bookings/refunds', permissions: ['bookings:view'] },
          { label: 'Reissues', path: '/bookings/reissues', permissions: ['bookings:view'] },
          { label: 'Invoices', path: '/bookings/invoices', permissions: ['bookings:view'] },
        ],
      },
    ],
  },
  {
    id: 'partners',
    label: 'Partners',
    icon: 'suppliers',
    children: [
      { label: 'Suppliers', path: '/suppliers', permissions: ['suppliers:view'] },
      { label: 'B2B Agents', path: '/agents', permissions: ['agents:view'] },
      { label: 'Agent Bookings', path: '/agent-bookings', permissions: ['agent-bookings:view'] },
      { label: 'Agent Accounting', path: '/agent-accounting', permissions: ['agent-accounting:view'] },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'accounts',
    children: [
      { label: 'Accounts', path: '/accounts', permissions: ['accounts:view'] },
      { label: 'Ledger', path: '/finance/ledger', permissions: ['accounts:view'] },
      { label: 'Expenses', path: '/expenses', permissions: ['expenses:view'] },
      { label: 'Transfers', path: '/transfers', permissions: ['transfers:create'] },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: 'payments',
    children: [
      { label: 'Customer Payments', path: '/payments/customers', permissions: ['payments:customer'] },
      { label: 'Supplier Payments', path: '/payments/suppliers', permissions: ['payments:supplier'] },
      { label: 'Payment History', path: '/payments/history', permissions: ['payments:customer'] },
      {
        id: 'payment-tools',
        label: 'Quick Actions',
        children: [
          { label: 'Instant Payment', path: '/payments/instant', permissions: ['payments:customer'] },
          { label: 'Payment Request', path: '/payments/requests', permissions: ['payments:customer'] },
        ],
      },
    ],
  },
  {
    id: 'reminders',
    label: 'Reminders',
    path: '/reminders',
    icon: 'reminders',
    permissions: ['reminders:view'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'reports',
    children: [
      { label: 'Business Summary', path: '/reports/business-summary', permissions: ['reports:view', 'dashboard:view'] },
      { label: 'Business Reports', path: '/reports', permissions: ['reports:view'] },
      { label: 'Sales Report', path: '/reports/sales', permissions: ['reports:view'] },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'users',
    children: [
      { label: 'Currency', path: '/settings/currency', permissions: ['settings:manage', 'cms:manage'] },
      { label: 'Payment Accounts', path: '/settings/payment-accounts', permissions: ['accounts:view', 'settings:manage', 'notifications:view'] },
      { label: 'Payment Settings', path: '/settings/payment', permissions: ['accounts:view'] },
      {
        id: 'notifications',
        label: 'Notifications',
        children: [
          { label: 'Notification Hub', path: '/settings/notifications', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'] },
          { label: 'SMS', path: '/settings/sms', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'] },
          { label: 'Email', path: '/settings/email', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'] },
          { label: 'WhatsApp', path: '/settings/whatsapp', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'] },
        ],
      },
      { label: 'Users', path: '/users', permissions: ['users:view'] },
      { label: 'Roles & Permissions', path: '/roles', permissions: ['roles:manage'] },
      { label: 'Security & Audit', path: '/security', permissions: ['audit:view'] },
    ],
  },
];

/** Routes only — hidden from sidebar */
export const NAV_ITEMS = [
  { label: 'Hotel Booking', path: '/bookings/hotel', permissions: ['bookings:view'], hiddenFromNav: true },
  { label: 'e-Sim', path: '/bookings/esim', permissions: ['bookings:view'], hiddenFromNav: true },
  { label: 'Insurance', path: '/bookings/insurance', permissions: ['bookings:view'], hiddenFromNav: true },
  { label: 'Bank List', path: '/settings/payment/banks', permissions: ['accounts:view'], hiddenFromNav: true },
  { label: 'MFS List', path: '/settings/payment/mfs', permissions: ['accounts:view'], hiddenFromNav: true },
  { label: 'Notification Templates', path: '/settings/notification-templates', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'], hiddenFromNav: true },
  { label: 'Notification Logs', path: '/notifications/logs', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'], hiddenFromNav: true },
  { label: 'Gateway Settings', path: '/settings/payment/gateway', permissions: ['accounts:view', 'settings:manage', 'notifications:view'], hiddenFromNav: true },
  { label: 'CMS', path: '/cms', permissions: ['cms:view'], hiddenFromNav: true },
  { label: 'Backup', path: '/backup', permissions: ['backup:manage'], hiddenFromNav: true },
];

export function hasPermission(userPermissions, role, required) {
  if (!required?.length) return true;
  const normalizedRole = role?.toLowerCase?.();
  if (normalizedRole === 'admin' || userPermissions?.includes('*')) return true;
  return required.some((p) => {
    if (userPermissions?.includes(p)) return true;
    const [module] = p.split(':');
    return userPermissions?.includes(`${module}:*`);
  });
}

export function isReadOnlyUser(user) {
  return user?.role === 'demo' || user?.role === 'viewer';
}

function filterNavNode(node, user) {
  if (node.children?.length) {
    const children = node.children
      .map((child) => filterNavNode(child, user))
      .filter(Boolean);
    if (!children.length) return null;
    return { ...node, children };
  }
  if (node.path && hasPermission(user.permissions, user.role, node.permissions)) {
    return node;
  }
  return null;
}

export function getVisibleNavGroups(user) {
  if (!user) return [];
  return NAV_GROUPS.map((group) => filterNavNode(group, user)).filter(Boolean);
}

/** Flatten all nav paths for active-route detection */
export function flattenNavPaths(nodes, prefix = '') {
  const paths = [];
  for (const node of nodes || []) {
    const key = node.id || node.path || node.label;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (node.path) paths.push({ path: node.path, key: fullKey });
    if (node.children?.length) {
      paths.push(...flattenNavPaths(node.children, fullKey));
    }
  }
  return paths;
}

/** @deprecated use getVisibleNavGroups */
export function getVisibleNavItems(user) {
  return getVisibleNavGroups(user).flatMap((g) => {
    if (g.children?.length) return g.children.map((c) => ({ ...c, icon: g.icon, section: g.label }));
    return [{ label: g.label, path: g.path, icon: g.icon, permissions: g.permissions }];
  });
}

export default NAV_GROUPS;
