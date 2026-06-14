import * as expenseService from '../services/expense.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listCategories = asyncHandler(async (_req, res) => {
  const data = await expenseService.listExpenseCategories();
  res.json({ success: true, data });
});

export const list = asyncHandler(async (req, res) => {
  const data = await expenseService.listExpenses(req.query);
  res.json({ success: true, data: data.items, pagination: data.pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await expenseService.getExpenseById(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await expenseService.createExpense(req.body, req.user.id, req);
  res.status(201).json({ success: true, data, message: 'Expense recorded' });
});

export default { listCategories, list, getById, create };
