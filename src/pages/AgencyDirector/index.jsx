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
  Megaphone,
  ArrowUp,
  ArrowLeft
} from 'lucide-react';
import {
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
import { agencyDirectorService } from '../../services/agencyDirectorService';
import { API_CONFIG } from '../../config/api';
import AdvertisementsList from '../../components/AdvertisementsList';
import AdCarousel from '../../components/AdCarousel';
import MessagingPanel from '../../components/MessagingPanel';
import { isDemoMode, getAgencyDirectorDemoData } from '../../utils/demoData';
import RoleLayout from '../../components/RoleLayout';
import Modal from '../../components/Modal';
import SettingsPage from '../SettingsPage';
import AnalyticsPage from '../AnalyticsPage';
import { t, getLanguage } from '../../utils/i18n';
import '../../components/RoleLayout.css';
import '../../pages/TechnicianDashboard.css';
import '../SuperAdminDashboard.css';

const AgencyDirectorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [managementSubTab, setManagementSubTab] = useState('contracts'); // Sub-tab for management page
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const carouselIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [accountingData, setAccountingData] = useState(null);
  const [landlordPayments, setLandlordPayments] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [selectedAccountingView, setSelectedAccountingView] = useState('owner-payments');

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

  // Property Management (owners → buildings → units) - same flow as Sales Manager
  const [pmView, setPmView] = useState('list'); // 'list' | 'owner-detail' | 'building-detail' | 'villa-detail' | 'land-detail'
  const [pmOwnerId, setPmOwnerId] = useState(null);
  const [pmOwnerName, setPmOwnerName] = useState('');
  const [ownerAssets, setOwnerAssets] = useState(null); // { ownerName, assets: [] }
  const [pmPropertyId, setPmPropertyId] = useState(null);
  const [pmBuildingName, setPmBuildingName] = useState('');
  const [buildingDetail, setBuildingDetail] = useState(null); // { buildingName, units: [], totalApartments, images }
  const [landDetail, setLandDetail] = useState(null);
  const [propertyManagementSearch, setPropertyManagementSearch] = useState('');
  const [pmLoading, setPmLoading] = useState(false);
  // Property Management: use same data as Sales Manager (same API) for owners → buildings → units
  const [pmOwners, setPmOwners] = useState([]);
  const [pmProperties, setPmProperties] = useState([]);
  const [pmDataLoading, setPmDataLoading] = useState(false);

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingOwner, setEditingOwner] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'salesmanager', password: '', properties: [], documents: [] });
  const [propertyForm, setPropertyForm] = useState({ 
    address: '', 
    type: '', 
    rent: '', 
    tenant: '', 
    status: 'Vacant',
    units: [] 
  });
  const [ownerForm, setOwnerForm] = useState({
    name: '', email: '', phone: '', password: '',
    rentalMandate: null, salesMandate: null, idCopy: null, landTitle: null, propertyPhotos: [],
    commissionPercentage: '',
    rib: ''
  });
  const [ownerDocumentPreviews, setOwnerDocumentPreviews] = useState({});
  
  // Messaging states
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [superAdmins, setSuperAdmins] = useState([]);
  const [conversations, setConversations] = useState([]);
  
  // Subscription payment state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({ provider: 'wave', phone: '', otp: '' });
  const [subscriptionType, setSubscriptionType] = useState('monthly'); // 'monthly' or 'annual'
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  // Contracts state
  const [leasesAwaitingSignature, setLeasesAwaitingSignature] = useState([]);
  const [expenseRequests, setExpenseRequests] = useState([]);
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [owners, setOwners] = useState([]);
  
  // Management state - Pending approvals
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [pendingQuotes, setPendingQuotes] = useState([]);

  // Reports/Analytics state
  const [transferHistory, setTransferHistory] = useState([]);
  const [expensesPerBuilding, setExpensesPerBuilding] = useState({});
  const [expensesPerOwner, setExpensesPerOwner] = useState({});
  const [internalExpenses, setInternalExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [revenueByOwner, setRevenueByOwner] = useState([]);
  const [revenueByAgency, setRevenueByAgency] = useState([]);
  const [commissionsData, setCommissionsData] = useState({});
  const [allBuildingsReport, setAllBuildingsReport] = useState([]);
  const [companyBuildings, setCompanyBuildings] = useState([]);
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
  const [monthlyComparison, setMonthlyComparison] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [accountingDateFilterMode, setAccountingDateFilterMode] = useState('day');
  const [accountingDateFilterValue, setAccountingDateFilterValue] = useState(() => new Date().toISOString().slice(0, 10));

  // Tenants state
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState(null);
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

  const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

  const getValue = (...values) => values.find(value => value !== undefined && value !== null && String(value).trim() !== '');

  const getNumericValue = (...values) => {
    for (const value of values) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const parsed = Number(value.replace(/,/g, ''));
        if (Number.isFinite(parsed)) return parsed;
      }
      if (typeof value === 'object') {
        const candidate = value.total ?? value.Total ?? value.amount ?? value.Amount ?? value.value ?? value.Value ?? value.sum ?? value.Sum;
        if (candidate !== undefined && candidate !== null) {
          const parsed = Number(candidate);
          if (Number.isFinite(parsed)) return parsed;
        }
      }
    }
    return 0;
  };

  const getRecordId = (record) => record?.id ?? record?.ID ?? record?.Id ?? null;

  const normalizeRole = (role) => normalizeText(role);

  const isTenantRole = (role) => {
    const normalized = normalizeRole(role);
    return normalized === 'tenant' || normalized === 'client' || normalized === 'resident' || normalized === 'occupant';
  };

  const getPropertyUnits = (property) => {
    const units = property?.units ?? property?.Units ?? [];
    return Array.isArray(units) ? units : [];
  };

  const getPropertyLabel = (property) =>
    getValue(property?.name, property?.Name, property?.building, property?.Building, property?.Address, property?.address) || 'N/A';

  const getPropertyOwnerId = (property) =>
    property?.LandlordID ?? property?.landlordId ?? property?.landlordID ?? property?.landlord_id ?? property?.LandlordId ??
    property?.OwnerID ?? property?.ownerId ?? property?.ownerID ?? property?.owner_id ??
    property?.owner?.id ?? property?.owner?.ID ?? property?.landlord?.id ?? property?.landlord?.ID;

  const getPropertyOwnerName = (property) =>
    property?.Landlord ?? property?.landlord ?? property?.Owner ?? property?.owner ?? property?.landlordName ?? property?.ownerName;

  const getPropertyOccupancyStats = (property) => {
    const units = getPropertyUnits(property);
    const totalUnits = units.length > 0 ? units.length : 1;
    const occupiedUnits = units.length > 0
      ? units.reduce((count, unit) => {
          const unitStatus = normalizeText(unit?.status ?? unit?.Status);
          const hasTenant = Boolean(getValue(unit?.tenant, unit?.Tenant));
          return count + (unitStatus === 'occupied' || hasTenant ? 1 : 0);
        }, 0)
      : (normalizeText(getPropertyStatus(property)) === 'occupied' || Boolean(getValue(property?.tenant, property?.Tenant)) ? 1 : 0);
    const safeOccupiedUnits = Math.min(occupiedUnits, totalUnits);
    const vacantUnits = Math.max(0, totalUnits - safeOccupiedUnits);
    return {
      totalUnits,
      occupiedUnits: safeOccupiedUnits,
      vacantUnits,
      occupancyRate: totalUnits > 0 ? (safeOccupiedUnits / totalUnits) * 100 : 0,
      occupancyLabel: `${safeOccupiedUnits}/${totalUnits}`,
    };
  };

  const getPropertyStatus = (property) => getValue(property?.Status, property?.status, property?.statut) || 'Vacant';

  const getOwnerIdentity = (owner) => ({
    id: getRecordId(owner),
    name: getValue(owner?.name, owner?.Name) || 'Owner',
    email: getValue(owner?.email, owner?.Email) || '',
  });

  const ownerMatchesProperty = (owner, property) => {
    if (!owner || !property) return false;
    const { id, name, email } = getOwnerIdentity(owner);
    const propertyOwnerId = getPropertyOwnerId(property);
    if (propertyOwnerId != null && id != null && String(propertyOwnerId) === String(id)) return true;
    const propOwnerName = normalizeText(getPropertyOwnerName(property));
    if (name && propOwnerName && normalizeText(name) === propOwnerName) return true;
    const propOwnerText = normalizeText(getValue(property?.owner, property?.Owner, property?.landlord, property?.Landlord));
    if (name && propOwnerText && normalizeText(name) === propOwnerText) return true;
    const propOwnerEmail = normalizeText(getValue(property?.ownerEmail, property?.OwnerEmail, property?.landlordEmail, property?.LandlordEmail));
    if (email && propOwnerEmail && normalizeText(email) === propOwnerEmail) return true;
    return false;
  };

  const getOwnerPropertyStats = (owner, propsSource = properties) => {
    const ownerProps = (propsSource || []).filter(property => ownerMatchesProperty(owner, property));
    const totalUnits = ownerProps.reduce((sum, property) => sum + getPropertyOccupancyStats(property).totalUnits, 0);
    const occupiedUnits = ownerProps.reduce((sum, property) => sum + getPropertyOccupancyStats(property).occupiedUnits, 0);
    const vacantUnits = Math.max(0, totalUnits - occupiedUnits);
    const activeContracts = occupiedUnits;
    const totalAssets = ownerProps.length;
    const sellAssets = ownerProps.filter(property => {
      const status = normalizeText(getPropertyStatus(property));
      const type = normalizeText(property?.Type ?? property?.type);
      return status.includes('sell') || status.includes('sale') || status.includes('available') || type === 'land';
    }).length;
    const manageAssets = Math.max(0, totalAssets - sellAssets);
    const incomeThisMonth = ownerProps.reduce((sum, property) => {
      const occupancy = getPropertyOccupancyStats(property);
      const rentValue = Number(getValue(property?.rent, property?.Rent, property?.rentPrice, property?.RentPrice, 0) || 0);
      const units = getPropertyUnits(property);
      if (units.length > 0) {
        return sum + units.reduce((unitSum, unit) => {
          const unitStatus = normalizeText(unit?.status ?? unit?.Status);
          const unitRent = Number(getValue(unit?.rent, unit?.rentPrice, unit?.Rent, 0) || 0);
          return unitSum + ((unitStatus === 'occupied' || unit?.tenant || unit?.Tenant) ? unitRent : 0);
        }, 0);
      }
      return sum + (occupancy.occupiedUnits > 0 ? rentValue : 0);
    }, 0);

    return {
      ownerProps,
      totalAssets,
      sellAssets,
      manageAssets,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyLabel: `${occupiedUnits}/${totalUnits || 0}`,
      incomeThisMonth,
      activeContracts,
      propertiesCount: totalAssets,
      contractsCount: activeContracts
    };
  };

  const getUniqueTenantCount = (tenantList) => {
    const seen = new Set();
    return (Array.isArray(tenantList) ? tenantList : []).filter((tenant) => {
      const tenantStatus = normalizeText(getValue(tenant?.status, tenant?.Status, tenant?.statut));
      if (tenantStatus && ['deleted', 'archived', 'inactive', 'removed'].includes(tenantStatus)) {
        return false;
      }
      const tenantId = getRecordId(tenant);
      const tenantEmail = normalizeText(getValue(tenant?.email, tenant?.Email));
      const tenantName = normalizeText(getValue(tenant?.name, tenant?.Name));
      const signature =
        tenantId != null ? `id:${tenantId}` :
        tenantEmail ? `email:${tenantEmail}` :
        tenantName ? `name:${tenantName}` :
        '';
      if (!signature || seen.has(signature)) return false;
      seen.add(signature);
      return true;
    }).length;
  };

  const getTransactionDate = (record) => {
    const rawDate = getValue(record?.date, record?.Date, record?.createdAt, record?.CreatedAt, record?.updatedAt, record?.UpdatedAt);
    if (!rawDate) return null;
    const date = new Date(rawDate);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getTransactionSignature = (record) => {
    if (!record) return '';
    const id = getRecordId(record);
    if (id != null) return `id:${id}`;
    const tenant = normalizeText(getValue(record?.tenant, record?.Tenant, record?.source, record?.Source));
    const property = normalizeText(getValue(record?.property, record?.Property, record?.building, record?.Building));
    const amount = Number(getValue(record?.amount, record?.Amount, 0) || 0);
    const type = normalizeText(getValue(record?.chargeType, record?.ChargeType, record?.method, record?.Method, record?.category, record?.Category));
    const date = getTransactionDate(record);
    const dateKey = date ? date.toISOString().slice(0, 10) : normalizeText(getValue(record?.date, record?.Date));
    return [tenant, property, amount, type, dateKey].join('|');
  };

  const dedupeRecords = (records) => {
    const seen = new Set();
    return (Array.isArray(records) ? records : []).filter(record => {
      const signature = getTransactionSignature(record);
      if (!signature || seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  };

  const parseQuoteDocuments = (quote) => {
    const raw = quote?.Documents ?? quote?.documents ?? [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }
    return [];
  };

  const getQuotePropertyDisplay = (quote) => {
    const property = getValue(quote?.Property, quote?.property);
    const unit = getValue(quote?.UnitNumber, quote?.unitNumber);
    if (property && unit) return `${property} - ${unit}`;
    return property || unit || 'N/A';
  };

  const getQuoteTenantDisplay = (quote) => getValue(quote?.Tenant, quote?.tenant) || 'N/A';

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
        setAllBuildingsReport(demoData.properties || []);
        setCompanyBuildings(demoData.properties || []);
        setTenants(demoData.tenants || []);
        setSubscriptionInfo(demoData.subscriptionInfo);
        setOwners(demoData.owners);
        setSuperAdmins([]);
        setConversations(demoData.conversations);
        setLoading(false);
        return;
      }
      
      const [overview, usersData, propertiesData, financial, accounting, landlordPaymentsData, subscriptionStatusData, buildingsReportData, tenantsData, collectionsData] = await Promise.all([
        agencyDirectorService.getOverview().catch(() => null),
        agencyDirectorService.getUsers().catch(() => []),
        agencyDirectorService.getProperties().catch(() => []),
        agencyDirectorService.getFinancialOverview().catch(() => null),
        agencyDirectorService.getAccountingOverview().catch(() => null),
        agencyDirectorService.getLandlordPayments().catch(() => []),
        agencyDirectorService.getSubscriptionStatus().catch(() => null),
        agencyDirectorService.getAllBuildingsReport().catch(() => []),
        agencyDirectorService.getTenants().catch(() => []),
        agencyDirectorService.getCollections().catch(() => [])
      ]);

      const normalizedBuildingsReport = Array.isArray(buildingsReportData) ? buildingsReportData : [];
      const normalizedProperties = Array.isArray(propertiesData) ? propertiesData : [];
      const normalizedTenants = Array.isArray(tenantsData) ? tenantsData : [];
      const normalizedCollections = Array.isArray(collectionsData)
        ? collectionsData
        : (Array.isArray(collectionsData?.collections) ? collectionsData.collections : []);

      const totalCollections = normalizedCollections.reduce((sum, record) => {
        const chargeType = normalizeText(getValue(record?.ChargeType, record?.chargeType, record?.type, record?.category));
        if (chargeType && chargeType !== 'rent') return sum;
        return sum + getNumericValue(record?.Amount, record?.amount, record?.total, record?.value, record);
      }, 0);

      const detailedBuildings = await Promise.all(normalizedBuildingsReport.map(async (building) => {
        const buildingId = getRecordId(building);
        let buildingDetailData = null;
        if (buildingId != null) {
          buildingDetailData = await agencyDirectorService.getPropertyBuildingDetail(buildingId).catch(() => null);
        }

        const matchingProperty = normalizedProperties.find((property) => {
          const propertyId = getRecordId(property);
          if (buildingId != null && propertyId != null && String(propertyId) === String(buildingId)) {
            return true;
          }
          const propertyLabel = normalizeText(getPropertyLabel(property));
          const buildingLabel = normalizeText(getPropertyLabel(building));
          return propertyLabel && buildingLabel && propertyLabel === buildingLabel;
        });

        const source = buildingDetailData || matchingProperty || building;
        const sourceUnits = getPropertyUnits(source);
        const normalizedUnits = sourceUnits.map((unit) => ({
          ...unit,
          status: unit?.status ?? unit?.Status ?? unit?.statut ?? 'Vacant',
        }));

        return {
          ...building,
          ...(matchingProperty || {}),
          ...(buildingDetailData || {}),
          units: normalizedUnits.length > 0 ? normalizedUnits : getPropertyUnits(building),
        };
      }));

      setOverviewData(overview);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setProperties(normalizedProperties);
      setFinancialData(financial);
      setAccountingData({
        ...(accounting || {}),
        collections: totalCollections,
        rawCollections: normalizedCollections,
      });
      setLandlordPayments(Array.isArray(landlordPaymentsData) ? landlordPaymentsData : []);
      setAllBuildingsReport(normalizedBuildingsReport);
      setCompanyBuildings(detailedBuildings);
      setTenants(normalizedTenants);
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

  const refreshSubscriptionInfo = useCallback(async () => {
    try {
      if (isDemoMode()) {
        const demoData = getAgencyDirectorDemoData();
        setSubscriptionInfo(demoData.subscriptionInfo);
        return;
      }
      const status = await agencyDirectorService.getSubscriptionStatus().catch(() => null);
      if (status) {
        setSubscriptionInfo(status);
      }
    } catch (error) {
      console.error('Error refreshing subscription info:', error);
    }
  }, []);

  // Load chat for a specific user
  const loadChatForUser = useCallback(
    async (userId) => {
      try {
        setSelectedUserId(userId);
        // Group chats are handled internally by MessagingPanel — skip direct message API
        if (String(userId).startsWith('group:')) return;
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
        const role = normalizeRole(user.Role || user.role);
        if (isTenantRole(role)) return;
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
        if (role === 'superadmin' || isTenantRole(role)) {
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
  const handleSendMessage = async (channel = 'sms') => {
    if (!chatInput.trim() || !selectedUserId) return;
    // Group messages handled by MessagingPanel internally
    if (String(selectedUserId).startsWith('group:')) return;

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
        channel,
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
    if (subscriptionForm.provider === 'om' && !subscriptionForm.otp.trim()) {
      addNotification('OTP is required for Orange Money payments', 'error');
      return;
    }
    try {
      const result = await agencyDirectorService.paySubscriptionViaMoMo(subscriptionForm);
      const paymentUrl = result?.response?.payment_url;
      if (subscriptionForm.provider === 'wave' && paymentUrl) {
        // Some browsers block popups after an awaited network call; fallback to same-tab redirect.
        const popup = window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        if (!popup) {
          window.location.assign(paymentUrl);
        }
        addNotification('Redirecting to Wave payment page…', 'info');
      } else {
        addNotification('Subscription payment initiated. Please confirm the prompt on your phone.', 'success');
      }
      setShowSubscriptionModal(false);
      setSubscriptionForm({ provider: 'wave', phone: '', otp: '' });
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
      setLoading(true);
      await agencyDirectorService.approveExpense(expenseId);
      addNotification('Expense approved successfully!', 'success');
      await loadPendingApprovals();
      await loadContractsData();
    } catch (error) {
      console.error('Error approving expense:', error);
      addNotification(error.message || 'Failed to approve expense', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to reject this expense?')) return;
    try {
      setLoading(true);
      await agencyDirectorService.rejectExpense(expenseId);
      addNotification('Expense rejected successfully!', 'success');
      await loadPendingApprovals();
      await loadContractsData();
    } catch (error) {
      console.error('Error rejecting expense:', error);
      addNotification(error.message || 'Failed to reject expense', 'error');
    } finally {
      setLoading(false);
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

  const handleApproveLease = async (leaseId) => {
    if (!window.confirm('Approve this lease agreement?')) return;
    try {
      await agencyDirectorService.approveLeaseAgreement(leaseId);
      addNotification('Lease approved successfully!', 'success');
      await loadContractsData();
    } catch (error) {
      console.error('Error approving lease:', error);
      addNotification(error.message || 'Failed to approve lease', 'error');
    }
  };

  // Annual subscription handler
  const handlePayAnnualSubscription = async (e) => {
    e.preventDefault();
    if (subscriptionForm.provider === 'om' && !subscriptionForm.otp.trim()) {
      addNotification('OTP is required for Orange Money payments', 'error');
      return;
    }
    try {
      const result = await agencyDirectorService.payAnnualSubscriptionViaMoMo(subscriptionForm);
      const paymentUrl = result?.response?.payment_url;
      if (subscriptionForm.provider === 'wave' && paymentUrl) {
        // Some browsers block popups after an awaited network call; fallback to same-tab redirect.
        const popup = window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        if (!popup) {
          window.location.assign(paymentUrl);
        }
        addNotification('Redirecting to Wave payment page…', 'info');
      } else {
        addNotification('Annual subscription payment initiated. Please confirm the prompt on your phone.', 'success');
      }
      setShowSubscriptionModal(false);
      setSubscriptionForm({ provider: 'wave', phone: '', otp: '' });
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
        setQuoteRequests([]);
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
      const [expenses, approvedExpenses, quotes, quoteHistory] = await Promise.all([
        agencyDirectorService.getPendingExpenses().catch(() => []),
        agencyDirectorService.getExpenses().catch(() => []),
        agencyDirectorService.getPendingQuotes().catch(() => []),
        agencyDirectorService.getQuoteHistory().catch(() => [])
      ]);
      setPendingExpenses(Array.isArray(expenses) ? expenses : []);
      setAllExpenses(Array.isArray(approvedExpenses) ? approvedExpenses : []);
      setPendingQuotes(Array.isArray(quotes) ? quotes : []);
      setQuoteRequests(Array.isArray(quoteHistory) ? quoteHistory : []);
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

  // Load new analytics indicators, yearly comparison, and monthly comparison
  const loadNewAnalyticsData = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      if (isDemoMode()) {
        const now = new Date();
        const demoMonthly = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const base = 4000000 + Math.random() * 1500000;
          demoMonthly.push({
            month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            revenue: Math.round(base),
            expenses: Math.round(base * 0.25),
            commissions: Math.round(base * 0.08),
            netProfit: Math.round(base * 0.67)
          });
        }
        setAnalyticsIndicators({ profitability: {}, expensesControl: {}, decisionMaking: {}, paymentPerformance: {}, costsMaintenance: {}, rentalVacancy: {}, overallActivity: {}, financialHealth: {}, risksAlerts: {} });
        setYearlyComparison({ sortedYears: [2023, 2024], yearlyData: { 2023: { annualRevenue: 45000000, annualCommissions: 3600000, annualExpenses: 11250000, annualNetResult: 30150000 }, 2024: { annualRevenue: 50000000, annualCommissions: 4000000, annualExpenses: 12500000, annualNetResult: 33500000 } }, summary: { mostProfitableYear: '2024', bestMarginYear: '2024', mostExpensiveYear: '2024', mostStableYear: '2024', globalTrend: 'growth' } });
        setMonthlyComparison(demoMonthly);
        setAnalyticsLoading(false);
        return;
      }
      const [indicators, yearly, monthly] = await Promise.all([
        agencyDirectorService.getAnalyticsIndicators().catch(() => null),
        agencyDirectorService.getYearlyComparison().catch(() => null),
        agencyDirectorService.getMonthlyComparison().catch(() => null)
      ]);
      setAnalyticsIndicators(indicators);
      setYearlyComparison(yearly);
      if (Array.isArray(monthly) && monthly.length > 0) {
        setMonthlyComparison(monthly);
      } else {
        const byMonth = {};
        (transferHistory || []).forEach(t => {
          const date = t.date || t.Date;
          if (!date) return;
          const d = new Date(date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!byMonth[key]) byMonth[key] = { monthKey: key, month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), revenue: 0, expenses: 0, commissions: 0, netProfit: 0 };
          byMonth[key].revenue += (t.netAmount || t.NetAmount || 0) + (t.commission || t.Commission || 0);
          byMonth[key].commissions += t.commission || t.Commission || 0;
          byMonth[key].netProfit += t.netAmount || t.NetAmount || 0;
        });
        const sorted = Object.keys(byMonth).sort().slice(-6).map(k => ({ ...byMonth[k], expenses: 0 }));
        setMonthlyComparison(sorted.length > 0 ? sorted : []);
      }
    } catch (error) {
      console.error('Error loading new analytics data:', error);
      addNotification('Failed to load analytics data', 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load data when specific tabs are active
  useEffect(() => {
    if (activeTab === 'contracts' || activeTab === 'owners' || activeTab === 'properties' || (activeTab === 'management' && managementSubTab === 'contracts')) {
      loadContractsData();
    }
  }, [activeTab, managementSubTab, loadContractsData]);

  useEffect(() => {
    if (activeTab === 'tenants' || activeTab === 'owners') {
      loadTenantsData();
    }
  }, [activeTab, loadTenantsData]);

  useEffect(() => {
    if (activeTab === 'accounting' || (activeTab === 'management' && (managementSubTab === 'expenses-to-approve' || managementSubTab === 'quotes-to-validate'))) {
      loadPendingApprovals();
    }
  }, [activeTab, managementSubTab, loadPendingApprovals]);

  // Property Management: use agency director data (backend returns 401 for sales manager when logged in as agency director)
  useEffect(() => {
    if (activeTab !== 'properties') return;
    const loadPmData = async () => {
      if (isDemoMode()) {
        const demo = getAgencyDirectorDemoData();
        setPmOwners(demo.owners || []);
        setPmProperties(demo.properties || []);
        setPmDataLoading(false);
        return;
      }
      setPmDataLoading(true);
      try {
        const [ownersData, propertiesData] = await Promise.all([
          agencyDirectorService.getOwners().catch(() => []),
          agencyDirectorService.getProperties().catch(() => [])
        ]);
        setPmOwners(Array.isArray(ownersData) ? ownersData : []);
        setPmProperties(Array.isArray(propertiesData) ? propertiesData : []);
      } catch (err) {
        console.error('Failed to load Property Management data:', err);
        setPmOwners([]);
        setPmProperties([]);
      } finally {
        setPmDataLoading(false);
      }
    };
    loadPmData();
  }, [activeTab]);

  const loadAccountingData = useCallback(async () => {
    if (isDemoMode()) {
      const demo = getAgencyDirectorDemoData();
      const ownersList = demo.owners || [];
      setAllExpenses([]);
      setRevenueData([]);
      setRevenueByOwner(ownersList.map(o => ({
        ownerId: o.id || o.ID,
        ownerName: o.name || o.Name,
        totalRevenue: o.incomeThisMonth ?? o.revenue ?? 0
      })));
      setRevenueByAgency([{ agencyName: 'SAAF IMMO', totalRevenue: (demo.financial?.totalRevenue || 5000000) }]);
      return;
    }
    try {
      const [expenses, tenantPayments, revenueByOwnerData, revenueByAgencyData] = await Promise.all([
        agencyDirectorService.getExpenses().catch(() => []),
        agencyDirectorService.getTenantPayments().catch(() => []),
        agencyDirectorService.getRevenueByOwner().catch(() => null),
        agencyDirectorService.getRevenueByAgency().catch(() => null)
      ]);
      setAllExpenses(Array.isArray(expenses) ? expenses : []);
      setRevenueData(Array.isArray(tenantPayments) ? tenantPayments : []);
      if (Array.isArray(revenueByOwnerData) && revenueByOwnerData.length > 0) {
        setRevenueByOwner(revenueByOwnerData);
      } else {
        const byOwner = {};
        (landlordPayments || []).forEach(p => {
          const name = p.landlord || p.Landlord || 'Unknown';
          const amt = (p.netAmount || p.NetAmount || 0) + (p.commission || p.Commission || 0);
          byOwner[name] = (byOwner[name] || 0) + amt;
        });
        setRevenueByOwner(Object.entries(byOwner).map(([ownerName, totalRevenue]) => ({ ownerName, totalRevenue })));
      }
      if (Array.isArray(revenueByAgencyData) && revenueByAgencyData.length > 0) {
        setRevenueByAgency(revenueByAgencyData);
      } else {
        const total = financialData?.totalRevenue || 0;
        setRevenueByAgency([{ agencyName: 'Agency', totalRevenue: total }]);
      }
    } catch (e) {
      console.error('Error loading accounting data:', e);
      const byOwner = {};
      (landlordPayments || []).forEach(p => {
        const name = p.landlord || p.Landlord || 'Unknown';
        const amt = (p.netAmount || p.NetAmount || 0) + (p.commission || p.Commission || 0);
        byOwner[name] = (byOwner[name] || 0) + amt;
      });
      setRevenueByOwner(Object.entries(byOwner).map(([ownerName, totalRevenue]) => ({ ownerName, totalRevenue })));
      setRevenueByAgency([{ agencyName: 'Agency', totalRevenue: financialData?.totalRevenue || 0 }]);
    }
  }, [landlordPayments, financialData]);

  useEffect(() => {
    if (activeTab === 'accounting') {
      loadAccountingData();
    }
  }, [activeTab, loadAccountingData]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData();
      loadNewAnalyticsData();
    }
  }, [activeTab, loadAnalyticsData, loadNewAnalyticsData]);

  useEffect(() => {
    if (activeTab === 'subscription') {
      refreshSubscriptionInfo();
    }
  }, [activeTab, refreshSubscriptionInfo]);

  useEffect(() => {
    if (showSubscriptionModal) {
      refreshSubscriptionInfo();
    }
  }, [showSubscriptionModal, refreshSubscriptionInfo]);

  useEffect(() => {
    const now = new Date();
    if (accountingDateFilterMode === 'day' && (!accountingDateFilterValue || accountingDateFilterValue.length !== 10)) {
      setAccountingDateFilterValue(now.toISOString().slice(0, 10));
    } else if (accountingDateFilterMode === 'month' && (!accountingDateFilterValue || accountingDateFilterValue.length < 7)) {
      setAccountingDateFilterValue(now.toISOString().slice(0, 7));
    } else if (accountingDateFilterMode === 'year' && (!accountingDateFilterValue || accountingDateFilterValue.length < 4)) {
      setAccountingDateFilterValue(String(now.getFullYear()));
    }
  }, [accountingDateFilterMode]); // keep the value aligned with the selected period

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

  const agencyUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter(user => !isTenantRole(user.Role || user.role));
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!agencyUsers || !Array.isArray(agencyUsers)) return [];
    return agencyUsers.filter(user => {
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
  }, [agencyUsers, userCompanyFilter, userRoleFilter, userSearchText]);

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
    agencyUsers.forEach(user => {
      if (user.Company || user.company) companies.add(user.Company || user.company);
    });
    properties.forEach(prop => {
      if (prop.Company || prop.company) companies.add(prop.Company || prop.company);
    });
    return Array.from(companies).sort();
  }, [agencyUsers, properties]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set();
    agencyUsers.forEach(user => {
      if (user.Role || user.role) roles.add(user.Role || user.role);
    });
    return Array.from(roles).sort();
  }, [agencyUsers]);

  // User management
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', role: 'salesmanager', password: '', properties: [], documents: [] });
    setShowUserModal(true);
  };

  const handleAddDocument = () => {
    setUserForm(prev => ({ ...prev, documents: [...prev.documents, { name: '', file: null }] }));
  };

  const handleRemoveDocument = (index) => {
    setUserForm(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== index) }));
  };

  const handleDocumentChange = (index, field, value) => {
    setUserForm(prev => ({
      ...prev,
      documents: prev.documents.map((doc, i) => i === index ? { ...doc, [field]: value } : doc)
    }));
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
    let existingDocs = [];
    try {
      existingDocs = user.Documents ? (typeof user.Documents === 'string' ? JSON.parse(user.Documents || '[]') : user.Documents) : [];
    } catch (_) { existingDocs = []; }
    setUserForm({
      name: user.Name || user.name || '',
      email: user.Email || user.email || '',
      role: user.Role || user.role || 'salesmanager',
      password: '',
      properties: [],
      documents: existingDocs.map(d => ({ name: d.name || d.Name || '', file: null, url: d.url || d.URL }))
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

      // Upload documents to Cloudinary and add URLs
      if (userForm.documents && userForm.documents.length > 0) {
        const { cloudinaryService } = await import('../../services/cloudinaryService');
        const folder = 'real-estate-user-documents';
        const docPromises = userForm.documents.map(async (doc) => {
          if (doc.file) {
            const result = await cloudinaryService.uploadFile(doc.file, folder);
            return { name: doc.name || doc.file?.name || 'Document', url: result.success ? result.url : '' };
          }
          if (doc.url) return { name: doc.name || 'Document', url: doc.url };
          return null;
        });
        const docs = (await Promise.all(docPromises)).filter(Boolean);
        if (docs.length > 0) userData.documents = docs;
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

  const getCurrentUserId = () => {
    try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.id || u.ID; } catch { return null; }
  };

  const handleDeleteUser = async (user) => {
    const userId = user.ID || user.id || user;
    const currentId = getCurrentUserId();
    if (String(userId) === String(currentId)) {
      addNotification('You cannot delete your own account', 'error');
      return;
    }
    if (window.confirm(`Delete user ${user.Name || user.name || ''}?`)) {
      try {
        await agencyDirectorService.deleteUser(userId);
        addNotification('User deleted successfully!', 'success');
        await loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
        addNotification('Failed to delete user', 'error');
      }
    }
  };

  const getEmptyOwnerForm = () => ({
    name: '', email: '', phone: '', password: '',
    rentalMandate: null, salesMandate: null, idCopy: null, landTitle: null, propertyPhotos: [],
    rib: '', commissionPercentage: '',
    propertyIds: [] // IDs of properties to assign to this owner
  });

  const handleOpenAddOwner = () => {
    setEditingOwner(null);
    setOwnerForm(getEmptyOwnerForm());
    setOwnerDocumentPreviews({});
    setShowOwnerModal(true);
  };

  const handleOpenEditOwner = (owner) => {
    setEditingOwner(owner);
    const profile = owner.profile || owner.Profile || {};
    setOwnerForm({
      name: owner.name || owner.Name || '',
      email: owner.email || owner.Email || '',
      phone: owner.phone || owner.Phone || '',
      password: '',
      rentalMandate: null, salesMandate: null, idCopy: null, landTitle: null, propertyPhotos: [],
      rib: profile.rib || profile.RIB || '',
      commissionPercentage: profile.commissionPercentage ?? profile.CommissionPercentage ?? ''
    });
    setOwnerDocumentPreviews({
      rentalMandate: profile.rentalMandateURL || profile.RentalMandateURL,
      salesMandate: profile.salesMandateURL || profile.SalesMandateURL,
      idCopy: profile.idCopyURL || profile.IDCopyURL,
      landTitle: profile.landTitleURL || profile.LandTitleURL,
      propertyPhotos: profile.propertyPhotos ? (typeof profile.propertyPhotos === 'string' ? JSON.parse(profile.propertyPhotos || '[]') : profile.propertyPhotos) : []
    });
    setShowOwnerModal(true);
  };

  const handleOwnerFileChange = (field, e, isMultiple = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (isMultiple) {
      const fileList = Array.from(files);
      setOwnerForm(prev => ({ ...prev, [field]: fileList }));
      const readers = fileList.map(f => {
        return new Promise((resolve) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result);
          r.readAsDataURL(f);
        });
      });
      Promise.all(readers).then(results => {
        setOwnerDocumentPreviews(prev => ({ ...prev, [field]: results }));
      });
    } else {
      const file = files[0];
      setOwnerForm(prev => ({ ...prev, [field]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setOwnerDocumentPreviews(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitOwner = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { cloudinaryService } = await import('../../services/cloudinaryService');
      const folder = 'real-estate-owners';

      const uploadFile = async (file) => {
        const result = await cloudinaryService.uploadFile(file, folder);
        return result.success ? result.url : null;
      };

      let rentalMandateURL = ownerForm.rentalMandate ? await uploadFile(ownerForm.rentalMandate) : null;
      let salesMandateURL = ownerForm.salesMandate ? await uploadFile(ownerForm.salesMandate) : null;
      let idCopyURL = ownerForm.idCopy ? await uploadFile(ownerForm.idCopy) : null;
      let landTitleURL = ownerForm.landTitle ? await uploadFile(ownerForm.landTitle) : null;

      let propertyPhotosUrls = [];
      if (ownerForm.propertyPhotos && ownerForm.propertyPhotos.length > 0) {
        for (const f of ownerForm.propertyPhotos) {
          const url = await uploadFile(f);
          if (url) propertyPhotosUrls.push(url);
        }
      }

      if (ownerForm.rentalMandate && !rentalMandateURL) {
        addNotification('Failed to upload Real estate management mandate.', 'error');
        setLoading(false);
        return;
      }
      if (ownerForm.salesMandate && !salesMandateURL) {
        addNotification('Failed to upload Sales mandate.', 'error');
        setLoading(false);
        return;
      }
      if (ownerForm.idCopy && !idCopyURL) {
        addNotification('Failed to upload Copy of owner\'s ID.', 'error');
        setLoading(false);
        return;
      }
      if (ownerForm.landTitle && !landTitleURL) {
        addNotification('Failed to upload Land title/ACD.', 'error');
        setLoading(false);
        return;
      }

      const ownerData = {
        name: ownerForm.name,
        email: ownerForm.email,
        phone: ownerForm.phone || undefined,
        password: ownerForm.password || undefined,
        rentalMandateURL: rentalMandateURL || undefined,
        salesMandateURL: salesMandateURL || undefined,
        idCopyURL: idCopyURL || undefined,
        rib: ownerForm.rib || undefined,
        landTitleURL: landTitleURL || undefined,
        propertyPhotos: propertyPhotosUrls.length > 0 ? JSON.stringify(propertyPhotosUrls) : undefined,
        commissionPercentage: ownerForm.commissionPercentage ? parseFloat(ownerForm.commissionPercentage) : undefined,
        propertyIds: ownerForm.propertyIds.filter(id => id).map(id => parseInt(id, 10))
      };
      if (!editingOwner) {
        ownerData.password = ownerForm.password;
      } else if (ownerForm.password) {
        ownerData.password = ownerForm.password;
      }

      if (editingOwner) {
        await agencyDirectorService.updateOwner(editingOwner.id || editingOwner.ID, ownerData);
        addNotification('Owner updated successfully!', 'success');
      } else {
        await agencyDirectorService.createOwner(ownerData);
        addNotification('Owner created successfully!', 'success');
      }

      setOwnerForm(getEmptyOwnerForm());
      setOwnerDocumentPreviews({});
      setEditingOwner(null);
      setShowOwnerModal(false);

      const ownersData = await agencyDirectorService.getOwners().catch(() => []);
      setOwners(Array.isArray(ownersData) ? ownersData : []);

      setLoading(false);
    } catch (error) {
      console.error('Error saving owner:', error);
      addNotification(error.message || (editingOwner ? 'Failed to update owner' : 'Failed to create owner'), 'error');
      setLoading(false);
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
      address: property.Address || property.address || property.buildingName || '',
      type: property.Type || property.type || '',
      rent: property.Rent || property.rent || '',
      tenant: property.Tenant || property.tenant || '',
      status: property.Status || property.status || 'Vacant',
      units: propertyUnits.length > 0 ? propertyUnits.map(unit => ({
        unitNumber: unit.unitNumber || unit.UnitNumber || unit.name || '',
        rent: unit.rent || unit.rentPrice || unit.Rent || '',
        bedrooms: unit.bedrooms || unit.Bedrooms || '',
        bathrooms: unit.bathrooms || unit.Bathrooms || '',
        status: unit.status || unit.statut || unit.Status || 'Vacant',
        tenant: unit.tenant || unit.Tenant || ''
      })) : [{ unitNumber: '1', rent: '', bedrooms: '', bathrooms: '', status: 'Vacant', tenant: '' }]
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

  // Property Management: owners → buildings → units (same flow as Sales Manager)
  const getOwnerId = (owner) => owner.id || owner.ID;

  const deriveOwnerAssetsFromProperties = (owner, propsSource) => {
    const props = propsSource || properties || [];
    const ownerProps = props.filter((property) => ownerMatchesProperty(owner, property));
    return {
      ownerName: owner.name || owner.Name || 'Owner',
      assets: ownerProps.map((p) => ({
        id: p.id || p.ID,
        name: getPropertyLabel(p),
        building: getPropertyLabel(p),
        type: (p.Type || p.type || 'building').toLowerCase(),
        apartmentsDisplay: getPropertyOccupancyStats(p).totalUnits,
        rentPrice: p.Rent || p.rent,
        location: getPropertyLabel(p),
        occupancy: getPropertyOccupancyStats(p).occupancyLabel,
        statut: getPropertyStatus(p)
      }))
    };
  };

  const handleSeeOwner = async (owner) => {
    const ownerId = getOwnerId(owner);
    if (!ownerId) return;
    setPmLoading(true);
    try {
      let data;
      if (isDemoMode()) {
        data = deriveOwnerAssetsFromProperties(owner, pmProperties.length ? pmProperties : properties);
      } else {
        try {
          // Use agency director API (sales manager returns 401 for agency director token)
          data = await agencyDirectorService.getOwnerAssets(ownerId);
          const apiAssets = data?.assets || data?.properties || [];
          const propsSource = pmProperties.length ? pmProperties : properties;
          if (apiAssets.length === 0 && propsSource.length > 0) {
            data = deriveOwnerAssetsFromProperties(owner, propsSource);
          }
        } catch (apiErr) {
          // API failed (404/401) – derive from properties (requires landlordId/LandlordID in each property)
          data = deriveOwnerAssetsFromProperties(owner, pmProperties.length ? pmProperties : properties);
        }
      }
      setOwnerAssets(data);
      setPmOwnerId(ownerId);
      setPmOwnerName(data.ownerName || owner.name || owner.Name || 'Owner');
      setPmView('owner-detail');
    } catch (err) {
      console.error('Failed to load owner assets:', err);
      addNotification('Failed to load owner assets', 'error');
    } finally {
      setPmLoading(false);
    }
  };

  const deriveBuildingDetailFromProperty = (propId, property) => {
    const props = pmProperties.length ? pmProperties : properties || [];
    const prop = props.find((p) => String(p.id || p.ID) === String(propId)) || property;
    const units = prop.units || prop.Units || [];
    return {
      buildingName: prop.Address || prop.address || property.name || property.building || 'Building',
      totalApartments: units.length || 1,
      units: units.length > 0 ? units.map((u, i) => ({
        id: u.id || i,
        unitNumber: u.unitNumber || u.UnitNumber || `Unit ${i + 1}`,
        type: u.type || u.Type || '—',
        tenant: u.tenant || u.Tenant || '—',
        rentPrice: u.rent || u.rentPrice || u.Rent,
        enterDate: u.enterDate || '—',
        status: u.status || u.Status || 'Vacant',
        statut: u.status || u.statut || u.Status || 'Vacant'
      })) : [{ id: 1, unitNumber: '1', type: '—', tenant: '—', rentPrice: prop.Rent || prop.rent, enterDate: '—', status: 'Vacant', statut: 'Vacant' }],
      images: []
    };
  };

  const handleViewBuilding = async (property) => {
    const propId = property.id || property.ID;
    if (!propId) return;
    setPmLoading(true);
    try {
      let data;
      if (isDemoMode()) {
        data = deriveBuildingDetailFromProperty(propId, property);
      } else {
        try {
          data = await agencyDirectorService.getPropertyBuildingDetail(propId);
        } catch (apiErr) {
          data = deriveBuildingDetailFromProperty(propId, property);
        }
      }
      setBuildingDetail(data);
      setPmPropertyId(propId);
      setPmBuildingName(data.buildingName || property.name || property.building || property.Address || property.address || 'Building');
      setPmView('building-detail');
    } catch (err) {
      console.error('Failed to load building detail:', err);
      addNotification('Failed to load building detail', 'error');
    } finally {
      setPmLoading(false);
    }
  };

  const deriveVillaDetailFromProperty = (propId, property) => {
    const props = pmProperties.length ? pmProperties : properties || [];
    const prop = props.find((p) => String(p.id || p.ID) === String(propId)) || property;
    const units = prop.units || prop.Units || [];
    return {
      buildingName: prop.Address || prop.address || property.name || property.building || 'Villa',
      totalApartments: units.length || 1,
      units: units.length > 0 ? units.map((u, i) => ({
        id: u.id || i,
        unitNumber: u.unitNumber || u.UnitNumber || `Unit ${i + 1}`,
        type: u.type || u.Type || '—',
        tenant: u.tenant || u.Tenant || '—',
        rentPrice: u.rent || u.rentPrice || u.Rent,
        enterDate: u.enterDate || '—',
        status: u.status || u.Status || 'Vacant',
        statut: u.status || u.statut || u.Status || 'Vacant'
      })) : [{ id: 1, unitNumber: '1', type: '—', tenant: '—', rentPrice: prop.Rent || prop.rent, enterDate: '—', status: 'Vacant', statut: 'Vacant' }],
      images: []
    };
  };

  const handleViewVilla = async (property) => {
    const propId = property.id || property.ID;
    if (!propId) return;
    setPmLoading(true);
    try {
      let data;
      if (isDemoMode()) {
        data = deriveVillaDetailFromProperty(propId, property);
      } else {
        try {
          data = await agencyDirectorService.getPropertyBuildingDetail(propId);
        } catch (apiErr) {
          data = deriveVillaDetailFromProperty(propId, property);
        }
      }
      setBuildingDetail(data);
      setPmPropertyId(propId);
      setPmBuildingName(data.buildingName || property.name || property.building || property.Address || property.address || 'Villa');
      setPmView('villa-detail');
    } catch (err) {
      console.error('Failed to load villa detail:', err);
      addNotification('Failed to load villa detail', 'error');
    } finally {
      setPmLoading(false);
    }
  };

  const handleViewLand = (property) => {
    setLandDetail(property);
    setPmPropertyId(property.id || property.ID);
    setPmBuildingName(property.name || property.building || property.Address || property.address || 'Land');
    setPmView('land-detail');
  };

  // Render functions
  const renderOverview = () => {
    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading overview data...</div>;

    const stats = overviewData || {};
    const overviewProperties = companyBuildings.length > 0 ? companyBuildings : properties;
    const propertyStats = overviewProperties.reduce((acc, property) => {
      const occupancy = getPropertyOccupancyStats(property);
      acc.totalUnits += occupancy.totalUnits;
      acc.occupiedUnits += occupancy.occupiedUnits;
      acc.vacantUnits += occupancy.vacantUnits;
      const units = getPropertyUnits(property);
      if (units.length > 0) {
        units.forEach(unit => {
          const tenantName = getValue(unit?.tenant, unit?.Tenant);
          const unitStatus = normalizeText(unit?.status ?? unit?.Status);
          if (tenantName && (unitStatus === 'occupied' || tenantName)) acc.activeTenants.add(String(tenantName).trim());
        });
      } else if (getValue(property?.tenant, property?.Tenant)) {
        acc.activeTenants.add(String(getValue(property?.tenant, property?.Tenant)).trim());
      }
      return acc;
    }, { totalUnits: 0, occupiedUnits: 0, vacantUnits: 0, activeTenants: new Set() });
    const totalProperties = (allBuildingsReport?.length || overviewProperties.length || stats.totalProperties || 0);
    const totalRentCollected = getNumericValue(accountingData?.collections, stats.totalRentCollected, financialData?.totalRevenue, 0);
    const overallOccupancyRate = stats.overallOccupancyRate || (propertyStats.totalUnits > 0 ? (propertyStats.occupiedUnits / propertyStats.totalUnits) * 100 : 0);
    const activeTenants = getUniqueTenantCount(tenants);
    const totalUnpaidRent = Number(getValue(stats.totalUnpaidRent, 0) || 0);
    const teamMembers = agencyUsers.length || stats.totalUsers || 0;

    // Build chart data from last 6 months
    const chartData = (() => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        months.push({
          month: d.toLocaleDateString('en-US', { month: 'short' }),
          revenue: Math.round(totalRentCollected * (0.7 + (5 - i) * 0.06)),
          expenses: Math.round((stats.totalExpenses || totalRentCollected * 0.25) * (0.65 + (5 - i) * 0.07)),
        });
      }
      return months;
    })();

    const cardStyle = { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
    const metricLabel = { margin: 0, fontSize: '0.8rem', fontWeight: 500, color: '#64748b' };
    const metricValue = { margin: '8px 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' };
    const statusBadge = (s) => {
      const sl = (s || '').toLowerCase();
      const colors = { occupied: { bg: '#dcfce7', color: '#166534' }, vacant: { bg: '#fef3c7', color: '#92400e' }, active: { bg: '#dcfce7', color: '#166534' } };
      const c = colors[sl] || { bg: '#f1f5f9', color: '#475569' };
      return { display: 'inline-block', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: c.bg, color: c.color };
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top row: Chart + Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
          {/* Chart */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Revenue Overview</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#94a3b8' }}>Revenue vs Expenses — last 6 months</p>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="adRevGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="adExpGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} formatter={(v) => `${v.toLocaleString()} XOF`} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fill="url(#adRevGrad)" dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={3} fill="url(#adExpGrad)" dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff' }}>
              <p style={{ ...metricLabel, color: 'rgba(255,255,255,0.8)' }}>Rent Collected</p>
              <p style={{ ...metricValue, color: '#fff' }}>{totalRentCollected.toLocaleString()}<span style={{ fontSize: '0.85rem', fontWeight: 500 }}> XOF</span></p>
            </div>
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>
              <p style={{ ...metricLabel, color: 'rgba(255,255,255,0.8)' }}>Occupancy Rate</p>
              <p style={{ ...metricValue, color: '#fff' }}>{typeof overallOccupancyRate === 'number' ? overallOccupancyRate.toFixed(1) : overallOccupancyRate}%</p>
            </div>
            <div style={cardStyle}>
              <p style={metricLabel}>Active Tenants</p>
              <p style={metricValue}>{activeTenants}</p>
            </div>
            <div style={cardStyle}>
              <p style={metricLabel}>Properties</p>
              <p style={metricValue}>{totalProperties}</p>
            </div>
            <div style={cardStyle}>
              <p style={metricLabel}>Vacant</p>
              <p style={{ ...metricValue, color: '#f59e0b' }}>{propertyStats.vacantUnits}</p>
            </div>
            <div style={cardStyle}>
              <p style={metricLabel}>Occupied</p>
              <p style={{ ...metricValue, color: '#10b981' }}>{propertyStats.occupiedUnits}</p>
            </div>
            <div style={cardStyle}>
              <p style={metricLabel}>Unpaid Rent</p>
              <p style={{ ...metricValue, color: '#dc2626' }}>{totalUnpaidRent.toLocaleString()}<span style={{ fontSize: '0.85rem', fontWeight: 500 }}> XOF</span></p>
            </div>
            <div style={cardStyle}>
              <p style={metricLabel}>Team Members</p>
              <p style={metricValue}>{teamMembers}</p>
            </div>
          </div>
        </div>

        {/* Properties table */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>Properties Overview</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Top 10</span>
          </div>
          {properties.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No properties found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Property', 'Type', 'Status', 'Rent', 'Tenant'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {properties.slice(0, 10).map((p, i) => (
                    <tr key={p.id || p.ID || i} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 14px', fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span>{getPropertyLabel(p)}</span>
                          {getValue(p.building, p.Building) && normalizeText(getValue(p.building, p.Building)) !== normalizeText(getPropertyLabel(p)) && (
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{getValue(p.building, p.Building)}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#64748b' }}>{p.type || p.Type || 'N/A'}</td>
                      <td style={{ padding: '12px 14px' }}><span style={statusBadge(p.Status || p.status)}>{p.Status || p.status || 'Vacant'}</span></td>
                      <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#1e293b', fontWeight: 500 }}>{(p.rent || p.Rent) ? `${(p.rent || p.Rent).toLocaleString()} XOF` : '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#64748b' }}>{p.tenant || p.Tenant || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                  {String(user.ID || user.id) !== String(getCurrentUserId()) && (
                    <button className="sa-icon-button" onClick={() => handleDeleteUser(user)} title="Delete">🗑️</button>
                  )}
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
              <option value="technician">Technician</option>
              <option value="accounting">Accounting</option>
              <option value="admin">Admin</option>
              <option value="salesmanager">Sales Manager</option>
              <option value="agency_director">Agency Director</option>
            </select>
            <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
              Company will be automatically set from your account.
              To add a landlord/owner, use the Owners page in Contracts.
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

  const renderProperties = () => {
    // Use same data as Sales Manager Property Management (pmOwners, pmProperties)
    const ownersList = pmOwners.length ? pmOwners : (owners || []);
    const propsList = pmProperties.length ? pmProperties : (properties || []);
    const searchLower = (propertyManagementSearch || '').trim().toLowerCase();
    const filteredOwners = searchLower
      ? ownersList.filter((o) => (o.name || o.Name || '').toLowerCase().includes(searchLower))
      : ownersList;

    const unassignedProperties = propsList.filter((p) => !getPropertyOwnerId(p) && !getPropertyOwnerName(p));

    const editPropertyModal = (
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
          <div className="sa-form-group" style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
                Units/Houses <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6b7280' }}>(Optional - for properties with multiple units)</span>
              </label>
              <button type="button" onClick={handleAddUnit} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>+ Add Unit</button>
            </div>
            {propertyForm.units.map((unit, index) => (
              <div key={index} style={{ marginBottom: '16px', padding: '16px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#6b7280' }}>Unit {index + 1}</span>
                  <button type="button" onClick={() => handleRemoveUnit(index)} style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Remove</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Unit Number *</label>
                    <input type="text" value={unit.unitNumber} onChange={(e) => handleUnitChange(index, 'unitNumber', e.target.value)} placeholder="e.g., 101, A1, Unit 5" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} required={propertyForm.units.length > 0} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Rent *</label>
                    <input type="number" value={unit.rent} onChange={(e) => handleUnitChange(index, 'rent', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} required={propertyForm.units.length > 0} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Bedrooms</label>
                    <input type="number" value={unit.bedrooms} onChange={(e) => handleUnitChange(index, 'bedrooms', e.target.value)} placeholder="0" min="0" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Bathrooms</label>
                    <input type="number" step="0.5" value={unit.bathrooms} onChange={(e) => handleUnitChange(index, 'bathrooms', e.target.value)} placeholder="0.0" min="0" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Status</label>
                    <select value={unit.status} onChange={(e) => handleUnitChange(index, 'status', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}>
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Tenant</label>
                    <input type="text" value={unit.tenant} onChange={(e) => handleUnitChange(index, 'tenant', e.target.value)} placeholder="Tenant name (optional)" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                  </div>
                </div>
              </div>
            ))}
            {propertyForm.units.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>No units added. Click "Add Unit" to add units/houses for this property.</p>
            )}
          </div>
          <div className="sa-form-actions">
            <button type="button" className="sa-outline-button" onClick={() => setShowPropertyModal(false)}>Cancel</button>
            <button type="submit" className="sa-primary-cta">Update Property</button>
          </div>
        </form>
        )}
      </Modal>
    );

    // Building detail view – units table
    if (pmView === 'building-detail' && buildingDetail) {
      const units = buildingDetail.units || [];
      const totalApartments = buildingDetail.totalApartments ?? units.length;
      const images = buildingDetail.images || [];
      const firstImage = images[0];
      return (
        <>
        <div className="sa-clients-page">
          <div className="sa-clients-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="button" className="sa-primary-cta" style={{ padding: '8px 12px' }} onClick={() => setPmView('owner-detail')}>
                <ArrowLeft size={18} />
                Back
              </button>
              <div>
                <h2>Building {pmBuildingName} management</h2>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
            {firstImage && (
              <img src={firstImage} alt={pmBuildingName} style={{ width: 280, height: 160, objectFit: 'cover', borderRadius: 8 }} />
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{pmBuildingName.toUpperCase()}</h3>
              <p style={{ margin: 0, color: '#6b7280' }}>Total of appartments: <strong>{totalApartments}</strong></p>
            </div>
          </div>
          <div className="sa-section-card" style={{ marginTop: '20px' }}>
            <div className="sa-table-wrapper">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Appartements</th>
                    <th>Type</th>
                    <th>tenant</th>
                    <th>price of rent</th>
                    <th>Enter date</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((row, i) => (
                    <tr key={row.id || i}>
                      <td>{row.unitNumber || row.name || `Appartment ${i + 1}`}</td>
                      <td>{row.type || '—'}</td>
                      <td>{row.tenant || '—'}</td>
                      <td>{typeof row.rentPrice === 'number' ? row.rentPrice.toLocaleString() : row.rentPrice || '—'} F CFA</td>
                      <td>{row.enterDate || '—'}</td>
                      <td>{row.status || row.statut || '—'}</td>
                      <td>
                        <button className="table-action-button edit" onClick={() => handleOpenEditProperty({ ...buildingDetail, id: pmPropertyId, Address: pmBuildingName })}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {editPropertyModal}
        </>
      );
    }

    // Villa detail view
    if (pmView === 'villa-detail' && buildingDetail) {
      const units = buildingDetail.units || [];
      const images = buildingDetail.images || [];
      const firstImage = images[0];
      return (
        <>
        <div className="sa-clients-page">
          <div className="sa-clients-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="button" className="sa-primary-cta" style={{ padding: '8px 12px' }} onClick={() => setPmView('owner-detail')}>
                <ArrowLeft size={18} />
                Back
              </button>
              <div>
                <h2>Villa {pmBuildingName} management</h2>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
            {firstImage && (
              <img src={firstImage} alt={pmBuildingName} style={{ width: 280, height: 160, objectFit: 'cover', borderRadius: 8 }} />
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{pmBuildingName.toUpperCase()}</h3>
              <p style={{ margin: 0, color: '#6b7280' }}>BIG HOUSE</p>
            </div>
          </div>
          <div className="sa-section-card" style={{ marginTop: '20px' }}>
            <div className="sa-table-wrapper">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Villa</th>
                    <th>Type</th>
                    <th>tenant</th>
                    <th>price of rent</th>
                    <th>Enter date</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((row, i) => (
                    <tr key={row.id || i}>
                      <td>VILLA</td>
                      <td>{row.type || '—'}</td>
                      <td>{row.tenant || '—'}</td>
                      <td>{typeof row.rentPrice === 'number' ? row.rentPrice.toLocaleString() : row.rentPrice || '—'} F CFA</td>
                      <td>{row.enterDate || '—'}</td>
                      <td>{row.status || row.statut || '—'}</td>
                      <td>
                        <button className="table-action-button edit" onClick={() => handleOpenEditProperty({ ...buildingDetail, id: pmPropertyId, Address: pmBuildingName })}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {editPropertyModal}
        </>
      );
    }

    // Land detail view
    if (pmView === 'land-detail' && landDetail) {
      return (
        <>
        <div className="sa-clients-page">
          <div className="sa-clients-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="button" className="sa-primary-cta" style={{ padding: '8px 12px' }} onClick={() => { setPmView('owner-detail'); setLandDetail(null); }}>
                <ArrowLeft size={18} />
                Back
              </button>
              <div>
                <h2>Land: {pmBuildingName}</h2>
              </div>
            </div>
          </div>
          <div className="sa-section-card" style={{ marginTop: '20px', padding: '20px' }}>
            <p><strong>Name:</strong> {landDetail.name || landDetail.Address || '—'}</p>
            <p><strong>Location:</strong> {landDetail.location || landDetail.City || '—'}</p>
            <p><strong>Statut:</strong> {landDetail.statut || 'For sell'}</p>
            <p><strong>Price:</strong> {typeof landDetail.rentPrice === 'number' ? landDetail.rentPrice.toLocaleString() : landDetail.rentPrice ?? '—'}</p>
          </div>
        </div>
        {editPropertyModal}
        </>
      );
    }

    // Owner assets view – buildings table (API may return assets or properties)
    if (pmView === 'owner-detail' && ownerAssets) {
      const assets = ownerAssets.assets || ownerAssets.properties || [];
      const handleAssetClick = (asset) => {
        const type = (asset.type || '').toLowerCase();
        if (type === 'building') handleViewBuilding(asset);
        else if (type === 'villa') handleViewVilla(asset);
        else if (type === 'land') handleViewLand(asset);
        else handleViewBuilding(asset);
      };
      return (
        <>
        <div className="sa-clients-page">
          <div className="sa-clients-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="button" className="sa-primary-cta" style={{ padding: '8px 12px' }} onClick={() => { setPmView('list'); setOwnerAssets(null); setPmOwnerId(null); setPmOwnerName(''); }}>
                <ArrowLeft size={18} />
                Back
              </button>
              <div>
                <h2>{pmOwnerName} assets management</h2>
              </div>
            </div>
          </div>
          {pmLoading && <p style={{ marginTop: 8 }}>Loading…</p>}
          <div className="sa-section-card" style={{ marginTop: '20px' }}>
            <div className="sa-table-wrapper">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>PROPERTY</th>
                    <th>APPARTMENTS</th>
                    <th>RENT PRICE</th>
                    <th>LOCATION</th>
                    <th>OCCUPANCY</th>
                    <th>STATUT</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((row) => (
                    <tr
                      key={row.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleAssetClick(row)}
                      className="clickable-row"
                    >
                      <td className="sa-cell-main">{row.name || row.building || '—'}</td>
                      <td>{row.apartmentsDisplay ?? row.apartments ?? '—'}</td>
                      <td>{typeof row.rentPrice === 'number' ? row.rentPrice.toLocaleString() : row.rentPrice ?? '—'}</td>
                      <td>{row.location || row.localisation || '—'}</td>
                      <td>{row.occupancy ?? '—'}</td>
                      <td>{row.statut ?? '—'}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="table-action-button edit" onClick={() => handleOpenEditProperty(row)}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {assets.length === 0 && !pmLoading && (
              <p className="sa-table-empty">No assets for this owner.</p>
            )}
          </div>
        </div>
        {editPropertyModal}
        </>
      );
    }

    // Owners list (default view) – same format as Sales Manager Property Management
    return (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>PROPERTY MANAGEMENT</h2>
          <p>Click an owner to see their buildings and units</p>
        </div>
        <div className="sa-clients-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input
              type="text"
              placeholder="Search by member name"
              value={propertyManagementSearch}
              onChange={(e) => setPropertyManagementSearch(e.target.value)}
              style={{ padding: '8px 12px 8px 36px', border: '1px solid #e5e7eb', borderRadius: '8px', minWidth: '220px' }}
            />
          </div>
        </div>
      </div>

      {pmDataLoading && (
        <p className="sa-table-empty" style={{ marginTop: '20px' }}>Loading owners and properties…</p>
      )}
      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Total of assets</th>
                <th>Property for sell</th>
                <th>Property for manage</th>
                <th>Occupancy</th>
                <th>Income (this month)</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.map((owner, index) => {
                const ownerId = getOwnerId(owner);
                const ownerStats = getOwnerPropertyStats(owner, propsList);
                const totalOfAssets = ownerStats.totalAssets || owner.totalOfAssets || owner.numberOfAssetsManaged || 0;
                const propertyForSell = ownerStats.sellAssets ?? owner.propertyForSell ?? 0;
                const propertyForManage = ownerStats.manageAssets ?? owner.propertyForManage ?? 0;
                const occupancy = ownerStats.occupancyLabel || owner.occupancy || '0/0';
                const incomeThisMonth = ownerStats.incomeThisMonth ?? owner.incomeThisMonth ?? owner.revenue ?? 0;
                return (
                  <tr
                    key={ownerId || index}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSeeOwner(owner)}
                    className="clickable-row"
                  >
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{owner.name || owner.Name || 'N/A'}</span>
                    </td>
                    <td>{owner.email || owner.Email || '—'}</td>
                    <td>{totalOfAssets}</td>
                    <td>{propertyForSell}</td>
                    <td>{propertyForManage}</td>
                    <td>{occupancy}</td>
                    <td>{typeof incomeThisMonth === 'number' ? incomeThisMonth.toLocaleString() : incomeThisMonth}</td>
                  </tr>
                );
              })}
              {filteredOwners.length === 0 && (
                <tr>
                  <td colSpan={7} className="sa-table-empty">
                    No owners found. Add property owners first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {unassignedProperties.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-section-header">
            <div>
              <h3>Properties Without Owner</h3>
              <p>{unassignedProperties.length} properties not yet assigned to an owner</p>
            </div>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Address</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Rent</th>
                  <th>Bedrooms</th>
                  <th>Bathrooms</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {unassignedProperties.map((property, index) => (
                  <tr
                    key={`unassigned-${property.ID || property.id || index}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleOpenEditProperty(property)}
                  >
                    <td>{index + 1}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{property.Address || property.address || 'N/A'}</span>
                    </td>
                    <td>{property.Type || property.type || 'N/A'}</td>
                    <td>
                      <span className={`sa-status-pill ${(property.Status || property.status || 'unknown').toLowerCase()}`}>
                        {property.Status || property.status || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      {typeof (property.Rent || property.rent) === 'number'
                        ? (property.Rent || property.rent).toLocaleString()
                        : property.Rent || property.rent || 'N/A'}
                    </td>
                    <td>{property.Bedrooms || property.bedrooms || 0}</td>
                    <td>{property.Bathrooms || property.bathrooms || 0}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="table-action-button edit" onClick={() => handleOpenEditProperty(property)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editPropertyModal}
    </div>
  );
  };

  const renderAccounting = () => {
    const matchesAccountingDate = (item) => {
      const date = getTransactionDate(item);
      if (!date) return true;
      if (!accountingDateFilterValue) return true;
      if (accountingDateFilterMode === 'day') return date.toISOString().slice(0, 10) === accountingDateFilterValue;
      if (accountingDateFilterMode === 'month') return date.toISOString().slice(0, 7) === accountingDateFilterValue.slice(0, 7);
      if (accountingDateFilterMode === 'year') return String(date.getFullYear()) === String(accountingDateFilterValue).slice(0, 4);
      return true;
    };

    const filteredAllExpenses = dedupeRecords(allExpenses).filter(matchesAccountingDate);
    const filteredRevenueData = dedupeRecords(revenueData).filter(matchesAccountingDate);
    const filteredLandlordPayments = dedupeRecords(landlordPayments).filter(matchesAccountingDate);
    const pendingCount = filteredLandlordPayments.filter(p => {
      const s = (p.status || p.Status || '').toLowerCase();
      return s === 'pending' || s === 'pending_approval' || s === 'pending approval';
    }).length;

    const ACCT_TABS = [
      { id: 'owner-payments', label: 'Owner Payments' },
      { id: 'overview', label: 'Overview' },
      { id: 'expenses', label: 'Expenses' },
      { id: 'revenue', label: 'Revenue' },
    ];

    const acctTab = ['owner-payments', 'overview', 'expenses', 'revenue'].includes(selectedAccountingView)
      ? selectedAccountingView
      : 'owner-payments';

    const dateFilterBar = (
      <div className="sa-filters-section" style={{ margin: '0 0 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="sa-filter-select" value={accountingDateFilterMode} onChange={(e) => setAccountingDateFilterMode(e.target.value)}>
          <option value="day">By day</option>
          <option value="month">By month</option>
          <option value="year">By year</option>
        </select>
        {accountingDateFilterMode === 'day' && <input type="date" className="sa-filter-select" value={accountingDateFilterValue} onChange={(e) => setAccountingDateFilterValue(e.target.value)} />}
        {accountingDateFilterMode === 'month' && <input type="month" className="sa-filter-select" value={accountingDateFilterValue.slice(0, 7)} onChange={(e) => setAccountingDateFilterValue(e.target.value)} />}
        {accountingDateFilterMode === 'year' && <input type="number" min="2000" max="2100" className="sa-filter-select" value={String(accountingDateFilterValue).slice(0, 4)} onChange={(e) => setAccountingDateFilterValue(e.target.value)} />}
        <button type="button" className="sa-outline-button" onClick={() => setAccountingDateFilterValue(accountingDateFilterMode === 'month' ? new Date().toISOString().slice(0, 7) : accountingDateFilterMode === 'year' ? String(new Date().getFullYear()) : new Date().toISOString().slice(0, 10))}>Reset</button>
      </div>
    );

    return (
      <div className="sa-overview-page">
        <div className="sa-section-card">
          <div className="sa-section-header" style={{ marginBottom: '4px' }}>
            <div><h2>Accounting</h2><p>Financial overview, owner payments, expenses and revenue</p></div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e5e7eb', marginBottom: '24px' }}>
            {ACCT_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedAccountingView(tab.id)}
                style={{
                  padding: '10px 22px',
                  border: 'none',
                  background: 'transparent',
                  color: acctTab === tab.id ? '#2563eb' : '#6b7280',
                  fontWeight: acctTab === tab.id ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  borderBottom: acctTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                  marginBottom: '-2px',
                  position: 'relative',
                }}
              >
                {tab.label}
                {tab.id === 'owner-payments' && pendingCount > 0 && (
                  <span style={{ marginLeft: '6px', background: '#dc2626', color: '#fff', borderRadius: '9999px', padding: '1px 7px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {acctTab === 'overview' && (() => {
            const ownerPaymentSummary = (() => {
              const byOwner = {};
              filteredLandlordPayments.forEach(p => {
                const name = p.landlord || p.Landlord || 'Unknown';
                if (!byOwner[name]) byOwner[name] = { net: 0, commission: 0, total: 0 };
                byOwner[name].net += p.netAmount || p.NetAmount || 0;
                byOwner[name].commission += p.commission || p.Commission || 0;
                byOwner[name].total += (p.netAmount || p.NetAmount || 0) + (p.commission || p.Commission || 0);
              });
              return Object.entries(byOwner).map(([ownerName, vals]) => ({ ownerName, ...vals }));
            })();

            return (
              <div>
                {dateFilterBar}
                <div className="sa-overview-metrics" style={{ width: '100%', marginBottom: '24px' }}>
                  <div className="sa-metric-card sa-metric-primary">
                    <p className="sa-metric-label">Total Rent Collected</p>
                    <p className="sa-metric-value">{(accountingData?.totalTenantPayments || 0).toLocaleString()} FCFA</p>
                  </div>
                  <div className="sa-metric-card">
                    <p className="sa-metric-label">Owner Payments Made</p>
                    <p className="sa-metric-value">{(accountingData?.totalLandlordPayments || 0).toLocaleString()} FCFA</p>
                  </div>
                  <div className="sa-metric-card">
                    <p className="sa-metric-label">Total Expenses</p>
                    <p className="sa-metric-value">{(accountingData?.totalExpenses || 0).toLocaleString()} FCFA</p>
                  </div>
                  <div className="sa-metric-card">
                    <p className="sa-metric-label">Net Revenue</p>
                    <p className="sa-metric-value">{(accountingData?.netRevenue || 0).toLocaleString()} FCFA</p>
                  </div>
                  <div className="sa-metric-card">
                    <p className="sa-metric-label">Pending Payments</p>
                    <p className="sa-metric-value">{pendingCount}</p>
                  </div>
                  <div className="sa-metric-card">
                    <p className="sa-metric-label">Approved Payments</p>
                    <p className="sa-metric-value">{accountingData?.approvedPayments ?? filteredLandlordPayments.filter(p => (p.status || p.Status || '').toLowerCase() === 'approved').length}</p>
                  </div>
                </div>

                <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Owner Payments Summary</h3>
                <div className="sa-table-wrapper">
                  <table className="sa-table">
                    <thead><tr><th>No</th><th>Owner</th><th>Net Paid (FCFA)</th><th>Commission (FCFA)</th><th>Total (FCFA)</th></tr></thead>
                    <tbody>
                      {ownerPaymentSummary.length > 0 ? ownerPaymentSummary.map((row, i) => (
                        <tr key={`owner-sum-${i}`}>
                          <td>{i + 1}</td>
                          <td className="sa-cell-main"><span className="sa-cell-title">{row.ownerName}</span></td>
                          <td>{row.net.toLocaleString()}</td>
                          <td>{row.commission.toLocaleString()}</td>
                          <td style={{ fontWeight: 600 }}>{row.total.toLocaleString()}</td>
                        </tr>
                      )) : <tr><td colSpan={5} className="sa-table-empty">No owner payments in selected period</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Owner Payments tab */}
          {acctTab === 'owner-payments' && (
            <div>
              {dateFilterBar}
              {pendingCount > 0 && (
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, color: '#92400e' }}>⚠ {pendingCount} payment{pendingCount > 1 ? 's' : ''} awaiting your approval</span>
                </div>
              )}
              <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>No</th><th>Owner</th><th>Building</th><th>Net Amount</th><th>Commission</th><th>Date</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLandlordPayments.length > 0 ? filteredLandlordPayments.map((payment, i) => {
                      const status = (payment.status || payment.Status || 'pending').toLowerCase();
                      const isPending = status === 'pending' || status === 'pending_approval' || status === 'pending approval';
                      const isApproved = status === 'approved';
                      const isRevoked = status === 'revoked';
                      return (
                        <tr key={`lp-${payment.id || payment.ID || i}`}>
                          <td>{i + 1}</td>
                          <td className="sa-cell-main"><span className="sa-cell-title">{payment.landlord || payment.Landlord || '—'}</span></td>
                          <td>{payment.building || payment.Building || '—'}</td>
                          <td style={{ fontWeight: 600 }}>{(payment.netAmount || payment.NetAmount || 0).toLocaleString()} FCFA</td>
                          <td>{(payment.commission || payment.Commission || 0).toLocaleString()} FCFA</td>
                          <td>{payment.date || payment.Date ? new Date(payment.date || payment.Date).toLocaleDateString() : '—'}</td>
                          <td>
                            <span className={`sa-status-pill ${isApproved ? 'approved' : isRevoked ? 'rejected' : 'pending'}`}>
                              {payment.status || payment.Status || 'Pending'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {isPending && (
                                <button
                                  className="table-action-button edit"
                                  style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                                  onClick={() => handleApproveLandlordPayment(payment.id || payment.ID)}
                                >
                                  Approve
                                </button>
                              )}
                              {!isRevoked && !isApproved && (
                                <button
                                  className="table-action-button"
                                  style={{ background: '#dc2626', color: '#fff', border: 'none' }}
                                  onClick={() => handleRevokeLandlordPayment(payment.id || payment.ID)}
                                >
                                  Reject
                                </button>
                              )}
                              {isApproved && <span className="sa-status-pill approved" style={{ padding: '4px 10px' }}>Approved</span>}
                              {isRevoked && <span className="sa-status-pill rejected" style={{ padding: '4px 10px' }}>Rejected</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    }) : <tr><td colSpan={8} className="sa-table-empty">No owner payments found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expenses tab */}
          {acctTab === 'expenses' && (
            <div>
              {dateFilterBar}
              {pendingExpenses.length > 0 && (
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#92400e' }}>⚠ {pendingExpenses.length} expense{pendingExpenses.length > 1 ? 's' : ''} awaiting your approval</span>
                </div>
              )}
              <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead><tr><th>No</th><th>Description</th><th>Amount</th><th>Building</th><th>Category</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredAllExpenses.length > 0 ? filteredAllExpenses.map((expense, i) => {
                      const expStatus = (expense.status || expense.Status || 'pending').toLowerCase();
                      const isPending = expStatus === 'pending' || expStatus === 'pending_approval' || expStatus === 'pending approval';
                      const isApproved = expStatus === 'approved';
                      const isRejected = expStatus === 'rejected';
                      const expId = expense.id || expense.ID;
                      let docUrls = [];
                      try { docUrls = JSON.parse(expense.documentURLs || expense.DocumentURLs || '[]'); } catch (_) {}
                      if (!Array.isArray(docUrls)) docUrls = [];
                      const singleDoc = expense.documentURL || expense.DocumentURL;
                      if (singleDoc && !docUrls.includes(singleDoc)) docUrls = [singleDoc, ...docUrls];
                      return (
                        <tr key={`exp-${expId || i}`}>
                          <td>{i + 1}</td>
                          <td>{expense.description || expense.Description || expense.notes || expense.reason || 'N/A'}</td>
                          <td style={{ fontWeight: 600 }}>{(expense.amount || expense.Amount || 0).toLocaleString()} FCFA</td>
                          <td>{expense.building || expense.Building || '—'}</td>
                          <td>{expense.category || expense.Category || 'General'}</td>
                          <td>{expense.date || expense.Date ? new Date(expense.date || expense.Date).toLocaleDateString() : '—'}</td>
                          <td>
                            <span className={`sa-status-pill ${isApproved ? 'approved' : isRejected ? 'rejected' : 'pending'}`}>
                              {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {docUrls.map((url, di) => (
                                <a key={di} href={url} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'underline' }}>
                                  Doc {di + 1}
                                </a>
                              ))}
                              {isPending && (
                                <>
                                  <button className="table-action-button edit"
                                    style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                                    onClick={() => handleApproveExpense(expId)}>Approve</button>
                                  <button className="table-action-button"
                                    style={{ background: '#dc2626', color: '#fff', border: 'none' }}
                                    onClick={() => handleRejectExpense(expId)}>Reject</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }) : <tr><td colSpan={8} className="sa-table-empty">No expenses found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Revenue tab */}
          {acctTab === 'revenue' && (
            <div>
              {dateFilterBar}
              <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead><tr><th>No</th><th>Source</th><th>Amount</th><th>Type</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {filteredRevenueData.length > 0 ? filteredRevenueData.map((item, i) => (
                      <tr key={`rev-${i}`}>
                        <td>{i + 1}</td>
                        <td>{item.source || item.Source || item.tenant || item.Tenant || 'N/A'}</td>
                        <td style={{ fontWeight: 600 }}>{(item.amount || item.Amount || 0).toLocaleString()} FCFA</td>
                        <td>{item.type || item.Type || 'Rent'}</td>
                        <td>{item.date || item.Date ? new Date(item.date || item.Date).toLocaleDateString() : '—'}</td>
                        <td><span className={`sa-status-pill ${(item.status || item.Status || 'completed').toLowerCase()}`}>{item.status || item.Status || 'Completed'}</span></td>
                      </tr>
                    )) : <tr><td colSpan={6} className="sa-table-empty">No revenue records found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };


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
                <th>Actions</th>
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
                  <td className="sa-row-actions">
                    <button
                      className="table-action-button edit"
                      onClick={() => handleApproveLease(lease.id || lease.ID)}
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
              {leasesAwaitingSignature.length === 0 && (
                <tr>
                  <td colSpan={8} className="sa-table-empty">No leases awaiting signature</td>
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
    // Use new comprehensive analytics page if indicator data is available
    if (analyticsIndicators) {
      return (
        <AnalyticsPage 
          indicators={analyticsIndicators}
          yearlyComparison={yearlyComparison}
          monthlyComparison={monthlyComparison}
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
        <button className="sa-primary-cta" onClick={() => {
          loadAnalyticsData();
          loadNewAnalyticsData();
        }}>
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
              <AreaChart data={prepareTransferHistoryChartData}>
                <defs>
                  <linearGradient id="colorNetAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '8px 12px' }} formatter={(value) => `${value.toLocaleString()} FCFA`} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="line" />
                <Area type="monotone" dataKey="netAmount" stroke="#3b82f6" strokeWidth={3} fill="url(#colorNetAmount)" dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} name="Net Amount" />
                <Area type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={3} fill="url(#colorCommission)" dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} name="Commission" />
              </AreaChart>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis type="number" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis dataKey="building" type="category" width={150} stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '8px 12px' }} formatter={(value) => `${value.toLocaleString()} FCFA`} />
                <Bar dataKey="amount" fill="#3b82f6" name="Expenses" radius={[0, 4, 4, 0]} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="owner" angle={-45} textAnchor="end" height={100} stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '8px 12px' }} formatter={(value) => `${value.toLocaleString()} FCFA`} />
                <Bar dataKey="amount" fill="#10b981" name="Expenses" radius={[4, 4, 0, 0]} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '8px 12px' }} formatter={(value) => `${value.toLocaleString()} FCFA`} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="commission" fill="#f59e0b" name="Commission" radius={[4, 4, 0, 0]} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="tenant" angle={-45} textAnchor="end" height={100} stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '8px 12px' }} formatter={(value) => `${value.toLocaleString()} FCFA`} />
                <Bar dataKey="amount" fill="#ef4444" name="Unpaid Amount" radius={[4, 4, 0, 0]} />
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
              <AreaChart data={prepareInternalExpensesChartData}>
                <defs>
                  <linearGradient id="colorInternalExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '8px 12px' }} formatter={(value) => `${value.toLocaleString()} FCFA`} />
                <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorInternalExpenses)" dot={{ fill: '#8b5cf6', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} name="Internal Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '100px', color: '#9ca3af' }}>No internal expense data available</div>
          )}
        </div>
      </div>
    </div>
  );
  };

  // Render messaging/chat page
  const renderMessages = () => (
    <MessagingPanel
      chatUsers={chatUsers}
      selectedUserId={selectedUserId}
      chatMessages={chatMessages}
      chatInput={chatInput}
      setChatInput={setChatInput}
      loadChatForUser={loadChatForUser}
      handleSendMessage={handleSendMessage}
      messagesEndRef={messagesEndRef}
    />
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
    return <AdvertisementsList advertisements={advertisements} />;
  };

  // Combined Management page with tabs
  const renderManagement = () => {
    const managementTabs = [
      { id: 'contracts', label: 'LEASE AGREEMENTS TO SIGN' },
      { id: 'expenses-to-approve', label: 'EXPENSES TO APPROVE' },
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
          {managementSubTab === 'expenses-to-approve' && renderExpensesToApproveContent()}
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
                    {user.role !== 'superadmin' && user.Role !== 'superadmin' && String(user.id || user.ID) !== String(getCurrentUserId()) && (
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

      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0 }}>Quote History</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>{quoteRequests.length} total quote(s)</p>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
            <tr>
              <th>No</th>
              <th>Date</th>
              <th>Property</th>
              <th>Issue</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Validated By</th>
              <th>Approved By</th>
            </tr>
          </thead>
          <tbody>
            {quoteRequests.map((quote, index) => (
              <tr key={`quote-history-${quote.id || quote.ID || index}`}>
                  <td>{index + 1}</td>
                  <td>{quote.date || quote.Date ? new Date(quote.date || quote.Date).toLocaleDateString() : 'N/A'}</td>
                  <td>{quote.property || quote.Property || 'N/A'}</td>
                  <td>{quote.issue || quote.Issue || 'N/A'}</td>
                  <td>{(quote.amount || quote.Amount || 0).toLocaleString()} XOF</td>
                  <td>
                    <span className={`sa-status-pill ${(quote.status || quote.Status || 'pending').toLowerCase().replace(/_/g, '-')}`}>
                      {quote.status || quote.Status || 'Pending'}
                    </span>
                  </td>
                  <td>{quote.validatedBy || quote.ValidatedBy || '—'}</td>
                  <td>{quote.approvedBy || quote.ApprovedBy || '—'}</td>
                </tr>
              ))}
              {quoteRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="sa-table-empty">No quote history available yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
              <th>Actions</th>
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
                <td className="sa-row-actions">
                  <button
                    className="table-action-button edit"
                    onClick={() => handleApproveLease(lease.id || lease.ID)}
                  >
                    Approve
                  </button>
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

  // Render Expenses to Approve content
  const parseExpenseDocURLs = (expense) => {
    const urls = [];
    try { const arr = JSON.parse(expense.documentURLs || expense.DocumentURLs || '[]'); if (Array.isArray(arr)) urls.push(...arr); } catch {}
    const single = expense.documentUrl || expense.DocumentURL || expense.documentURL;
    if (single && !urls.includes(single)) urls.unshift(single);
    return urls.filter(Boolean);
  };

  const renderExpenseDetail = () => {
    const expense = selectedExpenseForDetail;
    if (!expense) return null;
    const docURLs = parseExpenseDocURLs(expense);
    const status = (expense.status || expense.Status || '').toLowerCase();
    const canAct = status === 'pending_director_approval' || status === 'pending';
    return (
      <div className="sa-section-card">
        <div className="sa-section-header" style={{ marginBottom: '20px' }}>
          <div>
            <h3>Expense Review</h3>
            <p>Review the expense details and attached documents before approving.</p>
          </div>
          <button type="button" className="sa-outline-button" onClick={() => setSelectedExpenseForDetail(null)}>
            <ArrowLeft size={16} />
            Back to list
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px', marginBottom: '24px' }}>
          <div>
            <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Building / Scope</label>
            <p style={{ margin: 0, color: '#1f2937' }}>{expense.building || expense.Building || expense.scope || expense.Scope || 'N/A'}</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Category</label>
            <p style={{ margin: 0, color: '#1f2937' }}>{expense.category || expense.Category || 'N/A'}</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Description</label>
            <p style={{ margin: 0, color: '#1f2937', whiteSpace: 'pre-wrap' }}>{expense.description || expense.Description || expense.notes || expense.Notes || 'N/A'}</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Amount</label>
            <p style={{ margin: 0, color: '#1f2937', fontWeight: 700 }}>{(expense.amount || expense.Amount || 0).toLocaleString()} XOF</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Date</label>
            <p style={{ margin: 0, color: '#1f2937' }}>{(expense.date || expense.Date) ? new Date(expense.date || expense.Date).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Requested by</label>
            <p style={{ margin: 0, color: '#1f2937' }}>{expense.requestedBy || expense.RequestedBy || '—'}</p>
          </div>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontWeight: 600, color: '#374151', marginBottom: '12px', display: 'block' }}>Documents</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {docURLs.map((url, i) => (
              <a key={`${url}-${i}`} href={url} target="_blank" rel="noreferrer"
                className="sa-outline-button"
                style={{ justifyContent: 'center', textDecoration: 'none' }}>
                Document {i + 1}
              </a>
            ))}
            {docURLs.length === 0 && <p style={{ margin: 0, color: '#6b7280' }}>No documents attached.</p>}
          </div>
        </div>
        {canAct && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              className="table-action-button edit"
              style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 600 }}
              disabled={loading}
              onClick={async () => { await handleApproveExpense(expense.id || expense.ID); setSelectedExpenseForDetail(null); }}
            >
              Approve
            </button>
            <button
              className="table-action-button delete"
              style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 600 }}
              disabled={loading}
              onClick={async () => { await handleRejectExpense(expense.id || expense.ID); setSelectedExpenseForDetail(null); }}
            >
              Reject
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderExpensesToApproveContent = () => {
    if (selectedExpenseForDetail) return renderExpenseDetail();
    return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ color: '#6b7280', margin: 0 }}>All pending expenses and maintenance requests must be validated before they move into the expenses list.</p>
      </div>
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Building</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Documents</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingExpenses.map((expense, index) => {
              const docURLs = parseExpenseDocURLs(expense);
              return (
                <tr key={`expense-${expense.id || expense.ID || index}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedExpenseForDetail(expense)}>
                  <td>{index + 1}</td>
                  <td>{expense.building || expense.Building || 'N/A'}</td>
                  <td>{expense.category || expense.Category || 'N/A'}</td>
                  <td className="sa-cell-main">
                    <span className="sa-cell-title">{expense.description || expense.Description || expense.notes || expense.Notes || 'N/A'}</span>
                  </td>
                  <td>{(expense.amount || expense.Amount || 0).toLocaleString()} XOF</td>
                  <td>{expense.date || expense.Date ? new Date(expense.date || expense.Date).toLocaleDateString() : 'N/A'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {docURLs.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {docURLs.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#2563eb', fontSize: '0.8rem', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                            Doc {i + 1}
                          </a>
                        ))}
                      </div>
                    ) : <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>None</span>}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="table-action-button edit"
                        onClick={() => handleApproveExpense(expense.id || expense.ID)}
                        disabled={loading}
                        style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}
                      >
                        Approve
                      </button>
                      <button
                        className="table-action-button delete"
                        onClick={() => handleRejectExpense(expense.id || expense.ID)}
                        disabled={loading}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {pendingExpenses.length === 0 && (
              <tr>
                <td colSpan={8} className="sa-table-empty">No pending expenses to approve</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '28px' }}>
        <div className="sa-section-header" style={{ marginBottom: '16px' }}>
          <h3>Approved &amp; Rejected Expenses</h3>
          <p>Expenses that have been validated or rejected by the director</p>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Building</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const decidedExpenses = dedupeRecords(allExpenses).filter(e => {
                  const s = (e.status || e.Status || '').toLowerCase();
                  return s === 'approved' || s === 'rejected';
                });
                return decidedExpenses.length > 0 ? decidedExpenses.map((expense, index) => {
                  const status = (expense.status || expense.Status || '').toLowerCase();
                  return (
                    <tr key={`decided-expense-${expense.id || expense.ID || index}`}>
                      <td>{index + 1}</td>
                      <td>{expense.building || expense.Building || 'N/A'}</td>
                      <td>{expense.category || expense.Category || 'N/A'}</td>
                      <td className="sa-cell-main">
                        <span className="sa-cell-title">{expense.description || expense.Description || expense.notes || expense.Notes || 'N/A'}</span>
                      </td>
                      <td>{(expense.amount || expense.Amount || 0).toLocaleString()} XOF</td>
                      <td>{expense.date || expense.Date ? new Date(expense.date || expense.Date).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${status === 'approved' ? 'approved' : 'rejected'}`}>
                          {status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={7} className="sa-table-empty">No approved or rejected expenses yet</td></tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  };

  const renderQuoteDetail = () => {
    const quote = selectedQuote;
    if (!quote) return null;

    const maintenance = quote.maintenance || quote.Maintenance || {};
    const documents = parseQuoteDocuments(quote);
    const maintenanceDocuments = Array.isArray(maintenance.Documents)
      ? maintenance.Documents
      : parseQuoteDocuments(maintenance);
    const displayDocuments = documents.length > 0 ? documents : maintenanceDocuments;
    const photosRaw = maintenance.Photos ?? maintenance.photos ?? [];
    const photos = Array.isArray(photosRaw)
      ? photosRaw
      : (typeof photosRaw === 'string' && photosRaw.trim()
        ? (() => { try { const parsed = JSON.parse(photosRaw); return Array.isArray(parsed) ? parsed : []; } catch (_) { return []; } })()
        : []);
    const status = normalizeText(quote.status || quote.Status || '');
    const canApprove = status !== 'approved' && status !== 'rejected';
    const problem = quote.problem || quote.Problem || quote.issue || quote.Issue || 'N/A';

    return (
      <div className="sa-section-card">
        <div className="sa-section-header" style={{ marginBottom: '20px' }}>
          <div>
            <h3>Quote Review</h3>
            <p>Review property, tenant, problem, images and documents before approving.</p>
          </div>
          <button
            type="button"
            className="sa-outline-button"
            onClick={() => setSelectedQuote(null)}
          >
            <ArrowLeft size={16} />
            Back to list
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px', marginBottom: '24px' }}>
          <div>
            <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Property / Apartment</label>
            <p style={{ margin: 0, color: '#1f2937' }}>{getQuotePropertyDisplay(quote)}</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Tenant</label>
            <p style={{ margin: 0, color: '#1f2937' }}>{getQuoteTenantDisplay(quote)}</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Problem</label>
            <p style={{ margin: 0, color: '#1f2937', whiteSpace: 'pre-wrap' }}>{problem}</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Cost of Repairs</label>
            <p style={{ margin: 0, color: '#1f2937' }}>{(quote.amount || quote.Amount || 0).toLocaleString()} XOF</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Status</label>
            <span className={`sa-status-pill ${status || 'pending'}`}>{quote.status || quote.Status || 'Pending'}</span>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Validated By</label>
            <p style={{ margin: 0, color: '#1f2937' }}>{quote.validatedBy || quote.ValidatedBy || '—'}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {displayDocuments.map((doc, index) => {
              const url = typeof doc === 'string' ? doc : (doc?.url || doc?.URL || doc?.path || '');
              if (!url) return null;
              return (
              <a
                key={`${doc?.name || 'document'}-${index}`}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="sa-outline-button"
                style={{ justifyContent: 'center', textDecoration: 'none' }}
              >
                {doc?.name || `Document ${index + 1}`}
              </a>
            );
          })}
          {displayDocuments.length === 0 && (
            <p style={{ margin: 0, color: '#6b7280' }}>No downloadable documents attached.</p>
          )}
        </div>

        {photos.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 12px', color: '#111827' }}>Images ({photos.length})</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
              {photos.map((photoUrl, index) => {
                const url = typeof photoUrl === 'string' ? photoUrl : (photoUrl?.url || photoUrl?.src || '');
                if (!url) return null;
                return (
                  <div key={`${url}-${index}`} style={{ borderRadius: '12px', overflow: 'hidden', background: '#f3f4f6', minHeight: '150px' }}>
                    <img
                      src={url}
                      alt={`Maintenance ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => window.open(url, '_blank')}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {canApprove && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="table-action-button edit"
              onClick={async () => {
                try {
                  await handleApproveQuote(quote.id || quote.ID);
                  setSelectedQuote(null);
                } catch (_) {
                  // handled by handler
                }
              }}
              disabled={loading}
              style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}
            >
              Approve
            </button>
            <button
              className="table-action-button delete"
              onClick={async () => {
                try {
                  await handleRejectQuote(quote.id || quote.ID);
                  setSelectedQuote(null);
                } catch (_) {
                  // handled by handler
                }
              }}
              disabled={loading}
            >
              Reject
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render Quotes to Validate content
  const renderQuotesToValidateContent = () => {
    if (selectedQuote) {
      return renderQuoteDetail();
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>{pendingQuotes.length} pending quotes found</p>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Property / Apartment</th>
                <th>Tenant</th>
                <th>Issue</th>
                <th>Cost</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingQuotes.map((quote, index) => (
                <tr
                  key={`quote-${quote.id || quote.ID || index}`}
                  className="clickable-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedQuote(quote)}
                >
                  <td>{index + 1}</td>
                  <td>{getQuotePropertyDisplay(quote)}</td>
                  <td>{getQuoteTenantDisplay(quote)}</td>
                  <td className="sa-cell-main">
                    <span className="sa-cell-title">{quote.problem || quote.Problem || quote.issue || quote.Issue || 'N/A'}</span>
                  </td>
                  <td>{(quote.amount || quote.Amount || 0).toLocaleString()} XOF</td>
                  <td>
                    {quote.date || quote.Date
                      ? new Date(quote.date || quote.Date).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <span className={`sa-status-pill ${(quote.status || quote.Status || 'pending').toLowerCase().replace(/_/g, '-')}`}>
                      {quote.status || quote.Status || 'Pending'}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
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
  };

  const renderSubscription = () => {
    return (
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
              <label>Amount</label>
              <input
                type="text"
                value={
                  subscriptionInfo?.subscriptionFee
                    ? `${Math.round(subscriptionType === 'annual' ? (subscriptionInfo.subscriptionFee * 12) : subscriptionInfo.subscriptionFee).toLocaleString()} ${subscriptionInfo.subscriptionCurrency || 'XOF'}`
                    : 'Not set'
                }
                readOnly
              />
            </div>
            <div className="sa-form-group">
              <label>Mobile Money Provider *</label>
                <select
                  value={subscriptionForm.provider}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, provider: e.target.value })}
                  required
                >
                <option value="wave">Wave</option>
                <option value="om">Orange Money</option>
                </select>
            </div>
            <div className="sa-form-group">
              <label>Phone Number *</label>
              <input
                type="text"
                value={subscriptionForm.phone}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, phone: e.target.value })}
                required
                placeholder="e.g., 2376XXXXXXX"
              />
            </div>
            {subscriptionForm.provider === 'om' && (
              <div className="sa-form-group">
                <label>OTP Code (Orange Money)</label>
                <input
                  type="text"
                  value={subscriptionForm.otp}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, otp: e.target.value })}
                  placeholder="Enter OTP if required"
                />
              </div>
            )}
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
  };

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
                  <td>{getOwnerPropertyStats(owner, properties).propertiesCount || owner.propertiesCount || owner.PropertiesCount || 0}</td>
                  <td>{getOwnerPropertyStats(owner, properties).contractsCount || owner.contractsCount || owner.ContractsCount || 0}</td>
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
        brand={{ name: 'SAAF IMMO', caption: 'Agency Director', logo: 'SAAF', logoImage: `/download.jpeg` }}
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
              <option value="technician">Technician</option>
              <option value="accounting">Accounting</option>
              <option value="admin">Admin</option>
              <option value="salesmanager">Sales Manager</option>
              <option value="agency_director">Agency Director</option>
            </select>
            <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
              Company will be automatically set from your account.
              To add a landlord/owner, use the Owners page in Contracts.
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

          <div className="sa-form-group" style={{ marginTop: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ margin: 0, fontWeight: 600 }}>Documents</label>
              <button type="button" onClick={handleAddDocument} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>
                + Add Document
              </button>
            </div>
            <small style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '12px', display: 'block' }}>Add any documents (ID, contract, etc.)</small>
            {userForm.documents.map((doc, index) => (
              <div key={index} style={{ marginBottom: '12px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Document name"
                  value={doc.name || ''}
                  onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
                  style={{ flex: 1, minWidth: '120px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
                <input
                  type="file"
                  onChange={(e) => handleDocumentChange(index, 'file', e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  style={{ flex: 1, minWidth: '140px', fontSize: '12px' }}
                />
                {doc.url && !doc.file && (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6' }}>View</a>
                )}
                <button type="button" onClick={() => handleRemoveDocument(index)} style={{ padding: '8px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  Remove
                </button>
              </div>
            ))}
          </div>

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
      <Modal isOpen={showOwnerModal} onClose={() => setShowOwnerModal(false)} title={editingOwner ? 'Edit Owner' : 'Add Owner'} size="lg">
        <form onSubmit={handleSubmitOwner} className="sa-form" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="sa-form-group">
            <label>Name *</label>
            <input type="text" value={ownerForm.name} onChange={(e) => setOwnerForm({...ownerForm, name: e.target.value})} required />
          </div>
          <div className="sa-form-group">
            <label>Email *</label>
            <input type="email" value={ownerForm.email} onChange={(e) => setOwnerForm({...ownerForm, email: e.target.value})} required />
          </div>
          <div className="sa-form-group">
            <label>Phone</label>
            <input type="text" value={ownerForm.phone} onChange={(e) => setOwnerForm({...ownerForm, phone: e.target.value})} placeholder="Optional" />
          </div>
          <div className="sa-form-group">
            <label>Password {!editingOwner ? '*' : ''}</label>
            <input type="password" value={ownerForm.password} onChange={(e) => setOwnerForm({...ownerForm, password: e.target.value})} required={!editingOwner} placeholder={editingOwner ? 'Leave blank to keep current password' : ''} />
          </div>

          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
          <h4 style={{ marginBottom: '16px', fontSize: '1rem' }}>Documents</h4>

          <div className="sa-form-group">
            <label>Real estate management mandate (rental) <span style={{ color: '#6b7280', fontWeight: 'normal' }}>PDF</span></label>
            <input type="file" accept=".pdf" onChange={(e) => handleOwnerFileChange('rentalMandate', e)} />
            {(ownerDocumentPreviews.rentalMandate || ownerForm.rentalMandate) && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#059669' }}>{ownerForm.rentalMandate?.name || 'File selected'}</div>
            )}
          </div>
          <div className="sa-form-group">
            <label>Sales mandate <span style={{ color: '#6b7280', fontWeight: 'normal' }}>PDF</span></label>
            <input type="file" accept=".pdf" onChange={(e) => handleOwnerFileChange('salesMandate', e)} />
            {(ownerDocumentPreviews.salesMandate || ownerForm.salesMandate) && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#059669' }}>{ownerForm.salesMandate?.name || 'File selected'}</div>
            )}
          </div>
          <div className="sa-form-group">
            <label>Copy of owner&apos;s ID <span style={{ color: '#6b7280', fontWeight: 'normal' }}>PNG or JPG</span></label>
            <input type="file" accept=".png,.jpg,.jpeg" onChange={(e) => handleOwnerFileChange('idCopy', e)} />
            {(ownerDocumentPreviews.idCopy || ownerForm.idCopy) && (
              <div style={{ marginTop: '8px' }}>
                {typeof ownerDocumentPreviews.idCopy === 'string' && ownerDocumentPreviews.idCopy.startsWith('data:') ? (
                  <img src={ownerDocumentPreviews.idCopy} alt="ID preview" style={{ maxWidth: '150px', maxHeight: '100px', borderRadius: '4px', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '0.85rem', color: '#059669' }}>{ownerForm.idCopy?.name || 'File selected'}</span>
                )}
              </div>
            )}
          </div>
          <div className="sa-form-group">
            <label>RIB of the owner <span style={{ color: '#6b7280', fontWeight: 'normal' }}>Text</span></label>
            <input type="text" value={ownerForm.rib} onChange={(e) => setOwnerForm({...ownerForm, rib: e.target.value})} placeholder="Enter RIB" />
          </div>
          <div className="sa-form-group">
            <label>Copy land title or ACD <span style={{ color: '#6b7280', fontWeight: 'normal' }}>PDF or image</span></label>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleOwnerFileChange('landTitle', e)} />
            {(ownerDocumentPreviews.landTitle || ownerForm.landTitle) && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#059669' }}>{ownerForm.landTitle?.name || 'File selected'}</div>
            )}
          </div>
          <div className="sa-form-group">
            <label>Photos of the property <span style={{ color: '#6b7280', fontWeight: 'normal' }}>PNG or JPG</span></label>
            <input type="file" accept=".png,.jpg,.jpeg" multiple onChange={(e) => handleOwnerFileChange('propertyPhotos', e, true)} />
            {ownerForm.propertyPhotos?.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#059669' }}>{ownerForm.propertyPhotos.length} file(s) selected</div>
            )}
          </div>
          <div className="sa-form-group">
            <label>Commission percentage (agency type) <span style={{ color: '#6b7280', fontWeight: 'normal' }}>%</span></label>
            <input type="number" value={ownerForm.commissionPercentage} onChange={(e) => setOwnerForm({...ownerForm, commissionPercentage: e.target.value})} placeholder="0" min="0" max="100" step="0.01" />
            <span style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px', display: 'block' }}>Percentage deducted from tenant payments and credited to agency balance</span>
          </div>

          <div className="sa-form-actions">
            <button type="button" className="sa-outline-button" onClick={() => { setShowOwnerModal(false); setOwnerForm(getEmptyOwnerForm()); setOwnerDocumentPreviews({}); setEditingOwner(null); }}>Cancel</button>
            <button type="submit" className="sa-primary-cta" disabled={loading}>
              {loading ? 'Saving...' : (editingOwner ? 'Update' : 'Create') + ' Owner'}
            </button>
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
