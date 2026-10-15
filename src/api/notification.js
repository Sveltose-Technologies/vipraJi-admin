import { apiClient } from './apiClient';

/**
 * Notification Types supported by backend
 */
export const NOTIFICATION_TYPES = [
  'FESTIVAL_REMINDER',
  'DAILY_PANCHANG',
  'SUBSCRIPTION_RENEWAL',
  'COMMUNITY_REPLY',
  'APP_UPDATE',
  'CUSTOM',
];

/**
 * Recipient Types supported by backend
 */
export const RECIPIENT_TYPES = [
  'ALL',
  'SELECTED_USERS',
  'SUBSCRIBERS',
];

/**
 * Available Subscription Plan Codes for targeting
 */
export const TARGET_PLAN_CODES = [
  { code: 'BASIC', label: 'Vipra Saarthi Basic' },
  { code: 'PRO', label: 'Vipra Saarthi Pro' },
  { code: 'PREMIUM', label: 'Vipra Saarthi Premium' },
];

/**
 * 1. Create a Notification (Draft or Scheduled)
 * POST /notifications/admin/create
 */
export const createNotification = async (data) => {
  const response = await apiClient.post('/notifications/admin/create', data);
  return response.data;
};

/**
 * 2. Get All Notifications with optional filters & pagination
 * GET /notifications/admin/get-all
 */
export const getAllNotifications = async (params = {}) => {
  const response = await apiClient.get('/notifications/admin/get-all', { params });
  return response.data;
};

/**
 * 3. Get Notification By ID
 * GET /notifications/admin/get-by-id/:id
 */
export const getNotificationById = async (id) => {
  const response = await apiClient.get(`/notifications/admin/get-by-id/${id}`);
  return response.data;
};

/**
 * 4. Update Notification (only allowed for DRAFT)
 * PUT /notifications/admin/update/:id
 */
export const updateNotification = async (id, data) => {
  const response = await apiClient.put(`/notifications/admin/update/${id}`, data);
  return response.data;
};

/**
 * 5. Delete Notification
 * DELETE /notifications/admin/delete/:id
 */
export const deleteNotification = async (id) => {
  const response = await apiClient.delete(`/notifications/admin/delete/${id}`);
  return response.data;
};

/**
 * 6. Send Notification Immediately
 * POST /notifications/admin/send/:id
 */
export const sendNotificationNow = async (id) => {
  const response = await apiClient.post(`/notifications/admin/send/${id}`);
  return response.data;
};

/**
 * 7. Schedule Notification
 * POST /notifications/admin/schedule/:id
 * Body: { scheduledAt: ISO_STRING }
 */
export const scheduleNotification = async (id, data) => {
  const response = await apiClient.post(`/notifications/admin/schedule/${id}`, data);
  return response.data;
};

/**
 * 8. Cancel Scheduled Notification
 * POST /notifications/admin/cancel/:id
 */
export const cancelNotification = async (id) => {
  const response = await apiClient.post(`/notifications/admin/cancel/${id}`);
  return response.data;
};

/**
 * 9. Retry Failed Deliveries
 * POST /notifications/admin/retry-failed/:id
 */
export const retryFailedNotification = async (id) => {
  const response = await apiClient.post(`/notifications/admin/retry-failed/${id}`);
  return response.data;
};

/**
 * 10. Get Delivery Report
 * GET /notifications/admin/delivery-report/:id
 */
export const getDeliveryReport = async (id, params = {}) => {
  const response = await apiClient.get(`/notifications/admin/delivery-report/${id}`, { params });
  return response.data;
};

/**
 * 11. Preview Notification template rendering (dry run)
 * POST /notifications/admin/preview
 */
export const previewNotification = async (data) => {
  const response = await apiClient.post('/notifications/admin/preview', data);
  return response.data;
};

/**
 * 12. Get Notification Statistics
 * GET /notifications/admin/statistics
 */
export const getNotificationStatistics = async () => {
  const response = await apiClient.get('/notifications/admin/statistics');
  return response.data;
};

/**
 * 13. Trigger Subscription Renewal Reminders scan
 * POST /notifications/admin/trigger-renewal-reminders
 */
export const triggerRenewalReminders = async () => {
  const response = await apiClient.post('/notifications/admin/trigger-renewal-reminders');
  return response.data;
};
