import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TrendingUp, Users, AlertTriangle, Building, Calendar, ClipboardList, UserPlus, Upload, X, FileText, Filter, Search, Plus, MessageCircle, Settings, Megaphone, FileSpreadsheet, Copy, Check, Download, ArrowLeft, Mail, Phone, MapPin, DollarSign, Wrench, FileCheck, StickyNote, Receipt, MessageSquare, AlertCircle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Modal from '../components/Modal';
import DocumentUpload from '../components/DocumentUpload';
import ContractUpload from '../components/ContractUpload';
import { salesManagerService } from '../services/salesManagerService';
import { messagingService } from '../services/messagingService';
import { cloudinaryService, validateFileType, validateFileSize } from '../services/cloudinaryService';
import { API_CONFIG } from '../config/api';
import { isDemoMode, getSalesManagerDemoData, getCommercialDemoData } from '../utils/demoData';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import { t, getLanguage } from '../utils/i18n';
import '../components/RoleLayout.css';
import './SalesManagerDashboard.css';

// Password Display Component
const PasswordDisplayItem = ({ email, password }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
            Email
          </label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.9rem' }}>{email}</span>
            <button
              onClick={() => copyToClipboard(email, 'email')}
              style={{
                padding: '4px 8px',
                background: copied === 'email' ? '#10b981' : '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: copied === 'email' ? 'white' : '#374151',
                transition: 'all 0.2s'
              }}
              title="Copy email"
            >
              {copied === 'email' ? <Check size={14} /> : <Copy size={14} />}
              {copied === 'email' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
            Password
          </label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: '#fef3c7',
            borderRadius: '6px',
            border: '1px solid #fbbf24'
          }}>
            <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 600, color: '#92400e' }}>
              {password}
            </span>
            <button
              onClick={() => copyToClipboard(password, 'password')}
              style={{
                padding: '4px 8px',
                background: copied === 'password' ? '#10b981' : '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: copied === 'password' ? 'white' : '#374151',
                transition: 'all 0.2s'
              }}
              title="Copy password"
            >
              {copied === 'password' ? <Check size={14} /> : <Copy size={14} />}
              {copied === 'password' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SalesManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showTenantCreationModal, setShowTenantCreationModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [importMode, setImportMode] = useState('manual'); // 'manual' or 'excel'
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState(null); // { type: 'single' | 'bulk', user: {...} | users: [...] }
  const [selectedApprovedClientId, setSelectedApprovedClientId] = useState('');
  const [moveInFormPropertyRent, setMoveInFormPropertyRent] = useState(0);
  const [approvedClientDocuments, setApprovedClientDocuments] = useState([]);
  const [approvedClientChecklist, setApprovedClientChecklist] = useState(null);
  const [loadingApprovedDocs, setLoadingApprovedDocs] = useState(false);

  // Visits / Requests (schedule visit from Property Management uses properties)
  const [showScheduleVisitModal, setShowScheduleVisitModal] = useState(false);
  const [showUpdateVisitStatusModal, setShowUpdateVisitStatusModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [visitProperty, setVisitProperty] = useState('');
  const [visits, setVisits] = useState({ upcoming: [], done: [], all: [] });
  const [requests, setRequests] = useState([]);
  const [visitStatusFilter, setVisitStatusFilter] = useState('');
  const [visitTab, setVisitTab] = useState('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState('');
  
  // API Data States
  const [overviewData, setOverviewData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [approvedClients, setApprovedClients] = useState([]);
  const [waitingListClients, setWaitingListClients] = useState([]);
  const [unpaidRents, setUnpaidRents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [owners, setOwners] = useState([]); // Owners (landlords) for property assignment
  const [salesProperties, setSalesProperties] = useState([]); // Properties that are strictly for sale
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const carouselIntervalRef = useRef(null);

  const selectedApprovedClient = useMemo(() => {
    if (!selectedApprovedClientId) return null;
    return approvedClients.find(client => String(client.ID || client.id) === String(selectedApprovedClientId)) || null;
  }, [approvedClients, selectedApprovedClientId]);

  const addMonths = useCallback((date, months) => {
    const base = new Date(date);
    const day = base.getDate();
    base.setMonth(base.getMonth() + months);
    if (base.getDate() < day) {
      base.setDate(0);
    }
    return base;
  }, []);

  const approvedClientDepositInfo = useMemo(() => {
    if (!selectedApprovedClient) return { paid: false, paidAt: null, maxMoveInDate: '' };
    const paid = Boolean(
      selectedApprovedClient.SecurityDepositPaid ||
      selectedApprovedClient.securityDepositPaid
    );
    const paidAtRaw =
      selectedApprovedClient.SecurityDepositPaidAt ||
      selectedApprovedClient.securityDepositPaidAt ||
      selectedApprovedClient.SecurityDepositDate ||
      selectedApprovedClient.securityDepositDate ||
      selectedApprovedClient.DepositPaidAt ||
      selectedApprovedClient.depositPaidAt ||
      selectedApprovedClient.DepositDate ||
      selectedApprovedClient.depositDate ||
      null;
    const paidAt = paidAtRaw ? new Date(paidAtRaw) : null;
    const maxMoveInDate = paidAt ? addMonths(paidAt, 1).toISOString().split('T')[0] : '';
    return { paid, paidAt, maxMoveInDate };
  }, [selectedApprovedClient, addMonths]);

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
  const [loading, setLoading] = useState(false);
  
  // Property form state
  const [selectedPropertyType, setSelectedPropertyType] = useState('');
  
  // Filter states
  const [clientStatusFilter, setClientStatusFilter] = useState('');
  const [clientPropertyFilter, setClientPropertyFilter] = useState('');
  const [clientSearchText, setClientSearchText] = useState('');
  const [propertyStatusFilter, setPropertyStatusFilter] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('');
  const [propertyUrgencyFilter, setPropertyUrgencyFilter] = useState('');
  const [alertTypeFilter, setAlertTypeFilter] = useState('');
  const [salesTypeFilter, setSalesTypeFilter] = useState(''); // Filter for sales properties by type

  // Occupancy page: detail view when user clicks a property (building/apartment)
  const [occupancyDetailView, setOccupancyDetailView] = useState('list'); // 'list' | 'detail'
  const [occupancySelectedProperty, setOccupancySelectedProperty] = useState(null);
  const [occupancyDetailData, setOccupancyDetailData] = useState(null);
  const [occupancyDetailLoading, setOccupancyDetailLoading] = useState(false);
  
  // Tenant detail view (when a tenant row is clicked)
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [tenantDetail, setTenantDetail] = useState(null);
  const [tenantDetailLoading, setTenantDetailLoading] = useState(false);
  const [privateNoteInput, setPrivateNoteInput] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [maintenanceDetail, setMaintenanceDetail] = useState(null);
  const [maintenanceDetailLoading, setMaintenanceDetailLoading] = useState(false);
  
  // Edit states
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  // Tenant current unit assignment (auto-loaded when Edit Tenant modal opens); null = not assigned or loading
  const [tenantAssignment, setTenantAssignment] = useState(null); // { propertyId, unitId, buildingName, unitNumber } | null
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [removeFromUnitLoading, setRemoveFromUnitLoading] = useState(false);
  const [showUnpaidRentModal, setShowUnpaidRentModal] = useState(false);
  const [editingUnpaidRent, setEditingUnpaidRent] = useState(null);
  
  // Property states
  const [showCreatePropertyModal, setShowCreatePropertyModal] = useState(false);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [expandedOwnerId, setExpandedOwnerId] = useState(null); // For property management owner expansion
  // Property Management sub-views: owner list -> owner assets (renting/selling) -> building payment
  const [pmView, setPmView] = useState('list'); // 'list' | 'owner-detail' | 'building-detail' | 'villa-detail' | 'land-detail'
  const [pmOwnerId, setPmOwnerId] = useState(null);
  const [pmOwnerName, setPmOwnerName] = useState('');
  const [ownerAssets, setOwnerAssets] = useState(null); // { ownerName, assets: [] }
  const [pmPropertyId, setPmPropertyId] = useState(null);
  const [pmBuildingName, setPmBuildingName] = useState('');
  const [buildingDetail, setBuildingDetail] = useState(null); // { buildingName, units: [], totalApartments, images }
  const [propertyManagementSearch, setPropertyManagementSearch] = useState('');
  const [showAddBuildingModal, setShowAddBuildingModal] = useState(false);
  const [showAddVillaModal, setShowAddVillaModal] = useState(false);
  const [showAddLandModal, setShowAddLandModal] = useState(false);
  const [showAddApartmentModal, setShowAddApartmentModal] = useState(false);
  const [showEditApartmentModal, setShowEditApartmentModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null); // unit from buildingDetail.units (id, unitNumber, type, tenant, rentPrice, etc.)
  const [editApartmentStatusChoice, setEditApartmentStatusChoice] = useState('Vacant'); // for showing/hiding tenant + enter date in Edit Apartment modal
  const [landDetail, setLandDetail] = useState(null); // for land-detail view
  const [pmAddFormImages, setPmAddFormImages] = useState([]); // images for Add Building / Add Land
  const [addApartmentPictures, setAddApartmentPictures] = useState([]); // multiple photos for Add Apartment
  const [editApartmentPictures, setEditApartmentPictures] = useState([]); // multiple photos for Edit Apartment
  const [showViewApartmentModal, setShowViewApartmentModal] = useState(false);
  const [viewingUnit, setViewingUnit] = useState(null); // unit row for View Apartment modal
  const [pmLoading, setPmLoading] = useState(false); // Loading owner assets or building detail
  const [showPropertyBuildingType, setShowPropertyBuildingType] = useState(false); // For property form: show building type when type is Apartment
  const [createPropertyImages, setCreatePropertyImages] = useState([]); // URLs for new property images (Cloudinary)
  const [createPropertyNumberOfUnits, setCreatePropertyNumberOfUnits] = useState(1);
  const [createPropertyUnits, setCreatePropertyUnits] = useState([{ unitNumber: '1', rent: '', bedrooms: 1, bathrooms: 1, status: 'Vacant', tenant: '' }]);
  const [editPropertyUnits, setEditPropertyUnits] = useState([]);
  const [editPropertyNumberOfUnits, setEditPropertyNumberOfUnits] = useState(1);
  const [editPropertyImages, setEditPropertyImages] = useState([]); // URLs for edit property images (Cloudinary)
  const [uploadingImage, setUploadingImage] = useState(false); // Loading state for image upload
  const [selectedPropertyDetail, setSelectedPropertyDetail] = useState(null); // Property shown in detail modal
  const [expandedImageUrl, setExpandedImageUrl] = useState(null); // Full-size image overlay (lightbox)
  
  // Bulk import (properties + tenants)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportTab, setBulkImportTab] = useState('properties'); // 'properties' | 'tenants'
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);

  // Messaging states
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const isLoadingUsersRef = useRef(false);
  const messagesEndRef = useRef(null);

  // Reset create property unit form when opening create modal
  useEffect(() => {
    if (showCreatePropertyModal) {
      setCreatePropertyNumberOfUnits(1);
      setCreatePropertyUnits([{ unitNumber: '1', rent: '', bedrooms: 1, bathrooms: 1, status: 'Vacant', tenant: '' }]);
    }
  }, [showCreatePropertyModal]);

  // When Edit Tenant modal opens, find which unit this tenant is assigned to (by name)
  useEffect(() => {
    if (!showEditClientModal || !editingClient || !owners?.length) {
      setTenantAssignment(null);
      setLoadingAssignment(false);
      return;
    }
    const tenantName = (editingClient.Name || editingClient.name || '').trim().toLowerCase();
    if (!tenantName) {
      setTenantAssignment(null);
      setLoadingAssignment(false);
      return;
    }
    let cancelled = false;
    setLoadingAssignment(true);
    setTenantAssignment(null);
    (async () => {
      for (const owner of owners) {
        if (cancelled) return;
        try {
          const data = await salesManagerService.getOwnerAssets(owner.id ?? owner.ID);
          const list = Array.isArray(data) ? data : (data.assets || data.properties || []);
          const buildings = list.filter((p) => ['building', 'villa'].includes((p.type ?? p.Type ?? '').toString().toLowerCase()));
          for (const asset of buildings) {
            if (cancelled) return;
            const propId = asset.id ?? asset.ID;
            if (!propId) continue;
            const detail = await salesManagerService.getPropertyBuildingDetail(propId);
            const units = detail.units || [];
            const match = units.find((u) => (u.tenant || '').trim().toLowerCase() === tenantName);
            if (match) {
              if (!cancelled) setTenantAssignment({ propertyId: propId, unitId: match.id, buildingName: detail.buildingName || asset.name || asset.Address || 'Building', unitNumber: match.unitNumber || match.name || '—' });
              return;
            }
          }
        } catch (_) {
          // continue next owner
        }
      }
      if (!cancelled) setTenantAssignment(null);
    })().finally(() => { if (!cancelled) setLoadingAssignment(false); });
    return () => { cancelled = true; };
  }, [showEditClientModal, editingClient, owners]);

  const setCreatePropertyUnitsCount = useCallback((n) => {
    const num = Math.max(1, parseInt(n, 10) || 1);
    setCreatePropertyNumberOfUnits(num);
    setCreatePropertyUnits(prev => {
      const next = [];
      for (let i = 0; i < num; i++) {
        if (i < prev.length) {
          next.push({ ...prev[i], unitNumber: prev[i].unitNumber || String(i + 1) });
        } else {
          next.push({ unitNumber: String(i + 1), rent: '', bedrooms: 1, bathrooms: 1, status: 'Vacant', tenant: '' });
        }
      }
      return next;
    });
  }, []);

  const updateCreatePropertyUnit = useCallback((index, field, value) => {
    setCreatePropertyUnits(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u));
  }, []);

  const addNotification = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const openEditPropertyModal = useCallback(async (property) => {
    const id = property?.id ?? property?.ID;
    if (!id) return;
    try {
      const full = await salesManagerService.getProperty(id);
      setEditingProperty(full);
      setShowPropertyBuildingType((full.type || full.Type) === 'Apartment');
      setSelectedPropertyType(full.propertyType || full.PropertyType || '');
      setEditPropertyImages(parsePropertyImages(full.images || full.Images));
      const units = (full.units || []).map(u => ({
        unitNumber: u.unitNumber || u.UnitNumber || '',
        rent: u.rent ?? u.Rent ?? '',
        bedrooms: u.bedrooms ?? u.Bedrooms ?? 1,
        bathrooms: u.bathrooms ?? u.Bathrooms ?? 1,
        status: u.status || u.Status || 'Vacant',
        tenant: u.tenant ?? (u.Tenant != null ? u.Tenant : ''),
      }));
      setEditPropertyUnits(units.length ? units : [{ unitNumber: '1', rent: full.rent ?? '', bedrooms: full.bedrooms ?? 0, bathrooms: full.bathrooms ?? 1, status: 'Vacant', tenant: '' }]);
      setEditPropertyNumberOfUnits(units.length || 1);
      setShowEditPropertyModal(true);
    } catch (err) {
      console.error('Failed to load property for edit:', err);
      addNotification('Failed to load property details', 'error');
    }
  }, [addNotification]);

  const updateEditPropertyUnit = useCallback((index, field, value) => {
    setEditPropertyUnits(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u));
  }, []);

  const setEditPropertyUnitsCount = useCallback((n) => {
    const num = Math.max(1, parseInt(n, 10) || 1);
    setEditPropertyNumberOfUnits(num);
    setEditPropertyUnits(prev => {
      const next = [];
      for (let i = 0; i < num; i++) {
        if (i < prev.length) next.push({ ...prev[i], unitNumber: prev[i].unitNumber || String(i + 1) });
        else next.push({ unitNumber: String(i + 1), rent: '', bedrooms: 1, bathrooms: 1, status: 'Vacant', tenant: '' });
      }
      return next;
    });
  }, []);

  // Load data from API
  const loadData = async () => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        // Use demo data
        const demoData = getSalesManagerDemoData();
        setOverviewData(demoData.overview);
        setProperties(demoData.properties);
        setClients(demoData.clients);
        setApprovedClients([]);
        setWaitingListClients(demoData.waitingListClients);
        setUnpaidRents(demoData.unpaidRents);
        setAlerts(demoData.alerts);
        setOwners(demoData.owners);
        setSalesProperties(demoData.salesProperties || []);
        setLoading(false);
        return;
      }
      
      const [overview, propertiesData, clientsData, approvedClientsData, waitingListData, unpaidRentsData, alertsData, ownersData, salesPropsData] = await Promise.all([
        salesManagerService.getOverview(),
        salesManagerService.getProperties({
          status: propertyStatusFilter || undefined,
          type: propertyTypeFilter || undefined,
          urgency: propertyUrgencyFilter || undefined,
        }),
        salesManagerService.getClients(),
        salesManagerService.getApprovedClients().catch(() => []),
        salesManagerService.getWaitingListClients().catch(() => []),
        salesManagerService.getUnpaidRents().catch(() => []),
        salesManagerService.getAlerts(alertTypeFilter || null),
        salesManagerService.getOwners().catch(() => []),
        salesManagerService.getSalesProperties().catch(() => []),
      ]);

      console.log('Loaded data:', { overview, propertiesData, clientsData, approvedClientsData, waitingListData, unpaidRentsData, alertsData, ownersData, salesPropsData });

      const normalizedProperties = Array.isArray(propertiesData) ? propertiesData : [];
      const normalizedSalesProps = Array.isArray(salesPropsData) ? salesPropsData : [];

      // Properties added in this dashboard and marked as "For Sale"
      const salePropertiesFromManaged = normalizedProperties.filter(p => {
        const propType = (p.PropertyType || p.propertyType || '').toLowerCase();
        return propType === 'for sale';
      });

      // Combine managed sale properties with backend sales listings
      const combinedSalesProps = [...salePropertiesFromManaged, ...normalizedSalesProps];

      setOverviewData(overview);
      setProperties(normalizedProperties);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setApprovedClients(Array.isArray(approvedClientsData) ? approvedClientsData : []);
      setWaitingListClients(Array.isArray(waitingListData) ? waitingListData : []);
      setUnpaidRents(Array.isArray(unpaidRentsData) ? unpaidRentsData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setOwners(Array.isArray(ownersData) ? ownersData : []);
      setSalesProperties(combinedSalesProps);
    } catch (error) {
      console.error('Failed to load data:', error);
      if (!isDemoMode()) {
        addNotification('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load advertisements
  const loadAdvertisements = async () => {
    try {
      const ads = await salesManagerService.getAdvertisements();
      setAdvertisements(Array.isArray(ads) ? ads : []);
    } catch (error) {
      console.error('Failed to load advertisements:', error);
      addNotification('Failed to load advertisements', 'error');
      setAdvertisements([]);
    }
  };

  // Load visits and requests (for Visits and Requests tabs)
  const loadListingsData = useCallback(async () => {
    try {
      if (isDemoMode()) {
        const demoData = getCommercialDemoData();
        setVisits(demoData.visits || { upcoming: [], done: [], all: [] });
        setRequests(demoData.requests || []);
        return;
      }
      const [visitsData, requestsData] = await Promise.all([
        salesManagerService.listVisits({ status: visitStatusFilter || undefined }).catch(() => ({ upcoming: [], done: [], all: [] })),
        salesManagerService.listRequests({ status: requestStatusFilter || undefined }).catch(() => []),
      ]);
      if (Array.isArray(visitsData)) {
        setVisits({ upcoming: [], done: [], all: visitsData });
      } else if (visitsData && typeof visitsData === 'object') {
        setVisits({
          upcoming: Array.isArray(visitsData.upcoming) ? visitsData.upcoming : [],
          done: Array.isArray(visitsData.done) ? visitsData.done : [],
          all: Array.isArray(visitsData.all) ? visitsData.all : [],
        });
      } else {
        setVisits({ upcoming: [], done: [], all: [] });
      }
      setRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (error) {
      console.error('Failed to load visits/requests:', error);
      addNotification('Failed to load data', 'error');
    }
  }, [visitStatusFilter, requestStatusFilter]);

  // Reload data when filters change
  useEffect(() => {
    loadData();
  }, [propertyStatusFilter, propertyTypeFilter, propertyUrgencyFilter, alertTypeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedApprovedClientId) {
      setApprovedClientDocuments([]);
      setApprovedClientChecklist(null);
      setMoveInFormPropertyRent(0);
      return;
    }
    const loadApprovedClientDocs = async () => {
      try {
        setLoadingApprovedDocs(true);
        const [docs, checklist] = await Promise.all([
          salesManagerService.getApprovedClientDocuments(selectedApprovedClientId).catch(() => []),
          salesManagerService.getApprovedClientChecklist(selectedApprovedClientId).catch(() => null),
        ]);
        setApprovedClientDocuments(Array.isArray(docs) ? docs : []);
        setApprovedClientChecklist(checklist || null);
      } catch (error) {
        console.error('Failed to load approved client documents:', error);
        addNotification('Failed to load client documents', 'error');
        setApprovedClientDocuments([]);
        setApprovedClientChecklist(null);
      } finally {
        setLoadingApprovedDocs(false);
      }
    };
    loadApprovedClientDocs();
  }, [selectedApprovedClientId, addNotification]);

  // Fetch full tenant details when a tenant is selected for detail view
  useEffect(() => {
    if (!selectedTenantId) {
      setTenantDetail(null);
      return;
    }
    let cancelled = false;
    const loadTenantDetail = async () => {
      setTenantDetailLoading(true);
      setTenantDetail(null);
      try {
        const data = await salesManagerService.getClient(selectedTenantId);
        if (!cancelled) setTenantDetail(data);
      } catch (err) {
        console.error('Failed to load tenant details:', err);
        if (!cancelled) addNotification(err?.message || 'Failed to load tenant details', 'error');
      } finally {
        if (!cancelled) setTenantDetailLoading(false);
      }
    };
    loadTenantDetail();
    return () => { cancelled = true; };
  }, [selectedTenantId]);

  // Load advertisements when advertisements or overview tab is active
  useEffect(() => {
    if (activeTab === 'advertisements' || activeTab === 'overview') {
      loadAdvertisements();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load visits/requests when on those tabs
  useEffect(() => {
    if (activeTab === 'visits' || activeTab === 'requests') {
      loadListingsData();
    }
  }, [activeTab, loadListingsData]);


  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    if (chatMessages.length > 0) {
      scrollToBottom();
    }
  }, [chatMessages, scrollToBottom]);

  // Load chat for a specific user
  const loadChatForUser = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      setSelectedUserId(userId);
      const messages = await messagingService.getConversation(userId);
      
      // Normalize messages array
      const normalizedMessages = Array.isArray(messages) ? messages : [];
      setChatMessages(normalizedMessages);
      
      // Mark messages as read
      try {
        await messagingService.markMessagesAsRead(userId);
      } catch (readError) {
        console.error('Error marking messages as read:', readError);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      
      // Handle company restriction error specifically
      if (error.message && error.message.includes('own company')) {
        addNotification('Cannot view conversations with users from different companies', 'warning');
        // Remove the user from the list if they're from a different company
        setChatUsers(prev => prev.filter(u => String(u.userId) !== String(userId)));
        setSelectedUserId(null);
        setChatMessages([]);
      } else {
        addNotification(`Failed to load conversation: ${error.message || 'Unknown error'}`, 'error');
        setChatMessages([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // addNotification is stable, no need to include

  // Load users for messaging (from same company)
  const loadUsers = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingUsersRef.current) {
      console.log('Users already loading, skipping...');
      return;
    }

    try {
      isLoadingUsersRef.current = true;
      console.log('Loading users for messaging...');
      // Use the new getUsers endpoint
      const users = await messagingService.getUsers();
      console.log('Users API response:', users);
      
      // Handle different response formats
      let usersArray = [];
      if (Array.isArray(users)) {
        usersArray = users;
      } else if (users && Array.isArray(users.users)) {
        usersArray = users.users;
      } else if (users && typeof users === 'object') {
        // Try to find array in response
        usersArray = Object.values(users).find(val => Array.isArray(val)) || [];
      }
      
      console.log('Processed users array:', usersArray);
      
      // Get current user ID and company to exclude from list and filter by company
      const storedUser = localStorage.getItem('user');
      let currentUserId = null;
      let currentUserCompany = null;
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          currentUserId = user.id || user.ID;
          currentUserCompany = user.company || user.Company;
          console.log('Current user ID:', currentUserId);
          console.log('Current user company:', currentUserCompany);
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
      
      // Map users to chat format and exclude current user
      // Also filter by company to ensure we only show users from the same company
      const chatUsersList = usersArray
        .filter(user => {
          const userId = user.id || user.ID;
          const userCompany = user.company || user.Company;
          
          // Convert both to strings for comparison to handle type mismatches
          const userIdStr = userId ? String(userId) : null;
          const currentUserIdStr = currentUserId ? String(currentUserId) : null;
          
          // Check if user is not the current user
          const isNotCurrentUser = userIdStr && userIdStr !== currentUserIdStr;
          
          // Check if user is from the same company (if company info is available)
          const isSameCompany = !currentUserCompany || !userCompany || currentUserCompany === userCompany;
          
          const shouldInclude = isNotCurrentUser && isSameCompany;
          
          if (!shouldInclude && userIdStr) {
            if (!isNotCurrentUser) {
              console.log(`Excluding user ${userIdStr} (current user: ${currentUserIdStr})`);
            } else if (!isSameCompany) {
              console.log(`Excluding user ${userIdStr} (different company: ${userCompany} vs ${currentUserCompany})`);
            }
          }
          return shouldInclude;
        })
        .map(user => {
          const userId = user.id || user.ID;
          return {
            userId: userId,
            name: user.name || user.Name || 'User',
            email: user.email || user.Email || '',
            role: user.role || user.Role || '',
            company: user.company || user.Company || '',
            status: user.status || user.Status || 'Active',
            unreadCount: 0 // Will be updated from conversations if needed
          };
        })
        .sort((a, b) => {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      
      console.log('Final chat users list:', chatUsersList);
      
      // Get conversations to update unread counts and include users who have messaged but aren't in users list
      try {
        const conversations = await messagingService.getConversations();
        if (Array.isArray(conversations)) {
          // Create a map of existing users by ID for quick lookup
          const existingUsersMap = new Map();
          chatUsersList.forEach(u => {
            existingUsersMap.set(String(u.userId), u);
          });
          
          // Process conversations to update unread counts and add missing users
          conversations.forEach(conv => {
            const convUserId = String(conv.userId || conv.userID);
            const existingUser = existingUsersMap.get(convUserId);
            
            if (existingUser) {
              // Update unread count for existing user
              if (conv.unreadCount) {
                existingUser.unreadCount = conv.unreadCount;
              }
            } else {
              // User has a conversation but isn't in the users list - add them
              // BUT only if they're from the same company (to avoid 403 errors)
              const convUser = conv.user || {};
              const userId = conv.userId || conv.userID || convUser.id || convUser.ID;
              const userCompany = convUser.company || convUser.Company || conv.company || '';
              
              // Only add if it's not the current user AND from the same company
              const currentUserIdStr = currentUserId ? String(currentUserId) : null;
              const isSameCompany = !currentUserCompany || !userCompany || currentUserCompany === userCompany;
              
              if (userId && String(userId) !== currentUserIdStr && isSameCompany) {
                const newUser = {
                  userId: userId,
                  name: convUser.name || convUser.Name || conv.name || 'User',
                  email: convUser.email || convUser.Email || conv.email || '',
                  role: convUser.role || convUser.Role || conv.role || '',
                  company: userCompany,
                  status: convUser.status || convUser.Status || conv.status || 'Active',
                  unreadCount: conv.unreadCount || 0
                };
                chatUsersList.push(newUser);
                existingUsersMap.set(String(userId), newUser);
                console.log('Added user from conversation (same company):', newUser);
              } else if (userId && String(userId) !== currentUserIdStr && !isSameCompany) {
                console.log('Skipping user from different company:', {
                  userId,
                  userCompany,
                  currentUserCompany
                });
              }
            }
          });
          
          // Re-sort after adding new users
          chatUsersList.sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
        }
      } catch (convError) {
        console.error('Error loading conversations for unread counts:', convError);
      }
      
      setChatUsers(chatUsersList);
      
      // Auto-select first user if available and no user is selected
      // Use functional update to avoid dependency on selectedUserId
      setSelectedUserId(prevSelected => {
        if (chatUsersList.length > 0 && !prevSelected) {
          const firstUserId = chatUsersList[0].userId;
          // Load chat for first user asynchronously
          setTimeout(() => {
            loadChatForUser(firstUserId);
          }, 0);
          return firstUserId;
        }
        return prevSelected;
      });
      
      if (chatUsersList.length === 0) {
        console.warn('No users found. This could mean:');
        console.warn('1. No other users in the same company');
        console.warn('2. API endpoint returned empty array');
        console.warn('3. All users were filtered out');
        addNotification('No users available for messaging', 'info');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      console.error('Error details:', error.message, error.stack);
      addNotification(`Failed to load users: ${error.message || 'Unknown error'}`, 'error');
      setChatUsers([]);
    } finally {
      isLoadingUsersRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadChatForUser]); // addNotification is stable, no need to include

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load users when chat tab is active (only once per tab switch)
  useEffect(() => {
    if (activeTab === 'chat' && !isLoadingUsersRef.current) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Only depend on activeTab, not loadUsers

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: TrendingUp },
      { id: 'visits', label: 'Visits', icon: Calendar },
      { id: 'requests', label: 'Requests', icon: ClipboardList },
      { id: 'occupancy', label: 'Occupancy', icon: Building },
      { id: 'sales-tracking', label: 'Sales Tracking', icon: FileText },
      { id: 'clients', label: 'Tenant Management', icon: Users },
      { id: 'property-management', label: 'Property Management', icon: Building },
      { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
      { id: 'advertisements', label: 'Advertisements', icon: Megaphone },
      { id: 'chat', label: 'Messages', icon: MessageCircle },
      { id: 'settings', label: 'Profile Settings', icon: Settings }
    ],
    []
  );

  // Visits / Requests handlers (Schedule visit from Property Management uses properties for dropdown)
  const openScheduleVisit = (propertyAddress = '') => {
    setVisitProperty(propertyAddress);
    setShowScheduleVisitModal(true);
  };
  const openUpdateVisitStatus = (visit) => {
    setSelectedVisit(visit);
    setShowUpdateVisitStatusModal(true);
  };
  const openFollowUp = (request) => {
    setSelectedRequest(request);
    setShowFollowUpModal(true);
  };
  const closeScheduleVisitModal = () => {
    setShowScheduleVisitModal(false);
    setVisitProperty('');
  };
  const closeUpdateVisitStatusModal = () => {
    setShowUpdateVisitStatusModal(false);
    setSelectedVisit(null);
  };
  const closeFollowUpModal = () => {
    setShowFollowUpModal(false);
    setSelectedRequest(null);
  };
  const parsePropertyImages = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseUnitPictures = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return typeof val === 'string' && val.trim() ? [val.trim()] : [];
    }
  };

  const handlePropertyImageUpload = async (files, isEdit = false) => {
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type || !file.type.startsWith('image/')) continue;
        const result = await cloudinaryService.uploadFile(file, 'property-images');
        if (result.success && result.url) {
          if (isEdit) setEditPropertyImages(prev => [...prev, result.url]);
          else setCreatePropertyImages(prev => [...prev, result.url]);
        }
      }
    } catch (err) {
      console.error('Image upload error:', err);
      addNotification('Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePmAddFormImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type || !file.type.startsWith('image/')) continue;
        const result = await cloudinaryService.uploadFile(file, 'property-images');
        if (result.success && result.url) setPmAddFormImages(prev => [...prev, result.url]);
      }
    } catch (err) {
      console.error('Image upload error:', err);
      addNotification('Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleScheduleVisit = useCallback(async (visitData) => {
    setLoading(true);
    try {
      await salesManagerService.scheduleVisit(visitData);
      addNotification('Visit scheduled successfully!', 'success');
      closeScheduleVisitModal();
      loadListingsData();
    } catch (error) {
      console.error('Error scheduling visit:', error);
      addNotification('Failed to schedule visit', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, loadListingsData]);
  const handleUpdateVisitStatus = useCallback(async (status, notes) => {
    if (!selectedVisit) return;
    setLoading(true);
    try {
      const visitId = selectedVisit.ID || selectedVisit.id;
      await salesManagerService.updateVisitStatus(visitId, status, notes);
      addNotification('Visit status updated successfully!', 'success');
      closeUpdateVisitStatusModal();
      loadListingsData();
    } catch (error) {
      console.error('Error updating visit status:', error);
      addNotification('Failed to update visit status', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, loadListingsData, selectedVisit]);
  const handleApproveRequest = useCallback(async (requestId) => {
    try {
      await salesManagerService.updateVisitRequest(requestId, 'Approved');
      addNotification('Request approved successfully!', 'success');
      loadListingsData();
    } catch (error) {
      console.error('Error approving request:', error);
      addNotification('Failed to approve request', 'error');
    }
  }, [addNotification, loadListingsData]);
  const handleFollowUpRequest = useCallback(async (message) => {
    if (!selectedRequest) return;
    try {
      const requestId = selectedRequest.ID || selectedRequest.id;
      await salesManagerService.followUpVisitRequest(requestId, message);
      addNotification('Follow-up sent successfully!', 'success');
      closeFollowUpModal();
      loadListingsData();
    } catch (error) {
      console.error('Error sending follow-up:', error);
      addNotification('Failed to send follow-up', 'error');
    }
  }, [addNotification, loadListingsData, selectedRequest]);

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

  const handleExcelFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExcelFile(file);
    }
  };

  const downloadCsvExample = () => {
    const headers = ['Name', 'Property', 'Email', 'Phone', 'Amount', 'MoveInDate', 'Status', 'UnitNumber'];
    const exampleRows = [
      ['Jane Doe', '123 Main St', 'jane.doe@example.com', '+2250700000000', '150000', '2026-02-01', 'Active', ''],
      ['John Smith', '456 Oak Ave', 'john.smith@example.com', '+2250700000001', '180000', '2026-02-15', 'Active', 'F1']
    ];
    const escapeCsv = (v) => {
      const s = String(v ?? '').trim();
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csvContent = [
      headers.join(','),
      ...exampleRows.map(r => r.map(escapeCsv).join(','))
    ].join('\n') + '\n';
    downloadBlob(csvContent, 'tenants_import_example.csv');
  };

  const downloadBlob = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadPropertiesExampleCsv = () => {
    const headers = ['Address', 'Type', 'PropertyType', 'BuildingType', 'Status', 'NumberOfUnits', 'Rent', 'Bedrooms', 'Bathrooms', 'Urgency', 'LandlordId', 'UnitNumbers', 'UnitRents'];
    const exampleRows = [
      ['123 Main St', 'House', 'For Rent', '', 'Vacant', '1', '150000', '3', '2', 'normal', '', '', ''],
      ['456 Oak Ave', 'Apartment', 'For Rent', 'T2', 'Vacant', '2', '', '2', '1', 'normal', '', 'F1|F2', '100000|120000']
    ];
    const escapeCsv = (v) => {
      const s = String(v ?? '').trim();
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csvContent = [
      headers.join(','),
      ...exampleRows.map(r => r.map(escapeCsv).join(','))
    ].join('\n') + '\n';
    downloadBlob(csvContent, 'properties_import_example.csv');
  };

  const downloadTenantsExampleCsv = () => {
    downloadCsvExample();
  };

  const downloadFullImportExampleCsv = () => {
    const escapeCsv = (v) => {
      const s = String(v ?? '').trim();
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const propHeaders = ['Address', 'Type', 'PropertyType', 'BuildingType', 'Status', 'NumberOfUnits', 'Rent', 'Bedrooms', 'Bathrooms', 'Urgency', 'LandlordId', 'UnitNumbers', 'UnitRents'];
    const propRows = [
      ['123 Main St', 'House', 'For Rent', '', 'Vacant', '1', '150000', '3', '2', 'normal', '', '', ''],
      ['456 Oak Ave', 'Apartment', 'For Rent', 'T2', 'Vacant', '2', '', '2', '1', 'normal', '', 'F1|F2', '100000|120000']
    ];
    const tenantHeaders = ['Name', 'Property', 'Email', 'Phone', 'Amount', 'MoveInDate', 'Status', 'UnitNumber'];
    const tenantRows = [
      ['Jane Doe', '123 Main St', 'jane@example.com', '+2250700000000', '150000', '2026-02-01', 'Active', ''],
      ['John Smith', '456 Oak Ave', 'john@example.com', '+2250700000001', '100000', '2026-02-15', 'Active', 'F1']
    ];
    const sections = [
      '[PROPERTIES]',
      propHeaders.join(','),
      ...propRows.map(r => r.map(escapeCsv).join(',')),
      '',
      '[TENANTS]',
      tenantHeaders.join(','),
      ...tenantRows.map(r => r.map(escapeCsv).join(','))
    ];
    downloadBlob(sections.join('\n') + '\n', 'full_import_example.csv');
  };

  const parseCsvWithSections = (text) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    const result = { properties: [], tenants: [] };
    let currentSection = null;
    let headers = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed === '[PROPERTIES]') {
        currentSection = 'properties';
        headers = null;
        continue;
      }
      if (trimmed === '[TENANTS]') {
        currentSection = 'tenants';
        headers = null;
        continue;
      }
      if (!currentSection) continue;
      const parseRow = (raw) => {
        const row = [];
        let val = '';
        let inQuotes = false;
        for (let j = 0; j < raw.length; j++) {
          const c = raw[j];
          if (c === '"') {
            if (inQuotes && raw[j + 1] === '"') { val += '"'; j++; }
            else inQuotes = !inQuotes;
          } else if ((c === ',' && !inQuotes) || (c === '\n' && !inQuotes)) {
            row.push(val.trim());
            val = '';
            if (c === '\n') break;
          } else {
            val += c;
          }
        }
        if (val !== undefined) row.push(val.trim());
        return row;
      };
      const cells = parseRow(line);
      if (cells.length === 0 || cells.every(c => !c)) continue;
      if (!headers) {
        headers = cells.map(c => (c || '').trim());
        continue;
      }
      const obj = {};
      headers.forEach((h, idx) => { if (h) obj[h] = cells[idx] ?? ''; });
      if (currentSection === 'properties' && obj.Address) result.properties.push(obj);
      if (currentSection === 'tenants' && obj.Name) result.tenants.push(obj);
    }
    return result;
  };

  const parseCsvRows = (text, expectedSection) => {
    const { properties, tenants } = parseCsvWithSections(text);
    if (expectedSection === 'properties') return properties;
    if (expectedSection === 'tenants') return tenants;
    return { properties, tenants };
  };

  const handleBulkImportProperties = async (file) => {
    const text = await file.text();
    let rows = [];
    if (text.includes('[PROPERTIES]') && text.includes('[TENANTS]')) {
      rows = parseCsvRows(text, 'properties');
    } else if (text.includes('[PROPERTIES]')) {
      rows = parseCsvRows(text, 'properties');
    } else {
      const parseCsvLine = (line) => {
        const out = [];
        let val = '';
        let inQ = false;
        for (let j = 0; j < line.length; j++) {
          const c = line[j];
          if (c === '"') {
            if (inQ && line[j + 1] === '"') { val += '"'; j++; }
            else inQ = !inQ;
          } else if (c === ',' && !inQ) {
            out.push(val.trim().replace(/^"|"$/g, ''));
            val = '';
          } else val += c;
        }
        out.push(val.trim().replace(/^"|"$/g, ''));
        return out;
      };
      const lines = text.split(/\r?\n/).filter(Boolean);
      const headerLine = lines[0];
      if (!headerLine) { addNotification('CSV file is empty', 'error'); return { success: 0, failed: 0 }; }
      const headers = parseCsvLine(headerLine).map(h => h.trim());
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i]);
        const obj = {};
        headers.forEach((h, idx) => { if (h) obj[h] = (cells[idx] ?? '').trim(); });
        if (obj.Address) rows.push(obj);
      }
    }
    if (rows.length === 0) { addNotification('No property rows found in file', 'error'); return { success: 0, failed: 0 }; }
    let success = 0, failed = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const numUnits = Math.max(1, parseInt(r.NumberOfUnits, 10) || 1);
        let units = [];
        if (numUnits > 1 && (r.UnitNumbers || r.UnitRents)) {
          const unitNums = (r.UnitNumbers || '').split('|').map(s => s.trim()).filter(Boolean);
          const unitRents = (r.UnitRents || '').split('|').map(s => parseFloat(s) || 0);
          for (let u = 0; u < numUnits; u++) {
            units.push({
              unitNumber: unitNums[u] || `Unit${u + 1}`,
              rent: unitRents[u] ?? 0,
              bedrooms: parseInt(r.Bedrooms, 10) || 0,
              bathrooms: parseFloat(r.Bathrooms) || 1,
              status: 'Vacant',
              tenant: null
            });
          }
        } else {
          const rent = parseFloat(r.Rent) || 0;
          units = [{ unitNumber: '1', rent, bedrooms: parseInt(r.Bedrooms, 10) || 0, bathrooms: parseFloat(r.Bathrooms) || 1, status: r.Status === 'Occupied' ? 'Occupied' : 'Vacant', tenant: null }];
        }
        const payload = {
          address: (r.Address || '').trim(),
          type: (r.Type || 'House').trim(),
          propertyType: (r.PropertyType || 'For Rent').trim(),
          buildingType: (r.BuildingType || '').trim() || null,
          status: (r.Status || 'Vacant').trim() === 'Occupied' ? 'Occupied' : 'Vacant',
          numberOfUnits: numUnits,
          rent: numUnits === 1 ? (parseFloat(r.Rent) || 0) : 0,
          bedrooms: parseInt(r.Bedrooms, 10) || undefined,
          bathrooms: parseFloat(r.Bathrooms) || undefined,
          urgency: (r.Urgency || 'normal').trim() || 'normal',
          landlord_id: r.LandlordId ? parseInt(r.LandlordId, 10) : null,
          units
        };
        if (!payload.address || !payload.type || !payload.propertyType) {
          failed++;
          continue;
        }
        if (payload.type === 'Apartment' && !payload.buildingType) payload.buildingType = 'T2';
        await salesManagerService.createProperty(payload);
        success++;
      } catch (err) {
        console.error('Property import row error:', err);
        failed++;
      }
    }
    return { success, failed };
  };

  const handleBulkImportTenants = async (file) => {
    let fileToSend = file;
    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      if (text.includes('[PROPERTIES]') || text.includes('[TENANTS]')) {
        const { tenants } = parseCsvRows(text, null);
        if (tenants.length === 0) { addNotification('No tenant rows found in file', 'error'); return { success: 0, failed: 0 }; }
        const headers = ['Name', 'Property', 'Email', 'Phone', 'Amount', 'MoveInDate', 'Status', 'UnitNumber'];
        const escapeCsv = (v) => {
          const s = String(v ?? '').trim();
          if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
          return s;
        };
        const lines = [headers.join(','), ...tenants.map(t => headers.map(h => escapeCsv(t[h] || '')).join(','))];
        fileToSend = new File([lines.join('\n')], 'tenants.csv', { type: 'text/csv' });
      }
    }
    const result = await salesManagerService.importClientsFromExcel(fileToSend);
    return { success: result.success || result.createdClients?.length || 0, failed: result.failed || 0, result };
  };

  const handleBulkImportUpload = async () => {
    if (!bulkImportFile) {
      addNotification('Please select a file first', 'error');
      return;
    }
    const isCsv = bulkImportFile.name.toLowerCase().endsWith('.csv');
    if (!isCsv && bulkImportTab === 'properties') {
      addNotification('Property import supports CSV only. Please use a .csv file.', 'error');
      return;
    }
    setBulkImportLoading(true);
    try {
      let hasProps = false, hasTenants = false;
      if (isCsv) {
        const text = await bulkImportFile.text();
        hasProps = text.includes('[PROPERTIES]');
        hasTenants = text.includes('[TENANTS]');
      }
      const doBoth = hasProps && hasTenants;
      const doProps = hasProps || (bulkImportTab === 'properties' && !hasTenants);
      const doTenants = hasTenants || (bulkImportTab === 'tenants' && !hasProps);

      let totalSuccess = 0, totalFailed = 0;
      let lastTenantResult = null;

      if (doProps) {
        const { success, failed } = await handleBulkImportProperties(bulkImportFile);
        totalSuccess += success;
        totalFailed += failed;
      }
      if (doTenants) {
        const res = await handleBulkImportTenants(bulkImportFile);
        totalSuccess += (res.success || 0);
        totalFailed += (res.failed || 0);
        lastTenantResult = res;
      }

      if (totalSuccess > 0 || totalFailed > 0) await loadData();
      if (lastTenantResult?.result?.createdUsers?.length) {
        const usersWithPasswords = lastTenantResult.result.createdUsers.filter(u => u.password);
        if (usersWithPasswords.length > 0) {
          setPasswordData({
            type: 'bulk',
            users: usersWithPasswords,
            success: lastTenantResult.success,
            failed: lastTenantResult.failed,
            errors: lastTenantResult.result.errors || []
          });
          setShowPasswordModal(true);
        }
      }

      const msg = doBoth
        ? `Import complete: ${totalSuccess} succeeded, ${totalFailed} failed`
        : doProps && !doTenants
          ? `Properties: ${totalSuccess} imported, ${totalFailed} failed`
          : `Tenants: ${totalSuccess} imported, ${totalFailed} failed`;
      addNotification(msg, totalSuccess > 0 ? 'success' : totalFailed > 0 ? 'error' : 'info');
      setShowBulkImportModal(false);
      setBulkImportFile(null);
    } catch (err) {
      console.error('Bulk import error:', err);
      addNotification(err?.message || 'Import failed', 'error');
    } finally {
      setBulkImportLoading(false);
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile) {
      addNotification('Please select a file first', 'error');
      return;
    }

    // Validate file type (Excel and CSV)
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
      'text/csv', // .csv
      'application/csv', // .csv (alternative MIME type)
      'text/plain', // .csv (some systems use this)
    ];
    
    const validExtensions = /\.(xlsx|xls|csv)$/i;
    
    if (!validTypes.includes(excelFile.type) && !excelFile.name.match(validExtensions)) {
      addNotification('Please upload a valid file (.xlsx, .xls, or .csv)', 'error');
      setExcelFile(null);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (excelFile.size > maxSize) {
      addNotification('File size too large. Please upload files smaller than 10MB.', 'error');
      setExcelFile(null);
      return;
    }

    try {
      setLoading(true);
      addNotification('Importing tenants from file...', 'info');
      
      const result = await salesManagerService.importClientsFromExcel(excelFile);
      
      console.log('Excel import result:', result);
      
      // Reload clients data
      await loadData();
      
      // Check if passwords are returned in the response
      if (result.createdUsers && Array.isArray(result.createdUsers) && result.createdUsers.length > 0) {
        // Filter users that have passwords (newly created)
        const usersWithPasswords = result.createdUsers.filter(user => user.password && !user.note);
        if (usersWithPasswords.length > 0) {
          setPasswordData({
            type: 'bulk',
            users: usersWithPasswords,
            success: result.success || usersWithPasswords.length,
            failed: result.failed || 0,
            errors: result.errors || []
          });
          setShowPasswordModal(true);
        }
      }
      
      // Show success notification
      const successCount = result.success || result.createdUsers?.length || 0;
      const failedCount = result.failed || 0;
      let notificationMessage = `Successfully imported ${successCount} tenant(s) from file!`;
      if (failedCount > 0) {
        notificationMessage += ` ${failedCount} failed.`;
      }
      if (result.errors && result.errors.length > 0) {
        notificationMessage += ` Check password modal for details.`;
      }
      addNotification(notificationMessage, 'success');
      
      // Close modal and reset
      setShowTenantCreationModal(false);
      setExcelFile(null);
      setImportMode('manual');
    } catch (error) {
      console.error('Excel import error:', error);
      addNotification(
        error.message || 'Failed to import file. Please check the file format and try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const approvedClientId = formData.get('approvedClientId')?.trim();
    const propertyIdOrAddress = formData.get('property')?.trim();
    const rent = formData.get('rent');
    const moveInDate = formData.get('moveInDate');
    
    if (!approvedClientId || !propertyIdOrAddress || !rent || !moveInDate) {
      addNotification('Please select an approved client and fill all required fields', 'error');
      return;
    }

    const approvedClient = approvedClients.find(client => String(client.ID || client.id) === String(approvedClientId));
    if (!approvedClient) {
      addNotification('Selected approved client not found', 'error');
      return;
    }

    // Property dropdown now stores property ID; resolve for display/API and for unit assignment
    const selectedProperty = properties.find((p) => String(p.ID || p.id) === String(propertyIdOrAddress));
    const propertyId = selectedProperty ? (selectedProperty.ID ?? selectedProperty.id) : null;
    const propertyAddress = selectedProperty ? (selectedProperty.Address || selectedProperty.address || '') : propertyIdOrAddress;

    const depositPaid = Boolean(
      approvedClient.SecurityDepositPaid ||
      approvedClient.securityDepositPaid
    );
    const depositPaidAtRaw =
      approvedClient.SecurityDepositPaidAt ||
      approvedClient.securityDepositPaidAt ||
      approvedClient.SecurityDepositDate ||
      approvedClient.securityDepositDate ||
      approvedClient.DepositPaidAt ||
      approvedClient.depositPaidAt ||
      approvedClient.DepositDate ||
      approvedClient.depositDate ||
      null;
    if (depositPaid && !depositPaidAtRaw) {
      addNotification('Deposit paid date is missing. Please update it before setting move-in date.', 'error');
      return;
    }
    if (depositPaid && depositPaidAtRaw) {
      const maxMoveIn = addMonths(new Date(depositPaidAtRaw), 1).toISOString().split('T')[0];
      if (moveInDate > maxMoveIn) {
        addNotification('Move-in date must be within 1 month after the deposit was paid.', 'error');
        return;
      }
    }
    
    const unitNumber = formData.get('unitNumber')?.trim();
    
    const tenantData = {
      newClientId: Number(approvedClientId),
      name: approvedClient.name || approvedClient.Name || '',
      email: approvedClient.email || approvedClient.Email || '',
      phone: approvedClient.phone || approvedClient.Phone || '',
      property: propertyAddress,
      unitNumber: unitNumber || null,
      amount: parseFloat(rent),
      moveInDate: moveInDate,
      adminDocumentIds: approvedClientDocuments.map(doc => doc.ID || doc.id).filter(Boolean),
      adminChecklistId: approvedClientChecklist?.ID || approvedClientChecklist?.id || null,
    };
    
    try {
      setLoading(true);
      console.log('Creating tenant with data:', tenantData);
      const newClient = await salesManagerService.createClient(tenantData);
      console.log('Created tenant response:', newClient);
      
      // Assign tenant to the selected building unit so it shows in Property Management
      if (unitNumber && propertyId) {
          try {
            const buildingDetail = await salesManagerService.getPropertyBuildingDetail(propertyId);
            const units = buildingDetail?.units || [];
            const unitLabel = unitNumber.trim().toLowerCase();
            const unitLabelShort = unitLabel.replace(/^unit\s*/i, '').trim();
            let unit = units.find((u) => {
              const uNum = (u.unitNumber || u.name || '').toString().trim().toLowerCase();
              return uNum === unitLabel || uNum === unitLabelShort;
            });
            if (!unit && units.length > 0) {
              const idx = parseInt(unitNumber.replace(/\D/g, ''), 10);
              unit = (idx >= 1 && units[idx - 1]) ? units[idx - 1] : units[0];
            }
            if (unit) {
              const enterDate = moveInDate || new Date().toISOString().split('T')[0];
              try {
                await salesManagerService.updatePropertyUnit(propertyId, unit.id, {
                  tenant: null,
                  status: 'Vacant',
                  enterDate: null,
                });
              } catch (_) {
                // Ignore: unit may already be vacant
              }
              await salesManagerService.updatePropertyUnit(propertyId, unit.id, {
                tenant: tenantData.name,
                status: 'Occupied',
                enterDate,
              });
            }
          } catch (assignErr) {
            console.warn('Tenant created but unit assignment failed:', assignErr);
            addNotification('Tenant created; could not assign to unit. You can assign from Edit Tenant.', 'warning');
          }
      }
      
      // Check if password is returned in the response
      if (newClient.user && newClient.user.password) {
        setPasswordData({
          type: 'single',
          user: newClient.user,
          client: newClient.client || newClient
        });
        setShowPasswordModal(true);
      }
      
      // Reload data to get updated client list
      await loadData();
      
      // Reset form and close modal
      setShowTenantCreationModal(false);
      setUploadedDocuments([]);
      setSelectedApprovedClientId('');
      e.target.reset();
      
      addNotification(`Tenant "${tenantData.name}" created successfully!`, 'success');
    } catch (error) {
      console.error('Failed to create tenant:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      addNotification(`Failed to create tenant: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
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
      await loadData();
    } catch (error) {
      console.error('Failed to update alert:', error);
      addNotification('Failed to update alert', 'error');
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setShowEditClientModal(true);
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    if (!editingClient) return;

    const formData = new FormData(e.target);
    const updateData = {
      name: formData.get('name')?.trim() || editingClient.Name,
      email: formData.get('email')?.trim() || editingClient.Email,
      phone: formData.get('phone')?.trim() || editingClient.Phone,
      property: formData.get('property')?.trim() || editingClient.Property,
      amount: formData.get('amount') ? parseFloat(formData.get('amount')) : editingClient.Amount,
      status: formData.get('status') || editingClient.Status,
    };

    try {
      setLoading(true);
      await salesManagerService.updateClient(editingClient.ID || editingClient.id, updateData);
      addNotification('Client updated successfully!', 'success');
      setShowEditClientModal(false);
      setEditingClient(null);
      await loadData();
    } catch (error) {
      console.error('Failed to update client:', error);
      addNotification('Failed to update client', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTenantFromUnit = async () => {
    if (!tenantAssignment) return;
    setRemoveFromUnitLoading(true);
    try {
      await salesManagerService.updatePropertyUnit(tenantAssignment.propertyId, tenantAssignment.unitId, {
        tenant: null,
        status: 'Vacant',
        enterDate: null,
      });
      if (editingClient) {
        const clientId = editingClient.ID ?? editingClient.id;
        if (clientId) {
          try {
            await salesManagerService.updateClient(clientId, { status: 'Inactive' });
          } catch (clientErr) {
            console.warn('Unit cleared but could not set tenant status to Inactive:', clientErr);
            addNotification('Tenant removed from unit; could not set status to Inactive.', 'warning');
          }
        }
      }
      addNotification('Tenant removed from unit. Apartment is now vacant and tenant status set to Inactive.', 'success');
      setTenantAssignment(null);
      await loadData();
    } catch (err) {
      addNotification(err.message || 'Failed to remove tenant from unit', 'error');
    } finally {
      setRemoveFromUnitLoading(false);
    }
  };

  const resetEditClientModalState = () => {
    setTenantAssignment(null);
    setLoadingAssignment(false);
    setRemoveFromUnitLoading(false);
  };

  const handleEditUnpaidRent = (unpaidRent) => {
    setEditingUnpaidRent(unpaidRent);
    setShowUnpaidRentModal(true);
  };

  const handleUpdateUnpaidRent = async (e) => {
    e.preventDefault();
    if (!editingUnpaidRent) return;

    const formData = new FormData(e.target);
    const updateData = {
      status: formData.get('status') || 'Paid',
      amount: formData.get('amount') ? parseFloat(formData.get('amount')) : editingUnpaidRent.Amount,
      paidAmount: formData.get('paidAmount') ? parseFloat(formData.get('paidAmount')) : null,
      paymentDate: formData.get('paymentDate') || null,
      notes: formData.get('notes')?.trim() || null,
    };

    try {
      setLoading(true);
      await salesManagerService.updateUnpaidRent(editingUnpaidRent.ID || editingUnpaidRent.id, updateData);
      addNotification('Unpaid rent updated successfully!', 'success');
      setShowUnpaidRentModal(false);
      setEditingUnpaidRent(null);
      await loadData();
    } catch (error) {
      console.error('Failed to update unpaid rent:', error);
      addNotification('Failed to update unpaid rent', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const numUnits = createPropertyNumberOfUnits;
    const unitsPayload = createPropertyUnits.slice(0, numUnits).map(u => ({
      unitNumber: String(u.unitNumber || '').trim(),
      rent: parseFloat(u.rent) || 0,
      bedrooms: parseInt(u.bedrooms, 10) || 0,
      bathrooms: parseFloat(u.bathrooms) || 1,
      status: u.status === 'Occupied' ? 'Occupied' : 'Vacant',
      tenant: (u.status === 'Occupied' && u.tenant) ? String(u.tenant).trim() : null,
    }));
    
    const propertyData = {
      address: formData.get('address')?.trim(),
      type: formData.get('type')?.trim(),
      propertyType: formData.get('propertyType')?.trim(),
      buildingType: formData.get('buildingType')?.trim() || null,
      status: formData.get('status')?.trim(),
      numberOfUnits: numUnits,
      bedrooms: formData.get('bedrooms') ? parseInt(formData.get('bedrooms'), 10) : undefined,
      bathrooms: formData.get('bathrooms') ? parseFloat(formData.get('bathrooms')) : undefined,
      urgency: formData.get('urgency')?.trim() || 'normal',
      landlord_id: formData.get('owner') ? parseInt(formData.get('owner'), 10) : null,
    };

    if (numUnits > 1) {
      if (unitsPayload.length !== numUnits || unitsPayload.some(u => !u.unitNumber)) {
        addNotification('Each unit must have a name/label (e.g. F1, House A, 101).', 'error');
      return;
      }
      propertyData.units = unitsPayload;
      propertyData.rent = 0;
    } else {
      const single = unitsPayload[0];
      if (single) {
        propertyData.units = [{ ...single, unitNumber: single.unitNumber || '1' }];
        propertyData.rent = single.rent;
      } else {
        propertyData.rent = formData.get('rent') ? parseFloat(formData.get('rent')) : 0;
      }
    }

    if (!propertyData.address || !propertyData.type || !propertyData.propertyType || !propertyData.status || propertyData.numberOfUnits < 1) {
      addNotification('Please fill in Address, Type, Property Type, Status, and Number of Units.', 'error');
      return;
    }
    if (propertyData.type === 'Apartment' && !propertyData.buildingType) {
      addNotification('Building Type is required when Type is Apartment', 'error');
      return;
    }
    if (propertyData.status !== 'Vacant' && propertyData.status !== 'Occupied') {
      addNotification('Status must be either "Vacant" or "Occupied"', 'error');
      return;
    }
    if (createPropertyImages.length > 0) {
      propertyData.images = createPropertyImages;
    }

    try {
      setLoading(true);
      await salesManagerService.createProperty(propertyData);
      addNotification('Property created successfully', 'success');
      setShowCreatePropertyModal(false);
      setSelectedPropertyType('');
      setCreatePropertyImages([]);
      await loadData();
    } catch (error) {
      console.error('Error creating property:', error);
      addNotification(error.message || 'Failed to create property', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBuilding = async (e) => {
    e.preventDefault();
    if (!pmOwnerId) {
      addNotification('No owner selected.', 'error');
      return;
    }
    const formData = new FormData(e.target);
    const name = formData.get('buildingName')?.trim();
    const city = formData.get('buildingCity')?.trim();
    const neighborhood = formData.get('buildingNeighborhood')?.trim();
    const typeR = formData.get('buildingTypeR')?.trim();
    const numberOfApartments = Math.max(1, parseInt(formData.get('buildingNumberOfApartments'), 10) || 1);
    if (!name) {
      addNotification('Name of building is required.', 'error');
      return;
    }
    setLoading(true);
    try {
      await salesManagerService.createProperty({
        address: name,
        type: 'Building',
        propertyType: 'For Rent',
        status: 'Vacant',
        numberOfUnits: numberOfApartments,
        rent: 0,
        landlord_id: pmOwnerId,
        city: city || '',
        neighborhood: neighborhood || '',
        typeR: typeR || '',
        images: pmAddFormImages,
      });
      addNotification('Building created successfully', 'success');
      setShowAddBuildingModal(false);
      setPmAddFormImages([]);
      const data = await salesManagerService.getOwnerAssets(pmOwnerId);
      setOwnerAssets(data);
    } catch (err) {
      addNotification(err.message || 'Failed to create building', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVilla = async (e) => {
    e.preventDefault();
    if (!pmOwnerId) {
      addNotification('No owner selected.', 'error');
      return;
    }
    const formData = new FormData(e.target);
    const preciseLocation = formData.get('villaPreciseLocation')?.trim();
    const typeR = formData.get('villaTypeR')?.trim();
    const address = formData.get('villaAddress')?.trim();
    const livingRooms = formData.get('villaLivingRooms')?.trim();
    const bedrooms = formData.get('villaBedrooms')?.trim();
    const bathrooms = formData.get('villaBathrooms')?.trim();
    const visitorWc = formData.get('villaVisitorWc')?.trim();
    const courtyard = formData.get('villaCourtyard') ? 'yes' : '';
    const garage = formData.get('villaGarage') ? 'yes' : '';
    const garden = formData.get('villaGarden') ? 'yes' : '';
    const airConditioning = formData.get('villaAirConditioning') ? 'yes' : '';
    const swimmingPool = formData.get('villaSwimmingPool') ? 'yes' : '';
    const monthlyRent = parseFloat(formData.get('villaMonthlyRent')) || 0;
    const extra = JSON.stringify({
      pieces: { livingRooms, bedrooms, bathrooms, visitorWc },
      equipment: [courtyard, garage, garden, airConditioning, swimmingPool].filter(Boolean),
    });
    setLoading(true);
    try {
      await salesManagerService.createProperty({
        address: address || preciseLocation || 'Villa',
        type: 'Villa',
        propertyType: 'For Rent',
        status: 'Vacant',
        numberOfUnits: 1,
        rent: monthlyRent,
        landlord_id: pmOwnerId,
        city: preciseLocation?.split('–')[0]?.trim() || '',
        neighborhood: preciseLocation?.split('–')[1]?.trim() || '',
        typeR: typeR || '',
        extra,
        units: [{ unitNumber: '1', rent: monthlyRent, status: 'Vacant' }],
      });
      addNotification('Villa created successfully', 'success');
      setShowAddVillaModal(false);
      const data = await salesManagerService.getOwnerAssets(pmOwnerId);
      setOwnerAssets(data);
    } catch (err) {
      addNotification(err.message || 'Failed to create villa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLand = async (e) => {
    e.preventDefault();
    if (!pmOwnerId) {
      addNotification('No owner selected.', 'error');
      return;
    }
    const formData = new FormData(e.target);
    const name = formData.get('landName')?.trim();
    const superficie = parseFloat(formData.get('landSuperficie')) || 0;
    const city = formData.get('landCity')?.trim();
    const neighborhood = formData.get('landNeighborhood')?.trim();
    const documents = formData.get('landDocuments')?.trim();
    const price = parseFloat(formData.get('landPrice')) || 0;
    if (!name) {
      addNotification('Name of land is required.', 'error');
      return;
    }
    setLoading(true);
    try {
      await salesManagerService.createProperty({
        address: name,
        type: 'Land',
        propertyType: 'For Sale',
        status: 'Vacant',
        numberOfUnits: 0,
        rent: price,
        landlord_id: pmOwnerId,
        city: city || '',
        neighborhood: neighborhood || '',
        superficie,
        documents: documents || '',
      });
      addNotification('Land created successfully', 'success');
      setShowAddLandModal(false);
      const data = await salesManagerService.getOwnerAssets(pmOwnerId);
      setOwnerAssets(data);
    } catch (err) {
      addNotification(err.message || 'Failed to create land', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddApartment = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('apartmentName')?.trim();
    const rent = parseFloat(formData.get('apartmentRent')) || 0;
    const features = JSON.stringify({
      floor: formData.get('apartmentFloor')?.trim(),
      standardRooms: formData.get('apartmentStandardRooms')?.trim(),
      selfContainedRooms: formData.get('apartmentSelfContainedRooms')?.trim(),
      bathroom: formData.get('apartmentBathroom')?.trim(),
      guestToilet: formData.get('apartmentGuestToilet')?.trim(),
      livingRoom: formData.get('apartmentLivingRoom')?.trim(),
      kitchen: formData.get('apartmentKitchen')?.trim(),
      balcony: formData.get('apartmentBalcony')?.trim(),
      parking: formData.get('apartmentParking')?.trim(),
    });
    if (pmPropertyId && (pmView === 'building-detail' || pmView === 'villa-detail')) {
      setLoading(true);
      try {
        await salesManagerService.addApartmentToBuilding(pmPropertyId, {
          name: name || 'Unit',
          features,
          picture: addApartmentPictures.length > 0 ? JSON.stringify(addApartmentPictures) : undefined,
          rent,
          status: 'Vacant',
        });
        addNotification('Apartment added successfully', 'success');
        setShowAddApartmentModal(false);
        setAddApartmentPictures([]);
        const data = await salesManagerService.getPropertyBuildingDetail(pmPropertyId);
        setBuildingDetail(data);
      } catch (err) {
        addNotification(err.message || 'Failed to add apartment', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      if (!pmOwnerId) {
        addNotification('No owner selected.', 'error');
        return;
      }
      setLoading(true);
      try {
        await salesManagerService.createProperty({
          address: name || 'Apartment',
          type: 'Apartment',
          propertyType: 'For Rent',
          status: 'Vacant',
          numberOfUnits: 1,
          rent,
          landlord_id: pmOwnerId,
          units: [{ unitNumber: name || '1', rent, status: 'Vacant', features, picture: addApartmentPictures.length > 0 ? JSON.stringify(addApartmentPictures) : undefined }],
        });
        addNotification('Apartment created successfully', 'success');
        setShowAddApartmentModal(false);
        setAddApartmentPictures([]);
        const data = await salesManagerService.getOwnerAssets(pmOwnerId);
        setOwnerAssets(data);
      } catch (err) {
        addNotification(err.message || 'Failed to create apartment', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditApartment = async (e) => {
    e.preventDefault();
    if (!editingUnit || !pmPropertyId) return;
    const formData = new FormData(e.target);
    const unitNumber = formData.get('editApartmentName')?.trim() || editingUnit.unitNumber;
    const bedrooms = parseInt(formData.get('editApartmentBedrooms'), 10) || 0;
    const bathrooms = parseFloat(formData.get('editApartmentBathrooms')) || 0;
    const numberOfKitchens = parseInt(formData.get('editApartmentKitchens'), 10) || 0;
    const hasSwimmingPool = formData.get('editApartmentSwimmingPool') === 'yes';
    const propertyType = formData.get('editApartmentPropertyType')?.trim() || '';
    const features = JSON.stringify({
      unitType: propertyType || undefined,
      numberOfKitchens,
      hasSwimmingPool,
      floor: formData.get('editApartmentFloor')?.trim(),
      standardRooms: formData.get('editApartmentStandardRooms')?.trim(),
      selfContainedRooms: formData.get('editApartmentSelfContainedRooms')?.trim(),
      bathroom: formData.get('editApartmentBathroom')?.trim(),
      guestToilet: formData.get('editApartmentGuestToilet')?.trim(),
      livingRoom: formData.get('editApartmentLivingRoom')?.trim(),
      kitchen: formData.get('editApartmentKitchen')?.trim(),
      balcony: formData.get('editApartmentBalcony')?.trim(),
      parking: formData.get('editApartmentParking')?.trim(),
    });
    const rent = parseFloat(formData.get('editApartmentRent')) || 0;
    const status = formData.get('editApartmentStatus')?.trim() || 'Vacant';
    const tenant = status === 'Occupied' ? (formData.get('editApartmentTenant')?.trim() || null) : null;
    const enterDate = status === 'Occupied' ? (formData.get('editApartmentEnterDate')?.trim() || null) : null;
    setLoading(true);
    try {
      await salesManagerService.updatePropertyUnit(pmPropertyId, editingUnit.id, {
        unitNumber,
        bedrooms,
        bathrooms,
        features,
        picture: editApartmentPictures.length > 0 ? JSON.stringify(editApartmentPictures) : undefined,
        rent,
        tenant: status === 'Occupied' ? tenant : null,
        status,
        enterDate: status === 'Occupied' ? enterDate : null,
      });
      addNotification('Apartment updated successfully', 'success');
      setShowEditApartmentModal(false);
      setEditingUnit(null);
      setEditApartmentPictures([]);
      setEditApartmentStatusChoice('Vacant');
      const data = await salesManagerService.getPropertyBuildingDetail(pmPropertyId);
      setBuildingDetail(data);
    } catch (err) {
      addNotification(err.message || 'Failed to update apartment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProperty = async (e) => {
    e.preventDefault();
    if (!editingProperty) return;

    const formData = new FormData(e.target);
    const updateData = {};
    if (formData.get('address')) updateData.address = formData.get('address').trim();
    if (formData.get('type')) updateData.type = formData.get('type').trim();
    if (formData.get('propertyType')) updateData.propertyType = formData.get('propertyType').trim();
    if (formData.get('buildingType')) {
      const buildingType = formData.get('buildingType').trim();
      updateData.buildingType = buildingType || null;
    }
    if (formData.get('status')) updateData.status = formData.get('status').trim();
    if (formData.get('bedrooms')) updateData.bedrooms = parseInt(formData.get('bedrooms'), 10);
    if (formData.get('bathrooms')) updateData.bathrooms = parseFloat(formData.get('bathrooms'));
    if (formData.get('urgency')) updateData.urgency = formData.get('urgency').trim();
    updateData.images = editPropertyImages;

    const numUnits = editPropertyNumberOfUnits;
    const unitsPayload = editPropertyUnits.slice(0, numUnits).map(u => ({
      unitNumber: String(u.unitNumber || '').trim(),
      rent: parseFloat(u.rent) || 0,
      bedrooms: parseInt(u.bedrooms, 10) || 0,
      bathrooms: parseFloat(u.bathrooms) || 1,
      status: u.status === 'Occupied' ? 'Occupied' : 'Vacant',
      tenant: (u.status === 'Occupied' && u.tenant) ? String(u.tenant).trim() : null,
    }));
    if (unitsPayload.length > 0) {
      if (unitsPayload.some(u => !u.unitNumber)) {
        addNotification('Each unit must have a name (e.g. F1, House A).', 'error');
        return;
      }
      updateData.units = unitsPayload;
    }

    if (updateData.status && updateData.status !== 'Vacant' && updateData.status !== 'Occupied') {
      addNotification('Status must be either "Vacant" or "Occupied"', 'error');
      return;
    }

    try {
      setLoading(true);
      const propertyId = editingProperty.ID || editingProperty.id;
      await salesManagerService.updateProperty(propertyId, updateData);
      addNotification('Property updated successfully', 'success');
      setShowEditPropertyModal(false);
      setEditingProperty(null);
      setSelectedPropertyType('');
      await loadData();
    } catch (error) {
      console.error('Error updating property:', error);
      addNotification(error.message || 'Failed to update property', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (loading) {
      return <div className="sa-table-empty">Loading overview data...</div>;
    }

    const data = overviewData || {
      globalOccupancyRate: 0,
      totalProperties: 0,
      occupiedProperties: 0,
      vacantProperties: 0,
      totalActiveTenants: 0,
      numberOfUnpaidAccounts: 0,
      totalUnpaidRentAmount: 0,
      // Legacy field names for backward compatibility
      occupancyRate: 0,
      activeClients: 0,
      unpaidCount: 0,
      unpaidAmount: 0,
    };

    // Calculate actual metrics from loaded data
    const totalPropertiesCount = properties.length || data.totalProperties || 0;
    const occupiedCount = properties.filter(p => (p.status || p.Status || '').toLowerCase() === 'occupied').length || data.occupiedProperties || 0;
    const vacantCount = properties.filter(p => (p.status || p.Status || '').toLowerCase() === 'vacant').length || data.vacantProperties || 0;
    const actualOccupancyRate = totalPropertiesCount > 0 ? (occupiedCount / totalPropertiesCount * 100) : (data.globalOccupancyRate || data.occupancyRate || 0);
    
    // Use enhanced fields if available, fallback to legacy, then fallback to calculated values
    const occupancyRate = data.globalOccupancyRate || data.occupancyRate || actualOccupancyRate;
    const activeTenants = data.totalActiveTenants || data.activeClients || clients.filter(c => (c.status || c.Status || '').toLowerCase() === 'active').length || 0;
    const unpaidCount = data.numberOfUnpaidAccounts || data.unpaidCount || unpaidRents.length || 0;
    const unpaidAmount = data.totalUnpaidRentAmount || data.unpaidAmount || unpaidRents.reduce((sum, r) => sum + (r.amount || r.Amount || 0), 0) || 0;
    
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // Use historical data from backend if available, otherwise calculate from current data
    let chartData = [];
    if (data.historicalData && Array.isArray(data.historicalData) && data.historicalData.length > 0) {
      chartData = data.historicalData;
    } else {
      // Fallback: Calculate historical occupancy data for the last 6 months
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });
        
        // Use current occupancy rate for all months (fallback)
        chartData.push({
          month: monthName,
          occupancyRate: Math.round(actualOccupancyRate * 10) / 10,
          activeTenants: activeTenants
        });
      }
    }

    return (
      <div className="sa-overview-page">
        <div className="sa-overview-top">
          <div className="sa-overview-chart-card">
            <div className="sa-card-header">
              <h2>Sales Manager Dashboard</h2>
              <span className="sa-card-subtitle">Welcome, {currentUser?.name || currentUser?.Name || 'Sales Manager'}!</span>
            </div>
            <div className="sa-mini-legend">
              <span className="sa-legend-item sa-legend-expected">Occupancy Rate (%)</span>
              <span className="sa-legend-item sa-legend-current">Active Tenants</span>
            </div>
            <div style={{ width: '100%', height: '200px', marginTop: '20px' }}>
              <ResponsiveContainer>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
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
                    label={{ value: 'Occupancy %', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#6b7280" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    label={{ value: 'Tenants', angle: 90, position: 'insideRight', style: { fill: '#6b7280' } }}
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
                      if (name === 'occupancyRate') return [`${value.toFixed(1)}%`, 'Occupancy Rate'];
                      if (name === 'activeTenants') return [value, 'Active Tenants'];
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
                    dataKey="occupancyRate"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorOccupancy)"
                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name="Occupancy Rate (%)"
                  />
                  <Area
                    yAxisId="right"
                    type="natural"
                    dataKey="activeTenants"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#colorTenants)"
                    dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name="Active Tenants"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            </div>

          <div className="sa-overview-metrics">
            <div className="sa-metric-card sa-metric-primary">
              <p className="sa-metric-label">Total Unpaid Amount</p>
              <p className="sa-metric-period">Outstanding Balance</p>
              <p className="sa-metric-value">
                {unpaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XOF
              </p>
          </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Active Tenants</p>
              <p className="sa-metric-number">
                {activeTenants}
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Occupancy Rate</p>
              <p className="sa-metric-value">
                {occupancyRate.toFixed(1)}%
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Unpaid Accounts</p>
              <p className="sa-metric-number">
                {unpaidCount}
              </p>
          </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Total Properties</p>
              <p className="sa-metric-number">
                {totalPropertiesCount}
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Occupied Properties</p>
              <p className="sa-metric-number">
                {occupiedCount}
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Vacant Properties</p>
              <p className="sa-metric-number">
                {vacantCount}
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
                overflowX: 'auto'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '24px',
                  flexWrap: 'nowrap',
                  overflowX: 'auto',
                  paddingBottom: '16px',
                  width: '100%'
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
                          minWidth: '350px',
                          maxWidth: '450px',
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
              </div>
            ) : (
              <div className="sa-banner-card">
                <div className="sa-banner-text">
                  <h3>Increase your sales</h3>
                  <p>
                    Discover the proven methods to skyrocket your sales! Unleash the
                    potential of your business and achieve remarkable growth.
                  </p>
                  <button className="sa-banner-button">Learn More</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sa-section-card">
          <div className="sa-section-header">
        <h3>Priority Alerts</h3>
            <p>Track urgent alerts and overdue payments.</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th />
                  <th>Alert</th>
                  <th>Property</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
          {alerts.length > 0 ? (
            alerts.filter(alert => alert.Urgency === 'urgent' || alert.Urgency === 'high').map(alert => (
                    <tr key={alert.ID}>
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{alert.Title || 'N/A'}</span>
                          <span className="sa-cell-sub">{alert.Message || 'N/A'}</span>
                </div>
                      </td>
                      <td>{alert.Property || 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${(alert.Urgency || 'normal').toLowerCase()}`}>
                          {alert.Urgency || 'Normal'}
                        </span>
                      </td>
                      <td>
                        <span className={`sa-status-pill ${(alert.Status || 'open').toLowerCase()}`}>
                          {alert.Status || 'Open'}
                        </span>
                      </td>
                      <td>
                        {alert.Amount ? `${alert.Amount.toLocaleString()} XOF` : '—'}
                      </td>
                    </tr>
            ))
          ) : (
                  <tr>
                    <td colSpan={6} className="sa-table-empty">
                      No priority alerts at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
  };

  const handleOpenOccupancyDetail = async (property) => {
    const propertyId = property.ID ?? property.id;
    if (!propertyId) return;
    setOccupancySelectedProperty(property);
    setOccupancyDetailView('detail');
    setOccupancyDetailData(null);
    setOccupancyDetailLoading(true);
    try {
      const data = await salesManagerService.getPropertyBuildingDetail(propertyId);
      setOccupancyDetailData(data);
    } catch (err) {
      console.error('Failed to load property occupancy detail:', err);
      addNotification('Could not load property details. It may have no units.', 'error');
      setOccupancyDetailData({ units: [], buildingName: property.Address || property.address || 'Property', totalApartments: 0, images: [] });
    } finally {
      setOccupancyDetailLoading(false);
    }
  };

  const renderOccupancy = () => {
    const totalProperties = properties.length;

    // Helper: filled units per property (from API or derived from status)
    const getFilledUnits = (property) => {
      const n = property.NumberOfUnits ?? property.numberOfUnits ?? 1;
      const filled = property.filledUnits ?? property.occupiedUnits ?? property.FilledUnits ?? property.OccupiedUnits;
      if (filled !== undefined && filled !== null) return Number(filled);
      const status = (property.Status || property.status || '').toLowerCase();
      if (n <= 1) return status === 'occupied' ? 1 : 0;
      return 0;
    };

    // Villas: filter by Type, then use units to determine occupied vs vacant
    const isVilla = (p) => (p.Type || p.type || '').toString().trim().toLowerCase() === 'villa';
    const villas = properties.filter(isVilla);
    const totalVillas = villas.length;
    const occupiedVillas = villas.filter(v => {
      const total = v.NumberOfUnits ?? v.numberOfUnits ?? 1;
      const filled = getFilledUnits(v);
      return total > 0 && filled >= total;
    }).length;
    const vacantVillas = villas.filter(v => {
      const total = v.NumberOfUnits ?? v.numberOfUnits ?? 1;
      const filled = getFilledUnits(v);
      return total === 0 || filled < total;
    }).length;
    const villaOccupancyRate = totalVillas > 0 ? Math.round((occupiedVillas / totalVillas) * 100) : 0;

    // All properties (for overall metrics)
    const occupiedProperties = properties.filter(p => {
      const total = p.NumberOfUnits ?? p.numberOfUnits ?? 1;
      const filled = getFilledUnits(p);
      return total > 0 && filled >= total;
    }).length;
    const vacantProperties = properties.filter(p => {
      const total = p.NumberOfUnits ?? p.numberOfUnits ?? 1;
      const filled = getFilledUnits(p);
      return total === 0 || filled < total;
    }).length;
    const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;

    // Occupancy detail view: single property overview (units, tenants, graph)
    if (occupancyDetailView === 'detail') {
      const detail = occupancyDetailData || {};
      const units = detail.units || [];
      const buildingName = detail.buildingName || occupancySelectedProperty?.Address || occupancySelectedProperty?.address || 'Property';
      const totalUnits = detail.totalApartments ?? units.length;
      const isUnitOccupied = (u) => (u.occupancyStatus || u.status || u.statut || '').toString().trim().toLowerCase() === 'occupied';
      const occupiedUnits = units.filter(isUnitOccupied);
      const vacantUnits = units.filter((u) => !isUnitOccupied(u));
      const occupiedCountDetail = occupiedUnits.length;
      const vacantCountDetail = vacantUnits.length;
      const occupancyRateDetail = totalUnits > 0 ? Math.round((occupiedCountDetail / totalUnits) * 100) : 0;
      const totalRent = occupiedUnits.reduce((sum, u) => sum + (Number(u.rentPrice) || Number(u.rent) || 0), 0);
      const pieData = [
        { name: 'Occupied', value: occupiedCountDetail, color: '#22c55e' },
        { name: 'Vacant', value: vacantCountDetail, color: '#94a3b8' },
      ].filter((d) => d.value > 0);

      return (
        <div className="sa-occupancy-page">
          <div className="sa-occupancy-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="sa-primary-cta" style={{ padding: '8px 12px' }} onClick={() => { setOccupancyDetailView('list'); setOccupancySelectedProperty(null); setOccupancyDetailData(null); }}>
              <ArrowLeft size={18} />
              Back
            </button>
            <div>
              <h2>Occupancy: {buildingName}</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Units, tenants and occupancy overview</p>
            </div>
          </div>
          {occupancyDetailLoading ? (
            <div className="sa-section-card" style={{ padding: '48px', textAlign: 'center' }}>
              <p className="sa-cell-sub" style={{ margin: 0 }}>Loading…</p>
            </div>
          ) : (
            <>
              <div className="sa-occupancy-metrics" style={{ marginTop: '20px' }}>
                <div className="sa-metric-card">
                  <p className="sa-metric-label">Total Units</p>
                  <p className="sa-metric-value">{totalUnits}</p>
                </div>
                <div className="sa-metric-card">
                  <p className="sa-metric-label">Occupied</p>
                  <p className="sa-metric-value">{occupiedCountDetail}</p>
                </div>
                <div className="sa-metric-card">
                  <p className="sa-metric-label">Vacant</p>
                  <p className="sa-metric-value">{vacantCountDetail}</p>
                </div>
                <div className="sa-metric-card">
                  <p className="sa-metric-label">Occupancy Rate</p>
                  <p className="sa-metric-value">{occupancyRateDetail}%</p>
                </div>
                <div className="sa-metric-card">
                  <p className="sa-metric-label">Total Rent (monthly)</p>
                  <p className="sa-metric-value">{totalRent.toLocaleString()} XOF</p>
                </div>
              </div>
              {pieData.length > 0 && (
                <div className="sa-section-card" style={{ marginTop: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0' }}>Occupancy</h3>
                  <div style={{ width: '100%', maxWidth: 340, height: 260, margin: '0 auto' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={72}>
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Units']} />
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              <div className="sa-section-card" style={{ marginTop: '20px' }}>
                <h3 style={{ margin: '0 0 12px 0' }}>Occupied units</h3>
                <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '0.875rem' }}>Units with current tenants</p>
                <div className="sa-table-wrapper">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>Unit</th>
                        <th>Tenant</th>
                        <th>Rent</th>
                        <th>Enter date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {occupiedUnits.length > 0 ? (
                        occupiedUnits.map((u, i) => {
                          const tenantName = u.tenant || u.Tenant || '';
                          return (
                          <tr key={u.id || i}>
                            <td>
                              {u.unitNumber || u.name || `Unit ${i + 1}`}
                              {tenantName ? <span style={{ color: '#6b7280', fontSize: '0.875rem' }}> – {tenantName}</span> : null}
                            </td>
                            <td>{tenantName || '—'}</td>
                            <td>{typeof u.rentPrice === 'number' ? u.rentPrice.toLocaleString() : u.rentPrice || u.rent || '—'} F CFA</td>
                            <td>{u.enterDate || '—'}</td>
                            <td><span className="sa-status-pill occupied">{u.status || u.statut || 'Occupied'}</span></td>
                          </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan={5} className="sa-table-empty">No occupied units</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="sa-section-card" style={{ marginTop: '20px' }}>
                <h3 style={{ margin: '0 0 12px 0' }}>Vacant units</h3>
                <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '0.875rem' }}>Available units</p>
                <div className="sa-table-wrapper">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>Unit</th>
                        <th>Rent</th>
                        <th>Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vacantUnits.length > 0 ? (
                        vacantUnits.map((u, i) => (
                          <tr key={u.id || i}>
                            <td>{u.unitNumber || u.name || `Unit ${i + 1}`}</td>
                            <td>{typeof u.rentPrice === 'number' ? u.rentPrice.toLocaleString() : u.rentPrice || u.rent || '—'} F CFA</td>
                            <td>{u.type || '—'}</td>
                            <td><span className="sa-status-pill vacant">{u.status || u.statut || 'Vacant'}</span></td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="sa-table-empty">No vacant units</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {totalUnits === 0 && (
                <div className="sa-section-card" style={{ marginTop: '20px', padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                  <p style={{ margin: 0 }}>This property has no units in the system yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    return (
      <div className="sa-occupancy-page">
        <div className="sa-occupancy-header">
          <div>
            <h2>Property Occupancy Overview</h2>
          <p>Monitor occupancy status and manage vacant properties</p>
          </div>
        </div>

        <div className="sa-occupancy-metrics">
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Properties</p>
            <p className="sa-metric-value">{totalProperties}</p>
            </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Villas</p>
            <p className="sa-metric-value">{totalVillas}</p>
            </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Tenants</p>
            <p className="sa-metric-value">{clients.length}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Occupied Properties</p>
            <p className="sa-metric-value">{occupiedProperties}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Vacant Properties</p>
            <p className="sa-metric-value">{vacantProperties}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Occupied Villas</p>
            <p className="sa-metric-value">{occupiedVillas}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Vacant Villas</p>
            <p className="sa-metric-value">{vacantVillas}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Occupancy Rate</p>
            <p className="sa-metric-value">{occupancyRate}%</p>
          </div>
        </div>

        <div className="sa-transactions-filters">
          <button className="sa-filter-button" onClick={() => {
            const filters = document.querySelector('.sa-property-filters');
            if (filters) filters.style.display = filters.style.display === 'none' ? 'flex' : 'none';
          }}>
            <Filter size={16} />
            Filter
          </button>
          <select 
            className="sa-filter-button"
            value={propertyStatusFilter}
            onChange={(e) => setPropertyStatusFilter(e.target.value)}
            style={{ padding: '8px 14px', cursor: 'pointer' }}
          >
            <option value="">All Status</option>
            <option value="Vacant">Vacant</option>
            <option value="Occupied">Occupied</option>
            </select>
          <select 
            className="sa-filter-button"
            value={propertyTypeFilter}
            onChange={(e) => setPropertyTypeFilter(e.target.value)}
            style={{ padding: '8px 14px', cursor: 'pointer' }}
          >
            <option value="">All Types</option>
            <option value="Apartment">Apartment</option>
            <option value="House">House</option>
            <option value="Condo">Condo</option>
            <option value="Studio">Studio</option>
            </select>
          <select 
            className="sa-filter-button"
            value={propertyUrgencyFilter}
            onChange={(e) => setPropertyUrgencyFilter(e.target.value)}
            style={{ padding: '8px 14px', cursor: 'pointer' }}
          >
            <option value="">All Urgency</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
            </select>
        </div>

        <div className="sa-section-card">
          <div className="sa-section-header">
            <div>
              <h3>Properties</h3>
              <p>Manage all properties and their occupancy status.</p>
            </div>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
            <thead>
              <tr>
                  <th />
                  <th>Property</th>
                <th>Type</th>
                <th>Status</th>
                <th>Units (filled / total)</th>
                <th>Property Type</th>
                <th>Rent</th>
                <th>Urgency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.length > 0 ? (
                  properties.map(property => {
                    const propertyId = property.ID || property.id;
                    const totalUnits = property.NumberOfUnits ?? property.numberOfUnits ?? 1;
                    const filledUnits = getFilledUnits(property);
                    const remaining = Math.max(0, totalUnits - filledUnits);
                    const isFull = totalUnits > 0 && filledUnits >= totalUnits;
                    return (
                      <tr
                        key={propertyId}
                        onClick={() => handleOpenOccupancyDetail(property)}
                        style={{ cursor: 'pointer' }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenOccupancyDetail(property); } }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" />
                        </td>
                        <td>
                          <div className="sa-cell-main">
                            <span className="sa-cell-title">{property.Address || property.address || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="sa-cell-main">
                            <span className="sa-cell-title">{property.Type || property.type || 'N/A'}</span>
                            {property.BuildingType || property.buildingType ? (
                              <span className="sa-cell-sub">({property.BuildingType || property.buildingType})</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <span className={`sa-status-pill ${isFull ? 'occupied' : 'vacant'}`}>
                            {isFull ? 'Occupied' : (remaining > 0 ? 'Partially filled' : (property.Status || property.status || 'Unknown'))}
                      </span>
                    </td>
                        <td>
                          <div className="sa-cell-main">
                            <span className="sa-cell-title">{filledUnits} / {totalUnits}</span>
                            {remaining > 0 && (
                              <span className="sa-cell-sub" style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}>
                                {remaining} remaining
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="sa-cell-main">
                            <span className="sa-cell-title">{property.PropertyType || property.propertyType || 'N/A'}</span>
                          </div>
                        </td>
                        <td>{property.Rent || property.rent ? `${property.Rent || property.rent} XOF/month` : 'N/A'}</td>
                        <td>
                          {property.Urgency || property.urgency ? (
                            <span className={`sa-status-pill ${(property.Urgency || property.urgency).toLowerCase()}`}>
                              {property.Urgency || property.urgency}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                          <button
                            className="sa-action-button"
                            onClick={() => openEditPropertyModal(property)}
                            title="Edit Property"
                          >
                            ✏️
                      </button>
                    </td>
                  </tr>
                    );
                  })
              ) : (
                <tr>
                    <td colSpan={9} className="sa-table-empty">No properties found. Create your first property to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    );
  };

  // Property Management - Owners list, owner assets (renting/selling), building payment
    const getOwnerId = (owner) => owner.id || owner.ID;
  const getPropertyOwnerId = (property) => property.LandlordID || property.landlordId || property.landlordID || property.landlord_id || property.LandlordId;

  const handleSeeOwner = async (owner) => {
      const ownerId = getOwnerId(owner);
    if (!ownerId) return;
    setPmLoading(true);
    try {
      const data = await salesManagerService.getOwnerAssets(ownerId);
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

  const handleViewBuilding = async (property) => {
    const propId = property.id || property.ID;
    if (!propId) return;
    setPmLoading(true);
    try {
      const data = await salesManagerService.getPropertyBuildingDetail(propId);
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

  const handleViewVilla = async (property) => {
    const propId = property.id || property.ID;
    if (!propId) return;
    setPmLoading(true);
    try {
      const data = await salesManagerService.getPropertyBuildingDetail(propId);
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

  const renderPropertyManagement = () => {
    // Filter owners by search (member name)
    const searchLower = (propertyManagementSearch || '').trim().toLowerCase();
    const filteredOwners = searchLower
      ? owners.filter((o) => (o.name || o.Name || '').toLowerCase().includes(searchLower))
      : owners;

    // Building management view – "Building X management" (image, total apartments, ADD APPARTMENT, table)
    if (pmView === 'building-detail' && buildingDetail) {
      const units = buildingDetail.units || [];
      const totalApartments = buildingDetail.totalApartments ?? units.length;
      const images = buildingDetail.images || [];
      const firstImage = images[0];
    return (
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
            <button type="button" className="sa-primary-cta" onClick={() => setShowAddApartmentModal(true)}>ADD APPARTMENT</button>
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
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
                            type="button"
                            className="table-action-button edit"
                            style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px' }}
                            onClick={() => { setViewingUnit(row); setShowViewApartmentModal(true); }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="table-action-button contact"
                            style={{ padding: '6px 12px' }}
                            onClick={() => { setEditingUnit(row); setEditApartmentPictures(parseUnitPictures(row.picture)); setEditApartmentStatusChoice((row.status || row.statut || 'Vacant').toString()); setShowEditApartmentModal(true); }}
                            title="Edit apartment details"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="table-action-button"
                            style={{ background: '#ef4444', color: '#fff', padding: '6px 12px' }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const label = row.unitNumber || row.name || `Apartment ${i + 1}`;
                              if (!window.confirm(`Delete "${label}"? This will remove the unit. If it had a tenant, they will be set to Inactive. This cannot be undone.`)) return;
                              setPmLoading(true);
                              try {
                                await salesManagerService.deletePropertyUnit(pmPropertyId, row.id);
                                addNotification('Unit deleted successfully', 'success');
                                const data = await salesManagerService.getPropertyBuildingDetail(pmPropertyId);
                                setBuildingDetail(data);
                              } catch (err) {
                                addNotification(err.message || 'Failed to delete unit', 'error');
                              } finally {
                                setPmLoading(false);
                              }
                            }}
                            disabled={pmLoading}
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
          </div>
        </div>
      );
    }

    // Villa management view – "Villa X management" (same layout as building)
    if (pmView === 'villa-detail' && buildingDetail) {
      const units = buildingDetail.units || [];
      const totalApartments = buildingDetail.totalApartments ?? units.length;
      const images = buildingDetail.images || [];
      const firstImage = images[0];
      return (
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
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="table-action-button edit"
                            style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px' }}
                            onClick={() => { setViewingUnit(row); setShowViewApartmentModal(true); }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="table-action-button contact"
                            style={{ padding: '6px 12px' }}
                            onClick={() => { setEditingUnit(row); setEditApartmentPictures(parseUnitPictures(row.picture)); setEditApartmentStatusChoice((row.status || row.statut || 'Vacant').toString()); setShowEditApartmentModal(true); }}
                            title="Edit apartment details"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="table-action-button"
                            style={{ background: '#ef4444', color: '#fff', padding: '6px 12px' }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const label = row.unitNumber || row.name || `Unit ${i + 1}`;
                              if (!window.confirm(`Delete "${label}"? This will remove the unit. If it had a tenant, they will be set to Inactive. This cannot be undone.`)) return;
                              setPmLoading(true);
                              try {
                                await salesManagerService.deletePropertyUnit(pmPropertyId, row.id);
                                addNotification('Unit deleted successfully', 'success');
                                const data = await salesManagerService.getPropertyBuildingDetail(pmPropertyId);
                                setBuildingDetail(data);
                              } catch (err) {
                                addNotification(err.message || 'Failed to delete unit', 'error');
                              } finally {
                                setPmLoading(false);
                              }
                            }}
                            disabled={pmLoading}
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
          </div>
        </div>
      );
    }

    // Land detail view (read-only summary)
    if (pmView === 'land-detail' && landDetail) {
      return (
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
      );
    }

    // Owner assets view – "Owner X assets management" with ADD BUILDING / VILLA / LAND / APPARTMENT and single table
    if (pmView === 'owner-detail' && ownerAssets) {
      const assets = ownerAssets.assets || [];
      const handleAssetClick = (asset) => {
        const type = (asset.type || '').toLowerCase();
        if (type === 'building') handleViewBuilding(asset);
        else if (type === 'villa') handleViewVilla(asset);
        else if (type === 'land') handleViewLand(asset);
        else handleViewBuilding(asset);
      };
      return (
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
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button type="button" className="sa-primary-cta" onClick={() => setShowAddBuildingModal(true)}>ADD BUILDING</button>
            <button type="button" className="sa-primary-cta" onClick={() => setShowAddApartmentModal(true)}>ADD APPARTMENT</button>
            <button type="button" className="sa-primary-cta" onClick={() => setShowAddVillaModal(true)}>ADD VILLA</button>
            <button type="button" className="sa-primary-cta" onClick={() => setShowAddLandModal(true)}>ADD LAND</button>
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
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="table-action-button edit"
                            style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px' }}
                            onClick={async () => {
                              setPmLoading(true);
                              try {
                                const full = await salesManagerService.getProperty(row.id);
                                setSelectedPropertyDetail(full);
                              } catch (err) {
                                addNotification('Failed to load property details', 'error');
                              } finally {
                                setPmLoading(false);
                              }
                            }}
                            disabled={pmLoading}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="table-action-button edit"
                            style={{ background: '#22c55e', color: '#fff', padding: '6px 12px' }}
                            onClick={() => openEditPropertyModal(row)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="table-action-button"
                            style={{ background: '#ef4444', color: '#fff', padding: '6px 12px' }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const name = row.name || row.building || row.address || 'this property';
                              if (!window.confirm(`Delete "${name}"? This will remove the property and all its units. This action cannot be undone.`)) return;
                              setPmLoading(true);
                              try {
                                await salesManagerService.deleteProperty(row.id);
                                addNotification('Property deleted successfully', 'success');
                                const data = await salesManagerService.getOwnerAssets(pmOwnerId);
                                setOwnerAssets(data);
                                await loadData();
                              } catch (err) {
                                addNotification(err.message || 'Failed to delete property', 'error');
                              } finally {
                                setPmLoading(false);
                              }
                            }}
                            disabled={pmLoading}
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
            {assets.length === 0 && !pmLoading && (
              <p className="sa-table-empty">No assets for this owner.</p>
            )}
          </div>
        </div>
      );
    }

    // Property Management entry – columns: Name, Total of assets, Property for sell, Property for manage, Occupancy, Income (this month)
    const unassignedProperties = properties.filter((p) => !getPropertyOwnerId(p));
    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header">
          <div>
            <h2>PROPERTY MANAGEMENT</h2>
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
                  const totalOfAssets = owner.totalOfAssets ?? owner.numberOfAssetsManaged ?? 0;
                  const propertyForSell = owner.propertyForSell ?? 0;
                  const propertyForManage = owner.propertyForManage ?? 0;
                  const occupancy = owner.occupancy ?? '0/0';
                  const incomeThisMonth = owner.incomeThisMonth ?? owner.revenue ?? 0;
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
                      No owners found. Ask the Agency Director to add property owners.
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
                      onClick={() => setSelectedPropertyDetail(property)}
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
                        <div className="sa-row-actions">
                          <button type="button" className="table-action-button edit" onClick={() => openEditPropertyModal(property)}>Edit</button>
                          <button type="button" className="table-action-button contact" onClick={() => openScheduleVisit(property.Address || property.address)}>Schedule</button>
                        </div>
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
  }; // end renderPropertyManagement

  // Sales Tracking - Properties that are strictly for sale
  const renderSalesTracking = () => {
    const normalizeType = (type) => (type || '').toLowerCase();

    const filteredSales = salesProperties.filter((property) => {
      if (!salesTypeFilter) return true;
      return normalizeType(property.Type || property.type) === salesTypeFilter;
    });

    const totalSales = salesProperties.length;
    const typeCounts = {
      house: salesProperties.filter((p) => normalizeType(p.Type || p.type) === 'house').length,
      apartment: salesProperties.filter((p) => normalizeType(p.Type || p.type) === 'apartment')
        .length,
      villa: salesProperties.filter((p) => normalizeType(p.Type || p.type) === 'villa').length,
      land: salesProperties.filter((p) => normalizeType(p.Type || p.type) === 'land').length,
    };

    return (
      <div className="sa-occupancy-page">
        <div className="sa-occupancy-header">
          <div>
            <h2>Sales Tracking</h2>
            <p>Monitor all properties that are strictly for sale.</p>
          </div>
        </div>

        <div className="sa-occupancy-metrics">
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total For Sale</p>
            <p className="sa-metric-value">{totalSales}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Houses</p>
            <p className="sa-metric-value">{typeCounts.house}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Apartments</p>
            <p className="sa-metric-value">{typeCounts.apartment}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Villas</p>
            <p className="sa-metric-value">{typeCounts.villa}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Land</p>
            <p className="sa-metric-value">{typeCounts.land}</p>
          </div>
        </div>

        <div className="sa-transactions-filters">
          <button
            className="sa-filter-button"
            onClick={() => setSalesTypeFilter('')}
          >
            All Types
          </button>
          <button
            className={`sa-filter-button ${salesTypeFilter === 'house' ? 'active' : ''}`}
            onClick={() => setSalesTypeFilter('house')}
          >
            Houses
          </button>
          <button
            className={`sa-filter-button ${salesTypeFilter === 'apartment' ? 'active' : ''}`}
            onClick={() => setSalesTypeFilter('apartment')}
          >
            Apartments
          </button>
          <button
            className={`sa-filter-button ${salesTypeFilter === 'villa' ? 'active' : ''}`}
            onClick={() => setSalesTypeFilter('villa')}
          >
            Villas
          </button>
          <button
            className={`sa-filter-button ${salesTypeFilter === 'land' ? 'active' : ''}`}
            onClick={() => setSalesTypeFilter('land')}
          >
            Land
          </button>
        </div>

        <div className="sa-section-card">
          <div className="sa-section-header">
            <h3>Properties for Sale</h3>
            <p>All houses, apartments, villas, and land that are currently for sale.</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Type</th>
                  <th>Bedrooms</th>
                  <th>Bathrooms</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((property, index) => (
                  <tr key={property.id || index}>
                    <td>{property.address || property.Address || 'N/A'}</td>
                    <td>{property.type || property.Type || 'N/A'}</td>
                    <td>{property.bedrooms || property.Bedrooms || 0}</td>
                    <td>{property.bathrooms || property.Bathrooms || 0}</td>
                    <td>{property.price || property.Price || 'N/A'}</td>
                    <td>{property.status || property.Status || 'N/A'}</td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="sa-table-empty">
                      No properties for sale found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Get unique properties from clients for filter dropdown
  const uniqueProperties = useMemo(() => {
    const props = new Set();
    clients.forEach(client => {
      const p = client.Property || client.property;
      if (p) props.add(p);
    });
    return Array.from(props).sort();
  }, [clients]);

  // Normalize status for filter comparison (e.g. "Waiting List" and "waiting list" match)
  const normalizeStatus = (s) => (s || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
  const statusMatches = (clientStatus, filterStatus) => {
    const a = normalizeStatus(clientStatus);
    const b = normalizeStatus(filterStatus);
    return a === b || a.replace(/\s/g, '') === b.replace(/\s/g, '');
  };

  // Filter clients based on filters
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Status filter
      if (clientStatusFilter) {
        const clientStatus = (client.Status || client.status || '').toString();
        if (!statusMatches(clientStatus, clientStatusFilter)) return false;
      }

      // Property filter (substring match)
      if (clientPropertyFilter) {
        const clientProperty = ((client.Property || client.property) || '').toLowerCase();
        const filterProperty = clientPropertyFilter.toLowerCase().trim();
        if (!clientProperty.includes(filterProperty)) return false;
      }

      // Search text filter (name, email, phone)
      if (clientSearchText) {
        const searchLower = clientSearchText.toLowerCase().trim();
        const name = ((client.Name || client.name) || '').toLowerCase();
        const email = ((client.Email || client.email) || '').toLowerCase();
        const phone = ((client.Phone || client.phone) || '').toLowerCase();
        if (!name.includes(searchLower) && !email.includes(searchLower) && !phone.includes(searchLower)) return false;
      }

      return true;
    });
  }, [clients, clientStatusFilter, clientPropertyFilter, clientSearchText]);

  const renderTenantDetail = () => {
    if (tenantDetailLoading) {
      return (
        <div className="sa-clients-page">
          <div className="sa-section-card" style={{ padding: '48px', textAlign: 'center' }}>
            <p className="sa-cell-sub" style={{ margin: 0 }}>Loading tenant details…</p>
          </div>
        </div>
      );
    }
    const c = tenantDetail?.client;
    if (!c) {
      return (
        <div className="sa-clients-page">
          <button
            type="button"
            className="sa-outline-button sa-tenant-detail-back-btn"
            onClick={() => { setSelectedTenantId(null); setTenantDetail(null); }}
            style={{ marginBottom: '16px' }}
          >
            <ArrowLeft size={16} />
            Back to list
          </button>
          <div className="sa-section-card">
            <p className="sa-cell-sub" style={{ margin: 0 }}>Tenant not found or failed to load.</p>
          </div>
        </div>
      );
    }
    const prop = tenantDetail?.property;
    const alertList = Array.isArray(tenantDetail?.alerts) ? tenantDetail.alerts : [];
    const maintenancesList = Array.isArray(tenantDetail?.maintenances) ? tenantDetail.maintenances : [];
    const paymentsList = Array.isArray(tenantDetail?.payments) ? tenantDetail.payments : [];
    const privateNotesList = Array.isArray(tenantDetail?.privateNotes) ? tenantDetail.privateNotes : [];
    const name = c.Name || c.name || 'N/A';

    const handleAddPrivateNote = async () => {
      const note = (privateNoteInput || '').trim();
      if (!note || !selectedTenantId) return;
      setAddingNote(true);
      try {
        await salesManagerService.addClientNote(selectedTenantId, { note });
        setPrivateNoteInput('');
        const data = await salesManagerService.getClient(selectedTenantId);
        setTenantDetail(data);
        addNotification('Note added', 'success');
      } catch (err) {
        addNotification(err?.message || 'Failed to add note', 'error');
      } finally {
        setAddingNote(false);
      }
    };

    const handleQuickAction = (action) => {
      addNotification(`${action} – feature coming soon`, 'info');
    };
    const email = c.Email || c.email || '';
    const phone = c.Phone || c.phone || '';
    const status = c.Status || c.status || 'Unknown';
    const propertyAddr = c.Property || c.property || '—';
    const unitNumber = c.UnitNumber ?? c.unitNumber ?? '—';
    const amount = c.Amount ?? c.amount ?? 0;
    const lastPayment = c.LastPayment ?? c.lastPayment;
    const createdAt = c.CreatedAt ?? c.createdAt;
    const updatedAt = c.UpdatedAt ?? c.updatedAt;

    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header" style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className="sa-outline-button sa-tenant-detail-back-btn"
            onClick={() => { setSelectedTenantId(null); setTenantDetail(null); }}
          >
            <ArrowLeft size={16} />
            Back to list
          </button>
        </div>

        <div className="sa-section-card" style={{ marginBottom: '24px' }}>
          <div className="sa-tenant-detail-hero">
            <div className="sa-tenant-detail-avatar">
              {(name || 'T').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{name}</h2>
              <span className={`sa-status-pill ${(status || '').toLowerCase().replace(/\s+/g, '-')}`} style={{ marginRight: '8px' }}>
                {status}
              </span>
              {propertyAddr && propertyAddr !== '—' && (
                <span className="sa-tenant-detail-meta">
                  <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {propertyAddr}{unitNumber && unitNumber !== '—' ? ` · ${unitNumber}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="sa-tenant-detail-grid">
          <div className="sa-section-card sa-tenant-detail-card">
            <h3>
              <Users size={18} />
              Personal information
            </h3>
            <dl className="sa-tenant-detail-dl">
              <div>
                <dt>Name</dt>
                <dd>{name}</dd>
              </div>
              {email && (
                <div>
                  <dt>Email</dt>
                  <dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} /> {email}
                  </dd>
                </div>
              )}
              {phone && (
                <div>
                  <dt>Phone</dt>
                  <dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} /> {phone}
                  </dd>
                </div>
              )}
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={`sa-status-pill ${(status || '').toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>
                </dd>
              </div>
              {createdAt && (
                <div>
                  <dt>Member since</dt>
                  <dd>{new Date(createdAt).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
            <h4 style={{ margin: '16px 0 8px', fontSize: '0.9rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileCheck size={16} />
              Files & documents
            </h4>
            <p className="sa-cell-sub" style={{ margin: 0 }}>
              No files uploaded yet. ID and other tenant documents can be added here for viewing.
            </p>
          </div>

          <div className="sa-section-card sa-tenant-detail-card">
            <h3>
              <DollarSign size={18} />
              Rent & payment
            </h3>
            <dl className="sa-tenant-detail-dl">
              <div>
                <dt>Property</dt>
                <dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} /> {propertyAddr}
                </dd>
              </div>
              {unitNumber && unitNumber !== '—' && (
                <div>
                  <dt>Unit</dt>
                  <dd>{unitNumber}</dd>
                </div>
              )}
              <div>
                <dt>Monthly rent</dt>
                <dd className="sa-tenant-detail-value-bold">{Number(amount).toLocaleString()} XOF</dd>
              </div>
              <div>
                <dt>Last payment</dt>
                <dd>{lastPayment ? new Date(lastPayment).toLocaleDateString() : '—'}</dd>
              </div>
            </dl>
          </div>

          {prop && (
            <div className="sa-section-card sa-tenant-detail-card">
              <h3>
                <Building size={18} />
                Property details
              </h3>
              <dl className="sa-tenant-detail-dl">
                <div>
                  <dt>Type</dt>
                  <dd>{prop.type || prop.Type || '—'}</dd>
                </div>
                {(prop.bedrooms ?? prop.Bedrooms) != null && (
                  <div>
                    <dt>Bedrooms</dt>
                    <dd>{prop.bedrooms ?? prop.Bedrooms}</dd>
                  </div>
                )}
                {(prop.bathrooms ?? prop.Bathrooms) != null && (
                  <div>
                    <dt>Bathrooms</dt>
                    <dd>{prop.bathrooms ?? prop.Bathrooms}</dd>
                  </div>
                )}
                <div>
                  <dt>Property status</dt>
                  <dd>
                    <span className={`sa-status-pill ${(prop.status || prop.Status || '').toLowerCase()}`}>
                      {prop.status || prop.Status || '—'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="sa-section-card sa-tenant-detail-card" style={alertList.length ? undefined : { gridColumn: '1 / -1' }}>
            <h3>
              <AlertTriangle size={18} />
              Alerts & activity
            </h3>
            {alertList.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alertList.map((alert, idx) => (
                  <li key={alert.ID || alert.id || idx} className="sa-tenant-detail-alert-item">
                    <div className="sa-tenant-detail-alert-title">{alert.Title || alert.title || 'Alert'}</div>
                    {alert.Message && <div className="sa-cell-sub" style={{ marginBottom: '4px' }}>{alert.Message}</div>}
                    <div className="sa-tenant-detail-alert-meta">
                      {(alert.Urgency || alert.urgency || '').toLowerCase()} · {alert.Status || alert.status || 'Open'}
                      {alert.Amount != null && ` · ${Number(alert.Amount).toLocaleString()} XOF`}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sa-cell-sub">No alerts for this tenant.</p>
            )}
          </div>

          <div className="sa-section-card sa-tenant-detail-card">
            <h3>
              <Wrench size={18} />
              Maintenances requested
            </h3>
            {maintenancesList.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {maintenancesList.map((m, idx) => {
                  const mid = m.ID ?? m.id;
                  const openMaintenanceDetail = () => {
                    if (mid == null) return;
                    setMaintenanceDetailLoading(true);
                    setMaintenanceDetail(null);
                    salesManagerService.getMaintenance(mid)
                      .then((data) => setMaintenanceDetail(data))
                      .catch((err) => addNotification(err?.message || 'Failed to load maintenance details', 'error'))
                      .finally(() => setMaintenanceDetailLoading(false));
                  };
                  return (
                    <li
                      key={mid ?? idx}
                      className="sa-tenant-detail-alert-item"
                      role="button"
                      tabIndex={0}
                      onClick={openMaintenanceDetail}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMaintenanceDetail(); } }}
                      style={{ cursor: mid != null ? 'pointer' : 'default' }}
                    >
                      <div className="sa-tenant-detail-alert-title">{m.Issue || m.issue || 'Maintenance'}</div>
                      <div className="sa-tenant-detail-alert-meta">
                        {(m.Status || m.status || '—')} · {(m.Priority || m.priority || '—')}
                        {m.CreatedAt && ` · ${new Date(m.CreatedAt).toLocaleDateString()}`}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="sa-cell-sub">No maintenance requests for this tenant.</p>
            )}
          </div>

          <div className="sa-section-card sa-tenant-detail-card">
            <h3>
              <Receipt size={18} />
              Recent payment history
            </h3>
            {paymentsList.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {paymentsList.slice(0, 10).map((p, idx) => (
                  <li key={p.ID || p.id || idx} className="sa-tenant-detail-alert-item" style={{ borderLeftColor: (p.Status || p.status) === 'Approved' ? '#16a34a' : '#f59e0b' }}>
                    <div className="sa-tenant-detail-alert-title">
                      {Number(p.Amount ?? p.amount ?? 0).toLocaleString()} XOF · {(p.Status || p.status || '—')}
                    </div>
                    <div className="sa-tenant-detail-alert-meta">
                      {p.Date ? new Date(p.Date).toLocaleDateString() : (p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString() : '—')}
                      {(p.Method || p.method) && ` · ${p.Method || p.method}`}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sa-cell-sub">No payment history for this tenant.</p>
            )}
          </div>

          <div className="sa-section-card sa-tenant-detail-card">
            <h3>
              <StickyNote size={18} />
              Private notes
            </h3>
            <textarea
              value={privateNoteInput}
              onChange={(e) => setPrivateNoteInput(e.target.value)}
              placeholder="Add a note for future reference (visible only to sales managers)..."
              rows={2}
              className="sa-tenant-detail-notes-input"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.875rem', resize: 'vertical', marginBottom: '10px' }}
            />
            <button
              type="button"
              className="sa-primary-cta"
              onClick={handleAddPrivateNote}
              disabled={!privateNoteInput.trim() || addingNote}
              style={{ marginBottom: '16px' }}
            >
              {addingNote ? 'Adding…' : 'Add note'}
            </button>
            {privateNotesList.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {privateNotesList.map((n) => (
                  <li key={n.id ?? n.ID} className="sa-tenant-detail-alert-item" style={{ borderLeftColor: '#6366f1' }}>
                    <div className="sa-tenant-detail-alert-title">{n.note ?? n.Note}</div>
                    <div className="sa-tenant-detail-alert-meta">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : (n.CreatedAt ? new Date(n.CreatedAt).toLocaleString() : '')}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sa-cell-sub">No private notes yet.</p>
            )}
          </div>

          <div className="sa-section-card sa-tenant-detail-card">
            <h3>
              <AlertCircle size={18} />
              Quick actions
            </h3>
            <div className="sa-tenant-detail-quick-actions">
              <button
                type="button"
                className="sa-outline-button"
                onClick={() => handleQuickAction('Generate Receipt')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Receipt size={16} />
                Generate Receipt
              </button>
              <button
                type="button"
                className="sa-outline-button"
                onClick={() => handleQuickAction('Send Reminder SMS')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <MessageSquare size={16} />
                Send Reminder SMS
              </button>
              <button
                type="button"
                className="sa-outline-button"
                onClick={() => handleQuickAction('Report Incident')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <AlertCircle size={16} />
                Report Incident
              </button>
            </div>
          </div>
        </div>

        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-tenant-detail-footer">
            <span className="sa-tenant-detail-updated">
              Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}
            </span>
            <button
              type="button"
              className="sa-primary-cta"
              onClick={() => {
                setEditingClient(c);
                setShowEditClientModal(true);
                setSelectedTenantId(null);
                setTenantDetail(null);
              }}
            >
              Edit tenant
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderClients = () => (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Tenant List</h2>
          <p>{filteredClients.length} results found</p>
        </div>
        <div className="sa-clients-header-right">
          <button
            className="sa-primary-cta"
            onClick={() => {
              setImportMode('manual');
              setExcelFile(null);
              setShowTenantCreationModal(true);
            }}
          >
            <Plus size={16} />
            Add Tenant
          </button>
          <button
            type="button"
            className="sa-primary-cta secondary"
            style={{ marginLeft: '8px' }}
            onClick={() => {
              setImportMode('excel');
              setExcelFile(null);
              setShowTenantCreationModal(true);
            }}
          >
            <FileSpreadsheet size={16} style={{ marginRight: '4px' }} />
            Import from Excel
          </button>
          <button className="sa-sort-button">Sort: Creation Date</button>
          <button className="sa-date-button">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </button>
        </div>
      </div>

      <div className="sa-overview-metrics">
        <div className="sa-metric-card">
          <p className="sa-metric-label">Active Tenants</p>
          <p className="sa-metric-number">
            {filteredClients.filter(client => (client.Status || client.status || '').toString().toLowerCase() === 'active').length}
            <span className="sa-metric-trend positive">+1.5%</span>
          </p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Overdue Accounts</p>
          <p className="sa-metric-number">
            {filteredClients.filter(client => (client.Status || client.status || '').toString().toLowerCase() === 'overdue').length}
            <span className="sa-metric-trend negative">-1.5%</span>
          </p>
          </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Waiting List</p>
          <p className="sa-metric-value">
            {filteredClients.filter(client => {
              const s = (client.Status || client.status || '').toString().toLowerCase().replace(/\s+/g, ' ');
              return s === 'waiting list' || s === 'waitinglist';
            }).length}
          </p>
          </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Total Monthly Revenue</p>
          <p className="sa-metric-value">
              {filteredClients.reduce(
                (sum, client) => sum + (client.Amount || client.amount || 0),
                0
              ).toLocaleString()} XOF
          </p>
        </div>
      </div>

      <div className="sa-transactions-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <Filter size={16} style={{ color: '#6b7280' }} />
        <select
          value={clientStatusFilter}
          onChange={(e) => setClientStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '140px', fontSize: '0.875rem' }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Overdue">Overdue</option>
          <option value="Waiting List">Waiting List</option>
          <option value="Inactive">Inactive</option>
        </select>
        <input
          type="text"
          placeholder="Search by name, email, phone"
          value={clientSearchText}
          onChange={(e) => setClientSearchText(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '200px', fontSize: '0.875rem' }}
          aria-label="Search tenants"
        />
        <input
          type="text"
          placeholder="Filter by property"
          value={clientPropertyFilter}
          onChange={(e) => setClientPropertyFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '180px', fontSize: '0.875rem' }}
          aria-label="Filter by property"
        />
        {(clientStatusFilter || clientPropertyFilter || clientSearchText) && (
          <button
            type="button"
            className="action-button secondary"
            style={{ padding: '8px 14px', fontSize: '0.875rem' }}
            onClick={() => {
              setClientStatusFilter('');
              setClientPropertyFilter('');
              setClientSearchText('');
            }}
          >
            Clear filters
        </button>
        )}
      </div>

      <div className="sa-section-card">
        <div className="sa-section-header">
          <h3>Tenants</h3>
          <p>Manage all tenant profiles and track their status.</p>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
          <thead>
            <tr>
                <th />
                <th>Client</th>
              <th>Property</th>
              <th>Status</th>
              <th>Last Payment</th>
              <th>Amount</th>
              <th>Contact</th>
                <th />
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map(client => {
                const clientId = client.id ?? client.ID;
                return (
              <tr
                key={clientId ?? client.Email ?? client.email}
                onClick={() => clientId != null && setSelectedTenantId(clientId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (clientId != null) setSelectedTenantId(clientId); } }}
                style={{ cursor: clientId != null ? 'pointer' : 'default' }}
              >
                <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" />
                </td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client.Name || client.name || 'N/A'}</span>
                        <span className="sa-cell-sub">{client.Email || client.email || 'N/A'}</span>
                  </div>
                </td>
                    <td>{client.Property || client.property || 'N/A'}</td>
                    <td>
                      <span className={`sa-status-pill ${(client.Status || client.status || 'unknown').toLowerCase().replace(' ', '-')}`}>
                        {client.Status || client.status || 'Unknown'}
                      </span>
                    </td>
                    <td>{(client.LastPayment || client.lastPayment) ? new Date(client.LastPayment || client.lastPayment).toLocaleDateString() : 'N/A'}</td>
                    <td>{(client.Amount || client.amount || 0).toLocaleString()} XOF</td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client.Phone || client.phone || 'N/A'}</span>
                        <span className="sa-cell-sub">{client.Email || client.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="sa-row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="sa-icon-button" onClick={() => handleEditClient(client)} title="Edit">✏️</button>
                </td>
              </tr>
                );
              })
            ) : (
              <tr>
                  <td colSpan={8} className="sa-table-empty">No tenants found. Start the backend to see real data.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Waiting List Section */}
      {waitingListClients.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '24px' }}>
          <div className="sa-section-header">
            <h3>Waiting List Tenants</h3>
            <p>Tenants waiting for available properties.</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th />
                  <th>Tenant</th>
                  <th>Contact</th>
                  <th>Preferred Property</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {waitingListClients.map(client => (
                  <tr key={client.ID || client.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client.Name || client.name || 'N/A'}</span>
                        <span className="sa-cell-sub">{client.Email || client.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{client.Phone || client.phone || 'N/A'}</td>
                    <td>{client.Property || client.property || 'Any'}</td>
                    <td>
                      <span className="sa-status-pill pending">
                        Waiting List
                      </span>
                    </td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" onClick={() => handleEditClient(client)} title="Edit">✏️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unpaid Rents Section */}
      {unpaidRents.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '24px' }}>
          <div className="sa-section-header">
            <h3>Unpaid Rents</h3>
            <p>Manage overdue payments and update payment status.</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th />
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {unpaidRents.map(unpaid => (
                  <tr key={unpaid.ID || unpaid.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{unpaid.Name || unpaid.ClientName || 'N/A'}</span>
                        <span className="sa-cell-sub">{unpaid.Email || unpaid.ClientEmail || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{unpaid.Property || 'N/A'}</td>
                    <td>{(unpaid.Amount || 0).toLocaleString()} XOF</td>
                    <td>{unpaid.DueDate ? new Date(unpaid.DueDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className="sa-status-pill overdue">
                        {unpaid.Status || 'Overdue'}
                      </span>
                    </td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" onClick={() => handleEditUnpaidRent(unpaid)} title="Update Payment">💰</button>
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

  const renderAlerts = () => (
    <div className="sa-alerts-page">
      <div className="sa-alerts-header">
        <div>
          <h2>Unpaid Rent Alerts</h2>
        <p>Monitor and manage overdue payments</p>
        </div>
      </div>

      <div className="sa-transactions-filters">
        <button className="sa-filter-button">
          <Filter size={16} />
          Filter
        </button>
        <select 
          className="sa-filter-button"
          value={alertTypeFilter}
          onChange={(e) => setAlertTypeFilter(e.target.value)}
          style={{ padding: '8px 14px', cursor: 'pointer' }}
        >
          <option value="">All Alert Types</option>
          <option value="Payment Overdue">Payment Overdue</option>
          <option value="Vacant Property">Vacant Property</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>

      <div className="sa-section-card">
        <div className="sa-section-header">
          <h3>Alerts</h3>
          <p>Track all alerts and their current status.</p>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
          <thead>
            <tr>
                <th />
                <th>Alert</th>
              <th>Property</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Created</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length > 0 ? (
              alerts.map(alert => (
                <tr key={alert.ID}>
                  <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{alert.Title || 'N/A'}</span>
                        <span className="sa-cell-sub">{alert.Message || 'N/A'}</span>
                      </div>
                  </td>
                  <td>{alert.Property || 'N/A'}</td>
                  <td>
                      <span className={`sa-status-pill ${(alert.Urgency || 'normal').toLowerCase()}`}>
                      {alert.Urgency || 'Normal'}
                    </span>
                  </td>
                  <td>
                      <span className={`sa-status-pill ${(alert.Status || 'open').toLowerCase()}`}>
                      {alert.Status || 'Open'}
                    </span>
                  </td>
                  <td>{alert.CreatedAt ? new Date(alert.CreatedAt).toLocaleDateString() : 'N/A'}</td>
                    <td>{alert.Amount ? `${alert.Amount.toLocaleString()} XOF` : '—'}</td>
                </tr>
              ))
            ) : (
              <tr>
                  <td colSpan={7} className="sa-table-empty">No alerts found. Start the backend to see real data.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );

  // Handle send message
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
    const tempMessageId = `temp-${Date.now()}`;
    
    // Optimistically add message to UI immediately
    const optimisticMessage = {
      id: tempMessageId,
      ID: tempMessageId,
      fromUserId: currentUserId,
      toUserId: selectedUserId,
      content: content,
      createdAt: new Date().toISOString(),
      read: false,
      type: 'message'
    };
    
    setChatMessages(prev => [...prev, optimisticMessage]);
    setChatInput('');
    
    try {
      const payload = {
        toUserId: selectedUserId,
        content,
      };
      const sentMessage = await messagingService.sendMessage(payload);
      
      // Replace optimistic message with real message from server
      if (sentMessage && sentMessage.id) {
        setChatMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessageId ? sentMessage : msg
          )
        );
      } else {
        // If server response doesn't have expected format, reload chat
        await loadChatForUser(selectedUserId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addNotification(error.message || 'Failed to send message', 'error');
      // Remove optimistic message on error
      setChatMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      setChatInput(content); // Restore input on error
    }
  };

  // Render messaging page
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
                    {user.role && (
                      <span className="sa-cell-sub" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {user.role}
                      </span>
                    )}
                    {user.unreadCount > 0 && (
                      <span className="sa-cell-sub" style={{ color: '#2563eb', fontWeight: 600, marginTop: '4px' }}>
                        {user.unreadCount} unread
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
              const messageContent = msg.content || msg.Content || '';
              const messageCreatedAt = msg.createdAt || msg.CreatedAt || '';
              const messageFromUserId = msg.fromUserId || msg.FromUserId;
              const messageId = msg.id || msg.ID || index;
              
              // Determine if message is outgoing or incoming
              const storedUser = localStorage.getItem('user');
              let isOutgoing = false;
              if (storedUser) {
                try {
                  const user = JSON.parse(storedUser);
                  const currentUserId = user.id || user.ID;
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
                {selectedUserId 
                  ? 'No messages yet. Start the conversation!'
                  : 'Select a conversation on the left to start messaging.'}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="sa-chat-input-row">
            <input
              type="text"
              placeholder="Reply..."
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
            <button 
              className="sa-primary-cta" 
              onClick={handleSendMessage}
              disabled={!selectedUserId || !chatInput.trim()}
            >
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
                    <strong>Name:</strong> {user.name || 'N/A'}
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
            <p>Select a conversation to view details.</p>
          )}
        </div>
      </div>
    </div>
  );

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

  const renderVisits = () => {
    const visitsToDisplay = visitTab === 'upcoming' ? visits.upcoming : visitTab === 'done' ? visits.done : visits.all;
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Visit Management</h3>
            <p>Schedule and track property viewings</p>
          </div>
          <button className="sa-primary-cta" onClick={() => openScheduleVisit()}>
            <Plus size={18} />
            Schedule Visit
          </button>
        </div>
        <div className="sa-filters-section">
          <div className="sa-transactions-tabs">
            <button className={`sa-subtab-button ${visitTab === 'all' ? 'active' : ''}`} onClick={() => setVisitTab('all')}>All ({visits.all.length})</button>
            <button className={`sa-subtab-button ${visitTab === 'upcoming' ? 'active' : ''}`} onClick={() => setVisitTab('upcoming')}>Upcoming ({visits.upcoming.length})</button>
            <button className={`sa-subtab-button ${visitTab === 'done' ? 'active' : ''}`} onClick={() => setVisitTab('done')}>Done ({visits.done.length})</button>
          </div>
          <select className="sa-filter-select" value={visitStatusFilter} onChange={(e) => setVisitStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No-show">No-show</option>
          </select>
        </div>
        {loading ? (
          <div className="sa-table-empty">Loading visits...</div>
        ) : visitsToDisplay.length === 0 ? (
          <div className="sa-table-empty">No visits scheduled</div>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Client</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visitsToDisplay.map((visit, index) => {
                  const visitId = visit.ID || visit.id || `visit-${index}`;
                  const property = visit.Property || visit.property || visit.Address || visit.address || 'Property';
                  const client = visit.Client || visit.client || visit.ClientName || visit.clientName || 'Client';
                  const clientEmail = visit.ClientEmail || visit.clientEmail || '';
                  const clientPhone = visit.ClientPhone || visit.clientPhone || '';
                  const visitDate = visit.VisitDate || visit.visitDate || visit.Date || visit.date || visit.ScheduledAt || visit.scheduledAt;
                  const visitTime = visit.VisitTime || visit.visitTime || visit.Time || visit.time;
                  const status = visit.Status || visit.status || 'Scheduled';
                  const formattedDate = visitDate ? new Date(visitDate).toLocaleDateString() : 'N/A';
                  const formattedTime = visitTime ? visitTime : (visitDate ? new Date(visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A');
                  return (
                    <tr key={visitId}>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{property}</span>
                          <span className="sa-cell-sub">{visit.Agent || visit.agent || 'Pending assignment'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{client}</span>
                          <span className="sa-cell-sub">{clientEmail || clientPhone || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{formattedDate}</span>
                          <span className="sa-cell-sub">{formattedTime}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`sa-status-pill ${status.toLowerCase().replace('-', '')}`}>{status}</span>
                      </td>
                      <td>
                        <div className="sa-row-actions">
                          {status === 'Scheduled' && (
                            <button className="table-action-button edit" onClick={() => openUpdateVisitStatus(visit)}>Update Status</button>
                          )}
                          <button className="table-action-button view" onClick={() => openScheduleVisit(property)}>Reschedule</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderRequests = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Visit Requests</h3>
            <p>Manage incoming requests from prospective tenants</p>
          </div>
        </div>
        <div className="sa-filters-section">
          <select className="sa-filter-select" value={requestStatusFilter} onChange={(e) => setRequestStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>
        {loading ? (
          <div className="sa-table-empty">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="sa-table-empty">No requests received</div>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Property</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request, index) => {
                  const requestId = request.ID || request.id || `request-${index}`;
                  const clientName = request.ClientName || request.clientName || 'Client';
                  const clientEmail = request.ClientEmail || request.clientEmail || '';
                  const clientPhone = request.ClientPhone || request.clientPhone || '';
                  const property = request.Property || request.property || 'Property';
                  const status = request.Status || request.status || 'Pending';
                  const createdAt = request.CreatedAt || request.createdAt;
                  const preferredDate = request.PreferredDate || request.preferredDate;
                  const followUpCount = request.followUpCount || request.FollowUpCount || 0;
                  return (
                    <tr key={requestId}>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{clientName}</span>
                          <span className="sa-cell-sub">{clientEmail || clientPhone || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{property}</span>
                          <span className="sa-cell-sub">{request.City || request.city || request.District || request.district || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</span>
                          <span className="sa-cell-sub">{preferredDate ? `Preferred: ${new Date(preferredDate).toLocaleDateString()}` : ''}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`sa-status-pill ${status.toLowerCase()}`}>{status}</span>
                        {followUpCount > 0 && (
                          <span className="sa-cell-sub" style={{ display: 'block', marginTop: '4px' }}>{followUpCount} follow-up{followUpCount > 1 ? 's' : ''}</span>
                        )}
                      </td>
                      <td>
                        <div className="sa-row-actions">
                          {status === 'Pending' && (
                            <>
                              <button className="table-action-button edit" onClick={() => handleApproveRequest(requestId)}>Approve</button>
                              <button className="table-action-button contact" onClick={() => openFollowUp(request)}>Follow-up</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'occupancy':
        return renderOccupancy();
      case 'sales-tracking':
        return renderSalesTracking();
      case 'visits':
        return renderVisits();
      case 'requests':
        return renderRequests();
      case 'clients':
        if (selectedTenantId) return renderTenantDetail();
        return renderClients();
      case 'property-management':
        return renderPropertyManagement();
      case 'alerts':
        return renderAlerts();
      case 'advertisements':
        return renderAdvertisements();
      case 'chat':
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
    localStorage.removeItem('demo_mode');
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
          <div className="content-body sales-manager-content">
              {renderContent(activeId || activeTab)}
          </div>
        )}
      </RoleLayout>

      {/* Property Detail Modal - click on a property row to view full data + images */}
      {selectedPropertyDetail && (
        <div className="modal-overlay" onClick={() => setSelectedPropertyDetail(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>Property details</h3>
              <button className="modal-close" onClick={() => setSelectedPropertyDetail(null)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                <div><strong>Address / Name</strong>: {selectedPropertyDetail.Address || selectedPropertyDetail.address || 'N/A'}</div>
                <div><strong>Type</strong>: {selectedPropertyDetail.Type || selectedPropertyDetail.type || 'N/A'}</div>
                <div><strong>Property type</strong>: {selectedPropertyDetail.PropertyType || selectedPropertyDetail.propertyType || 'N/A'}</div>
                {(selectedPropertyDetail.City || selectedPropertyDetail.city) && (
                  <div><strong>City</strong>: {selectedPropertyDetail.City || selectedPropertyDetail.city}</div>
                )}
                {(selectedPropertyDetail.Neighborhood || selectedPropertyDetail.neighborhood) && (
                  <div><strong>Neighborhood</strong>: {selectedPropertyDetail.Neighborhood || selectedPropertyDetail.neighborhood}</div>
                )}
                {(selectedPropertyDetail.TypeR || selectedPropertyDetail.typeR) && (
                  <div><strong>Type (R+)</strong>: {selectedPropertyDetail.TypeR || selectedPropertyDetail.typeR}</div>
                )}
                {(selectedPropertyDetail.BuildingType || selectedPropertyDetail.buildingType) && (
                  <div><strong>Building type</strong>: {selectedPropertyDetail.BuildingType || selectedPropertyDetail.buildingType}</div>
                )}
                <div><strong>Status</strong>: {selectedPropertyDetail.Status || selectedPropertyDetail.status || 'N/A'}</div>
                <div><strong>Rent / Price</strong>: {typeof (selectedPropertyDetail.Rent || selectedPropertyDetail.rent) === 'number' ? (selectedPropertyDetail.Rent || selectedPropertyDetail.rent).toLocaleString() : (selectedPropertyDetail.Rent || selectedPropertyDetail.rent || 'N/A')} XOF</div>
                <div><strong>Bedrooms</strong>: {selectedPropertyDetail.Bedrooms ?? selectedPropertyDetail.bedrooms ?? 0}</div>
                <div><strong>Bathrooms</strong>: {selectedPropertyDetail.Bathrooms ?? selectedPropertyDetail.bathrooms ?? 0}</div>
                <div><strong>Number of units</strong>: {selectedPropertyDetail.NumberOfUnits ?? selectedPropertyDetail.numberOfUnits ?? 1}</div>
                <div><strong>Filled units</strong>: {selectedPropertyDetail.FilledUnits ?? selectedPropertyDetail.filledUnits ?? selectedPropertyDetail.occupiedUnits ?? 0}</div>
                <div><strong>Urgency</strong>: {selectedPropertyDetail.Urgency || selectedPropertyDetail.urgency || 'normal'}</div>
                {(selectedPropertyDetail.Tenant || selectedPropertyDetail.tenant) && (
                  <div><strong>Tenant</strong>: {selectedPropertyDetail.Tenant || selectedPropertyDetail.tenant}</div>
                )}
              </div>
              {(() => {
                const imgs = parsePropertyImages(selectedPropertyDetail.Images || selectedPropertyDetail.images);
                if (imgs.length === 0) return null;
                return (
                  <div style={{ marginTop: '16px' }}>
                    <strong>Images</strong>
                    <small style={{ display: 'block', color: '#6b7280', marginTop: '4px' }}>Click an image to expand</small>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                      {imgs.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setExpandedImageUrl(url)}
                          style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, overflow: 'hidden' }}
                        >
                          <img src={url} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="action-button secondary" onClick={() => setSelectedPropertyDetail(null)}>Close</button>
              <button type="button" className="action-button primary" onClick={() => { setSelectedPropertyDetail(null); openEditPropertyModal(selectedPropertyDetail); }}>Edit</button>
              <button type="button" className="action-button primary" onClick={() => { setSelectedPropertyDetail(null); openScheduleVisit(selectedPropertyDetail.Address || selectedPropertyDetail.address); }}>Schedule visit</button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded image lightbox - click image in property detail to expand */}
      {expandedImageUrl && (
        <div
          className="modal-overlay"
          style={{ zIndex: 10001, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setExpandedImageUrl(null)}
        >
          <button
            type="button"
            onClick={() => setExpandedImageUrl(null)}
            style={{ position: 'absolute', top: 16, right: 16, background: '#fff', border: 'none', borderRadius: 8, width: 40, height: 40, fontSize: 24, cursor: 'pointer', lineHeight: 1, zIndex: 1 }}
            aria-label="Close"
          >
            ×
          </button>
          <img
            src={expandedImageUrl}
            alt=""
            style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Schedule Visit / Update Visit Status / Follow-up modals */}
      {showScheduleVisitModal && (
        <div className="modal-overlay" onClick={closeScheduleVisitModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule Visit</h3>
              <button className="modal-close" onClick={closeScheduleVisitModal}>×</button>
            </div>
            <div className="modal-body">
              <form className="modal-form" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleScheduleVisit({
                  property: formData.get('property'),
                  clientName: formData.get('clientName'),
                  clientEmail: formData.get('clientEmail'),
                  clientPhone: formData.get('clientPhone'),
                  visitDate: formData.get('visitDate'),
                  visitTime: formData.get('visitTime'),
                  notes: formData.get('notes'),
                });
              }}>
                <div className="form-group">
                  <label htmlFor="visit-property">Property *</label>
                  <select id="visit-property" name="property" defaultValue={visitProperty} required>
                    <option value="">Select Property</option>
                    {properties.map((prop, index) => {
                      const address = prop.Address || prop.address;
                      const propId = prop.ID || prop.id || `prop-${index}`;
                      return address ? <option key={propId} value={address}>{address}</option> : null;
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="visit-client-name">Client Name *</label>
                  <input id="visit-client-name" name="clientName" placeholder="Full name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="visit-client-email">Client Email *</label>
                  <input id="visit-client-email" name="clientEmail" type="email" placeholder="email@example.com" required />
                </div>
                <div className="form-group">
                  <label htmlFor="visit-client-phone">Client Phone *</label>
                  <input id="visit-client-phone" name="clientPhone" type="tel" placeholder="Phone number" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="visit-date">Visit Date *</label>
                    <input id="visit-date" name="visitDate" type="date" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="visit-time">Visit Time *</label>
                    <input id="visit-time" name="visitTime" type="time" required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="visit-notes">Notes</label>
                  <textarea id="visit-notes" name="notes" rows="3" placeholder="Any special requirements or notes for the visit" />
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={closeScheduleVisitModal}>Cancel</button>
                  <button type="submit" className="action-button primary" disabled={loading}>{loading ? 'Scheduling...' : 'Schedule Visit'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showUpdateVisitStatusModal && selectedVisit && (
        <div className="modal-overlay" onClick={closeUpdateVisitStatusModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Visit Status</h3>
              <button className="modal-close" onClick={closeUpdateVisitStatusModal}>×</button>
            </div>
            <div className="modal-body">
              <form className="modal-form" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleUpdateVisitStatus(formData.get('status'), formData.get('notes'));
              }}>
                <div className="form-group">
                  <label htmlFor="visit-status">Status *</label>
                  <select id="visit-status" name="status" required>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No-show">No-show</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="visit-status-notes">Notes</label>
                  <textarea id="visit-status-notes" name="notes" rows="3" placeholder="Additional notes about the visit status..." />
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={closeUpdateVisitStatusModal}>Cancel</button>
                  <button type="submit" className="action-button primary" disabled={loading}>{loading ? 'Updating...' : 'Update Status'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showFollowUpModal && selectedRequest && (
        <div className="modal-overlay" onClick={closeFollowUpModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Follow-up</h3>
              <button className="modal-close" onClick={closeFollowUpModal}>×</button>
            </div>
            <div className="modal-body">
              <form className="modal-form" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleFollowUpRequest(formData.get('message'));
              }}>
                <div className="form-group">
                  <label htmlFor="follow-up-message">Message *</label>
                  <textarea id="follow-up-message" name="message" rows="4" placeholder="Please let us know your preferred visit time..." required />
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={closeFollowUpModal}>Cancel</button>
                  <button type="submit" className="action-button primary" disabled={loading}>{loading ? 'Sending...' : 'Send Follow-up'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Display Modal */}
      {showPasswordModal && passwordData && (
        <div className="modal-overlay" onClick={() => {
          setShowPasswordModal(false);
          setPasswordData(null);
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {passwordData.type === 'bulk' 
                  ? `Tenant Passwords (${passwordData.users.length} created)`
                  : 'Tenant Password Created'}
              </h3>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ 
                padding: '16px', 
                background: '#fef3c7', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #fbbf24'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e', fontWeight: 500 }}>
                  ⚠️ Important: Passwords are only shown once. Please copy and securely share them with tenants.
                </p>
              </div>

              {passwordData.type === 'single' ? (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '12px', color: '#1f2937' }}>Tenant Information</h4>
                    <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                      <p style={{ margin: '4px 0' }}><strong>Name:</strong> {passwordData.user.name || passwordData.client?.name || 'N/A'}</p>
                      <p style={{ margin: '4px 0' }}><strong>Email:</strong> {passwordData.user.email || passwordData.client?.email || 'N/A'}</p>
                      {passwordData.client?.property && (
                        <p style={{ margin: '4px 0' }}><strong>Property:</strong> {passwordData.client.property}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '12px', color: '#1f2937' }}>Login Credentials</h4>
                    <PasswordDisplayItem 
                      email={passwordData.user.email} 
                      password={passwordData.user.password}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  {passwordData.failed > 0 && (
                    <div style={{ 
                      padding: '12px', 
                      background: '#fee2e2', 
                      borderRadius: '8px', 
                      marginBottom: '16px',
                      border: '1px solid #fca5a5'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b' }}>
                        <strong>Import Summary:</strong> {passwordData.success} succeeded, {passwordData.failed} failed
                      </p>
                    </div>
                  )}
                  
                  {passwordData.errors && passwordData.errors.length > 0 && (
                    <div style={{ 
                      padding: '12px', 
                      background: '#fee2e2', 
                      borderRadius: '8px', 
                      marginBottom: '16px',
                      border: '1px solid #fca5a5'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b', fontWeight: 500, marginBottom: '8px' }}>
                        Errors:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#991b1b' }}>
                        {passwordData.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ marginBottom: '12px', color: '#1f2937' }}>
                      Passwords for Newly Created Tenants ({passwordData.users.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {passwordData.users.map((user, index) => (
                        <div key={user.id || index} style={{ 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px', 
                          padding: '16px',
                          background: '#ffffff'
                        }}>
                          <div style={{ marginBottom: '12px' }}>
                            <p style={{ margin: '4px 0', fontWeight: 500, color: '#1f2937' }}>
                              {user.name || 'N/A'}
                            </p>
                            <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#6b7280' }}>
                              {user.email || 'N/A'}
                            </p>
                          </div>
                          <PasswordDisplayItem 
                            email={user.email} 
                            password={user.password}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="action-button primary" 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData(null);
                }}
              >
                I've Copied the Passwords
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance detail modal (when clicking a maintenance in tenant detail) */}
      {(maintenanceDetail != null || maintenanceDetailLoading) && (
        <div className="modal-overlay" onClick={() => { if (!maintenanceDetailLoading) { setMaintenanceDetail(null); } }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Maintenance request details</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setMaintenanceDetail(null)}
                disabled={maintenanceDetailLoading}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {maintenanceDetailLoading ? (
                <p className="sa-cell-sub" style={{ margin: 0 }}>Loading…</p>
              ) : maintenanceDetail ? (
                <div className="sa-tenant-detail-dl" style={{ display: 'grid', gap: '12px' }}>
                  <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Property</dt><dd style={{ margin: 0 }}>{maintenanceDetail.property ?? maintenanceDetail.Property ?? '—'}</dd></div>
                  <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Tenant</dt><dd style={{ margin: 0 }}>{maintenanceDetail.tenant ?? maintenanceDetail.Tenant ?? '—'}</dd></div>
                  <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Title</dt><dd style={{ margin: 0 }}>{maintenanceDetail.title ?? maintenanceDetail.Title ?? maintenanceDetail.issue ?? maintenanceDetail.Issue ?? '—'}</dd></div>
                  {(maintenanceDetail.description ?? maintenanceDetail.Description) && (
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Description</dt><dd style={{ margin: 0 }}>{maintenanceDetail.description ?? maintenanceDetail.Description}</dd></div>
                  )}
                  <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Priority</dt><dd style={{ margin: 0 }}><span className={`sa-status-pill ${(maintenanceDetail.priority ?? maintenanceDetail.Priority ?? '').toLowerCase()}`}>{maintenanceDetail.priority ?? maintenanceDetail.Priority ?? '—'}</span></dd></div>
                  <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Status</dt><dd style={{ margin: 0 }}><span className={`sa-status-pill ${(maintenanceDetail.status ?? maintenanceDetail.Status ?? '').toLowerCase().replace(/\s+/g, '-')}`}>{maintenanceDetail.status ?? maintenanceDetail.Status ?? '—'}</span></dd></div>
                  {(maintenanceDetail.assigned ?? maintenanceDetail.Assigned) && (
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Assigned to</dt><dd style={{ margin: 0 }}>{maintenanceDetail.assigned ?? maintenanceDetail.Assigned}</dd></div>
                  )}
                  <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Date reported</dt><dd style={{ margin: 0 }}>{maintenanceDetail.date ? new Date(maintenanceDetail.date).toLocaleDateString() : (maintenanceDetail.Date ? new Date(maintenanceDetail.Date).toLocaleDateString() : '—')}</dd></div>
                  <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Created</dt><dd style={{ margin: 0 }}>{maintenanceDetail.createdAt ? new Date(maintenanceDetail.createdAt).toLocaleString() : (maintenanceDetail.CreatedAt ? new Date(maintenanceDetail.CreatedAt).toLocaleString() : '—')}</dd></div>
                  {(maintenanceDetail.estimatedHours ?? maintenanceDetail.EstimatedHours) != null && (
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Estimated hours</dt><dd style={{ margin: 0 }}>{maintenanceDetail.estimatedHours ?? maintenanceDetail.EstimatedHours}</dd></div>
                  )}
                  {(maintenanceDetail.estimatedCost ?? maintenanceDetail.EstimatedCost) != null && (
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Estimated cost</dt><dd style={{ margin: 0 }}>{(maintenanceDetail.estimatedCost ?? maintenanceDetail.EstimatedCost).toLocaleString()} XOF</dd></div>
                  )}
                  <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Quote generated</dt><dd style={{ margin: 0 }}>{(maintenanceDetail.quoteGenerated ?? maintenanceDetail.QuoteGenerated) ? 'Yes' : 'No'}</dd></div>
                  {(maintenanceDetail.workStartDate ?? maintenanceDetail.WorkStartDate) && (
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Work start date</dt><dd style={{ margin: 0 }}>{new Date(maintenanceDetail.workStartDate ?? maintenanceDetail.WorkStartDate).toLocaleDateString()}</dd></div>
                  )}
                  {(maintenanceDetail.workEndDate ?? maintenanceDetail.WorkEndDate) && (
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Work end date</dt><dd style={{ margin: 0 }}>{new Date(maintenanceDetail.workEndDate ?? maintenanceDetail.WorkEndDate).toLocaleDateString()}</dd></div>
                  )}
                  {(maintenanceDetail.completedAt ?? maintenanceDetail.CompletedAt) && (
                    <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Completed at</dt><dd style={{ margin: 0 }}>{new Date(maintenanceDetail.completedAt ?? maintenanceDetail.CompletedAt).toLocaleString()}</dd></div>
                  )}
                  <div><dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Archived</dt><dd style={{ margin: 0 }}>{(maintenanceDetail.archived ?? maintenanceDetail.Archived) ? 'Yes' : 'No'}</dd></div>
                  {Array.isArray(maintenanceDetail.photos ?? maintenanceDetail.Photos) && (maintenanceDetail.photos ?? maintenanceDetail.Photos).length > 0 && (
                    <div>
                      <dt style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Photos</dt>
                      <dd style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(maintenanceDetail.photos ?? maintenanceDetail.Photos).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                            <img src={url} alt={`Photo ${i + 1}`} style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                          </a>
                        ))}
                      </dd>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal (Properties + Tenants) */}
      {showBulkImportModal && (
        <div className="modal-overlay" onClick={() => { setShowBulkImportModal(false); setBulkImportFile(null); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Import – Properties & Tenants</h3>
              <button className="modal-close" onClick={() => { setShowBulkImportModal(false); setBulkImportFile(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#6b7280', marginRight: '8px' }}>Download example:</span>
                <button type="button" className="action-button secondary" onClick={downloadPropertiesExampleCsv} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  <Download size={16} style={{ marginRight: '6px' }} />
                  Properties Example CSV
                </button>
                <button type="button" className="action-button secondary" onClick={downloadTenantsExampleCsv} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  <Download size={16} style={{ marginRight: '6px' }} />
                  Tenants Example CSV
                </button>
                <button type="button" className="action-button primary" onClick={downloadFullImportExampleCsv} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  <Download size={16} style={{ marginRight: '6px' }} />
                  Full Example (Properties + Tenants)
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <button
                  type="button"
                  onClick={() => setBulkImportTab('properties')}
                  style={{
                    padding: '10px 16px', fontSize: '0.9rem', border: 'none', background: 'none', cursor: 'pointer',
                    borderBottom: bulkImportTab === 'properties' ? '2px solid #2563eb' : '2px solid transparent',
                    color: bulkImportTab === 'properties' ? '#2563eb' : '#6b7280', fontWeight: bulkImportTab === 'properties' ? 600 : 400
                  }}
                >
                  Properties
                </button>
                <button
                  type="button"
                  onClick={() => setBulkImportTab('tenants')}
                  style={{
                    padding: '10px 16px', fontSize: '0.9rem', border: 'none', background: 'none', cursor: 'pointer',
                    borderBottom: bulkImportTab === 'tenants' ? '2px solid #2563eb' : '2px solid transparent',
                    color: bulkImportTab === 'tenants' ? '#2563eb' : '#6b7280', fontWeight: bulkImportTab === 'tenants' ? 600 : 400
                  }}
                >
                  Tenants
                </button>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '8px' }}>
                  {bulkImportTab === 'properties' ? 'Import Properties' : 'Import Tenants'}
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '16px' }}>
                  {bulkImportTab === 'properties'
                    ? 'Upload a CSV with: Address, Type, PropertyType, BuildingType, Status, NumberOfUnits, Rent, Bedrooms, Bathrooms, Urgency, LandlordId. For multi-unit: UnitNumbers (F1|F2), UnitRents (100000|120000).'
                    : 'Upload a CSV or Excel file with: Name, Property, Email, Phone, Amount, MoveInDate, Status (optional), UnitNumber (optional). Or use the Full Example file to import both properties and tenants.'}
                </p>
                <div
                  className="file-upload-area"
                  style={{ border: '2px dashed #d1d5db', borderRadius: '12px', padding: '32px', textAlign: 'center', background: '#fff', cursor: bulkImportLoading ? 'not-allowed' : 'pointer' }}
                  onClick={() => !bulkImportLoading && document.getElementById('bulk-import-file-input')?.click()}
                >
                  <input
                    type="file"
                    id="bulk-import-file-input"
                    accept=".csv,.xlsx,.xls,text/csv,application/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setBulkImportFile(f); e.target.value = ''; }}
                    style={{ display: 'none' }}
                    disabled={bulkImportLoading}
                  />
                  <FileSpreadsheet size={48} color={bulkImportLoading ? '#9ca3af' : '#2563eb'} style={{ margin: '0 auto 12px' }} />
                  <div>
                    <strong style={{ color: bulkImportLoading ? '#9ca3af' : '#1f2937' }}>
                      {bulkImportLoading ? 'Importing...' : (bulkImportFile ? bulkImportFile.name : 'Click to select file')}
                    </strong>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                      {bulkImportTab === 'properties' ? 'CSV only' : 'CSV or Excel (.xlsx, .xls)'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button type="button" className="action-button secondary" onClick={() => { setShowBulkImportModal(false); setBulkImportFile(null); }}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="action-button primary"
                  onClick={handleBulkImportUpload}
                  disabled={!bulkImportFile || bulkImportLoading}
                >
                  {bulkImportLoading ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          setUploadedDocuments([]);
          setExcelFile(null);
          setImportMode('manual');
          setSelectedApprovedClientId('');
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{importMode === 'excel' ? 'Import Tenants from File' : 'Create New Tenant'}</h3>
              <button className="modal-close" onClick={() => {
                setShowTenantCreationModal(false);
                setUploadedDocuments([]);
                setExcelFile(null);
                setImportMode('manual');
                setSelectedApprovedClientId('');
              }}>×</button>
            </div>
            <div className="modal-body">
              {/* Import Mode Selection */}
              <div className="import-mode-selector" style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className={`action-button ${importMode === 'manual' ? 'primary' : 'secondary'}`}
                    onClick={() => setImportMode('manual')}
                    style={{ flex: 1 }}
                  >
                    <UserPlus size={18} />
                    Add Single Tenant
                  </button>
                  <button
                    type="button"
                    className={`action-button ${importMode === 'excel' ? 'primary' : 'secondary'}`}
                    onClick={() => setImportMode('excel')}
                    style={{ flex: 1 }}
                  >
                    <FileSpreadsheet size={18} />
                    Import from File
                  </button>
                </div>
              </div>

              {importMode === 'excel' ? (
                    <div className="excel-upload-section">
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ marginBottom: '8px' }}>Upload File</h4>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '16px' }}>
                          Upload an Excel file (.xlsx, .xls) or CSV file (.csv) with tenant details. Required columns: Name, Property, Email, Phone, Amount, MoveInDate. Optional: Status (defaults to 'Active'). Date format: YYYY-MM-DD or DD/MM/YYYY
                        </p>
                        <button
                          type="button"
                          className="action-button secondary"
                          onClick={downloadCsvExample}
                          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                        >
                          <Download size={16} />
                          Download CSV Example
                        </button>
                      </div>
                      
                      <div className="file-upload-area" style={{
                        border: '2px dashed #d1d5db',
                        borderRadius: '12px',
                        padding: '32px',
                        textAlign: 'center',
                        background: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}>
                        <input
                          type="file"
                          id="excel-file-input"
                          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/csv"
                          onChange={handleExcelFileSelect}
                          style={{ display: 'none' }}
                          disabled={loading}
                        />
                        <label
                          htmlFor="excel-file-input"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <FileSpreadsheet size={48} color={loading ? '#9ca3af' : '#2563eb'} />
                          <div>
                            <strong style={{ color: loading ? '#9ca3af' : '#1f2937' }}>
                              {loading ? 'Uploading...' : 'Click to select Excel file'}
                            </strong>
                            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                              Supports .xlsx, .xls, and .csv files (max 10MB)
                            </p>
                          </div>
                        </label>
                        {excelFile && (
                          <div style={{ marginTop: '12px', padding: '8px 12px', background: '#eff6ff', borderRadius: '8px', display: 'inline-block' }}>
                            <FileSpreadsheet size={16} style={{ display: 'inline', marginRight: '8px' }} />
                            <span style={{ fontSize: '0.9rem' }}>{excelFile.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="modal-footer" style={{ marginTop: '24px' }}>
                        <button
                          type="button"
                          className="action-button secondary"
                          onClick={() => {
                            setShowTenantCreationModal(false);
                            setImportMode('manual');
                            setExcelFile(null);
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="action-button primary"
                          onClick={handleExcelUpload}
                          disabled={!excelFile || loading}
                        >
                          {loading ? 'Importing...' : 'Import Tenants'}
                        </button>
                      </div>
                    </div>
                  ) : (
                <form onSubmit={handleCreateTenant}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="approvedClientId">Approved Client *</label>
                      <select
                        name="approvedClientId"
                        id="approvedClientId"
                        value={selectedApprovedClientId}
                        onChange={(e) => setSelectedApprovedClientId(e.target.value)}
                        required
                      >
                        <option value="">Select approved client</option>
                        {approvedClients.map(client => {
                          const id = client.ID || client.id;
                          const label = client.name || client.Name || client.email || client.Email || `Client ${id}`;
                          return (
                            <option key={id} value={id}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Client Type</label>
                      <input
                        type="text"
                        value={selectedApprovedClient ? (selectedApprovedClient.type || selectedApprovedClient.Type || 'individual') : ''}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Client Name</label>
                      <input
                        type="text"
                        value={selectedApprovedClient ? (selectedApprovedClient.name || selectedApprovedClient.Name || '') : ''}
                        disabled
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={selectedApprovedClient ? (selectedApprovedClient.email || selectedApprovedClient.Email || '') : ''}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={selectedApprovedClient ? (selectedApprovedClient.phone || selectedApprovedClient.Phone || '') : ''}
                        disabled
                      />
                    </div>
                    <div className="form-group">
                      <label>Security Deposit</label>
                      <input
                        type="text"
                        value={
                          selectedApprovedClient
                            ? (approvedClientDepositInfo.paid ? 'Paid' : 'Not Paid') +
                              (moveInFormPropertyRent > 0 ? ` - ${(moveInFormPropertyRent * 4.5).toLocaleString()} XOF` : '')
                            : ''
                        }
                        disabled
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Deposit Paid Date</label>
                      <input
                        type="text"
                        value={
                          approvedClientDepositInfo.paidAt
                            ? new Date(approvedClientDepositInfo.paidAt).toLocaleDateString()
                            : ''
                        }
                        disabled
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="property">Property</label>
                      <select name="property" id="property" required onChange={(e) => {
                        const val = e.target.value;
                        const selectedProperty = val ? properties.find(p => String(p.ID || p.id) === val) : null;
                        if (selectedProperty) {
                          const propertyRent = Number(selectedProperty.Rent || selectedProperty.rent || 0);
                          setMoveInFormPropertyRent(propertyRent);
                          const numberOfUnits = selectedProperty.NumberOfUnits || selectedProperty.numberOfUnits || 1;
                          const unitSelect = document.getElementById('unitNumber');
                          if (unitSelect) {
                            unitSelect.innerHTML = '<option value="">Select Unit Number</option>';
                            for (let i = 1; i <= numberOfUnits; i++) {
                              const option = document.createElement('option');
                              option.value = `Unit ${i}`;
                              option.textContent = `Unit ${i}`;
                              unitSelect.appendChild(option);
                            }
                          }
                          const rentInput = document.getElementsByName('rent')[0];
                          if (rentInput) {
                            rentInput.value = propertyRent;
                          }
                        } else {
                          setMoveInFormPropertyRent(0);
                        }
                      }}>
                        <option value="">Select Property</option>
                        {(() => {
                          const withEmptyUnits = properties.filter(property => {
                            const address = (property.Address || property.address || '').toString().trim();
                            const total = property.NumberOfUnits ?? property.numberOfUnits ?? 1;
                            const filled = property.filledUnits ?? property.occupiedUnits ?? property.FilledUnits ?? property.OccupiedUnits;
                            if (filled !== undefined && filled !== null) return Number(filled) < total;
                            const status = (property.Status || property.status || '').toLowerCase();
                            if (total <= 1) return status !== 'occupied';
                            const occupiedFromClients = clients.filter(c => (c.Property || c.property || '').toString().trim() === address).length;
                            return occupiedFromClients < total;
                          });
                          return withEmptyUnits.length > 0 ? withEmptyUnits.map(property => {
                            const propertyId = property.ID || property.id;
                            const address = property.Address || property.address || 'Unnamed Property';
                            const type = property.Type || property.type || '';
                            const numberOfUnits = property.NumberOfUnits || property.numberOfUnits || 1;
                            const displayText = type ? `${address} - ${type} (${numberOfUnits} units)` : `${address} (${numberOfUnits} units)`;
                            return (
                              <option key={propertyId || `property-${address}`} value={propertyId ?? ''}>
                                {displayText}
                              </option>
                            );
                          }) : (
                            <option value="" disabled>
                              {properties.length === 0 ? 'No properties available. Start backend to load properties.' : 'No properties with empty units available.'}
                            </option>
                          );
                        })()}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="unitNumber">Unit Number</label>
                      <select name="unitNumber" id="unitNumber" required>
                        <option value="">Select Property First</option>
                      </select>
                      <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        Select which unit/apartment the tenant will occupy
                      </small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="rent">Monthly Rent</label>
                      <input type="number" name="rent" step="0.01" required placeholder="0.00" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="moveInDate">Move-in Date</label>
                      <input
                        type="date"
                        name="moveInDate"
                        required
                        max={approvedClientDepositInfo.paid ? approvedClientDepositInfo.maxMoveInDate || undefined : undefined}
                      />
                      {approvedClientDepositInfo.paid && approvedClientDepositInfo.maxMoveInDate && (
                        <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                          Must be within 1 month after deposit payment ({approvedClientDepositInfo.maxMoveInDate}).
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="document-upload-section" style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: '600' }}>Administrative Agent Documents</h4>
                    {loadingApprovedDocs ? (
                      <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Loading documents...</div>
                    ) : approvedClientDocuments.length === 0 ? (
                      <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>No documents linked to this client yet.</div>
                    ) : (
                      <div className="uploaded-documents-list">
                        {approvedClientDocuments.map((doc, index) => {
                          const docUrl = doc.URL || doc.url;
                          const fullUrl =
                            docUrl && docUrl.startsWith('http')
                              ? docUrl
                              : docUrl
                                ? `${API_CONFIG.BASE_URL}${docUrl}`
                                : '';
                          return (
                            <div key={doc.ID || doc.id || index} className="document-item" style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px',
                              background: '#fff',
                              borderRadius: '8px',
                              marginBottom: '8px'
                            }}>
                              <FileText size={16} color="#6b7280" />
                              <div className="document-info" style={{ flex: 1 }}>
                                <span className="document-name" style={{ fontSize: '0.875rem', display: 'block' }}>
                                  {doc.Type || doc.type || 'Document'}
                                </span>
                                {fullUrl && (
                                  <a
                                    href={fullUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="document-link"
                                    style={{ fontSize: '0.75rem', color: '#2563eb' }}
                                  >
                                    View/Download
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {approvedClientChecklist && (
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#6b7280' }}>
                        Checklist saved on {approvedClientChecklist.createdAt || approvedClientChecklist.CreatedAt
                          ? new Date(approvedClientChecklist.createdAt || approvedClientChecklist.CreatedAt).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    )}
                  </div>

                  {/* Document Upload Section */}
                  <div className="document-upload-section" style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: '600' }}>Upload Documents (Optional)</h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '16px' }}>
                      You can upload KYC documents and lease contract now or later
                    </p>

                    <div className="upload-buttons" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <button 
                        type="button"
                        className="action-button secondary" 
                        onClick={(e) => {
                          e.preventDefault();
                          setShowKycModal(true);
                        }}
                      >
                        <Upload size={18} />
                        Upload KYC Documents
                      </button>
                      <button 
                        type="button"
                        className="action-button secondary" 
                        onClick={(e) => {
                          e.preventDefault();
                          setShowContractModal(true);
                        }}
                      >
                        <FileText size={18} />
                        Upload Lease Contract
                      </button>
                    </div>

                    {uploadedDocuments.length > 0 && (
                      <div className="uploaded-documents-list">
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Uploaded Documents:</h5>
                        {uploadedDocuments.map((doc, index) => (
                          <div key={index} className="document-item" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            padding: '8px', 
                            background: '#fff', 
                            borderRadius: '8px',
                            marginBottom: '8px'
                          }}>
                            <FileText size={16} color="#6b7280" />
                            <div className="document-info" style={{ flex: 1 }}>
                              <span className="document-name" style={{ fontSize: '0.875rem', display: 'block' }}>
                                {doc.type}: {doc.name || doc.details?.contractType || 'Contract'}
                              </span>
                              {doc.url && (
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="document-link"
                                  style={{ fontSize: '0.75rem', color: '#2563eb' }}
                                >
                                  View Document
                                </a>
                              )}
                            </div>
                            <button 
                              type="button"
                              className="remove-doc-button"
                              onClick={(e) => {
                                e.preventDefault();
                                removeDocument(index);
                              }}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <X size={16} color="#ef4444" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="action-button secondary" onClick={() => {
                      setShowTenantCreationModal(false);
                      setUploadedDocuments([]);
                    }}>
                      Cancel
                    </button>
                    <button type="submit" className="action-button primary" disabled={loading}>
                      {loading ? 'Creating Tenant...' : 'Create Tenant'}
                    </button>
                  </div>
                </form>
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

      {/* Edit Client Modal */}
      {showEditClientModal && editingClient && (
        <div className="modal-overlay" onClick={() => {
          setShowEditClientModal(false);
          setEditingClient(null);
          resetEditClientModalState();
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Tenant Profile</h3>
              <button className="modal-close" onClick={() => {
                setShowEditClientModal(false);
                setEditingClient(null);
                resetEditClientModalState();
              }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateClient}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-name">Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      id="edit-name"
                      defaultValue={editingClient.Name || editingClient.name || ''}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-email">Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      id="edit-email"
                      defaultValue={editingClient.Email || editingClient.email || ''}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-phone">Phone</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      id="edit-phone"
                      defaultValue={editingClient.Phone || editingClient.phone || ''}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-property">Property</label>
                    <input 
                      type="text" 
                      name="property" 
                      id="edit-property"
                      defaultValue={editingClient.Property || editingClient.property || ''}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-amount">Monthly Rent (XOF)</label>
                    <input 
                      type="number" 
                      name="amount" 
                      id="edit-amount"
                      step="0.01"
                      defaultValue={editingClient.Amount || editingClient.amount || 0}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-status">Status</label>
                    <select name="status" id="edit-status" defaultValue={editingClient.Status || editingClient.status || 'Active'}>
                      <option value="Active">Active</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Waiting List">Waiting List</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '20px', paddingTop: '20px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Unit assignment</h4>
                  {loadingAssignment ? (
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Loading where this tenant is placed…</p>
                  ) : tenantAssignment ? (
                    <>
                      <p style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '0.875rem' }}>
                        Currently assigned to <strong>{tenantAssignment.buildingName}</strong>, Room <strong>{tenantAssignment.unitNumber}</strong>.
                      </p>
                      <button type="button" className="action-button secondary" disabled={removeFromUnitLoading} onClick={handleRemoveTenantFromUnit}>
                        {removeFromUnitLoading ? 'Removing…' : 'Remove tenant from this unit'}
                      </button>
                      <span style={{ marginLeft: 8, fontSize: '0.8rem', color: '#6b7280' }}>The apartment will be set to vacant and the tenant status to Inactive.</span>
                    </>
                  ) : (
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>This tenant is not assigned to any apartment unit.</p>
                  )}
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary" 
                    onClick={() => {
                      setShowEditClientModal(false);
                      setEditingClient(null);
                      resetEditClientModalState();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Unpaid Rent Modal */}
      {showUnpaidRentModal && editingUnpaidRent && (
        <div className="modal-overlay" onClick={() => {
          setShowUnpaidRentModal(false);
          setEditingUnpaidRent(null);
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Unpaid Rent</h3>
              <button className="modal-close" onClick={() => {
                setShowUnpaidRentModal(false);
                setEditingUnpaidRent(null);
              }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateUnpaidRent}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="unpaid-status">Payment Status</label>
                    <select name="status" id="unpaid-status" defaultValue={editingUnpaidRent.Status || 'Overdue'}>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Partial">Partial</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="unpaid-amount">Total Amount (XOF)</label>
                    <input 
                      type="number" 
                      name="amount" 
                      id="unpaid-amount"
                      step="0.01"
                      defaultValue={editingUnpaidRent.Amount || 0}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="unpaid-paid-amount">Paid Amount (XOF)</label>
                    <input 
                      type="number" 
                      name="paidAmount" 
                      id="unpaid-paid-amount"
                      step="0.01"
                      defaultValue={editingUnpaidRent.PaidAmount || editingUnpaidRent.paidAmount || 0}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="unpaid-payment-date">Payment Date</label>
                    <input 
                      type="date" 
                      name="paymentDate" 
                      id="unpaid-payment-date"
                      defaultValue={editingUnpaidRent.PaymentDate ? new Date(editingUnpaidRent.PaymentDate).toISOString().split('T')[0] : ''}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="unpaid-notes">Notes</label>
                  <textarea 
                    name="notes" 
                    id="unpaid-notes"
                    rows="3"
                    defaultValue={editingUnpaidRent.Notes || editingUnpaidRent.notes || ''}
                    placeholder="Add any notes about this payment..."
                  />
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary" 
                    onClick={() => {
                      setShowUnpaidRentModal(false);
                      setEditingUnpaidRent(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Property Modal */}
      {showCreatePropertyModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCreatePropertyModal(false);
          setSelectedPropertyType('');
          setCreatePropertyImages([]);
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Property</h3>
              <button className="modal-close" onClick={() => {
                setShowCreatePropertyModal(false);
                setSelectedPropertyType('');
                setCreatePropertyImages([]);
              }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateProperty}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="create-address">Address *</label>
                    <input
                      type="text"
                      name="address"
                      id="create-address"
                      required
                      placeholder="123 Main St, Apt 4B"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="create-type">Building Type *</label>
                    <select 
                      name="type" 
                      id="create-type" 
                      required
                      onChange={(e) => setShowPropertyBuildingType(e.target.value === 'Apartment')}
                    >
                      <option value="">Select Building Type</option>
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Condo">Condo</option>
                      <option value="Studio">Studio</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="create-property-type">Property Type (For Sale or Rent) *</label>
                    <select 
                      name="propertyType" 
                      id="create-property-type" 
                      required
                      onChange={(e) => setSelectedPropertyType(e.target.value)}
                    >
                      <option value="">Select Property Type</option>
                      <option value="For Sale">For Sale</option>
                      <option value="For Rent">For Rent</option>
                    </select>
                  </div>
                  {showPropertyBuildingType && (
                    <div className="form-group">
                      <label htmlFor="create-building-type">Building Type (if Apartment) *</label>
                      <select name="buildingType" id="create-building-type" required>
                        <option value="">Select Building Type</option>
                        <option value="High-rise">High-rise</option>
                        <option value="Low-rise">Low-rise</option>
                        <option value="Duplex">Duplex</option>
                        <option value="Townhouse">Townhouse</option>
                        <option value="Penthouse">Penthouse</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="create-status">Status *</label>
                    <select name="status" id="create-status" required>
                      <option value="">Select Status</option>
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="create-number-of-units">Number of Units *</label>
                    <input
                      type="number"
                      name="numberOfUnits"
                      id="create-number-of-units"
                      required
                      min="1"
                      value={createPropertyNumberOfUnits}
                      onChange={(e) => setCreatePropertyUnitsCount(e.target.value)}
                      placeholder="e.g. 10"
                    />
                    <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      Total number of units/apartments. You will define each unit below (name, rent, bedrooms, status, tenant).
                    </small>
                  </div>
                </div>

                {createPropertyNumberOfUnits > 0 && (
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Unit details</label>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '12px' }}>
                      Enter name (e.g. F1, House A, 101), bedrooms, rent, and status for each unit. If filled, select the tenant.
                    </p>
                    <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
                      {createPropertyUnits.slice(0, createPropertyNumberOfUnits).map((unit, index) => (
                        <div key={index} style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151' }}>Unit {index + 1}</div>
                <div className="form-row">
                  <div className="form-group">
                              <label>Unit name *</label>
                              <input
                                type="text"
                                value={unit.unitNumber}
                                onChange={(e) => updateCreatePropertyUnit(index, 'unitNumber', e.target.value)}
                                placeholder="e.g. F1, House A, 101"
                              />
                            </div>
                            <div className="form-group">
                              <label>Bedrooms</label>
                              <select
                                value={unit.bedrooms}
                                onChange={(e) => updateCreatePropertyUnit(index, 'bedrooms', parseInt(e.target.value, 10))}
                              >
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                            </div>
                            <div className="form-group">
                              <label>{selectedPropertyType === 'For Sale' ? 'Price (XOF)' : 'Rent (XOF)'} *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                                value={unit.rent}
                                onChange={(e) => updateCreatePropertyUnit(index, 'rent', e.target.value)}
                                placeholder="0"
                    />
                  </div>
                </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Status</label>
                              <select
                                value={unit.status}
                                onChange={(e) => updateCreatePropertyUnit(index, 'status', e.target.value)}
                              >
                                <option value="Vacant">Vacant</option>
                                <option value="Occupied">Filled</option>
                              </select>
                            </div>
                            {unit.status === 'Occupied' && (
                              <div className="form-group" style={{ flex: 1 }}>
                                <label>Tenant</label>
                                <select
                                  value={unit.tenant || ''}
                                  onChange={(e) => updateCreatePropertyUnit(index, 'tenant', e.target.value)}
                                >
                                  <option value="">Select tenant</option>
                                  {clients.map(c => (
                                    <option key={c.id || c.ID} value={c.name || c.Name || c.email || c.Email}>
                                      {c.name || c.Name || c.email || c.Email}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {createPropertyNumberOfUnits === 1 && (
                  <div className="form-row" style={{ marginTop: '12px' }}>
                    <div className="form-group">
                      <label>Total rent (from unit above)</label>
                      <input type="text" readOnly value={createPropertyUnits[0]?.rent ? `${Number(createPropertyUnits[0].rent).toLocaleString()} XOF` : '—'} style={{ background: '#f3f4f6' }} />
                    </div>
                  </div>
                )}
                {createPropertyNumberOfUnits > 1 && (
                  <div className="form-row" style={{ marginTop: '12px' }}>
                    <div className="form-group">
                      <label>Total rent (sum of all units)</label>
                      <input
                        type="text"
                        readOnly
                        value={`${createPropertyUnits.slice(0, createPropertyNumberOfUnits).reduce((s, u) => s + (parseFloat(u.rent) || 0), 0).toLocaleString()} XOF`}
                        style={{ background: '#f3f4f6' }}
                      />
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="create-bedrooms">Bedrooms</label>
                    <input
                      type="number"
                      name="bedrooms"
                      id="create-bedrooms"
                      min="0"
                      placeholder="2"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="create-bathrooms">Bathrooms</label>
                    <input
                      type="number"
                      name="bathrooms"
                      id="create-bathrooms"
                      step="0.5"
                      min="0"
                      placeholder="1.5"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="create-urgency">Urgency</label>
                    <select name="urgency" id="create-urgency" defaultValue="normal">
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="create-owner">Owner *</label>
                    <select name="owner" id="create-owner" required>
                      <option value="">Select Owner</option>
                      {owners.map(owner => (
                        <option key={owner.id || owner.ID} value={owner.id || owner.ID}>
                          {owner.name || owner.Name} ({owner.email || owner.Email})
                        </option>
                      ))}
                    </select>
                    {owners.length === 0 && (
                      <small style={{ color: '#ef4444', display: 'block', marginTop: '4px' }}>
                        No owners available. Please ask Agency Director to add owners first.
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Property images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingImage}
                    onChange={(e) => { const files = e.target.files; if (files?.length) handlePropertyImageUpload(files, false); e.target.value = ''; }}
                  />
                  {uploadingImage && <small style={{ color: '#6b7280' }}>Uploading...</small>}
                  {createPropertyImages.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {createPropertyImages.map((url, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                          <button type="button" onClick={() => setCreatePropertyImages(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="action-button secondary"
                    onClick={() => setShowCreatePropertyModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Property'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Building Modal (Property Management) */}
      {showAddBuildingModal && (
        <div className="modal-overlay" onClick={() => { setShowAddBuildingModal(false); setPmAddFormImages([]); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Building</h3>
              <button className="modal-close" onClick={() => { setShowAddBuildingModal(false); setPmAddFormImages([]); }}>×</button>
            </div>
            <form onSubmit={handleAddBuilding}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name of building *</label>
                  <input type="text" name="buildingName" required placeholder="e.g. Building A" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" name="buildingCity" placeholder="e.g. Abidjan" />
                  </div>
                  <div className="form-group">
                    <label>Neighborhood</label>
                    <input type="text" name="buildingNeighborhood" placeholder="e.g. Cocody" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Type of building (R+...)</label>
                  <select name="buildingTypeR">
                    <option value="">Select</option>
                    <option value="R+1">R+1</option>
                    <option value="R+2">R+2</option>
                    <option value="R+3">R+3</option>
                    <option value="R+4">R+4</option>
                    <option value="R+5">R+5</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Number of apartments in the building *</label>
                  <input type="number" name="buildingNumberOfApartments" required min="1" defaultValue="1" placeholder="e.g. 10" />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>You will see all apartments when you open the building. Use Edit on each row to add details (bedrooms, bathrooms, kitchens, etc.).</small>
                </div>
                <div className="form-group">
                  <label>Pictures</label>
                  <input type="file" accept="image/*" multiple disabled={uploadingImage} onChange={(e) => { const f = e.target.files; if (f?.length) handlePmAddFormImageUpload(f); e.target.value = ''; }} />
                  {uploadingImage && <small style={{ color: '#6b7280' }}>Uploading...</small>}
                  {pmAddFormImages.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {pmAddFormImages.map((url, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                          <button type="button" onClick={() => setPmAddFormImages(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-button secondary" onClick={() => { setShowAddBuildingModal(false); setPmAddFormImages([]); }}>Cancel</button>
                <button type="submit" className="action-button primary" disabled={loading}>{loading ? 'Creating...' : 'Add Building'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Villa Modal (Property Management) */}
      {showAddVillaModal && (
        <div className="modal-overlay" onClick={() => setShowAddVillaModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Villa</h3>
              <button className="modal-close" onClick={() => setShowAddVillaModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddVilla}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Precise location (Municipality + district) *</label>
                  <input type="text" name="villaPreciseLocation" placeholder="e.g. Cocody – Angré/ Riviera" />
                </div>
                <div className="form-group">
                  <label>Type of property (Villa R+)</label>
                  <select name="villaTypeR">
                    <option value="">Select</option>
                    <option value="R+1">R+1</option>
                    <option value="R+2">R+2</option>
                    <option value="R+3">R+3</option>
                    <option value="R+4">R+4</option>
                    <option value="R+5">R+5</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Address of the property</label>
                  <input type="text" name="villaAddress" placeholder="Full address" />
                </div>
                <div style={{ marginBottom: '12px', fontWeight: 600 }}>Total number of pieces</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Living rooms</label>
                    <input type="text" name="villaLivingRooms" placeholder="e.g. 1" />
                  </div>
                  <div className="form-group">
                    <label>Bedrooms</label>
                    <input type="text" name="villaBedrooms" placeholder="e.g. 3" />
                  </div>
                  <div className="form-group">
                    <label>Bathrooms / WC</label>
                    <input type="text" name="villaBathrooms" placeholder="e.g. 2" />
                  </div>
                  <div className="form-group">
                    <label>Visitor WC</label>
                    <input type="text" name="villaVisitorWc" placeholder="e.g. 1" />
                  </div>
                </div>
                <div style={{ marginBottom: '8px', fontWeight: 600 }}>Main equipment</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="villaCourtyard" /> Courtyard</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="villaGarage" /> Garage</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="villaGarden" /> Garden</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="villaAirConditioning" /> Air conditioning</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="villaSwimmingPool" /> Swimming pool</label>
                </div>
                <div className="form-group">
                  <label>Monthly rent (F CFA)</label>
                  <input type="number" name="villaMonthlyRent" min="0" step="1000" placeholder="e.g. 500000" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-button secondary" onClick={() => setShowAddVillaModal(false)}>Cancel</button>
                <button type="submit" className="action-button primary" disabled={loading}>{loading ? 'Creating...' : 'Add Villa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Land Modal (Property Management) */}
      {showAddLandModal && (
        <div className="modal-overlay" onClick={() => setShowAddLandModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Land</h3>
              <button className="modal-close" onClick={() => setShowAddLandModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddLand}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name of land *</label>
                  <input type="text" name="landName" required placeholder="e.g. Land at m'badon" />
                </div>
                <div className="form-group">
                  <label>Superficie (m²)</label>
                  <input type="number" name="landSuperficie" min="0" step="1" placeholder="e.g. 500" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" name="landCity" placeholder="e.g. Abidjan" />
                  </div>
                  <div className="form-group">
                    <label>Neighborhood</label>
                    <input type="text" name="landNeighborhood" placeholder="e.g. Cocody" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Documents available</label>
                  <select name="landDocuments">
                    <option value="">Select</option>
                    <option value="ACD">ACD</option>
                    <option value="Land title">Land title</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (F CFA)</label>
                  <input type="number" name="landPrice" min="0" step="1000" placeholder="e.g. 50000000" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-button secondary" onClick={() => setShowAddLandModal(false)}>Cancel</button>
                <button type="submit" className="action-button primary" disabled={loading}>{loading ? 'Creating...' : 'Add Land'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Apartment Modal (Property Management – for building or standalone) */}
      {showAddApartmentModal && (
        <div className="modal-overlay" onClick={() => { setShowAddApartmentModal(false); setAddApartmentPictures([]); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{pmPropertyId && (pmView === 'building-detail' || pmView === 'villa-detail') ? 'Add Apartment to ' + pmBuildingName : 'Add Apartment'}</h3>
              <button className="modal-close" onClick={() => { setShowAddApartmentModal(false); setAddApartmentPictures([]); }}>×</button>
            </div>
            <form onSubmit={handleAddApartment}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name of apartment *</label>
                  <input type="text" name="apartmentName" required placeholder="e.g. Appartment 1" />
                </div>
                <div style={{ marginBottom: '8px', fontWeight: 600 }}>Apartment features</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Floor</label>
                    <input type="text" name="apartmentFloor" placeholder="e.g. 2" />
                  </div>
                  <div className="form-group">
                    <label>Standard rooms</label>
                    <input type="text" name="apartmentStandardRooms" placeholder="e.g. 2" />
                  </div>
                  <div className="form-group">
                    <label>Self-contained rooms</label>
                    <input type="text" name="apartmentSelfContainedRooms" placeholder="e.g. 1" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Bathroom</label>
                    <input type="text" name="apartmentBathroom" placeholder="e.g. 1" />
                  </div>
                  <div className="form-group">
                    <label>Guest toilet</label>
                    <input type="text" name="apartmentGuestToilet" placeholder="e.g. 1" />
                  </div>
                  <div className="form-group">
                    <label>Living room</label>
                    <input type="text" name="apartmentLivingRoom" placeholder="e.g. 1" />
                  </div>
                  <div className="form-group">
                    <label>Kitchen</label>
                    <input type="text" name="apartmentKitchen" placeholder="e.g. 1" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Balcony</label>
                    <input type="text" name="apartmentBalcony" placeholder="e.g. 1" />
                  </div>
                  <div className="form-group">
                    <label>Parking</label>
                    <input type="text" name="apartmentParking" placeholder="e.g. 1" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Price of rent (F CFA)</label>
                  <input type="number" name="apartmentRent" min="0" step="1000" placeholder="e.g. 200000" />
                </div>
                <div className="form-group">
                  <label>Apartment photos</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingImage}
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files?.length) return;
                      setUploadingImage(true);
                      try {
                        for (const file of Array.from(files)) {
                          if (!file.type?.startsWith('image/')) continue;
                          const result = await cloudinaryService.uploadFile(file, 'property-images');
                          if (result.success && result.url) setAddApartmentPictures(prev => [...prev, result.url]);
                        }
                      } catch (err) {
                        addNotification('Failed to upload image', 'error');
                      } finally {
                        setUploadingImage(false);
                      }
                      e.target.value = '';
                    }}
                  />
                  <small style={{ display: 'block', color: '#6b7280', fontSize: '0.75rem', marginTop: '4px' }}>You can select multiple photos (e.g. 5 or more).</small>
                  {uploadingImage && <small style={{ color: '#6b7280' }}>Uploading...</small>}
                  {addApartmentPictures.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {addApartmentPictures.map((url, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                          <button type="button" onClick={() => setAddApartmentPictures(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-button secondary" onClick={() => { setShowAddApartmentModal(false); setAddApartmentPictures([]); }}>Cancel</button>
                <button type="submit" className="action-button primary" disabled={loading}>{loading ? 'Adding...' : 'Add Apartment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Apartment Modal (full details aligned with state of entry/exit) */}
      {showEditApartmentModal && editingUnit && (
        <div className="modal-overlay" onClick={() => { setShowEditApartmentModal(false); setEditingUnit(null); setEditApartmentPictures([]); setEditApartmentStatusChoice('Vacant'); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit apartment – {editingUnit.unitNumber || 'Unit'}</h3>
              <button className="modal-close" onClick={() => { setShowEditApartmentModal(false); setEditingUnit(null); setEditApartmentPictures([]); setEditApartmentStatusChoice('Vacant'); }}>×</button>
            </div>
            <form onSubmit={handleEditApartment}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name of apartment *</label>
                  <input type="text" name="editApartmentName" required defaultValue={editingUnit.unitNumber || ''} placeholder="e.g. Apartment 1" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type of property (as in state of entry/exit)</label>
                    <select name="editApartmentPropertyType" defaultValue={(typeof editingUnit.features === 'string' && (() => { try { const f = JSON.parse(editingUnit.features); return f?.unitType || ''; } catch { return ''; } })()) || ''}>
                      <option value="">Select</option>
                      <option value="Studio">Studio</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Duplex">Duplex</option>
                      <option value="Villa">Villa</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Number of bedrooms</label>
                    <input type="number" name="editApartmentBedrooms" min="0" defaultValue={editingUnit.bedrooms ?? 0} placeholder="e.g. 2" />
                  </div>
                  <div className="form-group">
                    <label>Number of bathrooms</label>
                    <input type="number" name="editApartmentBathrooms" min="0" step="0.5" defaultValue={editingUnit.bathrooms ?? 0} placeholder="e.g. 1" />
                  </div>
                  <div className="form-group">
                    <label>Number of kitchens</label>
                    <input type="number" name="editApartmentKitchens" min="0" defaultValue={(typeof editingUnit.features === 'string' && (() => { try { const f = JSON.parse(editingUnit.features); return f?.numberOfKitchens ?? 0; } catch { return 0; } })()) || 0} placeholder="e.g. 1" />
                  </div>
                  <div className="form-group">
                    <label>Swimming pool</label>
                    <select name="editApartmentSwimmingPool" defaultValue={(typeof editingUnit.features === 'string' && (() => { try { const f = JSON.parse(editingUnit.features); return f?.hasSwimmingPool ? 'yes' : 'no'; } catch { return 'no'; } })()) || 'no'}>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '8px', fontWeight: 600 }}>Other features (Floor, rooms, etc.)</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Floor</label>
                    <input type="text" name="editApartmentFloor" defaultValue={(typeof editingUnit.features === 'string' && (() => { try { const f = JSON.parse(editingUnit.features); return f?.floor || ''; } catch { return ''; } })()) || ''} placeholder="e.g. 2" />
                  </div>
                  <div className="form-group">
                    <label>Standard rooms</label>
                    <input type="text" name="editApartmentStandardRooms" defaultValue={(typeof editingUnit.features === 'string' && (() => { try { const f = JSON.parse(editingUnit.features); return f?.standardRooms || ''; } catch { return ''; } })()) || ''} placeholder="e.g. 2" />
                  </div>
                  <div className="form-group">
                    <label>Self-contained rooms</label>
                    <input type="text" name="editApartmentSelfContainedRooms" defaultValue={(typeof editingUnit.features === 'string' && (() => { try { const f = JSON.parse(editingUnit.features); return f?.selfContainedRooms || ''; } catch { return ''; } })()) || ''} placeholder="e.g. 1" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Bathroom</label>
                    <input type="text" name="editApartmentBathroom" defaultValue={(typeof editingUnit.features === 'string' && (() => { try { const f = JSON.parse(editingUnit.features); return f?.bathroom || ''; } catch { return ''; } })()) || ''} placeholder="e.g. 1" />
                  </div>
                  <div className="form-group">
                    <label>Guest toilet</label>
                    <input type="text" name="editApartmentGuestToilet" defaultValue={(typeof editingUnit.features === 'string' && (() => { try { const f = JSON.parse(editingUnit.features); return f?.guestToilet || ''; } catch { return ''; } })()) || ''} placeholder="e.g. 1" />
                  </div>
                  <div className="form-group">
                    <label>Living room</label>
                    <input type="text" name="editApartmentLivingRoom" defaultValue={(typeof editingUnit.features === 'string' && (() => { try { const f = JSON.parse(editingUnit.features); return f?.livingRoom || ''; } catch { return ''; } })()) || ''} placeholder="e.g. 1" />
                  </div>
                  <div className="form-group">
                    <label>Kitchen</label>
                    <input type="text" name="editApartmentKitchen" defaultValue={(typeof editingUnit.features === 'string' && (() => { try { const f = JSON.parse(editingUnit.features); return f?.kitchen || ''; } catch { return ''; } })()) || ''} placeholder="e.g. 1" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Balcony</label>
                    <input type="text" name="editApartmentBalcony" defaultValue={(typeof editingUnit.features === 'string' && (() => { try { const f = JSON.parse(editingUnit.features); return f?.balcony || ''; } catch { return ''; } })()) || ''} placeholder="e.g. 1" />
                  </div>
                  <div className="form-group">
                    <label>Parking</label>
                    <input type="text" name="editApartmentParking" defaultValue={(typeof editingUnit.features === 'string' && (() => { try { const f = JSON.parse(editingUnit.features); return f?.parking || ''; } catch { return ''; } })()) || ''} placeholder="e.g. 1" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price of rent (F CFA)</label>
                    <input type="number" name="editApartmentRent" min="0" step="1000" defaultValue={editingUnit.rentPrice ?? 0} placeholder="e.g. 200000" />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="editApartmentStatus"
                      value={editApartmentStatusChoice}
                      onChange={(e) => setEditApartmentStatusChoice(e.target.value)}
                    >
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                    </select>
                  </div>
                  {editApartmentStatusChoice === 'Occupied' && (
                    <>
                      <div className="form-group">
                        <label>Tenant</label>
                        <input type="text" name="editApartmentTenant" defaultValue={editingUnit.tenant || ''} placeholder="Tenant name" />
                      </div>
                      <div className="form-group">
                        <label>Enter date</label>
                        <input type="date" name="editApartmentEnterDate" defaultValue={editingUnit.enterDate ? (editingUnit.enterDate.includes('/') ? (() => { const p = editingUnit.enterDate.split('/'); if (p.length !== 3) return ''; const y = String(p[2]).length === 2 ? '20' + p[2] : p[2]; return `${y}-${String(p[1]).padStart(2,'0')}-${String(p[0]).padStart(2,'0')}`; })() : editingUnit.enterDate) : ''} />
                      </div>
                    </>
                  )}
                </div>
                <div className="form-group">
                  <label>Apartment photos</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingImage}
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files?.length) return;
                      setUploadingImage(true);
                      try {
                        for (const file of Array.from(files)) {
                          if (!file.type?.startsWith('image/')) continue;
                          const result = await cloudinaryService.uploadFile(file, 'property-images');
                          if (result.success && result.url) setEditApartmentPictures(prev => [...prev, result.url]);
                        }
                      } catch (err) {
                        addNotification('Failed to upload image', 'error');
                      } finally {
                        setUploadingImage(false);
                      }
                      e.target.value = '';
                    }}
                  />
                  <small style={{ display: 'block', color: '#6b7280', fontSize: '0.75rem', marginTop: '4px' }}>You can select multiple photos (e.g. 5 or more).</small>
                  {uploadingImage && <small style={{ color: '#6b7280' }}>Uploading...</small>}
                  {editApartmentPictures.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {editApartmentPictures.map((url, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                          <button type="button" onClick={() => setEditApartmentPictures(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-button secondary" onClick={() => { setShowEditApartmentModal(false); setEditingUnit(null); setEditApartmentPictures([]); setEditApartmentStatusChoice('Vacant'); }}>Cancel</button>
                <button type="submit" className="action-button primary" disabled={loading}>{loading ? 'Saving...' : 'Save apartment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Apartment Modal – full details + clickable photos */}
      {showViewApartmentModal && viewingUnit && (
        <div className="modal-overlay" onClick={() => { setShowViewApartmentModal(false); setViewingUnit(null); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apartment – {viewingUnit.unitNumber || 'Unit'}</h3>
              <button className="modal-close" onClick={() => { setShowViewApartmentModal(false); setViewingUnit(null); }}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                <div><strong>Name</strong>: {viewingUnit.unitNumber || viewingUnit.name || '—'}</div>
                <div><strong>Type</strong>: {viewingUnit.type || '—'}</div>
                <div><strong>Bedrooms</strong>: {viewingUnit.bedrooms ?? '—'}</div>
                <div><strong>Bathrooms</strong>: {viewingUnit.bathrooms ?? '—'}</div>
                <div><strong>Rent</strong>: {typeof viewingUnit.rentPrice === 'number' ? viewingUnit.rentPrice.toLocaleString() : viewingUnit.rentPrice ?? '—'} F CFA</div>
                <div><strong>Tenant</strong>: {viewingUnit.tenant || '—'}</div>
                <div><strong>Status</strong>: {viewingUnit.status || viewingUnit.statut || '—'}</div>
                <div><strong>Enter date</strong>: {viewingUnit.enterDate || '—'}</div>
              </div>
              {parseUnitPictures(viewingUnit.picture).length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <strong>Photos</strong>
                  <small style={{ display: 'block', color: '#6b7280', marginTop: '4px' }}>Click an image to expand</small>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                    {parseUnitPictures(viewingUnit.picture).map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setExpandedImageUrl(url)}
                        style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, overflow: 'hidden' }}
                      >
                        <img src={url} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', padding: '12px 20px' }}>
              <button type="button" className="action-button secondary" onClick={() => { setShowViewApartmentModal(false); setViewingUnit(null); }}>Close</button>
              <button type="button" className="action-button primary" onClick={() => { setShowViewApartmentModal(false); setViewingUnit(null); setEditingUnit(viewingUnit); setEditApartmentPictures(parseUnitPictures(viewingUnit.picture)); setEditApartmentStatusChoice((viewingUnit.status || viewingUnit.statut || 'Vacant').toString()); setShowEditApartmentModal(true); }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditPropertyModal && editingProperty && (
        <div className="modal-overlay" onClick={() => {
          setShowEditPropertyModal(false);
          setEditingProperty(null);
          setSelectedPropertyType('');
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Property</h3>
              <button className="modal-close" onClick={() => {
                setShowEditPropertyModal(false);
                setEditingProperty(null);
                setSelectedPropertyType('');
              }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateProperty}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-address">Address</label>
                    <input
                      type="text"
                      name="address"
                      id="edit-address"
                      defaultValue={editingProperty.Address || editingProperty.address || ''}
                      placeholder="123 Main St, Apt 4B"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-type">Building Type</label>
                    <select 
                      name="type" 
                      id="edit-type" 
                      defaultValue={editingProperty.Type || editingProperty.type || ''}
                      onChange={(e) => setShowPropertyBuildingType(e.target.value === 'Apartment')}
                    >
                      <option value="">Select Building Type</option>
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Condo">Condo</option>
                      <option value="Studio">Studio</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-property-type">Property Type (For Sale or Rent)</label>
                    <select 
                      name="propertyType" 
                      id="edit-property-type" 
                      defaultValue={editingProperty.PropertyType || editingProperty.propertyType || ''}
                      onChange={(e) => setSelectedPropertyType(e.target.value)}
                    >
                      <option value="">Select Property Type</option>
                      <option value="For Sale">For Sale</option>
                      <option value="For Rent">For Rent</option>
                    </select>
                  </div>
                  {(showPropertyBuildingType || (editingProperty.Type || editingProperty.type) === 'Apartment') && (
                    <div className="form-group">
                      <label htmlFor="edit-building-type">Building Type (if Apartment)</label>
                      <select name="buildingType" id="edit-building-type" defaultValue={editingProperty.BuildingType || editingProperty.buildingType || ''}>
                        <option value="">Select Building Type</option>
                        <option value="High-rise">High-rise</option>
                        <option value="Low-rise">Low-rise</option>
                        <option value="Duplex">Duplex</option>
                        <option value="Townhouse">Townhouse</option>
                        <option value="Penthouse">Penthouse</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-status">Status</label>
                    <select name="status" id="edit-status" defaultValue={editingProperty.Status || editingProperty.status || ''}>
                      <option value="">Select Status</option>
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-number-of-units">Number of Units</label>
                    <input
                      type="number"
                      name="numberOfUnits"
                      id="edit-number-of-units"
                      min="1"
                      value={editPropertyNumberOfUnits}
                      onChange={(e) => setEditPropertyUnitsCount(e.target.value)}
                    />
                  </div>
                </div>

                {editPropertyNumberOfUnits > 0 && (
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Unit details</label>
                    <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
                      {editPropertyUnits.slice(0, editPropertyNumberOfUnits).map((unit, index) => (
                        <div key={index} style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151' }}>Unit {index + 1}</div>
                <div className="form-row">
                  <div className="form-group">
                              <label>Unit name *</label>
                    <input
                                type="text"
                                value={unit.unitNumber}
                                onChange={(e) => updateEditPropertyUnit(index, 'unitNumber', e.target.value)}
                                placeholder="e.g. F1, House A"
                    />
                  </div>
                            <div className="form-group">
                              <label>Bedrooms</label>
                              <select value={unit.bedrooms} onChange={(e) => updateEditPropertyUnit(index, 'bedrooms', parseInt(e.target.value, 10))}>
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                </div>
                  <div className="form-group">
                              <label>Rent (XOF) *</label>
                    <input
                      type="number"
                                step="0.01"
                      min="0"
                                value={unit.rent}
                                onChange={(e) => updateEditPropertyUnit(index, 'rent', e.target.value)}
                    />
                  </div>
                          </div>
                          <div className="form-row">
                  <div className="form-group">
                              <label>Status</label>
                              <select value={unit.status} onChange={(e) => updateEditPropertyUnit(index, 'status', e.target.value)}>
                                <option value="Vacant">Vacant</option>
                                <option value="Occupied">Filled</option>
                              </select>
                            </div>
                            {unit.status === 'Occupied' && (
                              <div className="form-group" style={{ flex: 1 }}>
                                <label>Tenant</label>
                                <select value={unit.tenant || ''} onChange={(e) => updateEditPropertyUnit(index, 'tenant', e.target.value)}>
                                  <option value="">Select tenant</option>
                                  {clients.map(c => (
                                    <option key={c.id || c.ID} value={c.name || c.Name || c.email || c.Email}>{c.name || c.Name || c.email || c.Email}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-row" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label>Total rent (sum of units)</label>
                    <input
                      type="text"
                      readOnly
                      value={`${editPropertyUnits.slice(0, editPropertyNumberOfUnits).reduce((s, u) => s + (parseFloat(u.rent) || 0), 0).toLocaleString()} XOF`}
                      style={{ background: '#f3f4f6' }}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-bedrooms">Default Bedrooms</label>
                    <input type="number" name="bedrooms" id="edit-bedrooms" min="0" defaultValue={editingProperty.Bedrooms || editingProperty.bedrooms || ''} placeholder="2" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-bathrooms">Default Bathrooms</label>
                    <input type="number" name="bathrooms" id="edit-bathrooms" step="0.5" min="0" defaultValue={editingProperty.Bathrooms || editingProperty.bathrooms || ''} placeholder="1.5" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-urgency">Urgency</label>
                    <select name="urgency" id="edit-urgency" defaultValue={editingProperty.Urgency || editingProperty.urgency || 'normal'}>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                  <div className="form-group">
                  <label>Property images</label>
                    <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingImage}
                    onChange={(e) => { const files = e.target.files; if (files?.length) handlePropertyImageUpload(files, true); e.target.value = ''; }}
                  />
                  <small style={{ display: 'block', color: '#6b7280', fontSize: '0.75rem', marginTop: '4px' }}>You can select multiple photos at once (e.g. 5 or more).</small>
                  {uploadingImage && <small style={{ color: '#6b7280' }}>Uploading...</small>}
                  {editPropertyImages.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {editPropertyImages.map((url, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                          <button type="button" onClick={() => setEditPropertyImages(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>×</button>
                  </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="action-button secondary"
                    onClick={() => {
                      setShowEditPropertyModal(false);
                      setEditingProperty(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Property'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesManagerDashboard;