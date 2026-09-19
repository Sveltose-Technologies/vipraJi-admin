import { apiClient } from './apiClient';

export const createYajmanCategory = async (data) => {
  const response = await apiClient.post('/yajman-category/create', data);
  return response.data;
};

export const getAllYajmanCategories = async () => {
  const response = await apiClient.get('/yajman-category/get-all');
  return response.data;
};

export const getYajmanCategoryById = async (id) => {
  const response = await apiClient.get(`/yajman-category/get-by-id/${id}`);
  return response.data;
};

export const updateYajmanCategory = async (id, data) => {
  const response = await apiClient.put(`/yajman-category/update/${id}`, data);
  return response.data;
};

export const deleteYajmanCategory = async (id) => {
  const response = await apiClient.delete(`/yajman-category/delete/${id}`);
  return response.data;
};
