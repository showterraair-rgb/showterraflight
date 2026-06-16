import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/agent/auth/login')) {
      window.dispatchEvent(new CustomEvent('agent:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export default api;
