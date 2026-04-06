import React from 'react';
import { Plus, Calendar } from 'lucide-react';

/* ── shared inline styles ── */
const card = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #f1f5f9' };
const tdStyle = { padding: '14px 16px', fontSize: '0.88rem', color: '#334155', borderBottom: '1px solid #f8fafc' };
const statusPill = (s) => {
  const sl = (s || '').toLowerCase().replace('-', '');
  const m = { scheduled: { bg: '#dbeafe', c: '#1d4ed8' }, completed: { bg: '#dcfce7', c: '#166534' }, cancelled: { bg: '#fee2e2', c: '#991b1b' }, pending: { bg: '#fef3c7', c: '#92400e' }, noshow: { bg: '#f3e8ff', c: '#7c3aed' } };
  const { bg, c } = m[sl] || { bg: '#f1f5f9', c: '#475569' };
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: bg, color: c };
};
const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' };
const filterBtn = (active) => ({ padding: '8px 16px', borderRadius: '10px', border: active ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: active ? '#eff6ff' : '#fff', color: active ? '#2563eb' : '#64748b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s' });
const selectStyle = { padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', background: '#fff', cursor: 'pointer', outline: 'none' };
const actionBtn = (variant) => {
  const base = { padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s' };
  if (variant === 'edit') return { ...base, background: '#dbeafe', color: '#1d4ed8' };
  return { ...base, background: '#f1f5f9', color: '#475569' };
};
const emptyState = { textAlign: 'center', padding: '48px 24px', color: '#94a3b8', fontSize: '0.95rem' };
const cellMain = { display: 'flex', flexDirection: 'column', gap: '2px' };
const cellTitle = { fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' };
const cellSub = { fontSize: '0.78rem', color: '#94a3b8' };
const rowHover = { transition: 'background 0.15s' };

const VisitsTab = ({
  loading,
  visits,
  visitTab,
  setVisitTab,
  visitStatusFilter,
  setVisitStatusFilter,
  openScheduleVisit,
  openUpdateVisitStatus,
}) => {
  const visitsToDisplay = visitTab === 'upcoming' ? visits.upcoming : visitTab === 'done' ? visits.done : visits.all;
  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>Visit Management</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Schedule and track property viewings</p>
        </div>
        <button style={btnPrimary} onClick={() => openScheduleVisit()}>
          <Plus size={18} />
          Schedule Visit
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={filterBtn(visitTab === 'all')} onClick={() => setVisitTab('all')}>All ({visits.all.length})</button>
          <button style={filterBtn(visitTab === 'upcoming')} onClick={() => setVisitTab('upcoming')}>Upcoming ({visits.upcoming.length})</button>
          <button style={filterBtn(visitTab === 'done')} onClick={() => setVisitTab('done')}>Done ({visits.done.length})</button>
        </div>
        <select style={selectStyle} value={visitStatusFilter} onChange={(e) => setVisitStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="No-show">No-show</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div style={emptyState}>Loading visits...</div>
      ) : visitsToDisplay.length === 0 ? (
        <div style={emptyState}>
          <Calendar size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
          <div>No visits scheduled</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Property</th>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Scheduled</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {visitsToDisplay.map((visit, index) => {
                const visitId = visit.ID || visit.id || `visit-${index}`;
                const property = visit.Property || visit.property || visit.Address || visit.address || 'Property';
                const client = visit.Client || visit.client || visit.ClientName || visit.clientName || 'Client';
                const clientEmail = visit.ClientEmail || visit.clientEmail || '';
                const clientPhone = visit.ClientPhone || visit.clientPhone || '';
                const visitDate = visit.VisitDate || visit.visitDate || visit.Date || visit.date || visit.ScheduledAt || visit.scheduledAt;
                const visitTime = visit.VisitTime || visit.visitTime || visit.Time || visit.time;
                const status = visit.Status || visit.status || 'Scheduled';
                const formattedDate = visitDate ? new Date(visitDate).toLocaleDateString() : 'N/A';
                const formattedTime = visitTime ? visitTime : (visitDate ? new Date(visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A');
                return (
                  <tr key={visitId} style={rowHover} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}>
                      <div style={cellMain}>
                        <span style={cellTitle}>{property}</span>
                        <span style={cellSub}>{visit.Agent || visit.agent || 'Pending assignment'}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={cellMain}>
                        <span style={cellTitle}>{client}</span>
                        <span style={cellSub}>{clientEmail || clientPhone || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={cellMain}>
                        <span style={cellTitle}>{formattedDate}</span>
                        <span style={cellSub}>{formattedTime}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={statusPill(status)}>{status}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {status === 'Scheduled' && (
                          <button style={actionBtn('edit')} onClick={() => openUpdateVisitStatus(visit)}>Update Status</button>
                        )}
                        <button style={actionBtn('view')} onClick={() => openScheduleVisit(property)}>Reschedule</button>
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

export default VisitsTab;
