import React, { useEffect, useState } from 'react';
import { Plus, Filter, FileSpreadsheet, ArrowLeft, Users, Mail, Phone, MapPin, DollarSign, Building, AlertTriangle, Wrench, FileCheck, StickyNote, Receipt, MessageSquare, AlertCircle } from 'lucide-react';
import { salesManagerService } from '../../services/salesManagerService';
import Modal from '../../components/Modal';

const card = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #f1f5f9' };
const tdStyle = { padding: '14px 16px', fontSize: '0.88rem', color: '#334155', borderBottom: '1px solid #f8fafc' };
const statusPill = (s) => {
  const sl = (s || '').toLowerCase();
  const m = { occupied: { bg: '#dcfce7', c: '#166534' }, vacant: { bg: '#fef3c7', c: '#92400e' }, active: { bg: '#dcfce7', c: '#166534' }, inactive: { bg: '#fee2e2', c: '#991b1b' }, pending: { bg: '#fef3c7', c: '#92400e' }, completed: { bg: '#dcfce7', c: '#166534' }, available: { bg: '#dbeafe', c: '#1d4ed8' }, sold: { bg: '#f3e8ff', c: '#7c3aed' }, rented: { bg: '#d1fae5', c: '#065f46' } };
  const { bg, c } = m[sl] || { bg: '#f1f5f9', c: '#475569' };
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: bg, color: c };
};
const btnPrimary = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' };
const btnOutline = { padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer' };
const searchBar = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '220px' };
const filterBtn = (active) => ({ padding: '8px 16px', borderRadius: '10px', border: active ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: active ? '#eff6ff' : '#fff', color: active ? '#2563eb' : '#64748b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' });
const selectStyle = { padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', background: '#fff', cursor: 'pointer', outline: 'none' };
const backBtn = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 };

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

const ClientsTab = ({
  loading,
  clients,
  setClients,
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
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeletePassword, setBulkDeletePassword] = useState('');
  const [bulkDeleteSubmitting, setBulkDeleteSubmitting] = useState(false);

  // Resolved/accurate property details for the tenant detail view
  const [resolvedProperty, setResolvedProperty] = useState(null); // property row from /api/salesmanager/properties
  const [resolvedUnit, setResolvedUnit] = useState(null); // unit row from building-detail
  const [resolvedOccupancy, setResolvedOccupancy] = useState(null); // { occupied, total }
  const [resolvingProperty, setResolvingProperty] = useState(false);

  useEffect(() => {
    const tenant = tenantDetail?.client;
    const propertyAddr = (tenant?.Property || tenant?.property || '').toString().trim();
    const unitNumber = (tenant?.UnitNumber ?? tenant?.unitNumber ?? '').toString().trim();

    if (!selectedTenantId || !propertyAddr) {
      setResolvedProperty(null);
      setResolvedUnit(null);
      setResolvedOccupancy(null);
      return;
    }

    const normalizeAddress = (value) => {
      return value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[.,#]/g, ' ')
        .replace(/\s+/g, ' ');
    };

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
          const t = (u.tenant || u.Tenant || '').toString().trim();
          return st === 'occupied' || t !== '';
        }).length;

        // Villas / single-unit properties often have no unit rows; derive occupancy from property/client assignment.
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

        const unitNorm = unitNumber.toLowerCase();
        const unitComparable = (v) => v.toString().trim().toLowerCase().replace(/^unit\s+/i, '').replace(/\s+/g, '');
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
        const foundUnit = foundUnitByNumber || foundUnitByTenant;
        setResolvedUnit(foundUnit || null);
      } catch (_) {
        if (!cancelled) {
          setResolvedProperty(null);
          setResolvedUnit(null);
          setResolvedOccupancy(null);
        }
      } finally {
        if (!cancelled) setResolvingProperty(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedTenantId, tenantDetail]);

  const filteredClientIds = (Array.isArray(filteredClients) ? filteredClients : [])
    .map((c) => (c?.id ?? c?.ID))
    .filter((id) => id != null);
  const allFilteredSelected = filteredClientIds.length > 0 && filteredClientIds.every((id) => selectedClientIds.includes(id));

  const toggleSelectClient = (clientId) => {
    if (clientId == null) return;
    setSelectedClientIds((prev) => (prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]));
  };

  const toggleSelectAllFiltered = () => {
    setSelectedClientIds((prev) => {
      const prevSet = new Set(prev);
      if (allFilteredSelected) {
        filteredClientIds.forEach((id) => prevSet.delete(id));
        return Array.from(prevSet);
      }
      filteredClientIds.forEach((id) => prevSet.add(id));
      return Array.from(prevSet);
    });
  };

  const openBulkDeleteModal = () => {
    if (selectedClientIds.length === 0) {
      addNotification('Select at least one tenant to delete.', 'error');
      return;
    }
    setBulkDeletePassword('');
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    const password = (bulkDeletePassword || '').trim();
    if (!password) {
      addNotification('Please enter your password to confirm deletion.', 'error');
      return;
    }
    setBulkDeleteSubmitting(true);
    try {
      const result = await salesManagerService.bulkDeleteClients({ clientIds: selectedClientIds, password });
      const deletedCount = result?.deletedCount ?? (Array.isArray(result?.deleted) ? result.deleted.length : 0);
      const failedCount = result?.failedCount ?? (Array.isArray(result?.failed) ? result.failed.length : 0);

      if (deletedCount > 0) addNotification(`Deleted ${deletedCount} tenant(s).`, 'success');
      if (failedCount > 0) addNotification(`${failedCount} deletion(s) failed.`, 'error');

      // Refresh list (best effort)
      try {
        const clientsData = await salesManagerService.getClients();
        if (typeof setClients === 'function') {
          setClients(Array.isArray(clientsData) ? clientsData : []);
        }
      } catch (_) {
        // ignore
      }

      setSelectedClientIds([]);
      setShowBulkDeleteModal(false);
    } catch (err) {
      addNotification(err?.message || 'Bulk delete failed', 'error');
    } finally {
      setBulkDeleteSubmitting(false);
    }
  };

  // Tenant Detail View
  if (selectedTenantId) {
    if (tenantDetailLoading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div style={{ ...card, padding: '48px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>Loading tenant details...</p>
          </div>
        </div>
      );
    }
    const c = tenantDetail?.client;
    if (!c) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <button
            type="button"
            style={{ ...backBtn, marginBottom: '16px' }}
            onClick={() => { setSelectedTenantId(null); setTenantDetail(null); }}
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
    const paymentsList = Array.isArray(tenantDetail?.payments) ? tenantDetail.payments : [];
    const privateNotesList = Array.isArray(tenantDetail?.privateNotes) ? tenantDetail.privateNotes : [];
    const depositPaidAmount = tenantDetail?.deposit?.paidAmount ?? tenantDetail?.depositPaidAmount ?? null;
    const depositStatus = tenantDetail?.deposit?.status ?? null;
    const accounting = tenantDetail?.accounting || {};
    const rentPaidInAdvance = accounting.rentPaidInAdvance ?? null;
    const unpaidRentAmount = accounting.unpaidRentAmount ?? null;
    const numberOfMonthsUnpaid = accounting.numberOfMonthsUnpaid ?? null;
    const penaltyToPay = accounting.penaltyToPay ?? null;
    const balanceToPayEstimate = accounting.balanceToPayEstimate ?? null;
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            style={backBtn}
            onClick={() => { setSelectedTenantId(null); setTenantDetail(null); }}
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
                <span style={statusPill(status)}>
                  {status}
                </span>
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
                      .catch((err) => addNotification(err?.message || 'Failed to load maintenance details', 'error'))
                      .finally(() => setMaintenanceDetailLoading(false));
                  };
                  return (
                    <li
                      key={mid ?? idx}
                      style={{ ...alertItem, cursor: mid != null ? 'pointer' : 'default' }}
                      role="button"
                      tabIndex={0}
                      onClick={openMaintenanceDetail}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMaintenanceDetail(); } }}
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
	              <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
	                {paymentsList.slice(0, 5).map((p, idx) => (
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
            <button
              type="button"
              style={btnPrimary}
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
  }

  // Clients list view
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>Tenant List</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>{filteredClients.length} results found</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {selectedClientIds.length > 0 && (
            <button
              type="button"
              style={{ ...btnOutline, borderColor: '#fecaca', color: '#b91c1c' }}
              onClick={openBulkDeleteModal}
              title="Delete selected tenants"
            >
              Delete selected ({selectedClientIds.length})
            </button>
          )}
          <button
            style={btnPrimary}
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
            style={{ ...btnOutline, display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => {
              setImportMode('excel');
              setExcelFile(null);
              setShowTenantCreationModal(true);
            }}
          >
            <FileSpreadsheet size={16} />
            Import from Excel
          </button>
          <button style={btnOutline}>Sort: Creation Date</button>
          <button style={btnOutline}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div style={metricCard}>
          <p style={metricLabel}>Active Tenants</p>
          <p style={metricValue}>
            {filteredClients.filter(client => (client.Status || client.status || '').toString().toLowerCase() === 'active').length}
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', marginLeft: '8px' }}>+1.5%</span>
          </p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Overdue Accounts</p>
          <p style={metricValue}>
            {filteredClients.filter(client => (client.Status || client.status || '').toString().toLowerCase() === 'overdue').length}
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', marginLeft: '8px' }}>-1.5%</span>
          </p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Waiting List</p>
          <p style={metricValue}>
            {filteredClients.filter(client => {
              const s = (client.Status || client.status || '').toString().toLowerCase().replace(/\s+/g, ' ');
              return s === 'waiting list' || s === 'waitinglist';
            }).length}
          </p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Total Monthly Revenue</p>
          <p style={metricValue}>
            {filteredClients.reduce(
              (sum, client) => sum + (client.Amount || client.amount || 0),
              0
            ).toLocaleString()} XOF
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <Filter size={16} style={{ color: '#6b7280' }} />
        <select
          value={clientStatusFilter}
          onChange={(e) => setClientStatusFilter(e.target.value)}
          style={selectStyle}
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
          style={{ ...searchBar, padding: '10px 14px' }}
          aria-label="Search tenants"
        />
        <input
          type="text"
          placeholder="Filter by property"
          value={clientPropertyFilter}
          onChange={(e) => setClientPropertyFilter(e.target.value)}
          style={{ ...searchBar, padding: '10px 14px', minWidth: '180px' }}
          aria-label="Filter by property"
        />
        {(clientStatusFilter || clientPropertyFilter || clientSearchText) && (
          <button
            type="button"
            style={btnOutline}
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

      <div style={card}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Tenants</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Manage all tenant profiles and track their status.</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
          <thead>
            <tr>
                <th style={thStyle} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={(e) => { e.stopPropagation(); toggleSelectAllFiltered(); }}
                    aria-label="Select all filtered tenants"
                  />
                </th>
                <th style={thStyle}>Client</th>
              <th style={thStyle}>Appartment</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Last Payment</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Contact</th>
                <th style={thStyle} />
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map(client => {
                const clientId = client.id ?? client.ID;
                const isSelected = clientId != null && selectedClientIds.includes(clientId);
                return (
              <tr
                key={clientId ?? client.Email ?? client.email}
                onClick={() => clientId != null && setSelectedTenantId(clientId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (clientId != null) setSelectedTenantId(clientId); } }}
                style={{ cursor: clientId != null ? 'pointer' : 'default' }}
              >
                <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => { e.stopPropagation(); toggleSelectClient(clientId); }}
                        aria-label={`Select tenant ${client.Name || client.name || ''}`}
                      />
                </td>
                    <td style={tdStyle}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#1e293b', display: 'block' }}>{client.Name || client.name || 'N/A'}</span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{client.Email || client.email || 'N/A'}</span>
                      </div>
                </td>
                    <td style={tdStyle}>
                      {(() => {
                        const prop = (client.Property || client.property || '').toString().trim();
                        const unit = (client.UnitNumber ?? client.unitNumber ?? client.Unit ?? client.unit ?? '').toString().trim();
                        if (!prop && !unit) return 'N/A';
                        if (prop && unit) return `${prop}, ${unit}`;
                        return prop || unit;
                      })()}
                    </td>
                    <td style={tdStyle}>
                      <span style={statusPill((client.Status || client.status || 'unknown').toLowerCase())}>
                        {client.Status || client.status || 'Unknown'}
                      </span>
                    </td>
                    <td style={tdStyle}>{(client.LastPayment || client.lastPayment) ? new Date(client.LastPayment || client.lastPayment).toLocaleDateString() : 'N/A'}</td>
                    <td style={tdStyle}>{(client.Amount || client.amount || 0).toLocaleString()} XOF</td>
                    <td style={tdStyle}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#1e293b', display: 'block' }}>{client.Phone || client.phone || 'N/A'}</span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{client.Email || client.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <button style={{ ...btnOutline, padding: '6px 12px' }} onClick={() => handleEditClient(client)} title="Edit">Edit</button>
                </td>
              </tr>
                );
              })
            ) : (
              <tr>
                  <td colSpan={8} style={emptyRow}>No tenants found. Start the backend to see real data.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Waiting List Section */}
      {waitingListClients.length > 0 && (
        <div style={{ ...card, marginTop: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Waiting List Tenants</h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Tenants waiting for available properties.</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle} />
                  <th style={thStyle}>Tenant</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>Preferred Property</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {waitingListClients.map(client => (
                  <tr key={client.ID || client.id}>
                    <td style={tdStyle}><input type="checkbox" /></td>
                    <td style={tdStyle}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#1e293b', display: 'block' }}>{client.Name || client.name || 'N/A'}</span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{client.Email || client.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>{client.Phone || client.phone || 'N/A'}</td>
                    <td style={tdStyle}>{client.Property || client.property || 'Any'}</td>
                    <td style={tdStyle}><span style={statusPill('pending')}>Waiting List</span></td>
                    <td style={tdStyle}>
                      <button style={{ ...btnOutline, padding: '6px 12px' }} onClick={() => handleEditClient(client)} title="Edit">Edit</button>
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
        <div style={{ ...card, marginTop: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Unpaid Rents</h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Manage overdue payments and update payment status.</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle} />
                  <th style={thStyle}>Tenant</th>
                  <th style={thStyle}>Property</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {unpaidRents.map(unpaid => (
                  <tr key={unpaid.ID || unpaid.id}>
                    <td style={tdStyle}><input type="checkbox" /></td>
                    <td style={tdStyle}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#1e293b', display: 'block' }}>{unpaid.Name || unpaid.ClientName || 'N/A'}</span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{unpaid.Email || unpaid.ClientEmail || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>{unpaid.Property || 'N/A'}</td>
                    <td style={tdStyle}>{(unpaid.Amount || 0).toLocaleString()} XOF</td>
                    <td style={tdStyle}>{unpaid.DueDate ? new Date(unpaid.DueDate).toLocaleDateString() : 'N/A'}</td>
                    <td style={tdStyle}><span style={statusPill('inactive')}>{unpaid.Status || 'Overdue'}</span></td>
                    <td style={tdStyle}>
                      <button style={{ ...btnOutline, padding: '6px 12px' }} onClick={() => handleEditUnpaidRent(unpaid)} title="Update Payment">Update</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => { if (!bulkDeleteSubmitting) setShowBulkDeleteModal(false); }}
        title="Confirm bulk tenant deletion"
        size="sm"
      >
        <p style={{ marginTop: 0, color: '#6b7280', fontSize: '0.9rem' }}>
          You are about to permanently delete <strong>{selectedClientIds.length}</strong> tenant(s). Enter your password to continue.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="password"
            value={bulkDeletePassword}
            onChange={(e) => setBulkDeletePassword(e.target.value)}
            placeholder="Your password"
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
            disabled={bulkDeleteSubmitting}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              style={btnOutline}
              onClick={() => setShowBulkDeleteModal(false)}
              disabled={bulkDeleteSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              style={{ ...btnPrimary, background: '#dc2626' }}
              onClick={confirmBulkDelete}
              disabled={bulkDeleteSubmitting || !bulkDeletePassword.trim()}
            >
              {bulkDeleteSubmitting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientsTab;
