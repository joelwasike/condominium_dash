import { buildApiUrl, apiRequest } from '../config/api';
import { API_CONFIG } from '../config/api';
export const salesManagerService = {
  getOverview: async () => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.OVERVIEW);
    return await apiRequest(url);
  },
  getProperty: async (propertyId) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.PROPERTIES}/${propertyId}`);
    return await apiRequest(url);
  },
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
  getPropertiesByOccupancy: async (status) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.PROPERTIES}/occupancy/${status}`);
    return await apiRequest(url);
  },
  getSalesProperties: async () => {
    const url = buildApiUrl('/api/salesmanager/sales-properties');
    return await apiRequest(url);
  },
  getClients: async () => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS);
    return await apiRequest(url);
  },
  getClient: async (clientId) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS}/${clientId}`);
    return await apiRequest(url);
  },
  getClientUnitAssignment: async (clientId) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS}/${clientId}/unit-assignment`);
    return await apiRequest(url);
  },
  bulkDeleteClients: async ({ clientIds, password }) => {
    const url = buildApiUrl('/api/salesmanager/clients/bulk-delete');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ clientIds, password })
    });
  },
  getMaintenance: async (maintenanceId) => {
    const url = buildApiUrl(`/api/salesmanager/maintenances/${maintenanceId}`);
    return await apiRequest(url);
  },
  createMaintenance: async (payload) => {
    const url = buildApiUrl('/api/salesmanager/maintenances');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  addClientNote: async (clientId, { note }) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS}/${clientId}/notes`);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
  },
  getApprovedClients: async () => {
    const url = buildApiUrl('/api/salesmanager/approved-clients');
    return await apiRequest(url);
  },
  getApprovedClientDocuments: async (clientId) => {
    const url = buildApiUrl(`/api/salesmanager/approved-clients/${clientId}/documents`);
    return await apiRequest(url);
  },

  getApprovedClientChecklist: async (clientId) => {
    const url = buildApiUrl(`/api/salesmanager/approved-clients/${clientId}/checklist`);
    return await apiRequest(url);
  },
  getWaitingListClients: async () => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS}/waiting-list`);
    return await apiRequest(url);
  },
  createClient: async (clientData) => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(clientData)
    });
  },
  updateClient: async (clientId, clientData) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS}/${clientId}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(clientData)
    });
  },
  getUnpaidRents: async () => {
    const url = buildApiUrl('/api/salesmanager/unpaid-rents');
    return await apiRequest(url);
  },
  updateUnpaidRent: async (unpaidRentId, updateData) => {
    const url = buildApiUrl(`/api/salesmanager/unpaid-rents/${unpaidRentId}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },
  getAlerts: async (type = null) => {
    let url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.ALERTS);
    if (type) {
      url += `?type=${encodeURIComponent(type)}`;
    }
    return await apiRequest(url);
  },
  getUnpaidRentAlerts: async () => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.ALERTS}/unpaid-rents`);
    return await apiRequest(url);
  },
  createAlert: async (alertData) => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.ALERTS);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
  },
  updateAlert: async (alertId, status) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.ALERTS}/${alertId}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },
  createProperty: async (propertyData) => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.PROPERTIES);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(propertyData)
    });
  },
  updateProperty: async (propertyId, propertyData) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.PROPERTIES}/${propertyId}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(propertyData)
    });
  },
  deleteProperty: async (propertyId) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.PROPERTIES}/${propertyId}`);
    return await apiRequest(url, { method: 'DELETE' });
  },
  getAdvertisements: async () => {
    const url = buildApiUrl('/api/salesmanager/advertisements');
    return await apiRequest(url);
  },
  getListingsOverview: async () => {
    const url = buildApiUrl('/api/salesmanager/listings-overview');
    return await apiRequest(url);
  },
  listListings: async (filters = {}) => {
    let url = buildApiUrl('/api/salesmanager/listings');
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
    return await apiRequest(url);
  },

  createListing: async (listingData) => {
    const url = buildApiUrl('/api/salesmanager/listings');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(listingData)
    });
  },

  updateListing: async (id, listingData) => {
    const url = buildApiUrl(`/api/salesmanager/listings/${id}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(listingData)
    });
  },
  listVisits: async (filters = {}) => {
    let url = buildApiUrl('/api/salesmanager/visits');
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.property) queryParams.append('property', filters.property);
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
    return await apiRequest(url);
  },

  scheduleVisit: async (visitData) => {
    const url = buildApiUrl('/api/salesmanager/visits');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(visitData)
    });
  },

  updateVisitStatus: async (id, status, notes) => {
    const url = buildApiUrl(`/api/salesmanager/visits/${id}/status`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify({ status, notes })
    });
  },
  getInterestedClientsHistory: async () => {
    const url = buildApiUrl('/api/salesmanager/clients/history');
    return await apiRequest(url);
  },
  listRequests: async (filters = {}) => {
    let url = buildApiUrl('/api/salesmanager/requests');
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
    return await apiRequest(url);
  },

  createVisitRequest: async (requestData) => {
    const url = buildApiUrl('/api/salesmanager/requests');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  },

  updateVisitRequest: async (id, status) => {
    const url = buildApiUrl(`/api/salesmanager/requests/${id}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  followUpVisitRequest: async (id, message) => {
    const url = buildApiUrl(`/api/salesmanager/requests/${id}/follow-up`);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },
  getOwners: async () => {
    const url = buildApiUrl('/api/salesmanager/owners');
    return await apiRequest(url);
  },
  getOwnerAssets: async (ownerId) => {
    const url = buildApiUrl(`/api/salesmanager/owners/${ownerId}/properties`);
    return await apiRequest(url);
  },
  getPropertyBuildingDetail: async (propertyId) => {
    const url = buildApiUrl(`/api/salesmanager/properties/${propertyId}/building-detail`);
    return await apiRequest(url);
  },
  getRecoverySummary: async () => {
    const url = buildApiUrl('/api/salesmanager/recovery');
    return await apiRequest(url);
  },
  sendRecoveryReminder: async (payload) => {
    const url = buildApiUrl('/api/salesmanager/recovery/remind');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getAlertProperties: async () => {
    const url = buildApiUrl('/api/salesmanager/alerts/properties');
    return await apiRequest(url);
  },
  getAlertPropertyTenants: async (propertyId) => {
    const url = buildApiUrl(`/api/salesmanager/alerts/properties/${propertyId}/tenants`);
    return await apiRequest(url);
  },
  getAlertPropertyTenantsAll: async (propertyId) => {
    const url = buildApiUrl(`/api/salesmanager/alerts/properties/${propertyId}/tenants?scope=all`);
    return await apiRequest(url);
  },
  getAlertUnpaidTenants: async () => {
    const url = buildApiUrl('/api/salesmanager/alerts/unpaid-tenants');
    return await apiRequest(url);
  },
  getAlertAllTenants: async () => {
    const url = buildApiUrl('/api/salesmanager/alerts/all-tenants');
    return await apiRequest(url);
  },
  sendTenantAlert: async ({ clientId, channel, message, subject, urgency }) => {
    const url = buildApiUrl('/api/salesmanager/alerts/send');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ clientId, channel, message, subject, urgency })
    });
  },
  sendTenantAlertBulk: async ({ clientIds, channel, message, subject, urgency }) => {
    const url = buildApiUrl('/api/salesmanager/alerts/send-bulk');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ clientIds, channel, message, subject, urgency })
    });
  },
  addApartmentToBuilding: async (propertyId, payload) => {
    const url = buildApiUrl(`/api/salesmanager/properties/${propertyId}/units`);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  updatePropertyUnit: async (propertyId, unitId, payload) => {
    const url = buildApiUrl(`/api/salesmanager/properties/${propertyId}/units/${unitId}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  deletePropertyUnit: async (propertyId, unitId) => {
    const url = buildApiUrl(`/api/salesmanager/properties/${propertyId}/units/${unitId}`);
    return await apiRequest(url, { method: 'DELETE' });
  },
  importClientsFromExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const fileName = file.name || '';
    const isCSV = fileName.toLowerCase().endsWith('.csv');
    const fileType = isCSV ? 'CSV' : 'Excel';

    const url = buildApiUrl('/api/salesmanager/clients/import-excel');
    const token = localStorage.getItem('token');

    return await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token || ''
      },
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          let errorMessage = errorJson.error || errorJson.message || `Failed to import ${fileType} file: ${response.status}`;
          if (isCSV && errorMessage.includes('Invalid file type') && errorMessage.includes('.xlsx and .xls')) {
            errorMessage = 'CSV file support needs to be enabled on the backend. Please contact the administrator or use .xlsx/.xls format.';
          }

          throw new Error(errorMessage);
        } catch (e) {
          if (e instanceof Error && e.message) {
            throw e;
          }
          throw new Error(`Failed to import ${fileType} file: ${response.status} ${response.statusText}. ${errorText}`);
        }
      }
      return response.json();
    });
  },
  importPropertiesFromFile: async (file, { ownerId } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (ownerId) formData.append('ownerId', ownerId);

    const url = buildApiUrl('/api/salesmanager/properties/import-file');
    const token = localStorage.getItem('token');

    return await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token || ''
      },
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || `Failed to import properties: ${response.status}`);
        } catch (e) {
          if (e instanceof Error && e.message) throw e;
          throw new Error(`Failed to import properties: ${response.status} ${response.statusText}. ${errorText}`);
        }
      }
      return response.json();
    });
  },
  bulkDeleteProperties: async ({ propertyIds, password }) => {
    const url = buildApiUrl('/api/salesmanager/properties/bulk-delete');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ propertyIds, password })
    });
  },
  linkFastAssociate: async ({ clientId, propertyId, unitId, forceMove = true }) => {
    const url = buildApiUrl('/api/salesmanager/link-fast/associate');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ clientId, propertyId, unitId: unitId ?? null, forceMove })
    });
  }
};
