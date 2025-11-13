import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Users, AlertTriangle, Building, Eye, Phone, Mail, UserPlus, Upload, X, FileText, DollarSign } from 'lucide-react';
import Modal from '../components/Modal';
import DocumentUpload from '../components/DocumentUpload';
import ContractUpload from '../components/ContractUpload';
import { salesManagerService } from '../services/salesManagerService';
import { cloudinaryService, validateFileType, validateFileSize } from '../services/cloudinaryService';
import RoleLayout from '../components/RoleLayout';
import '../components/RoleLayout.css';
import '../pages/TechnicianDashboard.css';

const SalesManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showTenantCreationModal, setShowTenantCreationModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [newTenantData, setNewTenantData] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Documents
  
  // API Data States
  const [overviewData, setOverviewData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [clientStatusFilter, setClientStatusFilter] = useState('');
  const [clientPropertyFilter, setClientPropertyFilter] = useState('');
  const [clientSearchText, setClientSearchText] = useState('');

  const addNotification = (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Load data from API
  const loadData = async () => {
    setLoading(true);
    try {
      const [overview, propertiesData, clientsData, alertsData] = await Promise.all([
        salesManagerService.getOverview(),
        salesManagerService.getProperties(),
        salesManagerService.getClients(),
        salesManagerService.getAlerts(),
      ]);

      console.log('Loaded clients data:', clientsData);
      setOverviewData(overview);
      setProperties(propertiesData);
      setClients(clientsData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      addNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: TrendingUp },
      { id: 'occupancy', label: 'Occupancy', icon: Building },
      { id: 'clients', label: 'Client Management', icon: Users },
      { id: 'alerts', label: 'Alerts', icon: AlertTriangle }
    ],
    []
  );

  // No mock data - using real API data only

  const handleKycUpload = async (file, userRole) => {
    // Validate file
    if (!validateFileType(file)) {
      addNotification('Invalid file type. Please upload PDF, DOC, DOCX, or image files.', 'error');
      return;
    }
    
    if (!validateFileSize(file)) {
      addNotification('File size too large. Please upload files smaller than 10MB.', 'error');
      return;
    }

    try {
      setLoading(true);
      const uploadResult = await cloudinaryService.uploadFile(file, 'real-estate-kyc');
      
      if (uploadResult.success) {
        setUploadedDocuments(prev => [...prev, { 
          type: 'KYC', 
          file: file, 
          name: file.name,
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          size: uploadResult.size,
          uploadedAt: uploadResult.uploadedAt
        }]);
        addNotification('KYC document uploaded successfully!', 'success');
        setShowKycModal(false);
      } else {
        addNotification(`Upload failed: ${uploadResult.error}`, 'error');
      }
    } catch (error) {
      console.error('KYC upload error:', error);
      addNotification('Failed to upload KYC document', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleContractUpload = async (files, contractDetails, userRole) => {
    // Validate files
    for (const file of files) {
      if (!validateFileType(file)) {
        addNotification(`Invalid file type for ${file.name}. Please upload PDF, DOC, DOCX, or image files.`, 'error');
        return;
      }
      
      if (!validateFileSize(file)) {
        addNotification(`File size too large for ${file.name}. Please upload files smaller than 10MB.`, 'error');
        return;
      }
    }

    try {
      setLoading(true);
      const uploadResults = await cloudinaryService.uploadMultipleFiles(files, 'real-estate-contracts');
      
      const successfulUploads = uploadResults.filter(result => result.success);
      const failedUploads = uploadResults.filter(result => !result.success);
      
      if (successfulUploads.length > 0) {
        const uploadedDocs = successfulUploads.map((result, index) => ({
          type: 'Contract',
          file: files[index],
          name: files[index].name,
          url: result.url,
          publicId: result.publicId,
          size: result.size,
          uploadedAt: result.uploadedAt,
          details: contractDetails
        }));
        
        setUploadedDocuments(prev => [...prev, ...uploadedDocs]);
        addNotification(`${successfulUploads.length} contract document(s) uploaded successfully!`, 'success');
        setShowContractModal(false);
      }
      
      if (failedUploads.length > 0) {
        addNotification(`${failedUploads.length} document(s) failed to upload`, 'error');
      }
    } catch (error) {
      console.error('Contract upload error:', error);
      addNotification('Failed to upload contract documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Validate required fields
    const firstName = formData.get('firstName')?.trim();
    const lastName = formData.get('lastName')?.trim();
    const email = formData.get('email')?.trim();
    const phone = formData.get('phone')?.trim();
    const property = formData.get('property')?.trim();
    const rent = formData.get('rent');
    const moveInDate = formData.get('moveInDate');
    
    if (!firstName || !lastName || !email || !phone || !property || !rent || !moveInDate) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }
    
    const tenantData = {
      name: `${firstName} ${lastName}`,
      property: property,
      email: email,
      phone: phone,
      amount: parseFloat(rent),
      moveInDate: moveInDate,
    };
    
        try {
          setLoading(true);
          console.log('Creating client with data:', tenantData);
          const newClient = await salesManagerService.createClient(tenantData);
          console.log('Created client response:', newClient);
          setNewTenantData({ ...tenantData, id: newClient.id, documents: uploadedDocuments });
          setCurrentStep(2); // Move to document upload step
          addNotification(`Client "${tenantData.name}" created successfully!`, 'success');
        } catch (error) {
          console.error('Failed to create client:', error);
          addNotification(`Failed to create client: ${error.message || 'Unknown error'}`, 'error');
        } finally {
          setLoading(false);
        }
  };

  const finalizeTenantCreation = async () => {
    if (newTenantData) {
      try {
        setLoading(true);
        
        // Prepare document URLs for backend
        const documentUrls = uploadedDocuments.map(doc => ({
          type: doc.type,
          name: doc.name,
          url: doc.url,
          publicId: doc.publicId,
          size: doc.size,
          uploadedAt: doc.uploadedAt,
          details: doc.details || null
        }));

        // TODO: Send document URLs to backend when endpoint is created
        // const clientUpdateData = {
        //   ...newTenantData,
        //   documents: documentUrls
        // };

            // Reload data to get updated client list
            console.log('Reloading data after client creation...');
            await loadData();
        
        addNotification(`Tenant "${newTenantData.name}" created successfully with ${documentUrls.length} document(s)!`, 'success');
        
        // Reset states
        setShowTenantCreationModal(false);
        setNewTenantData(null);
        setUploadedDocuments([]);
        setCurrentStep(1);
      } catch (error) {
        console.error('Failed to finalize tenant creation:', error);
        addNotification('Failed to finalize tenant creation', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const removeDocument = (index) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
    addNotification('Document removed', 'info');
  };

  const handleUpdateAlert = async (alertId, status) => {
    try {
      await salesManagerService.updateAlert(alertId, status);
      addNotification('Alert updated successfully!', 'success');
      // Reload alerts data
      const updatedAlerts = await salesManagerService.getAlerts();
      setAlerts(updatedAlerts);
    } catch (error) {
      console.error('Failed to update alert:', error);
      addNotification('Failed to update alert', 'error');
    }
  };

  const renderOverview = () => {
    if (loading) {
      return <div className="loading">Loading overview data...</div>;
    }

    const data = overviewData || {
      occupancyRate: 0,
      totalProperties: 0,
      occupiedProperties: 0,
      activeClients: 0,
      unpaidCount: 0,
      unpaidAmount: 0,
    };

    return (
      <div className="overview-section panel">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Building size={24} />
            </div>
            <div className="stat-content">
              <h3>Global Occupancy Rate</h3>
              <p>Properties occupied</p>
              <span className="stat-value">{data.occupancyRate?.toFixed(0) || 0}%</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>Total Active Tenants</h3>
              <p>Currently renting</p>
              <span className="stat-value">{data.activeClients || 0}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <h3>Number of Unpaid Accounts</h3>
              <p>Overdue payments</p>
              <span className="stat-value">{data.unpaidCount || 0}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h3>Total Unpaid Rent Amount</h3>
              <p>Outstanding balance</p>
              <span className="stat-value">{data.unpaidAmount?.toFixed(0) || 0} XOF</span>
            </div>
          </div>
        </div>

      <div className="alert-summary">
        <h3>Priority Alerts</h3>
        <div className="alert-list">
          {alerts.length > 0 ? (
            alerts.filter(alert => alert.Urgency === 'urgent' || alert.Urgency === 'high').map(alert => (
              <div key={alert.ID} className={`alert-item ${alert.Urgency}`}>
                <AlertTriangle size={20} />
                <div className="alert-content">
                  <h4>{alert.Title}</h4>
                  <p>{alert.Message}</p>
                </div>
                <button className="btn-primary">Contact</button>
              </div>
            ))
          ) : (
            <div className="no-alerts">No priority alerts at the moment.</div>
          )}
        </div>
      </div>
    </div>
  );
  };

  const renderOccupancy = () => {
    const totalProperties = properties.length;
    const occupiedCount = properties.filter(
      property => ((property.Status || '').toLowerCase() === 'occupied')
    ).length;
    const vacantCount = properties.filter(
      property => ((property.Status || '').toLowerCase() === 'vacant')
    ).length;
    const occupancyRate = totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : 0;

    return (
      <div className="occupancy-section panel">
        <div className="section-header">
          <h3>Property Occupancy Overview</h3>
          <p>Monitor occupancy status and manage vacant properties</p>
        </div>

        <div className="occupancy-overview-cards">
          <div className="stat-card">
            <div className="stat-icon">
              <Building size={24} />
            </div>
            <div className="stat-content">
              <h3>Total Properties</h3>
              <span className="stat-value">{totalProperties}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>Occupied</h3>
              <span className="stat-value positive">{occupiedCount}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon overdue">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <h3>Vacant</h3>
              <span className="stat-value overdue">{vacantCount}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h3>Occupancy Rate</h3>
              <span className="stat-value">{occupancyRate}%</span>
            </div>
          </div>
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

        <div className="clients-table">
          <table>
            <thead>
              <tr>
                <th>Property Address</th>
                <th>Type</th>
                <th>Status</th>
                <th>Tenant</th>
                <th>Rent</th>
                <th>Urgency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.length > 0 ? (
                properties.map(property => (
                  <tr key={property.ID}>
                    <td>{property.Address || 'N/A'}</td>
                    <td>{property.Type || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${(property.Status || 'Unknown').toLowerCase()}`}>
                        {property.Status || 'Unknown'}
                      </span>
                    </td>
                    <td>{property.Tenant || 'No tenant'}</td>
                    <td>{property.Rent ? `${property.Rent} XOF/month` : 'N/A'}</td>
                    <td>
                      {property.Urgency ? (
                        <span className={`status-badge ${property.Urgency.toLowerCase()}`}>
                          {property.Urgency}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      <button className="table-action-button view">
                        <Eye size={14} />
                      </button>
                      {property.Status === 'Vacant' && (
                        <button className="table-action-button edit">List for Rent</button>
                      )}
                      {property.Tenant && (
                        <button className="table-action-button contact">
                          <Phone size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">No properties found. Start the backend to see real data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Get unique properties from clients for filter dropdown
  const uniqueProperties = useMemo(() => {
    const props = new Set();
    clients.forEach(client => {
      if (client.Property) {
        props.add(client.Property);
      }
    });
    return Array.from(props).sort();
  }, [clients]);

  // Filter clients based on filters
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Status filter
      if (clientStatusFilter) {
        const clientStatus = (client.Status || '').toLowerCase().replace(' ', '-');
        const filterStatus = clientStatusFilter.toLowerCase();
        if (clientStatus !== filterStatus && !clientStatus.includes(filterStatus)) {
          return false;
        }
      }

      // Property filter
      if (clientPropertyFilter) {
        const clientProperty = (client.Property || '').toLowerCase();
        const filterProperty = clientPropertyFilter.toLowerCase();
        if (clientProperty !== filterProperty && !clientProperty.includes(filterProperty)) {
          return false;
        }
      }

      // Search text filter
      if (clientSearchText) {
        const searchLower = clientSearchText.toLowerCase();
        const name = (client.Name || '').toLowerCase();
        const email = (client.Email || '').toLowerCase();
        const phone = (client.Phone || '').toLowerCase();
        
        if (!name.includes(searchLower) && !email.includes(searchLower) && !phone.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [clients, clientStatusFilter, clientPropertyFilter, clientSearchText]);

  const renderClients = () => (
    <div className="clients-section panel">
      <div className="section-header">
        <h3>Centralized Client/Tenant Profile Management</h3>
        <p>Manage all tenant profiles and track their status</p>
      </div>

      <div className="clients-overview-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Active Tenants</h3>
            <span className="stat-value positive">{filteredClients.filter(client => client.Status === 'Active').length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon overdue">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>Overdue Accounts</h3>
            <span className="stat-value overdue">{filteredClients.filter(client => client.Status === 'Overdue').length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <UserPlus size={24} />
          </div>
          <div className="stat-content">
            <h3>Waiting List</h3>
            <span className="stat-value">{filteredClients.filter(client => client.Status === 'Waiting List').length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Monthly Revenue</h3>
            <span className="stat-value">
              {filteredClients.reduce(
                (sum, client) => sum + (client.Amount || client.amount || 0),
                0
              ).toLocaleString()} XOF
            </span>
          </div>
        </div>
      </div>

      <div className="client-actions">
        <button className="action-button primary" onClick={() => setShowTenantCreationModal(true)}>
          <UserPlus size={20} />
          Create New Tenant
        </button>
      </div>

      <div className="client-filters">
        <select 
          className="filter-select"
          value={clientStatusFilter}
          onChange={(e) => setClientStatusFilter(e.target.value)}
        >
          <option value="">All Client Status</option>
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="waiting-list">Waiting List</option>
          <option value="waiting list">Waiting List</option>
          <option value="inactive">Inactive</option>
        </select>
        <select 
          className="filter-select"
          value={clientPropertyFilter}
          onChange={(e) => setClientPropertyFilter(e.target.value)}
        >
          <option value="">All Properties</option>
          {uniqueProperties.map((property, idx) => (
            <option key={`property-option-${idx}`} value={property}>{property}</option>
          ))}
        </select>
        <input 
          type="text" 
          placeholder="Search by name..."
          className="search-input"
          value={clientSearchText}
          onChange={(e) => setClientSearchText(e.target.value)}
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
            {filteredClients.length > 0 ? (
              filteredClients.map(client => (
              <tr key={client.ID}>
                <td>{client.Name || 'N/A'}</td>
                <td>{client.Property || 'N/A'}</td>
                <td>
                  <span className={`status-badge ${(client.Status || 'Unknown').toLowerCase().replace(' ', '-')}`}>
                    {client.Status || 'Unknown'}
                  </span>
                </td>
                <td>{client.LastPayment ? new Date(client.LastPayment).toLocaleDateString() : 'N/A'}</td>
                <td>{client.Amount || 0} XOF</td>
                <td>
                  <div className="contact-info">
                    <span className="phone">{client.Phone || 'N/A'}</span>
                    <span className="email">{client.Email || 'N/A'}</span>
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
            ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">No clients found. Start the backend to see real data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );

  const renderAlerts = () => (
    <div className="alerts-section panel">
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
        <input type="text" placeholder="Search alerts..." className="search-input" />
      </div>

      <div className="alerts-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Property</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Created</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length > 0 ? (
              alerts.map(alert => (
                <tr key={alert.ID}>
                  <td>
                    <span className="row-primary">{alert.Title}</span>
                    <span className="row-secondary">{alert.Message}</span>
                  </td>
                  <td>{alert.Property || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${alert.Urgency?.toLowerCase()}`}>
                      {alert.Urgency || 'Normal'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${alert.Status?.toLowerCase()}`}>
                      {alert.Status || 'Open'}
                    </span>
                  </td>
                  <td>{alert.CreatedAt ? new Date(alert.CreatedAt).toLocaleDateString() : 'N/A'}</td>
                  <td>{alert.Amount ? `${alert.Amount} XOF` : '—'}</td>
                  <td className="table-actions">
                    <button className="table-action-button view">View</button>
                    <button
                      className="table-action-button edit"
                      onClick={() => handleUpdateAlert(alert.ID, 'Resolved')}
                    >
                      Mark Resolved
                    </button>
                    <button className="table-action-button contact">
                      <Phone size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">No alerts found. Start the backend to see real data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Commercial Team', logo: 'SAAF', logoImage: `${process.env.PUBLIC_URL}/download.jpeg` }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}
      >
        {({ activeId }) => (
          <div className="sales-manager-dashboard">
            {loading && <div className="loading-indicator">Loading data...</div>}
            <div className="sales-manager-content">
              {renderContent(activeId || activeTab)}
            </div>
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
                        {properties.length > 0 ? (
                          properties.map(property => (
                            <option key={property.ID} value={property.Address}>
                              {property.Address} - {property.Type}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No properties available. Start backend to load properties.</option>
                        )}
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
                    <button type="submit" className="action-button primary" disabled={loading}>
                      {loading ? 'Creating Client...' : 'Next: Upload Documents'}
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
                    <p><strong>Rent:</strong> {newTenantData?.amount?.toFixed(2)} XOF</p>
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
                            <div className="document-info">
                              <span className="document-name">{doc.type}: {doc.name || doc.details?.contractType || 'Contract'}</span>
                              {doc.url && (
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="document-link"
                                >
                                  View Document
                                </a>
                              )}
                              {doc.size && (
                                <span className="document-size">({(doc.size / 1024).toFixed(1)} KB)</span>
                              )}
                            </div>
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
                      disabled={loading}
                    >
                      {loading ? 'Finalizing...' : 'Create Tenant Account'}
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
    </>
  );
};

export default SalesManagerDashboard;