import { apiService } from './api.js';

export const getNotifications = async () => {
  const response = await apiService.get('/notifications');
  return response.data || response;
};

export const getUnreadCount = async () => {
  const response = await apiService.get('/notifications/unread-count');
  return response.data || response;
};

export const dismissNotifications = async (notificationIds) => {
  const response = await apiService.post('/notifications/dismiss', { notificationIds });
  return response.data;
};
