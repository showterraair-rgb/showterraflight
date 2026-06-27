import api from './api';



export const accountsApi = {

  list: (params) => api.get('/accounts', { params }),

  summary: () => api.get('/accounts/summary'),

  get: (id) => api.get(`/accounts/${id}`),

  create: (data) => api.post('/accounts', data),

  update: (id, data) => api.put(`/accounts/${id}`, data),

  updateStatus: (id, data) => api.patch(`/accounts/${id}/status`, data),

  statement: (id, params) => api.get(`/accounts/${id}/statement`, { params }),

  setOpeningBalance: (id, data) => api.put(`/accounts/${id}/opening-balance`, data),

  listTransfers: (params) => api.get('/accounts/transfers', { params }),

  createTransfer: (data) => api.post('/accounts/transfers', data),

  voidTransfer: (id, data) => api.post(`/accounts/transfers/${id}/void`, data),

};



export const paymentsApi = {

  listCustomer: (params) => api.get('/payments/customers', { params }),

  getCustomer: (id) => api.get(`/payments/customers/${id}`),

  createCustomer: (data) => api.post('/payments/customers', data),

  voidCustomer: (id, data) => api.post(`/payments/customers/${id}/void`, data),

  listSupplier: (params) => api.get('/payments/suppliers', { params }),

  getSupplier: (id) => api.get(`/payments/suppliers/${id}`),

  createSupplier: (data) => api.post('/payments/suppliers', data),

  voidSupplier: (id, data) => api.post(`/payments/suppliers/${id}/void`, data),

};



export const expensesApi = {

  listCategories: () => api.get('/expenses/categories'),

  list: (params) => api.get('/expenses', { params }),

  get: (id) => api.get(`/expenses/${id}`),

  create: (data) => api.post('/expenses', data),

  uploadBill: (id, file) => {
    const form = new FormData();
    form.append('billFile', file);
    return api.post(`/expenses/${id}/bill`, form);
  },

  void: (id, data) => api.post(`/expenses/${id}/void`, data),

};



export const paymentRequestsApi = {

  list: (params) => api.get('/payments/requests', { params }),

  create: (data) => api.post('/payments/requests', data),

  cancel: (id, data) => api.post(`/payments/requests/${id}/cancel`, data),

  record: (id, data) => api.post(`/payments/requests/${id}/record`, data),

};



export const gatewayApi = {

  getStatus: () => api.get('/payments/gateway/status'),

  getSettings: () => api.get('/payments/gateway/settings'),

  updateSettings: (data) => api.patch('/payments/gateway/settings', data),

  initiate: (data) => api.post('/payments/gateway/initiate', data),

  initiateSslcommerz: (data) => api.post('/payments/gateway/sslcommerz/initiate', data),

  initiateBkash: (data) => api.post('/payments/gateway/bkash/initiate', data),

  getTransaction: (tranId) => api.get(`/payments/gateway/transactions/${encodeURIComponent(tranId)}`),

};


