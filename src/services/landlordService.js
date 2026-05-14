import { API_CONFIG } from '../config/api';
import { buildApiUrl, apiRequest } from '../config/api';

const LANDLORD_BASE_URL = `${API_CONFIG.BASE_URL}/api/landlord`;

const unwrapList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.payments)) return data.payments;
  if (Array.isArray(data?.workOrders)) return data.workOrders;
  if (Array.isArray(data?.claims)) return data.claims;
  if (Array.isArray(data?.inventories)) return data.inventories;
  if (Array.isArray(data?.properties)) return data.properties;
  if (Array.isArray(data?.tenants)) return data.tenants;
  return [];
};

export const landlordService = {
  // Overview
  getOverview: async () => {
    return await apiRequest(buildApiUrl('/api/landlord/overview'));
  },

  // Properties
  getProperties: async () => {
    const data = await apiRequest(buildApiUrl('/api/landlord/properties'));
    return unwrapList(data);
  },

  // Get building/villa detail with units and images (shared property data - try landlord endpoint first, fallback to sales manager)
  getPropertyBuildingDetail: async (propertyId) => {
    try {
      return await apiRequest(buildApiUrl(`/api/landlord/properties/${propertyId}/building-detail`));
    } catch {
      return await apiRequest(buildApiUrl(`/api/salesmanager/properties/${propertyId}/building-detail`));
    }
  },

  addProperty: async (propertyData) => {
    return await apiRequest(buildApiUrl('/api/landlord/properties'), {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  // Tenants
  getTenants: async () => {
    const data = await apiRequest(buildApiUrl('/api/landlord/tenants'));
    return unwrapList(data);
  },

  // Get full tenant details by ID (same structure as Sales Manager getClient)
  getTenant: async (tenantId) => {
    return await apiRequest(buildApiUrl(`/api/landlord/tenants/${tenantId}`));
  },

  // Rents
  getRents: async () => {
    return await apiRequest(buildApiUrl('/api/landlord/rents'));
  },

  // Payments
  getPayments: async () => {
    const data = await apiRequest(buildApiUrl('/api/landlord/payments'));
    return unwrapList(data);
  },

  getNetPayments: async (filters = {}) => {
    let url = buildApiUrl('/api/landlord/payments/net');
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  getPaymentHistory: async (filters = {}) => {
    let url = buildApiUrl('/api/landlord/payments/history');
    const queryParams = new URLSearchParams();
    
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  generateReceipt: async (receiptData) => {
    return await apiRequest(buildApiUrl('/api/landlord/payments/receipt'), {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });
  },

  // Expenses
  getExpenses: async (filters = {}) => {
    let url = buildApiUrl('/api/landlord/expenses');
    const queryParams = new URLSearchParams();
    
    if (filters.property) queryParams.append('property', filters.property);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  // Building expenses pending owner approval (expenses linked to owner's buildings)
  getPendingExpensesForApproval: async () => {
    try {
      const url = buildApiUrl('/api/landlord/expenses/pending-approval');
      return await apiRequest(url);
    } catch (err) {
      return [];
    }
  },

  approveExpense: async (expenseId) => {
    return await apiRequest(buildApiUrl(`/api/landlord/expenses/${expenseId}/approve`), {
      method: 'POST',
    });
  },

  rejectExpense: async (expenseId) => {
    return await apiRequest(buildApiUrl(`/api/landlord/expenses/${expenseId}/reject`), {
      method: 'POST',
    });
  },

  // Maintenance Quotes - landlord approval flow
  getMaintenanceQuotes: async (filters = {}) => {
    let url = buildApiUrl('/api/landlord/maintenance-quotes');
    const queryParams = new URLSearchParams();

    if (filters.status) queryParams.append('status', filters.status);

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    return await apiRequest(url);
  },

  approveMaintenanceQuote: async (id) => {
    return await apiRequest(buildApiUrl(`/api/landlord/maintenance-quotes/${id}/approve`), {
      method: 'POST',
    });
  },

  rejectMaintenanceQuote: async (id) => {
    return await apiRequest(buildApiUrl(`/api/landlord/maintenance-quotes/${id}/reject`), {
      method: 'POST',
    });
  },

  // Maintenances (from technician) - visible in Works & Claims
  getMaintenances: async () => {
    const data = await apiRequest(buildApiUrl('/api/landlord/maintenances'));
    return unwrapList(data);
  },

  approveMaintenance: async (id) => {
    return await apiRequest(buildApiUrl(`/api/landlord/maintenances/${id}/approve`), {
      method: 'POST',
    });
  },

  // Reports
  downloadReport: async (filters = {}) => {
    let url = buildApiUrl('/api/landlord/reports/download');
    const queryParams = new URLSearchParams();
    
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': localStorage.getItem('token') || '',
      },
    });
    
    if (!response.ok) throw new Error('Failed to download report');
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `landlord-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
    
    return { message: 'Report downloaded successfully' };
  },

  // Work Orders
  getWorkOrders: async () => {
    const data = await apiRequest(buildApiUrl('/api/landlord/works'));
    return unwrapList(data);
  },

  createWorkOrder: async (workOrderData) => {
    return await apiRequest(buildApiUrl('/api/landlord/works'), {
      method: 'POST',
      body: JSON.stringify(workOrderData),
    });
  },

  // Claims
  getClaims: async () => {
    const data = await apiRequest(buildApiUrl('/api/landlord/claims'));
    return unwrapList(data);
  },

  createClaim: async (claimData) => {
    return await apiRequest(buildApiUrl('/api/landlord/claims'), {
      method: 'POST',
      body: JSON.stringify(claimData),
    });
  },

  // Inventory
  getInventory: async () => {
    const data = await apiRequest(buildApiUrl('/api/landlord/inventory'));
    return unwrapList(data);
  },

  addInventory: async (inventoryData) => {
    return await apiRequest(buildApiUrl('/api/landlord/inventory'), {
      method: 'POST',
      body: JSON.stringify(inventoryData),
    });
  },

  // Business Tracking
  getBusinessTracking: async () => {
    return await apiRequest(buildApiUrl('/api/landlord/tracking'));
  },

  // Get advertisements
  getAdvertisements: async () => {
    return await apiRequest(buildApiUrl('/api/landlord/advertisements'));
  },
};
