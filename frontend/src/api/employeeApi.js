import api from './axios';

export const employeeApi = {
  getAll: (params) => api.get('/users/employees', { params }),
  getById: (id) => api.get(`/users/employees/${id}`),
  create: (data) => api.post('/users/employees', data),
  update: (id, data) => api.put(`/users/employees/${id}`, data),
  updateStatus: (id, data) => api.put(`/users/employees/${id}/status`, data),
  getActivityLogs: (id) => api.get(`/users/employees/${id}/activity-log`),
  updatePermissions: (id, data) => api.put(`/users/employees/${id}/permissions`, data),
  getSchedule: (id, params) => api.get(`/users/employees/${id}/schedule`, { params }),
};
