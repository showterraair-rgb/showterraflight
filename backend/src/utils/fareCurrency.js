/**
 * Multi-currency fare helpers — BDT base, USD and BRL via rates at booking.
 */
export function buildFareRates({ bdtRate, usdRate } = {}) {
  const brlToBdt = Number(bdtRate) > 0 ? Number(bdtRate) : 22.5;
  const usdToBdt = Number(usdRate) > 0 ? Number(usdRate) : 110;
  return { brlToBdt, usdToBdt };
}

export function convertFare(amount, from, rates) {
  const val = Number(amount) || 0;
  if (!val) return { bdt: 0, usd: 0, brl: 0 };
  const { brlToBdt, usdToBdt } = rates;
  if (from === 'BDT') {
    return { bdt: val, usd: usdToBdt > 0 ? val / usdToBdt : 0, brl: brlToBdt > 0 ? val / brlToBdt : 0 };
  }
  if (from === 'USD') {
    const bdt = val * usdToBdt;
    return { bdt, usd: val, brl: brlToBdt > 0 ? bdt / brlToBdt : 0 };
  }
  if (from === 'BRL') {
    const bdt = val * brlToBdt;
    return { bdt, usd: usdToBdt > 0 ? bdt / usdToBdt : 0, brl: val };
  }
  return { bdt: val, usd: 0, brl: 0 };
}

export function computeFareTotals(booking, rates) {
  const sale = booking.fareSale || {};
  const purchase = booking.farePurchase || {};
  const costs = booking.fareCosts || {};
  const paid = booking.farePaid || {};

  const saleBdt = sale.bdt ?? booking.salePrice ?? 0;
  const purchaseBdt = purchase.bdt ?? booking.purchasePrice ?? 0;
  const costsBdt = costs.bdt ?? booking.directCosts ?? 0;
  const paidBdt = paid.bdt ?? booking.amountPaid ?? 0;

  const fullDueBdt = Math.max(0, saleBdt - paidBdt);
  const balanceBdt = fullDueBdt;
  const supplierDueBdt = Math.max(0, purchaseBdt + costsBdt - (booking.supplierPaid || 0));

  const { brlToBdt, usdToBdt } = rates;

  return {
    sale: {
      bdt: saleBdt,
      usd: sale.usd ?? (usdToBdt > 0 ? saleBdt / usdToBdt : 0),
      brl: sale.brl ?? (brlToBdt > 0 ? saleBdt / brlToBdt : 0),
    },
    purchase: {
      bdt: purchaseBdt,
      usd: purchase.usd ?? (usdToBdt > 0 ? purchaseBdt / usdToBdt : 0),
      brl: purchase.brl ?? (brlToBdt > 0 ? purchaseBdt / brlToBdt : 0),
    },
    costs: {
      bdt: costsBdt,
      usd: costs.usd ?? (usdToBdt > 0 ? costsBdt / usdToBdt : 0),
      brl: costs.brl ?? (brlToBdt > 0 ? costsBdt / brlToBdt : 0),
    },
    paid: {
      bdt: paidBdt,
      usd: paid.usd ?? (usdToBdt > 0 ? paidBdt / usdToBdt : 0),
      brl: paid.brl ?? (brlToBdt > 0 ? paidBdt / brlToBdt : 0),
    },
    fullDue: {
      bdt: fullDueBdt,
      usd: usdToBdt > 0 ? fullDueBdt / usdToBdt : 0,
      brl: brlToBdt > 0 ? fullDueBdt / brlToBdt : 0,
    },
    balance: {
      bdt: balanceBdt,
      usd: usdToBdt > 0 ? balanceBdt / usdToBdt : 0,
      brl: brlToBdt > 0 ? balanceBdt / brlToBdt : 0,
    },
    supplierDue: {
      bdt: supplierDueBdt,
      usd: usdToBdt > 0 ? supplierDueBdt / usdToBdt : 0,
      brl: brlToBdt > 0 ? supplierDueBdt / brlToBdt : 0,
    },
    profit: {
      bdt: saleBdt - purchaseBdt - costsBdt,
    },
  };
}

export default { buildFareRates, convertFare, computeFareTotals };
