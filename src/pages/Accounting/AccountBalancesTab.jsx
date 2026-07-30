import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Wallet, Smartphone, Banknote, Building2, Users, ArrowLeft } from 'lucide-react';
import { accountingService } from '../../services/accountingService';
import { t } from '../../utils/i18n';

const AccountBalancesTab = (props) => {
  const { loading, overviewData, cashierAccounts, cashierTransactions, agencyBalance, ownerBalancesOwners, ownerBalancesLoading, selectedOwnerForBalance, setSelectedOwnerForBalance, collections, landlordPayments, expenses, setShowCashierAccountModal, setCashierAccountForm, setShowCashierTransactionModal, setCashierTransactionForm } = props;
  const [showMobileMoneyDetails, setShowMobileMoneyDetails] = useState(false);
  const [ownerSummaryRows, setOwnerSummaryRows] = useState([]);
  const [ownerSummaryLoading, setOwnerSummaryLoading] = useState(false);

  const totalBalance = cashierAccounts.filter((acc) => acc.IsActive !== false && acc.isActive !== false).reduce((sum, acc) => sum + (acc.Balance || acc.balance || 0), 0);
  const cashBalance = cashierAccounts.filter((acc) => (acc.Type || acc.type) === 'cash_register' && acc.IsActive !== false && acc.isActive !== false).reduce((sum, acc) => sum + (acc.Balance || acc.balance || 0), 0);
  const bankBalance = cashierAccounts.filter((acc) => (acc.Type || acc.type) === 'bank' && acc.IsActive !== false && acc.isActive !== false).reduce((sum, acc) => sum + (acc.Balance || acc.balance || 0), 0);
  const globalBalance = overviewData?.globalBalance ?? overviewData?.totalAvailableBalance ?? overviewData?.TotalAvailableBalance ?? 0;
  const bankAccountIds = cashierAccounts.filter((acc) => (acc.Type || acc.type) === 'bank').map((acc) => acc.ID || acc.id);
  const activeAccounts = cashierAccounts.filter((acc) => acc.IsActive !== false && acc.isActive !== false);
  const accountsByType = { mobile_money: cashierAccounts.filter((acc) => (acc.Type || acc.type) === 'mobile_money'), bank: cashierAccounts.filter((acc) => (acc.Type || acc.type) === 'bank'), other: cashierAccounts.filter((acc) => !['mobile_money', 'cash_register', 'bank'].includes(acc.Type || acc.type)) };
  const mobileMoneySummary = useMemo(() => {
    const providerMatchers = [
    { name: 'Orange Business', match: /orange\s*business/i },
    { name: 'Wave', match: /\bwave\b/i },
    { name: 'Orange Money', match: /orange\s*money|\bom\b/i }];

    return providerMatchers.map((provider) => {
      const balance = activeAccounts.
      filter((account) => {
        const label = `${account.Name || account.name || ''} ${account.Description || account.description || ''}`;
        return provider.match.test(label);
      }).
      reduce((sum, account) => sum + (account.Balance || account.balance || 0), 0);
      return { name: provider.name, balance };
    });
  }, [activeAccounts]);
  const mobileMoneyTotal = mobileMoneySummary.reduce((sum, item) => sum + item.balance, 0);

  useEffect(() => {
    let cancelled = false;

    const loadOwnerSummary = async () => {
      setOwnerSummaryLoading(true);
      try {
        const data = await accountingService.getOwnersSummary();
        if (!cancelled) {
          setOwnerSummaryRows(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error loading owner summary:', error);
        if (!cancelled) {
          setOwnerSummaryRows([]);
        }
      } finally {
        if (!cancelled) {
          setOwnerSummaryLoading(false);
        }
      }
    };

    loadOwnerSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedOwnerSummaryRows = useMemo(() => {
    return ownerSummaryRows.map((summary, index) => {
      const ownerId = summary.ownerId ?? summary.OwnerID ?? summary.ownerID ?? summary.id ?? index;
      const ownerName = summary.ownerName || summary.OwnerName || summary.landlord || summary.Landlord || 'N/A';
      const expectedRents = Number(summary.expectedRents ?? summary.ExpectedRents ?? 0);
      const collectedRents = Number(summary.collectedRents ?? summary.CollectedRents ?? 0);
      const expensesAmount = Number(summary.expensesAmount ?? summary.ExpensesAmount ?? 0);
      const agencyCommission = Number(summary.agencyCommission ?? summary.AgencyCommission ?? 0);
      const amountToBePaid = Number(summary.amountToBePaid ?? summary.AmountToBePaid ?? summary.amountToBeRepaid ?? summary.AmountToBeRepaid ?? 0);
      const period = summary.period || summary.Period || 'This month';
      return { key: ownerId, ownerId, ownerName, expectedRents, collectedRents, expensesAmount, agencyCommission, amountToBePaid, period };
    });
  }, [ownerSummaryRows]);

  const renderAccountGroup = (accounts, icon, title, iconColor) => accounts.length > 0 &&
  <div className="sa-section-card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>{icon}<h3 style={{ margin: 0, fontSize: '1rem' }}>{title}</h3></div>
      {accounts.map((account, index) => <div key={account.ID || account.id || index} style={{ padding: '12px', marginBottom: '8px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}><p style={{ margin: 0, fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{account.Name || account.name || 'Unnamed'}</p><p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#059669' }}>{(account.Balance || account.balance || 0).toFixed(2)} XOF</p></div></div>)}
    </div>;


  return (
    <div>
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div><h2>Account Balances</h2><p>View account balances, inflows/outflows, and owner transfers</p></div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="sa-outline-button" onClick={() => {setCashierTransactionForm({ accountId: '', type: 'deposit', amount: '', reference: '', description: '', toAccountId: '' });setShowCashierTransactionModal(true);}} disabled={loading || cashierAccounts.length === 0}><Plus size={18} /> Add Transaction</button>
            <button className="sa-primary-cta" onClick={() => {setCashierAccountForm({ name: '', type: 'cash_register', balance: 0, currency: 'XOF', description: '' });setShowCashierAccountModal(true);}} disabled={loading}><Plus size={18} /> Add Account</button>
          </div>
        </div>

        <div style={{ padding: '16px 20px', marginBottom: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Global Balance</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#166534' }}>{totalBalance.toFixed(2)} XOF</p>
              <p style={{ margin: '6px 0 0 0', color: '#6b7280', fontSize: '0.8rem' }}>Sum of all cashier accounts (bank + mobile + agency + cash)</p>
            </div>
            <Wallet size={36} style={{ color: '#22c55e' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {renderAccountGroup(accountsByType.bank, <Building2 size={20} style={{ color: '#8b5cf6' }} />, 'Bank Accounts')}
          {renderAccountGroup(accountsByType.other, <Wallet size={20} style={{ color: '#6b7280' }} />, 'Other Accounts')}
          <div
            className="sa-section-card"
            style={{ padding: '16px', cursor: 'pointer' }}
            onClick={() => setShowMobileMoneyDetails((value) => !value)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowMobileMoneyDetails((value) => !value);
              }
            }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Smartphone size={20} style={{ color: '#3b82f6' }} />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Mobile Money</h3>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Total mobile money collected</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '1.25rem', fontWeight: 600, color: '#1d4ed8' }}>{mobileMoneyTotal.toFixed(2)} XOF</p>
            </div>
            {showMobileMoneyDetails &&
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mobileMoneySummary.map((provider) =>
              <div key={provider.name} style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{provider.name}</p>
                    <p style={{ margin: '4px 0 0 0', color: '#1d4ed8', fontWeight: 700 }}>{provider.balance.toFixed(2)} XOF</p>
                  </div>
              )}
              </div>
            }
          </div>
          <div className="sa-section-card" style={{ padding: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Building2 size={20} style={{ color: '#f59e0b' }} /><h3 style={{ margin: 0, fontSize: '1rem' }}>Agency Balance</h3></div><div style={{ padding: '12px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}><p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Commission from tenant payments</p><p style={{ margin: '6px 0 0 0', fontSize: '1.25rem', fontWeight: '600', color: '#b45309' }}>{(agencyBalance ?? 0).toFixed(2)} XOF</p></div></div>
          <div className="sa-section-card" style={{ padding: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Banknote size={20} style={{ color: '#10b981' }} /><h3 style={{ margin: 0, fontSize: '1rem' }}>Cash Balance</h3></div><div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #86efac' }}><p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Physical Cash</p><p style={{ margin: '6px 0 0 0', fontSize: '1.25rem', fontWeight: 600, color: '#166534' }}>{cashBalance.toFixed(2)} XOF</p></div></div>
          <div className="sa-section-card" style={{ padding: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Building2 size={20} style={{ color: '#8b5cf6' }} /><h3 style={{ margin: 0, fontSize: '1rem' }}>Bank Balance</h3></div><div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #93c5fd' }}><p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Bank Accounts Total</p><p style={{ margin: '6px 0 0 0', fontSize: '1.25rem', fontWeight: 600, color: '#0284c7' }}>{bankBalance.toFixed(2)} XOF</p></div></div>
          {cashierAccounts.length === 0 && <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>{t('accounting.noCashierAccounts')}</div>}
        </div>
        <div className="sa-section-card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}><Users size={24} style={{ color: '#6366f1' }} /><div><h3 style={{ margin: 0 }}>Owner Balances</h3><p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Monthly owner summary from approved rent collections, expenses, and payouts</p></div></div>
          {!selectedOwnerForBalance ?
          ownerSummaryLoading ? <div className="loading">Loading owners...</div> : normalizedOwnerSummaryRows.length === 0 ? <div className="no-data">No owners found</div> : <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>Owner</th><th>Expected rents</th><th>Collected rents</th><th>Amount of expenses</th><th>Agency commission</th><th>Amount to be paid</th><th>Period</th></tr></thead><tbody>{normalizedOwnerSummaryRows.map((row) => <tr key={row.key} onClick={() => setSelectedOwnerForBalance(row.ownerName)} style={{ cursor: 'pointer' }} role="button" tabIndex={0} onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();setSelectedOwnerForBalance(row.ownerName);}}}><td><span className="sa-cell-title">{row.ownerName}</span></td><td>{row.expectedRents.toFixed(2)} XOF</td><td>{row.collectedRents.toFixed(2)} XOF</td><td>{row.expensesAmount.toFixed(2)} XOF</td><td>{row.agencyCommission.toFixed(2)} XOF</td><td style={{ color: row.amountToBePaid >= 0 ? '#059669' : '#dc2626', fontWeight: '600' }}>{row.amountToBePaid.toFixed(2)} XOF</td><td>{row.period}</td></tr>)}</tbody></table></div> :
          <>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}><button type="button" className="sa-outline-button" onClick={() => setSelectedOwnerForBalance(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ArrowLeft size={16} /> Back to owners</button><h4 style={{ margin: 0 }}>{selectedOwnerForBalance} - Recent Transactions</h4></div>
            {(() => {
              const owner = selectedOwnerForBalance;
              const ownerCollections = collections.filter((c) => (c.Landlord || c.landlord) === owner).map((c) => ({ ...c, _type: 'collection', _date: c.Date || c.date || c.CreatedAt || c.createdAt }));
              const ownerPayments = landlordPayments.filter((p) => (p.Landlord || p.landlord) === owner).map((p) => ({ ...p, _type: 'payout', _date: p.Date || p.date || p.CreatedAt || p.createdAt }));
              const merged = [...ownerCollections, ...ownerPayments].sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0)).slice(0, 50);
              if (merged.length === 0) return <div className="no-data">No transactions for this owner.</div>;
              return <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>Date</th><th>Type</th><th>Building</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead><tbody>{merged.map((item, idx) => {const isCollection = item._type === 'collection';const amount = isCollection ? item.Amount || item.amount || 0 : item.NetAmount || item.netAmount || 0;return <tr key={idx}><td>{item._date ? new Date(item._date).toLocaleDateString() : 'N/A'}</td><td><span className={`sa-status-pill ${isCollection ? 'success' : 'info'}`}>{isCollection ? 'Collection' : 'Payout'}</span></td><td>{item.Building || item.building || '-'}</td><td>{isCollection ? item.ChargeType || item.chargeType || 'Rent' : 'Payout'}</td><td style={{ color: isCollection ? '#059669' : '#dc2626', fontWeight: '600' }}>{isCollection ? '+' : '-'}{amount.toFixed(2)} XOF</td><td>{item.Status || item.status || (isCollection ? 'Collected' : '-')}</td></tr>;})}</tbody></table></div>;
            })()}
          </>}
        </div>
        <div className="sa-section-card" style={{ marginTop: '24px' }}>
          <div className="sa-section-header"><div><h3>{t('accounting.recentTransactions')}</h3><p>Transfers made to owners</p></div></div>
          {(() => {
            const transfers = landlordPayments.
            filter((p) => (p.Status || p.status || '').toString().trim().toLowerCase() === 'paid').
            map((p) => ({ ...p, _date: p.Date || p.date || p.CreatedAt || p.createdAt })).
            sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0)).
            slice(0, 20);
            if (loading) return <div className="loading">Loading transfers...</div>;
            if (transfers.length === 0) return <div className="no-data">No owner transfers yet</div>;
            return (
              <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr><th>Date</th><th>Owner</th><th>Building</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {transfers.map((p, idx) =>
                    <tr key={p.ID || p.id || idx}>
                        <td>{p._date ? new Date(p._date).toLocaleDateString() : 'N/A'}</td>
                        <td><span className="sa-cell-title">{p.Landlord || p.landlord || '—'}</span></td>
                        <td>{p.Building || p.building || '—'}</td>
                        <td style={{ color: '#dc2626', fontWeight: 700 }}>-{Number(p.NetAmount || p.netAmount || 0).toFixed(2)} XOF</td>
                        <td><span className="sa-status-pill info">{p.Status || p.status || 'Paid'}</span></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>);

          })()}
        </div>
      </div>
    </div>);

};
AccountBalancesTab.AccountModal = (props) => {
  const { loading, setLoading, addNotification, setShowCashierAccountModal, cashierAccountForm, setCashierAccountForm, loadCashierData } = props;
  return <div className="modal-overlay" onClick={() => setShowCashierAccountModal(false)}><div className="modal-content" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h3>{t('accounting.addCashierAccount')}</h3><button className="modal-close" onClick={() => setShowCashierAccountModal(false)}>x</button></div><div className="modal-body"><form onSubmit={async (e) => {e.preventDefault();try {setLoading(true);await accountingService.createCashierAccount(cashierAccountForm);addNotification(t('accounting.cashierAccountCreated'), 'success');setShowCashierAccountModal(false);setCashierAccountForm({ name: '', type: 'cash_register', balance: 0, currency: 'XOF', description: '' });await loadCashierData();} catch (error) {console.error('Error creating account:', error);addNotification(error.message || 'Failed to create account', 'error');} finally {setLoading(false);}}}>
    <div className="form-group"><label>Account Name *</label><input type="text" value={cashierAccountForm.name} onChange={(e) => setCashierAccountForm({ ...cashierAccountForm, name: e.target.value })} required placeholder="e.g., MTN Mobile Money" /></div>
    <div className="form-group"><label>Account Type *</label><select value={cashierAccountForm.type} onChange={(e) => setCashierAccountForm({ ...cashierAccountForm, type: e.target.value })} required><option value="mobile_money">Mobile Money</option><option value="cash_register">Cash Register</option><option value="bank">Bank Account</option><option value="other">Other</option></select></div>
    <div className="form-group"><label>Initial Balance</label><input type="number" step="0.01" value={cashierAccountForm.balance} onChange={(e) => setCashierAccountForm({ ...cashierAccountForm, balance: parseFloat(e.target.value) || 0 })} placeholder="0.00" /></div>
    <div className="form-group"><label>Currency</label><select value={cashierAccountForm.currency} onChange={(e) => setCashierAccountForm({ ...cashierAccountForm, currency: e.target.value })}><option value="XOF">XOF</option></select></div>
    <div className="form-group"><label>Description</label><textarea value={cashierAccountForm.description} onChange={(e) => setCashierAccountForm({ ...cashierAccountForm, description: e.target.value })} placeholder="Optional description" rows="3" /></div>
    <div className="modal-footer"><button type="button" className="action-button secondary" onClick={() => setShowCashierAccountModal(false)}>{t('accounting.cancel')}</button><button type="submit" className="action-button primary" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button></div>
  </form></div></div></div>;
};
AccountBalancesTab.TransactionModal = (props) => {
  const { loading, setLoading, addNotification, setShowCashierTransactionModal, cashierTransactionForm, setCashierTransactionForm, cashierAccounts, loadCashierData } = props;
  return <div className="modal-overlay" onClick={() => setShowCashierTransactionModal(false)}><div className="modal-content" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h3>{t('accounting.addTransaction')}</h3><button className="modal-close" onClick={() => setShowCashierTransactionModal(false)}>x</button></div><div className="modal-body"><form onSubmit={async (e) => {e.preventDefault();try {setLoading(true);const transactionData = { accountId: parseInt(cashierTransactionForm.accountId), type: cashierTransactionForm.type, amount: parseFloat(cashierTransactionForm.amount), reference: cashierTransactionForm.reference, description: cashierTransactionForm.description };if (cashierTransactionForm.type === 'transfer' && cashierTransactionForm.toAccountId) {transactionData.toAccountId = parseInt(cashierTransactionForm.toAccountId);}await accountingService.createCashierTransaction(transactionData);addNotification('Transaction created successfully!', 'success');setShowCashierTransactionModal(false);setCashierTransactionForm({ accountId: '', type: 'deposit', amount: '', reference: '', description: '', toAccountId: '' });await loadCashierData();} catch (error) {console.error('Error creating transaction:', error);addNotification(error.message || 'Failed to create transaction', 'error');} finally {setLoading(false);}}}>
    <div className="form-group"><label>Account *</label><select value={cashierTransactionForm.accountId} onChange={(e) => setCashierTransactionForm({ ...cashierTransactionForm, accountId: e.target.value })} required><option value="">Select Account</option>{cashierAccounts.filter((acc) => acc.IsActive !== false && acc.isActive !== false).map((account) => <option key={account.ID || account.id} value={account.ID || account.id}>{account.Name || account.name} - {(account.Balance || account.balance || 0).toFixed(2)} XOF</option>)}</select></div>
    <div className="form-group"><label>Transaction Type *</label><select value={cashierTransactionForm.type} onChange={(e) => setCashierTransactionForm({ ...cashierTransactionForm, type: e.target.value })} required><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option><option value="transfer">Transfer</option></select></div>
    {cashierTransactionForm.type === 'transfer' && <div className="form-group"><label>To Account *</label><select value={cashierTransactionForm.toAccountId} onChange={(e) => setCashierTransactionForm({ ...cashierTransactionForm, toAccountId: e.target.value })} required={cashierTransactionForm.type === 'transfer'}><option value="">Select Destination Account</option>{cashierAccounts.filter((acc) => acc.IsActive !== false && acc.isActive !== false && (acc.ID || acc.id) !== parseInt(cashierTransactionForm.accountId)).map((account) => <option key={account.ID || account.id} value={account.ID || account.id}>{account.Name || account.name} - {(account.Balance || account.balance || 0).toFixed(2)} XOF</option>)}</select></div>}
    <div className="form-group"><label>Amount *</label><input type="number" step="0.01" value={cashierTransactionForm.amount} onChange={(e) => setCashierTransactionForm({ ...cashierTransactionForm, amount: e.target.value })} required placeholder="0.00" /></div>
    <div className="form-group"><label>Reference</label><input type="text" value={cashierTransactionForm.reference} onChange={(e) => setCashierTransactionForm({ ...cashierTransactionForm, reference: e.target.value })} placeholder="Optional reference number" /></div>
    <div className="form-group"><label>Description</label><textarea value={cashierTransactionForm.description} onChange={(e) => setCashierTransactionForm({ ...cashierTransactionForm, description: e.target.value })} placeholder="Transaction description" rows="3" /></div>
    <div className="modal-footer"><button type="button" className="action-button secondary" onClick={() => setShowCashierTransactionModal(false)}>{t('accounting.cancel')}</button><button type="submit" className="action-button primary" disabled={loading}>{loading ? 'Processing...' : 'Create Transaction'}</button></div>
  </form></div></div></div>;
};

export default AccountBalancesTab;
