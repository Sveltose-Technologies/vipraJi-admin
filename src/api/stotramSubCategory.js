import { apiClient } from './apiClient';

export const createStotramSubCategory = async (formData) => {
  const response = await apiClient.post('/stotram-sub-category/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAllStotramSubCategories = async () => {
  const response = await apiClient.get('/stotram-sub-category/get-all');
  return response.data;
};

export const getStotramSubCategoryById = async (id) => {
  const response = await apiClient.get(`/stotram-sub-category/get-by-id/${id}`);
  return response.data;
};

export const updateStotramSubCategory = async (id, formData) => {
  const response = await apiClient.put(`/stotram-sub-category/update/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteStotramSubCategory = async (id) => {
  const response = await apiClient.delete(`/stotram-sub-category/delete/${id}`);
  return response.data;
};
