import { buildApiUrl, apiRequest } from '../config/api';

export const accountingService = {
  // Overview APIs
  getOverview: async () => {
    const url = buildApiUrl('/api/accounting/overview');
    return await apiRequest(url);
  },

  // Cashier APIs
  getCashierAccounts: async () => {
    const url = buildApiUrl('/api/accounting/cashier/accounts');
    return await apiRequest(url);
  },

  getCashierTransactions: async () => {
    const url = buildApiUrl('/api/accounting/cashier/transactions');
    return await apiRequest(url);
  },

  createCashierAccount: async (accountData) => {
    const url = buildApiUrl('/api/accounting/cashier/accounts');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  },

  createCashierTransaction: async (transactionData) => {
    const url = buildApiUrl('/api/accounting/cashier/transactions');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
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

  // Import payments from file
  importPayments: async (formData) => {
    const url = buildApiUrl('/api/accounting/tenant-payments/import');
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to import payments');
    }

    return await response.json();
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

  // Get list of landlords
  getLandlords: async () => {
    const url = buildApiUrl('/api/accounting/landlords');
    return await apiRequest(url);
  },

  // Calculate available payment amount for a building
  calculateBuildingPaymentAmount: async (building) => {
    const url = buildApiUrl(`/api/accounting/landlord-payments/calculate-amount?building=${encodeURIComponent(building)}`);
    return await apiRequest(url);
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

  // Comprehensive Reports
  getPaymentsByPeriodReport: async (startDate, endDate, period = 'monthly') => {
    const url = buildApiUrl(`/api/accounting/reports/payments-by-period?startDate=${startDate}&endDate=${endDate}&period=${period}`);
    return await apiRequest(url);
  },

  getCommissionsByPeriodReport: async (startDate, endDate, period = 'monthly') => {
    const url = buildApiUrl(`/api/accounting/reports/commissions-by-period?startDate=${startDate}&endDate=${endDate}&period=${period}`);
    return await apiRequest(url);
  },

  getRefundsReport: async (startDate, endDate) => {
    const url = buildApiUrl(`/api/accounting/reports/refunds?startDate=${startDate}&endDate=${endDate}`);
    return await apiRequest(url);
  },

  getPaymentsByBuildingReport: async (startDate, endDate) => {
    const url = buildApiUrl(`/api/accounting/reports/payments-by-building?startDate=${startDate}&endDate=${endDate}`);
    return await apiRequest(url);
  },

  getPaymentsByTenantReport: async (startDate, endDate) => {
    const url = buildApiUrl(`/api/accounting/reports/payments-by-tenant?startDate=${startDate}&endDate=${endDate}`);
    return await apiRequest(url);
  },

  getExpensesByPeriodReport: async (startDate, endDate, category) => {
    let url = buildApiUrl(`/api/accounting/reports/expenses-by-period?startDate=${startDate}&endDate=${endDate}`);
    if (category) url += `&category=${encodeURIComponent(category)}`;
    return await apiRequest(url);
  },

  getCollectionsByPeriodReport: async (startDate, endDate) => {
    const url = buildApiUrl(`/api/accounting/reports/collections-by-period?startDate=${startDate}&endDate=${endDate}`);
    return await apiRequest(url);
  },

  getBuildingPerformanceReport: async (startDate, endDate) => {
    const url = buildApiUrl(`/api/accounting/reports/building-performance?startDate=${startDate}&endDate=${endDate}`);
    return await apiRequest(url);
  },

  getPaymentStatusReport: async (startDate, endDate) => {
    const url = buildApiUrl(`/api/accounting/reports/payment-status?startDate=${startDate}&endDate=${endDate}`);
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

  // Get tenants with payment status
  getTenantsWithPaymentStatus: async () => {
    const url = buildApiUrl('/api/accounting/tenants');
    return await apiRequest(url);
  },

  // Security Deposits
  getSecurityDeposits: async (filters = {}) => {
    let url = buildApiUrl('/api/accounting/deposits');
    const queryParams = new URLSearchParams();
    
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.status) queryParams.append('status', filters.status);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  recordDepositPayment: async (paymentData) => {
    const url = buildApiUrl('/api/accounting/deposits/payment');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  processDepositRefund: async (refundData) => {
    const url = buildApiUrl('/api/accounting/deposits/refund');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(refundData),
    });
  },

  getSecurityDeposit: async (depositId) => {
    const url = buildApiUrl(`/api/accounting/deposits/${depositId}`);
    return await apiRequest(url);
  },
};
