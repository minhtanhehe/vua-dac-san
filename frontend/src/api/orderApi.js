import api from './axios';

export const orderApi = {
  getAll: (params) => api.get('/orders/', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders/', data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  cancel: (id) => api.delete(`/orders/${id}/cancel`),
  getInvoice: (id) => api.get(`/orders/${id}/invoice`),
};
