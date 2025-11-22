import { API_CONFIG } from '../config/api';

const TENANT_BASE_URL = `${API_CONFIG.BASE_URL}/api/tenant`;

export const tenantService = {
  // Payment APIs
  recordPayment: async (paymentData) => {
    const response = await fetch(`${TENANT_BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    if (!response.ok) throw new Error('Failed to record payment');
    return response.json();
  },

  listPayments: async () => {
    const response = await fetch(`${TENANT_BASE_URL}/payments`);
    if (!response.ok) throw new Error('Failed to fetch payments');
    return response.json();
  },

  approvePayment: async (paymentId) => {
    const response = await fetch(`${TENANT_BASE_URL}/payments/${paymentId}/approve`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to approve payment');
    return response.json();
  },

  rejectPayment: async (paymentId) => {
    const response = await fetch(`${TENANT_BASE_URL}/payments/${paymentId}/reject`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to reject payment');
    return response.json();
  },

  generateReceipt: async (paymentId) => {
    const response = await fetch(`${TENANT_BASE_URL}/payments/${paymentId}/receipt`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to generate receipt');
    return response.json();
  },

  // Maintenance APIs
  createMaintenance: async (maintenanceData) => {
    const response = await fetch(`${TENANT_BASE_URL}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(maintenanceData)
    });
    if (!response.ok) throw new Error('Failed to create maintenance request');
    return response.json();
  },

  listMaintenance: async () => {
    const response = await fetch(`${TENANT_BASE_URL}/maintenance`);
    if (!response.ok) throw new Error('Failed to fetch maintenance requests');
    return response.json();
  },

  // Overview APIs (we'll need to add these to backend)
  getOverview: async () => {
    const response = await fetch(`${TENANT_BASE_URL}/overview`);
    if (!response.ok) throw new Error('Failed to fetch overview');
    return response.json();
  },

  getLeaseInfo: async () => {
    const response = await fetch(`${TENANT_BASE_URL}/lease`);
    if (!response.ok) throw new Error('Failed to fetch lease info');
    return response.json();
  },

  // Get advertisements
  getAdvertisements: async () => {
    const response = await fetch(`${TENANT_BASE_URL}/advertisements`);
    if (!response.ok) throw new Error('Failed to fetch advertisements');
    return response.json();
  }
};
