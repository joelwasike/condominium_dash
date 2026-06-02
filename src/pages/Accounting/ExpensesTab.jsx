import React from 'react';
import { Plus, Download } from 'lucide-react';
import { accountingService } from '../../services/accountingService';
import { t } from '../../utils/i18n';

const ExpensesTab = (props) => {
  const {
    loading, setLoading, addNotification, expenses, setExpenses,
    expenseViewCard, setExpenseViewCard, expensesSummary, expensesPerOwner,
    expenseBuildingFilter, setExpenseBuildingFilter,
    expenseCategoryFilter, setExpenseCategoryFilter,
    expenseScopeFilter, setExpenseScopeFilter,
    expenseOwnerFilter, setExpenseOwnerFilter,
    expenseStartDateFilter, setExpenseStartDateFilter,
    expenseEndDateFilter, setExpenseEndDateFilter,
    setShowExpenseModal, setSelectedExpense, setShowViewExpenseModal,
    getFilteredExpenses, exportExpensesToCSV, printExpenseReceipt
  } = props;

  const filteredExpenses = getFilteredExpenses();
  const uniqueBuildings = [...new Set(expenses.map(exp => exp.Building || exp.building).filter(Boolean))];
  const uniqueCategories = [...new Set(expenses.map(exp => exp.Category || exp.category).filter(Boolean))];
  const uniqueScopes = [...new Set(expenses.map(exp => exp.Scope || exp.scope).filter(Boolean))];
  const uniqueOwners = [...new Set(expenses.map(exp => exp.Owner || exp.owner || exp.Landlord || exp.landlord).filter(Boolean))];

  const totalExp = expensesSummary?.totalExpenses ?? 0;
  const agencyExp = expensesSummary?.agencyExpenses ?? 0;
  const ownerExp = expensesSummary?.ownerExpenses ?? 0;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[{key:'total',label:'Total Expenses',val:totalExp},{key:'agency',label:'Agency Expenses',val:agencyExp},{key:'owner',label:'Owner Expenses',val:ownerExp}].map(({key,label,val}) => (
          <div key={key} onClick={() => setExpenseViewCard(key)} style={{ padding: '20px', borderRadius: '8px', border: `2px solid ${expenseViewCard === key ? '#3b82f6' : '#e5e7eb'}`, backgroundColor: expenseViewCard === key ? '#eff6ff' : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{label}</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#1f2937' }}>{val.toFixed(2)} XOF</p>
          </div>
        ))}
      </div>

      <div className="sa-section-card">
        <div className="sa-section-header">
          <div><h2>Expense Management</h2><p>Track expenses by building or for SAAF IMMO</p></div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="sa-outline-button" onClick={exportExpensesToCSV} disabled={loading || filteredExpenses.length === 0}><Download size={18} /> Export to CSV</button>
            <button className="sa-primary-cta" onClick={() => setShowExpenseModal(true)} disabled={loading}><Plus size={18} /> {t('accounting.addExpense')}</button>
          </div>
        </div>

        {expenseViewCard !== 'owner' && (
          <div className="sa-filters-section" style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <select className="sa-filter-select" value={expenseBuildingFilter} onChange={(e) => setExpenseBuildingFilter(e.target.value)}><option value="">All Buildings</option>{uniqueBuildings.map(b => <option key={b} value={b}>{b}</option>)}</select>
            <select className="sa-filter-select" value={expenseCategoryFilter} onChange={(e) => setExpenseCategoryFilter(e.target.value)}><option value="">All Categories</option>{uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select className="sa-filter-select" value={expenseScopeFilter} onChange={(e) => setExpenseScopeFilter(e.target.value)}><option value="">All Scopes</option>{uniqueScopes.map(s => <option key={s} value={s}>{s}</option>)}</select>
            <select className="sa-filter-select" value={expenseOwnerFilter} onChange={(e) => setExpenseOwnerFilter(e.target.value)}><option value="">All Owners</option>{uniqueOwners.map(o => <option key={o} value={o}>{o}</option>)}</select>
            <input type="date" className="sa-filter-select" value={expenseStartDateFilter} onChange={(e) => setExpenseStartDateFilter(e.target.value)} placeholder="Start Date" />
            <input type="date" className="sa-filter-select" value={expenseEndDateFilter} onChange={(e) => setExpenseEndDateFilter(e.target.value)} placeholder="End Date" />
            {(expenseBuildingFilter || expenseCategoryFilter || expenseScopeFilter || expenseOwnerFilter || expenseStartDateFilter || expenseEndDateFilter) && (
              <button className="sa-outline-button" onClick={() => { setExpenseBuildingFilter(''); setExpenseCategoryFilter(''); setExpenseScopeFilter(''); setExpenseOwnerFilter(''); setExpenseStartDateFilter(''); setExpenseEndDateFilter(''); }} style={{ marginLeft: 'auto' }}>Clear Filters</button>
            )}
          </div>
        )}

        {expenseViewCard === 'owner' ? (
          loading ? <div className="loading">Loading expenses per owner...</div> : expensesPerOwner.length === 0 ? <div className="no-data">No owner expenses found</div> : (
            <div style={{ padding: '16px' }}>
              {expensesPerOwner.map((ownerGroup, idx) => (
                <div key={ownerGroup.ownerId || idx} style={{ marginBottom: '24px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{ownerGroup.ownerName || 'Unknown'}</span>
                    <span style={{ fontWeight: 600, color: '#059669' }}>{(ownerGroup.total || 0).toFixed(2)} XOF</span>
                  </div>
                  <div className="sa-table-wrapper">
                    <table className="sa-table"><thead><tr><th>Date</th><th>Building</th><th>Category</th><th>Requested by</th><th>Amount</th><th>Notes</th></tr></thead>
                      <tbody>{(ownerGroup.expenses || []).map((exp, i) => (
                        <tr key={exp.ID || exp.id || i}>
                          <td>{exp.Date ? new Date(exp.Date).toLocaleDateString() : (exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A')}</td>
                          <td>{exp.Building || exp.building || 'N/A'}</td><td>{exp.Category || exp.category || 'N/A'}</td>
                          <td>{exp.RequestedBy || exp.requestedBy || '-'}</td><td>{(exp.Amount || exp.amount || 0).toFixed(2)} XOF</td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.Notes || exp.notes || 'N/A'}</td>
                        </tr>
                      ))}</tbody></table>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : loading ? <div className="loading">Loading expenses...</div> : filteredExpenses.length === 0 ? (
          <div className="no-data">{expenses.length === 0 ? 'No expenses found' : 'No expenses match the selected filters'}</div>
        ) : (
          <>
            <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Showing {filteredExpenses.length} of {expenses.length} expense(s)
                {filteredExpenses.length > 0 && <span style={{ marginLeft: '16px', fontWeight: '600' }}>Total: {(filteredExpenses.reduce((sum, exp) => sum + (exp.Amount || exp.amount || 0), 0)).toFixed(2)} XOF</span>}
              </p>
            </div>
            <div className="sa-table-wrapper">
              <table className="sa-table">
                <thead><tr><th>Date</th><th>Scope</th><th>Building</th><th>Owner</th><th>Category</th><th>Requested by</th><th>Amount</th><th>Notes</th><th className="table-menu"></th></tr></thead>
                <tbody>
                  {filteredExpenses.map((exp, index) => (
                    <tr key={exp.ID || exp.id || `expense-${index}`}>
                      <td>{exp.Date ? new Date(exp.Date).toLocaleDateString() : (exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A')}</td>
                      <td>{exp.Scope || exp.scope || 'N/A'}</td>
                      <td><span className="sa-cell-title">{exp.Building || exp.building || 'N/A'}</span></td>
                      <td>{exp.Owner || exp.owner || exp.Landlord || exp.landlord || '-'}</td>
                      <td>{exp.Category || exp.category || 'N/A'}</td>
                      <td>{exp.RequestedBy || exp.requestedBy || '-'}</td>
                      <td>{(exp.Amount || exp.amount || 0).toFixed(2)} XOF</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.Notes || exp.notes || 'N/A'}</td>
                      <td className="table-menu">
                        <div className="sa-row-actions">
                          <button className="table-action-button view" onClick={() => { setSelectedExpense(exp); setShowViewExpenseModal(true); }}>View</button>
                          <button className="table-action-button" onClick={() => { setSelectedExpense(exp); printExpenseReceipt(exp); }} style={{ backgroundColor: '#3b82f6', color: 'white', marginLeft: '4px' }}>Print</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
};

// Add Expense Modal
ExpensesTab.AddModal = (props) => {
  const { loading, setLoading, addNotification, setShowExpenseModal, setExpenses, loadExpenses, setOverviewData, landlords, expenseProperties, expenseFormScope, setExpenseFormScope, expenseFormBuilding, setExpenseFormBuilding, expenseFormUnits, setExpenseFormUnits, cashierAccounts, setCashierAccounts, setCashierTransactions } = props;
  const { expenseDate, setExpenseDate } = props;
  const resetExpenseModal = () => {
    setShowExpenseModal(false);
    setExpenseFormScope('Building');
    setExpenseFormBuilding('');
    setExpenseFormUnits([]);
    setExpenseDate(new Date().toISOString().split('T')[0]);
  };
  return (
    <div className="modal-overlay" onClick={resetExpenseModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h3>Add Expense</h3><button className="modal-close" onClick={resetExpenseModal}>x</button></div>
        <div className="modal-body">
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              setLoading(true);
              const formData = new FormData(e.target);
              const accountId = formData.get('accountId');
              const scope = 'Building';
              const property = formData.get('building');
              const unit = formData.get('unit');
              const owner = formData.get('owner');
              const buildingValue = unit ? `${property} - ${unit}` : property || '-';
              const expenseData = { scope, building: buildingValue, owner: owner || undefined, category: formData.get('category'), requestedBy: formData.get('requestedBy') || '', amount: parseFloat(formData.get('amount')), date: formData.get('date'), notes: formData.get('notes'), accountId: accountId ? parseInt(accountId) : null, requiresOwnerApproval: scope === 'Building', deductFrom: scope === 'Building' ? 'owner_balance' : 'commission_account' };
              const newExpense = await accountingService.addExpense(expenseData);
              setExpenses(prev => [newExpense, ...prev]);
              if (accountId) { try { const [accounts, transactions] = await Promise.all([accountingService.getCashierAccounts().catch(() => []), accountingService.getCashierTransactions().catch(() => [])]); setCashierAccounts(Array.isArray(accounts) ? accounts : []); setCashierTransactions(Array.isArray(transactions) ? transactions : []); } catch (error) { console.error('Error reloading cashier data:', error); } }
              addNotification('Expense added successfully!', 'success');
              resetExpenseModal();
              await loadExpenses();
              try { const overview = await accountingService.getOverview(); setOverviewData(overview); } catch (err) { console.error('Error refreshing overview:', err); }
              e.target.reset();
            } catch (error) { console.error('Error adding expense:', error); addNotification('Failed to add expense. Please try again.', 'error'); } finally { setLoading(false); }
          }}>
            <div className="form-group"><label>Owner</label><select name="owner"><option value="">Select Owner</option>{landlords.map((l) => { const name = l.Name || l.name || l.Landlord || l.landlord || l.Email || l.email || '-'; return <option key={l.ID || l.id} value={name}>{name}</option>; })}</select></div>
            <div className="form-group"><label>Property</label><select name="building" required value={expenseFormBuilding} onChange={(e) => setExpenseFormBuilding(e.target.value)}><option value="">Select Property</option>{expenseProperties.map((p) => { const addr = p.address || p.Address || ''; return <option key={addr} value={addr}>{addr}</option>; })}</select></div>
            {expenseFormBuilding && (<div className="form-group"><label>Apartment / Unit (optional)</label><select name="unit"><option value="">-- Entire property --</option>{expenseFormUnits.map((u) => { const unitNum = u.UnitNumber || u.unitNumber || ''; return <option key={u.ID || u.id || unitNum} value={unitNum}>{unitNum}</option>; })}</select>{expenseFormUnits.length === 0 && <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>No units found for this property</small>}</div>)}
            <div className="form-group"><label>Category</label><select name="category" required><option value="">Select Category</option><option value="Maintenance">Maintenance</option><option value="Utilities">Utilities</option><option value="Taxes">Taxes</option><option value="Software">Software</option><option value="Other">Other</option></select></div>
            <div className="form-group"><label>Requested by (name of person)</label><input type="text" name="requestedBy" placeholder="Enter name of person who requested the payment" /></div>
            <div className="form-group"><label>Amount</label><input type="number" name="amount" step="0.01" required /></div>
            <div className="form-group"><label>Date</label><input type="date" name="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required /></div>
            <div className="form-group"><label>Cashier Account (to deduct from)</label><select name="accountId"><option value="">No deduction (manual entry)</option>{cashierAccounts.filter(acc => acc.IsActive !== false && acc.isActive !== false).map(account => (<option key={account.ID || account.id} value={account.ID || account.id}>{account.Name || account.name} - {(account.Balance || account.balance || 0).toFixed(2)} {account.Currency || account.currency || 'XOF'}</option>))}</select><small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>Select a cashier account to automatically deduct the expense amount from its balance.</small></div>
            <div className="form-group"><label>Notes</label><input type="text" name="notes" placeholder="Optional" /></div>
            <div className="form-group"><label>Document (optional)</label><input type="file" name="document" accept=".pdf,image/*" /><small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>Attach receipt or supporting document</small></div>
            <div className="modal-footer"><button type="button" className="action-button secondary" onClick={resetExpenseModal}>{t('accounting.cancel')}</button><button type="submit" className="action-button primary" disabled={loading}>{loading ? t('accounting.adding') : t('accounting.addExpense')}</button></div>
          </form>
        </div>
      </div>
    </div>
  );
};

// View Expense Modal
ExpensesTab.ViewModal = (props) => {
  const { setShowViewExpenseModal, selectedExpense, setShowEditExpenseModal } = props;
  return (
    <div className="modal-overlay" onClick={() => setShowViewExpenseModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h3>View Expense</h3><button className="modal-close" onClick={() => setShowViewExpenseModal(false)}>x</button></div>
        <div className="modal-body">
          <div className="form-group"><label>Date</label><div>{selectedExpense.Date ? new Date(selectedExpense.Date).toLocaleDateString() : (selectedExpense.date ? new Date(selectedExpense.date).toLocaleDateString() : 'N/A')}</div></div>
          <div className="form-group"><label>Scope</label><div>{selectedExpense.Scope || selectedExpense.scope || 'N/A'}</div></div>
          <div className="form-group"><label>Building</label><div>{selectedExpense.Building || selectedExpense.building || 'N/A'}</div></div>
          <div className="form-group"><label>Category</label><div>{selectedExpense.Category || selectedExpense.category || 'N/A'}</div></div>
          <div className="form-group"><label>Requested by</label><div>{selectedExpense.RequestedBy || selectedExpense.requestedBy || '-'}</div></div>
          <div className="form-group"><label>Amount</label><div>{(selectedExpense.Amount || selectedExpense.amount || 0).toFixed(2)} XOF</div></div>
          <div className="form-group"><label>Notes</label><div>{selectedExpense.Notes || selectedExpense.notes || 'N/A'}</div></div>
          {(selectedExpense.DocumentURL || selectedExpense.documentURL || selectedExpense.DocumentUrl || selectedExpense.documentUrl) && (<div className="form-group"><label>Document</label><a href={selectedExpense.DocumentURL || selectedExpense.documentURL || selectedExpense.DocumentUrl || selectedExpense.documentUrl} target="_blank" rel="noopener noreferrer" className="action-button primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}><Download size={16} /> View / Download Document</a></div>)}
          <div className="modal-footer"><button type="button" className="action-button secondary" onClick={() => setShowViewExpenseModal(false)}>Close</button><button type="button" className="action-button primary" onClick={() => { setShowViewExpenseModal(false); setShowEditExpenseModal(true); }}>Edit</button></div>
        </div>
      </div>
    </div>
  );
};

// Edit Expense Modal
ExpensesTab.EditModal = (props) => {
  const { loading, setLoading, addNotification, setShowEditExpenseModal, selectedExpense, setSelectedExpense, loadExpenses, setOverviewData } = props;
  return (
    <div className="modal-overlay" onClick={() => setShowEditExpenseModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h3>{t('accounting.editExpense')}</h3><button className="modal-close" onClick={() => { setShowEditExpenseModal(false); setSelectedExpense(null); }}>x</button></div>
        <div className="modal-body">
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              setLoading(true);
              const formData = new FormData(e.target);
              const expenseData = { scope: formData.get('scope'), building: formData.get('scope') === 'SAAF IMMO' ? '-' : formData.get('building'), category: formData.get('category'), amount: parseFloat(formData.get('amount')), date: formData.get('date'), notes: formData.get('notes') };
              await accountingService.updateExpense(selectedExpense.ID || selectedExpense.id, expenseData);
              addNotification('Expense updated successfully!', 'success');
              setShowEditExpenseModal(false); setSelectedExpense(null);
              await loadExpenses();
              try { const overview = await accountingService.getOverview(); setOverviewData(overview); } catch (err) { console.error('Error refreshing overview:', err); }
            } catch (error) { console.error('Error updating expense:', error); addNotification('Failed to update expense. Please try again.', 'error'); } finally { setLoading(false); }
          }}>
            <div className="form-group"><label>Scope</label><select name="scope" defaultValue={selectedExpense.Scope || selectedExpense.scope} required><option value="">Select Scope</option><option value="Building">Building</option><option value="SAAF IMMO">SAAF IMMO</option></select></div>
            <div className="form-group"><label>Building (if Building scope)</label><select name="building" defaultValue={selectedExpense.Building || selectedExpense.building}><option value="">Select Building</option><option value="123 Main St">123 Main St</option><option value="456 Oak Ave">456 Oak Ave</option><option value="789 Pine Ln">789 Pine Ln</option><option value="321 Elm St">321 Elm St</option></select></div>
            <div className="form-group"><label>Category</label><select name="category" defaultValue={selectedExpense.Category || selectedExpense.category} required><option value="">Select Category</option><option value="Maintenance">Maintenance</option><option value="Utilities">Utilities</option><option value="Taxes">Taxes</option><option value="Software">Software</option><option value="Other">Other</option></select></div>
            <div className="form-group"><label>Amount</label><input type="number" name="amount" step="0.01" defaultValue={selectedExpense.Amount || selectedExpense.amount} required /></div>
            <div className="form-group"><label>Date</label><input type="date" name="date" defaultValue={selectedExpense.Date ? new Date(selectedExpense.Date).toISOString().split('T')[0] : (selectedExpense.date ? new Date(selectedExpense.date).toISOString().split('T')[0] : '')} required /></div>
            <div className="form-group"><label>Notes</label><input type="text" name="notes" defaultValue={selectedExpense.Notes || selectedExpense.notes || ''} placeholder="Optional" /></div>
            <div className="modal-footer"><button type="button" className="action-button secondary" onClick={() => { setShowEditExpenseModal(false); setSelectedExpense(null); }}>Cancel</button><button type="submit" className="action-button primary" disabled={loading}>{loading ? 'Updating...' : 'Update Expense'}</button></div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpensesTab;
