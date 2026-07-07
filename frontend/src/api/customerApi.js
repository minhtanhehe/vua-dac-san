import api from './axios';

export const customerApi = {
  getAll: (params) => api.get('/orders/customers', { params }),
  getById: (id) => api.get(`/orders/customers/${id}`),
  getMe: () => api.get('/orders/customers/me'),
  create: (data) => api.post('/orders/customers', data),
  update: (id, data) => api.put(`/orders/customers/${id}`, data),
  delete: (id) => api.delete(`/orders/customers/${id}`),
  getOrders: (id, params) => api.get(`/orders/customers/${id}/orders`, { params }),
  addAddress: (customerId, data) => api.post(`/orders/customers/${customerId}/addresses`, data),
  register: (data) => api.post('/orders/customers/register', data),
  verifyOtp: (data) => api.post('/orders/customers/verify-otp', data),
};
