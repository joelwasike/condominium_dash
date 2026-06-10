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
import { t } from '../../utils/i18n';
import { formatPropertyBuilding, formatTenantName, normalizeAmount } from '../../utils/accountingDisplay';

const getTenantId = (tenant) => tenant?.TenantID ?? tenant?.tenantId ?? tenant?.id ?? tenant?.ID ?? null;

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

const statusPill = (status) => {
  const s = (status || '').toString().toLowerCase();
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
    'partially occupied': { bg: '#e0f2fe', c: '#075985' },
    'partially-occupied': { bg: '#e0f2fe', c: '#075985' },
  };
  const { bg, c } = map[s] || { bg: '#f1f5f9', c: '#475569' };
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: bg, color: c };
};

const card = {
  background: '#fff',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
  border: '1px solid #f1f5f9',
  transition: 'transform 0.15s, box-shadow 0.15s',
};

const metricCard = { background: '#fff', borderRadius: '14px', padding: '18px 22px', boxShadow: '0 1px 8px rgba(15,23,42,0.05)', border: '1px solid #f1f5f9', minWidth: '140px', flex: '1 1 140px' };
const metricLabel = { margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 };
const metricValue = { margin: '6px 0 0', fontSize: '1.45rem', fontWeight: 700, color: '#1e293b' };
const emptyRow = { padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' };
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
  const { loading, addNotification, tenants, tenantPayments, selectedTenant, setSelectedTenant, tenantPaymentStatusFilter, setTenantPaymentStatusFilter, tenantNameFilter, setTenantNameFilter } = props;
  const [showAllPayments, setShowAllPayments] = useState(false);

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

  const filteredTenants = tenants.filter(tenant => {
    if (tenantPaymentStatusFilter === 'up-to-date' && (tenant.PaymentStatus || tenant.paymentStatus) !== 'up-to-date') return false;
    if (tenantPaymentStatusFilter === 'outstanding' && (tenant.PaymentStatus || tenant.paymentStatus) === 'up-to-date') return false;
    if (tenantNameFilter.trim()) {
      const name = (tenant.TenantName || tenant.tenantName || '').toLowerCase();
      if (!name.includes(tenantNameFilter.trim().toLowerCase())) return false;
    }
    return true;
  });

  const upToDateTenants = tenants.filter(t2 => (t2.PaymentStatus || t2.paymentStatus) === 'up-to-date');
  const outstandingTenants = tenants.filter(t2 => (t2.PaymentStatus || t2.paymentStatus) !== 'up-to-date');

  const exportToCSV = (tenantList, filename) => {
    if (tenantList.length === 0) {
      addNotification('No tenants to export', 'info');
      return;
    }

    const headers = ['Tenant Name', 'Phone', 'Property / Building', 'Monthly Rent', 'Rents Paid in Advance', 'Late Rent', 'Payment Status', 'Outstanding Amount', 'Last Payment Date', 'Next Payment Due'];
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
      (tenant.NextPaymentDue || tenant.nextPaymentDue ? new Date(tenant.NextPaymentDue || tenant.nextPaymentDue).toLocaleDateString() : 'N/A'),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification(`Exported ${tenantList.length} tenants to ${filename}`, 'success');
  };

  return (
    <div>
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h2>Tenants Management</h2>
            <p>{t('accounting.viewAllTenants')}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="sa-outline-button" onClick={() => exportToCSV(outstandingTenants, `outstanding-tenants-${new Date().toISOString().split('T')[0]}.csv`)} disabled={loading || outstandingTenants.length === 0}>
              <Download size={18} /> Export Outstanding
            </button>
            <button className="sa-outline-button" onClick={() => exportToCSV(upToDateTenants, `up-to-date-tenants-${new Date().toISOString().split('T')[0]}.csv`)} disabled={loading || upToDateTenants.length === 0}>
              <Download size={18} /> Export Up-to-Date
            </button>
            <button className="sa-primary-cta" onClick={() => exportToCSV(filteredTenants, `all-tenants-${new Date().toISOString().split('T')[0]}.csv`)} disabled={loading || filteredTenants.length === 0}>
              <Download size={18} /> Export All
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Tenants</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#166534' }}>{tenants.length}</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#ecfeff', borderRadius: '8px', border: '1px solid #67e8f9' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Rent in Advance</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#0f766e' }}>{tenants.filter((tenant) => getRentAdvanceAmount(tenant) > 0).length}</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Up-to-Date</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#059669' }}>{upToDateTenants.length}</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Outstanding</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#dc2626' }}>{outstandingTenants.length}</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Outstanding</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#d97706' }}>{outstandingTenants.reduce((sum, t2) => sum + (t2.OutstandingAmount || t2.outstandingAmount || 0), 0).toFixed(2)} XOF</p>
          </div>
        </div>

        <div className="sa-filters-section" style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} style={{ color: '#6b7280' }} />
            <input
              type="text"
              placeholder="Filter by name..."
              value={tenantNameFilter}
              onChange={(e) => setTenantNameFilter(e.target.value)}
              className="sa-filter-select"
              style={{ minWidth: '200px', padding: '8px 12px' }}
            />
          </div>
          <select className="sa-filter-select" value={tenantPaymentStatusFilter} onChange={(e) => setTenantPaymentStatusFilter(e.target.value)}>
            <option value="all">All Tenants</option>
            <option value="up-to-date">Up-to-Date</option>
            <option value="outstanding">Outstanding</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading tenants...</div>
        ) : filteredTenants.length === 0 ? (
          <div className="no-data">No tenants found</div>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Tenant Name</th>
                  <th>Property / Building</th>
                  <th>Monthly Rent</th>
                  <th>Rents Paid in Advance</th>
                  <th>Late Rent</th>
                  <th>Payment Status</th>
                  <th>Outstanding Amount</th>
                  <th>Last Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant, index) => {
                  const status = tenant.PaymentStatus || tenant.paymentStatus || 'unknown';
                  const arrears = tenant.MonthsInArrears || tenant.monthsInArrears || 0;
                  const outstanding = getLateRentAmount(tenant);
                  const rentInAdvance = getRentAdvanceAmount(tenant);
                  let statusClass = 'up-to-date';
                  let statusLabel = 'Paid';
                  if (status === '1-month') {
                    statusClass = 'warning';
                    statusLabel = 'Due';
                  } else if (status === '2-months') {
                    statusClass = 'warning';
                    statusLabel = 'Overdue';
                  } else if (status === '3+months') {
                    statusClass = 'error';
                    statusLabel = 'Overdue';
                  }

                  return (
                    <tr
                      key={tenant.TenantID || tenant.tenantId || index}
                      onClick={() => setSelectedTenant(tenant)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedTenant(tenant);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><span className="sa-cell-title">{tenant.TenantName || tenant.tenantName || 'N/A'}</span></td>
                      <td>{formatPropertyBuilding(tenant, 'N/A')}</td>
                      <td>{(tenant.MonthlyRent || tenant.monthlyRent || 0).toFixed(2)} XOF</td>
                      <td style={{ color: rentInAdvance > 0 ? '#059669' : '#6b7280', fontWeight: rentInAdvance > 0 ? '600' : '400' }}>{rentInAdvance.toFixed(2)} XOF</td>
                      <td style={{ color: arrears > 0 ? '#dc2626' : '#6b7280', fontWeight: arrears > 0 ? '600' : '400' }}>{arrears}</td>
                      <td><span className={`sa-status-pill ${statusClass}`}>{statusLabel}</span></td>
                      <td style={{ color: outstanding > 0 ? '#dc2626' : '#059669', fontWeight: '600' }}>{outstanding.toFixed(2)} XOF</td>
                      <td>{tenant.LastPaymentDate || tenant.lastPaymentDate ? new Date(tenant.LastPaymentDate || tenant.lastPaymentDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

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

    const loadTenantDetail = async () => {
      if (!selectedTenant) {
        setTenantDetailLoading(false);
        setTenantDetail(null);
        return;
      }

      if (!selectedTenantId) {
        setTenantDetailLoading(false);
        setTenantDetail({ client: selectedTenant });
        return;
      }

      setTenantDetailLoading(true);
      try {
        const data = await salesManagerService.getClient(selectedTenantId);
        if (!cancelled) {
          setTenantDetail(data);
        }
      } catch (error) {
        if (!cancelled) {
          setTenantDetail({ client: selectedTenant });
        }
      } finally {
        if (!cancelled) {
          setTenantDetailLoading(false);
        }
      }
    };

    loadTenantDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedTenant, selectedTenantId]);

  useEffect(() => {
    const tenant = tenantDetail?.client || selectedTenant;
    const propertyAddr = (tenant?.Property || tenant?.property || '').toString().trim();
    const unitNumber = (tenant?.UnitNumber ?? tenant?.unitNumber ?? '').toString().trim();

    if (!propertyAddr) {
      setResolvedProperty(null);
      setResolvedUnit(null);
      setResolvedOccupancy(null);
      return;
    }

    const normalizeAddress = (value) => value
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[.,#]/g, ' ')
      .replace(/\s+/g, ' ');

    let cancelled = false;
    setResolvingProperty(true);

    (async () => {
      try {
        const list = await salesManagerService.getProperties();
        const props = Array.isArray(list) ? list : (list?.items || list?.data || []);
        const wanted = normalizeAddress(propertyAddr);
        const propRows = Array.isArray(props) ? props : [];
        const matchExact = propRows.find((p) => {
          const addr = normalizeAddress(p.address ?? p.Address ?? '');
          return addr && addr === wanted;
        });
        const matchLoose = matchExact
          ? null
          : propRows.find((p) => {
            const addr = normalizeAddress(p.address ?? p.Address ?? '');
            return addr && (addr.includes(wanted) || wanted.includes(addr));
          });
        const match = matchExact || matchLoose;

        if (cancelled) return;

        if (!match) {
          setResolvedProperty(null);
          setResolvedUnit(null);
          setResolvedOccupancy(null);
          return;
        }

        const propertyId = match.id ?? match.ID;
        setResolvedProperty(match);

        if (!propertyId) {
          setResolvedUnit(null);
          setResolvedOccupancy(null);
          return;
        }

        const detail = await salesManagerService.getPropertyBuildingDetail(propertyId);
        if (cancelled) return;

        const units = Array.isArray(detail?.units) ? detail.units : [];
        const occupiedFromUnits = units.filter((u) => {
          const st = (u.status || u.Status || u.statut || '').toString().toLowerCase();
          const tName = (u.tenant || u.Tenant || '').toString().trim();
          return st === 'occupied' || tName !== '';
        }).length;

        if (units.length === 0) {
          const total = Number(match.NumberOfUnits ?? match.numberOfUnits ?? match.totalUnits ?? 1) || 1;
          const status = (match.status ?? match.Status ?? '').toString().trim().toLowerCase();
          const propTenant = (match.tenant ?? match.Tenant ?? '').toString().trim().toLowerCase();
          const tenantName = (tenant?.Name || tenant?.name || '').toString().trim().toLowerCase();
          const occupied = status === 'occupied' || propTenant !== '' || tenantName !== '' ? 1 : 0;
          setResolvedOccupancy({ occupied, total });
        } else {
          setResolvedOccupancy({ occupied: occupiedFromUnits, total: units.length });
        }

        const unitComparable = (value) => value.toString().trim().toLowerCase().replace(/^unit\s+/i, '').replace(/\s+/g, '');
        const unitNorm = unitNumber.toLowerCase();
        const foundUnitByNumber = unitNorm
          ? units.find((u) => {
            const un = (u.unitNumber ?? u.UnitNumber ?? u.name ?? u.Name ?? '').toString().trim();
            return un && unitComparable(un) === unitComparable(unitNorm);
          })
          : null;
        const tenantName = (tenant?.Name || tenant?.name || '').toString().trim().toLowerCase();
        const foundUnitByTenant = !foundUnitByNumber && tenantName
          ? units.find((u) => (u.tenant || u.Tenant || '').toString().trim().toLowerCase() === tenantName)
          : null;
        setResolvedUnit(foundUnitByNumber || foundUnitByTenant || null);
      } catch (error) {
        if (!cancelled) {
          setResolvedProperty(null);
          setResolvedUnit(null);
          setResolvedOccupancy(null);
        }
      } finally {
        if (!cancelled) {
          setResolvingProperty(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
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

  const handleQuickAction = (action) => {
    addNotification(`${action} – feature coming soon`, 'info');
  };

  const tenant = tenantDetail?.client || selectedTenant || {};

  if (tenantDetailLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div style={{ ...card, padding: '48px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>Loading tenant details...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <button
          type="button"
          style={{ ...backBtn, marginBottom: '16px' }}
          onClick={() => {
            setSelectedTenant(null);
            setTenantDetail(null);
          }}
        >
          <ArrowLeft size={16} />
          Back to list
        </button>
        <div style={card}>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>Tenant not found or failed to load.</p>
        </div>
      </div>
    );
  }

  const prop = tenantDetail?.property;
  const displayProp = resolvedProperty || prop;
  const alertList = Array.isArray(tenantDetail?.alerts) ? tenantDetail.alerts : [];
  const maintenancesList = Array.isArray(tenantDetail?.maintenances) ? tenantDetail.maintenances : [];
  const paymentsList = Array.isArray(tenantDetail?.payments)
    ? tenantDetail.payments
    : (Array.isArray(tenantPayments) ? tenantPayments.filter((payment) => {
      const pTenant = (payment.Tenant || payment.tenant || '').toString().trim().toLowerCase();
      const tName = (tenant.Name || tenant.name || '').toString().trim().toLowerCase();
      return pTenant.includes(tName) || tName.includes(pTenant);
    }) : []);
  const privateNotesList = Array.isArray(tenantDetail?.privateNotes) ? tenantDetail.privateNotes : [];
  const depositPaidAmount = tenantDetail?.deposit?.paidAmount ?? tenantDetail?.depositPaidAmount ?? null;
  const depositStatus = tenantDetail?.deposit?.status ?? null;
  const accounting = tenantDetail?.accounting || {};
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
  const createdAt = tenant.CreatedAt ?? tenant.createdAt;
  const updatedAt = tenant.UpdatedAt ?? tenant.updatedAt;
  const paymentStatus = tenant.PaymentStatus || tenant.paymentStatus || '-';
  const arrears = tenant.MonthsInArrears ?? tenant.monthsInArrears ?? 0;
  const outstanding = getLateRentAmount(tenant);
  const rentInAdvance = getRentAdvanceAmount(tenant);
  const visiblePayments = showAllPayments ? paymentsList : paymentsList.slice(0, 5);
  let statusLabel = 'Paid';
  if (paymentStatus === '1-month') statusLabel = 'Due';
  else if (paymentStatus === '2-months' || paymentStatus === '3+months') statusLabel = 'Overdue';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          style={backBtn}
          onClick={() => {
            setSelectedTenant(null);
            setTenantDetail(null);
            setShowAllPayments(false);
          }}
        >
          <ArrowLeft size={16} />
          Back to list
        </button>
      </div>

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
                  <MapPin size={14} />
                  {propertyAddr}{unitNumber && unitNumber !== '—' ? ` · ${unitNumber}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        <div style={card}>
          <h3 style={sectionTitle}><Users size={18} /> Personal information</h3>
          <div style={{ marginTop: '16px' }}>
            <div style={dlItem}><div style={dtStyle}>Name</div><div style={ddStyle}>{name}</div></div>
            {email && <div style={dlItem}><div style={dtStyle}>Email</div><div style={{ ...ddStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {email}</div></div>}
            {phone && <div style={dlItem}><div style={dtStyle}>Phone</div><div style={{ ...ddStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {phone}</div></div>}
            <div style={dlItem}><div style={dtStyle}>Status</div><div style={ddStyle}><span style={statusPill(status)}>{status}</span></div></div>
            {createdAt && <div style={dlItem}><div style={dtStyle}>Member since</div><div style={ddStyle}>{new Date(createdAt).toLocaleDateString()}</div></div>}
          </div>
          <h4 style={{ margin: '16px 0 8px', fontSize: '0.9rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCheck size={16} /> Files & documents
          </h4>
          <p style={subText}>No files uploaded yet. ID and other tenant documents can be added here for viewing.</p>
        </div>

        <div style={card}>
          <h3 style={sectionTitle}><DollarSign size={18} /> Rent & payment</h3>
          <div style={{ marginTop: '16px' }}>
            <div style={dlItem}><div style={dtStyle}>Property</div><div style={{ ...ddStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {propertyAddr}</div></div>
            {unitNumber && unitNumber !== '—' && <div style={dlItem}><div style={dtStyle}>Unit</div><div style={ddStyle}>{unitNumber}</div></div>}
            <div style={dlItem}><div style={dtStyle}>Monthly rent</div><div style={{ ...ddStyle, fontWeight: 700, fontSize: '1.1rem' }}>{Number(amount).toLocaleString()} XOF</div></div>
            {depositPaidAmount != null && (
              <div style={dlItem}>
                <div style={dtStyle}>Deposit paid amount{depositStatus ? ` (${depositStatus})` : ''}</div>
                <div style={ddStyle}>{Number(depositPaidAmount).toLocaleString()} XOF</div>
              </div>
            )}
            {rentPaidInAdvance != null && Number(rentPaidInAdvance) > 0 && (
              <div style={dlItem}>
                <div style={dtStyle}>Rent paid in advance</div>
                <div style={ddStyle}>{Number(rentPaidInAdvance).toLocaleString()} XOF</div>
              </div>
            )}
            {unpaidRentAmount != null && Number(unpaidRentAmount) > 0 && (
              <div style={dlItem}>
                <div style={dtStyle}>Unpaid rent</div>
                <div style={ddStyle}>{Number(unpaidRentAmount).toLocaleString()} XOF</div>
              </div>
            )}
            {numberOfMonthsUnpaid != null && Number(numberOfMonthsUnpaid) > 0 && (
              <div style={dlItem}>
                <div style={dtStyle}>Months unpaid</div>
                <div style={ddStyle}>{Number(numberOfMonthsUnpaid)}</div>
              </div>
            )}
            {penaltyToPay != null && Number(penaltyToPay) > 0 && (
              <div style={dlItem}>
                <div style={dtStyle}>Penalty to pay</div>
                <div style={ddStyle}>{Number(penaltyToPay).toLocaleString()} XOF</div>
              </div>
            )}
            {balanceToPayEstimate != null && Number(balanceToPayEstimate) > 0 && (
              <div style={dlItem}>
                <div style={dtStyle}>Balance to pay</div>
                <div style={{ ...ddStyle, fontWeight: 700 }}>{Number(balanceToPayEstimate).toLocaleString()} XOF</div>
              </div>
            )}
            <div style={dlItem}><div style={dtStyle}>Last payment</div><div style={ddStyle}>{lastPayment ? new Date(lastPayment).toLocaleDateString() : '—'}</div></div>
          </div>
        </div>

        {displayProp && (
          <div style={card}>
            <h3 style={sectionTitle}><Building size={18} /> Property details</h3>
            <div style={{ marginTop: '16px' }}>
              <div style={dlItem}><div style={dtStyle}>Type</div><div style={ddStyle}>{displayProp.type || displayProp.Type || '—'}</div></div>
              {resolvedOccupancy && (
                <div style={dlItem}>
                  <div style={dtStyle}>Occupancy</div>
                  <div style={ddStyle}>{resolvedOccupancy.occupied}/{resolvedOccupancy.total}</div>
                </div>
              )}
              {resolvedUnit && (
                <div style={dlItem}>
                  <div style={dtStyle}>Unit status</div>
                  <div style={ddStyle}><span style={statusPill((resolvedUnit.status || resolvedUnit.Status || '').toLowerCase())}>{resolvedUnit.status || resolvedUnit.Status || '—'}</span></div>
                </div>
              )}

              {(() => {
                const bedrooms = resolvedUnit?.bedrooms ?? resolvedUnit?.Bedrooms ?? displayProp.bedrooms ?? displayProp.Bedrooms;
                const bathrooms = resolvedUnit?.bathrooms ?? resolvedUnit?.Bathrooms ?? displayProp.bathrooms ?? displayProp.Bathrooms;
                const occupancyStatus = resolvedOccupancy
                  ? (resolvedOccupancy.total > 0 && resolvedOccupancy.occupied >= resolvedOccupancy.total ? 'Occupied'
                    : resolvedOccupancy.occupied === 0 ? 'Vacant'
                      : 'Partially occupied')
                  : (displayProp.status || displayProp.Status || '');
                return (
                  <>
                    {bedrooms != null && (
                      <div style={dlItem}><div style={dtStyle}>Bedrooms</div><div style={ddStyle}>{bedrooms}</div></div>
                    )}
                    {bathrooms != null && (
                      <div style={dlItem}><div style={dtStyle}>Bathrooms</div><div style={ddStyle}>{bathrooms}</div></div>
                    )}
                    <div style={dlItem}>
                      <div style={dtStyle}>Property status</div>
                      <div style={ddStyle}><span style={statusPill((occupancyStatus || '').toLowerCase())}>{occupancyStatus || '—'}</span></div>
                    </div>
                    {resolvingProperty && (
                      <div style={{ ...subText, marginTop: '6px' }}>Refreshing property details…</div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <div style={{ ...card, ...(alertList.length ? {} : { gridColumn: '1 / -1' }) }}>
          <h3 style={sectionTitle}><AlertTriangle size={18} /> Alerts & activity</h3>
          {alertList.length > 0 ? (
            <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alertList.map((alert, idx) => (
                <li key={alert.ID || alert.id || idx} style={alertItem}>
                  <div style={alertTitle}>{alert.Title || alert.title || 'Alert'}</div>
                  {alert.Message && <div style={{ ...subText, marginBottom: '4px' }}>{alert.Message}</div>}
                  <div style={alertMeta}>
                    {(alert.Urgency || alert.urgency || '').toLowerCase()} · {alert.Status || alert.status || 'Open'}
                    {alert.Amount != null && ` · ${Number(alert.Amount).toLocaleString()} XOF`}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ ...subText, marginTop: '12px' }}>No alerts for this tenant.</p>
          )}
        </div>

        <div style={card}>
          <h3 style={sectionTitle}><Wrench size={18} /> Maintenances requested</h3>
          {maintenancesList.length > 0 ? (
            <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {maintenancesList.map((m, idx) => {
                const mid = m.ID ?? m.id;
                const openMaintenanceDetail = () => {
                  if (mid == null) return;
                  setMaintenanceDetailLoading(true);
                  setMaintenanceDetail(null);
                  salesManagerService.getMaintenance(mid)
                    .then((data) => setMaintenanceDetail(data))
                    .catch((error) => addNotification(error?.message || 'Failed to load maintenance details', 'error'))
                    .finally(() => setMaintenanceDetailLoading(false));
                };

                return (
                  <li
                    key={mid ?? idx}
                    style={{ ...alertItem, cursor: mid != null ? 'pointer' : 'default' }}
                    role="button"
                    tabIndex={0}
                    onClick={openMaintenanceDetail}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openMaintenanceDetail();
                      }
                    }}
                  >
                    <div style={alertTitle}>{m.Issue || m.issue || 'Maintenance'}</div>
                    <div style={alertMeta}>
                      {(m.Status || m.status || '—')} · {(m.Priority || m.priority || '—')}
                      {m.CreatedAt && ` · ${new Date(m.CreatedAt).toLocaleDateString()}`}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ ...subText, marginTop: '12px' }}>No maintenance requests for this tenant.</p>
          )}
        </div>

        <div style={card}>
          <h3 style={sectionTitle}><Receipt size={18} /> Recent payment history</h3>
          {paymentsList.length > 0 ? (
            <>
              <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {visiblePayments.map((p, idx) => (
                  <li key={p.ID || p.id || idx} style={{ ...alertItem, borderLeftColor: (p.Status || p.status) === 'Approved' ? '#16a34a' : '#f59e0b' }}>
                    <div style={alertTitle}>
                      {Number(p.Amount ?? p.amount ?? 0).toLocaleString()} XOF · {(p.Status || p.status || '—')}
                    </div>
                    <div style={alertMeta}>
                      {p.Date ? new Date(p.Date).toLocaleDateString() : (p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString() : '—')}
                      {(p.Method || p.method) && ` · ${p.Method || p.method}`}
                    </div>
                  </li>
                ))}
              </ul>
              {paymentsList.length > 5 && (
                <div style={{ marginTop: '12px' }}>
                  <button type="button" className="sa-outline-button" onClick={() => setShowAllPayments((value) => !value)}>
                    {showAllPayments ? 'Show less' : 'See more'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p style={{ ...subText, marginTop: '12px' }}>No payment history for this tenant.</p>
          )}
        </div>

        <div style={card}>
          <h3 style={sectionTitle}><StickyNote size={18} /> Private notes</h3>
          <textarea
            value={privateNoteInput}
            onChange={(e) => setPrivateNoteInput(e.target.value)}
            placeholder="Add a note for future reference (visible only to sales managers)..."
            rows={2}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.875rem', resize: 'vertical', marginTop: '12px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <button
            type="button"
            style={{ ...btnPrimary, marginBottom: '16px' }}
            onClick={handleAddPrivateNote}
            disabled={!privateNoteInput.trim() || addingNote}
          >
            {addingNote ? 'Adding...' : 'Add note'}
          </button>
          {privateNotesList.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {privateNotesList.map((n) => (
                <li key={n.id ?? n.ID} style={{ ...alertItem, borderLeftColor: '#6366f1' }}>
                  <div style={alertTitle}>{n.note ?? n.Note}</div>
                  <div style={alertMeta}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : (n.CreatedAt ? new Date(n.CreatedAt).toLocaleString() : '')}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ ...subText, marginTop: '0' }}>No private notes yet.</p>
          )}
        </div>

        <div style={card}>
          <h3 style={sectionTitle}><AlertCircle size={18} /> Quick actions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
            <button type="button" style={{ ...btnOutline, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => handleQuickAction('Generate Receipt')}>
              <Receipt size={16} /> Generate Receipt
            </button>
            <button type="button" style={{ ...btnOutline, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => handleQuickAction('Send Reminder SMS')}>
              <MessageSquare size={16} /> Send Reminder SMS
            </button>
            <button type="button" style={{ ...btnOutline, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => handleQuickAction('Report Incident')}>
              <AlertCircle size={16} /> Report Incident
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...card, marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}
          </span>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            View-only in accounting
          </span>
        </div>
      </div>

      {(maintenanceDetail != null || maintenanceDetailLoading) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { if (!maintenanceDetailLoading) { setMaintenanceDetail(null); } }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Maintenance request details</h3>
              <button type="button" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', padding: '4px' }} onClick={() => setMaintenanceDetail(null)} disabled={maintenanceDetailLoading}>x</button>
            </div>
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {maintenanceDetailLoading ? (
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>Loading...</p>
              ) : maintenanceDetail ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div><div style={dtStyle}>Property</div><div style={ddStyle}>{maintenanceDetail.property ?? maintenanceDetail.Property ?? '—'}</div></div>
                  <div><div style={dtStyle}>Tenant</div><div style={ddStyle}>{maintenanceDetail.tenant ?? maintenanceDetail.Tenant ?? '—'}</div></div>
                  <div><div style={dtStyle}>Title</div><div style={ddStyle}>{maintenanceDetail.title ?? maintenanceDetail.Title ?? maintenanceDetail.issue ?? maintenanceDetail.Issue ?? '—'}</div></div>
                  {(maintenanceDetail.description ?? maintenanceDetail.Description) && <div><div style={dtStyle}>Description</div><div style={ddStyle}>{maintenanceDetail.description ?? maintenanceDetail.Description}</div></div>}
                  <div><div style={dtStyle}>Priority</div><div style={ddStyle}><span style={statusPill((maintenanceDetail.priority ?? maintenanceDetail.Priority ?? '').toLowerCase())}>{maintenanceDetail.priority ?? maintenanceDetail.Priority ?? '—'}</span></div></div>
                  <div><div style={dtStyle}>Status</div><div style={ddStyle}><span style={statusPill((maintenanceDetail.status ?? maintenanceDetail.Status ?? '').toLowerCase().replace(/\s+/g, '-'))}>{maintenanceDetail.status ?? maintenanceDetail.Status ?? '—'}</span></div></div>
                  {(maintenanceDetail.assigned ?? maintenanceDetail.Assigned) && <div><div style={dtStyle}>Assigned to</div><div style={ddStyle}>{maintenanceDetail.assigned ?? maintenanceDetail.Assigned}</div></div>}
                  <div><div style={dtStyle}>Date reported</div><div style={ddStyle}>{maintenanceDetail.date ? new Date(maintenanceDetail.date).toLocaleDateString() : (maintenanceDetail.Date ? new Date(maintenanceDetail.Date).toLocaleDateString() : '—')}</div></div>
                  <div><div style={dtStyle}>Created</div><div style={ddStyle}>{maintenanceDetail.createdAt ? new Date(maintenanceDetail.createdAt).toLocaleString() : (maintenanceDetail.CreatedAt ? new Date(maintenanceDetail.CreatedAt).toLocaleString() : '—')}</div></div>
                  {(maintenanceDetail.estimatedHours ?? maintenanceDetail.EstimatedHours) != null && <div><div style={dtStyle}>Estimated hours</div><div style={ddStyle}>{maintenanceDetail.estimatedHours ?? maintenanceDetail.EstimatedHours}</div></div>}
                  {(maintenanceDetail.estimatedCost ?? maintenanceDetail.EstimatedCost) != null && <div><div style={dtStyle}>Estimated cost</div><div style={ddStyle}>{(maintenanceDetail.estimatedCost ?? maintenanceDetail.EstimatedCost).toLocaleString()} XOF</div></div>}
                  <div><div style={dtStyle}>Quote generated</div><div style={ddStyle}>{(maintenanceDetail.quoteGenerated ?? maintenanceDetail.QuoteGenerated) ? 'Yes' : 'No'}</div></div>
                  {(maintenanceDetail.workStartDate ?? maintenanceDetail.WorkStartDate) && <div><div style={dtStyle}>Work start date</div><div style={ddStyle}>{new Date(maintenanceDetail.workStartDate ?? maintenanceDetail.WorkStartDate).toLocaleDateString()}</div></div>}
                  {(maintenanceDetail.workEndDate ?? maintenanceDetail.WorkEndDate) && <div><div style={dtStyle}>Work end date</div><div style={ddStyle}>{new Date(maintenanceDetail.workEndDate ?? maintenanceDetail.WorkEndDate).toLocaleDateString()}</div></div>}
                  {(maintenanceDetail.completedAt ?? maintenanceDetail.CompletedAt) && <div><div style={dtStyle}>Completed at</div><div style={ddStyle}>{new Date(maintenanceDetail.completedAt ?? maintenanceDetail.CompletedAt).toLocaleString()}</div></div>}
                  <div><div style={dtStyle}>Archived</div><div style={ddStyle}>{(maintenanceDetail.archived ?? maintenanceDetail.Archived) ? 'Yes' : 'No'}</div></div>
                  {Array.isArray(maintenanceDetail.photos ?? maintenanceDetail.Photos) && (maintenanceDetail.photos ?? maintenanceDetail.Photos).length > 0 && (
                    <div>
                      <div style={{ ...dtStyle, marginBottom: '8px' }}>Photos</div>
                      <div style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(maintenanceDetail.photos ?? maintenanceDetail.Photos).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                            <img src={url} alt={`Photo ${i + 1}`} style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                          </a>
                        ))}
                      </div>
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
};

export default TenantManagementTab;
