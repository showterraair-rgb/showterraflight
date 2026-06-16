import api from './api';

export const agentAuthApi = {
  login: (data) => api.post('/agent/auth/login', data),
  logout: () => api.post('/agent/auth/logout'),
  me: () => api.get('/agent/me'),
  forgotPassword: (email) => api.post('/agent/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/agent/auth/reset-password', data),
};

export const agentApi = {
  dashboard: () => api.get('/agent/dashboard'),
  profile: () => api.get('/agent/profile'),
  updateProfile: (data) => api.patch('/agent/profile', data),
  changePassword: (data) => api.patch('/agent/profile/password', data),
  createBooking: (data) => api.post('/agent/bookings', data),
  createBookingWithFile: (formData) => api.post('/agent/bookings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  listBookings: (params) => api.get('/agent/bookings', { params }),
  getBooking: (id) => api.get(`/agent/bookings/${id}`),
  cancelBooking: (id) => api.patch(`/agent/bookings/${id}/cancel`),
  reportSummary: (params) => api.get('/agent/reports/summary', { params }),
  reportMonthly: (params) => api.get('/agent/reports/monthly', { params }),
  reportAirlines: (params) => api.get('/agent/reports/airlines', { params }),
  statement: (params) => api.get('/agent/statement', { params }),
  notifications: (params) => api.get('/agent/notifications', { params }),
  markRead: (id) => api.patch(`/agent/notifications/${id}/read`),
  markAllRead: () => api.patch('/agent/notifications/read-all'),
};
