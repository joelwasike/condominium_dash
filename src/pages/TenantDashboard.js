import React, { useState } from 'react';
import Modal from '../components/Modal';
import DocumentUpload from '../components/DocumentUpload';
import ContractUpload from '../components/ContractUpload';
import ReportSubmission from '../components/ReportSubmission';
import { FileText, Home, DollarSign, Wrench, Calendar } from 'lucide-react';
import './TenantDashboard.css';

const TenantDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  const handleKycUpload = (file) => {
    console.log('KYC Document uploaded:', file.name);
    // Here you would typically send the file to a backend service
    // After successful upload, you might close the modal or show a success message
    // setIsKycModalOpen(false);
  };

  const handleContractUpload = (contractDetails) => {
    console.log('Contract uploaded:', contractDetails);
    // Here you would typically send the contract details and file to a backend service
    // After successful upload, you might close the modal or show a success message
    // setIsContractModalOpen(false);
  };

        return (
    <div className="tenant-dashboard">
      <div className="dashboard-header modern-container">
        <h1>Tenant Dashboard</h1>
        <p>Manage your property, payments, and communicate with support</p>
      </div>

      <div className="tabs modern-container">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          <Home size={18} /> Overview
        </button>
        <button className={activeTab === 'documents' ? 'active' : ''} onClick={() => setActiveTab('documents')}>
          <FileText size={18} /> Documents
        </button>
        <button className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>
          <DollarSign size={18} /> Payments
        </button>
        <button className={activeTab === 'maintenance' ? 'active' : ''} onClick={() => setActiveTab('maintenance')}>
          <Wrench size={18} /> Maintenance
        </button>
      </div>

      <div className="tab-content modern-container">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Welcome, Tenant!</h2>
            <p>Here's a quick overview of your current property status and upcoming activities.</p>
            <div className="stats-grid">
              <div className="stat-card modern-card">
                <h3>Current Lease</h3>
                <p>Apartment 4B, 123 Main St</p>
                <p>Ends: 2024-12-31</p>
              </div>
              <div className="stat-card modern-card">
                <h3>Next Rent Due</h3>
                <p>$1,500 on 2024-11-01</p>
              </div>
              <div className="stat-card modern-card">
                <h3>Open Maintenance Tickets</h3>
                <p>2</p>
              </div>
            </div>
            <div className="action-buttons">
              <ReportSubmission />
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="documents-section">
            <h2>Your Documents</h2>
            <p>Manage your KYC documents and essential contracts here.</p>
            <div className="document-actions">
              <button className="action-button" onClick={() => setIsKycModalOpen(true)}>
                Upload KYC Documents
              </button>
              <button className="action-button" onClick={() => setIsContractModalOpen(true)}>
                Upload Essential Contract
              </button>
            </div>

            <div className="document-list modern-card">
              <h3>Uploaded Documents</h3>
              <ul>
                <li>Lease Agreement (PDF) - <span className="status approved">Approved</span></li>
                <li>Passport Copy (JPG) - <span className="status pending">Pending Review</span></li>
                <li>Utility Bill (PDF) - <span className="status approved">Approved</span></li>
              </ul>
            </div>

            <Modal isOpen={isKycModalOpen} onClose={() => setIsKycModalOpen(false)}>
              <h2>Upload KYC Documents</h2>
              <DocumentUpload onFileUpload={handleKycUpload} />
            </Modal>

            <Modal isOpen={isContractModalOpen} onClose={() => setIsContractModalOpen(false)}>
              <ContractUpload onContractUpload={handleContractUpload} />
            </Modal>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="payments-section">
            <h2>Payment History</h2>
            <p>View your past payments and upcoming due dates.</p>
            <div className="modern-card">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2024-10-01</td>
                    <td>Monthly Rent</td>
                    <td>$1,500</td>
                    <td className="status paid">Paid</td>
                  </tr>
                  <tr>
                    <td>2024-09-01</td>
                    <td>Monthly Rent</td>
                    <td>$1,500</td>
                    <td className="status paid">Paid</td>
                  </tr>
                  <tr>
                    <td>2024-08-01</td>
                    <td>Monthly Rent</td>
                    <td>$1,500</td>
                    <td className="status paid">Paid</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="maintenance-section">
            <h2>Maintenance Requests</h2>
            <p>Submit new requests or check the status of existing ones.</p>
            <button className="action-button">Submit New Request</button>

            <div className="modern-card">
              <h3>Open Requests</h3>
              <ul>
                <li>Leaky Faucet - <span className="status pending">Pending</span></li>
                <li>AC Not Cooling - <span className="status in-progress">In Progress</span></li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;
