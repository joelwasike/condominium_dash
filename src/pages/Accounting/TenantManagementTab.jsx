import React, { useState } from 'react';
import {
  Search,
  Download,
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Building,
  AlertTriangle,
  Wrench,
  FileCheck,
  StickyNote,
  Receipt,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { salesManagerService } from '../../services/salesManagerService';
import { useEffect } from 'react';

/* ── helpers ── */

const getTenantId = (t) => t?.TenantID ?? t?.tenantId ?? t?.id ?? t?.ID ?? null;

const statusPill = (status) => {
  const s = (status || '').toLowerCase().replace(/\s+/g, '-');
  const map = {
    active:              { bg: '#dcfce7', c: '#166534' },
    'up-to-date':        { bg: '#dcfce7', c: '#166534' },
    overdue:             { bg: '#fee2e2', c: '#991b1b' },
    '1-month':           { bg: '#fef3c7', c: '#92400e' },
    '2-months':          { bg: '#fee2e2', c: '#991b1b' },
    '3+months':          { bg: '#fee2e2', c: '#991b1b' },
    inactive:            { bg: '#f1f5f9', c: '#475569' },
    'waiting-list':      { bg: '#e0f2fe', c: '#075985' },
  };
  const { bg, c } = map[s] || { bg: '#f1f5f9', c: '#475569' };
  return {
    display: 'inline-block', padding: '4px 12px', borderRadius: '999px',
    fontSize: '0.75rem', fontWeight: 600, background: bg, color: c,
  };
};

// Map accounting paymentStatus to a human label matching sales manager vocabulary
const statusLabel = (paymentStatus) => {
  switch ((paymentStatus || '').toLowerCase()) {
    case 'up-to-date': return 'Active';
    case '1-month':    return 'Overdue';
    case '2-months':   return 'Overdue';
    case '3+months':   return 'Overdue';
    default:           return paymentStatus || 'Unknown';
  }
};

// Map accounting paymentStatus to the pill key used by statusPill
const statusKey = (paymentStatus) => {
  switch ((paymentStatus || '').toLowerCase()) {
    case 'up-to-date': return 'active';
    case '1-month':    return '1-month';
    case '2-months':   return '2-months';
    case '3+months':   return '3+months';
    default:           return paymentStatus || 'unknown';
  }
};

const card = {
  background: '#fff', borderRadius: '16px', padding: '20px',
  boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9',
};
const dlItem    = { marginBottom: '12px' };
const dtStyle   = { fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px', fontWeight: 500 };
const ddStyle   = { margin: 0, fontSize: '0.9rem', color: '#1e293b' };
const alertItem = { padding: '12px 14px', borderRadius: '10px', background: '#f8fafc', borderLeft: '3px solid #3b82f6' };
const alertTitle  = { fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', marginBottom: '2px' };
const alertMeta   = { fontSize: '0.78rem', color: '#94a3b8' };
const sectionTitle = { margin: 0, fontSize: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' };
const subText   = { margin: 0, fontSize: '0.85rem', color: '#94a3b8' };
const backBtn   = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 };
const btnPrimary = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' };
const btnOutline = { padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer' };

/* ════════════════════════════════════════════════════════════
   Main list view
════════════════════════════════════════════════════════════ */
const TenantManagementTab = (props) => {
  const { loading, addNotification, tenants = [], tenantPayments = [] } = props;

  const [selectedTenant, setSelectedTenant]   = useState(null);
  const [statusFilter, setStatusFilter]         = useState('');
  const [searchText, setSearchText]             = useState('');
  const [propertyFilter, setPropertyFilter]     = useState('');
  const [showAllPayments, setShowAllPayments]   = useState(false);

  const getName  = (t) => t.TenantName  || t.tenantName  || t.Name  || t.name  || '';
  const getEmail = (t) => t.Email       || t.email       || '';
  const getPhone = (t) => t.Phone       || t.phone       || '';
  const getProp  = (t) => t.Property    || t.property    || '';
  const getPS    = (t) => t.PaymentStatus || t.paymentStatus || '';
  const getLP    = (t) => t.LastPaymentDate || t.lastPaymentDate || null;
  const getAmt   = (t) => t.MonthlyRent || t.monthlyRent || t.Amount || t.amount || 0;

  const filtered = tenants.filter((t) => {
    const ps = getPS(t).toLowerCase();
    if (statusFilter === 'Active'   && ps !== 'up-to-date') return false;
    if (statusFilter === 'Overdue'  && !['1-month','2-months','3+months'].includes(ps)) return false;
    if (propertyFilter.trim() && !getProp(t).toLowerCase().includes(propertyFilter.trim().toLowerCase())) return false;
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      if (!getName(t).toLowerCase().includes(q) &&
          !getEmail(t).toLowerCase().includes(q) &&
          !getPhone(t).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeCount  = tenants.filter(t => getPS(t).toLowerCase() === 'up-to-date').length;
  const overdueCount = tenants.filter(t => ['1-month','2-months','3+months'].includes(getPS(t).toLowerCase())).length;
  const totalRevenue = tenants.reduce((s, t) => s + getAmt(t), 0);

  const exportCSV = () => {
    if (filtered.length === 0) { addNotification('No tenants to export', 'info'); return; }
    const headers = ['Name', 'Email', 'Phone', 'Property', 'Status', 'Last Payment', 'Monthly Rent (XOF)'];
    const rows = filtered.map(t => [
      getName(t), getEmail(t), getPhone(t), getProp(t),
      statusLabel(getPS(t)),
      getLP(t) ? new Date(getLP(t)).toLocaleDateString() : '',
      String(getAmt(t)),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `tenants-${new Date().toISOString().split('T')[0]}.csv`;
    a.style.visibility = 'hidden';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    addNotification(`Exported ${filtered.length} tenants`, 'success');
  };

  if (selectedTenant) {
    return (
      <TenantDetailView
        selectedTenant={selectedTenant}
        setSelectedTenant={setSelectedTenant}
        tenantPayments={tenantPayments}
        addNotification={addNotification}
        showAllPayments={showAllPayments}
        setShowAllPayments={setShowAllPayments}
      />
    );
  }

  return (
    <div className="sa-clients-page">
      {/* Header */}
      <div className="sa-clients-header">
        <div>
          <h2>Tenant Management</h2>
          <p>{filtered.length} tenant{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="sa-outline-button" onClick={exportCSV} disabled={loading || filtered.length === 0}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="sa-overview-metrics">
        <div className="sa-metric-card">
          <p className="sa-metric-label">Active Tenants</p>
          <p className="sa-metric-number">{activeCount}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Overdue Accounts</p>
          <p className="sa-metric-number">{overdueCount}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Total Tenants</p>
          <p className="sa-metric-value">{tenants.length}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Total Monthly Revenue</p>
          <p className="sa-metric-value">{totalRevenue.toLocaleString()} XOF</p>
        </div>
      </div>

      {/* Filters */}
      <div className="sa-transactions-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <Search size={16} style={{ color: '#6b7280' }} />
        <input
          type="text"
          placeholder="Search by name, email or phone"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '220px', fontSize: '0.875rem' }}
        />
        <input
          type="text"
          placeholder="Filter by property"
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '180px', fontSize: '0.875rem' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '140px', fontSize: '0.875rem' }}
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Overdue">Overdue</option>
        </select>
        {(statusFilter || propertyFilter || searchText) && (
          <button
            type="button"
            className="action-button secondary"
            style={{ padding: '8px 14px', fontSize: '0.875rem' }}
            onClick={() => { setStatusFilter(''); setPropertyFilter(''); setSearchText(''); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="sa-section-card">
        <div className="sa-section-header">
          <h3>Tenants</h3>
          <p>Click a row to view full tenant details.</p>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Property</th>
                <th>Status</th>
                <th>Last Payment</th>
                <th>Monthly Rent</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="sa-table-empty">Loading tenants…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="sa-table-empty">No tenants found.</td></tr>
              ) : filtered.map((tenant, idx) => {
                const id  = getTenantId(tenant);
                const ps  = getPS(tenant);
                const lp  = getLP(tenant);
                return (
                  <tr
                    key={id ?? idx}
                    onClick={() => setSelectedTenant(tenant)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTenant(tenant); } }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{getName(tenant) || 'N/A'}</span>
                        <span className="sa-cell-sub">{getEmail(tenant)}</span>
                      </div>
                    </td>
                    <td>{getProp(tenant) || 'N/A'}</td>
                    <td>
                      <span style={statusPill(statusKey(ps))}>
                        {statusLabel(ps)}
                      </span>
                    </td>
                    <td>{lp ? new Date(lp).toLocaleDateString() : 'N/A'}</td>
                    <td>{getAmt(tenant).toLocaleString()} XOF</td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{getPhone(tenant) || 'N/A'}</span>
                        <span className="sa-cell-sub">{getEmail(tenant)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   Detail view (same rich view as before)
════════════════════════════════════════════════════════════ */
const TenantDetailView = ({ selectedTenant, setSelectedTenant, tenantPayments, addNotification, showAllPayments, setShowAllPayments }) => {
  const [tenantDetail, setTenantDetail]             = useState(null);
  const [tenantDetailLoading, setTenantDetailLoading] = useState(false);
  const [privateNoteInput, setPrivateNoteInput]     = useState('');
  const [addingNote, setAddingNote]                 = useState(false);
  const [maintenanceDetail, setMaintenanceDetail]   = useState(null);
  const [maintenanceDetailLoading, setMaintenanceDetailLoading] = useState(false);

  const selectedTenantId = getTenantId(selectedTenant);

  useEffect(() => {
    if (!selectedTenantId) { setTenantDetail({ client: selectedTenant }); return; }
    let cancelled = false;
    setTenantDetailLoading(true);
    salesManagerService.getClient(selectedTenantId)
      .then((data) => { if (!cancelled) setTenantDetail(data); })
      .catch(() => { if (!cancelled) setTenantDetail({ client: selectedTenant }); })
      .finally(() => { if (!cancelled) setTenantDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTenant, selectedTenantId]);

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

  const tenant = tenantDetail?.client || selectedTenant || {};

  if (tenantDetailLoading) {
    return <div style={{ ...card, padding: '48px', textAlign: 'center' }}><p style={subText}>Loading tenant details…</p></div>;
  }

  const alertList        = Array.isArray(tenantDetail?.alerts)       ? tenantDetail.alerts        : [];
  const maintenancesList = Array.isArray(tenantDetail?.maintenances) ? tenantDetail.maintenances  : [];
  const privateNotesList = Array.isArray(tenantDetail?.privateNotes) ? tenantDetail.privateNotes  : [];
  const paymentsList = Array.isArray(tenantDetail?.payments)
    ? tenantDetail.payments
    : (Array.isArray(tenantPayments)
        ? tenantPayments.filter(p => {
            const pt  = (p.Tenant || p.tenant || '').toLowerCase();
            const tn  = (tenant.TenantName || tenant.tenantName || tenant.Name || tenant.name || '').toLowerCase();
            return pt.includes(tn) || tn.includes(pt);
          })
        : []);

  const accounting           = tenantDetail?.accounting || {};
  const depositPaidAmount    = tenantDetail?.deposit?.paidAmount ?? null;
  const depositStatus        = tenantDetail?.deposit?.status ?? null;
  const rentPaidInAdvance    = accounting.rentPaidInAdvance ?? null;
  const unpaidRentAmount     = accounting.unpaidRentAmount ?? null;
  const numberOfMonthsUnpaid = accounting.numberOfMonthsUnpaid ?? null;
  const penaltyToPay         = accounting.penaltyToPay ?? null;
  const balanceToPayEstimate = accounting.balanceToPayEstimate ?? null;

  const name        = tenant.TenantName || tenant.tenantName || tenant.Name || tenant.name || 'N/A';
  const email       = tenant.Email || tenant.email || '';
  const phone       = tenant.Phone || tenant.phone || '';
  const status      = tenant.Status || tenant.status || tenant.PaymentStatus || tenant.paymentStatus || 'Unknown';
  const propertyAddr = tenant.Property || tenant.property || '—';
  const unitNumber  = tenant.UnitNumber ?? tenant.unitNumber ?? '—';
  const amount      = tenant.MonthlyRent ?? tenant.monthlyRent ?? tenant.Amount ?? tenant.amount ?? 0;
  const lastPayment = tenant.LastPaymentDate ?? tenant.lastPaymentDate ?? tenant.LastPayment ?? tenant.lastPayment;
  const updatedAt   = tenant.UpdatedAt ?? tenant.updatedAt;

  const visiblePayments = showAllPayments ? paymentsList : paymentsList.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          style={backBtn}
          onClick={() => { setSelectedTenant(null); setTenantDetail(null); setShowAllPayments(false); }}
        >
          <ArrowLeft size={16} /> Back to list
        </button>
      </div>

      {/* Header */}
      <div style={{ ...card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 700, flexShrink: 0 }}>
            {(name || 'T').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>{name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
              <span style={statusPill(statusKey(status))}>{statusLabel(status)}</span>
              {propertyAddr && propertyAddr !== '—' && (
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} />{propertyAddr}{unitNumber && unitNumber !== '—' ? ` · ${unitNumber}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Personal info */}
        <div style={card}>
          <h3 style={sectionTitle}><Users size={18} /> Personal information</h3>
          <div style={{ marginTop: '16px' }}>
            <div style={dlItem}><div style={dtStyle}>Name</div><div style={ddStyle}>{name}</div></div>
            {email && <div style={dlItem}><div style={dtStyle}>Email</div><div style={{ ...ddStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} />{email}</div></div>}
            {phone && <div style={dlItem}><div style={dtStyle}>Phone</div><div style={{ ...ddStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} />{phone}</div></div>}
            <div style={dlItem}><div style={dtStyle}>Status</div><div style={ddStyle}><span style={statusPill(statusKey(status))}>{statusLabel(status)}</span></div></div>
          </div>
          <h4 style={{ margin: '16px 0 8px', fontSize: '0.9rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCheck size={16} /> Files &amp; documents
          </h4>
          <p style={subText}>No files uploaded yet.</p>
        </div>

        {/* Rent & payment */}
        <div style={card}>
          <h3 style={sectionTitle}><DollarSign size={18} /> Rent &amp; payment</h3>
          <div style={{ marginTop: '16px' }}>
            <div style={dlItem}><div style={dtStyle}>Property</div><div style={{ ...ddStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} />{propertyAddr}</div></div>
            {unitNumber && unitNumber !== '—' && <div style={dlItem}><div style={dtStyle}>Unit</div><div style={ddStyle}>{unitNumber}</div></div>}
            <div style={dlItem}><div style={dtStyle}>Monthly rent</div><div style={{ ...ddStyle, fontWeight: 700, fontSize: '1.1rem' }}>{Number(amount).toLocaleString()} XOF</div></div>
            {depositPaidAmount != null && <div style={dlItem}><div style={dtStyle}>Deposit paid{depositStatus ? ` (${depositStatus})` : ''}</div><div style={ddStyle}>{Number(depositPaidAmount).toLocaleString()} XOF</div></div>}
            {rentPaidInAdvance != null && Number(rentPaidInAdvance) > 0 && <div style={dlItem}><div style={dtStyle}>Rent paid in advance</div><div style={ddStyle}>{Number(rentPaidInAdvance).toLocaleString()} XOF</div></div>}
            {unpaidRentAmount != null && Number(unpaidRentAmount) > 0 && <div style={dlItem}><div style={dtStyle}>Unpaid rent</div><div style={ddStyle}>{Number(unpaidRentAmount).toLocaleString()} XOF</div></div>}
            {numberOfMonthsUnpaid != null && Number(numberOfMonthsUnpaid) > 0 && <div style={dlItem}><div style={dtStyle}>Months unpaid</div><div style={ddStyle}>{Number(numberOfMonthsUnpaid)}</div></div>}
            {penaltyToPay != null && Number(penaltyToPay) > 0 && <div style={dlItem}><div style={dtStyle}>Penalty</div><div style={ddStyle}>{Number(penaltyToPay).toLocaleString()} XOF</div></div>}
            {balanceToPayEstimate != null && Number(balanceToPayEstimate) > 0 && <div style={dlItem}><div style={dtStyle}>Balance to pay</div><div style={{ ...ddStyle, fontWeight: 700 }}>{Number(balanceToPayEstimate).toLocaleString()} XOF</div></div>}
            <div style={dlItem}><div style={dtStyle}>Last payment</div><div style={ddStyle}>{lastPayment ? new Date(lastPayment).toLocaleDateString() : '—'}</div></div>
          </div>
        </div>

        {/* Property details */}
        <div style={card}>
          <h3 style={sectionTitle}><Building size={18} /> Property details</h3>
          <div style={{ marginTop: '16px' }}>
            <div style={dlItem}><div style={dtStyle}>Address</div><div style={ddStyle}>{propertyAddr}</div></div>
            {unitNumber && unitNumber !== '—' && <div style={dlItem}><div style={dtStyle}>Unit</div><div style={ddStyle}>{unitNumber}</div></div>}
          </div>
        </div>

        {/* Alerts */}
        <div style={card}>
          <h3 style={sectionTitle}><AlertTriangle size={18} /> Alerts &amp; activity</h3>
          {alertList.length > 0 ? (
            <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alertList.map((alert, idx) => (
                <li key={alert.ID || idx} style={alertItem}>
                  <div style={alertTitle}>{alert.Title || alert.title || 'Alert'}</div>
                  {alert.Message && <div style={{ ...subText, marginBottom: '4px' }}>{alert.Message}</div>}
                  <div style={alertMeta}>{(alert.Urgency || '').toLowerCase()} · {alert.Status || 'Open'}{alert.Amount != null ? ` · ${Number(alert.Amount).toLocaleString()} XOF` : ''}</div>
                </li>
              ))}
            </ul>
          ) : <p style={{ ...subText, marginTop: '12px' }}>No alerts for this tenant.</p>}
        </div>

        {/* Maintenance */}
        <div style={card}>
          <h3 style={sectionTitle}><Wrench size={18} /> Maintenance requests</h3>
          {maintenancesList.length > 0 ? (
            <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {maintenancesList.map((m, idx) => {
                const mid = m.ID ?? m.id;
                const open = () => {
                  if (mid == null) return;
                  setMaintenanceDetailLoading(true);
                  setMaintenanceDetail(null);
                  salesManagerService.getMaintenance(mid)
                    .then((data) => setMaintenanceDetail(data))
                    .catch((err) => addNotification(err?.message || 'Failed to load', 'error'))
                    .finally(() => setMaintenanceDetailLoading(false));
                };
                return (
                  <li key={mid ?? idx} style={{ ...alertItem, cursor: 'pointer' }} role="button" tabIndex={0} onClick={open} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}>
                    <div style={alertTitle}>{m.Issue || m.issue || 'Maintenance'}</div>
                    <div style={alertMeta}>{m.Status || m.status || '—'} · {m.Priority || m.priority || '—'}{m.CreatedAt ? ` · ${new Date(m.CreatedAt).toLocaleDateString()}` : ''}</div>
                  </li>
                );
              })}
            </ul>
          ) : <p style={{ ...subText, marginTop: '12px' }}>No maintenance requests.</p>}
        </div>

        {/* Payment history */}
        <div style={card}>
          <h3 style={sectionTitle}><Receipt size={18} /> Recent payment history</h3>
          {paymentsList.length > 0 ? (
            <>
              <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {visiblePayments.map((p, idx) => (
                  <li key={p.ID || idx} style={{ ...alertItem, borderLeftColor: (p.Status || p.status) === 'Approved' ? '#16a34a' : '#f59e0b' }}>
                    <div style={alertTitle}>{Number(p.Amount ?? p.amount ?? 0).toLocaleString()} XOF · {p.Status || p.status || '—'}</div>
                    <div style={alertMeta}>{p.Date ? new Date(p.Date).toLocaleDateString() : (p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString() : '—')}{(p.Method || p.method) ? ` · ${p.Method || p.method}` : ''}</div>
                  </li>
                ))}
              </ul>
              {paymentsList.length > 5 && (
                <div style={{ marginTop: '12px' }}>
                  <button type="button" className="sa-outline-button" onClick={() => setShowAllPayments(v => !v)}>
                    {showAllPayments ? 'Show less' : 'See more'}
                  </button>
                </div>
              )}
            </>
          ) : <p style={{ ...subText, marginTop: '12px' }}>No payment history.</p>}
        </div>

        {/* Private notes */}
        <div style={card}>
          <h3 style={sectionTitle}><StickyNote size={18} /> Private notes</h3>
          <textarea
            value={privateNoteInput}
            onChange={(e) => setPrivateNoteInput(e.target.value)}
            placeholder="Add a note (visible to internal staff only)…"
            rows={2}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.875rem', resize: 'vertical', marginTop: '12px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <button type="button" style={{ ...btnPrimary, marginBottom: '16px' }} onClick={handleAddPrivateNote} disabled={!privateNoteInput.trim() || addingNote}>
            {addingNote ? 'Adding…' : 'Add note'}
          </button>
          {privateNotesList.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {privateNotesList.map((n) => (
                <li key={n.id ?? n.ID} style={{ ...alertItem, borderLeftColor: '#6366f1' }}>
                  <div style={alertTitle}>{n.note ?? n.Note}</div>
                  <div style={alertMeta}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : (n.CreatedAt ? new Date(n.CreatedAt).toLocaleString() : '')}</div>
                </li>
              ))}
            </ul>
          ) : <p style={{ ...subText, marginTop: '0' }}>No private notes yet.</p>}
        </div>

        {/* Quick actions */}
        <div style={card}>
          <h3 style={sectionTitle}><AlertCircle size={18} /> Quick actions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
            <button type="button" style={{ ...btnOutline, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => addNotification('Generate Receipt – coming soon', 'info')}>
              <Receipt size={16} /> Generate Receipt
            </button>
            <button type="button" style={{ ...btnOutline, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => addNotification('Send Reminder SMS – coming soon', 'info')}>
              <MessageSquare size={16} /> Send Reminder SMS
            </button>
            <button type="button" style={{ ...btnOutline, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => addNotification('Report Incident – coming soon', 'info')}>
              <AlertCircle size={16} /> Report Incident
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...card, marginTop: '20px' }}>
        <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
          Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}
        </span>
      </div>

      {/* Maintenance detail modal */}
      {(maintenanceDetail != null || maintenanceDetailLoading) && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => { if (!maintenanceDetailLoading) setMaintenanceDetail(null); }}
        >
          <div
            style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Maintenance details</h3>
              <button type="button" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setMaintenanceDetail(null)}>×</button>
            </div>
            {maintenanceDetailLoading
              ? <p style={subText}>Loading…</p>
              : maintenanceDetail
                ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div><div style={dtStyle}>Property</div><div style={ddStyle}>{maintenanceDetail.property ?? maintenanceDetail.Property ?? '—'}</div></div>
                    <div><div style={dtStyle}>Issue</div><div style={ddStyle}>{maintenanceDetail.issue ?? maintenanceDetail.Issue ?? '—'}</div></div>
                    <div><div style={dtStyle}>Priority</div><div style={ddStyle}><span style={statusPill((maintenanceDetail.priority ?? maintenanceDetail.Priority ?? '').toLowerCase())}>{maintenanceDetail.priority ?? maintenanceDetail.Priority ?? '—'}</span></div></div>
                    <div><div style={dtStyle}>Status</div><div style={ddStyle}><span style={statusPill((maintenanceDetail.status ?? maintenanceDetail.Status ?? '').toLowerCase())}>{maintenanceDetail.status ?? maintenanceDetail.Status ?? '—'}</span></div></div>
                    {(maintenanceDetail.assigned ?? maintenanceDetail.Assigned) && <div><div style={dtStyle}>Assigned to</div><div style={ddStyle}>{maintenanceDetail.assigned ?? maintenanceDetail.Assigned}</div></div>}
                    <div><div style={dtStyle}>Date</div><div style={ddStyle}>{maintenanceDetail.date ? new Date(maintenanceDetail.date).toLocaleDateString() : (maintenanceDetail.Date ? new Date(maintenanceDetail.Date).toLocaleDateString() : '—')}</div></div>
                    {(maintenanceDetail.estimatedCost ?? maintenanceDetail.EstimatedCost) != null && <div><div style={dtStyle}>Estimated cost</div><div style={ddStyle}>{Number(maintenanceDetail.estimatedCost ?? maintenanceDetail.EstimatedCost).toLocaleString()} XOF</div></div>}
                  </div>
                )
                : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagementTab;
