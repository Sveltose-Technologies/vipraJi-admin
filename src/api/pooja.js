import { apiClient } from './apiClient';

/**
 * Pooja Library API Service
 * Handles CRUD operations for Pooja sections (Heading, Description, Dhyan, Mantra, Notes).
 */

export const createPooja = async (data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const response = await apiClient.post('/pooja/create', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
};

export const getAllPoojas = async (params = {}) => {
  const cleanParams = {};
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '' && params[key] !== 'all') {
      cleanParams[key] = params[key];
    }
  });

  const response = await apiClient.get('/pooja/get-all', {
    params: cleanParams,
  });
  return response.data;
};

export const getPoojaById = async (id) => {
  const response = await apiClient.get(`/pooja/get-by-id/${id}`);
  return response.data;
};

export const updatePooja = async (id, data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const response = await apiClient.put(`/pooja/update/${id}`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
};

export const deletePooja = async (id) => {
  const response = await apiClient.delete(`/pooja/delete/${id}`);
  return response.data;
};
