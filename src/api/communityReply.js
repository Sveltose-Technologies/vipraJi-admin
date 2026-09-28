import { apiClient } from "./apiClient";

export const createCommunityReply = async (data) => {
  const response = await apiClient.post("/community-reply/create", data);
  return response.data;
};

export const getAllCommunityReplies = async () => {
  const response = await apiClient.get("/community-reply/get-all");
  return response.data;
};

export const getCommunityReplyById = async (id) => {
  const response = await apiClient.get(`/community-reply/get-by-id/${id}`);
  return response.data;
};

export const updateCommunityReply = async (id, data) => {
  const response = await apiClient.put(`/community-reply/update/${id}`, data);
  return response.data;
};

export const deleteCommunityReply = async (id) => {
  const response = await apiClient.delete(`/community-reply/delete/${id}`);
  return response.data;
};

export const getCommunityRepliesByUserId = async (userId) => {
  const response = await apiClient.get(
    `/community-reply/get-by-userid/${userId}`,
  );
  return response.data;
};

export const getCommunityRepliesByAdminId = async (adminId) => {
  const response = await apiClient.get(
    `/community-reply/get-by-adminid/${adminId}`,
  );
  return response.data;
};
