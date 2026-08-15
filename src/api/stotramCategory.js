import { apiClient } from './apiClient';

// --- Stotram Category ---

export const createStotramCategory = async (data) => {
  const response = await apiClient.post('/stotram-category/create', data);
  return response.data;
};

export const getAllStotramCategories = async () => {
  const response = await apiClient.get('/stotram-category/get-all');
  return response.data;
};

export const getStotramCategoryById = async (id) => {
  const response = await apiClient.get(`/stotram-category/get-by-id/${id}`);
  return response.data;
};

export const updateStotramCategory = async (id, data) => {
  const response = await apiClient.put(`/stotram-category/update/${id}`, data);
  return response.data;
};

export const deleteStotramCategory = async (id) => {
  const response = await apiClient.delete(`/stotram-category/delete/${id}`);
  return response.data;
};


// --- Stotram Sub Category endpoints moved to stotramSubCategory.js ---
