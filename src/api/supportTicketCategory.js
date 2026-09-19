import { apiClient } from './apiClient';

export const createSupportTicketCategory = async (data) => {
  const response = await apiClient.post('/support-ticket-category/create', data);
  return response.data;
};

export const getAllSupportTicketCategories = async () => {
  const response = await apiClient.get('/support-ticket-category/get-all');
  return response.data;
};

export const getSupportTicketCategoryById = async (id) => {
  const response = await apiClient.get(`/support-ticket-category/get-by-id/${id}`);
  return response.data;
};

export const updateSupportTicketCategory = async (id, data) => {
  const response = await apiClient.put(`/support-ticket-category/update/${id}`, data);
  return response.data;
};

export const deleteSupportTicketCategory = async (id) => {
  const response = await apiClient.delete(`/support-ticket-category/delete/${id}`);
  return response.data;
};
