import api from './axios';

export const warehouseApi = {
  getInvoices: (params) => api.get('/warehouse/invoices', { params }),
  getInvoiceById: (id) => api.get(`/warehouse/invoices/${id}`),
  createImport: (data) => api.post('/warehouse/invoices/import', data),
  createExport: (data) => api.post('/warehouse/invoices/export', data),
  update: (id, data) => api.put(`/warehouse/invoices/${id}`, data),
  delete: (id) => api.delete(`/warehouse/invoices/${id}`),
};
