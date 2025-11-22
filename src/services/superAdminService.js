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

export const superAdminService = {
  // Overview / subscription stats (agency-level)
  getOverview: async () => {
    // The backend exposes aggregated subscription / agency stats for the global
    // super admin under /agency-stats according to the API collection.
    const response = await fetch(`${SUPERADMIN_BASE_URL}/agency-stats`);
    if (!response.ok) throw new Error('Failed to fetch super admin overview / agency stats');
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

  // Agency Directors (Super Admin <-> Agency Director communication layer)
  getAgencyAdmins: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/agency-directors`);
    if (!response.ok) throw new Error('Failed to fetch agency directors');
    return parseJson(response);
  },

  addAgencyAdmin: async (adminData) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/agency-admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData),
    });
    if (!response.ok) throw new Error('Failed to add agency admin');
    return parseJson(response);
  },

  updateAgencyAdmin: async (id, adminData) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/agency-admins/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData),
    });
    if (!response.ok) throw new Error('Failed to update agency admin');
    return parseJson(response);
  },

  deleteAgencyAdmin: async (id) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/agency-admins/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete agency admin');
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

  // Advertisements (global marketing banner management)
  getAdvertisements: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/advertisements`);
    if (!response.ok) throw new Error('Failed to fetch advertisements');
    return parseJson(response);
  },

  createAdvertisement: async (adData) => {
    // Create FormData for multipart/form-data request
    const formData = new FormData();
    formData.append('title', adData.title);
    formData.append('text', adData.text);
    
    // Handle image: must be a File object
    if (adData.image instanceof File) {
      formData.append('image', adData.image);
    } else {
      throw new Error('Image file is required. Please upload an image file.');
    }
    
    // Get auth token for Authorization header
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      const tokenStr = String(token).trim();
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
    
    // Don't set Content-Type header - browser will set it with boundary for FormData
    
    console.log('Creating advertisement with FormData:', { title: adData.title, text: adData.text, hasImage: !!adData.image });
    
    try {
      const response = await fetch(`${SUPERADMIN_BASE_URL}/advertisements`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Advertisement creation failed:', response.status, errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || `Failed to create advertisement: ${response.status}`);
        } catch (e) {
          throw new Error(`Failed to create advertisement: ${response.status} ${response.statusText}. ${errorText}`);
        }
      }
      
      return parseJson(response);
    } catch (error) {
      // Check if it's a CORS error
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        const corsError = new Error(
          'CORS Error: The API server is not allowing requests from this origin. ' +
          'Please configure CORS on the backend to allow requests from: ' + window.location.origin
        );
        corsError.name = 'CORSError';
        corsError.originalError = error;
        throw corsError;
      }
      throw error;
    }
  },

  // Chat between global super admin and agency admins
  getChatWithAdmin: async (adminId) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${SUPERADMIN_BASE_URL}/chat/${adminId}/messages`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch chat messages:', response.status, errorText);
      throw new Error(`Failed to fetch chat messages: ${response.status}`);
    }
    return parseJson(response);
  },

  sendChatMessage: async (messagePayload) => {
    const headers = getAuthHeaders(true);
    const body = JSON.stringify(messagePayload);
    
    console.log('Sending chat message:', { messagePayload, body, headers });
    
    const response = await fetch(`${SUPERADMIN_BASE_URL}/chat/messages`, {
      method: 'POST',
      headers: headers,
      body: body,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chat message send failed:', response.status, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || errorJson.message || `Failed to send chat message: ${response.status}`);
      } catch (e) {
        throw new Error(`Failed to send chat message: ${response.status} ${response.statusText}. ${errorText}`);
      }
    }
    
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

  // Subscription/Transaction History - MISSING API - needs to be created
  // Expected endpoint: GET /api/superadmin/subscriptions
  // Expected response: Array of subscription/transaction objects with:
  //   - id, agencyId/companyId, agencyName, email, amount, subscriptionAmount
  //   - paymentStatus (paid/pending/deactivated), accountStatus (active/inactive)
  //   - dueDate, paymentDate, createdAt
  getSubscriptions: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/subscriptions`);
    if (!response.ok) throw new Error('Failed to fetch subscriptions');
    return parseJson(response);
  },
};
