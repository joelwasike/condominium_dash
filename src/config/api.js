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

// Get authentication headers
const getAuthHeaders = (includeContentType = true) => {
  const token = localStorage.getItem('token');
  const headers = {};
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    const tokenStr = String(token).trim();
    // Sanitize token to ensure it only contains ISO-8859-1 compatible characters
    const sanitizedToken = tokenStr
      .split('')
      .map(char => {
        const code = char.charCodeAt(0);
        return (code >= 32 && code <= 126) ? char : '';
      })
      .join('');
    
    if (sanitizedToken && sanitizedToken.length > 0) {
      headers['Authorization'] = sanitizedToken;
    }
  }
  
  return headers;
};

// API request helper
export const apiRequest = async (url, options = {}) => {
  // Check if Content-Type is already specified in options
  const hasContentType = options.headers && options.headers['Content-Type'];
  
  // Get auth headers (include Content-Type unless already specified)
  const authHeaders = getAuthHeaders(!hasContentType);
  
  const defaultOptions = {
    headers: {
      ...authHeaders,
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
      // If 401, try to redirect to login or show error
      if (response.status === 401) {
        console.error('Unauthorized: Token may be missing or invalid');
        // Optionally redirect to login
        // window.location.href = '/login';
      }
      
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.text();
        if (errorData) {
          try {
            const errorJson = JSON.parse(errorData);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
          } catch {
            errorMessage = errorData || errorMessage;
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
      
      throw new Error(errorMessage);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      console.warn('Non-JSON response received:', text);
      return text;
    }
  } catch (error) {
    console.error('API request failed:', error);
    console.error('URL:', url);
    console.error('Config:', config);
    
    // Check if it's a CORS error
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      const corsError = new Error(
        'CORS Error: The API server is not allowing requests from this origin. ' +
        'Please contact the backend administrator to configure CORS headers. ' +
        `Frontend origin: ${window.location.origin}, ` +
        `API URL: ${url}`
      );
      corsError.name = 'CORSError';
      corsError.originalError = error;
      throw corsError;
    }
    
    throw error;
  }
};
