import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  updatePassword: (data) => api.put('/password', data),
  uploadAvatar: (formData) => api.post('/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const categoryAPI = {
  getList: () => api.get('/categories'),
  getDetail: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const productAPI = {
  getList: (params) => api.get('/products', { params }),
  getDetail: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  uploadImage: (formData) => api.post('/products/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const cartAPI = {
  getList: () => api.get('/cart'),
  add: (data) => api.post('/cart', data),
  update: (id, data) => api.put(`/cart/${id}`, data),
  remove: (id) => api.delete(`/cart/${id}`),
};

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getList: (params) => api.get('/orders', { params }),
  getDetail: (id) => api.get(`/orders/${id}`),
  pay: (id) => api.post(`/orders/${id}/pay`),
  cancel: (id, data) => api.post(`/orders/${id}/cancel`, data),
  refund: (id, data) => api.post(`/orders/${id}/refund`, data),
  getAdminList: (params) => api.get('/admin/orders', { params }),
  getAdminDetail: (id) => api.get(`/admin/orders/${id}`),
  delete: (id) => api.delete(`/admin/orders/${id}`),
  complete: (id) => api.post(`/admin/orders/${id}/complete`),
};

export const commentAPI = {
  getList: (params) => api.get('/comments', { params }),
  getDetail: (id) => api.get(`/comments/${id}`),
  create: (data) => api.post('/comments', data),
  getAdminList: (params) => api.get('/admin/comments', { params }),
  reply: (id, data) => api.put(`/admin/comments/${id}/reply`, data),
  delete: (id) => api.delete(`/admin/comments/${id}`),
};

export const newsAPI = {
  getList: (params) => api.get('/news', { params }),
  getDetail: (id) => api.get(`/news/${id}`),
  create: (data) => api.post('/news', data),
  update: (id, data) => api.put(`/news/${id}`, data),
  delete: (id) => api.delete(`/news/${id}`),
  uploadImage: (formData) => api.post('/news/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const bannerAPI = {
  getList: () => api.get('/banners'),
  create: (data) => api.post('/banners', data),
  update: (id, data) => api.put(`/banners/${id}`, data),
  delete: (id) => api.delete(`/banners/${id}`),
};

export const userAPI = {
  getList: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updatePassword: (id, data) => api.put(`/users/${id}/password`, data),
  uploadAvatar: (id, formData) => api.post(`/users/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default api;
