import React from 'react';
import {
  dedupeBySignature,
  formatOwnerName,
  formatPropertyBuilding,
  formatTenantName,
  getTransactionSignature } from
'../../utils/accountingDisplay';

const TransactionHistoryTab = (props) => {
  const { loading, tenantPayments, collections, expenses, landlordPayments, cashierTransactions, cashierAccounts, deposits, historyStartDateFilter, setHistoryStartDateFilter, historyEndDateFilter, setHistoryEndDateFilter, historyTypeFilter, setHistoryTypeFilter, historyNameFilter, setHistoryNameFilter } = props;

  const allTransactions = [];
  tenantPayments.forEach((p, index) => {
    allTransactions.push({
      type: 'Tenant Payment',
      date: p.Date || p.date,
      tenant: formatTenantName(p, 'N/A'),
      property: formatPropertyBuilding(p, 'N/A'),
      amount: p.Amount || p.amount || 0,
      status: p.Status || p.status,
      method: p.Method || p.method || p.PaymentMethod || p.paymentMethod,
      id: p.ID || p.id || getTransactionSignature(p) || `tenant-${index}`,
      signature: getTransactionSignature(p),
      priority: 3
    });
  });

  collections.forEach((c, index) => {
    const chargeType = c.ChargeType || c.chargeType || 'Collection';
    allTransactions.push({
      type: chargeType,
      date: c.Date || c.date,
      tenant: formatTenantName(c, '-'),
      property: formatPropertyBuilding(c, 'N/A'),
      amount: c.Amount || c.amount || 0,
      status: c.Status || c.status,
      method: c.PaymentMethod || c.Method || 'Cash',
      notes: c.Reference || c.reference || '',
      id: c.ID || c.id || getTransactionSignature(c) || `collection-${index}`,
      signature: getTransactionSignature(c),
      priority: 1
    });
  });

  expenses.forEach((e, index) => {
    allTransactions.push({
      type: 'Expense',
      date: e.Date || e.date,
      tenant: '-',
      property: formatPropertyBuilding(e, 'N/A'),
      amount: -(e.Amount || e.amount || 0),
      status: 'Completed',
      method: e.Category || e.category,
      notes: e.Notes || e.notes,
      id: e.ID || e.id || `expense-${index}`,
      signature: `expense-${e.ID || e.id || index}`,
      priority: 2
    });
  });

  landlordPayments.forEach((p, index) => {
    allTransactions.push({
      type: 'Owner Payment',
      date: p.Date || p.date,
      tenant: formatOwnerName(p, 'N/A'),
      property: formatPropertyBuilding(p, 'N/A'),
      amount: -(p.NetAmount || p.netAmount || 0),
      status: p.Status || p.status,
      method: 'Transfer',
      notes: p.Reference || p.reference || '',
      id: p.ID || p.id || `owner-payment-${index}`,
      signature: `owner-payment-${p.ID || p.id || index}`,
      priority: 2
    });
  });

  cashierTransactions.forEach((t, index) => {
    const account = cashierAccounts.find((acc) => (acc.ID || acc.id) === (t.AccountID || t.accountId));
    const amount = (t.Type || t.type) === 'deposit' ? t.Amount || t.amount || 0 : -(t.Amount || t.amount || 0);
    allTransactions.push({
      type: 'Cashier Transaction',
      date: t.CreatedAt || t.createdAt,
      tenant: account ? account.Name || account.name : 'Unknown',
      property: '-',
      amount,
      status: 'Completed',
      method: t.Type || t.type,
      notes: t.Description || t.description,
      id: t.ID || t.id || `cashier-${index}`,
      signature: `cashier-${t.ID || t.id || index}`,
      priority: 2
    });
  });

  deposits.filter((d) => (d.Type || d.type) === 'refund').forEach((r, index) => {
    allTransactions.push({
      type: 'Deposit Refund',
      date: r.RefundedAt || r.refundedAt || r.CreatedAt,
      tenant: formatTenantName(r, 'N/A'),
      property: formatPropertyBuilding(r, 'N/A'),
      amount: -(r.Amount || r.amount || 0),
      status: 'Refunded',
      method: r.RefundMethod || r.refundMethod,
      id: r.ID || r.id || `refund-${index}`,
      signature: `refund-${r.ID || r.id || index}`,
      priority: 2
    });
  });

  const uniqueTransactions = dedupeBySignature(allTransactions, (row) => row.priority);
  uniqueTransactions.sort((a, b) => {
    const aDate = new Date(a.date || 0).getTime();
    const bDate = new Date(b.date || 0).getTime();
    if (bDate !== aDate) return bDate - aDate;
    return (b.priority || 0) - (a.priority || 0);
  });

  const filteredHistory = uniqueTransactions.filter((t) => {
    if (historyTypeFilter !== 'all' && t.type !== historyTypeFilter) return false;
    if (historyNameFilter) {
      const search = historyNameFilter.trim().toLowerCase();
      const haystack = [t.tenant, t.property, t.method, t.notes, t.type].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    const d = t.date;if (!d) return true;const date = new Date(d);
    if (historyStartDateFilter && date < new Date(historyStartDateFilter)) return false;
    if (historyEndDateFilter && date > new Date(historyEndDateFilter + 'T23:59:59')) return false;
    return true;
  });

  return (
    <div style={{ padding: '20px' }}>
      <div className="sa-section-card">
        <div className="sa-section-header"><div><h2>Transaction History</h2><p>Complete history of all financial transactions</p></div></div>
        <div className="sa-filters-section" style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="sa-filter-select" type="text" placeholder="Search by name..." value={historyNameFilter} onChange={(e) => setHistoryNameFilter(e.target.value)} />
          <select className="sa-filter-select" value={historyTypeFilter} onChange={(e) => setHistoryTypeFilter(e.target.value)}><option value="all">All Types</option><option value="Tenant Payment">Tenant Payment</option><option value="Expense">Expense</option><option value="Owner Payment">Owner Payment</option><option value="Deposit Refund">Deposit Refund</option><option value="Cashier Transaction">Cashier Transaction</option></select>
          <input type="date" className="sa-filter-select" value={historyStartDateFilter} onChange={(e) => setHistoryStartDateFilter(e.target.value)} placeholder="Start Date" />
          <input type="date" className="sa-filter-select" value={historyEndDateFilter} onChange={(e) => setHistoryEndDateFilter(e.target.value)} placeholder="End Date" />
        </div>
        {loading ? <div className="loading">Loading transactions...</div> : filteredHistory.length === 0 ? <div className="no-data">No transactions found</div> :
        <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>Date</th><th>Type</th><th>Tenant/Owner/Account</th><th>Property</th><th>Amount</th><th>Method/Notes</th></tr></thead><tbody>
            {filteredHistory.map((transaction, index) => {
                const typeClass = transaction.type.toLowerCase().replace(/\s+/g, '-');
                return (
                  <tr key={transaction.id || `transaction-${index}`}>
                  <td>{transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}</td>
                  <td><span className={`sa-status-pill ${typeClass}`}>{transaction.type}</span></td>
                  <td>{transaction.tenant || '-'}</td>
                  <td>{transaction.property || '-'}</td>
                  <td style={{ color: transaction.amount >= 0 ? '#059669' : '#dc2626', fontWeight: '600' }}>{transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)} XOF</td>
                  <td>{transaction.method || transaction.notes || '-'}</td>
                </tr>);

              })}
          </tbody></table></div>
        }
      </div>
    </div>);

};

export default TransactionHistoryTab;
