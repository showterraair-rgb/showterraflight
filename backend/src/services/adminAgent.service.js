import Agent from '../models/Agent.js';
import AgentBooking from '../models/AgentBooking.js';
import AgentTransaction from '../models/AgentTransaction.js';
import ApiError from '../utils/ApiError.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
  buildSearchFilter,
} from '../utils/pagination.js';
import { generateAgentId } from './numberGenerator.service.js';
import { sanitizeAgent } from './agentAuth.service.js';
import { logAudit } from './audit.service.js';

function formatAgentListItem(doc) {
  return {
    ...sanitizeAgent(doc),
    bookingsCount: doc.bookingsCount,
  };
}

export async function createAgent(data, userId, req) {
  const existing = await Agent.findOne({ email: data.email.toLowerCase() });
  if (existing) throw ApiError.badRequest('An agent with this email already exists');

  const agentId = await generateAgentId();
  const initialBalance = data.initialBalance ?? 0;

  const agent = await Agent.create({
    agentId,
    companyName: data.companyName,
    contactPerson: data.contactPerson,
    email: data.email,
    password: data.password,
    phone: data.phone,
    address: data.address,
    city: data.city,
    country: data.country || 'Bangladesh',
    agentType: data.agentType || 'regular',
    creditLimit: data.creditLimit ?? 0,
    currentBalance: initialBalance,
    isActive: data.isActive !== false,
    notes: data.notes,
    createdBy: userId,
  });

  if (initialBalance !== 0) {
    await AgentTransaction.create({
      agent: agent._id,
      type: initialBalance >= 0 ? 'credit' : 'debit',
      amount: Math.abs(initialBalance),
      description: 'Opening balance',
      balanceBefore: 0,
      balanceAfter: initialBalance,
      createdBy: userId,
    });
  }

  await logAudit({
    action: 'create',
    module: 'agents',
    entityType: 'Agent',
    entityId: agent._id,
    description: `Created agent ${agent.agentId} (${agent.companyName})`,
    userId,
    req,
  });

  return sanitizeAgent(agent.toObject());
}

export async function listAgents(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query);
  const filter = { ...buildSearchFilter(query.search, ['agentId', 'companyName', 'contactPerson', 'email', 'phone']) };

  if (query.isActive === 'true') filter.isActive = true;
  if (query.isActive === 'false') filter.isActive = false;
  if (query.agentType) filter.agentType = query.agentType;

  const [items, total] = await Promise.all([
    Agent.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Agent.countDocuments(filter),
  ]);

  const ids = items.map((a) => a._id);
  const counts = ids.length
    ? await AgentBooking.aggregate([
        { $match: { agent: { $in: ids } } },
        { $group: { _id: '$agent', count: { $sum: 1 } } },
      ])
    : [];
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  return {
    items: items.map((a) => formatAgentListItem({ ...a, bookingsCount: countMap.get(a._id.toString()) || 0 })),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getAgentById(id) {
  const agent = await Agent.findById(id).lean();
  if (!agent) throw ApiError.notFound('Agent not found');

  const bookingsCount = await AgentBooking.countDocuments({ agent: id });
  return { ...sanitizeAgent(agent), bookingsCount };
}

export async function updateAgent(id, data, userId, req) {
  const agent = await Agent.findById(id);
  if (!agent) throw ApiError.notFound('Agent not found');

  if (data.email && data.email !== agent.email) {
    const dup = await Agent.findOne({ email: data.email.toLowerCase(), _id: { $ne: id } });
    if (dup) throw ApiError.badRequest('Email already in use');
    agent.email = data.email;
  }

  if (data.companyName) agent.companyName = data.companyName;
  if (data.contactPerson) agent.contactPerson = data.contactPerson;
  if (data.phone !== undefined) agent.phone = data.phone;
  if (data.address !== undefined) agent.address = data.address;
  if (data.city !== undefined) agent.city = data.city;
  if (data.country !== undefined) agent.country = data.country;
  if (data.agentType) agent.agentType = data.agentType;
  if (data.creditLimit !== undefined) agent.creditLimit = data.creditLimit;
  if (data.notes !== undefined) agent.notes = data.notes;
  if (data.isActive !== undefined) agent.isActive = data.isActive;
  if (data.password) agent.password = data.password;

  await agent.save();

  await logAudit({
    action: 'update',
    module: 'agents',
    entityType: 'Agent',
    entityId: agent._id,
    description: `Updated agent ${agent.agentId}`,
    userId,
    req,
  });

  return sanitizeAgent(agent.toObject());
}

export async function toggleAgent(id, userId, req) {
  const agent = await Agent.findById(id);
  if (!agent) throw ApiError.notFound('Agent not found');
  agent.isActive = !agent.isActive;
  await agent.save();

  await logAudit({
    action: 'update',
    module: 'agents',
    entityType: 'Agent',
    entityId: agent._id,
    description: `${agent.isActive ? 'Activated' : 'Deactivated'} agent ${agent.agentId}`,
    userId,
    req,
  });

  return sanitizeAgent(agent.toObject());
}

export async function deleteAgent(id, userId, req) {
  const agent = await Agent.findById(id);
  if (!agent) throw ApiError.notFound('Agent not found');

  const bookingCount = await AgentBooking.countDocuments({ agent: id });
  if (bookingCount > 0) {
    throw ApiError.badRequest('Cannot delete agent with existing bookings — deactivate instead');
  }

  await Agent.findByIdAndDelete(id);

  await logAudit({
    action: 'delete',
    module: 'agents',
    entityType: 'Agent',
    entityId: id,
    description: `Deleted agent ${agent.agentId}`,
    userId,
    req,
  });

  return { message: 'Agent deleted' };
}

export async function addAgentTransaction(agentId, data, userId, req) {
  const agent = await Agent.findById(agentId);
  if (!agent) throw ApiError.notFound('Agent not found');

  const balanceBefore = agent.currentBalance;
  const amount = Number(data.amount);
  if (amount <= 0) throw ApiError.badRequest('Amount must be positive');

  const balanceAfter = data.type === 'credit'
    ? balanceBefore + amount
    : balanceBefore - amount;

  agent.currentBalance = balanceAfter;
  await agent.save();

  const txn = await AgentTransaction.create({
    agent: agentId,
    bookingRef: data.bookingRef,
    type: data.type,
    amount,
    description: data.description,
    balanceBefore,
    balanceAfter,
    createdBy: userId,
  });

  await logAudit({
    action: 'create',
    module: 'agent-accounting',
    entityType: 'AgentTransaction',
    entityId: txn._id,
    description: `${data.type} ${amount} for agent ${agent.agentId}`,
    userId,
    req,
  });

  return {
    id: txn._id.toString(),
    type: txn.type,
    amount: txn.amount,
    description: txn.description,
    balanceBefore,
    balanceAfter,
    bookingRef: txn.bookingRef,
    createdAt: txn.createdAt,
  };
}

export async function getAgentLedger(agentId, query) {
  const agent = await Agent.findById(agentId).lean();
  if (!agent) throw ApiError.notFound('Agent not found');

  const { page, limit, skip, sort } = parsePaginationQuery(query, 'createdAt');
  const filter = { agent: agentId };

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const [items, total] = await Promise.all([
    AgentTransaction.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    AgentTransaction.countDocuments(filter),
  ]);

  return {
    agent: sanitizeAgent(agent),
    items: items.map((t) => ({
      id: t._id.toString(),
      date: t.createdAt,
      description: t.description,
      type: t.type,
      debit: t.type === 'debit' ? t.amount : 0,
      credit: t.type === 'credit' ? t.amount : 0,
      amount: t.amount,
      balanceBefore: t.balanceBefore,
      balanceAfter: t.balanceAfter,
      bookingRef: t.bookingRef || '',
    })),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export default {
  createAgent,
  listAgents,
  getAgentById,
  updateAgent,
  toggleAgent,
  deleteAgent,
  addAgentTransaction,
  getAgentLedger,
};
