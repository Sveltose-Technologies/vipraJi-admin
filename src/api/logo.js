import axios from 'axios';

const API_URL = import.meta.env.DEV ? '/api' : 'https://backend.viprasaarthi.com';

const apiClient = axios.create({
  baseURL: API_URL,
});

export const getAllLogos = async () => {
  const response = await apiClient.get('/logo/get-all');
  return response.data;
};

export const getLogoById = async (id) => {
  const response = await apiClient.get(`/logo/get-by-id/${id}`);
  return response.data;
};

export const createLogo = async (formData) => {
  const response = await apiClient.post('/logo/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateLogo = async ({ id, formData }) => {
  const response = await apiClient.put(`/logo/update/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteLogo = async (id) => {
  const response = await apiClient.delete(`/logo/delete/${id}`);
  return response.data;
};
