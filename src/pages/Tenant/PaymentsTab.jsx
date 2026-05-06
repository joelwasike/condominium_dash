import React from 'react';
import { Plus, FileX, UserPlus, Zap, Download } from 'lucide-react';
import { isDemoMode } from '../../utils/demoData';

const card = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #f1f5f9' };
const tdStyle = { padding: '14px 16px', fontSize: '0.88rem', color: '#334155', borderBottom: '1px solid #f8fafc' };
const statusPill = (s) => {
  const sl = (s || '').toLowerCase();
  const m = { pending: { bg: '#fef3c7', c: '#92400e' }, approved: { bg: '#dcfce7', c: '#166534' }, completed: { bg: '#dcfce7', c: '#166534' }, rejected: { bg: '#fee2e2', c: '#991b1b' }, 'in progress': { bg: '#dbeafe', c: '#1d4ed8' }, inprogress: { bg: '#dbeafe', c: '#1d4ed8' }, low: { bg: '#dbeafe', c: '#1d4ed8' }, medium: { bg: '#fef3c7', c: '#92400e' }, high: { bg: '#fee2e2', c: '#991b1b' }, urgent: { bg: '#fee2e2', c: '#991b1b' }, critical: { bg: '#fce7f3', c: '#9d174d' }, processing: { bg: '#e0e7ff', c: '#3730a3' }, successful: { bg: '#dcfce7', c: '#166534' }, failed: { bg: '#fee2e2', c: '#991b1b' } };
  const { bg, c } = m[sl] || { bg: '#f1f5f9', c: '#475569' };
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: bg, color: c };
};
const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' };
const emptyState = { padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' };

const PaymentsTab = ({
  loading, payments, transferRequests, paymentsTab, setPaymentsTab,
  setShowPaymentModal, setShowBillsModal, setShowTerminateLeaseModal,
  setShowTransferPaymentModal, leaseInfo, setLeaseInfo, overviewData,
  tenantService, downloadReceipt
}) => (
  <div style={card}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Payment Management</h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Make payments, view payment history, and transfer payment requests</p>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={{ ...btnPrimary }} onClick={() => setShowPaymentModal(true)} disabled={loading}>
          <Plus size={18} />
          Make Payment
        </button>
        <button style={{ ...btnPrimary, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }} onClick={() => setShowBillsModal(true)} disabled={loading}>
          <Zap size={18} />
          Pay Bills
        </button>
        <button
          style={{ ...btnPrimary, background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}
          onClick={() => setShowTerminateLeaseModal(true)}
          disabled={loading}
        >
          <FileX size={18} />
          Terminate My Lease
        </button>
        <button
          style={{ ...btnPrimary, background: 'linear-gradient(135deg,#10b981,#059669)' }}
          onClick={async () => {
            if (!leaseInfo && !isDemoMode()) {
              try {
                const lease = await tenantService.getLeaseInfo();
                setLeaseInfo(lease);
              } catch (error) {
                console.error('Error loading lease info:', error);
              }
            }
            setShowTransferPaymentModal(true);
          }}
          disabled={loading}
        >
          <UserPlus size={18} />
          Transfer Payment Request
        </button>
      </div>
    </div>

    <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
      <button
        type="button"
        onClick={() => setPaymentsTab('payments')}
        style={{
          padding: '12px 24px', border: 'none', background: 'transparent',
          color: paymentsTab === 'payments' ? '#7c3aed' : '#6b7280',
          borderBottom: paymentsTab === 'payments' ? '2px solid #7c3aed' : '2px solid transparent',
          cursor: 'pointer', fontWeight: paymentsTab === 'payments' ? '600' : '400', marginBottom: '-2px',
          fontSize: '0.9rem'
        }}
      >
        Payment history
      </button>
      <button
        type="button"
        onClick={() => setPaymentsTab('transfers')}
        style={{
          padding: '12px 24px', border: 'none', background: 'transparent',
          color: paymentsTab === 'transfers' ? '#7c3aed' : '#6b7280',
          borderBottom: paymentsTab === 'transfers' ? '2px solid #7c3aed' : '2px solid transparent',
          cursor: 'pointer', fontWeight: paymentsTab === 'transfers' ? '600' : '400', marginBottom: '-2px',
          fontSize: '0.9rem'
        }}
      >
        Transfer payment requests
      </button>
    </div>

    {paymentsTab === 'payments' && (
      <>
        {loading ? (
          <div style={emptyState}>Loading payments...</div>
        ) : payments.length === 0 ? (
          <div style={emptyState}>No payments found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>No</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Method</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, width: '120px' }}></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => {
                  const paymentId = payment.ID || payment.id;
                  const paymentDate = payment.Date || payment.date || payment.createdAt || payment.CreatedAt;
                  const chargeType = payment.ChargeType || payment.chargeType || 'Rent';
                  const amount = payment.Amount || payment.amount || 0;
                  const method = payment.Method || payment.method || 'N/A';
                  const status = payment.Status || payment.status || 'Pending';
                  const statusLower = String(status || '').toLowerCase();
                  const canDownloadReceipt = statusLower === 'approved' || statusLower === 'completed' || statusLower === 'paid';
                  return (
                    <tr key={paymentId || `payment-${index}`}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                    >
                      <td style={tdStyle}>{index + 1}</td>
                      <td style={tdStyle}>{paymentDate ? new Date(paymentDate).toLocaleDateString() : 'N/A'}</td>
                      <td style={tdStyle}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#1e293b', display: 'block' }}>{chargeType}</span>
                          {payment.reference && (<span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ref: {payment.reference}</span>)}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{typeof amount === 'number' ? amount.toLocaleString() : amount} XOF</td>
                      <td style={tdStyle}>{method}</td>
                      <td style={tdStyle}><span style={statusPill(status)}>{status}</span></td>
                      <td style={{ ...tdStyle, width: '120px' }}>
                        <button
                          onClick={() => {
                            if (!canDownloadReceipt) return;
                            downloadReceipt(paymentId);
                          }}
                          disabled={!canDownloadReceipt}
                          title="Download Receipt"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            background: canDownloadReceipt ? '#fff' : '#f8fafc',
                            color: canDownloadReceipt ? '#3b82f6' : '#94a3b8',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: canDownloadReceipt ? 'pointer' : 'not-allowed',
                            opacity: canDownloadReceipt ? 1 : 0.8
                          }}
                          onMouseEnter={e => {
                            if (!canDownloadReceipt) return;
                            e.currentTarget.style.background = '#eff6ff';
                          }}
                          onMouseLeave={e => {
                            if (!canDownloadReceipt) return;
                            e.currentTarget.style.background = '#fff';
                          }}
                        >
                          <Download size={14} /> Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
    )}

    {paymentsTab === 'transfers' && (
      <>
        {loading ? (
          <div style={emptyState}>Loading transfer requests...</div>
        ) : transferRequests.length === 0 ? (
          <div style={emptyState}>No transfer requests yet. Use &quot;Transfer Payment Request&quot; to submit one.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>No</th>
                  <th style={thStyle}>Property</th>
                  <th style={thStyle}>New client (recipient)</th>
                  <th style={thStyle}>Request date</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transferRequests.map((tr, index) => {
                  const requestDate = tr.requestDate || tr.createdAt || tr.CreatedAt;
                  const newClient = tr.newClient || tr.recipientName || tr.RecipientName || 'N/A';
                  const status = tr.status || tr.Status || 'Pending';
                  return (
                    <tr key={tr.id || tr.ID || `transfer-${index}`}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                    >
                      <td style={tdStyle}>{index + 1}</td>
                      <td style={tdStyle}>{tr.property || tr.Property || 'N/A'}</td>
                      <td style={tdStyle}>{newClient}</td>
                      <td style={tdStyle}>{requestDate ? new Date(requestDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'N/A'}</td>
                      <td style={tdStyle}><span style={statusPill(status)}>{status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
    )}
  </div>
);

export default PaymentsTab;
