import { ENV_CONFIG } from './env';

// API endpoint structure types
interface SalesManagerEndpoints {
  OVERVIEW: string;
  PROPERTIES: string;
  CLIENTS: string;
  ALERTS: string;
  LISTINGS_OVERVIEW: string;
  LISTINGS: string;
  VISITS: string;
  REQUESTS: string;
  CLIENTS_HISTORY: string;
}

interface TenantEndpoints {
  PAYMENTS: string;
  MAINTENANCE: string;
}

interface TechnicianEndpoints {
  INVENTORIES: string;
  QUOTES: string;
}

interface AccountingEndpoints {
  TENANT_PAYMENTS: string;
  EXPENSES: string;
}

interface AdminEndpoints {
  DOCUMENTS: string;
  REMINDERS: string;
}

interface LandlordEndpoints {
  OVERVIEW: string;
  PROPERTIES: string;
  PAYMENTS: string;
}

interface SuperAdminEndpoints {
  OVERVIEW: string;
  COMPANIES: string;
  USERS: string;
}

interface ApiEndpoints {
  SALES_MANAGER: SalesManagerEndpoints;
  TENANT: TenantEndpoints;
  TECHNICIAN: TechnicianEndpoints;
  ACCOUNTING: AccountingEndpoints;
  ADMIN: AdminEndpoints;
  LANDLORD: LandlordEndpoints;
  SUPER_ADMIN: SuperAdminEndpoints;
}

interface ApiConfig {
  BASE_URL: string;
  ENDPOINTS: ApiEndpoints;
}

// API Configuration
export const API_CONFIG: ApiConfig = {
  BASE_URL: ENV_CONFIG.API_BASE_URL,
  ENDPOINTS: {
    // Sales Manager
    SALES_MANAGER: {
      OVERVIEW: '/api/salesmanager/overview',
      PROPERTIES: '/api/salesmanager/properties',
      CLIENTS: '/api/salesmanager/clients',
      ALERTS: '/api/salesmanager/alerts',
      LISTINGS_OVERVIEW: '/api/salesmanager/listings-overview',
      LISTINGS: '/api/salesmanager/listings',
      VISITS: '/api/salesmanager/visits',
      REQUESTS: '/api/salesmanager/requests',
      CLIENTS_HISTORY: '/api/salesmanager/clients/history',
    },
    // Other roles (for future use)
    TENANT: {
      PAYMENTS: '/api/tenant/payments',
      MAINTENANCE: '/api/tenant/maintenance',
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
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Get authentication headers
const getAuthHeaders = (includeContentType: boolean = true): Record<string, string> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};

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
export const apiRequest = async (url: string, options: RequestInit = {}): Promise<any> => {
  // Check if Content-Type is already specified in options
  const optionHeaders = options.headers as Record<string, string> | undefined;
  const hasContentType = optionHeaders && optionHeaders['Content-Type'];

  // Get auth headers (include Content-Type unless already specified)
  const authHeaders = getAuthHeaders(!hasContentType);

  const defaultOptions: RequestInit = {
    headers: {
      ...authHeaders,
    },
  };

  const config: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...(defaultOptions.headers as Record<string, string>),
      ...(optionHeaders || {}),
    },
  };

  // When sending FormData, do not set Content-Type so the browser sets multipart/form-data with boundary
  if (config.body && config.body instanceof FormData) {
    delete (config.headers as Record<string, string>)['Content-Type'];
  }

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
      const json = await response.json();
      // Auto-unwrap paginated responses: if the response looks like {data: [...], total, page, ...},
      // return just the data array so existing frontend code (which expects flat arrays) keeps working.
      // Components that need pagination metadata should use the React Query hooks instead.
      if (json && Array.isArray(json.data) && typeof json.total === 'number' && typeof json.page === 'number') {
        return json.data;
      }
      return json;
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      console.warn('Non-JSON response received:', text);
      return text;
    }
  } catch (error: any) {
    console.error('API request failed:', error);
    console.error('URL:', url);
    console.error('Config:', config);

    // Check if it's a CORS error
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      const corsError: any = new Error(
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

// API request that preserves the full paginated response (for React Query hooks)
export const apiRequestPaginated = async (url: string, options: RequestInit = {}): Promise<any> => {
  const optionHeaders = options.headers as Record<string, string> | undefined;
  const hasContentType = optionHeaders && optionHeaders['Content-Type'];
  const authHeaders = getAuthHeaders(!hasContentType);

  const config: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...(optionHeaders || {}),
    },
  };

  if (config.body && config.body instanceof FormData) {
    delete (config.headers as Record<string, string>)['Content-Type'];
  }

  const response = await fetch(url, config);
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.text();
      const errorJson = JSON.parse(errorData);
      errorMessage = errorJson.error || errorJson.message || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  return await response.json();
};
