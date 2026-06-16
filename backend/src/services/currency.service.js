import Setting from '../models/Setting.js';
import ApiError from '../utils/ApiError.js';
import { DEFAULT_CURRENCIES } from '../config/currencies.js';
import { logAudit } from './audit.service.js';

function mergeCurrencies(stored) {
  const merged = {
    BDT: { ...DEFAULT_CURRENCIES.BDT, ...(stored?.BDT || {}) },
    BRL: { ...DEFAULT_CURRENCIES.BRL, ...(stored?.BRL || {}) },
  };
  merged.BDT.rateToBase = 1;
  merged.BDT.isBase = true;
  merged.BRL.isBase = false;
  return merged;
}

async function getSettingDoc() {
  let setting = await Setting.findOne({ key: 'company' });
  if (!setting) {
    setting = await Setting.create({ key: 'company', currencies: DEFAULT_CURRENCIES });
  } else if (!setting.currencies?.BRL) {
    setting.currencies = mergeCurrencies(setting.currencies);
    await setting.save();
  }
  return setting;
}

export async function getCurrencySettings() {
  const setting = await getSettingDoc();
  const currencies = mergeCurrencies(setting.currencies?.toObject?.() || setting.currencies);
  return {
    currencies,
    currenciesUpdatedAt: setting.currenciesUpdatedAt || setting.updatedAt,
  };
}

export async function getPublicCurrencies() {
  const { currencies, currenciesUpdatedAt } = await getCurrencySettings();
  return {
    baseCurrency: 'BDT',
    currencies: Object.values(currencies).map((c) => ({
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      isBase: c.isBase,
      rateToBase: c.rateToBase,
    })),
    updatedAt: currenciesUpdatedAt,
  };
}

export async function getCurrencyRatesMap() {
  const { currencies } = await getCurrencySettings();
  return currencies;
}

export async function updateBRLRate(rateToBase, userId, req) {
  const rate = Number(rateToBase);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw ApiError.badRequest('BRL rate must be a positive number');
  }

  const setting = await getSettingDoc();
  const currencies = mergeCurrencies(setting.currencies);
  currencies.BRL.rateToBase = rate;

  setting.currencies = currencies;
  setting.currenciesUpdatedAt = new Date();
  setting.updatedBy = userId;
  await setting.save();

  await logAudit({
    action: 'update',
    module: 'settings',
    entityType: 'Setting',
    description: `BRL exchange rate updated to ${rate} BDT per BRL`,
    userId,
    req,
  });

  return {
    currencies,
    currenciesUpdatedAt: setting.currenciesUpdatedAt,
    message: 'Exchange rate updated. Existing bookings keep their booking-time rate.',
  };
}

export default {
  getCurrencySettings,
  getPublicCurrencies,
  getCurrencyRatesMap,
  updateBRLRate,
};
