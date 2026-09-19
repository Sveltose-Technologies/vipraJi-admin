import { apiClient } from './apiClient';

export const getAllYajmanEntries = async () => {
  const response = await apiClient.get('/yajman-entry/get-all');
  return response.data;
};
