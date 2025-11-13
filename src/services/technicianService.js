import { API_CONFIG } from '../config/api';

const TECHNICIAN_BASE_URL = `${API_CONFIG.BASE_URL}/technician`;

export const technicianService = {
  // Overview APIs
  getOverview: async () => {
    const response = await fetch(`${TECHNICIAN_BASE_URL}/overview`);
    if (!response.ok) throw new Error('Failed to fetch overview');
    return response.json();
  },

  // Inspection APIs
  listInspections: async () => {
    const response = await fetch(`${TECHNICIAN_BASE_URL}/inspections`);
    if (!response.ok) throw new Error('Failed to fetch inspections');
    return response.json();
  },

  createInspection: async (inspectionData) => {
    const response = await fetch(`${TECHNICIAN_BASE_URL}/inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inspectionData)
    });
    if (!response.ok) throw new Error('Failed to create inspection');
    return response.json();
  },

  // Inventory APIs
  listInventories: async () => {
    const response = await fetch(`${TECHNICIAN_BASE_URL}/inventories`);
    if (!response.ok) throw new Error('Failed to fetch inventories');
    return response.json();
  },

  createInventory: async (inventoryData) => {
    const response = await fetch(`${TECHNICIAN_BASE_URL}/inventories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventoryData)
    });
    if (!response.ok) throw new Error('Failed to create inventory');
    return response.json();
  },

  // Maintenance APIs (from tenant requests)
  listMaintenanceRequests: async () => {
    const response = await fetch(`${TECHNICIAN_BASE_URL}/maintenance-requests`);
    if (!response.ok) throw new Error('Failed to fetch maintenance requests');
    return response.json();
  },

  updateMaintenanceRequest: async (id, updateData) => {
    const response = await fetch(`${TECHNICIAN_BASE_URL}/maintenance-requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Failed to update maintenance request');
    return response.json();
  },

  // Quote APIs
  listQuotes: async () => {
    const response = await fetch(`${TECHNICIAN_BASE_URL}/quotes`);
    if (!response.ok) throw new Error('Failed to fetch quotes');
    return response.json();
  },

  submitQuote: async (quoteData) => {
    const response = await fetch(`${TECHNICIAN_BASE_URL}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteData)
    });
    if (!response.ok) throw new Error('Failed to submit quote');
    return response.json();
  },

  // Progress APIs
  getWorkProgress: async () => {
    const response = await fetch(`${TECHNICIAN_BASE_URL}/progress`);
    if (!response.ok) throw new Error('Failed to fetch work progress');
    return response.json();
  },

  // Task APIs
  listTasks: async () => {
    const response = await fetch(`${TECHNICIAN_BASE_URL}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  createTask: async (taskData) => {
    const response = await fetch(`${TECHNICIAN_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  updateTask: async (id, updateData) => {
    const response = await fetch(`${TECHNICIAN_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  }
};
