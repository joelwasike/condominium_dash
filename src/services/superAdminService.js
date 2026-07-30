import { API_CONFIG } from '../config/api';

const SUPERADMIN_BASE_URL = `${API_CONFIG.BASE_URL}/api/superadmin`;

const parseJson = async (response) => {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    const json = JSON.parse(text);
    if (json && Array.isArray(json.data) && typeof json.total === 'number' && typeof json.page === 'number') {
      return json.data;
    }
    return json;
  } catch {return null;}
};

const getAuthHeaders = (includeContentType = true) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (includeContentType) headers['Content-Type'] = 'application/json';
  if (token) {
    const sanitized = String(token).trim().split('').filter((c) => {const code = c.charCodeAt(0);return code >= 32 && code <= 126;}).join('');
    if (sanitized) headers['Authorization'] = sanitized;
  }
  return headers;
};

const apiGet = async (path) => {
  const response = await fetch(`${SUPERADMIN_BASE_URL}${path}`, { headers: getAuthHeaders(false) });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return parseJson(response);
};

const apiPost = async (path, body) => {
  const response = await fetch(`${SUPERADMIN_BASE_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return parseJson(response);
};

const apiPut = async (path, body) => {
  const response = await fetch(`${SUPERADMIN_BASE_URL}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return parseJson(response);
};

const apiDelete = async (path) => {
  const response = await fetch(`${SUPERADMIN_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(false)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return parseJson(response);
};

export const superAdminService = {
  getOverview: () => apiGet('/agency-stats'),
  getCompanies: () => apiGet('/companies'),
  getCompanyDetails: (id) => apiGet(`/companies/${id}/details`),
  addCompany: (data) => apiPost('/companies', data),
  updateCompany: (id, data) => apiPut(`/companies/${id}`, data),
  deleteCompany: (id) => apiDelete(`/companies/${id}`),
  deactivateCompany: (id, reason) => apiPost(`/companies/${id}/deactivate`, { reason }),
  reactivateCompany: (id) => apiPost(`/companies/${id}/reactivate`, {}),
  getAgencyAdmins: () => apiGet('/agency-directors'),
  getAgencyAdminsList: () => apiGet('/agency-admins'),
  addAgencyAdmin: (data) => apiPost('/users', data),
  updateAgencyAdmin: (id, data) => apiPut(`/users/${id}`, data),
  deleteAgencyAdmin: (id) => apiDelete(`/users/${id}`),
  getUsers: () => apiGet('/users'),
  addUser: (data) => apiPost('/users', data),
  updateUser: (id, data) => apiPut(`/users/${id}`, data),
  deleteUser: (id) => apiDelete(`/users/${id}`),
  getFinancialOverview: () => apiGet('/financial'),
  getAdvertisements: () => apiGet('/advertisements'),
  createAdvertisement: async (adData) => {
    const formData = new FormData();
    formData.append('title', adData.title);
    formData.append('text', adData.text);
    if (adData.link) {
      formData.append('link', adData.link);
    }
    if (adData.image instanceof File) {
      formData.append('image', adData.image);
    } else {
      throw new Error('Image file is required.');
    }
    const headers = getAuthHeaders(false);
    const response = await fetch(`${SUPERADMIN_BASE_URL}/advertisements`, {
      method: 'POST',
      headers,
      body: formData
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `Failed to create advertisement: ${response.status}`);
    }
    return parseJson(response);
  },
  getChatWithAdmin: (adminId) => apiGet(`/chat/${adminId}/messages`),
  sendChatMessage: (payload) => apiPost('/chat/messages', payload),
  getSubscriptions: () => apiGet('/subscriptions'),
  getAgencyPayments: () => apiGet('/agency-payments'),
  addAgencyPayment: (data) => apiPost('/agency-payments', data)
};
