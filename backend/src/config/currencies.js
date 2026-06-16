/** Default currency configuration — BDT is base; BRL rate is admin-configurable */
export const DEFAULT_CURRENCIES = {
  BDT: {
    name: 'Bangladeshi Taka',
    symbol: '৳',
    code: 'BDT',
    isBase: true,
    rateToBase: 1,
  },
  BRL: {
    name: 'Brazilian Real',
    symbol: 'R$',
    code: 'BRL',
    isBase: false,
    rateToBase: 22.5,
  },
};

export const SUPPORTED_CURRENCY_CODES = ['BDT', 'BRL'];

export default DEFAULT_CURRENCIES;
