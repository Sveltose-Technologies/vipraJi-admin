import { apiClient } from "./apiClient";

export const createCommunityPost = async (data) => {
  const response = await apiClient.post("/community-post/create", data);
  return response.data;
};

export const getAllCommunityPosts = async () => {
  const response = await apiClient.get("/community-post/get-all");
  return response.data;
};

export const getCommunityPostById = async (id) => {
  const response = await apiClient.get(`/community-post/get-by-id/${id}`);
  return response.data;
};

export const updateCommunityPost = async (id, data) => {
  const response = await apiClient.put(`/community-post/update/${id}`, data);
  return response.data;
};

export const deleteCommunityPost = async (id) => {
  const response = await apiClient.delete(`/community-post/delete/${id}`);
  return response.data;
};

export const getCommunityPostsByUserId = async (userId) => {
  const response = await apiClient.get(
    `/community-post//get-by-userid/${userId}`,
  );
  return response.data;
};

export const getCommunityPostsByAdminId = async (adminId) => {
  const response = await apiClient.get(
    `/community-post//get-by-adminid/${adminId}`,
  );
  return response.data;
};

export const likeCommunityPost = async (id, data) => {
  const response = await apiClient.post(`/community-post//like/${id}`, data);
  return response.data;
};

export const unlikeCommunityPost = async (id, data) => {
  const response = await apiClient.post(`/community-post//unlike/${id}`, data);
  return response.data;
};
