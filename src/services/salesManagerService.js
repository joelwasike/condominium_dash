import { buildApiUrl, apiRequest } from '../config/api';
import { API_CONFIG } from '../config/api';

// Sales Manager API Service
export const salesManagerService = {
  // Get overview statistics (enhanced with new fields)
  getOverview: async () => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.OVERVIEW);
    return await apiRequest(url);
  },

  // Get all properties (with optional query filters)
  getProperties: async (filters = {}) => {
    let url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.PROPERTIES);
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.urgency) queryParams.append('urgency', filters.urgency);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  // Get properties by occupancy status
  getPropertiesByOccupancy: async (status) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.PROPERTIES}/occupancy/${status}`);
    return await apiRequest(url);
  },

  // Get all clients
  getClients: async () => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS);
    return await apiRequest(url);
  },

  // Get waiting list clients
  getWaitingListClients: async () => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS}/waiting-list`);
    return await apiRequest(url);
  },

  // Create new client/tenant
  createClient: async (clientData) => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  },

  // Update client/tenant profile
  updateClient: async (clientId, clientData) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS}/${clientId}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  },

  // Get unpaid rents
  getUnpaidRents: async () => {
    const url = buildApiUrl('/api/salesmanager/unpaid-rents');
    return await apiRequest(url);
  },

  // Update unpaid rent
  updateUnpaidRent: async (unpaidRentId, updateData) => {
    const url = buildApiUrl(`/api/salesmanager/unpaid-rents/${unpaidRentId}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Get all alerts (with optional type filter)
  getAlerts: async (type = null) => {
    let url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.ALERTS);
    if (type) {
      url += `?type=${encodeURIComponent(type)}`;
    }
    return await apiRequest(url);
  },

  // Get unpaid rent alerts
  getUnpaidRentAlerts: async () => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.ALERTS}/unpaid-rents`);
    return await apiRequest(url);
  },

  // Create new alert
  createAlert: async (alertData) => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.ALERTS);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  },

  // Update alert status
  updateAlert: async (alertId, status) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.ALERTS}/${alertId}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Create new property
  createProperty: async (propertyData) => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.PROPERTIES);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  // Update property
  updateProperty: async (propertyId, propertyData) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.PROPERTIES}/${propertyId}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  },
};
