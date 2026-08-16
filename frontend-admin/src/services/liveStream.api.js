import api from './api';

export const liveStreamsApi = {
  summary: () => api.get('/livestreams/summary'),
  list: (params) => api.get('/livestreams', { params }),
  get: (id) => api.get(`/livestreams/${id}`),
  create: (body) => api.post('/livestreams', body),
  update: (id, body) => api.put(`/livestreams/${id}`, body),
  remove: (id) => api.delete(`/livestreams/${id}`),
  goLive: (id) => api.post(`/livestreams/${id}/go-live`),
  end: (id) => api.post(`/livestreams/${id}/end`),
};

export default liveStreamsApi;
