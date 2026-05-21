import { buildApiUrl, apiRequest } from '../config/api';
import { API_CONFIG } from '../config/api';

// Sales Manager API Service
export const salesManagerService = {
  // Get overview statistics (enhanced with new fields)
  getOverview: async () => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.OVERVIEW);
    return await apiRequest(url);
  },

  // Get single property with units (for edit form)
  getProperty: async (propertyId) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.PROPERTIES}/${propertyId}`);
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

  // Get properties that are strictly for sale (listings)
  getSalesProperties: async () => {
    const url = buildApiUrl('/api/salesmanager/sales-properties');
    return await apiRequest(url);
  },

  // Get all clients
  getClients: async () => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS);
    return await apiRequest(url);
  },

  // Get full tenant details by ID (client + property + alerts + maintenances + payments + notes)
  getClient: async (clientId) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS}/${clientId}`);
    return await apiRequest(url);
  },

  // Get where a tenant is assigned (building/unit), if any
  getClientUnitAssignment: async (clientId) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS}/${clientId}/unit-assignment`);
    return await apiRequest(url);
  },

  // Bulk delete tenants (password confirmation required)
  bulkDeleteClients: async ({ clientIds, password }) => {
    const url = buildApiUrl('/api/salesmanager/clients/bulk-delete');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ clientIds, password }),
    });
  },

  // Get full maintenance request by ID (for tenant detail view)
  getMaintenance: async (maintenanceId) => {
    const url = buildApiUrl(`/api/salesmanager/maintenances/${maintenanceId}`);
    return await apiRequest(url);
  },

  // Add private note about a tenant
  addClientNote: async (clientId, { note }) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.CLIENTS}/${clientId}/notes`);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  // Get approved client applications for onboarding
  getApprovedClients: async () => {
    const url = buildApiUrl('/api/salesmanager/approved-clients');
    return await apiRequest(url);
  },

  // Approved client documents (uploaded by administrative agent)
  getApprovedClientDocuments: async (clientId) => {
    const url = buildApiUrl(`/api/salesmanager/approved-clients/${clientId}/documents`);
    return await apiRequest(url);
  },

  getApprovedClientChecklist: async (clientId) => {
    const url = buildApiUrl(`/api/salesmanager/approved-clients/${clientId}/checklist`);
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

  // Delete property (and its units)
  deleteProperty: async (propertyId) => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.SALES_MANAGER.PROPERTIES}/${propertyId}`);
    return await apiRequest(url, { method: 'DELETE' });
  },

  // Get advertisements
  getAdvertisements: async () => {
    const url = buildApiUrl('/api/salesmanager/advertisements');
    return await apiRequest(url);
  },

  // Listings overview (listing/visit metrics, moved from commercial)
  getListingsOverview: async () => {
    const url = buildApiUrl('/api/salesmanager/listings-overview');
    return await apiRequest(url);
  },

  // Listings
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
      body: JSON.stringify(listingData),
    });
  },

  updateListing: async (id, listingData) => {
    const url = buildApiUrl(`/api/salesmanager/listings/${id}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(listingData),
    });
  },

  // Visits
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
      body: JSON.stringify(visitData),
    });
  },

  updateVisitStatus: async (id, status, notes) => {
    const url = buildApiUrl(`/api/salesmanager/visits/${id}/status`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  },

  // Interested clients history
  getInterestedClientsHistory: async () => {
    const url = buildApiUrl('/api/salesmanager/clients/history');
    return await apiRequest(url);
  },

  // Visit requests
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
      body: JSON.stringify(requestData),
    });
  },

  updateVisitRequest: async (id, status) => {
    const url = buildApiUrl(`/api/salesmanager/requests/${id}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  followUpVisitRequest: async (id, message) => {
    const url = buildApiUrl(`/api/salesmanager/requests/${id}/follow-up`);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Get owners (landlords) for property assignment (includes numberOfAssetsManaged, numberOfTenants, revenue)
  getOwners: async () => {
    const url = buildApiUrl('/api/salesmanager/owners');
    return await apiRequest(url);
  },

  // Get assets (properties) under management of an owner – renting and selling tables
  getOwnerAssets: async (ownerId) => {
    const url = buildApiUrl(`/api/salesmanager/owners/${ownerId}/properties`);
    return await apiRequest(url);
  },

  // Get building payment-management data (units, tenants, arrears, unpaid list) for a property
  getPropertyBuildingDetail: async (propertyId) => {
    const url = buildApiUrl(`/api/salesmanager/properties/${propertyId}/building-detail`);
    return await apiRequest(url);
  },

  // Recovery (unpaid invoices per building) summary
  getRecoverySummary: async () => {
    const url = buildApiUrl('/api/salesmanager/recovery');
    return await apiRequest(url);
  },

  // Send recovery reminder (sms/email) to one or more units
  sendRecoveryReminder: async (payload) => {
    const url = buildApiUrl('/api/salesmanager/recovery/remind');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Add apartment/unit to a building (Property Management)
  addApartmentToBuilding: async (propertyId, payload) => {
    const url = buildApiUrl(`/api/salesmanager/properties/${propertyId}/units`);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Update apartment/unit details (Edit apartment - full details aligned with state of entry/exit)
  updatePropertyUnit: async (propertyId, unitId, payload) => {
    const url = buildApiUrl(`/api/salesmanager/properties/${propertyId}/units/${unitId}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Delete apartment/unit from a building or villa
  deletePropertyUnit: async (propertyId, unitId) => {
    const url = buildApiUrl(`/api/salesmanager/properties/${propertyId}/units/${unitId}`);
    return await apiRequest(url, { method: 'DELETE' });
  },

  // Import clients/tenants from Excel or CSV
  // Note: Backend endpoint accepts .xlsx, .xls, and .csv files
  importClientsFromExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Determine file type for better error messages
    const fileName = file.name || '';
    const isCSV = fileName.toLowerCase().endsWith('.csv');
    const fileType = isCSV ? 'CSV' : 'Excel';
    
    const url = buildApiUrl('/api/salesmanager/clients/import-excel');
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
        try {
          const errorJson = JSON.parse(errorText);
          let errorMessage = errorJson.error || errorJson.message || `Failed to import ${fileType} file: ${response.status}`;
          
          // Provide helpful error message if CSV is rejected
          if (isCSV && errorMessage.includes('Invalid file type') && errorMessage.includes('.xlsx and .xls')) {
            errorMessage = 'CSV file support needs to be enabled on the backend. Please contact the administrator or use .xlsx/.xls format.';
          }
          
          throw new Error(errorMessage);
        } catch (e) {
          // If error is already an Error object, rethrow it
          if (e instanceof Error && e.message) {
            throw e;
          }
          throw new Error(`Failed to import ${fileType} file: ${response.status} ${response.statusText}. ${errorText}`);
        }
      }
      return response.json();
    });
  },

  // Import properties from Excel or CSV
  // Backend endpoint accepts .xlsx, .xls, and .csv files
  importPropertiesFromFile: async (file, { ownerId } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (ownerId) formData.append('ownerId', ownerId);

    const url = buildApiUrl('/api/salesmanager/properties/import-file');
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

  // Bulk delete properties (password confirmation required)
  bulkDeleteProperties: async ({ propertyIds, password }) => {
    const url = buildApiUrl('/api/salesmanager/properties/bulk-delete');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ propertyIds, password }),
    });
  },

  // Link Fast - associate tenant to property/unit
  linkFastAssociate: async ({ clientId, propertyId, unitId, forceMove = true }) => {
    const url = buildApiUrl('/api/salesmanager/link-fast/associate');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ clientId, propertyId, unitId: unitId ?? null, forceMove }),
    });
  },
};
