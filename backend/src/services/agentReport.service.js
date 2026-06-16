import mongoose from 'mongoose';
import AgentBooking from '../models/AgentBooking.js';
import ApiError from '../utils/ApiError.js';

export async function getAgentReportSummary(agentId, query) {
  const match = { agent: new mongoose.Types.ObjectId(agentId) };

  if (query.dateFrom || query.dateTo) {
    match.createdAt = {};
    if (query.dateFrom) match.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
  }

  const [totals, byAirline, byRoute] = await Promise.all([
    AgentBooking.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ['$totalFareBDT', '$totalFare'] } },
          confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        },
      },
    ]),
    AgentBooking.aggregate([
      { $match: match },
      { $group: { _id: '$airline', count: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$totalFareBDT', '$totalFare'] } } } },
      { $sort: { count: -1 } },
    ]),
    AgentBooking.aggregate([
      { $match: match },
      {
        $group: {
          _id: { from: '$fromCity', to: '$toCity' },
          count: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$totalFareBDT', '$totalFare'] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
  ]);

  const summary = totals[0] || { totalBookings: 0, totalRevenue: 0, confirmed: 0, pending: 0, cancelled: 0 };

  return {
    ...summary,
    byAirline: byAirline.map((a) => ({ airline: a._id, count: a.count, revenue: a.revenue })),
    byRoute: byRoute.map((r) => ({
      route: `${r._id.from} → ${r._id.to}`,
      count: r.count,
      revenue: r.revenue,
    })),
  };
}

export async function getAgentMonthlyReport(agentId, query) {
  const match = { agent: new mongoose.Types.ObjectId(agentId) };
  const year = parseInt(query.year || new Date().getFullYear(), 10);

  match.createdAt = {
    $gte: new Date(`${year}-01-01`),
    $lte: new Date(`${year}-12-31T23:59:59.999Z`),
  };

  const rows = await AgentBooking.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $month: '$createdAt' },
        bookings: { $sum: 1 },
        revenue: { $sum: { $ifNull: ['$totalFareBDT', '$totalFare'] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const row = rows.find((r) => r._id === i + 1);
    return {
      month: i + 1,
      label: new Date(year, i, 1).toLocaleString('en', { month: 'short' }),
      bookings: row?.bookings || 0,
      revenue: row?.revenue || 0,
    };
  });

  return { year, months };
}

export async function getAgentAirlineReport(agentId, query) {
  const data = await getAgentReportSummary(agentId, query);
  return data.byAirline;
}

export default {
  getAgentReportSummary,
  getAgentMonthlyReport,
  getAgentAirlineReport,
};
