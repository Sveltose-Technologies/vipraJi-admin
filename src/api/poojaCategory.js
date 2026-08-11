import { apiClient } from './apiClient';

// --- Pooja Library Category ---

export const createPoojaCategory = async (data) => {
  const response = await apiClient.post('/pooja-library-category/create', data);
  return response.data;
};

export const getAllPoojaCategories = async () => {
  const response = await apiClient.get('/pooja-library-category/get-all');
  return response.data;
};

export const getPoojaCategoryById = async (id) => {
  const response = await apiClient.get(`/pooja-library-category/get-by-id/${id}`);
  return response.data;
};

export const updatePoojaCategory = async (id, data) => {
  const response = await apiClient.put(`/pooja-library-category/update/${id}`, data);
  return response.data;
};

export const deletePoojaCategory = async (id) => {
  const response = await apiClient.delete(`/pooja-library-category/delete/${id}`);
  return response.data;
};


// --- Pooja Library Sub Category ---

export const createPoojaSubCategory = async (data) => {
  const response = await apiClient.post('/pooja-library-sub-category/create', data);
  return response.data;
};

export const getAllPoojaSubCategories = async () => {
  const response = await apiClient.get('/pooja-library-sub-category/get-all');
  return response.data;
};

export const getPoojaSubCategoryById = async (id) => {
  const response = await apiClient.get(`/pooja-library-sub-category/get-by-id/${id}`);
  return response.data;
};

export const updatePoojaSubCategory = async (id, data) => {
  const response = await apiClient.put(`/pooja-library-sub-category/update/${id}`, data);
  return response.data;
};

export const deletePoojaSubCategory = async (id) => {
  const response = await apiClient.delete(`/pooja-library-sub-category/delete/${id}`);
  return response.data;
};
