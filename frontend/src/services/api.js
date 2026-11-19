import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('shop_auth_token');
    if (token) {
      config.headers.Authorization = token;
    }
  } catch {}
  return config;
});

export default api;
