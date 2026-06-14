/**
 * Application-wide constants for Show Terra Air
 */

export const ROLES = {
  ADMIN: 'admin',
  ACCOUNTANT: 'accountant',
  EXECUTIVE: 'executive',
};

export const ORDER_SOURCES = ['website', 'phone', 'whatsapp', 'walk_in'];

export const ORDER_STATUSES = [
  'inquiry',
  'quoted',
  'pending_purchase',
  'purchased',
  'ticket_added',
  'delivered',
  'closed',
  'cancelled',
];

export const BOOKING_STATUSES = [
  'draft',
  'confirmed',
  'ticket_issued',
  'delivered',
  'completed',
  'cancelled',
];

export const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

export const JOURNEY_TYPES = ['one_way', 'round_trip', 'multi_city'];

export const TRAVEL_CLASSES = ['economy', 'premium_economy', 'business', 'first'];

export const ACCOUNT_TYPES = ['cash', 'bank', 'bkash', 'nagad'];

export const ACCOUNT_TYPE_LABELS = {
  cash: 'Cash in Hand',
  bank: 'Bank Account',
  bkash: 'bKash',
  nagad: 'Nagad',
};

export const TRANSACTION_TYPES = [
  'customer_payment',
  'supplier_payment',
  'expense',
  'transfer_out',
  'transfer_in',
  'opening_balance',
  'adjustment',
  'refund',
];

export const REMINDER_TYPES = [
  'customer_due',
  'booking_travel',
  'supplier_payable',
  'recurring_expense',
  'manual_task',
];

export const REMINDER_STATUSES = ['pending', 'sent', 'failed', 'completed', 'dismissed'];

export const CMS_PAGE_KEYS = ['home', 'about', 'services', 'contact', 'faq', 'booking'];

export const AUDIT_ACTIONS = [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'export',
  'backup',
  'restore',
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Office Rent',
  'Utility Bills',
  'Staff Salary',
  'Internet',
  'Marketing',
  'Transport',
  'Office Supplies',
  'Software Subscription',
  'Bank Charges',
  'Taxes / License',
  'Food / Meeting',
  'Other Costs',
];

export const COMPANY_DEFAULTS = {
  name: 'Show Terra Air',
  address: 'GASBARI BAZAR, GROUND FLOOR OF BRAC BANK, KANAIGHAT, SYLHET-3183, Bangladesh',
  email: 'showterraair@gmail.com',
  whatsapp: '01741148529',
  directorName: 'Kamil Hussen',
  directorPhone: '01316160206',
  ownerEmail: 'k.h.kamil74@gmail.com',
  currency: 'BDT',
  timezone: 'Asia/Dhaka',
};

export default {
  ROLES,
  ORDER_SOURCES,
  ORDER_STATUSES,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  JOURNEY_TYPES,
  TRAVEL_CLASSES,
  ACCOUNT_TYPES,
  TRANSACTION_TYPES,
  REMINDER_TYPES,
  CMS_PAGE_KEYS,
  AUDIT_ACTIONS,
};
