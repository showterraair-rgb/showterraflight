import * as accountService from '../services/account.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const list = asyncHandler(async (_req, res) => {
  const data = await accountService.listAccounts();
  res.json({ success: true, data });
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

export default { list, summary, getById, statement, setOpeningBalance, listTransfers, createTransfer };
