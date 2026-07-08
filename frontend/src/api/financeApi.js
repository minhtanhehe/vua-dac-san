import api from './axios';

export const financeApi = {
  // Payroll
  getPayroll: (params) => api.get('/finance/payroll', { params }),
  createPayroll: (data) => api.post('/finance/payroll', data),
  confirmPayroll: (id) => api.put(`/finance/payroll/${id}/confirm`),

  // Statistics
  getRevenue: (params) => api.get('/finance/statistics/revenue', { params }),
  exportExcel: (params) => api.get('/finance/statistics/export', { params, responseType: 'blob' }),
};
