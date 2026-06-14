import api from './api';

export const remindersApi = {
  list: (params) => api.get('/reminders', { params }),
  get: (id) => api.get(`/reminders/${id}`),
  create: (body) => api.post('/reminders', body),
  updateStatus: (id, body) => api.patch(`/reminders/${id}/status`, body),
  runGenerators: () => api.post('/reminders/jobs/generate'),
  sendPending: () => api.post('/reminders/jobs/send'),
};

export const reportsApi = {
  listTypes: () => api.get('/reports'),
  run: (reportKey, params) => api.get(`/reports/${reportKey}`, { params }),
  exportCsv: (reportKey, params) =>
    api.get(`/reports/${reportKey}/export/csv`, { params, responseType: 'blob' }),
  exportPdf: (reportKey, params) =>
    api.get(`/reports/${reportKey}/export/pdf`, { params, responseType: 'blob' }),
};

export const cmsApi = {
  listPages: () => api.get('/cms/pages'),
  getPage: (pageKey) => api.get(`/cms/pages/${pageKey}`),
  updatePage: (pageKey, body) => api.put(`/cms/pages/${pageKey}`, body),
  restoreHomeDefaults: () => api.post('/cms/pages/home/restore-defaults'),
  listNotices: (params) => api.get('/cms/notices', { params }),
  createNotice: (body) => api.post('/cms/notices', body),
  updateNotice: (id, body) => api.put(`/cms/notices/${id}`, body),
  deleteNotice: (id) => api.delete(`/cms/notices/${id}`),
  getSettings: () => api.get('/cms/settings'),
  updateSettings: (body) => api.put('/cms/settings', body),
  updateLogo: (body) => api.put('/cms/logo', body),
  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/cms/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const backupApi = {
  list: (params) => api.get('/backups', { params }),
  get: (id) => api.get(`/backups/${id}`),
  trigger: () => api.post('/backups/trigger'),
  strategy: () => api.get('/backups/strategy'),
};

export const securityApi = {
  loginLogs: (params) => api.get('/security/login-logs', { params }),
  auditLogs: (params) => api.get('/audit/logs', { params }),
  overview: () => api.get('/security/overview'),
  getSettings: () => api.get('/security/settings'),
  updateSettings: (body) => api.put('/security/settings', body),
  prepareMfa: () => api.post('/security/mfa/prepare'),
};
