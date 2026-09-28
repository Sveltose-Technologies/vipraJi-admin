import { apiClient } from './apiClient';

// For now, we will return mock data for subscriptions.
// In the future, this can point to a real endpoint like apiClient.get('/subscriptions')
export const getAllSubscriptions = async () => {
  // Simulating an API call delay
  await new Promise((resolve) => setTimeout(resolve, 800));

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
          price: 51,
          billingCycle: 'Month'
        },
        status: 'active',
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days left
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
          price: 199,
          billingCycle: 'Month'
        },
        status: 'active',
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        features: {
          kundaliGeneration: { limit: -1, used: 10 }, // -1 means unlimited
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
