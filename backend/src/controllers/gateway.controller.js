import * as gatewayPaymentService from '../services/gatewayPayment.service.js';
import * as cmsService from '../services/cms.service.js';
import { getGatewayStatus } from '../services/gatewayStatus.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getGatewayStatusHandler = asyncHandler(async (req, res) => {
  const data = await getGatewayStatus();
  res.json({ success: true, data });
});

export const initiateGateway = asyncHandler(async (req, res) => {
  const data = await gatewayPaymentService.initiateGatewayPayment(req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Redirect customer to payment gateway' });
});

export const initiateSslcommerz = asyncHandler(async (req, res) => {
  const data = await gatewayPaymentService.initiateSslcommerzPayment(req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Redirect customer to payment gateway' });
});

export const initiateBkash = asyncHandler(async (req, res) => {
  const data = await gatewayPaymentService.initiateBkashPayment(req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Redirect customer to bKash' });
});
export const getGatewayPayment = asyncHandler(async (req, res) => {
  const data = await gatewayPaymentService.getGatewayPaymentByTranId(req.params.tranId);
  res.json({ success: true, data });
});

export const sslcommerzIpn = asyncHandler(async (req, res) => {
  const result = await gatewayPaymentService.handleSslcommerzIpn({ ...req.body, ...req.query });
  res.status(result.ok ? 200 : 400).send(result.message);
});

export const sslcommerzSuccess = asyncHandler(async (req, res) => {
  const tranId = req.query.tran_id;
  const redirectUrl = await gatewayPaymentService.handleSslcommerzRedirect(tranId, 'success');
  res.redirect(redirectUrl);
});

export const sslcommerzFail = asyncHandler(async (req, res) => {
  const tranId = req.query.tran_id;
  const redirectUrl = await gatewayPaymentService.handleSslcommerzRedirect(tranId, 'fail');
  res.redirect(redirectUrl);
});

export const sslcommerzCancel = asyncHandler(async (req, res) => {
  const tranId = req.query.tran_id;
  const redirectUrl = await gatewayPaymentService.handleSslcommerzRedirect(tranId, 'cancel');
  res.redirect(redirectUrl);
});

export const bkashCallback = asyncHandler(async (req, res) => {
  const redirectUrl = await gatewayPaymentService.handleBkashCallback({ ...req.query, ...req.body });
  res.redirect(redirectUrl);
});
export const getGatewaySettings = asyncHandler(async (req, res) => {
  const data = await cmsService.getGatewaySettings();
  res.json({ success: true, data });
});

export const updateGatewaySettings = asyncHandler(async (req, res) => {
  const data = await cmsService.updateGatewaySettings(req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Gateway settings updated' });
});

export default {
  getGatewayStatusHandler,
  initiateGateway,
  initiateSslcommerz,
  initiateBkash,
  getGatewayPayment,
  sslcommerzIpn,
  sslcommerzSuccess,
  sslcommerzFail,
  sslcommerzCancel,
  bkashCallback,
  getGatewaySettings,
  updateGatewaySettings,
};