import { apiClient } from './apiClient';

/**
 * Subscription Plan APIs
 */

// Create a new subscription plan
// POST /subscription/create
export const createSubscriptionPlan = async (data) => {
  const response = await apiClient.post('/subscription/create', data);
  return response.data;
};

// Get all subscription plans with pagination and inactive filter
// GET /subscription/get-all?page=1&limit=20&includeInactive=true
export const getAllSubscriptionPlans = async (params = {}) => {
  const response = await apiClient.get('/subscription/get-all', { params });
  return response.data;
};

// Get available (active) subscription plans for users
// GET /subscription/available-plans
export const getAvailableSubscriptionPlans = async () => {
  const response = await apiClient.get('/subscription/available-plans');
  return response.data;
};

// Get subscription plan by ID
// GET /subscription/get-by-id/:id
export const getSubscriptionPlanById = async (id) => {
  const response = await apiClient.get(`/subscription/get-by-id/${id}`);
  return response.data;
};

// Update an existing subscription plan
// PUT /subscription/update/:id
export const updateSubscriptionPlan = async (id, data) => {
  const response = await apiClient.put(`/subscription/update/${id}`, data);
  return response.data;
};

// Deactivate a subscription plan
// PATCH /subscription/deactivate/:id
export const deactivateSubscriptionPlan = async (id) => {
  const response = await apiClient.patch(`/subscription/deactivate/${id}`);
  return response.data;
};

// Delete a subscription plan
// DELETE /subscription/delete/:id
export const deleteSubscriptionPlan = async (id) => {
  const response = await apiClient.delete(`/subscription/delete/${id}`);
  return response.data;
};

/**
 * User Subscriptions (Mock / Existing data helper for subscribers tab)
 */
export const getAllSubscriptions = async () => {
  // Simulating an API call delay for subscriber list
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    subscriptions: [
      {
        _id: 'sub_001',
        user: {
          _id: 'usr_001',
          fullName: 'Amit Sharma',
          email: 'amit@example.com',
          mobileNumber: '+919876543210',
          profilePhoto: null
        },
        plan: {
          name: 'Vipra Saarthi Basic',
          code: 'BASIC_MONTHLY',
          price: 51,
          billingInterval: 'monthly'
        },
        status: 'active',
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        features: {
          kundaliGeneration: { limit: 5, used: 2 },
          panchang: { limit: 30, used: 12 },
          brandedPdf: { limit: 0, used: 0 },
          muhurat: { limit: 0, used: 0 }
        }
      },
      {
        _id: 'sub_002',
        user: {
          _id: 'usr_002',
          fullName: 'Priya Patel',
          email: 'priya@example.com',
          mobileNumber: '+919876543211',
          profilePhoto: null
        },
        plan: {
          name: 'Vipra Saarthi Premium',
          code: 'PREMIUM_MONTHLY',
          price: 199,
          billingInterval: 'monthly'
        },
        status: 'active',
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        features: {
          kundaliGeneration: { limit: -1, used: 10 },
          panchang: { limit: -1, used: 45 },
          brandedPdf: { limit: -1, used: 5 },
          muhurat: { limit: -1, used: 2 }
        }
      },
      {
        _id: 'sub_003',
        user: {
          _id: 'usr_003',
          fullName: 'Rahul Verma',
          email: 'rahul@example.com',
          mobileNumber: '+919876543212',
          profilePhoto: null
        },
        plan: null,
        status: 'expired',
        startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        features: {
          kundaliGeneration: { limit: 5, used: 5 },
          panchang: { limit: 30, used: 30 },
          brandedPdf: { limit: 0, used: 0 },
          muhurat: { limit: 0, used: 0 }
        }
      }
    ]
  };
};
