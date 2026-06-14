import * as customerService from '../services/customer.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await customerService.listCustomers(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await customerService.getCustomerById(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await customerService.createCustomer(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Customer created' });
});

export const update = asyncHandler(async (req, res) => {
  const data = await customerService.updateCustomer(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Customer updated' });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await customerService.deleteCustomer(req.params.id, req.user.id, req);
  res.json({ success: true, data, message: data.message });
});

export default { list, getById, create, update, remove };
