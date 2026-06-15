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
  uploadPassport: (orderNumber, file) => {
    const form = new FormData();
    form.append('orderNumber', orderNumber);
    form.append('passport', file);
    return api.post('/public/booking-requests/passport', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
