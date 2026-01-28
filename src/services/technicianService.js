import { buildApiUrl, apiRequest } from '../config/api';

export const technicianService = {
  // Overview APIs
  getOverview: async () => {
    return apiRequest(buildApiUrl('/api/technician/overview'), {
      method: 'GET',
    });
  },

  // Inspection APIs
  listInspections: async () => {
    return apiRequest(buildApiUrl('/api/technician/inspections'), {
      method: 'GET',
    });
  },

  createInspection: async (inspectionData) => {
    return apiRequest(buildApiUrl('/api/technician/inspections'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inspectionData),
    });
  },

  uploadInspectionPhoto: async (inspectionId, photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    return apiRequest(buildApiUrl(`/api/technician/inspections/${inspectionId}/photo`), {
      method: 'POST',
      body: formData,
    });
  },

  updateInspection: async (inspectionId, updateData) => {
    return apiRequest(buildApiUrl(`/api/technician/inspections/${inspectionId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
  },

  finalizeInspection: async (inspectionId) => {
    return apiRequest(buildApiUrl(`/api/technician/inspections/${inspectionId}/finalize`), {
      method: 'POST',
    });
  },

  getLatestInspection: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.property) queryParams.append('property', filters.property);
    if (filters.type) queryParams.append('type', filters.type);

    const url = buildApiUrl('/api/technician/inspections/latest');
    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
    return apiRequest(fullUrl, { method: 'GET' });
  },

  // Inventory APIs
  listInventories: async () => {
    return apiRequest(buildApiUrl('/api/technician/inventories'), {
      method: 'GET',
    });
  },

  createInventory: async (inventoryData) => {
    return apiRequest(buildApiUrl('/api/technician/inventories'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventoryData),
    });
  },

  // Maintenance APIs (from tenant requests)
  listMaintenanceRequests: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.priority) queryParams.append('priority', filters.priority);
    
    const url = buildApiUrl('/api/technician/maintenance-requests');
    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
    
    return apiRequest(fullUrl, {
      method: 'GET',
    });
  },

  updateMaintenanceRequest: async (id, updateData) => {
    return apiRequest(buildApiUrl(`/api/technician/maintenance-requests/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
  },

  // Quote APIs
  listQuotes: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    
    const url = buildApiUrl('/api/technician/quotes');
    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
    
    return apiRequest(fullUrl, {
      method: 'GET',
    });
  },

  submitQuote: async (quoteData) => {
    return apiRequest(buildApiUrl('/api/technician/quotes'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteData),
    });
  },

  // Progress APIs
  getWorkProgress: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.priority) queryParams.append('priority', filters.priority);
    
    const url = buildApiUrl('/api/technician/progress');
    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
    
    return apiRequest(fullUrl, {
      method: 'GET',
    });
  },

  getRepairProgressReport: async () => {
    return apiRequest(buildApiUrl('/api/technician/progress/report'), {
      method: 'GET',
    });
  },

  // Task APIs
  listTasks: async () => {
    return apiRequest(buildApiUrl('/api/technician/tasks'), {
      method: 'GET',
    });
  },

  createTask: async (taskData) => {
    return apiRequest(buildApiUrl('/api/technician/tasks'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
  },

  updateTask: async (id, updateData) => {
    return apiRequest(buildApiUrl(`/api/technician/tasks/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
  },

  // Get advertisements
  getAdvertisements: async () => {
    return apiRequest(buildApiUrl('/api/technician/advertisements'));
  },

  // Technician Contacts Management
  getTechnicianContacts: async () => {
    return apiRequest(buildApiUrl('/api/technician/technician-contacts'), {
      method: 'GET',
    });
  },

  createTechnicianContact: async (contactData) => {
    return apiRequest(buildApiUrl('/api/technician/technician-contacts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData),
    });
  },

  updateTechnicianContact: async (id, contactData) => {
    return apiRequest(buildApiUrl(`/api/technician/technician-contacts/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData),
    });
  },

  deleteTechnicianContact: async (id) => {
    return apiRequest(buildApiUrl(`/api/technician/technician-contacts/${id}`), {
      method: 'DELETE',
    });
  },

  // State of Entry and Exit
  getStateOfEntry: async () => {
    return apiRequest(buildApiUrl('/api/technician/state-entry'), {
      method: 'GET',
    });
  },

  getStateOfExit: async () => {
    return apiRequest(buildApiUrl('/api/technician/state-exit'), {
      method: 'GET',
    });
  },

  // History
  getHistory: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.date) queryParams.append('date', filters.date);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.property) queryParams.append('property', filters.property);
    
    const url = buildApiUrl('/api/technician/history');
    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
    
    return apiRequest(fullUrl, {
      method: 'GET',
    });
  },
};
