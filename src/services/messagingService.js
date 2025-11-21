import { buildApiUrl, apiRequest } from '../config/api';

// Messaging API Service - for all authenticated users
export const messagingService = {
  // Send a message
  sendMessage: async (messageData) => {
    const url = buildApiUrl('/api/messaging/messages');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  // Get all conversations
  getConversations: async () => {
    const url = buildApiUrl('/api/messaging/messages/conversations');
    return await apiRequest(url);
  },

  // Get conversation with a specific user
  getConversation: async (userId) => {
    const url = buildApiUrl(`/api/messaging/messages/${userId}`);
    return await apiRequest(url);
  },

  // Mark messages as read
  markMessagesAsRead: async (userId) => {
    const url = buildApiUrl(`/api/messaging/messages/${userId}/read`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  // Get inbox
  getInbox: async () => {
    const url = buildApiUrl('/api/messaging/messages/inbox');
    return await apiRequest(url);
  },

  // Get users from same company (for messaging)
  getUsers: async (filters = {}) => {
    let url = buildApiUrl('/api/messaging/users');
    const queryParams = new URLSearchParams();
    
    if (filters.role) queryParams.append('role', filters.role);
    if (filters.search) queryParams.append('search', filters.search);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },
};

