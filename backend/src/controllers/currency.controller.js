import * as currencyService from '../services/currency.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAdminCurrencies = asyncHandler(async (_req, res) => {
  const data = await currencyService.getCurrencySettings();
  res.json({ success: true, data });
});

export const updateAdminCurrencies = asyncHandler(async (req, res) => {
  const rate = req.body?.BRL?.rateToBase;
  const data = await currencyService.updateBRLRate(rate, req.user.id, req);
  res.json({ success: true, data, message: data.message });
});

export const getPublicCurrencies = asyncHandler(async (_req, res) => {
  const data = await currencyService.getPublicCurrencies();
  res.json({ success: true, ...data });
});

export default { getAdminCurrencies, updateAdminCurrencies, getPublicCurrencies };
