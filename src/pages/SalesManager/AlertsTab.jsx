import React from 'react';
import { Filter, AlertTriangle } from 'lucide-react';

/* ── shared inline styles ── */
const card = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #f1f5f9' };
const tdStyle = { padding: '14px 16px', fontSize: '0.88rem', color: '#334155', borderBottom: '1px solid #f8fafc' };
const urgencyPill = (u) => {
  const ul = (u || '').toLowerCase();
  const m = { high: { bg: '#fee2e2', c: '#991b1b' }, medium: { bg: '#fef3c7', c: '#92400e' }, low: { bg: '#dbeafe', c: '#1d4ed8' }, normal: { bg: '#f1f5f9', c: '#475569' } };
  const { bg, c } = m[ul] || { bg: '#f1f5f9', c: '#475569' };
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: bg, color: c };
};
const statusPill = (s) => {
  const sl = (s || '').toLowerCase();
  const m = { open: { bg: '#fef3c7', c: '#92400e' }, resolved: { bg: '#dcfce7', c: '#166534' }, closed: { bg: '#f1f5f9', c: '#475569' }, acknowledged: { bg: '#dbeafe', c: '#1d4ed8' } };
  const { bg, c } = m[sl] || { bg: '#f1f5f9', c: '#475569' };
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: bg, color: c };
};
const selectStyle = { padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', background: '#fff', cursor: 'pointer', outline: 'none' };
const filterBtnStyle = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' };
const emptyState = { textAlign: 'center', padding: '48px 24px', color: '#94a3b8', fontSize: '0.95rem' };
const cellMain = { display: 'flex', flexDirection: 'column', gap: '2px' };
const cellTitle = { fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' };
const cellSub = { fontSize: '0.78rem', color: '#94a3b8' };

const AlertsTab = ({
  alerts,
  alertTypeFilter,
  setAlertTypeFilter,
}) => (
  <div>
    {/* Page header */}
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#1e293b' }}>Unpaid Rent Alerts</h2>
      <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>Monitor and manage overdue payments</p>
    </div>

    {/* Filters */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
      <span style={filterBtnStyle}>
        <Filter size={16} />
        Filter
      </span>
      <select
        style={selectStyle}
        value={alertTypeFilter}
        onChange={(e) => setAlertTypeFilter(e.target.value)}
      >
        <option value="">All Alert Types</option>
        <option value="Payment Overdue">Payment Overdue</option>
        <option value="Vacant Property">Vacant Property</option>
        <option value="Maintenance">Maintenance</option>
      </select>
    </div>

    {/* Card with table */}
    <div style={card}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>Alerts</h3>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Track all alerts and their current status.</p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '40px' }} />
              <th style={thStyle}>Alert</th>
              <th style={thStyle}>Property</th>
              <th style={thStyle}>Urgency</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length > 0 ? (
              alerts.map(alert => (
                <tr key={alert.ID} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={tdStyle}>
                    <input type="checkbox" style={{ cursor: 'pointer', accentColor: '#3b82f6' }} />
                  </td>
                  <td style={tdStyle}>
                    <div style={cellMain}>
                      <span style={cellTitle}>{alert.Title || 'N/A'}</span>
                      <span style={cellSub}>{alert.Message || 'N/A'}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>{alert.Property || 'N/A'}</td>
                  <td style={tdStyle}>
                    <span style={urgencyPill(alert.Urgency || 'normal')}>
                      {alert.Urgency || 'Normal'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={statusPill(alert.Status || 'open')}>
                      {alert.Status || 'Open'}
                    </span>
                  </td>
                  <td style={tdStyle}>{alert.CreatedAt ? new Date(alert.CreatedAt).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{alert.Amount ? `${alert.Amount.toLocaleString()} XOF` : '\u2014'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={emptyState}>
                  <AlertTriangle size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                  <div>No alerts found. Start the backend to see real data.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default AlertsTab;
