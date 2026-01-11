import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BarChart3,
  Users,
  Home,
  DollarSign,
  Settings,
  Plus,
  Search,
  MessageCircle,
  CreditCard,
  FileText,
  TrendingUp,
  UserCheck,
  Megaphone
} from 'lucide-react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
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
import { API_CONFIG } from '../config/api';
import { isDemoMode, getAgencyDirectorDemoData } from '../utils/demoData';
import RoleLayout from '../components/RoleLayout';
import Modal from '../components/Modal';
import SettingsPage from './SettingsPage';
import AnalyticsPage from './AnalyticsPage';
import '../components/RoleLayout.css';
import '../pages/TechnicianDashboard.css';
import './SuperAdminDashboard.css';

const AgencyDirectorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [managementSubTab, setManagementSubTab] = useState('contracts'); // Sub-tab for management page
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const carouselIntervalRef = useRef(null);

  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [accountingData, setAccountingData] = useState(null);
  const [landlordPayments, setLandlordPayments] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);

  // Auto-slide carousel for advertisements on overview page
  useEffect(() => {
    if (activeTab === 'overview' && advertisements.length > 1) {
      carouselIntervalRef.current = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % advertisements.length);
      }, 5000); // Change slide every 5 seconds

      return () => {
        if (carouselIntervalRef.current) {
          clearInterval(carouselIntervalRef.current);
        }
      };
    } else {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
      setCurrentAdIndex(0);
    }
  }, [activeTab, advertisements.length]);

  // Filters
  const [userCompanyFilter, setUserCompanyFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearchText, setUserSearchText] = useState('');
  const [propertyCompanyFilter, setPropertyCompanyFilter] = useState('');
  const [propertyStatusFilter, setPropertyStatusFilter] = useState('');

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingOwner, setEditingOwner] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'salesmanager', password: '', properties: [] });
  const [propertyForm, setPropertyForm] = useState({ 
    address: '', 
    type: '', 
    rent: '', 
    tenant: '', 
    status: 'Vacant',
    units: [] 
  });
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', phone: '', password: '' });
  
  // Messaging states
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [superAdmins, setSuperAdmins] = useState([]);
  const [conversations, setConversations] = useState([]);
  
  // Subscription payment state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({ amount: '', currency: 'USD', reference: '', status: 'completed' });
  const [subscriptionType, setSubscriptionType] = useState('monthly'); // 'monthly' or 'annual'
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  // Contracts state
  const [leasesAwaitingSignature, setLeasesAwaitingSignature] = useState([]);
  const [expenseRequests, setExpenseRequests] = useState([]);
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [owners, setOwners] = useState([]);
  
  // Management state - Pending approvals
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingQuotes, setPendingQuotes] = useState([]);

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
  
  // New Analytics state
  const [analyticsIndicators, setAnalyticsIndicators] = useState(null);
  const [yearlyComparison, setYearlyComparison] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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
    localStorage.removeItem('demo_mode');
    window.location.href = '/';
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        // Use demo data
        const demoData = getAgencyDirectorDemoData();
        setOverviewData(demoData.overview);
        setUsers(demoData.users);
        setProperties(demoData.properties);
        setFinancialData(demoData.financial);
        setAccountingData(demoData.accounting);
        setLandlordPayments(demoData.landlordPayments);
        setSubscriptionInfo(demoData.subscriptionInfo);
        setOwners(demoData.owners);
        setSuperAdmins([]);
        setConversations(demoData.conversations);
        setLoading(false);
        return;
      }
      
      const [overview, usersData, propertiesData, financial, accounting, landlordPaymentsData, subscriptionStatusData] = await Promise.all([
        agencyDirectorService.getOverview().catch(() => null),
        agencyDirectorService.getUsers().catch(() => []),
        agencyDirectorService.getProperties().catch(() => []),
        agencyDirectorService.getFinancialOverview().catch(() => null),
        agencyDirectorService.getAccountingOverview().catch(() => null),
        agencyDirectorService.getLandlordPayments().catch(() => []),
        agencyDirectorService.getSubscriptionStatus().catch(() => null)
      ]);

      setOverviewData(overview);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      setFinancialData(financial);
      setAccountingData(accounting);
      setLandlordPayments(Array.isArray(landlordPaymentsData) ? landlordPaymentsData : []);
      setSubscriptionInfo(subscriptionStatusData);
      
      // Fetch conversations to get super admins and other users who have messaged
      try {
        const conversationsData = await agencyDirectorService.getConversations().catch(() => []);
        if (Array.isArray(conversationsData)) {
        // Extract super admins from conversations (users with role 'superadmin')
          const superAdminUsers = conversationsData.filter(conv => {
            const role = (conv.role || conv.user?.role || '').toLowerCase();
            return role === 'superadmin';
          });
        setSuperAdmins(superAdminUsers);
          
          // Store all conversations for use in chatUsers useMemo
          setConversations(conversationsData);
        } else {
          setSuperAdmins([]);
          setConversations([]);
        }
      } catch (error) {
        console.warn('Could not fetch conversations:', error);
        setSuperAdmins([]);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error loading agency director data:', error);
      if (!isDemoMode()) {
        addNotification('Failed to load data from server', 'error');
      }
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

  // Get all chat users (agency users + super admins + users from conversations)
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
        if (userId && String(userId) !== String(currentUserId) && !addedUserIds.has(String(userId))) {
          allUsers.push({
            userId: userId,
            name: user.Name || user.name,
            email: user.Email || user.email,
            role: user.Role || user.role,
            company: user.Company || user.company,
            unreadCount: 0
          });
          addedUserIds.add(String(userId));
        }
      });
    }
    
    // Add super admins from conversations (they have role 'superadmin')
    if (superAdmins && Array.isArray(superAdmins)) {
      superAdmins.forEach(admin => {
        const adminId = admin.userId || admin.ID || admin.id;
        const adminIdStr = String(adminId);
        if (adminId && adminIdStr !== String(currentUserId) && !addedUserIds.has(adminIdStr)) {
          allUsers.push({
            userId: adminId,
            name: admin.name || admin.Name,
            email: admin.email || admin.Email,
            role: admin.role || admin.Role || 'superadmin',
            company: admin.company || admin.Company || 'SAAF IMMO',
            unreadCount: admin.unreadCount || 0
          });
          addedUserIds.add(adminIdStr);
        }
      });
    }
    
    // Add users from conversations who have messaged but aren't in users list
    if (conversations && Array.isArray(conversations)) {
      conversations.forEach(conv => {
        const convUserId = conv.userId || conv.userID || conv.user?.id || conv.user?.ID;
        const convUserIdStr = String(convUserId);
        
        // Skip if already added or is current user
        if (!convUserId || convUserIdStr === String(currentUserId) || addedUserIds.has(convUserIdStr)) {
          return;
        }
        
        // Skip if it's a superadmin (already handled above)
        const role = (conv.role || conv.user?.role || '').toLowerCase();
        if (role === 'superadmin') {
          return;
        }
        
        // Add user from conversation
        const convUser = conv.user || {};
        allUsers.push({
          userId: convUserId,
          name: convUser.name || convUser.Name || conv.name || 'User',
          email: convUser.email || convUser.Email || conv.email || '',
          role: convUser.role || convUser.Role || conv.role || '',
          company: convUser.company || convUser.Company || conv.company || '',
          unreadCount: conv.unreadCount || 0
        });
        addedUserIds.add(convUserIdStr);
        console.log('Added user from conversation:', { userId: convUserId, name: convUser.name || conv.name });
      });
    }
    
    // Sort: super admins first, then others
    return allUsers.sort((a, b) => {
      if (a.role === 'superadmin' && b.role !== 'superadmin') return -1;
      if (a.role !== 'superadmin' && b.role === 'superadmin') return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [users, superAdmins, conversations]);

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
      if (isDemoMode()) {
        const demoData = getAgencyDirectorDemoData();
        setLeasesAwaitingSignature([]);
        setOwners(demoData.owners);
        return;
      }
      
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

  // Load pending approvals data
  const loadPendingApprovals = useCallback(async () => {
    try {
      const [payments, quotes] = await Promise.all([
        agencyDirectorService.getPendingPayments().catch(() => []),
        agencyDirectorService.getPendingQuotes().catch(() => [])
      ]);
      setPendingPayments(Array.isArray(payments) ? payments : []);
      setPendingQuotes(Array.isArray(quotes) ? quotes : []);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
      addNotification('Failed to load pending approvals', 'error');
    }
  }, [addNotification]);

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

  // Load new analytics indicators and yearly comparison
  const loadNewAnalyticsData = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const [indicators, yearly] = await Promise.all([
        agencyDirectorService.getAnalyticsIndicators().catch(() => null),
        agencyDirectorService.getYearlyComparison().catch(() => null)
      ]);
      setAnalyticsIndicators(indicators);
      setYearlyComparison(yearly);
    } catch (error) {
      console.error('Error loading new analytics data:', error);
      addNotification('Failed to load analytics data', 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load data when specific tabs are active
  useEffect(() => {
    if (activeTab === 'contracts' || (activeTab === 'management' && managementSubTab === 'contracts')) {
      loadContractsData();
    }
  }, [activeTab, managementSubTab, loadContractsData]);

  useEffect(() => {
    if (activeTab === 'tenants' || activeTab === 'owners') {
      loadTenantsData();
    }
  }, [activeTab, loadTenantsData]);

  useEffect(() => {
    if (activeTab === 'management' && (managementSubTab === 'payments-to-approve' || managementSubTab === 'quotes-to-validate')) {
      loadPendingApprovals();
    }
  }, [activeTab, managementSubTab, loadPendingApprovals]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData();
      loadNewAnalyticsData();
    }
  }, [activeTab, loadAnalyticsData, loadNewAnalyticsData]);

  // Load advertisements when advertisements tab is active or overview is active
  useEffect(() => {
    if (activeTab === 'advertisements' || activeTab === 'overview') {
      loadAdvertisements();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps


  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: BarChart3 },
      { id: 'management', label: 'Management', icon: Users },
      { id: 'users', label: 'Users', icon: UserCheck },
      { id: 'owners', label: 'Owners', icon: Users },
      { id: 'properties', label: 'Properties', icon: Home },
      { id: 'accounting', label: 'Accounting', icon: DollarSign },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
      { id: 'advertisements', label: 'Advertisements', icon: Megaphone },
      { id: 'messages', label: 'Messages', icon: MessageCircle },
      { id: 'subscription', label: 'Subscription', icon: CreditCard },
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
    setUserForm({ name: '', email: '', role: 'salesmanager', password: '', properties: [] });
    setShowUserModal(true);
  };

  const handleAddPropertyToForm = () => {
    setUserForm(prev => ({
      ...prev,
      properties: [...prev.properties, { propertyId: '' }]
    }));
  };

  const handleRemovePropertyFromForm = (index) => {
    setUserForm(prev => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index)
    }));
  };

  const handlePropertyFormChange = (index, propertyId) => {
    setUserForm(prev => ({
      ...prev,
      properties: prev.properties.map((prop, i) => 
        i === index ? { propertyId: propertyId } : prop
      )
    }));
  };

  // Get available properties for a specific index (excludes other selected properties but includes the current one)
  const getAvailablePropertiesForIndex = useCallback((index) => {
    const selectedPropertyIds = userForm.properties
      .map((p, i) => i !== index ? p.propertyId : null) // Exclude current index
      .filter(id => id && id !== '');
    
    return properties.filter(prop => {
      const propId = String(prop.id || prop.ID || '');
      return propId && !selectedPropertyIds.includes(propId);
    });
  }, [properties, userForm.properties]);

  // Get selected property details
  const getSelectedProperty = (propertyId) => {
    if (!propertyId) return null;
    return properties.find(prop => String(prop.id || prop.ID || '') === String(propertyId));
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.Name || user.name || '',
      email: user.Email || user.email || '',
      role: user.Role || user.role || 'salesmanager',
      password: '',
      properties: [] // Properties are only for creating new landlords, not editing
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

      // If creating a landlord, properties are required
      if (!editingUser && userForm.role === 'landlord') {
        // Filter out empty property selections
        const validProperties = userForm.properties.filter(prop => prop.propertyId && prop.propertyId !== '');
        if (validProperties.length === 0) {
          addNotification('At least one property must be selected when creating a landlord', 'error');
          return;
        }
        // Get property details from selected property IDs
        userData.properties = validProperties.map(prop => {
          const selectedProp = properties.find(p => String(p.id || p.ID || '') === String(prop.propertyId));
          if (!selectedProp) {
            throw new Error(`Property with ID ${prop.propertyId} not found`);
          }
          // Format property for API (address is required, other fields optional)
          const formattedProp = { 
            address: (selectedProp.address || selectedProp.Address || '').trim()
          };
          if (!formattedProp.address) {
            throw new Error('Selected property must have an address');
          }
          // Include optional fields if they exist
          if (selectedProp.type || selectedProp.Type) formattedProp.type = (selectedProp.type || selectedProp.Type || '').trim();
          if (selectedProp.bedrooms !== undefined || selectedProp.Bedrooms !== undefined) {
            formattedProp.bedrooms = parseFloat(selectedProp.bedrooms || selectedProp.Bedrooms || 0);
          }
          if (selectedProp.bathrooms !== undefined || selectedProp.Bathrooms !== undefined) {
            formattedProp.bathrooms = parseFloat(selectedProp.bathrooms || selectedProp.Bathrooms || 0);
          }
          if (selectedProp.rent !== undefined || selectedProp.Rent !== undefined) {
            formattedProp.rent = parseFloat(selectedProp.rent || selectedProp.Rent || 0);
          }
          if (selectedProp.status || selectedProp.Status) {
            formattedProp.status = (selectedProp.status || selectedProp.Status || 'Vacant').trim();
          }
          return formattedProp;
        });
      }

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
      addNotification(error.message || (editingUser ? 'Failed to update user' : 'Failed to create user'), 'error');
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

  // Owner management handlers
  const handleOpenAddOwner = () => {
    setEditingOwner(null);
    setOwnerForm({ name: '', email: '', phone: '', password: '' });
    setShowOwnerModal(true);
  };

  const handleOpenEditOwner = (owner) => {
    setEditingOwner(owner);
    setOwnerForm({
      name: owner.name || owner.Name || '',
      email: owner.email || owner.Email || '',
      phone: owner.phone || owner.Phone || '',
      password: '' // Password is not pre-filled for security
    });
    setShowOwnerModal(true);
  };

  const handleSubmitOwner = async (e) => {
    e.preventDefault();
    try {
      if (editingOwner) {
        await agencyDirectorService.updateOwner(editingOwner.id || editingOwner.ID, ownerForm);
        addNotification('Owner updated successfully!', 'success');
      } else {
        await agencyDirectorService.createOwner(ownerForm);
        addNotification('Owner created successfully!', 'success');
      }
      setShowOwnerModal(false);
      await loadData();
    } catch (error) {
      console.error('Error saving owner:', error);
      addNotification(error.message || (editingOwner ? 'Failed to update owner' : 'Failed to create owner'), 'error');
    }
  };

  const handleDeleteOwner = async (owner) => {
    if (window.confirm(`Are you sure you want to delete owner ${owner.name || owner.Name}? This action cannot be undone.`)) {
      try {
        await agencyDirectorService.deleteOwner(owner.id || owner.ID);
        addNotification('Owner deleted successfully!', 'success');
        await loadData();
      } catch (error) {
        console.error('Error deleting owner:', error);
        addNotification(error.message || 'Failed to delete owner', 'error');
      }
    }
  };

  // Property management - Add property functionality removed for Agency Director
  // const handleOpenAddProperty = () => {
  //   setEditingProperty(null);
  //   setPropertyForm({ address: '', type: '', rent: '', tenant: '', status: 'Vacant', units: [] });
  //   setShowPropertyModal(true);
  // };

  const handleOpenEditProperty = (property) => {
    setEditingProperty(property);
    const propertyUnits = property.units || property.Units || [];
    setPropertyForm({
      address: property.Address || property.address || '',
      type: property.Type || property.type || '',
      rent: property.Rent || property.rent || '',
      tenant: property.Tenant || property.tenant || '',
      status: property.Status || property.status || 'Vacant',
      units: propertyUnits.map(unit => ({
        unitNumber: unit.unitNumber || unit.UnitNumber || '',
        rent: unit.rent || unit.Rent || '',
        bedrooms: unit.bedrooms || unit.Bedrooms || '',
        bathrooms: unit.bathrooms || unit.Bathrooms || '',
        status: unit.status || unit.Status || 'Vacant',
        tenant: unit.tenant || unit.Tenant || ''
      }))
    });
    setShowPropertyModal(true);
  };

  // Unit management functions
  const handleAddUnit = () => {
    setPropertyForm(prev => ({
      ...prev,
      units: [...prev.units, { unitNumber: '', rent: '', bedrooms: '', bathrooms: '', status: 'Vacant', tenant: '' }]
    }));
  };

  const handleRemoveUnit = (index) => {
    setPropertyForm(prev => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== index)
    }));
  };

  const handleUnitChange = (index, field, value) => {
    setPropertyForm(prev => ({
      ...prev,
      units: prev.units.map((unit, i) => 
        i === index ? { ...unit, [field]: value } : unit
      )
    }));
  };

  const handleSubmitProperty = async (e) => {
    e.preventDefault();
    try {
      const propertyData = {
        address: propertyForm.address,
        type: propertyForm.type,
        rent: parseFloat(propertyForm.rent) || 0,
        tenant: propertyForm.tenant || null,
        status: propertyForm.status
        // Company is automatically set from token, not required in request
      };

      // Add units if provided (only for new properties or if updating with units)
      if (propertyForm.units && propertyForm.units.length > 0) {
        propertyData.units = propertyForm.units
          .filter(unit => unit.unitNumber && unit.unitNumber.trim() !== '') // Only include units with unitNumber
          .map(unit => ({
            unitNumber: unit.unitNumber.trim(),
            rent: parseFloat(unit.rent) || 0,
            bedrooms: parseInt(unit.bedrooms) || 0,
            bathrooms: parseFloat(unit.bathrooms) || 0,
            status: unit.status || 'Vacant',
            tenant: unit.tenant && unit.tenant.trim() !== '' ? unit.tenant.trim() : null
          }));
      }

      if (editingProperty) {
        await agencyDirectorService.updateProperty(editingProperty.ID || editingProperty.id, propertyData);
        addNotification('Property updated successfully!', 'success');
      } else {
        // Agency Director cannot add new properties
        addNotification('You do not have permission to add new properties', 'error');
        return;
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
  const renderOverview = () => {
    if (loading) {
      return <div className="sa-table-empty">Loading overview data...</div>;
    }

    const data = overviewData || {};
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = currentUser.name || currentUser.Name || 'Agency Director';

    // Calculate chart data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentRent = data.totalRentCollected || 0;
    const currentOccupancy = data.overallOccupancyRate || 0;
    const chartData = months.map((month, index) => ({
      month,
      rent: Math.round(currentRent * (0.7 + (index * 0.05))),
      occupancy: Math.round(currentOccupancy * (0.85 + (index * 0.025)))
    }));

    return (
    <div className="sa-overview-page">
        <div className="sa-overview-top">
          <div className="sa-overview-chart-card">
            <div className="sa-card-header">
              <h2>Agency Director Dashboard</h2>
              <span className="sa-card-subtitle">Welcome, {userName}!</span>
            </div>
            <div className="sa-mini-legend">
              <span className="sa-legend-item sa-legend-expected">Rent Collected (XOF)</span>
              <span className="sa-legend-item sa-legend-current">Occupancy Rate (%)</span>
            </div>
            <div style={{ width: '100%', height: '200px', marginTop: '20px' }}>
              <ResponsiveContainer>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#6b7280" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#6b7280" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      padding: '8px 12px'
                    }}
                    formatter={(value, name) => {
                      if (name === 'rent') return [`${value.toLocaleString()} XOF`, 'Rent Collected'];
                      if (name === 'occupancy') return [`${value}%`, 'Occupancy Rate'];
                      return value;
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="line"
                  />
                  <Area
                    yAxisId="left"
                    type="natural"
                    dataKey="rent"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorRent)"
                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name="Rent Collected"
                  />
                  <Area
                    yAxisId="right"
                    type="natural"
                    dataKey="occupancy"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#colorOccupancy)"
                    dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name="Occupancy Rate"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sa-overview-metrics">
        <div className="sa-metric-card sa-metric-primary">
              <p className="sa-metric-label">Total Rent Collected</p>
              <p className="sa-metric-period">This Month</p>
          <p className="sa-metric-value">
                {(data.totalRentCollected || 0).toLocaleString()} XOF
          </p>
        </div>
        <div className="sa-metric-card">
              <p className="sa-metric-label">Overall Occupancy Rate</p>
          <p className="sa-metric-number">
                {data.overallOccupancyRate ? `${data.overallOccupancyRate.toFixed(1)}%` : '0%'}
          </p>
        </div>
        <div className="sa-metric-card">
              <p className="sa-metric-label">Active Tenants</p>
              <p className="sa-metric-value">
                {data.numberOfActiveTenants || data.activeTenants || 0}
          </p>
        </div>
        <div className="sa-metric-card">
              <p className="sa-metric-label">Total Managed Apartments</p>
              <p className="sa-metric-number">
                {data.totalManagedApartments || data.totalProperties || properties.length || 0}
              </p>
            </div>
            {/* Advertisements Display - Replacing Banner Card */}
            {advertisements.length > 0 ? (
              <div style={{
                gridColumn: 'span 2',
                minHeight: '400px',
                padding: '32px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <h3 style={{
                  margin: '0 0 20px 0',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Advertisements
                </h3>
                <div style={{
                  position: 'relative',
                  overflow: 'hidden',
                  flex: 1
                }}>
                  <div style={{
                    display: 'flex',
                    transform: `translateX(-${currentAdIndex * 100}%)`,
                    transition: 'transform 0.5s ease-in-out',
                    width: `${advertisements.length * 100}%`
                  }}>
                    {advertisements.map((ad, index) => {
                    const imageUrl = ad.ImageURL || ad.imageUrl || ad.imageURL;
                    const fullImageUrl = imageUrl 
                      ? (imageUrl.startsWith('http') ? imageUrl : `${API_CONFIG.BASE_URL}${imageUrl}`)
                      : null;

                    return (
                      <div 
                        key={`ad-${ad.ID || ad.id || index}`}
                        style={{
                          width: `${100 / advertisements.length}%`,
                          padding: '20px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          flexShrink: 0
                        }}
                      >
                        {fullImageUrl && (
                          <img 
                            src={fullImageUrl} 
                            alt={ad.Title || ad.title || 'Advertisement'} 
                            style={{
                              width: '100%',
                              height: 'auto',
                              maxHeight: '250px',
                              objectFit: 'contain',
                              borderRadius: '8px',
                              marginBottom: '16px'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <h3 style={{ 
                          margin: '0 0 8px 0', 
                          fontSize: '1.1rem', 
                          color: '#1f2937',
                          fontWeight: '600'
                        }}>
                          {ad.Title || ad.title || 'Untitled Advertisement'}
                        </h3>
                        <p style={{ 
                          margin: '0 0 12px 0', 
                          fontSize: '0.9rem', 
                          color: '#6b7280',
                          lineHeight: '1.5'
                        }}>
                          {ad.Text || ad.text || ad.description || ad.Description || 'No description available'}
                        </p>
                        {ad.CreatedAt && (
                          <span style={{ 
                            fontSize: '0.8rem', 
                            color: '#9ca3af'
                          }}>
                            Posted: {new Date(ad.CreatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  </div>
                  
                  {/* Carousel Indicators */}
                  {advertisements.length > 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '16px',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)'
                    }}>
                      {advertisements.map((_, index) => (
                        <button
                          key={`indicator-${index}`}
                          onClick={() => {
                            setCurrentAdIndex(index);
                            if (carouselIntervalRef.current) {
                              clearInterval(carouselIntervalRef.current);
                            }
                            carouselIntervalRef.current = setInterval(() => {
                              setCurrentAdIndex((prevIndex) => (prevIndex + 1) % advertisements.length);
                            }, 5000);
                          }}
                          style={{
                            width: index === currentAdIndex ? '24px' : '8px',
                            height: '8px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: index === currentAdIndex ? '#3b82f6' : '#d1d5db',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="sa-banner-card">
                <div className="sa-banner-text">
                  <h3>Agency Management</h3>
                  <p>
                    Manage your properties, tenants, and financial operations all in one place.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sa-section-card" style={{ marginTop: '24px' }}>
          <div className="sa-section-header">
            <h3>Quick Actions</h3>
            <p>Manage your agency operations and view key metrics.</p>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('management')}>
                <p className="sa-metric-label">Total Unpaid Rent</p>
                <p className="sa-metric-value" style={{ color: '#dc2626' }}>
                  {(data.totalUnpaidRent || 0).toLocaleString()} FCFA
                </p>
              </div>
              <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('accounting')}>
                <p className="sa-metric-label">Reimbursements to Owners</p>
          <p className="sa-metric-value">
                  {(data.totalReimbursementsToOwners || 0).toLocaleString()} FCFA
          </p>
        </div>
              <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('accounting')}>
                <p className="sa-metric-label">Agency Commissions</p>
                <p className="sa-metric-value">
                  {(data.totalAgencyCommissions || data.agencyCommissionsCurrentMonth || 0).toLocaleString()} FCFA
          </p>
        </div>
            </div>
        </div>
      </div>
    </div>
  );
  };

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
            <select 
              value={userForm.role} 
              onChange={(e) => {
                const newRole = e.target.value;
                setUserForm({
                  ...userForm, 
                  role: newRole,
                  // Reset properties if role changes from/to landlord
                  properties: newRole === 'landlord' && !editingUser ? (userForm.properties.length > 0 ? userForm.properties : [{ propertyId: '' }]) : []
                });
              }} 
              required
            >
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
              {!editingUser && userForm.role === 'landlord' && (
                <span style={{ color: '#dc2626', display: 'block', marginTop: '4px' }}>
                  ⚠️ Properties are required for landlords
                </span>
              )}
            </small>
          </div>
          
          {/* Properties section - only show when creating a landlord */}
          {!editingUser && userForm.role === 'landlord' && (
            <div className="sa-form-group" style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <label style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
                  Properties * <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6b7280' }}>(At least one required)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddPropertyToForm}
                  style={{
                    padding: '6px 12px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={14} />
                  Add Property
                </button>
              </div>
              
              {userForm.properties.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                  No properties selected. Click "Add Property" to select at least one property.
                </div>
              )}
              
              {userForm.properties.map((property, index) => {
                const selectedProperty = getSelectedProperty(property.propertyId);
                return (
                  <div key={index} style={{ 
                    marginBottom: '16px', 
                    padding: '16px', 
                    background: 'white', 
                    borderRadius: '8px', 
                    border: '1px solid #d1d5db',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1f2937' }}>Property {index + 1}</h4>
                      {userForm.properties.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePropertyFromForm(index)}
                          style={{
                            padding: '4px 8px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                        Select Property *
                      </label>
                      <select
                        value={property.propertyId || ''}
                        onChange={(e) => handlePropertyFormChange(index, e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                      >
                        <option value="">-- Select a property --</option>
                        {getAvailablePropertiesForIndex(index).map(prop => {
                          const propId = String(prop.id || prop.ID || '');
                          const address = prop.address || prop.Address || 'Unknown Address';
                          const type = prop.type || prop.Type || '';
                          return (
                            <option key={propId} value={propId}>
                              {address} {type ? `(${type})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    {selectedProperty && (
                      <div style={{ 
                        padding: '12px', 
                        background: '#f0f9ff', 
                        borderRadius: '6px', 
                        border: '1px solid #bae6fd',
                        fontSize: '0.85rem'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#1e40af' }}>
                          <div>
                            <strong>Address:</strong> {selectedProperty.address || selectedProperty.Address || 'N/A'}
                          </div>
                          <div>
                            <strong>Type:</strong> {selectedProperty.type || selectedProperty.Type || 'N/A'}
                          </div>
                          {(selectedProperty.bedrooms !== undefined || selectedProperty.Bedrooms !== undefined) && (
                            <div>
                              <strong>Bedrooms:</strong> {selectedProperty.bedrooms || selectedProperty.Bedrooms || 'N/A'}
                            </div>
                          )}
                          {(selectedProperty.bathrooms !== undefined || selectedProperty.Bathrooms !== undefined) && (
                            <div>
                              <strong>Bathrooms:</strong> {selectedProperty.bathrooms || selectedProperty.Bathrooms || 'N/A'}
                            </div>
                          )}
                          {(selectedProperty.rent !== undefined || selectedProperty.Rent !== undefined) && (
                            <div>
                              <strong>Rent:</strong> {(selectedProperty.rent || selectedProperty.Rent || 0).toLocaleString()} XOF
                            </div>
                          )}
                          <div>
                            <strong>Status:</strong> {selectedProperty.status || selectedProperty.Status || 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {properties.length === 0 && (
                <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '6px', border: '1px solid #fbbf24', fontSize: '0.85rem', color: '#92400e' }}>
                  ⚠️ No properties available. Please create properties first before assigning them to a landlord.
                </div>
              )}
            </div>
          )}
          
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
          <div className="sa-transactions-filters">
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
              <th>Property Type</th>
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
                <td>
                  <div className="sa-cell-main">
                    <span className="sa-cell-title">{property.Type || property.type}</span>
                    {property.BuildingType || property.buildingType ? (
                      <span className="sa-cell-sub">({property.BuildingType || property.buildingType})</span>
                    ) : null}
                  </div>
                </td>
                <td>{property.PropertyType || property.propertyType || 'N/A'}</td>
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
                <td colSpan={9} className="sa-table-empty">No properties found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showPropertyModal && editingProperty} onClose={() => setShowPropertyModal(false)} title="Edit Property">
        {editingProperty && (
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
            <input type="text" value={propertyForm.type} onChange={(e) => setPropertyForm({...propertyForm, type: e.target.value})} required placeholder="e.g., Apartment Building, House, Condo" />
          </div>
          <div className="sa-form-group">
            <label>Rent</label>
            <input type="number" value={propertyForm.rent} onChange={(e) => setPropertyForm({...propertyForm, rent: e.target.value})} placeholder="Base rent (optional if units provided)" />
          </div>
          <div className="sa-form-group">
            <label>Tenant</label>
            <input type="text" value={propertyForm.tenant} onChange={(e) => setPropertyForm({...propertyForm, tenant: e.target.value})} placeholder="Main tenant (optional)" />
          </div>
          <div className="sa-form-group">
            <label>Status *</label>
            <select value={propertyForm.status} onChange={(e) => setPropertyForm({...propertyForm, status: e.target.value})} required>
              <option value="Vacant">Vacant</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          {/* Units Section */}
          <div className="sa-form-group" style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
                Units/Houses <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6b7280' }}>(Optional - for properties with multiple units)</span>
              </label>
              <button
                type="button"
                onClick={handleAddUnit}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                + Add Unit
              </button>
            </div>
            {propertyForm.units.map((unit, index) => (
              <div key={index} style={{ marginBottom: '16px', padding: '16px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#6b7280' }}>Unit {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveUnit(index)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Unit Number *</label>
                    <input
                      type="text"
                      value={unit.unitNumber}
                      onChange={(e) => handleUnitChange(index, 'unitNumber', e.target.value)}
                      placeholder="e.g., 101, A1, Unit 5"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                      required={propertyForm.units.length > 0}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Rent *</label>
                    <input
                      type="number"
                      value={unit.rent}
                      onChange={(e) => handleUnitChange(index, 'rent', e.target.value)}
                      placeholder="0.00"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                      required={propertyForm.units.length > 0}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Bedrooms</label>
                    <input
                      type="number"
                      value={unit.bedrooms}
                      onChange={(e) => handleUnitChange(index, 'bedrooms', e.target.value)}
                      placeholder="0"
                      min="0"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Bathrooms</label>
                    <input
                      type="number"
                      step="0.5"
                      value={unit.bathrooms}
                      onChange={(e) => handleUnitChange(index, 'bathrooms', e.target.value)}
                      placeholder="0.0"
                      min="0"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Status</label>
                    <select
                      value={unit.status}
                      onChange={(e) => handleUnitChange(index, 'status', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                    >
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Tenant</label>
                    <input
                      type="text"
                      value={unit.tenant}
                      onChange={(e) => handleUnitChange(index, 'tenant', e.target.value)}
                      placeholder="Tenant name (optional)"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {propertyForm.units.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
                No units added. Click "Add Unit" to add units/houses for this property.
              </p>
            )}
          </div>

          <div className="sa-form-actions">
            <button type="button" className="sa-outline-button" onClick={() => setShowPropertyModal(false)}>Cancel</button>
            <button type="submit" className="sa-primary-cta">Update Property</button>
          </div>
        </form>
        )}
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
          <div>
            <h3>Owners</h3>
            <p>Manage property owners (landlords) for property assignment</p>
          </div>
          <button className="sa-primary-cta" onClick={handleOpenAddOwner}>
            <Plus size={16} />
            Add Owner
          </button>
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
                <th />
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
                  <td className="sa-row-actions">
                    <button className="sa-icon-button" onClick={() => handleOpenEditOwner(owner)} title="Edit">✏️</button>
                    <button className="sa-icon-button" onClick={() => handleDeleteOwner(owner)} title="Delete">🗑️</button>
                  </td>
                </tr>
              ))}
              {owners.length === 0 && (
                <tr>
                  <td colSpan={7} className="sa-table-empty">No owners found. Click "Add Owner" to create one.</td>
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
  const renderAnalytics = () => {
    // Use new comprehensive analytics page if data is available
    if (analyticsIndicators && yearlyComparison) {
      return (
        <AnalyticsPage 
          indicators={analyticsIndicators}
          yearlyComparison={yearlyComparison}
          loading={analyticsLoading}
        />
      );
    }

    // Fallback to old analytics page
    return (
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

  // Load advertisements
  const loadAdvertisements = async () => {
    try {
      const ads = await agencyDirectorService.getAdvertisements();
      setAdvertisements(Array.isArray(ads) ? ads : []);
    } catch (error) {
      console.error('Failed to load advertisements:', error);
      addNotification('Failed to load advertisements', 'error');
      setAdvertisements([]);
    }
  };

  const renderAdvertisements = () => {
    return (
      <div className="sa-ads-page">
        <div className="sa-ads-header">
          <div>
            <h2>Advertisements</h2>
            <p>View active advertisements posted by Super Admin</p>
          </div>
        </div>

        <div className="sa-ads-list">
          {advertisements.length > 0 ? (
            advertisements.map((ad, index) => {
              const imageUrl = ad.ImageURL || ad.imageUrl || ad.imageURL;
              const fullImageUrl = imageUrl 
                ? (imageUrl.startsWith('http') ? imageUrl : `${API_CONFIG.BASE_URL}${imageUrl}`)
                : null;

              return (
                <div key={`ad-${ad.ID || ad.id || index}`} className="sa-ad-card">
                  <div className="sa-ad-status-column">
                    <span className="sa-ad-status published">Active</span>
                  </div>
                  <div className="sa-ad-main">
                    {fullImageUrl && (
                      <img 
                        src={fullImageUrl} 
                        alt={ad.Title || ad.title || 'Advertisement'} 
                        className="sa-ad-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <h3>{ad.Title || ad.title || 'Untitled Advertisement'}</h3>
                    <p>{ad.Text || ad.text || ad.description || ad.Description || 'No description available'}</p>
                    {ad.CreatedAt && (
                      <span className="sa-ad-date" style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px', display: 'block' }}>
                        Posted: {new Date(ad.CreatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="sa-table-empty">
              No active advertisements available at this time.
            </div>
          )}
        </div>
      </div>
    );
  };

  // Combined Management page with tabs
  const renderManagement = () => {
    const managementTabs = [
      { id: 'contracts', label: 'LEASE AGREEMENTS TO SIGN' },
      { id: 'payments-to-approve', label: 'PAYMENT TO APPROVE' },
      { id: 'quotes-to-validate', label: 'QUOTE TO VALIDATE' }
    ];

    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header">
          <div>
            <h2>Overview</h2>
          </div>
        </div>

        {/* Sub-tabs navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '0', 
          marginTop: '20px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '0'
        }}>
          {managementTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setManagementSubTab(tab.id)}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: managementSubTab === tab.id ? '#f3f4f6' : 'transparent',
                color: managementSubTab === tab.id ? '#1f2937' : '#6b7280',
                fontWeight: managementSubTab === tab.id ? '600' : '400',
                fontSize: '14px',
                cursor: 'pointer',
                borderBottom: managementSubTab === tab.id ? '2px solid #8b5cf6' : '2px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content based on selected sub-tab */}
        <div style={{ marginTop: '20px' }}>
          {managementSubTab === 'contracts' && renderContractsContent()}
          {managementSubTab === 'payments-to-approve' && renderPaymentsToApproveContent()}
          {managementSubTab === 'quotes-to-validate' && renderQuotesToValidateContent()}
        </div>
      </div>
    );
  };

  // Extract content rendering functions (without headers since header is in renderManagement)
  const renderUsersContent = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ color: '#6b7280', margin: 0 }}>{filteredUsers.length} results found</p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="sa-primary-cta" onClick={handleOpenAddUser}>
            <Plus size={16} />
            Add User
          </button>
          <div className="sa-transactions-filters">
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
              <th>Role</th>
              <th>Company</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={`user-${user.id || user.ID || index}`}>
                <td>{index + 1}</td>
                <td className="sa-cell-main">
                  <span className="sa-cell-title">{user.name || user.Name}</span>
                </td>
                <td>{user.email || user.Email}</td>
                <td>
                  <span className="sa-role-badge">
                    {user.role || user.Role || 'N/A'}
                  </span>
                </td>
                <td>{user.company || user.Company || 'N/A'}</td>
                <td>
                  <span className={`sa-status-pill ${(user.status || user.Status || 'active').toLowerCase()}`}>
                    {user.status || user.Status || 'Active'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="sa-action-btn sa-action-edit"
                      onClick={() => handleOpenEditUser(user)}
                      title="Edit"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    >
                      Edit
                    </button>
                    {user.role !== 'superadmin' && user.Role !== 'superadmin' && (
                      <button
                        className="sa-action-btn sa-action-delete"
                        onClick={() => handleDeleteUser(user.id || user.ID)}
                        title="Delete"
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                      >
                        Delete
                      </button>
                    )}
                  </div>
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
    </div>
  );

  const renderPropertiesContent = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ color: '#6b7280', margin: 0 }}>{filteredProperties.length} results found</p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="sa-transactions-filters">
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
              <option value="">All Status</option>
              <option value="Occupied">Occupied</option>
              <option value="Vacant">Vacant</option>
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
              <th>Type</th>
              <th>Property Type</th>
              <th>Rent</th>
              <th>Units</th>
              <th>Tenant</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProperties.map((property, index) => {
              const units = property.units || property.Units || [];
              const totalUnits = property.totalUnits || property.TotalUnits || units.length || 0;
              const vacantUnits = property.vacantUnits || property.VacantUnits || units.filter(u => (u.status || u.Status || 'Vacant') === 'Vacant').length || 0;
              
              return (
              <tr key={`property-${property.id || property.ID || index}`}>
                <td>{index + 1}</td>
                <td className="sa-cell-main">
                  <span className="sa-cell-title">{property.address || property.Address}</span>
                  {totalUnits > 0 && (
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                      {totalUnits} unit{totalUnits !== 1 ? 's' : ''} ({vacantUnits} vacant)
                    </span>
                  )}
                </td>
                <td>
                  <div className="sa-cell-main">
                    <span className="sa-cell-title">{property.type || property.Type || 'N/A'}</span>
                    {property.buildingType || property.BuildingType ? (
                      <span className="sa-cell-sub">({property.buildingType || property.BuildingType})</span>
                    ) : null}
                  </div>
                </td>
                <td>{property.propertyType || property.PropertyType || 'N/A'}</td>
                <td>{(property.rent || property.Rent || 0).toLocaleString()} FCFA</td>
                <td>
                  {totalUnits > 0 ? (
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                      {totalUnits} / {vacantUnits} vacant
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>—</span>
                  )}
                </td>
                <td>{property.tenant || property.Tenant || 'Vacant'}</td>
                <td>
                  <span className={`sa-status-pill ${(property.status || property.Status || 'vacant').toLowerCase()}`}>
                    {property.status || property.Status || 'Vacant'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="sa-action-btn sa-action-edit"
                      onClick={() => handleOpenEditProperty(property)}
                      title="Edit"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    >
                      Edit
                    </button>
                    <button
                      className="sa-action-btn sa-action-delete"
                      onClick={() => handleDeleteProperty(property.id || property.ID)}
                      title="Delete"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
            {filteredProperties.length === 0 && (
              <tr>
                <td colSpan={9} className="sa-table-empty">No properties found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContractsContent = () => (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#6b7280', margin: 0 }}>Lease agreements pending signature</p>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Property</th>
              <th>Tenant</th>
              <th>Rent</th>
              <th>Status</th>
              <th>Contract</th>
            </tr>
          </thead>
          <tbody>
            {leasesAwaitingSignature.map((lease, index) => (
              <tr key={`lease-${lease.id || lease.ID || index}`}>
                <td>{index + 1}</td>
                <td className="sa-cell-main">
                  <span className="sa-cell-title">{lease.property || lease.Property || 'N/A'}</span>
                  <span className="sa-cell-subtitle" style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {lease.address || lease.Address || ''}
                  </span>
                </td>
                <td className="sa-cell-main">
                  <span className="sa-cell-title">{lease.tenant || lease.Tenant || 'N/A'}</span>
                  <span className="sa-cell-subtitle" style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {lease.email || lease.Email || ''}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: '600' }}>{(lease.rent || lease.Rent || 0).toLocaleString()}</span>
                  <span style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>F CFA</span>
                </td>
                <td>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    fontSize: '12px'
                  }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: '#f59e0b' 
                    }}></span>
                    Pending signature
                  </span>
                </td>
                <td>
                  <button 
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Print
                  </button>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>Document pdf</p>
                </td>
              </tr>
            ))}
            {leasesAwaitingSignature.length === 0 && (
              <tr>
                <td colSpan={6} className="sa-table-empty">No leases awaiting signature</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOwnersContent = () => {
    // Filter owners by search text
    const filteredOwners = (() => {
      if (!owners || !Array.isArray(owners)) return [];
      if (!userSearchText) return owners;
      const searchLower = userSearchText.toLowerCase();
      return owners.filter(owner => 
        (owner.name || owner.Name || '').toLowerCase().includes(searchLower) ||
        (owner.email || owner.Email || '').toLowerCase().includes(searchLower)
      );
    })();

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <div className="sa-search-input" style={{ width: '300px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by owner name"
              value={userSearchText}
              onChange={(e) => setUserSearchText(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>Property</h3>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Owner</th>
                <th>Number of Properties</th>
                <th>Number of Tenants</th>
                <th>Revenue/Month</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.map((owner, index) => {
                // Use owner data if available, otherwise calculate from properties/tenants
                const propertiesCount = owner.propertiesCount || owner.PropertiesCount || 
                  properties.filter(p => 
                    (p.landlord || p.Landlord || '').toLowerCase().includes((owner.name || owner.Name || '').toLowerCase())
                  ).length;
                
                const ownerProperties = properties.filter(p => 
                  (p.landlord || p.Landlord || '').toLowerCase().includes((owner.name || owner.Name || '').toLowerCase())
                );
                
                const tenantsCount = owner.tenantsCount || owner.TenantsCount ||
                  tenants.filter(t => 
                    ownerProperties.some(p => (p.address || p.Address) === (t.property || t.Property))
                  ).length;
                
                const monthlyRevenue = owner.monthlyRevenue || owner.MonthlyRevenue ||
                  ownerProperties.reduce((sum, p) => sum + (p.rent || p.Rent || 0), 0);
                
                const propertyType = ownerProperties.length > 0 
                  ? (ownerProperties[0].type || ownerProperties[0].Type || 'Properties')
                  : (owner.propertyType || owner.PropertyType || 'Properties');
                
                return (
                  <tr key={`owner-${owner.id || owner.ID || index}`}>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{owner.name || owner.Name || `Owner ${index + 1}`}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{propertiesCount}</span>
                      <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {propertyType}
                      </span>
                    </td>
                    <td>{tenantsCount}</td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{monthlyRevenue.toLocaleString()}</span>
                      <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>F</span>
                    </td>
                    <td>
                      <button 
                        style={{
                          padding: '6px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredOwners.length === 0 && (
                <tr>
                  <td colSpan={5} className="sa-table-empty">No owners found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Handle approve payment
  const handleApprovePayment = async (paymentId) => {
    try {
      setLoading(true);
      await agencyDirectorService.approveTenantPayment(paymentId);
      addNotification('Payment approved successfully', 'success');
      await loadPendingApprovals();
    } catch (error) {
      console.error('Error approving payment:', error);
      addNotification(error.message || 'Failed to approve payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle reject payment
  const handleRejectPayment = async (paymentId) => {
    try {
      setLoading(true);
      await agencyDirectorService.rejectTenantPayment(paymentId);
      addNotification('Payment rejected successfully', 'success');
      await loadPendingApprovals();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      addNotification(error.message || 'Failed to reject payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Render Payments to Approve content
  const renderPaymentsToApproveContent = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ color: '#6b7280', margin: 0 }}>{pendingPayments.length} pending payments found</p>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Tenant</th>
              <th>Property</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Charge Type</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingPayments.map((payment, index) => (
              <tr key={`payment-${payment.id || payment.ID || index}`}>
                <td>{index + 1}</td>
                <td className="sa-cell-main">
                  <span className="sa-cell-title">{payment.tenant || payment.Tenant || 'N/A'}</span>
                </td>
                <td>{payment.property || payment.Property || 'N/A'}</td>
                <td>{(payment.amount || payment.Amount || 0).toLocaleString()} XOF</td>
                <td>{payment.method || payment.Method || 'N/A'}</td>
                <td>{payment.chargeType || payment.ChargeType || 'N/A'}</td>
                <td>
                  {payment.date || payment.Date
                    ? new Date(payment.date || payment.Date).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="table-action-button edit"
                      onClick={() => handleApprovePayment(payment.id || payment.ID)}
                      disabled={loading}
                      style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}
                    >
                      Approve
                    </button>
                    <button
                      className="table-action-button delete"
                      onClick={() => handleRejectPayment(payment.id || payment.ID)}
                      disabled={loading}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pendingPayments.length === 0 && (
              <tr>
                <td colSpan={8} className="sa-table-empty">No pending payments to approve</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Quotes to Validate content
  const renderQuotesToValidateContent = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ color: '#6b7280', margin: 0 }}>{pendingQuotes.length} pending quotes found</p>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Property</th>
              <th>Issue</th>
              <th>Recipient</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingQuotes.map((quote, index) => (
              <tr key={`quote-${quote.id || quote.ID || index}`}>
                <td>{index + 1}</td>
                <td>{quote.property || quote.Property || 'N/A'}</td>
                <td className="sa-cell-main">
                  <span className="sa-cell-title">{quote.issue || quote.Issue || 'N/A'}</span>
                </td>
                <td>{quote.recipient || quote.Recipient || 'N/A'}</td>
                <td>{(quote.amount || quote.Amount || 0).toLocaleString()} XOF</td>
                <td>
                  {quote.date || quote.Date
                    ? new Date(quote.date || quote.Date).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td>
                  <span className={`sa-status-pill ${(quote.status || quote.Status || 'pending').toLowerCase().replace('_', '-')}`}>
                    {quote.status || quote.Status || 'Pending'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="table-action-button edit"
                      onClick={() => handleApproveQuote(quote.id || quote.ID)}
                      disabled={loading}
                      style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}
                    >
                      Approve
                    </button>
                    <button
                      className="table-action-button delete"
                      onClick={() => handleRejectQuote(quote.id || quote.ID)}
                      disabled={loading}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pendingQuotes.length === 0 && (
              <tr>
                <td colSpan={8} className="sa-table-empty">No pending quotes to validate</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSubscription = () => (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Subscription Renewal</h2>
          <p>Renew your white-label subscription</p>
        </div>
      </div>

      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-section-header">
          <div>
            <h3>Subscription Renewal</h3>
            <p>
              {subscriptionInfo?.subscriptionStatus === 'expired'
                ? 'Your subscription has expired. Renew now to reactivate your agency account.'
                : subscriptionInfo?.subscriptionStatus === 'completed'
                ? 'Your subscription is active. You can renew in advance if needed.'
                : 'Manage your subscription status and renew when necessary.'}
            </p>
            {subscriptionInfo && (
              <p style={{ marginTop: '4px', fontSize: '0.9rem', color: '#6b7280' }}>
                Current status:{' '}
                <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                  {subscriptionInfo.subscriptionStatus || 'unknown'}
                </span>
              </p>
            )}
          </div>
          <button
            className="sa-primary-cta"
            onClick={() => setShowSubscriptionModal(true)}
            style={{ marginTop: '12px' }}
          >
            <CreditCard size={16} />
            Renew Subscription
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

  const renderOwners = () => {
    // Filter owners by search text
    const filteredOwners = (() => {
      if (!owners || !Array.isArray(owners)) return [];
      if (!userSearchText) return owners;
      const searchLower = userSearchText.toLowerCase();
      return owners.filter(owner => 
        (owner.name || owner.Name || '').toLowerCase().includes(searchLower) ||
        (owner.email || owner.Email || '').toLowerCase().includes(searchLower)
      );
    })();

    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header">
          <div>
            <h2>Owners</h2>
            <p>{filteredOwners.length} results found</p>
          </div>
          <div className="sa-clients-header-right">
            <button className="sa-primary-cta" onClick={handleOpenAddOwner}>
              <Plus size={16} />
              Add Owner
            </button>
            <div className="sa-search-input" style={{ marginLeft: '12px' }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by owner name or email"
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-section-header">
            <div>
              <h3>Owners</h3>
              <p>Manage property owners (landlords) for property assignment</p>
            </div>
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
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredOwners.map((owner, index) => (
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
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" onClick={() => handleOpenEditOwner(owner)} title="Edit">✏️</button>
                      <button className="sa-icon-button" onClick={() => handleDeleteOwner(owner)} title="Delete">🗑️</button>
                    </td>
                  </tr>
                ))}
                {filteredOwners.length === 0 && (
                  <tr>
                    <td colSpan={7} className="sa-table-empty">No owners found. Click "Add Owner" to create one.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'management':
        return renderManagement();
      case 'users':
        return renderUsers();
      case 'owners':
        return renderOwners();
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
      case 'advertisements':
        return renderAdvertisements();
      case 'messages':
        return renderMessages();
      case 'subscription':
        return renderSubscription();
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
      
      {/* User Modal */}
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
            <select 
              value={userForm.role} 
              onChange={(e) => {
                const newRole = e.target.value;
                setUserForm({
                  ...userForm, 
                  role: newRole,
                  // Reset properties if role changes from/to landlord
                  properties: newRole === 'landlord' && !editingUser ? (userForm.properties.length > 0 ? userForm.properties : [{ propertyId: '' }]) : []
                });
              }} 
              required
            >
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
              {!editingUser && userForm.role === 'landlord' && (
                <span style={{ color: '#dc2626', display: 'block', marginTop: '4px' }}>
                  ⚠️ Properties are required for landlords
                </span>
              )}
            </small>
          </div>
          
          {/* Properties section - only show when creating a landlord */}
          {!editingUser && userForm.role === 'landlord' && (
            <div className="sa-form-group" style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <label style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
                  Properties * <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6b7280' }}>(At least one required)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddPropertyToForm}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  + Add Property
                </button>
              </div>
              {userForm.properties.map((prop, index) => (
                <div key={index} style={{ marginBottom: '12px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#6b7280' }}>Property {index + 1}</span>
                    {userForm.properties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePropertyFromForm(index)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <select
                    value={prop.propertyId || ''}
                    onChange={(e) => handlePropertyFormChange(index, e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="">Please select a property</option>
                    {getAvailablePropertiesForIndex(index).map(property => (
                      <option key={property.id || property.ID} value={property.id || property.ID}>
                        {property.address || property.Address} - {property.type || property.Type || 'N/A'}
                      </option>
                    ))}
                  </select>
                  {prop.propertyId && getSelectedProperty(prop.propertyId) && (
                    <div style={{ marginTop: '8px', padding: '8px', background: '#f0f9ff', borderRadius: '4px', fontSize: '0.8rem', color: '#0369a1' }}>
                      <div><strong>Type:</strong> {getSelectedProperty(prop.propertyId).type || getSelectedProperty(prop.propertyId).Type || 'N/A'}</div>
                      <div><strong>Rent:</strong> {(getSelectedProperty(prop.propertyId).rent || getSelectedProperty(prop.propertyId).Rent || 0).toLocaleString()} FCFA</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!editingUser && userForm.role !== 'landlord' && (
            <div className="sa-form-group">
              <label>Password {!editingUser ? '*' : ''}</label>
              <input 
                type="password" 
                value={userForm.password} 
                onChange={(e) => setUserForm({...userForm, password: e.target.value})} 
                required={!editingUser}
                placeholder={editingUser ? 'Leave blank to keep current password' : ''}
              />
            </div>
          )}

          <div className="sa-form-actions">
            <button type="button" className="sa-outline-button" onClick={() => setShowUserModal(false)}>Cancel</button>
            <button type="submit" className="sa-primary-cta">{editingUser ? 'Update' : 'Create'} User</button>
          </div>
        </form>
      </Modal>

      {/* Property Modal - Only for editing (adding is disabled for Agency Director) */}
      <Modal isOpen={showPropertyModal && editingProperty} onClose={() => setShowPropertyModal(false)} title="Edit Property">
        {editingProperty && (
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
            <button type="submit" className="sa-primary-cta">Update Property</button>
          </div>
        </form>
        )}
      </Modal>

      {/* Owner Modal */}
      <Modal isOpen={showOwnerModal} onClose={() => setShowOwnerModal(false)} title={editingOwner ? 'Edit Owner' : 'Add Owner'}>
        <form onSubmit={handleSubmitOwner} className="sa-form">
          <div className="sa-form-group">
            <label>Name *</label>
            <input 
              type="text" 
              value={ownerForm.name} 
              onChange={(e) => setOwnerForm({...ownerForm, name: e.target.value})} 
              required 
            />
          </div>
          <div className="sa-form-group">
            <label>Email *</label>
            <input 
              type="email" 
              value={ownerForm.email} 
              onChange={(e) => setOwnerForm({...ownerForm, email: e.target.value})} 
              required 
            />
          </div>
          <div className="sa-form-group">
            <label>Phone</label>
            <input 
              type="text" 
              value={ownerForm.phone} 
              onChange={(e) => setOwnerForm({...ownerForm, phone: e.target.value})} 
              placeholder="Optional"
            />
          </div>
          <div className="sa-form-group">
            <label>Password {!editingOwner ? '*' : ''}</label>
            <input 
              type="password" 
              value={ownerForm.password} 
              onChange={(e) => setOwnerForm({...ownerForm, password: e.target.value})} 
              required={!editingOwner}
              placeholder={editingOwner ? 'Leave blank to keep current password' : ''}
            />
          </div>
          <div className="sa-form-actions">
            <button type="button" className="sa-outline-button" onClick={() => setShowOwnerModal(false)}>Cancel</button>
            <button type="submit" className="sa-primary-cta">{editingOwner ? 'Update' : 'Create'} Owner</button>
          </div>
        </form>
      </Modal>

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


