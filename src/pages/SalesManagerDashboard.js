import React, { useState } from 'react';
import { TrendingUp, Users, AlertTriangle, Building, Eye, Phone, Mail, UserPlus, Upload, X, FileText } from 'lucide-react';
import Modal from '../components/Modal';
import DocumentUpload from '../components/DocumentUpload';
import ContractUpload from '../components/ContractUpload';
import './SalesManagerDashboard.css';

const SalesManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showTenantCreationModal, setShowTenantCreationModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [newTenantData, setNewTenantData] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Documents

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'occupancy', label: 'Occupancy', icon: Building },
    { id: 'clients', label: 'Client Management', icon: Users },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle }
  ];

  const mockProperties = [
    { id: 1, address: '123 Main St, Apt 4B', type: 'Apartment', status: 'Occupied', tenant: 'John Doe', rent: 1500, urgency: 'normal' },
    { id: 2, address: '456 Oak Ave, Unit 2', type: 'Condo', status: 'Vacant', tenant: null, rent: 1200, urgency: 'high' },
    { id: 3, address: '789 Pine Ln', type: 'House', status: 'Occupied', tenant: 'Jane Smith', rent: 2000, urgency: 'normal' },
    { id: 4, address: '321 Elm St, Apt 1A', type: 'Apartment', status: 'Occupied', tenant: 'Bob Johnson', rent: 1800, urgency: 'urgent' },
    { id: 5, address: '654 Maple Dr', type: 'House', status: 'Vacant', tenant: null, rent: 2200, urgency: 'high' },
  ];

  const [mockClients, setMockClients] = useState([
    { id: 1, name: 'John Doe', property: '123 Main St, Apt 4B', status: 'Active', lastPayment: '2024-11-01', amount: 1500, phone: '+1-555-0123', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', property: '789 Pine Ln', status: 'Active', lastPayment: '2024-11-01', amount: 2000, phone: '+1-555-0124', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', property: '321 Elm St, Apt 1A', status: 'Overdue', lastPayment: '2024-10-15', amount: 1800, phone: '+1-555-0125', email: 'bob@example.com' },
    { id: 4, name: 'Alice Brown', property: '456 Oak Ave, Unit 2', status: 'Waiting List', lastPayment: null, amount: 1200, phone: '+1-555-0126', email: 'alice@example.com' },
  ]);

  const handleKycUpload = (file, userRole) => {
    setUploadedDocuments(prev => [...prev, { type: 'KYC', file: file, name: file.name }]);
    addNotification('KYC document uploaded successfully!', 'success');
    setShowKycModal(false);
  };

  const handleContractUpload = (files, contractDetails, userRole) => {
    setUploadedDocuments(prev => [...prev, { type: 'Contract', files: files, details: contractDetails }]);
    addNotification('Contract uploaded successfully!', 'success');
    setShowContractModal(false);
  };

  const handleCreateTenant = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const tenantData = {
      id: Date.now(),
      name: `${formData.get('firstName')} ${formData.get('lastName')}`,
      property: formData.get('property'),
      status: 'Active',
      lastPayment: new Date().toLocaleDateString(),
      amount: parseFloat(formData.get('rent')),
      phone: formData.get('phone'),
      email: formData.get('email'),
      documents: uploadedDocuments
    };
    
    setNewTenantData(tenantData);
    setCurrentStep(2); // Move to document upload step
  };

  const finalizeTenantCreation = () => {
    if (newTenantData) {
      setMockClients(prev => [...prev, { ...newTenantData, documents: uploadedDocuments }]);
      addNotification(`Tenant "${newTenantData.name}" created successfully!`, 'success');
      
      // Reset states
      setShowTenantCreationModal(false);
      setNewTenantData(null);
      setUploadedDocuments([]);
      setCurrentStep(1);
    }
  };

  const removeDocument = (index) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
    addNotification('Document removed', 'info');
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Building size={24} />
          </div>
          <div className="stat-content">
            <h3>Global Occupancy Rate</h3>
            <p>Properties occupied</p>
            <span className="stat-value">78%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Active Tenants</h3>
            <p>Currently renting</p>
            <span className="stat-value">24</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>Number of Unpaid Accounts</h3>
            <p>Overdue payments</p>
            <span className="stat-value">3</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Unpaid Rent Amount</h3>
            <p>Outstanding balance</p>
            <span className="stat-value">$5,400</span>
          </div>
        </div>
      </div>

      <div className="alert-summary">
        <h3>Priority Alerts</h3>
        <div className="alert-list">
          <div className="alert-item urgent">
            <AlertTriangle size={20} />
            <div className="alert-content">
              <h4>Bob Johnson - 321 Elm St, Apt 1A</h4>
              <p>Rent overdue by 15 days - $1,800</p>
            </div>
            <button className="btn-primary">Contact</button>
          </div>
          <div className="alert-item high">
            <Building size={20} />
            <div className="alert-content">
              <h4>456 Oak Ave, Unit 2</h4>
              <p>Property vacant for 30+ days - High priority</p>
            </div>
            <button className="btn-primary">List Property</button>
          </div>
          <div className="alert-item normal">
            <Users size={20} />
            <div className="alert-content">
              <h4>Alice Brown - Waiting List</h4>
              <p>Interested in 456 Oak Ave - Follow up needed</p>
            </div>
            <button className="btn-secondary">Contact</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOccupancy = () => (
    <div className="occupancy-section">
      <div className="section-header">
        <h3>Property Occupancy Overview</h3>
        <p>Monitor occupancy status and manage vacant properties</p>
      </div>

      <div className="filters-section">
        <div className="filter-row">
          <select className="filter-select">
            <option value="">All Occupancy Status</option>
            <option value="occupied">Occupied</option>
            <option value="vacant">Vacant</option>
            <option value="maintenance">Under Maintenance</option>
          </select>
          <select className="filter-select">
            <option value="">All Property Types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="studio">Studio</option>
          </select>
          <select className="filter-select">
            <option value="">All Urgency Levels</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>
        </div>
      </div>

      <div className="properties-grid">
        {mockProperties.map(property => (
          <div key={property.id} className={`property-card ${property.status.toLowerCase()} ${property.urgency}`}>
            <div className="property-header">
              <h4>{property.address}</h4>
              <span className={`status-badge ${property.status.toLowerCase()}`}>
                {property.status}
              </span>
            </div>
            <div className="property-details">
              <p className="property-type">{property.type}</p>
              <p className="property-rent">${property.rent}/month</p>
              {property.tenant ? (
                <p className="property-tenant">Tenant: {property.tenant}</p>
              ) : (
                <p className="property-vacant">No tenant</p>
              )}
            </div>
            <div className="property-actions">
              <button className="btn-secondary">
                <Eye size={16} />
                View Details
              </button>
              {property.status === 'Vacant' && (
                <button className="btn-primary">List for Rent</button>
              )}
              {property.tenant && (
                <button className="btn-secondary">
                  <Phone size={16} />
                  Contact
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="occupancy-stats">
        <div className="stat-item">
          <span className="stat-label">Total Properties</span>
          <span className="stat-value">15</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Occupied</span>
          <span className="stat-value">12</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Vacant</span>
          <span className="stat-value">3</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Occupancy Rate</span>
          <span className="stat-value">80%</span>
        </div>
      </div>
    </div>
  );

  const renderClients = () => (
    <div className="clients-section">
      <div className="section-header">
        <h3>Centralized Client/Tenant Profile Management</h3>
        <p>Manage all tenant profiles and track their status</p>
      </div>

      <div className="client-actions">
        <button className="action-button primary" onClick={() => setShowTenantCreationModal(true)}>
          <UserPlus size={20} />
          Create New Tenant
        </button>
      </div>

      <div className="client-filters">
        <select className="filter-select">
          <option value="">All Client Status</option>
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="waiting-list">Waiting List</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="filter-select">
          <option value="">All Properties</option>
          <option value="123-main">123 Main St</option>
          <option value="456-oak">456 Oak Ave</option>
          <option value="789-pine">789 Pine Ln</option>
          <option value="321-elm">321 Elm St</option>
        </select>
        <input 
          type="text" 
          placeholder="Search by name..."
          className="search-input"
        />
      </div>

      <div className="clients-table">
        <table>
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Property</th>
              <th>Status</th>
              <th>Last Payment</th>
              <th>Amount</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockClients.map(client => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td>{client.property}</td>
                <td>
                  <span className={`status-badge ${client.status.toLowerCase().replace(' ', '-')}`}>
                    {client.status}
                  </span>
                </td>
                <td>{client.lastPayment || 'N/A'}</td>
                <td>${client.amount}</td>
                <td>
                  <div className="contact-info">
                    <span className="phone">{client.phone}</span>
                    <span className="email">{client.email}</span>
                  </div>
                </td>
                <td>
                  <button className="table-action-button view">View</button>
                  <button className="table-action-button contact">
                    <Phone size={14} />
                  </button>
                  <button className="table-action-button email">
                    <Mail size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="client-summary">
        <div className="summary-card">
          <h4>Active Tenants</h4>
          <span className="amount">18</span>
        </div>
        <div className="summary-card">
          <h4>Overdue Accounts</h4>
          <span className="amount overdue">3</span>
        </div>
        <div className="summary-card">
          <h4>Waiting List</h4>
          <span className="amount">5</span>
        </div>
        <div className="summary-card">
          <h4>Total Monthly Revenue</h4>
          <span className="amount">$32,400</span>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="alerts-section">
      <div className="section-header">
        <h3>Unpaid Rent Alerts</h3>
        <p>Monitor and manage overdue payments</p>
      </div>

      <div className="alert-filters">
        <select className="filter-select">
          <option value="">All Alert Types</option>
          <option value="unpaid-rent">Unpaid Rent</option>
          <option value="vacant-property">Vacant Property</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select className="filter-select">
          <option value="">All Urgency Levels</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
        </select>
      </div>

      <div className="alert-list-detailed">
        <div className="alert-item urgent">
          <div className="alert-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="alert-content">
            <h4>Bob Johnson - 321 Elm St, Apt 1A</h4>
            <p>Rent overdue by 15 days - $1,800</p>
            <span className="alert-date">Alert created: Nov 15, 2024</span>
          </div>
          <div className="alert-actions">
            <button className="btn-danger">Send Notice</button>
            <button className="btn-primary">Contact Tenant</button>
            <button className="btn-secondary">View Details</button>
          </div>
        </div>

        <div className="alert-item high">
          <div className="alert-icon">
            <Building size={24} />
          </div>
          <div className="alert-content">
            <h4>456 Oak Ave, Unit 2</h4>
            <p>Property vacant for 30+ days - High priority listing needed</p>
            <span className="alert-date">Alert created: Nov 10, 2024</span>
          </div>
          <div className="alert-actions">
            <button className="btn-primary">List Property</button>
            <button className="btn-secondary">Update Listing</button>
          </div>
        </div>

        <div className="alert-item normal">
          <div className="alert-icon">
            <Users size={24} />
          </div>
          <div className="alert-content">
            <h4>Alice Brown - Waiting List Follow-up</h4>
            <p>Interested in 456 Oak Ave - Follow up needed</p>
            <span className="alert-date">Alert created: Nov 18, 2024</span>
          </div>
          <div className="alert-actions">
            <button className="btn-primary">Contact Client</button>
            <button className="btn-secondary">Schedule Visit</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'occupancy':
        return renderOccupancy();
      case 'clients':
        return renderClients();
      case 'alerts':
        return renderAlerts();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="sales-manager-dashboard">
      <div className="dashboard-header">
        <h1>Sales Manager Dashboard</h1>
        <p>Monitor occupancy, manage clients, and track unpaid rents</p>
      </div>

      <div className="dashboard-tabs">
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

      <div className="dashboard-content">
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

      {/* Tenant Creation Modal */}
      {showTenantCreationModal && (
        <div className="modal-overlay" onClick={() => {
          setShowTenantCreationModal(false);
          setCurrentStep(1);
          setNewTenantData(null);
          setUploadedDocuments([]);
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{currentStep === 1 ? 'Create New Tenant - Basic Information' : 'Create New Tenant - Upload Documents'}</h3>
              <button className="modal-close" onClick={() => {
                setShowTenantCreationModal(false);
                setCurrentStep(1);
                setNewTenantData(null);
                setUploadedDocuments([]);
              }}>×</button>
            </div>
            <div className="modal-body">
              {currentStep === 1 ? (
                <form onSubmit={handleCreateTenant}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name</label>
                      <input type="text" name="firstName" required placeholder="Enter first name" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name</label>
                      <input type="text" name="lastName" required placeholder="Enter last name" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input type="email" name="email" required placeholder="tenant@example.com" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input type="tel" name="phone" required placeholder="+1-555-0000" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="property">Property</label>
                      <select name="property" required>
                        <option value="">Select Property</option>
                        <option value="123 Main St, Apt 4B">123 Main St, Apt 4B</option>
                        <option value="456 Oak Ave, Unit 2">456 Oak Ave, Unit 2</option>
                        <option value="789 Pine Ln">789 Pine Ln</option>
                        <option value="321 Elm St, Apt 1A">321 Elm St, Apt 1A</option>
                        <option value="654 Maple Dr">654 Maple Dr</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="rent">Monthly Rent</label>
                      <input type="number" name="rent" step="0.01" required placeholder="0.00" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="moveInDate">Move-in Date</label>
                    <input type="date" name="moveInDate" required />
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="action-button secondary" onClick={() => {
                      setShowTenantCreationModal(false);
                      setCurrentStep(1);
                    }}>
                      Cancel
                    </button>
                    <button type="submit" className="action-button primary">
                      Next: Upload Documents
                    </button>
                  </div>
                </form>
              ) : (
                <div className="document-upload-step">
                  <div className="tenant-summary">
                    <h4>Tenant Information:</h4>
                    <p><strong>Name:</strong> {newTenantData?.name}</p>
                    <p><strong>Email:</strong> {newTenantData?.email}</p>
                    <p><strong>Property:</strong> {newTenantData?.property}</p>
                    <p><strong>Rent:</strong> €{newTenantData?.amount?.toFixed(2)}</p>
                  </div>

                  <div className="document-upload-section">
                    <h4>Upload Required Documents</h4>
                    <p>Please upload the tenant's KYC documents and lease contract</p>

                    <div className="upload-buttons">
                      <button className="action-button primary" onClick={() => setShowKycModal(true)}>
                        <Upload size={20} />
                        Upload KYC Documents
                      </button>
                      <button className="action-button primary" onClick={() => setShowContractModal(true)}>
                        <FileText size={20} />
                        Upload Lease Contract
                      </button>
                    </div>

                    {uploadedDocuments.length > 0 && (
                      <div className="uploaded-documents-list">
                        <h5>Uploaded Documents:</h5>
                        {uploadedDocuments.map((doc, index) => (
                          <div key={index} className="document-item">
                            <FileText size={16} />
                            <span>{doc.type}: {doc.name || doc.details?.contractType || 'Contract'}</span>
                            <button 
                              className="remove-doc-button"
                              onClick={() => removeDocument(index)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="action-button secondary" onClick={() => setCurrentStep(1)}>
                      Back
                    </button>
                    <button 
                      type="button" 
                      className="action-button primary" 
                      onClick={finalizeTenantCreation}
                      disabled={uploadedDocuments.length === 0}
                    >
                      Create Tenant Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KYC Upload Modal */}
      <Modal isOpen={showKycModal} onClose={() => setShowKycModal(false)}>
        <h2>Upload Tenant KYC Documents</h2>
        <DocumentUpload onFileUpload={(file) => handleKycUpload(file, 'tenant')} />
      </Modal>

      {/* Contract Upload Modal */}
      <Modal isOpen={showContractModal} onClose={() => setShowContractModal(false)}>
        <ContractUpload onContractUpload={handleContractUpload} />
      </Modal>
    </div>
  );
};

export default SalesManagerDashboard;