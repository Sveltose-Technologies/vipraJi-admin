import { apiClient } from './apiClient';

export const createAarti = async (formData) => {
  const response = await apiClient.post('/aarti/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAllAartis = async () => {
  const response = await apiClient.get('/aarti/get-all');
  return response.data;
};

export const getAartiById = async (id) => {
  const response = await apiClient.get(`/aarti/get-by-id/${id}`);
  return response.data;
};

export const updateAarti = async (id, formData) => {
  const response = await apiClient.put(`/aarti/update/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteAarti = async (id) => {
  const response = await apiClient.delete(`/aarti/delete/${id}`);
  return response.data;
};
