import api from './api';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  requestOtp: (data) => api.post('/auth/otp/request', data),
  verifyOtp: (data) => api.post('/auth/otp/verify', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
  getAlerts: () => api.get('/dashboard/alerts'),
};

export default api;
