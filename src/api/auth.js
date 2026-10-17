import { apiClient } from './apiClient';

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
  const isFormData = typeof FormData !== 'undefined' && formData instanceof FormData;
  const response = await apiClient.put(`/auth/update/${id}`, formData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
};

export const getAllUsers = async () => {
  const response = await apiClient.get('/auth/get-all');
  return response.data;
};

export const updateUserStatus = async (id, status) => {
  const response = await apiClient.put(`/auth/update/${id}`, { status });
  return response.data;
};
