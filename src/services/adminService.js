import { API_CONFIG } from '../config/api';

const ADMIN_BASE_URL = `${API_CONFIG.BASE_URL}/api/admin`;

export const adminService = {
  // Inbox
  getInbox: async () => {
    const response = await fetch(`${ADMIN_BASE_URL}/inbox`);
    if (!response.ok) throw new Error('Failed to fetch inbox');
    return response.json();
  },

  forwardInbox: async (id) => {
    const response = await fetch(`${ADMIN_BASE_URL}/inbox/${id}/forward`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to forward inbox item');
    return response.json();
  },

  // Documents
  getDocuments: async () => {
    const response = await fetch(`${ADMIN_BASE_URL}/documents`);
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  },

  approveDocument: async (id) => {
    const response = await fetch(`${ADMIN_BASE_URL}/documents/${id}/approve`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to approve document');
    return response.json();
  },

  rejectDocument: async (id) => {
    const response = await fetch(`${ADMIN_BASE_URL}/documents/${id}/reject`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to reject document');
    return response.json();
  },

  sendToUtility: async (id) => {
    const response = await fetch(`${ADMIN_BASE_URL}/documents/${id}/utility`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to send to utility');
    return response.json();
  },

  // Utilities
  getUtilities: async () => {
    const response = await fetch(`${ADMIN_BASE_URL}/utilities`);
    if (!response.ok) throw new Error('Failed to fetch utilities');
    return response.json();
  },

  transferUtility: async (id) => {
    const response = await fetch(`${ADMIN_BASE_URL}/utilities/${id}/transfer`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to transfer utility');
    return response.json();
  },

  // Debts
  getDebts: async () => {
    const response = await fetch(`${ADMIN_BASE_URL}/debts`);
    if (!response.ok) throw new Error('Failed to fetch debts');
    return response.json();
  },

  remindDebt: async (id) => {
    const response = await fetch(`${ADMIN_BASE_URL}/debts/${id}/remind`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to remind debt');
    return response.json();
  },

  markDebtPaid: async (id) => {
    const response = await fetch(`${ADMIN_BASE_URL}/debts/${id}/paid`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to mark debt as paid');
    return response.json();
  },

  // Reminders
  getReminders: async () => {
    const response = await fetch(`${ADMIN_BASE_URL}/reminders`);
    if (!response.ok) throw new Error('Failed to fetch reminders');
    return response.json();
  },

  createReminder: async (reminderData) => {
    const response = await fetch(`${ADMIN_BASE_URL}/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reminderData)
    });
    if (!response.ok) throw new Error('Failed to create reminder');
    return response.json();
  },

  deleteReminder: async (id) => {
    const response = await fetch(`${ADMIN_BASE_URL}/reminders/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete reminder');
    return response.json();
  },

  // Leases
  getLeases: async () => {
    const response = await fetch(`${ADMIN_BASE_URL}/leases`);
    if (!response.ok) throw new Error('Failed to fetch leases');
    return response.json();
  },

  createLease: async (leaseData) => {
    const response = await fetch(`${ADMIN_BASE_URL}/leases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leaseData)
    });
    if (!response.ok) throw new Error('Failed to create lease');
    return response.json();
  },
};
