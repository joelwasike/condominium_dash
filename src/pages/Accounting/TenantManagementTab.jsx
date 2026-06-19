import React, { useEffect, useState } from 'react';
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
import { normalizeAmount } from '../../utils/accountingDisplay';

const getTenantId = (tenant) => tenant?.TenantID ?? tenant?.tenantId ?? tenant?.id ?? tenant?.ID ?? null;

const getRentAdvanceAmount = (tenant) => (
  normalizeAmount(
    tenant?.RentPaidAdvance ?? tenant?.rentPaidAdvance ?? tenant?.AdvanceRent ??
    tenant?.advanceRent ?? tenant?.RentInAdvance ?? tenant?.rentInAdvance ??
    tenant?.MonthsPaidInAdvance ?? tenant?.monthsPaidInAdvance ?? 0
  )
);

const getLateRentAmount = (tenant) => (
  normalizeAmount(tenant?.OutstandingAmount ?? tenant?.outstandingAmount ?? 0)
);

const statusPill = (status) => {
  const s = (status || '').toString().toLowerCase().replace(/\s+/g, '-');
  const map = {
    occupied: { bg: '#dcfce7', c: '#166534' },
    vacant: { bg: '#fef3c7', c: '#92400e' },
    active: { bg: '#dcfce7', c: '#166534' },
    inactive: { bg: '#fee2e2', c: '#991b1b' },
    pending: { bg: '#fef3c7', c: '#92400e' },
    completed: { bg: '#dcfce7', c: '#166534' },
    available: { bg: '#dbeafe', c: '#1d4ed8' },
    sold: { bg: '#f3e8ff', c: '#7c3aed' },
    rented: { bg: '#d1fae5', c: '#065f46' },
    warning: { bg: '#fef3c7', c: '#92400e' },
    error: { bg: '#fee2e2', c: '#991b1b' },
    due: { bg: '#fef3c7', c: '#92400e' },
    overdue: { bg: '#fee2e2', c: '#991b1b' },
    'waiting-list': { bg: '#e0f2fe', c: '#075985' },
    'partially-occupied': { bg: '#e0f2fe', c: '#075985' },
  };
  const { bg, c } = map[s] || { bg: '#f1f5f9', c: '#475569' };
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: bg, color: c };
};

const card = { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
const dlItem = { marginBottom: '12px' };
const dtStyle = { fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px', fontWeight: 500 };
const ddStyle = { margin: 0, fontSize: '0.9rem', color: '#1e293b' };
const alertItem = { padding: '12px 14px', borderRadius: '10px', background: '#f8fafc', borderLeft: '3px solid #3b82f6' };
const alertTitle = { fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', marginBottom: '2px' };
const alertMeta = { fontSize: '0.78rem', color: '#94a3b8' };
const sectionTitle = { margin: 0, fontSize: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' };
const subText = { margin: 0, fontSize: '0.85rem', color: '#94a3b8' };
const backBtn = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 };
const btnPrimary = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' };
const btnOutline = { padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer' };

const TenantManagementTab = (props) => {
  const { loading: parentLoading, addNotification, tenantPayments } = props;

  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [showAllPayments, setShowAllPayments] = useState(false);

  useEffect(() => {
    setClientsLoading(true);
    salesManagerService.getClients()
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]))
      .finally(() => setClientsLoading(false));
  }, []);

  const filteredClients = clients.filter((c) => {
    const s = (c.Status || c.status || '').toString().toLowerCase().trim();
    if (statusFilter && s !== statusFilter.toLowerCase()) return false;
    if (propertyFilter.trim()) {
      const prop = (c.Property || c.property || '').toLowerCase();
      if (!prop.includes(propertyFilter.trim().toLowerCase())) return false;
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      const name = (c.Name || c.name || '').toLowerCase();
      const email = (c.Email || c.email || '').toLowerCase();
      const phone = (c.Phone || c.phone || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !phone.includes(q)) return false;
    }
    return true;
  });

  const activeCount = filteredClients.filter(c => (c.Status || c.status || '').toLowerCase() === 'active').length;
  const overdueCount = filteredClients.filter(c => (c.Status || c.status || '').toLowerCase() === 'overdue').length;
  const waitingCount = filteredClients.filter(c => {
    const s = (c.Status || c.status || '').toLowerCase().replace(/\s+/g, ' ');
    return s === 'waiting list' || s === 'waitinglist';
  }).length;
  const totalRevenue = filteredClients.reduce((sum, c) => sum + (c.Amount || c.amount || 0), 0);

  const waitingListClients = filteredClients.filter(c => {
    const s = (c.Status || c.status || '').toLowerCase().replace(/\s+/g, ' ');
    return s === 'waiting list' || s === 'waitinglist';
  });
  const mainTableClients = filteredClients.filter(c => {
    const s = (c.Status || c.status || '').toLowerCase().replace(/\s+/g, ' ');
    return s !== 'waiting list' && s !== 'waitinglist';
  });

  const exportCSV = () => {
    if (filteredClients.length === 0) { addNotification('No tenants to export', 'info'); return; }
    const headers = ['Name', 'Email', 'Phone', 'Property', 'Status', 'Last Payment', 'Amount (XOF)'];
    const rows = filteredClients.map(c => [
      c.Name || c.name || '',
      c.Email || c.email || '',
      c.Phone || c.phone || '',
      c.Property || c.property || '',
      c.Status || c.status || '',
      (c.LastPayment || c.lastPayment) ? new Date(c.LastPayment || c.lastPayment).toLocaleDateString() : '',
      (c.Amount || c.amount || 0).toString(),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `tenants-${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification(`Exported ${filteredClients.length} tenants`, 'success');
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

  const isLoading = parentLoading || clientsLoading;

  return (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Tenant Management</h2>
          <p>{filteredClients.length} tenant{filteredClients.length !== 1 ? 's' : ''} found</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="sa-outline-button" onClick={exportCSV} disabled={isLoading || filteredClients.length === 0}>
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
          <p className="sa-metric-label">Waiting List</p>
          <p className="sa-metric-value">{waitingCount}</p>
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
          <option value="Waiting List">Waiting List</option>
          <option value="Inactive">Inactive</option>
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

      {/* Main tenant table */}
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
                <th>Amount</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="sa-table-empty">Loading tenants...</td></tr>
              ) : mainTableClients.length === 0 ? (
                <tr><td colSpan={6} className="sa-table-empty">No tenants found.</td></tr>
              ) : mainTableClients.map((client) => {
                const clientId = client.id ?? client.ID;
                return (
                  <tr
                    key={clientId ?? client.Email ?? client.email}
                    onClick={() => setSelectedTenant(client)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTenant(client); } }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client.Name || client.name || 'N/A'}</span>
                        <span className="sa-cell-sub">{client.Email || client.email || ''}</span>
                      </div>
                    </td>
                    <td>{client.Property || client.property || 'N/A'}</td>
                    <td>
                      <span style={statusPill(client.Status || client.status || 'unknown')}>
                        {client.Status || client.status || 'Unknown'}
                      </span>
                    </td>
                    <td>{(client.LastPayment || client.lastPayment) ? new Date(client.LastPayment || client.lastPayment).toLocaleDateString() : 'N/A'}</td>
                    <td>{(client.Amount || client.amount || 0).toLocaleString()} XOF</td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client.Phone || client.phone || 'N/A'}</span>
                        <span className="sa-cell-sub">{client.Email || client.email || ''}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waiting list */}
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
                  <th>Tenant</th>
                  <th>Contact</th>
                  <th>Preferred Property</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {waitingListClients.map((client) => (
                  <tr
                    key={client.ID || client.id}
                    onClick={() => setSelectedTenant(client)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client.Name || client.name || 'N/A'}</span>
                        <span className="sa-cell-sub">{client.Email || client.email || ''}</span>
                      </div>
                    </td>
                    <td>{client.Phone || client.phone || 'N/A'}</td>
                    <td>{client.Property || client.property || 'Any'}</td>
                    <td><span style={statusPill('waiting-list')}>Waiting List</span></td>
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

/* ── Detail view (unchanged from original, kept rich) ───────────────────── */

const TenantDetailView = ({ selectedTenant, setSelectedTenant, tenantPayments, addNotification, showAllPayments, setShowAllPayments }) => {
  const [tenantDetail, setTenantDetail] = useState(null);
  const [tenantDetailLoading, setTenantDetailLoading] = useState(false);
  const [privateNoteInput, setPrivateNoteInput] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [maintenanceDetail, setMaintenanceDetail] = useState(null);
  const [maintenanceDetailLoading, setMaintenanceDetailLoading] = useState(false);
  const [resolvedProperty, setResolvedProperty] = useState(null);
  const [resolvedUnit, setResolvedUnit] = useState(null);
  const [resolvedOccupancy, setResolvedOccupancy] = useState(null);
  const [resolvingProperty, setResolvingProperty] = useState(false);

  const selectedTenantId = getTenantId(selectedTenant);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!selectedTenant) { setTenantDetailLoading(false); setTenantDetail(null); return; }
      if (!selectedTenantId) { setTenantDetailLoading(false); setTenantDetail({ client: selectedTenant }); return; }
      setTenantDetailLoading(true);
      try {
        const data = await salesManagerService.getClient(selectedTenantId);
        if (!cancelled) setTenantDetail(data);
      } catch {
        if (!cancelled) setTenantDetail({ client: selectedTenant });
      } finally {
        if (!cancelled) setTenantDetailLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedTenant, selectedTenantId]);

  useEffect(() => {
    const tenant = tenantDetail?.client || selectedTenant;
    const propertyAddr = (tenant?.Property || tenant?.property || '').toString().trim();
    if (!propertyAddr) { setResolvedProperty(null); setResolvedUnit(null); setResolvedOccupancy(null); return; }
    const normalize = (v) => v.toString().toLowerCase().trim().replace(/[.,#]/g, ' ').replace(/\s+/g, ' ');
    let cancelled = false;
    setResolvingProperty(true);
    (async () => {
      try {
        const list = await salesManagerService.getProperties();
        const props = Array.isArray(list) ? list : (list?.items || list?.data || []);
        const wanted = normalize(propertyAddr);
        const match = props.find(p => normalize(p.address ?? p.Address ?? '') === wanted) ||
          props.find(p => { const a = normalize(p.address ?? p.Address ?? ''); return a && (a.includes(wanted) || wanted.includes(a)); });
        if (cancelled || !match) { setResolvedProperty(null); setResolvedUnit(null); setResolvedOccupancy(null); return; }
        setResolvedProperty(match);
        const propId = match.id ?? match.ID;
        if (!propId) { setResolvedUnit(null); setResolvedOccupancy(null); return; }
        const detail = await salesManagerService.getPropertyBuildingDetail(propId);
        if (cancelled) return;
        const units = Array.isArray(detail?.units) ? detail.units : [];
        const occupied = units.filter(u => { const st = (u.status || u.Status || '').toLowerCase(); const t = (u.tenant || u.Tenant || '').trim(); return st === 'occupied' || t !== ''; }).length;
        if (units.length === 0) {
          const total = Number(match.NumberOfUnits ?? match.numberOfUnits ?? 1) || 1;
          const st = (match.status ?? match.Status ?? '').toLowerCase();
          setResolvedOccupancy({ occupied: st === 'occupied' ? 1 : 0, total });
        } else {
          setResolvedOccupancy({ occupied, total: units.length });
        }
        const unitNumber = (tenant?.UnitNumber ?? tenant?.unitNumber ?? '').toString().trim();
        const norm = (v) => v.toString().trim().toLowerCase().replace(/^unit\s+/i, '').replace(/\s+/g, '');
        const foundUnit = unitNumber ? units.find(u => { const un = (u.unitNumber ?? u.UnitNumber ?? u.name ?? '').toString().trim(); return un && norm(un) === norm(unitNumber); }) : null;
        const tenantName = (tenant?.Name || tenant?.name || '').toLowerCase();
        const foundByTenant = !foundUnit && tenantName ? units.find(u => (u.tenant || u.Tenant || '').toLowerCase() === tenantName) : null;
        setResolvedUnit(foundUnit || foundByTenant || null);
      } catch {
        if (!cancelled) { setResolvedProperty(null); setResolvedUnit(null); setResolvedOccupancy(null); }
      } finally {
        if (!cancelled) setResolvingProperty(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedTenant, tenantDetail]);

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
    } catch (error) {
      addNotification(error?.message || 'Failed to add note', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const tenant = tenantDetail?.client || selectedTenant || {};

  if (tenantDetailLoading) {
    return (
      <div style={{ ...card, padding: '48px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>Loading tenant details...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <>
        <button type="button" style={{ ...backBtn, marginBottom: '16px' }} onClick={() => { setSelectedTenant(null); setTenantDetail(null); }}>
          <ArrowLeft size={16} /> Back to list
        </button>
        <div style={card}><p style={subText}>Tenant not found or failed to load.</p></div>
      </>
    );
  }

  const prop = tenantDetail?.property;
  const displayProp = resolvedProperty || prop;
  const alertList = Array.isArray(tenantDetail?.alerts) ? tenantDetail.alerts : [];
  const maintenancesList = Array.isArray(tenantDetail?.maintenances) ? tenantDetail.maintenances : [];
  const paymentsList = Array.isArray(tenantDetail?.payments)
    ? tenantDetail.payments
    : (Array.isArray(tenantPayments) ? tenantPayments.filter(p => {
        const pTenant = (p.Tenant || p.tenant || '').toLowerCase();
        const tName = (tenant.Name || tenant.name || '').toLowerCase();
        return pTenant.includes(tName) || tName.includes(pTenant);
      }) : []);
  const privateNotesList = Array.isArray(tenantDetail?.privateNotes) ? tenantDetail.privateNotes : [];
  const accounting = tenantDetail?.accounting || {};
  const depositPaidAmount = tenantDetail?.deposit?.paidAmount ?? tenantDetail?.depositPaidAmount ?? null;
  const depositStatus = tenantDetail?.deposit?.status ?? null;
  const rentPaidInAdvance = accounting.rentPaidInAdvance ?? null;
  const unpaidRentAmount = accounting.unpaidRentAmount ?? null;
  const numberOfMonthsUnpaid = accounting.numberOfMonthsUnpaid ?? null;
  const penaltyToPay = accounting.penaltyToPay ?? null;
  const balanceToPayEstimate = accounting.balanceToPayEstimate ?? null;
  const name = tenant.Name || tenant.name || 'N/A';
  const email = tenant.Email || tenant.email || '';
  const phone = tenant.Phone || tenant.phone || '';
  const status = tenant.Status || tenant.status || 'Unknown';
  const propertyAddr = tenant.Property || tenant.property || '—';
  const unitNumber = tenant.UnitNumber ?? tenant.unitNumber ?? '—';
  const amount = tenant.Amount ?? tenant.amount ?? 0;
  const lastPayment = tenant.LastPayment ?? tenant.lastPayment;
  const updatedAt = tenant.UpdatedAt ?? tenant.updatedAt;
  const visiblePayments = showAllPayments ? paymentsList : paymentsList.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ marginBottom: '20px' }}>
        <button type="button" style={backBtn} onClick={() => { setSelectedTenant(null); setTenantDetail(null); setShowAllPayments(false); }}>
          <ArrowLeft size={16} /> Back to list
        </button>
      </div>

      {/* Header card */}
      <div style={{ ...card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 700, flexShrink: 0 }}>
            {(name || 'T').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>{name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
              <span style={statusPill(status)}>{status}</span>
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
            {email && <div style={dlItem}><div style={dtStyle}>Email</div><div style={{ ...ddStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {email}</div></div>}
            {phone && <div style={dlItem}><div style={dtStyle}>Phone</div><div style={{ ...ddStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {phone}</div></div>}
            <div style={dlItem}><div style={dtStyle}>Status</div><div style={ddStyle}><span style={statusPill(status)}>{status}</span></div></div>
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
            <div style={dlItem}><div style={dtStyle}>Property</div><div style={{ ...ddStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {propertyAddr}</div></div>
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
        {displayProp && (
          <div style={card}>
            <h3 style={sectionTitle}><Building size={18} /> Property details</h3>
            <div style={{ marginTop: '16px' }}>
              <div style={dlItem}><div style={dtStyle}>Type</div><div style={ddStyle}>{displayProp.type || displayProp.Type || '—'}</div></div>
              {resolvedOccupancy && <div style={dlItem}><div style={dtStyle}>Occupancy</div><div style={ddStyle}>{resolvedOccupancy.occupied}/{resolvedOccupancy.total}</div></div>}
              {resolvedUnit && <div style={dlItem}><div style={dtStyle}>Unit status</div><div style={ddStyle}><span style={statusPill((resolvedUnit.status || '').toLowerCase())}>{resolvedUnit.status || resolvedUnit.Status || '—'}</span></div></div>}
              {resolvingProperty && <div style={{ ...subText, marginTop: '6px' }}>Refreshing…</div>}
            </div>
          </div>
        )}

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
                    .catch((err) => addNotification(err?.message || 'Failed to load details', 'error'))
                    .finally(() => setMaintenanceDetailLoading(false));
                };
                return (
                  <li key={mid ?? idx} style={{ ...alertItem, cursor: mid != null ? 'pointer' : 'default' }} role="button" tabIndex={0} onClick={open} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}>
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
                  <button type="button" className="sa-outline-button" onClick={() => setShowAllPayments(v => !v)}>{showAllPayments ? 'Show less' : 'See more'}</button>
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
            placeholder="Add a note (visible to internal staff only)..."
            rows={2}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.875rem', resize: 'vertical', marginTop: '12px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <button type="button" style={{ ...btnPrimary, marginBottom: '16px' }} onClick={handleAddPrivateNote} disabled={!privateNoteInput.trim() || addingNote}>
            {addingNote ? 'Adding...' : 'Add note'}
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { if (!maintenanceDetailLoading) setMaintenanceDetail(null); }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Maintenance details</h3>
              <button type="button" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', padding: '4px' }} onClick={() => setMaintenanceDetail(null)} disabled={maintenanceDetailLoading}>×</button>
            </div>
            {maintenanceDetailLoading ? (
              <p style={{ margin: 0, color: '#94a3b8' }}>Loading...</p>
            ) : maintenanceDetail ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                <div><div style={dtStyle}>Property</div><div style={ddStyle}>{maintenanceDetail.property ?? maintenanceDetail.Property ?? '—'}</div></div>
                <div><div style={dtStyle}>Issue</div><div style={ddStyle}>{maintenanceDetail.issue ?? maintenanceDetail.Issue ?? maintenanceDetail.title ?? maintenanceDetail.Title ?? '—'}</div></div>
                <div><div style={dtStyle}>Priority</div><div style={ddStyle}><span style={statusPill((maintenanceDetail.priority ?? maintenanceDetail.Priority ?? '').toLowerCase())}>{maintenanceDetail.priority ?? maintenanceDetail.Priority ?? '—'}</span></div></div>
                <div><div style={dtStyle}>Status</div><div style={ddStyle}><span style={statusPill((maintenanceDetail.status ?? maintenanceDetail.Status ?? '').toLowerCase())}>{maintenanceDetail.status ?? maintenanceDetail.Status ?? '—'}</span></div></div>
                {(maintenanceDetail.assigned ?? maintenanceDetail.Assigned) && <div><div style={dtStyle}>Assigned to</div><div style={ddStyle}>{maintenanceDetail.assigned ?? maintenanceDetail.Assigned}</div></div>}
                <div><div style={dtStyle}>Date</div><div style={ddStyle}>{maintenanceDetail.date ? new Date(maintenanceDetail.date).toLocaleDateString() : (maintenanceDetail.Date ? new Date(maintenanceDetail.Date).toLocaleDateString() : '—')}</div></div>
                {(maintenanceDetail.estimatedCost ?? maintenanceDetail.EstimatedCost) != null && <div><div style={dtStyle}>Estimated cost</div><div style={ddStyle}>{Number(maintenanceDetail.estimatedCost ?? maintenanceDetail.EstimatedCost).toLocaleString()} XOF</div></div>}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagementTab;
