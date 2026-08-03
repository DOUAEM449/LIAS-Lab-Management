import axios from 'axios';

// The backend exposes every endpoint under /api/v1 (see SecurityConfig /
// the controllers in lab-management). Vite's dev server proxies /api to
// http://localhost:8080 (see vite.config.js), so this works both in dev
// and in a same-origin production build.
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lias_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lias_access_token');
      localStorage.removeItem('lias_refresh_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
