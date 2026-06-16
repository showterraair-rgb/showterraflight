import { useEffect, useState } from 'react';
import api from '../services/api';

const DEFAULT_BRL_RATE = 22.5;

export function useCurrency() {
  const [brlRate, setBrlRate] = useState(DEFAULT_BRL_RATE);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/currencies')
      .then((res) => {
        const brl = (res.data.currencies || []).find((c) => c.code === 'BRL');
        if (brl?.rateToBase) setBrlRate(brl.rateToBase);
        setRatesUpdatedAt(res.data.updatedAt || null);
      })
      .catch(() => setBrlRate(DEFAULT_BRL_RATE))
      .finally(() => setLoading(false));
  }, []);

  const bdtFromBrl = (amountBRL, rate = brlRate) => Number(amountBRL || 0) * Number(rate || DEFAULT_BRL_RATE);
  const brlFromBdt = (amountBDT, rate = brlRate) => {
    const r = Number(rate || DEFAULT_BRL_RATE);
    return r > 0 ? Number(amountBDT || 0) / r : 0;
  };

  return { brlRate, ratesUpdatedAt, loading, bdtFromBrl, brlFromBdt };
}

export default useCurrency;
