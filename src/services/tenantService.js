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
  },

  // Terminate lease
  terminateLease: async (terminationData) => {
    const url = buildApiUrl('/api/tenant/lease/terminate');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        reason: terminationData.reason,
        terminationDate: terminationData.terminationDate,
        comments: terminationData.comments,
        securityDepositRefundMethod: terminationData.securityDepositRefundMethod,
        inventoryCheckDate: terminationData.inventoryCheckDate
      })
    });
  },

  // Transfer payment request
  transferPaymentRequest: async (transferData) => {
    const url = buildApiUrl('/api/tenant/payments/transfer');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        property: transferData.property || '',
        recipientIDCardNumber: transferData.recipientIdCard,
        recipientEntryDate: transferData.entryDate,
        recipientName: transferData.recipientName,
        recipientEmail: transferData.recipientEmail,
        recipientPhone: transferData.recipientPhone,
        relationship: transferData.relationship,
        reason: transferData.reason
      })
    });
  },

  // Upload profile picture
  uploadProfilePicture: async (profilePictureURL) => {
    const url = buildApiUrl('/api/tenant/profile/picture');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        profilePictureURL: profilePictureURL
      })
    });
  },

  // Security Deposit Payment
  paySecurityDeposit: async (depositData) => {
    const url = buildApiUrl('/api/tenant/deposits/payment');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(depositData)
    });
  },

  // Get security deposit status
  getSecurityDeposit: async () => {
    const url = buildApiUrl('/api/tenant/deposits');
    return await apiRequest(url);
  }
};
