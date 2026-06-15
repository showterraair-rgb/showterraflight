import * as userService from '../services/user.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await userService.listUsers(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await userService.getUserById(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await userService.createUser(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'User created' });
});

export const update = asyncHandler(async (req, res) => {
  const data = await userService.updateUser(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'User updated' });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await userService.deactivateUser(req.params.id, req.user.id, req);
  res.json({ success: true, data, message: 'User deactivated' });
});

export default { list, getById, create, update, remove };
