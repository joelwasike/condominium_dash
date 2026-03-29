import React from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Users, DollarSign, Building, AlertTriangle, Wrench, Receipt, StickyNote, AlertCircle, FileCheck, MessageSquare } from 'lucide-react';

const TenantsTab = ({
  tenants, properties, selectedTenantId, setSelectedTenantId,
  tenantDetail, setTenantDetail, tenantDetailLoading,
  tenantNameFilter, setTenantNameFilter, tenantPropertyFilter, setTenantPropertyFilter,
  addNotification
}) => {
  if (selectedTenantId) {
    if (tenantDetailLoading) {
      return (<div className="sa-clients-page"><div className="sa-section-card" style={{ padding: '48px', textAlign: 'center' }}><p className="sa-cell-sub" style={{ margin: 0 }}>Loading tenant details\u2026</p></div></div>);
    }
    const c = tenantDetail?.client;
    if (!c) {
      return (<div className="sa-clients-page"><button type="button" className="sa-outline-button sa-tenant-detail-back-btn" onClick={() => { setSelectedTenantId(null); setTenantDetail(null); }} style={{ marginBottom: '16px' }}><ArrowLeft size={16} /> Back to list</button><div className="sa-section-card"><p className="sa-cell-sub" style={{ margin: 0 }}>Tenant not found or failed to load.</p></div></div>);
    }
    const prop = tenantDetail?.property;
    const alertList = Array.isArray(tenantDetail?.alerts) ? tenantDetail.alerts : [];
    const maintenancesList = Array.isArray(tenantDetail?.maintenances) ? tenantDetail.maintenances : [];
    const paymentsList = Array.isArray(tenantDetail?.payments) ? tenantDetail.payments : [];
    const privateNotesList = Array.isArray(tenantDetail?.privateNotes) ? tenantDetail.privateNotes : [];
    const name = c.Name || c.name || 'N/A';
    const email = c.Email || c.email || '';
    const phone = c.Phone || c.phone || '';
    const status = c.Status || c.status || 'Unknown';
    const propertyAddr = c.Property || c.property || '\u2014';
    const unitNumber = c.UnitNumber ?? c.unitNumber ?? '\u2014';
    const amount = c.Amount ?? c.amount ?? 0;
    const lastPayment = c.LastPayment ?? c.lastPayment;
    const createdAt = c.CreatedAt ?? c.createdAt;
    const updatedAt = c.UpdatedAt ?? c.updatedAt;

    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header" style={{ marginBottom: '20px' }}>
          <button type="button" className="sa-outline-button sa-tenant-detail-back-btn" onClick={() => { setSelectedTenantId(null); setTenantDetail(null); }}><ArrowLeft size={16} /> Back to list</button>
        </div>
        <div className="sa-section-card" style={{ marginBottom: '24px' }}>
          <div className="sa-tenant-detail-hero">
            <div className="sa-tenant-detail-avatar">{(name || 'T').charAt(0).toUpperCase()}</div>
            <div>
              <h2>{name}</h2>
              <span className={`sa-status-pill ${(status || '').toLowerCase().replace(/\s+/g, '-')}`} style={{ marginRight: '8px' }}>{status}</span>
              {propertyAddr && propertyAddr !== '\u2014' && (<span className="sa-tenant-detail-meta"><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{propertyAddr}{unitNumber && unitNumber !== '\u2014' ? ` \u00b7 ${unitNumber}` : ''}</span>)}
            </div>
          </div>
        </div>
        <div className="sa-tenant-detail-grid">
          <div className="sa-section-card sa-tenant-detail-card">
            <h3><Users size={18} /> Personal information</h3>
            <dl className="sa-tenant-detail-dl">
              <div><dt>Name</dt><dd>{name}</dd></div>
              {email && <div><dt>Email</dt><dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {email}</dd></div>}
              {phone && <div><dt>Phone</dt><dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {phone}</dd></div>}
              <div><dt>Status</dt><dd><span className={`sa-status-pill ${(status || '').toLowerCase().replace(/\s+/g, '-')}`}>{status}</span></dd></div>
              {createdAt && <div><dt>Member since</dt><dd>{new Date(createdAt).toLocaleDateString()}</dd></div>}
            </dl>
            <h4 style={{ margin: '16px 0 8px', fontSize: '0.9rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}><FileCheck size={16} /> Files & documents</h4>
            <p className="sa-cell-sub" style={{ margin: 0 }}>No files uploaded yet.</p>
          </div>
          <div className="sa-section-card sa-tenant-detail-card">
            <h3><DollarSign size={18} /> Rent & payment</h3>
            <dl className="sa-tenant-detail-dl">
              <div><dt>Property</dt><dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {propertyAddr}</dd></div>
              {unitNumber && unitNumber !== '\u2014' && <div><dt>Unit</dt><dd>{unitNumber}</dd></div>}
              <div><dt>Monthly rent</dt><dd className="sa-tenant-detail-value-bold">{Number(amount).toLocaleString()} XOF</dd></div>
              <div><dt>Last payment</dt><dd>{lastPayment ? new Date(lastPayment).toLocaleDateString() : '\u2014'}</dd></div>
            </dl>
          </div>
          {prop && (<div className="sa-section-card sa-tenant-detail-card"><h3><Building size={18} /> Property details</h3><dl className="sa-tenant-detail-dl"><div><dt>Type</dt><dd>{prop.type || prop.Type || '\u2014'}</dd></div>{(prop.bedrooms ?? prop.Bedrooms) != null && <div><dt>Bedrooms</dt><dd>{prop.bedrooms ?? prop.Bedrooms}</dd></div>}{(prop.bathrooms ?? prop.Bathrooms) != null && <div><dt>Bathrooms</dt><dd>{prop.bathrooms ?? prop.Bathrooms}</dd></div>}<div><dt>Property status</dt><dd><span className={`sa-status-pill ${(prop.status || prop.Status || '').toLowerCase()}`}>{prop.status || prop.Status || '\u2014'}</span></dd></div></dl></div>)}
          <div className="sa-section-card sa-tenant-detail-card" style={alertList.length ? undefined : { gridColumn: '1 / -1' }}>
            <h3><AlertTriangle size={18} /> Alerts & activity</h3>
            {alertList.length > 0 ? (<ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>{alertList.map((alert, idx) => (<li key={alert.ID || alert.id || idx} className="sa-tenant-detail-alert-item"><div className="sa-tenant-detail-alert-title">{alert.Title || alert.title || 'Alert'}</div>{alert.Message && <div className="sa-cell-sub" style={{ marginBottom: '4px' }}>{alert.Message}</div>}<div className="sa-tenant-detail-alert-meta">{(alert.Urgency || alert.urgency || '').toLowerCase()} \u00b7 {alert.Status || alert.status || 'Open'}{alert.Amount != null && ` \u00b7 ${Number(alert.Amount).toLocaleString()} XOF`}</div></li>))}</ul>) : (<p className="sa-cell-sub">No alerts for this tenant.</p>)}
          </div>
          <div className="sa-section-card sa-tenant-detail-card">
            <h3><Wrench size={18} /> Maintenances requested</h3>
            {maintenancesList.length > 0 ? (<ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>{maintenancesList.map((m, idx) => (<li key={m.ID ?? m.id ?? idx} className="sa-tenant-detail-alert-item"><div className="sa-tenant-detail-alert-title">{m.Issue || m.issue || 'Maintenance'}</div><div className="sa-tenant-detail-alert-meta">{(m.Status || m.status || '\u2014')} \u00b7 {(m.Priority || m.priority || '\u2014')}{m.CreatedAt && ` \u00b7 ${new Date(m.CreatedAt).toLocaleDateString()}`}</div></li>))}</ul>) : (<p className="sa-cell-sub">No maintenance requests for this tenant.</p>)}
          </div>
          <div className="sa-section-card sa-tenant-detail-card">
            <h3><Receipt size={18} /> Recent payment history</h3>
            {paymentsList.length > 0 ? (<ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>{paymentsList.slice(0, 10).map((p, idx) => (<li key={p.ID || p.id || idx} className="sa-tenant-detail-alert-item" style={{ borderLeftColor: (p.Status || p.status) === 'Approved' ? '#16a34a' : '#f59e0b' }}><div className="sa-tenant-detail-alert-title">{Number(p.Amount ?? p.amount ?? 0).toLocaleString()} XOF \u00b7 {(p.Status || p.status || '\u2014')}</div><div className="sa-tenant-detail-alert-meta">{p.Date ? new Date(p.Date).toLocaleDateString() : (p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString() : '\u2014')}{(p.Method || p.method) && ` \u00b7 ${p.Method || p.method}`}</div></li>))}</ul>) : (<p className="sa-cell-sub">No payment history for this tenant.</p>)}
          </div>
          <div className="sa-section-card sa-tenant-detail-card">
            <h3><StickyNote size={18} /> Private notes</h3>
            {privateNotesList.length > 0 ? (<ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>{privateNotesList.map((n) => (<li key={n.id ?? n.ID} className="sa-tenant-detail-alert-item" style={{ borderLeftColor: '#6366f1' }}><div className="sa-tenant-detail-alert-title">{n.note ?? n.Note}</div><div className="sa-tenant-detail-alert-meta">{n.createdAt ? new Date(n.createdAt).toLocaleString() : (n.CreatedAt ? new Date(n.CreatedAt).toLocaleString() : '')}</div></li>))}</ul>) : (<p className="sa-cell-sub">No private notes yet.</p>)}
          </div>
          <div className="sa-section-card sa-tenant-detail-card">
            <h3><AlertCircle size={18} /> Quick actions</h3>
            <div className="sa-tenant-detail-quick-actions">
              <button type="button" className="sa-outline-button" onClick={() => addNotification('Generate Receipt \u2013 feature coming soon', 'info')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Receipt size={16} /> Generate Receipt</button>
              <button type="button" className="sa-outline-button" onClick={() => addNotification('Send Reminder SMS \u2013 feature coming soon', 'info')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><MessageSquare size={16} /> Send Reminder SMS</button>
            </div>
          </div>
        </div>
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-tenant-detail-footer"><span className="sa-tenant-detail-updated">Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : '\u2014'}</span></div>
        </div>
      </div>
    );
  }

  const filteredTenants = tenants.filter(t => {
    const name = (t.name ?? t.Name ?? '').toLowerCase();
    const prop = (t.property ?? t.Property ?? '');
    const nameMatch = !tenantNameFilter || name.includes(tenantNameFilter.toLowerCase().trim());
    const propMatch = !tenantPropertyFilter || prop === tenantPropertyFilter;
    return nameMatch && propMatch;
  });
  const tenantProps = tenants.map(t => t.property ?? t.Property).filter(Boolean);
  const landlordProps = properties.map(p => p.Address ?? p.address ?? p.name).filter(Boolean);
  const uniqueProperties = [...new Set([...tenantProps, ...landlordProps])].filter(Boolean).sort();

  return (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div><h2>Tenant Management</h2><p>{filteredTenants.length} tenants found \u2013 click a tenant to see full details</p></div>
        <div className="sa-clients-header-right">
          <div className="sa-filters-section">
            <input type="text" className="sa-filter-select" placeholder="Filter by name..." value={tenantNameFilter} onChange={(e) => setTenantNameFilter(e.target.value)} />
            <select className="sa-filter-select" value={tenantPropertyFilter} onChange={(e) => setTenantPropertyFilter(e.target.value)}>
              <option value="">All Properties</option>
              {uniqueProperties.map(addr => (<option key={addr} value={addr}>{addr}</option>))}
            </select>
          </div>
        </div>
      </div>
      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead><tr><th>No</th><th>Tenant Name</th><th>Property</th><th>Rent Amount</th><th>Status</th><th /></tr></thead>
            <tbody>
              {filteredTenants.map((tenant, index) => {
                const tenantId = tenant.id ?? tenant.ID;
                const tenantName = tenant.name ?? tenant.Name ?? 'N/A';
                return (
                  <tr key={tenantId ?? index} style={{ cursor: 'pointer' }} onClick={() => tenantId && setSelectedTenantId(String(tenantId))} className="clickable-row">
                    <td>{index + 1}</td>
                    <td className="sa-cell-main"><span className="sa-cell-title">{tenantName}</span></td>
                    <td>{tenant.property ?? tenant.Property ?? 'N/A'}</td>
                    <td>{(tenant.amount ?? tenant.Amount ?? 0).toLocaleString()} XOF</td>
                    <td><span className={`sa-status-pill ${(tenant.status ?? tenant.Status ?? 'active').toLowerCase().replace(/\s+/g, '-')}`}>{tenant.status ?? tenant.Status ?? 'Active'}</span></td>
                    <td onClick={(e) => e.stopPropagation()}><button type="button" className="sa-icon-button" title="View" onClick={() => tenantId && setSelectedTenantId(String(tenantId))}>\ud83d\udc41\ufe0f</button></td>
                  </tr>
                );
              })}
              {filteredTenants.length === 0 && (<tr><td colSpan={6} className="sa-table-empty">No tenants found</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TenantsTab;
