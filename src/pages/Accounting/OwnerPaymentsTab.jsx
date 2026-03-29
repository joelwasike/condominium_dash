import React from 'react';
import { Plus, Download, ArrowLeft } from 'lucide-react';
import { accountingService } from '../../services/accountingService';
import { t } from '../../utils/i18n';

const OwnerPaymentsTab = (props) => {
  const { loading, setLoading, addNotification, landlordPayments, setLandlordPayments, collections, ownerBalancesOwners, ownerBalancesLoading, selectedOwnerForPaymentsHistory, setSelectedOwnerForPaymentsHistory, ownerView, setOwnerView, ownerPaymentsLandlordFilter, setOwnerPaymentsLandlordFilter, ownerPaymentsBuildingFilter, setOwnerPaymentsBuildingFilter, ownerPaymentsStartDate, setOwnerPaymentsStartDate, ownerPaymentsEndDate, setOwnerPaymentsEndDate, ownerPaymentsMonthFilter, setOwnerPaymentsMonthFilter, selectedLandlord, setSelectedLandlord, setLandlordProperties, setShowLandlordPaymentModal, transferToLandlord } = props;

  const renderOwnerTransactionHistory = (owner) => {
    const ownerPayments = landlordPayments.filter(p => { const pL = (p.Landlord || p.landlord || '').trim(); return pL && (pL === owner || pL.toLowerCase() === owner.toLowerCase()); });
    const ownerCollections = collections.filter(c => { const cL = (c.Landlord || c.landlord || '').trim(); return cL && (cL === owner || cL.toLowerCase() === owner.toLowerCase()); });
    const merged = [...ownerPayments.map(p => ({ ...p, _type: 'payout', _date: p.Date || p.date || p.CreatedAt || p.createdAt })), ...ownerCollections.map(c => ({ ...c, _type: 'collection', _date: c.Date || c.date || c.CreatedAt || c.createdAt }))].sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0));
    if (merged.length === 0) return <div className="no-data">No transactions for this owner.</div>;
    return (<div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>Date</th><th>Type</th><th>Building</th><th>Amount</th><th>Status</th></tr></thead><tbody>{merged.map((item, idx) => { const isCollection = item._type === 'collection'; const amount = isCollection ? (item.Amount || item.amount || 0) : (item.NetAmount || item.netAmount || 0); return (<tr key={idx}><td>{item._date ? new Date(item._date).toLocaleDateString() : 'N/A'}</td><td><span className={`sa-status-pill ${isCollection ? 'success' : 'info'}`}>{isCollection ? 'Collection' : 'Payout'}</span></td><td>{item.Building || item.building || '-'}</td><td style={{ color: isCollection ? '#059669' : '#dc2626', fontWeight: '600' }}>{isCollection ? '+' : '-'}{amount.toFixed(2)} XOF</td><td>{item.Status || item.status || (isCollection ? 'Collected' : '-')}</td></tr>); })}</tbody></table></div>);
  };

  return (
    <div>
      <div className="sa-section-card" style={{ marginBottom: '24px' }}>
        <div className="sa-section-header">
          <div><h2>Owner Payments</h2><p>Manage transfers to property owners</p></div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setOwnerView('owners')} className={ownerView === 'owners' ? 'sa-primary-cta' : 'sa-outline-button'}>List Owners</button>
            <button onClick={() => setOwnerView('payments')} className={ownerView === 'payments' ? 'sa-primary-cta' : 'sa-outline-button'}>Owner Payments</button>
          </div>
        </div>

        {selectedOwnerForPaymentsHistory ? (
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="button" className="sa-outline-button" onClick={() => setSelectedOwnerForPaymentsHistory(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ArrowLeft size={16} /> Back to {ownerView === 'owners' ? 'owners' : 'payments'}</button>
              <h3 style={{ margin: 0 }}>{selectedOwnerForPaymentsHistory} - Transaction History</h3>
            </div>
            {renderOwnerTransactionHistory(selectedOwnerForPaymentsHistory)}
          </div>
        ) : ownerView === 'owners' ? (
          <div>
            {ownerBalancesLoading ? <div className="loading">Loading owners...</div> : ownerBalancesOwners.length === 0 ? <div className="no-data">No owners found.</div> : (
              <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>Owner Name</th><th>Email</th><th className="table-menu"></th></tr></thead><tbody>
                {ownerBalancesOwners.map((owner, index) => { const name = owner.Name || owner.name || owner.Landlord || owner.landlord || 'N/A'; return (<tr key={owner.ID || owner.id || index} onClick={() => setSelectedOwnerForPaymentsHistory(name)} style={{ cursor: 'pointer' }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedOwnerForPaymentsHistory(name); } }}><td><span className="sa-cell-title">{name}</span></td><td>{owner.Email || owner.email || 'N/A'}</td><td className="table-menu" onClick={(e) => e.stopPropagation()}><button className="table-action-button edit" onClick={() => { setSelectedLandlord(owner); setLandlordProperties(null); setShowLandlordPaymentModal(true); }}>Record Payment</button></td></tr>); })}
              </tbody></table></div>
            )}
          </div>
        ) : null}

        {ownerView === 'payments' && !selectedOwnerForPaymentsHistory && (
          <div className="sa-section-card">
            <div className="sa-section-header"><div><h2>Owner Payment Table</h2><p>Net payments after commission deduction</p></div><button className="sa-primary-cta" onClick={() => setShowLandlordPaymentModal(true)} disabled={loading}><Plus size={18} /> Register Owner Payment</button></div>
            <div className="sa-filters-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
              <select className="sa-filter-select" value={ownerPaymentsLandlordFilter} onChange={(e) => setOwnerPaymentsLandlordFilter(e.target.value)}><option value="">All Owners</option>{ownerBalancesOwners.map((o) => { const name = o.Name || o.name || o.Landlord || o.landlord || ''; return name ? <option key={o.ID || o.id} value={name}>{name}</option> : null; })}{ownerBalancesOwners.length === 0 && [...new Set(landlordPayments.map(p => p.Landlord || p.landlord).filter(Boolean))].map((name, i) => (<option key={i} value={name}>{name}</option>))}</select>
              <select className="sa-filter-select" value={ownerPaymentsBuildingFilter} onChange={(e) => setOwnerPaymentsBuildingFilter(e.target.value)}><option value="">All Buildings</option>{[...new Set(landlordPayments.map(p => p.Building || p.building).filter(Boolean))].sort().map((b, i) => (<option key={i} value={b}>{b}</option>))}</select>
              <input type="month" className="sa-filter-select" value={ownerPaymentsMonthFilter} onChange={(e) => setOwnerPaymentsMonthFilter(e.target.value)} title="Filter by month" />
              <input type="date" className="sa-filter-select" value={ownerPaymentsStartDate} onChange={(e) => setOwnerPaymentsStartDate(e.target.value)} title="Start date" />
              <input type="date" className="sa-filter-select" value={ownerPaymentsEndDate} onChange={(e) => setOwnerPaymentsEndDate(e.target.value)} title="End date" />
            </div>
            {loading ? <div className="loading">Loading landlord payments...</div> : (() => {
              const isPaymentForOwner = (p) => { const pVal = (p.Landlord || p.landlord || '').toString().trim(); if (!pVal) return false; return ownerBalancesOwners.some(o => { const oId = String(o.id || o.ID || ''); const oName = (o.Name || o.name || o.Landlord || o.landlord || '').toString().trim(); return oId === pVal || oName === pVal || (oName && oName.toLowerCase() === pVal.toLowerCase()); }); };
              const getOwnerDisplayName = (p) => { const pVal = (p.Landlord || p.landlord || '').toString().trim(); const owner = ownerBalancesOwners.find(o => { const oId = String(o.id || o.ID || ''); const oName = (o.Name || o.name || o.Landlord || o.landlord || '').toString().trim(); return oId === pVal || oName === pVal || (oName && oName.toLowerCase() === pVal.toLowerCase()); }); return owner ? (owner.Name || owner.name || owner.Landlord || owner.landlord || 'N/A') : 'N/A'; };
              const filtered = landlordPayments.filter(p => {
                if (!isPaymentForOwner(p)) return false;
                if (ownerPaymentsLandlordFilter) { const selectedOwner = ownerBalancesOwners.find(o => (o.Name || o.name || o.Landlord || o.landlord || '').toString().trim() === ownerPaymentsLandlordFilter); if (!selectedOwner) return false; const pVal = (p.Landlord || p.landlord || '').toString().trim(); const oId = String(selectedOwner.id || selectedOwner.ID || ''); const oName = (selectedOwner.Name || selectedOwner.name || selectedOwner.Landlord || selectedOwner.landlord || '').toString().trim(); if (pVal !== oId && pVal !== oName && !(oName && pVal.toLowerCase() === oName.toLowerCase())) return false; }
                if (ownerPaymentsBuildingFilter && (p.Building || p.building) !== ownerPaymentsBuildingFilter) return false;
                const d = p.Date || p.date || p.CreatedAt || p.createdAt;
                if (ownerPaymentsMonthFilter && d) { const pd = new Date(d); const [y, m] = ownerPaymentsMonthFilter.split('-').map(Number); if (pd.getFullYear() !== y || pd.getMonth() + 1 !== m) return false; }
                if (ownerPaymentsStartDate && d && new Date(d) < new Date(ownerPaymentsStartDate)) return false;
                if (ownerPaymentsEndDate && d && new Date(d) > new Date(ownerPaymentsEndDate + 'T23:59:59')) return false;
                return true;
              });
              return filtered.length === 0 ? <div className="no-data">No landlord payments found</div> : (
                <><div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'flex-end' }}><button className="sa-outline-button" onClick={() => { const headers = ['Date','Landlord','Building','Net Amount','Commission','Status']; const rows = filtered.map(p => [(p.Date || p.date ? new Date(p.Date || p.date).toLocaleDateString() : ''), getOwnerDisplayName(p), p.Building || p.building || '', (p.NetAmount || p.netAmount || 0).toFixed(2), (p.Commission || p.commission || 0).toFixed(2), p.Status || p.status || '']); const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n'); const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'owner-payments-export.csv'; a.click(); addNotification('Owner payments exported', 'success'); }} title="Export filtered payments to CSV"><Download size={16} /> Export</button></div>
                <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>Landlord</th><th>Building</th><th>Net Amount</th><th>Commission</th><th>Transaction Type</th><th>Date</th><th>Status</th><th className="table-menu"></th></tr></thead><tbody>
                  {filtered.map((payment, index) => { const landlordName = getOwnerDisplayName(payment); return (<tr key={payment.ID || `landlord-payment-${index}`} onClick={() => setSelectedOwnerForPaymentsHistory(landlordName)} style={{ cursor: 'pointer' }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedOwnerForPaymentsHistory(landlordName); } }}>
                    <td><span className="sa-cell-title">{landlordName}</span></td><td>{payment.Building || 'N/A'}</td><td>{payment.NetAmount?.toFixed(2) || '0.00'} XOF</td><td>{payment.Commission?.toFixed(2) || '0.00'} XOF</td><td>Payout</td><td>{payment.Date ? new Date(payment.Date).toLocaleDateString() : 'N/A'}</td>
                    <td><span className={`sa-status-pill ${(payment.Status || 'unknown').toLowerCase()}`}>{payment.Status || 'Unknown'}</span></td>
                    <td className="table-menu" onClick={(e) => e.stopPropagation()}><div className="sa-row-actions">{(() => { const status = (payment.Status || '').toLowerCase(); const isDirector = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase() === 'agency_director'; const needsApproval = ['pending', 'pending approval', 'pending director approval', 'pending_approval'].includes(status); if (needsApproval && isDirector) { return <button className="table-action-button edit" onClick={(e) => { e.stopPropagation(); (async () => { try { setLoading(true); await accountingService.approveLandlordPayment(payment.ID); const updated = await accountingService.getLandlordPayments(); setLandlordPayments(Array.isArray(updated) ? updated : (updated?.payments ?? updated?.landlordPayments ?? [])); addNotification('Payment approved by director', 'success'); } catch (err) { addNotification(err.message || 'Failed to approve', 'error'); } finally { setLoading(false); } })(); }} title="Director: Approve Payment">Approve</button>; } if (status !== 'paid' && status !== 'completed' && !needsApproval) { return <button className="table-action-button edit" onClick={(e) => { e.stopPropagation(); transferToLandlord(payment.ID); }} title="Mark as Completed">Mark Completed</button>; } if (status === 'paid' || status === 'completed') { return <span className="sa-status-pill success" style={{ padding: '4px 12px' }}>Completed</span>; } return <span className="sa-status-pill" style={{ padding: '4px 12px' }}>Pending Approval</span>; })()}</div></td>
                  </tr>); })}
                </tbody></table></div></>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

// Landlord Payment Modal
OwnerPaymentsTab.LandlordModal = (props) => {
  const { loading, setLoading, addNotification, setShowLandlordPaymentModal, selectedLandlord, setSelectedLandlord, ownerBalancesOwners, landlords, setLandlordPayments } = props;
  return (<div className="modal-overlay" onClick={() => setShowLandlordPaymentModal(false)}><div className="modal-content" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h3>Record Landlord Payment</h3><button className="modal-close" onClick={() => setShowLandlordPaymentModal(false)}>x</button></div><div className="modal-body"><form onSubmit={async (e) => { e.preventDefault(); try { setLoading(true); const formData = new FormData(e.target); const newPayment = await accountingService.recordLandlordPayment({ landlord: formData.get('landlord'), netAmount: parseFloat(formData.get('netAmount')) }); setLandlordPayments(prev => [newPayment, ...prev]); addNotification('Landlord payment recorded successfully!', 'success'); setShowLandlordPaymentModal(false); e.target.reset(); setSelectedLandlord(null); } catch (error) { console.error('Error recording landlord payment:', error); addNotification('Failed to record landlord payment. Please try again.', 'error'); } finally { setLoading(false); } }}>
    <div className="form-group"><label>Owner / Landlord *</label><select name="landlord" required defaultValue={selectedLandlord ? (selectedLandlord.id || selectedLandlord.ID) : ''} onChange={(e) => { const id = e.target.value; const ownersForModal = ownerBalancesOwners.length > 0 ? ownerBalancesOwners : landlords; setSelectedLandlord(ownersForModal.find(o => String(o.id || o.ID) === id) || null); }}><option value="">Select Owner</option>{(ownerBalancesOwners.length > 0 ? ownerBalancesOwners : landlords).map((o) => (<option key={o.id || o.ID} value={o.id || o.ID}>{o.Name || o.name || o.Landlord || o.landlord || 'N/A'} {o.Email || o.email ? `(${o.Email || o.email})` : ''}</option>))}</select></div>
    <div className="form-group"><label>Net Amount (XOF) *</label><input type="number" name="netAmount" step="0.01" required placeholder="Enter amount" /><small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>Commission is automatically calculated and deducted by the backend.</small></div>
    <div className="modal-footer"><button type="button" className="action-button secondary" onClick={() => setShowLandlordPaymentModal(false)}>{t('accounting.cancel')}</button><button type="submit" className="action-button primary" disabled={loading}>{loading ? t('accounting.recording') : t('accounting.recordPayment')}</button></div>
  </form></div></div></div>);
};

export default OwnerPaymentsTab;
