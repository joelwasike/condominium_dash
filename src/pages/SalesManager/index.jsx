import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TrendingUp, Users, AlertTriangle, Building, Calendar, ClipboardList, UserPlus, Upload, X, FileText, Filter, Search, Plus, MessageCircle, Settings, Megaphone, FileSpreadsheet, Copy, Check, Download, ArrowLeft, Mail, Phone, MapPin, DollarSign, Wrench, FileCheck, StickyNote, Receipt, MessageSquare, AlertCircle } from 'lucide-react';
import Modal from '../../components/Modal';
import DocumentUpload from '../../components/DocumentUpload';
import ContractUpload from '../../components/ContractUpload';
import { salesManagerService } from '../../services/salesManagerService';
import { messagingService } from '../../services/messagingService';
import { cloudinaryService, validateFileType, validateFileSize } from '../../services/cloudinaryService';
import { API_CONFIG } from '../../config/api';
import { isDemoMode, getSalesManagerDemoData, getCommercialDemoData } from '../../utils/demoData';
import RoleLayout from '../../components/RoleLayout';
import SettingsPage from '../SettingsPage';
import { t, getLanguage } from '../../utils/i18n';
import '../../components/RoleLayout.css';
import '../SalesManagerDashboard.css';
import OverviewTab from './OverviewTab';
import OccupancyTab from './OccupancyTab';
import SalesTrackingTab from './SalesTrackingTab';
import VisitsTab from './VisitsTab';
import RequestsTab from './RequestsTab';
import ClientsTab from './ClientsTab';
import PropertyManagementTab from './PropertyManagementTab';
import AlertsTab from './AlertsTab';
import AdvertisementsTab from './AdvertisementsTab';
import MessagesTab from './MessagesTab';

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
  const [selectedMoveInPropertyId, setSelectedMoveInPropertyId] = useState('');
  const [moveInPropertyLocked, setMoveInPropertyLocked] = useState(false);

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
    // Backend doesn't currently persist a dedicated deposit-paid date on ClientApplication.
    // Use the admin checklist timestamp as a fallback so move-in validation can proceed.
    const checklistCreatedAt =
      approvedClientChecklist?.CreatedAt ||
      approvedClientChecklist?.createdAt ||
      null;
    const paidAtCandidate = paidAtRaw || (paid ? checklistCreatedAt : null);
    const paidAt = paidAtCandidate ? new Date(paidAtCandidate) : null;
    const maxMoveInDate = paidAt ? addMonths(paidAt, 1).toISOString().split('T')[0] : '';
    return { paid, paidAt, maxMoveInDate };
  }, [selectedApprovedClient, approvedClientChecklist, addMonths]);

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
  // privateNoteInput, addingNote, maintenanceDetail, maintenanceDetailLoading moved to ClientsTab
  
  // Edit states
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  // Tenant current unit assignment (auto-loaded when Edit Tenant modal opens); null = not assigned or loading
  const [tenantAssignment, setTenantAssignment] = useState(null); // { propertyId, unitId, buildingName, unitNumber } | null
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [removeFromUnitLoading, setRemoveFromUnitLoading] = useState(false);
  const [editAssignPropertyId, setEditAssignPropertyId] = useState('');
  const [editAssignUnitId, setEditAssignUnitId] = useState('');
  const [editAssignUnits, setEditAssignUnits] = useState([]); // [{id, unitNumber, status, tenant}]
  const [editAssignLoadingUnits, setEditAssignLoadingUnits] = useState(false);
  const [editPropertyOptions, setEditPropertyOptions] = useState([]);
  const [editPropertyLoading, setEditPropertyLoading] = useState(false);
  const [editSelectedPropertyId, setEditSelectedPropertyId] = useState('');
  const [editSelectedPropertyAddress, setEditSelectedPropertyAddress] = useState('');
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
  
  // Bulk import (properties + tenants) – kept for tenant import if needed
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportTab, setBulkImportTab] = useState('properties');
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [showPropertyImportModal, setShowPropertyImportModal] = useState(false);
  const [propertyImportFile, setPropertyImportFile] = useState(null);
  const [propertyImportLoading, setPropertyImportLoading] = useState(false);

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

  // When Edit Tenant modal opens, load which unit this tenant is assigned to
  useEffect(() => {
    if (!showEditClientModal || !editingClient) {
      setTenantAssignment(null);
      setLoadingAssignment(false);
      return;
    }
    let cancelled = false;
    setLoadingAssignment(true);
    setTenantAssignment(null);
    (async () => {
      try {
        const clientId = editingClient.id ?? editingClient.ID;
        if (!clientId) return;
        const res = await salesManagerService.getClientUnitAssignment(clientId);
        if (cancelled) return;
        if (res?.assigned) {
          setTenantAssignment({
            propertyId: res.propertyId,
            unitId: res.unitId,
            buildingName: res.buildingName || 'Building',
            unitNumber: res.unitNumber || '—',
          });
          return;
        }
        setTenantAssignment(null);
      } catch (_) {
        if (!cancelled) setTenantAssignment(null);
      }
    })().finally(() => { if (!cancelled) setLoadingAssignment(false); });
    return () => { cancelled = true; };
  }, [showEditClientModal, editingClient]);

  // Load available units when choosing a property in Edit Tenant modal
  useEffect(() => {
    if (!showEditClientModal) return;
    if (!editAssignPropertyId) {
      setEditAssignUnits([]);
      setEditAssignUnitId('');
      setEditAssignLoadingUnits(false);
      return;
    }
    let cancelled = false;
    setEditAssignLoadingUnits(true);
    (async () => {
      try {
        const detail = await salesManagerService.getPropertyBuildingDetail(editAssignPropertyId);
        const units = Array.isArray(detail?.units) ? detail.units : [];
        if (cancelled) return;
        setEditAssignUnits(units);
      } catch (e) {
        if (!cancelled) {
          setEditAssignUnits([]);
          addNotification('Failed to load units for the selected property.', 'error');
        }
      } finally {
        if (!cancelled) setEditAssignLoadingUnits(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showEditClientModal, editAssignPropertyId]);

  // Load properties fresh from backend when Edit Tenant modal opens (so dropdown is always up-to-date)
  useEffect(() => {
    if (!showEditClientModal) return;
    let cancelled = false;
    setEditPropertyLoading(true);
    (async () => {
      try {
        const list = await salesManagerService.getProperties();
        const props = Array.isArray(list) ? list : (list?.items || list?.data || []);
        if (cancelled) return;
        setEditPropertyOptions(Array.isArray(props) ? props : []);

        const currentAddr = (editingClient?.Property || editingClient?.property || '').toString().trim().toLowerCase();
        if (currentAddr) {
          const match = (Array.isArray(props) ? props : []).find((p) => (p.address ?? p.Address ?? '').toString().trim().toLowerCase() === currentAddr);
          if (match) {
            const pid = (match.id ?? match.ID ?? '').toString();
            setEditSelectedPropertyId(pid);
            setEditSelectedPropertyAddress((match.address ?? match.Address ?? '').toString());
            setEditAssignPropertyId(pid);
          } else {
            setEditSelectedPropertyId('');
            setEditSelectedPropertyAddress((editingClient?.Property || editingClient?.property || '').toString());
          }
        } else {
          setEditSelectedPropertyId('');
          setEditSelectedPropertyAddress('');
        }
      } catch (e) {
        if (!cancelled) {
          setEditPropertyOptions([]);
          addNotification('Failed to load properties for editing.', 'error');
        }
      } finally {
        if (!cancelled) setEditPropertyLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showEditClientModal]);

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
      setSelectedMoveInPropertyId('');
      setMoveInPropertyLocked(false);
      return;
    }
    // Reset move-in property selection when switching approved clients; it will be auto-filled after checklist loads.
    setSelectedMoveInPropertyId('');
    setMoveInPropertyLocked(false);
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

  const applyMoveInPropertySelection = useCallback((propertyIdValue) => {
    const val = propertyIdValue || '';
    setSelectedMoveInPropertyId(val);

    const selectedProperty = val ? properties.find((p) => String(p.ID || p.id) === String(val)) : null;
    if (!selectedProperty) {
      setMoveInFormPropertyRent(0);
      return;
    }

    // Avoid floating-point artifacts (e.g., 99999.90000000001) by rounding to an integer amount.
    const rawRent = Number(selectedProperty.Rent || selectedProperty.rent || 0);
    const propertyRent = Number.isFinite(rawRent) ? Math.round(rawRent) : 0;
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
  }, [properties]);

  // Prefill property from admin checklist (property is stored as address string on the checklist).
  useEffect(() => {
    if (!selectedApprovedClientId) return;

    const checklistProperty = approvedClientChecklist?.Property || approvedClientChecklist?.property || '';
    const checklistPropertyStr = String(checklistProperty || '').trim();
    if (!checklistPropertyStr) {
      setMoveInPropertyLocked(false);
      return;
    }

    const match = properties.find((p) => {
      const addr = String(p.Address || p.address || '').trim();
      return addr.toLowerCase() === checklistPropertyStr.toLowerCase();
    });
    if (match) {
      setMoveInPropertyLocked(true);
      applyMoveInPropertySelection(String(match.ID || match.id || ''));
    } else {
      setMoveInPropertyLocked(false);
    }
  }, [approvedClientChecklist, selectedApprovedClientId, properties, applyMoveInPropertySelection]);

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
      if (String(userId).startsWith('group:')) return;
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

  const downloadTenantExampleFile = async () => {
    try {
      const res = await fetch('/tenants_import_example.xlsx');
      if (!res.ok) throw new Error('Failed to download example file');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'TENANT IMPORT UPDATE.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      addNotification(e?.message || 'Failed to download example file', 'error');
    }
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
      ['456 Oak Ave', 'Apartment', 'For Rent', 'High-rise', 'Vacant', '2', '', '2', '1', 'normal', '', 'F1|F2', '100000|120000']
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
    downloadTenantExampleFile();
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
      ['456 Oak Ave', 'Apartment', 'For Rent', 'High-rise', 'Vacant', '2', '', '2', '1', 'normal', '', 'F1|F2', '100000|120000']
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
    const result = await salesManagerService.importPropertiesFromFile(file);
    return {
      success: result.success || result.created?.length || 0,
      failed: result.failed || result.errors?.length || 0,
      result
    };
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
        const res = await handleBulkImportProperties(bulkImportFile);
        totalSuccess += (res.success || 0);
        totalFailed += (res.failed || 0);
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
    // If the property field is disabled (auto-filled), it won't be included in FormData.
    const propertyIdOrAddress =
      formData.get('property')?.trim() ||
      (selectedMoveInPropertyId ? String(selectedMoveInPropertyId).trim() : '');
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
    if (!depositPaid) {
      addNotification('Deposit must be marked as paid before creating a tenant account.', 'error');
      return;
    }
    if (depositPaid && !approvedClientDepositInfo?.paidAt) {
      addNotification('Deposit paid date is missing. Please save the admin checklist for this client first.', 'error');
      return;
    }
    if (depositPaid && approvedClientDepositInfo?.paidAt) {
      const maxMoveIn = addMonths(new Date(approvedClientDepositInfo.paidAt), 1).toISOString().split('T')[0];
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
    setEditAssignPropertyId('');
    setEditAssignUnitId('');
    setEditAssignUnits([]);
    setEditSelectedPropertyId('');
    setEditSelectedPropertyAddress((client?.Property || client?.property || '').toString());
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
      property: (formData.get('property') || '').toString().trim(),
      amount: formData.get('amount') ? parseFloat(formData.get('amount')) : editingClient.Amount,
      status: formData.get('status') || editingClient.Status,
    };
    const unitRaw = formData.get('unitNumber');
    if (unitRaw != null) {
      const nextUnitNumber = unitRaw.toString().trim();
      updateData.unitNumber = nextUnitNumber || null;
    }
    if (!updateData.property) {
      updateData.property = (editingClient.Property || editingClient.property || '').toString();
    }

    try {
      setLoading(true);
      const clientId = editingClient.ID || editingClient.id;
      await salesManagerService.updateClient(clientId, updateData);

      // Optional: assign/move tenant to a selected unit (if provided)
      const desiredUnitId = (formData.get('assignUnitId') || '').toString().trim();
      const desiredPropertyId = (formData.get('assignPropertyId') || '').toString().trim();
      if (desiredPropertyId && desiredUnitId && updateData.name) {
        // If currently assigned elsewhere, vacate that unit first.
        if (tenantAssignment && (String(tenantAssignment.propertyId) !== String(desiredPropertyId) || String(tenantAssignment.unitId) !== String(desiredUnitId))) {
          try {
            await salesManagerService.updatePropertyUnit(tenantAssignment.propertyId, tenantAssignment.unitId, {
              tenant: null,
              status: 'Vacant',
              enterDate: null,
            });
          } catch (vacErr) {
            console.warn('Failed to vacate previous unit:', vacErr);
          }
        }
        const enterDate = editingClient?.LastPayment || editingClient?.lastPayment || null;
        await salesManagerService.updatePropertyUnit(desiredPropertyId, desiredUnitId, {
          tenant: updateData.name,
          status: 'Occupied',
          rent: updateData.amount || 0,
          enterDate: enterDate || null,
        });

        // Also sync client property address and unit number based on selected unit/property (best-effort).
        const selectedProp = (properties || []).find((p) => String(p.id ?? p.ID) === String(desiredPropertyId));
        const propAddr = ((selectedProp?.address ?? selectedProp?.Address ?? updateData.property) || '').toString().trim();
        const selectedUnit = (editAssignUnits || []).find((u) => String(u.id ?? u.ID) === String(desiredUnitId));
        const unitNum = ((selectedUnit?.unitNumber ?? selectedUnit?.UnitNumber ?? selectedUnit?.name) || '').toString().trim();
        try {
          await salesManagerService.updateClient(clientId, { property: propAddr, unitNumber: unitNum, status: 'Active' });
        } catch (syncErr) {
          console.warn('Unit assigned but could not sync tenant property/unit:', syncErr);
        }
      }
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

  // Property Management helpers
  const getOwnerId = (owner) => owner.id || owner.ID;

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

  // Client filtering
  const normalizeStatus = (s) => (s || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
  const statusMatches = (clientStatus, filterStatus) => {
    const a = normalizeStatus(clientStatus);
    const b = normalizeStatus(filterStatus);
    return a === b || a.replace(/\s/g, '') === b.replace(/\s/g, '');
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      if (clientStatusFilter) {
        const clientStatus = (client.Status || client.status || '').toString();
        if (!statusMatches(clientStatus, clientStatusFilter)) return false;
      }
      if (clientPropertyFilter) {
        const clientProperty = ((client.Property || client.property) || '').toLowerCase();
        const filterProperty = clientPropertyFilter.toLowerCase().trim();
        if (!clientProperty.includes(filterProperty)) return false;
      }
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

  // Handle send message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedUserId) return;
    if (String(selectedUserId).startsWith('group:')) return;
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
      const payload = { toUserId: selectedUserId, content };
      const sentMessage = await messagingService.sendMessage(payload);
      if (sentMessage && sentMessage.id) {
        setChatMessages(prev => prev.map(msg => msg.id === tempMessageId ? sentMessage : msg));
      } else {
        await loadChatForUser(selectedUserId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addNotification(error.message || 'Failed to send message', 'error');
      setChatMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      setChatInput(content);
    }
  };

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return <OverviewTab loading={loading} overviewData={overviewData} properties={properties} clients={clients} unpaidRents={unpaidRents} alerts={alerts} advertisements={advertisements} currentAdIndex={currentAdIndex} setCurrentAdIndex={setCurrentAdIndex} carouselIntervalRef={carouselIntervalRef} />;
      case 'occupancy':
        return <OccupancyTab properties={properties} clients={clients} propertyStatusFilter={propertyStatusFilter} setPropertyStatusFilter={setPropertyStatusFilter} propertyTypeFilter={propertyTypeFilter} setPropertyTypeFilter={setPropertyTypeFilter} propertyUrgencyFilter={propertyUrgencyFilter} setPropertyUrgencyFilter={setPropertyUrgencyFilter} occupancyDetailView={occupancyDetailView} setOccupancyDetailView={setOccupancyDetailView} occupancySelectedProperty={occupancySelectedProperty} setOccupancySelectedProperty={setOccupancySelectedProperty} occupancyDetailData={occupancyDetailData} setOccupancyDetailData={setOccupancyDetailData} occupancyDetailLoading={occupancyDetailLoading} handleOpenOccupancyDetail={handleOpenOccupancyDetail} openEditPropertyModal={openEditPropertyModal} />;
      case 'sales-tracking':
        return <SalesTrackingTab salesProperties={salesProperties} salesTypeFilter={salesTypeFilter} setSalesTypeFilter={setSalesTypeFilter} />;
      case 'visits':
        return <VisitsTab loading={loading} visits={visits} visitTab={visitTab} setVisitTab={setVisitTab} visitStatusFilter={visitStatusFilter} setVisitStatusFilter={setVisitStatusFilter} openScheduleVisit={openScheduleVisit} openUpdateVisitStatus={openUpdateVisitStatus} />;
      case 'requests':
        return <RequestsTab loading={loading} requests={requests} requestStatusFilter={requestStatusFilter} setRequestStatusFilter={setRequestStatusFilter} handleApproveRequest={handleApproveRequest} openFollowUp={openFollowUp} />;
      case 'clients':
        return <ClientsTab loading={loading} clients={clients} setClients={setClients} filteredClients={filteredClients} waitingListClients={waitingListClients} unpaidRents={unpaidRents} clientStatusFilter={clientStatusFilter} setClientStatusFilter={setClientStatusFilter} clientPropertyFilter={clientPropertyFilter} setClientPropertyFilter={setClientPropertyFilter} clientSearchText={clientSearchText} setClientSearchText={setClientSearchText} handleEditClient={handleEditClient} handleEditUnpaidRent={handleEditUnpaidRent} setImportMode={setImportMode} setExcelFile={setExcelFile} setShowTenantCreationModal={setShowTenantCreationModal} selectedTenantId={selectedTenantId} setSelectedTenantId={setSelectedTenantId} tenantDetail={tenantDetail} setTenantDetail={setTenantDetail} tenantDetailLoading={tenantDetailLoading} addNotification={addNotification} setEditingClient={setEditingClient} setShowEditClientModal={setShowEditClientModal} />;
      case 'property-management':
        return <PropertyManagementTab properties={properties} owners={owners} loading={loading} pmView={pmView} setPmView={setPmView} pmOwnerId={pmOwnerId} setPmOwnerId={setPmOwnerId} pmOwnerName={pmOwnerName} setPmOwnerName={setPmOwnerName} ownerAssets={ownerAssets} setOwnerAssets={setOwnerAssets} pmPropertyId={pmPropertyId} pmBuildingName={pmBuildingName} buildingDetail={buildingDetail} setBuildingDetail={setBuildingDetail} landDetail={landDetail} setLandDetail={setLandDetail} pmLoading={pmLoading} setPmLoading={setPmLoading} propertyManagementSearch={propertyManagementSearch} setPropertyManagementSearch={setPropertyManagementSearch} setShowAddBuildingModal={setShowAddBuildingModal} setShowAddVillaModal={setShowAddVillaModal} setShowAddLandModal={setShowAddLandModal} setShowAddApartmentModal={setShowAddApartmentModal} setShowEditApartmentModal={setShowEditApartmentModal} setEditingUnit={setEditingUnit} setEditApartmentPictures={setEditApartmentPictures} setEditApartmentStatusChoice={setEditApartmentStatusChoice} setShowViewApartmentModal={setShowViewApartmentModal} setViewingUnit={setViewingUnit} setShowCreatePropertyModal={setShowCreatePropertyModal} setShowPropertyImportModal={setShowPropertyImportModal} setPropertyImportFile={setPropertyImportFile} setSelectedPropertyType={setSelectedPropertyType} setCreatePropertyImages={setCreatePropertyImages} setSelectedPropertyDetail={setSelectedPropertyDetail} openEditPropertyModal={openEditPropertyModal} openScheduleVisit={openScheduleVisit} addNotification={addNotification} loadData={loadData} handleSeeOwner={handleSeeOwner} handleViewBuilding={handleViewBuilding} handleViewVilla={handleViewVilla} handleViewLand={handleViewLand} parseUnitPictures={parseUnitPictures} />;
      case 'alerts':
        return <AlertsTab alerts={alerts} alertTypeFilter={alertTypeFilter} setAlertTypeFilter={setAlertTypeFilter} />;
      case 'advertisements':
        return <AdvertisementsTab advertisements={advertisements} />;
      case 'chat':
        return <MessagesTab chatUsers={chatUsers} selectedUserId={selectedUserId} chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} loadChatForUser={loadChatForUser} handleSendMessage={handleSendMessage} messagesEndRef={messagesEndRef} />;
      case 'settings':
        return (
          <div className="embedded-settings">
            <SettingsPage />
          </div>
        );
      default:
        return <OverviewTab loading={loading} overviewData={overviewData} properties={properties} clients={clients} unpaidRents={unpaidRents} alerts={alerts} advertisements={advertisements} currentAdIndex={currentAdIndex} setCurrentAdIndex={setCurrentAdIndex} carouselIntervalRef={carouselIntervalRef} />;
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
        brand={{ name: 'SAAF IMMO', caption: 'Commercial Team', logo: 'SAAF', logoImage: `/download.jpeg` }}
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

      {/* Maintenance detail modal moved to ClientsTab */}

	      {/* Property Import Modal (Properties only - from Property Management) */}
	      {showPropertyImportModal && (
	        <div className="modal-overlay" onClick={() => { setShowPropertyImportModal(false); setPropertyImportFile(null); }}>
	          <div className="modal-content large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
	            <div className="modal-header">
	              <h3>Bulk Import Properties</h3>
	              <button className="modal-close" onClick={() => { setShowPropertyImportModal(false); setPropertyImportFile(null); }}>×</button>
	            </div>
	            <div className="modal-body">
	              <div style={{ marginBottom: '20px' }}>
	                <button type="button" className="action-button secondary" onClick={downloadPropertiesExampleCsv} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
	                  <Download size={16} style={{ marginRight: '6px' }} />
	                  Download Example CSV
	                </button>
	              </div>
	              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '16px' }}>
	                Upload an Excel or CSV with: Address, Type, PropertyType, BuildingType, Status, NumberOfUnits, Rent, Bedrooms, Bathrooms, Urgency, LandlordId. For multi-unit: UnitNumbers (F1|F2), UnitRents (100000|120000). If Type is Apartment and BuildingType is provided, use: High-rise, Low-rise, Duplex, Townhouse, Penthouse.
	              </p>
	              <div
	                className="file-upload-area"
	                style={{ border: '2px dashed #d1d5db', borderRadius: '12px', padding: '32px', textAlign: 'center', background: '#fff', cursor: propertyImportLoading ? 'not-allowed' : 'pointer' }}
	                onClick={() => !propertyImportLoading && document.getElementById('property-import-file-input')?.click()}
	              >
	                <input
	                  type="file"
	                  id="property-import-file-input"
	                  accept=".csv,.xlsx,.xls,text/csv,application/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
	                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setPropertyImportFile(f); e.target.value = ''; }}
	                  style={{ display: 'none' }}
	                  disabled={propertyImportLoading}
	                />
	                <FileSpreadsheet size={48} color={propertyImportLoading ? '#9ca3af' : '#2563eb'} style={{ margin: '0 auto 12px' }} />
	                <div>
	                  <strong style={{ color: propertyImportLoading ? '#9ca3af' : '#1f2937' }}>
	                    {propertyImportLoading ? 'Importing...' : (propertyImportFile ? propertyImportFile.name : 'Click to select file')}
	                  </strong>
	                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>CSV or Excel (.xlsx, .xls)</p>
	                </div>
	              </div>
              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button type="button" className="action-button secondary" onClick={() => { setShowPropertyImportModal(false); setPropertyImportFile(null); }}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="action-button primary"
                  onClick={async () => {
                    if (!propertyImportFile) { addNotification('Please select a file first', 'error'); return; }
                    setPropertyImportLoading(true);
                    try {
                      const { success, failed } = await handleBulkImportProperties(propertyImportFile);
                      addNotification(`Properties: ${success} imported, ${failed} failed`, success > 0 ? 'success' : failed > 0 ? 'error' : 'info');
                      setShowPropertyImportModal(false);
                      setPropertyImportFile(null);
                      await loadData();
                    } catch (err) {
                      addNotification(err?.message || 'Import failed', 'error');
                    } finally {
                      setPropertyImportLoading(false);
                    }
                  }}
                  disabled={!propertyImportFile || propertyImportLoading}
                >
                  {propertyImportLoading ? 'Importing...' : 'Import'}
                </button>
              </div>
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
	                    ? 'Upload an Excel or CSV with: Address, Type, PropertyType, BuildingType, Status, NumberOfUnits, Rent, Bedrooms, Bathrooms, Urgency, LandlordId. For multi-unit: UnitNumbers (F1|F2), UnitRents (100000|120000). If Type is Apartment and BuildingType is provided, use: High-rise, Low-rise, Duplex, Townhouse, Penthouse.'
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
                      {bulkImportTab === 'properties' ? 'CSV or Excel (.xlsx, .xls)' : 'CSV or Excel (.xlsx, .xls)'}
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
	                          onClick={downloadTenantExampleFile}
	                          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
	                        >
	                          <Download size={16} />
	                          Download Example Excel
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
                              (moveInFormPropertyRent > 0 ? ` - ${Math.round(moveInFormPropertyRent * 4.5).toLocaleString()} XOF` : '')
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
                      <select
                        name="property"
                        id="property"
                        required
                        value={selectedMoveInPropertyId}
                        onChange={(e) => applyMoveInPropertySelection(e.target.value)}
                        disabled={moveInPropertyLocked}
                      >
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
                      {moveInPropertyLocked && (
                        <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                          Auto-filled from the approved client record.
                        </small>
                      )}
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
                    <select
                      name="property"
                      id="edit-property"
                      value={editSelectedPropertyAddress}
                      onChange={(e) => {
                        const addr = e.target.value;
                        setEditSelectedPropertyAddress(addr);
                        const match = (editPropertyOptions || []).find((p) => (p.address ?? p.Address ?? '').toString() === addr);
                        const pid = match ? (match.id ?? match.ID ?? '').toString() : '';
                        setEditSelectedPropertyId(pid);
                        // Also drive the unit dropdown from this property selection
                        setEditAssignPropertyId(pid);
                        setEditAssignUnitId('');
                      }}
                      disabled={editPropertyLoading}
                    >
                      <option value="">{editPropertyLoading ? 'Loading properties…' : '— Not assigned —'}</option>
                      {(editPropertyOptions || []).map((p) => {
                        const addr = (p.address ?? p.Address ?? '').toString();
                        const pid = p.id ?? p.ID;
                        if (!addr) return null;
                        return (
                          <option key={pid ?? addr} value={addr}>
                            {addr}
                          </option>
                        );
                      })}
                    </select>
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

                  <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label htmlFor="edit-assign-property">Assign to property</label>
                      <select
                        id="edit-assign-property"
                        name="assignPropertyId"
                        value={editAssignPropertyId}
                        onChange={(e) => { setEditAssignPropertyId(e.target.value); setEditAssignUnitId(''); }}
                      >
                        <option value="">— Select a property —</option>
                        {(editPropertyOptions || [])
                          .map((p) => {
                            const pid = p.id ?? p.ID;
                            const addr = p.address ?? p.Address ?? '';
                            return <option key={pid} value={pid}>{addr || `Property #${pid}`}</option>;
                          })}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label htmlFor="edit-assign-unit">Assign to unit</label>
                      <select
                        id="edit-assign-unit"
                        name="assignUnitId"
                        value={editAssignUnitId}
                        onChange={(e) => setEditAssignUnitId(e.target.value)}
                        disabled={!editAssignPropertyId || editAssignLoadingUnits}
                      >
                        <option value="">{editAssignLoadingUnits ? 'Loading units…' : '— Select a vacant unit —'}</option>
                        {editAssignUnits
                          .filter((u) => {
                            const st = (u.status || u.Status || '').toString().toLowerCase();
                            const tenant = (u.tenant || u.Tenant || '').toString().trim();
                            return st !== 'occupied' && tenant === '';
                          })
                          .map((u) => {
                            const uid = u.id ?? u.ID;
                            const un = u.unitNumber ?? u.UnitNumber ?? u.name ?? u.UnitNumber ?? '';
                            return <option key={uid} value={uid}>{un || `Unit #${uid}`}</option>;
                          })}
                      </select>
                      <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '0.8rem' }}>
                        Pick a property + vacant unit, then click “Update Client” to assign.
                      </p>
                    </div>
                  </div>

                  <p style={{ margin: '12px 0 0', color: '#6b7280', fontSize: '0.8rem' }}>
                    Unit number is loaded from the database. Only non-occupied units are shown.
                  </p>
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
