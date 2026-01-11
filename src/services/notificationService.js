import { buildApiUrl, apiRequest } from '../config/api';

export const notificationService = {
  // Get all notifications for the current user
  getNotifications: async () => {
    const url = buildApiUrl('/api/notifications');
    return await apiRequest(url);
  },

  // Get unread notifications count
  getUnreadCount: async () => {
    try {
      const notifications = await notificationService.getNotifications();
      if (Array.isArray(notifications)) {
        return notifications.filter(n => !n.read && !n.Read).length;
      }
      if (notifications && typeof notifications === 'object' && notifications.unreadCount !== undefined) {
        return notifications.unreadCount;
      }
      return 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  // Mark a notification as read
  markAsRead: async (notificationId) => {
    const url = buildApiUrl(`/api/notifications/${notificationId}/read`);
    return await apiRequest(url, { method: 'POST' });
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const url = buildApiUrl('/api/notifications/read-all');
    return await apiRequest(url, { method: 'POST' });
  },

  // Get notification preferences
  getPreferences: async () => {
    const url = buildApiUrl('/api/notifications/preferences');
    return await apiRequest(url);
  },

  // Update notification preferences
  updatePreferences: async (preferences) => {
    const url = buildApiUrl('/api/notifications/preferences');
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    const url = buildApiUrl(`/api/notifications/${notificationId}`);
    return await apiRequest(url, { method: 'DELETE' });
  },
};
