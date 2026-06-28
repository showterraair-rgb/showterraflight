import * as customerPaymentService from '../services/customerPayment.service.js';

import * as supplierPaymentService from '../services/supplierPayment.service.js';

import * as paymentRequestService from '../services/paymentRequest.service.js';

import asyncHandler from '../utils/asyncHandler.js';



export const listCustomerPayments = asyncHandler(async (req, res) => {

  const data = await customerPaymentService.listCustomerPayments(req.query);

  res.json({ success: true, data: data.items, pagination: data.pagination });

});



export const getCustomerPayment = asyncHandler(async (req, res) => {

  const data = await customerPaymentService.getCustomerPaymentById(req.params.id);

  res.json({ success: true, data });

});



export const createCustomerPayment = asyncHandler(async (req, res) => {

  const data = await customerPaymentService.createCustomerPayment(req.body, req.user.id, req);

  res.status(201).json({ success: true, data, message: 'Customer payment recorded' });

});



export const voidCustomerPayment = asyncHandler(async (req, res) => {

  const data = await customerPaymentService.voidCustomerPayment(req.params.id, req.body, req.user.id, req);

  res.json({ success: true, data, message: data.message });

});



export const uploadCustomerPaymentReceipt = asyncHandler(async (req, res) => {

  const data = await customerPaymentService.uploadCustomerPaymentReceipt(req.params.id, req.file, req.user.id, req);

  res.json({ success: true, data, message: 'Receipt uploaded' });

});



export const listSupplierPayments = asyncHandler(async (req, res) => {

  const data = await supplierPaymentService.listSupplierPayments(req.query);

  res.json({ success: true, data: data.items, pagination: data.pagination });

});



export const getSupplierPayment = asyncHandler(async (req, res) => {

  const data = await supplierPaymentService.getSupplierPaymentById(req.params.id);

  res.json({ success: true, data });

});



export const createSupplierPayment = asyncHandler(async (req, res) => {

  const data = await supplierPaymentService.createSupplierPayment(req.body, req.user.id, req);

  res.status(201).json({ success: true, data, message: 'Supplier payment recorded' });

});



export const voidSupplierPayment = asyncHandler(async (req, res) => {

  const data = await supplierPaymentService.voidSupplierPayment(req.params.id, req.body, req.user.id, req);

  res.json({ success: true, data, message: data.message });

});



export const uploadSupplierPaymentReceipt = asyncHandler(async (req, res) => {

  const data = await supplierPaymentService.uploadSupplierPaymentReceipt(req.params.id, req.file, req.user.id, req);

  res.json({ success: true, data, message: 'Receipt uploaded' });

});



export const listPaymentRequests = asyncHandler(async (req, res) => {
  const data = await paymentRequestService.listPaymentRequests(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const createPaymentRequest = asyncHandler(async (req, res) => {
  const data = await paymentRequestService.createPaymentRequest(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Payment request sent' });
});

export const cancelPaymentRequest = asyncHandler(async (req, res) => {
  const data = await paymentRequestService.cancelPaymentRequest(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Payment request cancelled' });
});

export const recordPaymentRequest = asyncHandler(async (req, res) => {
  const data = await paymentRequestService.recordPaymentForRequest(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Payment recorded' });
});



export default {

  listCustomerPayments,

  getCustomerPayment,

  createCustomerPayment,

  voidCustomerPayment,

  uploadCustomerPaymentReceipt,

  listSupplierPayments,

  getSupplierPayment,

  createSupplierPayment,

  voidSupplierPayment,

  uploadSupplierPaymentReceipt,

  listPaymentRequests,

  createPaymentRequest,

  cancelPaymentRequest,

  recordPaymentRequest,

};


