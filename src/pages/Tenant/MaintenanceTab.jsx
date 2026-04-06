import React from 'react';
import { Plus } from 'lucide-react';

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

const MaintenanceTab = ({
  loading, maintenanceRequests, setShowMaintenanceModal,
  setSelectedMaintenanceRequest, setShowMaintenanceViewModal
}) => (
  <div style={card}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Maintenance Requests</h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Submit new requests or check the status of existing ones</p>
      </div>
      <button style={btnPrimary} onClick={() => setShowMaintenanceModal(true)} disabled={loading}>
        <Plus size={18} />
        Submit New Request
      </button>
    </div>

    {loading ? (
      <div style={emptyState}>Loading maintenance requests...</div>
    ) : maintenanceRequests.length === 0 ? (
      <div style={emptyState}>No maintenance requests found</div>
    ) : (
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>No</th>
              <th style={thStyle}>Issue</th>
              <th style={thStyle}>Priority</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, width: '100px' }}></th>
            </tr>
          </thead>
          <tbody>
            {maintenanceRequests.map((request, index) => {
              const priority = request.Priority || request.priority || 'Medium';
              const status = request.Status || request.status || 'Pending';
              return (
                <tr key={request.ID || request.id || `request-${index}`}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}>
                    <div>
                      <span style={{ fontWeight: 600, color: '#1e293b', display: 'block' }}>{request.Issue || request.Title || request.title || 'Maintenance Request'}</span>
                      {request.Description && (<span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{request.Description || request.description}</span>)}
                    </div>
                  </td>
                  <td style={tdStyle}><span style={statusPill(priority)}>{priority}</span></td>
                  <td style={tdStyle}>{new Date(request.Date || request.date || request.CreatedAt || request.createdAt).toLocaleDateString()}</td>
                  <td style={tdStyle}><span style={statusPill(status)}>{status}</span></td>
                  <td style={{ ...tdStyle, width: '100px' }}>
                    <button
                      onClick={() => { setSelectedMaintenanceRequest(request); setShowMaintenanceViewModal(true); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                    >
                      View
                    </button>
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

export default MaintenanceTab;
