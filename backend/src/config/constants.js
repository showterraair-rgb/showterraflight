/**
 * Application-wide constants for Show Terra Air
 */

export const ROLES = {
  ADMIN: 'admin',
  ADMINISTRATOR: 'administrator',
  MANAGER: 'manager',
  ACCOUNTANT: 'accountant',
  BOOKING_OFFICER: 'booking_officer',
  SALES_EXECUTIVE: 'sales_executive',
  SUPPORT: 'support',
  VIEWER: 'viewer',
  /** @deprecated Use sales_executive — kept for existing users */
  EXECUTIVE: 'executive',
  /** @deprecated Use viewer — kept for existing users */
  DEMO: 'demo',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Super Admin',
  [ROLES.ADMINISTRATOR]: 'Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.ACCOUNTANT]: 'Accountant',
  [ROLES.BOOKING_OFFICER]: 'Booking Officer',
  [ROLES.SALES_EXECUTIVE]: 'Sales Executive',
  [ROLES.SUPPORT]: 'Support',
  [ROLES.VIEWER]: 'Viewer',
  [ROLES.EXECUTIVE]: 'Executive (legacy)',
  [ROLES.DEMO]: 'Demo (legacy)',
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
  'voided',
  'refunded',
  'reissued',
];

export const BOOKING_TYPES = ['standard', 'reissue', 'refund', 'void'];

export const BOOKING_OPERATION_TYPES = ['ISSUE', 'REISSUE', 'VOID', 'REFUND', 'CANCEL_REFUND'];

export const BOOKING_OPERATION_STATUSES = ['draft', 'pending', 'approved', 'completed', 'cancelled'];

export const SALE_TYPES = ['direct_customer', 'agent'];

export const PRODUCT_CATEGORIES = ['air', 'hotel', 'esim', 'insurance', 'package', 'other'];

export const PRODUCT_CATEGORY_LABELS = {
  air: 'Flight',
  hotel: 'Hotel',
  esim: 'e-Sim',
  insurance: 'Insurance',
  package: 'Package',
  other: 'Other',
};

export const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

export const APPROVAL_STATUSES = ['pending', 'checking', 'processing', 'approved'];

export const APPROVAL_STATUS_LABELS = {
  pending: 'Pending',
  checking: 'Checking',
  processing: 'Processing',
  approved: 'Approved',
};

/** SMS event fired when approval status changes to this value */
export const APPROVAL_STATUS_SMS_EVENTS = {
  pending: 'approval_pending',
  checking: 'approval_checking',
  processing: 'approval_processing',
  approved: 'approval_approved',
};

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
  'admin_manual_order_alert',
  'admin_manual_booking_alert',
  'approval_pending',
  'approval_checking',
  'approval_processing',
  'approval_approved',
  'booking_approved',
  'ticket_issued',
  'payment_received',
  'payment_due_reminder',
  'supplier_payable_reminder',
  'schedule_change',
  'booking_canceled',
  'void_done',
  'reissue_done',
  'refund_paid',
  'upcoming_flight',
  'daily_ledger_summary',
];

export const NOTIFICATION_LOG_STATUSES = ['pending', 'sent', 'delivered', 'read', 'failed'];

export const NOTIFICATION_CHANNELS = ['sms', 'email', 'whatsapp', 'console'];

/** Default WhatsApp template variable order per event (Meta body params). */
export const DEFAULT_WHATSAPP_PARAM_KEYS = {
  website_order_created: ['customerName', 'orderNumber', 'companyName'],
  manual_order_created: ['customerName', 'bookingNumber', 'route', 'salePrice', 'dueAmount', 'duePaymentDate', 'companyName'],
  admin_new_booking_alert: ['orderNumber', 'customerName', 'customerPhone', 'route'],
  admin_manual_order_alert: ['orderNumber', 'customerName', 'customerPhone', 'route'],
  admin_manual_booking_alert: ['bookingNumber', 'customerName', 'customerPhone', 'route'],
  approval_pending: ['customerName', 'referenceNumber', 'companyName'],
  approval_checking: ['customerName', 'referenceNumber', 'companyName'],
  approval_processing: ['customerName', 'referenceNumber', 'companyName'],
  approval_approved: ['customerName', 'referenceNumber', 'companyName'],
  booking_approved: ['customerName', 'bookingNumber', 'companyName'],
  ticket_issued: ['bookingNumber', 'pnr', 'companyName'],
  payment_received: ['customerName', 'amount', 'bookingNumber', 'companyName'],
  payment_due_reminder: ['dueAmount', 'bookingNumber', 'companyName', 'supportNumber'],
  supplier_payable_reminder: ['supplierName', 'bookingNumber', 'payableAmount', 'companyName'],
  booking_canceled: ['bookingNumber', 'companyName'],
  void_done: ['customerName', 'bookingNumber', 'route', 'companyName'],
  reissue_done: ['customerName', 'bookingNumber', 'newBookingNumber', 'route', 'companyName'],
  refund_paid: ['customerName', 'bookingNumber', 'refundAmount', 'penalty', 'companyName'],
  upcoming_flight: ['customerName', 'bookingNumber', 'route', 'departureDate', 'pnr', 'companyName'],
  daily_ledger_summary: ['reportDate', 'totalBalance', 'bankBalance', 'cashBalance', 'mfsBalance', 'todayOrders', 'todayBookings', 'totalBookings', 'customerDue', 'supplierPayable', 'overdueDue', 'shortSummary'],
};

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
    smsBody: 'Hello {{customerName}}, booking {{bookingNumber}} confirmed. Route: {{route}}. Total: ৳{{salePrice}}. Due: ৳{{dueAmount}} by {{duePaymentDate}}. — Show Terra Flight',
    whatsappBody: 'Hello {{customerName}},\n\nYour booking {{bookingNumber}} is confirmed.\nRoute: {{route}}\nTotal: ৳{{salePrice}}\nDue: ৳{{dueAmount}}\nPay before: {{duePaymentDate}}\n\n— Show Terra Flight',
    emailSubject: 'Your booking {{bookingNumber}} has been created',
    emailBody: 'Hello {{customerName}},\n\nYour booking {{bookingNumber}} is confirmed.\n\nRoute: {{route}}\nTotal: ৳{{salePrice}}\nAmount due: ৳{{dueAmount}}\nDue date: {{duePaymentDate}}\n\n— Show Terra Flight',
  },
  {
    templateKey: 'admin_new_booking_alert',
    name: 'Admin alert — new website order',
    smsBody: 'New website order {{orderNumber}} from {{customerName}} ({{customerPhone}}). Route: {{route}}',
    emailSubject: 'New website order — {{orderNumber}}',
    emailBody: 'A new website booking request was submitted.\n\nOrder: {{orderNumber}}\nCustomer: {{customerName}}\nPhone: {{customerPhone}}\nRoute: {{route}}\n\nPlease review in admin panel.',
  },
  {
    templateKey: 'admin_manual_order_alert',
    name: 'Admin alert — manual order',
    smsBody: 'New manual order {{orderNumber}} — {{customerName}} ({{customerPhone}}). Route: {{route}}. Approval: {{approvalStatus}}',
    emailSubject: 'Manual order — {{orderNumber}}',
    emailBody: 'A manual order was created in admin.\n\nOrder: {{orderNumber}}\nCustomer: {{customerName}}\nPhone: {{customerPhone}}\nRoute: {{route}}',
  },
  {
    templateKey: 'admin_manual_booking_alert',
    name: 'Admin alert — manual booking',
    smsBody: 'New manual booking {{bookingNumber}} — {{customerName}} ({{customerPhone}}). Route: {{route}}. Approval: {{approvalStatus}}',
    emailSubject: 'Manual booking — {{bookingNumber}}',
    emailBody: 'A manual booking was created.\n\nBooking: {{bookingNumber}}\nCustomer: {{customerName}}\nRoute: {{route}}',
  },
  {
    templateKey: 'approval_pending',
    name: 'Approval — pending',
    smsBody: 'Hello {{customerName}}, your request {{referenceNumber}} is received. Status: Pending review. Upload passport if not done. — Show Terra Flight',
    emailSubject: 'Request {{referenceNumber}} — Pending',
    emailBody: 'Hello {{customerName}},\n\nYour travel request {{referenceNumber}} is pending review.\n\n— Show Terra Flight',
  },
  {
    templateKey: 'approval_checking',
    name: 'Approval — checking',
    smsBody: 'Hello {{customerName}}, request {{referenceNumber}} is now under checking. — Show Terra Flight',
    emailSubject: 'Request {{referenceNumber}} — Checking',
    emailBody: 'Hello {{customerName}},\n\nYour request {{referenceNumber}} is being checked.\n\n— Show Terra Flight',
  },
  {
    templateKey: 'approval_processing',
    name: 'Approval — processing',
    smsBody: 'Hello {{customerName}}, request {{referenceNumber}} is processing. We will update you soon. — Show Terra Flight',
    emailSubject: 'Request {{referenceNumber}} — Processing',
    emailBody: 'Hello {{customerName}},\n\nYour request {{referenceNumber}} is processing.\n\n— Show Terra Flight',
  },
  {
    templateKey: 'approval_approved',
    name: 'Approval — approved',
    smsBody: 'Good news {{customerName}}! Request {{referenceNumber}} is APPROVED. We will issue ticket shortly. — Show Terra Flight',
    emailSubject: 'Request {{referenceNumber}} — Approved',
    emailBody: 'Hello {{customerName}},\n\nYour request {{referenceNumber}} has been approved.\n\n— Show Terra Flight',
  },
  {
    templateKey: 'daily_ledger_summary',
    name: 'Daily ledger summary (admin)',
    smsBody: '{{shortSummary}}',
    whatsappBody: '{{shortSummary}}',
    emailSubject: 'Daily summary — {{reportDate}}',
    emailBody: 'Show Terra Flight — {{reportDate}}\n\nAccount ledger: ৳{{totalBalance}}\n  Bank: ৳{{bankBalance}}\n  Cash: ৳{{cashBalance}}\n  MFS (bKash/Nagad): ৳{{mfsBalance}}\n\nOrders today: {{todayOrders}}\nBookings today: {{todayBookings}}\nActive bookings: {{totalBookings}}\n\nCustomer due: ৳{{customerDue}}\nSupplier payable: ৳{{supplierPayable}}\nOverdue due: ৳{{overdueDue}}\nEst. profit: ৳{{grossProfit}}',
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
    whatsappBody: 'Hello {{customerName}},\n\nReminder: ৳{{dueAmount}} is due for booking {{bookingNumber}}.\nDue date: {{duePaymentDate}}\n\n— Show Terra Flight',
    emailSubject: 'Payment reminder — booking {{bookingNumber}}',
    emailBody: 'Hello {{customerName}},\n\nThis is a reminder that ৳{{dueAmount}} is outstanding for booking {{bookingNumber}}.\nDue date: {{duePaymentDate}}\n\n— Show Terra Flight',
  },
  {
    templateKey: 'supplier_payable_reminder',
    name: 'Supplier payable reminder',
    smsBody: 'Reminder: ৳{{payableAmount}} payable for booking {{bookingNumber}} ({{supplierName}}). — Show Terra Flight',
    whatsappBody: 'Hello {{supplierName}},\n\nReminder: ৳{{payableAmount}} is payable for booking {{bookingNumber}}.\nRoute: {{route}}\n\n— Show Terra Flight',
    emailSubject: 'Payment reminder — booking {{bookingNumber}}',
    emailBody: 'Hello {{supplierName}},\n\nThis is a reminder that ৳{{payableAmount}} is outstanding for booking {{bookingNumber}}.\nRoute: {{route}}\n\n— Show Terra Flight',
  },
  {
    templateKey: 'booking_canceled',
    name: 'Booking canceled',
    smsBody: 'Booking {{bookingNumber}} has been canceled. Contact Show Terra Flight if you have questions.',
    emailSubject: 'Booking {{bookingNumber}} canceled',
    emailBody: 'Hello {{customerName}},\n\nYour booking {{bookingNumber}} has been canceled.\n\n— Show Terra Flight',
  },
  {
    templateKey: 'void_done',
    name: 'Booking voided',
    smsBody: 'Hello {{customerName}}, booking {{bookingNumber}} ({{route}}) has been voided. — Show Terra Flight',
    whatsappBody: 'Hello {{customerName}},\n\nBooking {{bookingNumber}} for {{route}} has been voided.\n\n— Show Terra Flight',
    emailSubject: 'Booking {{bookingNumber}} voided',
    emailBody: 'Hello {{customerName}},\n\nYour booking {{bookingNumber}} ({{route}}) has been voided.\n\n— Show Terra Flight',
  },
  {
    templateKey: 'reissue_done',
    name: 'Ticket reissued',
    smsBody: 'Hello {{customerName}}, booking {{bookingNumber}} has been reissued as {{newBookingNumber}}. Route: {{route}}. — Show Terra Flight',
    whatsappBody: 'Hello {{customerName}},\n\nYour ticket {{bookingNumber}} has been reissued.\nNew booking: {{newBookingNumber}}\nRoute: {{route}}\n\n— Show Terra Flight',
    emailSubject: 'Ticket reissued — {{newBookingNumber}}',
    emailBody: 'Hello {{customerName}},\n\nYour booking {{bookingNumber}} has been reissued as {{newBookingNumber}}.\nRoute: {{route}}\n\n— Show Terra Flight',
  },
  {
    templateKey: 'refund_paid',
    name: 'Refund processed',
    smsBody: 'Hello {{customerName}}, refund of ৳{{refundAmount}} for booking {{bookingNumber}} has been processed. Penalty: ৳{{penalty}}. — Show Terra Flight',
    whatsappBody: 'Hello {{customerName}},\n\nRefund of ৳{{refundAmount}} for booking {{bookingNumber}} has been processed.\nPenalty: ৳{{penalty}}\n\n— Show Terra Flight',
    emailSubject: 'Refund processed — {{bookingNumber}}',
    emailBody: 'Hello {{customerName}},\n\nA refund of ৳{{refundAmount}} for booking {{bookingNumber}} has been processed.\nPenalty deducted: ৳{{penalty}}\n\n— Show Terra Flight',
  },
  {
    templateKey: 'upcoming_flight',
    name: 'Upcoming flight reminder',
    smsBody: 'Hello {{customerName}}, reminder: your flight {{bookingNumber}} ({{route}}) departs {{departureDate}}. PNR: {{pnr}}. — Show Terra Flight',
    whatsappBody: 'Hello {{customerName}},\n\nYour flight is coming up.\nBooking: {{bookingNumber}}\nRoute: {{route}}\nDeparture: {{departureDate}}\nPNR: {{pnr}}\n\n— Show Terra Flight',
    emailSubject: 'Upcoming flight — {{bookingNumber}}',
    emailBody: 'Hello {{customerName}},\n\nThis is a reminder that your flight is approaching.\n\nBooking: {{bookingNumber}}\nRoute: {{route}}\nDeparture: {{departureDate}}\nPNR: {{pnr}}\n\n— Show Terra Flight',
  },
];

export const DEFAULT_AUTOMATION_RULES = [
  { eventType: 'website_order_created', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: false, isEnabled: true },
  { eventType: 'admin_new_booking_alert', notifyCustomer: false, notifyAdmin: true, smsEnabled: true, emailEnabled: true, whatsappEnabled: false, isEnabled: true },
  { eventType: 'admin_manual_order_alert', notifyCustomer: false, notifyAdmin: true, smsEnabled: true, emailEnabled: true, whatsappEnabled: false, isEnabled: true },
  { eventType: 'admin_manual_booking_alert', notifyCustomer: false, notifyAdmin: true, smsEnabled: true, emailEnabled: true, whatsappEnabled: false, isEnabled: true },
  { eventType: 'approval_pending', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: false, isEnabled: true },
  { eventType: 'approval_checking', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: false, isEnabled: true },
  { eventType: 'approval_processing', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: false, isEnabled: true },
  { eventType: 'approval_approved', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: false, isEnabled: true },
  { eventType: 'manual_order_created', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: true, isEnabled: true },
  { eventType: 'booking_approved', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: false, isEnabled: true },
  { eventType: 'ticket_issued', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: false, isEnabled: true },
  { eventType: 'payment_received', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: false, isEnabled: true },
  { eventType: 'payment_due_reminder', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: true, isEnabled: true },
  { eventType: 'supplier_payable_reminder', notifyCustomer: false, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: true, isEnabled: true },
  { eventType: 'booking_canceled', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: false, isEnabled: true },
  { eventType: 'void_done', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: true, isEnabled: true },
  { eventType: 'reissue_done', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: true, isEnabled: true },
  { eventType: 'refund_paid', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: true, isEnabled: true },
  { eventType: 'upcoming_flight', notifyCustomer: true, notifyAdmin: false, smsEnabled: true, emailEnabled: true, whatsappEnabled: true, isEnabled: true },
  { eventType: 'daily_ledger_summary', notifyCustomer: false, notifyAdmin: true, smsEnabled: true, emailEnabled: false, whatsappEnabled: true, isEnabled: true },
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
  iataNumber: '42343755',
  emergencyContact: '01741148529',
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
