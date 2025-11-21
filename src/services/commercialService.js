import { buildApiUrl, apiRequest } from '../config/api';

export const commercialService = {
  // Overview
  getOverview: async () => {
    const url = buildApiUrl('/api/commercial/overview');
    return await apiRequest(url);
  },

  // Listings
  listListings: async (filters = {}) => {
    let url = buildApiUrl('/api/commercial/listings');
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  createListing: async (listingData) => {
    const url = buildApiUrl('/api/commercial/listings');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  },

  updateListing: async (id, listingData) => {
    const url = buildApiUrl(`/api/commercial/listings/${id}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(listingData),
    });
  },

  // Visits
  listVisits: async (filters = {}) => {
    let url = buildApiUrl('/api/commercial/visits');
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.property) queryParams.append('property', filters.property);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  scheduleVisit: async (visitData) => {
    const url = buildApiUrl('/api/commercial/visits');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(visitData),
    });
  },

  updateVisitStatus: async (id, status, notes) => {
    const url = buildApiUrl(`/api/commercial/visits/${id}/status`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  },

  // Interested Clients History
  getInterestedClientsHistory: async () => {
    const url = buildApiUrl('/api/commercial/clients/history');
    return await apiRequest(url);
  },

  // Visit Requests
  listRequests: async (filters = {}) => {
    let url = buildApiUrl('/api/commercial/requests');
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    return await apiRequest(url);
  },

  createVisitRequest: async (requestData) => {
    const url = buildApiUrl('/api/commercial/requests');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  updateVisitRequest: async (id, status) => {
    const url = buildApiUrl(`/api/commercial/requests/${id}`);
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  followUpVisitRequest: async (id, message) => {
    const url = buildApiUrl(`/api/commercial/requests/${id}/follow-up`);
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};
