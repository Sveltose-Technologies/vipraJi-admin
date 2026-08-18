import { apiClient } from './apiClient';

export const createPoojaSamagri = async (data) => {
  const response = await apiClient.post('/pooja-samagri/create', data);
  return response.data;
};

export const getAllPoojaSamagri = async () => {
  const response = await apiClient.get('/pooja-samagri/get-all');
  return response.data;
};

export const getPoojaSamagriById = async (id) => {
  const response = await apiClient.get(`/pooja-samagri/get-by-id/${id}`);
  return response.data;
};

export const updatePoojaSamagri = async ({ id, data }) => {
  const response = await apiClient.put(`/pooja-samagri/update/${id}`, data);
  return response.data;
};

export const deletePoojaSamagri = async (id) => {
  const response = await apiClient.delete(`/pooja-samagri/delete/${id}`);
  return response.data;
};

export const getPoojaSamagriByItemType = async (itemType) => {
  const response = await apiClient.get(`/pooja-samagri/get-by-itemType/${itemType}`);
  return response.data;
};
