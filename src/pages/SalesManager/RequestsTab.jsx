import React from 'react';
import { Inbox } from 'lucide-react';

/* ── shared inline styles ── */
const card = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #f1f5f9' };
const tdStyle = { padding: '14px 16px', fontSize: '0.88rem', color: '#334155', borderBottom: '1px solid #f8fafc' };
const statusPill = (s) => {
  const sl = (s || '').toLowerCase();
  const m = { pending: { bg: '#fef3c7', c: '#92400e' }, approved: { bg: '#dcfce7', c: '#166534' }, rejected: { bg: '#fee2e2', c: '#991b1b' }, scheduled: { bg: '#dbeafe', c: '#1d4ed8' } };
  const { bg, c } = m[sl] || { bg: '#f1f5f9', c: '#475569' };
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: bg, color: c };
};
const selectStyle = { padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', background: '#fff', cursor: 'pointer', outline: 'none' };
const actionBtn = (variant) => {
  const base = { padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s' };
  if (variant === 'approve') return { ...base, background: '#dcfce7', color: '#166534' };
  if (variant === 'followup') return { ...base, background: '#dbeafe', color: '#1d4ed8' };
  return { ...base, background: '#f1f5f9', color: '#475569' };
};
const emptyState = { textAlign: 'center', padding: '48px 24px', color: '#94a3b8', fontSize: '0.95rem' };
const cellMain = { display: 'flex', flexDirection: 'column', gap: '2px' };
const cellTitle = { fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' };
const cellSub = { fontSize: '0.78rem', color: '#94a3b8' };
const badge = { display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700, background: '#dbeafe', color: '#1d4ed8', marginLeft: '6px' };

const RequestsTab = ({
  loading,
  requests,
  requestStatusFilter,
  setRequestStatusFilter,
  handleApproveRequest,
  openFollowUp,
}) => {
  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>Visit Requests</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Manage incoming requests from prospective tenants</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <select style={selectStyle} value={requestStatusFilter} onChange={(e) => setRequestStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Scheduled">Scheduled</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div style={emptyState}>Loading requests...</div>
      ) : requests.length === 0 ? (
        <div style={emptyState}>
          <Inbox size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
          <div>No requests received</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Property</th>
                <th style={thStyle}>Requested</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request, index) => {
                const requestId = request.ID || request.id || `request-${index}`;
                const clientName = request.ClientName || request.clientName || 'Client';
                const clientEmail = request.ClientEmail || request.clientEmail || '';
                const clientPhone = request.ClientPhone || request.clientPhone || '';
                const property = request.Property || request.property || 'Property';
                const status = request.Status || request.status || 'Pending';
                const createdAt = request.CreatedAt || request.createdAt;
                const preferredDate = request.PreferredDate || request.preferredDate;
                const followUpCount = request.followUpCount || request.FollowUpCount || 0;
                return (
                  <tr key={requestId} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}>
                      <div style={cellMain}>
                        <span style={cellTitle}>{clientName}</span>
                        <span style={cellSub}>{clientEmail || clientPhone || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={cellMain}>
                        <span style={cellTitle}>{property}</span>
                        <span style={cellSub}>{request.City || request.city || request.District || request.district || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={cellMain}>
                        <span style={cellTitle}>{createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</span>
                        <span style={cellSub}>{preferredDate ? `Preferred: ${new Date(preferredDate).toLocaleDateString()}` : ''}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={statusPill(status)}>{status}</span>
                      {followUpCount > 0 && (
                        <span style={{ ...cellSub, display: 'block', marginTop: '4px' }}>
                          {followUpCount} follow-up{followUpCount > 1 ? 's' : ''}
                          <span style={badge}>{followUpCount}</span>
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {status === 'Pending' && (
                          <>
                            <button style={actionBtn('approve')} onClick={() => handleApproveRequest(requestId)}>Approve</button>
                            <button style={actionBtn('followup')} onClick={() => openFollowUp(request)}>Follow-up</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RequestsTab;
