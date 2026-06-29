import { formatDateValue } from './notificationContext.js';
import { formatCurrency } from './currencyUtils.js';

export function buildAgentBookingNotificationContext(agent, booking, extra = {}) {
  const route = booking.fromCity && booking.toCity
    ? `${booking.fromCity} → ${booking.toCity}`
    : extra.vars?.route || '';

  const totalBRL = booking.totalFareBRL ?? booking.originalTotalFare ?? booking.totalFare ?? 0;

  return {
    ...(extra.recipientType ? { recipientType: extra.recipientType } : {}),
    bookingId: booking._id?.toString?.() || booking.id,
    agentId: agent._id?.toString?.() || agent.id,
    agentPhone: agent.phone || '',
    agentWhatsapp: agent.whatsapp || agent.phone || '',
    agentEmail: agent.email || '',
    vars: {
      agentName: agent.companyName || agent.contactPerson || '',
      bookingRef: booking.bookingRef || '',
      route,
      airline: booking.airline || '',
      departureDate: formatDateValue(booking.departureDate),
      pnr: booking.pnr || '',
      totalFare: formatCurrency(totalBRL, 'BRL'),
      ...extra.vars,
    },
  };
}
