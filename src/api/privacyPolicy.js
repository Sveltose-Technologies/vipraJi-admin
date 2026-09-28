import { apiClient } from "./apiClient";

export const createPrivacyPolicy = async (formData) => {
  const response = await apiClient.post("/privacy-policy/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getAllPrivacyPolicies = async () => {
  const response = await apiClient.get("/privacy-policy/get-all");
  return response.data;
};

export const getPrivacyPolicyById = async (id) => {
  const response = await apiClient.get(`/privacy-policy/get-by-id/${id}`);
  return response.data;
};

export const updatePrivacyPolicy = async (id, formData) => {
  const response = await apiClient.put(
    `/privacy-policy/update/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

export const deletePrivacyPolicy = async (id) => {
  const response = await apiClient.delete(`/privacy-policy/delete/${id}`);
  return response.data;
};
