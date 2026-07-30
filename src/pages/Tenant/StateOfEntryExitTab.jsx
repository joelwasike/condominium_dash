import React from 'react';

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
const emptyState = { padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' };

const StateOfEntryExitTab = ({ myInventory }) =>
<div style={card}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>State of Entry / Exit</h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>View inventory (state of entry or exit) reports filled by the technician for your property</p>
      </div>
    </div>
    {myInventory.length === 0 ?
  <div style={emptyState}>No state of entry or exit records yet. When a technician fills an inventory for you, it will appear here.</div> :

  <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Property</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Inspector</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Report</th>
            </tr>
          </thead>
          <tbody>
            {myInventory.map((inv) => {
          const type = inv.type || inv.Type || '';
          const property = inv.property || inv.Property || '\u2014';
          const date = inv.date || inv.Date || inv.createdAt || inv.CreatedAt;
          const dateStr = date ? new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '\u2014';
          const inspector = inv.inspector || inv.Inspector || '\u2014';
          const status = inv.status || inv.Status || '\u2014';
          const reportURL = inv.reportURL || inv.ReportURL;
          const isEntry = type === 'Move-in';
          return (
            <tr key={inv.id || inv.ID}
            onMouseEnter={(e) => {e.currentTarget.style.background = '#f8fafc';}}
            onMouseLeave={(e) => {e.currentTarget.style.background = '';}}>
              
                  <td style={tdStyle}>
                    <span style={{
                  display: 'inline-block', padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                  backgroundColor: isEntry ? '#dbeafe' : '#fef3c7',
                  color: isEntry ? '#1e40af' : '#92400e'
                }}>
                      {isEntry ? 'Entry' : type === 'Move-out' ? 'Exit' : type || '\u2014'}
                    </span>
                  </td>
                  <td style={tdStyle}>{property}</td>
                  <td style={tdStyle}>{dateStr}</td>
                  <td style={tdStyle}>{inspector}</td>
                  <td style={tdStyle}><span style={statusPill(status)}>{status}</span></td>
                  <td style={tdStyle}>
                    {reportURL ?
                <a href={reportURL} target="_blank" rel="noopener noreferrer"
                style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                        View report
                      </a> :

                <span style={{ color: '#94a3b8' }}>{'\u2014'}</span>
                }
                  </td>
                </tr>);

        })}
          </tbody>
        </table>
      </div>
  }
  </div>;


export default StateOfEntryExitTab;
