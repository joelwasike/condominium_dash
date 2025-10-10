import React, { useState } from 'react';
import { Building2, Users, Trash2, Eye, Settings, BarChart3, Database, Shield, DollarSign, Home, Wrench, FileText } from 'lucide-react';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [companies, setCompanies] = useState([
    { id: 1, name: 'Premium Properties Ltd', users: 45, properties: 120, status: 'Active', revenue: '€45,000' },
    { id: 2, name: 'Elite Real Estate Group', users: 32, properties: 85, status: 'Active', revenue: '€32,000' },
    { id: 3, name: 'Metro Property Management', users: 28, properties: 67, status: 'Active', revenue: '€28,500' },
    { id: 4, name: 'Urban Living Solutions', users: 19, properties: 43, status: 'Active', revenue: '€19,200' },
  ]);

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
        <button className="action-button primary">
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
          <button className="action-button">Manage Database</button>
        </div>
        
        <div className="setting-card modern-card">
          <h3><Shield size={20} /> Security Settings</h3>
          <p>Configure authentication and permissions</p>
          <button className="action-button">Security Settings</button>
        </div>
        
        <div className="setting-card modern-card">
          <h3><Settings size={20} /> System Configuration</h3>
          <p>General system preferences</p>
          <button className="action-button">Configure System</button>
        </div>
        
        <div className="setting-card modern-card">
          <h3><BarChart3 size={20} /> Analytics & Reports</h3>
          <p>System-wide analytics configuration</p>
          <button className="action-button">View Analytics</button>
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
    </div>
  );
};

export default SuperAdminDashboard;
