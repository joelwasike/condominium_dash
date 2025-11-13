import { API_CONFIG } from '../config/api';

const ACCOUNTING_BASE_URL = `${API_CONFIG.BASE_URL}/api/accounting`;

export const accountingService = {
  // Overview APIs
  getOverview: async () => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/overview`);
    if (!response.ok) throw new Error('Failed to fetch overview');
    return response.json();
  },

  // Tenant Payments APIs
  getTenantPayments: async () => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/tenant-payments`);
    if (!response.ok) throw new Error('Failed to fetch tenant payments');
    return response.json();
  },

  recordTenantPayment: async (paymentData) => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/tenant-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    if (!response.ok) throw new Error('Failed to record tenant payment');
    return response.json();
  },

  approveTenantPayment: async (paymentId) => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/tenant-payments/${paymentId}/approve`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to approve tenant payment');
    return response.json();
  },

  generateReceipt: async (paymentId) => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/tenant-payments/${paymentId}/receipt`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to generate receipt');
    return response.json();
  },

  sendReceipt: async (paymentId, email) => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/tenant-payments/${paymentId}/send-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) throw new Error('Failed to send receipt');
    return response.json();
  },

  // Landlord Payments APIs
  getLandlordPayments: async () => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/landlord-payments`);
    if (!response.ok) throw new Error('Failed to fetch landlord payments');
    return response.json();
  },

  recordLandlordPayment: async (paymentData) => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/landlord-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    if (!response.ok) throw new Error('Failed to record landlord payment');
    return response.json();
  },

  transferToLandlord: async (paymentId) => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/landlord-payments/${paymentId}/transfer`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to transfer to landlord');
    return response.json();
  },

  // Collections APIs
  getCollections: async () => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/collections`);
    if (!response.ok) throw new Error('Failed to fetch collections');
    return response.json();
  },

  recordCollection: async (collectionData) => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectionData)
    });
    if (!response.ok) throw new Error('Failed to record collection');
    return response.json();
  },

  // Expenses APIs
  getExpenses: async () => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/expenses`);
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return response.json();
  },

  addExpense: async (expenseData) => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData)
    });
    if (!response.ok) throw new Error('Failed to add expense');
    return response.json();
  },

  updateExpense: async (expenseId, expenseData) => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/expenses/${expenseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData)
    });
    if (!response.ok) throw new Error('Failed to update expense');
    return response.json();
  },

  deleteExpense: async (expenseId) => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/expenses/${expenseId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete expense');
    return response.json();
  },

  // Reports APIs
  getMonthlySummary: async () => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/summary/monthly`);
    if (!response.ok) throw new Error('Failed to fetch monthly summary');
    return response.json();
  },

  getFinancialReport: async (startDate, endDate) => {
    const response = await fetch(`${ACCOUNTING_BASE_URL}/reports/financial?start=${startDate}&end=${endDate}`);
    if (!response.ok) throw new Error('Failed to fetch financial report');
    return response.json();
  },

  // Document Upload APIs
  uploadReceiptDocument: async (paymentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('paymentId', paymentId);
    
    const response = await fetch(`${ACCOUNTING_BASE_URL}/tenant-payments/${paymentId}/upload-receipt`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload receipt document');
    return response.json();
  },

  uploadExpenseDocument: async (expenseId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('expenseId', expenseId);
    
    const response = await fetch(`${ACCOUNTING_BASE_URL}/expenses/${expenseId}/upload-document`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload expense document');
    return response.json();
  }
};
