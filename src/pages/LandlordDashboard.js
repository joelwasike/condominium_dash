import React, { useState } from 'react';
import { Home, FileText, DollarSign, Users, Upload, Plus, TrendingUp } from 'lucide-react';
import Modal from '../components/Modal';
import DocumentUpload from '../components/DocumentUpload';
import ContractUpload from '../components/ContractUpload';
import './LandlordDashboard.css';

const LandlordDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showKycModal, setShowKycModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  const handleKycUpload = (files, userRole) => {
    console.log('KYC files uploaded:', files, 'for role:', userRole);
    // Handle KYC upload logic here
  };

  const handleContractUpload = (files, contractDetails, userRole) => {
    console.log('Contract uploaded:', files, contractDetails, 'for role:', userRole);
    // Handle contract upload logic here
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'tenants', label: 'Tenants', icon: Users }
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Home size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Properties</h3>
            <p>Active listings</p>
            <span className="stat-value">5</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Rent Collected</h3>
            <p>This month</p>
            <span className="stat-value">$6,000</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Net Payout Received</h3>
            <p>After commission</p>
            <span className="stat-value">$5,400</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Payment Rate</h3>
            <p>On time vs late</p>
            <span className="stat-value">95%</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProperties = () => (
    <div className="properties-section">
      <div className="section-header">
        <h3>Property Management</h3>
        <p>Manage your rental properties and listings</p>
      </div>
      
      <div className="property-actions">
        <button className="action-button primary">
          <Plus size={20} />
          Add New Property
        </button>
      </div>

      <div className="property-list">
        <div className="property-item">
          <div className="property-image">
            <div className="placeholder-image">123 Main St</div>
          </div>
          <div className="property-info">
            <h4>123 Main Street</h4>
            <p>3 Bedroom, 2 Bathroom</p>
            <div className="property-details">
              <span className="rent">$1,200/month</span>
              <span className="status occupied">Occupied</span>
            </div>
          </div>
        </div>
        <div className="property-item">
          <div className="property-image">
            <div className="placeholder-image">456 Oak Ave</div>
          </div>
          <div className="property-info">
            <h4>456 Oak Avenue</h4>
            <p>2 Bedroom, 1 Bathroom</p>
            <div className="property-details">
              <span className="rent">$900/month</span>
              <span className="status vacant">Vacant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="documents-section">
      <div className="section-header">
        <h3>Document Management</h3>
        <p>Upload and manage your property documents and contracts</p>
      </div>
      
      <div className="document-actions">
        <button 
          className="action-button primary"
          onClick={() => setShowKycModal(true)}
        >
          <Upload size={20} />
          Upload KYC Documents
        </button>
        <button 
          className="action-button secondary"
          onClick={() => setShowContractModal(true)}
        >
          <Plus size={20} />
          Upload Essential Contract
        </button>
      </div>

      <div className="document-list">
        <h4>Recent Documents</h4>
        <div className="document-item">
          <FileText size={20} />
          <div className="document-info">
            <span className="document-name">Property Deed</span>
            <span className="document-status approved">Approved</span>
          </div>
        </div>
        <div className="document-item">
          <FileText size={20} />
          <div className="document-info">
            <span className="document-name">Lease Agreement</span>
            <span className="document-status pending">Pending Review</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="payments-section">
      <div className="section-header">
        <h3>Financial Overview</h3>
        <p>Track your rental income and expenses</p>
      </div>
      
      <div className="payment-summary">
        <div className="payment-card">
          <h4>Total Collected</h4>
          <span className="amount">$6,000.00</span>
          <p>This month</p>
        </div>
        <div className="payment-card">
          <h4>Net Income</h4>
          <span className="amount">$5,400.00</span>
          <p>After commission (10%)</p>
        </div>
        <div className="payment-card">
          <h4>Pending Payments</h4>
          <span className="amount">$0.00</span>
          <p>No outstanding</p>
        </div>
      </div>

      <div className="payment-history">
        <h4>Recent Transactions</h4>
        <div className="payment-item">
          <div className="payment-info">
            <span className="property">123 Main Street</span>
            <span className="tenant">John Doe</span>
          </div>
          <div className="payment-amount">$1,200.00</div>
          <div className="payment-date">Nov 1, 2024</div>
        </div>
        <div className="payment-item">
          <div className="payment-info">
            <span className="property">456 Oak Avenue</span>
            <span className="tenant">Jane Smith</span>
          </div>
          <div className="payment-amount">$900.00</div>
          <div className="payment-date">Nov 1, 2024</div>
        </div>
      </div>
    </div>
  );

  const renderTenants = () => (
    <div className="tenants-section">
      <div className="section-header">
        <h3>Tenant Management</h3>
        <p>Manage your tenants and their information</p>
      </div>
      
      <div className="tenant-list">
        <div className="tenant-item">
          <div className="tenant-avatar">
            <Users size={24} />
          </div>
          <div className="tenant-info">
            <h4>John Doe</h4>
            <p>123 Main Street, Apt 4B</p>
            <div className="tenant-details">
              <span className="rent">$1,200/month</span>
              <span className="status active">Active</span>
            </div>
          </div>
        </div>
        <div className="tenant-item">
          <div className="tenant-avatar">
            <Users size={24} />
          </div>
          <div className="tenant-info">
            <h4>Jane Smith</h4>
            <p>456 Oak Avenue, Unit 2</p>
            <div className="tenant-details">
              <span className="rent">$900/month</span>
              <span className="status active">Active</span>
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
      case 'properties':
        return renderProperties();
      case 'documents':
        return renderDocuments();
      case 'payments':
        return renderPayments();
      case 'tenants':
        return renderTenants();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="landlord-dashboard">
      <div className="dashboard-header modern-container">
        <h1>Landlord Dashboard</h1>
        <p>Manage your rental properties and tenants</p>
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

      <Modal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        title="Upload KYC Documents"
        size="lg"
      >
        <DocumentUpload
          userRole="landlord"
          onUpload={handleKycUpload}
          onClose={() => setShowKycModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        title="Upload Essential Contract"
        size="xl"
      >
        <ContractUpload
          userRole="landlord"
          onUpload={handleContractUpload}
          onClose={() => setShowContractModal(false)}
        />
      </Modal>
    </div>
  );
};

export default LandlordDashboard;
