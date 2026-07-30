import React from 'react';

const ExpensesTab = ({ expenses, pendingExpensesForApproval, properties, expensePropertyFilter, setExpensePropertyFilter, expenseStartDate, setExpenseStartDate, expenseEndDate, setExpenseEndDate, loading, handleApproveExpense, handleRejectExpense }) =>
<div className="sa-clients-page">
    <div className="sa-clients-header">
      <div><h2>Expenses Management</h2><p>Review expenses per property. Building expenses require your approval before they are recorded.</p></div>
      <div className="sa-clients-header-right">
        <div className="sa-filters-section">
          <select className="sa-filter-select" value={expensePropertyFilter} onChange={(e) => setExpensePropertyFilter(e.target.value)}>
            <option value="">All Properties</option>
            {properties.map((prop) => <option key={prop.id || prop.ID} value={prop.Address || prop.address}>{prop.Address || prop.address}</option>)}
          </select>
          <input type="date" className="sa-filter-select" value={expenseStartDate} onChange={(e) => setExpenseStartDate(e.target.value)} />
          <input type="date" className="sa-filter-select" value={expenseEndDate} onChange={(e) => setExpenseEndDate(e.target.value)} />
        </div>
      </div>
    </div>
    {pendingExpensesForApproval.length > 0 &&
  <div className="sa-section-card" style={{ marginBottom: '24px', border: '2px solid #f59e0b', background: '#fffbeb' }}>
        <div className="sa-section-header"><div><h3>Expenses to Approve</h3><p>{pendingExpensesForApproval.length} building expense(s) awaiting your approval</p></div></div>
        <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>No</th><th>Building</th><th>Category</th><th>Description</th><th>Amount</th><th>Date</th><th>Actions</th></tr></thead><tbody>
          {pendingExpensesForApproval.map((expense, index) => <tr key={expense.id || expense.ID || `pending-expense-${index}`}><td>{index + 1}</td><td>{expense.building || expense.Building || 'N/A'}</td><td>{expense.category || expense.Category || 'N/A'}</td><td className="sa-cell-main"><span className="sa-cell-title">{expense.description || expense.Description || expense.notes || expense.Notes || 'N/A'}</span></td><td>{(expense.amount || expense.Amount || 0).toLocaleString()} XOF</td><td>{expense.date || expense.Date ? new Date(expense.date || expense.Date).toLocaleDateString() : 'N/A'}</td><td><div style={{ display: 'flex', gap: '8px' }}><button className="table-action-button edit" onClick={() => handleApproveExpense(expense.id || expense.ID)} disabled={loading} style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}>Approve</button><button className="table-action-button delete" onClick={() => handleRejectExpense(expense.id || expense.ID)} disabled={loading}>Reject</button></div></td></tr>)}
        </tbody></table></div>
      </div>
  }
    {expenses.length > 0 && expenses[0].property ?
  expenses.map((propertyGroup, groupIndex) =>
  <div key={propertyGroup.property || `property-${groupIndex}`} className="sa-section-card" style={{ marginBottom: '24px' }}>
          <div className="sa-section-header"><div><h3>{propertyGroup.property || 'Unknown Property'}</h3><p>Total: {propertyGroup.total?.toLocaleString() || 0} XOF</p></div></div>
          <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>No</th><th>Date</th><th>Category</th><th>Amount</th><th>Notes</th></tr></thead><tbody>
            {propertyGroup.expenses && propertyGroup.expenses.length > 0 ? propertyGroup.expenses.map((expense, index) => <tr key={expense.id || expense.ID || `expense-${index}`}><td>{index + 1}</td><td>{new Date(expense.date || expense.Date).toLocaleDateString()}</td><td>{expense.category || expense.Category || 'N/A'}</td><td>{(expense.amount || expense.Amount || 0).toLocaleString()} XOF</td><td className="sa-cell-main"><span className="sa-cell-sub">{expense.notes || expense.Notes || 'N/A'}</span></td></tr>) : <tr><td colSpan={5} className="sa-table-empty">No expenses for this property</td></tr>}
          </tbody></table></div>
        </div>
  ) :

  <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>No</th><th>Date</th><th>Property</th><th>Category</th><th>Amount</th><th>Notes</th></tr></thead><tbody>
        {expenses.length === 0 ? <tr><td colSpan={6} className="sa-table-empty">No expenses found</td></tr> : expenses.map((expense, index) => <tr key={expense.id || expense.ID || `expense-${index}`}><td>{index + 1}</td><td>{new Date(expense.date || expense.Date).toLocaleDateString()}</td><td className="sa-cell-main"><span className="sa-cell-title">{expense.building || expense.Building || expense.property || expense.Property || 'Unknown'}</span></td><td>{expense.category || expense.Category || 'N/A'}</td><td>{(expense.amount || expense.Amount || 0).toLocaleString()} XOF</td><td className="sa-cell-main"><span className="sa-cell-sub">{expense.notes || expense.Notes || 'N/A'}</span></td></tr>)}
      </tbody></table></div>
  }
  </div>;


export default ExpensesTab;
