/**
 * Sidebar navigation with required permissions.
 * User needs at least one permission from the array (or no permission for open items).
 */
export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    permissions: ['dashboard:view'],
  },
  {
    label: 'Orders',
    path: '/orders',
    icon: 'orders',
    permissions: ['orders:view'],
    description: 'Website requests (ORD-)',
  },
  {
    label: 'Bookings',
    path: '/bookings',
    icon: 'bookings',
    permissions: ['bookings:view'],
    description: 'Confirmed tickets (BKG-)',
  },
  {
    label: 'Customers',
    path: '/customers',
    icon: 'customers',
    permissions: ['customers:view'],
  },
  {
    label: 'Suppliers',
    path: '/suppliers',
    icon: 'suppliers',
    permissions: ['suppliers:view'],
    description: 'GDS, airlines, ticket sources',
  },
  {
    label: 'B2B Agents',
    path: '/agents',
    icon: 'users',
    permissions: ['agents:view'],
    description: 'Agencies who buy from you',
  },
  {
    label: 'Agent Bookings',
    path: '/agent-bookings',
    icon: 'bookings',
    permissions: ['agent-bookings:view'],
  },
  {
    label: 'Agent Accounting',
    path: '/agent-accounting',
    icon: 'accounts',
    permissions: ['agent-accounting:view'],
  },
  {
    label: 'Accounts',
    path: '/accounts',
    icon: 'accounts',
    permissions: ['accounts:view'],
  },
  {
    label: 'Customer Payments',
    path: '/payments/customers',
    icon: 'payments',
    permissions: ['payments:customer'],
  },
  {
    label: 'Supplier Payments',
    path: '/payments/suppliers',
    icon: 'payments',
    permissions: ['payments:supplier'],
  },
  {
    label: 'Expenses',
    path: '/expenses',
    icon: 'expenses',
    permissions: ['expenses:view'],
  },
  {
    label: 'Transfers',
    path: '/transfers',
    icon: 'accounts',
    permissions: ['transfers:create'],
  },
  {
    label: 'Reminders',
    path: '/reminders',
    icon: 'reminders',
    permissions: ['reminders:view'],
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: 'reports',
    permissions: ['reports:view'],
  },
  {
    label: 'CMS',
    path: '/cms',
    icon: 'cms',
    permissions: ['cms:view'],
  },
  {
    label: 'Backup',
    path: '/backup',
    icon: 'backup',
    permissions: ['backup:manage'],
  },
  {
    label: 'Security',
    path: '/security',
    icon: 'security',
    permissions: ['audit:view'],
  },
  {
    label: 'Currency Settings',
    path: '/settings/currency',
    icon: 'accounts',
    permissions: ['settings:manage', 'cms:manage'],
  },
  {
    label: 'Payment Accounts',
    path: '/settings/payment-accounts',
    icon: 'accounts',
    permissions: ['accounts:view', 'settings:manage', 'notifications:view'],
  },
  {
    label: 'SMS Settings',
    path: '/settings/sms',
    icon: 'reminders',
    permissions: ['notifications:view', 'settings:manage'],
  },
  {
    label: 'Email Settings',
    path: '/settings/email',
    icon: 'reminders',
    permissions: ['notifications:view', 'settings:manage'],
  },
  {
    label: 'Notification Templates',
    path: '/settings/notification-templates',
    icon: 'cms',
    permissions: ['notifications:view', 'settings:manage'],
  },
  {
    label: 'Notification Logs',
    path: '/notifications/logs',
    icon: 'reports',
    permissions: ['notifications:view', 'settings:manage'],
  },
  {
    label: 'Users',
    path: '/users',
    icon: 'users',
    permissions: ['users:view'],
  },
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
  return user?.role === 'demo';
}

export function getVisibleNavItems(user) {
  if (!user) return [];
  return NAV_ITEMS.filter((item) =>
    hasPermission(user.permissions, user.role, item.permissions)
  );
}

export default NAV_ITEMS;
