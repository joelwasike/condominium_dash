import React from 'react';
import { ArrowLeft, FileCheck } from 'lucide-react';

const WorksTab = ({ maintenances, maintenanceQuotes, workOrders, claims, selectedMaintenance, setSelectedMaintenance, selectedQuote, setSelectedQuote, loading, addNotification, loadData, landlordService }) => {
  // Maintenance detail view
  if (selectedMaintenance) {
    const m = selectedMaintenance;
    let photos = [];
    try { const raw = m.Photos || m.photos || m.PhotoURLs || m.photoURLs; if (Array.isArray(raw)) photos = raw; else if (typeof raw === 'string' && raw.trim()) photos = JSON.parse(raw) || []; } catch (_) { photos = []; }
    const status = (m.Status || m.status || '').toLowerCase();
    const canApprove = status !== 'approved' && status !== 'completed';
    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header" style={{ marginBottom: '20px' }}><button type="button" className="sa-outline-button sa-tenant-detail-back-btn" onClick={() => setSelectedMaintenance(null)}><ArrowLeft size={16} /> Back to list</button></div>
        <div className="sa-section-card" style={{ marginBottom: '24px' }}>
          <div className="sa-section-header" style={{ marginBottom: '24px' }}><div><h2>Maintenance Request Details</h2><p>Review all details and approve to authorize work</p></div>
            {canApprove && (<button className="sa-primary-cta" style={{ backgroundColor: '#16a34a' }} disabled={loading} onClick={async () => { try { await landlordService.approveMaintenance(m.ID || m.id); addNotification('Maintenance approved successfully', 'success'); setSelectedMaintenance(null); loadData(); } catch (err) { addNotification(err?.message || 'Failed to approve maintenance', 'error'); } }}><FileCheck size={18} /> Approve Maintenance</button>)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Issue / Description</label><p style={{ margin: 0, color: '#1f2937', whiteSpace: 'pre-wrap', fontSize: '1rem' }}>{m.Issue || m.issue || 'N/A'}</p></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Property</label><p style={{ margin: 0, color: '#1f2937' }}>{m.Property || m.property || '\u2014'}</p></div>
              <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Tenant</label><p style={{ margin: 0, color: '#1f2937' }}>{m.Tenant || m.tenant || '\u2014'}</p></div>
              <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Priority</label><span className={`sa-status-pill ${(m.Priority || m.priority || 'medium').toLowerCase()}`}>{m.Priority || m.priority || 'Medium'}</span></div>
              <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Status</label><span className={`sa-status-pill ${status || 'pending'}`}>{m.Status || m.status || 'Pending'}</span></div>
              <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Date</label><p style={{ margin: 0, color: '#1f2937' }}>{m.Date || m.date || m.CreatedAt || m.createdAt ? new Date(m.Date || m.date || m.CreatedAt || m.createdAt).toLocaleDateString() : 'N/A'}</p></div>
              <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Estimated Cost</label><p style={{ margin: 0, color: '#1f2937' }}>{((m.EstimatedCost ?? m.estimatedCost) || 0).toLocaleString()} XOF</p></div>
              <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Estimated Hours</label><p style={{ margin: 0, color: '#1f2937' }}>{m.EstimatedHours ?? m.estimatedHours ?? 0} h</p></div>
            </div>
            {photos.length > 0 && (<div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'block' }}>Photos ({photos.length})</label><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>{photos.map((photoUrl, index) => { const url = typeof photoUrl === 'string' ? photoUrl : (photoUrl?.url || photoUrl?.src || ''); if (!url) return null; return (<div key={index} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1', backgroundColor: '#f3f4f6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><img src={url} alt={`Maintenance photo ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')} onError={(e) => { e.target.style.display = 'none'; }} /></div>); })}</div></div>)}
          </div>
        </div>
      </div>
    );
  }

  // Quote detail view  
  if (selectedQuote) {
    const q = selectedQuote;
    const status = (q.Status || q.status || '').toLowerCase();
    const canApprove = status !== 'approved' && status !== 'rejected';
    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header" style={{ marginBottom: '20px' }}><button type="button" className="sa-outline-button sa-tenant-detail-back-btn" onClick={() => setSelectedQuote(null)}><ArrowLeft size={16} /> Back to list</button></div>
        <div className="sa-section-card" style={{ marginBottom: '24px' }}>
          <div className="sa-section-header" style={{ marginBottom: '24px' }}><div><h2>Maintenance Quote Details</h2><p>Review quote details and approve or reject</p></div>
            {canApprove && (<div style={{ display: 'flex', gap: '12px' }}>
              <button className="sa-primary-cta" style={{ backgroundColor: '#16a34a' }} disabled={loading} onClick={async () => { try { await landlordService.approveMaintenanceQuote(q.ID || q.id); addNotification('Quote approved successfully', 'success'); setSelectedQuote(null); loadData(); } catch (err) { addNotification(err?.message || 'Failed to approve quote', 'error'); } }}><FileCheck size={18} /> Approve Quote</button>
              <button className="sa-primary-cta" style={{ backgroundColor: '#dc2626' }} disabled={loading} onClick={async () => { if (!window.confirm('Are you sure you want to reject this quote?')) return; try { await landlordService.rejectMaintenanceQuote(q.ID || q.id); addNotification('Quote rejected successfully', 'success'); setSelectedQuote(null); loadData(); } catch (err) { addNotification(err?.message || 'Failed to reject quote', 'error'); } }}>Reject Quote</button>
            </div>)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Issue / Description</label><p style={{ margin: 0, color: '#1f2937', whiteSpace: 'pre-wrap' }}>{q.Issue || q.issue || 'N/A'}</p></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Property</label><p style={{ margin: 0 }}>{q.Property || q.property || '\u2014'}</p></div>
              <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Amount</label><p style={{ margin: 0 }}>{((q.Amount ?? q.amount) || 0).toLocaleString()} XOF</p></div>
              <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Recipient</label><p style={{ margin: 0 }}>{q.Recipient || q.recipient || '\u2014'}</p></div>
              <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Status</label><span className={`sa-status-pill ${status || 'pending'}`}>{q.Status || q.status || 'Pending'}</span></div>
              <div><label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Date</label><p style={{ margin: 0 }}>{q.Date || q.date || q.CreatedAt || q.createdAt ? new Date(q.Date || q.date || q.CreatedAt || q.createdAt).toLocaleDateString() : 'N/A'}</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sa-clients-page">
      <div className="sa-clients-header"><div><h2>Works & Interventions Management</h2><p>Track maintenance works, interventions, and automatic claims management</p></div></div>
      {maintenances && maintenances.length > 0 && (<div className="sa-section-card" style={{ marginBottom: '24px' }}><div className="sa-section-header"><div><h3>Maintenance Requests</h3><p>Click a row to view details and approve</p></div></div><div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>No</th><th>Date</th><th>Property</th><th>Tenant</th><th>Issue</th><th>Priority</th><th>Est. Cost</th><th>Status</th><th /></tr></thead><tbody>{maintenances.map((m, index) => { const st = (m.Status || m.status || '').toLowerCase(); const ca = st !== 'approved' && st !== 'completed'; return (<tr key={m.ID || m.id || `maint-${index}`} className="clickable-row" style={{ cursor: 'pointer' }} onClick={() => setSelectedMaintenance(m)}><td>{index + 1}</td><td>{m.Date || m.date ? new Date(m.Date || m.date).toLocaleDateString() : 'N/A'}</td><td>{m.Property || m.property || 'N/A'}</td><td>{m.Tenant || m.tenant || '\u2014'}</td><td className="sa-cell-main"><span className="sa-cell-title">{m.Issue || m.issue || 'N/A'}</span></td><td><span className={`sa-status-pill ${(m.Priority || m.priority || 'medium').toLowerCase()}`}>{m.Priority || m.priority || 'Medium'}</span></td><td>{((m.EstimatedCost ?? m.estimatedCost) || 0).toLocaleString()} XOF</td><td><span className={`sa-status-pill ${st || 'pending'}`}>{m.Status || m.status || 'Pending'}</span></td><td className="sa-row-actions" onClick={(e) => e.stopPropagation()}>{ca && (<button className="table-action-button edit" style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px' }} disabled={loading} onClick={async () => { try { await landlordService.approveMaintenance(m.ID || m.id); addNotification('Maintenance approved', 'success'); loadData(); } catch (err) { addNotification(err?.message || 'Failed', 'error'); } }}>Approve</button>)}</td></tr>); })}</tbody></table></div></div>)}
      {maintenanceQuotes && maintenanceQuotes.length > 0 && (<div className="sa-section-card" style={{ marginBottom: '24px' }}><div className="sa-section-header"><div><h3>Pending Maintenance Quotes</h3><p>Click a row to view details, photos, and approve or reject</p></div></div><div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>No</th><th>Date</th><th>Property</th><th>Issue</th><th>Amount</th><th>Status</th><th>Validated By</th><th /></tr></thead><tbody>{maintenanceQuotes.map((quote, index) => { const st = (quote.Status || quote.status || '').toLowerCase(); return (<tr key={quote.ID || quote.id || `quote-${index}`} className="clickable-row" style={{ cursor: 'pointer' }} onClick={() => setSelectedQuote(quote)}><td>{index + 1}</td><td>{quote.Date || quote.date ? new Date(quote.Date || quote.date).toLocaleDateString() : 'N/A'}</td><td>{quote.Property || quote.property || 'N/A'}</td><td>{quote.Issue || quote.issue || 'N/A'}</td><td>{(quote.Amount || quote.amount || 0).toLocaleString()} XOF</td><td><span className={`sa-status-pill ${st || 'pending'}`}>{quote.Status || quote.status || 'Pending'}</span></td><td>{quote.ValidatedBy || quote.validatedBy || '\u2014'}</td><td className="sa-row-actions" onClick={(e) => e.stopPropagation()}>{st !== 'approved' && st !== 'rejected' && (<><button className="table-action-button edit" style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px' }} disabled={loading} onClick={async () => { try { await landlordService.approveMaintenanceQuote(quote.ID || quote.id); addNotification('Quote approved', 'success'); loadData(); } catch (e2) { addNotification('Failed', 'error'); } }}>Approve</button><button className="table-action-button delete" style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', marginLeft: '8px' }} disabled={loading} onClick={async () => { if (!window.confirm('Reject?')) return; try { await landlordService.rejectMaintenanceQuote(quote.ID || quote.id); addNotification('Rejected', 'success'); loadData(); } catch (e2) { addNotification('Failed', 'error'); } }}>Reject</button></>)}</td></tr>); })}</tbody></table></div></div>)}
      {workOrders.length > 0 && (<div className="sa-section-card" style={{ marginBottom: '24px' }}><div className="sa-section-header"><div><h3>Work Orders</h3><p>Maintenance and intervention requests</p></div></div><div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>No</th><th>Title</th><th>Property</th><th>Description</th><th>Status</th><th>Date</th><th /></tr></thead><tbody>{workOrders.map((work, index) => (<tr key={work.ID || `work-${index}`}><td>{index + 1}</td><td className="sa-cell-main"><span className="sa-cell-title">{work.Title || work.title || 'N/A'}</span></td><td>{work.Property || work.property || 'N/A'}</td><td><span className="sa-cell-sub">{work.Description || work.description || 'N/A'}</span></td><td><span className={`sa-status-pill ${(work.Status || work.status || 'pending').toLowerCase()}`}>{work.Status || work.status || 'Pending'}</span></td><td>{work.Date ? new Date(work.Date).toLocaleDateString() : 'N/A'}</td><td className="sa-row-actions"><button className="sa-icon-button" title="View">\ud83d\udc41\ufe0f</button></td></tr>))}</tbody></table></div></div>)}
      <div className="sa-section-card"><div className="sa-section-header"><div><h3>Claims</h3><p>Property claims and requests</p></div></div><div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>No</th><th>Title</th><th>Property</th><th>Description</th><th>Status</th><th>Date</th><th /></tr></thead><tbody>{claims.length === 0 ? (<tr><td colSpan={7} className="sa-table-empty">No claims found</td></tr>) : claims.map((claim, index) => (<tr key={claim.ID || `claim-${index}`}><td>{index + 1}</td><td className="sa-cell-main"><span className="sa-cell-title">{claim.Title || claim.title || 'N/A'}</span></td><td>{claim.Property || claim.property || 'N/A'}</td><td><span className="sa-cell-sub">{claim.Description || claim.description || 'N/A'}</span></td><td><span className={`sa-status-pill ${(claim.Status || claim.status || 'pending').toLowerCase()}`}>{claim.Status || claim.status || 'Pending'}</span></td><td>{claim.Date ? new Date(claim.Date).toLocaleDateString() : 'N/A'}</td><td className="sa-row-actions"><button className="sa-icon-button" title="View">\ud83d\udc41\ufe0f</button></td></tr>))}</tbody></table></div></div>
    </div>
  );
};

export default WorksTab;
