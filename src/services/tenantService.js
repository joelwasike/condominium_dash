import { buildApiUrl, apiRequest } from '../config/api';

const buildAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) return {};
  const tokenStr = String(token).trim();
  const sanitizedToken = tokenStr.
  split('').
  map((char) => {
    const code = char.charCodeAt(0);
    return code >= 32 && code <= 126 ? char : '';
  }).
  join('');
  return sanitizedToken ? { Authorization: sanitizedToken } : {};
};
export const tenantService = {
  recordPayment: async (paymentData) => {
    const url = buildApiUrl('/api/tenant/payments');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  },
  payViaMoMo: async ({ provider, phone, amount, property, chargeType, otp }) => {
    const url = buildApiUrl('/api/payments/rent');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        provider,
        phone,
        amount: Math.round(amount),
        property,
        chargeType: chargeType || 'Rent',
        otp: otp || ''
      })
    });
  },
  consultUtilityBills: async ({ billType, refContrat }) => {
    const url = buildApiUrl('/api/tenant/bills/consultation');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        billType,
        refContrat
      })
    });
  },

  payUtilityBill: async ({ billType, provider, phone, otp, amount, refContrat, numFacture }) => {
    const url = buildApiUrl('/api/tenant/bills/payment');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        billType,
        provider,
        phone,
        otp: otp || '',
        amount,
        refContrat,
        numFacture: numFacture || ''
      })
    });
  },
  checkMoMoStatus: async (transactionId) => {
    const url = buildApiUrl('/api/payments/status');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ transaction_id: transactionId })
    });
  },


  listPayments: async () => {
    const url = buildApiUrl('/api/tenant/payments');
    return await apiRequest(url);
  },

  approvePayment: async (paymentId) => {
    const url = buildApiUrl(`/api/tenant/payments/${paymentId}/approve`);
    return await apiRequest(url, {
      method: 'POST'
    });
  },

  rejectPayment: async (paymentId) => {
    const url = buildApiUrl(`/api/tenant/payments/${paymentId}/reject`);
    return await apiRequest(url, {
      method: 'POST'
    });
  },

  generateReceipt: async (paymentId) => {
    const url = buildApiUrl(`/api/tenant/payments/${paymentId}/receipt`);
    return await apiRequest(url, {
      method: 'POST'
    });
  },
  createMaintenance: async (maintenanceData) => {
    const url = buildApiUrl('/api/tenant/maintenance');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(maintenanceData)
    });
  },

  listMaintenance: async () => {
    const url = buildApiUrl('/api/tenant/maintenance');
    return await apiRequest(url);
  },
  getOverview: async () => {
    const url = buildApiUrl('/api/tenant/overview');
    return await apiRequest(url);
  },

  getLeaseInfo: async () => {
    const url = buildApiUrl('/api/tenant/lease');
    return await apiRequest(url);
  },
  getAdvertisements: async () => {
    const url = buildApiUrl('/api/tenant/advertisements');
    return await apiRequest(url);
  },
  terminateLease: async (terminationData) => {
    const url = buildApiUrl('/api/tenant/lease/terminate');
    const formData = new FormData();
    formData.append('reason', terminationData.reason || '');
    formData.append('terminationDate', terminationData.terminationDate || '');
    formData.append('comments', terminationData.comments || '');
    formData.append('securityDepositRefundMethod', terminationData.securityDepositRefundMethod || '');
    if (terminationData.securityDepositRefundMethod === 'Mobile Money' && terminationData.mobileMoneyNumber) {
      formData.append('mobileMoneyNumber', terminationData.mobileMoneyNumber);
    }
    formData.append('inventoryCheckDate', terminationData.inventoryCheckDate || '');
    formData.append('inventoryCheckTime', terminationData.inventoryCheckTime || '');
    if (terminationData.terminationLetter) {
      formData.append('terminationLetter', terminationData.terminationLetter);
    }
    if (Array.isArray(terminationData.supportingDocs)) {
      terminationData.supportingDocs.forEach((file) => {
        if (file) formData.append('supportingDocs', file);
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...buildAuthHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed (${response.status})`);
    }

    return await response.json();
  },
  listTransferRequests: async () => {
    const url = buildApiUrl('/api/tenant/payments/transfers');
    return await apiRequest(url);
  },
  transferPaymentRequest: async (transferData) => {
    const url = buildApiUrl('/api/tenant/payments/transfer');
    const body = {
      property: transferData.property || '',
      recipientIDCardNumber: transferData.recipientIdCard,
      recipientEntryDate: transferData.entryDate,
      recipientName: transferData.recipientName,
      recipientEmail: transferData.recipientEmail,
      recipientPhone: transferData.recipientPhone,
      relationship: transferData.relationship,
      reason: transferData.reason
    };
    if (Array.isArray(transferData.files) && transferData.files.length > 0) {
      body.files = transferData.files;
    }
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  uploadProfilePicture: async (profilePictureURL) => {
    const url = buildApiUrl('/api/tenant/profile/picture');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        profilePictureURL: profilePictureURL
      })
    });
  },
  paySecurityDeposit: async (depositData) => {
    const url = buildApiUrl('/api/tenant/deposits/payment');
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(depositData)
    });
  },
  getSecurityDeposit: async () => {
    const url = buildApiUrl('/api/tenant/deposits');
    return await apiRequest(url);
  },
  getTechnicianContacts: async () => {
    const url = buildApiUrl('/api/tenant/technician-contacts');
    return await apiRequest(url);
  },
  getMyInventory: async () => {
    const url = buildApiUrl('/api/tenant/inventory');
    return await apiRequest(url);
  }
};
