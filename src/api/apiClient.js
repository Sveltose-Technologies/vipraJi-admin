import axios from 'axios';

const API_URL = import.meta.env.DEV ? '/api' : 'https://backend.viprasaarthi.com/';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
