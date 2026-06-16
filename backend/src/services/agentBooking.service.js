import AgentBooking from '../models/AgentBooking.js';
import AgentNotification from '../models/AgentNotification.js';
import Agent from '../models/Agent.js';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
  buildSearchFilter,
} from '../utils/pagination.js';
import { generateAgentBookingRef } from './numberGenerator.service.js';
import { sendEmailMessage } from './notificationOrchestrator.service.js';

function calcTotalFare({ baseFare, tax, agentMarkup, passengerCount }) {
  const count = Math.max(1, passengerCount || 1);
  return (Number(baseFare || 0) + Number(tax || 0)) * count + Number(agentMarkup || 0);
}

function formatBooking(doc) {
  const agent = doc.agent;
  return {
    id: doc._id.toString(),
    bookingRef: doc.bookingRef,
    agentId: agent?._id?.toString() || agent?.toString(),
    agentCode: agent?.agentId,
    agentCompany: agent?.companyName,
    flightNumber: doc.flightNumber,
    airline: doc.airline,
    fromCity: doc.fromCity,
    toCity: doc.toCity,
    route: `${doc.fromCity} → ${doc.toCity}`,
    departureDate: doc.departureDate,
    departureTime: doc.departureTime || '',
    arrivalDate: doc.arrivalDate,
    arrivalTime: doc.arrivalTime || '',
    travelClass: doc.travelClass,
    pnr: doc.pnr || '',
    passengers: doc.passengers || [],
    passengerCount: doc.passengers?.length || 0,
    baseFare: doc.baseFare,
    tax: doc.tax,
    agentMarkup: doc.agentMarkup,
    totalFare: doc.totalFare,
    currency: doc.currency,
    bookingType: doc.bookingType,
    specialRequests: doc.specialRequests || '',
    baggageAllowance: doc.baggageAllowance || '',
    mealPreference: doc.mealPreference,
    seatPreference: doc.seatPreference,
    ticketIssued: doc.ticketIssued,
    ticketFilePath: doc.ticketFilePath || '',
    ticketFileName: doc.ticketFileName || '',
    ticketUrl: doc.ticketFilePath ? `/uploads/${String(doc.ticketFilePath).replace(/^uploads\//, '')}` : '',
    status: doc.status,
    adminNotes: doc.adminNotes || '',
    statusTimeline: doc.statusTimeline || [],
    confirmedAt: doc.confirmedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildBookingFilter(query, agentId = null) {
  const filter = agentId ? { agent: agentId } : {};
  Object.assign(
    filter,
    buildSearchFilter(query.search, ['bookingRef', 'pnr', 'fromCity', 'toCity', 'airline', 'flightNumber'])
  );

  if (query.status) filter.status = query.status;
  if (query.airline) filter.airline = query.airline;
  if (query.agentId && !agentId) filter.agent = query.agentId;

  if (query.dateFrom || query.dateTo) {
    filter.departureDate = {};
    if (query.dateFrom) filter.departureDate.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.departureDate.$lte = end;
    }
  }

  return filter;
}

async function notifyAdminNewBooking(booking, agent) {
  try {
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'showterraair@gmail.com';
    await sendEmailMessage({
      to: adminEmail,
      subject: `New agent booking ${booking.bookingRef}`,
      message: `Agent ${agent.companyName} (${agent.agentId}) submitted booking ${booking.bookingRef}.\nRoute: ${booking.fromCity} → ${booking.toCity}\nAirline: ${booking.airline}\nTotal: ${booking.currency} ${booking.totalFare}`,
    });
  } catch (err) {
    console.error('[agent-booking] admin notify failed', err.message);
  }
}

async function notifyAgentBooking(agent, booking, title, message, type) {
  await AgentNotification.create({
    agent: agent._id,
    title,
    message,
    type,
    relatedBooking: booking._id,
  });

  try {
    await sendEmailMessage({
      to: agent.email,
      subject: title,
      message,
    });
  } catch (err) {
    console.error('[agent-booking] agent email failed', err.message);
  }
}

export async function createAgentBooking(agentId, data, file = null) {
  const agent = await Agent.findById(agentId);
  if (!agent || !agent.isActive) throw ApiError.forbidden('Agent account inactive');

  const passengerCount = data.passengers?.length || 1;
  const totalFare = calcTotalFare({ ...data, passengerCount });
  const bookingRef = await generateAgentBookingRef();

  const booking = await AgentBooking.create({
    bookingRef,
    agent: agentId,
    flightNumber: data.flightNumber,
    airline: data.airline,
    fromCity: data.fromCity,
    toCity: data.toCity,
    departureDate: new Date(data.departureDate),
    departureTime: data.departureTime,
    arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : undefined,
    arrivalTime: data.arrivalTime,
    travelClass: data.travelClass || 'economy',
    pnr: data.pnr,
    passengers: data.passengers,
    baseFare: data.baseFare ?? 0,
    tax: data.tax ?? 0,
    agentMarkup: data.agentMarkup ?? 0,
    totalFare,
    currency: data.currency || 'BDT',
    bookingType: data.bookingType || 'standard',
    specialRequests: data.specialRequests,
    baggageAllowance: data.baggageAllowance,
    mealPreference: data.mealPreference || 'None',
    seatPreference: data.seatPreference || 'No Preference',
    ticketIssued: data.ticketIssued ?? false,
    ticketFilePath: file ? file.path.replace(/\\/g, '/') : undefined,
    ticketFileName: file?.originalname,
    status: 'pending',
    statusTimeline: [{ status: 'pending', note: 'Ticket request submitted by agent' }],
  });

  await notifyAdminNewBooking(booking, agent);

  return getAgentBookingById(booking._id.toString(), agentId);
}

export async function listAgentBookings(agentId, query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'createdAt');
  const filter = buildBookingFilter(query, agentId);

  const [items, total] = await Promise.all([
    AgentBooking.find(filter).sort(sort).skip(skip).limit(limit).populate('agent', 'agentId companyName').lean(),
    AgentBooking.countDocuments(filter),
  ]);

  return {
    items: items.map(formatBooking),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function listAllAgentBookings(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'createdAt');
  const filter = buildBookingFilter(query);

  const [items, total] = await Promise.all([
    AgentBooking.find(filter).sort(sort).skip(skip).limit(limit).populate('agent', 'agentId companyName contactPerson email').lean(),
    AgentBooking.countDocuments(filter),
  ]);

  return {
    items: items.map(formatBooking),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getAgentBookingById(id, agentId = null) {
  const filter = agentId ? { _id: id, agent: agentId } : { _id: id };
  const booking = await AgentBooking.findOne(filter).populate('agent', 'agentId companyName contactPerson email').lean();
  if (!booking) throw ApiError.notFound('Booking not found');
  return formatBooking(booking);
}

export async function cancelAgentBooking(id, agentId) {
  const booking = await AgentBooking.findOne({ _id: id, agent: agentId });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (!['pending', 'processing'].includes(booking.status)) {
    throw ApiError.badRequest('Only pending or processing bookings can be cancelled');
  }

  booking.status = 'cancelled';
  booking.statusTimeline.push({ status: 'cancelled', note: 'Cancelled by agent' });
  await booking.save();

  const agent = await Agent.findById(agentId);
  if (agent) {
    await notifyAgentBooking(agent, booking, 'Booking cancelled', `Your booking ${booking.bookingRef} was cancelled.`, 'booking_cancelled');
  }

  return getAgentBookingById(id, agentId);
}

export async function updateAgentBookingStatus(id, { status, adminNotes }, userId) {
  const booking = await AgentBooking.findById(id).populate('agent');
  if (!booking) throw ApiError.notFound('Booking not found');

  booking.status = status;
  if (adminNotes !== undefined) booking.adminNotes = adminNotes;
  booking.statusTimeline.push({ status, note: adminNotes || `Status changed to ${status}`, changedBy: userId });

  if (status === 'confirmed') {
    booking.confirmedBy = userId;
    booking.confirmedAt = new Date();
    await notifyAgentBooking(
      booking.agent,
      booking,
      'Booking confirmed',
      `Booking ${booking.bookingRef} has been confirmed. ${adminNotes || ''}`.trim(),
      'booking_confirmed'
    );
  } else if (status === 'cancelled') {
    await notifyAgentBooking(
      booking.agent,
      booking,
      'Booking cancelled',
      `Booking ${booking.bookingRef} was cancelled by admin. ${adminNotes || ''}`.trim(),
      'booking_cancelled'
    );
  }

  await booking.save();
  return getAgentBookingById(id);
}

export async function uploadAgentBookingTicket(id, file, userId) {
  const booking = await AgentBooking.findById(id).populate('agent');
  if (!booking) throw ApiError.notFound('Booking not found');

  booking.ticketFilePath = file.path.replace(/\\/g, '/');
  booking.ticketFileName = file.originalname;
  booking.ticketIssued = true;
  booking.statusTimeline.push({ status: booking.status, note: 'Ticket file uploaded by admin', changedBy: userId });
  await booking.save();

  if (booking.agent) {
    await notifyAgentBooking(
      booking.agent,
      booking,
      'Ticket available',
      `Ticket for booking ${booking.bookingRef} is now available for download.`,
      'booking_confirmed'
    );
  }

  return getAgentBookingById(id);
}

export async function addAgentBookingNote(id, note, userId) {
  const booking = await AgentBooking.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');

  booking.adminNotes = note;
  booking.statusTimeline.push({ status: booking.status, note, changedBy: userId });
  await booking.save();

  return getAgentBookingById(id);
}

export async function getAgentDashboardStats(agentId) {
  const [total, pending, confirmed, cancelled, recent, spentAgg] = await Promise.all([
    AgentBooking.countDocuments({ agent: agentId }),
    AgentBooking.countDocuments({ agent: agentId, status: 'pending' }),
    AgentBooking.countDocuments({ agent: agentId, status: 'confirmed' }),
    AgentBooking.countDocuments({ agent: agentId, status: 'cancelled' }),
    AgentBooking.find({ agent: agentId }).sort({ createdAt: -1 }).limit(10).lean(),
    AgentBooking.aggregate([
      { $match: { agent: new mongoose.Types.ObjectId(agentId), status: { $in: ['confirmed', 'processing'] } } },
      { $group: { _id: null, total: { $sum: '$totalFare' } } },
    ]),
  ]);

  return {
    totalBookings: total,
    pending,
    confirmed,
    cancelled,
    totalSpent: spentAgg[0]?.total || 0,
    recent: recent.map((b) => formatBooking({ ...b, agent: null })),
  };
}

export default {
  createAgentBooking,
  listAgentBookings,
  listAllAgentBookings,
  getAgentBookingById,
  cancelAgentBooking,
  updateAgentBookingStatus,
  uploadAgentBookingTicket,
  addAgentBookingNote,
  getAgentDashboardStats,
  calcTotalFare,
};
