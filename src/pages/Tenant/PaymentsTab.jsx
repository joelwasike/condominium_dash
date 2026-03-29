import React from 'react';
import { Plus, FileX, UserPlus, Zap, Download } from 'lucide-react';
import { isDemoMode } from '../../utils/demoData';

const PaymentsTab = ({
  loading, payments, transferRequests, paymentsTab, setPaymentsTab,
  setShowPaymentModal, setShowBillsModal, setShowTerminateLeaseModal,
  setShowTransferPaymentModal, leaseInfo, setLeaseInfo, overviewData,
  tenantService, downloadReceipt
}) => (
  <div className="sa-section-card">
    <div className="sa-section-header">
      <div>
        <h2>Payment Management</h2>
        <p>Make payments, view payment history, and transfer payment requests</p>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="sa-primary-cta" onClick={() => setShowPaymentModal(true)} disabled={loading}>
          <Plus size={18} />
          Make Payment
        </button>
        <button className="sa-primary-cta" onClick={() => setShowBillsModal(true)} disabled={loading} style={{ backgroundColor: '#0ea5e9' }}>
          <Zap size={18} />
          Pay Bills
        </button>
        <button
          className="sa-primary-cta"
          onClick={() => setShowTerminateLeaseModal(true)}
          disabled={loading}
          style={{ backgroundColor: '#ef4444' }}
        >
          <FileX size={18} />
          Terminate My Lease
        </button>
        <button
          className="sa-primary-cta"
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
          style={{ backgroundColor: '#3b82f6' }}
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
          cursor: 'pointer', fontWeight: paymentsTab === 'payments' ? '600' : '400', marginBottom: '-2px'
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
          cursor: 'pointer', fontWeight: paymentsTab === 'transfers' ? '600' : '400', marginBottom: '-2px'
        }}
      >
        Transfer payment requests
      </button>
    </div>

    {paymentsTab === 'payments' && (
      <>
        {loading ? (
          <div className="sa-table-empty">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="sa-table-empty">No payments found</div>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th><th>Date</th><th>Description</th><th>Amount</th><th>Method</th><th>Status</th><th className="table-menu"></th>
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
                  return (
                    <tr key={paymentId || `payment-${index}`}>
                      <td>{index + 1}</td>
                      <td>{paymentDate ? new Date(paymentDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{chargeType}</span>
                          {payment.reference && (<span className="sa-cell-sub">Ref: {payment.reference}</span>)}
                        </div>
                      </td>
                      <td>{typeof amount === 'number' ? amount.toLocaleString() : amount} XOF</td>
                      <td>{method}</td>
                      <td><span className={`sa-status-pill ${status.toLowerCase().replace(' ', '-')}`}>{status}</span></td>
                      <td className="table-menu">
                        <div className="table-actions">
                          <button className="table-action-button view" onClick={() => downloadReceipt(paymentId)} title="Download Receipt">
                            <Download size={14} /> Download
                          </button>
                        </div>
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
          <div className="sa-table-empty">Loading transfer requests...</div>
        ) : transferRequests.length === 0 ? (
          <div className="sa-table-empty">No transfer requests yet. Use &quot;Transfer Payment Request&quot; to submit one.</div>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr><th>No</th><th>Property</th><th>New client (recipient)</th><th>Request date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {transferRequests.map((tr, index) => {
                  const requestDate = tr.requestDate || tr.createdAt || tr.CreatedAt;
                  const newClient = tr.newClient || tr.recipientName || tr.RecipientName || 'N/A';
                  const status = tr.status || tr.Status || 'Pending';
                  return (
                    <tr key={tr.id || tr.ID || `transfer-${index}`}>
                      <td>{index + 1}</td>
                      <td>{tr.property || tr.Property || 'N/A'}</td>
                      <td>{newClient}</td>
                      <td>{requestDate ? new Date(requestDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'N/A'}</td>
                      <td><span className={`sa-status-pill ${status.toLowerCase().replace(' ', '-')}`}>{status}</span></td>
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
