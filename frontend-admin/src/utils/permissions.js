/**
 * Sidebar navigation — grouped menus with permission checks.
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
      { label: 'Upcoming Flights', path: '/bookings/upcoming', permissions: ['bookings:view'] },
      { label: 'Voids', path: '/bookings/voids', permissions: ['bookings:view'] },
      { label: 'Refunds', path: '/bookings/refunds', permissions: ['bookings:view'] },
      { label: 'Reissues', path: '/bookings/reissues', permissions: ['bookings:view'] },
      { label: 'Invoices', path: '/bookings/invoices', permissions: ['bookings:view'] },
      { label: 'Partial Payments', path: '/bookings/partial-payments', permissions: ['bookings:view', 'payments:customer'] },
      { label: 'Hotel Booking', path: '/bookings/hotel', permissions: ['bookings:view'] },
      { label: 'e-Sim', path: '/bookings/esim', permissions: ['bookings:view'] },
      { label: 'Insurance', path: '/bookings/insurance', permissions: ['bookings:view'] },
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
      { label: 'Instant Payment', path: '/payments/instant', permissions: ['payments:customer'] },
      { label: 'Send Payment Request', path: '/payments/requests', permissions: ['payments:customer'] },
      { label: 'Customer Payments', path: '/payments/customers', permissions: ['payments:customer'] },
      { label: 'Payment History', path: '/payments/history', permissions: ['payments:customer'] },
      { label: 'Supplier Payments', path: '/payments/suppliers', permissions: ['payments:supplier'] },
      { label: 'Payment Settings', path: '/settings/payment', permissions: ['accounts:view'] },
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
      { label: 'Notifications', path: '/settings/notifications', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'] },
      { label: 'Payment Accounts', path: '/settings/payment-accounts', permissions: ['accounts:view', 'settings:manage', 'notifications:view'] },
      { label: 'Users', path: '/users', permissions: ['users:view'] },
      { label: 'Roles & Permissions', path: '/roles', permissions: ['roles:manage'] },
      { label: 'Security & Audit', path: '/security', permissions: ['audit:view'] },
    ],
  },
];

/** Legacy flat list — routes only, not shown in sidebar */
export const NAV_ITEMS = [
  { label: 'Bank List', path: '/settings/payment/banks', permissions: ['accounts:view'], hiddenFromNav: true },
  { label: 'MFS List', path: '/settings/payment/mfs', permissions: ['accounts:view'], hiddenFromNav: true },
  { label: 'SMS Settings', path: '/settings/sms', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'], hiddenFromNav: true },
  { label: 'Email Settings', path: '/settings/email', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'], hiddenFromNav: true },
  { label: 'WhatsApp Settings', path: '/settings/whatsapp', permissions: ['notifications:view', 'notifications:manage', 'settings:manage'], hiddenFromNav: true },
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

function filterNavChildren(children, user) {
  return (children || []).filter((item) =>
    hasPermission(user.permissions, user.role, item.permissions)
  );
}

export function getVisibleNavGroups(user) {
  if (!user) return [];

  return NAV_GROUPS.reduce((acc, group) => {
    if (group.children?.length) {
      const children = filterNavChildren(group.children, user);
      if (children.length) acc.push({ ...group, children });
      return acc;
    }
    if (group.path && hasPermission(user.permissions, user.role, group.permissions)) {
      acc.push(group);
    }
    return acc;
  }, []);
}

/** @deprecated use getVisibleNavGroups */
export function getVisibleNavItems(user) {
  return getVisibleNavGroups(user).flatMap((g) => {
    if (g.children?.length) return g.children.map((c) => ({ ...c, icon: g.icon, section: g.label }));
    return [{ label: g.label, path: g.path, icon: g.icon, permissions: g.permissions }];
  });
}

export default NAV_GROUPS;
