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
  updateApproval: (id, data) => api.patch(`/orders/${id}/approval`, data),
  uploadPassport: (id, file) => {
    const form = new FormData();
    form.append('passport', file);
    return api.post(`/orders/${id}/passport`, form);
  },
  addFollowUp: (id, data) => api.post(`/orders/${id}/follow-up`, data),
  linkCustomer: (id, data) => api.post(`/orders/${id}/link-customer`, data),
  delete: (id) => api.delete(`/orders/${id}`),
};

export const bookingsApi = {
  list: (params) => api.get('/bookings', { params }),
  summary: (params) => api.get('/bookings/summary', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  createFromOrder: (orderId, data) => api.post(`/bookings/from-order/${orderId}`, data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  updateStatus: (id, data) => api.patch(`/bookings/${id}/status`, data),
  updateApproval: (id, data) => api.patch(`/bookings/${id}/approval`, data),
  uploadPassport: (id, file) => {
    const form = new FormData();
    form.append('passport', file);
    return api.post(`/bookings/${id}/passport`, form);
  },
  uploadTicket: (id, file) => {
    const form = new FormData();
    form.append('ticketFile', file);
    return api.post(`/bookings/${id}/ticket`, form);
  },
  addNote: (id, data) => api.post(`/bookings/${id}/notes`, data),
  getTimeline: (id) => api.get(`/bookings/${id}/timeline`),
  delete: (id) => api.delete(`/bookings/${id}`),
  downloadInvoicePdf: (id) => api.get(`/bookings/${id}/invoice/pdf`, { responseType: 'blob' }),
  downloadETicketPdf: (id) => api.get(`/bookings/${id}/e-ticket/pdf`, { responseType: 'blob' }),
  void: (id, data) => api.post(`/bookings/${id}/void`, data),
  refund: (id, data) => api.post(`/bookings/${id}/refund`, data),
  reissue: (id, data) => api.post(`/bookings/${id}/reissue`, data),
  upcoming: (params) => api.get('/bookings/upcoming', { params }),
  extractTicket: (file) => {
    const form = new FormData();
    form.append('ticketFile', file);
    return api.post('/bookings/extract-ticket', form);
  },
  scheduleChange: (id, data) => api.post(`/bookings/${id}/schedule-change`, data),
  scheduleChangeWithTicket: (id, file, data = {}) => {
    const form = new FormData();
    if (file) form.append('ticketFile', file);
    Object.entries(data).forEach(([k, v]) => { if (v != null) form.append(k, v); });
    return api.post(`/bookings/${id}/schedule-change/ticket`, form);
  },
};

export const usersApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  setStatus: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),
  deactivate: (id) => api.delete(`/users/${id}`),
  uploadDocument: (id, docType, file) => {
    const form = new FormData();
    form.append('document', file);
    return api.post(`/users/${id}/documents/${docType}`, form);
  },
};
