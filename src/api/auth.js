import axios from 'axios';

// Use Vite proxy in development to avoid CORS, and the real URL in production
const API_URL = import.meta.env.DEV ? '/api' : 'https://backend.vipraji.com';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const signup = async (userData) => {
  const response = await apiClient.post('/auth/signup', userData);
  return response.data;
};

export const verifyOtp = async (data) => {
  const response = await apiClient.post('/auth/verify-otp', data);
  return response.data;
};

export const login = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const resendOtp = async (data) => {
  const response = await apiClient.post('/auth/resend-otp', data);
  return response.data;
};

export const forgotPassword = async (data) => {
  const response = await apiClient.post('/auth/forgot-password', data);
  return response.data;
};

export const verifyForgotPasswordOtp = async (data) => {
  const response = await apiClient.post('/auth/verify-forgot-password-otp', data);
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await apiClient.put('/auth/reset-password', data);
  return response.data;
};

export const updateProfile = async ({ id, formData }) => {
  const response = await apiClient.put(`/auth/update/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
