import React from 'react';
import { Download } from 'lucide-react';
import { accountingService } from '../../services/accountingService';
import { t } from '../../utils/i18n';

const DepositRefundsTab = (props) => {
  const { loading, deposits, pendingRefunds, printRefundReceipt, setDepositRefundForm, setShowDepositRefundModal, setProcessDepositItem, setShowProcessDepositModal } = props;
  const processedRefunds = deposits.filter(d => (d.Type || d.type || '').toLowerCase() === 'refund');

  return (
    <div>
      <div className="sa-section-card">
        <div className="sa-section-header"><div><h2>Deposit Refunds</h2><p>Tenants with completed state of exit. Process refunds after deducting repair costs.</p></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}><p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Pending Refunds</p><p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#d97706' }}>{pendingRefunds.length}</p><p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>State of exit completed</p></div>
          <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}><p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Processed Refunds</p><p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#059669' }}>{processedRefunds.length}</p></div>
          <div style={{ padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #93c5fd' }}><p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Refunded</p><p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#0284c7' }}>{processedRefunds.reduce((sum, d) => sum + (d.Amount || d.amount || 0), 0).toFixed(2)} XOF</p></div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px' }}>Pending Refund Requests</h3>
          <p style={{ marginBottom: '16px', color: '#6b7280', fontSize: '0.875rem' }}>Only tenants for whom the technician has completed the state of exit appear here.</p>
          {loading ? <div className="loading">Loading refund requests...</div> : pendingRefunds.length === 0 ? <div className="no-data">No pending refund requests.</div> : (
            <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>Tenant</th><th>Property</th><th>Deposit Amount</th><th>Repair Cost</th><th>Refund Amount</th><th>Exit Date</th><th className="table-menu">Actions</th></tr></thead><tbody>
              {pendingRefunds.map((item, index) => {
                const depositAmount = item.depositAmount ?? item.DepositAmount ?? 0;
                const repairCost = item.repairCost ?? item.RepairCost ?? 0;
                const refundAmount = item.refundAmount ?? item.RefundAmount ?? Math.max(0, depositAmount - repairCost);
                const needsDeposit = item.needsDeposit === true;
                const depositId = item.depositId ?? item.depositID ?? 0;
                return (
                  <tr key={depositId || `refund-request-${index}`}>
                    <td><span className="sa-cell-title">{item.tenant || item.Tenant || 'N/A'}</span></td>
                    <td>{item.property || item.Property || 'N/A'}</td>
                    <td>{depositAmount > 0 ? `${depositAmount.toFixed(2)} XOF` : (needsDeposit ? 'Not recorded' : '-')}</td>
                    <td>{repairCost.toFixed(2)} XOF</td>
                    <td><strong>{depositAmount > 0 ? `${Math.max(0, refundAmount).toFixed(2)} XOF` : '-'}</strong></td>
                    <td>{item.exitInventoryDate ? new Date(item.exitInventoryDate).toLocaleDateString() : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-')}</td>
                    <td className="table-menu"><div className="sa-row-actions">
                      {needsDeposit ? (
                        <button className="table-action-button edit" onClick={() => { setProcessDepositItem({ tenant: item.tenant || item.Tenant, property: item.property || item.Property, depositAmount, repairCost, refundAmount: Math.max(0, depositAmount - repairCost), exitInventoryDate: item.exitInventoryDate }); setShowProcessDepositModal(true); }}>Process deposit</button>
                      ) : (
                        <button className="table-action-button edit" onClick={() => { setDepositRefundForm({ depositId, refundAmount: Math.max(0, refundAmount), depositAmount, repairCost, tenant: item.tenant || item.Tenant, property: item.property || item.Property, refundMethod: 'mobile_money', refundAccount: '', notes: '' }); setShowDepositRefundModal(true); }}>Process Refund</button>
                      )}
                    </div></td>
                  </tr>
                );
              })}
            </tbody></table></div>
          )}
        </div>

        <div>
          <h3 style={{ marginBottom: '16px' }}>Processed Refunds</h3>
          {processedRefunds.length === 0 ? <div className="no-data">No processed refunds</div> : (
            <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>Tenant</th><th>Property</th><th>Refund Amount</th><th>Refund Method</th><th>Refund Date</th><th>Status</th><th className="table-menu">Actions</th></tr></thead><tbody>
              {processedRefunds.map((refund, index) => (
                <tr key={refund.ID || `refund-${index}`}>
                  <td><span className="sa-cell-title">{refund.Tenant || 'N/A'}</span></td>
                  <td>{refund.Property || 'N/A'}</td>
                  <td>{(refund.Amount || refund.amount || 0).toFixed(2)} XOF</td>
                  <td>{refund.RefundMethod || refund.refundMethod || 'N/A'}</td>
                  <td>{refund.RefundedAt || refund.refundedAt ? new Date(refund.RefundedAt || refund.refundedAt).toLocaleDateString() : 'N/A'}</td>
                  <td><span className="sa-status-pill success">Refunded</span></td>
                  <td className="table-menu"><button className="table-action-button edit" onClick={() => printRefundReceipt(refund)} title="Download Receipt"><Download size={14} /> Receipt</button></td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </div>
      </div>
    </div>
  );
};

// Deposit Modals (payment, refund, process)
DepositRefundsTab.Modals = (props) => {
  const { loading, setLoading, addNotification, showDepositPaymentModal, setShowDepositPaymentModal, showDepositRefundModal, setShowDepositRefundModal, showProcessDepositModal, setShowProcessDepositModal, depositPaymentForm, setDepositPaymentForm, depositRefundForm, setDepositRefundForm, processDepositItem, setProcessDepositItem, processDepositManualAmount, setProcessDepositManualAmount, tenants, deposits, loadDeposits, loadDepositRefundsPending, setOverviewData } = props;

  return (
    <>
      {showDepositPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowDepositPaymentModal(false)}><div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h3>{t('accounting.recordSecurityDepositPayment')}</h3><button className="modal-close" onClick={() => setShowDepositPaymentModal(false)}>x</button></div>
          <div className="modal-body">
            <form onSubmit={async (e) => { e.preventDefault(); try { setLoading(true); await accountingService.recordDepositPayment({...depositPaymentForm, monthlyRent: parseFloat(depositPaymentForm.monthlyRent), amount: parseFloat(depositPaymentForm.monthlyRent) * 4.5 + (depositPaymentForm.applicationFees ? 37000 : 0), monthsMultiplier: 4.5}); addNotification('Security deposit payment recorded successfully!', 'success'); setShowDepositPaymentModal(false); setDepositPaymentForm({tenant:'',property:'',tenantType:'individual',monthlyRent:'',applicationFees:false,paymentMethod:'mobile_money',reference:'',notes:''}); await loadDeposits(); loadDepositRefundsPending(); } catch (error) { console.error('Error recording deposit payment:', error); addNotification(error.message || 'Failed to record deposit payment', 'error'); } finally { setLoading(false); } }}>
              <div className="form-group"><label>Tenant Name *</label><select value={depositPaymentForm.tenant} onChange={(e) => { const name = e.target.value; const t2 = tenants.find(x => (x.tenantName || x.TenantName) === name); const appFees = t2 ? !!(t2.applicationFees ?? t2.ApplicationFees) : false; setDepositPaymentForm({...depositPaymentForm, tenant: name, property: t2 ? (t2.property || t2.Property || '') : '', applicationFees: appFees}); }} required><option value="">Select tenant (with property)</option>{tenants.filter(t2 => (t2.property || t2.Property)).map((t2) => { const name = t2.tenantName || t2.TenantName || ''; return <option key={name} value={name}>{name} - {t2.property || t2.Property}</option>; })}</select></div>
              <div className="form-group"><label>Property *</label><input type="text" value={depositPaymentForm.property} onChange={(e) => setDepositPaymentForm({...depositPaymentForm, property: e.target.value})} required placeholder="Auto-filled when selecting tenant" /></div>
              <div className="form-group"><label>Tenant Type *</label><select value={depositPaymentForm.tenantType} onChange={(e) => setDepositPaymentForm({...depositPaymentForm, tenantType: e.target.value})} required><option value="individual">Individual</option><option value="company">Company</option></select><small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>4.5 months deposit for all properties</small></div>
              <div className="form-group"><label>Monthly Rent (XOF) *</label><input type="number" step="0.01" value={depositPaymentForm.monthlyRent} onChange={(e) => setDepositPaymentForm({...depositPaymentForm, monthlyRent: e.target.value})} required placeholder="0.00" />{depositPaymentForm.monthlyRent && <small style={{ color: '#059669', marginTop: '4px', display: 'block', fontWeight: '600' }}>Deposit Amount: {(parseFloat(depositPaymentForm.monthlyRent) * 4.5 + (depositPaymentForm.applicationFees ? 37000 : 0)).toFixed(2)} XOF</small>}</div>
              <div className="form-group"><label>Payment Method *</label><select value={depositPaymentForm.paymentMethod} onChange={(e) => setDepositPaymentForm({...depositPaymentForm, paymentMethod: e.target.value})} required><option value="mobile_money">Mobile Money</option><option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option><option value="cheque">Cheque</option></select></div>
              <div className="form-group"><label>Reference</label><input type="text" value={depositPaymentForm.reference} onChange={(e) => setDepositPaymentForm({...depositPaymentForm, reference: e.target.value})} placeholder="Payment reference number" /></div>
              <div className="form-group"><label>Notes</label><textarea value={depositPaymentForm.notes} onChange={(e) => setDepositPaymentForm({...depositPaymentForm, notes: e.target.value})} placeholder="Additional notes" rows="3" /></div>
              <div className="modal-footer"><button type="button" className="action-button secondary" onClick={() => setShowDepositPaymentModal(false)}>{t('accounting.cancel')}</button><button type="submit" className="action-button primary" disabled={loading}>{loading ? t('accounting.recording') : t('accounting.recordPayment')}</button></div>
            </form>
          </div>
        </div></div>
      )}

      {showProcessDepositModal && processDepositItem && (
        <div className="modal-overlay" onClick={() => { setShowProcessDepositModal(false); setProcessDepositItem(null); setProcessDepositManualAmount(''); }}><div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
          <div className="modal-header"><h3>Process Deposit Refund</h3><button className="modal-close" onClick={() => { setShowProcessDepositModal(false); setProcessDepositItem(null); setProcessDepositManualAmount(''); }}>x</button></div>
          <div className="modal-body">{(() => {
            const depositAmt = (processDepositItem.depositAmount || 0) > 0 ? processDepositItem.depositAmount : parseFloat(processDepositManualAmount) || 0;
            const repairAmt = processDepositItem.repairCost || 0;
            const refundAmt = Math.max(0, depositAmt - repairAmt);
            return (<>
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>Refund calculation</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div><strong>Tenant:</strong> {processDepositItem.tenant || '-'}</div>
                  <div><strong>Property:</strong> {processDepositItem.property || '-'}</div>
                  {(processDepositItem.depositAmount || 0) <= 0 ? <div className="form-group" style={{ marginBottom: 0 }}><label>Deposit amount (XOF) *</label><input type="number" step="0.01" min="0" value={processDepositManualAmount} onChange={(e) => setProcessDepositManualAmount(e.target.value)} placeholder="Enter deposit amount" style={{ width: '100%', padding: '8px 12px' }} /></div> : <div><strong>Deposit amount:</strong> {depositAmt.toFixed(2)} XOF</div>}
                  <div><strong>Repair cost (deducted):</strong> {repairAmt.toFixed(2)} XOF</div>
                  <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '1.1rem', fontWeight: '600', color: '#059669' }}>Amount to refund: {refundAmt.toFixed(2)} XOF</div>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="action-button secondary" onClick={() => { setShowProcessDepositModal(false); setProcessDepositItem(null); setProcessDepositManualAmount(''); }}>Deny</button>
                <button type="button" className="action-button primary" disabled={loading || depositAmt <= 0} onClick={async () => { try { setLoading(true); const monthlyRent = depositAmt / 4.5; const depositRes = await accountingService.recordDepositPayment({ tenant: processDepositItem.tenant, property: processDepositItem.property, tenantType: 'individual', monthlyRent, paymentMethod: 'mobile_money', reference: '', notes: 'Recorded via Process deposit refund' }); const newDepositId = depositRes?.ID ?? depositRes?.id; if (newDepositId) { await accountingService.processDepositRefund({ depositId: newDepositId, refundAmount: refundAmt, refundMethod: 'mobile_money', refundAccount: '', notes: '' }); } addNotification('Deposit recorded and refund processed successfully!', 'success'); setShowProcessDepositModal(false); setProcessDepositItem(null); setProcessDepositManualAmount(''); await loadDeposits(); loadDepositRefundsPending(); try { const overview = await accountingService.getOverview(); setOverviewData(overview); } catch (err) { console.error(err); } } catch (error) { console.error('Error processing deposit refund:', error); addNotification(error.message || 'Failed to process deposit refund', 'error'); } finally { setLoading(false); } }}>{loading ? 'Processing...' : 'Approve'}</button>
              </div>
            </>);
          })()}</div>
        </div></div>
      )}

      {showDepositRefundModal && (
        <div className="modal-overlay" onClick={() => setShowDepositRefundModal(false)}><div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h3>{t('accounting.processSecurityDepositRefund')}</h3><button className="modal-close" onClick={() => setShowDepositRefundModal(false)}>x</button></div>
          <div className="modal-body">
            <form onSubmit={async (e) => { e.preventDefault(); try { setLoading(true); const payload = { depositId: parseInt(depositRefundForm.depositId), refundMethod: depositRefundForm.refundMethod, refundAccount: depositRefundForm.refundAccount, notes: depositRefundForm.notes }; if (depositRefundForm.refundAmount != null && depositRefundForm.refundAmount >= 0) { payload.refundAmount = depositRefundForm.refundAmount; } await accountingService.processDepositRefund(payload); addNotification('Security deposit refund processed successfully!', 'success'); setShowDepositRefundModal(false); setDepositRefundForm({depositId:'',refundAmount:null,depositAmount:0,repairCost:0,tenant:'',property:'',refundMethod:'mobile_money',refundAccount:'',notes:''}); await loadDeposits(); loadDepositRefundsPending(); try { const overview = await accountingService.getOverview(); setOverviewData(overview); } catch (err) { console.error('Error refreshing overview:', err); } } catch (error) { console.error('Error processing deposit refund:', error); addNotification(error.message || 'Failed to process deposit refund', 'error'); } finally { setLoading(false); } }}>
              {depositRefundForm.depositId && depositRefundForm.refundAmount != null ? (
                <div className="form-group" style={{ padding: '16px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '16px' }}><h4 style={{ margin: '0 0 12px 0' }}>Refund Summary</h4><p style={{ margin: '4px 0' }}><strong>Tenant:</strong> {depositRefundForm.tenant || '-'}</p><p style={{ margin: '4px 0' }}><strong>Property:</strong> {depositRefundForm.property || '-'}</p><p style={{ margin: '4px 0' }}><strong>Deposit Amount:</strong> {(depositRefundForm.depositAmount || 0).toFixed(2)} XOF</p><p style={{ margin: '4px 0' }}><strong>Repair Cost (deducted):</strong> {(depositRefundForm.repairCost || 0).toFixed(2)} XOF</p><p style={{ margin: '8px 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#059669' }}>Amount to Refund: {(depositRefundForm.refundAmount || 0).toFixed(2)} XOF</p></div>
              ) : (
                <div className="form-group"><label>Select Deposit to Refund *</label><select value={depositRefundForm.depositId} onChange={(e) => setDepositRefundForm({...depositRefundForm, depositId: e.target.value})} required><option value="">Select Deposit</option>{deposits.filter(d => (d.Type || d.type || '').toLowerCase() === 'payment').filter(deposit => !deposits.some(r => (r.Type || r.type || '').toLowerCase() === 'refund' && (r.Tenant || r.tenant) === (deposit.Tenant || deposit.tenant) && (r.Property || r.property) === (deposit.Property || deposit.property))).map(deposit => (<option key={deposit.ID || deposit.id} value={deposit.ID || deposit.id}>{deposit.Tenant || deposit.tenant} - {deposit.Property || deposit.property} - {(deposit.Amount || deposit.amount || 0).toFixed(2)} XOF</option>))}</select></div>
              )}
              <div className="form-group"><label>Refund Method *</label><select value={depositRefundForm.refundMethod} onChange={(e) => setDepositRefundForm({...depositRefundForm, refundMethod: e.target.value})} required><option value="mobile_money">Mobile Money</option><option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option><option value="cheque">Cheque</option></select></div>
              <div className="form-group"><label>Refund Account Details *</label><input type="text" value={depositRefundForm.refundAccount} onChange={(e) => setDepositRefundForm({...depositRefundForm, refundAccount: e.target.value})} required placeholder="Phone number, bank account, or cash recipient name" /></div>
              <div className="form-group"><label>Notes</label><textarea value={depositRefundForm.notes} onChange={(e) => setDepositRefundForm({...depositRefundForm, notes: e.target.value})} placeholder="Additional notes about the refund" rows="3" /></div>
              <div className="modal-footer"><button type="button" className="action-button secondary" onClick={() => setShowDepositRefundModal(false)}>{t('accounting.cancel')}</button><button type="submit" className="action-button primary" disabled={loading}>{loading ? 'Processing...' : 'Process Refund'}</button></div>
            </form>
          </div>
        </div></div>
      )}
    </>
  );
};

export default DepositRefundsTab;
