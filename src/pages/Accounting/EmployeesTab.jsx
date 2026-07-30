import React from 'react';
import { Plus } from 'lucide-react';
import { accountingService } from '../../services/accountingService';

const EmployeesTab = (props) => {
  const { loading, employees, employeePayments, setShowAddEmployeeModal, setSelectedEmployeeForPay, setShowPayEmployeeModal } = props;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = (user.role || '').toLowerCase();
  const canAddEmployee = ['admin', 'accounting', 'agency_director', 'administrative'].includes(role);
  const canPayEmployee = ['accounting', 'agency_director'].includes(role);

  return (
    <div style={{ padding: '20px' }}>
      <div className="sa-section-card">
        <div className="sa-section-header"><div><h2>Employees</h2><p>Caretakers and other property management employees.</p></div>{canAddEmployee && <button className="sa-primary-cta" onClick={() => setShowAddEmployeeModal(true)}><Plus size={18} /> Add Employee</button>}</div>
        {loading ? <div className="loading">Loading employees...</div> : employees.length === 0 ? <div className="no-data">No employees yet.</div> :
        <div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>Name</th><th>Role</th><th>Property / Building</th><th>Phone</th><th>Email</th>{canPayEmployee && <th className="table-menu">Actions</th>}</tr></thead><tbody>
            {employees.map((emp, idx) => <tr key={emp.ID || emp.id || idx}><td><span className="sa-cell-title">{emp.Name || emp.name || 'N/A'}</span></td><td>{emp.Role || emp.role || 'Caretaker'}</td><td>{emp.Building || emp.building || emp.Property || emp.property || '-'}</td><td>{emp.Phone || emp.phone || '-'}</td><td>{emp.Email || emp.email || '-'}</td>{canPayEmployee && <td className="table-menu"><button className="table-action-button edit" onClick={() => {setSelectedEmployeeForPay(emp);setShowPayEmployeeModal(true);}}>Pay</button></td>}</tr>)}
          </tbody></table></div>
        }
        {employeePayments.length > 0 &&
        <div style={{ marginTop: '24px' }}><h3 style={{ marginBottom: '12px' }}>Payment History</h3><div className="sa-table-wrapper"><table className="sa-table"><thead><tr><th>Date</th><th>Employee</th><th>Amount</th><th>Method</th><th>Notes</th></tr></thead><tbody>
            {employeePayments.slice(0, 50).map((p, i) => {const emp = employees.find((e) => (e.ID || e.id) === (p.employeeId || p.employeeID));return <tr key={p.id || i}><td>{p.date ? new Date(p.date).toLocaleDateString() : 'N/A'}</td><td>{emp ? emp.Name || emp.name : p.employeeName || '-'}</td><td>{(p.amount || p.Amount || 0).toFixed(2)} XOF</td><td>{p.method || p.Method || '-'}</td><td>{p.notes || p.Notes || '-'}</td></tr>;})}
          </tbody></table></div></div>
        }
      </div>
    </div>);

};

EmployeesTab.AddModal = (props) => {
  const { loading, setLoading, addNotification, setShowAddEmployeeModal, setEmployees } = props;
  return <div className="modal-overlay" onClick={() => setShowAddEmployeeModal(false)}><div className="modal-content" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h3>Add Employee</h3><button className="modal-close" onClick={() => setShowAddEmployeeModal(false)}>x</button></div><form onSubmit={async (e) => {e.preventDefault();try {setLoading(true);const fd = new FormData(e.target);const data = { Name: fd.get('name'), name: fd.get('name'), Role: fd.get('role') || 'Caretaker', role: fd.get('role') || 'Caretaker', Building: fd.get('building'), building: fd.get('building'), Phone: fd.get('phone'), phone: fd.get('phone'), Email: fd.get('email'), email: fd.get('email') };const emp = await accountingService.addEmployee(data);setEmployees((prev) => [...prev, emp]);addNotification('Employee added successfully', 'success');setShowAddEmployeeModal(false);e.target.reset();} catch (err) {addNotification(err.message || 'Failed to add employee', 'error');} finally {setLoading(false);}}}><div className="modal-body"><div className="form-group"><label>Name *</label><input name="name" type="text" required placeholder="Employee name" /></div><div className="form-group"><label>Role</label><select name="role"><option value="Caretaker">Caretaker</option><option value="Security">Security</option><option value="Maintenance">Maintenance</option><option value="Other">Other</option></select></div><div className="form-group"><label>Property / Building</label><input name="building" type="text" placeholder="Assigned building" /></div><div className="form-group"><label>Phone</label><input name="phone" type="tel" placeholder="Phone number" /></div><div className="form-group"><label>Email</label><input name="email" type="email" placeholder="Email" /></div></div><div className="modal-footer"><button type="button" className="action-button secondary" onClick={() => setShowAddEmployeeModal(false)}>Cancel</button><button type="submit" className="action-button primary">Add Employee</button></div></form></div></div>;
};

EmployeesTab.PayModal = (props) => {
  const { loading, setLoading, addNotification, setShowPayEmployeeModal, selectedEmployeeForPay, setSelectedEmployeeForPay, setEmployeePayments } = props;
  return <div className="modal-overlay" onClick={() => {setShowPayEmployeeModal(false);setSelectedEmployeeForPay(null);}}><div className="modal-content" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h3>Pay Employee: {selectedEmployeeForPay.Name || selectedEmployeeForPay.name}</h3><button className="modal-close" onClick={() => {setShowPayEmployeeModal(false);setSelectedEmployeeForPay(null);}}>x</button></div><form onSubmit={async (e) => {e.preventDefault();try {setLoading(true);const fd = new FormData(e.target);const pay = await accountingService.payEmployee(selectedEmployeeForPay.ID || selectedEmployeeForPay.id, { amount: parseFloat(fd.get('amount')), method: fd.get('method') || 'Cash', notes: fd.get('notes') });setEmployeePayments((prev) => [...prev, { ...pay, employeeName: selectedEmployeeForPay.Name || selectedEmployeeForPay.name }]);addNotification('Payment recorded successfully', 'success');setShowPayEmployeeModal(false);setSelectedEmployeeForPay(null);e.target.reset();} catch (err) {addNotification(err.message || 'Failed to record payment', 'error');} finally {setLoading(false);}}}><div className="modal-body"><div className="form-group"><label>Amount (XOF) *</label><input name="amount" type="number" step="0.01" min="0" required placeholder="Amount" /></div><div className="form-group"><label>Method</label><select name="method"><option value="Cash">Cash</option><option value="Transfer">Transfer</option><option value="Mobile Money">Mobile Money</option></select></div><div className="form-group"><label>Notes</label><input name="notes" type="text" placeholder="Payment notes" /></div></div><div className="modal-footer"><button type="button" className="action-button secondary" onClick={() => {setShowPayEmployeeModal(false);setSelectedEmployeeForPay(null);}}>Cancel</button><button type="submit" className="action-button primary">Record Payment</button></div></form></div></div>;
};

export default EmployeesTab;
