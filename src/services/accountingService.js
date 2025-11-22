import { buildApiUrl, apiRequest } from '../config/api';

export const accountingService = {
  // Overview APIs
  getOverview: async () => {
    const url = buildApiUrl('/api/accounting/overview');
    return await apiRequest(url);
  },

  // Tenant Payments APIs
  getTenantPayments: async (filters = {}) => {
    let url = buildApiUrl('/api/accounting/tenant-payments');
    const queryParams = new URLSearchParams();
    
    if (filters.property) queryParams.append('property', filters.property);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.chargeType) queryParams.append('chargeType', filters.chargeType);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  recordTenantPayment: async (paymentData) => {
    const url = buildApiUrl('/api/accounting/tenant-payments');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  approveTenantPayment: async (paymentId) => {
    const url = buildApiUrl(`/api/accounting/tenant-payments/${paymentId}/approve`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  generateReceipt: async (paymentId) => {
    const url = buildApiUrl(`/api/accounting/tenant-payments/${paymentId}/receipt`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  sendReceipt: async (paymentId, email) => {
    const url = buildApiUrl(`/api/accounting/tenant-payments/${paymentId}/send-receipt`);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Landlord Payments APIs
  getLandlordPayments: async (filters = {}) => {
    let url = buildApiUrl('/api/accounting/landlord-payments');
    const queryParams = new URLSearchParams();
    
    if (filters.building) queryParams.append('building', filters.building);
    if (filters.landlord) queryParams.append('landlord', filters.landlord);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  recordLandlordPayment: async (paymentData) => {
    const url = buildApiUrl('/api/accounting/landlord-payments');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  transferToLandlord: async (paymentId) => {
    const url = buildApiUrl(`/api/accounting/landlord-payments/${paymentId}/transfer`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  // Collections APIs
  getCollections: async (filters = {}) => {
    let url = buildApiUrl('/api/accounting/collections');
    const queryParams = new URLSearchParams();
    
    if (filters.building) queryParams.append('building', filters.building);
    if (filters.landlord) queryParams.append('landlord', filters.landlord);
    if (filters.chargeType) queryParams.append('chargeType', filters.chargeType);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  getCollectionsPerBuilding: async () => {
    const url = buildApiUrl('/api/accounting/collections/per-building');
    return await apiRequest(url);
  },

  recordCollection: async (collectionData) => {
    const url = buildApiUrl('/api/accounting/collections');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(collectionData),
    });
  },

  // Expenses APIs
  getExpenses: async (filters = {}) => {
    let url = buildApiUrl('/api/accounting/expenses');
    const queryParams = new URLSearchParams();
    
    if (filters.building) queryParams.append('building', filters.building);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  addExpense: async (expenseData) => {
    const url = buildApiUrl('/api/accounting/expenses');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },

  updateExpense: async (expenseId, expenseData) => {
    const url = buildApiUrl(`/api/accounting/expenses/${expenseId}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  },

  deleteExpense: async (expenseId) => {
    const url = buildApiUrl(`/api/accounting/expenses/${expenseId}`);
    return await apiRequest(url, {
      method: 'DELETE',
    });
  },

  // Reports APIs
  getMonthlySummary: async () => {
    const url = buildApiUrl('/api/accounting/summary/monthly');
    return await apiRequest(url);
  },

  getFinancialReport: async (startDate, endDate) => {
    const url = buildApiUrl(`/api/accounting/reports/financial?start=${startDate}&end=${endDate}`);
    return await apiRequest(url);
  },

  getGlobalBalance: async () => {
    const url = buildApiUrl('/api/accounting/balance/global');
    return await apiRequest(url);
  },

  // Document Upload APIs
  uploadReceiptDocument: async (paymentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = buildApiUrl(`/api/accounting/tenant-payments/${paymentId}/upload-receipt`);
    const token = localStorage.getItem('token');
    
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
      },
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to upload receipt document');
      }
      return response.json();
    });
  },

  uploadExpenseDocument: async (expenseId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = buildApiUrl(`/api/accounting/expenses/${expenseId}/upload-document`);
    const token = localStorage.getItem('token');
    
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
      },
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to upload expense document');
      }
      return response.json();
    });
  },

  // Get advertisements
  getAdvertisements: async () => {
    const url = buildApiUrl('/api/accounting/advertisements');
    return await apiRequest(url);
  },
};
