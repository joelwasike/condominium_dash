import { ENV_CONFIG } from './env';

// API Configuration
export const API_CONFIG = {
  BASE_URL: ENV_CONFIG.API_BASE_URL,
  ENDPOINTS: {
    // Sales Manager
    SALES_MANAGER: {
      OVERVIEW: '/api/salesmanager/overview',
      PROPERTIES: '/api/salesmanager/properties',
      CLIENTS: '/api/salesmanager/clients',
      ALERTS: '/api/salesmanager/alerts',
    },
    // Other roles (for future use)
    TENANT: {
      PAYMENTS: '/api/tenant/payments',
      MAINTENANCE: '/api/tenant/maintenance',
    },
    COMMERCIAL: {
      LISTINGS: '/api/commercial/listings',
      VISITS: '/api/commercial/visits',
    },
    TECHNICIAN: {
      INVENTORIES: '/api/technician/inventories',
      QUOTES: '/api/technician/quotes',
    },
    ACCOUNTING: {
      TENANT_PAYMENTS: '/api/accounting/tenant-payments',
      EXPENSES: '/api/accounting/expenses',
    },
    ADMIN: {
      DOCUMENTS: '/api/admin/documents',
      REMINDERS: '/api/admin/reminders',
    },
    LANDLORD: {
      OVERVIEW: '/api/landlord/overview',
      PROPERTIES: '/api/landlord/properties',
      PAYMENTS: '/api/landlord/payments',
    },
    SUPER_ADMIN: {
      OVERVIEW: '/api/superadmin/overview',
      COMPANIES: '/api/superadmin/companies',
      USERS: '/api/superadmin/users',
    },
  },
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// API request helper
export const apiRequest = async (url, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
