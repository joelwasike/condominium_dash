import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Receipt } from 'lucide-react';
import { accountingService } from '../../services/accountingService';
import RentReceiptTemplate from '../../components/RentReceiptTemplate';
import { t } from '../../utils/i18n';
import { buildReceiptData, buildRentReceiptContext, findTenantByName } from '../../utils/rentReceiptData';
import {
  dedupeBySignature,
  formatPropertyBuilding,
  formatTenantName,
  getTransactionSignature,
  normalizeText,
} from '../../utils/accountingDisplay';

const PAYMENT_PAGE_SIZE = 10;
const MOBILE_MONEY_PROVIDERS = [
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'wave', label: 'Wave' },
  { value: 'orange_business', label: 'Orange Business' },
];

const PaymentsTab = (props) => {
  const {
    loading, setLoading, addNotification,
    tenantPayments, setTenantPayments, collections, setCollections, overviewData, setOverviewData,
    rentSummary,
    paymentView, setPaymentView, paymentStatusFilter, setPaymentStatusFilter,
    paymentNameFilter, setPaymentNameFilter, paymentDateStartFilter, setPaymentDateStartFilter,
    paymentDateEndFilter, setPaymentDateEndFilter,
    showCollectionPaymentModal, setShowCollectionPaymentModal,
    setSelectedItemForView, setShowPaymentViewModal,
    downloadReceipt, printPaymentReceipt, tenants, depositEligibleTenants
  } = props;
  const [paymentTablePage, setPaymentTablePage] = useState(1);
  const [propertyOwners, setPropertyOwners] = useState([]);

  const nameLower = (paymentNameFilter || '').trim().toLowerCase();
  const dateStart = paymentDateStartFilter ? new Date(paymentDateStartFilter + 'T00:00:00') : null;
  const dateEnd = paymentDateEndFilter ? new Date(paymentDateEndFilter + 'T23:59:59') : null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await accountingService.getProperties();
        if (mounted) {
          setPropertyOwners(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (mounted) setPropertyOwners([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const ownerNameByProperty = useMemo(() => {
    const map = new Map();
    (Array.isArray(propertyOwners) ? propertyOwners : []).forEach((property) => {
      const address = (property.address || property.Address || '').toString().trim().toLowerCase();
      const landlord = (property.landlord || property.Landlord || '').toString().trim();
      const owner = (property.ownerName || property.OwnerName || property.owner || property.Owner || landlord || '').toString().trim();
      if (address && owner) {
        map.set(address, owner);
      }
    });
    return map;
  }, [propertyOwners]);

  const resolveOwnerName = (item, fallback = 'N/A') => {
    const direct = item?.OwnerName || item?.ownerName || item?.Owner || item?.owner || item?.Landlord || item?.landlord || '';
    if (String(direct).trim()) return String(direct).trim();
    const propertyKey = (item?.Property || item?.property || item?.Building || item?.building || item?.Address || item?.address || '').toString().trim().toLowerCase();
    if (propertyKey && ownerNameByProperty.has(propertyKey)) {
      return ownerNameByProperty.get(propertyKey);
    }
    return fallback;
  };

  const matchesStatus = (status) => {
    if (paymentStatusFilter === 'all') return true;
    const s = (status || '').toLowerCase();
    if (paymentStatusFilter === 'approved') return s === 'approved' || s === 'collected' || s === 'paid';
    if (paymentStatusFilter === 'pending') return s === 'pending' || s === 'awaiting';
    if (paymentStatusFilter === 'rejected') return s === 'rejected' || s === 'failed';
    return true;
  };
  const matchesName = (tenant, buyer, property, landlord) => {
    if (!nameLower) return true;
    const search = [tenant, buyer, property, landlord].filter(Boolean).join(' ').toLowerCase();
    return search.includes(nameLower);
  };
  const matchesDate = (dateStr) => {
    if (!dateStr) return !dateStart && !dateEnd;
    const d = new Date(dateStr);
    if (dateStart && d < dateStart) return false;
    if (dateEnd && d > dateEnd) return false;
    return true;
  };

  const filteredCollections = collections.filter(col => {
    if (paymentView === 'tenant') return false;
    if (paymentView === 'rent' && col.ChargeType !== 'Rent') return false;
    if (paymentView === 'deposit' && col.ChargeType !== 'Deposit') return false;
    if (paymentView === 'sale' && col.ChargeType !== 'Sale') return false;
    if (!matchesStatus(col.Status)) return false;
    if (!matchesName(col.Tenant, col.Buyer, formatPropertyBuilding(col, ''), resolveOwnerName(col, ''))) return false;
    if (!matchesDate(col.Date)) return false;
    return true;
  });

  const filteredTenantPayments = (paymentView === 'all' || paymentView === 'tenant')
    ? tenantPayments.filter(p => {
        if (!matchesStatus(p.Status)) return false;
        if (!matchesName(formatTenantName(p, ''), null, formatPropertyBuilding(p, ''), resolveOwnerName(p, ''))) return false;
        if (!matchesDate(p.Date)) return false;
        return true;
      })
    : [];

  const paymentRows = useMemo(() => {
    const tenantRows = filteredTenantPayments.map((payment, index) => ({
      rowType: 'payment',
      key: `tenant-payment-${payment.ID || payment.id || getTransactionSignature(payment) || index}`,
      signature: getTransactionSignature(payment),
      priority: 2,
      dateValue: payment.Date || payment.CreatedAt || payment.createdAt || '',
      data: payment,
    }));

    const tenantSignatures = new Set(tenantRows.map((row) => row.signature));
    const collectionRows = filteredCollections
      .filter((collection) => {
        const chargeType = normalizeText(collection.ChargeType || collection.chargeType);
        if (!tenantSignatures.size) return true;
        if (!['rent', 'deposit', 'late fee', 'late rent', 'collection'].includes(chargeType)) return true;
        return !tenantSignatures.has(getTransactionSignature(collection));
      })
      .map((collection, index) => ({
        rowType: 'collection',
        key: `collection-${collection.ID || collection.id || getTransactionSignature(collection) || index}`,
        signature: getTransactionSignature(collection),
        priority: 1,
        dateValue: collection.Date || collection.CreatedAt || collection.createdAt || '',
        data: collection,
      }));

    return dedupeBySignature([...tenantRows, ...collectionRows], (row) => row.priority)
      .sort((left, right) => {
        const leftDate = new Date(left.dateValue || 0).getTime();
        const rightDate = new Date(right.dateValue || 0).getTime();
        if (rightDate !== leftDate) return rightDate - leftDate;
        return (right.priority || 0) - (left.priority || 0);
      });
  }, [filteredCollections, filteredTenantPayments, ownerNameByProperty]);

  useEffect(() => {
    setPaymentTablePage(1);
  }, [paymentView, paymentStatusFilter, paymentNameFilter, paymentDateStartFilter, paymentDateEndFilter]);

  useEffect(() => {
    setPaymentTablePage((page) => Math.min(page, Math.max(1, Math.ceil(paymentRows.length / PAYMENT_PAGE_SIZE))));
  }, [paymentRows.length]);

  const totalPaymentPages = Math.max(1, Math.ceil(paymentRows.length / PAYMENT_PAGE_SIZE));
  const paginatedPaymentRows = paymentRows.slice((paymentTablePage - 1) * PAYMENT_PAGE_SIZE, paymentTablePage * PAYMENT_PAGE_SIZE);
  const paymentStartRow = paymentRows.length === 0 ? 0 : (paymentTablePage - 1) * PAYMENT_PAGE_SIZE + 1;
  const paymentEndRow = Math.min(paymentRows.length, paymentTablePage * PAYMENT_PAGE_SIZE);

  const collected = rentSummary?.collectedRents ?? 0;
  const expected = rentSummary?.expectedRentThisMonth ?? 0;
  const paid = rentSummary?.paidRents ?? 0;
  const unpaid = rentSummary?.unpaidRents ?? 0;
  const depositValue = rentSummary?.depositValueThisMonth ?? 0;
  const totalUnpaidAllPeriods = rentSummary?.totalUnpaidAllPeriods ?? 0;

  const [ownersSummary, setOwnersSummary] = useState([]);
  const [ownersSummaryLoading, setOwnersSummaryLoading] = useState(false);

  useEffect(() => {
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
  }, []);

  const ownersRows = useMemo(() => {
    return (ownersSummary || []).map((s, idx) => {
      const ownerName = s.ownerName || s.OwnerName || s.landlord || s.Landlord || '—';
      const expectedRents = s.expectedRents ?? s.ExpectedRents ?? 0;
      const collectedRents = s.collectedRents ?? s.CollectedRents ?? 0;
      return { key: s.ownerId || s.OwnerID || idx, ownerName, expectedRents, collectedRents };
    });
  }, [ownersSummary]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Collected Rents</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#059669' }}>{collected.toFixed(2)} XOF</p>
        </div>
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Expected Rent This Month</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#1e40af' }}>{expected.toFixed(2)} XOF</p>
        </div>
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Paid Rents</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#059669' }}>{paid.toFixed(2)} XOF</p>
        </div>
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Unpaid Rents</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#dc2626' }}>{unpaid.toFixed(2)} XOF</p>
        </div>
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Value of the deposit</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#7c3aed' }}>{Number(depositValue || 0).toFixed(2)} XOF</p>
        </div>
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Total unpaid (all periods)</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#b91c1c' }}>{Number(totalUnpaidAllPeriods || 0).toFixed(2)} XOF</p>
        </div>
      </div>

      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h2>Payments & Deposits</h2>
            <p>Manage rent payments, deposit payments, and property sales</p>
          </div>
          <button className="sa-primary-cta" onClick={() => setShowCollectionPaymentModal(true)} disabled={loading}>
            <Plus size={18} /> Record Payment
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
          {['all', 'deposit', 'sale', 'tenant'].map(view => (
            <button key={view} onClick={() => setPaymentView(view)} style={{
              padding: '10px 20px', border: 'none',
              background: paymentView === view ? '#3b82f6' : 'transparent',
              color: paymentView === view ? 'white' : '#6b7280',
              cursor: 'pointer',
              borderBottom: paymentView === view ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: '-2px'
            }}>
              {view === 'all' ? 'All Payments' : view === 'deposit' ? 'Deposit Payments' : view === 'sale' ? 'Property Sales' : 'Tenant Payments'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', whiteSpace: 'nowrap' }}>Status (verify payment):</label>
            <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem', minWidth: '140px' }}>
              <option value="all">All</option>
              <option value="approved">Approved / Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} style={{ color: '#6b7280' }} />
            <input type="text" placeholder="Filter by tenant, buyer, property..." value={paymentNameFilter} onChange={(e) => setPaymentNameFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem', minWidth: '200px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', whiteSpace: 'nowrap' }}>Date from:</label>
            <input type="date" value={paymentDateStartFilter} onChange={(e) => setPaymentDateStartFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', whiteSpace: 'nowrap' }}>Date to:</label>
            <input type="date" value={paymentDateEndFilter} onChange={(e) => setPaymentDateEndFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }} />
          </div>
          {(paymentStatusFilter !== 'all' || paymentNameFilter || paymentDateStartFilter || paymentDateEndFilter) && (
            <button type="button" onClick={() => { setPaymentStatusFilter('all'); setPaymentNameFilter(''); setPaymentDateStartFilter(''); setPaymentDateEndFilter(''); }} style={{ padding: '8px 12px', fontSize: '0.875rem', color: '#64748b', background: 'transparent', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading">Loading payments...</div>
        ) : paymentRows.length === 0 ? (
          <div className="no-data">No payments found</div>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Type</th><th>Tenant/Buyer</th><th>Property/Building</th><th>Landlord</th><th>Amount</th><th>Payment Method</th><th>Date</th><th className="table-menu"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedPaymentRows.map((row) => {
                  if (row.rowType === 'collection') {
                    const collection = row.data;
                    const ownerName = resolveOwnerName(collection, 'N/A');
                    const propertyBuilding = formatPropertyBuilding(collection, 'N/A');
                    return (
                      <tr key={row.key}>
                        <td><span className="sa-status-pill" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>{collection.ChargeType || 'Collection'}</span></td>
                        <td>{collection.Buyer || collection.Tenant || collection.tenant || '-'}</td>
                        <td>
                          <span className="sa-cell-title">{propertyBuilding}</span>
                        </td>
                        <td>{ownerName}</td>
                        <td>{collection.Amount?.toFixed(2) || '0.00'} XOF</td>
                        <td>{collection.PaymentMethod || collection.Method || 'Cash'}</td>
                        <td>{collection.Date ? new Date(collection.Date).toLocaleDateString() : 'N/A'}</td>
                        <td className="table-menu">
                          <div className="sa-row-actions">
                            <button className="table-action-button view" onClick={() => { setSelectedItemForView({ type: 'collection', data: collection }); setShowPaymentViewModal(true); }}>{t('common.view')}</button>
                            <button className="table-action-button edit" onClick={() => printPaymentReceipt(collection, true)}>Receipt</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const payment = row.data;
                  const ownerName = resolveOwnerName(payment, 'N/A');
                  const propertyBuilding = formatPropertyBuilding(payment, 'N/A');
                  return (
                    <tr key={row.key}>
                      <td><span className="sa-status-pill" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Tenant Payment</span></td>
                      <td><span className="sa-cell-title">{formatTenantName(payment, 'N/A')}</span></td>
                      <td>{propertyBuilding}</td>
                      <td>{ownerName}</td>
                      <td>{payment.Amount?.toFixed(2) || '0.00'} XOF</td>
                      <td>{payment.Method || payment.PaymentMethod || 'N/A'}</td>
                      <td>{payment.Date ? new Date(payment.Date).toLocaleDateString() : 'N/A'}</td>
                      <td className="table-menu">
                        <div className="sa-row-actions">
                          <button className="table-action-button view" onClick={() => { setSelectedItemForView({ type: 'payment', data: payment }); setShowPaymentViewModal(true); }}>{t('common.view')}</button>
                          <button className="table-action-button edit" onClick={() => downloadReceipt(payment)}>Receipt</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Showing {paymentStartRow}-{paymentEndRow} of {paymentRows.length}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="sa-outline-button"
                  disabled={paymentTablePage <= 1}
                  onClick={() => setPaymentTablePage((page) => Math.max(1, page - 1))}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.875rem', color: '#475569' }}>
                  Page {paymentTablePage} of {totalPaymentPages}
                </span>
                <button
                  type="button"
                  className="sa-outline-button"
                  disabled={paymentTablePage >= totalPaymentPages}
                  onClick={() => setPaymentTablePage((page) => Math.min(totalPaymentPages, page + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Collection Payment Modal (extracted from index)
PaymentsTab.CollectionModal = (props) => {
  const {
    loading, setLoading, addNotification,
    showCollectionPaymentModal, setShowCollectionPaymentModal,
    collectionPaymentType, setCollectionPaymentType,
    collectionPaymentForm, setCollectionPaymentForm,
    tenants, depositEligibleTenants, propertiesForSale,
    setOverviewData, setTenantPayments, setCollections, setDepositEligibleTenants
  } = props;
  const tenantList = collectionPaymentType === 'deposit'
    ? (Array.isArray(depositEligibleTenants) ? depositEligibleTenants : [])
    : tenants;

  return (
    <div className="modal-overlay" onClick={() => { setShowCollectionPaymentModal(false); setCollectionPaymentType(null); }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: collectionPaymentType ? '600px' : '500px' }}>
        <div className="modal-header">
          <h3>{collectionPaymentType ? 'Record Payment Details' : 'Select Payment Type'}</h3>
          <button className="modal-close" onClick={() => { setShowCollectionPaymentModal(false); setCollectionPaymentType(null); }}>x</button>
        </div>
        <div className="modal-body">
          {!collectionPaymentType ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 0' }}>
              <button type="button" className="action-button primary" onClick={() => setCollectionPaymentType('tenant')} style={{ padding: '16px', fontSize: '16px', textAlign: 'left' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Record a Tenant's Payment</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>Record rent or other tenant payments</div>
              </button>
              <button type="button" className="action-button primary" onClick={() => setCollectionPaymentType('deposit')} style={{ padding: '16px', fontSize: '16px', textAlign: 'left' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Record a Security Deposit</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>Record security deposit payments from tenants</div>
              </button>
              <button type="button" className="action-button primary" onClick={() => setCollectionPaymentType('sale')} style={{ padding: '16px', fontSize: '16px', textAlign: 'left' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Record a Property Sale</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>Record property sale transactions</div>
              </button>
            </div>
          ) : collectionPaymentType === 'tenant' ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const paymentAmount = parseFloat(collectionPaymentForm.amount || '0');
                const selectedTenant = findTenantByName(tenantList, collectionPaymentForm.tenant);
                const rentReceiptContext = collectionPaymentForm.chargeType === 'Rent' && selectedTenant
                  ? buildRentReceiptContext(selectedTenant, paymentAmount)
                  : {};
                const paymentData = {
                  tenant: collectionPaymentForm.tenant,
                  property: collectionPaymentForm.property,
                  amount: paymentAmount,
                  method: collectionPaymentForm.method,
                  paymentProvider: collectionPaymentForm.paymentProvider,
                  chargeType: collectionPaymentForm.chargeType,
                  reference: collectionPaymentForm.reference,
                  status: 'Approved',
                  ...rentReceiptContext,
                };
                const createdPayment = await accountingService.recordTenantPayment(paymentData);
                addNotification('Tenant payment recorded successfully!', 'success');
                try {
                  const propKey = (collectionPaymentForm.property || '').toLowerCase().trim();
                  const resolvedLandlord = collectionPaymentForm.landlord || (propKey && ownerNameByProperty.get(propKey)) || '';
                  await accountingService.recordCollection({
                    building: collectionPaymentForm.property,
                    landlord: resolvedLandlord,
                    amount: parseFloat(collectionPaymentForm.amount || '0'),
                    chargeType: collectionPaymentForm.chargeType,
                    status: 'Collected',
                    paymentMethod: collectionPaymentForm.method,
                    paymentProvider: collectionPaymentForm.paymentProvider,
                  });
                } catch (collError) { console.error('Error creating collection record:', collError); }
                const [overview, tenantPaymentsData, collectionsData] = await Promise.all([accountingService.getOverview(), accountingService.getTenantPayments(), accountingService.getCollections()]);
                const createdPaymentId = createdPayment?.id ?? createdPayment?.ID ?? createdPayment?.Id ?? null;
                const enrichedPayment = {
                  ...(createdPayment || paymentData),
                  ...paymentData,
                };
                const refreshedPayments = Array.isArray(tenantPaymentsData) ? tenantPaymentsData : [];
                setOverviewData(overview);
                setCollections(Array.isArray(collectionsData) ? collectionsData : []);
                setTenantPayments(
                  createdPaymentId != null
                    ? [enrichedPayment, ...refreshedPayments.filter((payment) => String(payment?.id ?? payment?.ID ?? payment?.Id ?? '') !== String(createdPaymentId))]
                    : [enrichedPayment, ...refreshedPayments]
                );
                setCollectionPaymentForm({ building: '', landlord: '', amount: '', paymentType: 'rent', status: 'Collected', tenant: '', tenantId: '', property: '', method: 'Cash', chargeType: 'Rent', reference: '', tenantType: 'individual', monthlyRent: '', depositAmount: '', applicationFees: false, appFeesAmount: '', sodeciAmount: '', cie10Amount: '', cie15Amount: '', paymentMethod: 'cash', paymentProvider: '', notes: '', buyer: '', saleAmount: '', agencyCommission: '' });
                setCollectionPaymentType(null); setShowCollectionPaymentModal(false);
              } catch (error) { console.error('Error recording tenant payment:', error); addNotification(error.message || 'Failed to record tenant payment', 'error'); } finally { setLoading(false); }
            }}>
              <div className="form-group">
                <label htmlFor="tenantName">Tenant *</label>
                <select
                  id="tenantName"
                  value={collectionPaymentForm.tenantId || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedTenant = tenantList.find(
                      (item) => String(item.tenantId ?? item.TenantID ?? item.id ?? '') === String(selectedId)
                    );
                    if (selectedTenant) {
                      setCollectionPaymentForm({
                        ...collectionPaymentForm,
                        tenant: selectedTenant.tenantName || selectedTenant.TenantName || selectedTenant.name || selectedTenant.Name || '',
                        tenantId: selectedTenant.tenantId ?? selectedTenant.TenantID ?? selectedTenant.id ?? '',
                        property: selectedTenant.property || selectedTenant.Property || '',
                        amount: String(selectedTenant.monthlyRent ?? selectedTenant.MonthlyRent ?? ''),
                        applicationFees: !!(selectedTenant.applicationFees ?? selectedTenant.ApplicationFees),
                      });
                    } else {
                      setCollectionPaymentForm({ ...collectionPaymentForm, tenant: '', tenantId: '', property: '', amount: '' });
                    }
                  }}
                  required
                >
                  <option value="">Select tenant</option>
                  {tenantList.map((item) => {
                    const id = item.tenantId ?? item.TenantID ?? item.id ?? '';
                    const name = item.tenantName || item.TenantName || item.name || item.Name || '';
                    const property = item.property || item.Property || '';
                    return (
                      <option key={id || name} value={id}>
                        {name}{property ? ` — ${property}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="tenantProperty">Property *</label>
                <input id="tenantProperty" type="text" value={collectionPaymentForm.property} onChange={(e) => setCollectionPaymentForm({...collectionPaymentForm, property: e.target.value})} readOnly={!!(collectionPaymentForm.tenant && collectionPaymentForm.property)} required placeholder="Select a tenant to auto-fill" style={collectionPaymentForm.tenant && collectionPaymentForm.property ? { backgroundColor: '#f3f4f6', cursor: 'default' } : {}} />
              </div>
              {collectionPaymentForm.tenant && (() => { const sel = tenantList.find(t => (t.tenantName || t.TenantName || t.name || t.Name) === collectionPaymentForm.tenant); const due = sel ? (sel.outstandingAmount ?? sel.OutstandingAmount ?? 0) : 0; const months = sel ? (sel.monthsInArrears ?? sel.MonthsInArrears ?? 0) : 0; const hasArrears = due > 0; return (<div className="form-group" style={{ padding: '12px', backgroundColor: hasArrears ? '#fef3c7' : '#f0fdf4', borderRadius: '8px', border: hasArrears ? '1px solid #f59e0b' : '1px solid #22c55e' }}><label style={{ color: hasArrears ? '#92400e' : '#166534', fontWeight: '600' }}>Amount Due (Outstanding)</label><div style={{ fontSize: '1.1rem', fontWeight: '600', color: hasArrears ? '#b45309' : '#15803d' }}>{(due || 0).toLocaleString()} XOF{months > 0 && <span style={{ fontSize: '0.85rem', fontWeight: '500', marginLeft: '8px' }}>({months} month{months > 1 ? 's' : ''} in arrears)</span>}{!hasArrears && <span style={{ fontSize: '0.85rem', fontWeight: '500', marginLeft: '8px' }}>(Up to date)</span>}</div></div>); })()}
              <div className="form-group"><label htmlFor="tenantAmount">Amount (XOF) *</label><input id="tenantAmount" type="number" min="0" step="0.01" value={collectionPaymentForm.amount} onChange={(e) => setCollectionPaymentForm({...collectionPaymentForm, amount: e.target.value})} required placeholder="Enter payment amount" /><small style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>Can include arrears, current month, or months ahead</small></div>
              <div className="form-group">
                <label htmlFor="tenantMethod">Payment Method *</label>
                <select
                  id="tenantMethod"
                  value={collectionPaymentForm.method}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, method: e.target.value, paymentProvider: e.target.value === 'Mobile Money' ? collectionPaymentForm.paymentProvider : '' })}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              {collectionPaymentForm.method === 'Mobile Money' && (
                <div className="form-group">
                  <label htmlFor="tenantMethodProvider">Mobile Money Provider *</label>
                  <select
                    id="tenantMethodProvider"
                    value={collectionPaymentForm.paymentProvider}
                    onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, paymentProvider: e.target.value })}
                    required
                  >
                    <option value="">Select provider</option>
                    {MOBILE_MONEY_PROVIDERS.map((provider) => (
                      <option key={provider.value} value={provider.value}>{provider.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group"><label htmlFor="tenantChargeType">Charge Type *</label><select id="tenantChargeType" value={collectionPaymentForm.chargeType} onChange={(e) => setCollectionPaymentForm({...collectionPaymentForm, chargeType: e.target.value})} required><option value="Rent">Rent</option><option value="Deposit">Deposit</option><option value="Late Fee">Late Fee</option></select></div>
              <div className="form-group"><label htmlFor="tenantReference">Reference (optional)</label><input id="tenantReference" type="text" value={collectionPaymentForm.reference} onChange={(e) => setCollectionPaymentForm({...collectionPaymentForm, reference: e.target.value})} placeholder="Receipt number or reference" /></div>
              <div className="modal-footer"><button type="button" className="action-button secondary" onClick={() => setCollectionPaymentType(null)} disabled={loading}>Back</button><button type="submit" className="action-button primary" disabled={loading}>{loading ? t('accounting.recording') : t('accounting.recordPayment')}</button></div>
            </form>
          ) : collectionPaymentType === 'deposit' ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const selectedTenant = tenantList.find(t => String(t.tenantId ?? t.TenantID ?? t.id ?? '') === String(collectionPaymentForm.tenantId) || (t.tenantName || t.TenantName || t.name || t.Name) === collectionPaymentForm.tenant);
                if (!collectionPaymentForm.tenantId) {
                  throw new Error('Please select a validated client from the list');
                }
                const depositAmt = parseFloat(collectionPaymentForm.depositAmount || '0');
                if (!(depositAmt > 0)) {
                  throw new Error('Selected client does not have a valid deposit amount');
                }
                const feesAmt = parseFloat(collectionPaymentForm.appFeesAmount || '0');
                const sodeciAmt = parseFloat(collectionPaymentForm.sodeciAmount || '0');
                const cie10Amt = parseFloat(collectionPaymentForm.cie10Amount || '0');
                const cie15Amt = parseFloat(collectionPaymentForm.cie15Amount || '0');
                const grandTotal = depositAmt + feesAmt + sodeciAmt + cie10Amt + cie15Amt;
                const monthlyRent = depositAmt / 4.5;
                const applicationFees = !!(selectedTenant?.applicationFees ?? selectedTenant?.ApplicationFees);
                await accountingService.recordDepositPayment({
                  tenant: collectionPaymentForm.tenant,
                  tenantId: Number(collectionPaymentForm.tenantId),
                  property: collectionPaymentForm.property,
                  tenantType: collectionPaymentForm.tenantType,
                  monthlyRent,
                  amount: grandTotal,
                  monthsMultiplier: 4.5,
                  applicationFees,
                  paymentMethod: collectionPaymentForm.paymentMethod,
                  paymentProvider: collectionPaymentForm.paymentProvider
                });
                addNotification('Security deposit recorded successfully!', 'success');
                try {
                  const eligibleClients = await accountingService.getDepositEligibleTenants();
                  setDepositEligibleTenants(Array.isArray(eligibleClients) ? eligibleClients : []);
                } catch (refreshError) {
                  console.error('Error refreshing deposit eligible clients:', refreshError);
                }
                try {
                  await accountingService.recordCollection({
                    building: collectionPaymentForm.property,
                    landlord: collectionPaymentForm.landlord || 'N/A',
                    amount: depositTotal,
                    chargeType: 'Deposit',
                    status: 'Collected',
                    paymentMethod: collectionPaymentForm.paymentMethod,
                    paymentProvider: collectionPaymentForm.paymentProvider
                  });
                } catch (collError) {
                  console.error('Error creating collection record:', collError);
                }
                const [overview, collectionsData] = await Promise.all([accountingService.getOverview(), accountingService.getCollections()]);
                setOverviewData(overview);
                setCollections(Array.isArray(collectionsData) ? collectionsData : []);
                setCollectionPaymentForm({ building: '', landlord: '', amount: '', paymentType: 'rent', status: 'Collected', tenant: '', tenantId: '', property: '', method: 'Cash', chargeType: 'Rent', reference: '', tenantType: 'individual', monthlyRent: '', depositAmount: '', applicationFees: false, appFeesAmount: '', sodeciAmount: '', cie10Amount: '', cie15Amount: '', paymentMethod: 'cash', paymentProvider: '', notes: '', buyer: '', saleAmount: '', agencyCommission: '' });
                setCollectionPaymentType(null);
                setShowCollectionPaymentModal(false);
              } catch (error) {
                console.error('Error recording deposit:', error);
                addNotification(error.message || 'Failed to record security deposit', 'error');
              } finally {
                setLoading(false);
              }
            }}>
              <div className="form-group">
                <label>Validated Client *</label>
                <select
                  value={collectionPaymentForm.tenantId || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedTenant = tenantList.find(
                      (item) => String(item.tenantId ?? item.TenantID ?? item.id ?? '') === String(selectedId)
                    );
                    if (selectedTenant) {
                      const depositValue = Number(selectedTenant.depositValue ?? selectedTenant.DepositValue ?? 0);
                      setCollectionPaymentForm({
                        ...collectionPaymentForm,
                        tenant: selectedTenant.tenantName || selectedTenant.TenantName || selectedTenant.name || selectedTenant.Name || '',
                        tenantId: selectedTenant.tenantId ?? selectedTenant.TenantID ?? selectedTenant.id ?? '',
                        property: selectedTenant.property || selectedTenant.Property || '',
                        depositAmount: depositValue > 0 ? String(depositValue) : '',
                        applicationFees: !!(selectedTenant.applicationFees ?? selectedTenant.ApplicationFees),
                        appFeesAmount: String(selectedTenant.applicationFeesAmount ?? selectedTenant.ApplicationFeesAmount ?? 0),
                        sodeciAmount: String(selectedTenant.sodeciAmount ?? selectedTenant.SODECIAmount ?? 0),
                        cie10Amount: String(selectedTenant.cie10aAmount ?? selectedTenant.CIE10AAmount ?? 0),
                        cie15Amount: String(selectedTenant.cie15aAmount ?? selectedTenant.CIE15AAmount ?? 0),
                      });
                    } else {
                      setCollectionPaymentForm({ ...collectionPaymentForm, tenant: '', tenantId: '', property: '', depositAmount: '', applicationFees: false, appFeesAmount: '', sodeciAmount: '', cie10Amount: '', cie15Amount: '' });
                    }
                  }}
                  required
                >
                  <option value="">Select validated client</option>
                  {tenantList.map((item) => {
                    const id = item.tenantId ?? item.TenantID ?? item.id ?? '';
                    const name = item.tenantName || item.TenantName || item.name || item.Name || '';
                    const property = item.property || item.Property || '';
                    return (
                      <option key={id || name} value={id}>
                        {name} {property ? ` - ${property}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>Property *</label>
                <input
                  type="text"
                  value={collectionPaymentForm.property}
                  onChange={(e) => setCollectionPaymentForm({...collectionPaymentForm, property: e.target.value})}
                  readOnly={!!(collectionPaymentForm.tenant && collectionPaymentForm.property)}
                  required
                  placeholder="Select a tenant to auto-fill"
                  style={collectionPaymentForm.tenant && collectionPaymentForm.property ? { backgroundColor: '#f3f4f6', cursor: 'default' } : {}}
                />
              </div>
              <div className="form-group"><label>Tenant Type *</label><select value={collectionPaymentForm.tenantType} onChange={(e) => setCollectionPaymentForm({...collectionPaymentForm, tenantType: e.target.value})} required><option value="individual">Individual</option><option value="company">Company</option></select><small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>Deposit amount is prefilled from the validated client record</small></div>
              <div className="form-group">
                <label>Security Deposit (XOF) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={collectionPaymentForm.depositAmount}
                  onChange={(e) => setCollectionPaymentForm({...collectionPaymentForm, depositAmount: e.target.value})}
                  required
                  placeholder="Auto-filled from client record"
                  readOnly={!!collectionPaymentForm.depositAmount}
                  style={collectionPaymentForm.depositAmount ? { backgroundColor: '#f3f4f6', cursor: 'default' } : {}}
                />
                {collectionPaymentForm.depositAmount && <small style={{ color: '#059669', marginTop: '4px', display: 'block', fontWeight: '600' }}>This amount comes from the client setup record.</small>}
              </div>
              {collectionPaymentForm.tenantId && (
                <>
                  <div className="form-group">
                    <label>Application Fees (XOF)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={collectionPaymentForm.appFeesAmount}
                      readOnly
                      style={{ backgroundColor: '#f3f4f6', cursor: 'default' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>SODECI (XOF)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={collectionPaymentForm.sodeciAmount}
                      readOnly
                      style={{ backgroundColor: '#f3f4f6', cursor: 'default' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>CIE 10A (XOF)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={collectionPaymentForm.cie10Amount}
                      readOnly
                      style={{ backgroundColor: '#f3f4f6', cursor: 'default' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>CIE 15A (XOF)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={collectionPaymentForm.cie15Amount}
                      readOnly
                      style={{ backgroundColor: '#f3f4f6', cursor: 'default' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 700 }}>Total Amount (XOF)</label>
                    <input
                      type="text"
                      value={(
                        parseFloat(collectionPaymentForm.depositAmount || '0') +
                        parseFloat(collectionPaymentForm.appFeesAmount || '0') +
                        parseFloat(collectionPaymentForm.sodeciAmount || '0') +
                        parseFloat(collectionPaymentForm.cie10Amount || '0') +
                        parseFloat(collectionPaymentForm.cie15Amount || '0')
                      ).toLocaleString('fr-FR') + ' XOF'}
                      readOnly
                      style={{ backgroundColor: '#eff6ff', cursor: 'default', fontWeight: 700, color: '#1d4ed8' }}
                    />
                  </div>
                </>
              )}
              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  value={collectionPaymentForm.paymentMethod}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, paymentMethod: e.target.value, paymentProvider: e.target.value === 'mobile_money' ? collectionPaymentForm.paymentProvider : '' })}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              {collectionPaymentForm.paymentMethod === 'mobile_money' && (
                <div className="form-group">
                  <label>Mobile Money Provider *</label>
                  <select
                    value={collectionPaymentForm.paymentProvider}
                    onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, paymentProvider: e.target.value })}
                    required
                  >
                    <option value="">Select provider</option>
                    {MOBILE_MONEY_PROVIDERS.map((provider) => (
                      <option key={provider.value} value={provider.value}>{provider.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="modal-footer"><button type="button" className="action-button secondary" onClick={() => setCollectionPaymentType(null)} disabled={loading}>Back</button><button type="submit" className="action-button primary" disabled={loading}>{loading ? t('accounting.recording') : t('accounting.recordPayment')}</button></div>
            </form>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                await accountingService.recordCollection({
                  building: collectionPaymentForm.property,
                  landlord: collectionPaymentForm.landlord,
                  amount: parseFloat(collectionPaymentForm.saleAmount || '0'),
                  chargeType: 'Sale',
                  status: 'Collected',
                  agencyCommission: parseFloat(collectionPaymentForm.agencyCommission || '0') || 0,
                  paymentMethod: collectionPaymentForm.paymentMethod,
                  paymentProvider: collectionPaymentForm.paymentProvider,
                });
                addNotification('Property sale recorded successfully!', 'success');
                const [overview, collectionsData] = await Promise.all([accountingService.getOverview(), accountingService.getCollections()]);
                setOverviewData(overview); setCollections(Array.isArray(collectionsData) ? collectionsData : []);
                setCollectionPaymentForm({ building: '', landlord: '', amount: '', paymentType: 'rent', status: 'Collected', tenant: '', tenantId: '', property: '', method: 'Cash', chargeType: 'Rent', reference: '', tenantType: 'individual', monthlyRent: '', depositAmount: '', applicationFees: false, appFeesAmount: '', sodeciAmount: '', cie10Amount: '', cie15Amount: '', paymentMethod: 'cash', paymentProvider: '', notes: '', buyer: '', saleAmount: '', agencyCommission: '' });
                setCollectionPaymentType(null); setShowCollectionPaymentModal(false);
              } catch (error) { console.error('Error recording property sale:', error); addNotification(error.message || 'Failed to record property sale', 'error'); } finally { setLoading(false); }
            }}>
              <div className="form-group"><label>Property / Building *</label><select value={collectionPaymentForm.property} onChange={(e) => { const addr = e.target.value; const p = propertiesForSale.find(x => (x.address || x.Address) === addr); if (p) { setCollectionPaymentForm({...collectionPaymentForm, property: addr, landlord: p.landlord || p.Landlord || '' }); } else { setCollectionPaymentForm({...collectionPaymentForm, property: addr}); } }} required><option value="">Select property</option>{propertiesForSale.filter(p => { const pt = (p.propertyType || p.PropertyType || '').toLowerCase(); return pt === 'for sale' || pt === 'sale'; }).map((p) => { const addr = p.address || p.Address || ''; return <option key={addr} value={addr}>{addr} {p.landlord || p.Landlord ? ` (${p.landlord || p.Landlord})` : ''}</option>; })}</select></div>
              <div className="form-group"><label>Landlord / Seller *</label><input type="text" value={collectionPaymentForm.landlord} onChange={(e) => setCollectionPaymentForm({...collectionPaymentForm, landlord: e.target.value})} required placeholder="Enter landlord/seller name" /></div>
              <div className="form-group"><label>Buyer Name (optional)</label><input type="text" value={collectionPaymentForm.buyer} onChange={(e) => setCollectionPaymentForm({...collectionPaymentForm, buyer: e.target.value})} placeholder="Enter buyer name" /></div>
              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  value={collectionPaymentForm.paymentMethod}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, paymentMethod: e.target.value, paymentProvider: e.target.value === 'mobile_money' ? collectionPaymentForm.paymentProvider : '' })}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              {collectionPaymentForm.paymentMethod === 'mobile_money' && (
                <div className="form-group">
                  <label>Mobile Money Provider *</label>
                  <select
                    value={collectionPaymentForm.paymentProvider}
                    onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, paymentProvider: e.target.value })}
                    required
                  >
                    <option value="">Select provider</option>
                    {MOBILE_MONEY_PROVIDERS.map((provider) => (
                      <option key={provider.value} value={provider.value}>{provider.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group"><label>Sale Amount (XOF) *</label><input type="number" min="0" step="0.01" value={collectionPaymentForm.saleAmount} onChange={(e) => setCollectionPaymentForm({...collectionPaymentForm, saleAmount: e.target.value, amount: e.target.value})} required placeholder="Enter sale amount" /></div>
              <div className="form-group"><label>Agency Commission (XOF)</label><input type="number" min="0" step="0.01" value={collectionPaymentForm.agencyCommission} onChange={(e) => setCollectionPaymentForm({...collectionPaymentForm, agencyCommission: e.target.value})} placeholder="Enter agency commission (optional)" /></div>
              <div className="modal-footer"><button type="button" className="action-button secondary" onClick={() => setCollectionPaymentType(null)} disabled={loading}>Back</button><button type="submit" className="action-button primary" disabled={loading}>{loading ? t('accounting.recording') : t('accounting.recordPayment')}</button></div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// View Payment/Collection Modal
PaymentsTab.ViewModal = (props) => {
  const { setShowPaymentViewModal, selectedItemForView, printPaymentReceipt } = props;
  const receiptData = buildReceiptData(selectedItemForView?.data, props.tenants || [], selectedItemForView?.type === 'collection');
  return (
    <div className="modal-overlay" onClick={() => setShowPaymentViewModal(false)}>
      <div className="modal-content modal-content-receipt" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', overflow: 'auto' }}>
        <div className="modal-header">
          <h3>{selectedItemForView.type === 'collection' ? 'View Collection' : 'View Payment'}</h3>
          <button className="modal-close" onClick={() => setShowPaymentViewModal(false)}>x</button>
        </div>
        <div className="modal-body" style={{ padding: '20px', overflow: 'auto', maxHeight: '85vh', backgroundColor: '#f0f0f0' }}>
          <RentReceiptTemplate data={receiptData} isCollection={selectedItemForView.type === 'collection'} />
          <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
            <button type="button" className="action-button secondary" onClick={() => setShowPaymentViewModal(false)}>Close</button>
            <button type="button" className="action-button primary" onClick={() => { printPaymentReceipt(selectedItemForView.data, selectedItemForView.type === 'collection'); setShowPaymentViewModal(false); }}>
              <Receipt size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Download Receipt PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsTab;
