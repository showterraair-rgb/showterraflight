import api from './api';

export const currencyApi = {
  getSettings: () => api.get('/admin/settings/currencies'),
  updateBRLRate: (rateToBase) => api.patch('/admin/settings/currencies', { BRL: { rateToBase } }),
};
