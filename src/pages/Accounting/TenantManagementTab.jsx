import React, { useState, useEffect } from 'react';
import {
  Search, Download, ArrowLeft, Users, Mail, Phone, MapPin,
  DollarSign, Building, AlertTriangle, Wrench, FileCheck,
  StickyNote, Receipt, MessageSquare, AlertCircle, Send } from
'lucide-react';
import { accountingService } from '../../services/accountingService';
import { salesManagerService } from '../../services/salesManagerService';
import { saveRentReceiptPdf } from '../../utils/rentReceiptPdf';
const card = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
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
const selectStyle = { padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', background: '#fff', cursor: 'pointer', outline: 'none' };
const statusPill = (s) => {
  const sl = (s || '').toLowerCase().replace(/\s+/g, '-');
  const m = {
    occupied: { bg: '#dcfce7', c: '#166534' }, vacant: { bg: '#fef3c7', c: '#92400e' },
    active: { bg: '#dcfce7', c: '#166534' }, inactive: { bg: '#fee2e2', c: '#991b1b' },
    pending: { bg: '#fef3c7', c: '#92400e' }, completed: { bg: '#dcfce7', c: '#166534' },
    available: { bg: '#dbeafe', c: '#1d4ed8' }, sold: { bg: '#f3e8ff', c: '#7c3aed' },
    rented: { bg: '#d1fae5', c: '#065f46' },
    'up-to-date': { bg: '#dcfce7', c: '#166534' },
    '1-month': { bg: '#fef3c7', c: '#92400e' },
    '2-months': { bg: '#fee2e2', c: '#991b1b' },
    '3+months': { bg: '#fee2e2', c: '#991b1b' },
    overdue: { bg: '#fee2e2', c: '#991b1b' }
  };
  const { bg, c } = m[sl] || { bg: '#f1f5f9', c: '#475569' };
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: bg, color: c };
};
const statusLabel = (ps) => {
  switch ((ps || '').toLowerCase()) {
    case 'up-to-date':return 'Active';
    case '1-month':case '2-months':case '3+months':return 'Overdue';
    default:return ps || 'Unknown';
  }
};

const getTenantId = (t) => t?.TenantID ?? t?.tenantId ?? t?.id ?? t?.ID ?? null;




const TenantDetailView = ({ selectedTenant, onBack, addNotification }) => {
  const [tenantDetail, setTenantDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maintenanceDetail, setMaintenanceDetail] = useState(null);
  const [maintenanceDetailLoading, setMaintenanceDetailLoading] = useState(false);
  const [privateNoteInput, setPrivateNoteInput] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [resolvedProperty, setResolvedProperty] = useState(null);
  const [resolvedUnit, setResolvedUnit] = useState(null);
  const [resolvedOccupancy, setResolvedOccupancy] = useState(null);
  const [resolvingProperty, setResolvingProperty] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [showSmsComposer, setShowSmsComposer] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ title: '', description: '', priority: 'Medium' });
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);

  const tenantId = getTenantId(selectedTenant);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    setLoading(true);
    accountingService.getAccountingTenantDetail(tenantId).
    then((data) => {if (!cancelled) setTenantDetail(data);}).
    catch(() => {if (!cancelled) setTenantDetail({ client: selectedTenant });}).
    finally(() => {if (!cancelled) setLoading(false);});
    return () => {cancelled = true;};
  }, [tenantId]);
  useEffect(() => {
    const tenant = tenantDetail?.client;
    const propertyAddr = (tenant?.Property || tenant?.property || '').toString().trim();
    const unitNumber = (tenant?.UnitNumber ?? tenant?.unitNumber ?? '').toString().trim();
    if (!tenantId || !propertyAddr) {
      setResolvedProperty(null);setResolvedUnit(null);setResolvedOccupancy(null);
      return;
    }
    const normalize = (v) => v.toString().toLowerCase().trim().replace(/[.,#]/g, ' ').replace(/\s+/g, ' ');
    let cancelled = false;
    setResolvingProperty(true);
    (async () => {
      try {
        const list = await salesManagerService.getProperties();
        const props = Array.isArray(list) ? list : list?.items || list?.data || [];
        const wanted = normalize(propertyAddr);
        const matchExact = props.find((p) => normalize(p.address ?? p.Address ?? '') === wanted);
        const matchLoose = matchExact ? null : props.find((p) => {const a = normalize(p.address ?? p.Address ?? '');return a && (a.includes(wanted) || wanted.includes(a));});
        const match = matchExact || matchLoose;
        if (cancelled) return;
        if (!match) {setResolvedProperty(null);setResolvedUnit(null);setResolvedOccupancy(null);return;}
        const propertyId = match.id ?? match.ID;
        setResolvedProperty(match);
        if (!propertyId) {setResolvedUnit(null);setResolvedOccupancy(null);return;}
        const detail = await salesManagerService.getPropertyBuildingDetail(propertyId);
        if (cancelled) return;
        const units = Array.isArray(detail?.units) ? detail.units : [];
        const occupiedFromUnits = units.filter((u) => {
          const st = (u.status || u.Status || '').toString().toLowerCase();
          return st === 'occupied' || (u.tenant || u.Tenant || '').toString().trim() !== '';
        }).length;
        if (units.length === 0) {
          const total = Number(match.NumberOfUnits ?? match.numberOfUnits ?? match.totalUnits ?? 1) || 1;
          const st = (match.status ?? match.Status ?? '').toString().trim().toLowerCase();
          const propTenant = (match.tenant ?? match.Tenant ?? '').toString().trim();
          const tName = (tenant?.Name || tenant?.name || '').toString().trim();
          setResolvedOccupancy({ occupied: st === 'occupied' || propTenant !== '' || tName !== '' ? 1 : 0, total });
        } else {
          setResolvedOccupancy({ occupied: occupiedFromUnits, total: units.length });
        }
        const unitNorm = unitNumber.toLowerCase();
        const cmp = (v) => v.toString().trim().toLowerCase().replace(/^unit\s+/i, '').replace(/\s+/g, '');
        const foundUnit = unitNorm ?
        units.find((u) => {const un = (u.unitNumber ?? u.UnitNumber ?? u.name ?? u.Name ?? '').toString().trim();return un && cmp(un) === cmp(unitNorm);}) :
        units.find((u) => (u.tenant || u.Tenant || '').toString().trim().toLowerCase() === (tenant?.Name || tenant?.name || '').toString().trim().toLowerCase()) || null;
        setResolvedUnit(foundUnit || null);
      } catch (_) {
        if (!cancelled) {setResolvedProperty(null);setResolvedUnit(null);setResolvedOccupancy(null);}
      } finally {
        if (!cancelled) setResolvingProperty(false);
      }
    })();
    return () => {cancelled = true;};
  }, [tenantId, tenantDetail]);

  if (loading) {
    return (
      <div style={{ ...card, padding: '48px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>Loading tenant details...</p>
      </div>);

  }

  const c = tenantDetail?.client || selectedTenant;
  if (!c) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <button type="button" style={{ ...backBtn, marginBottom: '16px' }} onClick={onBack}>
          <ArrowLeft size={16} /> Back to list
        </button>
        <div style={card}><p style={subText}>Tenant not found or failed to load.</p></div>
      </div>);

  }

  const prop = tenantDetail?.property;
  const displayProp = resolvedProperty || prop;
  const alertList = Array.isArray(tenantDetail?.alerts) ? tenantDetail.alerts : [];
  const maintenancesList = Array.isArray(tenantDetail?.maintenances) ? tenantDetail.maintenances : [];
  const paymentsList = Array.isArray(tenantDetail?.payments) ? tenantDetail.payments : [];
  const privateNotesList = Array.isArray(tenantDetail?.privateNotes) ? tenantDetail.privateNotes : [];
  const documentsList = Array.isArray(tenantDetail?.documents) ?
  tenantDetail.documents :
  Array.isArray(tenantDetail?.files) ?
  tenantDetail.files :
  Array.isArray(tenantDetail?.attachments) ?
  tenantDetail.attachments :
  [];
  const contractDetail = tenantDetail?.contract || tenantDetail?.lease || tenantDetail?.agreement || null;

  const depositPaidAmount = tenantDetail?.deposit?.paidAmount ?? null;
  const depositStatus = tenantDetail?.deposit?.status ?? null;
  const accounting = tenantDetail?.accounting || {};
  const rentPaidInAdvance = accounting.rentPaidInAdvance ?? null;
  const totalRentCollected = accounting.totalRentCollected ?? null;
  const unpaidRentAmount = accounting.unpaidRentAmount ?? null;
  const numberOfMonthsUnpaid = accounting.numberOfMonthsUnpaid ?? null;
  const penaltyToPay = accounting.penaltyToPay ?? null;
  const balanceToPayEstimate = accounting.balanceToPayEstimate ?? null;

  const name = c.Name || c.name || c.TenantName || c.tenantName || 'N/A';
  const email = c.Email || c.email || '';
  const phone = c.Phone || c.phone || '';
  const rawStatus = c.Status || c.status || c.PaymentStatus || c.paymentStatus || 'Unknown';
  const displayStatus = statusLabel(rawStatus) !== 'Unknown' ? statusLabel(rawStatus) : rawStatus;
  const propertyAddr = c.Property || c.property || '—';
  const unitNumber = c.UnitNumber ?? c.unitNumber ?? '—';
  const amount = c.Amount ?? c.amount ?? c.MonthlyRent ?? c.monthlyRent ?? 0;
  const lastPayment = accounting.lastPaymentDate ?? accounting.LastPaymentDate ??
  c.LastPayment ?? c.lastPayment ?? c.LastPaymentDate ?? c.lastPaymentDate;
  const createdAt = c.CreatedAt ?? c.createdAt;
  const updatedAt = c.UpdatedAt ?? c.updatedAt;

  const openMaintenanceDetail = (mid) => {
    if (mid == null) return;
    setMaintenanceDetailLoading(true);
    setMaintenanceDetail(null);
    salesManagerService.getMaintenance(mid).
    then((data) => setMaintenanceDetail(data)).
    catch((err) => addNotification(err?.message || 'Failed to load maintenance details', 'error')).
    finally(() => setMaintenanceDetailLoading(false));
  };

  const handleAddPrivateNote = async () => {
    const note = (privateNoteInput || '').trim();
    if (!note || !tenantId) return;
    setAddingNote(true);
    try {
      await salesManagerService.addClientNote(tenantId, { note });
      setPrivateNoteInput('');
      const data = await salesManagerService.getClient(tenantId);
      setTenantDetail(data);
      addNotification('Note added', 'success');
    } catch (err) {
      addNotification(err?.message || 'Failed to add note', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const handleGenerateReceipt = async () => {
    const payments = tenantDetail?.payments || [];
    const approved = payments.filter((p) => (p.Status || p.status || '').toLowerCase() === 'approved');
    const latest = approved.length > 0 ? approved[0] : payments[0];
    if (!latest) {addNotification('No payment found to generate a receipt', 'error');return;}
    const monthlyRent = tenantDetail?.accounting?.monthlyRent ?? c.Amount ?? c.amount ?? 0;
    const receiptData = {
      Tenant: c.Name || c.name || '',
      Property: c.Property || c.property || '',
      Unit: c.UnitNumber || c.unitNumber || '',
      Amount: latest.Amount ?? latest.amount ?? 0,
      Method: latest.Method || latest.method || '',
      Date: latest.Date || latest.date || latest.CreatedAt || latest.createdAt,
      ReceiptNumber: latest.ReceiptNumber || latest.receiptNumber,
      MonthlyRent: monthlyRent,
      RentDue: tenantDetail?.accounting?.unpaidRentAmount ?? 0
    };
    try {
      await saveRentReceiptPdf({ item: receiptData, isCollection: false, filename: `receipt-${c.Name || 'tenant'}.pdf` });
      addNotification('Receipt downloaded', 'success');
    } catch {addNotification('Failed to generate receipt', 'error');}
  };

  const handleSendSms = async () => {
    if (!smsText.trim()) return;
    setSmsSending(true);
    try {
      await salesManagerService.sendTenantAlert({ clientId: tenantId, channel: 'sms', message: smsText.trim(), subject: 'Reminder', urgency: 'normal' });
      addNotification('SMS sent successfully', 'success');
      setSmsText('');
      setShowSmsComposer(false);
    } catch (err) {
      addNotification(err?.message || 'Failed to send SMS', 'error');
    } finally {setSmsSending(false);}
  };

  const handleReportIncident = async () => {
    if (!incidentForm.title.trim()) return;
    setIncidentSubmitting(true);
    try {
      await salesManagerService.createMaintenance({
        property: c.Property || c.property || '',
        tenant: c.Name || c.name || '',
        title: incidentForm.title.trim(),
        description: incidentForm.description.trim(),
        priority: incidentForm.priority
      });
      addNotification('Incident reported successfully', 'success');
      setShowIncidentModal(false);
      setIncidentForm({ title: '', description: '', priority: 'Medium' });
    } catch (err) {
      addNotification(err?.message || 'Failed to report incident', 'error');
    } finally {setIncidentSubmitting(false);}
  };

  const openEditModal = () => {
    setEditForm({ name, email, phone, status: rawStatus });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!tenantId) return;
    setEditSubmitting(true);
    try {
      await salesManagerService.updateClient(tenantId, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        status: editForm.status
      });
      addNotification('Tenant updated successfully', 'success');
      setShowEditModal(false);
      const data = await accountingService.getAccountingTenantDetail(tenantId);
      setTenantDetail(data);
    } catch (err) {
      addNotification(err?.message || 'Failed to update tenant', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ marginBottom: '20px' }}>
        <button type="button" style={backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> Back to list
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
              <span style={statusPill(rawStatus)}>{displayStatus}</span>
              {propertyAddr && propertyAddr !== '—' &&
              <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} />{propertyAddr}{unitNumber && unitNumber !== '—' ? ` · ${unitNumber}` : ''}
                </span>
              }
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
            <div style={dlItem}><div style={dtStyle}>Status</div><div style={ddStyle}><span style={statusPill(rawStatus)}>{displayStatus}</span></div></div>
            {createdAt && <div style={dlItem}><div style={dtStyle}>Member since</div><div style={ddStyle}>{new Date(createdAt).toLocaleDateString()}</div></div>}
          </div>
          <h4 style={{ margin: '16px 0 8px', fontSize: '0.9rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCheck size={16} /> Files &amp; documents
          </h4>
          {documentsList.length > 0 ?
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {documentsList.map((doc, idx) => {
              const docName = doc?.name || doc?.title || doc?.fileName || doc?.filename || `Document ${idx + 1}`;
              const docType = doc?.type || doc?.docType || doc?.documentType || '';
              const docUrl = doc?.url || doc?.link || doc?.path || '';
              return (
                <li key={doc?.id || doc?.ID || idx} style={{ ...alertItem, borderLeftColor: '#0ea5e9' }}>
                    <div style={alertTitle}>{docName}</div>
                    <div style={alertMeta}>
                      {docType || 'Document'}
                      {doc?.createdAt && ` · ${new Date(doc.createdAt).toLocaleDateString()}`}
                    </div>
                    {docUrl &&
                  <a href={docUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#2563eb', textDecoration: 'none' }}>
                        Open document
                      </a>
                  }
                  </li>);

            })}
            </ul> :

          <p style={subText}>No files uploaded yet. ID and other tenant documents can be added here for viewing.</p>
          }
        </div>
        <div style={card}>
          <h3 style={sectionTitle}><DollarSign size={18} /> Rent &amp; payment</h3>
          <div style={{ marginTop: '16px' }}>
            <div style={dlItem}><div style={dtStyle}>Property</div><div style={{ ...ddStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {propertyAddr}</div></div>
            {unitNumber && unitNumber !== '—' && <div style={dlItem}><div style={dtStyle}>Unit</div><div style={ddStyle}>{unitNumber}</div></div>}
            <div style={dlItem}><div style={dtStyle}>Monthly rent</div><div style={{ ...ddStyle, fontWeight: 700, fontSize: '1.1rem' }}>{Number(amount).toLocaleString()} XOF</div></div>
            {depositPaidAmount != null &&
            <div style={dlItem}>
                <div style={dtStyle}>Deposit paid amount{depositStatus ? ` (${depositStatus})` : ''}</div>
                <div style={ddStyle}>{Number(depositPaidAmount).toLocaleString()} XOF</div>
              </div>
            }
            {rentPaidInAdvance != null && Number(rentPaidInAdvance) > 0 &&
            <div style={dlItem}><div style={dtStyle}>Rent paid in advance</div><div style={ddStyle}>{Number(rentPaidInAdvance).toLocaleString()} XOF</div></div>
            }
            {unpaidRentAmount != null && Number(unpaidRentAmount) > 0 &&
            <div style={dlItem}><div style={dtStyle}>Unpaid rent</div><div style={ddStyle}>{Number(unpaidRentAmount).toLocaleString()} XOF</div></div>
            }
            {numberOfMonthsUnpaid != null && Number(numberOfMonthsUnpaid) > 0 &&
            <div style={dlItem}><div style={dtStyle}>Months unpaid</div><div style={ddStyle}>{Number(numberOfMonthsUnpaid)}</div></div>
            }
            {penaltyToPay != null && Number(penaltyToPay) > 0 &&
            <div style={dlItem}><div style={dtStyle}>Penalty to pay</div><div style={ddStyle}>{Number(penaltyToPay).toLocaleString()} XOF</div></div>
            }
            {balanceToPayEstimate != null && Number(balanceToPayEstimate) > 0 &&
            <div style={dlItem}><div style={dtStyle}>Balance to pay</div><div style={{ ...ddStyle, fontWeight: 700 }}>{Number(balanceToPayEstimate).toLocaleString()} XOF</div></div>
            }
            <div style={dlItem}><div style={dtStyle}>Last payment</div><div style={ddStyle}>{lastPayment ? new Date(lastPayment).toLocaleDateString() : '—'}</div></div>
            {totalRentCollected != null &&
            <div style={dlItem}>
                <div style={dtStyle}>Total rent collected</div>
                <div style={{ ...ddStyle, fontWeight: 700, color: '#16a34a' }}>{Number(totalRentCollected).toLocaleString()} XOF</div>
              </div>
            }
          </div>
        </div>
        {displayProp &&
        <div style={card}>
            <h3 style={sectionTitle}><Building size={18} /> Property details</h3>
            <div style={{ marginTop: '16px' }}>
              <div style={dlItem}><div style={dtStyle}>Type</div><div style={ddStyle}>{displayProp.type || displayProp.Type || '—'}</div></div>
              {resolvedOccupancy &&
            <div style={dlItem}>
                  <div style={dtStyle}>Occupancy</div>
                  <div style={ddStyle}>{resolvedOccupancy.occupied}/{resolvedOccupancy.total}</div>
                </div>
            }
              {resolvedUnit &&
            <div style={dlItem}>
                  <div style={dtStyle}>Unit status</div>
                  <div style={ddStyle}><span style={statusPill((resolvedUnit.status || resolvedUnit.Status || '').toLowerCase())}>{resolvedUnit.status || resolvedUnit.Status || '—'}</span></div>
                </div>
            }
              {(() => {
              const bedrooms = resolvedUnit?.bedrooms ?? resolvedUnit?.Bedrooms ?? displayProp.bedrooms ?? displayProp.Bedrooms;
              const bathrooms = resolvedUnit?.bathrooms ?? resolvedUnit?.Bathrooms ?? displayProp.bathrooms ?? displayProp.Bathrooms;
              const occupancyStatus = resolvedOccupancy ?
              resolvedOccupancy.total > 0 && resolvedOccupancy.occupied >= resolvedOccupancy.total ? 'Occupied' :
              resolvedOccupancy.occupied === 0 ? 'Vacant' : 'Partially occupied' :
              displayProp.status || displayProp.Status || '';
              return (
                <>
                    {bedrooms != null && <div style={dlItem}><div style={dtStyle}>Bedrooms</div><div style={ddStyle}>{bedrooms}</div></div>}
                    {bathrooms != null && <div style={dlItem}><div style={dtStyle}>Bathrooms</div><div style={ddStyle}>{bathrooms}</div></div>}
                    <div style={dlItem}>
                      <div style={dtStyle}>Property status</div>
                      <div style={ddStyle}><span style={statusPill((occupancyStatus || '').toLowerCase())}>{occupancyStatus || '—'}</span></div>
                    </div>
                    {resolvingProperty && <div style={{ ...subText, marginTop: '6px' }}>Refreshing property details…</div>}
                  </>);

            })()}
            </div>
          </div>
        }

        {contractDetail &&
        <div style={card}>
            <h3 style={sectionTitle}><FileCheck size={18} /> Contract info</h3>
            <div style={{ marginTop: '16px' }}>
              <div style={dlItem}><div style={dtStyle}>Type</div><div style={ddStyle}>{contractDetail.type || contractDetail.contractType || contractDetail.ContractType || '—'}</div></div>
              <div style={dlItem}><div style={dtStyle}>Start date</div><div style={ddStyle}>{contractDetail.startDate || contractDetail.StartDate ? new Date(contractDetail.startDate || contractDetail.StartDate).toLocaleDateString() : '—'}</div></div>
              <div style={dlItem}><div style={dtStyle}>End date</div><div style={ddStyle}>{contractDetail.endDate || contractDetail.EndDate ? new Date(contractDetail.endDate || contractDetail.EndDate).toLocaleDateString() : '—'}</div></div>
              <div style={dlItem}><div style={dtStyle}>Monthly rent</div><div style={ddStyle}>{Number(contractDetail.monthlyRent || contractDetail.MonthlyRent || amount || 0).toLocaleString()} XOF</div></div>
              <div style={dlItem}><div style={dtStyle}>Deposit</div><div style={ddStyle}>{Number(contractDetail.deposit || contractDetail.Deposit || depositPaidAmount || 0).toLocaleString()} XOF</div></div>
              <div style={dlItem}><div style={dtStyle}>Landlord</div><div style={ddStyle}>{contractDetail.landlordName || contractDetail.LandlordName || '—'}</div></div>
              <div style={dlItem}><div style={dtStyle}>Tenant</div><div style={ddStyle}>{contractDetail.tenantName || contractDetail.TenantName || name}</div></div>
              <div style={dlItem}><div style={dtStyle}>Status</div><div style={ddStyle}>{contractDetail.status || contractDetail.Status || '—'}</div></div>
            </div>
          </div>
        }
        <div style={{ ...card, ...(alertList.length ? {} : { gridColumn: '1 / -1' }) }}>
          <h3 style={sectionTitle}><AlertTriangle size={18} /> Alerts &amp; activity</h3>
          {alertList.length > 0 ?
          <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alertList.map((alert, idx) =>
            <li key={alert.ID || alert.id || idx} style={alertItem}>
                  <div style={alertTitle}>{alert.Title || alert.title || 'Alert'}</div>
                  {alert.Message && <div style={{ ...subText, marginBottom: '4px' }}>{alert.Message}</div>}
                  <div style={alertMeta}>
                    {(alert.Urgency || alert.urgency || '').toLowerCase()} · {alert.Status || alert.status || 'Open'}
                    {alert.Amount != null && ` · ${Number(alert.Amount).toLocaleString()} XOF`}
                  </div>
                </li>
            )}
            </ul> :

          <p style={{ ...subText, marginTop: '12px' }}>No alerts for this tenant.</p>
          }
        </div>
        <div style={card}>
          <h3 style={sectionTitle}><Wrench size={18} /> Maintenances requested</h3>
          {maintenancesList.length > 0 ?
          <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {maintenancesList.map((m, idx) => {
              const mid = m.ID ?? m.id;
              return (
                <li
                  key={mid ?? idx}
                  style={{ ...alertItem, cursor: mid != null ? 'pointer' : 'default' }}
                  role="button"
                  tabIndex={0}
                  onClick={() => openMaintenanceDetail(mid)}
                  onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();openMaintenanceDetail(mid);}}}>
                  
                    <div style={alertTitle}>{m.Issue || m.issue || 'Maintenance'}</div>
                    <div style={alertMeta}>
                      {m.Status || m.status || '—'} · {m.Priority || m.priority || '—'}
                      {m.CreatedAt && ` · ${new Date(m.CreatedAt).toLocaleDateString()}`}
                    </div>
                  </li>);

            })}
            </ul> :

          <p style={{ ...subText, marginTop: '12px' }}>No maintenance requests for this tenant.</p>
          }
        </div>
        <div style={card}>
          <h3 style={sectionTitle}><Receipt size={18} /> Recent payment history</h3>
          {paymentsList.length > 0 ?
          <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {paymentsList.slice(0, 5).map((p, idx) =>
            <li key={p.ID || p.id || idx} style={{ ...alertItem, borderLeftColor: (p.Status || p.status) === 'Approved' ? '#16a34a' : '#f59e0b' }}>
                  <div style={alertTitle}>
                    {Number(p.Amount ?? p.amount ?? 0).toLocaleString()} XOF · {p.Status || p.status || '—'}
                  </div>
                  <div style={alertMeta}>
                    {p.Date ? new Date(p.Date).toLocaleDateString() : p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString() : '—'}
                    {(p.Method || p.method) && ` · ${p.Method || p.method}`}
                  </div>
                </li>
            )}
            </ul> :

          <p style={{ ...subText, marginTop: '12px' }}>No payment history for this tenant.</p>
          }
        </div>
        <div style={card}>
          <h3 style={sectionTitle}><StickyNote size={18} /> Private notes</h3>
          <textarea
            value={privateNoteInput}
            onChange={(e) => setPrivateNoteInput(e.target.value)}
            placeholder="Add a note for future reference..."
            rows={2}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.875rem', resize: 'vertical', marginTop: '12px', marginBottom: '10px', boxSizing: 'border-box' }} />
          
          <button
            type="button"
            style={{ ...btnPrimary, marginBottom: '16px' }}
            onClick={handleAddPrivateNote}
            disabled={!privateNoteInput.trim() || addingNote}>
            
            {addingNote ? 'Adding...' : 'Add note'}
          </button>
          {privateNotesList.length > 0 ?
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {privateNotesList.map((n) =>
            <li key={n.id ?? n.ID} style={{ ...alertItem, borderLeftColor: '#6366f1' }}>
                  <div style={alertTitle}>{n.note ?? n.Note}</div>
                  <div style={alertMeta}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : n.CreatedAt ? new Date(n.CreatedAt).toLocaleString() : ''}
                  </div>
                </li>
            )}
            </ul> :

          <p style={{ ...subText, marginTop: 0 }}>No private notes yet.</p>
          }
        </div>
        <div style={card}>
          <h3 style={sectionTitle}><AlertCircle size={18} /> Quick actions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
            <button type="button" style={{ ...btnOutline, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleGenerateReceipt}>
              <Receipt size={16} /> Generate Receipt
            </button>
            <button
              type="button"
              style={{ ...btnOutline, display: 'inline-flex', alignItems: 'center', gap: '6px', ...(showSmsComposer ? { borderColor: '#3b82f6', color: '#2563eb', background: '#eff6ff' } : {}) }}
              onClick={() => {setShowSmsComposer((v) => !v);setSmsText('');}}>
              
              <MessageSquare size={16} /> Send Reminder SMS
            </button>
            <button type="button" style={{ ...btnOutline, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => {setShowIncidentModal(true);setIncidentForm({ title: '', description: '', priority: 'Medium' });}}>
              <AlertCircle size={16} /> Report Incident
            </button>
          </div>
          {showSmsComposer &&
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Sending to: <strong>{phone || 'No phone number saved'}</strong>
              </div>
              <textarea
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="Type your message here..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.88rem', color: '#334155', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" style={{ ...btnOutline, padding: '8px 14px' }} onClick={() => {setShowSmsComposer(false);setSmsText('');}}>Cancel</button>
                <button
                type="button"
                style={{ ...btnPrimary, padding: '8px 18px', opacity: !smsText.trim() || smsSending ? 0.6 : 1 }}
                onClick={handleSendSms}
                disabled={!smsText.trim() || smsSending}>
                
                  <Send size={14} /> {smsSending ? 'Sending…' : 'Send SMS'}
                </button>
              </div>
            </div>
          }
        </div>
      </div>
      <div style={{ ...card, marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}
          </span>
          <button type="button" style={btnPrimary} onClick={openEditModal}>
            Edit tenant
          </button>
        </div>
      </div>
      {showIncidentModal &&
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => !incidentSubmitting && setShowIncidentModal(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Report Incident</h3>
              <button type="button" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowIncidentModal(false)} disabled={incidentSubmitting}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Title *</label>
                <input
                type="text"
                value={incidentForm.title}
                onChange={(e) => setIncidentForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Brief description of the issue"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }} />
              
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea
                value={incidentForm.description}
                onChange={(e) => setIncidentForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Provide more details..."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.88rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
              
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Priority</label>
                <select
                value={incidentForm.priority}
                onChange={(e) => setIncidentForm((f) => ({ ...f, priority: e.target.value }))}
                style={{ ...selectStyle, width: '100%' }}>
                
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" style={btnOutline} onClick={() => setShowIncidentModal(false)} disabled={incidentSubmitting}>Cancel</button>
                <button
                type="button"
                style={{ ...btnPrimary, opacity: !incidentForm.title.trim() || incidentSubmitting ? 0.6 : 1 }}
                onClick={handleReportIncident}
                disabled={!incidentForm.title.trim() || incidentSubmitting}>
                
                  {incidentSubmitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
      {showEditModal &&
      <div
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        onClick={() => {if (!editSubmitting) setShowEditModal(false);}}>
        
          <div
          style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          onClick={(e) => e.stopPropagation()}>
          
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Edit tenant</h3>
              <button type="button" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', padding: '4px' }} onClick={() => setShowEditModal(false)} disabled={editSubmitting}>×</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={dtStyle}>Name</div>
                <input value={editForm.name || ''} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={dtStyle}>Email</div>
                <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={dtStyle}>Phone</div>
                <input value={editForm.phone || ''} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={dtStyle}>Status</div>
                <select value={editForm.status || ''} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', background: '#fff', boxSizing: 'border-box' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Waiting List">Waiting List</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="button" style={btnOutline} onClick={() => setShowEditModal(false)} disabled={editSubmitting}>Cancel</button>
                <button type="submit" style={btnPrimary} disabled={editSubmitting}>{editSubmitting ? 'Saving...' : 'Save changes'}</button>
              </div>
            </form>
          </div>
        </div>
      }
      {(maintenanceDetail != null || maintenanceDetailLoading) &&
      <div
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        onClick={() => {if (!maintenanceDetailLoading) setMaintenanceDetail(null);}}>
        
          <div
          style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          onClick={(e) => e.stopPropagation()}>
          
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Maintenance request details</h3>
              <button type="button" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', padding: '4px' }} onClick={() => setMaintenanceDetail(null)} disabled={maintenanceDetailLoading}>×</button>
            </div>
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {maintenanceDetailLoading ?
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>Loading...</p> :
            maintenanceDetail ?
            <div style={{ display: 'grid', gap: '12px' }}>
                  <div><div style={dtStyle}>Property</div><div style={ddStyle}>{maintenanceDetail.property ?? maintenanceDetail.Property ?? '—'}</div></div>
                  <div><div style={dtStyle}>Tenant</div><div style={ddStyle}>{maintenanceDetail.tenant ?? maintenanceDetail.Tenant ?? '—'}</div></div>
                  <div><div style={dtStyle}>Title</div><div style={ddStyle}>{maintenanceDetail.title ?? maintenanceDetail.Title ?? maintenanceDetail.issue ?? maintenanceDetail.Issue ?? '—'}</div></div>
                  {(maintenanceDetail.description ?? maintenanceDetail.Description) && <div><div style={dtStyle}>Description</div><div style={ddStyle}>{maintenanceDetail.description ?? maintenanceDetail.Description}</div></div>}
                  <div><div style={dtStyle}>Priority</div><div style={ddStyle}><span style={statusPill((maintenanceDetail.priority ?? maintenanceDetail.Priority ?? '').toLowerCase())}>{maintenanceDetail.priority ?? maintenanceDetail.Priority ?? '—'}</span></div></div>
                  <div><div style={dtStyle}>Status</div><div style={ddStyle}><span style={statusPill((maintenanceDetail.status ?? maintenanceDetail.Status ?? '').toLowerCase().replace(/\s+/g, '-'))}>{maintenanceDetail.status ?? maintenanceDetail.Status ?? '—'}</span></div></div>
                  {(maintenanceDetail.assigned ?? maintenanceDetail.Assigned) && <div><div style={dtStyle}>Assigned to</div><div style={ddStyle}>{maintenanceDetail.assigned ?? maintenanceDetail.Assigned}</div></div>}
                  <div><div style={dtStyle}>Date reported</div><div style={ddStyle}>{maintenanceDetail.date ? new Date(maintenanceDetail.date).toLocaleDateString() : maintenanceDetail.Date ? new Date(maintenanceDetail.Date).toLocaleDateString() : '—'}</div></div>
                  <div><div style={dtStyle}>Created</div><div style={ddStyle}>{maintenanceDetail.createdAt ? new Date(maintenanceDetail.createdAt).toLocaleString() : maintenanceDetail.CreatedAt ? new Date(maintenanceDetail.CreatedAt).toLocaleString() : '—'}</div></div>
                  {(maintenanceDetail.estimatedHours ?? maintenanceDetail.EstimatedHours) != null && <div><div style={dtStyle}>Estimated hours</div><div style={ddStyle}>{maintenanceDetail.estimatedHours ?? maintenanceDetail.EstimatedHours}</div></div>}
                  {(maintenanceDetail.estimatedCost ?? maintenanceDetail.EstimatedCost) != null && <div><div style={dtStyle}>Estimated cost</div><div style={ddStyle}>{(maintenanceDetail.estimatedCost ?? maintenanceDetail.EstimatedCost).toLocaleString()} XOF</div></div>}
                  <div><div style={dtStyle}>Quote generated</div><div style={ddStyle}>{maintenanceDetail.quoteGenerated ?? maintenanceDetail.QuoteGenerated ? 'Yes' : 'No'}</div></div>
                  {(maintenanceDetail.workStartDate ?? maintenanceDetail.WorkStartDate) && <div><div style={dtStyle}>Work start date</div><div style={ddStyle}>{new Date(maintenanceDetail.workStartDate ?? maintenanceDetail.WorkStartDate).toLocaleDateString()}</div></div>}
                  {(maintenanceDetail.workEndDate ?? maintenanceDetail.WorkEndDate) && <div><div style={dtStyle}>Work end date</div><div style={ddStyle}>{new Date(maintenanceDetail.workEndDate ?? maintenanceDetail.WorkEndDate).toLocaleDateString()}</div></div>}
                  {(maintenanceDetail.completedAt ?? maintenanceDetail.CompletedAt) && <div><div style={dtStyle}>Completed at</div><div style={ddStyle}>{new Date(maintenanceDetail.completedAt ?? maintenanceDetail.CompletedAt).toLocaleString()}</div></div>}
                  <div><div style={dtStyle}>Archived</div><div style={ddStyle}>{maintenanceDetail.archived ?? maintenanceDetail.Archived ? 'Yes' : 'No'}</div></div>
                  {Array.isArray(maintenanceDetail.photos ?? maintenanceDetail.Photos) && (maintenanceDetail.photos ?? maintenanceDetail.Photos).length > 0 &&
              <div>
                      <div style={{ ...dtStyle, marginBottom: '8px' }}>Photos</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(maintenanceDetail.photos ?? maintenanceDetail.Photos).map((url, i) =>
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`Photo ${i + 1}`} style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                          </a>
                  )}
                      </div>
                    </div>
              }
                </div> :
            null}
            </div>
          </div>
        </div>
      }
    </div>);

};




const TenantManagementTab = ({ loading, addNotification, tenants = [] }) => {
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');

  const getName = (t) => t.TenantName || t.tenantName || t.Name || t.name || '';
  const getEmail = (t) => t.Email || t.email || '';
  const getPhone = (t) => t.Phone || t.phone || '';
  const getProp = (t) => t.Property || t.property || '';
  const getPS = (t) => t.PaymentStatus || t.paymentStatus || '';
  const getLP = (t) => t.LastPaymentDate || t.lastPaymentDate || null;
  const getAmt = (t) => t.MonthlyRent || t.monthlyRent || t.Amount || t.amount || 0;

  const filtered = tenants.filter((t) => {
    const ps = getPS(t).toLowerCase();
    if (statusFilter === 'Active' && ps !== 'up-to-date') return false;
    if (statusFilter === 'Overdue' && !['1-month', '2-months', '3+months'].includes(ps)) return false;
    if (propertyFilter.trim() && !getProp(t).toLowerCase().includes(propertyFilter.trim().toLowerCase())) return false;
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      if (!getName(t).toLowerCase().includes(q) && !getEmail(t).toLowerCase().includes(q) && !getPhone(t).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeCount = tenants.filter((t) => getPS(t).toLowerCase() === 'up-to-date').length;
  const overdueCount = tenants.filter((t) => ['1-month', '2-months', '3+months'].includes(getPS(t).toLowerCase())).length;
  const totalRevenue = tenants.reduce((s, t) => s + getAmt(t), 0);

  const exportCSV = () => {
    if (filtered.length === 0) {addNotification('No tenants to export', 'info');return;}
    const headers = ['Name', 'Email', 'Phone', 'Property', 'Status', 'Last Payment', 'Monthly Rent (XOF)'];
    const rows = filtered.map((t) => [
    getName(t), getEmail(t), getPhone(t), getProp(t),
    statusLabel(getPS(t)),
    getLP(t) ? new Date(getLP(t)).toLocaleDateString() : '',
    String(getAmt(t))]
    );
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `tenants-${new Date().toISOString().split('T')[0]}.csv`;
    a.style.visibility = 'hidden';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    addNotification(`Exported ${filtered.length} tenants`, 'success');
  };

  if (selectedTenant) {
    return (
      <TenantDetailView
        selectedTenant={selectedTenant}
        onBack={() => setSelectedTenant(null)}
        addNotification={addNotification} />);


  }

  return (
    <div className="sa-clients-page">
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <Search size={16} style={{ color: '#6b7280' }} />
        <input
          type="text"
          placeholder="Search by name, email or phone"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '220px', fontSize: '0.875rem' }} />
        
        <input
          type="text"
          placeholder="Filter by property"
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '180px', fontSize: '0.875rem' }} />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '140px', fontSize: '0.875rem' }}>
          
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Overdue">Overdue</option>
        </select>
        {(statusFilter || propertyFilter || searchText) &&
        <button
          type="button"
          className="action-button secondary"
          style={{ padding: '8px 14px', fontSize: '0.875rem' }}
          onClick={() => {setStatusFilter('');setPropertyFilter('');setSearchText('');}}>
          
            Clear filters
          </button>
        }
      </div>
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
              {loading ?
              <tr><td colSpan={6} className="sa-table-empty">Loading tenants…</td></tr> :
              filtered.length === 0 ?
              <tr><td colSpan={6} className="sa-table-empty">No tenants found.</td></tr> :
              filtered.map((tenant, idx) => {
                const id = getTenantId(tenant);
                const ps = getPS(tenant);
                const lp = getLP(tenant);
                return (
                  <tr
                    key={id ?? idx}
                    onClick={() => setSelectedTenant(tenant)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();setSelectedTenant(tenant);}}}
                    style={{ cursor: 'pointer' }}>
                    
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{getName(tenant) || 'N/A'}</span>
                        <span className="sa-cell-sub">{getEmail(tenant)}</span>
                      </div>
                    </td>
                    <td>{getProp(tenant) || 'N/A'}</td>
                    <td><span style={statusPill(ps)}>{statusLabel(ps)}</span></td>
                    <td>{lp ? new Date(lp).toLocaleDateString() : 'N/A'}</td>
                    <td>{getAmt(tenant).toLocaleString()} XOF</td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{getPhone(tenant) || 'N/A'}</span>
                        <span className="sa-cell-sub">{getEmail(tenant)}</span>
                      </div>
                    </td>
                  </tr>);

              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

};

export default TenantManagementTab;
