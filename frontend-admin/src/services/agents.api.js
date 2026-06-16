import api from './api';

export const agentsApi = {
  list: (params) => api.get('/admin/agents', { params }),
  get: (id) => api.get(`/admin/agents/${id}`),
  create: (data) => api.post('/admin/agents', data),
  update: (id, data) => api.patch(`/admin/agents/${id}`, data),
  toggle: (id) => api.patch(`/admin/agents/${id}/toggle`),
  delete: (id) => api.delete(`/admin/agents/${id}`),
  bookings: (id, params) => api.get(`/admin/agents/${id}/bookings`, { params }),
};

export const agentBookingsApi = {
  list: (params) => api.get('/admin/agent-bookings', { params }),
  get: (id) => api.get(`/admin/agent-bookings/${id}`),
  updateStatus: (id, data) => api.patch(`/admin/agent-bookings/${id}/status`, data),
  uploadTicket: (id, file) => {
    const fd = new FormData();
    fd.append('ticketFile', file);
    return api.post(`/admin/agent-bookings/${id}/ticket`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  addNote: (id, note) => api.post(`/admin/agent-bookings/${id}/note`, { note }),
  downloadPdf: (id) => api.get(`/admin/agent-bookings/${id}/pdf`, { responseType: 'blob' }),
};

export const agentAccountingApi = {
  ledger: (agentId, params) => api.get(`/admin/agent-accounting/${agentId}`, { params }),
  addTransaction: (agentId, data) => api.post(`/admin/agent-accounting/${agentId}`, data),
};
