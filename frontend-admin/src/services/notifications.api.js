import api from './api';

export const notificationsApi = {
  getSmsSettings: () => api.get('/notifications/settings/sms'),
  updateSmsSettings: (data) => api.put('/notifications/settings/sms', data),
  testSms: (data) => api.post('/notifications/settings/sms/test', data),
  getSmsBalance: () => api.get('/notifications/settings/sms/balance'),

  getEmailSettings: () => api.get('/notifications/settings/email'),
  updateEmailSettings: (data) => api.put('/notifications/settings/email', data),
  testEmail: (data) => api.post('/notifications/settings/email/test', data),

  getWhatsAppSettings: () => api.get('/notifications/settings/whatsapp'),
  updateWhatsAppSettings: (data) => api.put('/notifications/settings/whatsapp', data),
  testWhatsApp: (data) => api.post('/notifications/settings/whatsapp/test', data),

  listTemplates: () => api.get('/notifications/templates'),
  getTemplate: (key) => api.get(`/notifications/templates/${key}`),
  updateTemplate: (key, data) => api.put(`/notifications/templates/${key}`, data),

  listAutomation: () => api.get('/notifications/automation'),
  updateAutomation: (eventType, data) => api.put(`/notifications/automation/${eventType}`, data),

  listLogs: (params) => api.get('/notifications/logs', { params }),
};

export default notificationsApi;
