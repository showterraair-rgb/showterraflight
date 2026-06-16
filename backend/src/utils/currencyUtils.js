import { DEFAULT_CURRENCIES } from '../config/currencies.js';

const SYMBOLS = { BDT: '৳', BRL: 'R$' };

/** Normalize rates map from Setting.currencies object or flat map */
export function normalizeRates(rates = DEFAULT_CURRENCIES) {
  const map = {};
  for (const code of ['BDT', 'BRL']) {
    const entry = rates[code];
    map[code] = typeof entry === 'object' ? (entry?.rateToBase ?? DEFAULT_CURRENCIES[code].rateToBase) : (entry ?? DEFAULT_CURRENCIES[code].rateToBase);
  }
  map.BDT = 1;
  return map;
}

export function convertToBDT(amount, fromCurrency, rates) {
  const num = Number(amount) || 0;
  if (!fromCurrency || fromCurrency === 'BDT') return num;
  const rateMap = normalizeRates(rates);
  const rate = rateMap[fromCurrency] || 1;
  return num * rate;
}

export function convertFromBDT(amountBDT, toCurrency, rates) {
  const num = Number(amountBDT) || 0;
  if (!toCurrency || toCurrency === 'BDT') return num;
  const rateMap = normalizeRates(rates);
  const rate = rateMap[toCurrency] || 1;
  return rate ? num / rate : num;
}

export function formatCurrency(amount, currency = 'BDT') {
  const symbol = SYMBOLS[currency] || currency;
  return `${symbol} ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Backfill currency fields on legacy booking documents */
export function normalizeBookingCurrencyFields(doc, rates = DEFAULT_CURRENCIES) {
  const originalCurrency = doc.originalCurrency || doc.currency || 'BDT';
  const exchangeRateAtBooking = doc.exchangeRateAtBooking ?? (originalCurrency === 'BDT' ? 1 : normalizeRates(rates)[originalCurrency]);
  const originalTotalFare = doc.originalTotalFare ?? doc.totalFare ?? 0;
  const totalFareBDT = doc.totalFareBDT ?? convertToBDT(originalTotalFare, originalCurrency, { [originalCurrency]: { rateToBase: exchangeRateAtBooking } });

  return {
    originalCurrency,
    originalBaseFare: doc.originalBaseFare ?? doc.baseFare ?? 0,
    originalTax: doc.originalTax ?? doc.tax ?? 0,
    originalMarkup: doc.originalMarkup ?? doc.agentMarkup ?? 0,
    originalTotalFare,
    baseFareBDT: doc.baseFareBDT ?? convertToBDT(doc.originalBaseFare ?? doc.baseFare ?? 0, originalCurrency, { [originalCurrency]: { rateToBase: exchangeRateAtBooking } }),
    taxBDT: doc.taxBDT ?? convertToBDT(doc.originalTax ?? doc.tax ?? 0, originalCurrency, { [originalCurrency]: { rateToBase: exchangeRateAtBooking } }),
    markupBDT: doc.markupBDT ?? convertToBDT(doc.originalMarkup ?? doc.agentMarkup ?? 0, originalCurrency, { [originalCurrency]: { rateToBase: exchangeRateAtBooking } }),
    totalFareBDT,
    exchangeRateAtBooking,
    currency: originalCurrency,
    totalFare: originalTotalFare,
  };
}

export function buildPriceSnapshot({ baseFare, tax, markup, total, currency }, rates) {
  const originalCurrency = currency || 'BDT';
  const exchangeRateAtBooking = originalCurrency === 'BDT' ? 1 : normalizeRates(rates)[originalCurrency];
  return {
    originalCurrency,
    originalBaseFare: Number(baseFare) || 0,
    originalTax: Number(tax) || 0,
    originalMarkup: Number(markup) || 0,
    originalTotalFare: Number(total) || 0,
    baseFareBDT: convertToBDT(baseFare, originalCurrency, rates),
    taxBDT: convertToBDT(tax, originalCurrency, rates),
    markupBDT: convertToBDT(markup, originalCurrency, rates),
    totalFareBDT: convertToBDT(total, originalCurrency, rates),
    exchangeRateAtBooking,
    currency: originalCurrency,
    totalFare: Number(total) || 0,
  };
}

export default {
  normalizeRates,
  convertToBDT,
  convertFromBDT,
  formatCurrency,
  normalizeBookingCurrencyFields,
  buildPriceSnapshot,
};
