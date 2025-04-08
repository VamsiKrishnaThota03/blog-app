import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  setToken: (token: string) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  removeToken: () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  },
};

export const posts = {
  getAll: (page: number = 1) => api.get(`/posts?page=${page}`),
  getOne: (id: string) => api.get(`/posts/${id}`),
  create: (data: { title: string; content: string }) =>
    api.post('/posts', data),
  update: (id: string, data: { title: string; content: string }) =>
    api.put(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  getUserPosts: () => api.get('/posts/user/me'),
};

export default api;