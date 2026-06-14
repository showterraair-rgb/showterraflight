import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Booking from '../models/Booking.js';
import CustomerPayment from '../models/CustomerPayment.js';
import ApiError from '../utils/ApiError.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
  buildSearchFilter,
} from '../utils/pagination.js';
import { logAudit } from './audit.service.js';

function formatCustomer(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    phone: doc.phone,
    email: doc.email || '',
    address: doc.address || '',
    nid: doc.nid || '',
    passportNo: doc.passportNo || '',
    tags: doc.tags || [],
    notes: doc.notes || '',
    totalDue: doc.totalDue,
    totalPaid: doc.totalPaid,
    totalSales: doc.totalSales,
    isActive: doc.isActive,
    createdBy: doc.createdBy?.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listCustomers(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query);
  const filter = { ...buildSearchFilter(query.search, ['name', 'phone', 'email']) };

  if (query.isActive === 'true') filter.isActive = true;
  if (query.isActive === 'false') filter.isActive = false;

  const [items, total] = await Promise.all([
    Customer.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Customer.countDocuments(filter),
  ]);

  return {
    items: items.map(formatCustomer),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getCustomerById(id) {
  const customer = await Customer.findById(id).lean();
  if (!customer) throw ApiError.notFound('Customer not found');

  const [orderCount, bookingCount] = await Promise.all([
    Order.countDocuments({ customer: id }),
    Booking.countDocuments({ customer: id }),
  ]);

  return {
    ...formatCustomer(customer),
    stats: { orderCount, bookingCount },
  };
}

export async function createCustomer(data, userId, req) {
  const existing = await Customer.findOne({ phone: data.phone });
  if (existing) {
    throw ApiError.badRequest('A customer with this phone number already exists');
  }

  const customer = await Customer.create({
    ...data,
    email: data.email || undefined,
    createdBy: userId,
  });

  await logAudit({
    action: 'create',
    module: 'customers',
    entityType: 'Customer',
    entityId: customer._id,
    description: `Created customer ${customer.name}`,
    userId,
    req,
  });

  return formatCustomer(customer.toObject());
}

export async function updateCustomer(id, data, userId, req) {
  const customer = await Customer.findById(id);
  if (!customer) throw ApiError.notFound('Customer not found');

  if (data.phone && data.phone !== customer.phone) {
    const dup = await Customer.findOne({ phone: data.phone, _id: { $ne: id } });
    if (dup) throw ApiError.badRequest('Phone number already in use');
  }

  const before = customer.toObject();
  Object.assign(customer, {
    ...data,
    email: data.email === '' ? undefined : data.email ?? customer.email,
  });
  await customer.save();

  await logAudit({
    action: 'update',
    module: 'customers',
    entityType: 'Customer',
    entityId: customer._id,
    description: `Updated customer ${customer.name}`,
    changes: { before: { name: before.name, phone: before.phone }, after: { name: customer.name, phone: customer.phone } },
    userId,
    req,
  });

  return formatCustomer(customer.toObject());
}

export async function deleteCustomer(id, userId, req) {
  const customer = await Customer.findById(id);
  if (!customer) throw ApiError.notFound('Customer not found');

  const [orderCount, bookingCount, paymentCount] = await Promise.all([
    Order.countDocuments({ customer: id }),
    Booking.countDocuments({ customer: id }),
    CustomerPayment.countDocuments({ customer: id }),
  ]);

  if (orderCount || bookingCount || paymentCount) {
    customer.isActive = false;
    await customer.save();
    await logAudit({
      action: 'delete',
      module: 'customers',
      entityType: 'Customer',
      entityId: customer._id,
      description: `Archived customer ${customer.name} (linked records exist)`,
      userId,
      req,
    });
    return { id, archived: true, message: 'Customer archived because linked orders, bookings, or payments exist' };
  }

  await Customer.findByIdAndDelete(id);
  await logAudit({
    action: 'delete',
    module: 'customers',
    entityType: 'Customer',
    entityId: id,
    description: `Deleted customer ${customer.name}`,
    userId,
    req,
  });
  return { id, deleted: true, message: 'Customer deleted' };
}

/** Find by phone or create from order snapshot fields */
export async function findOrCreateFromOrder({ name, phone, email }, userId) {
  let customer = await Customer.findOne({ phone });
  if (customer) return customer;

  customer = await Customer.create({
    name,
    phone,
    email: email || undefined,
    createdBy: userId,
  });
  return customer;
}

export default { listCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer, findOrCreateFromOrder };
