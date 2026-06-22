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
    label: 'Customers',
    path: '/customers',
    icon: 'customers',
    permissions: ['customers:view'],
  },
  {
    label: 'Booking History',
    path: '/bookings',
    icon: 'bookings',
    permissions: ['bookings:view'],
    section: 'Bookings',
  },
  {
    label: 'Hotel Booking',
    path: '/bookings/hotel',
    icon: 'bookings',
    permissions: ['bookings:view'],
    section: 'Bookings',
  },
  {
    label: 'e-Sim',
    path: '/bookings/esim',
    icon: 'bookings',
    permissions: ['bookings:view'],
    section: 'Bookings',
  },
  {
    label: 'Insurance',
    path: '/bookings/insurance',
    icon: 'bookings',
    permissions: ['bookings:view'],
    section: 'Bookings',
  },
  {
    label: 'Partial Payments',
    path: '/bookings/partial-payments',
    icon: 'payments',
    permissions: ['bookings:view', 'payments:customer'],
    section: 'Bookings',
  },
  {
    label: 'New Booking',
    path: '/bookings/new',
    icon: 'bookings',
    permissions: ['bookings:create'],
    section: 'Bookings',
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
    section: 'Finance',
  },
  {
    label: 'Instant Payment',
    path: '/payments/instant',
    icon: 'payments',
    permissions: ['payments:customer'],
    section: 'Payments',
  },
  {
    label: 'Send Payment Request',
    path: '/payments/requests',
    icon: 'payments',
    permissions: ['payments:customer'],
    section: 'Payments',
  },
  {
    label: 'Customer Payments',
    path: '/payments/customers',
    icon: 'payments',
    permissions: ['payments:customer'],
    section: 'Payments',
  },
  {
    label: 'Payment History',
    path: '/payments/history',
    icon: 'payments',
    permissions: ['payments:customer'],
    section: 'Payments',
  },
  {
    label: 'Supplier Payments',
    path: '/payments/suppliers',
    icon: 'payments',
    permissions: ['payments:supplier'],
    section: 'Payments',
  },
  {
    label: 'Expenses',
    path: '/expenses',
    icon: 'expenses',
    permissions: ['expenses:view'],
    section: 'Finance',
  },
  {
    label: 'Transfers',
    path: '/transfers',
    icon: 'accounts',
    permissions: ['transfers:create'],
    section: 'Payments',
  },
  {
    label: 'Payment Settings',
    path: '/settings/payment',
    icon: 'accounts',
    permissions: ['accounts:view'],
    section: 'Payments',
  },
  {
    label: 'Bank List',
    path: '/settings/payment/banks',
    icon: 'accounts',
    permissions: ['accounts:view'],
    section: 'Payments',
    hiddenFromNav: true,
  },
  {
    label: 'MFS List',
    path: '/settings/payment/mfs',
    icon: 'payments',
    permissions: ['accounts:view'],
    section: 'Payments',
    hiddenFromNav: true,
  },
  {
    label: 'Reminders',
    path: '/reminders',
    icon: 'reminders',
    permissions: ['reminders:view'],
  },
  {
    label: 'Sales Report',
    path: '/reports/sales',
    icon: 'reports',
    permissions: ['reports:view'],
    section: 'Reports',
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: 'reports',
    permissions: ['reports:view'],
    section: 'Reports',
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
    section: 'Settings',
  },
  {
    label: 'Notifications',
    path: '/settings/notifications',
    icon: 'reminders',
    permissions: ['notifications:view', 'notifications:manage', 'settings:manage'],
    section: 'Settings',
  },
  {
    label: 'Payment Accounts',
    path: '/settings/payment-accounts',
    icon: 'accounts',
    permissions: ['accounts:view', 'settings:manage', 'notifications:view'],
    section: 'Settings',
  },
  {
    label: 'SMS Settings',
    path: '/settings/sms',
    icon: 'reminders',
    permissions: ['notifications:view', 'notifications:manage', 'settings:manage'],
    hiddenFromNav: true,
  },
  {
    label: 'Email Settings',
    path: '/settings/email',
    icon: 'reminders',
    permissions: ['notifications:view', 'notifications:manage', 'settings:manage'],
    hiddenFromNav: true,
  },
  {
    label: 'WhatsApp Settings',
    path: '/settings/whatsapp',
    icon: 'reminders',
    permissions: ['notifications:view', 'notifications:manage', 'settings:manage'],
    hiddenFromNav: true,
  },
  {
    label: 'Notification Templates',
    path: '/settings/notification-templates',
    icon: 'cms',
    permissions: ['notifications:view', 'notifications:manage', 'settings:manage'],
    hiddenFromNav: true,
  },
  {
    label: 'Notification Logs',
    path: '/notifications/logs',
    icon: 'reports',
    permissions: ['notifications:view', 'notifications:manage', 'settings:manage'],
    hiddenFromNav: true,
  },
  {
    label: 'Users',
    path: '/users',
    icon: 'users',
    permissions: ['users:view'],
    section: 'Administration',
  },
  {
    label: 'Roles & Permissions',
    path: '/roles',
    icon: 'security',
    permissions: ['roles:manage'],
    section: 'Administration',
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
  return user?.role === 'demo' || user?.role === 'viewer';
}

export function getVisibleNavItems(user) {
  if (!user) return [];
  return NAV_ITEMS.filter((item) =>
    !item.hiddenFromNav && hasPermission(user.permissions, user.role, item.permissions)
  );
}

export default NAV_ITEMS;
