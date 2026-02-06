import { buildApiUrl, apiRequest } from '../config/api';

const buildAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) return {};
  const tokenStr = String(token).trim();
  const sanitizedToken = tokenStr
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      return (code >= 32 && code <= 126) ? char : '';
    })
    .join('');
  return sanitizedToken ? { Authorization: sanitizedToken } : {};
};

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

  createMaintenanceRequest: async (requestData) => {
    const cost = Number(requestData?.estimatedCost) || 0;
    if (requestData && Array.isArray(requestData.photos) && requestData.photos.length > 0) {
      const formData = new FormData();
      formData.append('property', requestData.property || '');
      formData.append('issue', requestData.issue || '');
      formData.append('priority', requestData.priority || 'normal');
      formData.append('status', requestData.status || 'Pending');
      formData.append('estimatedCost', String(cost));
      if (requestData.assigned) formData.append('assigned', requestData.assigned);
      requestData.photos.forEach((file) => {
        if (file) formData.append('photos', file);
      });
      return apiRequest(buildApiUrl('/api/technician/maintenance-requests'), {
        method: 'POST',
        body: formData,
      });
    }
    return apiRequest(buildApiUrl('/api/technician/maintenance-requests'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...requestData, estimatedCost: cost }),
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

  // Properties
  getProperties: async () => {
    return apiRequest(buildApiUrl('/api/technician/properties'), {
      method: 'GET',
    });
  },

  // Tenants
  getTenants: async () => {
    return apiRequest(buildApiUrl('/api/technician/tenants'), {
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
    const hours = Number(taskData?.estimatedHours) || 0;
    const cost = Number(taskData?.estimatedCost) || 0;
    if (taskData && Array.isArray(taskData.photos) && taskData.photos.length > 0) {
      const formData = new FormData();
      formData.append('property', taskData.property || '');
      formData.append('issue', taskData.issue || '');
      formData.append('priority', taskData.priority || 'normal');
      formData.append('estimatedHours', String(hours));
      formData.append('estimatedCost', String(cost));
      if (taskData.assigned) formData.append('assigned', taskData.assigned);
      taskData.photos.forEach((file) => {
        if (file) formData.append('photos', file);
      });
      return apiRequest(buildApiUrl('/api/technician/tasks'), {
        method: 'POST',
        body: formData,
      });
    }
    return apiRequest(buildApiUrl('/api/technician/tasks'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...taskData, estimatedHours: hours, estimatedCost: cost }),
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
    const url = buildApiUrl('/api/technician/technician-contacts');
    const formData = new FormData();
    formData.append('name', contactData.name || '');
    formData.append('category', contactData.category || '');
    formData.append('phone', contactData.phone || '');
    if (contactData.email) formData.append('email', contactData.email);
    if (contactData.address) formData.append('address', contactData.address);
    if (contactData.description) formData.append('description', contactData.description);
    if (contactData.photo) formData.append('photo', contactData.photo);
    if (contactData.idCard) formData.append('idCard', contactData.idCard);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...buildAuthHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed (${response.status})`);
    }

    return await response.json();
  },

  updateTechnicianContact: async (id, contactData) => {
    const url = buildApiUrl(`/api/technician/technician-contacts/${id}`);
    const formData = new FormData();
    if (contactData.name) formData.append('name', contactData.name);
    if (contactData.category) formData.append('category', contactData.category);
    if (contactData.phone) formData.append('phone', contactData.phone);
    if (contactData.email) formData.append('email', contactData.email);
    if (contactData.address) formData.append('address', contactData.address);
    if (contactData.description) formData.append('description', contactData.description);
    if (contactData.photo) formData.append('photo', contactData.photo);
    if (contactData.idCard) formData.append('idCard', contactData.idCard);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...buildAuthHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed (${response.status})`);
    }

    return await response.json();
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
