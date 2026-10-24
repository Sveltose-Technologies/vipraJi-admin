import axios from 'axios';

const API_URL = import.meta.env.DEV ? '/api-proxy' : 'https://backend.viprasaarthi.com';

export const DEFAULT_ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhY2YxNTMyNTQ5NjA0MDhkNTJiMjU1MiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc5MjE0NzY1NSwiZXhwIjoxNzkyNzUyNDU1fQ.nBLbg9bnEDysCBjD5-vIyMy5xKZKaTkuQklVP5PzBb0';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  let token = null;
  try {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    token = adminUser?.token || localStorage.getItem('token') || localStorage.getItem('adminToken');
  } catch {
    token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  }

  if (!token) {
    token = DEFAULT_ADMIN_TOKEN;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
