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
  },
  {
    label: 'Bookings',
    path: '/bookings',
    icon: 'bookings',
    permissions: ['bookings:view'],
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
    label: 'Users',
    path: '/users',
    icon: 'users',
    permissions: ['users:view'],
  },
];

export function hasPermission(userPermissions, role, required) {
  if (!required?.length) return true;
  if (role === 'admin' || userPermissions?.includes('*')) return true;
  return required.some((p) => userPermissions?.includes(p));
}

export function getVisibleNavItems(user) {
  if (!user) return [];
  return NAV_ITEMS.filter((item) =>
    hasPermission(user.permissions, user.role, item.permissions)
  );
}

export default NAV_ITEMS;
