import * as orderService from '../services/order.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await orderService.listOrders(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await orderService.getOrderById(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await orderService.createOrder(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Order created' });
});

export const update = asyncHandler(async (req, res) => {
  const data = await orderService.updateOrder(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Order updated' });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const data = await orderService.updateOrderStatus(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Order status updated' });
});

export const addFollowUp = asyncHandler(async (req, res) => {
  const data = await orderService.addFollowUp(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Follow-up added' });
});

export const linkCustomer = asyncHandler(async (req, res) => {
  const data = await orderService.linkOrderCustomer(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Customer linked to order' });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await orderService.deleteOrder(req.params.id, req.user.id, req);
  res.json({ success: true, data, message: data.message });
});

export const updateApproval = asyncHandler(async (req, res) => {
  const data = await orderService.updateOrderApproval(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Approval status updated' });
});

export const uploadPassport = asyncHandler(async (req, res) => {
  const data = await orderService.uploadOrderPassport(req.params.id, req.file, req.user.id, req);
  res.json({ success: true, data, message: 'Passport uploaded' });
});

export default { list, getById, create, update, updateStatus, addFollowUp, linkCustomer, remove, updateApproval, uploadPassport };
