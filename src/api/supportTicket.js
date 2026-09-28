import { apiClient } from "./apiClient";

export const createSupportTicket = async (data) => {
  const response = await apiClient.post("/support-ticket/create", data);
  return response.data;
};

export const getAllSupportTickets = async () => {
  const response = await apiClient.get("/support-ticket/get-all");
  return response.data;
};

export const getSupportTicketById = async (id) => {
  const response = await apiClient.get(`/support-ticket/get-by-id/${id}`);
  return response.data;
};

export const updateSupportTicket = async (id, data) => {
  const response = await apiClient.put(`/support-ticket/update/${id}`, data);
  return response.data;
};

export const deleteSupportTicket = async (id) => {
  const response = await apiClient.delete(`/support-ticket/delete/${id}`);
  return response.data;
};

export const getSupportTicketsByUserId = async (userId) => {
  const response = await apiClient.get(
    `/support-ticket/get-by-userid/${userId}`,
  );
  return response.data;
};

export const getSupportTicketsByAdminId = async (adminId) => {
  const response = await apiClient.get(
    `/support-ticket/get-by-adminid/${adminId}`,
  );
  return response.data;
};
