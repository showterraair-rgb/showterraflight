/**
 * Field-level access groups for sensitive ERP data.
 * Modes: hidden | readonly | editable
 */

export const FIELD_GROUPS = {
  finance: {
    label: 'Pricing & profit',
    fields: [
      'booking.purchasePrice',
      'booking.salePrice',
      'booking.directCosts',
      'booking.profit',
      'booking.customerDue',
      'booking.supplierPayable',
    ],
  },
  payments: {
    label: 'Payment amounts & accounts',
    fields: [
      'booking.customerPaidAmount',
      'booking.supplierPaidAmount',
      'booking.customerPaymentAccount',
      'booking.supplierPaymentAccount',
      'payment.amount',
      'payment.account',
    ],
  },
  balances: {
    label: 'Account balances',
    fields: ['account.balance', 'account.openingBalance', 'dashboard.accountBalances'],
  },
  status: {
    label: 'Status & approval',
    fields: ['booking.status', 'booking.approvalStatus', 'order.status'],
  },
  notes: {
    label: 'Internal notes',
    fields: ['booking.notes', 'order.internalNotes', 'customer.internalNotes'],
  },
};

/** Permissions that gate field groups */
export const FIELD_GROUP_PERMISSIONS = {
  finance: { view: 'fields:finance:view', edit: 'fields:finance:edit' },
  payments: { view: 'fields:payments:view', edit: 'fields:payments:edit' },
  balances: { view: 'fields:balances:view', edit: 'fields:balances:edit' },
  status: { view: 'fields:status:view', edit: 'fields:status:edit' },
  notes: { view: 'fields:notes:view', edit: 'fields:notes:edit' },
};

/**
 * Resolve access mode for a field group given permission grants.
 * @param {string[]} grants
 * @param {string} groupKey
 * @returns {'hidden'|'readonly'|'editable'}
 */
export function resolveFieldGroupMode(grants, groupKey) {
  const perms = FIELD_GROUP_PERMISSIONS[groupKey];
  if (!perms) return 'hidden';
  if (grants.includes('*') || grants.includes(perms.edit)) return 'editable';
  if (grants.includes(perms.view)) return 'readonly';
  return 'hidden';
}

/**
 * Build field access map for client UI.
 * @param {string[]} grants
 * @returns {Record<string, 'hidden'|'readonly'|'editable'>}
 */
export function buildFieldAccessMap(grants) {
  const map = {};
  for (const key of Object.keys(FIELD_GROUPS)) {
    map[key] = resolveFieldGroupMode(grants, key);
  }
  return map;
}

export default {
  FIELD_GROUPS,
  FIELD_GROUP_PERMISSIONS,
  resolveFieldGroupMode,
  buildFieldAccessMap,
};
