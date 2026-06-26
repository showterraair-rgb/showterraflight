import { useEffect, useState } from 'react';
import api from '../services/api';

const DEFAULT_BRL_RATE = 22.5;
const DEFAULT_USD_RATE = 110;

export function useCurrency() {
  const [brlRate, setBrlRate] = useState(DEFAULT_BRL_RATE);
  const [usdRate, setUsdRate] = useState(DEFAULT_USD_RATE);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/currencies')
      .then((res) => {
        const brl = (res.data.currencies || []).find((c) => c.code === 'BRL');
        const usd = (res.data.currencies || []).find((c) => c.code === 'USD');
        if (brl?.rateToBase) setBrlRate(brl.rateToBase);
        if (usd?.rateToBase) setUsdRate(usd.rateToBase);
        setRatesUpdatedAt(res.data.updatedAt || null);
      })
      .catch(() => {
        setBrlRate(DEFAULT_BRL_RATE);
        setUsdRate(DEFAULT_USD_RATE);
      })
      .finally(() => setLoading(false));
  }, []);

  const bdtFromBrl = (amountBRL, rate = brlRate) => Number(amountBRL || 0) * Number(rate || DEFAULT_BRL_RATE);
  const brlFromBdt = (amountBDT, rate = brlRate) => {
    const r = Number(rate || DEFAULT_BRL_RATE);
    return r > 0 ? Number(amountBDT || 0) / r : 0;
  };

  const bdtFromUsd = (amountUSD, rate = usdRate) => Number(amountUSD || 0) * Number(rate || DEFAULT_USD_RATE);

  return { brlRate, usdRate, ratesUpdatedAt, loading, bdtFromBrl, brlFromBdt, bdtFromUsd };
}

export default useCurrency;
