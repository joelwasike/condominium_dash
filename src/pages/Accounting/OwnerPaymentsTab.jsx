import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { accountingService } from '../../services/accountingService';
import { t } from '../../utils/i18n';

const money = (v) => `${Number(v || 0).toFixed(2)} XOF`;

const OwnerPaymentsTab = (props) => {
  const {
    loading,
    setLoading,
    addNotification,
    landlordPayments,
    setLandlordPayments,
    collections,
    expenses,
    ownerBalancesOwners,
    ownerBalancesLoading,
    selectedOwnerForPaymentsHistory,
    setSelectedOwnerForPaymentsHistory,
    ownerView,
    setOwnerView,
    ownerPaymentsLandlordFilter,
    setOwnerPaymentsLandlordFilter,
    ownerPaymentsBuildingFilter,
    setOwnerPaymentsBuildingFilter,
    ownerPaymentsStartDate,
    setOwnerPaymentsStartDate,
    ownerPaymentsEndDate,
    setOwnerPaymentsEndDate,
    ownerPaymentsMonthFilter,
    setOwnerPaymentsMonthFilter,
    selectedLandlord,
    setSelectedLandlord,
    setLandlordProperties,
    setShowLandlordPaymentModal,
    transferToLandlord
  } = props;

  const [ownersSummary, setOwnersSummary] = useState([]);
  const [ownersSummaryLoading, setOwnersSummaryLoading] = useState(false);
  const [showOwnerRentSummary, setShowOwnerRentSummary] = useState(false);

  const ownersRows = useMemo(() => {
    return (ownersSummary || []).map((s, idx) => {
      const ownerName = s.ownerName || s.OwnerName || s.landlord || s.Landlord || '—';
      const expectedRents = s.expectedRents ?? s.ExpectedRents ?? 0;
      const collectedRents = s.collectedRents ?? s.CollectedRents ?? 0;
      const expensesAmount = s.expensesAmount ?? s.ExpensesAmount ?? 0;
      const agencyCommission = s.agencyCommission ?? s.AgencyCommission ?? 0;
      const amountToBePaid = s.amountToBePaid ?? s.AmountToBePaid ?? s.amountToBeRepaid ?? s.AmountToBeRepaid ?? 0;
      const commissionPercentage = s.commissionPercentage ?? s.CommissionPercentage ?? 0;
      const period = s.period ?? s.Period ?? '';
      return { key: s.ownerId || s.OwnerID || idx, ownerName, expectedRents, collectedRents, expensesAmount, agencyCommission, amountToBePaid, commissionPercentage, period };
    });
  }, [ownersSummary]);

  useEffect(() => {
    if (ownerView !== 'owners') return;
    (async () => {
      try {
        setOwnersSummaryLoading(true);
        const data = await accountingService.getOwnersSummary();
        setOwnersSummary(Array.isArray(data) ? data : []);
      } catch (e) {
        setOwnersSummary([]);
      } finally {
        setOwnersSummaryLoading(false);
      }
    })();
  }, [ownerView]);

  const summaryByOwnerId = useMemo(() => {
    const m = new Map();
    (ownersSummary || []).forEach((s) => {
      const id = s.ownerId ?? s.OwnerID ?? s.ownerID ?? s.id;
      if (id) m.set(String(id), s);
    });
    return m;
  }, [ownersSummary]);

  const summaryByOwnerName = useMemo(() => {
    const m = new Map();
    (ownersSummary || []).forEach((s) => {
      const name = (s.ownerName || s.OwnerName || '').trim();
      if (name) m.set(name.toLowerCase(), s);
    });
    return m;
  }, [ownersSummary]);

  const renderOwnerTransactionHistory = (ownerName) => {
    const owner = (ownerName || '').trim();
    const ownerPayments = landlordPayments.filter((p) => {
      const pL = (p.Landlord || p.landlord || '').trim();
      return pL && (pL === owner || pL.toLowerCase() === owner.toLowerCase());
    });
    const ownerCollections = collections.filter((c) => {
      const cL = (c.Landlord || c.landlord || '').trim();
      return cL && (cL === owner || cL.toLowerCase() === owner.toLowerCase());
    });
    const merged = [
    ...ownerPayments.map((p) => ({ ...p, _type: 'payout', _date: p.Date || p.date || p.CreatedAt || p.createdAt })),
    ...ownerCollections.map((c) => ({ ...c, _type: 'collection', _date: c.Date || c.date || c.CreatedAt || c.createdAt }))].
    sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0));

    if (merged.length === 0) return <div className="no-data">No transactions for this owner.</div>;

    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Building</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {merged.map((item, idx) => {
              const isCollection = item._type === 'collection';
              const amount = isCollection ? item.Amount || item.amount || 0 : item.NetAmount || item.netAmount || 0;
              const date = item._date ? new Date(item._date).toLocaleDateString() : 'N/A';
              const building = item.Building || item.building || '—';
              const status = item.Status || item.status || (isCollection ? 'Collected' : '—');
              return (
                <tr key={idx}>
                  <td>{date}</td>
                  <td>
                    <span className={`sa-status-pill ${isCollection ? 'success' : 'info'}`}>{isCollection ? 'Collection' : 'Payout'}</span>
                  </td>
                  <td>{building}</td>
                  <td style={{ color: isCollection ? '#059669' : '#dc2626', fontWeight: 600 }}>
                    {isCollection ? '+' : '-'}
                    {money(amount)}
                  </td>
                  <td>{status}</td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>);

  };

  const filteredLandlordPayments = useMemo(() => {
    const landlordFilter = (ownerPaymentsLandlordFilter || '').trim().toLowerCase();
    const buildingFilter = (ownerPaymentsBuildingFilter || '').trim().toLowerCase();
    const startDate = ownerPaymentsStartDate ? new Date(ownerPaymentsStartDate) : null;
    const endDate = ownerPaymentsEndDate ? new Date(ownerPaymentsEndDate) : null;

    return (Array.isArray(landlordPayments) ? landlordPayments : []).filter((p) => {
      const landlordName = (p.Landlord || p.landlord || '').toString();
      const building = (p.Building || p.building || '').toString();
      const dateRaw = p.Date || p.date || p.CreatedAt || p.createdAt;
      const dt = dateRaw ? new Date(dateRaw) : null;

      if (landlordFilter && !landlordName.toLowerCase().includes(landlordFilter)) return false;
      if (buildingFilter && !building.toLowerCase().includes(buildingFilter)) return false;
      if (startDate && dt && dt < startDate) return false;
      if (endDate && dt && dt > endDate) return false;
      return true;
    });
  }, [
  landlordPayments,
  ownerPaymentsLandlordFilter,
  ownerPaymentsBuildingFilter,
  ownerPaymentsStartDate,
  ownerPaymentsEndDate]
  );

  return (
    <div>
      <div className="sa-section-card" style={{ marginBottom: '24px' }}>
        <div className="sa-section-header">
          <div>
            <h2>Owner Payments</h2>
            <p>Manage transfers to property owners</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setOwnerView('owners')} className={ownerView === 'owners' ? 'sa-primary-cta' : 'sa-outline-button'}>List Owners</button>
            <button onClick={() => setOwnerView('payments')} className={ownerView === 'payments' ? 'sa-primary-cta' : 'sa-outline-button'}>Owner Payments</button>
          </div>
        </div>

        {selectedOwnerForPaymentsHistory ?
        <div>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
              type="button"
              className="sa-outline-button"
              onClick={() => setSelectedOwnerForPaymentsHistory(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              
                <ArrowLeft size={16} /> Back to {ownerView === 'owners' ? 'owners' : 'payments'}
              </button>
              <h3 style={{ margin: 0 }}>{selectedOwnerForPaymentsHistory} - Transaction History</h3>
            </div>
            {renderOwnerTransactionHistory(selectedOwnerForPaymentsHistory)}
          </div> :
        ownerView === 'owners' ?
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button type="button" className="sa-outline-button" onClick={() => setShowOwnerRentSummary((v) => !v)}>
                Expected rents vs received
              </button>
            </div>

            {showOwnerRentSummary &&
          <div className="sa-section-card" style={{ marginBottom: '18px' }}>
                <div className="sa-section-header">
                  <div>
                    <h3 style={{ margin: 0 }}>Expected rents per owner vs. rents received</h3>
                    <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>This month</p>
                  </div>
                </div>
                {ownersSummaryLoading ?
            <div className="loading">Loading owners summary...</div> :
            ownersRows.length === 0 ?
            <div className="no-data">No owners found.</div> :

            <div className="sa-table-wrapper">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Owner</th>
                          <th>Expected rents</th>
                          <th>Rents received</th>
                          <th>Unpaid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ownersRows.map((r) => {
                    const unpaidOwner = Math.max(0, Number(r.expectedRents || 0) - Number(r.collectedRents || 0));
                    return (
                      <tr key={r.key}>
                              <td><span className="sa-cell-title">{r.ownerName}</span></td>
                              <td>{money(r.expectedRents)}</td>
                              <td style={{ color: '#059669', fontWeight: 700 }}>{money(r.collectedRents)}</td>
                              <td style={{ color: '#dc2626', fontWeight: 700 }}>{money(unpaidOwner)}</td>
                            </tr>);

                  })}
                      </tbody>
                    </table>
                  </div>
            }
              </div>
          }

            {ownerBalancesLoading || ownersSummaryLoading ?
          <div className="loading">Loading owners...</div> :
          ownerBalancesOwners.length === 0 ?
          <div className="no-data">No owners found.</div> :

          <div className="sa-table-wrapper">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Owner Name</th>
                          <th>Expected rents</th>
                          <th>Collected rents</th>
                          <th>Amount of expenses</th>
                          <th>Agency commission</th>
                          <th>Amount to be paid</th>
                          <th>Period</th>
                          <th className="table-menu"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ownerBalancesOwners.map((owner, index) => {
                  const ownerId = owner.ID || owner.id;
                  const name = owner.Name || owner.name || owner.Landlord || owner.landlord || 'N/A';
                  const summary = ownerId && summaryByOwnerId.get(String(ownerId)) || summaryByOwnerName.get(String(name).toLowerCase());
                  const expected = summary?.expectedRents ?? summary?.ExpectedRents ?? 0;
                  const collected = summary?.collectedRents ?? summary?.CollectedRents ?? 0;
                  const exp = summary?.expensesAmount ?? summary?.ExpensesAmount ?? 0;
                  const agencyCommission = summary?.agencyCommission ?? summary?.AgencyCommission ?? 0;
                  const amountToBePaid = summary?.amountToBePaid ?? summary?.AmountToBePaid ?? summary?.amountToBeRepaid ?? summary?.AmountToBeRepaid ?? 0;
                  const period = summary?.period ?? summary?.Period ?? 'This month';
                  return (
                    <tr
                      key={ownerId || index}
                      onClick={() => setSelectedOwnerForPaymentsHistory(name)}
                      style={{ cursor: 'pointer' }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();setSelectedOwnerForPaymentsHistory(name);}}}>
                      
                              <td><span className="sa-cell-title">{name}</span></td>
                              <td>{money(expected)}</td>
                              <td>{money(collected)}</td>
                              <td>{money(exp)}</td>
                              <td style={{ fontWeight: 700 }}>{money(agencyCommission)}</td>
                              <td style={{ fontWeight: 700 }}>{money(amountToBePaid)}</td>
                              <td>{period}</td>
                              <td className="table-menu" onClick={(e) => e.stopPropagation()}>
                                <button
                          className="table-action-button edit"
                          onClick={() => {
                            setSelectedLandlord(owner);
                            setLandlordProperties(null);
                            setShowLandlordPaymentModal(true);
                          }}>
                          
                              Record Payment
                            </button>
                          </td>
                        </tr>);

                })}
                  </tbody>
                </table>
              </div>
          }
          </div> :

        <div className="sa-section-card">
            <div className="sa-section-header">
              <div>
                <h3 style={{ margin: 0 }}>Owner payments</h3>
                <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>Transfers to owners</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input className="sa-input" placeholder="Filter landlord" value={ownerPaymentsLandlordFilter} onChange={(e) => setOwnerPaymentsLandlordFilter(e.target.value)} />
                <input className="sa-input" placeholder="Filter building" value={ownerPaymentsBuildingFilter} onChange={(e) => setOwnerPaymentsBuildingFilter(e.target.value)} />
                <input className="sa-input" type="date" value={ownerPaymentsStartDate} onChange={(e) => setOwnerPaymentsStartDate(e.target.value)} />
                <input className="sa-input" type="date" value={ownerPaymentsEndDate} onChange={(e) => setOwnerPaymentsEndDate(e.target.value)} />
                <input className="sa-input" type="month" value={ownerPaymentsMonthFilter} onChange={(e) => setOwnerPaymentsMonthFilter(e.target.value)} />
              </div>
            </div>

            {filteredLandlordPayments.length === 0 ?
          <div className="no-data">No owner payments found.</div> :

          <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Landlord</th>
                      <th>Building</th>
                      <th>Net Amount</th>
                      <th>Commission</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="table-menu"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLandlordPayments.map((payment, index) => {
                  const landlordName = payment.Landlord || payment.landlord || 'N/A';
                  const status = (payment.Status || 'unknown').toLowerCase();
                  const needsApproval = ['pending', 'pending approval', 'pending director approval', 'pending_approval'].includes(status);
                  const isDirector = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase() === 'agency_director';
                  return (
                    <tr
                      key={payment.ID || payment.id || index}
                      onClick={() => setSelectedOwnerForPaymentsHistory(landlordName)}
                      style={{ cursor: 'pointer' }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();setSelectedOwnerForPaymentsHistory(landlordName);}}}>
                      
                          <td><span className="sa-cell-title">{landlordName}</span></td>
                          <td>{payment.Building || payment.building || 'N/A'}</td>
                          <td>{money(payment.NetAmount ?? payment.netAmount ?? 0)}</td>
                          <td>{money(payment.Commission ?? payment.commission ?? 0)}</td>
                          <td>Payout</td>
                          <td>{payment.Date ? new Date(payment.Date).toLocaleDateString() : 'N/A'}</td>
                          <td><span className={`sa-status-pill ${(payment.Status || 'unknown').toLowerCase()}`}>{payment.Status || 'Unknown'}</span></td>
                          <td className="table-menu" onClick={(e) => e.stopPropagation()}>
                            <div className="sa-row-actions">
                              {needsApproval && isDirector ?
                          <button
                            className="table-action-button edit"
                            onClick={(e2) => {
                              e2.stopPropagation();
                              (async () => {
                                try {
                                  setLoading(true);
                                  await accountingService.approveLandlordPayment(payment.ID);
                                  const updated = await accountingService.getLandlordPayments();
                                  setLandlordPayments(Array.isArray(updated) ? updated : updated?.payments ?? updated?.landlordPayments ?? []);
                                  addNotification('Payment approved by director', 'success');
                                } catch (err) {
                                  addNotification(err.message || 'Failed to approve', 'error');
                                } finally {
                                  setLoading(false);
                                }
                              })();
                            }}>
                            
                                  Approve
                                </button> :
                          status !== 'paid' && status !== 'completed' && !needsApproval ?
                          <button className="table-action-button edit" onClick={(e2) => {e2.stopPropagation();transferToLandlord(payment.ID);}}>
                                  Mark Completed
                                </button> :
                          status === 'paid' || status === 'completed' ?
                          <span className="sa-status-pill success" style={{ padding: '4px 12px' }}>Completed</span> :

                          <span className="sa-status-pill" style={{ padding: '4px 12px' }}>Pending Approval</span>
                          }
                            </div>
                          </td>
                        </tr>);

                })}
                  </tbody>
                </table>
              </div>
          }
          </div>
        }
      </div>
    </div>);

};

OwnerPaymentsTab.LandlordModal = (props) => {
  const { loading, setLoading, addNotification, setShowLandlordPaymentModal, selectedLandlord, setSelectedLandlord, ownerBalancesOwners, landlords, setLandlordPayments } = props;
  const [ownerProperties, setOwnerProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);

  const fetchOwnerProperties = async (ownerId) => {
    if (!ownerId) {setOwnerProperties([]);return;}
    try {
      setPropertiesLoading(true);
      const data = await accountingService.getLandlordProperties(ownerId);
      const list = Array.isArray(data) ? data : data?.properties ?? [];
      setOwnerProperties(list);
    } catch {
      setOwnerProperties([]);
    } finally {
      setPropertiesLoading(false);
    }
  };

  useEffect(() => {
    const id = selectedLandlord ? selectedLandlord.id || selectedLandlord.ID : null;
    fetchOwnerProperties(id);
  }, [selectedLandlord?.id, selectedLandlord?.ID]);

  return (
    <div className="modal-overlay" onClick={() => setShowLandlordPaymentModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Record Landlord Payment</h3>
          <button className="modal-close" onClick={() => setShowLandlordPaymentModal(false)}>x</button>
        </div>
        <div className="modal-body">
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              setLoading(true);
              const formData = new FormData(e.target);
              const ownersForModal = ownerBalancesOwners.length > 0 ? ownerBalancesOwners : landlords;
              const ownerObj = ownersForModal.find((o) => String(o.id || o.ID) === String(formData.get('landlord')));
              const landlordName = ownerObj ? ownerObj.Name || ownerObj.name || ownerObj.Landlord || ownerObj.landlord || '' : '';
              if (!landlordName) {
                addNotification('Please select an owner', 'error');
                setLoading(false);
                return;
              }
              const newPayment = await accountingService.recordLandlordPayment({
                landlord: landlordName,
                building: formData.get('building'),
                netAmount: parseFloat(formData.get('netAmount'))
              });
              setLandlordPayments((prev) => [newPayment, ...prev]);
              addNotification('Landlord payment recorded successfully!', 'success');
              setShowLandlordPaymentModal(false);
              e.target.reset();
              setSelectedLandlord(null);
            } catch (error) {
              console.error('Error recording landlord payment:', error);
              addNotification('Failed to record landlord payment. Please try again.', 'error');
            } finally {
              setLoading(false);
            }
          }}>
            <div className="form-group">
              <label>Owner / Landlord *</label>
              <select
                name="landlord"
                required
                defaultValue={selectedLandlord ? selectedLandlord.id || selectedLandlord.ID : ''}
                onChange={(e) => {
                  const id = e.target.value;
                  const ownersForModal = ownerBalancesOwners.length > 0 ? ownerBalancesOwners : landlords;
                  const owner = ownersForModal.find((o) => String(o.id || o.ID) === id) || null;
                  setSelectedLandlord(owner);
                  fetchOwnerProperties(id);
                }}>
                
                <option value="">Select Owner</option>
                {(ownerBalancesOwners.length > 0 ? ownerBalancesOwners : landlords).map((o) =>
                <option key={o.id || o.ID} value={o.id || o.ID}>
                    {o.Name || o.name || o.Landlord || o.landlord || 'N/A'} {o.Email || o.email ? `(${o.Email || o.email})` : ''}
                  </option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Building / Property *</label>
              {propertiesLoading ?
              <select name="building" required disabled><option value="">Loading properties…</option></select> :
              ownerProperties.length > 0 ?
              <select name="building" required defaultValue="">
                  <option value="">Select property</option>
                  {ownerProperties.map((item, idx) => {
                  const prop = item.property ?? item.Property ?? item;
                  const addr = prop.Address ?? prop.address ?? prop.Name ?? prop.name ?? '';
                  const propId = prop.ID ?? prop.id ?? idx;
                  return <option key={propId} value={addr}>{addr}</option>;
                })}
                </select> :

              <select name="building" required defaultValue="">
                  <option value="">
                    {selectedLandlord ? 'No properties connected to this owner' : 'Select an owner first'}
                  </option>
                </select>
              }
            </div>
            <div className="form-group">
              <label>Net Amount (XOF) *</label>
              <input type="number" name="netAmount" step="0.01" required placeholder="Enter amount" />
            </div>
            <div className="modal-footer">
              <button type="button" className="action-button secondary" onClick={() => setShowLandlordPaymentModal(false)}>{t('accounting.cancel')}</button>
              <button type="submit" className="action-button primary" disabled={loading}>{loading ? t('accounting.recording') : t('accounting.recordPayment')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>);

};

export default OwnerPaymentsTab;
