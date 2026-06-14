import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const publicApi = {
  getCompanySettings: () => api.get('/public/settings/company'),
  getCmsPage: (pageKey) => api.get(`/public/cms/pages/${pageKey}`),
  getNotices: (params) => api.get('/public/cms/notices', { params }),
  submitBookingRequest: (data) => api.post('/public/booking-requests', data),
};

export default api;
