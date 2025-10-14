import React, { useState } from 'react';
import { FileText, Users, CheckCircle, Clock, TrendingUp, Settings, AlertCircle, Mail, Send, Bell, DollarSign } from 'lucide-react';
import './AdministrativeDashboard.css';

const AdministrativeDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [inboxDocs, setInboxDocs] = useState([
    { id: 1, from: 'john@example.com', tenant: 'John Doe', type: 'ID - Passport', date: 'Nov 20, 2024', status: 'New' },
    { id: 2, from: 'jane@example.com', tenant: 'Jane Smith', type: 'Income Proof', date: 'Nov 19, 2024', status: 'New' }
  ]);
  const [debts, setDebts] = useState([
    { id: 1, tenant: 'John Doe', property: '123 Main St', amount: 450, dueDate: '2024-11-10', status: 'Overdue', reminders: 1 },
    { id: 2, tenant: 'Alice Brown', property: '321 Elm St', amount: 200, dueDate: '2024-11-05', status: 'Overdue', reminders: 2 }
  ]);
  const [reminders, setReminders] = useState([
    { id: 1, subject: 'Rent Reminder - John Doe', date: '2024-11-22', channel: 'Email', status: 'Scheduled' },
    { id: 2, subject: 'Document Follow-up - Jane Smith', date: '2024-11-23', channel: 'Email', status: 'Scheduled' }
  ]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'inbox', label: 'Inbox', icon: Mail },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'utilities', label: 'CIE/SODECI Transfers', icon: Send },
    { id: 'debt', label: 'Debt Collection', icon: DollarSign },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'leases', label: 'Leases', icon: FileText },
    { id: 'automation', label: 'Automation & Reports', icon: Settings }
  ];

  const renderInbox = () => (
    <div className="documents-section">
      <div className="section-header">
        <h3>Received Documents</h3>
        <p>Incoming tenant documents (email/inbox)</p>
      </div>
      <div className="document-list">
        {inboxDocs.map(doc => (
          <div className="document-item" key={doc.id}>
            <div className="document-header">
              <div className="document-info">
                <h4>{doc.tenant}</h4>
                <p>{doc.type}</p>
                <span className="document-date">{doc.date} • {doc.from}</span>
              </div>
              <div className={`document-status ${doc.status.toLowerCase()}`}>{doc.status}</div>
            </div>
            <div className="document-actions">
              <button className="btn-secondary" onClick={() => setInboxDocs(prev => prev.filter(d => d.id !== doc.id))}>Archive</button>
              <button className="btn-success" onClick={() => setInboxDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'Forwarded' } : d))}>Forward to Verification</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <h3>Files Received</h3>
            <p>This month</p>
            <span className="stat-value">45</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Files Approved</h3>
            <p>Approval rate</p>
            <span className="stat-value">89%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Avg. Approval Time</h3>
            <p>Processing time</p>
            <span className="stat-value">2.3 days</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Follow-ups Sent</h3>
            <p>This month</p>
            <span className="stat-value">12</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="documents-section">
      <div className="section-header">
        <h3>Document Verification</h3>
        <p>Review and approve tenant documents</p>
      </div>
      
      <div className="document-filters">
        <select className="filter-select">
          <option value="">All Documents</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="filter-select">
          <option value="">All Types</option>
          <option value="id">ID Documents</option>
          <option value="income">Income Proof</option>
          <option value="reference">References</option>
        </select>
        <input 
          type="text" 
          placeholder="Search by client name..."
          className="search-input"
        />
      </div>

      <div className="document-list">
        <div className="document-item">
          <div className="document-header">
            <div className="document-info">
              <h4>John Doe</h4>
              <p>ID Document - Driver's License</p>
              <span className="document-date">Nov 20, 2024</span>
            </div>
            <div className="document-status pending">Pending</div>
          </div>
          <div className="document-actions">
            <button className="btn-success">
              <CheckCircle size={16} />
              Approve
            </button>
            <button className="btn-secondary">
              View Document
            </button>
            <button className="btn-danger">
              Reject
            </button>
            <button className="btn-secondary">
              Send for CIE/SODECI
            </button>
          </div>
        </div>
        <div className="document-item">
          <div className="document-header">
            <div className="document-info">
              <h4>Jane Smith</h4>
              <p>Income Proof - Pay Stub</p>
              <span className="document-date">Nov 19, 2024</span>
            </div>
            <div className="document-status approved">Approved</div>
          </div>
          <div className="document-actions">
            <button className="btn-secondary">
              View Document
            </button>
            <button className="btn-secondary">
              Send for CIE/SODECI
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUtilities = () => (
    <div className="documents-section">
      <div className="section-header">
        <h3>Transfer to CIE / SODECI</h3>
        <p>Send tenant and lease details to utility companies</p>
      </div>
      <div className="document-list">
        {[{ id: 1, tenant: 'John Doe', property: '123 Main St', status: 'Ready' }, { id: 2, tenant: 'Jane Smith', property: '456 Oak Ave', status: 'Ready' }].map(item => (
          <div className="document-item" key={`util-${item.id}`}>
            <div className="document-header">
              <div className="document-info">
                <h4>{item.tenant}</h4>
                <p>Property: {item.property}</p>
                <span className="document-date">Prepared</span>
              </div>
              <div className="document-status approved">{item.status}</div>
            </div>
            <div className="document-actions">
              <button className="btn-success">
                <Send size={16} />
                Transfer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDebt = () => (
    <div className="documents-section">
      <div className="section-header">
        <h3>Debt Collection</h3>
        <p>Track overdue balances and manage collections</p>
      </div>
      <div className="document-list">
        {debts.map(debt => (
          <div className="document-item" key={`debt-${debt.id}`}>
            <div className="document-header">
              <div className="document-info">
                <h4>{debt.tenant}</h4>
                <p>{debt.property}</p>
                <span className="document-date">Due: {debt.dueDate}</span>
              </div>
              <div className="document-status pending">{debt.status}</div>
            </div>
            <div className="document-actions">
              <button className="btn-secondary" onClick={() => setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, reminders: d.reminders + 1 } : d))}>Send Reminder</button>
              <button className="btn-success" onClick={() => setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, status: 'Paid' } : d))}>Mark Paid</button>
              <button className="btn-danger">Escalate</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReminders = () => (
    <div className="documents-section">
      <div className="section-header">
        <h3>Reminders</h3>
        <p>Create and manage payment and document reminders</p>
      </div>
      <div className="document-actions" style={{ marginBottom: 16 }}>
        <button className="btn-success" onClick={() => setReminders(prev => [{ id: Date.now(), subject: 'Generic Reminder', date: new Date().toLocaleDateString(), channel: 'Email', status: 'Scheduled' }, ...prev])}>Schedule Reminder</button>
      </div>
      <div className="document-list">
        {reminders.map(rem => (
          <div className="document-item" key={`rem-${rem.id}`}>
            <div className="document-header">
              <div className="document-info">
                <h4>{rem.subject}</h4>
                <p>Channel: {rem.channel}</p>
                <span className="document-date">{rem.date}</span>
              </div>
              <div className="document-status approved">{rem.status}</div>
            </div>
            <div className="document-actions">
              <button className="btn-secondary">Edit</button>
              <button className="btn-danger" onClick={() => setReminders(prev => prev.filter(r => r.id !== rem.id))}>Cancel</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLeases = () => (
    <div className="documents-section">
      <div className="section-header">
        <h3>Create Lease Agreements</h3>
        <p>Generate lease contracts for approved tenants</p>
      </div>
      <div className="document-actions" style={{ marginBottom: 16 }}>
        <button className="btn-success" onClick={() => setShowLeaseModal(true)}>New Lease</button>
      </div>
      <div className="document-list">
        <div className="document-item">
          <div className="document-header">
            <div className="document-info">
              <h4>Recent Leases</h4>
              <p>Summary of generated agreements</p>
            </div>
            <div className="document-status approved">Active</div>
          </div>
          <div className="document-actions">
            <button className="btn-secondary">Download Template</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAutomation = () => (
    <div className="automation-section">
      <div className="section-header">
        <h3>Automation & Reports</h3>
        <p>Manage automated workflows and generate reports</p>
      </div>
      
      <div className="automation-grid">
        <div className="automation-card">
          <div className="card-header">
            <h4>Lease Generation</h4>
            <div className="status-indicator active">Active</div>
          </div>
          <p>Automatically generate lease contracts based on approved applications</p>
          <div className="card-stats">
            <span>Generated: 15 this month</span>
            <span>Success rate: 98%</span>
          </div>
        </div>
        
        <div className="automation-card">
          <div className="card-header">
            <h4>Utility Company Notifications</h4>
            <div className="status-indicator active">Active</div>
          </div>
          <p>Send tenant information to utility companies automatically</p>
          <div className="card-stats">
            <span>Sent: 8 this month</span>
            <span>Success rate: 100%</span>
          </div>
        </div>
        
        <div className="automation-card">
          <div className="card-header">
            <h4>Payment Reminders</h4>
            <div className="status-indicator active">Active</div>
          </div>
          <p>Send automatic reminders for pending payments</p>
          <div className="card-stats">
            <span>Sent: 23 this month</span>
            <span>Response rate: 78%</span>
          </div>
        </div>
        
        <div className="automation-card">
          <div className="card-header">
            <h4>Financial Reports</h4>
            <div className="status-indicator pending">Pending</div>
          </div>
          <p>Generate monthly financial reports for landlords</p>
          <div className="card-stats">
            <span>Last generated: Nov 1, 2024</span>
            <span>Next: Dec 1, 2024</span>
          </div>
        </div>
      </div>

      <div className="reports-section">
        <h4>Quick Reports</h4>
        <div className="report-actions">
          <button className="action-button primary">
            <TrendingUp size={20} />
            Generate Monthly Report
          </button>
          <button className="action-button secondary">
            <FileText size={20} />
            Document Status Report
          </button>
          <button className="action-button secondary">
            <Users size={20} />
            Tenant Activity Report
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'inbox':
        return renderInbox();
      case 'documents':
        return renderDocuments();
      case 'utilities':
        return renderUtilities();
      case 'debt':
        return renderDebt();
      case 'reminders':
        return renderReminders();
      case 'leases':
        return renderLeases();
      case 'automation':
        return renderAutomation();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="administrative-dashboard">
      <div className="dashboard-header modern-container">
        <h1>Administrative Dashboard</h1>
        <p>Manage document verification, automation, and administrative tasks</p>
      </div>

      <div className="dashboard-tabs modern-container">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="dashboard-content modern-container">
        {renderContent()}
      </div>

      {showLeaseModal && (
        <div className="modal-overlay" onClick={() => setShowLeaseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Lease Agreement</h3>
              <button className="modal-close" onClick={() => setShowLeaseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                // Simulate creation
                setShowLeaseModal(false);
              }}>
                <div className="form-group">
                  <label>Tenant</label>
                  <input type="text" name="tenant" required />
                </div>
                <div className="form-group">
                  <label>Property</label>
                  <input type="text" name="property" required />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" name="start" required />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" name="end" required />
                </div>
                <div className="form-group">
                  <label>Monthly Rent</label>
                  <input type="number" name="rent" step="0.01" required />
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowLeaseModal(false)}>Cancel</button>
                  <button type="submit" className="action-button primary">Create Lease</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdministrativeDashboard;
