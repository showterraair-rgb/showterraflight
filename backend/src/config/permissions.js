/**
 * Role-based permission matrix for Show Terra Air admin panel.
 * DB Role documents override defaults when present (see permissions.service.js).
 */

import { ROLES } from './constants.js';

export const PERMISSIONS = {
  'dashboard:view': 'View dashboard metrics and summaries',

  'orders:view': 'View orders list and details',
  'orders:create': 'Create manual orders',
  'orders:update': 'Update order status, notes, follow-ups',
  'orders:delete': 'Delete or cancel orders',
  'orders:import': 'Import website booking requests into orders',
  'orders:approve': 'Approve or change order approval status',

  'bookings:view': 'View bookings and ticket details',
  'bookings:create': 'Create bookings from orders',
  'bookings:update': 'Update booking, ticket, pricing',
  'bookings:delete': 'Delete draft bookings',
  'bookings:approve': 'Approve bookings and change approval status',
  'bookings:export': 'Export or print booking documents',

  'customers:view': 'View customer profiles and history',
  'customers:create': 'Create customer records',
  'customers:update': 'Update customer info, notes, tags',
  'customers:delete': 'Archive/delete customers',

  'suppliers:view': 'View supplier profiles and ledgers',
  'suppliers:create': 'Create supplier records',
  'suppliers:update': 'Update supplier info',
  'suppliers:delete': 'Archive/delete suppliers',

  'accounts:view': 'View account balances and statements',
  'accounts:manage': 'Manage opening balances and adjustments',
  'payments:customer': 'Record customer payments',
  'payments:supplier': 'Record supplier payments',
  'payments:delete': 'Void or delete payment records',
  'transfers:create': 'Transfer between accounts',

  'expenses:view': 'View expenses and reports',
  'expenses:create': 'Add expenses',
  'expenses:update': 'Edit expenses',
  'expenses:delete': 'Delete expenses',
  'expenses:recurring': 'Manage recurring expense templates',

  'reminders:view': 'View reminders',
  'reminders:manage': 'Create, complete, dismiss reminders',

  'reports:view': 'View all reports',
  'reports:export': 'Export PDF/Excel reports',

  'cms:view': 'View CMS content',
  'cms:manage': 'Edit pages, notices, logo, SEO',

  'users:view': 'View staff users',
  'users:manage': 'Create/edit/deactivate users',
  'roles:manage': 'Edit role permission matrix',
  'audit:view': 'View audit and login logs',
  'backup:manage': 'Trigger and view backups',
  'settings:manage': 'Company and system settings',
  'notifications:view': 'View notification settings and logs',
  'notifications:manage': 'Manage SMS, email, WhatsApp, templates',

  'agents:view': 'View B2B agent accounts',
  'agents:manage': 'Create, edit, and deactivate B2B agents',
  'agent-bookings:view': 'View agent ticket requests',
  'agent-bookings:manage': 'Process and confirm agent bookings',
  'agent-accounting:view': 'View agent ledger and balances',
  'agent-accounting:manage': 'Record agent credits and debits',

  'fields:finance:view': 'View purchase/sale/cost/profit/due fields',
  'fields:finance:edit': 'Edit pricing and cost fields',
  'fields:payments:view': 'View payment amount and account fields',
  'fields:payments:edit': 'Edit payment amount and account fields',
  'fields:balances:view': 'View account balance fields',
  'fields:balances:edit': 'Edit account balance fields',
  'fields:status:view': 'View status and approval fields',
  'fields:status:edit': 'Change status and approval fields',
  'fields:notes:view': 'View internal notes',
  'fields:notes:edit': 'Edit internal notes',
};

const VIEW_ONLY_MODULES = [
  'dashboard:view',
  'orders:view',
  'bookings:view',
  'customers:view',
  'suppliers:view',
  'accounts:view',
  'expenses:view',
  'reminders:view',
  'reports:view',
  'cms:view',
  'agents:view',
  'agent-bookings:view',
  'agent-accounting:view',
  'notifications:view',
  'fields:finance:view',
  'fields:payments:view',
  'fields:balances:view',
  'fields:status:view',
  'fields:notes:view',
];

const SALES_OPS = [
  'dashboard:view',
  'orders:view', 'orders:create', 'orders:update', 'orders:delete', 'orders:import',
  'bookings:view', 'bookings:create', 'bookings:update', 'bookings:delete', 'bookings:export',
  'customers:view', 'customers:create', 'customers:update', 'customers:delete',
  'suppliers:view', 'suppliers:create', 'suppliers:update',
  'reminders:view', 'reminders:manage',
  'cms:view',
  'fields:status:view', 'fields:status:edit',
  'fields:notes:view', 'fields:notes:edit',
  'fields:finance:view',
];

const BOOKING_OPS = [
  'dashboard:view',
  'orders:view', 'orders:create', 'orders:update',
  'bookings:view', 'bookings:create', 'bookings:update', 'bookings:export',
  'customers:view', 'customers:create', 'customers:update',
  'suppliers:view',
  'reminders:view', 'reminders:manage',
  'cms:view',
  'fields:status:view', 'fields:status:edit',
  'fields:notes:view', 'fields:notes:edit',
  'fields:finance:view',
  'fields:payments:view',
];

const ACCOUNTANT_PERMS = [
  'dashboard:view',
  'orders:view', 'orders:update',
  'bookings:view', 'bookings:update',
  'customers:view', 'customers:create', 'customers:update', 'customers:delete',
  'suppliers:view', 'suppliers:create', 'suppliers:update', 'suppliers:delete',
  'accounts:view', 'accounts:manage',
  'payments:customer', 'payments:supplier',
  'transfers:create',
  'expenses:view', 'expenses:create', 'expenses:update', 'expenses:recurring',
  'reminders:view', 'reminders:manage',
  'reports:view', 'reports:export',
  'agents:view', 'agent-bookings:view', 'agent-accounting:view', 'agent-accounting:manage',
  'cms:view', 'audit:view', 'notifications:view',
  'fields:finance:view', 'fields:finance:edit',
  'fields:payments:view', 'fields:payments:edit',
  'fields:balances:view', 'fields:balances:edit',
  'fields:status:view', 'fields:notes:view', 'fields:notes:edit',
];

const MANAGER_PERMS = [
  ...SALES_OPS,
  'orders:approve', 'bookings:approve',
  'suppliers:delete',
  'accounts:view',
  'payments:customer',
  'expenses:view',
  'reports:view', 'reports:export',
  'agents:view', 'agent-bookings:view', 'agent-accounting:view',
  'users:view', 'audit:view', 'notifications:view',
  'fields:finance:view',
  'fields:payments:view',
  'fields:balances:view',
];

const ADMINISTRATOR_PERMS = [
  ...MANAGER_PERMS,
  'orders:delete', 'bookings:delete',
  'payments:supplier', 'payments:delete',
  'expenses:create', 'expenses:update', 'expenses:delete', 'expenses:recurring',
  'transfers:create',
  'accounts:manage',
  'cms:manage',
  'agents:manage', 'agent-bookings:manage', 'agent-accounting:manage',
  'users:manage', 'roles:manage',
  'notifications:manage',
  'settings:manage',
  'fields:finance:edit',
  'fields:payments:edit',
  'fields:balances:edit',
];

const SUPPORT_PERMS = [
  'dashboard:view',
  'orders:view', 'orders:update',
  'bookings:view',
  'customers:view', 'customers:update',
  'suppliers:view',
  'reminders:view', 'reminders:manage',
  'cms:view',
  'fields:status:view',
  'fields:notes:view', 'fields:notes:edit',
];

/** @type {Record<string, string[]>} */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['*'],
  [ROLES.ADMINISTRATOR]: ADMINISTRATOR_PERMS,
  [ROLES.MANAGER]: MANAGER_PERMS,
  [ROLES.ACCOUNTANT]: ACCOUNTANT_PERMS,
  [ROLES.BOOKING_OFFICER]: BOOKING_OPS,
  [ROLES.SALES_EXECUTIVE]: SALES_OPS,
  [ROLES.SUPPORT]: SUPPORT_PERMS,
  [ROLES.VIEWER]: [...VIEW_ONLY_MODULES, 'audit:view', 'users:view'],
  [ROLES.EXECUTIVE]: SALES_OPS,
  [ROLES.DEMO]: [...VIEW_ONLY_MODULES, 'audit:view', 'users:view'],
};

export const PERMISSION_MODULES = [
  { key: 'dashboard', label: 'Dashboard', permissions: ['dashboard:view'] },
  { key: 'orders', label: 'Orders', permissions: ['orders:view', 'orders:create', 'orders:update', 'orders:delete', 'orders:import', 'orders:approve'] },
  { key: 'bookings', label: 'Bookings', permissions: ['bookings:view', 'bookings:create', 'bookings:update', 'bookings:delete', 'bookings:approve', 'bookings:export'] },
  { key: 'customers', label: 'Customers', permissions: ['customers:view', 'customers:create', 'customers:update', 'customers:delete'] },
  { key: 'suppliers', label: 'Suppliers', permissions: ['suppliers:view', 'suppliers:create', 'suppliers:update', 'suppliers:delete'] },
  { key: 'accounts', label: 'Accounts', permissions: ['accounts:view', 'accounts:manage'] },
  { key: 'payments', label: 'Payments', permissions: ['payments:customer', 'payments:supplier', 'payments:delete', 'transfers:create'] },
  { key: 'expenses', label: 'Expenses', permissions: ['expenses:view', 'expenses:create', 'expenses:update', 'expenses:delete', 'expenses:recurring'] },
  { key: 'reminders', label: 'Reminders', permissions: ['reminders:view', 'reminders:manage'] },
  { key: 'reports', label: 'Reports', permissions: ['reports:view', 'reports:export'] },
  { key: 'cms', label: 'CMS', permissions: ['cms:view', 'cms:manage'] },
  { key: 'agents', label: 'Agents', permissions: ['agents:view', 'agents:manage', 'agent-bookings:view', 'agent-bookings:manage', 'agent-accounting:view', 'agent-accounting:manage'] },
  { key: 'users', label: 'Users & Security', permissions: ['users:view', 'users:manage', 'roles:manage', 'audit:view', 'backup:manage', 'settings:manage'] },
  { key: 'notifications', label: 'Notifications', permissions: ['notifications:view', 'notifications:manage'] },
  { key: 'fields', label: 'Sensitive fields', permissions: [
    'fields:finance:view', 'fields:finance:edit',
    'fields:payments:view', 'fields:payments:edit',
    'fields:balances:view', 'fields:balances:edit',
    'fields:status:view', 'fields:status:edit',
    'fields:notes:view', 'fields:notes:edit',
  ] },
];

/**
 * @param {string} role
 * @param {string} permission
 * @param {string[]|null} [grants]
 */
export function hasPermission(role, permission, grants = null) {
  const list = grants ?? ROLE_PERMISSIONS[role] ?? [];
  if (list.includes('*')) return true;
  if (list.includes(permission)) return true;
  const [module] = permission.split(':');
  return list.includes(`${module}:*`);
}

export function mergePermissionOverrides(baseGrants, { grants = [], denies = [] } = {}) {
  const set = new Set(baseGrants);
  for (const g of grants) set.add(g);
  for (const d of denies) set.delete(d);
  if (set.has('*')) return ['*'];
  return [...set];
}

export default ROLE_PERMISSIONS;
