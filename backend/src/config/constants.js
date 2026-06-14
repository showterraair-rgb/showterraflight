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

export const MOBILE_BANKING_TYPES = ['bkash', 'nagad'];

export const NOTIFICATION_EVENT_TYPES = [
  'website_order_created',
  'manual_order_created',
  'admin_new_booking_alert',
  'booking_approved',
  'ticket_issued',
  'payment_received',
  'payment_due_reminder',
  'booking_canceled',
];

export const NOTIFICATION_LOG_STATUSES = ['pending', 'sent', 'failed'];

export const DEFAULT_NOTIFICATION_TEMPLATES = [
  {
    templateKey: 'website_order_created',
    name: 'Website order received',
    smsBody: 'Thank you {{customerName}}. We received your travel request {{orderNumber}}. Show Terra Flight will contact you shortly.',
    emailSubject: 'We received your travel request — {{orderNumber}}',
    emailBody: 'Hello {{customerName}},\n\nThank you for submitting your travel request ({{orderNumber}}). Our team will review it and contact you on {{customerPhone}}.\n\n— Show Terra Flight',
  },
  {
    templateKey: 'manual_order_created',
    name: 'Manual booking created',
    smsBody: 'Hello {{customerName}}, your booking {{bookingNumber}} has been created. Sale amount: ৳{{salePrice}}. — Show Terra Flight',
    emailSubject: 'Your booking {{bookingNumber}} has been created',
    emailBody: 'Hello {{customerName}},\n\nYour booking {{bookingNumber}} is recorded.\nRoute: {{route}}\nDeparture: {{departureDate}}\nAmount: ৳{{salePrice}}\n\n— Show Terra Flight',
  },
  {
    templateKey: 'admin_new_booking_alert',
    name: 'Admin alert — new website order',
    smsBody: 'New website order {{orderNumber}} from {{customerName}} ({{customerPhone}}). Route: {{route}}',
    emailSubject: 'New website order — {{orderNumber}}',
    emailBody: 'A new website booking request was submitted.\n\nOrder: {{orderNumber}}\nCustomer: {{customerName}}\nPhone: {{customerPhone}}\nRoute: {{route}}\n\nPlease review in admin panel.',
  },
  {
    templateKey: 'booking_approved',
    name: 'Booking approved',
    smsBody: 'Good news {{customerName}}! Booking {{bookingNumber}} is approved. We will issue your ticket soon. — Show Terra Flight',
    emailSubject: 'Booking {{bookingNumber}} approved',
    emailBody: 'Hello {{customerName}},\n\nYour booking {{bookingNumber}} has been approved.\n\n— Show Terra Flight',
  },
  {
    templateKey: 'ticket_issued',
    name: 'Ticket issued',
    smsBody: 'Ticket issued for booking {{bookingNumber}}. PNR: {{pnr}}. Contact us for delivery. — Show Terra Flight',
    emailSubject: 'Ticket issued — {{bookingNumber}}',
    emailBody: 'Hello {{customerName}},\n\nYour ticket for booking {{bookingNumber}} has been issued.\nPNR: {{pnr}}\n\n— Show Terra Flight',
  },
  {
    templateKey: 'payment_received',
    name: 'Payment received',
    smsBody: 'Payment of ৳{{amount}} received for booking {{bookingNumber}}. Thank you {{customerName}}. — Show Terra Flight',
    emailSubject: 'Payment received — ৳{{amount}}',
    emailBody: 'Hello {{customerName}},\n\nWe received your payment of ৳{{amount}} for booking {{bookingNumber}}.\nReference: {{paymentNumber}}\n\n— Show Terra Flight',
  },
  {
    templateKey: 'payment_due_reminder',
    name: 'Payment due reminder',
    smsBody: 'Reminder: ৳{{dueAmount}} is due for booking {{bookingNumber}}. Please pay to confirm. — Show Terra Flight',
    emailSubject: 'Payment reminder — booking {{bookingNumber}}',
    emailBody: 'Hello {{customerName}},\n\nThis is a reminder that ৳{{dueAmount}} is outstanding for booking {{bookingNumber}}.\n\n— Show Terra Flight',
  },
  {
    templateKey: 'booking_canceled',
    name: 'Booking canceled',
    smsBody: 'Booking {{bookingNumber}} has been canceled. Contact Show Terra Flight if you have questions.',
    emailSubject: 'Booking {{bookingNumber}} canceled',
    emailBody: 'Hello {{customerName}},\n\nYour booking {{bookingNumber}} has been canceled.\n\n— Show Terra Flight',
  },
];

export const DEFAULT_AUTOMATION_RULES = [
  { eventType: 'website_order_created', notifyCustomer: false, notifyAdmin: false, smsEnabled: true, emailEnabled: true, isEnabled: false },
  { eventType: 'admin_new_booking_alert', notifyCustomer: false, notifyAdmin: true, smsEnabled: true, emailEnabled: true, isEnabled: true },
  { eventType: 'manual_order_created', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, isEnabled: true },
  { eventType: 'booking_approved', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, isEnabled: true },
  { eventType: 'ticket_issued', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, isEnabled: true },
  { eventType: 'payment_received', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, isEnabled: true },
  { eventType: 'payment_due_reminder', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, isEnabled: true },
  { eventType: 'booking_canceled', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, isEnabled: true },
];

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
  ACCOUNT_TYPE_LABELS,
  MOBILE_BANKING_TYPES,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_LOG_STATUSES,
  TRANSACTION_TYPES,
  REMINDER_TYPES,
  CMS_PAGE_KEYS,
  AUDIT_ACTIONS,
};
