import React from 'react';

const StateOfEntryExitTab = ({ myInventory }) => (
  <div className="sa-section-card">
    <div className="sa-section-header">
      <div><h2>State of Entry / Exit</h2><p>View inventory (state of entry or exit) reports filled by the technician for your property</p></div>
    </div>
    {myInventory.length === 0 ? (
      <div className="sa-table-empty">No state of entry or exit records yet. When a technician fills an inventory for you, it will appear here.</div>
    ) : (
      <div className="sa-table-wrapper" style={{ marginTop: '20px' }}>
        <table className="sa-table">
          <thead><tr><th>Type</th><th>Property</th><th>Date</th><th>Inspector</th><th>Status</th><th>Report</th></tr></thead>
          <tbody>
            {myInventory.map((inv) => {
              const type = inv.type || inv.Type || '';
              const property = inv.property || inv.Property || '\u2014';
              const date = inv.date || inv.Date || inv.createdAt || inv.CreatedAt;
              const dateStr = date ? new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '\u2014';
              const inspector = inv.inspector || inv.Inspector || '\u2014';
              const status = inv.status || inv.Status || '\u2014';
              const reportURL = inv.reportURL || inv.ReportURL;
              return (
                <tr key={inv.id || inv.ID}>
                  <td><span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', backgroundColor: type === 'Move-in' ? '#dbeafe' : '#fef3c7', color: type === 'Move-in' ? '#1e40af' : '#92400e' }}>{type === 'Move-in' ? 'Entry' : type === 'Move-out' ? 'Exit' : type || '\u2014'}</span></td>
                  <td>{property}</td><td>{dateStr}</td><td>{inspector}</td><td>{status}</td>
                  <td>{reportURL ? (<a href={reportURL} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>View report</a>) : (<span style={{ color: '#9ca3af' }}>\u2014</span>)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default StateOfEntryExitTab;
