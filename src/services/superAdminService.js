import { API_CONFIG } from '../config/api';

const SUPERADMIN_BASE_URL = `${API_CONFIG.BASE_URL}/api/superadmin`;

const parseJson = async (response) => {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn('Failed to parse JSON response:', error);
    return null;
  }
};

export const superAdminService = {
  // Overview
  getOverview: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/overview`);
    if (!response.ok) throw new Error('Failed to fetch super admin overview');
    return parseJson(response);
  },

  // Companies
  getCompanies: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/companies`);
    if (!response.ok) throw new Error('Failed to fetch companies');
    return parseJson(response);
  },

  addCompany: async (companyData) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });
    if (!response.ok) throw new Error('Failed to add company');
    return parseJson(response);
  },

  updateCompany: async (id, companyData) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });
    if (!response.ok) throw new Error('Failed to update company');
    return parseJson(response);
  },

  deleteCompany: async (id) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/companies/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete company');
    return parseJson(response);
  },

  deactivateCompany: async (id, reason) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/companies/${id}/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!response.ok) throw new Error('Failed to deactivate company');
    return parseJson(response);
  },

  reactivateCompany: async (id) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/companies/${id}/reactivate`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to reactivate company');
    return parseJson(response);
  },

  // Users
  getUsers: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return parseJson(response);
  },

  addUser: async (userData) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to add user');
    return parseJson(response);
  },

  updateUser: async (id, userData) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to update user');
    return parseJson(response);
  },

  deleteUser: async (id) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return parseJson(response);
  },

  // Properties
  getProperties: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/properties`);
    if (!response.ok) throw new Error('Failed to fetch properties');
    return parseJson(response);
  },

  addProperty: async (propertyData) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(propertyData)
    });
    if (!response.ok) throw new Error('Failed to add property');
    return parseJson(response);
  },

  updateProperty: async (id, propertyData) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/properties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(propertyData)
    });
    if (!response.ok) throw new Error('Failed to update property');
    return parseJson(response);
  },

  deleteProperty: async (id) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/properties/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete property');
    return parseJson(response);
  },

  // Financial
  getFinancialOverview: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/financial`);
    if (!response.ok) throw new Error('Failed to fetch financial overview');
    return parseJson(response);
  },

  // Works
  getWorks: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/works`);
    if (!response.ok) throw new Error('Failed to fetch works');
    return parseJson(response);
  },

  // System
  getSystemSettings: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/system`);
    if (!response.ok) throw new Error('Failed to fetch system settings');
    return parseJson(response);
  },

  createBackup: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/system/backup`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to create backup');
    return parseJson(response);
  },

  restoreBackup: async (backupData) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/system/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData)
    });
    if (!response.ok) throw new Error('Failed to restore backup');
    return parseJson(response);
  },

  // Accounting
  getAccountingOverview: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/accounting/overview`);
    if (!response.ok) throw new Error('Failed to fetch accounting overview');
    return parseJson(response);
  },

  getTenantPayments: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/accounting/tenant-payments`);
    if (!response.ok) throw new Error('Failed to fetch tenant payments');
    return parseJson(response);
  },

  getLandlordPayments: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/accounting/landlord-payments`);
    if (!response.ok) throw new Error('Failed to fetch landlord payments');
    return parseJson(response);
  },

  getCollections: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/accounting/collections`);
    if (!response.ok) throw new Error('Failed to fetch collections');
    return parseJson(response);
  },

  getExpenses: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/accounting/expenses`);
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return parseJson(response);
  },
};
