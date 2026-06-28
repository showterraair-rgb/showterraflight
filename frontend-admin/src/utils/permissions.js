/**
 * Sidebar navigation — travel ERP v2 information architecture.
 * Maps to existing routes; no URL changes in phase 1.
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
    id: 'bookings',
    label: 'Bookings',
    icon: 'bookings',
    children: [
      { label: 'Booking Ledger', path: '/bookings', permissions: ['bookings:view'] },
      { label: 'New Booking', path: '/bookings/new', permissions: ['bookings:create'] },
      { label: 'Bulk Import', path: '/bookings/bulk-import', permissions: ['bookings:create'] },
      { label: 'Upcoming Flights', path: '/bookings/upcoming', permissions: ['bookings:view'] },
      { label: 'Partial Payments', path: '/bookings/partial-payments', permissions: ['bookings:view', 'payments:customer'] },
    ],
  },
  {
    id: 'ticket-operations',
    label: 'Ticket Operations',
    icon: 'ticketOps',
    children: [
      { label: 'Voids', path: '/bookings/voids', permissions: ['bookings:view'] },
      { label: 'Refunds', path: '/bookings/refunds', permissions: ['bookings:view'] },
      { label: 'Pending Refunds', path: '/bookings?refundPending=1', permissions: ['bookings:view'] },
      { label: 'Reissues', path: '/bookings/reissues', permissions: ['bookings:view'] },
      { label: 'Invoices', path: '/bookings/invoices', permissions: ['bookings:view'] },
    ],
  },
  {
    id: 'receipts',
    label: 'Receipts',
    icon: 'receipts',
    children: [
      { label: 'Record Receipt', path: '/payments/customers', permissions: ['payments:customer'] },
      { label: 'Payment History', path: '/payments/history', permissions: ['payments:customer'] },
      { label: 'Instant Payment', path: '/payments/instant', permissions: ['payments:customer'] },
      { label: 'Payment Request', path: '/payments/requests', permissions: ['payments:customer'] },
    ],
  },
  {
    id: 'supplier-payments',
    label: 'Supplier Payments',
    path: '/payments/suppliers',
    icon: 'payments',
    permissions: ['payments:supplier'],
  },
  {
    id: 'parties',
    label: 'Parties',
    icon: 'parties',
    children: [
      { label: 'Customers', path: '/customers', permissions: ['customers:view'] },
      { label: 'Suppliers', path: '/suppliers', permissions: ['suppliers:view'] },
      { label: 'B2B Agents', path: '/agents', permissions: ['agents:view'] },
      { label: 'Agent Bookings', path: '/agent-bookings', permissions: ['agent-bookings:view'] },
      { label: 'Agent Accounting', path: '/agent-accounting', permissions: ['agent-accounting:view'] },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'reports',
    children: [
      { label: 'Business Summary', path: '/reports/business-summary', permissions: ['reports:view', 'dashboard:view'] },
      { label: 'All Reports', path: '/reports', permissions: ['reports:view'] },
      { label: 'Sales & RRV', path: '/reports/sales', permissions: ['reports:view'] },
      { label: 'Ledger', path: '/finance/ledger', permissions: ['accounts:view'] },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'notifications',
    children: [
      { label: 'Hub & Rules', path: '/settings/notifications', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'] },
      { label: 'Templates', path: '/settings/notification-templates', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'] },
      { label: 'Reminders', path: '/reminders', permissions: ['reminders:view'] },
      { label: 'SMS', path: '/settings/sms', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'] },
      { label: 'Email', path: '/settings/email', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'] },
      { label: 'WhatsApp', path: '/settings/whatsapp', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'] },
    ],
  },
  {
    id: 'cms',
    label: 'Frontend CMS',
    path: '/cms',
    icon: 'cms',
    permissions: ['cms:view'],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: 'administration',
    children: [
      { label: 'Users', path: '/users', permissions: ['users:view'] },
      { label: 'Roles & Permissions', path: '/roles', permissions: ['roles:manage'] },
      { label: 'Currency', path: '/settings/currency', permissions: ['settings:manage', 'cms:manage'] },
      { label: 'Payment Accounts', path: '/settings/payment-accounts', permissions: ['accounts:view', 'settings:manage', 'notifications:view'] },
      { label: 'Payment Settings', path: '/settings/payment', permissions: ['accounts:view'] },
      { label: 'Accounts', path: '/accounts', permissions: ['accounts:view'] },
      { label: 'Expenses', path: '/expenses', permissions: ['expenses:view'] },
      { label: 'Transfers', path: '/transfers', permissions: ['transfers:create'] },
      { label: 'Security & Audit', path: '/security', permissions: ['audit:view'] },
    ],
  },
  {
    id: 'backup-logs',
    label: 'Backup & Logs',
    icon: 'backup',
    children: [
      { label: 'Database Backup', path: '/backup', permissions: ['backup:manage'] },
      { label: 'Notification Logs', path: '/notifications/logs', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'] },
      { label: 'Audit & Login History', path: '/security', permissions: ['audit:view'] },
    ],
  },
];

/** Routes only — hidden from sidebar (deep links, legacy product categories) */
export const NAV_ITEMS = [
  { label: 'Hotel Booking', path: '/bookings/hotel', permissions: ['bookings:view'], hiddenFromNav: true },
  { label: 'e-Sim', path: '/bookings/esim', permissions: ['bookings:view'], hiddenFromNav: true },
  { label: 'Insurance', path: '/bookings/insurance', permissions: ['bookings:view'], hiddenFromNav: true },
  { label: 'Bank List', path: '/settings/payment/banks', permissions: ['accounts:view'], hiddenFromNav: true },
  { label: 'MFS List', path: '/settings/payment/mfs', permissions: ['accounts:view'], hiddenFromNav: true },
  { label: 'Gateway Settings', path: '/settings/payment/gateway', permissions: ['accounts:view', 'settings:manage', 'notifications:view'], hiddenFromNav: true },
  { label: 'Customer Account', path: '/customers/:id/account', permissions: ['customers:view'], hiddenFromNav: true },
  { label: 'Supplier Account', path: '/suppliers/:id/account', permissions: ['suppliers:view'], hiddenFromNav: true },
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
