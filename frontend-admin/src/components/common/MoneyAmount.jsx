import DualCurrencyAmount from './DualCurrencyAmount';
import { useCurrency } from '../../hooks/useCurrency';

/** Display any monetary value: BRL primary, BDT secondary. Pass BDT amount or explicit BRL+BDT pair. */
export default function MoneyAmount({ amount, totalBRL, totalBDT, size = 'md', className = '' }) {
  const { brlFromBdt } = useCurrency();
  const bdt = totalBDT ?? amount ?? 0;
  const brl = totalBRL ?? brlFromBdt(bdt);
  return <DualCurrencyAmount totalBRL={brl} totalBDT={bdt} size={size} className={className} />;
}

export function getBookingMoney(row) {
  const p = row?.pricing;
  if (p) {
    return {
      saleBRL: p.salePriceBRL ?? 0,
      saleBDT: p.salePriceBDT ?? 0,
      profitBRL: p.profitBRL ?? 0,
      profitBDT: p.profitBDT ?? 0,
      purchaseBRL: p.purchasePriceBRL ?? 0,
      purchaseBDT: p.purchasePriceBDT ?? 0,
      supplierDueBRL: p.supplierPayableBRL ?? 0,
      supplierDueBDT: p.supplierPayableBDT ?? 0,
    };
  }
  return {
    saleBRL: null,
    saleBDT: row?.salePrice ?? 0,
    profitBRL: null,
    profitBDT: row?.profit ?? 0,
    purchaseBRL: null,
    purchaseBDT: row?.purchasePrice ?? 0,
    supplierDueBRL: null,
    supplierDueBDT: row?.supplierPayable ?? 0,
  };
}
