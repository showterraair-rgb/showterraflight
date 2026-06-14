import api from './api';

export const customersApi = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const suppliersApi = {
  list: (params) => api.get('/suppliers', { params }),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

export const ordersApi = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  addFollowUp: (id, data) => api.post(`/orders/${id}/follow-up`, data),
  linkCustomer: (id, data) => api.post(`/orders/${id}/link-customer`, data),
  delete: (id) => api.delete(`/orders/${id}`),
};

export const bookingsApi = {
  list: (params) => api.get('/bookings', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  createFromOrder: (orderId, data) => api.post(`/bookings/from-order/${orderId}`, data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  updateStatus: (id, data) => api.patch(`/bookings/${id}/status`, data),
  addNote: (id, data) => api.post(`/bookings/${id}/notes`, data),
  getTimeline: (id) => api.get(`/bookings/${id}/timeline`),
  delete: (id) => api.delete(`/bookings/${id}`),
  downloadInvoicePdf: (id) => api.get(`/bookings/${id}/invoice/pdf`, { responseType: 'blob' }),
};
