import { apiClient } from './apiClient';

/**
 * Normalizes input data: if caller passes a FormData instance,
 * extract it into a clean JSON object for the backend.
 */
const normalizePayload = (data) => {
  if (data instanceof FormData) {
    const obj = {};
    for (const [key, value] of data.entries()) {
      if (key === 'isFavorite') {
        obj[key] = value === 'true' || value === true;
      } else if (typeof value === 'string') {
        obj[key] = value;
      }
    }
    return obj;
  }
  return data;
};

// Create Stotram / Stotram Sub Category
// POST /stotram-sub-category/create
// Body: { categoryId, title, textEditor, audioFile, pdf, isFavorite }
export const createStotramSubCategory = async (data) => {
  const payload = normalizePayload(data);
  const response = await apiClient.post('/stotram-sub-category/create', payload);
  return response.data;
};

// Get All Stotrams
// GET /stotram-sub-category/get-all
export const getAllStotramSubCategories = async () => {
  const response = await apiClient.get('/stotram-sub-category/get-all');
  return response.data;
};

// Get Stotram By ID
// GET /stotram-sub-category/get-by-id/:id
export const getStotramSubCategoryById = async (id) => {
  const response = await apiClient.get(`/stotram-sub-category/get-by-id/${id}`);
  return response.data;
};

// Update Stotram
// PUT /stotram-sub-category/update/:id
// Body: { categoryId, title, textEditor, audioFile, pdf, isFavorite }
export const updateStotramSubCategory = async (id, data) => {
  const payload = normalizePayload(data);
  const response = await apiClient.put(`/stotram-sub-category/update/${id}`, payload);
  return response.data;
};

// Delete Stotram
// DELETE /stotram-sub-category/delete/:id
export const deleteStotramSubCategory = async (id) => {
  const response = await apiClient.delete(`/stotram-sub-category/delete/${id}`);
  return response.data;
};
