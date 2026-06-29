import { DEFAULT_CURRENCIES } from '../config/currencies.js';

const SYMBOLS = { BDT: '৳', BRL: 'R$' };
const DEFAULT_BRL_RATE = DEFAULT_CURRENCIES.BRL.rateToBase;

/** Normalize a BDT-per-BRL rate from form input or currency settings. */
export function resolveBdtRate(bdtRate, rates) {
  if (bdtRate != null && typeof bdtRate === 'object') {
    const fromObject = Number(bdtRate.rateToBase);
    if (Number.isFinite(fromObject) && fromObject > 0) return fromObject;
  }
  const direct = Number(bdtRate);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const brl = rates?.BRL;
  if (brl != null && typeof brl === 'object') {
    const fromSettings = Number(brl.rateToBase);
    if (Number.isFinite(fromSettings) && fromSettings > 0) return fromSettings;
  }
  const fromMap = Number(rates?.BRL);
  if (Number.isFinite(fromMap) && fromMap > 0) return fromMap;
  return DEFAULT_BRL_RATE;
}

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

/** Normalize admin Booking doc to BRL-primary pricing (legacy BDT records converted) */
export function normalizeLegacyBookingPricing(doc, defaultRate = DEFAULT_BRL_RATE) {
  const rate = Number(doc.bdtRateAtBooking ?? doc.exchangeRateAtBooking ?? defaultRate) || defaultRate;
  const storedCurrency = doc.originalCurrency || 'BDT';

  let purchaseBRL;
  let saleBRL;
  let costsBRL;
  let purchaseBDT;
  let saleBDT;
  let costsBDT;

  if (storedCurrency === 'BRL') {
    purchaseBRL = doc.originalPurchasePrice ?? doc.purchasePriceBRL ?? doc.purchasePrice ?? 0;
    saleBRL = doc.originalSalePrice ?? doc.salePriceBRL ?? doc.salePrice ?? 0;
    costsBRL = doc.originalDirectCosts ?? doc.directCostsBRL ?? doc.directCosts ?? 0;
    purchaseBDT = doc.purchasePriceBDT ?? purchaseBRL * rate;
    saleBDT = doc.salePriceBDT ?? saleBRL * rate;
    costsBDT = doc.directCostsBDT ?? costsBRL * rate;
  } else {
    purchaseBDT = doc.purchasePriceBDT ?? doc.purchasePrice ?? 0;
    saleBDT = doc.salePriceBDT ?? doc.salePrice ?? 0;
    costsBDT = doc.directCostsBDT ?? doc.directCosts ?? 0;
    purchaseBRL = rate > 0 ? purchaseBDT / rate : purchaseBDT;
    saleBRL = rate > 0 ? saleBDT / rate : saleBDT;
    costsBRL = rate > 0 ? costsBDT / rate : costsBDT;
  }

  const profitBRL = saleBRL - purchaseBRL - costsBRL;
  const profitBDT = saleBDT - purchaseBDT - costsBDT;
  const customerDueBDT = doc.customerDue ?? 0;
  const supplierPayableBDT = doc.supplierPayable ?? 0;

  const pricing = {
    purchasePriceBRL: purchaseBRL,
    salePriceBRL: saleBRL,
    directCostsBRL: costsBRL,
    profitBRL,
    purchasePriceBDT: purchaseBDT,
    salePriceBDT: saleBDT,
    directCostsBDT: costsBDT,
    profitBDT,
    customerDueBRL: rate > 0 ? customerDueBDT / rate : customerDueBDT,
    customerDueBDT,
    supplierPayableBRL: rate > 0 ? supplierPayableBDT / rate : supplierPayableBDT,
    supplierPayableBDT,
    bdtRateAtBooking: rate,
    currency: 'BRL',
  };

  return pricing;
}

/** Build BRL form inputs into booking currency snapshot fields */
export function buildBookingCurrencySnapshot({ purchasePriceBRL, salePriceBRL, directCostsBRL, bdtRate, rates }) {
  const rate = resolveBdtRate(bdtRate, rates);
  const purchaseBRL = Number(purchasePriceBRL) || 0;
  const saleBRL = Number(salePriceBRL) || 0;
  const costsBRL = Number(directCostsBRL) || 0;
  const purchaseBDT = purchaseBRL * rate;
  const saleBDT = saleBRL * rate;
  const costsBDT = costsBRL * rate;

  return {
    originalCurrency: 'BRL',
    originalPurchasePrice: purchaseBRL,
    originalSalePrice: saleBRL,
    originalDirectCosts: costsBRL,
    purchasePriceBRL: purchaseBRL,
    salePriceBRL: saleBRL,
    directCostsBRL: costsBRL,
    purchasePrice: purchaseBDT,
    salePrice: saleBDT,
    directCosts: costsBDT,
    purchasePriceBDT: purchaseBDT,
    salePriceBDT: saleBDT,
    directCostsBDT: costsBDT,
    bdtRateAtBooking: rate,
    exchangeRateAtBooking: rate,
  };
}

export default {
  normalizeRates,
  formatCurrency,
  buildBRLPricing,
  normalizeBookingToPricing,
  normalizeLegacyBookingPricing,
  buildBookingCurrencySnapshot,
  resolveBdtRate,
  bdtToBrl,
  brlToBdt,
};
