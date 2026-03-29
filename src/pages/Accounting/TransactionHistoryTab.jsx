import React from 'react';

const TransactionHistoryTab = (props) => {
  const { loading, tenantPayments, collections, expenses, landlordPayments, cashierTransactions, cashierAccounts, deposits, historyStartDateFilter, setHistoryStartDateFilter, historyEndDateFilter, setHistoryEndDateFilter, historyTypeFilter, setHistoryTypeFilter } = props;

  const allTransactions = [];
  tenantPayments.forEach(p => { allTransactions.push({ type: 'Tenant Payment', date: p.Date || p.date, tenant: p.Tenant || p.tenant, property: p.Property || p.property, amount: p.Amount || p.amount || 0, status: p.Status || p.status, method: p.Method || p.method, id: p.ID || p.id }); });
  collections.forEach(c => { allTransactions.push({ type: c.ChargeType || c.chargeType || 'Collection', date: c.Date || c.date, tenant: '-', property: c.Building || c.building, amount: c.Amount || c.amount || 0, status: c.Status || c.status, method: 'Cash', id: c.ID || c.id }); });
  expenses.forEach(e => { allTransactions.push({ type: 'Expense', date: e.Date || e.date, tenant: '-', property: e.Building || e.building, amount: -(e.Amount || e.amount || 0), status: 'Completed', method: e.Category || e.category, notes: e.Notes || e.notes, id: e.ID || e.id }); });
  landlordPayments.forEach(p => { allTransactions.push({ type: 'Owner Payment', date: p.Date || p.date, tenant: p.Landlord || p.landlord, property: p.Building || p.building, amount: -(p.NetAmount || p.netAmount || 0), status: p.Status || p.status, method: 'Transfer', id: p.ID || p.id }); });
  cashierTransactions.forEach(t => { const account = cashierAccounts.find(acc => (acc.ID || acc.id) === (t.AccountID || t.accountId)); const amount = (t.Type || t.type) === 'deposit' ? (t.Amount || t.amount || 0) : -(t.Amount || t.amount || 0); allTransactions.push({ type: 'Cashier Transaction', date: t.CreatedAt || t.createdAt, tenant: account ? (account.Name || account.name) : 'Unknown', property: '-', amount, status: 'Completed', method: t.Type || t.type, notes: t.Description || t.description, id: t.ID || t.id }); });
  deposits.filter(d => (d.Type || d.type) === 'refund').forEach(r => { allTransactions.push({ type: 'Deposit Refund', date: r.RefundedAt || r.refundedAt || r.CreatedAt, tenant: r.Tenant || r.tenant, property: r.Property || r.property, amount: -(r.Amount || r.amount || 0), status: 'Refunded', method: r.RefundMethod || r.refundMethod, id: r.ID || r.id }); });
  allTransactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const filteredHistory = allTransactions.filter(t => {
    if (historyTypeFilter !== 'all' && t.type !== historyTypeFilter) return false;
    const d = t.date; if (!d) return true; const date = new Date(d);
    if (historyStartDateFilter && date < new Date(historyStartDateFilter)) return false;
    if (historyEndDateFilter && date > new Date(historyEndDateFilter + 'T23:59:59')) return false;
    return true;
  });

  return (
    <div style={{ padding: '20px' }}>
      <div className="sa-section-card">
        <div className="sa-section-header"><div><h2>Transaction History</h2><p>Complete history of all financial transactions</p></div></div>
        <div className="sa-filters-section" style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="sa-filter-select" value={historyTypeFilter} onChange={(e) => setHistoryTypeFilter(e.target.value)}><option value="all">All Types</option><option value="Tenant Payment">Tenant Payment</option><option value="Expense">Expense</option><option value="Owner Payment">Owner Payment</option><option value="Deposit Refund">Deposit Refund</option><option value="Cashier Transaction">Cashier Transaction</option></select>
          <input type="date" className="sa-filter-select" value={historyStartDateFilter} onChange={(e) => setHistoryStartDateFilter(e.target.value)} placeholder="Start Date" />
          <input type="date" className="sa-filter-select" value={historyEndDateFilter} onChange={(e) => setHistoryEndDateFilter(e.target.value)} placeholder="End Date" />
        </div>
        {loading ? <div className="loading">Loading transactions...</div> : filteredHistory.length === 0 ? <div className="no-data">No transactions found</div> : (
          <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>Date</th><th>Type</th><th>Tenant/Owner/Account</th><th>Property</th><th>Amount</th><th>Status</th><th>Method/Notes</th></tr></thead><tbody>
            {filteredHistory.map((transaction, index) => (<tr key={transaction.id || `transaction-${index}`}><td>{transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}</td><td><span className={`sa-status-pill ${transaction.type.toLowerCase().replace(' ', '-')}`}>{transaction.type}</span></td><td>{transaction.tenant || '-'}</td><td>{transaction.property || '-'}</td><td style={{ color: transaction.amount >= 0 ? '#059669' : '#dc2626', fontWeight: '600' }}>{transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)} XOF</td><td><span className={`sa-status-pill ${(transaction.status || '').toLowerCase()}`}>{transaction.status || 'N/A'}</span></td><td>{transaction.method || transaction.notes || '-'}</td></tr>))}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistoryTab;
