import React, { useState } from 'react';
import { Building2, Users, Trash2, Eye, Settings, BarChart3, Database, Shield, DollarSign, Home, Wrench, FileText, UserPlus, Plus, Save, Download, Upload, Lock, Activity } from 'lucide-react';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [companies, setCompanies] = useState([
    { id: 1, name: 'Premium Properties Ltd', users: 45, properties: 120, status: 'Active', revenue: '€45,000', deactivationReason: '' },
    { id: 2, name: 'Elite Real Estate Group', users: 32, properties: 85, status: 'Active', revenue: '€32,000', deactivationReason: '' },
    { id: 3, name: 'Metro Property Management', users: 28, properties: 67, status: 'Active', revenue: '€28,500', deactivationReason: '' },
    { id: 4, name: 'Urban Living Solutions', users: 19, properties: 43, status: 'Active', revenue: '€19,200', deactivationReason: '' },
  ]);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [deactivationReason, setDeactivationReason] = useState('');
  
  // New modal states
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showSystemConfigModal, setShowSystemConfigModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const tabs = [
    { id: 'overview', label: 'System Overview', icon: BarChart3 },
    { id: 'companies', label: 'Company Management', icon: Building2 },
    { id: 'users', label: 'All Users', icon: Users },
    { id: 'properties', label: 'All Properties', icon: Home },
    { id: 'financial', label: 'Financial Overview', icon: DollarSign },
    { id: 'works', label: 'All Works & Claims', icon: Wrench },
    { id: 'system', label: 'System Settings', icon: Settings }
  ];

  const handleDeleteCompany = (companyId, companyName) => {
    if (window.confirm(`Are you sure you want to delete "${companyName}"? This action cannot be undone and will remove all associated data.`)) {
      setCompanies(companies.filter(c => c.id !== companyId));
      alert(`Company "${companyName}" has been deleted successfully.`);
    }
  };

  const handleDeactivateCompany = (company) => {
    setSelectedCompany(company);
    setDeactivationReason('');
    setShowDeactivationModal(true);
  };

  const confirmDeactivation = () => {
    if (!deactivationReason.trim()) {
      alert('Please provide a reason for deactivation.');
      return;
    }

    setCompanies(companies.map(company => 
      company.id === selectedCompany.id 
        ? { ...company, status: 'Deactivated', deactivationReason: deactivationReason }
        : company
    ));

    setShowDeactivationModal(false);
    setSelectedCompany(null);
    setDeactivationReason('');
    alert(`Company "${selectedCompany.name}" has been deactivated successfully.`);
  };

  const handleReactivateCompany = (companyId, companyName) => {
    if (window.confirm(`Are you sure you want to reactivate "${companyName}"?`)) {
      setCompanies(companies.map(company => 
        company.id === companyId 
          ? { ...company, status: 'Active', deactivationReason: '' }
          : company
      ));
      addNotification(`Company "${companyName}" has been reactivated successfully.`, 'success');
    }
  };

  const handleAddCompany = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newCompany = {
      id: Date.now(),
      name: formData.get('companyName'),
      users: 0,
      properties: 0,
      status: 'Active',
      revenue: '€0',
      deactivationReason: ''
    };
    setCompanies(prev => [...prev, newCompany]);
    addNotification(`Company "${newCompany.name}" added successfully!`, 'success');
    setShowAddCompanyModal(false);
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newUser = {
      name: formData.get('userName'),
      email: formData.get('userEmail'),
      company: formData.get('userCompany'),
      role: formData.get('userRole'),
      status: 'Active'
    };
    addNotification(`User "${newUser.name}" added successfully!`, 'success');
    setShowAddUserModal(false);
  };

  const handleAddProperty = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProperty = {
      address: formData.get('propertyAddress'),
      company: formData.get('propertyCompany'),
      type: formData.get('propertyType'),
      rent: formData.get('propertyRent'),
      status: 'Vacant'
    };
    addNotification(`Property "${newProperty.address}" added successfully!`, 'success');
    setShowAddPropertyModal(false);
  };

  const renderOverview = () => (
    <div className="overview-section">
      <h2>System-Wide Overview</h2>
      <p>Comprehensive view of all system activities and metrics</p>
      
      <div className="stats-grid">
        <div className="stat-card modern-card">
          <Shield size={24} />
          <h3>Total Companies</h3>
          <span className="stat-value">{companies.length}</span>
          <p>Active organizations</p>
        </div>
        
        <div className="stat-card modern-card">
          <Users size={24} />
          <h3>Total Users</h3>
          <span className="stat-value">124</span>
          <p>Across all companies</p>
        </div>
        
        <div className="stat-card modern-card">
          <Home size={24} />
          <h3>Total Properties</h3>
          <span className="stat-value">315</span>
          <p>Under management</p>
        </div>
        
        <div className="stat-card modern-card">
          <DollarSign size={24} />
          <h3>Total Revenue</h3>
          <span className="stat-value">€124,700</span>
          <p>This month</p>
        </div>
        
        <div className="stat-card modern-card">
          <Wrench size={24} />
          <h3>Active Works</h3>
          <span className="stat-value">47</span>
          <p>Ongoing interventions</p>
        </div>
        
        <div className="stat-card modern-card">
          <FileText size={24} />
          <h3>Pending Claims</h3>
          <span className="stat-value">12</span>
          <p>Awaiting resolution</p>
        </div>
        
        <div className="stat-card modern-card">
          <BarChart3 size={24} />
          <h3>System Health</h3>
          <span className="stat-value">98%</span>
          <p>Uptime</p>
        </div>
        
        <div className="stat-card modern-card">
          <Database size={24} />
          <h3>Storage Used</h3>
          <span className="stat-value">245 GB</span>
          <p>Of 1 TB</p>
        </div>
      </div>
    </div>
  );

  const renderCompanies = () => (
    <div className="companies-section">
      <h2>Company Management</h2>
      <p>Manage all companies in the system with full administrative control</p>
      
      <div className="companies-actions">
        <button className="action-button primary" onClick={() => setShowAddCompanyModal(true)}>
          <Building2 size={20} />
          Add New Company
        </button>
      </div>

      <div className="companies-table">
        <table>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Users</th>
              <th>Properties</th>
              <th>Status</th>
              <th>Monthly Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => (
              <tr key={company.id}>
                <td>
                  <div className="company-info">
                    <Building2 size={18} />
                    <span>{company.name}</span>
                  </div>
                </td>
                <td>{company.users}</td>
                <td>{company.properties}</td>
                <td>
                  <span className={`status ${company.status.toLowerCase()}`}>
                    {company.status}
                  </span>
                </td>
                <td>{company.revenue}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-button small view"
                      title="View Company Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="action-button small edit"
                      title="Edit Company"
                    >
                      <Settings size={16} />
                    </button>
                    {company.status === 'Active' ? (
                      <button 
                        className="action-button small deactivate"
                        onClick={() => handleDeactivateCompany(company)}
                        title="Deactivate Company"
                      >
                        🚫
                      </button>
                    ) : (
                      <button 
                        className="action-button small reactivate"
                        onClick={() => handleReactivateCompany(company.id, company.name)}
                        title="Reactivate Company"
                      >
                        ✅
                      </button>
                    )}
                    <button 
                      className="action-button small delete"
                      onClick={() => handleDeleteCompany(company.id, company.name)}
                      title="Delete Company"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAllUsers = () => (
    <div className="users-section">
      <h2>All System Users</h2>
      <p>View and manage all users across all companies</p>
      
      <div className="users-actions">
        <button className="action-button primary" onClick={() => setShowAddUserModal(true)}>
          <UserPlus size={20} />
          Add New User
        </button>
      </div>
      
      <div className="users-filters">
        <select className="filter-select">
          <option value="">All Companies</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="filter-select">
          <option value="">All Roles</option>
          <option value="tenant">Tenant</option>
          <option value="sales">Sales / Commercial</option>
          <option value="administrative">Administrative Agent</option>
          <option value="accounting">Accounting</option>
          <option value="sales-manager">Sales Manager</option>
          <option value="technician">Technical Manager</option>
          <option value="landlord">Landlord</option>
        </select>
        <input type="text" placeholder="Search users..." className="search-input" />
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Doe</td>
              <td>john@premium.com</td>
              <td>Premium Properties Ltd</td>
              <td>Sales Manager</td>
              <td><span className="status active">Active</span></td>
              <td>2 hours ago</td>
              <td>
                <button className="action-button small view"><Eye size={16} /></button>
              </td>
            </tr>
            <tr>
              <td>Jane Smith</td>
              <td>jane@elite.com</td>
              <td>Elite Real Estate Group</td>
              <td>Accounting</td>
              <td><span className="status active">Active</span></td>
              <td>1 day ago</td>
              <td>
                <button className="action-button small view"><Eye size={16} /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAllProperties = () => (
    <div className="properties-section">
      <h2>All Properties</h2>
      <p>System-wide property overview across all companies</p>
      
      <div className="properties-actions">
        <button className="action-button primary" onClick={() => setShowAddPropertyModal(true)}>
          <Plus size={20} />
          Add New Property
        </button>
      </div>
      
      <div className="properties-stats">
        <div className="stat-card modern-card">
          <h3>Total Properties</h3>
          <span className="stat-value">315</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Occupied</h3>
          <span className="stat-value">252</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Vacant</h3>
          <span className="stat-value">63</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Avg Occupancy</h3>
          <span className="stat-value">80%</span>
        </div>
      </div>

      <div className="properties-table">
        <table>
          <thead>
            <tr>
              <th>Property Address</th>
              <th>Company</th>
              <th>Type</th>
              <th>Status</th>
              <th>Rent</th>
              <th>Tenant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>123 Main Street, Apt 4B</td>
              <td>Premium Properties Ltd</td>
              <td>Apartment</td>
              <td><span className="status occupied">Occupied</span></td>
              <td>€1,200/mo</td>
              <td>John Tenant</td>
            </tr>
            <tr>
              <td>456 Oak Avenue, Unit 2</td>
              <td>Elite Real Estate Group</td>
              <td>Condo</td>
              <td><span className="status vacant">Vacant</span></td>
              <td>€900/mo</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFinancial = () => (
    <div className="financial-section">
      <h2>Financial Overview</h2>
      <p>System-wide financial metrics and cash flow</p>
      
      <div className="financial-stats">
        <div className="stat-card modern-card">
          <h3>Total Revenue</h3>
          <span className="stat-value">€124,700</span>
          <p>This month</p>
        </div>
        <div className="stat-card modern-card">
          <h3>Commission Earned</h3>
          <span className="stat-value">€12,470</span>
          <p>10% avg commission</p>
        </div>
        <div className="stat-card modern-card">
          <h3>Pending Payments</h3>
          <span className="stat-value">€8,200</span>
          <p>Across all companies</p>
        </div>
        <div className="stat-card modern-card">
          <h3>Growth</h3>
          <span className="stat-value">+15%</span>
          <p>vs last month</p>
        </div>
      </div>
    </div>
  );

  const renderWorks = () => (
    <div className="works-section">
      <h2>All Works & Claims</h2>
      <p>System-wide maintenance and claims overview</p>
      
      <div className="works-stats">
        <div className="stat-card modern-card">
          <h3>Active Works</h3>
          <span className="stat-value">47</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Pending Claims</h3>
          <span className="stat-value">12</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Completed This Month</h3>
          <span className="stat-value">156</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Avg Resolution Time</h3>
          <span className="stat-value">3.2 days</span>
        </div>
      </div>

      <div className="works-table">
        <table>
          <thead>
            <tr>
              <th>Work Order</th>
              <th>Company</th>
              <th>Property</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#WO-1234</td>
              <td>Premium Properties Ltd</td>
              <td>123 Main St</td>
              <td>Plumbing</td>
              <td><span className="status in-progress">In Progress</span></td>
              <td><span className="priority high">High</span></td>
              <td>2 days ago</td>
            </tr>
            <tr>
              <td>#WO-1235</td>
              <td>Elite Real Estate Group</td>
              <td>456 Oak Ave</td>
              <td>Electrical</td>
              <td><span className="status pending">Pending</span></td>
              <td><span className="priority medium">Medium</span></td>
              <td>1 day ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="system-section">
      <h2>System Settings</h2>
      <p>Configure system-wide settings and preferences</p>
      
      <div className="settings-grid">
        <div className="setting-card modern-card">
          <h3><Database size={20} /> Database Management</h3>
          <p>Backup, restore, and optimize database</p>
          <button className="action-button" onClick={() => setShowDatabaseModal(true)}>Manage Database</button>
        </div>
        
        <div className="setting-card modern-card">
          <h3><Shield size={20} /> Security Settings</h3>
          <p>Configure authentication and permissions</p>
          <button className="action-button" onClick={() => setShowSecurityModal(true)}>Security Settings</button>
        </div>
        
        <div className="setting-card modern-card">
          <h3><Settings size={20} /> System Configuration</h3>
          <p>General system preferences</p>
          <button className="action-button" onClick={() => setShowSystemConfigModal(true)}>Configure System</button>
        </div>
        
        <div className="setting-card modern-card">
          <h3><BarChart3 size={20} /> Analytics & Reports</h3>
          <p>System-wide analytics configuration</p>
          <button className="action-button" onClick={() => setShowAnalyticsModal(true)}>View Analytics</button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'companies':
        return renderCompanies();
      case 'users':
        return renderAllUsers();
      case 'properties':
        return renderAllProperties();
      case 'financial':
        return renderFinancial();
      case 'works':
        return renderWorks();
      case 'system':
        return renderSystemSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="super-admin-dashboard">
      <div className="dashboard-header modern-container">
        <h1>Super Admin Dashboard</h1>
        <p>System-wide administration and company management</p>
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

      {/* Notification System */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>×</button>
          </div>
        ))}
      </div>

      {/* Deactivation Modal */}
      {showDeactivationModal && (
        <div className="modal-overlay" onClick={() => setShowDeactivationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deactivate Company</h3>
              <button className="modal-close" onClick={() => setShowDeactivationModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>You are about to deactivate <strong>{selectedCompany?.name}</strong>.</p>
              <p>Please provide a reason for deactivation:</p>
              <textarea
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                placeholder="Enter reason for deactivation..."
                rows="4"
                className="deactivation-reason"
              />
            </div>
            <div className="modal-footer">
              <button className="action-button secondary" onClick={() => setShowDeactivationModal(false)}>
                Cancel
              </button>
              <button className="action-button primary" onClick={confirmDeactivation}>
                Deactivate Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddCompanyModal && (
        <div className="modal-overlay" onClick={() => setShowAddCompanyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Company</h3>
              <button className="modal-close" onClick={() => setShowAddCompanyModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddCompany}>
                <div className="form-group">
                  <label htmlFor="companyName">Company Name</label>
                  <input type="text" name="companyName" required placeholder="Enter company name" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="companyEmail">Contact Email</label>
                    <input type="email" name="companyEmail" required placeholder="contact@company.com" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="companyPhone">Contact Phone</label>
                    <input type="tel" name="companyPhone" required placeholder="+1-555-0000" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="companyAddress">Address</label>
                    <input type="text" name="companyAddress" required placeholder="Company address" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="companyLicense">License Number</label>
                    <input type="text" name="companyLicense" placeholder="Business license" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="companyDescription">Description</label>
                  <textarea name="companyDescription" rows="3" placeholder="Brief description of the company"></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowAddCompanyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary">
                    Add Company
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="modal-close" onClick={() => setShowAddUserModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddUser}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="userName">Full Name</label>
                    <input type="text" name="userName" required placeholder="Enter full name" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="userEmail">Email Address</label>
                    <input type="email" name="userEmail" required placeholder="user@example.com" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="userCompany">Company</label>
                    <select name="userCompany" required>
                      <option value="">Select Company</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.name}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="userRole">Role</label>
                    <select name="userRole" required>
                      <option value="">Select Role</option>
                      <option value="tenant">Tenant</option>
                      <option value="sales">Sales / Commercial</option>
                      <option value="administrative">Administrative Agent</option>
                      <option value="accounting">Accounting</option>
                      <option value="sales-manager">Sales Manager</option>
                      <option value="technician">Technical Manager</option>
                      <option value="landlord">Landlord</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="userPhone">Phone Number</label>
                    <input type="tel" name="userPhone" placeholder="+1-555-0000" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="userPassword">Initial Password</label>
                    <input type="password" name="userPassword" required placeholder="Set initial password" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowAddUserModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary">
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {showAddPropertyModal && (
        <div className="modal-overlay" onClick={() => setShowAddPropertyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Property</h3>
              <button className="modal-close" onClick={() => setShowAddPropertyModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddProperty}>
                <div className="form-group">
                  <label htmlFor="propertyAddress">Property Address</label>
                  <input type="text" name="propertyAddress" required placeholder="Enter full address" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="propertyCompany">Company</label>
                    <select name="propertyCompany" required>
                      <option value="">Select Company</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.name}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="propertyType">Property Type</label>
                    <select name="propertyType" required>
                      <option value="">Select Type</option>
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Condo">Condo</option>
                      <option value="Studio">Studio</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="propertyRent">Monthly Rent (€)</label>
                    <input type="number" name="propertyRent" step="0.01" required placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="propertyBedrooms">Bedrooms</label>
                    <input type="number" name="propertyBedrooms" min="0" placeholder="0" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="propertyBathrooms">Bathrooms</label>
                    <input type="number" name="propertyBathrooms" min="0" step="0.5" placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="propertySqft">Square Feet</label>
                    <input type="number" name="propertySqft" placeholder="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="propertyDescription">Description</label>
                  <textarea name="propertyDescription" rows="3" placeholder="Property description and amenities"></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowAddPropertyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary">
                    Add Property
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Database Management Modal */}
      {showDatabaseModal && (
        <div className="modal-overlay" onClick={() => setShowDatabaseModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Database size={20} /> Database Management</h3>
              <button className="modal-close" onClick={() => setShowDatabaseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="system-info-section">
                <h4>Database Status</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className="info-value status active">Healthy</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Size:</span>
                    <span className="info-value">245 GB / 1 TB</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Backup:</span>
                    <span className="info-value">2 hours ago</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Connections:</span>
                    <span className="info-value">124 active</span>
                  </div>
                </div>
              </div>
              
              <div className="system-actions">
                <button className="action-button primary" onClick={() => addNotification('Creating database backup...', 'info')}>
                  <Download size={18} />
                  Create Backup
                </button>
                <button className="action-button secondary" onClick={() => addNotification('Restore feature opened', 'info')}>
                  <Upload size={18} />
                  Restore from Backup
                </button>
                <button className="action-button secondary" onClick={() => addNotification('Optimizing database...', 'info')}>
                  <Settings size={18} />
                  Optimize Database
                </button>
              </div>
              
              <div className="backup-history">
                <h4>Recent Backups</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Size</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>2024-11-20 14:30</td>
                      <td>242 GB</td>
                      <td>Automatic</td>
                      <td>
                        <button className="action-button small">Restore</button>
                        <button className="action-button small">Download</button>
                      </td>
                    </tr>
                    <tr>
                      <td>2024-11-19 14:30</td>
                      <td>240 GB</td>
                      <td>Automatic</td>
                      <td>
                        <button className="action-button small">Restore</button>
                        <button className="action-button small">Download</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings Modal */}
      {showSecurityModal && (
        <div className="modal-overlay" onClick={() => setShowSecurityModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Shield size={20} /> Security Settings</h3>
              <button className="modal-close" onClick={() => setShowSecurityModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="security-section">
                <h4><Lock size={18} /> Authentication Settings</h4>
                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" defaultChecked />
                    <span>Require two-factor authentication for all users</span>
                  </label>
                </div>
                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" defaultChecked />
                    <span>Enforce strong password policy</span>
                  </label>
                </div>
                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" />
                    <span>Allow social login (Google, Facebook)</span>
                  </label>
                </div>
                <div className="form-group">
                  <label>Session Timeout (minutes)</label>
                  <input type="number" defaultValue="30" min="5" max="1440" />
                </div>
              </div>
              
              <div className="security-section">
                <h4><Activity size={18} /> Access Control</h4>
                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" defaultChecked />
                    <span>Log all authentication attempts</span>
                  </label>
                </div>
                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" defaultChecked />
                    <span>Enable IP whitelist</span>
                  </label>
                </div>
                <div className="form-group">
                  <label>Max Login Attempts</label>
                  <input type="number" defaultValue="5" min="3" max="10" />
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="action-button secondary" onClick={() => setShowSecurityModal(false)}>
                  Cancel
                </button>
                <button className="action-button primary" onClick={() => {
                  addNotification('Security settings saved successfully!', 'success');
                  setShowSecurityModal(false);
                }}>
                  <Save size={18} />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Configuration Modal */}
      {showSystemConfigModal && (
        <div className="modal-overlay" onClick={() => setShowSystemConfigModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Settings size={20} /> System Configuration</h3>
              <button className="modal-close" onClick={() => setShowSystemConfigModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="config-section">
                <h4>General Settings</h4>
                <div className="form-group">
                  <label>System Name</label>
                  <input type="text" defaultValue="Real Estate Management System" />
                </div>
                <div className="form-group">
                  <label>Default Currency</label>
                  <select defaultValue="EUR">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date Format</label>
                  <select defaultValue="DD/MM/YYYY">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Default Language</label>
                  <select defaultValue="en">
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
              </div>
              
              <div className="config-section">
                <h4>Email Configuration</h4>
                <div className="form-group">
                  <label>SMTP Server</label>
                  <input type="text" placeholder="smtp.example.com" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Port</label>
                    <input type="number" defaultValue="587" />
                  </div>
                  <div className="form-group">
                    <label>Encryption</label>
                    <select defaultValue="TLS">
                      <option value="TLS">TLS</option>
                      <option value="SSL">SSL</option>
                      <option value="NONE">None</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="config-section">
                <h4>Maintenance Mode</h4>
                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" />
                    <span>Enable Maintenance Mode (System will be temporarily unavailable)</span>
                  </label>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="action-button secondary" onClick={() => setShowSystemConfigModal(false)}>
                  Cancel
                </button>
                <button className="action-button primary" onClick={() => {
                  addNotification('System configuration saved successfully!', 'success');
                  setShowSystemConfigModal(false);
                }}>
                  <Save size={18} />
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className="modal-overlay" onClick={() => setShowAnalyticsModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><BarChart3 size={20} /> System Analytics</h3>
              <button className="modal-close" onClick={() => setShowAnalyticsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="analytics-stats">
                <div className="stat-card">
                  <h4>Total Page Views</h4>
                  <span className="stat-value">1,247,890</span>
                  <p>+12.5% from last month</p>
                </div>
                <div className="stat-card">
                  <h4>Active Users Today</h4>
                  <span className="stat-value">842</span>
                  <p>Peak: 1,024 users</p>
                </div>
                <div className="stat-card">
                  <h4>Avg Session Duration</h4>
                  <span className="stat-value">12m 34s</span>
                  <p>+2.3% improvement</p>
                </div>
                <div className="stat-card">
                  <h4>System Uptime</h4>
                  <span className="stat-value">99.8%</span>
                  <p>Last 30 days</p>
                </div>
              </div>
              
              <div className="analytics-section">
                <h4>Top Activities</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Activity</th>
                      <th>Count</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Property Views</td>
                      <td>45,678</td>
                      <td><span className="trend up">↑ 15%</span></td>
                    </tr>
                    <tr>
                      <td>User Logins</td>
                      <td>12,456</td>
                      <td><span className="trend up">↑ 8%</span></td>
                    </tr>
                    <tr>
                      <td>Payment Transactions</td>
                      <td>8,234</td>
                      <td><span className="trend up">↑ 22%</span></td>
                    </tr>
                    <tr>
                      <td>Work Orders Created</td>
                      <td>1,567</td>
                      <td><span className="trend down">↓ 5%</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="modal-footer">
                <button className="action-button primary" onClick={() => addNotification('Exporting analytics report...', 'info')}>
                  <Download size={18} />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
