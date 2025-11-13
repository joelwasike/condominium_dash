import { API_CONFIG } from '../config/api';

const COMMERCIAL_BASE_URL = `${API_CONFIG.BASE_URL}/api/commercial`;

export const commercialService = {
  getOverview: async () => {
    const response = await fetch(`${COMMERCIAL_BASE_URL}/overview`);
    if (!response.ok) throw new Error('Failed to fetch commercial overview');
    return response.json();
  },

  listListings: async () => {
    const response = await fetch(`${COMMERCIAL_BASE_URL}/listings`);
    if (!response.ok) throw new Error('Failed to fetch listings');
    return response.json();
  },

  createListing: async (listingData) => {
    const response = await fetch(`${COMMERCIAL_BASE_URL}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listingData)
    });
    if (!response.ok) throw new Error('Failed to create listing');
    return response.json();
  },

  updateListing: async (id, listingData) => {
    const response = await fetch(`${COMMERCIAL_BASE_URL}/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listingData)
    });
    if (!response.ok) throw new Error('Failed to update listing');
    return response.json();
  },

  listVisits: async () => {
    const response = await fetch(`${COMMERCIAL_BASE_URL}/visits`);
    if (!response.ok) throw new Error('Failed to fetch visits');
    return response.json();
  },

  scheduleVisit: async (visitData) => {
    const response = await fetch(`${COMMERCIAL_BASE_URL}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitData)
    });
    if (!response.ok) throw new Error('Failed to schedule visit');
    return response.json();
  },

  listRequests: async () => {
    const response = await fetch(`${COMMERCIAL_BASE_URL}/requests`);
    if (!response.ok) throw new Error('Failed to fetch visit requests');
    return response.json();
  },

  createVisitRequest: async (requestData) => {
    const response = await fetch(`${COMMERCIAL_BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    if (!response.ok) throw new Error('Failed to create visit request');
    return response.json();
  },

  updateVisitRequest: async (id, status) => {
    const response = await fetch(`${COMMERCIAL_BASE_URL}/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update visit request');
    return response.json();
  },
};
