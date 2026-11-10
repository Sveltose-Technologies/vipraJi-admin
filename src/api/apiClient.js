import axios from 'axios';

const API_URL = import.meta.env.DEV ? '/api-proxy' : 'https://backend.viprasaarthi.com';

export const DEFAULT_ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhY2YxNTMzNTQ5NjA0MDhkNTJiMjU1OCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc5MjA0NzMxMCwiZXhwIjoxNzk0NjM5MzEwfQ.sPSuHSfBdXJXwInB3lyI5w1mw8CvIEtLMp9ZmlLayQ4';

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
