import { buildApiUrl, apiRequest } from '../config/api';
import { API_CONFIG } from '../config/api';

// Sales Manager API Service
export const salesManagerService = {
  // Get overview statistics
  getOverview: async () => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.OVERVIEW);
    return await apiRequest(url);
  },

  // Get all properties
  getProperties: async () => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.PROPERTIES);
    return await apiRequest(url);
  },

  // Get all clients
  getClients: async () => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS);
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

  // Get all alerts
  getAlerts: async () => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.ALERTS);
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
};
