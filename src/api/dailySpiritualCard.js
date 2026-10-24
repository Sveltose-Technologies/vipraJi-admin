import { apiClient } from './apiClient';

/**
 * Daily Spiritual Card API Service
 * Handles Admin CRUD and publication operations for daily spiritual cards.
 */

export const createSpiritualCard = async (cardData) => {
  const response = await apiClient.post('/daily-spiritual-card/admin/create', cardData);
  return response.data;
};

export const getAllSpiritualCards = async (params = {}) => {
  const cleanParams = {};
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '' && params[key] !== 'all') {
      cleanParams[key] = params[key];
    }
  });

  const response = await apiClient.get('/daily-spiritual-card/admin/get-all', {
    params: cleanParams,
  });
  return response.data;
};

export const getSpiritualCardById = async (id) => {
  const response = await apiClient.get(`/daily-spiritual-card/admin/get-by-id/${id}`);
  return response.data;
};

export const updateSpiritualCard = async (id, cardData) => {
  const response = await apiClient.put(`/daily-spiritual-card/admin/update/${id}`, cardData);
  return response.data;
};

export const publishSpiritualCard = async (id) => {
  const response = await apiClient.patch(`/daily-spiritual-card/admin/publish/${id}`);
  return response.data;
};

export const unpublishSpiritualCard = async (id) => {
  const response = await apiClient.patch(`/daily-spiritual-card/admin/unpublish/${id}`);
  return response.data;
};

export const deleteSpiritualCard = async (id) => {
  const response = await apiClient.delete(`/daily-spiritual-card/admin/delete/${id}`);
  return response.data;
};
