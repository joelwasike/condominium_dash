import React, { useState } from 'react';
import { Home, Users, Calendar, TrendingUp, Plus, Eye, CheckCircle, FileText, Upload, UserPlus } from 'lucide-react';
import Modal from '../components/Modal';
import DocumentUpload from '../components/DocumentUpload';
import ContractUpload from '../components/ContractUpload';
import './SalesDashboard.css';

const SalesDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showKycModal, setShowKycModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showTenantCreationModal, setShowTenantCreationModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleKycUpload = (file, userRole) => {
    console.log('KYC Document uploaded:', file.name, 'for role:', userRole);
    addNotification('KYC documents uploaded successfully!', 'success');
  };

  const handleContractUpload = (contractDetails) => {
    console.log('Contract uploaded:', contractDetails);
    addNotification('Contract uploaded successfully!', 'success');
  };

  const handleCreateTenant = (tenantData) => {
    console.log('New tenant created:', tenantData);
    addNotification('Tenant account created successfully!', 'success');
    setShowTenantCreationModal(false);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'listings', label: 'Listings', icon: Home },
    { id: 'visits', label: 'Visits', icon: Calendar },
    { id: 'requests', label: 'Requests', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'tenants', label: 'Tenant Management', icon: UserPlus }
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card modern-card">
          <h3>Total Properties Listed</h3>
          <p>Active listings</p>
          <span className="stat-value">24</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Visits Scheduled</h3>
          <p>Today / This week</p>
          <span className="stat-value">5 / 12</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Visit → Lease Conversion</h3>
          <p>Conversion rate</p>
          <span className="stat-value">35%</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Pending Requests</h3>
          <p>Awaiting approval</p>
          <span className="stat-value">8</span>
        </div>
      </div>
      
      <div className="filters-section">
        <h4>Property Filters</h4>
        <div className="filter-row">
          <select className="filter-select">
            <option value="">All Cities</option>
            <option value="paris">Paris</option>
            <option value="lyon">Lyon</option>
            <option value="marseille">Marseille</option>
          </select>
          <select className="filter-select">
            <option value="">All Districts</option>
            <option value="1st">1st Arrondissement</option>
            <option value="2nd">2nd Arrondissement</option>
            <option value="3rd">3rd Arrondissement</option>
          </select>
          <select className="filter-select">
            <option value="">All Property Types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="studio">Studio</option>
          </select>
          <select className="filter-select">
            <option value="">All Price Ranges</option>
            <option value="0-1000">€0 - €1,000</option>
            <option value="1000-2000">€1,000 - €2,000</option>
            <option value="2000+">€2,000+</option>
          </select>
          <select className="filter-select">
            <option value="">All Availability</option>
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderListings = () => (
    <div className="listings-section">
      <div className="section-header">
        <h3>Property Listings</h3>
        <p>Manage your property listings and availability</p>
      </div>
      
      <div className="listing-actions">
        <button className="action-button primary">
          <Plus size={20} />
          Add New Listing
        </button>
      </div>

      <div className="listing-filters">
        <select className="filter-select">
          <option value="">All Properties</option>
          <option value="apartment">Apartments</option>
          <option value="house">Houses</option>
          <option value="studio">Studios</option>
        </select>
        <select className="filter-select">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Under Maintenance</option>
        </select>
      </div>

      <div className="listing-list">
        <div className="listing-item">
          <div className="listing-image">
            <div className="placeholder-image">123 Main St</div>
          </div>
          <div className="listing-info">
            <h4>123 Main Street</h4>
            <p>3 Bedroom, 2 Bathroom Apartment</p>
            <div className="listing-details">
              <span className="price">$1,200/month</span>
              <span className="status available">Available</span>
            </div>
            <div className="listing-actions">
              <button className="btn-secondary">
                <Eye size={16} />
                View Details
              </button>
              <button className="btn-primary">
                Edit Listing
              </button>
            </div>
          </div>
        </div>
        <div className="listing-item">
          <div className="listing-image">
            <div className="placeholder-image">456 Oak Ave</div>
          </div>
          <div className="listing-info">
            <h4>456 Oak Avenue</h4>
            <p>2 Bedroom, 1 Bathroom House</p>
            <div className="listing-details">
              <span className="price">$900/month</span>
              <span className="status occupied">Occupied</span>
            </div>
            <div className="listing-actions">
              <button className="btn-secondary">
                <Eye size={16} />
                View Details
              </button>
              <button className="btn-primary">
                Edit Listing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVisits = () => (
    <div className="visits-section">
      <div className="section-header">
        <h3>Visit Management</h3>
        <p>Schedule and manage property visits</p>
      </div>
      
      <div className="visit-actions">
        <button className="action-button primary">
          <Plus size={20} />
          Schedule New Visit
        </button>
      </div>

      <div className="visit-calendar">
        <h4>Today's Visits</h4>
        <div className="visit-item">
          <div className="visit-time">10:00 AM</div>
          <div className="visit-info">
            <span className="property">123 Main Street</span>
            <span className="client">John Doe</span>
          </div>
          <div className="visit-status scheduled">Scheduled</div>
        </div>
        <div className="visit-item">
          <div className="visit-time">2:00 PM</div>
          <div className="visit-info">
            <span className="property">456 Oak Avenue</span>
            <span className="client">Jane Smith</span>
          </div>
          <div className="visit-status completed">Completed</div>
        </div>
      </div>

      <div className="visit-stats">
        <div className="stat-item">
          <span className="stat-label">This Week</span>
          <span className="stat-value">12 visits</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Conversion Rate</span>
          <span className="stat-value">35%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending Follow-ups</span>
          <span className="stat-value">5</span>
        </div>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="requests-section">
      <div className="section-header">
        <h3>Visit Requests</h3>
        <p>Manage incoming visit requests from potential tenants</p>
      </div>
      
      <div className="request-filters">
        <select className="filter-select">
          <option value="">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="filter-select">
          <option value="">All Properties</option>
          <option value="123-main">123 Main Street</option>
          <option value="456-oak">456 Oak Avenue</option>
        </select>
      </div>

      <div className="request-list">
        <div className="request-item">
          <div className="request-header">
            <div className="request-info">
              <h4>Mike Johnson</h4>
              <p>123 Main Street - 3 Bedroom Apartment</p>
                </div>
            <div className="request-date">Nov 20, 2024</div>
                </div>
          <div className="request-details">
            <p>Interested in viewing the property this weekend. Prefers afternoon visits.</p>
            <div className="request-actions">
              <button className="btn-success">
                <CheckCircle size={16} />
                Approve
              </button>
              <button className="btn-secondary">
                View Details
              </button>
                </div>
                </div>
              </div>
        <div className="request-item">
          <div className="request-header">
            <div className="request-info">
              <h4>Sarah Wilson</h4>
              <p>456 Oak Avenue - 2 Bedroom House</p>
            </div>
            <div className="request-date">Nov 19, 2024</div>
          </div>
          <div className="request-details">
            <p>Looking for a pet-friendly property. Has 2 cats.</p>
            <div className="request-actions">
              <button className="btn-success">
                <CheckCircle size={16} />
                Approve
                  </button>
              <button className="btn-secondary">
                View Details
                  </button>
            </div>
          </div>
              </div>
              </div>
            </div>
          );

  const renderDocuments = () => (
    <div className="documents-section">
      <h2>Document Management</h2>
      <p>Upload and manage tenant KYC documents and contracts</p>
      
      <div className="document-actions">
        <button className="action-button primary" onClick={() => setShowKycModal(true)}>
          <Upload size={20} />
          Upload Tenant KYC Documents
        </button>
        <button className="action-button primary" onClick={() => setShowContractModal(true)}>
          <FileText size={20} />
          Upload Essential Contract
        </button>
      </div>

      <div className="document-list modern-card">
        <h3>Uploaded Documents</h3>
        <div className="document-filters">
          <select className="filter-select">
            <option value="">All Documents</option>
            <option value="kyc">KYC Documents</option>
            <option value="contracts">Contracts</option>
          </select>
          <select className="filter-select">
            <option value="">All Tenants</option>
            <option value="john">John Doe</option>
            <option value="jane">Jane Smith</option>
          </select>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Tenant</th>
              <th>Type</th>
              <th>Upload Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Passport Copy</td>
              <td>John Doe</td>
              <td>KYC</td>
              <td>2024-11-20</td>
              <td><span className="status approved">Approved</span></td>
              <td>
                <button className="action-button small">View</button>
              </td>
            </tr>
            <tr>
              <td>Lease Agreement</td>
              <td>Jane Smith</td>
              <td>Contract</td>
              <td>2024-11-19</td>
              <td><span className="status pending">Pending</span></td>
              <td>
                <button className="action-button small">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTenantManagement = () => (
    <div className="tenant-management-section">
      <h2>Tenant Account Management</h2>
      <p>Create and manage tenant accounts for new tenants</p>
      
      <div className="tenant-actions">
        <button className="action-button primary" onClick={() => setShowTenantCreationModal(true)}>
          <UserPlus size={20} />
          Create New Tenant Account
        </button>
      </div>

      <div className="tenants-list modern-card">
        <h3>Existing Tenants</h3>
        <div className="tenant-filters">
          <select className="filter-select">
            <option value="">All Tenants</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <input type="text" placeholder="Search tenants..." className="search-input" />
        </div>
        
        <div className="tenants-grid">
          <div className="tenant-card">
            <div className="tenant-info">
              <h4>John Doe</h4>
              <p>john.doe@email.com</p>
              <p>Property: 123 Main St</p>
              <span className="status active">Active</span>
            </div>
            <div className="tenant-actions">
              <button className="action-button small">Edit</button>
              <button className="action-button small">View Details</button>
            </div>
          </div>
          
          <div className="tenant-card">
            <div className="tenant-info">
              <h4>Jane Smith</h4>
              <p>jane.smith@email.com</p>
              <p>Property: 456 Oak Ave</p>
              <span className="status active">Active</span>
            </div>
            <div className="tenant-actions">
              <button className="action-button small">Edit</button>
              <button className="action-button small">View Details</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
        
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'listings':
        return renderListings();
      case 'visits':
        return renderVisits();
      case 'requests':
        return renderRequests();
      case 'documents':
        return renderDocuments();
      case 'tenants':
        return renderTenantManagement();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="sales-dashboard">
      <div className="dashboard-header modern-container">
        <h1>Sales Dashboard</h1>
        <p>Manage property listings, visits, and client relationships</p>
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

      {/* Document Upload Modals */}
      <Modal isOpen={showKycModal} onClose={() => setShowKycModal(false)}>
        <h2>Upload Tenant KYC Documents</h2>
        <DocumentUpload onFileUpload={(file) => handleKycUpload(file, 'tenant')} />
      </Modal>

      <Modal isOpen={showContractModal} onClose={() => setShowContractModal(false)}>
        <ContractUpload onContractUpload={handleContractUpload} />
      </Modal>

      {/* Tenant Creation Modal */}
      {showTenantCreationModal && (
        <div className="modal-overlay" onClick={() => setShowTenantCreationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Tenant Account</h3>
              <button className="modal-close" onClick={() => setShowTenantCreationModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const tenantData = {
                  firstName: formData.get('firstName'),
                  lastName: formData.get('lastName'),
                  email: formData.get('email'),
                  phone: formData.get('phone'),
                  property: formData.get('property')
                };
                handleCreateTenant(tenantData);
              }}>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" name="firstName" required />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" name="lastName" required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" name="phone" required />
                </div>
                <div className="form-group">
                  <label>Property</label>
                  <select name="property" required>
                    <option value="">Select Property</option>
                    <option value="123-main">123 Main Street</option>
                    <option value="456-oak">456 Oak Avenue</option>
                    <option value="789-pine">789 Pine Lane</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowTenantCreationModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary">
                    Create Tenant Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;
