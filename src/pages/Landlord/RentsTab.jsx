import React from 'react';
import { FileText } from 'lucide-react';

const RentsTab = ({ rents, loading, landlordService, addNotification }) =>
<div className="sa-clients-page">
    <div className="sa-clients-header">
      <div><h2>Rents Tracking</h2><p>Track collected and pending rents</p></div>
      <div className="sa-clients-header-right">
        <button className="sa-primary-cta" onClick={async () => {try {await landlordService.downloadReport({ type: 'financial' });addNotification('Report downloaded successfully', 'success');} catch (error) {addNotification('Failed to download report', 'error');}}} disabled={loading}><FileText size={16} /> Download Report</button>
      </div>
    </div>
    {rents && <>
      <div className="sa-overview-metrics" style={{ marginBottom: '24px' }}>
        <div className="sa-metric-card sa-metric-primary"><p className="sa-metric-label">Total Collected</p><p className="sa-metric-value">{rents.totalCollected?.toLocaleString() || 0} XOF</p></div>
        <div className="sa-metric-card"><p className="sa-metric-label">Total Pending</p><p className="sa-metric-value">{rents.totalPending?.toLocaleString() || 0} XOF</p></div>
      </div>
      {rents.collectedRents && rents.collectedRents.length > 0 &&
    <div className="sa-section-card" style={{ marginBottom: '24px' }}>
          <div className="sa-section-header"><div><h3>Collected Rents</h3><p>{rents.collectedRents.length} collected rent payments</p></div></div>
          <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>No</th><th>Date</th><th>Tenant</th><th>Property</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead><tbody>
            {rents.collectedRents.map((rent, index) => <tr key={rent.id || rent.ID || `collected-${index}`}><td>{index + 1}</td><td>{new Date(rent.date || rent.Date).toLocaleDateString()}</td><td className="sa-cell-main"><span className="sa-cell-title">{rent.tenant || rent.Tenant || 'Unknown'}</span></td><td>{rent.property || rent.Property || 'Unknown'}</td><td>{(rent.amount || rent.Amount || 0).toLocaleString()} XOF</td><td>{rent.method || rent.Method || 'Unknown'}</td><td><span className={`sa-status-pill ${(rent.status || rent.Status || 'approved').toLowerCase()}`}>{rent.status || rent.Status || 'Approved'}</span></td></tr>)}
          </tbody></table></div>
        </div>
    }
      {rents.pendingRents && rents.pendingRents.length > 0 &&
    <div className="sa-section-card">
          <div className="sa-section-header"><div><h3>Tenants Who Have Not Paid</h3><p>{rents.pendingRents.length} unpaid rent payment(s)</p></div></div>
          <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>No</th><th>Tenant</th><th>Property</th><th>Amount</th><th>Due Date</th><th>Days Overdue</th><th>Status</th></tr></thead><tbody>
            {rents.pendingRents.map((rent, index) => {const daysOverdue = rent.daysOverdue ?? 0;const dueDate = rent.date || rent.Date;return <tr key={rent.id || rent.ID || `pending-${index}`}><td>{index + 1}</td><td className="sa-cell-main"><span className="sa-cell-title">{rent.tenant || rent.Tenant || 'Unknown'}</span></td><td>{rent.property || rent.Property || 'Unknown'}</td><td>{(rent.amount || rent.Amount || 0).toLocaleString()} XOF</td><td>{dueDate ? new Date(dueDate).toLocaleDateString() : '\u2014'}</td><td>{daysOverdue > 0 ? <span style={{ color: '#dc2626', fontWeight: 500 }}>{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue</span> : <span style={{ color: '#6b7280' }}>Due today</span>}</td><td><span className={`sa-status-pill ${(rent.status || rent.Status || 'pending').toLowerCase()}`}>{rent.status || rent.Status || 'Pending'}</span></td></tr>;})}
          </tbody></table></div>
        </div>
    }
    </>}
  </div>;


export default RentsTab;
