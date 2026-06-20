/** Mirror of backend field group keys for UI gating */

export const FIELD_GROUPS = {
  finance: { label: 'Pricing & profit' },
  payments: { label: 'Payment amounts & accounts' },
  balances: { label: 'Account balances' },
  status: { label: 'Status & approval' },
  notes: { label: 'Internal notes' },
};

export function resolveFieldGroupMode(fieldAccess, groupKey) {
  return fieldAccess?.[groupKey] || 'hidden';
}

export function isFieldHidden(fieldAccess, groupKey) {
  return resolveFieldGroupMode(fieldAccess, groupKey) === 'hidden';
}

export function isFieldReadOnly(fieldAccess, groupKey) {
  const mode = resolveFieldGroupMode(fieldAccess, groupKey);
  return mode === 'readonly' || mode === 'hidden';
}

export default {
  FIELD_GROUPS,
  resolveFieldGroupMode,
  isFieldHidden,
  isFieldReadOnly,
};
