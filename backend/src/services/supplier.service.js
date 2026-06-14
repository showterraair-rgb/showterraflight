import Supplier from '../models/Supplier.js';
import Booking from '../models/Booking.js';
import SupplierPayment from '../models/SupplierPayment.js';
import ApiError from '../utils/ApiError.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
  buildSearchFilter,
} from '../utils/pagination.js';
import { logAudit } from './audit.service.js';

function formatSupplier(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    company: doc.company || '',
    phone: doc.phone || '',
    email: doc.email || '',
    address: doc.address || '',
    contactPerson: doc.contactPerson || '',
    type: doc.type,
    paymentTerms: doc.paymentTerms || '',
    notes: doc.notes || '',
    totalPayable: doc.totalPayable,
    totalPaid: doc.totalPaid,
    isActive: doc.isActive,
    createdBy: doc.createdBy?.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listSuppliers(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query);
  const filter = { ...buildSearchFilter(query.search, ['name', 'phone', 'company', 'email']) };

  if (query.isActive === 'true') filter.isActive = true;
  if (query.isActive === 'false') filter.isActive = false;
  if (query.type) filter.type = query.type;

  const [items, total] = await Promise.all([
    Supplier.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Supplier.countDocuments(filter),
  ]);

  return {
    items: items.map(formatSupplier),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getSupplierById(id) {
  const supplier = await Supplier.findById(id).lean();
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const bookingCount = await Booking.countDocuments({ supplier: id });

  return {
    ...formatSupplier(supplier),
    stats: { bookingCount },
  };
}

export async function createSupplier(data, userId, req) {
  const supplier = await Supplier.create({
    ...data,
    email: data.email || undefined,
    createdBy: userId,
  });

  await logAudit({
    action: 'create',
    module: 'suppliers',
    entityType: 'Supplier',
    entityId: supplier._id,
    description: `Created supplier ${supplier.name}`,
    userId,
    req,
  });

  return formatSupplier(supplier.toObject());
}

export async function updateSupplier(id, data, userId, req) {
  const supplier = await Supplier.findById(id);
  if (!supplier) throw ApiError.notFound('Supplier not found');

  Object.assign(supplier, {
    ...data,
    email: data.email === '' ? undefined : data.email ?? supplier.email,
  });
  await supplier.save();

  await logAudit({
    action: 'update',
    module: 'suppliers',
    entityType: 'Supplier',
    entityId: supplier._id,
    description: `Updated supplier ${supplier.name}`,
    userId,
    req,
  });

  return formatSupplier(supplier.toObject());
}

export async function deleteSupplier(id, userId, req) {
  const supplier = await Supplier.findById(id);
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const [bookingCount, paymentCount] = await Promise.all([
    Booking.countDocuments({ supplier: id }),
    SupplierPayment.countDocuments({ supplier: id }),
  ]);

  if (bookingCount || paymentCount) {
    supplier.isActive = false;
    await supplier.save();
    await logAudit({
      action: 'delete',
      module: 'suppliers',
      entityType: 'Supplier',
      entityId: supplier._id,
      description: `Archived supplier ${supplier.name} (linked records exist)`,
      userId,
      req,
    });
    return { id, archived: true, message: 'Supplier archived because linked bookings or payments exist' };
  }

  await Supplier.findByIdAndDelete(id);
  await logAudit({
    action: 'delete',
    module: 'suppliers',
    entityType: 'Supplier',
    entityId: id,
    description: `Deleted supplier ${supplier.name}`,
    userId,
    req,
  });
  return { id, deleted: true, message: 'Supplier deleted' };
}

export default { listSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier };
