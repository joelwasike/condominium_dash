import React, { useState } from 'react';
import { Plus, Filter, FileSpreadsheet, ArrowLeft, Users, Mail, Phone, MapPin, DollarSign, Building, AlertTriangle, Wrench, FileCheck, StickyNote, Receipt, MessageSquare, AlertCircle } from 'lucide-react';
import { salesManagerService } from '../../services/salesManagerService';

const ClientsTab = ({
  loading,
  clients,
  filteredClients,
  waitingListClients,
  unpaidRents,
  clientStatusFilter,
  setClientStatusFilter,
  clientPropertyFilter,
  setClientPropertyFilter,
  clientSearchText,
  setClientSearchText,
  handleEditClient,
  handleEditUnpaidRent,
  setImportMode,
  setExcelFile,
  setShowTenantCreationModal,
  selectedTenantId,
  setSelectedTenantId,
  tenantDetail,
  setTenantDetail,
  tenantDetailLoading,
  addNotification,
  setEditingClient,
  setShowEditClientModal,
}) => {
  const [privateNoteInput, setPrivateNoteInput] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [maintenanceDetail, setMaintenanceDetail] = useState(null);
  const [maintenanceDetailLoading, setMaintenanceDetailLoading] = useState(false);

  // Tenant Detail View
  if (selectedTenantId) {
    if (tenantDetailLoading) {
      return (
        <div className="sa-clients-page">
          <div className="sa-section-card" style={{ padding: '48px', textAlign: 'center' }}>
            <p className="sa-cell-sub" style={{ margin: 0 }}>Loading tenant details…</p>
          </div>
        </div>
      );
    }
    const c = tenantDetail?.client;
    if (!c) {
      return (
        <div className="sa-clients-page">
          <button
            type="button"
            className="sa-outline-button sa-tenant-detail-back-btn"
            onClick={() => { setSelectedTenantId(null); setTenantDetail(null); }}
            style={{ marginBottom: '16px' }}
          >
            <ArrowLeft size={16} />
            Back to list
          </button>
          <div className="sa-section-card">
            <p className="sa-cell-sub" style={{ margin: 0 }}>Tenant not found or failed to load.</p>
          </div>
        </div>
      );
    }
    const prop = tenantDetail?.property;
    const alertList = Array.isArray(tenantDetail?.alerts) ? tenantDetail.alerts : [];
    const maintenancesList = Array.isArray(tenantDetail?.maintenances) ? tenantDetail.maintenances : [];
    const paymentsList = Array.isArray(tenantDetail?.payments) ? tenantDetail.payments : [];
    const privateNotesList = Array.isArray(tenantDetail?.privateNotes) ? tenantDetail.privateNotes : [];
    const name = c.Name || c.name || 'N/A';

    const handleAddPrivateNote = async () => {
      const note = (privateNoteInput || '').trim();
      if (!note || !selectedTenantId) return;
      setAddingNote(true);
      try {
        await salesManagerService.addClientNote(selectedTenantId, { note });
        setPrivateNoteInput('');
        const data = await salesManagerService.getClient(selectedTenantId);
        setTenantDetail(data);
        addNotification('Note added', 'success');
      } catch (err) {
        addNotification(err?.message || 'Failed to add note', 'error');
      } finally {
        setAddingNote(false);
      }
    };

    const handleQuickAction = (action) => {
      addNotification(`${action} – feature coming soon`, 'info');
    };
    const email = c.Email || c.email || '';
    const phone = c.Phone || c.phone || '';
    const status = c.Status || c.status || 'Unknown';
    const propertyAddr = c.Property || c.property || '—';
    const unitNumber = c.UnitNumber ?? c.unitNumber ?? '—';
    const amount = c.Amount ?? c.amount ?? 0;
    const lastPayment = c.LastPayment ?? c.lastPayment;
    const createdAt = c.CreatedAt ?? c.createdAt;
    const updatedAt = c.UpdatedAt ?? c.updatedAt;

    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header" style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className="sa-outline-button sa-tenant-detail-back-btn"
            onClick={() => { setSelectedTenantId(null); setTenantDetail(null); }}
          >
            <ArrowLeft size={16} />
            Back to list
          </button>
        </div>

        <div className="sa-section-card" style={{ marginBottom: '24px' }}>
          <div className="sa-tenant-detail-hero">
            <div className="sa-tenant-detail-avatar">
              {(name || 'T').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{name}</h2>
              <span className={`sa-status-pill ${(status || '').toLowerCase().replace(/\s+/g, '-')}`} style={{ marginRight: '8px' }}>
                {status}
              </span>
              {propertyAddr && propertyAddr !== '—' && (
                <span className="sa-tenant-detail-meta">
                  <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {propertyAddr}{unitNumber && unitNumber !== '—' ? ` · ${unitNumber}` : ''}
                </span>
              )}
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
            <h4 style={{ margin: '16px 0 8px', fontSize: '0.9rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileCheck size={16} /> Files & documents
            </h4>
            <p className="sa-cell-sub" style={{ margin: 0 }}>No files uploaded yet. ID and other tenant documents can be added here for viewing.</p>
          </div>

          <div className="sa-section-card sa-tenant-detail-card">
            <h3><DollarSign size={18} /> Rent & payment</h3>
            <dl className="sa-tenant-detail-dl">
              <div><dt>Property</dt><dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {propertyAddr}</dd></div>
              {unitNumber && unitNumber !== '—' && <div><dt>Unit</dt><dd>{unitNumber}</dd></div>}
              <div><dt>Monthly rent</dt><dd className="sa-tenant-detail-value-bold">{Number(amount).toLocaleString()} XOF</dd></div>
              <div><dt>Last payment</dt><dd>{lastPayment ? new Date(lastPayment).toLocaleDateString() : '—'}</dd></div>
            </dl>
          </div>

          {prop && (
            <div className="sa-section-card sa-tenant-detail-card">
              <h3><Building size={18} /> Property details</h3>
              <dl className="sa-tenant-detail-dl">
                <div><dt>Type</dt><dd>{prop.type || prop.Type || '—'}</dd></div>
                {(prop.bedrooms ?? prop.Bedrooms) != null && <div><dt>Bedrooms</dt><dd>{prop.bedrooms ?? prop.Bedrooms}</dd></div>}
                {(prop.bathrooms ?? prop.Bathrooms) != null && <div><dt>Bathrooms</dt><dd>{prop.bathrooms ?? prop.Bathrooms}</dd></div>}
                <div><dt>Property status</dt><dd><span className={`sa-status-pill ${(prop.status || prop.Status || '').toLowerCase()}`}>{prop.status || prop.Status || '—'}</span></dd></div>
              </dl>
            </div>
          )}

          <div className="sa-section-card sa-tenant-detail-card" style={alertList.length ? undefined : { gridColumn: '1 / -1' }}>
            <h3><AlertTriangle size={18} /> Alerts & activity</h3>
            {alertList.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alertList.map((alert, idx) => (
                  <li key={alert.ID || alert.id || idx} className="sa-tenant-detail-alert-item">
                    <div className="sa-tenant-detail-alert-title">{alert.Title || alert.title || 'Alert'}</div>
                    {alert.Message && <div className="sa-cell-sub" style={{ marginBottom: '4px' }}>{alert.Message}</div>}
                    <div className="sa-tenant-detail-alert-meta">
                      {(alert.Urgency || alert.urgency || '').toLowerCase()} · {alert.Status || alert.status || 'Open'}
                      {alert.Amount != null && ` · ${Number(alert.Amount).toLocaleString()} XOF`}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sa-cell-sub">No alerts for this tenant.</p>
            )}
          </div>

          <div className="sa-section-card sa-tenant-detail-card">
            <h3><Wrench size={18} /> Maintenances requested</h3>
            {maintenancesList.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {maintenancesList.map((m, idx) => {
                  const mid = m.ID ?? m.id;
                  const openMaintenanceDetail = () => {
                    if (mid == null) return;
                    setMaintenanceDetailLoading(true);
                    setMaintenanceDetail(null);
                    salesManagerService.getMaintenance(mid)
                      .then((data) => setMaintenanceDetail(data))
                      .catch((err) => addNotification(err?.message || 'Failed to load maintenance details', 'error'))
                      .finally(() => setMaintenanceDetailLoading(false));
                  };
                  return (
                    <li
                      key={mid ?? idx}
                      className="sa-tenant-detail-alert-item"
                      role="button"
                      tabIndex={0}
                      onClick={openMaintenanceDetail}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMaintenanceDetail(); } }}
                      style={{ cursor: mid != null ? 'pointer' : 'default' }}
                    >
                      <div className="sa-tenant-detail-alert-title">{m.Issue || m.issue || 'Maintenance'}</div>
                      <div className="sa-tenant-detail-alert-meta">
                        {(m.Status || m.status || '—')} · {(m.Priority || m.priority || '—')}
                        {m.CreatedAt && ` · ${new Date(m.CreatedAt).toLocaleDateString()}`}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="sa-cell-sub">No maintenance requests for this tenant.</p>
            )}
          </div>

          <div className="sa-section-card sa-tenant-detail-card">
            <h3><Receipt size={18} /> Recent payment history</h3>
            {paymentsList.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {paymentsList.slice(0, 10).map((p, idx) => (
                  <li key={p.ID || p.id || idx} className="sa-tenant-detail-alert-item" style={{ borderLeftColor: (p.Status || p.status) === 'Approved' ? '#16a34a' : '#f59e0b' }}>
                    <div className="sa-tenant-detail-alert-title">
                      {Number(p.Amount ?? p.amount ?? 0).toLocaleString()} XOF · {(p.Status || p.status || '—')}
                    </div>
                    <div className="sa-tenant-detail-alert-meta">
                      {p.Date ? new Date(p.Date).toLocaleDateString() : (p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString() : '—')}
                      {(p.Method || p.method) && ` · ${p.Method || p.method}`}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sa-cell-sub">No payment history for this tenant.</p>
            )}
          </div>

          <div className="sa-section-card sa-tenant-detail-card">
            <h3><StickyNote size={18} /> Private notes</h3>
            <textarea
              value={privateNoteInput}
              onChange={(e) => setPrivateNoteInput(e.target.value)}
              placeholder="Add a note for future reference (visible only to sales managers)..."
              rows={2}
              className="sa-tenant-detail-notes-input"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.875rem', resize: 'vertical', marginBottom: '10px' }}
            />
            <button
              type="button"
              className="sa-primary-cta"
              onClick={handleAddPrivateNote}
              disabled={!privateNoteInput.trim() || addingNote}
              style={{ marginBottom: '16px' }}
            >
              {addingNote ? 'Adding…' : 'Add note'}
            </button>
            {privateNotesList.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {privateNotesList.map((n) => (
                  <li key={n.id ?? n.ID} className="sa-tenant-detail-alert-item" style={{ borderLeftColor: '#6366f1' }}>
                    <div className="sa-tenant-detail-alert-title">{n.note ?? n.Note}</div>
                    <div className="sa-tenant-detail-alert-meta">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : (n.CreatedAt ? new Date(n.CreatedAt).toLocaleString() : '')}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sa-cell-sub">No private notes yet.</p>
            )}
          </div>

          <div className="sa-section-card sa-tenant-detail-card">
            <h3><AlertCircle size={18} /> Quick actions</h3>
            <div className="sa-tenant-detail-quick-actions">
              <button type="button" className="sa-outline-button" onClick={() => handleQuickAction('Generate Receipt')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Receipt size={16} /> Generate Receipt
              </button>
              <button type="button" className="sa-outline-button" onClick={() => handleQuickAction('Send Reminder SMS')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} /> Send Reminder SMS
              </button>
              <button type="button" className="sa-outline-button" onClick={() => handleQuickAction('Report Incident')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} /> Report Incident
              </button>
            </div>
          </div>
        </div>

        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-tenant-detail-footer">
            <span className="sa-tenant-detail-updated">
              Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}
            </span>
            <button
              type="button"
              className="sa-primary-cta"
              onClick={() => {
                setEditingClient(c);
                setShowEditClientModal(true);
                setSelectedTenantId(null);
                setTenantDetail(null);
              }}
            >
              Edit tenant
            </button>
          </div>
        </div>

        {/* Maintenance detail modal (when clicking a maintenance in tenant detail) */}
        {(maintenanceDetail != null || maintenanceDetailLoading) && (
          <div className="modal-overlay" onClick={() => { if (!maintenanceDetailLoading) { setMaintenanceDetail(null); } }}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Maintenance request details</h3>
                <button type="button" className="modal-close" onClick={() => setMaintenanceDetail(null)} disabled={maintenanceDetailLoading}>×</button>
              </div>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {maintenanceDetailLoading ? (
                  <p className="sa-cell-sub" style={{ margin: 0 }}>Loading…</p>
                ) : maintenanceDetail ? (
                  <div className="sa-tenant-detail-dl" style={{ display: 'grid', gap: '12px' }}>
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Property</dt><dd style={{ margin: 0 }}>{maintenanceDetail.property ?? maintenanceDetail.Property ?? '—'}</dd></div>
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Tenant</dt><dd style={{ margin: 0 }}>{maintenanceDetail.tenant ?? maintenanceDetail.Tenant ?? '—'}</dd></div>
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Title</dt><dd style={{ margin: 0 }}>{maintenanceDetail.title ?? maintenanceDetail.Title ?? maintenanceDetail.issue ?? maintenanceDetail.Issue ?? '—'}</dd></div>
                    {(maintenanceDetail.description ?? maintenanceDetail.Description) && <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Description</dt><dd style={{ margin: 0 }}>{maintenanceDetail.description ?? maintenanceDetail.Description}</dd></div>}
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Priority</dt><dd style={{ margin: 0 }}><span className={`sa-status-pill ${(maintenanceDetail.priority ?? maintenanceDetail.Priority ?? '').toLowerCase()}`}>{maintenanceDetail.priority ?? maintenanceDetail.Priority ?? '—'}</span></dd></div>
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Status</dt><dd style={{ margin: 0 }}><span className={`sa-status-pill ${(maintenanceDetail.status ?? maintenanceDetail.Status ?? '').toLowerCase().replace(/\s+/g, '-')}`}>{maintenanceDetail.status ?? maintenanceDetail.Status ?? '—'}</span></dd></div>
                    {(maintenanceDetail.assigned ?? maintenanceDetail.Assigned) && <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Assigned to</dt><dd style={{ margin: 0 }}>{maintenanceDetail.assigned ?? maintenanceDetail.Assigned}</dd></div>}
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Date reported</dt><dd style={{ margin: 0 }}>{maintenanceDetail.date ? new Date(maintenanceDetail.date).toLocaleDateString() : (maintenanceDetail.Date ? new Date(maintenanceDetail.Date).toLocaleDateString() : '—')}</dd></div>
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Created</dt><dd style={{ margin: 0 }}>{maintenanceDetail.createdAt ? new Date(maintenanceDetail.createdAt).toLocaleString() : (maintenanceDetail.CreatedAt ? new Date(maintenanceDetail.CreatedAt).toLocaleString() : '—')}</dd></div>
                    {(maintenanceDetail.estimatedHours ?? maintenanceDetail.EstimatedHours) != null && <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Estimated hours</dt><dd style={{ margin: 0 }}>{maintenanceDetail.estimatedHours ?? maintenanceDetail.EstimatedHours}</dd></div>}
                    {(maintenanceDetail.estimatedCost ?? maintenanceDetail.EstimatedCost) != null && <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Estimated cost</dt><dd style={{ margin: 0 }}>{(maintenanceDetail.estimatedCost ?? maintenanceDetail.EstimatedCost).toLocaleString()} XOF</dd></div>}
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Quote generated</dt><dd style={{ margin: 0 }}>{(maintenanceDetail.quoteGenerated ?? maintenanceDetail.QuoteGenerated) ? 'Yes' : 'No'}</dd></div>
                    {(maintenanceDetail.workStartDate ?? maintenanceDetail.WorkStartDate) && <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Work start date</dt><dd style={{ margin: 0 }}>{new Date(maintenanceDetail.workStartDate ?? maintenanceDetail.WorkStartDate).toLocaleDateString()}</dd></div>}
                    {(maintenanceDetail.workEndDate ?? maintenanceDetail.WorkEndDate) && <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Work end date</dt><dd style={{ margin: 0 }}>{new Date(maintenanceDetail.workEndDate ?? maintenanceDetail.WorkEndDate).toLocaleDateString()}</dd></div>}
                    {(maintenanceDetail.completedAt ?? maintenanceDetail.CompletedAt) && <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Completed at</dt><dd style={{ margin: 0 }}>{new Date(maintenanceDetail.completedAt ?? maintenanceDetail.CompletedAt).toLocaleString()}</dd></div>}
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Archived</dt><dd style={{ margin: 0 }}>{(maintenanceDetail.archived ?? maintenanceDetail.Archived) ? 'Yes' : 'No'}</dd></div>
                    {Array.isArray(maintenanceDetail.photos ?? maintenanceDetail.Photos) && (maintenanceDetail.photos ?? maintenanceDetail.Photos).length > 0 && (
                      <div>
                        <dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Photos</dt>
                        <dd style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {(maintenanceDetail.photos ?? maintenanceDetail.Photos).map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                              <img src={url} alt={`Photo ${i + 1}`} style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                            </a>
                          ))}
                        </dd>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Clients list view
  return (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Tenant List</h2>
          <p>{filteredClients.length} results found</p>
        </div>
        <div className="sa-clients-header-right">
          <button
            className="sa-primary-cta"
            onClick={() => {
              setImportMode('manual');
              setExcelFile(null);
              setShowTenantCreationModal(true);
            }}
          >
            <Plus size={16} />
            Add Tenant
          </button>
          <button
            type="button"
            className="sa-primary-cta secondary"
            style={{ marginLeft: '8px' }}
            onClick={() => {
              setImportMode('excel');
              setExcelFile(null);
              setShowTenantCreationModal(true);
            }}
          >
            <FileSpreadsheet size={16} style={{ marginRight: '4px' }} />
            Import from Excel
          </button>
          <button className="sa-sort-button">Sort: Creation Date</button>
          <button className="sa-date-button">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </button>
        </div>
      </div>

      <div className="sa-overview-metrics">
        <div className="sa-metric-card">
          <p className="sa-metric-label">Active Tenants</p>
          <p className="sa-metric-number">
            {filteredClients.filter(client => (client.Status || client.status || '').toString().toLowerCase() === 'active').length}
            <span className="sa-metric-trend positive">+1.5%</span>
          </p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Overdue Accounts</p>
          <p className="sa-metric-number">
            {filteredClients.filter(client => (client.Status || client.status || '').toString().toLowerCase() === 'overdue').length}
            <span className="sa-metric-trend negative">-1.5%</span>
          </p>
          </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Waiting List</p>
          <p className="sa-metric-value">
            {filteredClients.filter(client => {
              const s = (client.Status || client.status || '').toString().toLowerCase().replace(/\s+/g, ' ');
              return s === 'waiting list' || s === 'waitinglist';
            }).length}
          </p>
          </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Total Monthly Revenue</p>
          <p className="sa-metric-value">
              {filteredClients.reduce(
                (sum, client) => sum + (client.Amount || client.amount || 0),
                0
              ).toLocaleString()} XOF
          </p>
        </div>
      </div>

      <div className="sa-transactions-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <Filter size={16} style={{ color: '#6b7280' }} />
        <select
          value={clientStatusFilter}
          onChange={(e) => setClientStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '140px', fontSize: '0.875rem' }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Overdue">Overdue</option>
          <option value="Waiting List">Waiting List</option>
          <option value="Inactive">Inactive</option>
        </select>
        <input
          type="text"
          placeholder="Search by name, email, phone"
          value={clientSearchText}
          onChange={(e) => setClientSearchText(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '200px', fontSize: '0.875rem' }}
          aria-label="Search tenants"
        />
        <input
          type="text"
          placeholder="Filter by property"
          value={clientPropertyFilter}
          onChange={(e) => setClientPropertyFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '180px', fontSize: '0.875rem' }}
          aria-label="Filter by property"
        />
        {(clientStatusFilter || clientPropertyFilter || clientSearchText) && (
          <button
            type="button"
            className="action-button secondary"
            style={{ padding: '8px 14px', fontSize: '0.875rem' }}
            onClick={() => {
              setClientStatusFilter('');
              setClientPropertyFilter('');
              setClientSearchText('');
            }}
          >
            Clear filters
        </button>
        )}
      </div>

      <div className="sa-section-card">
        <div className="sa-section-header">
          <h3>Tenants</h3>
          <p>Manage all tenant profiles and track their status.</p>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
          <thead>
            <tr>
                <th />
                <th>Client</th>
              <th>Property</th>
              <th>Status</th>
              <th>Last Payment</th>
              <th>Amount</th>
              <th>Contact</th>
                <th />
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map(client => {
                const clientId = client.id ?? client.ID;
                return (
              <tr
                key={clientId ?? client.Email ?? client.email}
                onClick={() => clientId != null && setSelectedTenantId(clientId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (clientId != null) setSelectedTenantId(clientId); } }}
                style={{ cursor: clientId != null ? 'pointer' : 'default' }}
              >
                <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" />
                </td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client.Name || client.name || 'N/A'}</span>
                        <span className="sa-cell-sub">{client.Email || client.email || 'N/A'}</span>
                  </div>
                </td>
                    <td>{client.Property || client.property || 'N/A'}</td>
                    <td>
                      <span className={`sa-status-pill ${(client.Status || client.status || 'unknown').toLowerCase().replace(' ', '-')}`}>
                        {client.Status || client.status || 'Unknown'}
                      </span>
                    </td>
                    <td>{(client.LastPayment || client.lastPayment) ? new Date(client.LastPayment || client.lastPayment).toLocaleDateString() : 'N/A'}</td>
                    <td>{(client.Amount || client.amount || 0).toLocaleString()} XOF</td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client.Phone || client.phone || 'N/A'}</span>
                        <span className="sa-cell-sub">{client.Email || client.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="sa-row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="sa-icon-button" onClick={() => handleEditClient(client)} title="Edit">✏️</button>
                </td>
              </tr>
                );
              })
            ) : (
              <tr>
                  <td colSpan={8} className="sa-table-empty">No tenants found. Start the backend to see real data.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Waiting List Section */}
      {waitingListClients.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '24px' }}>
          <div className="sa-section-header">
            <h3>Waiting List Tenants</h3>
            <p>Tenants waiting for available properties.</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th />
                  <th>Tenant</th>
                  <th>Contact</th>
                  <th>Preferred Property</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {waitingListClients.map(client => (
                  <tr key={client.ID || client.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client.Name || client.name || 'N/A'}</span>
                        <span className="sa-cell-sub">{client.Email || client.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{client.Phone || client.phone || 'N/A'}</td>
                    <td>{client.Property || client.property || 'Any'}</td>
                    <td><span className="sa-status-pill pending">Waiting List</span></td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" onClick={() => handleEditClient(client)} title="Edit">✏️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unpaid Rents Section */}
      {unpaidRents.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '24px' }}>
          <div className="sa-section-header">
            <h3>Unpaid Rents</h3>
            <p>Manage overdue payments and update payment status.</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th />
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {unpaidRents.map(unpaid => (
                  <tr key={unpaid.ID || unpaid.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{unpaid.Name || unpaid.ClientName || 'N/A'}</span>
                        <span className="sa-cell-sub">{unpaid.Email || unpaid.ClientEmail || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{unpaid.Property || 'N/A'}</td>
                    <td>{(unpaid.Amount || 0).toLocaleString()} XOF</td>
                    <td>{unpaid.DueDate ? new Date(unpaid.DueDate).toLocaleDateString() : 'N/A'}</td>
                    <td><span className="sa-status-pill overdue">{unpaid.Status || 'Overdue'}</span></td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" onClick={() => handleEditUnpaidRent(unpaid)} title="Update Payment">💰</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsTab;
