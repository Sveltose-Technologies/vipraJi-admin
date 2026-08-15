import { apiClient } from './apiClient';

export const createPooja = async (formData) => {
  const response = await apiClient.post('/pooja/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAllPoojas = async () => {
  const response = await apiClient.get('/pooja/get-all');
  return response.data;
};

export const getPoojaById = async (id) => {
  const response = await apiClient.get(`/pooja/get-by-id/${id}`);
  return response.data;
};

export const updatePooja = async (id, formData) => {
  const response = await apiClient.put(`/pooja/update/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deletePooja = async (id) => {
  const response = await apiClient.delete(`/pooja/delete/${id}`);
  return response.data;
};
