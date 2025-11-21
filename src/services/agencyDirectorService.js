import { API_CONFIG } from '../config/api';

const AGENCY_DIRECTOR_BASE_URL = `${API_CONFIG.BASE_URL}/api/agency-director`;

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

export const agencyDirectorService = {
  // Overview
  getOverview: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/overview`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch overview');
    return parseJson(response);
  },

  // Users
  getUsers: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/users`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await parseJson(response);
    return data?.users || data || [];
  },

  addUser: async (userData) => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/users`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to add user');
    return parseJson(response);
  },

  updateUser: async (id, userData) => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to update user');
    return parseJson(response);
  },

  deleteUser: async (id) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return parseJson(response);
  },

  // Properties
  getProperties: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/properties`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch properties');
    const data = await parseJson(response);
    return data?.properties || data || [];
  },

  addProperty: async (propertyData) => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/properties`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(propertyData)
    });
    if (!response.ok) throw new Error('Failed to add property');
    return parseJson(response);
  },

  updateProperty: async (id, propertyData) => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/properties/${id}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(propertyData)
    });
    if (!response.ok) throw new Error('Failed to update property');
    return parseJson(response);
  },

  deleteProperty: async (id) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to delete property');
    return parseJson(response);
  },

  // Financial
  getFinancialOverview: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/financial`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch financial overview');
    return parseJson(response);
  },

  // Works
  getWorks: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/works`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch works');
    const data = await parseJson(response);
    return data?.works || data || [];
  },

  // System
  getSystemSettings: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/system`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch system settings');
    return parseJson(response);
  },

  // Accounting
  getAccountingOverview: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/overview`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch accounting overview');
    return parseJson(response);
  },

  getTenantPayments: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/tenant-payments`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch tenant payments');
    return parseJson(response);
  },

  getLandlordPayments: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/landlord-payments`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch landlord payments');
    return parseJson(response);
  },

  getCollections: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/collections`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch collections');
    return parseJson(response);
  },

  getExpenses: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/expenses`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return parseJson(response);
  },

  // Landlord Payment Management
  approveLandlordPayment: async (paymentId) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/landlord-payments/${paymentId}/approve`, {
      method: 'POST',
      headers: headers,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to approve landlord payment');
    }
    return parseJson(response);
  },

  revokeLandlordPayment: async (paymentId) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/landlord-payments/${paymentId}/revoke`, {
      method: 'POST',
      headers: headers,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to revoke landlord payment');
    }
    return parseJson(response);
  },

  // Subscription Payment
  paySubscription: async (paymentData) => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/subscription/pay`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(paymentData)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to process subscription payment');
    }
    return parseJson(response);
  },

  // Messaging
  getConversations: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/messages/conversations`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return parseJson(response);
  },

  getConversationWithUser: async (userId) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/messages/${userId}`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch conversation');
    return parseJson(response);
  },

  sendMessage: async (messagePayload) => {
    const headers = getAuthHeaders(true);
    const body = JSON.stringify(messagePayload);
    
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/messages`, {
      method: 'POST',
      headers: headers,
      body: body,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Message send failed:', response.status, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || errorJson.message || `Failed to send message: ${response.status}`);
      } catch (e) {
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}. ${errorText}`);
      }
    }
    
    return parseJson(response);
  },

  getInbox: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/messages/inbox`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to fetch inbox');
    return parseJson(response);
  },
};

