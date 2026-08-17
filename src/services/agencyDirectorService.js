import { API_CONFIG, apiRequest, buildApiUrl } from '../config/api';

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
    const json = JSON.parse(text);
    if (json && Array.isArray(json.data) && typeof json.total === 'number' && typeof json.page === 'number') {
      return json.data;
    }
    return json;
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
    const sanitizedToken = tokenStr.
    split('').
    map((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code <= 126 ? char : '';
    }).
    join('');

    if (sanitizedToken && sanitizedToken.length > 0) {
      headers['Authorization'] = sanitizedToken;
    }
  }

  return headers;
};

export const agencyDirectorService = {
  getOverview: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/overview`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch overview');
    return parseJson(response);
  },
  getUsers: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/users`, {
      method: 'GET',
      headers: headers
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
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return parseJson(response);
  },
  getProperties: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/properties`, {
      method: 'GET',
      headers: headers
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
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to delete property');
    return parseJson(response);
  },
  getFinancialOverview: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/financial`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch financial overview');
    return parseJson(response);
  },
  getWorks: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/works`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch works');
    const data = await parseJson(response);
    return data?.works || data || [];
  },
  getSystemSettings: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/system`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch system settings');
    return parseJson(response);
  },
  getAccountingOverview: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/overview`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch accounting overview');
    return parseJson(response);
  },

  getTenantPayments: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/tenant-payments`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch tenant payments');
    return parseJson(response);
  },

  getLandlordPayments: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/landlord-payments`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch landlord payments');
    return parseJson(response);
  },

  getCollections: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/collections`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch collections');
    return parseJson(response);
  },

  getExpenses: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/expenses`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return parseJson(response);
  },

  getRevenueByOwner: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/revenue-by-owner`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch revenue by owner');
    const data = await parseJson(response);
    return Array.isArray(data) ? data : data?.revenueByOwner ?? data?.data ?? [];
  },

  getRevenueByAgency: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/revenue-by-agency`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch revenue by agency');
    const data = await parseJson(response);
    return Array.isArray(data) ? data : data?.revenueByAgency ?? data?.data ?? [];
  },
  approveLandlordPayment: async (paymentId) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/landlord-payments/${paymentId}/approve`, {
      method: 'POST',
      headers: headers
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
      headers: headers
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to revoke landlord payment');
    }
    return parseJson(response);
  },
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

  payAnnualSubscription: async (paymentData) => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/subscription/pay-annual`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(paymentData)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to process annual subscription payment');
    }
    return parseJson(response);
  },
  paySubscriptionViaMoMo: async ({ provider, phone, otp }) => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/subscription/pay-momo`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ provider, phone, otp })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to initiate subscription payment');
    }
    return parseJson(response);
  },

  payAnnualSubscriptionViaMoMo: async ({ provider, phone, otp }) => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/subscription/pay-annual-momo`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ provider, phone, otp })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to initiate annual subscription payment');
    }
    return parseJson(response);
  },
  getSubscriptionStatus: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/subscription/status`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch subscription status');
    return parseJson(response);
  },
  getConversations: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/messages/conversations`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return parseJson(response);
  },

  getConversationWithUser: async (userId) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/messages/${userId}`, {
      method: 'GET',
      headers: headers
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
      body: body
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
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch inbox');
    return parseJson(response);
  },
  getLeasesAwaitingSignature: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/contracts/leases-awaiting-signature`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch leases awaiting signature');
    return parseJson(response);
  },

  approveLeaseAgreement: async (leaseId) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/contracts/leases/${leaseId}/approve`, {
      method: 'POST',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to approve lease');
    return parseJson(response);
  },

  approveExpense: async (expenseId) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/contracts/expenses/${expenseId}/approve`, {
      method: 'POST',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to approve expense');
    return parseJson(response);
  },

  rejectExpense: async (expenseId) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/contracts/expenses/${expenseId}/reject`, {
      method: 'POST',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to reject expense');
    return parseJson(response);
  },

  approveQuote: async (quoteId, reason = '') => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/contracts/quotes/${quoteId}/approve`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ reason })
    });
    if (!response.ok) throw new Error('Failed to approve quote');
    return parseJson(response);
  },
  getPendingPayments: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/payments/pending-approval`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch pending payments');
    return parseJson(response);
  },
  getPendingExpenses: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/expenses/pending-approval`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch pending expenses');
    const data = await parseJson(response);
    return Array.isArray(data) ? data : data?.expenses ?? data?.data ?? [];
  },
  approveTenantPayment: async (paymentId) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: headers
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to approve payment');
    }
    return parseJson(response);
  },
  rejectTenantPayment: async (paymentId) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/accounting/payments/${paymentId}/reject`, {
      method: 'POST',
      headers: headers
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to reject payment');
    }
    return parseJson(response);
  },
  getPendingQuotes: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/contracts/quotes/pending-validation`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch pending quotes');
    return parseJson(response);
  },

  getQuoteHistory: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/contracts/quotes/history`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch quote history');
    return parseJson(response);
  },

  rejectQuote: async (quoteId, reason = '') => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/contracts/quotes/${quoteId}/reject`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ reason })
    });
    if (!response.ok) throw new Error('Failed to reject quote');
    return parseJson(response);
  },
  getMaintenanceWorkerQuotes: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/maintenance-worker-quotes`, {
      method: 'GET',
      headers
    });
    if (!response.ok) throw new Error('Failed to fetch maintenance worker quotes');
    return parseJson(response);
  },

  approveMaintenanceWorkerQuote: async (id, note = '') => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/maintenance-worker-quotes/${id}/approve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ note })
    });
    if (!response.ok) throw new Error('Failed to approve worker quote');
    return parseJson(response);
  },

  rejectMaintenanceWorkerQuote: async (id, note = '') => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/maintenance-worker-quotes/${id}/reject`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ note })
    });
    if (!response.ok) throw new Error('Failed to reject worker quote');
    return parseJson(response);
  },

  getOwners: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/contracts/owners`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch owners');
    return parseJson(response);
  },
  getOwnerAssets: async (ownerId) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/contracts/owners/${ownerId}/properties`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch owner assets');
    return parseJson(response);
  },
  getPropertyBuildingDetail: async (propertyId) => {
    const headers = getAuthHeaders(false);
    let response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/properties/${propertyId}/building-detail`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) {
      response = await fetch(`${API_CONFIG.BASE_URL}/api/salesmanager/properties/${propertyId}/building-detail`, {
        method: 'GET',
        headers: headers
      });
    }
    if (!response.ok) throw new Error('Failed to fetch property building detail');
    return parseJson(response);
  },

  createOwner: async (ownerData) => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/contracts/owners`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(ownerData)
    });
    if (!response.ok) throw new Error('Failed to create owner');
    return parseJson(response);
  },

  updateOwner: async (id, ownerData) => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/contracts/owners/${id}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(ownerData)
    });
    if (!response.ok) throw new Error('Failed to update owner');
    return parseJson(response);
  },

  deleteOwner: async (id) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/contracts/owners/${id}`, {
      method: 'DELETE',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to delete owner');
    return parseJson(response);
  },
  getTransferHistory: async (filters = {}) => {
    const headers = getAuthHeaders(false);
    const params = new URLSearchParams();
    if (filters.ownerId) params.append('ownerId', filters.ownerId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const url = `${AGENCY_DIRECTOR_BASE_URL}/reports/transfer-history${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch transfer history');
    return parseJson(response);
  },

  getExpensesPerBuilding: async (filters = {}) => {
    const headers = getAuthHeaders(false);
    const params = new URLSearchParams();
    if (filters.building) params.append('building', filters.building);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const url = `${AGENCY_DIRECTOR_BASE_URL}/reports/expenses-per-building${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch expenses per building');
    return parseJson(response);
  },

  getExpensesPerOwner: async (filters = {}) => {
    const headers = getAuthHeaders(false);
    const params = new URLSearchParams();
    if (filters.ownerId) params.append('ownerId', filters.ownerId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const url = `${AGENCY_DIRECTOR_BASE_URL}/reports/expenses-per-owner${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch expenses per owner');
    return parseJson(response);
  },

  getInternalExpenses: async (filters = {}) => {
    const headers = getAuthHeaders(false);
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const url = `${AGENCY_DIRECTOR_BASE_URL}/reports/internal-expenses${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch internal expenses');
    return parseJson(response);
  },

  getCommissionsPerMonthPerBuilding: async (filters = {}) => {
    const headers = getAuthHeaders(false);
    const params = new URLSearchParams();
    if (filters.building) params.append('building', filters.building);
    if (filters.month) params.append('month', filters.month);
    const url = `${AGENCY_DIRECTOR_BASE_URL}/reports/commissions-per-month-per-building${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch commissions per month per building');
    return parseJson(response);
  },

  getAllBuildingsReport: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/reports/all-buildings`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch all buildings report');
    return parseJson(response);
  },

  getUnpaidRentReport: async (filters = {}) => {
    const headers = getAuthHeaders(false);
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const url = `${AGENCY_DIRECTOR_BASE_URL}/reports/unpaid-rent${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch unpaid rent report');
    return parseJson(response);
  },
  getTenants: async (status = null) => {
    const headers = getAuthHeaders(false);
    const url = status ?
    `${AGENCY_DIRECTOR_BASE_URL}/tenants?status=${status}` :
    `${AGENCY_DIRECTOR_BASE_URL}/tenants`;
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch tenants');
    return parseJson(response);
  },

  getTenantProfile: async (tenantId) => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/tenants/${tenantId}/profile`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch tenant profile');
    return parseJson(response);
  },
  payAnnualSubscription: async (paymentData) => {
    const headers = getAuthHeaders(true);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/subscription/pay-annual`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(paymentData)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to process annual subscription payment');
    }
    return parseJson(response);
  },
  getAdvertisements: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/advertisements`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch advertisements');
    return parseJson(response);
  },
  getAnalyticsIndicators: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/analytics/indicators`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch analytics indicators');
    return parseJson(response);
  },

  getYearlyComparison: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/analytics/yearly-comparison`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch yearly comparison');
    return parseJson(response);
  },

  getMonthlyComparison: async () => {
    const headers = getAuthHeaders(false);
    const response = await fetch(`${AGENCY_DIRECTOR_BASE_URL}/analytics/monthly-comparison`, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch monthly comparison');
    const data = await parseJson(response);
    return Array.isArray(data) ? data : data?.monthlyData ?? data?.data ?? [];
  },

  // Settings → Reset: lists the resettable data categories.
  getResetScopes: async () => {
    return apiRequest(buildApiUrl('/api/agency-director/reset'));
  },
  // Row-count preview for one category, shown in the confirmation dialog before resetting.
  getResetPreview: async (scope) => {
    return apiRequest(buildApiUrl(`/api/agency-director/reset?scope=${encodeURIComponent(scope)}`));
  },
  // Permanently deletes every record in `scope` for this company. Requires the director's own
  // account password plus the literal confirmation text "RESET".
  resetData: async ({ scope, password, confirm }) => {
    return apiRequest(buildApiUrl('/api/agency-director/reset'), {
      method: 'POST',
      body: JSON.stringify({ scope, password, confirm })
    });
  }
};
