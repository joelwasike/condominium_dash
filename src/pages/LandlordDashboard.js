import React, { useState } from 'react';
import { Home, FileText, DollarSign, Users, Upload, Plus, TrendingUp, Wrench, ClipboardList, Receipt, CreditCard, FileEdit, Package, BarChart3 } from 'lucide-react';
import Modal from '../components/Modal';
import DocumentUpload from '../components/DocumentUpload';
import ContractUpload from '../components/ContractUpload';
import ReportSubmission from '../components/ReportSubmission';
import './LandlordDashboard.css';

const LandlordDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showKycModal, setShowKycModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const handleKycUpload = (files, userRole) => {
    console.log('KYC files uploaded:', files, 'for role:', userRole);
    addNotification('KYC documents uploaded successfully!', 'success');
  };

  const handleContractUpload = (files, contractDetails, userRole) => {
    console.log('Contract uploaded:', files, contractDetails, 'for role:', userRole);
    addNotification('Contract uploaded successfully!', 'success');
  };

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Generate Receipt Function
  const generateReceipt = () => {
    const receiptData = {
      receiptNumber: `RCP-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      landlord: 'John Doe',
      property: '123 Main Street',
      tenant: 'Jane Smith',
      amount: '€1,200.00',
      period: 'November 2024',
      description: 'Monthly Rent Payment'
    };

    // Create receipt content
    const receiptContent = `
      REAL ESTATE RENTAL RECEIPT
      =========================
      
      Receipt No: ${receiptData.receiptNumber}
      Date: ${receiptData.date}
      
      Landlord: ${receiptData.landlord}
      Property: ${receiptData.property}
      Tenant: ${receiptData.tenant}
      
      Description: ${receiptData.description}
      Period: ${receiptData.period}
      Amount: ${receiptData.amount}
      
      Payment Method: Bank Transfer
      Status: Received
      
      Thank you for your payment!
      
      Generated on: ${new Date().toLocaleString()}
    `;

    // Create and download the receipt
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addNotification('Receipt generated and downloaded!', 'success');
  };

  // Generate Lease Function
  const generateLease = () => {
    const leaseData = {
      leaseId: `LEASE-${Date.now()}`,
      landlord: 'John Doe',
      tenant: 'Jane Smith',
      property: '123 Main Street',
      rent: '€1,200.00',
      deposit: '€2,400.00',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    };

    const leaseContent = `
      RESIDENTIAL LEASE AGREEMENT
      ==========================
      
      Lease ID: ${leaseData.leaseId}
      
      LANDLORD: ${leaseData.landlord}
      TENANT: ${leaseData.tenant}
      PROPERTY: ${leaseData.property}
      
      TERMS:
      - Monthly Rent: ${leaseData.rent}
      - Security Deposit: ${leaseData.deposit}
      - Lease Start: ${leaseData.startDate}
      - Lease End: ${leaseData.endDate}
      
      This lease agreement is generated automatically.
      Please review and sign accordingly.
      
      Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([leaseContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lease-${leaseData.leaseId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addNotification('Lease agreement generated and downloaded!', 'success');
  };

  // Other button functions
  const handleAddProperty = () => {
    addNotification('Add Property feature opened!', 'info');
  };

  const handleScheduleVisit = () => {
    addNotification('Visit scheduling feature opened!', 'info');
  };

  const handleMobilePayment = () => {
    addNotification('Mobile payment portal opened!', 'info');
  };

  const handlePOSPayment = () => {
    addNotification('POS terminal opened!', 'info');
  };

  const handleCreateWorkOrder = () => {
    addNotification('Work order creation opened!', 'info');
  };

  const handleGenerateReport = () => {
    const reportContent = `
      MONTHLY FINANCIAL REPORT
      ========================
      
      Report Date: ${new Date().toLocaleDateString()}
      Period: November 2024
      
      INCOME:
      - Total Rent Collected: €6,000.00
      - Late Fees: €0.00
      - Other Income: €0.00
      Total Income: €6,000.00
      
      EXPENSES:
      - Maintenance: €400.00
      - Management Fee: €600.00
      - Insurance: €150.00
      - Utilities: €200.00
      Total Expenses: €1,350.00
      
      NET INCOME: €4,650.00
      
      Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().slice(0, 7)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addNotification('Financial report generated and downloaded!', 'success');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'properties', label: 'Property & Asset', icon: Home },
    { id: 'rental', label: 'Rental Management', icon: ClipboardList },
    { id: 'payments', label: 'Payments & Cash Flow', icon: DollarSign },
    { id: 'works', label: 'Works & Claims', icon: Wrench },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'tracking', label: 'Business Tracking', icon: BarChart3 }
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <h2>Dynamic Dashboard Overview</h2>
      <p>Track your real estate business performance and key metrics</p>
      
      <div className="stats-grid">
        <div className="stat-card modern-card">
          <h3>Total Properties</h3>
          <p>Active assets under management</p>
          <span className="stat-value">5</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Total Rent Collected</h3>
          <p>This month</p>
          <span className="stat-value">€6,000</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Cash Flow</h3>
          <p>Net payout after commission</p>
          <span className="stat-value">€5,400</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Payment Rate</h3>
          <p>On time vs late</p>
          <span className="stat-value">95%</span>
                  </div>
        <div className="stat-card modern-card">
          <h3>Active Tenants</h3>
          <p>Current occupants</p>
          <span className="stat-value">12</span>
                  </div>
        <div className="stat-card modern-card">
          <h3>Pending Claims</h3>
          <p>Awaiting resolution</p>
          <span className="stat-value">3</span>
                  </div>
        <div className="stat-card modern-card">
          <h3>Works in Progress</h3>
          <p>Ongoing interventions</p>
          <span className="stat-value">2</span>
                  </div>
        <div className="stat-card modern-card">
          <h3>Occupancy Rate</h3>
          <p>Properties occupied</p>
          <span className="stat-value">80%</span>
                </div>
              </div>
              
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-grid">
                  <button className="action-button" onClick={generateReceipt}><Receipt size={20} /> Generate Receipt</button>
                  <button className="action-button" onClick={generateLease}><FileEdit size={20} /> Generate Lease</button>
                  <button className="action-button" onClick={handleMobilePayment}><CreditCard size={20} /> Mobile Payment</button>
                  <ReportSubmission />
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
                <button className="action-button primary" onClick={handleAddProperty}>
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
      <h2>Payments & Cash Flow Management</h2>
      <p>Comprehensive payment tracking with multiple collection methods</p>
      
      <div className="payment-features">
                <div className="feature-card modern-card">
                  <h3><Receipt size={20} /> Rent Collection + Receipts</h3>
                  <p>Automated rent collection with instant receipt generation</p>
                  <button className="action-button" onClick={() => addNotification('Collections view opened!', 'info')}>View Collections</button>
                </div>
                
                <div className="feature-card modern-card">
                  <h3><CreditCard size={20} /> Mobile Rent Payment</h3>
                  <p>Enable tenants to pay rent via mobile devices</p>
                  <button className="action-button" onClick={handleMobilePayment}>Mobile Payment Portal</button>
                </div>
                
                <div className="feature-card modern-card">
                  <h3><FileText size={20} /> Electronic Receipts</h3>
                  <p>Generate and send electronic receipts automatically</p>
                  <button className="action-button" onClick={generateReceipt}>Generate Receipt</button>
                </div>
                
                <div className="feature-card modern-card">
                  <h3><DollarSign size={20} /> POS for On-Site Collection</h3>
                  <p>Point of sale system for in-person payments</p>
                  <button className="action-button" onClick={handlePOSPayment}>Open POS Terminal</button>
                </div>
                    </div>
      
      <div className="payment-summary">
        <div className="stat-card modern-card">
          <h4>Total Collected This Month</h4>
          <span className="amount">€6,000.00</span>
          <p>From 12 transactions</p>
        </div>
        <div className="stat-card modern-card">
          <h4>Net Cash Flow</h4>
          <span className="amount">€5,400.00</span>
          <p>After 10% commission</p>
                      </div>
        <div className="stat-card modern-card">
          <h4>Pending Payments</h4>
          <span className="amount">€0.00</span>
          <p>All payments collected</p>
                    </div>
        <div className="stat-card modern-card">
          <h4>Payment Methods</h4>
          <p>Mobile: 60% | POS: 25% | Bank: 15%</p>
                  </div>
                </div>
                
      <div className="payment-history">
        <h3>Recent Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Property</th>
              <th>Tenant</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Nov 1, 2024</td>
              <td>123 Main St</td>
              <td>John Doe</td>
              <td>€1,200.00</td>
              <td>Mobile Payment</td>
              <td><button className="action-button small">Download</button></td>
            </tr>
            <tr>
              <td>Nov 1, 2024</td>
              <td>456 Oak Ave</td>
              <td>Jane Smith</td>
              <td>€900.00</td>
              <td>POS</td>
              <td><button className="action-button small">Download</button></td>
            </tr>
            <tr>
              <td>Oct 31, 2024</td>
              <td>789 Pine Ln</td>
              <td>Bob Johnson</td>
              <td>€1,500.00</td>
              <td>Bank Transfer</td>
              <td><button className="action-button small">Download</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      
              <div className="receipt-actions">
                <button className="action-button primary" onClick={generateReceipt}><Receipt size={20} /> Print Rent Receipt</button>
                <button className="action-button primary" onClick={handleGenerateReport}><FileText size={20} /> Generate Monthly Report</button>
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
      
  const renderRentalManagement = () => (
    <div className="rental-section">
      <h2>Rental Management</h2>
      <p>Manage your rental agreements, rent reviews, and charge adjustments</p>
      
      <div className="rental-features">
                <div className="feature-card modern-card">
                  <h3><FileEdit size={20} /> Generation of Lease Agreements</h3>
                  <p>Create and manage lease contracts automatically</p>
                  <button className="action-button" onClick={generateLease}>Generate New Lease</button>
              </div>
              
                <div className="feature-card modern-card">
                  <h3><TrendingUp size={20} /> Rent Reviews</h3>
                  <p>Track and manage rent adjustments and reviews</p>
                  <button className="action-button" onClick={() => addNotification('Rent review scheduled!', 'info')}>Schedule Review</button>
                </div>
                
                <div className="feature-card modern-card">
                  <h3><DollarSign size={20} /> Adjustment of Charges</h3>
                  <p>Modify utility charges and other fees</p>
                  <button className="action-button" onClick={() => addNotification('Charge adjustment feature opened!', 'info')}>Adjust Charges</button>
                </div>
                
                <div className="feature-card modern-card">
                  <h3><Users size={20} /> Tenant Interface</h3>
                  <p>Manage tenant communications and requests</p>
                  <button className="action-button" onClick={() => addNotification('Tenant interface opened!', 'info')}>View Interface</button>
                </div>
      </div>
                  </div>
  );

  const renderWorksAndClaims = () => (
    <div className="works-section">
      <h2>Works & Interventions Management</h2>
      <p>Track maintenance works, interventions, and automatic claims management</p>
      
      <div className="claims-list">
        <div className="claim-item modern-card">
          <h4>Plumbing Issue - 123 Main St</h4>
          <p>Status: <span className="status in-progress">In Progress</span></p>
          <p>Assigned to: John's Plumbing Service</p>
          <button className="action-button">View Details</button>
                </div>
                
        <div className="claim-item modern-card">
          <h4>Electrical Repair - 456 Oak Ave</h4>
          <p>Status: <span className="status pending">Pending</span></p>
          <p>Auto-assigned via claim system</p>
          <button className="action-button">View Details</button>
                </div>
              </div>
              
              <div className="works-actions">
                <button className="action-button" onClick={handleCreateWorkOrder}><Plus size={20} /> Create Work Order</button>
                <button className="action-button" onClick={() => addNotification('Intervention scheduling opened!', 'info')}><Wrench size={20} /> Schedule Intervention</button>
                <ReportSubmission />
              </div>
          </div>
        );
      
  const renderInventory = () => (
    <div className="inventory-section">
      <h2>Inventory Management</h2>
      <p>Track property inventories, equipment, and assets</p>
      
      <div className="inventory-grid">
        <div className="inventory-card modern-card">
          <h3>123 Main Street</h3>
          <p>Last updated: Nov 15, 2024</p>
          <ul>
            <li>Kitchen Appliances: 5 items</li>
            <li>Furniture: 12 items</li>
            <li>Electronics: 3 items</li>
          </ul>
          <button className="action-button">View Full Inventory</button>
                </div>
        
        <div className="inventory-card modern-card">
          <h3>456 Oak Avenue</h3>
          <p>Last updated: Nov 10, 2024</p>
          <ul>
            <li>Kitchen Appliances: 4 items</li>
            <li>Furniture: 8 items</li>
            <li>Electronics: 2 items</li>
          </ul>
          <button className="action-button">View Full Inventory</button>
                </div>
              </div>
              
      <button className="action-button primary"><Plus size={20} /> Add New Inventory</button>
                  </div>
  );

  const renderBusinessTracking = () => (
    <div className="tracking-section">
      <h2>Track Your Business</h2>
      <p>Comprehensive analytics and business performance tracking</p>
      
      <div className="tracking-stats">
        <div className="stat-card modern-card">
          <h3>Revenue Trends</h3>
          <p>Monthly income analysis</p>
          <span className="stat-value">+12%</span>
                  </div>
        
        <div className="stat-card modern-card">
          <h3>Occupancy Rate</h3>
          <p>Average across properties</p>
          <span className="stat-value">80%</span>
                </div>
                
        <div className="stat-card modern-card">
          <h3>Maintenance Costs</h3>
          <p>This quarter</p>
          <span className="stat-value">€2,400</span>
                </div>
                
        <div className="stat-card modern-card">
          <h3>ROI</h3>
          <p>Return on investment</p>
          <span className="stat-value">8.5%</span>
                </div>
              </div>
              
              <div className="reports-section">
                <h3>Download Reports</h3>
                <button className="action-button" onClick={handleGenerateReport}><Receipt size={20} /> Financial Report</button>
                <button className="action-button" onClick={() => addNotification('Performance report generated!', 'success')}><BarChart3 size={20} /> Performance Report</button>
                <button className="action-button" onClick={() => addNotification('Tax report generated!', 'success')}><FileText size={20} /> Tax Report</button>
              </div>
          </div>
        );
      
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'properties':
        return renderProperties();
      case 'rental':
        return renderRentalManagement();
      case 'payments':
        return renderPayments();
      case 'works':
        return renderWorksAndClaims();
      case 'documents':
        return renderDocuments();
      case 'inventory':
        return renderInventory();
      case 'tracking':
        return renderBusinessTracking();
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

      {/* Notification System */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>×</button>
          </div>
        ))}
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
