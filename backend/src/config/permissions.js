/**
 * Role-based permission matrix for Show Terra Air admin panel.
 * Used by authorize() middleware in Phase 2+.
 *
 * Permission naming: module:action
 * Wildcard module:* grants all actions within a module.
 */

import { ROLES } from '../config/constants.js';

export const PERMISSIONS = {
  // Dashboard
  'dashboard:view': 'View dashboard metrics and summaries',

  // Orders
  'orders:view': 'View orders list and details',
  'orders:create': 'Create manual orders',
  'orders:update': 'Update order status, notes, follow-ups',
  'orders:delete': 'Delete or cancel orders',
  'orders:import': 'Import website booking requests into orders',

  // Bookings
  'bookings:view': 'View bookings and ticket details',
  'bookings:create': 'Create bookings from orders',
  'bookings:update': 'Update booking, ticket, pricing',
  'bookings:delete': 'Delete draft bookings',

  // Customers
  'customers:view': 'View customer profiles and history',
  'customers:create': 'Create customer records',
  'customers:update': 'Update customer info, notes, tags',
  'customers:delete': 'Archive/delete customers',

  // Suppliers
  'suppliers:view': 'View supplier profiles and ledgers',
  'suppliers:create': 'Create supplier records',
  'suppliers:update': 'Update supplier info',
  'suppliers:delete': 'Archive/delete suppliers',

  // Accounting
  'accounts:view': 'View account balances and statements',
  'accounts:manage': 'Manage opening balances and adjustments',
  'payments:customer': 'Record customer payments',
  'payments:supplier': 'Record supplier payments',
  'transfers:create': 'Transfer between accounts',

  // Expenses
  'expenses:view': 'View expenses and reports',
  'expenses:create': 'Add expenses',
  'expenses:update': 'Edit expenses',
  'expenses:delete': 'Delete expenses',
  'expenses:recurring': 'Manage recurring expense templates',

  // Reminders
  'reminders:view': 'View reminders',
  'reminders:manage': 'Create, complete, dismiss reminders',

  // Reports
  'reports:view': 'View all reports',
  'reports:export': 'Export PDF/Excel reports',

  // CMS
  'cms:view': 'View CMS content',
  'cms:manage': 'Edit pages, notices, logo, SEO',

  // Users & Security
  'users:view': 'View staff users',
  'users:manage': 'Create/edit/deactivate users',
  'audit:view': 'View audit and login logs',
  'backup:manage': 'Trigger and view backups',
  'settings:manage': 'Company settings',
  'notifications:view': 'View notification settings and logs',
  'notifications:manage': 'Manage SMS, email, templates, and automation',
};

/** @type {Record<string, string[]>} */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['*'],

  [ROLES.ACCOUNTANT]: [
    'dashboard:view',
    'orders:view',
    'orders:update',
    'orders:delete',
    'bookings:view',
    'bookings:update',
    'bookings:delete',
    'customers:view',
    'customers:create',
    'customers:update',
    'customers:delete',
    'suppliers:view',
    'suppliers:create',
    'suppliers:update',
    'suppliers:delete',
    'accounts:view',
    'accounts:manage',
    'payments:customer',
    'payments:supplier',
    'transfers:create',
    'expenses:view',
    'expenses:create',
    'expenses:update',
    'expenses:recurring',
    'reminders:view',
    'reminders:manage',
    'reports:view',
    'reports:export',
    'cms:view',
    'audit:view',
  ],

  [ROLES.EXECUTIVE]: [
    'dashboard:view',
    'orders:view',
    'orders:create',
    'orders:update',
    'orders:delete',
    'orders:import',
    'bookings:view',
    'bookings:create',
    'bookings:update',
    'bookings:delete',
    'customers:view',
    'customers:create',
    'customers:update',
    'customers:delete',
    'suppliers:view',
    'suppliers:create',
    'suppliers:update',
    'suppliers:delete',
    'reminders:view',
    'reminders:manage',
    'cms:view',
  ],
};

/**
 * Check if a role has a specific permission.
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const grants = ROLE_PERMISSIONS[role] || [];
  if (grants.includes('*')) return true;

  if (grants.includes(permission)) return true;

  const [module] = permission.split(':');
  return grants.includes(`${module}:*`);
}

export default ROLE_PERMISSIONS;
