import { API_CONFIG } from '../config/api';

const LANDLORD_BASE_URL = `${API_CONFIG.BASE_URL}/api/landlord`;

export const landlordService = {
  // Overview
  getOverview: async () => {
    const response = await fetch(`${LANDLORD_BASE_URL}/overview`);
    if (!response.ok) throw new Error('Failed to fetch landlord overview');
    return response.json();
  },

  // Properties
  getProperties: async () => {
    const response = await fetch(`${LANDLORD_BASE_URL}/properties`);
    if (!response.ok) throw new Error('Failed to fetch properties');
    return response.json();
  },

  addProperty: async (propertyData) => {
    const response = await fetch(`${LANDLORD_BASE_URL}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(propertyData)
    });
    if (!response.ok) throw new Error('Failed to add property');
    return response.json();
  },

  // Payments
  getPayments: async () => {
    const response = await fetch(`${LANDLORD_BASE_URL}/payments`);
    if (!response.ok) throw new Error('Failed to fetch payments');
    return response.json();
  },

  generateReceipt: async (receiptData) => {
    const response = await fetch(`${LANDLORD_BASE_URL}/payments/receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receiptData)
    });
    if (!response.ok) throw new Error('Failed to generate receipt');
    return response.json();
  },

  // Work Orders
  getWorkOrders: async () => {
    const response = await fetch(`${LANDLORD_BASE_URL}/works`);
    if (!response.ok) throw new Error('Failed to fetch work orders');
    return response.json();
  },

  createWorkOrder: async (workOrderData) => {
    const response = await fetch(`${LANDLORD_BASE_URL}/works`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workOrderData)
    });
    if (!response.ok) throw new Error('Failed to create work order');
    return response.json();
  },

  // Claims
  getClaims: async () => {
    const response = await fetch(`${LANDLORD_BASE_URL}/claims`);
    if (!response.ok) throw new Error('Failed to fetch claims');
    return response.json();
  },

  createClaim: async (claimData) => {
    const response = await fetch(`${LANDLORD_BASE_URL}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimData)
    });
    if (!response.ok) throw new Error('Failed to create claim');
    return response.json();
  },

  // Inventory
  getInventory: async () => {
    const response = await fetch(`${LANDLORD_BASE_URL}/inventory`);
    if (!response.ok) throw new Error('Failed to fetch inventory');
    return response.json();
  },

  addInventory: async (inventoryData) => {
    const response = await fetch(`${LANDLORD_BASE_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventoryData)
    });
    if (!response.ok) throw new Error('Failed to add inventory');
    return response.json();
  },

  // Business Tracking
  getBusinessTracking: async () => {
    const response = await fetch(`${LANDLORD_BASE_URL}/tracking`);
    if (!response.ok) throw new Error('Failed to fetch business tracking');
    return response.json();
  },
};
