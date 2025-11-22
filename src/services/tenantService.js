import { buildApiUrl, apiRequest } from '../config/api';

// Tenant API Service
export const tenantService = {
  // Payment APIs
  recordPayment: async (paymentData) => {
    const url = buildApiUrl('/api/tenant/payments');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  },

  listPayments: async () => {
    const url = buildApiUrl('/api/tenant/payments');
    return await apiRequest(url);
  },

  approvePayment: async (paymentId) => {
    const url = buildApiUrl(`/api/tenant/payments/${paymentId}/approve`);
    return await apiRequest(url, {
      method: 'POST'
    });
  },

  rejectPayment: async (paymentId) => {
    const url = buildApiUrl(`/api/tenant/payments/${paymentId}/reject`);
    return await apiRequest(url, {
      method: 'POST'
    });
  },

  generateReceipt: async (paymentId) => {
    const url = buildApiUrl(`/api/tenant/payments/${paymentId}/receipt`);
    return await apiRequest(url, {
      method: 'POST'
    });
  },

  // Maintenance APIs
  createMaintenance: async (maintenanceData) => {
    const url = buildApiUrl('/api/tenant/maintenance');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(maintenanceData)
    });
  },

  listMaintenance: async () => {
    const url = buildApiUrl('/api/tenant/maintenance');
    return await apiRequest(url);
  },

  // Overview APIs
  getOverview: async () => {
    const url = buildApiUrl('/api/tenant/overview');
    return await apiRequest(url);
  },

  getLeaseInfo: async () => {
    const url = buildApiUrl('/api/tenant/lease');
    return await apiRequest(url);
  },

  // Get advertisements
  getAdvertisements: async () => {
    const url = buildApiUrl('/api/tenant/advertisements');
    return await apiRequest(url);
  }
};
