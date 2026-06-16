export const AGENT_TYPES = ['regular', 'corporate', 'franchise'];

export const AGENT_BOOKING_STATUSES = [
  'pending',
  'processing',
  'confirmed',
  'cancelled',
  'reissued',
  'refunded',
];

export const AGENT_BOOKING_TYPES = ['standard', 'reissue', 'refund', 'void'];

export const AGENT_TRAVEL_CLASSES = ['economy', 'business', 'first'];

export const AGENT_PASSENGER_TITLES = ['Mr', 'Mrs', 'Ms', 'Child', 'Infant'];

export const AGENT_MEAL_PREFERENCES = ['None', 'Veg', 'Non-Veg', 'Halal', 'Kosher'];

export const AGENT_SEAT_PREFERENCES = ['Window', 'Aisle', 'No Preference'];

export const AGENT_TRANSACTION_TYPES = ['debit', 'credit'];

export const AGENT_NOTIFICATION_TYPES = [
  'booking_confirmed',
  'booking_cancelled',
  'general',
  'payment',
];

export const AGENT_AIRLINES = [
  'Biman Bangladesh Airlines',
  'US-Bangla Airlines',
  'Novoair',
  'Emirates',
  'Qatar Airways',
  'Saudia',
  'Etihad Airways',
  'Turkish Airlines',
  'Singapore Airlines',
  'Other',
];

export default {
  AGENT_TYPES,
  AGENT_BOOKING_STATUSES,
  AGENT_BOOKING_TYPES,
  AGENT_TRAVEL_CLASSES,
  AGENT_PASSENGER_TITLES,
  AGENT_MEAL_PREFERENCES,
  AGENT_SEAT_PREFERENCES,
  AGENT_TRANSACTION_TYPES,
  AGENT_NOTIFICATION_TYPES,
  AGENT_AIRLINES,
};
