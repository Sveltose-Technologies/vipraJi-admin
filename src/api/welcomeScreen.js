import { apiClient } from './apiClient';

/**
 * Welcome Screen API Service
 * Handles Admin CRUD and activation operations for app welcome/onboarding screens.
 */

export const getAllWelcomeScreens = async (params = {}) => {
  const cleanParams = {};
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '' && params[key] !== 'all') {
      cleanParams[key] = params[key];
    }
  });

  const response = await apiClient.get('/welcome/admin/get-all', {
    params: cleanParams,
  });
  return response.data;
};

export const getWelcomeScreenById = async (id) => {
  const response = await apiClient.get(`/welcome/admin/get-by-id/${id}`);
  return response.data;
};

export const createWelcomeScreen = async (data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const response = await apiClient.post('/welcome/admin/create', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
};

export const updateWelcomeScreen = async (id, data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const response = await apiClient.put(`/welcome/admin/update/${id}`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
};

export const deleteWelcomeScreen = async (id) => {
  const response = await apiClient.delete(`/welcome/admin/delete/${id}`);
  return response.data;
};

export const activateWelcomeScreen = async (id) => {
  const response = await apiClient.patch(`/welcome/admin/activate/${id}`);
  return response.data;
};

export const deactivateWelcomeScreen = async (id) => {
  const response = await apiClient.patch(`/welcome/admin/deactivate/${id}`);
  return response.data;
};

export const getActiveWelcomeScreen = async () => {
  const response = await apiClient.get('/welcome/active');
  return response.data;
};

