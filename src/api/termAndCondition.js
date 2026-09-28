import { apiClient } from "./apiClient";

export const createTermAndCondition = async (formData) => {
  const response = await apiClient.post("/termAndCondition/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getAllTermAndConditions = async () => {
  const response = await apiClient.get("/termAndCondition/get-all");
  return response.data;
};

export const getTermAndConditionById = async (id) => {
  const response = await apiClient.get(`/termAndCondition/get-by-id/${id}`);
  return response.data;
};

export const updateTermAndCondition = async (id, formData) => {
  const response = await apiClient.put(
    `/termAndCondition/update/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

export const deleteTermAndCondition = async (id) => {
  const response = await apiClient.delete(`/termAndCondition/delete/${id}`);
  return response.data;
};
