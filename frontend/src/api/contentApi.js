import api from './axios';

export const contentApi = {
  // Posts
  getPublicPosts: (params) => api.get('/content/posts', { params }),
  getManagePosts: (params) => api.get('/content/posts/manage', { params }),
  getPostById: (id) => api.get(`/content/posts/${id}`),
  createPost: (data) => api.post('/content/posts', data),
  updatePost: (id, data) => api.put(`/content/posts/${id}`, data),
  updatePostStatus: (id, data) => api.patch(`/content/posts/${id}/status`, data),
  deletePost: (id) => api.delete(`/content/posts/${id}`),
  getCategories: () => api.get('/content/categories'),

  // Support Requests
  getSupportRequests: (params) => api.get('/content/support-requests', { params }),
  getMySupportRequests: () => api.get('/content/support-requests/me'),
  replySupportRequest: (id, data) => api.put(`/content/support-requests/${id}/reply`, data),
  createSupportRequest: (data) => api.post('/content/support-requests', data),

  // Comments
  getPendingComments: () => api.get('/content/comments/pending'),
  approveComment: (id) => api.patch(`/content/comments/${id}/approve`),
  hideComment: (id) => api.patch(`/content/comments/${id}/hide`),
  createComment: (data) => api.post('/content/comments', data),
};
