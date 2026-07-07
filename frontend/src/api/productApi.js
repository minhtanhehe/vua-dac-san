import api from './axios';

export const productApi = {
  getAll: (params) => api.get('/products/', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories/'),
  getExpiryWarning: () => api.get('/products/expiry-warning/'),
  uploadImage: (formData) => api.post('/products/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
};
