import { useEffect, useState } from 'react';
import api from '../services/api';

const SYMBOLS = { BDT: '৳', BRL: 'R$' };
const DEFAULT_RATES = { BDT: 1, BRL: 22.5 };

export function useCurrency() {
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/currencies')
      .then((res) => {
        const map = { ...DEFAULT_RATES };
        (res.data.currencies || []).forEach((c) => {
          map[c.code] = c.rateToBase;
        });
        map.BDT = 1;
        setRates(map);
      })
      .catch(() => setRates(DEFAULT_RATES))
      .finally(() => setLoading(false));
  }, []);

  function convert(amount, from, to = 'BDT') {
    const num = Number(amount) || 0;
    const inBDT = from === 'BDT' ? num : num * (rates[from] || 1);
    return to === 'BDT' ? inBDT : inBDT / (rates[to] || 1);
  }

  function format(amount, currency = 'BDT') {
    const symbol = SYMBOLS[currency] || currency;
    return `${symbol} ${Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return { rates, loading, convert, format, brlRate: rates.BRL };
}

export default useCurrency;
