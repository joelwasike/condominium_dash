import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  Users,
  Home,
  DollarSign,
  Wrench,
  Settings,
  Plus,
  Search,
  MessageCircle,
  CreditCard,
  FileText,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { agencyDirectorService } from '../services/agencyDirectorService';
import RoleLayout from '../components/RoleLayout';
import Modal from '../components/Modal';
import SettingsPage from './SettingsPage';
import '../components/RoleLayout.css';
import '../pages/TechnicianDashboard.css';
import './SuperAdminDashboard.css';

const AgencyDirectorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [works, setWorks] = useState([]);
  const [accountingData, setAccountingData] = useState(null);
  const [landlordPayments, setLandlordPayments] = useState([]);

  // Filters
  const [userCompanyFilter, setUserCompanyFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearchText, setUserSearchText] = useState('');
  const [propertyCompanyFilter, setPropertyCompanyFilter] = useState('');
  const [propertyStatusFilter, setPropertyStatusFilter] = useState('');

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'salesmanager', password: '' });
  const [propertyForm, setPropertyForm] = useState({ address: '', type: '', rent: '', tenant: '', status: 'Vacant' });
  
  // Messaging states
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [superAdmins, setSuperAdmins] = useState([]);
  
  // Subscription payment state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({ amount: '', currency: 'USD', reference: '', status: 'completed' });
  const [subscriptionType, setSubscriptionType] = useState('monthly'); // 'monthly' or 'annual'

  // Contracts state
  const [leasesAwaitingSignature, setLeasesAwaitingSignature] = useState([]);
  const [expenseRequests, setExpenseRequests] = useState([]);
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [owners, setOwners] = useState([]);

  // Reports/Analytics state
  const [transferHistory, setTransferHistory] = useState([]);
  const [expensesPerBuilding, setExpensesPerBuilding] = useState({});
  const [expensesPerOwner, setExpensesPerOwner] = useState({});
  const [internalExpenses, setInternalExpenses] = useState([]);
  const [commissionsData, setCommissionsData] = useState({});
  const [allBuildingsReport, setAllBuildingsReport] = useState([]);
  const [unpaidRentReport, setUnpaidRentReport] = useState(null);
  const [reportFilters, setReportFilters] = useState({
    ownerId: '',
    building: '',
    startDate: '',
    endDate: '',
    month: ''
  });

  // Tenants state
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantProfile, setTenantProfile] = useState(null);
  const [showTenantProfileModal, setShowTenantProfileModal] = useState(false);
  const [tenantStatusFilter, setTenantStatusFilter] = useState('');

  const addNotification = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, usersData, propertiesData, financial, worksData, accounting, landlordPaymentsData] = await Promise.all([
        agencyDirectorService.getOverview().catch(() => null),
        agencyDirectorService.getUsers().catch(() => []),
        agencyDirectorService.getProperties().catch(() => []),
        agencyDirectorService.getFinancialOverview().catch(() => null),
        agencyDirectorService.getWorks().catch(() => []),
        agencyDirectorService.getAccountingOverview().catch(() => null),
        agencyDirectorService.getLandlordPayments().catch(() => [])
      ]);

      setOverviewData(overview);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      setFinancialData(financial);
      setWorks(Array.isArray(worksData) ? worksData : []);
      setAccountingData(accounting);
      setLandlordPayments(Array.isArray(landlordPaymentsData) ? landlordPaymentsData : []);
      
      // Fetch super admins for chat - try to get from conversations API which should include them
      try {
        const conversationsData = await agencyDirectorService.getConversations().catch(() => []);
        // Extract super admins from conversations (users with role 'superadmin')
        const superAdminUsers = Array.isArray(conversationsData) 
          ? conversationsData.filter(conv => (conv.role || '').toLowerCase() === 'superadmin')
          : [];
        setSuperAdmins(superAdminUsers);
      } catch (error) {
        console.warn('Could not fetch super admins from conversations:', error);
        setSuperAdmins([]);
      }
    } catch (error) {
      console.error('Error loading agency director data:', error);
      addNotification('Failed to load data from server', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Load chat for a specific user
  const loadChatForUser = useCallback(
    async (userId) => {
      try {
        setSelectedUserId(userId);
        const messages = await agencyDirectorService.getConversationWithUser(userId);
        setChatMessages(Array.isArray(messages) ? messages : []);
      } catch (error) {
        console.error('Error loading chat for user:', error);
        addNotification('Failed to load chat messages', 'error');
      }
    },
    [addNotification]
  );

  // Get all chat users (agency users + super admins)
  const chatUsers = useMemo(() => {
    const allUsers = [];
    const addedUserIds = new Set();
    
    // Get current user ID to exclude from list
    const currentUser = localStorage.getItem('user');
    let currentUserId = null;
    if (currentUser) {
      try {
        const parsed = JSON.parse(currentUser);
        currentUserId = parsed.id || parsed.ID;
      } catch (e) {}
    }
    
    // Add all agency users
    if (users && Array.isArray(users)) {
      users.forEach(user => {
        const userId = user.ID || user.id;
        // Don't include current user in the list
        if (userId && userId !== currentUserId && !addedUserIds.has(userId)) {
          allUsers.push({
            userId: userId,
            name: user.Name || user.name,
            email: user.Email || user.email,
            role: user.Role || user.role,
            company: user.Company || user.company
          });
          addedUserIds.add(userId);
        }
      });
    }
    
    // Add super admins from conversations (they have role 'superadmin')
    if (superAdmins && Array.isArray(superAdmins)) {
      superAdmins.forEach(admin => {
        const adminId = admin.userId || admin.ID || admin.id;
        if (adminId && !addedUserIds.has(adminId)) {
          allUsers.push({
            userId: adminId,
            name: admin.name || admin.Name,
            email: admin.email || admin.Email,
            role: admin.role || admin.Role || 'superadmin',
            company: admin.company || admin.Company || 'SAAF IMMO'
          });
          addedUserIds.add(adminId);
        }
      });
    }
    
    // Sort: super admins first, then others
    return allUsers.sort((a, b) => {
      if (a.role === 'superadmin' && b.role !== 'superadmin') return -1;
      if (a.role !== 'superadmin' && b.role === 'superadmin') return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [users, superAdmins]);

  // Load initial chat when users are loaded
  useEffect(() => {
    if (chatUsers && chatUsers.length > 0 && !selectedUserId) {
      const firstUserId = chatUsers[0].userId;
      setSelectedUserId(firstUserId);
      loadChatForUser(firstUserId);
    }
  }, [chatUsers, selectedUserId, loadChatForUser]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedUserId) return;
    
    // Get current user ID from localStorage
    const storedUser = localStorage.getItem('user');
    let currentUserId = null;
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        currentUserId = user.id || user.ID;
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    
    if (!currentUserId) {
      addNotification('Unable to identify current user. Please log in again.', 'error');
      return;
    }
    
    const content = chatInput.trim();
    setChatInput('');
    try {
      const payload = {
        fromUserId: currentUserId,
        toUserId: selectedUserId,
        content,
      };
      await agencyDirectorService.sendMessage(payload);
      
      // Reload chat to get the latest messages from server
      if (selectedUserId) {
        await loadChatForUser(selectedUserId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addNotification(error.message || 'Failed to send message', 'error');
    }
  };

  // Handle subscription payment
  const handlePaySubscription = async (e) => {
    e.preventDefault();
    try {
      await agencyDirectorService.paySubscription(subscriptionForm);
      addNotification('Subscription payment processed successfully!', 'success');
      setShowSubscriptionModal(false);
      setSubscriptionForm({ amount: '', currency: 'USD', reference: '', status: 'completed' });
      await loadData();
    } catch (error) {
      console.error('Error processing subscription payment:', error);
      addNotification(error.message || 'Failed to process subscription payment', 'error');
    }
  };

  // Handle landlord payment actions
  const handleApproveLandlordPayment = async (paymentId) => {
    try {
      await agencyDirectorService.approveLandlordPayment(paymentId);
      addNotification('Landlord payment approved successfully!', 'success');
      await loadData();
    } catch (error) {
      console.error('Error approving landlord payment:', error);
      addNotification(error.message || 'Failed to approve payment', 'error');
    }
  };

  const handleRevokeLandlordPayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to revoke this payment?')) return;
    try {
      await agencyDirectorService.revokeLandlordPayment(paymentId);
      addNotification('Landlord payment revoked successfully!', 'success');
      await loadData();
    } catch (error) {
      console.error('Error revoking landlord payment:', error);
      addNotification(error.message || 'Failed to revoke payment', 'error');
    }
  };

  // Contract handlers
  const handleApproveExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to approve this expense?')) return;
    try {
      await agencyDirectorService.approveExpense(expenseId);
      addNotification('Expense approved successfully!', 'success');
      await loadContractsData();
    } catch (error) {
      console.error('Error approving expense:', error);
      addNotification(error.message || 'Failed to approve expense', 'error');
    }
  };

  const handleRejectExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to reject this expense?')) return;
    try {
      await agencyDirectorService.rejectExpense(expenseId);
      addNotification('Expense rejected successfully!', 'success');
      await loadContractsData();
    } catch (error) {
      console.error('Error rejecting expense:', error);
      addNotification(error.message || 'Failed to reject expense', 'error');
    }
  };

  const handleApproveQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to approve this quote?')) return;
    try {
      await agencyDirectorService.approveQuote(quoteId);
      addNotification('Quote approved successfully!', 'success');
      await loadContractsData();
    } catch (error) {
      console.error('Error approving quote:', error);
      addNotification(error.message || 'Failed to approve quote', 'error');
    }
  };

  const handleRejectQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to reject this quote?')) return;
    try {
      await agencyDirectorService.rejectQuote(quoteId);
      addNotification('Quote rejected successfully!', 'success');
      await loadContractsData();
    } catch (error) {
      console.error('Error rejecting quote:', error);
      addNotification(error.message || 'Failed to reject quote', 'error');
    }
  };

  // Annual subscription handler
  const handlePayAnnualSubscription = async (e) => {
    e.preventDefault();
    try {
      await agencyDirectorService.payAnnualSubscription(subscriptionForm);
      addNotification('Annual subscription payment processed successfully!', 'success');
      setShowSubscriptionModal(false);
      setSubscriptionForm({ amount: '', currency: 'USD', reference: '', status: 'completed' });
      await loadData();
    } catch (error) {
      console.error('Error processing annual subscription payment:', error);
      addNotification(error.message || 'Failed to process annual subscription payment', 'error');
    }
  };

  // Load contracts data
  const loadContractsData = useCallback(async () => {
    try {
      const [leases, ownersData] = await Promise.all([
        agencyDirectorService.getLeasesAwaitingSignature().catch(() => []),
        agencyDirectorService.getOwners().catch(() => [])
      ]);
      setLeasesAwaitingSignature(Array.isArray(leases) ? leases : []);
      setOwners(Array.isArray(ownersData) ? ownersData : []);
    } catch (error) {
      console.error('Error loading contracts data:', error);
    }
  }, []);

  // Load tenants data
  const loadTenantsData = useCallback(async () => {
    try {
      const tenantsData = await agencyDirectorService.getTenants(tenantStatusFilter || null).catch(() => []);
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
    } catch (error) {
      console.error('Error loading tenants:', error);
      addNotification('Failed to load tenants', 'error');
    }
  }, [tenantStatusFilter, addNotification]);

  // Load tenant profile
  const loadTenantProfile = useCallback(async (tenantId) => {
    try {
      const profile = await agencyDirectorService.getTenantProfile(tenantId);
      setTenantProfile(profile);
      setShowTenantProfileModal(true);
    } catch (error) {
      console.error('Error loading tenant profile:', error);
      addNotification('Failed to load tenant profile', 'error');
    }
  }, [addNotification]);

  // Load analytics/reports data
  const loadAnalyticsData = useCallback(async () => {
    try {
      const filters = reportFilters;
      const [
        transfers,
        expensesBuilding,
        expensesOwner,
        internal,
        commissions,
        buildings,
        unpaidRent
      ] = await Promise.all([
        agencyDirectorService.getTransferHistory(filters).catch(() => []),
        agencyDirectorService.getExpensesPerBuilding(filters).catch(() => ({})),
        agencyDirectorService.getExpensesPerOwner(filters).catch(() => ({})),
        agencyDirectorService.getInternalExpenses(filters).catch(() => []),
        agencyDirectorService.getCommissionsPerMonthPerBuilding(filters).catch(() => ({})),
        agencyDirectorService.getAllBuildingsReport().catch(() => []),
        agencyDirectorService.getUnpaidRentReport(filters).catch(() => null)
      ]);
      setTransferHistory(Array.isArray(transfers) ? transfers : []);
      setExpensesPerBuilding(expensesBuilding || {});
      setExpensesPerOwner(expensesOwner || {});
      setInternalExpenses(Array.isArray(internal) ? internal : []);
      setCommissionsData(commissions || {});
      setAllBuildingsReport(Array.isArray(buildings) ? buildings : []);
      setUnpaidRentReport(unpaidRent);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  }, [reportFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load data when specific tabs are active
  useEffect(() => {
    if (activeTab === 'contracts') {
      loadContractsData();
    }
  }, [activeTab, loadContractsData]);

  useEffect(() => {
    if (activeTab === 'tenants') {
      loadTenantsData();
    }
  }, [activeTab, loadTenantsData]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [activeTab, loadAnalyticsData]);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: BarChart3 },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'properties', label: 'Properties', icon: Home },
      { id: 'tenants', label: 'Tenants', icon: UserCheck },
      { id: 'contracts', label: 'Contracts', icon: FileText },
      { id: 'accounting', label: 'Accounting', icon: DollarSign },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
      { id: 'works', label: 'Works', icon: Wrench },
      { id: 'messages', label: 'Messages', icon: MessageCircle },
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

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    return users.filter(user => {
      if (userCompanyFilter && (user.Company || user.company) !== userCompanyFilter) return false;
      if (userRoleFilter && (user.Role || user.role) !== userRoleFilter) return false;
      if (userSearchText) {
        const search = userSearchText.toLowerCase();
        const name = (user.Name || user.name || '').toLowerCase();
        const email = (user.Email || user.email || '').toLowerCase();
        if (!name.includes(search) && !email.includes(search)) return false;
      }
      return true;
    });
  }, [users, userCompanyFilter, userRoleFilter, userSearchText]);

  // Filtered properties
  const filteredProperties = useMemo(() => {
    if (!properties || !Array.isArray(properties)) return [];
    return properties.filter(property => {
      if (propertyCompanyFilter && (property.Company || property.company) !== propertyCompanyFilter) return false;
      if (propertyStatusFilter && (property.Status || property.status) !== propertyStatusFilter) return false;
      return true;
    });
  }, [properties, propertyCompanyFilter, propertyStatusFilter]);

  // Unique companies and roles
  const uniqueCompanies = useMemo(() => {
    const companies = new Set();
    users.forEach(user => {
      if (user.Company || user.company) companies.add(user.Company || user.company);
    });
    properties.forEach(prop => {
      if (prop.Company || prop.company) companies.add(prop.Company || prop.company);
    });
    return Array.from(companies).sort();
  }, [users, properties]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set();
    users.forEach(user => {
      if (user.Role || user.role) roles.add(user.Role || user.role);
    });
    return Array.from(roles).sort();
  }, [users]);

  // User management
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', role: 'salesmanager', password: '' });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.Name || user.name || '',
      email: user.Email || user.email || '',
      role: user.Role || user.role || 'salesmanager',
      password: ''
    });
    setShowUserModal(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role
        // Company is automatically set from token, not required in request
      };

      if (editingUser) {
        if (userForm.password) userData.password = userForm.password;
        await agencyDirectorService.updateUser(editingUser.ID || editingUser.id, userData);
        addNotification('User updated successfully!', 'success');
      } else {
        if (!userForm.password) {
          addNotification('Password is required for new user', 'warning');
          return;
        }
        userData.password = userForm.password;
        await agencyDirectorService.addUser(userData);
        addNotification('User created successfully!', 'success');
      }
      setShowUserModal(false);
      await loadData();
    } catch (error) {
      console.error('Error saving user:', error);
      addNotification(editingUser ? 'Failed to update user' : 'Failed to create user', 'error');
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Delete user ${user.Name || user.name}?`)) {
      try {
        await agencyDirectorService.deleteUser(user.ID || user.id);
        addNotification('User deleted successfully!', 'success');
        await loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
        addNotification('Failed to delete user', 'error');
      }
    }
  };

  // Property management
  const handleOpenAddProperty = () => {
    setEditingProperty(null);
    setPropertyForm({ address: '', type: '', rent: '', tenant: '', status: 'Vacant' });
    setShowPropertyModal(true);
  };

  const handleOpenEditProperty = (property) => {
    setEditingProperty(property);
    setPropertyForm({
      address: property.Address || property.address || '',
      type: property.Type || property.type || '',
      rent: property.Rent || property.rent || '',
      tenant: property.Tenant || property.tenant || '',
      status: property.Status || property.status || 'Vacant'
    });
    setShowPropertyModal(true);
  };

  const handleSubmitProperty = async (e) => {
    e.preventDefault();
    try {
      const propertyData = {
        address: propertyForm.address,
        type: propertyForm.type,
        rent: parseFloat(propertyForm.rent) || 0,
        tenant: propertyForm.tenant,
        status: propertyForm.status
        // Company is automatically set from token, not required in request
      };

      if (editingProperty) {
        await agencyDirectorService.updateProperty(editingProperty.ID || editingProperty.id, propertyData);
        addNotification('Property updated successfully!', 'success');
      } else {
        await agencyDirectorService.addProperty(propertyData);
        addNotification('Property created successfully!', 'success');
      }
      setShowPropertyModal(false);
      await loadData();
    } catch (error) {
      console.error('Error saving property:', error);
      addNotification(editingProperty ? 'Failed to update property' : 'Failed to create property', 'error');
    }
  };

  const handleDeleteProperty = async (property) => {
    if (window.confirm(`Delete property ${property.Address || property.address}?`)) {
      try {
        await agencyDirectorService.deleteProperty(property.ID || property.id);
        addNotification('Property deleted successfully!', 'success');
        await loadData();
      } catch (error) {
        console.error('Error deleting property:', error);
        addNotification('Failed to delete property', 'error');
      }
    }
  };

  // Render functions
  const renderOverview = () => (
    <div className="sa-overview-page">
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Agency Director Dashboard Overview</h3>
            <p>Comprehensive overview of your agency operations</p>
          </div>
        </div>
        <div className="sa-overview-metrics" style={{ width: '100%', marginTop: '20px' }}>
          <div className="sa-metric-card sa-metric-primary">
            <p className="sa-metric-label">Overall Occupancy Rate</p>
            <p className="sa-metric-value">
              {overviewData?.overallOccupancyRate ? `${overviewData.overallOccupancyRate.toFixed(1)}%` : '0%'}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Managed Apartments</p>
            <p className="sa-metric-number">
              {overviewData?.totalManagedApartments || overviewData?.totalProperties || properties.length || 0}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Vacant Units</p>
            <p className="sa-metric-number">
              {overviewData?.numberOfVacantUnits || overviewData?.vacantProperties || 0}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Active Tenants</p>
            <p className="sa-metric-number">
              {overviewData?.numberOfActiveTenants || overviewData?.activeTenants || 0}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Rent Collected</p>
            <p className="sa-metric-value">
              {(overviewData?.totalRentCollected || 0).toLocaleString()} FCFA
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Unpaid Rent</p>
            <p className="sa-metric-value" style={{ color: '#dc2626' }}>
              {(overviewData?.totalUnpaidRent || 0).toLocaleString()} FCFA
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Reimbursements to Owners</p>
            <p className="sa-metric-value">
              {(overviewData?.totalReimbursementsToOwners || 0).toLocaleString()} FCFA
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Agency Commissions (This Month)</p>
            <p className="sa-metric-value">
              {(overviewData?.totalAgencyCommissions || overviewData?.agencyCommissionsCurrentMonth || 0).toLocaleString()} FCFA
            </p>
          </div>
        </div>
      </div>

      {overviewData?.vacantUnitsList && overviewData.vacantUnitsList.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-section-header">
            <h3>Vacant Units</h3>
            <p>List of currently vacant properties</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Property Address</th>
                  <th>Type</th>
                  <th>Rent</th>
                </tr>
              </thead>
              <tbody>
                {overviewData.vacantUnitsList.map((unit, index) => (
                  <tr key={`vacant-${unit.id || unit.ID || index}`}>
                    <td>{index + 1}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{unit.address || unit.Address}</span>
                    </td>
                    <td>{unit.type || unit.Type}</td>
                    <td>{(unit.rent || unit.Rent || 0).toLocaleString()} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {overviewData?.newTenantsAwaitingApproval && overviewData.newTenantsAwaitingApproval.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-section-header">
            <h3>New Tenants Awaiting Approval</h3>
            <p>{overviewData.newTenantsAwaitingApproval.length} tenants pending approval</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Property</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overviewData.newTenantsAwaitingApproval.map((tenant, index) => (
                  <tr key={`pending-tenant-${tenant.id || tenant.ID || index}`}>
                    <td>{index + 1}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{tenant.name || tenant.Name}</span>
                    </td>
                    <td>{tenant.email || tenant.Email}</td>
                    <td>{tenant.property || tenant.Property}</td>
                    <td>
                      <span className={`sa-status-pill ${(tenant.status || tenant.Status || 'pending').toLowerCase()}`}>
                        {tenant.status || tenant.Status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {overviewData?.ongoingWorkInBuildings && overviewData.ongoingWorkInBuildings.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-section-header">
            <h3>Ongoing Work in Buildings</h3>
            <p>{overviewData.ongoingWorkInBuildings.length} active work orders</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Building</th>
                  <th>Work Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overviewData.ongoingWorkInBuildings.map((work, index) => (
                  <tr key={`ongoing-work-${work.id || work.ID || index}`}>
                    <td>{index + 1}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{work.building || work.Building}</span>
                    </td>
                    <td>{work.type || work.Type || 'Maintenance'}</td>
                    <td>
                      <span className={`sa-status-pill ${(work.status || work.Status || 'in_progress').toLowerCase().replace('_', '-')}`}>
                        {work.status || work.Status || 'In Progress'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {overviewData?.latePaymentsStatus && overviewData.latePaymentsStatus.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-section-header">
            <h3>Late Payments Status</h3>
            <p>Tenants with overdue payments</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Amount Due</th>
                  <th>Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                {overviewData.latePaymentsStatus.map((payment, index) => (
                  <tr key={`late-payment-${payment.id || payment.ID || index}`}>
                    <td>{index + 1}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{payment.tenant || payment.Tenant}</span>
                    </td>
                    <td>{payment.property || payment.Property}</td>
                    <td style={{ color: '#dc2626' }}>
                      {(payment.amountDue || payment.AmountDue || 0).toLocaleString()} FCFA
                    </td>
                    <td style={{ color: '#dc2626' }}>
                      {payment.daysOverdue || payment.DaysOverdue || 0} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Users</h2>
          <p>{filteredUsers.length} results found</p>
        </div>
        <div className="sa-clients-header-right">
          <button className="sa-primary-cta" onClick={handleOpenAddUser}>
            <Plus size={16} />
            Add User
          </button>
          <div className="sa-transactions-filters" style={{ marginLeft: '12px' }}>
            <select 
              value={userCompanyFilter} 
              onChange={(e) => setUserCompanyFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', marginRight: '8px' }}
            >
              <option value="">All Companies</option>
              {uniqueCompanies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
            <select 
              value={userRoleFilter} 
              onChange={(e) => setUserRoleFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', marginRight: '8px' }}
            >
              <option value="">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <div className="sa-search-input">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name or email"
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={`user-${user.ID || user.id || index}`}>
                <td>{index + 1}</td>
                <td className="sa-cell-main">
                  <span className="sa-cell-title">{user.Name || user.name}</span>
                </td>
                <td>{user.Email || user.email}</td>
                <td>{user.Company || user.company || 'N/A'}</td>
                <td>{user.Role || user.role}</td>
                <td>
                  <span className={`sa-status-pill ${(user.Status || user.status || 'active').toLowerCase()}`}>
                    {user.Status || user.status || 'Active'}
                  </span>
                </td>
                <td className="sa-row-actions">
                  <button className="sa-icon-button" onClick={() => handleOpenEditUser(user)} title="Edit">✏️</button>
                  <button className="sa-icon-button" onClick={() => handleDeleteUser(user)} title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="sa-table-empty">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title={editingUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmitUser} className="sa-form">
          <div className="sa-form-group">
            <label>Name *</label>
            <input type="text" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} required />
          </div>
          <div className="sa-form-group">
            <label>Email *</label>
            <input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} required />
          </div>
          <div className="sa-form-group">
            <label>Role *</label>
            <select value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})} required>
              <option value="commercial">Commercial</option>
              <option value="technician">Technician</option>
              <option value="accounting">Accounting</option>
              <option value="admin">Admin</option>
              <option value="landlord">Landlord</option>
              <option value="salesmanager">Sales Manager</option>
              <option value="agency_director">Agency Director</option>
            </select>
            <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
              Company will be automatically set from your account
            </small>
          </div>
          <div className="sa-form-group">
            <label>Password {editingUser ? '(leave blank to keep current)' : '*'}</label>
            <input type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} required={!editingUser} />
          </div>
          <div className="sa-form-actions">
            <button type="button" className="sa-outline-button" onClick={() => setShowUserModal(false)}>Cancel</button>
            <button type="submit" className="sa-primary-cta">{editingUser ? 'Update' : 'Create'} User</button>
          </div>
        </form>
      </Modal>
    </div>
  );

  const renderProperties = () => (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Properties</h2>
          <p>{filteredProperties.length} results found</p>
        </div>
        <div className="sa-clients-header-right">
          <button className="sa-primary-cta" onClick={handleOpenAddProperty}>
            <Plus size={16} />
            Add Property
          </button>
          <div className="sa-transactions-filters" style={{ marginLeft: '12px' }}>
            <select 
              value={propertyCompanyFilter} 
              onChange={(e) => setPropertyCompanyFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', marginRight: '8px' }}
            >
              <option value="">All Companies</option>
              {uniqueCompanies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
            <select 
              value={propertyStatusFilter} 
              onChange={(e) => setPropertyStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="">All Statuses</option>
              <option value="Vacant">Vacant</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Address</th>
              <th>Company</th>
              <th>Type</th>
              <th>Rent</th>
              <th>Tenant</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredProperties.map((property, index) => (
              <tr key={`property-${property.ID || property.id || index}`}>
                <td>{index + 1}</td>
                <td className="sa-cell-main">
                  <span className="sa-cell-title">{property.Address || property.address}</span>
                </td>
                <td>{property.Company || property.company}</td>
                <td>{property.Type || property.type}</td>
                <td>{(property.Rent || property.rent || 0).toLocaleString()} FCFA</td>
                <td>{property.Tenant || property.tenant || 'N/A'}</td>
                <td>
                  <span className={`sa-status-pill ${(property.Status || property.status || 'vacant').toLowerCase()}`}>
                    {property.Status || property.status || 'Vacant'}
                  </span>
                </td>
                <td className="sa-row-actions">
                  <button className="sa-icon-button" onClick={() => handleOpenEditProperty(property)} title="Edit">✏️</button>
                  <button className="sa-icon-button" onClick={() => handleDeleteProperty(property)} title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
            {filteredProperties.length === 0 && (
              <tr>
                <td colSpan={8} className="sa-table-empty">No properties found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showPropertyModal} onClose={() => setShowPropertyModal(false)} title={editingProperty ? 'Edit Property' : 'Add Property'}>
        <form onSubmit={handleSubmitProperty} className="sa-form">
          <div className="sa-form-group">
            <label>Address *</label>
            <input type="text" value={propertyForm.address} onChange={(e) => setPropertyForm({...propertyForm, address: e.target.value})} required />
          </div>
          <div className="sa-form-group">
            <small style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '8px', display: 'block' }}>
              Company will be automatically set from your account
            </small>
          </div>
          <div className="sa-form-group">
            <label>Type *</label>
            <input type="text" value={propertyForm.type} onChange={(e) => setPropertyForm({...propertyForm, type: e.target.value})} required />
          </div>
          <div className="sa-form-group">
            <label>Rent</label>
            <input type="number" value={propertyForm.rent} onChange={(e) => setPropertyForm({...propertyForm, rent: e.target.value})} />
          </div>
          <div className="sa-form-group">
            <label>Tenant</label>
            <input type="text" value={propertyForm.tenant} onChange={(e) => setPropertyForm({...propertyForm, tenant: e.target.value})} />
          </div>
          <div className="sa-form-group">
            <label>Status *</label>
            <select value={propertyForm.status} onChange={(e) => setPropertyForm({...propertyForm, status: e.target.value})} required>
              <option value="Vacant">Vacant</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
          <div className="sa-form-actions">
            <button type="button" className="sa-outline-button" onClick={() => setShowPropertyModal(false)}>Cancel</button>
            <button type="submit" className="sa-primary-cta">{editingProperty ? 'Update' : 'Create'} Property</button>
          </div>
        </form>
      </Modal>
    </div>
  );

  const renderAccounting = () => (
    <div className="sa-overview-page">
      <div className="sa-section-card">
        <div className="sa-section-header">
          <h3>Financial Overview</h3>
          <p>Revenue, expenses, and profit metrics</p>
        </div>
        <div className="sa-overview-metrics" style={{ width: '100%' }}>
          <div className="sa-metric-card sa-metric-primary">
            <p className="sa-metric-label">Total Revenue</p>
            <p className="sa-metric-value">
              {(financialData?.totalRevenue || 0).toLocaleString()} FCFA
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Expenses</p>
            <p className="sa-metric-value">
              {(financialData?.totalExpenses || 0).toLocaleString()} FCFA
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Net Profit</p>
            <p className="sa-metric-value">
              {(financialData?.netProfit || 0).toLocaleString()} FCFA
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Collections</p>
            <p className="sa-metric-value">
              {(financialData?.totalCollections || 0).toLocaleString()} FCFA
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Commission</p>
            <p className="sa-metric-value">
              {(financialData?.commission || 0).toLocaleString()} FCFA
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Pending Payments</p>
            <p className="sa-metric-value">
              {(financialData?.pendingPayments || 0).toLocaleString()} FCFA
            </p>
          </div>
        </div>
      </div>

      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-section-header">
          <h3>Landlord Payments</h3>
          <p>Manage landlord payment approvals</p>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Landlord</th>
                <th>Building</th>
                <th>Net Amount</th>
                <th>Commission</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {landlordPayments.map((payment, index) => (
                <tr key={`landlord-payment-${payment.id || payment.ID || index}`}>
                  <td>{index + 1}</td>
                  <td className="sa-cell-main">
                    <span className="sa-cell-title">{payment.landlord || payment.Landlord}</span>
                  </td>
                  <td>{payment.building || payment.Building}</td>
                  <td>{(payment.netAmount || payment.NetAmount || 0).toLocaleString()} FCFA</td>
                  <td>{(payment.commission || payment.Commission || 0).toLocaleString()} FCFA</td>
                  <td>
                    {payment.date || payment.Date
                      ? new Date(payment.date || payment.Date).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <span className={`sa-status-pill ${(payment.status || payment.Status || 'pending').toLowerCase()}`}>
                      {payment.status || payment.Status || 'Pending'}
                    </span>
                  </td>
                  <td className="sa-row-actions">
                    {(payment.status || payment.Status || '').toLowerCase() !== 'approved' && (
                      <button
                        className="sa-icon-button"
                        onClick={() => handleApproveLandlordPayment(payment.id || payment.ID)}
                        title="Approve"
                        style={{ color: '#16a34a', marginRight: '8px' }}
                      >
                        ✓
                      </button>
                    )}
                    {(payment.status || payment.Status || '').toLowerCase() !== 'revoked' && (
                      <button
                        className="sa-icon-button"
                        onClick={() => handleRevokeLandlordPayment(payment.id || payment.ID)}
                        title="Revoke"
                        style={{ color: '#dc2626' }}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {landlordPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="sa-table-empty">No landlord payments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-section-header">
          <h3>Subscription Payment</h3>
          <p>Pay for your white-label monthly subscription</p>
          <button className="sa-primary-cta" onClick={() => setShowSubscriptionModal(true)} style={{ marginTop: '12px' }}>
            <CreditCard size={16} />
            Pay Subscription
          </button>
        </div>
      </div>

      <Modal isOpen={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} title="Pay Subscription">
        <form onSubmit={subscriptionType === 'monthly' ? handlePaySubscription : handlePayAnnualSubscription} className="sa-form">
          <div className="sa-form-group">
            <label>Subscription Type *</label>
            <select
              value={subscriptionType}
              onChange={(e) => setSubscriptionType(e.target.value)}
              required
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div className="sa-form-group">
            <label>Amount *</label>
            <input
              type="number"
              step="0.01"
              value={subscriptionForm.amount}
              onChange={(e) => setSubscriptionForm({...subscriptionForm, amount: e.target.value})}
              required
              placeholder={subscriptionType === 'annual' ? "12000.00" : "299.99"}
            />
          </div>
          <div className="sa-form-group">
            <label>Currency *</label>
            <select
              value={subscriptionForm.currency}
              onChange={(e) => setSubscriptionForm({...subscriptionForm, currency: e.target.value})}
              required
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="FCFA">FCFA</option>
            </select>
          </div>
          <div className="sa-form-group">
            <label>Reference *</label>
            <input
              type="text"
              value={subscriptionForm.reference}
              onChange={(e) => setSubscriptionForm({...subscriptionForm, reference: e.target.value})}
              required
              placeholder={subscriptionType === 'annual' ? "ANNUAL-2024-001" : "PAY-2024-001"}
            />
          </div>
          <div className="sa-form-group">
            <label>Status *</label>
            <select
              value={subscriptionForm.status}
              onChange={(e) => setSubscriptionForm({...subscriptionForm, status: e.target.value})}
              required
            >
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="sa-form-actions">
            <button type="button" className="sa-outline-button" onClick={() => setShowSubscriptionModal(false)}>Cancel</button>
            <button type="submit" className="sa-primary-cta">
              Process {subscriptionType === 'annual' ? 'Annual' : 'Monthly'} Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );

  const renderWorks = () => (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Works</h2>
          <p>{works.length} work orders found</p>
        </div>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>ID</th>
              <th>Company</th>
              <th>Property</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {works.map((work, index) => (
              <tr key={`work-${work.ID || work.id || index}`}>
                <td>{index + 1}</td>
                <td>{work.ID || work.id}</td>
                <td className="sa-cell-main">
                  <span className="sa-cell-title">{work.Company || work.company}</span>
                </td>
                <td>{work.Property || work.property}</td>
                <td>
                  <span className={`sa-status-pill ${(work.Status || work.status || 'pending').toLowerCase().replace('_', '-')}`}>
                    {work.Status || work.status || 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
            {works.length === 0 && (
              <tr>
                <td colSpan={5} className="sa-table-empty">No works found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Contracts page
  const renderContracts = () => (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Contract Management</h2>
          <p>Manage leases, expenses, and quotes</p>
        </div>
      </div>

      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-section-header">
          <h3>Leases Awaiting Signature</h3>
          <p>Lease agreements pending signature</p>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Tenant</th>
                <th>Property</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Rent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leasesAwaitingSignature.map((lease, index) => (
                <tr key={`lease-${lease.id || lease.ID || index}`}>
                  <td>{index + 1}</td>
                  <td className="sa-cell-main">
                    <span className="sa-cell-title">{lease.tenant || lease.Tenant}</span>
                  </td>
                  <td>{lease.property || lease.Property}</td>
                  <td>
                    {lease.startDate || lease.StartDate
                      ? new Date(lease.startDate || lease.StartDate).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    {lease.endDate || lease.EndDate
                      ? new Date(lease.endDate || lease.EndDate).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>{(lease.rent || lease.Rent || 0).toLocaleString()} FCFA</td>
                  <td>
                    <span className={`sa-status-pill ${(lease.status || lease.Status || 'draft').toLowerCase()}`}>
                      {lease.status || lease.Status || 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
              {leasesAwaitingSignature.length === 0 && (
                <tr>
                  <td colSpan={7} className="sa-table-empty">No leases awaiting signature</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-section-header">
          <h3>Owners</h3>
          <p>All property owners with management contracts</p>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Properties Count</th>
                <th>Contracts Count</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((owner, index) => (
                <tr key={`owner-${owner.id || owner.ID || index}`}>
                  <td>{index + 1}</td>
                  <td className="sa-cell-main">
                    <span className="sa-cell-title">{owner.name || owner.Name}</span>
                  </td>
                  <td>{owner.email || owner.Email}</td>
                  <td>{owner.propertiesCount || owner.PropertiesCount || 0}</td>
                  <td>{owner.contractsCount || owner.ContractsCount || 0}</td>
                  <td>
                    <span className={`sa-status-pill ${(owner.status || owner.Status || 'active').toLowerCase()}`}>
                      {owner.status || owner.Status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
              {owners.length === 0 && (
                <tr>
                  <td colSpan={6} className="sa-table-empty">No owners found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render Tenants page
  const renderTenants = () => (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Tenant Management</h2>
          <p>Manage all tenants and view detailed profiles</p>
        </div>
      </div>

      <div className="sa-filters-section" style={{ marginTop: '20px' }}>
        <select
          className="sa-filter-select"
          value={tenantStatusFilter}
          onChange={(e) => setTenantStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-section-header">
          <h3>All Tenants</h3>
          <p>{tenants.length} tenants found</p>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Property</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant, index) => (
                <tr key={`tenant-${tenant.id || tenant.ID || index}`}>
                  <td>{index + 1}</td>
                  <td className="sa-cell-main">
                    <span className="sa-cell-title">{tenant.name || tenant.Name}</span>
                  </td>
                  <td>{tenant.email || tenant.Email}</td>
                  <td>{tenant.phone || tenant.Phone}</td>
                  <td>{tenant.property || tenant.Property}</td>
                  <td>{(tenant.amount || tenant.Amount || 0).toLocaleString()} FCFA</td>
                  <td>
                    <span className={`sa-status-pill ${(tenant.status || tenant.Status || 'active').toLowerCase()}`}>
                      {tenant.status || tenant.Status || 'Active'}
                    </span>
                  </td>
                  <td className="sa-row-actions">
                    <button
                      className="sa-icon-button"
                      onClick={() => loadTenantProfile(tenant.id || tenant.ID)}
                      title="View Profile"
                      style={{ color: '#3b82f6' }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={8} className="sa-table-empty">No tenants found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showTenantProfileModal && tenantProfile && (
        <Modal
          isOpen={showTenantProfileModal}
          onClose={() => {
            setShowTenantProfileModal(false);
            setTenantProfile(null);
          }}
          title="Tenant Profile"
        >
          <div className="sa-form">
            <div className="sa-section-card" style={{ marginBottom: '20px' }}>
              <h4>Tenant Information</h4>
              <div className="sa-form-group">
                <label>Name:</label>
                <p>{tenantProfile.tenant?.name || tenantProfile.tenant?.Name || 'N/A'}</p>
              </div>
              <div className="sa-form-group">
                <label>Email:</label>
                <p>{tenantProfile.tenant?.email || tenantProfile.tenant?.Email || 'N/A'}</p>
              </div>
              <div className="sa-form-group">
                <label>Phone:</label>
                <p>{tenantProfile.tenant?.phone || tenantProfile.tenant?.Phone || 'N/A'}</p>
              </div>
              <div className="sa-form-group">
                <label>Property:</label>
                <p>{tenantProfile.tenant?.property || tenantProfile.tenant?.Property || 'N/A'}</p>
              </div>
              <div className="sa-form-group">
                <label>Status:</label>
                <p>
                  <span className={`sa-status-pill ${(tenantProfile.tenant?.status || tenantProfile.tenant?.Status || 'active').toLowerCase()}`}>
                    {tenantProfile.tenant?.status || tenantProfile.tenant?.Status || 'Active'}
                  </span>
                </p>
              </div>
              <div className="sa-form-group">
                <label>Payment Status:</label>
                <p>
                  <span className={`sa-status-pill ${tenantProfile.isUpToDate ? 'active' : 'pending'}`}>
                    {tenantProfile.isUpToDate ? 'Up to Date' : 'Pending'}
                  </span>
                </p>
              </div>
            </div>

            {tenantProfile.leaseAgreement && (
              <div className="sa-section-card" style={{ marginBottom: '20px' }}>
                <h4>Lease Agreement</h4>
                <div className="sa-form-group">
                  <label>Start Date:</label>
                  <p>
                    {tenantProfile.leaseAgreement.startDate || tenantProfile.leaseAgreement.StartDate
                      ? new Date(tenantProfile.leaseAgreement.startDate || tenantProfile.leaseAgreement.StartDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div className="sa-form-group">
                  <label>End Date:</label>
                  <p>
                    {tenantProfile.leaseAgreement.endDate || tenantProfile.leaseAgreement.EndDate
                      ? new Date(tenantProfile.leaseAgreement.endDate || tenantProfile.leaseAgreement.EndDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div className="sa-form-group">
                  <label>Rent:</label>
                  <p>{(tenantProfile.leaseAgreement.rent || tenantProfile.leaseAgreement.Rent || 0).toLocaleString()} FCFA</p>
                </div>
              </div>
            )}

            {tenantProfile.paymentHistory && tenantProfile.paymentHistory.length > 0 && (
              <div className="sa-section-card" style={{ marginBottom: '20px' }}>
                <h4>Payment History</h4>
                <div className="sa-table-wrapper">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenantProfile.paymentHistory.map((payment, idx) => (
                        <tr key={`payment-${idx}`}>
                          <td>
                            {payment.date || payment.Date
                              ? new Date(payment.date || payment.Date).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td>{(payment.amount || payment.Amount || 0).toLocaleString()} FCFA</td>
                          <td>
                            <span className={`sa-status-pill ${(payment.status || payment.Status || 'pending').toLowerCase()}`}>
                              {payment.status || payment.Status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );

  // Prepare chart data for Analytics
  const prepareTransferHistoryChartData = useMemo(() => {
    if (!transferHistory || transferHistory.length === 0) return [];
    
    // Group by date
    const grouped = transferHistory.reduce((acc, transfer) => {
      const date = transfer.date || transfer.Date;
      if (!date) return acc;
      const dateStr = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr, netAmount: 0, commission: 0, count: 0 };
      }
      acc[dateStr].netAmount += transfer.netAmount || transfer.NetAmount || 0;
      acc[dateStr].commission += transfer.commission || transfer.Commission || 0;
      acc[dateStr].count += 1;
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [transferHistory]);

  const prepareExpensesPerBuildingChartData = useMemo(() => {
    if (!expensesPerBuilding || Object.keys(expensesPerBuilding).length === 0) return [];
    
    return Object.entries(expensesPerBuilding).map(([building, expenses]) => {
      const total = Array.isArray(expenses) 
        ? expenses.reduce((sum, exp) => sum + (exp.amount || exp.Amount || 0), 0)
        : 0;
      return { building, amount: total };
    }).sort((a, b) => b.amount - a.amount).slice(0, 10); // Top 10
  }, [expensesPerBuilding]);

  const prepareExpensesPerOwnerChartData = useMemo(() => {
    if (!expensesPerOwner || Object.keys(expensesPerOwner).length === 0) return [];
    
    return Object.entries(expensesPerOwner).map(([ownerName, ownerData]) => {
      const total = ownerData?.totalAmount || ownerData?.expenses?.reduce((sum, exp) => sum + (exp.amount || exp.Amount || 0), 0) || 0;
      return { owner: ownerName, amount: total };
    }).sort((a, b) => b.amount - a.amount).slice(0, 10); // Top 10
  }, [expensesPerOwner]);

  const prepareCommissionsChartData = useMemo(() => {
    if (!commissionsData || Object.keys(commissionsData).length === 0) return [];
    
    const chartData = [];
    Object.entries(commissionsData).forEach(([building, months]) => {
      Object.entries(months).forEach(([month, amount]) => {
        chartData.push({ building, month, commission: amount || 0 });
      });
    });
    return chartData.sort((a, b) => a.month.localeCompare(b.month));
  }, [commissionsData]);

  const prepareUnpaidRentChartData = useMemo(() => {
    if (!unpaidRentReport || !unpaidRentReport.unpaidPayments) return [];
    
    return unpaidRentReport.unpaidPayments
      .map(payment => ({
        tenant: (payment.tenant || payment.Tenant || '').substring(0, 15),
        amount: payment.amount || payment.Amount || 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10
  }, [unpaidRentReport]);

  const prepareInternalExpensesChartData = useMemo(() => {
    if (!internalExpenses || internalExpenses.length === 0) return [];
    
    const grouped = internalExpenses.reduce((acc, expense) => {
      const date = expense.date || expense.Date;
      if (!date) return acc;
      const dateStr = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr, amount: 0 };
      }
      acc[dateStr].amount += expense.amount || expense.Amount || 0;
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [internalExpenses]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

  // Render Analytics/Reports page
  const renderAnalytics = () => (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Analytics & Reports</h2>
          <p>Comprehensive financial and operational reports with visualizations</p>
        </div>
      </div>

      <div className="sa-filters-section" style={{ marginTop: '20px' }}>
        <input
          type="text"
          className="sa-filter-input"
          placeholder="Owner ID"
          value={reportFilters.ownerId}
          onChange={(e) => setReportFilters({...reportFilters, ownerId: e.target.value})}
        />
        <input
          type="text"
          className="sa-filter-input"
          placeholder="Building"
          value={reportFilters.building}
          onChange={(e) => setReportFilters({...reportFilters, building: e.target.value})}
        />
        <input
          type="date"
          className="sa-filter-input"
          placeholder="Start Date"
          value={reportFilters.startDate}
          onChange={(e) => setReportFilters({...reportFilters, startDate: e.target.value})}
        />
        <input
          type="date"
          className="sa-filter-input"
          placeholder="End Date"
          value={reportFilters.endDate}
          onChange={(e) => setReportFilters({...reportFilters, endDate: e.target.value})}
        />
        <input
          type="month"
          className="sa-filter-input"
          placeholder="Month (YYYY-MM)"
          value={reportFilters.month}
          onChange={(e) => setReportFilters({...reportFilters, month: e.target.value})}
        />
        <button className="sa-primary-cta" onClick={loadAnalyticsData}>
          Apply Filters
        </button>
      </div>

      {/* Transfer History Chart */}
      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-section-header">
          <h3>Transfer History Over Time</h3>
          <p>Net amounts and commissions transferred to owners</p>
        </div>
        <div style={{ width: '100%', height: '400px', padding: '20px' }}>
          {prepareTransferHistoryChartData.length > 0 ? (
            <ResponsiveContainer>
              <LineChart data={prepareTransferHistoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                <Legend />
                <Line type="monotone" dataKey="netAmount" stroke="#3b82f6" strokeWidth={2} name="Net Amount" />
                <Line type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} name="Commission" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '100px', color: '#9ca3af' }}>No transfer data available</div>
          )}
        </div>
      </div>

      {/* Expenses Per Building Chart */}
      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-section-header">
          <h3>Expenses Per Building</h3>
          <p>Top 10 buildings by total expenses</p>
        </div>
        <div style={{ width: '100%', height: '400px', padding: '20px' }}>
          {prepareExpensesPerBuildingChartData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={prepareExpensesPerBuildingChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="building" type="category" width={150} />
                <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                <Bar dataKey="amount" fill="#3b82f6" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '100px', color: '#9ca3af' }}>No expense data available</div>
          )}
        </div>
      </div>

      {/* Expenses Per Owner Chart */}
      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-section-header">
          <h3>Expenses Per Owner</h3>
          <p>Top 10 owners by total expenses</p>
        </div>
        <div style={{ width: '100%', height: '400px', padding: '20px' }}>
          {prepareExpensesPerOwnerChartData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={prepareExpensesPerOwnerChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="owner" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                <Bar dataKey="amount" fill="#10b981" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '100px', color: '#9ca3af' }}>No expense data available</div>
          )}
        </div>
      </div>

      {/* Commissions Chart */}
      {prepareCommissionsChartData.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-section-header">
            <h3>Commissions Per Month Per Building</h3>
            <p>Commission trends by building and month</p>
          </div>
          <div style={{ width: '100%', height: '400px', padding: '20px' }}>
            <ResponsiveContainer>
              <BarChart data={prepareCommissionsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                <Legend />
                <Bar dataKey="commission" fill="#f59e0b" name="Commission" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Unpaid Rent Chart */}
      {unpaidRentReport && prepareUnpaidRentChartData.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-section-header">
            <h3>Unpaid Rent by Tenant</h3>
            <p>Top 10 tenants with highest unpaid amounts - Total: {(unpaidRentReport.totalUnpaid || 0).toLocaleString()} FCFA</p>
          </div>
          <div style={{ width: '100%', height: '400px', padding: '20px' }}>
            <ResponsiveContainer>
              <BarChart data={prepareUnpaidRentChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tenant" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                <Bar dataKey="amount" fill="#ef4444" name="Unpaid Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Internal Expenses Chart */}
      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-section-header">
          <h3>Internal Expenses Over Time</h3>
          <p>Agency internal expenses trend</p>
        </div>
        <div style={{ width: '100%', height: '400px', padding: '20px' }}>
          {prepareInternalExpensesChartData.length > 0 ? (
            <ResponsiveContainer>
              <LineChart data={prepareInternalExpensesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} name="Internal Expenses" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '100px', color: '#9ca3af' }}>No internal expense data available</div>
          )}
        </div>
      </div>
    </div>
  );

  // Render messaging/chat page
  const renderMessages = () => (
    <div className="sa-chat-page">
      <div className="sa-chat-layout">
        <div className="sa-chat-list">
          <h3>Users</h3>
          <ul>
            {chatUsers.map((user) => {
              const active = user.userId === selectedUserId;
              return (
                <li
                  key={`chat-user-${user.userId}`}
                  className={active ? 'active' : ''}
                  onClick={() => loadChatForUser(user.userId)}
                >
                  <div className="sa-cell-main">
                    <span className="sa-cell-title">{user.name || 'User'}</span>
                    <span className="sa-cell-sub">{user.email || ''}</span>
                    {user.role === 'superadmin' && (
                      <span style={{
                        display: 'inline-block',
                        background: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '0.65rem',
                        marginTop: '4px'
                      }}>
                        Super Admin
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
            {chatUsers.length === 0 && (
              <li style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                No users available
              </li>
            )}
          </ul>
        </div>
        
        <div className="sa-chat-conversation">
          <div className="sa-chat-header">
            <h3>Messages</h3>
            {selectedUserId && (
              <span className="sa-chat-subtitle">
                Chat with{' '}
                {
                  (chatUsers.find((u) => u.userId === selectedUserId) || {})
                    .name || 'User'
                }
              </span>
            )}
          </div>
          <div className="sa-chat-messages">
            {chatMessages.map((msg, index) => {
              // Handle both lowercase and camelCase field names
              // Note: Messages may include a 'type' field ('message' or 'superadmin_message')
              // to distinguish between Message and SuperAdminMessage tables, but this is
              // handled automatically by the backend and doesn't require special UI handling
              const messageContent = msg.content || msg.Content || '';
              const messageCreatedAt = msg.createdAt || msg.CreatedAt || '';
              const messageFromUserId = msg.fromUserId || msg.FromUserId;
              const messageId = msg.id || msg.ID || index;
              
              // Determine if message is outgoing or incoming
              // Compare IDs as strings to handle type mismatches
              const storedUser = localStorage.getItem('user');
              let isOutgoing = false;
              if (storedUser) {
                try {
                  const user = JSON.parse(storedUser);
                  const currentUserId = user.id || user.ID;
                  // Convert both to strings for reliable comparison
                  isOutgoing = String(messageFromUserId) === String(currentUserId);
                } catch (e) {
                  // Default to incoming if we can't parse user
                }
              }
              
              return (
                <div
                  key={`msg-${messageId}`}
                  className={`sa-chat-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}
                >
                  <p>{messageContent}</p>
                  <span className="sa-chat-meta">
                    {messageCreatedAt
                      ? new Date(messageCreatedAt).toLocaleString()
                      : ''}
                  </span>
                </div>
              );
            })}
            {chatMessages.length === 0 && (
              <div className="sa-table-empty">
                Select a conversation on the left to start chatting.
              </div>
            )}
          </div>
          <div className="sa-chat-input-row">
            <input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={!selectedUserId}
            />
            <button className="sa-primary-cta" onClick={handleSendMessage} disabled={!selectedUserId}>
              <MessageCircle size={16} />
              Send
            </button>
          </div>
        </div>
        
        <div className="sa-chat-details">
          <h4>Contact Details</h4>
          {selectedUserId ? (
            (() => {
              const user = chatUsers.find((u) => u.userId === selectedUserId) || {};
              return (
                <>
                  <p>
                    <strong>Name:</strong> {user.name || 'User'}
                  </p>
                  <p>
                    <strong>Email:</strong> {user.email || 'N/A'}
                  </p>
                  <p>
                    <strong>Role:</strong> {user.role || 'N/A'}
                  </p>
                  {user.company && (
                    <p>
                      <strong>Company:</strong> {user.company}
                    </p>
                  )}
                </>
              );
            })()
          ) : (
            <p>Select a user to view details.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUsers();
      case 'properties':
        return renderProperties();
      case 'tenants':
        return renderTenants();
      case 'contracts':
        return renderContracts();
      case 'accounting':
        return renderAccounting();
      case 'analytics':
        return renderAnalytics();
      case 'works':
        return renderWorks();
      case 'messages':
        return renderMessages();
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
        brand={{ name: 'SAAF IMMO', caption: 'Agency Director', logo: 'SAAF', logoImage: `${process.env.PUBLIC_URL}/download.jpeg` }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}
      >
        {({ activeId }) => (
          <div className="content-body">
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
    </>
  );
};

export default AgencyDirectorDashboard;


