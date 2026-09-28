import { apiClient } from './apiClient';

export const getAllYajmanEntries = async () => {
  const response = await apiClient.get('/yajman-entry/get-all');
  return response.data;
};

export const updateYajmanEntry = async (id, data) => {
  const response = await apiClient.put(`/yajman-entry/update/${id}`, data);
  return response.data;
};
