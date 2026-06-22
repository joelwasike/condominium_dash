import { buildApiUrl, apiRequest, apiRequestPaginated } from '../config/api';

const unwrapList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.payments)) return data.payments;
  if (Array.isArray(data?.tenantPayments)) return data.tenantPayments;
  if (Array.isArray(data?.landlordPayments)) return data.landlordPayments;
  if (Array.isArray(data?.collections)) return data.collections;
  if (Array.isArray(data?.expenses)) return data.expenses;
  if (Array.isArray(data?.landlords)) return data.landlords;
  if (Array.isArray(data?.owners)) return data.owners;
  if (Array.isArray(data?.accounts)) return data.accounts;
  if (Array.isArray(data?.transactions)) return data.transactions;
  return [];
};

export const accountingService = {
  // Overview APIs
  getOverview: async () => {
    const url = buildApiUrl('/api/accounting/overview');
    return await apiRequest(url);
  },

  // Cashier APIs
  getCashierAccounts: async () => {
    const url = buildApiUrl('/api/accounting/cashier/accounts');
    const data = await apiRequest(url);
    return unwrapList(data);
  },

  getCashierTransactions: async () => {
    const url = buildApiUrl('/api/accounting/cashier/transactions');
    const data = await apiRequest(url);
    return unwrapList(data);
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

  // Rent summary (collected, expected, paid, unpaid)
  getRentSummary: async () => {
    const url = buildApiUrl('/api/accounting/rent-summary');
    return await apiRequest(url);
  },

  // Daily report (balance sheet style)
  getDailyReport: async (month) => {
    let url = buildApiUrl('/api/accounting/daily-report');
    if (month) {
      url += `?month=${encodeURIComponent(month)}`;
    }
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

    const data = await apiRequest(url);
    return unwrapList(data);
  },

  getTenantPaymentsPage: async (filters = {}) => {
    let url = buildApiUrl('/api/accounting/tenant-payments');
    const queryParams = new URLSearchParams();
    if (filters.property) queryParams.append('property', filters.property);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.chargeType) queryParams.append('chargeType', filters.chargeType);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.page) queryParams.append('page', String(filters.page));
    if (filters.pageSize) queryParams.append('pageSize', String(filters.pageSize));
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
    return await apiRequestPaginated(url);
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

    const data = await apiRequest(url);
    return unwrapList(data);
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

  approveLandlordPayment: async (paymentId) => {
    const url = buildApiUrl(`/api/accounting/landlord-payments/${paymentId}/approve`);
    return await apiRequest(url, {
      method: 'POST',
    });
  },

  // Get list of landlords (same source as sales manager owners - for Owner Balances, tenant management, etc.)
  getLandlords: async () => {
    const url = buildApiUrl('/api/accounting/landlords');
    const data = await apiRequest(url);
    return unwrapList(data);
  },

  // Get owners - same backend table as sales manager (/api/salesmanager/owners). Backend should implement /api/accounting/owners to return same data.
  getOwners: async () => {
    try {
      const url = buildApiUrl('/api/accounting/owners');
      const data = await apiRequest(url);
      return unwrapList(data);
    } catch (err) {
      // Fallback to landlords if /api/accounting/owners not implemented
      const landlords = await apiRequest(buildApiUrl('/api/accounting/landlords'));
      return unwrapList(landlords);
    }
  },

  // Owners summary for Owner Payments list (expected/collected/expenses/to-repay)
  getOwnersSummary: async () => {
    const url = buildApiUrl('/api/accounting/owners/summary');
    const data = await apiRequest(url);
    return unwrapList(data);
  },

  // Get landlord properties with income calculations
  getLandlordProperties: async (landlordId) => {
    const url = buildApiUrl(`/api/accounting/landlords/properties?landlordId=${landlordId}`);
    return await apiRequest(url);
  },

  // Get all properties for the company (for property sale dropdown)
  getProperties: async () => {
    const url = buildApiUrl('/api/accounting/properties');
    const data = await apiRequest(url);
    return unwrapList(data);
  },

  // Get units (apartments) for a property by address
  getPropertyUnits: async (address) => {
    if (!address) return [];
    const url = buildApiUrl(`/api/accounting/properties/units?address=${encodeURIComponent(address)}`);
    const data = await apiRequest(url);
    return Array.isArray(data) ? data : [];
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

    const data = await apiRequest(url);
    return unwrapList(data);
  },

  getCollectionsPage: async (filters = {}) => {
    let url = buildApiUrl('/api/accounting/collections');
    const queryParams = new URLSearchParams();
    if (filters.building) queryParams.append('building', filters.building);
    if (filters.landlord) queryParams.append('landlord', filters.landlord);
    if (filters.chargeType) queryParams.append('chargeType', filters.chargeType);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.page) queryParams.append('page', String(filters.page));
    if (filters.pageSize) queryParams.append('pageSize', String(filters.pageSize));
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
    return await apiRequestPaginated(url);
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
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.scope) queryParams.append('scope', filters.scope); // 'agency' | 'owner'
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const data = await apiRequest(url);
    return unwrapList(data);
  },

  getExpensesSummary: async (filters = {}) => {
    let url = buildApiUrl('/api/accounting/expenses/summary');
    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
    return await apiRequest(url);
  },

  getExpensesPerOwner: async (filters = {}) => {
    let url = buildApiUrl('/api/accounting/expenses/per-owner');
    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
    return await apiRequest(url);
  },

  getWorkingDisbursements: async () => {
    const url = buildApiUrl('/api/accounting/expenses/working-disbursements');
    const data = await apiRequest(url);
    return unwrapList(data);
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

  markExpenseAsPaid: async (expenseId) => {
    const url = buildApiUrl(`/api/accounting/expenses/${expenseId}/pay`);
    return await apiRequest(url, {
      method: 'POST',
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

  // Agency balance - commission deducted from tenant payments (owner commission percentage)
  getAgencyBalance: async () => {
    const url = buildApiUrl('/api/accounting/agency-balance');
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
    const data = await apiRequest(url);
    return unwrapList(data);
  },

  // Get full tenant detail (same rich structure as sales manager getClient)
  getAccountingTenantDetail: async (tenantId) => {
    return apiRequest(buildApiUrl(`/api/accounting/tenants/${tenantId}`));
  },

  // Security Deposits
  getDepositRefundsPending: async () => {
    const url = buildApiUrl('/api/accounting/deposit-refunds/pending');
    const data = await apiRequest(url);
    return unwrapList(data);
  },

  getSecurityDeposits: async (filters = {}) => {
    let url = buildApiUrl('/api/accounting/deposits');
    const queryParams = new URLSearchParams();
    
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.status) queryParams.append('status', filters.status);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const data = await apiRequest(url);
    return unwrapList(data);
  },

  getSecurityDepositsPage: async (filters = {}) => {
    let url = buildApiUrl('/api/accounting/deposits');
    const queryParams = new URLSearchParams();
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.page) queryParams.append('page', String(filters.page));
    if (filters.pageSize) queryParams.append('pageSize', String(filters.pageSize));
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
    return await apiRequestPaginated(url);
  },

  getDepositEligibleTenants: async (filters = {}) => {
    let url = buildApiUrl('/api/accounting/deposits/eligible-tenants');
    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.append('page', String(filters.page));
    if (filters.pageSize) queryParams.append('pageSize', String(filters.pageSize));
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
    const data = await apiRequest(url);
    return unwrapList(data);
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
    const body = { ...refundData };
    if (refundData.refundAmount != null) {
      body.refundAmount = Number(refundData.refundAmount);
    }
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Employees (caretakers, etc.) - backend can implement /api/accounting/employees
  getEmployees: async () => {
    try {
      const url = buildApiUrl('/api/accounting/employees');
      const data = await apiRequest(url);
      return unwrapList(data);
    } catch {
      const stored = localStorage.getItem('accounting_employees');
      return stored ? JSON.parse(stored) : [];
    }
  },

  addEmployee: async (employeeData) => {
    try {
      const url = buildApiUrl('/api/accounting/employees');
      return await apiRequest(url, { method: 'POST', body: JSON.stringify(employeeData) });
    } catch {
      const stored = JSON.parse(localStorage.getItem('accounting_employees') || '[]');
      const id = Date.now();
      const emp = { ...employeeData, ID: id, id };
      stored.push(emp);
      localStorage.setItem('accounting_employees', JSON.stringify(stored));
      return emp;
    }
  },

  payEmployee: async (employeeId, paymentData) => {
    try {
      const url = buildApiUrl(`/api/accounting/employees/${employeeId}/pay`);
      return await apiRequest(url, { method: 'POST', body: JSON.stringify(paymentData) });
    } catch {
      const payments = JSON.parse(localStorage.getItem('accounting_employee_payments') || '[]');
      const pay = { ...paymentData, employeeId, id: Date.now(), date: new Date().toISOString() };
      payments.push(pay);
      localStorage.setItem('accounting_employee_payments', JSON.stringify(payments));
      return pay;
    }
  },

  getEmployeePayments: async () => {
    try {
      const url = buildApiUrl('/api/accounting/employees/payments');
      const data = await apiRequest(url);
      return unwrapList(data);
    } catch {
      return JSON.parse(localStorage.getItem('accounting_employee_payments') || '[]');
    }
  },

  getSecurityDeposit: async (depositId) => {
    const url = buildApiUrl(`/api/accounting/deposits/${depositId}`);
    return await apiRequest(url);
  },
};
