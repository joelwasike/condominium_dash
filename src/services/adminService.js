import { buildApiUrl, apiRequest } from '../config/api';

export const adminService = {
  // Overview
  getOverview: async () => {
    const url = buildApiUrl('/api/admin/overview');
    return await apiRequest(url);
  },

  // Inbox
  getInbox: async () => {
    const url = buildApiUrl('/api/admin/inbox');
    return await apiRequest(url);
  },

  forwardInbox: async (id) => {
    const url = buildApiUrl(`/api/admin/inbox/${id}/forward`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  // Documents
  getDocuments: async (filters = {}) => {
    let url = buildApiUrl('/api/admin/documents');
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.tenant) queryParams.append('tenant', filters.tenant);
    if (filters.type) queryParams.append('type', filters.type);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  approveDocument: async (id) => {
    const url = buildApiUrl(`/api/admin/documents/${id}/approve`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  rejectDocument: async (id, reason) => {
    const url = buildApiUrl(`/api/admin/documents/${id}/reject`);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  followUpDocument: async (id) => {
    const url = buildApiUrl(`/api/admin/documents/${id}/follow-up`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  sendToUtility: async (id) => {
    const url = buildApiUrl(`/api/admin/documents/${id}/utility`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  // Utilities
  getUtilities: async (filters = {}) => {
    let url = buildApiUrl('/api/admin/utilities');
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.provider) queryParams.append('provider', filters.provider);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  transferUtility: async (id) => {
    const url = buildApiUrl(`/api/admin/utilities/${id}/transfer`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  // Debts
  getDebts: async () => {
    const url = buildApiUrl('/api/admin/debts');
    return await apiRequest(url);
  },

  remindDebt: async (id) => {
    const url = buildApiUrl(`/api/admin/debts/${id}/remind`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  markDebtPaid: async (id) => {
    const url = buildApiUrl(`/api/admin/debts/${id}/paid`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  // Payment Follow-ups
  getPendingPaymentFollowUps: async () => {
    const url = buildApiUrl('/api/admin/payments/follow-ups');
    return await apiRequest(url);
  },

  // Reminders
  getReminders: async () => {
    const url = buildApiUrl('/api/admin/reminders');
    return await apiRequest(url);
  },

  createReminder: async (reminderData) => {
    const url = buildApiUrl('/api/admin/reminders');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(reminderData),
    });
  },

  deleteReminder: async (id) => {
    const url = buildApiUrl(`/api/admin/reminders/${id}`);
    return await apiRequest(url, {
      method: 'DELETE',
    });
  },

  // Leases
  getLeases: async (filters = {}) => {
    let url = buildApiUrl('/api/admin/leases');
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.tenant) queryParams.append('tenant', filters.tenant);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  createLease: async (leaseData) => {
    const url = buildApiUrl('/api/admin/leases');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(leaseData),
    });
  },

  generateLeaseDocument: async (id) => {
    const url = buildApiUrl(`/api/admin/leases/${id}/generate`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  // Get advertisements
  getAdvertisements: async () => {
    const url = buildApiUrl('/api/admin/advertisements');
    return await apiRequest(url);
  },
};
