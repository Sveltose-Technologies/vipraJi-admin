import { apiClient } from './apiClient';

export const createAartiCategory = async (data) => {
  const response = await apiClient.post('/aarti-category/create', data);
  return response.data;
};

export const getAllAartiCategories = async () => {
  const response = await apiClient.get('/aarti-category/get-all');
  return response.data;
};

export const getAartiCategoryById = async (id) => {
  const response = await apiClient.get(`/aarti-category/get-by-id/${id}`);
  return response.data;
};

export const updateAartiCategory = async (id, data) => {
  const response = await apiClient.put(`/aarti-category/update/${id}`, data);
  return response.data;
};

export const deleteAartiCategory = async (id) => {
  const response = await apiClient.delete(`/aarti-category/delete/${id}`);
  return response.data;
};
