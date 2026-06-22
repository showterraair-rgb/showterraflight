export const ORDER_STATUSES = [
  'inquiry', 'quoted', 'pending_purchase', 'purchased',
  'ticket_added', 'delivered', 'closed', 'cancelled',
];

export const ORDER_STATUS_LABELS = {
  inquiry: 'Inquiry',
  quoted: 'Quoted',
  pending_purchase: 'Pending Purchase',
  purchased: 'Purchased',
  ticket_added: 'Ticket Added',
  delivered: 'Delivered',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export const ORDER_SOURCES = ['website', 'phone', 'whatsapp', 'walk_in'];
export const ORDER_SOURCE_LABELS = {
  website: 'Website',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  walk_in: 'Walk-in',
};

export const BOOKING_STATUSES = [
  'draft', 'confirmed', 'ticket_issued', 'delivered', 'completed', 'cancelled',
  'voided', 'refunded', 'reissued',
];

export const BOOKING_STATUS_LABELS = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  ticket_issued: 'Ticket Issued',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  voided: 'Voided',
  refunded: 'Refund Completed',
  reissued: 'Reissued',
};

export const PRODUCT_CATEGORIES = ['air', 'hotel', 'esim', 'insurance', 'package', 'other'];

export const PRODUCT_CATEGORY_LABELS = {
  air: 'Flight',
  hotel: 'Hotel',
  esim: 'e-Sim',
  insurance: 'Insurance',
  package: 'Package',
  other: 'Other',
};

export const JOURNEY_TYPES = ['one_way', 'round_trip', 'multi_city'];
export const JOURNEY_LABELS = { one_way: 'One Way', round_trip: 'Round Trip', multi_city: 'Multi City' };

export const TRAVEL_CLASSES = ['economy', 'premium_economy', 'business', 'first'];
export const CLASS_LABELS = {
  economy: 'Economy',
  premium_economy: 'Premium Economy',
  business: 'Business',
  first: 'First Class',
};

export const APPROVAL_STATUSES = ['pending', 'checking', 'processing', 'approved'];

export const APPROVAL_STATUS_LABELS = {
  pending: 'Pending',
  checking: 'Checking',
  processing: 'Processing',
  approved: 'Approved',
};

export const SUPPLIER_TYPES = ['agent', 'supplier', 'airline_office', 'other'];

export const USER_ROLES = [
  'admin',
  'administrator',
  'manager',
  'accountant',
  'booking_officer',
  'sales_executive',
  'support',
  'viewer',
  'executive',
  'demo',
];

export const USER_ROLE_LABELS = {
  admin: 'Super Admin',
  administrator: 'Admin',
  manager: 'Manager',
  accountant: 'Accountant',
  booking_officer: 'Booking Officer',
  sales_executive: 'Sales Executive',
  support: 'Support',
  viewer: 'Viewer',
  executive: 'Executive (legacy)',
  demo: 'Demo (legacy)',
};

export const STATUS_COLORS = {
  inquiry: 'bg-slate-100 text-slate-700',
  quoted: 'bg-blue-100 text-blue-700',
  pending_purchase: 'bg-amber-100 text-amber-800',
  purchased: 'bg-indigo-100 text-indigo-700',
  ticket_added: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  closed: 'bg-slate-200 text-slate-600',
  cancelled: 'bg-red-100 text-red-700',
  draft: 'bg-slate-100 text-slate-600',
  confirmed: 'bg-blue-100 text-blue-700',
  ticket_issued: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  voided: 'bg-slate-800 text-white',
  refunded: 'bg-teal-100 text-teal-800',
  reissued: 'bg-indigo-100 text-indigo-800',
  pending: 'bg-amber-100 text-amber-800',
  checking: 'bg-sky-100 text-sky-800',
  processing: 'bg-indigo-100 text-indigo-700',
  approved: 'bg-green-100 text-green-800',
  sent: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  dismissed: 'bg-slate-200 text-slate-600',
  success: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
};
