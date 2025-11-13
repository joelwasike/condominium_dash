import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Users,
  Settings,
  BarChart3,
  Database,
  Shield,
  DollarSign,
  Home,
  Wrench,
  FileText,
  UserPlus,
  Plus,
  Save,
  Download,
  Upload,
  Lock,
  Activity,
  Receipt,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import { superAdminService } from '../services/superAdminService';
import RoleLayout from '../components/RoleLayout';
import '../components/RoleLayout.css';
import './SuperAdminDashboard.css';
import '../pages/TechnicianDashboard.css';
import SettingsPage from './SettingsPage';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [worksData, setWorksData] = useState([]);
  const [accountingOverview, setAccountingOverview] = useState(null);
  const [accountingTenantPayments, setAccountingTenantPayments] = useState([]);
  const [accountingLandlordPayments, setAccountingLandlordPayments] = useState([]);
  const [accountingCollections, setAccountingCollections] = useState([]);
  const [accountingExpenses, setAccountingExpenses] = useState([]);
  const [accountingTab, setAccountingTab] = useState('tenant-payments');
  
  // Filter states
  const [userCompanyFilter, setUserCompanyFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearchText, setUserSearchText] = useState('');
  const [propertyCompanyFilter, setPropertyCompanyFilter] = useState('');
  const [propertyStatusFilter, setPropertyStatusFilter] = useState('');
  
  // Modal states
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showSystemConfigModal, setShowSystemConfigModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const resolveCompanyName = useCallback(
    (value) => {
      if (!value) return '';
      const valueString = String(value);
      const byId = companies.find(company => String(company.ID || company.id) === valueString);
      if (byId) return byId.Name || byId.name;
      const byName = companies.find(company => (company.Name || company.name) === value);
      return byName ? byName.Name || byName.name : value;
    },
    [companies]
  );

  const resolveCompanyId = useCallback(
    (value) => {
      if (!value) return '';
      const valueString = String(value);
      const byId = companies.find(company => String(company.ID || company.id) === valueString);
      if (byId) return String(byId.ID || byId.id);
      const byName = companies.find(company => (company.Name || company.name) === value);
      return byName ? String(byName.ID || byName.id) : '';
    },
    [companies]
  );

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Load data from backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, companiesData, usersData, propertiesData, financial, works, accountingOverviewData, tenantPaymentsData, landlordPaymentsData, collectionsData, expensesData] = await Promise.all([
        superAdminService.getOverview(),
        superAdminService.getCompanies(),
        superAdminService.getUsers(),
        superAdminService.getProperties(),
        superAdminService.getFinancialOverview(),
        superAdminService.getWorks(),
        superAdminService.getAccountingOverview(),
        superAdminService.getTenantPayments(),
        superAdminService.getLandlordPayments(),
        superAdminService.getCollections(),
        superAdminService.getExpenses()
      ]);

      setOverviewData(overview);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      setFinancialData(financial);
      setWorksData(works);
      setAccountingOverview(accountingOverviewData);
      setAccountingTenantPayments(Array.isArray(tenantPaymentsData) ? tenantPaymentsData : []);
      setAccountingLandlordPayments(Array.isArray(landlordPaymentsData) ? landlordPaymentsData : []);
      setAccountingCollections(Array.isArray(collectionsData) ? collectionsData : []);
      setAccountingExpenses(Array.isArray(expensesData) ? expensesData : []);
    } catch (error) {
      console.error('Error loading super admin data:', error);
      addNotification('Failed to load data from server', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper function to get CSS class for source badges
  const getSourceClass = (source) => {
    if (!source) return 'super-admin';
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('commercial')) return 'commercial';
    if (sourceLower.includes('landlord')) return 'landlord';
    if (sourceLower.includes('technical')) return 'technical';
    if (sourceLower.includes('accounting')) return 'accounting';
    return 'super-admin';
  };

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'System Overview', icon: BarChart3 },
      { id: 'companies', label: 'Company Management', icon: Building2 },
      { id: 'users', label: 'All Users', icon: Users },
      { id: 'properties', label: 'All Properties', icon: Home },
      { id: 'financial', label: 'Financial Overview', icon: DollarSign },
      { id: 'accounting', label: 'Accounting', icon: Receipt },
      { id: 'works', label: 'All Works & Claims', icon: Wrench },
      { id: 'settings', label: 'Profile Settings', icon: Settings }
    ],
    []
  );

  const layoutMenu = useMemo(
    () =>
      tabs.map(tab => ({
        ...tab,
        onSelect: () => setActiveTab(tab.id),
        active: activeTab === tab.id
      })),
    [tabs, activeTab]
  );

  const handleDeleteCompany = async (companyId, companyName) => {
    if (window.confirm(`Are you sure you want to delete "${companyName}"? This action cannot be undone and will remove all associated data.`)) {
      try {
        await superAdminService.deleteCompany(companyId);
        await loadData(); // Reload data
        addNotification(`Company "${companyName}" has been deleted successfully.`, 'success');
      } catch (error) {
        console.error('Error deleting company:', error);
        addNotification('Failed to delete company', 'error');
      }
    }
  };

  const handleDeactivateCompany = (company) => {
    setSelectedCompany(company);
    setDeactivationReason('');
    setShowDeactivationModal(true);
  };

  const confirmDeactivation = async () => {
    if (!deactivationReason.trim()) {
      addNotification('Please provide a reason for deactivation.', 'warning');
      return;
    }

    try {
      await superAdminService.deactivateCompany(selectedCompany.ID || selectedCompany.id, deactivationReason);
      await loadData(); // Reload data
      setShowDeactivationModal(false);
      setSelectedCompany(null);
      setDeactivationReason('');
      addNotification(`Company "${selectedCompany.Name || selectedCompany.name}" has been deactivated successfully.`, 'success');
    } catch (error) {
      console.error('Error deactivating company:', error);
      addNotification('Failed to deactivate company', 'error');
    }
  };

  const handleReactivateCompany = async (companyId, companyName) => {
    if (window.confirm(`Are you sure you want to reactivate "${companyName}"?`)) {
      try {
        await superAdminService.reactivateCompany(companyId);
        await loadData(); // Reload data
        addNotification(`Company "${companyName}" has been reactivated successfully.`, 'success');
      } catch (error) {
        console.error('Error reactivating company:', error);
        addNotification('Failed to reactivate company', 'error');
      }
    }
  };

  const openAddCompanyModal = () => {
    setEditingCompany(null);
    setShowCompanyModal(true);
  };

  const openEditCompanyModal = (company) => {
    setEditingCompany(company);
    setShowCompanyModal(true);
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const companyData = {
      name: formData.get('companyName'),
      description: formData.get('description'),
      address: formData.get('address'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      status: 'Active'
    };
    
    try {
      if (editingCompany) {
        await superAdminService.updateCompany(editingCompany.ID || editingCompany.id, companyData);
        addNotification(`Company "${companyData.name}" updated successfully!`, 'success');
      } else {
        await superAdminService.addCompany(companyData);
        addNotification(`Company "${companyData.name}" added successfully!`, 'success');
      }
      await loadData();
      setShowCompanyModal(false);
      setEditingCompany(null);
    } catch (error) {
      console.error('Error adding company:', error);
      addNotification('Failed to save company', 'error');
    }
  };

  const openAddUserModal = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  const openEditUserModal = (user) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const companyId = formData.get('userCompany');
    const companyName = resolveCompanyName(companyId);
    const userData = {
      name: formData.get('userName'),
      email: formData.get('userEmail'),
      companyId,
      company: companyName,
      role: formData.get('userRole'),
      phone: formData.get('userPhone')
    };
    const password = formData.get('userPassword');
    if (!editingUser && password) {
      userData.password = password;
    }
    
    try {
      if (editingUser) {
        await superAdminService.updateUser(editingUser.ID || editingUser.id, userData);
        addNotification(`User "${userData.name}" updated successfully!`, 'success');
      } else {
        await superAdminService.addUser({ ...userData, password });
        addNotification(`User "${userData.name}" created successfully! Login credentials have been set.`, 'success');
      }
      await loadData();
      setShowUserModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error adding user:', error);
      addNotification('Failed to save user: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user) return;
    if (window.confirm(`Are you sure you want to delete "${user.Name || user.name}"? This action cannot be undone.`)) {
      try {
        await superAdminService.deleteUser(user.ID || user.id);
        await loadData();
        addNotification(`User "${user.Name || user.name}" deleted successfully.`, 'success');
      } catch (error) {
        console.error('Error deleting user:', error);
        addNotification('Failed to delete user', 'error');
      }
    }
  };

  const openAddPropertyModal = () => {
    setEditingProperty(null);
    setShowPropertyModal(true);
  };

  const openEditPropertyModal = (property) => {
    setEditingProperty(property);
    setShowPropertyModal(true);
  };

  const handlePropertySubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const companyId = formData.get('propertyCompany');
    const companyName = resolveCompanyName(companyId);
    const propertyData = {
      address: formData.get('propertyAddress'),
      companyId,
      company: companyName,
      type: formData.get('propertyType'),
      rent: parseFloat(formData.get('propertyRent')),
      bedrooms: parseInt(formData.get('bedrooms'), 10),
      bathrooms: parseInt(formData.get('bathrooms'), 10),
      status: formData.get('propertyStatus') || 'Vacant'
    };

    try {
      if (editingProperty) {
        await superAdminService.updateProperty(editingProperty.ID || editingProperty.id, propertyData);
        addNotification(`Property "${propertyData.address}" updated successfully!`, 'success');
      } else {
        await superAdminService.addProperty(propertyData);
        addNotification(`Property "${propertyData.address}" added successfully!`, 'success');
      }
      await loadData();
      setShowPropertyModal(false);
      setEditingProperty(null);
    } catch (error) {
      console.error('Error saving property:', error);
      addNotification('Failed to save property', 'error');
    }
  };

  const handleDeleteProperty = async (property) => {
    if (!property) return;
    const name = property.Address || property.address || 'this property';
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        await superAdminService.deleteProperty(property.ID || property.id);
        await loadData();
        addNotification(`Property "${name}" deleted successfully.`, 'success');
      } catch (error) {
        console.error('Error deleting property:', error);
        addNotification('Failed to delete property', 'error');
      }
    }
  };

  const renderOverview = () => {
    if (loading) {
      return <div className="loading">Loading overview data...</div>;
    }

    return (
      <div className="dashboard-overview">
        <div className="overview-card">
          <div className="card-label">
            <span>Total Companies</span>
            <span className="card-trend positive">
              <Shield size={16} />
            </span>
          </div>
          <div className="card-value">
            <span>{overviewData?.totalCompanies || 0}</span>
            <small>Active organizations</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Total Users</span>
            <span className="card-trend positive">
              <Users size={16} />
            </span>
          </div>
          <div className="card-value">
            <span>{overviewData?.totalUsers || 0}</span>
            <small>Across all companies</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Total Properties</span>
            <span className="card-trend positive">
              <Home size={16} />
            </span>
          </div>
          <div className="card-value">
            <span>{overviewData?.totalProperties || 0}</span>
            <small>Under management</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Total Revenue</span>
            <span className="card-trend positive">
              <DollarSign size={16} />
            </span>
          </div>
          <div className="card-value">
            <span>{overviewData?.totalRevenue?.toLocaleString() || 0} XOF</span>
            <small>This month</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Active Works</span>
            <span className="card-trend neutral">
              <Wrench size={16} />
            </span>
          </div>
          <div className="card-value">
            <span>{overviewData?.activeWorks || 0}</span>
            <small>Ongoing interventions</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Pending Claims</span>
            <span className="card-trend neutral">
              <FileText size={16} />
            </span>
          </div>
          <div className="card-value">
            <span>{overviewData?.pendingClaims || 0}</span>
            <small>Awaiting resolution</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>System Health</span>
            <span className="card-trend positive">
              <BarChart3 size={16} />
            </span>
          </div>
          <div className="card-value">
            <span>{overviewData?.systemHealth || 98}%</span>
            <small>Uptime</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Storage Used</span>
            <span className="card-trend neutral">
              <Database size={16} />
            </span>
          </div>
          <div className="card-value">
            <span>{overviewData?.storageUsed || '245 GB'}</span>
            <small>Of 1 TB</small>
          </div>
        </div>
      </div>
    );
  };

  const renderCompanies = () => (
    <div className="companies-section">
      <div className="section-header">
        <div>
          <h2>Company Management</h2>
          <p>Manage all companies in the system with full administrative control</p>
        </div>
        <button className="btn-primary" onClick={openAddCompanyModal} disabled={loading}>
          <Building2 size={18} />
          Add New Company
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading companies...</div>
      ) : companies.length === 0 ? (
        <div className="no-data">No companies found</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="table-select">
                  <label className="checkbox">
                    <input type="checkbox" />
                    <span />
                  </label>
                </th>
                <th>Company Name</th>
                <th>Users</th>
                <th>Properties</th>
                <th>Status</th>
                <th>Monthly Revenue</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company, index) => (
                <tr key={`company-${company.ID || company.id || index}`}>
                  <td className="table-select">
                    <label className="checkbox">
                      <input type="checkbox" />
                      <span />
                    </label>
                  </td>
                  <td>
                    <span className="row-primary">{company.Name || company.name}</span>
                    <span className="row-secondary">{company.Description || company.description || '—'}</span>
                  </td>
                  <td>{company.Users || company.users || 0}</td>
                  <td>{company.Properties || company.properties || 0}</td>
                  <td>
                    <span className={`status-badge ${(company.Status || company.status || 'active').toLowerCase()}`}>
                      {company.Status || company.status || 'Active'}
                    </span>
                  </td>
                  <td>{company.Revenue || company.revenue || 0} XOF</td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button
                        className="table-action-button edit"
                        onClick={() => openEditCompanyModal(company)}
                      >
                        Edit
                      </button>
                      {(company.Status || company.status || 'Active') === 'Active' ? (
                        <button
                          className="table-action-button edit"
                          onClick={() => handleDeactivateCompany(company)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          className="table-action-button edit"
                          onClick={() => handleReactivateCompany(company.ID || company.id, company.Name || company.name)}
                        >
                          Reactivate
                        </button>
                      )}
                      <button
                        className="table-action-button quote"
                        onClick={() => handleDeleteCompany(company.ID || company.id, company.Name || company.name)}
                      >
                        Delete
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

  // Filter users based on filters
  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) {
      return [];
    }
    return users.filter(user => {
      // Company filter - compare by company name since user.Company is a name string
      if (userCompanyFilter) {
        // Get the company name from the selected company ID
        const selectedCompany = companies.find(c => String(c.ID || c.id) === String(userCompanyFilter));
        const selectedCompanyName = selectedCompany ? (selectedCompany.Name || selectedCompany.name) : '';
        
        // Get the user's company name
        const userCompanyName = (user.Company || user.company || '').trim();
        
        // Compare company names (case-insensitive)
        if (selectedCompanyName && userCompanyName.toLowerCase() !== selectedCompanyName.toLowerCase()) {
          return false;
        }
      }

      // Role filter
      if (userRoleFilter) {
        const userRole = (user.Role || user.role || '').toLowerCase();
        const filterRole = userRoleFilter.toLowerCase();
        if (userRole !== filterRole && !userRole.includes(filterRole)) {
          return false;
        }
      }

      // Search text filter
      if (userSearchText) {
        const searchLower = userSearchText.toLowerCase();
        const name = (user.Name || user.name || '').toLowerCase();
        const email = (user.Email || user.email || '').toLowerCase();
        const phone = (user.Phone || user.phone || '').toLowerCase();
        
        if (!name.includes(searchLower) && !email.includes(searchLower) && !phone.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [users, userCompanyFilter, userRoleFilter, userSearchText]);

  const renderAllUsers = () => (
    <div className="users-section">
      <div className="section-header">
        <div>
          <h2>All System Users</h2>
          <p>View and manage all users across all companies</p>
        </div>
        <button className="btn-primary" onClick={openAddUserModal} disabled={loading}>
          <UserPlus size={18} />
          Add New User
        </button>
      </div>
      
      <div className="users-filters">
        <select 
          className="filter-select"
          value={userCompanyFilter}
          onChange={(e) => setUserCompanyFilter(e.target.value)}
        >
          <option value="">All Companies</option>
          {companies.map((c, idx) => (
            <option key={`company-option-${c.ID || c.id || idx}`} value={c.ID || c.id}>{c.Name || c.name}</option>
          ))}
        </select>
        <select 
          className="filter-select"
          value={userRoleFilter}
          onChange={(e) => setUserRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="tenant">Tenant</option>
          <option value="commercial">Commercial</option>
          <option value="admin">Administrative Agent</option>
          <option value="accounting">Accounting</option>
          <option value="salesmanager">Sales Manager</option>
          <option value="technician">Technical Manager</option>
          <option value="landlord">Landlord</option>
        </select>
        <input 
          type="text" 
          placeholder="Search users..." 
          className="filter-select" 
          value={userSearchText}
          onChange={(e) => setUserSearchText(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="no-data">No users found</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="table-select">
                  <label className="checkbox">
                    <input type="checkbox" />
                    <span />
                  </label>
                </th>
                <th>User</th>
                <th>Email</th>
                <th>Company</th>
                <th>Role</th>
                <th>Last Login</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={`user-${user.ID || user.id || index}`}>
                  <td className="table-select">
                    <label className="checkbox">
                      <input type="checkbox" />
                      <span />
                    </label>
                  </td>
                  <td>
                    <span className="row-primary">{user.Name || user.name}</span>
                    <span className="row-secondary">{user.Phone || user.phone || 'No phone'}</span>
                  </td>
                  <td>{user.Email || user.email}</td>
                  <td>{resolveCompanyName(user.companyId || user.CompanyID || user.Company || user.company)}</td>
                  <td>{user.Role || user.role}</td>
                  <td>{user.LastLogin || user.lastLogin || 'Never'}</td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button className="table-action-button edit" onClick={() => openEditUserModal(user)}>Edit</button>
                      <button className="table-action-button delete" onClick={() => handleDeleteUser(user)}>Delete</button>
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

  // Filter properties based on filters
  const filteredProperties = useMemo(() => {
    if (!properties || !Array.isArray(properties)) {
      return [];
    }
    return properties.filter(property => {
      // Company filter - compare by company name since property.Company might be a name string
      if (propertyCompanyFilter) {
        // Get the company name from the selected company ID
        const selectedCompany = companies.find(c => String(c.ID || c.id) === String(propertyCompanyFilter));
        const selectedCompanyName = selectedCompany ? (selectedCompany.Name || selectedCompany.name) : '';
        
        // Get the property's company (could be ID or name)
        const propertyCompany = String(property.companyId || property.CompanyID || property.Company || property.company || '').trim();
        
        // Try to match by ID first, then by name
        const propertyCompanyId = String(property.companyId || property.CompanyID || '');
        const propertyCompanyName = (property.Company || property.company || '').trim();
        
        // Compare: either ID matches or name matches (case-insensitive)
        const idMatches = propertyCompanyId && propertyCompanyId === String(propertyCompanyFilter);
        const nameMatches = selectedCompanyName && propertyCompanyName && 
          propertyCompanyName.toLowerCase() === selectedCompanyName.toLowerCase();
        
        if (!idMatches && !nameMatches) {
          return false;
        }
      }

      // Status filter
      if (propertyStatusFilter) {
        const propertyStatus = (property.Status || property.status || '').toLowerCase();
        const filterStatus = propertyStatusFilter.toLowerCase();
        if (propertyStatus !== filterStatus && !propertyStatus.includes(filterStatus)) {
          return false;
        }
      }

      return true;
    });
  }, [properties, propertyCompanyFilter, propertyStatusFilter]);

  const renderAllProperties = () => (
    <div className="properties-section">
      <div className="section-header">
        <div>
          <h2>All Properties</h2>
          <p>System-wide property overview across all companies</p>
        </div>
        <button className="btn-primary" onClick={openAddPropertyModal} disabled={loading}>
          <Plus size={18} />
          Add Property
        </button>
      </div>
      
      <div className="properties-filters" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select 
          className="filter-select"
          value={propertyCompanyFilter}
          onChange={(e) => setPropertyCompanyFilter(e.target.value)}
        >
          <option value="">All Companies</option>
          {companies.map((c, idx) => (
            <option key={`property-company-option-${c.ID || c.id || idx}`} value={c.ID || c.id}>{c.Name || c.name}</option>
          ))}
        </select>
        <select 
          className="filter-select"
          value={propertyStatusFilter}
          onChange={(e) => setPropertyStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="occupied">Occupied</option>
          <option value="vacant">Vacant</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>
      
      <div className="dashboard-overview">
        <div className="overview-card">
          <div className="card-label">
            <span>Total Properties</span>
          </div>
          <div className="card-value">
            <span>{filteredProperties.length}</span>
            <small>In the network</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Occupied</span>
          </div>
          <div className="card-value">
            <span>{filteredProperties.filter(p => (p.Status || p.status) === 'Occupied').length}</span>
            <small>Currently rented</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Vacant</span>
          </div>
          <div className="card-value">
            <span>{filteredProperties.filter(p => (p.Status || p.status) === 'Vacant').length}</span>
            <small>Available units</small>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-label">
            <span>Avg Occupancy</span>
          </div>
          <div className="card-value">
            <span>
              {filteredProperties.length > 0
                ? Math.round(
                    (filteredProperties.filter(p => (p.Status || p.status) === 'Occupied').length / filteredProperties.length) * 100
                  )
                : 0}
              %
            </span>
            <small>Portfolio-wide</small>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading properties...</div>
      ) : filteredProperties.length === 0 ? (
        <div className="no-data">No properties found</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="table-select">
                  <label className="checkbox">
                    <input type="checkbox" />
                    <span />
                  </label>
                </th>
                <th>Property</th>
                <th>Company</th>
                <th>Status</th>
                <th>Rent</th>
                <th>Tenant</th>
                <th>Source</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((property, index) => (
                <tr key={`property-${property.ID || property.id || 'no-id'}-${index}`}>
                  <td className="table-select">
                    <label className="checkbox">
                      <input type="checkbox" />
                      <span />
                    </label>
                  </td>
                  <td>
                    <span className="row-primary">{property.Address || property.address}</span>
                    <span className="row-secondary">{property.Type || property.type}</span>
                  </td>
                  <td>{resolveCompanyName(property.companyId || property.CompanyID || property.Company || property.company)}</td>
                  <td>
                    <span className={`status-badge ${(property.Status || property.status || 'vacant').toLowerCase()}`}>
                      {property.Status || property.status || 'Vacant'}
                    </span>
                  </td>
                  <td>{property.Rent || property.rent || 0} XOF/mo</td>
                  <td>{property.Tenant || property.tenant || '-'}</td>
                  <td>
                    <span className={`source-badge ${getSourceClass(property.Source)}`}>
                      {property.Source || 'Super Admin'}
                    </span>
                  </td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button className="table-action-button edit" onClick={() => openEditPropertyModal(property)}>Edit</button>
                      <button className="table-action-button delete" onClick={() => handleDeleteProperty(property)}>Delete</button>
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

  const renderFinancial = () => (
    <div className="financial-section">
      <h2>Financial Overview</h2>
      <p>System-wide financial metrics and cash flow</p>
      
      {loading ? (
        <div className="loading">Loading financial data...</div>
      ) : (
        <div className="financial-stats">
          <div className="stat-card modern-card">
            <h3>Total Revenue</h3>
            <span className="stat-value">{financialData?.totalRevenue?.toLocaleString() || 0} XOF</span>
            <p>From all payments</p>
          </div>
          <div className="stat-card modern-card">
            <h3>Total Expenses</h3>
            <span className="stat-value">{financialData?.totalExpenses?.toLocaleString() || 0} XOF</span>
            <p>System-wide expenses</p>
          </div>
          <div className="stat-card modern-card">
            <h3>Net Profit</h3>
            <span className="stat-value">{financialData?.netProfit?.toLocaleString() || 0} XOF</span>
            <p>Revenue - Expenses</p>
          </div>
          <div className="stat-card modern-card">
            <h3>Collections</h3>
            <span className="stat-value">{financialData?.totalCollections?.toLocaleString() || 0} XOF</span>
            <p>Rent & deposits</p>
          </div>
          <div className="stat-card modern-card">
            <h3>Commission</h3>
            <span className="stat-value">{financialData?.commission?.toLocaleString() || 0} XOF</span>
            <p>10% avg commission</p>
          </div>
          <div className="stat-card modern-card">
            <h3>Pending Payments</h3>
            <span className="stat-value">{financialData?.pendingPayments?.toLocaleString() || 0} XOF</span>
            <p>Across all companies</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderWorks = () => (
    <div className="works-section">
      <h2>All Works & Claims</h2>
      <p>System-wide maintenance and claims overview</p>
      
      {loading ? (
        <div className="loading">Loading works data...</div>
      ) : (
        <>
          <div className="works-stats">
            <div className="stat-card modern-card">
              <h3>Active Works</h3>
              <span className="stat-value">{worksData.filter(w => (w.Status || w.status) === 'Active').length}</span>
            </div>
            <div className="stat-card modern-card">
              <h3>Pending Claims</h3>
              <span className="stat-value">{worksData.filter(w => (w.Status || w.status) === 'Pending').length}</span>
            </div>
            <div className="stat-card modern-card">
              <h3>Completed This Month</h3>
              <span className="stat-value">{worksData.filter(w => (w.Status || w.status) === 'Completed').length}</span>
            </div>
            <div className="stat-card modern-card">
              <h3>Avg Resolution Time</h3>
              <span className="stat-value">3.2 days</span>
            </div>
          </div>

          {worksData.length === 0 ? (
            <div className="no-data">No works found</div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="table-select">
                      <label className="checkbox">
                        <input type="checkbox" />
                        <span />
                      </label>
                    </th>
                    <th>Work Order</th>
                    <th>Company</th>
                    <th>Property</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {worksData.map((work, workIndex) => (
                    <tr key={`work-${work.ID || work.id || 'no-id'}-${workIndex}`}>
                      <td className="table-select">
                        <label className="checkbox">
                          <input type="checkbox" />
                          <span />
                        </label>
                      </td>
                      <td>#{work.ID || work.id}</td>
                      <td>{work.Company || work.company}</td>
                      <td>{work.Property || work.property}</td>
                      <td>{work.Type || work.type}</td>
                      <td>
                        <span className={`status-badge ${(work.Status || work.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                          {work.Status || work.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <span className={`severity-chip ${(work.Priority || work.priority || 'medium').toLowerCase()}`}>
                          {work.Priority || work.priority || 'Medium'}
                        </span>
                      </td>
                      <td>{work.CreatedAt ? new Date(work.CreatedAt).toLocaleDateString() : 'Unknown'}</td>
                      <td>
                        <span className={`source-badge ${getSourceClass(work.Source)}`}>{work.Source || 'Unknown'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderSystemSettings = () => (
    <div className="system-section">
      <h2>System Settings</h2>
      <p>Configure system-wide settings and preferences</p>
      
      {loading ? (
        <div className="loading">Loading system settings...</div>
      ) : (
        <div className="settings-grid">
          <div className="setting-card modern-card">
            <h3><Database size={20} /> Database Management</h3>
            <p>Backup, restore, and optimize database</p>
            <button className="action-button" onClick={() => setShowDatabaseModal(true)} disabled={loading}>Manage Database</button>
          </div>
          
          <div className="setting-card modern-card">
            <h3><Shield size={20} /> Security Settings</h3>
            <p>Configure authentication and permissions</p>
            <button className="action-button" onClick={() => setShowSecurityModal(true)} disabled={loading}>Security Settings</button>
          </div>
          
          <div className="setting-card modern-card">
            <h3><Settings size={20} /> System Configuration</h3>
            <p>General system preferences</p>
            <button className="action-button" onClick={() => setShowSystemConfigModal(true)} disabled={loading}>Configure System</button>
          </div>
          
          <div className="setting-card modern-card">
            <h3><BarChart3 size={20} /> Analytics & Reports</h3>
            <p>System-wide analytics configuration</p>
            <button className="action-button" onClick={() => setShowAnalyticsModal(true)} disabled={loading}>View Analytics</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderAccounting = () => {
    return (
      <div className="accounting-section system-content">
        <div className="section-header">
          <h2>Accounting Overview</h2>
          <p>Monitor all accounting activities across the system</p>
        </div>

        <div className="accounting-tabs" style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(19, 42, 132, 0.1)' }}>
          <button
            className={`tab-button ${accountingTab === 'tenant-payments' ? 'active' : ''}`}
            onClick={() => setAccountingTab('tenant-payments')}
            style={{ padding: '12px 24px', border: 'none', background: accountingTab === 'tenant-payments' ? '#132a84' : 'transparent', color: accountingTab === 'tenant-payments' ? '#fff' : '#1e1b4b', cursor: 'pointer', borderRadius: '8px 8px 0 0' }}
          >
            Tenant Payments
          </button>
          <button
            className={`tab-button ${accountingTab === 'landlord-payments' ? 'active' : ''}`}
            onClick={() => setAccountingTab('landlord-payments')}
            style={{ padding: '12px 24px', border: 'none', background: accountingTab === 'landlord-payments' ? '#132a84' : 'transparent', color: accountingTab === 'landlord-payments' ? '#fff' : '#1e1b4b', cursor: 'pointer', borderRadius: '8px 8px 0 0' }}
          >
            Landlord Payments
          </button>
          <button
            className={`tab-button ${accountingTab === 'collections' ? 'active' : ''}`}
            onClick={() => setAccountingTab('collections')}
            style={{ padding: '12px 24px', border: 'none', background: accountingTab === 'collections' ? '#132a84' : 'transparent', color: accountingTab === 'collections' ? '#fff' : '#1e1b4b', cursor: 'pointer', borderRadius: '8px 8px 0 0' }}
          >
            Collections
          </button>
          <button
            className={`tab-button ${accountingTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setAccountingTab('expenses')}
            style={{ padding: '12px 24px', border: 'none', background: accountingTab === 'expenses' ? '#132a84' : 'transparent', color: accountingTab === 'expenses' ? '#fff' : '#1e1b4b', cursor: 'pointer', borderRadius: '8px 8px 0 0' }}
          >
            Expenses
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading accounting data...</div>
        ) : (
          <>
            {accountingTab === 'tenant-payments' && (
              <div className="panel">
                <h3>All Tenant Payments</h3>
                {accountingTenantPayments.length === 0 ? (
                  <div className="no-data">No tenant payments found</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Tenant</th>
                        <th>Property</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountingTenantPayments.map((payment, index) => (
                        <tr key={payment.ID || payment.id || `tenant-payment-${index}`}>
                          <td>{payment.Date ? new Date(payment.Date).toLocaleDateString() : 'N/A'}</td>
                          <td>{payment.Tenant || 'N/A'}</td>
                          <td>{payment.Property || 'N/A'}</td>
                          <td>{payment.Amount?.toFixed(2) || '0.00'} XOF</td>
                          <td>{payment.Method || 'N/A'}</td>
                          <td>
                            <span className={`status-badge ${(payment.Status || 'pending').toLowerCase()}`}>
                              {payment.Status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {accountingTab === 'landlord-payments' && (
              <div className="panel">
                <h3>All Landlord Payments</h3>
                {accountingLandlordPayments.length === 0 ? (
                  <div className="no-data">No landlord payments found</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Landlord</th>
                        <th>Building</th>
                        <th>Net Amount</th>
                        <th>Commission</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountingLandlordPayments.map((payment, index) => (
                        <tr key={payment.ID || payment.id || `landlord-payment-${index}`}>
                          <td>{payment.Date ? new Date(payment.Date).toLocaleDateString() : 'N/A'}</td>
                          <td>{payment.Landlord || 'N/A'}</td>
                          <td>{payment.Building || 'N/A'}</td>
                          <td>{payment.NetAmount?.toFixed(2) || '0.00'} XOF</td>
                          <td>{payment.Commission?.toFixed(2) || '0.00'} XOF</td>
                          <td>
                            <span className={`status-badge ${(payment.Status || 'pending').toLowerCase()}`}>
                              {payment.Status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {accountingTab === 'collections' && (
              <div className="panel">
                <h3>All Collections</h3>
                {accountingCollections.length === 0 ? (
                  <div className="no-data">No collections found</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Building</th>
                        <th>Landlord</th>
                        <th>Amount</th>
                        <th>Charge Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountingCollections.map((collection, index) => (
                        <tr key={collection.ID || collection.id || `collection-${index}`}>
                          <td>{collection.Date ? new Date(collection.Date).toLocaleDateString() : 'N/A'}</td>
                          <td>{collection.Building || 'N/A'}</td>
                          <td>{collection.Landlord || 'N/A'}</td>
                          <td>{collection.Amount?.toFixed(2) || '0.00'} XOF</td>
                          <td>{collection.ChargeType || 'N/A'}</td>
                          <td>
                            <span className={`status-badge ${(collection.Status || 'pending').toLowerCase()}`}>
                              {collection.Status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {accountingTab === 'expenses' && (
              <div className="panel">
                <h3>All Expenses</h3>
                {accountingExpenses.length === 0 ? (
                  <div className="no-data">No expenses found</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Scope</th>
                        <th>Building</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountingExpenses.map((expense, index) => (
                        <tr key={expense.ID || expense.id || `expense-${index}`}>
                          <td>{expense.Date ? new Date(expense.Date).toLocaleDateString() : 'N/A'}</td>
                          <td>{expense.Scope || 'N/A'}</td>
                          <td>{expense.Building || 'N/A'}</td>
                          <td>{expense.Category || 'N/A'}</td>
                          <td>{(expense.Amount || expense.amount || 0).toFixed(2)} XOF</td>
                          <td>{expense.Notes || expense.notes || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
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
      case 'accounting':
        return renderAccounting();
      case 'works':
        return renderWorks();
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

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Supervision', logo: 'SAAF', logoImage: `${process.env.PUBLIC_URL}/download.jpeg` }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}
      >
        {({ activeId }) => (
          <div className="content-body super-admin-content">
            {renderContent(activeId)}
          </div>
        )}
      </RoleLayout>

      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={`notification-${notification.id}`} className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>×</button>
          </div>
        ))}
      </div>

      {showDeactivationModal && (
        <div className="modal-overlay" onClick={() => setShowDeactivationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deactivate Company</h3>
              <button className="modal-close" onClick={() => setShowDeactivationModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>You are about to deactivate <strong>{selectedCompany?.Name || selectedCompany?.name}</strong>.</p>
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

      {/* Add/Edit Company Modal */}
      {showCompanyModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowCompanyModal(false);
            setEditingCompany(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCompany ? 'Edit Company' : 'Add New Company'}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCompanyModal(false);
                  setEditingCompany(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCompanySubmit}>
                <div className="form-group">
                  <label htmlFor="companyName">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    placeholder="Enter company name"
                    defaultValue={editingCompany?.Name || editingCompany?.name || ''}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    placeholder="Brief description of the company"
                    defaultValue={editingCompany?.Description || editingCompany?.description || ''}
                  ></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Contact Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="contact@company.com"
                      defaultValue={editingCompany?.Email || editingCompany?.email || ''}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Contact Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="+1-555-0000"
                      defaultValue={editingCompany?.Phone || editingCompany?.phone || ''}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="Company address"
                    defaultValue={editingCompany?.Address || editingCompany?.address || ''}
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="action-button secondary"
                    onClick={() => {
                      setShowCompanyModal(false);
                      setEditingCompany(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary">
                    {editingCompany ? 'Save Changes' : 'Add Company'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
 
      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUserSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="userName">Full Name</label>
                    <input
                      type="text"
                      name="userName"
                      required
                      placeholder="Enter full name"
                      defaultValue={editingUser?.Name || editingUser?.name || ''}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="userEmail">Email Address</label>
                    <input
                      type="email"
                      name="userEmail"
                      required
                      placeholder="user@example.com"
                      defaultValue={editingUser?.Email || editingUser?.email || ''}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="userCompany">Company</label>
                    <select
                      name="userCompany"
                      required
                      defaultValue={editingUser?.Company || editingUser?.company || ''}
                    >
                      <option value="">Select Company</option>
                      {companies.map(company => (
                        <option key={`new-user-company-${company.ID || company.id || company.name}`} value={company.ID || company.id}>
                          {company.Name || company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="userRole">Role</label>
                    <select
                      name="userRole"
                      required
                      defaultValue={editingUser?.Role || editingUser?.role || ''}
                    >
                      <option value="">Select Role</option>
                      <option value="tenant">Tenant</option>
                      <option value="commercial">Commercial Dashboard</option>
                      <option value="admin">Administrative Agent</option>
                      <option value="accounting">Accounting</option>
                      <option value="salesmanager">Sales Manager</option>
                      <option value="technician">Technical Manager</option>
                      <option value="landlord">Landlord</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="userPhone">Phone Number</label>
                    <input
                      type="tel"
                      name="userPhone"
                      placeholder="+1-555-0000"
                      defaultValue={editingUser?.Phone || editingUser?.phone || ''}
                    />
                  </div>
                  {!editingUser && (
                    <div className="form-group">
                      <label htmlFor="userPassword">Initial Password</label>
                      <input type="password" name="userPassword" required placeholder="Set initial password" />
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="action-button secondary"
                    onClick={() => {
                      setShowUserModal(false);
                      setEditingUser(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary">
                    {editingUser ? 'Save Changes' : 'Add User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Property Modal */}
      {showPropertyModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowPropertyModal(false);
            setEditingProperty(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProperty ? 'Edit Property' : 'Add New Property'}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowPropertyModal(false);
                  setEditingProperty(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handlePropertySubmit}>
                <div className="form-group">
                  <label htmlFor="propertyAddress">Property Address</label>
                  <input
                    type="text"
                    name="propertyAddress"
                    required
                    placeholder="Enter full address"
                    defaultValue={editingProperty?.Address || editingProperty?.address || ''}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="propertyCompany">Company</label>
                    <select
                      name="propertyCompany"
                      required
                      defaultValue={
                        editingProperty
                          ? resolveCompanyId(
                              editingProperty.companyId ||
                                editingProperty.CompanyID ||
                                editingProperty.Company ||
                                editingProperty.company
                            )
                          : ''
                      }
                    >
                      <option value="">Select Company</option>
                      {companies.map(company => (
                        <option key={`new-property-company-${company.ID || company.id || company.name}`} value={company.ID || company.id}>
                          {company.Name || company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="propertyType">Property Type</label>
                    <select
                      name="propertyType"
                      required
                      defaultValue={editingProperty?.Type || editingProperty?.type || ''}
                    >
                      <option value="">Select Type</option>
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Commercial">Commercial Unit</option>
                      <option value="Industrial">Industrial</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="propertyStatus">Status</label>
                    <select
                      name="propertyStatus"
                      defaultValue={editingProperty?.Status || editingProperty?.status || 'Vacant'}
                    >
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="propertyRent">Monthly Rent (XOF)</label>
                    <input
                      type="number"
                      name="propertyRent"
                      required
                      min="0"
                      step="0.01"
                      placeholder="1200"
                      defaultValue={editingProperty?.Rent || editingProperty?.rent || ''}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bedrooms">Bedrooms</label>
                    <input
                      type="number"
                      name="bedrooms"
                      required
                      min="0"
                      placeholder="3"
                      defaultValue={editingProperty?.Bedrooms || editingProperty?.bedrooms || 0}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="bathrooms">Bathrooms</label>
                    <input
                      type="number"
                      name="bathrooms"
                      required
                      min="0"
                      placeholder="2"
                      defaultValue={editingProperty?.Bathrooms || editingProperty?.bathrooms || 0}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="action-button secondary"
                    onClick={() => {
                      setShowPropertyModal(false);
                      setEditingProperty(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary">
                    {editingProperty ? 'Save Changes' : 'Add Property'}
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
                  <select defaultValue="XOF">
                    <option value="XOF">XOF</option>
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
    </>
  );
};

export default SuperAdminDashboard;
