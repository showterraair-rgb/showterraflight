import * as accountService from '../services/account.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await accountService.listAccounts(req.query);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await accountService.createAccount(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Payment account created' });
});

export const update = asyncHandler(async (req, res) => {
  const data = await accountService.updateAccount(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Payment account updated' });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const data = await accountService.updateAccountStatus(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Account status updated' });
});

export const summary = asyncHandler(async (_req, res) => {
  const data = await accountService.getAccountsSummary();
  res.json({ success: true, data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await accountService.getAccountById(req.params.id);
  res.json({ success: true, data });
});

export const statement = asyncHandler(async (req, res) => {
  const data = await accountService.getAccountStatement(req.params.id, req.query);
  res.json({ success: true, data: data.transactions, account: data.account, pagination: data.pagination });
});

export const setOpeningBalance = asyncHandler(async (req, res) => {
  const data = await accountService.setOpeningBalance(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: 'Opening balance updated' });
});

export const listTransfers = asyncHandler(async (req, res) => {
  const data = await accountService.listTransfers(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const createTransfer = asyncHandler(async (req, res) => {
  const data = await accountService.createTransfer(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Transfer completed' });
});

export const voidTransfer = asyncHandler(async (req, res) => {
  const data = await accountService.voidTransfer(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data, message: data.message });
});

export default { list, summary, getById, statement, setOpeningBalance, listTransfers, createTransfer, voidTransfer, create, update, updateStatus };
