import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  FileText,
  DollarSign,
  Users,
  Upload,
  Plus,
  TrendingUp,
  Wrench,
  ClipboardList,
  Receipt,
  CreditCard,
  FileEdit,
  Package,
  BarChart3,
  Settings
} from 'lucide-react';
import Modal from '../components/Modal';
import DocumentUpload from '../components/DocumentUpload';
import ContractUpload from '../components/ContractUpload';
import ReportSubmission from '../components/ReportSubmission';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import './LandlordDashboard.css';
import '../components/RoleLayout.css';
import '../pages/TechnicianDashboard.css';
import { landlordService } from '../services/landlordService';

const LandlordDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showKycModal, setShowKycModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // API Data States
  const [overviewData, setOverviewData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [claims, setClaims] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [businessTracking, setBusinessTracking] = useState(null);

  const handleKycUpload = (files, userRole) => {
    console.log('KYC files uploaded:', files, 'for role:', userRole);
    addNotification('KYC documents uploaded successfully!', 'success');
  };

  const handleContractUpload = (files, contractDetails, userRole) => {
    console.log('Contract uploaded:', files, contractDetails, 'for role:', userRole);
    addNotification('Contract uploaded successfully!', 'success');
  };

  const addNotification = (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Load data from APIs
  const loadData = async () => {
    try {
      setLoading(true);
      const [overview, propertiesData, paymentsData, workOrdersData, claimsData, inventoryData, trackingData] = await Promise.all([
        landlordService.getOverview(),
        landlordService.getProperties(),
        landlordService.getPayments(),
        landlordService.getWorkOrders(),
        landlordService.getClaims(),
        landlordService.getInventory(),
        landlordService.getBusinessTracking()
      ]);
      
      setOverviewData(overview);
      setProperties(propertiesData);
      setPayments(paymentsData);
      setWorkOrders(workOrdersData);
      setClaims(claimsData);
      setInventory(inventoryData);
      setBusinessTracking(trackingData);
    } catch (error) {
      console.error('Error loading landlord data:', error);
      addNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Action handlers
  const handleAddProperty = async (propertyData) => {
    try {
      await landlordService.addProperty(propertyData);
      addNotification('Property added successfully', 'success');
      setShowPropertyModal(false);
      loadData();
    } catch (error) {
      console.error('Error adding property:', error);
      addNotification('Failed to add property', 'error');
    }
  };

  const handleCreateWorkOrder = async (workOrderData) => {
    try {
      await landlordService.createWorkOrder(workOrderData);
      addNotification('Work order created successfully', 'success');
      setShowWorkOrderModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating work order:', error);
      addNotification('Failed to create work order', 'error');
    }
  };

  const handleCreateClaim = async (claimData) => {
    try {
      await landlordService.createClaim(claimData);
      addNotification('Claim created successfully', 'success');
      setShowClaimModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating claim:', error);
      addNotification('Failed to create claim', 'error');
    }
  };

  const handleAddInventory = async (inventoryData) => {
    try {
      await landlordService.addInventory(inventoryData);
      addNotification('Inventory added successfully', 'success');
      setShowInventoryModal(false);
      loadData();
    } catch (error) {
      console.error('Error adding inventory:', error);
      addNotification('Failed to add inventory', 'error');
    }
  };

  const handleGenerateReceipt = async (receiptData) => {
    try {
      const receipt = await landlordService.generateReceipt(receiptData);
      addNotification('Receipt generated successfully', 'success');
      setShowReceiptModal(false);
      // You could also trigger a download here
      console.log('Generated receipt:', receipt);
    } catch (error) {
      console.error('Error generating receipt:', error);
      addNotification('Failed to generate receipt', 'error');
    }
  };

  // Generate Receipt Function
  const generateReceipt = () => {
    const receiptData = {
      receiptNumber: `RCP-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      landlord: 'John Doe',
      property: '123 Main Street',
      tenant: 'Jane Smith',
      amount: '1,200.00 XOF',
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
      rent: '1,200.00 XOF',
      deposit: '2,400.00 XOF',
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
  const handleScheduleVisit = () => {
    addNotification('Visit scheduling feature opened!', 'info');
  };

  const handleMobilePayment = () => {
    addNotification('Mobile payment portal opened!', 'info');
  };

  const handlePOSPayment = () => {
    addNotification('POS terminal opened!', 'info');
  };


  const handleGenerateReport = () => {
    const reportContent = `
      MONTHLY FINANCIAL REPORT
      ========================
      
      Report Date: ${new Date().toLocaleDateString()}
      Period: November 2024
      
      INCOME:
      - Total Rent Collected: 6,000.00 XOF
      - Late Fees: 0.00 XOF
      - Other Income: 0.00 XOF
      Total Income: 6,000.00 XOF
      
      EXPENSES:
      - Maintenance: 400.00 XOF
      - Management Fee: 600.00 XOF
      - Insurance: 150.00 XOF
      - Utilities: 200.00 XOF
      Total Expenses: 1,350.00 XOF
      
      NET INCOME: 4,650.00 XOF
      
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

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'properties', label: 'Property & Asset', icon: Home },
      { id: 'payments', label: 'Payments & Cash Flow', icon: DollarSign },
      { id: 'works', label: 'Works & Claims', icon: Wrench },
      { id: 'documents', label: 'Documents', icon: FileText },
      { id: 'inventory', label: 'Inventory', icon: Package },
      { id: 'tracking', label: 'Business Tracking', icon: BarChart3 },
      { id: 'settings', label: 'Profile Settings', icon: Settings }
    ],
    []
  );

  const renderOverview = () => (
    <div className="overview-section">
      <div className="section-header">
        <div>
          <h2>Landlord Dashboard Overview</h2>
      <p>Track your real estate business performance and key metrics</p>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading overview data...</div>
      ) : (
        <div className="dashboard-overview">
          <div className="overview-card">
            <div className="card-label">
              <span>Total Properties</span>
          </div>
            <div className="card-value">
              <span>{overviewData?.totalProperties || 0}</span>
              <small>Active assets under management</small>
          </div>
          </div>
          <div className="overview-card">
            <div className="card-label">
              <span>Total Rent Collected</span>
          </div>
            <div className="card-value">
              <span>{overviewData?.totalRent?.toLocaleString() || 0} XOF</span>
              <small>This month</small>
          </div>
          </div>
          <div className="overview-card">
            <div className="card-label">
              <span>Cash Flow</span>
          </div>
            <div className="card-value">
              <span>{overviewData?.netCashFlow?.toLocaleString() || 0} XOF</span>
              <small>Net payout after commission</small>
          </div>
        </div>
          <div className="overview-card">
            <div className="card-label">
              <span>Payment Rate</span>
              </div>
            <div className="card-value">
              <span>{overviewData?.paymentRate || 0}%</span>
              <small>On time vs late</small>
            </div>
          </div>
          <div className="overview-card">
            <div className="card-label">
              <span>Active Tenants</span>
            </div>
            <div className="card-value">
              <span>{overviewData?.activeTenants || 0}</span>
              <small>Current occupants</small>
            </div>
          </div>
          <div className="overview-card">
            <div className="card-label">
              <span>Pending Claims</span>
            </div>
            <div className="card-value">
              <span>{overviewData?.pendingClaims || 0}</span>
              <small>Awaiting resolution</small>
            </div>
          </div>
          <div className="overview-card">
            <div className="card-label">
              <span>Works in Progress</span>
            </div>
            <div className="card-value">
              <span>{overviewData?.worksInProgress || 0}</span>
              <small>Ongoing interventions</small>
            </div>
          </div>
          <div className="overview-card">
            <div className="card-label">
              <span>Occupancy Rate</span>
            </div>
            <div className="card-value">
              <span>{overviewData?.occupancyRate || 0}%</span>
              <small>Properties occupied</small>
            </div>
          </div>
        </div>
      )}
          </div>
        );
      
  const renderProperties = () => (
    <div className="properties-section">
      <div className="section-header">
        <div>
          <h2>Property Management</h2>
        <p>Manage your rental properties and listings</p>
      </div>
        <button className="btn-primary" onClick={() => setShowPropertyModal(true)} disabled={loading}>
          <Plus size={18} />
          Add New Property
        </button>
      </div>
              
      {loading ? (
        <div className="loading">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="no-data">No properties found</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Property Address</th>
                <th>Type</th>
                <th>Bedrooms</th>
                <th>Bathrooms</th>
                <th>Rent</th>
                <th>Status</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
          {properties.map((property, index) => (
                <tr key={property.ID || `property-${index}`}>
                  <td>
                    <span className="row-primary">{property.Address || 'Unknown Address'}</span>
                  </td>
                  <td>{property.Type || 'N/A'}</td>
                  <td>{property.Bedrooms || 0}</td>
                  <td>{property.Bathrooms || 0}</td>
                  <td>{property.Rent?.toLocaleString() || 0} XOF/month</td>
                  <td>
                    <span className={`status-badge ${(property.Status || 'vacant').toLowerCase()}`}>
                      {property.Status || 'Vacant'}
                    </span>
                  </td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button className="table-action-button view">View</button>
                      <button className="table-action-button edit">Edit</button>
              </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div className="documents-section">
      <div className="section-header">
        <div>
          <h2>Document Management</h2>
        <p>Upload and manage your property documents and contracts</p>
                      </div>
        <div style={{ display: 'flex', gap: '12px' }}>
        <button 
            className="btn-primary"
          onClick={() => setShowKycModal(true)}
            disabled={loading}
        >
            <Upload size={18} />
          Upload KYC Documents
        </button>
        <button 
            className="btn-primary"
          onClick={() => setShowContractModal(true)}
            disabled={loading}
        >
            <Plus size={18} />
          Upload Essential Contract
        </button>
        </div>
                    </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Upload Date</th>
              <th className="table-menu"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="row-primary">Property Deed</span>
              </td>
              <td>KYC Document</td>
              <td>
                <span className="status-badge approved">Approved</span>
              </td>
              <td>Nov 15, 2024</td>
              <td className="table-menu">
                <div className="table-actions">
                  <button className="table-action-button view">View</button>
                  <button className="table-action-button edit">Download</button>
                    </div>
              </td>
            </tr>
            <tr>
              <td>
                <span className="row-primary">Lease Agreement</span>
              </td>
              <td>Contract</td>
              <td>
                <span className="status-badge pending">Pending Review</span>
              </td>
              <td>Nov 10, 2024</td>
              <td className="table-menu">
                <div className="table-actions">
                  <button className="table-action-button view">View</button>
                  <button className="table-action-button edit">Download</button>
                  </div>
              </td>
            </tr>
          </tbody>
        </table>
                </div>
              </div>
  );

  const renderPayments = () => (
    <div className="payments-section">
      <div className="section-header">
        <div>
      <h2>Payments & Cash Flow Management</h2>
      <p>Comprehensive payment tracking with multiple collection methods</p>
        </div>
        <button className="btn-primary" onClick={() => setShowReceiptModal(true)} disabled={loading}>
          <Receipt size={18} />
          Generate Receipt
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading payment data...</div>
          ) : payments.length === 0 ? (
            <div className="no-data">No payment transactions found</div>
          ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Property</th>
                  <th>Tenant</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                <th className="table-menu"></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={payment.ID || `payment-${index}`}>
                    <td>{new Date(payment.Date || payment.CreatedAt).toLocaleDateString()}</td>
                  <td>
                    <span className="row-primary">{payment.Property || 'Unknown'}</span>
                  </td>
                    <td>{payment.Tenant || 'Unknown'}</td>
                  <td>{payment.Amount?.toLocaleString() || 0} XOF</td>
                    <td>{payment.Method || 'Unknown'}</td>
                  <td>
                    <span className={`status-badge ${(payment.Status || 'pending').toLowerCase()}`}>
                      {payment.Status || 'Pending'}
                    </span>
                  </td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button className="table-action-button view" onClick={() => setShowReceiptModal(true)}>
                        Receipt
                      </button>
                    </div>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}
    </div>
  );

  const renderTenants = () => (
    <div className="tenants-section">
      <div className="section-header">
        <div>
          <h2>Tenant Management</h2>
        <p>Manage your tenants and their information</p>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading tenants...</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant Name</th>
                <th>Property</th>
                <th>Rent</th>
                <th>Status</th>
                <th>Contact</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="row-primary">John Doe</span>
                </td>
                <td>123 Main Street, Apt 4B</td>
                <td>1,200 XOF/month</td>
                <td>
                  <span className="status-badge active">Active</span>
                </td>
                <td>N/A</td>
                <td className="table-menu">
                  <div className="table-actions">
                    <button className="table-action-button view">View</button>
                    <button className="table-action-button edit">Contact</button>
                      </div>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="row-primary">Jane Smith</span>
                </td>
                <td>456 Oak Avenue, Unit 2</td>
                <td>900 XOF/month</td>
                <td>
                  <span className="status-badge active">Active</span>
                </td>
                <td>N/A</td>
                <td className="table-menu">
                  <div className="table-actions">
                    <button className="table-action-button view">View</button>
                    <button className="table-action-button edit">Contact</button>
                    </div>
                </td>
              </tr>
            </tbody>
          </table>
                  </div>
      )}
          </div>
        );
      
  const renderRentalManagement = () => (
    <div className="rental-section">
      <div className="section-header">
        <div>
      <h2>Rental Management</h2>
      <p>Manage your rental agreements, rent reviews, and charge adjustments</p>
              </div>
                </div>
                
      <div className="dashboard-overview">
        <div className="overview-card">
          <div className="card-label">
            <span>Generation of Lease Agreements</span>
                </div>
          <div className="card-value">
            <span>Active</span>
            <small>Create and manage lease contracts automatically</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Rent Reviews</span>
          </div>
          <div className="card-value">
            <span>Track</span>
            <small>Track and manage rent adjustments and reviews</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Adjustment of Charges</span>
          </div>
          <div className="card-value">
            <span>Available</span>
            <small>Modify utility charges and other fees</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Tenant Interface</span>
          </div>
          <div className="card-value">
            <span>Active</span>
            <small>Manage tenant communications and requests</small>
          </div>
                </div>
      </div>
                  </div>
  );

  const renderWorksAndClaims = () => (
    <div className="works-section">
      <div className="section-header">
        <div>
      <h2>Works & Interventions Management</h2>
      <p>Track maintenance works, interventions, and automatic claims management</p>
        </div>
        <button className="btn-primary" onClick={() => setShowWorkOrderModal(true)} disabled={loading}>
          <Plus size={18} />
          Create Work Order
        </button>
                </div>
                
      {loading ? (
        <div className="loading">Loading works and claims...</div>
      ) : workOrders.length === 0 && claims.length === 0 ? (
        <div className="no-data">No works or claims found</div>
      ) : (
        <>
          {workOrders.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div className="section-header" style={{ marginBottom: '20px' }}>
                <div>
                  <h2>Work Orders</h2>
                  <p>Maintenance and intervention requests</p>
                </div>
              </div>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Property</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th className="table-menu"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((work, index) => (
                      <tr key={work.ID || `work-${index}`}>
                        <td>
                          <span className="row-primary">{work.Title || work.title || 'N/A'}</span>
                        </td>
                        <td>{work.Property || work.property || 'N/A'}</td>
                        <td>{work.Description || work.description || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${(work.Status || work.status || 'pending').toLowerCase()}`}>
                            {work.Status || work.status || 'Pending'}
                          </span>
                        </td>
                        <td>{work.Date ? new Date(work.Date).toLocaleDateString() : (work.date ? new Date(work.date).toLocaleDateString() : 'N/A')}</td>
                        <td className="table-menu">
                          <div className="table-actions">
                            <button className="table-action-button view">View</button>
                            <button className="table-action-button edit">Edit</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {claims.length > 0 && (
            <div>
              <div className="section-header" style={{ marginBottom: '20px' }}>
                <div>
                  <h2>Claims</h2>
                  <p>Property claims and requests</p>
              </div>
                <button className="btn-primary" onClick={() => setShowClaimModal(true)} disabled={loading}>
                  <Plus size={18} />
                  Create Claim
                </button>
              </div>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Property</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th className="table-menu"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((claim, index) => (
                      <tr key={claim.ID || `claim-${index}`}>
                        <td>
                          <span className="row-primary">{claim.Title || claim.title || 'N/A'}</span>
                        </td>
                        <td>{claim.Property || claim.property || 'N/A'}</td>
                        <td>{claim.Description || claim.description || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${(claim.Status || claim.status || 'pending').toLowerCase()}`}>
                            {claim.Status || claim.status || 'Pending'}
                          </span>
                        </td>
                        <td>{claim.Date ? new Date(claim.Date).toLocaleDateString() : (claim.date ? new Date(claim.date).toLocaleDateString() : 'N/A')}</td>
                        <td className="table-menu">
                          <div className="table-actions">
                            <button className="table-action-button view">View</button>
                            <button className="table-action-button edit">Edit</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
          </div>
        );
      
  const renderInventory = () => (
    <div className="inventory-section">
      <div className="section-header">
        <div>
      <h2>Inventory Management</h2>
      <p>Track property inventories, equipment, and assets</p>
        </div>
        <button className="btn-primary" onClick={() => setShowInventoryModal(true)} disabled={loading}>
          <Plus size={18} />
          Add New Inventory
        </button>
                </div>
        
      {loading ? (
        <div className="loading">Loading inventory...</div>
      ) : inventory.length === 0 ? (
        <div className="no-data">No inventory found</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Condition</th>
                <th>Last Updated</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, index) => (
                <tr key={item.ID || item.id || `inventory-${index}`}>
                  <td>
                    <span className="row-primary">{item.Property || item.property || 'N/A'}</span>
                  </td>
                  <td>{item.ItemName || item.itemName || item.Name || item.name || 'N/A'}</td>
                  <td>{item.Category || item.category || 'N/A'}</td>
                  <td>{item.Quantity || item.quantity || 0}</td>
                  <td>
                    <span className={`status-badge ${(item.Condition || item.condition || 'good').toLowerCase()}`}>
                      {item.Condition || item.condition || 'Good'}
                    </span>
                  </td>
                  <td>{item.UpdatedAt ? new Date(item.UpdatedAt).toLocaleDateString() : (item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A')}</td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button className="table-action-button view">View</button>
                      <button className="table-action-button edit">Edit</button>
                      <button className="table-action-button delete">Delete</button>
                </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
              </div>
      )}
                  </div>
  );

  const renderBusinessTracking = () => (
    <div className="tracking-section">
      <div className="section-header">
        <div>
      <h2>Track Your Business</h2>
      <p>Comprehensive analytics and business performance tracking</p>
                  </div>
                </div>
                
      <div className="dashboard-overview">
        <div className="overview-card">
          <div className="card-label">
            <span>Revenue Trends</span>
                </div>
          <div className="card-value">
            <span>+12%</span>
            <small>Monthly income analysis</small>
                </div>
              </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Occupancy Rate</span>
          </div>
          <div className="card-value">
            <span>80%</span>
            <small>Average across properties</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Maintenance Costs</span>
          </div>
          <div className="card-value">
            <span>{businessTracking?.maintenanceCosts?.toLocaleString() || '2,400'} XOF</span>
            <small>This quarter</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>ROI</span>
          </div>
          <div className="card-value">
            <span>{businessTracking?.roi || '8.5'}%</span>
            <small>Return on investment</small>
          </div>
        </div>
              </div>
          </div>
        );
      
  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'properties':
        return renderProperties();
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
      case 'settings':
        return (
          <div className="embedded-settings">
            <SettingsPage />
          </div>
        );
      default:
        return renderOverview();
    }
  };

  const layoutMenu = useMemo(
    () =>
      tabs.map(tab => ({
        ...tab,
        onSelect: () => setActiveTab(tab.id),
        active: activeTab === tab.id
      })),
    [tabs, activeTab]
  );

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Landlord Portal', logo: 'SAAF', logoImage: `${process.env.PUBLIC_URL}/download.jpeg` }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}
      >
        {({ activeId }) => (
          <div className="content-body landlord-content">
            {renderContent(activeId)}
          </div>
        )}
      </RoleLayout>

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

      {/* Add Property Modal */}
      <Modal
        isOpen={showPropertyModal}
        onClose={() => setShowPropertyModal(false)}
        title="Add New Property"
        size="lg"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const propertyData = {
            address: formData.get('address'),
            type: formData.get('type'),
            bedrooms: parseInt(formData.get('bedrooms')),
            bathrooms: parseFloat(formData.get('bathrooms')),
            rent: parseFloat(formData.get('rent')),
            landlordId: 1 // Default landlord ID
          };
          handleAddProperty(propertyData);
        }}>
          <div className="form-group">
            <label>Address</label>
            <input type="text" name="address" required />
          </div>
          <div className="form-group">
            <label>Property Type</label>
            <select name="type" required>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="condo">Condo</option>
              <option value="studio">Studio</option>
            </select>
          </div>
          <div className="form-group">
            <label>Bedrooms</label>
            <input type="number" name="bedrooms" min="0" required />
          </div>
          <div className="form-group">
            <label>Bathrooms</label>
            <input type="number" name="bathrooms" min="0" step="0.5" required />
          </div>
          <div className="form-group">
            <label>Monthly Rent (XOF)</label>
            <input type="number" name="rent" min="0" step="0.01" required />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowPropertyModal(false)}>Cancel</button>
            <button type="submit" disabled={loading}>Add Property</button>
          </div>
        </form>
      </Modal>

      {/* Create Work Order Modal */}
      <Modal
        isOpen={showWorkOrderModal}
        onClose={() => setShowWorkOrderModal(false)}
        title="Create Work Order"
        size="lg"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const workOrderData = {
            property: formData.get('property'),
            type: formData.get('type'),
            priority: formData.get('priority'),
            description: formData.get('description'),
            assignedTo: formData.get('assignedTo') || null,
            amount: formData.get('amount') ? parseFloat(formData.get('amount')) : null
          };
          handleCreateWorkOrder(workOrderData);
        }}>
          <div className="form-group">
            <label>Property</label>
            <input type="text" name="property" required />
          </div>
          <div className="form-group">
            <label>Work Type</label>
            <select name="type" required>
              <option value="maintenance">Maintenance</option>
              <option value="repair">Repair</option>
              <option value="renovation">Renovation</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select name="priority" required>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" rows="4" required></textarea>
          </div>
          <div className="form-group">
            <label>Assigned To (Optional)</label>
            <input type="text" name="assignedTo" />
          </div>
          <div className="form-group">
            <label>Estimated Cost (XOF)</label>
            <input type="number" name="amount" min="0" step="0.01" />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowWorkOrderModal(false)}>Cancel</button>
            <button type="submit" disabled={loading}>Create Work Order</button>
          </div>
        </form>
      </Modal>

      {/* Create Claim Modal */}
      <Modal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        title="Create Claim"
        size="lg"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const claimData = {
            property: formData.get('property'),
            type: formData.get('type'),
            description: formData.get('description'),
            amount: formData.get('amount') ? parseFloat(formData.get('amount')) : null
          };
          handleCreateClaim(claimData);
        }}>
          <div className="form-group">
            <label>Property</label>
            <input type="text" name="property" required />
          </div>
          <div className="form-group">
            <label>Claim Type</label>
            <select name="type" required>
              <option value="damage">Damage</option>
              <option value="insurance">Insurance</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" rows="4" required></textarea>
          </div>
          <div className="form-group">
            <label>Claim Amount (XOF)</label>
            <input type="number" name="amount" min="0" step="0.01" />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowClaimModal(false)}>Cancel</button>
            <button type="submit" disabled={loading}>Create Claim</button>
          </div>
        </form>
      </Modal>

      {/* Add Inventory Modal */}
      <Modal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        title="Add Inventory"
        size="lg"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const inventoryData = {
            property: formData.get('property'),
            type: formData.get('type'),
            inspector: formData.get('inspector')
          };
          handleAddInventory(inventoryData);
        }}>
          <div className="form-group">
            <label>Property</label>
            <input type="text" name="property" required />
          </div>
          <div className="form-group">
            <label>Inventory Type</label>
            <select name="type" required>
              <option value="move-in">Move-in</option>
              <option value="move-out">Move-out</option>
              <option value="routine">Routine</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div className="form-group">
            <label>Inspector</label>
            <input type="text" name="inspector" required />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowInventoryModal(false)}>Cancel</button>
            <button type="submit" disabled={loading}>Add Inventory</button>
          </div>
        </form>
      </Modal>

      {/* Generate Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Generate Receipt"
        size="lg"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const receiptData = {
            receiptNumber: formData.get('receiptNumber'),
            date: formData.get('date'),
            landlord: formData.get('landlord'),
            property: formData.get('property'),
            tenant: formData.get('tenant'),
            amount: parseFloat(formData.get('amount')),
            period: formData.get('period'),
            description: formData.get('description')
          };
          handleGenerateReceipt(receiptData);
        }}>
          <div className="form-group">
            <label>Receipt Number</label>
            <input type="text" name="receiptNumber" placeholder="Auto-generated if empty" />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" required />
          </div>
          <div className="form-group">
            <label>Landlord</label>
            <input type="text" name="landlord" required />
          </div>
          <div className="form-group">
            <label>Property</label>
            <input type="text" name="property" required />
          </div>
          <div className="form-group">
            <label>Tenant</label>
            <input type="text" name="tenant" required />
          </div>
          <div className="form-group">
            <label>Amount (XOF)</label>
            <input type="number" name="amount" min="0" step="0.01" required />
          </div>
          <div className="form-group">
            <label>Period</label>
            <input type="text" name="period" placeholder="e.g., January 2024" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" rows="3"></textarea>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowReceiptModal(false)}>Cancel</button>
            <button type="submit" disabled={loading}>Generate Receipt</button>
          </div>
        </form>
      </Modal>

    </>
  );
};

export default LandlordDashboard;
