import api from './api';

export const rolesApi = {
  list: () => api.get('/roles'),
  getMatrix: () => api.get('/roles/matrix'),
  update: (roleName, data) => api.put(`/roles/${roleName}`, data),
};

export default rolesApi;
