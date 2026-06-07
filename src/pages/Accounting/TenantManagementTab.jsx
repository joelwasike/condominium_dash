import React, { useState } from 'react';
import { Search, Download, ArrowLeft, DollarSign, Users, MapPin, Mail, Phone, Receipt } from 'lucide-react';
import { t } from '../../utils/i18n';
import { formatPropertyBuilding, formatTenantName, normalizeAmount } from '../../utils/accountingDisplay';

const getRentAdvanceAmount = (tenant) => (
  normalizeAmount(
    tenant?.RentPaidAdvance ??
    tenant?.rentPaidAdvance ??
    tenant?.AdvanceRent ??
    tenant?.advanceRent ??
    tenant?.RentInAdvance ??
    tenant?.rentInAdvance ??
    tenant?.MonthsPaidInAdvance ??
    tenant?.monthsPaidInAdvance ??
    0
  )
);

const getLateRentAmount = (tenant) => (
  normalizeAmount(tenant?.OutstandingAmount ?? tenant?.outstandingAmount ?? 0)
);

const TenantManagementTab = (props) => {
  const { loading, addNotification, tenants, tenantPayments, selectedTenant, setSelectedTenant, tenantPaymentStatusFilter, setTenantPaymentStatusFilter, tenantNameFilter, setTenantNameFilter } = props;
  const [showAllPayments, setShowAllPayments] = useState(false);

  if (selectedTenant) return renderTenantDetail({ ...props, showAllPayments, setShowAllPayments });

  const filteredTenants = tenants.filter(tenant => {
    if (tenantPaymentStatusFilter === 'up-to-date' && (tenant.PaymentStatus || tenant.paymentStatus) !== 'up-to-date') return false;
    if (tenantPaymentStatusFilter === 'outstanding' && (tenant.PaymentStatus || tenant.paymentStatus) === 'up-to-date') return false;
    if (tenantNameFilter.trim()) { const name = (tenant.TenantName || tenant.tenantName || '').toLowerCase(); if (!name.includes(tenantNameFilter.trim().toLowerCase())) return false; }
    return true;
  });

  const upToDateTenants = tenants.filter(t2 => (t2.PaymentStatus || t2.paymentStatus) === 'up-to-date');
  const outstandingTenants = tenants.filter(t2 => (t2.PaymentStatus || t2.paymentStatus) !== 'up-to-date');

  const exportToCSV = (tenantList, filename) => {
    if (tenantList.length === 0) { addNotification('No tenants to export', 'info'); return; }
    const headers = ['Tenant Name','Phone','Property / Building','Monthly Rent','Rent in Advance','Late Rent','Payment Status','Outstanding Amount','Last Payment Date','Next Payment Due'];
    const rows = tenantList.map(tenant => [
      formatTenantName(tenant, ''),
      (tenant.Phone || tenant.phone || ''),
      formatPropertyBuilding(tenant, ''),
      (tenant.MonthlyRent || tenant.monthlyRent || 0).toFixed(2),
      getRentAdvanceAmount(tenant).toFixed(2),
      (tenant.MonthsInArrears || tenant.monthsInArrears || 0).toString(),
      (tenant.PaymentStatus || tenant.paymentStatus || ''),
      getLateRentAmount(tenant).toFixed(2),
      (tenant.LastPaymentDate || tenant.lastPaymentDate ? new Date(tenant.LastPaymentDate || tenant.lastPaymentDate).toLocaleDateString() : 'N/A'),
      (tenant.NextPaymentDue || tenant.nextPaymentDue ? new Date(tenant.NextPaymentDue || tenant.nextPaymentDue).toLocaleDateString() : 'N/A')
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.setAttribute('href', URL.createObjectURL(blob)); link.setAttribute('download', filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    addNotification(`Exported ${tenantList.length} tenants to ${filename}`, 'success');
  };

  return (
    <div><div className="sa-section-card">
      <div className="sa-section-header">
        <div><h2>Tenants Management</h2><p>{t('accounting.viewAllTenants')}</p></div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="sa-outline-button" onClick={() => exportToCSV(outstandingTenants, `outstanding-tenants-${new Date().toISOString().split('T')[0]}.csv`)} disabled={loading || outstandingTenants.length === 0}><Download size={18} /> Export Outstanding</button>
          <button className="sa-outline-button" onClick={() => exportToCSV(upToDateTenants, `up-to-date-tenants-${new Date().toISOString().split('T')[0]}.csv`)} disabled={loading || upToDateTenants.length === 0}><Download size={18} /> Export Up-to-Date</button>
          <button className="sa-primary-cta" onClick={() => exportToCSV(filteredTenants, `all-tenants-${new Date().toISOString().split('T')[0]}.csv`)} disabled={loading || filteredTenants.length === 0}><Download size={18} /> Export All</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}><p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Tenants</p><p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#166534' }}>{tenants.length}</p></div>
        <div style={{ padding: '20px', backgroundColor: '#ecfeff', borderRadius: '8px', border: '1px solid #67e8f9' }}><p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Rent in Advance</p><p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#0f766e' }}>{tenants.filter((tenant) => getRentAdvanceAmount(tenant) > 0).length}</p></div>
        <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}><p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Up-to-Date</p><p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#059669' }}>{upToDateTenants.length}</p></div>
        <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}><p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Outstanding</p><p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#dc2626' }}>{outstandingTenants.length}</p></div>
        <div style={{ padding: '20px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d' }}><p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Outstanding</p><p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#d97706' }}>{outstandingTenants.reduce((sum, t2) => sum + (t2.OutstandingAmount || t2.outstandingAmount || 0), 0).toFixed(2)} XOF</p></div>
      </div>
      <div className="sa-filters-section" style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Search size={16} style={{ color: '#6b7280' }} /><input type="text" placeholder="Filter by name..." value={tenantNameFilter} onChange={(e) => setTenantNameFilter(e.target.value)} className="sa-filter-select" style={{ minWidth: '200px', padding: '8px 12px' }} /></div>
        <select className="sa-filter-select" value={tenantPaymentStatusFilter} onChange={(e) => setTenantPaymentStatusFilter(e.target.value)}><option value="all">All Tenants</option><option value="up-to-date">Up-to-Date</option><option value="outstanding">Outstanding</option></select>
      </div>
      {loading ? <div className="loading">Loading tenants...</div> : filteredTenants.length === 0 ? <div className="no-data">No tenants found</div> : (
        <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>Tenant Name</th><th>Property / Building</th><th>Monthly Rent</th><th>Rent in Advance</th><th>Late Rent</th><th>Payment Status</th><th>Outstanding Amount</th><th>Last Payment</th></tr></thead><tbody>
          {filteredTenants.map((tenant, index) => {
            const status = tenant.PaymentStatus || tenant.paymentStatus || 'unknown';
            const arrears = tenant.MonthsInArrears || tenant.monthsInArrears || 0;
            const outstanding = getLateRentAmount(tenant);
            const rentInAdvance = getRentAdvanceAmount(tenant);
            let statusClass = 'up-to-date', statusLabel = 'Paid';
            if (status === '1-month') { statusClass = 'warning'; statusLabel = 'Due'; }
            else if (status === '2-months') { statusClass = 'warning'; statusLabel = 'Overdue'; }
            else if (status === '3+months') { statusClass = 'error'; statusLabel = 'Overdue'; }
            return (<tr key={tenant.TenantID || tenant.tenantId || index} onClick={() => setSelectedTenant(tenant)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTenant(tenant); } }} style={{ cursor: 'pointer' }}>
              <td><span className="sa-cell-title">{tenant.TenantName || tenant.tenantName || 'N/A'}</span></td>
              <td>{formatPropertyBuilding(tenant, 'N/A')}</td>
              <td>{(tenant.MonthlyRent || tenant.monthlyRent || 0).toFixed(2)} XOF</td>
              <td style={{ color: rentInAdvance > 0 ? '#059669' : '#6b7280', fontWeight: rentInAdvance > 0 ? '600' : '400' }}>{rentInAdvance.toFixed(2)} XOF</td>
              <td style={{ color: arrears > 0 ? '#dc2626' : '#6b7280', fontWeight: arrears > 0 ? '600' : '400' }}>{arrears}</td>
              <td><span className={`sa-status-pill ${statusClass}`}>{statusLabel}</span></td>
              <td style={{ color: outstanding > 0 ? '#dc2626' : '#059669', fontWeight: '600' }}>{outstanding.toFixed(2)} XOF</td>
              <td>{tenant.LastPaymentDate || tenant.lastPaymentDate ? new Date(tenant.LastPaymentDate || tenant.lastPaymentDate).toLocaleDateString() : 'N/A'}</td>
            </tr>);
          })}
        </tbody></table></div>
      )}
    </div></div>
  );
};

function renderTenantDetail(props) {
  const { selectedTenant: t2, setSelectedTenant, tenantPayments, showAllPayments, setShowAllPayments } = props;
  if (!t2) return (<div className="sa-clients-page"><button type="button" className="sa-outline-button sa-tenant-detail-back-btn" onClick={() => setSelectedTenant(null)} style={{ marginBottom: '16px' }}><ArrowLeft size={16} /> Back to list</button><div className="sa-section-card"><p className="sa-cell-sub" style={{ margin: 0 }}>Tenant not found.</p></div></div>);
  const name = t2.TenantName || t2.tenantName || 'N/A';
  const email = t2.Email || t2.email || '';
  const phone = t2.Phone || t2.phone || '';
  const propertyAddr = t2.Property || t2.property || '-';
  const building = t2.Building || t2.building || '';
  const monthlyRent = t2.MonthlyRent ?? t2.monthlyRent ?? 0;
  const rentInAdvance = getRentAdvanceAmount(t2);
  const paymentStatus = t2.PaymentStatus || t2.paymentStatus || '-';
  const arrears = t2.MonthsInArrears ?? t2.monthsInArrears ?? 0;
  const outstanding = getLateRentAmount(t2);
  const lastPayment = t2.LastPaymentDate || t2.lastPaymentDate;
  const nextDue = t2.NextPaymentDue || t2.nextPaymentDue;
  let statusLabel = 'Paid';
  if (paymentStatus === '1-month') statusLabel = 'Due';
  else if (paymentStatus === '2-months' || paymentStatus === '3+months') statusLabel = 'Overdue';
  const tenantPaymentsFiltered = tenantPayments.filter(p => {
    const pTenant = (p.Tenant || p.tenant || '').toLowerCase();
    const pProperty = (p.Property || p.property || '').toLowerCase();
    const tName = (name || '').toLowerCase();
    const tProp = (propertyAddr || '').toLowerCase();
    return pTenant.includes(tName) || tName.includes(pTenant) || pProperty.includes(tProp) || tProp.includes(pProperty);
  });
  const visiblePayments = showAllPayments ? tenantPaymentsFiltered : tenantPaymentsFiltered.slice(0, 5);

  return (
    <div className="sa-clients-page">
      <div className="sa-clients-header" style={{ marginBottom: '20px' }}><button type="button" className="sa-outline-button sa-tenant-detail-back-btn" onClick={() => setSelectedTenant(null)}><ArrowLeft size={16} /> Back to list</button></div>
      <div className="sa-section-card" style={{ marginBottom: '24px' }}>
        <div className="sa-tenant-detail-hero"><div className="sa-tenant-detail-avatar">{(name || 'T').charAt(0).toUpperCase()}</div><div><h2>{name}</h2><span className={`sa-status-pill ${(statusLabel || '').toLowerCase()}`} style={{ marginRight: '8px' }}>{statusLabel}</span>{propertyAddr && propertyAddr !== '-' && <span className="sa-tenant-detail-meta"><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{propertyAddr}{building ? ` . ${building}` : ''}</span>}</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)', gap: '24px', alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="sa-section-card sa-tenant-detail-card"><h3><Users size={18} /> Personal information</h3><dl className="sa-tenant-detail-dl"><div><dt>Name</dt><dd>{name}</dd></div>{email && <div><dt>Email</dt><dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {email}</dd></div>}{phone && <div><dt>Phone</dt><dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {phone}</dd></div>}<div><dt>Payment status</dt><dd><span className={`sa-status-pill ${(statusLabel || '').toLowerCase()}`}>{statusLabel}</span></dd></div><div><dt>Months in arrears</dt><dd>{arrears}</dd></div></dl></div>
          <div className="sa-section-card sa-tenant-detail-card"><h3><DollarSign size={18} /> Rent & payment</h3><dl className="sa-tenant-detail-dl"><div><dt>Property</dt><dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {propertyAddr}</dd></div>{building && <div><dt>Building</dt><dd>{building}</dd></div>}<div><dt>Monthly rent</dt><dd className="sa-tenant-detail-value-bold">{Number(monthlyRent).toLocaleString()} XOF</dd></div><div><dt>Rent in advance</dt><dd style={{ color: rentInAdvance > 0 ? '#059669' : '#6b7280', fontWeight: '600' }}>{Number(rentInAdvance).toLocaleString()} XOF</dd></div><div><dt>Late rent</dt><dd style={{ color: outstanding > 0 ? '#dc2626' : '#059669', fontWeight: '600' }}>{Number(outstanding).toLocaleString()} XOF</dd></div><div><dt>Last payment</dt><dd>{lastPayment ? new Date(lastPayment).toLocaleDateString() : '-'}</dd></div>{nextDue && <div><dt>Next payment due</dt><dd>{new Date(nextDue).toLocaleDateString()}</dd></div>}</dl></div>
        </div>
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="sa-section-card sa-tenant-detail-card">
            <h3><Receipt size={18} /> Recent payment history</h3>
            {tenantPaymentsFiltered.length > 0 ? (<><ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>{visiblePayments.map((p, idx) => (<li key={p.ID || p.id || idx} className="sa-tenant-detail-alert-item" style={{ borderLeftColor: (p.Status || p.status) === 'Approved' ? '#16a34a' : '#f59e0b' }}><div className="sa-tenant-detail-alert-title">{Number(p.Amount ?? p.amount ?? 0).toLocaleString()} XOF . {(p.ChargeType || p.chargeType || '-')} . {(p.Status || p.status || '-')}</div><div className="sa-tenant-detail-alert-meta">{p.Date ? new Date(p.Date).toLocaleDateString() : (p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString() : '-')}{(p.Method || p.method) && ` . ${p.Method || p.method}`}</div></li>))}</ul>{tenantPaymentsFiltered.length > 5 && <div style={{ marginTop: '12px' }}><button type="button" className="sa-outline-button" onClick={() => setShowAllPayments((value) => !value)}>{showAllPayments ? 'Show less' : 'See more'}</button></div>}</>) : <p className="sa-cell-sub">No payment history for this tenant.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TenantManagementTab;
