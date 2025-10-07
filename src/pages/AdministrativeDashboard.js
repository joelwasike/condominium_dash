import React, { useState } from 'react';
import { FileText, Users, CheckCircle, Clock, TrendingUp, Settings, AlertCircle } from 'lucide-react';
import './AdministrativeDashboard.css';

const AdministrativeDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'automation', label: 'Automation & Reports', icon: Settings }
  ];

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
      case 'documents':
        return renderDocuments();
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
    </div>
  );
};

export default AdministrativeDashboard;
