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

  // Get clients (for pending approval)
  getClients: async () => {
    const url = buildApiUrl('/api/admin/clients');
    return await apiRequest(url);
  },

  // Get properties (for statistics)
  getProperties: async () => {
    const url = buildApiUrl('/api/admin/properties');
    return await apiRequest(url);
  },

  // Get visits
  getVisits: async () => {
    const url = buildApiUrl('/api/admin/visits');
    return await apiRequest(url);
  },

  // Get negotiations
  getNegotiations: async () => {
    const url = buildApiUrl('/api/admin/negotiations');
    return await apiRequest(url);
  },

  // Transfer Requests (Payment/Ownership Transfers)
  getTransfers: async (filters = {}) => {
    let url = buildApiUrl('/api/admin/transfers');
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  approveTransfer: async (id) => {
    const url = buildApiUrl(`/api/admin/transfers/${id}/approve`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  rejectTransfer: async (id, reason) => {
    const url = buildApiUrl(`/api/admin/transfers/${id}/reject`);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // New Client Management
  getNewClients: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    
    const url = buildApiUrl('/api/admin/new-clients');
    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
    
    return await apiRequest(fullUrl, {
      method: 'GET',
    });
  },

  createNewClient: async (clientData) => {
    const url = buildApiUrl('/api/admin/new-clients');
    return await apiRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData),
    });
  },

  updateClientStatus: async (id, status) => {
    const url = buildApiUrl(`/api/admin/new-clients/${id}/status`);
    return await apiRequest(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  },

  // Terminations
  getTerminations: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    
    const url = buildApiUrl('/api/admin/terminations');
    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
    
    return await apiRequest(fullUrl, {
      method: 'GET',
    });
  },

  updateTerminationStatus: async (id, status) => {
    const url = buildApiUrl(`/api/admin/terminations/${id}/status`);
    return await apiRequest(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  },

  // History
  getHistory: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.date) queryParams.append('date', filters.date);
    
    const url = buildApiUrl('/api/admin/history');
    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
    
    return await apiRequest(fullUrl, {
      method: 'GET',
    });
  },

  // Reports
  getReports: async (reportType, filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.month) queryParams.append('month', filters.month);
    if (filters.year) queryParams.append('year', filters.year);
    
    const url = buildApiUrl(`/api/admin/reports/${reportType}`);
    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
    
    return await apiRequest(fullUrl, {
      method: 'GET',
    });
  },
};
