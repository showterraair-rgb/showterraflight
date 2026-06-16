import { DEFAULT_CURRENCIES } from '../config/currencies.js';

const SYMBOLS = { BDT: '৳', BRL: 'R$' };
const DEFAULT_BRL_RATE = DEFAULT_CURRENCIES.BRL.rateToBase;

export function normalizeRates(rates = DEFAULT_CURRENCIES) {
  const map = {};
  for (const code of ['BDT', 'BRL']) {
    const entry = rates[code];
    map[code] = typeof entry === 'object' ? (entry?.rateToBase ?? DEFAULT_CURRENCIES[code].rateToBase) : (entry ?? DEFAULT_CURRENCIES[code].rateToBase);
  }
  map.BDT = 1;
  return map;
}

export function formatCurrency(amount, currency = 'BRL') {
  const symbol = SYMBOLS[currency] || currency;
  return `${symbol} ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Build pricing from BRL inputs + editable BDT rate */
export function buildBRLPricing({ baseFareBRL, taxBRL, markupBRL, passengerCount = 1, bdtRate }) {
  const rate = Number(bdtRate);
  const base = Number(baseFareBRL) || 0;
  const tax = Number(taxBRL) || 0;
  const markup = Number(markupBRL) || 0;
  const count = Math.max(1, passengerCount);

  const totalFareBRL = (base + tax) * count + markup;
  const baseFareBDT = base * rate * count;
  const taxBDT = tax * rate * count;
  const markupBDT = markup * rate;
  const totalFareBDT = totalFareBRL * rate;

  return {
    currency: 'BRL',
    baseFareBRL: base,
    taxBRL: tax,
    markupBRL: markup,
    totalFareBRL,
    baseFareBDT,
    taxBDT,
    markupBDT,
    totalFareBDT,
    bdtRateAtBooking: rate,
    exchangeRateAtBooking: rate,
    originalCurrency: 'BRL',
    originalBaseFare: base,
    originalTax: tax,
    originalMarkup: markup,
    originalTotalFare: totalFareBRL,
    baseFare: base,
    tax,
    agentMarkup: markup,
    totalFare: totalFareBRL,
  };
}

/** Normalize any booking doc to BRL-primary pricing (legacy BDT records converted) */
export function normalizeBookingToPricing(doc, defaultRate = DEFAULT_BRL_RATE) {
  const rate = Number(doc.bdtRateAtBooking ?? doc.exchangeRateAtBooking ?? defaultRate) || defaultRate;
  const storedCurrency = doc.originalCurrency || doc.currency || 'BRL';

  let totalFareBRL;
  let totalFareBDT;
  let baseFareBRL;
  let taxBRL;
  let markupBRL;
  let baseFareBDT;
  let taxBDT;
  let markupBDT;

  if (doc.totalFareBRL != null && doc.totalFareBDT != null) {
    totalFareBRL = doc.totalFareBRL;
    totalFareBDT = doc.totalFareBDT;
    baseFareBRL = doc.baseFareBRL ?? doc.originalBaseFare ?? doc.baseFare ?? 0;
    taxBRL = doc.taxBRL ?? doc.originalTax ?? doc.tax ?? 0;
    markupBRL = doc.markupBRL ?? doc.originalMarkup ?? doc.agentMarkup ?? 0;
    baseFareBDT = doc.baseFareBDT ?? baseFareBRL * rate;
    taxBDT = doc.taxBDT ?? taxBRL * rate;
    markupBDT = doc.markupBDT ?? markupBRL * rate;
  } else if (storedCurrency === 'BRL') {
    totalFareBRL = doc.originalTotalFare ?? doc.totalFare ?? 0;
    totalFareBDT = doc.totalFareBDT ?? totalFareBRL * rate;
    baseFareBRL = doc.originalBaseFare ?? doc.baseFare ?? 0;
    taxBRL = doc.originalTax ?? doc.tax ?? 0;
    markupBRL = doc.originalMarkup ?? doc.agentMarkup ?? 0;
    baseFareBDT = doc.baseFareBDT ?? baseFareBRL * rate;
    taxBDT = doc.taxBDT ?? taxBRL * rate;
    markupBDT = doc.markupBDT ?? markupBRL * rate;
  } else {
    totalFareBDT = doc.totalFareBDT ?? doc.originalTotalFare ?? doc.totalFare ?? 0;
    totalFareBRL = rate > 0 ? totalFareBDT / rate : totalFareBDT;
    baseFareBRL = rate > 0 ? (doc.originalBaseFare ?? doc.baseFare ?? 0) / rate : 0;
    taxBRL = rate > 0 ? (doc.originalTax ?? doc.tax ?? 0) / rate : 0;
    markupBRL = rate > 0 ? (doc.originalMarkup ?? doc.agentMarkup ?? 0) / rate : 0;
    baseFareBDT = doc.baseFareBDT ?? doc.originalBaseFare ?? doc.baseFare ?? 0;
    taxBDT = doc.taxBDT ?? doc.originalTax ?? doc.tax ?? 0;
    markupBDT = doc.markupBDT ?? doc.originalMarkup ?? doc.agentMarkup ?? 0;
  }

  const pricing = {
    baseFareBRL,
    taxBRL,
    markupBRL,
    totalFareBRL,
    baseFareBDT,
    taxBDT,
    markupBDT,
    totalFareBDT,
    bdtRateAtBooking: rate,
    currency: 'BRL',
  };

  return {
    ...pricing,
    pricing,
    exchangeRateAtBooking: rate,
    originalCurrency: 'BRL',
    originalTotalFare: totalFareBRL,
    totalFare: totalFareBRL,
    currency: 'BRL',
  };
}

export function bdtToBrl(amountBDT, bdtRate) {
  const rate = Number(bdtRate) || DEFAULT_BRL_RATE;
  return rate > 0 ? Number(amountBDT || 0) / rate : 0;
}

export function brlToBdt(amountBRL, bdtRate) {
  return Number(amountBRL || 0) * (Number(bdtRate) || DEFAULT_BRL_RATE);
}

export default {
  normalizeRates,
  formatCurrency,
  buildBRLPricing,
  normalizeBookingToPricing,
  bdtToBrl,
  brlToBdt,
};
