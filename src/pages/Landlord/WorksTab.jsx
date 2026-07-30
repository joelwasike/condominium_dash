import React, { useState } from 'react';
import { ArrowLeft, FileCheck, Wrench, ClipboardList, HardHat, AlertCircle } from 'lucide-react';

const TABS = [
{ id: 'maintenance', label: 'Maintenance Requests', icon: Wrench },
{ id: 'quotes', label: 'Maintenance Quotes', icon: ClipboardList },
{ id: 'works', label: 'Work Orders', icon: HardHat },
{ id: 'claims', label: 'Claims', icon: AlertCircle }];


const tabBarStyle = {
  display: 'flex',
  gap: '4px',
  borderBottom: '2px solid #e5e7eb',
  marginBottom: '24px',
  overflowX: 'auto'
};

const tabBtnStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  padding: '10px 20px',
  border: 'none',
  borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
  marginBottom: '-2px',
  background: 'none',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: active ? 700 : 500,
  color: active ? '#2563eb' : '#6b7280',
  whiteSpace: 'nowrap',
  transition: 'color 0.15s, border-color 0.15s'
});

const badgeStyle = (n) => n > 0 ? {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '20px',
  height: '20px',
  padding: '0 6px',
  borderRadius: '10px',
  background: '#ef4444',
  color: '#fff',
  fontSize: '0.72rem',
  fontWeight: 700
} : null;

const WorksTab = ({ maintenances, maintenanceQuotes, workOrders, claims, selectedMaintenance, setSelectedMaintenance, selectedQuote, setSelectedQuote, loading, addNotification, loadData, landlordService }) => {
  const [activeTab, setActiveTab] = useState('maintenance');
  if (selectedMaintenance) {
    const m = selectedMaintenance;
    let photos = [];
    try {
      const raw = m.Photos || m.photos || m.PhotoURLs || m.photoURLs;
      if (Array.isArray(raw)) photos = raw;else
      if (typeof raw === 'string' && raw.trim()) photos = JSON.parse(raw) || [];
    } catch (_) {photos = [];}
    const status = (m.Status || m.status || '').toLowerCase();
    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header" style={{ marginBottom: '20px' }}>
          <button type="button" className="sa-outline-button sa-tenant-detail-back-btn" onClick={() => setSelectedMaintenance(null)}>
            <ArrowLeft size={16} /> Back to list
          </button>
        </div>
        <div className="sa-section-card">
          <div className="sa-section-header" style={{ marginBottom: '24px' }}>
            <div><h2>Maintenance Request Details</h2><p>A quote will be submitted by the technical manager for your approval</p></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Issue / Description</label>
              <p style={{ margin: 0, color: '#1f2937', whiteSpace: 'pre-wrap', fontSize: '1rem' }}>{m.Issue || m.issue || 'N/A'}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              <div><label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Property</label><p style={{ margin: 0, color: '#1f2937' }}>{m.Property || m.property || '—'}</p></div>
              <div><label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Tenant</label><p style={{ margin: 0, color: '#1f2937' }}>{m.Tenant || m.tenant || '—'}</p></div>
              <div><label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Priority</label><span className={`sa-status-pill ${(m.Priority || m.priority || 'medium').toLowerCase()}`}>{m.Priority || m.priority || 'Medium'}</span></div>
              <div><label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Status</label><span className={`sa-status-pill ${status || 'pending'}`}>{m.Status || m.status || 'Pending'}</span></div>
              <div><label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Date</label><p style={{ margin: 0, color: '#1f2937' }}>{m.Date || m.date || m.CreatedAt || m.createdAt ? new Date(m.Date || m.date || m.CreatedAt || m.createdAt).toLocaleDateString() : 'N/A'}</p></div>
              <div><label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Estimated Cost</label><p style={{ margin: 0, color: '#1f2937' }}>{((m.EstimatedCost ?? m.estimatedCost) || 0).toLocaleString()} XOF</p></div>
              <div><label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Estimated Hours</label><p style={{ margin: 0, color: '#1f2937' }}>{m.EstimatedHours ?? m.estimatedHours ?? 0} h</p></div>
            </div>
            {photos.length > 0 &&
            <div>
                <label style={{ fontWeight: 600, color: '#374151', marginBottom: '12px', display: 'block' }}>Photos ({photos.length})</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                  {photos.map((photoUrl, i) => {
                  const url = typeof photoUrl === 'string' ? photoUrl : photoUrl?.url || photoUrl?.src || '';
                  if (!url) return null;
                  return (
                    <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '1', backgroundColor: '#f3f4f6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <img src={url} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')} onError={(e) => {e.target.style.display = 'none';}} />
                      </div>);

                })}
                </div>
              </div>
            }
          </div>
        </div>
      </div>);

  }
  if (selectedQuote) {
    const q = selectedQuote;
    const status = (q.Status || q.status || '').toLowerCase();
    const canApprove = status === 'pending_owner_approval';
    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header" style={{ marginBottom: '20px' }}>
          <button type="button" className="sa-outline-button sa-tenant-detail-back-btn" onClick={() => setSelectedQuote(null)}>
            <ArrowLeft size={16} /> Back to list
          </button>
        </div>
        <div className="sa-section-card">
          <div className="sa-section-header" style={{ marginBottom: '24px' }}>
            <div><h2>Maintenance Quote Details</h2><p>Review quote details and approve or reject</p></div>
            {canApprove &&
            <div style={{ display: 'flex', gap: '12px' }}>
                <button className="sa-primary-cta" style={{ backgroundColor: '#16a34a' }} disabled={loading}
              onClick={async () => {try {await landlordService.approveMaintenanceQuote(q.ID || q.id);addNotification('Quote approved successfully', 'success');setSelectedQuote(null);loadData();} catch (err) {addNotification(err?.message || 'Failed to approve quote', 'error');}}}>
                  <FileCheck size={18} /> Approve Quote
                </button>
                <button className="sa-primary-cta" style={{ backgroundColor: '#dc2626' }} disabled={loading}
              onClick={async () => {if (!window.confirm('Are you sure you want to reject this quote?')) return;try {await landlordService.rejectMaintenanceQuote(q.ID || q.id);addNotification('Quote rejected successfully', 'success');setSelectedQuote(null);loadData();} catch (err) {addNotification(err?.message || 'Failed to reject quote', 'error');}}}>
                  Reject Quote
                </button>
              </div>
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Issue / Description</label>
              <p style={{ margin: 0, color: '#1f2937', whiteSpace: 'pre-wrap' }}>{q.Issue || q.issue || 'N/A'}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              <div><label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Property</label><p style={{ margin: 0 }}>{q.Property || q.property || '—'}</p></div>
              <div><label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Amount</label><p style={{ margin: 0, fontWeight: 700 }}>{((q.Amount ?? q.amount) || 0).toLocaleString()} XOF</p></div>
              <div><label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Recipient</label><p style={{ margin: 0 }}>{q.Recipient || q.recipient || '—'}</p></div>
              <div><label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Status</label><span className={`sa-status-pill ${status || 'pending'}`}>{q.Status || q.status || 'Pending'}</span></div>
              <div><label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Director Reason</label><p style={{ margin: 0, color: '#1f2937', whiteSpace: 'pre-wrap' }}>{q.DirectorDecisionReason || q.directorDecisionReason || '—'}</p></div>
              <div><label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Date</label><p style={{ margin: 0 }}>{q.Date || q.date || q.CreatedAt || q.createdAt ? new Date(q.Date || q.date || q.CreatedAt || q.createdAt).toLocaleDateString() : 'N/A'}</p></div>
            </div>
          </div>
        </div>
      </div>);

  }
  const pendingMaint = (maintenances || []).filter((m) => {const s = (m.Status || m.status || '').toLowerCase();return s !== 'approved' && s !== 'completed';}).length;
  const pendingQuotes = (maintenanceQuotes || []).filter((q) => {const s = (q.Status || q.status || '').toLowerCase();return s !== 'approved' && s !== 'rejected';}).length;
  const counts = { maintenance: pendingMaint, quotes: pendingQuotes, works: 0, claims: 0 };
  return (
    <div className="sa-clients-page">
      <div className="sa-clients-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Works &amp; Claims</h2>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>Manage maintenance, quotes, work orders and claims for your properties</p>
        </div>
      </div>
      <div style={tabBarStyle}>
        {TABS.map(({ id, label, icon: Icon }) =>
        <button key={id} type="button" style={tabBtnStyle(activeTab === id)} onClick={() => setActiveTab(id)}>
            <Icon size={16} />
            {label}
            {counts[id] > 0 && <span style={badgeStyle(counts[id])}>{counts[id]}</span>}
          </button>
        )}
      </div>
      {activeTab === 'maintenance' &&
      <div className="sa-section-card">
          <div className="sa-section-header" style={{ marginBottom: '16px' }}>
            <div><h3>Maintenance Requests</h3><p>Click a row to view details</p></div>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th><th>Date</th><th>Property</th><th>Tenant</th><th>Issue</th><th>Priority</th><th>Est. Cost</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(maintenances || []).length === 0 ?
              <tr><td colSpan={8} className="sa-table-empty">No maintenance requests found</td></tr> :
              (maintenances || []).map((m, i) => {
                const st = (m.Status || m.status || '').toLowerCase();
                return (
                  <tr key={m.ID || m.id || `maint-${i}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedMaintenance(m)}>
                      <td>{i + 1}</td>
                      <td>{m.Date || m.date ? new Date(m.Date || m.date).toLocaleDateString() : 'N/A'}</td>
                      <td>{m.Property || m.property || 'N/A'}</td>
                      <td>{m.Tenant || m.tenant || '—'}</td>
                      <td className="sa-cell-main"><span className="sa-cell-title">{m.Issue || m.issue || 'N/A'}</span></td>
                      <td><span className={`sa-status-pill ${(m.Priority || m.priority || 'medium').toLowerCase()}`}>{m.Priority || m.priority || 'Medium'}</span></td>
                      <td>{((m.EstimatedCost ?? m.estimatedCost) || 0).toLocaleString()} XOF</td>
                      <td><span className={`sa-status-pill ${st || 'pending'}`}>{m.Status || m.status || 'Pending'}</span></td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        </div>
      }
      {activeTab === 'quotes' &&
      <div className="sa-section-card">
          <div className="sa-section-header" style={{ marginBottom: '16px' }}>
            <div><h3>Maintenance Quotes</h3><p>Click a row to view details and approve or reject</p></div>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th><th>Date</th><th>Property</th><th>Issue</th><th>Amount</th><th>Status</th><th>Validated By</th><th />
                </tr>
              </thead>
              <tbody>
                {(maintenanceQuotes || []).length === 0 ?
              <tr><td colSpan={8} className="sa-table-empty">No maintenance quotes found</td></tr> :
              (maintenanceQuotes || []).map((q, i) => {
                const st = (q.Status || q.status || '').toLowerCase();
                return (
                  <tr key={q.ID || q.id || `quote-${i}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedQuote(q)}>
                      <td>{i + 1}</td>
                      <td>{q.Date || q.date ? new Date(q.Date || q.date).toLocaleDateString() : 'N/A'}</td>
                      <td>{q.Property || q.property || 'N/A'}</td>
                      <td>{q.Issue || q.issue || 'N/A'}</td>
                      <td>{(q.Amount || q.amount || 0).toLocaleString()} XOF</td>
                      <td><span className={`sa-status-pill ${st || 'pending'}`}>{q.Status || q.status || 'Pending'}</span></td>
                      <td>{q.ValidatedBy || q.validatedBy || '—'}</td>
                      <td className="sa-row-actions" onClick={(e) => e.stopPropagation()}>
                        {st === 'pending_owner_approval' &&
                      <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="table-action-button edit" style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px' }} disabled={loading}
                        onClick={async () => {try {await landlordService.approveMaintenanceQuote(q.ID || q.id);addNotification('Quote approved', 'success');loadData();} catch (err) {addNotification('Failed', 'error');}}}>
                              Approve
                            </button>
                            <button className="table-action-button delete" style={{ padding: '6px 12px' }} disabled={loading}
                        onClick={async () => {if (!window.confirm('Reject this quote?')) return;try {await landlordService.rejectMaintenanceQuote(q.ID || q.id);addNotification('Rejected', 'success');loadData();} catch (err) {addNotification('Failed', 'error');}}}>
                              Reject
                            </button>
                          </div>
                      }
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        </div>
      }
      {activeTab === 'works' &&
      <div className="sa-section-card">
          <div className="sa-section-header" style={{ marginBottom: '16px' }}>
            <div><h3>Work Orders</h3><p>Maintenance and intervention requests</p></div>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th><th>Title</th><th>Property</th><th>Description</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(workOrders || []).length === 0 ?
              <tr><td colSpan={6} className="sa-table-empty">No work orders found</td></tr> :
              (workOrders || []).map((w, i) =>
              <tr key={w.ID || `work-${i}`}>
                    <td>{i + 1}</td>
                    <td className="sa-cell-main"><span className="sa-cell-title">{w.Title || w.title || 'N/A'}</span></td>
                    <td>{w.Property || w.property || 'N/A'}</td>
                    <td><span className="sa-cell-sub">{w.Description || w.description || 'N/A'}</span></td>
                    <td><span className={`sa-status-pill ${(w.Status || w.status || 'pending').toLowerCase()}`}>{w.Status || w.status || 'Pending'}</span></td>
                    <td>{w.Date ? new Date(w.Date).toLocaleDateString() : 'N/A'}</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }
      {activeTab === 'claims' &&
      <div className="sa-section-card">
          <div className="sa-section-header" style={{ marginBottom: '16px' }}>
            <div><h3>Claims</h3><p>Property claims and requests</p></div>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th><th>Title</th><th>Property</th><th>Description</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(claims || []).length === 0 ?
              <tr><td colSpan={6} className="sa-table-empty">No claims found</td></tr> :
              (claims || []).map((c, i) =>
              <tr key={c.ID || `claim-${i}`}>
                    <td>{i + 1}</td>
                    <td className="sa-cell-main"><span className="sa-cell-title">{c.Title || c.title || 'N/A'}</span></td>
                    <td>{c.Property || c.property || 'N/A'}</td>
                    <td><span className="sa-cell-sub">{c.Description || c.description || 'N/A'}</span></td>
                    <td><span className={`sa-status-pill ${(c.Status || c.status || 'pending').toLowerCase()}`}>{c.Status || c.status || 'Pending'}</span></td>
                    <td>{c.Date ? new Date(c.Date).toLocaleDateString() : 'N/A'}</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>);

};

export default WorksTab;
