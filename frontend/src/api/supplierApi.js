import api from './axios';

export const supplierApi = {
  getAll: (params) => api.get('/users/suppliers', { params }),
  getById: (id) => api.get(`/users/suppliers/${id}`),
  create: (data) => api.post('/users/suppliers', data),
  update: (id, data) => api.put(`/users/suppliers/${id}`, data),
  delete: (id) => api.delete(`/users/suppliers/${id}`),
};
