import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Wrench,
  CheckCircle,
  AlertTriangle,
  Building,
  Calendar,
  Mail,
  Send,
  FileText,
  BarChart2,
  MoreHorizontal,
  Settings,
  MessageCircle,
  Plus,
  Filter,
  Search,
  Megaphone,
  Phone,
  Edit,
  Trash2,
  ClipboardList,
  DollarSign,
  HardHat,
  LogIn,
  LogOut,
  History,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { technicianService } from '../../services/technicianService';
import { messagingService } from '../../services/messagingService';
import { API_CONFIG } from '../../config/api';
import AdvertisementsList from '../../components/AdvertisementsList';
import AdCarousel from '../../components/AdCarousel';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import MessagingPanel from '../../components/MessagingPanel';
import { isDemoMode, getTechnicianDemoData } from '../../utils/demoData';
import '../TechnicianDashboard.css';
import '../SuperAdminDashboard.css';
import SettingsPage from '../SettingsPage';
import RoleLayout from '../../components/RoleLayout';
import { t, getLanguage } from '../../utils/i18n';
import '../../components/RoleLayout.css';

const TechnicianDashboard = () => {
  const INSPECTION_ITEMS = useMemo(
    () => [
      { key: 'doorHandles', label: 'Door handles' },
      { key: 'doors', label: 'Doors (bedrooms, bathrooms, closets)' },
      { key: 'closets', label: 'Closets and storage' },
      { key: 'walls', label: 'Walls and paintwork' },
      { key: 'floors', label: 'Floors' },
      { key: 'fixtures', label: 'Visible fixtures and fittings' },
    ],
    []
  );

  const getRoomList = useCallback((propertyType, numberOfRooms) => {
    if (!propertyType) return [];
    const rooms = [];
    if (propertyType === 'Studio') {
      rooms.push('Main Room', 'Kitchenette', 'Bathroom');
      return rooms;
    }
    // Common rooms for apartments/villas/duplex
    rooms.push('Living Room', 'Kitchen', 'Bathroom', 'Toilet', 'Corridor');
    const bedrooms = Math.max(1, Number(numberOfRooms) || 1);
    for (let i = 1; i <= bedrooms; i++) rooms.push(`Bedroom ${i}`);
    if (propertyType === 'Duplex') rooms.push('Stairs', 'Balcony/Terrace');
    if (propertyType === 'Villa') rooms.push('Terrace', 'Exterior');
    return rooms;
  }, []);

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    property: '',
    type: 'routine',
    inspector: '',
    notes: ''
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskContext, setTaskContext] = useState('task');
  const [taskForm, setTaskForm] = useState({
    status: '',
    estimatedHours: 0,
    estimatedCost: 0,
    photos: []
  });
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [selectedInspectionForPhoto, setSelectedInspectionForPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [showMaintenanceViewModal, setShowMaintenanceViewModal] = useState(false);
  const [selectedMaintenanceRequest, setSelectedMaintenanceRequest] = useState(null);
  const [maintenancePriorityFilter, setMaintenancePriorityFilter] = useState('');
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState('');
  const [maintenancePropertyFilter, setMaintenancePropertyFilter] = useState('');
  const [technicianContacts, setTechnicianContacts] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    category: '',
    customCategory: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    photo: null,
    idCard: null
  });
  
  // New state for restructured sections
  const [quotes, setQuotes] = useState([]);
  const [works, setWorks] = useState([]);
  const [selectedWorkIds, setSelectedWorkIds] = useState([]);
  const [entryTenants, setEntryTenants] = useState([]);
  const [exitTenants, setExitTenants] = useState([]);
  const [companyProperties, setCompanyProperties] = useState([]);
  const [companyTenants, setCompanyTenants] = useState([]);
  const [historyData, setHistoryData] = useState({
    queries: [],
    quotes: [],
    works: [],
    inventories: []
  });
  const [submittedInventories, setSubmittedInventories] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [showInventoryFormModal, setShowInventoryFormModal] = useState(false);
  const [inventoryFormData, setInventoryFormData] = useState({
    type: 'Entry', // Entry or Exit
    propertyType: '', // Studio, Apartment, Duplex, Villa
    numberOfRooms: 1,
    numberOfBathrooms: 1,
    numberOfKitchens: 1,
    hasSwimmingPool: false,
    propertyAddress: '',
    tenantName: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    technicianName: '',
    // Dynamic form data will be stored here
    formData: {
      rooms: {},
      meters: { electricity: '', water: '', gas: '', keys: '' },
      observations: { technician: '', tenant: '' },
      exit: { degradations: '', workToBeCarriedOut: '', estimatedCost: 0, bailImpact: 'None' },
    }
  });

  // Ensure room/item structure exists in formData when property settings change
  useEffect(() => {
    if (!inventoryFormData.propertyType) return;
    const roomList = getRoomList(inventoryFormData.propertyType, inventoryFormData.numberOfRooms);
    if (roomList.length === 0) return;

    setInventoryFormData(prev => {
      const prevRooms = prev.formData?.rooms || {};
      let changed = false;
      const nextRooms = { ...prevRooms };

      roomList.forEach(roomName => {
        if (!nextRooms[roomName]) {
          nextRooms[roomName] = {};
          changed = true;
        }
        INSPECTION_ITEMS.forEach(item => {
          if (!nextRooms[roomName][item.key]) {
            nextRooms[roomName][item.key] = { condition: '', comment: '', photos: [] };
            changed = true;
          }
        });
      });

      if (!changed) return prev;
      return {
        ...prev,
        formData: {
          ...prev.formData,
          rooms: nextRooms,
        },
      };
    });
  }, [inventoryFormData.propertyType, inventoryFormData.numberOfRooms, INSPECTION_ITEMS, getRoomList]);

  // Auto-select property type when property (address) is selected on inventory form (Entry/Exit) – e.g. when opening from list row or when user changes property
  useEffect(() => {
    if (!showInventoryFormModal || !inventoryFormData.propertyAddress || !companyProperties?.length) return;
    const selectedProperty = companyProperties.find(
      p => (p.Address || p.address) === inventoryFormData.propertyAddress
    );
    if (!selectedProperty) return;
    const bedrooms = selectedProperty.Bedrooms ?? selectedProperty.bedrooms;
    const bathrooms = selectedProperty.Bathrooms ?? selectedProperty.bathrooms;
    const propTypeRaw =
      selectedProperty.Type ||
      selectedProperty.type ||
      selectedProperty.BuildingType ||
      selectedProperty.buildingType ||
      selectedProperty.PropertyType ||
      selectedProperty.propertyType ||
      '';
    const typeLower = String(propTypeRaw).toLowerCase();
    const inferredType = typeLower.includes('studio')
      ? 'Studio'
      : typeLower.includes('duplex')
        ? 'Duplex'
        : typeLower.includes('villa')
          ? 'Villa'
          : typeLower.includes('apartment')
            ? 'Apartment'
            : bedrooms
              ? 'Apartment'
              : '';
    if (!inferredType) return;
    setInventoryFormData(prev => {
      if (prev.propertyType === inferredType && (bedrooms == null || prev.numberOfRooms === Number(bedrooms)) && (bathrooms == null || prev.numberOfBathrooms === Number(bathrooms))) return prev;
      return {
        ...prev,
        propertyType: inferredType,
        numberOfRooms: bedrooms !== undefined && bedrooms !== null ? Number(bedrooms) : (inferredType === 'Studio' ? 1 : prev.numberOfRooms),
        numberOfBathrooms: bathrooms !== undefined && bathrooms !== null ? Number(bathrooms) : prev.numberOfBathrooms,
      };
    });
  }, [showInventoryFormModal, inventoryFormData.propertyAddress, companyProperties]);

  // Filter states
  const [quoteStatusFilter, setQuoteStatusFilter] = useState('');
  const [quoteDateFilter, setQuoteDateFilter] = useState('');
  const [quotePropertyFilter, setQuotePropertyFilter] = useState('');
  const [quoteSearchText, setQuoteSearchText] = useState('');
  const [workStatusFilter, setWorkStatusFilter] = useState('');
  const [workDateFilter, setWorkDateFilter] = useState('');
  const [workPropertyFilter, setWorkPropertyFilter] = useState('');
  const [workPriorityFilter, setWorkPriorityFilter] = useState('');
  const [workSearchText, setWorkSearchText] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('');
  const [historyPropertyFilter, setHistoryPropertyFilter] = useState('');
  const [stateEntryView, setStateEntryView] = useState('entry'); // 'entry' | 'exit'
  const [stateEntryNameFilter, setStateEntryNameFilter] = useState('');
  const [stateEntryPropertyFilter, setStateEntryPropertyFilter] = useState('');
  const [stateEntryStatusFilter, setStateEntryStatusFilter] = useState('');
  const [stateEntryDateFilter, setStateEntryDateFilter] = useState('');

  // Cost of Work: owners -> properties -> works
  const [costOfWorkView, setCostOfWorkView] = useState('owners'); // 'owners' | 'properties' | 'works'
  const [selectedCostOwner, setSelectedCostOwner] = useState(null);
  const [selectedCostProperty, setSelectedCostProperty] = useState(null);
  const [costOfWorkOwners, setCostOfWorkOwners] = useState([]);
  const [costOfWorkProperties, setCostOfWorkProperties] = useState([]);
  const [costOfWorkWorks, setCostOfWorkWorks] = useState([]);
  
  // Helper data for Inventory Form (Entry / Exit)
  const currentInventoryTenants =
    inventoryFormData.type === 'Entry' ? entryTenants : exitTenants;
  // Use companyTenants (all tenants from sales manager) for the dropdown so technician can select any tenant
  const tenantOptions =
    companyTenants && companyTenants.length > 0
      ? companyTenants
      : currentInventoryTenants;

  const inventoryPropertyOptions = Array.from(
    new Set(
      (companyProperties && companyProperties.length > 0
        ? companyProperties.map(p => p.Address || p.address)
        : (currentInventoryTenants || []).map(t => t.Property || t.property)
      ).filter(Boolean)
    )
  );

  const inventoryTenantSuggestions =
    inventoryFormData.tenantName && currentInventoryTenants
      ? currentInventoryTenants.filter(t => {
          const name = (t.Name || t.name || '').toLowerCase();
          return name.includes(inventoryFormData.tenantName.toLowerCase());
        })
      : [];

  
  // Advertisements state
  const [advertisements, setAdvertisements] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const carouselIntervalRef = useRef(null);
  
  // Messaging states
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const isLoadingUsersRef = useRef(false);
  const messagesEndRef = useRef(null);
  const markReadTimeoutRef = useRef(null);
  const lastMarkedReadRef = useRef(null);
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showWorkStartModal, setShowWorkStartModal] = useState(false);
  const [selectedQuoteForWork, setSelectedQuoteForWork] = useState(null);
  const [workSchedule, setWorkSchedule] = useState({ startDate: '', endDate: '' });
  
  const addNotification = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  // Load data from backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        // Use demo data
        const demoData = getTechnicianDemoData();
        setOverviewData(demoData.overview);
        setInspections(demoData.inspections);
        setTasks(demoData.tasks);
        setLoading(false);
        return;
      }
      
      const [overview, inspection, task, maintenanceRequests, contacts, quotesData, worksData, entryData, exitData, historyDataRes, propertiesData, tenantsData] = await Promise.all([
        technicianService.getOverview().catch(() => null),
        technicianService.listInspections().catch(() => []),
        technicianService.listTasks().catch(() => []),
        technicianService.listMaintenanceRequests().catch(() => []),
        technicianService.getTechnicianContacts().catch(() => []),
        technicianService.listQuotes().catch(() => []),
        technicianService.getWorkProgress({}).catch(() => []),
        technicianService.getStateOfEntry().catch(() => []),
        technicianService.getStateOfExit().catch(() => []),
        technicianService.getHistory({}).catch(() => ({ queries: [], quotes: [], works: [], inventories: [] })),
        technicianService.getProperties().catch(() => []),
        technicianService.getTenants().catch(() => [])
      ]);
      
      setOverviewData(overview);
      setInspections(Array.isArray(inspection) ? inspection : []);
      setTasks(Array.isArray(task) ? task : []);
      
      // Handle maintenance requests - could be array or object with maintenanceRequests property
      if (maintenanceRequests) {
        if (Array.isArray(maintenanceRequests)) {
          setRequests(maintenanceRequests);
        } else if (maintenanceRequests.maintenanceRequests && Array.isArray(maintenanceRequests.maintenanceRequests)) {
          setRequests(maintenanceRequests.maintenanceRequests);
        } else {
          setRequests([]);
        }
      } else {
        setRequests([]);
      }
      
      // Set technician contacts
      setTechnicianContacts(Array.isArray(contacts) ? contacts : []);
      
      // Set quotes
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      
      // Set works (maintenance requests that are work orders)
      setWorks(Array.isArray(worksData) ? worksData : []);
      
      // Set entry and exit states
      setEntryTenants(Array.isArray(entryData) ? entryData : []);
      setExitTenants(Array.isArray(exitData) ? exitData : []);

      setCompanyProperties(Array.isArray(propertiesData) ? propertiesData : []);
      setCompanyTenants(Array.isArray(tenantsData) ? tenantsData : []);
      
      // Set history data
      if (historyDataRes && typeof historyDataRes === 'object') {
        setHistoryData({
          queries: Array.isArray(historyDataRes.queries) ? historyDataRes.queries : [],
          quotes: Array.isArray(historyDataRes.quotes) ? historyDataRes.quotes : [],
          works: Array.isArray(historyDataRes.works) ? historyDataRes.works : [],
          inventories: Array.isArray(historyDataRes.inventories) ? historyDataRes.inventories : []
        });
      }
    } catch (error) {
      console.error('Error loading technician data:', error);
      if (!isDemoMode()) {
        addNotification('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSubmittedInventories = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      const list = await technicianService.listInspections();
      setSubmittedInventories(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error loading submitted inventories:', error);
      setSubmittedInventories([]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'state-entry') {
      loadSubmittedInventories();
    }
  }, [activeTab, loadSubmittedInventories]);

  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ensure type is 'Move-in' or 'Move-out' for API
      const inspectionData = {
        ...inspectionForm,
        type: inspectionForm.type === 'move-in' ? 'Move-in' : 
              inspectionForm.type === 'move-out' ? 'Move-out' : 
              inspectionForm.type,
      };
      await technicianService.createInspection(inspectionData);
      addNotification('Inspection created successfully', 'success');
      setShowInspectionModal(false);
      setInspectionForm({ property: '', type: 'Move-in', inspector: '', notes: '' });
      loadData(); // Reload data to show new inspection
    } catch (error) {
      console.error('Error creating inspection:', error);
      addNotification(error.message || 'Failed to create inspection', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photoFile || !selectedInspectionForPhoto) return;
    
    setLoading(true);
    try {
      const inspectionId = selectedInspectionForPhoto.id || selectedInspectionForPhoto.ID;
      await technicianService.uploadInspectionPhoto(inspectionId, photoFile);
      addNotification('Photo uploaded successfully', 'success');
      setShowPhotoUploadModal(false);
      setSelectedInspectionForPhoto(null);
      setPhotoFile(null);
      loadData(); // Reload data to show updated inspection with photo
    } catch (error) {
      console.error('Error uploading photo:', error);
      addNotification(error.message || 'Failed to upload photo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhotoClick = (inspection) => {
    setSelectedInspectionForPhoto(inspection);
    setPhotoFile(null);
    setShowPhotoUploadModal(true);
  };

  const handleTaskView = (task) => {
    setTaskContext('task');
    setSelectedTask(task);
    setTaskForm({
      status: task.Status || task.status || 'Pending',
      estimatedHours: task.EstimatedHours || task.estimatedHours || 0,
      estimatedCost: task.EstimatedCost || task.estimatedCost || 0,
      property: task.Property || task.property || '',
      issue: task.Issue || task.issue || '',
      priority: task.Priority || task.priority || 'normal',
        assigned: task.Assigned || task.assigned || '',
        photos: []
    });
    setShowTaskModal(true);
  };

  const handleTaskUpdate = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const taskId = selectedTask?.id || selectedTask?.ID;
      if (taskContext === 'maintenance') {
        if (taskId) {
          await technicianService.updateMaintenanceRequest(taskId, {
            status: taskForm.status || 'Pending',
            estimatedCost: Number(taskForm.estimatedCost) || 0,
            assigned: taskForm.assigned || '',
            priority: taskForm.priority || 'normal',
            issue: taskForm.issue || '',
            property: taskForm.property || '',
          });
          addNotification('Maintenance updated successfully', 'success');
        } else {
          const costRaw = taskForm.estimatedCost;
          const estimatedCost = (typeof costRaw === 'number' && Number.isFinite(costRaw)) ? costRaw : (Number(costRaw) || 0);
          const statusForCreate = taskForm.requireDirectorApproval ? 'Pending Director Approval' : (taskForm.status || 'Pending');
          const maintenanceData = {
            property: taskForm.property || '',
            issue: taskForm.issue || 'Maintenance Task',
            priority: taskForm.priority || 'normal',
            status: statusForCreate,
            estimatedCost,
            assigned: taskForm.assigned || '',
            photos: taskForm.photos || [],
            quotation: taskForm.quotation || null,
            invoice: taskForm.invoice || null,
            requireDirectorApproval: taskForm.requireDirectorApproval || false,
          };
          await technicianService.createMaintenanceRequest(maintenanceData);
          const hadPhotos = (maintenanceData.photos && maintenanceData.photos.length) > 0;
          const needsApproval = maintenanceData.requireDirectorApproval;
          let msg = hadPhotos ? 'Maintenance created. To add photos, edit this request and attach images.' : 'Maintenance created successfully';
          if (needsApproval) msg += ' Task sent to director for approval.';
          addNotification(msg, 'success');
        }
      } else if (taskId) {
        // Update existing task
        await technicianService.updateTask(taskId, taskForm);
        addNotification('Task updated successfully', 'success');
      } else {
        // Create new task
        const taskData = {
          property: taskForm.property || '',
          issue: taskForm.issue || 'Maintenance Task',
          priority: taskForm.priority || 'normal',
          estimatedHours: Number(taskForm.estimatedHours) || 0,
          estimatedCost: Number(taskForm.estimatedCost) || 0,
          assigned: taskForm.assigned || '',
          photos: taskForm.photos || []
        };
        await technicianService.createTask(taskData);
        addNotification('Task created successfully', 'success');
      }
      setShowTaskModal(false);
      setSelectedTask(null);
      setTaskContext('task');
      setTaskForm({ status: '', estimatedHours: 0, estimatedCost: 0, photos: [], existingPhotoURLs: [] });
      loadData(); // Reload data to show updated/created task
    } catch (error) {
      console.error('Error updating/creating task:', error);
      addNotification(error.message || 'Failed to save task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (task) => {
    setLoading(true);
    try {
      const taskId = task.id || task.ID;
      await technicianService.updateTask(taskId, { status: 'Completed' });

      // When a maintenance task is marked as completed, automatically
      // create a pending quote (if one has not already been generated)
      // so that it appears in the Quotes page for validation by the
      // owner or agency admin.
      const alreadyGenerated = task.quoteGenerated || task.QuoteGenerated;
      if (!alreadyGenerated) {
        const quoteAmount = Number(String(task.EstimatedCost || task.estimatedCost || 0).replace(/[^0-9.-]/g, '')) || 0;
        if (quoteAmount <= 0) {
          addNotification('Please set a valid estimated cost before completing the task.', 'warning');
          loadData();
          setLoading(false);
          return;
        }
        const quoteData = {
          maintenanceId: taskId,
          property: task.Property || task.property || '',
          issue: task.Issue || task.issue || 'Maintenance Task',
          amount: quoteAmount,
          recipient: 'management@example.com',
        };
        try {
          await technicianService.submitQuote(quoteData);
          addNotification('Task completed and quote submitted for validation', 'success');
        } catch (quoteError) {
          console.error('Error submitting quote for completed task:', quoteError);
          addNotification('Task completed, but failed to submit quote', 'warning');
        }
      } else {
        addNotification('Task marked as completed', 'success');
      }
      loadData(); // Reload data to show updated task
    } catch (error) {
      console.error('Error completing task:', error);
      addNotification('Failed to complete task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('demo_mode');
    window.location.href = '/';
  };

  const normalizeDateValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const openWorkStartModal = (quote) => {
    setSelectedQuoteForWork(quote);
    setWorkSchedule({ startDate: '', endDate: '' });
    setShowWorkStartModal(true);
  };

  const handleStartWorkSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQuoteForWork) return;
    const maintenanceId = selectedQuoteForWork.MaintenanceID || selectedQuoteForWork.maintenanceId;
    if (!maintenanceId) {
      addNotification('This quote is missing a maintenance reference.', 'error');
      return;
    }
    if (!workSchedule.startDate || !workSchedule.endDate) {
      addNotification('Please select both start and end dates.', 'error');
      return;
    }
    try {
      setLoading(true);
      await technicianService.updateMaintenanceRequest(maintenanceId, {
        status: 'In Progress',
        workStartDate: workSchedule.startDate,
        workEndDate: workSchedule.endDate,
      });
      addNotification('Work started and scheduled successfully', 'success');
      setShowWorkStartModal(false);
      setSelectedQuoteForWork(null);
      loadData();
    } catch (error) {
      console.error('Error starting work:', error);
      addNotification(error.message || 'Failed to start work', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkStatusChange = async (work, status) => {
    const workId = work.ID || work.id;
    if (!workId) return;
    try {
      setLoading(true);
      await technicianService.updateMaintenanceRequest(workId, {
        status,
        completedAt: status === 'Completed' ? new Date().toISOString() : undefined,
      });
      addNotification('Work status updated', 'success');
      loadData();
    } catch (error) {
      console.error('Error updating work status:', error);
      addNotification(error.message || 'Failed to update work status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkSelection = (workId) => {
    setSelectedWorkIds(prev => (
      prev.includes(workId)
        ? prev.filter(id => id !== workId)
        : [...prev, workId]
    ));
  };

  const handleArchiveWorks = async (workIds) => {
    const ids = (workIds || []).filter(Boolean);
    if (ids.length === 0) return;
    try {
      setLoading(true);
      await Promise.all(
        ids.map(id => technicianService.updateMaintenanceRequest(id, { archived: true }))
      );
      addNotification('Work archived', 'success');
      setSelectedWorkIds([]);
      loadData();
    } catch (error) {
      console.error('Error archiving work:', error);
      addNotification(error.message || 'Failed to archive work', 'error');
    } finally {
      setLoading(false);
    }
  };

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
      console.log('Loading chat for user:', userId);
      const messages = await messagingService.getConversation(userId);
      console.log('Loaded messages:', messages);
      
      // Normalize messages array
      const normalizedMessages = Array.isArray(messages) ? messages : [];
      console.log('Normalized messages:', normalizedMessages);
      setChatMessages(normalizedMessages);
      
      // Mark messages as read with debouncing to avoid rate limiting
      // Only mark as read if we haven't marked this user recently
      const userIdStr = String(userId);
      if (lastMarkedReadRef.current !== userIdStr) {
        // Clear any pending timeout
        if (markReadTimeoutRef.current) {
          clearTimeout(markReadTimeoutRef.current);
        }
        
        // Mark this user as being processed to prevent duplicate calls
        lastMarkedReadRef.current = userIdStr;
        
        // Debounce the mark as read call with a longer delay to avoid rate limiting
        markReadTimeoutRef.current = setTimeout(async () => {
          try {
            await messagingService.markMessagesAsRead(userId);
            console.log('Marked messages as read for user:', userId);
          } catch (readError) {
            // Silently ignore rate limit errors - they're expected if called too frequently
            if (!readError.message || !readError.message.includes('Rate limit')) {
              console.error('Error marking messages as read:', readError);
            }
            // Reset the last marked ref on error so we can retry later
            if (readError.message && readError.message.includes('Rate limit')) {
              lastMarkedReadRef.current = null;
            }
          }
        }, 2000); // Wait 2 seconds before marking as read to avoid rate limiting
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      console.error('Error details:', error.message, error.stack);
      addNotification(`Failed to load conversation: ${error.message || 'Unknown error'}`, 'error');
      setChatMessages([]);
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
      
      // Get current user ID to exclude from list
      const storedUser = localStorage.getItem('user');
      let currentUserId = null;
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          currentUserId = user.id || user.ID;
          console.log('Current user ID:', currentUserId);
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
      
      // Map users to chat format and exclude current user
      const chatUsersList = usersArray
        .filter(user => {
          const userId = user.id || user.ID;
          // Convert both to strings for comparison to handle type mismatches
          const userIdStr = userId ? String(userId) : null;
          const currentUserIdStr = currentUserId ? String(currentUserId) : null;
          const shouldInclude = userIdStr && userIdStr !== currentUserIdStr;
          if (!shouldInclude && userIdStr) {
            console.log(`Excluding user ${userIdStr} (current user: ${currentUserIdStr})`);
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
              // This handles cases where users from other companies or roles have messaged
              const convUser = conv.user || {};
              const userId = conv.userId || conv.userID || convUser.id || convUser.ID;
              
              // Only add if it's not the current user
              const currentUserIdStr = currentUserId ? String(currentUserId) : null;
              if (userId && String(userId) !== currentUserIdStr) {
                const newUser = {
                  userId: userId,
                  name: convUser.name || convUser.Name || conv.name || 'User',
                  email: convUser.email || convUser.Email || conv.email || '',
                  role: convUser.role || convUser.Role || conv.role || '',
                  company: convUser.company || convUser.Company || conv.company || '',
                  status: convUser.status || convUser.Status || conv.status || 'Active',
                  unreadCount: conv.unreadCount || 0
                };
                chatUsersList.push(newUser);
                existingUsersMap.set(String(userId), newUser);
                console.log('Added user from conversation:', newUser);
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

  // Load users when chat tab is active (only once per tab switch)
  useEffect(() => {
    if (activeTab === 'chat' && !isLoadingUsersRef.current) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Only depend on activeTab, not loadUsers

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedUserId) return;
    if (String(selectedUserId).startsWith('group:')) return;

    const content = chatInput.trim();
    const tempMessageId = `temp-${Date.now()}`;
    
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
    
    // Optimistic update: add message immediately to UI
    const optimisticMessage = {
      id: tempMessageId,
      fromUserId: currentUserId,
      toUserId: selectedUserId,
      content: content,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    setChatMessages(prev => [...prev, optimisticMessage]);
    setChatInput('');
    
    try {
      console.log('Sending message:', { fromUserId: currentUserId, toUserId: selectedUserId, content });
      const newMessage = await messagingService.sendMessage({
        fromUserId: currentUserId,
        toUserId: selectedUserId,
        content: content
      });
      
      console.log('Message sent successfully, server response:', newMessage);
      
      // Replace optimistic message with actual message from server
      // Check if newMessage has the expected structure
      if (newMessage && (newMessage.id || newMessage.ID)) {
        console.log('Replacing optimistic message with server response');
        setChatMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === tempMessageId ? newMessage : msg
          );
          console.log('Updated messages:', updated);
          return updated;
        });
      } else {
        console.log('Server response format unexpected, reloading chat after delay');
        // If server response format is unexpected, reload chat after a short delay
        // to give server time to process
        setTimeout(async () => {
          if (selectedUserId) {
            console.log('Reloading chat for user:', selectedUserId);
            await loadChatForUser(selectedUserId);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error.message, error.stack);
      addNotification(error.message || 'Failed to send message', 'error');
      // Remove optimistic message on error
      setChatMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      // Restore input
      setChatInput(content);
    }
  };

  // Load advertisements when advertisements or overview tab is active
  useEffect(() => {
    if (activeTab === 'advertisements' || activeTab === 'overview') {
      loadAdvertisements();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load Cost of Work owners when Cost of Work tab is active; reset drill-down when entering tab
  useEffect(() => {
    if (activeTab === 'cost-of-work') {
      setCostOfWorkView('owners');
      setSelectedCostOwner(null);
      setSelectedCostProperty(null);
      setCostOfWorkProperties([]);
      setCostOfWorkWorks([]);
      technicianService.getCostOfWorkOwners()
        .then(data => setCostOfWorkOwners(Array.isArray(data) ? data : []))
        .catch(() => setCostOfWorkOwners([]));
    }
  }, [activeTab]);


  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: Building },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
      { id: 'quotes', label: 'The Quotes', icon: DollarSign },
      { id: 'works', label: 'Works', icon: HardHat },
      { id: 'cost-of-work', label: 'Cost of Work', icon: BarChart2 },
      { id: 'state-entry', label: 'State of Entry / Exit', icon: LogIn },
      { id: 'worker-contacts', label: 'Contact of Workers', icon: Phone },
      { id: 'history', label: 'History', icon: History },
      { id: 'reports', label: 'Reports', icon: FileCheck },
      { id: 'advertisements', label: 'Advertisements', icon: Megaphone },
      { id: 'chat', label: 'Messages', icon: MessageCircle },
      { id: 'settings', label: 'Settings', icon: Settings }
    ],
    []
  );

  const renderOverview = () => {
    if (loading) {
      return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading overview data...</div>;
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = currentUser.name || currentUser.Name || 'Technician';

    const monthLabels = [];
    const monthlyRequests = [];
    const monthlyCompleted = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = date.toLocaleString('default', { month: 'short' });
      monthLabels.push(label);

      const totalCount = requests.filter(r => {
        const dateValue = r.CreatedAt || r.createdAt || r.Date || r.date;
        if (!dateValue) return false;
        const reqDate = new Date(dateValue);
        return reqDate.getMonth() === date.getMonth() && reqDate.getFullYear() === date.getFullYear();
      }).length;

      const completedCount = requests.filter(r => {
        const dateValue = r.CreatedAt || r.createdAt || r.Date || r.date;
        if (!dateValue) return false;
        const reqDate = new Date(dateValue);
        const status = (r.Status || r.status || '').toLowerCase();
        return reqDate.getMonth() === date.getMonth() &&
          reqDate.getFullYear() === date.getFullYear() &&
          status === 'completed';
      }).length;

      monthlyRequests.push(totalCount);
      monthlyCompleted.push(completedCount);
    }

    const techChartData = monthLabels.map((label, i) => ({
      month: label,
      requests: monthlyRequests[i],
      completed: monthlyCompleted[i],
    }));

    const card = { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };

    const metricCards = [
      { label: 'Pending Requests', sub: 'Awaiting processing', value: requests.filter(r => (r.Status || r.status) === 'Pending').length, color: '#8b5cf6', bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', white: true, tab: 'maintenance' },
      { label: 'Quotes to Validate', sub: 'Awaiting validation', value: quotes.filter(q => (q.Status || q.status) === 'Sent' || (q.Status || q.status) === 'Pending').length, color: '#22c55e', bg: 'linear-gradient(135deg,#22c55e,#16a34a)', white: true, tab: 'quotes' },
      { label: 'Urgent Work', sub: 'High priority', value: overviewData?.urgentTicketsPending || 0, color: '#ef4444', tab: 'works' },
      { label: 'Important Alerts', sub: 'Requires attention', value: requests.filter(r => { const priority = (r.Priority || r.priority || '').toLowerCase(); return priority === 'urgent' && (r.Status || r.status) !== 'Completed'; }).length, color: '#f59e0b' },
      { label: 'Monthly Requests', sub: 'This month', value: requests.filter(r => { const d = r.CreatedAt || r.createdAt || r.Date || r.date; if (!d) return false; const rd = new Date(d); const n = new Date(); return rd.getMonth() === n.getMonth() && rd.getFullYear() === n.getFullYear(); }).length, color: '#06b6d4' },
      { label: 'Avg Resolution Time', sub: 'Days to complete', value: overviewData?.averageResolutionTime ? `${overviewData.averageResolutionTime.toFixed(1)} days` : 'N/A', color: '#ec4899' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top row: chart + metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
          {/* Chart card */}
          <div style={{ ...card }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Technician Dashboard</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#94a3b8' }}>Welcome, {userName}! — Requests vs Completed</p>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={techChartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorTechRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTechCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '8px 12px' }} />
                <Area type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorTechRequests)" dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Requests" />
                <Area type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={3} fill="url(#colorTechCompleted)" dot={{ fill: '#22c55e', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignContent: 'start' }}>
            {metricCards.map((m, i) => {
              return (
                <div key={i}
                  style={{ ...card, ...(m.bg ? { background: m.bg } : {}), cursor: m.tab ? 'pointer' : 'default', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onClick={() => m.tab && setActiveTab(m.tab)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.06)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: m.white ? 'rgba(255,255,255,0.2)' : `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.1rem', color: m.white ? '#fff' : m.color }}>
                        {i === 0 ? '\u{1F4CB}' : i === 1 ? '\u{2705}' : i === 2 ? '\u{26A0}' : i === 3 ? '\u{1F514}' : i === 4 ? '\u{1F4C5}' : '\u{23F1}'}
                      </span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: m.white ? 'rgba(255,255,255,0.8)' : '#64748b' }}>{m.label}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: m.white ? 'rgba(255,255,255,0.6)' : '#94a3b8' }}>{m.sub}</p>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: m.white ? '#fff' : '#1e293b' }}>{m.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ad Carousel */}
        {advertisements.length > 0 ? (
          <AdCarousel advertisements={advertisements} currentAdIndex={currentAdIndex} setCurrentAdIndex={setCurrentAdIndex} carouselIntervalRef={carouselIntervalRef} />
        ) : (
          <div style={{ ...card, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Maintenance Management</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Manage inspections, tasks, and maintenance operations all in one place.</p>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ ...card }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Quick Actions</h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#94a3b8' }}>Manage your maintenance operations and view key metrics.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div
              style={{ ...card, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onClick={() => setActiveTab('tasks')}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.06)'; }}
            >
              <p style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>Total Cost of Ongoing Repairs</p>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>${(overviewData?.totalCostOfOngoingRepairs || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInspections = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
        <h3>Property Inspections</h3>
        <p>Manage move-in, move-out, and routine inspections</p>
        </div>
        <button 
          className="sa-primary-cta"
          onClick={() => setShowInspectionModal(true)}
        >
          <Plus size={16} />
          Add Inspection
        </button>
      </div>

      <div className="sa-filters-section">
        <select className="sa-filter-select">
            <option value="">All Inspection Types</option>
          <option value="Move-in">Move-in</option>
          <option value="Move-out">Move-out</option>
            <option value="routine">Routine</option>
            <option value="emergency">Emergency</option>
          </select>
        <select className="sa-filter-select">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="scheduled">Scheduled</option>
            <option value="pending">Pending</option>
          </select>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Property</th>
              <th>Inspection Type</th>
              <th>Date</th>
              <th>Inspector</th>
              <th>Notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {inspections.length === 0 ? (
              <tr>
                <td colSpan="7" className="sa-table-empty">
                  No inspections found
                </td>
              </tr>
            ) : (
              inspections.map((inspection, index) => {
                const inspectionId = inspection.id || inspection.ID;
                const property = inspection.property || inspection.Property;
                const type = inspection.type || inspection.Type;
                const date = inspection.date || inspection.Date;
                const inspector = inspection.inspector || inspection.Inspector;
                const notes = inspection.notes || inspection.Notes;
                const photos = inspection.photos || inspection.Photos;
                
                return (
                  <tr key={inspectionId}>
                    <td>{index + 1}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{property}</span>
                  </td>
                  <td>
                      <span className={`sa-status-pill ${(type || 'routine').toLowerCase().replace('-', '-')}`}>
                        {type || 'Routine'}
                    </span>
                  </td>
                    <td>{date ? new Date(date).toLocaleDateString() : 'N/A'}</td>
                    <td>{inspector || 'Unassigned'}</td>
                    <td>
                      <span className="sa-cell-sub">{notes || 'No notes'}</span>
                    </td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" onClick={() => handleUploadPhotoClick(inspection)} title="Upload Photo">📷</button>
                      {photos && Array.isArray(photos) && photos.length > 0 && (
                        <span className="sa-cell-sub" style={{ marginLeft: '8px', fontSize: '0.75rem' }}>
                          ({photos.length})
                        </span>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMaintenance = () => {
    const handleProcessRequest = async (maintenance) => {
      try {
        setLoading(true);
        await technicianService.updateMaintenanceRequest(maintenance.ID || maintenance.id, {
          status: 'Approved'
        });
        addNotification('Maintenance approved successfully', 'success');
        loadData();
      } catch (error) {
        console.error('Error approving maintenance:', error);
        addNotification(error.message || 'Failed to approve maintenance', 'error');
      } finally {
        setLoading(false);
      }
    };

    const handleRefuseRequest = async (maintenance) => {
      if (!window.confirm('Are you sure you want to refuse this maintenance request?')) {
        return;
      }
      try {
        setLoading(true);
        await technicianService.updateMaintenanceRequest(maintenance.ID || maintenance.id, {
          status: 'Refused'
        });
        addNotification('Request refused successfully', 'success');
        loadData();
      } catch (error) {
        console.error('Error refusing request:', error);
        addNotification('Failed to refuse request', 'error');
      } finally {
        setLoading(false);
      }
    };

    const handleUpdateMaintenance = async (maintenance) => {
      // Reuse the task modal to update estimated hours/cost and status
      const existingPhotoURLs = maintenance.photos || maintenance.Photos || maintenance.photoURLs || maintenance.PhotoURLs || [];
      const photoArray = Array.isArray(existingPhotoURLs) ? existingPhotoURLs : (typeof existingPhotoURLs === 'string' ? JSON.parse(existingPhotoURLs || '[]') : []);
      setShowTaskModal(true);
      setTaskContext('maintenance');
      setSelectedTask(maintenance);
      setTaskForm({
        property: maintenance.property || maintenance.Property || '',
        issue: maintenance.issue || maintenance.Issue || '',
        priority: (maintenance.priority || maintenance.Priority || 'normal').toLowerCase(),
        status: maintenance.status || maintenance.Status || 'Pending',
        estimatedHours: maintenance.estimatedHours || maintenance.EstimatedHours || 0,
        estimatedCost: maintenance.estimatedCost || maintenance.EstimatedCost || 0,
        assigned: maintenance.assigned || maintenance.Assigned || maintenance.assignedTo || maintenance.AssignedTo || '',
        existingPhotoURLs: photoArray,
      });
    };

    const handleSubmitQuote = async (maintenance) => {
      try {
        const estimatedCostRaw =
          maintenance.estimatedCost ??
          maintenance.EstimatedCost ??
          maintenance.estimated_cost ??
          maintenance.Estimated_Cost ??
          0;
        let estimatedCost = Number(String(estimatedCostRaw).replace(/[^0-9.-]/g, '')) || 0;
        if (estimatedCost <= 0) {
          const promptValue = window.prompt(
            'Enter the quote amount to submit for validation:',
            estimatedCostRaw ? String(estimatedCostRaw) : ''
          );
          if (promptValue === null) {
            return;
          }
          estimatedCost = Number(String(promptValue).replace(/[^0-9.-]/g, '')) || 0;
          if (estimatedCost <= 0) {
            addNotification('Please set a valid quote amount before submitting.', 'warning');
            return;
          }
        }
        const quoteData = {
          maintenanceId: maintenance.id || maintenance.ID,
          property: maintenance.property || maintenance.Property,
          issue: maintenance.issue || maintenance.Issue,
          amount: estimatedCost,
          recipient: 'management@example.com',
        };
        await technicianService.submitQuote(quoteData);
        addNotification('Quote submitted successfully', 'success');
        loadData();
      } catch (error) {
        console.error('Error submitting quote:', error);
        addNotification('Failed to submit quote', 'error');
      }
    };

    // Only show non-completed maintenance in this table, then apply filters.
    const visibleRequests = requests.filter(m => {
      const rawStatus = m.status || m.Status || '';
      const status = String(rawStatus).trim().toLowerCase();
      const completedStatuses = ['completed', 'complete', 'done', 'finished', 'closed', 'resolved'];
      if (completedStatuses.some(s => status === s || status.startsWith(s))) return false;

      const priority = (m.priority || m.Priority || 'normal').toString().trim().toLowerCase();
      const mStatus = (m.status || m.Status || '').toString().trim();
      const property = (m.property || m.Property || '').toString().toLowerCase();

      if (maintenancePriorityFilter && priority !== maintenancePriorityFilter.toLowerCase()) return false;
      if (maintenanceStatusFilter && mStatus !== maintenanceStatusFilter) return false;
      if (maintenancePropertyFilter && !property.includes(maintenancePropertyFilter.toLowerCase())) return false;
      return true;
    });

    const uniqueProperties = [...new Set(requests.map(m => (m.property || m.Property || '').trim()).filter(Boolean))].sort();

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Maintenance</h3>
            <p>Receipt of tenant requests - Analyze and define if they should be processed or refused</p>
          </div>
          <button
            className="sa-primary-cta"
            onClick={() => {
              // Open the generic task modal in "create" mode so the technician
              // can add a new maintenance task.
              setSelectedTask(null);
              setTaskContext('maintenance');
              setTaskForm({
                property: '',
                issue: '',
                priority: 'normal',
                status: 'Pending',
                estimatedHours: 0,
                estimatedCost: 0,
                assigned: '',
                photos: [],
                existingPhotoURLs: [],
                quotation: null,
                invoice: null,
                requireDirectorApproval: false,
              });
              setShowTaskModal(true);
            }}
            disabled={loading}
          >
            <Plus size={18} />
            Add Maintenance
          </button>
        </div>

        <div className="sa-filters-section">
          <select
            className="sa-filter-select"
            value={maintenancePriorityFilter}
            onChange={(e) => setMaintenancePriorityFilter(e.target.value)}
          >
            <option value="">All Priority Levels</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          <select
            className="sa-filter-select"
            value={maintenanceStatusFilter}
            onChange={(e) => setMaintenanceStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Approved">Approved</option>
            <option value="Refused">Refused</option>
          </select>
          <select
            className="sa-filter-select"
            value={maintenancePropertyFilter}
            onChange={(e) => setMaintenancePropertyFilter(e.target.value)}
          >
            <option value="">All Properties</option>
            {uniqueProperties.map((prop) => (
              <option key={prop} value={prop}>{prop}</option>
            ))}
          </select>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Property</th>
              <th>Issue</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Date</th>
              <th>Est. Hours</th>
              <th>Est. Cost</th>
              <th>Quote</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visibleRequests.length === 0 ? (
              <tr>
                  <td colSpan={11} className="sa-table-empty">
                  No maintenance requests found
                </td>
              </tr>
            ) : (
                visibleRequests.map((maintenance, index) => {
                  const maintenanceId = maintenance.id || maintenance.ID;
                  const property = maintenance.property || maintenance.Property;
                  const issue = maintenance.title || maintenance.Title || maintenance.issue || maintenance.Issue || 'Maintenance Request';
                  const description = maintenance.description || maintenance.Description || '';
                  const priority = (maintenance.priority || maintenance.Priority || 'normal').toLowerCase();
                  const status = maintenance.status || maintenance.Status || 'Pending';
                  const assigned = maintenance.assigned || maintenance.Assigned || maintenance.assignedTo || maintenance.AssignedTo || 'Unassigned';
                  const date = maintenance.date || maintenance.Date || maintenance.createdAt || maintenance.CreatedAt;
                  const estimatedHours = maintenance.estimatedHours || maintenance.EstimatedHours || 0;
                  const estimatedCostRaw =
                    maintenance.estimatedCost ??
                    maintenance.EstimatedCost ??
                    maintenance.estimated_cost ??
                    maintenance.Estimated_Cost ??
                    0;
                  const estimatedCost = Number(String(estimatedCostRaw).replace(/[^0-9.-]/g, '')) || 0;
                  const quoteGenerated = maintenance.quoteGenerated || maintenance.QuoteGenerated || false;
                  const photos = maintenance.photos || maintenance.Photos || maintenance.photoURLs || maintenance.PhotoURLs || [];
                  
                  return (
                    <tr key={maintenanceId}>
                      <td>{index + 1}</td>
                      <td className="sa-cell-main">
                        <span className="sa-cell-title">{property}</span>
                      </td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{issue}</span>
                          {description && (
                            <span className="sa-cell-sub" style={{ fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {description}
                            </span>
                          )}
                          {photos && Array.isArray(photos) && photos.length > 0 && (
                            <span className="sa-cell-sub" style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '4px' }}>
                              📷 {photos.length} photo{photos.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                  </td>
                  <td>
                        <span className={`sa-status-pill ${priority}`}>
                          {priority}
                    </span>
                  </td>
                  <td>
                        <span className={`sa-status-pill ${status.toLowerCase().replace(' ', '-')}`}>
                          {status}
                    </span>
                  </td>
                      <td>{assigned}</td>
                      <td>{date ? new Date(date).toLocaleDateString() : 'N/A'}</td>
                      <td>{estimatedHours}h</td>
                      <td>${estimatedCost.toLocaleString()}</td>
                      <td>
                        <span className={`sa-status-pill ${quoteGenerated ? 'sent' : 'pending'}`}>
                          {quoteGenerated ? 'Generated' : 'Pending'}
                        </span>
                      </td>
                      <td className="sa-row-actions">
                        <button 
                          className="sa-icon-button" 
                          onClick={() => {
                            setSelectedMaintenanceRequest(maintenance);
                            setShowMaintenanceViewModal(true);
                          }} 
                          title="View Details"
                        >
                          👁️
                        </button>
                        {(status === 'Pending' || status === 'In Progress') && (
                          <>
                            <button 
                              className="sa-icon-button" 
                              onClick={() => handleProcessRequest(maintenance)} 
                              title="Approve"
                              style={{ color: '#16a34a', marginLeft: '8px' }}
                            >
                              ✓
                            </button>
                            <button 
                              className="sa-icon-button" 
                              onClick={() => handleRefuseRequest(maintenance)} 
                              title="Refuse Request"
                              style={{ color: '#ef4444', marginLeft: '8px' }}
                            >
                              ✗
                            </button>
                          </>
                        )}
                        <button className="sa-icon-button" onClick={() => handleUpdateMaintenance(maintenance)} title="Edit" style={{ marginLeft: '8px' }}>✏️</button>
                        {!quoteGenerated && status !== 'Refused' && (
                          <button className="sa-icon-button" onClick={() => handleSubmitQuote(maintenance)} title="Generate Quote" style={{ color: '#2563eb', marginLeft: '8px' }}>💰</button>
                        )}
                      </td>
                </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  };

  const renderInventories = () => {
    const inventoryInspections = inspections.filter(i => {
      const type = i.type || i.Type;
      return type === 'Move-in' || type === 'Move-out';
    });

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
        <h3>Move-in and Move-out Inventories</h3>
        <p>Create and manage detailed inventory reports</p>
          </div>
      </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Property</th>
              <th>Type</th>
              <th>Date</th>
              <th>Inspector</th>
              <th>Notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
              {inventoryInspections.length === 0 ? (
              <tr>
                  <td colSpan={7} className="sa-table-empty">
                  No inventory inspections found
                </td>
              </tr>
            ) : (
                inventoryInspections.map((inv, index) => {
                  const invId = inv.id || inv.ID;
                  const property = inv.property || inv.Property;
                  const type = inv.type || inv.Type;
                  const date = inv.date || inv.Date;
                  const inspector = inv.inspector || inv.Inspector;
                  const notes = inv.notes || inv.Notes;
                  
                  return (
                    <tr key={`inv-${invId}`}>
                      <td>{index + 1}</td>
                      <td className="sa-cell-main">
                        <span className="sa-cell-title">{property}</span>
                  </td>
                  <td>
                        <span className={`sa-status-pill ${(type || 'move-in').toLowerCase().replace(' ', '-')}`}>
                          {type || 'Move-in'}
                        </span>
                  </td>
                      <td>{date ? new Date(date).toLocaleDateString() : 'N/A'}</td>
                      <td>{inspector || 'Unassigned'}</td>
                  <td>
                        <span className="sa-cell-sub">{notes || 'No notes'}</span>
                      </td>
                      <td className="sa-row-actions">
                        <button className="sa-icon-button" title="View">👁️</button>
                        <button className="sa-icon-button" title="Edit">✏️</button>
                  </td>
                </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  };

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

  const renderProgress = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
        <h3>Work Progress Report</h3>
        <p>Monitor progress of ongoing maintenance tasks</p>
      </div>
      </div>

      <div className="sa-filters-section">
        <select 
          className="sa-filter-select"
          value=""
          onChange={() => {}}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select 
          className="sa-filter-select"
          value=""
          onChange={() => {}}
        >
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {null && (
        <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Total Ongoing</p>
              <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 600, color: '#111827' }}>
                {0}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Total Completed</p>
              <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 600, color: '#111827' }}>
                {0}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Total Ongoing Cost</p>
              <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 600, color: '#111827' }}>
                ${(0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Property</th>
              <th>Issue</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            {[].length === 0 ? (
              <tr>
                <td colSpan={7} className="sa-table-empty">
                  No maintenance requests found
                </td>
              </tr>
            ) : (
              [].map((m, index) => {
                const maintenanceId = m.id || m.ID;
                const property = m.property || m.Property;
                const issue = m.issue || m.Issue;
                const priority = (m.priority || m.Priority || 'normal').toLowerCase();
                const status = m.status || m.Status || 'Pending';
                const assigned = m.assigned || m.Assigned || 'Unassigned';
                const estimatedCost = m.estimatedCost || m.EstimatedCost || 0;
                
                return (
                  <tr key={`prog-${maintenanceId}`}>
                    <td>{index + 1}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{property}</span>
                    </td>
                    <td>{issue}</td>
                    <td>
                      <span className={`sa-status-pill ${priority}`}>
                        {priority}
                      </span>
                  </td>
                    <td>
                      <span className={`sa-status-pill ${status.toLowerCase().replace(' ', '-')}`}>
                        {status}
                      </span>
                    </td>
                    <td>{assigned}</td>
                    <td>${estimatedCost.toLocaleString()}</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
        <h3>Task Management</h3>
        <p>Manage scheduled tasks and maintenance calendar</p>
        </div>
        <button 
          className="sa-primary-cta"
          onClick={() => {
            setSelectedTask(null);
            setTaskForm({ status: 'Pending', estimatedHours: 0, estimatedCost: 0, photos: [], existingPhotoURLs: [] });
            setShowTaskModal(true);
          }}
        >
          <Plus size={16} />
          Create Task
        </button>
      </div>

      <div className="sa-filters-section">
        <select className="sa-filter-select">
          <option value="">All Priority Levels</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <select className="sa-filter-select">
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Task Title</th>
              <th>Property</th>
              <th>Priority</th>
              <th>Date</th>
              <th>Status</th>
              <th>Est. Hours</th>
              <th>Est. Cost</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={9} className="sa-table-empty">
                  No tasks found
                </td>
              </tr>
            ) : (
              tasks.map((task, index) => {
                const taskId = task.id || task.ID;
                const issue = task.issue || task.Issue || 'Maintenance Task';
                const property = task.property || task.Property;
                const priority = (task.priority || task.Priority || 'normal').toLowerCase();
                const date = task.date || task.Date || task.createdAt || task.CreatedAt;
                const status = task.status || task.Status || 'Pending';
                const estimatedHours = task.estimatedHours || task.EstimatedHours || 0;
                const estimatedCost = task.estimatedCost || task.EstimatedCost || 0;
                
                return (
                  <tr key={taskId}>
                    <td>{index + 1}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{issue}</span>
                    </td>
                    <td>{property}</td>
                  <td>
                      <span className={`sa-status-pill ${priority}`}>
                        {priority}
                    </span>
                  </td>
                    <td>{date ? new Date(date).toLocaleDateString() : 'N/A'}</td>
                  <td>
                      <span className={`sa-status-pill ${status.toLowerCase().replace(' ', '-')}`}>
                        {status}
                    </span>
                  </td>
                    <td>{estimatedHours}h</td>
                    <td>${estimatedCost.toLocaleString()}</td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" onClick={() => handleTaskView(task)} title="View/Edit">✏️</button>
                      {status !== 'Completed' && (
                    <button 
                          className="sa-icon-button" 
                        onClick={() => handleTaskComplete(task)}
                        disabled={loading}
                          title="Complete"
                          style={{ color: '#16a34a', marginLeft: '8px' }}
                      >
                          ✓
                      </button>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Load advertisements
  const loadAdvertisements = async () => {
    try {
      const ads = await technicianService.getAdvertisements();
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

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const contactId = selectedContact?.ID || selectedContact?.id;
      const payload = {
        ...contactForm,
        category:
          contactForm.category === 'other' && contactForm.customCategory.trim()
            ? contactForm.customCategory.trim()
            : contactForm.category,
      };
      if (contactId) {
        await technicianService.updateTechnicianContact(contactId, payload);
        addNotification('Contact updated successfully', 'success');
      } else {
        await technicianService.createTechnicianContact(payload);
        addNotification('Contact added successfully', 'success');
      }
      setShowContactModal(false);
      setSelectedContact(null);
      setContactForm({ name: '', category: '', customCategory: '', phone: '', email: '', address: '', description: '', photo: null, idCard: null });
      loadData();
    } catch (error) {
      console.error('Error saving contact:', error);
      addNotification(error.message || 'Failed to save contact', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }
    setLoading(true);
    try {
      await technicianService.deleteTechnicianContact(contactId);
      addNotification('Contact deleted successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error deleting contact:', error);
      addNotification(error.message || 'Failed to delete contact', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = (contact) => {
    setSelectedContact(contact);
    setContactForm({
      name: contact.Name || contact.name || '',
      category: contact.Category || contact.category || '',
      customCategory: '',
      phone: contact.Phone || contact.phone || '',
      email: contact.Email || contact.email || '',
      address: contact.Address || contact.address || '',
      description: contact.Description || contact.description || '',
      photo: null,
      idCard: null
    });
    setShowContactModal(true);
  };

  const renderTechnicianContacts = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h2>Technician Contacts Management</h2>
            <p>Add and manage technician contacts (plumbers, electricians, etc.) for tenants</p>
          </div>
          <button 
            className="sa-primary-cta" 
            onClick={() => {
              setSelectedContact(null);
              setContactForm({ name: '', category: '', customCategory: '', phone: '', email: '', address: '', description: '', photo: null, idCard: null });
              setShowContactModal(true);
            }} 
            disabled={loading}
          >
            <Plus size={18} />
            Add Contact
          </button>
        </div>

        {loading ? (
          <div className="sa-table-empty">Loading contacts...</div>
        ) : technicianContacts.length === 0 ? (
          <div className="sa-table-empty">No technician contacts added yet</div>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {technicianContacts.map((contact, index) => {
                  const contactId = contact.ID || contact.id;
                  return (
                    <tr key={contactId}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{contact.Name || contact.name || 'N/A'}</span>
                          {contact.Description && (
                            <span className="sa-cell-sub">{contact.Description || contact.description}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          fontSize: '0.75rem',
                          textTransform: 'capitalize'
                        }}>
                          {contact.Category || contact.category || 'N/A'}
                        </span>
                      </td>
                      <td>{contact.Phone || contact.phone || 'N/A'}</td>
                      <td>{contact.Email || contact.email || 'N/A'}</td>
                      <td>{contact.Address || contact.address || 'N/A'}</td>
                      <td>
                        <div className="sa-row-actions">
                          <button
                            className="table-action-button edit"
                            onClick={() => handleEditContact(contact)}
                            title="Edit Contact"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button
                            className="table-action-button delete"
                            onClick={() => handleDeleteContact(contactId)}
                            title="Delete Contact"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
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

  // Render Quotes Section - List quotes being validated and validated quotes
  const renderQuotes = () => {
    const isWorkStatusFilter = quoteStatusFilter === 'work_started' || quoteStatusFilter === 'work_not_started';
    const workStartedForQuote = (q) => {
      const quoteMaintenanceId = q.MaintenanceID || q.maintenanceId;
      return quoteMaintenanceId && works.some(
        w => String(w.ID || w.id) === String(quoteMaintenanceId) && (w.Status || w.status) === 'In Progress'
      );
    };

    const filteredQuotes = quotes.filter(q => {
      const status = (q.Status || q.status || '').toLowerCase();
      const property = (q.Property || q.property || '').toLowerCase();
      const issue = (q.Issue || q.issue || '').toLowerCase();
      const recipient = (q.Recipient || q.recipient || '').toLowerCase();
      const dateValue = q.Date || q.date || q.CreatedAt || q.createdAt;
      const normalizedDate = normalizeDateValue(dateValue);

      if (quoteStatusFilter) {
        const expected = quoteStatusFilter.toLowerCase();
        if (isWorkStatusFilter) {
          // Work Started / Work Not Started: only include validated quotes; work filter applied below
          if (status !== 'approved' && status !== 'validated') return false;
        } else if (expected !== status) return false;
      }
      if (quoteDateFilter && normalizedDate !== quoteDateFilter) return false;
      if (quotePropertyFilter && !property.includes(quotePropertyFilter.toLowerCase())) return false;
      if (quoteSearchText) {
        const search = quoteSearchText.toLowerCase();
        if (!issue.includes(search) && !recipient.includes(search)) return false;
      }
      return true;
    });

    const quotesToValidate = filteredQuotes.filter(q => {
      if (isWorkStatusFilter) return false; // Work status filter shows only validated quotes
      const status = (q.Status || q.status || '').toLowerCase();
      return status === 'sent' || status === 'pending';
    });
    let validatedQuotes = filteredQuotes.filter(q => {
      const status = (q.Status || q.status || '').toLowerCase();
      return status === 'approved' || status === 'validated';
    });
    if (quoteStatusFilter === 'work_started') {
      validatedQuotes = validatedQuotes.filter(q => workStartedForQuote(q));
    } else if (quoteStatusFilter === 'work_not_started') {
      validatedQuotes = validatedQuotes.filter(q => !workStartedForQuote(q));
    }

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>The Quotes</h3>
            <p>Manage quotes awaiting validation and view validated quotes</p>
          </div>
        </div>

        <div className="sa-filters-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <select 
            className="sa-filter-select"
            value={quoteStatusFilter}
            onChange={(e) => setQuoteStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="sent">Being Validated</option>
            <option value="approved">Validated</option>
            <option value="rejected">Rejected</option>
            <option value="work_started">Work Started</option>
            <option value="work_not_started">Work Not Started</option>
          </select>
          <input
            type="date"
            className="sa-filter-select"
            value={quoteDateFilter}
            onChange={(e) => setQuoteDateFilter(e.target.value)}
          />
          <input
            type="text"
            className="sa-filter-select"
            placeholder="Filter by property"
            value={quotePropertyFilter}
            onChange={(e) => setQuotePropertyFilter(e.target.value)}
          />
        </div>

        {/* Quotes Being Validated Tab */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>Quotes Being Validated</h4>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Date</th>
                  <th>Property</th>
                  <th>Issue</th>
                  <th>Amount</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {quotesToValidate.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="sa-table-empty">No quotes awaiting validation</td>
                  </tr>
                ) : (
                  quotesToValidate.map((q, index) => (
                    <tr key={q.ID || q.id}>
                      <td>{index + 1}</td>
                      <td>{q.Date || q.date ? new Date(q.Date || q.date).toLocaleDateString() : 'N/A'}</td>
                      <td>{q.Property || q.property || 'N/A'}</td>
                      <td>{q.Issue || q.issue || 'N/A'}</td>
                      <td>${(q.Amount || q.amount || 0).toLocaleString()}</td>
                      <td>{q.Recipient || q.recipient || 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${(q.Status || q.status || 'sent').toLowerCase()}`}>
                          {q.Status || q.status || 'Sent'}
                        </span>
                      </td>
                      <td>
                        {/* Check if super urgent - requires single validation */}
                        <span className="sa-status-pill urgent">Super Urgent</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Validated Quotes Tab */}
        <div>
          <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>Validated Quotes</h4>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Date</th>
                  <th>Property</th>
                  <th>Issue</th>
                  <th>Amount</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Validated By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {validatedQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="sa-table-empty">No validated quotes</td>
                  </tr>
                ) : (
                  validatedQuotes.map((q, index) => {
                    const quoteMaintenanceId = q.MaintenanceID || q.maintenanceId;
                    const workStarted = quoteMaintenanceId && works.some(
                      w => String(w.ID || w.id) === String(quoteMaintenanceId) && (w.Status || w.status) === 'In Progress'
                    );
                    return (
                    <tr key={q.ID || q.id}>
                      <td>{index + 1}</td>
                      <td>{q.Date || q.date ? new Date(q.Date || q.date).toLocaleDateString() : 'N/A'}</td>
                      <td>{q.Property || q.property || 'N/A'}</td>
                      <td>{q.Issue || q.issue || 'N/A'}</td>
                      <td>${(q.Amount || q.amount || 0).toLocaleString()}</td>
                      <td>{q.Recipient || q.recipient || 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${(q.Status || q.status || 'approved').toLowerCase()}`}>
                          {q.Status || q.status || 'Approved'}
                        </span>
                      </td>
                      <td>{q.ValidatedBy || q.validatedBy || 'N/A'}</td>
                      <td>
                        {workStarted ? (
                          <span className="sa-status-pill completed" style={{ cursor: 'default' }}>
                            Work Started
                          </span>
                        ) : (
                          <button
                            className="table-action-button edit"
                            onClick={() => openWorkStartModal(q)}
                          >
                            Start Work
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Works Section - List work in progress, in pause, and completed
  const renderWorks = () => {
    const filteredWorks = works.filter(w => {
      if (w.Archived || w.archived) return false;
      const status = (w.Status || w.status || '').toLowerCase();
      const property = (w.Property || w.property || '').toLowerCase();
      const issue = (w.Issue || w.issue || '').toLowerCase();
      const assigned = (w.Assigned || w.assigned || '').toLowerCase();
      const priority = (w.Priority || w.priority || '').toLowerCase();
      const dateValue = w.WorkStartDate || w.workStartDate || w.Date || w.date || w.CreatedAt || w.createdAt;
      const normalizedDate = normalizeDateValue(dateValue);

      if (workStatusFilter) {
        if (status !== workStatusFilter.toLowerCase()) return false;
      }
      if (workDateFilter && normalizedDate !== workDateFilter) return false;
      if (workPropertyFilter && !property.includes(workPropertyFilter.toLowerCase())) return false;
      if (workPriorityFilter && priority !== workPriorityFilter.toLowerCase()) return false;
      if (workSearchText) {
        const search = workSearchText.toLowerCase();
        if (!issue.includes(search) && !assigned.includes(search)) return false;
      }
      return true;
    });

    const worksInProgress = filteredWorks.filter(w => (w.Status || w.status) === 'In Progress');
    const worksInPause = filteredWorks.filter(w => (w.Status || w.status) === 'Paused' || (w.Status || w.status) === 'On Hold');
    const completedWorks = filteredWorks.filter(w => (w.Status || w.status) === 'Completed');
    const completedWorkIds = completedWorks.map(w => w.ID || w.id).filter(Boolean);
    const allCompletedSelected = completedWorkIds.length > 0 && completedWorkIds.every(id => selectedWorkIds.includes(id));

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Works</h3>
            <p>Manage work orders: in progress, paused, and completed</p>
          </div>
        </div>

        <div className="sa-filters-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <select 
            className="sa-filter-select"
            value={workStatusFilter}
            onChange={(e) => setWorkStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="in progress">In Progress</option>
            <option value="paused">In Pause</option>
            <option value="completed">Completed</option>
          </select>
          <input
            type="date"
            className="sa-filter-select"
            value={workDateFilter}
            onChange={(e) => setWorkDateFilter(e.target.value)}
          />
          <input
            type="text"
            className="sa-filter-select"
            placeholder="Filter by property"
            value={workPropertyFilter}
            onChange={(e) => setWorkPropertyFilter(e.target.value)}
          />
          <select
            className="sa-filter-select"
            value={workPriorityFilter}
            onChange={(e) => setWorkPriorityFilter(e.target.value)}
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Work In Progress */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>Work In Progress</h4>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Property</th>
                  <th>Issue</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Est. Cost</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {worksInProgress.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="sa-table-empty">No work in progress</td>
                  </tr>
                ) : (
                  worksInProgress.map((w, index) => (
                    <tr key={w.ID || w.id}>
                      <td>{index + 1}</td>
                      <td>{w.Property || w.property || 'N/A'}</td>
                      <td>{w.Issue || w.issue || 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${(w.Priority || w.priority || 'normal').toLowerCase()}`}>
                          {w.Priority || w.priority || 'Normal'}
                        </span>
                      </td>
                      <td>{w.Assigned || w.assigned || 'Unassigned'}</td>
                      <td>${(w.EstimatedCost || w.estimatedCost || 0).toLocaleString()}</td>
                      <td>{w.WorkStartDate || w.workStartDate ? new Date(w.WorkStartDate || w.workStartDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{w.WorkEndDate || w.workEndDate ? new Date(w.WorkEndDate || w.workEndDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <button className="table-action-button edit" onClick={() => handleWorkStatusChange(w, 'Paused')}>
                          Pause
                        </button>
                        <button className="table-action-button edit" onClick={() => handleWorkStatusChange(w, 'Completed')} style={{ marginLeft: '8px' }}>
                          Complete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Work In Pause */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>Work In Pause</h4>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Property</th>
                  <th>Issue</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Est. Cost</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {worksInPause.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="sa-table-empty">No work in pause</td>
                  </tr>
                ) : (
                  worksInPause.map((w, index) => (
                    <tr key={w.ID || w.id}>
                      <td>{index + 1}</td>
                      <td>{w.Property || w.property || 'N/A'}</td>
                      <td>{w.Issue || w.issue || 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${(w.Priority || w.priority || 'normal').toLowerCase()}`}>
                          {w.Priority || w.priority || 'Normal'}
                        </span>
                      </td>
                      <td>{w.Assigned || w.assigned || 'Unassigned'}</td>
                      <td>${(w.EstimatedCost || w.estimatedCost || 0).toLocaleString()}</td>
                      <td>{w.WorkStartDate || w.workStartDate ? new Date(w.WorkStartDate || w.workStartDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{w.WorkEndDate || w.workEndDate ? new Date(w.WorkEndDate || w.workEndDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <button className="table-action-button edit" onClick={() => handleWorkStatusChange(w, 'In Progress')}>
                          Resume
                        </button>
                        <button className="table-action-button edit" onClick={() => handleWorkStatusChange(w, 'Completed')} style={{ marginLeft: '8px' }}>
                          Complete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Completed Works */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Completed Works</h4>
            <button
              className="action-button secondary"
              type="button"
              onClick={() => handleArchiveWorks(selectedWorkIds)}
              disabled={selectedWorkIds.length === 0 || loading}
            >
              Archive Selected
            </button>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allCompletedSelected}
                      onChange={() => {
                        if (allCompletedSelected) {
                          setSelectedWorkIds(prev => prev.filter(id => !completedWorkIds.includes(id)));
                        } else {
                          setSelectedWorkIds(prev => Array.from(new Set([...prev, ...completedWorkIds])));
                        }
                      }}
                    />
                  </th>
                  <th>No</th>
                  <th>Property</th>
                  <th>Issue</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Final Cost</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedWorks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="sa-table-empty">No completed work</td>
                  </tr>
                ) : (
                  completedWorks.map((w, index) => (
                    <tr key={w.ID || w.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedWorkIds.includes(w.ID || w.id)}
                          onChange={() => toggleWorkSelection(w.ID || w.id)}
                        />
                      </td>
                      <td>{index + 1}</td>
                      <td>{w.Property || w.property || 'N/A'}</td>
                      <td>{w.Issue || w.issue || 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${(w.Priority || w.priority || 'normal').toLowerCase()}`}>
                          {w.Priority || w.priority || 'Normal'}
                        </span>
                      </td>
                      <td>{w.Assigned || w.assigned || 'Unassigned'}</td>
                      <td>${(w.EstimatedCost || w.estimatedCost || 0).toLocaleString()}</td>
                      <td>{w.WorkStartDate || w.workStartDate ? new Date(w.WorkStartDate || w.workStartDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{w.WorkEndDate || w.workEndDate ? new Date(w.WorkEndDate || w.workEndDate).toLocaleDateString() : (w.CompletedAt || w.completedAt ? new Date(w.CompletedAt || w.completedAt).toLocaleDateString() : 'N/A')}</td>
                      <td>
                        <button
                          className="table-action-button edit"
                          type="button"
                          onClick={() => handleArchiveWorks([w.ID || w.id])}
                          disabled={loading}
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render State of Entry / Exit - Entry | Exit tenant tables (View)
  const renderStateEntry = () => {
    const list = stateEntryView === 'entry' ? entryTenants : exitTenants;
    const toDateOnly = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
    };
    const filteredList = list.filter((tenant) => {
      const name = (tenant.Name || tenant.name || '').toString().toLowerCase();
      const property = (tenant.Property || tenant.property || '').toString().toLowerCase();
      const statusEntry = (tenant.Status || tenant.status || '').toString().toLowerCase();
      const statusExit = (tenant.ExitInventoryStatus || tenant.exitInventoryStatus || '').toString().toLowerCase();
      const status = stateEntryView === 'entry' ? statusEntry : statusExit;
      const dateEntry = tenant.DepositPaidDate || tenant.InventoryRequestDate || '';
      const dateExit = tenant.TerminationRequestDate || tenant.terminationRequestDate || tenant.requestDate || tenant.RequestDate || tenant.createdAt || tenant.CreatedAt || tenant.InventoryCheckDate || tenant.inventoryCheckDate || '';
      const tenantDate = stateEntryView === 'entry' ? toDateOnly(dateEntry) : toDateOnly(dateExit);

      if (stateEntryNameFilter && !name.includes(stateEntryNameFilter.trim().toLowerCase())) return false;
      if (stateEntryPropertyFilter && !property.includes(stateEntryPropertyFilter.trim().toLowerCase())) return false;
      if (stateEntryStatusFilter && status !== stateEntryStatusFilter.trim().toLowerCase()) return false;
      if (stateEntryDateFilter && tenantDate !== stateEntryDateFilter) return false;
      return true;
    });

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>State of Entry / Exit</h3>
            <p>
              View inventory reports you have submitted, and add new Entry or Exit inventories for tenants below.
            </p>
          </div>
          <button 
            className="sa-primary-cta"
            onClick={() => {
              setInventoryFormData({ ...inventoryFormData, type: stateEntryView === 'entry' ? 'Entry' : 'Exit' });
              setShowInventoryFormModal(true);
            }}
          >
            <Plus size={16} />
            Add Inventory ({stateEntryView === 'entry' ? 'Entry' : 'Exit'})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#374151' }}>View:</span>
          <button
            type="button"
            className={stateEntryView === 'entry' ? 'action-button primary' : 'action-button secondary'}
            onClick={() => setStateEntryView('entry')}
          >
            Entry
          </button>
          <button
            type="button"
            className={stateEntryView === 'exit' ? 'action-button primary' : 'action-button secondary'}
            onClick={() => setStateEntryView('exit')}
          >
            Exit
          </button>
        </div>

        <h4 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
          {stateEntryView === 'entry'
            ? 'Tenants who need Entry inventory – select a row to add a new report'
            : 'Tenants who need Exit inventory – select a row to add a new report'}
        </h4>
        <div className="sa-filters-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <select
            className="sa-filter-select"
            value={stateEntryStatusFilter}
            onChange={(e) => setStateEntryStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            className="sa-filter-select"
            placeholder="Filter by date"
            value={stateEntryDateFilter}
            onChange={(e) => setStateEntryDateFilter(e.target.value)}
          />
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Tenant Name</th>
                <th>Property</th>
                {stateEntryView === 'entry' && <th>Unit Number</th>}
                {stateEntryView === 'entry' ? (
                  <>
                    <th>Deposit Paid Date</th>
                    <th>Inventory Request Date</th>
                    <th>Status</th>
                  </>
                ) : (
                  <>
                    <th>Termination Request Date</th>
                    <th>Inventory Check Date</th>
                    <th>Exit Inventory Status</th>
                    <th>Deposit Refund Status</th>
                  </>
                )}
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={stateEntryView === 'exit' ? 8 : 8} className="sa-table-empty">
                    {stateEntryView === 'entry'
                      ? 'No entry inventory requests found. Use filters or add an Entry inventory from the popup.'
                      : 'No exit requests found. Use filters or add an Exit inventory from the popup.'}
                  </td>
                </tr>
              ) : stateEntryView === 'entry' ? (
                filteredList.map((tenant, index) => (
                  <tr key={tenant.ID || tenant.id}>
                    <td>{index + 1}</td>
                    <td>{tenant.Name || tenant.name || 'N/A'}</td>
                    <td>{tenant.Property || tenant.property || 'N/A'}</td>
                    <td>{tenant.UnitNumber || tenant.unitNumber || 'N/A'}</td>
                    <td>{tenant.DepositPaidDate ? new Date(tenant.DepositPaidDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{tenant.InventoryRequestDate ? new Date(tenant.InventoryRequestDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`sa-status-pill ${(tenant.Status || tenant.status || 'pending').toLowerCase()}`}>
                        {tenant.Status || tenant.status || 'Pending'}
                      </span>
                    </td>
                    <td className="sa-row-actions">
                      <button 
                        className="sa-icon-button" 
                        onClick={() => {
                          setInventoryFormData({ ...inventoryFormData, type: 'Entry', tenantName: tenant.Name || tenant.name, propertyAddress: tenant.Property || tenant.property });
                          setShowInventoryFormModal(true);
                        }}
                        title="Create Inventory"
                      >
                        📋
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                filteredList.map((tenant, index) => {
                  const termRequestDate = tenant.TerminationRequestDate || tenant.terminationRequestDate || tenant.requestDate || tenant.RequestDate || tenant.createdAt || tenant.CreatedAt;
                  const termRequestDateStr = termRequestDate ? (() => { const d = new Date(termRequestDate); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(); })() : '—';
                  return (
                  <tr key={tenant.ID || tenant.id}>
                    <td>{index + 1}</td>
                    <td>{tenant.Name || tenant.name || 'N/A'}</td>
                    <td>{tenant.Property || tenant.property || 'N/A'}</td>
                    <td>{termRequestDateStr}</td>
                    <td>
                      {tenant.InventoryCheckDate || tenant.inventoryCheckDate
                        ? new Date(tenant.InventoryCheckDate || tenant.inventoryCheckDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <span className={`sa-status-pill ${(tenant.ExitInventoryStatus || tenant.exitInventoryStatus || 'pending').toLowerCase()}`}>
                        {tenant.ExitInventoryStatus || tenant.exitInventoryStatus || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span className={`sa-status-pill ${(tenant.DepositRefundStatus || tenant.depositRefundStatus || 'pending').toLowerCase()}`}>
                        {tenant.DepositRefundStatus || tenant.depositRefundStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="sa-row-actions">
                      <button 
                        className="sa-icon-button" 
                        onClick={() => {
                          setInventoryFormData({ ...inventoryFormData, type: 'Exit', tenantName: tenant.Name || tenant.name, propertyAddress: tenant.Property || tenant.property });
                          setShowInventoryFormModal(true);
                        }}
                        title="Create Exit Inventory"
                      >
                        📋
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Submitted inventory reports - history below the tenant table */}
        <div style={{ marginTop: '32px' }}>
          <h4 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
            Submitted inventory reports
          </h4>
          <p style={{ marginBottom: '12px', fontSize: '0.875rem', color: '#6b7280' }}>
            Inventory reports you have submitted (Entry or Exit) appear here.
          </p>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Type</th>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const invType = stateEntryView === 'entry' ? 'Move-in' : 'Move-out';
                  const submitted = (submittedInventories || [])
                    .filter(inv => (inv.Type || inv.type) === invType)
                    .sort((a, b) => new Date(b.CreatedAt || b.createdAt || b.Date || b.date) - new Date(a.CreatedAt || a.createdAt || a.Date || a.date));
                  if (submitted.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} className="sa-table-empty">
                          No submitted {stateEntryView === 'entry' ? 'Entry' : 'Exit'} inventory reports yet.
                        </td>
                      </tr>
                    );
                  }
                  return submitted.map((inv, idx) => {
                    const reportURL = inv.ReportURL || inv.reportURL || inv.ReportUrl;
                    return (
                      <tr key={inv.ID || inv.id || idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <span className="sa-status-pill" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                            {inv.Type || inv.type || 'Inventory'}
                          </span>
                        </td>
                        <td>{inv.Tenant || inv.tenant || '—'}</td>
                        <td>{inv.Property || inv.property || '—'}</td>
                        <td>{(inv.Date || inv.date || inv.CreatedAt || inv.createdAt) ? new Date(inv.Date || inv.date || inv.CreatedAt || inv.createdAt).toLocaleDateString() : '—'}</td>
                        <td>
                          <span className={`sa-status-pill ${(inv.Status || inv.status || 'completed').toLowerCase()}`}>
                            {inv.Status || inv.status || 'Completed'}
                          </span>
                        </td>
                        <td>
                          {reportURL ? (
                            <a href={`${API_CONFIG?.BASE_URL || ''}${reportURL}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                              View report
                            </a>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render History Section - Query history, Quote history, Work history, Inventory reports history
  const renderHistory = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>History</h3>
            <p>View query history, quote history, work history, and inventory reports history</p>
          </div>
        </div>

        <div className="sa-filters-section">
          <input
            type="date"
            className="sa-filter-select"
            value={historyDateFilter}
            onChange={(e) => setHistoryDateFilter(e.target.value)}
            placeholder="Filter by date"
          />
          <select 
            className="sa-filter-select"
            value={historyTypeFilter}
            onChange={(e) => setHistoryTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="query">Query History</option>
            <option value="quote">Quote History</option>
            <option value="work">Work History</option>
            <option value="inventory">Inventory Reports</option>
          </select>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Type</th>
                <th>Property</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Combine all history data
                const allHistory = [
                  ...historyData.queries.map(q => ({ ...q, type: 'Query' })),
                  ...historyData.quotes.map(q => ({ ...q, type: 'Quote' })),
                  ...historyData.works.map(w => ({ ...w, type: 'Work' })),
                  ...historyData.inventories.map(i => ({ ...i, type: 'Inventory' }))
                ].filter(item => {
                  if (historyDateFilter) {
                    const itemDate = new Date(item.Date || item.date || item.CreatedAt || item.createdAt);
                    const filterDate = new Date(historyDateFilter);
                    if (itemDate.toDateString() !== filterDate.toDateString()) return false;
                  }
                  if (historyTypeFilter) {
                    if (item.type.toLowerCase() !== historyTypeFilter.toLowerCase()) return false;
                  }
                  if (historyPropertyFilter) {
                    const property = item.Property || item.property || '';
                    if (!property.toLowerCase().includes(historyPropertyFilter.toLowerCase())) return false;
                  }
                  return true;
                }).sort((a, b) => {
                  const dateA = new Date(a.Date || a.date || a.CreatedAt || a.createdAt);
                  const dateB = new Date(b.Date || b.date || b.CreatedAt || b.createdAt);
                  return dateB - dateA;
                });

                if (allHistory.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} className="sa-table-empty">No history records found</td>
                    </tr>
                  );
                }

                return allHistory.map((item, index) => (
                  <tr key={`${item.type}-${item.ID || item.id || index}`}>
                    <td>{index + 1}</td>
                    <td>
                      <span className="sa-status-pill" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                        {item.type}
                      </span>
                    </td>
                    <td>{item.Property || item.property || 'N/A'}</td>
                    <td>{item.Issue || item.issue || item.Description || item.description || 'N/A'}</td>
                    <td>{item.Date || item.date || item.CreatedAt || item.createdAt ? new Date(item.Date || item.date || item.CreatedAt || item.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`sa-status-pill ${(item.Status || item.status || 'completed').toLowerCase()}`}>
                        {item.Status || item.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Reports Section
  const renderReports = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Reports</h3>
            <p>Generate and view various reports</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '20px' }} onClick={() => {
            // Generate monthly report of requests
            addNotification('Monthly report of requests feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Monthly Report of Requests</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Generate monthly summary of maintenance requests</p>
          </div>

          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '20px' }} onClick={() => {
            // Generate quotes report
            addNotification('Quotes report feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Report of the Quotes</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>View all quotes and their validation status</p>
          </div>

          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '20px' }} onClick={() => {
            // Generate work report
            addNotification('Work report feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Report of the Work Carried Out</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Summary of completed work orders</p>
          </div>

          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '20px' }} onClick={() => {
            // Generate emergency report
            addNotification('Emergency report feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Emergency Report</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Urgent and emergency maintenance requests</p>
          </div>

          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '20px' }} onClick={() => {
            // Generate property/building report
            addNotification('Property report feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Report by Property or Building</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Detailed report for specific property</p>
          </div>
        </div>
      </div>
    );
  };

  // Render Inventory Form - Comprehensive dynamic form
  const renderInventoryForm = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Inventory Form (Entry / Exit)</h3>
            <p>Create detailed inventory reports for property entry or exit</p>
          </div>
          <button 
            className="sa-primary-cta"
            onClick={() => {
              setInventoryFormData({
                type: 'Entry',
                propertyType: '',
                numberOfRooms: 1,
                numberOfBathrooms: 1,
                numberOfKitchens: 1,
                hasSwimmingPool: false,
                propertyAddress: '',
                tenantName: '',
                date: new Date().toISOString().split('T')[0],
                technicianName: '',
                formData: {}
              });
              setShowInventoryFormModal(true);
            }}
          >
            <Plus size={16} />
            New Inventory Form
          </button>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Type</th>
                <th>Property</th>
                <th>Tenant</th>
                <th>Property Type</th>
                <th>Date</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {inspections.filter(i => {
                const type = i.Type || i.type;
                return type === 'Move-in' || type === 'Move-out';
              }).length === 0 ? (
                <tr>
                  <td colSpan={8} className="sa-table-empty">
                    No inventory forms created yet. Click "New Inventory Form" to create one.
                  </td>
                </tr>
              ) : (
                inspections.filter(i => {
                  const type = i.Type || i.type;
                  return type === 'Move-in' || type === 'Move-out';
                }).map((inv, index) => (
                  <tr key={inv.ID || inv.id}>
                    <td>{index + 1}</td>
                    <td>
                      <span className={`sa-status-pill ${(inv.Type || inv.type || 'move-in').toLowerCase().replace(' ', '-')}`}>
                        {inv.Type || inv.type || 'Move-in'}
                      </span>
                    </td>
                    <td>{inv.Property || inv.property || 'N/A'}</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>{inv.Date || inv.date ? new Date(inv.Date || inv.date).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className="sa-status-pill completed">Completed</span>
                    </td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" title="View">👁️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Cost of Work: Level 1 = owners table, Level 2 = property containers (no images), Level 3 = works table
  const renderCostOfWork = () => {
    const handleSelectOwner = async (owner) => {
      setSelectedCostOwner(owner);
      setCostOfWorkView('properties');
      try {
        const data = await technicianService.getCostOfWorkOwnerProperties(owner.id || owner.ID);
        setCostOfWorkProperties(Array.isArray(data) ? data : []);
      } catch {
        setCostOfWorkProperties([]);
      }
    };
    const handleSelectProperty = async (property) => {
      setSelectedCostProperty(property);
      setCostOfWorkView('works');
      try {
        const data = await technicianService.getCostOfWorkPropertyWorks(property.id || property.ID);
        setCostOfWorkWorks(Array.isArray(data) ? data : []);
      } catch {
        setCostOfWorkWorks([]);
      }
    };
    const goBackToOwners = () => {
      setCostOfWorkView('owners');
      setSelectedCostOwner(null);
      setSelectedCostProperty(null);
      setCostOfWorkProperties([]);
      setCostOfWorkWorks([]);
    };
    const goBackToProperties = () => {
      setCostOfWorkView('properties');
      setSelectedCostProperty(null);
      setCostOfWorkWorks([]);
    };

    if (costOfWorkView === 'owners') {
      return (
        <div className="sa-section-card">
          <div className="sa-section-header">
            <div>
              <h3>Cost of Work</h3>
              <p>View owners, their properties, and work costs</p>
            </div>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Name <span style={{ opacity: 0.6, fontSize: '0.75em' }}>▼</span></th>
                  <th>Email <span style={{ opacity: 0.6, fontSize: '0.75em' }}>▼</span></th>
                  <th>Number of building <span style={{ opacity: 0.6, fontSize: '0.75em' }}>▼</span></th>
                  <th>Number of property <span style={{ opacity: 0.6, fontSize: '0.75em' }}>▼</span></th>
                  <th>Number of work <span style={{ opacity: 0.6, fontSize: '0.75em' }}>▼</span></th>
                  <th>Total Cost <span style={{ opacity: 0.6, fontSize: '0.75em' }}>▼</span></th>
                </tr>
              </thead>
              <tbody>
                {costOfWorkOwners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="sa-table-empty">No owners found</td>
                  </tr>
                ) : (
                  costOfWorkOwners.map((owner) => (
                    <tr
                      key={owner.id || owner.ID}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSelectOwner(owner)}
                    >
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                          {owner.name || owner.Name || 'N/A'}
                        </span>
                      </td>
                      <td>{owner.email || owner.Email || '—'}</td>
                      <td>{owner.numberOfBuildings ?? owner.NumberOfBuildings ?? 0}</td>
                      <td>{owner.numberOfProperty ?? owner.NumberOfProperty ?? 0}</td>
                      <td>{owner.numberOfWork ?? owner.NumberOfWork ?? 0}</td>
                      <td>{(owner.totalCost ?? owner.TotalCost ?? 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (costOfWorkView === 'properties') {
      const ownerName = selectedCostOwner?.name || selectedCostOwner?.Name || 'Owner';
      return (
        <div className="sa-section-card">
          <div className="sa-section-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button type="button" className="action-button secondary" onClick={goBackToOwners} style={{ marginRight: '8px' }}>
                ← Back
              </button>
              <span style={{ color: '#6b7280' }}>Cost of Work → {ownerName}</span>
            </div>
            <div>
              <h3>Properties</h3>
              <p>Select a property to view works and costs</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {costOfWorkProperties.length === 0 ? (
              <div className="sa-table-empty" style={{ gridColumn: '1 / -1', padding: '24px' }}>No properties found for this owner</div>
            ) : (
              costOfWorkProperties.map((prop) => (
                <div
                  key={prop.id || prop.ID}
                  onClick={() => handleSelectProperty(prop)}
                  style={{
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: '#fff',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '8px', color: '#111827' }}>
                    {prop.name || prop.Name || 'Property'}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '4px' }}>
                    {prop.address || prop.Address || prop.description || prop.Description || '—'}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#374151', marginTop: '8px' }}>
                    Number of work: <strong>{prop.numberOfWork ?? prop.NumberOfWork ?? 0}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    // costOfWorkView === 'works'
    const propertyName = selectedCostProperty?.name || selectedCostProperty?.Name || 'Property';
    const totalWork = costOfWorkWorks.length;
    const priorityPillClass = (p) => {
      const v = (p || '').toLowerCase();
      if (v === 'urgent') return 'urgent';
      if (v === 'moyen' || v === 'medium') return 'in-progress';
      if (v === 'faible' || v === 'low') return 'pending';
      return 'pending';
    };
    return (
      <div className="sa-section-card">
        <div className="sa-section-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="action-button secondary" onClick={goBackToProperties}>
              ← Back
            </button>
            <span style={{ color: '#6b7280' }}>
              Cost of Work → {selectedCostOwner?.name || selectedCostOwner?.Name || 'Owner'} → {propertyName}
            </span>
          </div>
          <div>
            <h3>{propertyName}</h3>
            <p>Total of work: {totalWork}</p>
          </div>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }} />
                <th>Date</th>
                <th>Apartment</th>
                <th>Price</th>
                <th>Technician</th>
                <th>Kind of work</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {costOfWorkWorks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="sa-table-empty">No works found for this property</td>
                </tr>
              ) : (
                costOfWorkWorks.map((work) => (
                  <tr key={work.id || work.ID}>
                    <td><input type="checkbox" readOnly /></td>
                    <td>{work.date ? new Date(work.date).toLocaleDateString() : '—'}</td>
                    <td>{work.apartment || work.Apartment || '—'}</td>
                    <td>{(work.price ?? work.Price ?? 0).toLocaleString()}F</td>
                    <td>{work.technician || work.Technician || '—'}</td>
                    <td>{work.kindOfWork || work.KindOfWork || '—'}</td>
                    <td>
                      <span className={`sa-status-pill ${priorityPillClass(work.priority || work.Priority)}`}>
                        {work.priority || work.Priority || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="sa-status-pill completed">
                        {work.status || work.Status || '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'maintenance':
        return renderMaintenance();
      case 'quotes':
        return renderQuotes();
      case 'works':
        return renderWorks();
      case 'cost-of-work':
        return renderCostOfWork();
      case 'state-entry':
        return renderStateEntry();
      case 'worker-contacts':
        return renderTechnicianContacts(); // Reuse existing function
      case 'history':
        return renderHistory();
      case 'reports':
        return renderReports();
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

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Operations', logo: 'SAAF', logoImage: `/download.jpeg` }}
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

      {/* Add Inspection Modal */}
      {showInspectionModal && (
        <div className="modal-overlay" onClick={() => setShowInspectionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Inspection</h3>
              <button 
                className="modal-close"
                onClick={() => setShowInspectionModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
            <form onSubmit={handleInspectionSubmit} className="modal-form">
                <div className="form-row">
              <div className="form-group">
                    <label htmlFor="inspection-property">Property *</label>
                <select
                      id="inspection-property"
                  value={inspectionForm.property}
                  onChange={(e) => setInspectionForm({...inspectionForm, property: e.target.value})}
                  required
                >
                  <option value="">Select property</option>
                  {companyProperties.map(property => {
                    const id = property.ID || property.id;
                    const label = property.Address || property.address || property.name || property.Name || `Property ${id}`;
                    return (
                      <option key={id} value={label}>
                        {label}
                      </option>
                    );
                  })}
                  {companyProperties.length === 0 && (
                    <option value="" disabled>No properties found</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                    <label htmlFor="inspection-type">Inspection Type *</label>
                <select
                      id="inspection-type"
                  value={inspectionForm.type}
                  onChange={(e) => setInspectionForm({...inspectionForm, type: e.target.value})}
                  required
                >
                  <option value="routine">Routine</option>
                  <option value="move-in">Move-in</option>
                  <option value="move-out">Move-out</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
                </div>
                <div className="form-row">
              <div className="form-group">
                    <label htmlFor="inspection-inspector">Inspector *</label>
                <input
                  type="text"
                      id="inspection-inspector"
                  value={inspectionForm.inspector}
                  onChange={(e) => setInspectionForm({...inspectionForm, inspector: e.target.value})}
                  placeholder="Enter inspector name"
                  required
                />
                  </div>
              </div>
              <div className="form-group">
                  <label htmlFor="inspection-notes">Notes</label>
                <textarea
                    id="inspection-notes"
                  value={inspectionForm.notes}
                  onChange={(e) => setInspectionForm({...inspectionForm, notes: e.target.value})}
                  placeholder="Enter inspection notes"
                  rows="3"
                />
              </div>
                <div className="modal-footer">
                <button 
                  type="button" 
                    className="action-button secondary"
                  onClick={() => setShowInspectionModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                    className="action-button primary"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Inspection'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Management Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
          setTaskContext('task');
          setTaskForm({ status: 'Pending', estimatedHours: 0, estimatedCost: 0, photos: [], existingPhotoURLs: [] });
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedTask ? `Task Details - ${selectedTask.Issue || selectedTask.issue || 'Maintenance Task'}` : 'Create New Task'}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowTaskModal(false);
                  setSelectedTask(null);
                  setTaskContext('task');
                  setTaskForm({ status: 'Pending', estimatedHours: 0, estimatedCost: 0, photos: [], existingPhotoURLs: [] });
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
            <form onSubmit={handleTaskUpdate} className="modal-form">
                <div className="form-row">
              <div className="form-group">
                    <label htmlFor="task-property">Property {!selectedTask && '*'}</label>
                <select
                      id="task-property"
                      value={selectedTask ? (selectedTask.Property || selectedTask.property || '') : (taskForm.property || '')}
                      onChange={(e) => {
                        if (selectedTask) return;
                        setTaskForm({...taskForm, property: e.target.value});
                      }}
                      disabled={!!selectedTask}
                      className={selectedTask ? "disabled-input" : ""}
                      required={!selectedTask}
                >
                  <option value="">Select property</option>
                  {companyProperties.map(property => {
                    const id = property.ID || property.id;
                    const label = property.Address || property.address || property.name || property.Name || `Property ${id}`;
                    return (
                      <option key={id} value={label}>
                        {label}
                      </option>
                    );
                  })}
                  {selectedTask && (selectedTask.Property || selectedTask.property) && !companyProperties.find(p => (p.Address || p.address) === (selectedTask.Property || selectedTask.property)) && (
                    <option value={selectedTask.Property || selectedTask.property}>
                      {selectedTask.Property || selectedTask.property}
                    </option>
                  )}
                  {companyProperties.length === 0 && (
                    <option value="" disabled>No properties found</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                    <label htmlFor="task-priority">Priority {!selectedTask && '*'}</label>
                    {selectedTask ? (
                      <input
                        type="text"
                        id="task-priority"
                        value={selectedTask.Priority || selectedTask.priority || 'Medium'}
                  disabled
                  className="disabled-input"
                      />
                    ) : (
                      <select
                        id="task-priority"
                        value={taskForm.priority || 'normal'}
                        onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                        required
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                      </select>
                    )}
                  </div>
              </div>
              <div className="form-group">
                  <label htmlFor="task-issue">Issue {!selectedTask && '*'}</label>
                  <textarea
                    id="task-issue"
                    value={selectedTask ? (selectedTask.Issue || selectedTask.issue || 'Maintenance Task') : (taskForm.issue || '')}
                    onChange={(e) => {
                      if (selectedTask) return; // Disabled for existing tasks
                      setTaskForm({...taskForm, issue: e.target.value});
                    }}
                    disabled={!!selectedTask}
                    className={selectedTask ? "disabled-input" : ""}
                    rows="2"
                    required={!selectedTask}
                    placeholder="Describe the maintenance issue"
                />
              </div>
                <div className="form-row">
              <div className="form-group">
                    <label htmlFor="task-status">Status *</label>
                <select
                      id="task-status"
                      value={taskForm.status || 'Pending'}
                  onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </div>
                  {taskContext === 'maintenance' ? (
              <div className="form-group">
                      <label htmlFor="task-assigned">Assigned To (Worker)</label>
                      <select
                        id="task-assigned"
                        value={taskForm.assigned || ''}
                        onChange={(e) => setTaskForm({...taskForm, assigned: e.target.value})}
                      >
                        <option value="">Select worker...</option>
                        {technicianContacts.map((contact) => {
                          const name = contact.Name || contact.name || 'N/A';
                          const category = contact.Category || contact.category || '';
                          return (
                            <option key={contact.ID || contact.id} value={name}>
                              {name}{category ? ` (${category})` : ''}
                            </option>
                          );
                        })}
                        {taskForm.assigned && !technicianContacts.some(c => (c.Name || c.name) === taskForm.assigned) && (
                          <option value={taskForm.assigned}>{taskForm.assigned} (current)</option>
                        )}
                        {technicianContacts.length === 0 && !taskForm.assigned && (
                          <option value="" disabled>No workers in Contact of Workers</option>
                        )}
                      </select>
                    </div>
                  ) : !selectedTask ? (
              <div className="form-group">
                      <label htmlFor="task-assigned">Assigned To</label>
                      <input
                        type="text"
                        id="task-assigned"
                        value={taskForm.assigned || ''}
                        onChange={(e) => setTaskForm({...taskForm, assigned: e.target.value})}
                        placeholder="Enter technician name"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="task-cost">Estimated Cost ($)</label>
                <input
                  type="number"
                      id="task-cost"
                      value={taskForm.estimatedCost === '' || taskForm.estimatedCost === 0 ? '' : taskForm.estimatedCost}
                  onChange={(e) => setTaskForm({...taskForm, estimatedCost: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0)})}
                  min="0"
                  step="0.01"
                      placeholder="0.00"
                />
              </div>
            </div>
            {selectedTask && taskContext === 'maintenance' && (taskForm.existingPhotoURLs?.length > 0) && (
              <div className="form-group">
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Maintenance photos</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                  {(taskForm.existingPhotoURLs || []).map((url, index) => {
                    const src = typeof url === 'string' ? url : (url?.url || url?.src || '');
                    if (!src) return null;
                    return (
                      <div key={index} style={{ borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', backgroundColor: '#f3f4f6' }}>
                        <img
                          src={src}
                          alt={`Photo ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => window.open(src, '_blank')}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedTask && taskContext === 'maintenance' && (selectedTask.QuotationURL || selectedTask.quotationURL) && (
              <div className="form-group">
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Quotation</label>
                <a href={selectedTask.QuotationURL || selectedTask.quotationURL} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>View / Download Quotation</a>
              </div>
            )}
            {selectedTask && taskContext === 'maintenance' && (selectedTask.InvoiceURL || selectedTask.invoiceURL) && (
              <div className="form-group">
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Invoice</label>
                <a href={selectedTask.InvoiceURL || selectedTask.invoiceURL} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>View / Download Invoice</a>
              </div>
            )}
            {!selectedTask && (
              <div className="form-group">
                <label htmlFor="task-photos">Upload one or more photos (optional)</label>
                <input
                  type="file"
                  id="task-photos"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    setTaskForm(prev => ({
                      ...prev,
                      photos: [...(prev.photos || []), ...newFiles]
                    }));
                    e.target.value = '';
                  }}
                />
                {taskForm.photos && taskForm.photos.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '6px' }}>
                      {taskForm.photos.length} photo{taskForm.photos.length !== 1 ? 's' : ''} selected
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: '#374151' }}>
                      {taskForm.photos.map((file, idx) => (
                        <li key={`${file.name}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ flex: 1 }}>{file.name}</span>
                          <button
                            type="button"
                            className="action-button secondary"
                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                            onClick={() => {
                              setTaskForm(prev => ({
                                ...prev,
                                photos: prev.photos.filter((_, i) => i !== idx)
                              }));
                            }}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {!selectedTask && taskContext === 'maintenance' && (
              <>
              <div className="form-group">
                <label htmlFor="task-quotation">Upload Quotation (optional)</label>
                <input
                  type="file"
                  id="task-quotation"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setTaskForm(prev => ({ ...prev, quotation: f || null }));
                    e.target.value = '';
                  }}
                />
                {taskForm.quotation && (
                  <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{taskForm.quotation.name}</span>
                    <button type="button" className="action-button secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setTaskForm(prev => ({ ...prev, quotation: null }))}>Remove</button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="task-invoice">Upload Invoice (optional)</label>
                <input
                  type="file"
                  id="task-invoice"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setTaskForm(prev => ({ ...prev, invoice: f || null }));
                    e.target.value = '';
                  }}
                />
                {taskForm.invoice && (
                  <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{taskForm.invoice.name}</span>
                    <button type="button" className="action-button secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setTaskForm(prev => ({ ...prev, invoice: null }))}>Remove</button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!taskForm.requireDirectorApproval}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, requireDirectorApproval: e.target.checked }))}
                  />
                  <span>Require director approval (for security – task will be sent to director for approval before processing)</span>
                </label>
              </div>
              </>
            )}
                <div className="modal-footer">
                <button 
                  type="button" 
                    className="action-button secondary"
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedTask(null);
                    setTaskContext('task');
                    setTaskForm({ status: 'Pending', estimatedHours: 0, estimatedCost: 0, photos: [], existingPhotoURLs: [] });
                  }}
                >
                    Cancel
                </button>
                <button 
                  type="submit" 
                    className="action-button primary"
                  disabled={loading}
                >
                    {loading ? (selectedTask ? 'Updating...' : 'Creating...') : (selectedTask ? 'Update Task' : 'Create Task')}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoUploadModal && selectedInspectionForPhoto && (
        <div className="modal-overlay" onClick={() => {
          setShowPhotoUploadModal(false);
          setSelectedInspectionForPhoto(null);
          setPhotoFile(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Inspection Photo</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowPhotoUploadModal(false);
                  setSelectedInspectionForPhoto(null);
                  setPhotoFile(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handlePhotoUpload} className="modal-form">
                <div className="form-group">
                  <label htmlFor="photo-inspection">Inspection</label>
                  <input
                    type="text"
                    id="photo-inspection"
                    value={`${selectedInspectionForPhoto.property || selectedInspectionForPhoto.Property || ''} - ${selectedInspectionForPhoto.type || selectedInspectionForPhoto.Type || ''}`}
                    disabled
                    className="disabled-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="photo-file">Photo *</label>
                  <input
                    type="file"
                    id="photo-file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                    required
                  />
                  {photoFile && (
                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#6b7280' }}>
                      Selected: {photoFile.name}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary"
                    onClick={() => {
                      setShowPhotoUploadModal(false);
                      setSelectedInspectionForPhoto(null);
                      setPhotoFile(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="action-button primary"
                    disabled={loading || !photoFile}
                  >
                    {loading ? 'Uploading...' : 'Upload Photo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Request View Modal */}
      {showMaintenanceViewModal && selectedMaintenanceRequest && (
        <div className="modal-overlay" onClick={() => setShowMaintenanceViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Maintenance Request Details</h3>
              <button className="modal-close" onClick={() => setShowMaintenanceViewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Title/Issue</label>
                  <p style={{ margin: 0, color: '#1f2937' }}>
                    {selectedMaintenanceRequest.Title || selectedMaintenanceRequest.title || selectedMaintenanceRequest.Issue || selectedMaintenanceRequest.issue || 'N/A'}
                  </p>
                </div>

                <div>
                  <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Description</label>
                  <p style={{ margin: 0, color: '#1f2937', whiteSpace: 'pre-wrap' }}>
                    {selectedMaintenanceRequest.Description || selectedMaintenanceRequest.description || 'No description provided'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Priority</label>
                    <span className={`sa-status-pill ${(selectedMaintenanceRequest.Priority || selectedMaintenanceRequest.priority || 'medium').toLowerCase()}`}>
                      {selectedMaintenanceRequest.Priority || selectedMaintenanceRequest.priority || 'Medium'}
                    </span>
                  </div>

                  <div>
                    <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Status</label>
                    <span className={`sa-status-pill ${(selectedMaintenanceRequest.Status || selectedMaintenanceRequest.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                      {selectedMaintenanceRequest.Status || selectedMaintenanceRequest.status || 'Pending'}
                    </span>
                  </div>

                  <div>
                    <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Date</label>
                    <p style={{ margin: 0, color: '#1f2937' }}>
                      {selectedMaintenanceRequest.Date || selectedMaintenanceRequest.date || selectedMaintenanceRequest.CreatedAt || selectedMaintenanceRequest.createdAt
                        ? new Date(selectedMaintenanceRequest.Date || selectedMaintenanceRequest.date || selectedMaintenanceRequest.CreatedAt || selectedMaintenanceRequest.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {(selectedMaintenanceRequest.Property || selectedMaintenanceRequest.property) && (
                  <div>
                    <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Property</label>
                    <p style={{ margin: 0, color: '#1f2937' }}>
                      {selectedMaintenanceRequest.Property || selectedMaintenanceRequest.property}
                    </p>
                  </div>
                )}

                {(selectedMaintenanceRequest.Tenant || selectedMaintenanceRequest.tenant) && (
                  <div>
                    <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Tenant</label>
                    <p style={{ margin: 0, color: '#1f2937' }}>
                      {selectedMaintenanceRequest.Tenant || selectedMaintenanceRequest.tenant}
                    </p>
                  </div>
                )}

                {/* Photos Section */}
                {(() => {
                  let photos = [];
                  const raw = selectedMaintenanceRequest.Photos ?? selectedMaintenanceRequest.photos ?? selectedMaintenanceRequest.PhotoURLs ?? selectedMaintenanceRequest.photoURLs;
                  if (Array.isArray(raw)) {
                    photos = raw;
                  } else if (typeof raw === 'string' && raw.trim()) {
                    try {
                      photos = JSON.parse(raw) || [];
                    } catch (_) {
                      photos = [];
                    }
                  }
                  photos = Array.isArray(photos) ? photos : [];

                  return (
                    <div>
                      <label style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'block' }}>
                        Photos {photos.length > 0 ? `(${photos.length})` : ''}
                      </label>
                      {photos.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                          {photos.map((photoUrl, index) => {
                            const url = typeof photoUrl === 'string' ? photoUrl : (photoUrl?.url || photoUrl?.src || '');
                            if (!url) return null;
                            return (
                              <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', backgroundColor: '#f3f4f6' }}>
                                <img
                                  src={url}
                                  alt={`Maintenance ${index + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => window.open(url, '_blank')}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const parent = e.target.parentElement;
                                    if (parent && !parent.querySelector('.sa-photo-fallback')) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'sa-photo-fallback';
                                      fallback.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af; font-size: 0.85rem;';
                                      fallback.textContent = 'Image not available';
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>No photos attached to this maintenance request</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="action-button secondary" 
                onClick={() => setShowMaintenanceViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showWorkStartModal && (
        <div className="modal-overlay" onClick={() => setShowWorkStartModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Work Started</h3>
              <button className="modal-close" onClick={() => setShowWorkStartModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleStartWorkSubmit} className="modal-form">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={workSchedule.startDate}
                    onChange={(e) => setWorkSchedule(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={workSchedule.endDate}
                    onChange={(e) => setWorkSchedule(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowWorkStartModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Set Work Started'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Technician Contact Modal */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedContact ? 'Edit Technician Contact' : 'Add Technician Contact'}</h3>
              <button className="modal-close" onClick={() => setShowContactModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleContactSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="contactName">Name *</label>
                    <input
                      type="text"
                      id="contactName"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., John's Plumbing"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactCategory">Category *</label>
                    <select
                      id="contactCategory"
                      value={contactForm.category}
                      onChange={(e) => setContactForm(prev => ({ ...prev, category: e.target.value }))}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="plumber">Plumber</option>
                      <option value="electrician">Electrician</option>
                      <option value="carpenter">Carpenter</option>
                      <option value="painter">Painter</option>
                      <option value="hvac">HVAC Technician</option>
                      <option value="locksmith">Locksmith</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="contactPhone">Phone Number *</label>
                    <input
                      type="tel"
                      id="contactPhone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+225 07 12 34 56 78"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactEmail">Email</label>
                    <input
                      type="email"
                      id="contactEmail"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>

                {contactForm.category === 'other' && (
                  <div className="form-group">
                    <label htmlFor="contactCustomCategory">Custom Worker Type *</label>
                    <input
                      type="text"
                      id="contactCustomCategory"
                      value={contactForm.customCategory}
                      onChange={(e) => setContactForm(prev => ({ ...prev, customCategory: e.target.value }))}
                      placeholder="e.g., Roofer, Tiler, Welder"
                      required
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="contactPhoto">Worker Photo</label>
                    <input
                      type="file"
                      id="contactPhoto"
                      accept="image/*"
                      onChange={(e) => setContactForm(prev => ({ ...prev, photo: e.target.files?.[0] || null }))}
                    />
                    {selectedContact && (selectedContact.PhotoURL || selectedContact.photoUrl) && (
                      <div style={{ marginTop: '8px' }}>
                        <img
                          src={selectedContact.PhotoURL || selectedContact.photoUrl}
                          alt="Worker"
                          style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                        <div>
                          <a
                            href={selectedContact.PhotoURL || selectedContact.photoUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="sa-link"
                          >
                            Download photo
                          </a>
                        </div>
                      </div>
                    )}
                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      This photo will be visible to tenants.
                    </small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="contactIdCard">Identity Card (Private)</label>
                    <input
                      type="file"
                      id="contactIdCard"
                      accept="image/*"
                      onChange={(e) => setContactForm(prev => ({ ...prev, idCard: e.target.files?.[0] || null }))}
                    />
                    {selectedContact && (selectedContact.IDCardURL || selectedContact.idCardUrl) && (
                      <div style={{ marginTop: '8px' }}>
                        <img
                          src={selectedContact.IDCardURL || selectedContact.idCardUrl}
                          alt="ID Card"
                          style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                        <div>
                          <a
                            href={selectedContact.IDCardURL || selectedContact.idCardUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="sa-link"
                          >
                            Download ID card
                          </a>
                        </div>
                      </div>
                    )}
                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      This file is not shown to tenants.
                    </small>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="contactAddress">Address</label>
                  <input
                    type="text"
                    id="contactAddress"
                    value={contactForm.address}
                    onChange={(e) => setContactForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main Street, City"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactDescription">Description/Notes</label>
                  <textarea
                    id="contactDescription"
                    value={contactForm.description}
                    onChange={(e) => setContactForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional information about this technician..."
                    rows="3"
                  />
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary" 
                    onClick={() => {
                      setShowContactModal(false);
                      setSelectedContact(null);
                      setContactForm({ name: '', category: '', customCategory: '', phone: '', email: '', address: '', description: '' });
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="action-button primary" 
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (selectedContact ? 'Update Contact' : 'Add Contact')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Inventory Form Modal */}
      {showInventoryFormModal && (
        <div className="modal-overlay" onClick={() => setShowInventoryFormModal(false)}>
          <div className="modal-content" style={{ maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Inventory Form - {inventoryFormData.type === 'Entry' ? 'Entry' : 'Exit'}</h3>
              <button className="modal-close" onClick={() => setShowInventoryFormModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);

                  // Validate mandatory checklist fields (photos are optional)
                  const rooms = inventoryFormData.formData?.rooms || {};
                  const roomNames = Object.keys(rooms);
                  if (roomNames.length === 0) {
                    addNotification('Please select property type and rooms, then fill the checklist.', 'error');
                    return;
                  }

                  for (const roomName of roomNames) {
                    const items = rooms[roomName] || {};
                    for (const item of INSPECTION_ITEMS) {
                      const it = items[item.key] || {};
                      if (!it.condition) {
                        addNotification(`Missing condition: ${roomName} → ${item.label}`, 'error');
                        return;
                      }
                    }
                  }

                  const scheduledAt =
                    inventoryFormData.date && inventoryFormData.time
                      ? `${inventoryFormData.date}T${inventoryFormData.time}`
                      : inventoryFormData.date;

                  const inspectionType = inventoryFormData.type === 'Entry' ? 'Move-in' : 'Move-out';

                  // Build report data without File objects
                  const reportData = {
                    appointment: {
                      property: inventoryFormData.propertyAddress,
                      tenant: inventoryFormData.tenantName,
                      scheduledAt,
                      inspectionType,
                    },
                    property: {
                      type: inventoryFormData.propertyType,
                      numberOfRooms: inventoryFormData.numberOfRooms,
                      numberOfBathrooms: inventoryFormData.numberOfBathrooms,
                      numberOfKitchens: inventoryFormData.numberOfKitchens,
                      hasSwimmingPool: inventoryFormData.hasSwimmingPool,
                      address: inventoryFormData.propertyAddress,
                    },
                    rooms: {},
                    meters: inventoryFormData.formData?.meters || {},
                    observations: inventoryFormData.formData?.observations || {},
                    exit: inventoryFormData.type === 'Exit' ? (inventoryFormData.formData?.exit || {}) : undefined,
                  };

                  // Initialize empty photoUrls arrays for each item
                  for (const roomName of roomNames) {
                    reportData.rooms[roomName] = {};
                    for (const item of INSPECTION_ITEMS) {
                      const it = rooms[roomName]?.[item.key] || {};
                      reportData.rooms[roomName][item.key] = {
                        label: item.label,
                        condition: it.condition,
                        comment: it.comment || '',
                        photoUrls: [],
                      };
                    }
                  }

                  // Create inspection first
                  const created = await technicianService.createInspection({
                    property: inventoryFormData.propertyAddress,
                    type: inspectionType,
                    inspector: inventoryFormData.technicianName,
                    tenant: inventoryFormData.tenantName,
                    scheduledAt,
                    status: 'Completed',
                    notes: inventoryFormData.formData?.observations?.technician || '',
                    reportData,
                    photos: [],
                  });

                  const inspectionId = created?.id || created?.ID;
                  if (!inspectionId) {
                    addNotification('Failed to create inspection record (missing ID).', 'error');
                    return;
                  }

                  // Upload photos item-by-item, keep mapping into reportData
                  for (const roomName of roomNames) {
                    for (const item of INSPECTION_ITEMS) {
                      const it = rooms[roomName]?.[item.key] || {};
                      const files = it.photos || [];
                      for (const file of files) {
                        const uploadRes = await technicianService.uploadInspectionPhoto(inspectionId, file);
                        const photoUrl = uploadRes?.photoUrl || uploadRes?.photoURL || uploadRes?.PhotoUrl;
                        if (photoUrl) {
                          reportData.rooms[roomName][item.key].photoUrls.push(photoUrl);
                        }
                      }
                    }
                  }

                  // Update inspection with final reportData (with photo URLs)
                  await technicianService.updateInspection(inspectionId, {
                    tenant: inventoryFormData.tenantName,
                    scheduledAt,
                    status: 'Completed',
                    reportData,
                  });

                  // Finalize to generate printable report file
                  const finalized = await technicianService.finalizeInspection(inspectionId);
                  const reportUrl = finalized?.reportUrl || finalized?.reportURL || finalized?.ReportUrl;

                  addNotification('Inventory report saved successfully.', 'success');
                  // Don't auto-open report - user stays on dashboard; report is saved and visible in History
                  if (reportUrl) {
                    addNotification('Report saved. View it in History or via the report link.', 'info');
                  }

                  setShowInventoryFormModal(false);
                  loadData(); // Refresh State of Entry/Exit list and tenant dashboard will show it for the tenant
                  loadSubmittedInventories(); // Refresh submitted inventories list below
                } catch (error) {
                  console.error('Error submitting inventory form:', error);
                  addNotification(error.message || 'Failed to submit inventory form', 'error');
                } finally {
                  setLoading(false);
                }
              }} className="modal-form">
                
                {/* A. General Information */}
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>A. General Information</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Type of State of Affairs *</label>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name="inventoryType"
                            value="Entry"
                            checked={inventoryFormData.type === 'Entry'}
                            onChange={(e) => setInventoryFormData({ ...inventoryFormData, type: e.target.value })}
                            required
                          />
                          Entry
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name="inventoryType"
                            value="Exit"
                            checked={inventoryFormData.type === 'Exit'}
                            onChange={(e) => setInventoryFormData({ ...inventoryFormData, type: e.target.value })}
                            required
                          />
                          Exit
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Type of Property *</label>
                      <select
                        value={inventoryFormData.propertyType}
                        onChange={(e) => setInventoryFormData({ ...inventoryFormData, propertyType: e.target.value, numberOfRooms: e.target.value === 'Studio' ? 1 : inventoryFormData.numberOfRooms })}
                        required
                      >
                        <option value="">Select Property Type</option>
                        <option value="Studio">Studio</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Duplex">Duplex</option>
                        <option value="Villa">Villa</option>
                      </select>
                    </div>
                    {inventoryFormData.propertyType && inventoryFormData.propertyType !== 'Studio' && (
                      <div className="form-group">
                        <label>Number of Bedrooms *</label>
                        <input
                          type="number"
                          min="1"
                          value={inventoryFormData.numberOfRooms}
                          onChange={(e) => setInventoryFormData({ ...inventoryFormData, numberOfRooms: parseInt(e.target.value) || 1 })}
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Number of Bathrooms *</label>
                      <input
                        type="number"
                        min="0"
                        value={inventoryFormData.numberOfBathrooms}
                        onChange={(e) => setInventoryFormData({ ...inventoryFormData, numberOfBathrooms: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Number of Kitchens *</label>
                      <input
                        type="number"
                        min="0"
                        value={inventoryFormData.numberOfKitchens}
                        onChange={(e) => setInventoryFormData({ ...inventoryFormData, numberOfKitchens: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Swimming Pool</label>
                      <select
                        value={inventoryFormData.hasSwimmingPool ? 'yes' : 'no'}
                        onChange={(e) => setInventoryFormData({ ...inventoryFormData, hasSwimmingPool: e.target.value === 'yes' })}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Address of the Property *</label>
                      <select
                        value={inventoryFormData.propertyAddress}
                        disabled={!inventoryFormData.tenantName}
                        onChange={(e) =>
                          setInventoryFormData(prev => {
                            const selectedAddress = e.target.value;
                            const selectedProperty = (companyProperties || []).find(
                              p => (p.Address || p.address) === selectedAddress
                            );
                            const bedrooms = selectedProperty?.Bedrooms || selectedProperty?.bedrooms;
                            const bathrooms = selectedProperty?.Bathrooms || selectedProperty?.bathrooms;
                            const propTypeRaw =
                              selectedProperty?.Type ||
                              selectedProperty?.type ||
                              selectedProperty?.BuildingType ||
                              selectedProperty?.buildingType ||
                              selectedProperty?.PropertyType ||
                              selectedProperty?.propertyType ||
                              '';
                            const typeLower = String(propTypeRaw).toLowerCase();
                            const inferredType = typeLower.includes('studio')
                              ? 'Studio'
                              : typeLower.includes('duplex')
                                ? 'Duplex'
                                : typeLower.includes('villa')
                                  ? 'Villa'
                                  : typeLower.includes('apartment')
                                    ? 'Apartment'
                                    : '';
                            const matchingTenant = (currentInventoryTenants || []).find(t => {
                              const property = t.Property || t.property || '';
                              return property === selectedAddress;
                            });
                            const tenantName = matchingTenant ? (matchingTenant.Name || matchingTenant.name || '') : '';
                            return {
                              ...prev,
                              propertyAddress: selectedAddress,
                              numberOfRooms: bedrooms ? Number(bedrooms) : prev.numberOfRooms,
                              numberOfBathrooms: bathrooms !== undefined ? Number(bathrooms) : prev.numberOfBathrooms,
                              propertyType: inferredType || prev.propertyType || (bedrooms ? 'Apartment' : prev.propertyType),
                              tenantName: tenantName || prev.tenantName,
                            };
                          })
                        }
                        required
                      >
                        <option value="">Select Property</option>
                        {inventoryPropertyOptions.map(address => (
                          <option key={address} value={address}>
                            {address}
                          </option>
                        ))}
                        {inventoryPropertyOptions.length === 0 && (
                          <option value="" disabled>No properties available</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group" style={{ position: 'relative' }}>
                      <label>Tenant Name *</label>
                      <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#6b7280' }}>
                        Use the tenant&apos;s name as in their account so they can see this report in their dashboard (State of Entry/Exit).
                      </p>
                      <select
                        value={inventoryFormData.tenantName}
                        onChange={(e) => {
                          const selectedName = e.target.value;
                          const selectedTenant = (tenantOptions || []).find(t => {
                            const name = t.Name || t.name || t.Email || t.email || '';
                            return name === selectedName;
                          });
                          const selectedPropertyAddress =
                            selectedTenant?.Property ||
                            selectedTenant?.property ||
                            selectedTenant?.Address ||
                            selectedTenant?.address ||
                            '';
                          const selectedProperty = (companyProperties || []).find(
                            p => (p.Address || p.address) === selectedPropertyAddress
                          );
                          const bedrooms = selectedProperty?.Bedrooms || selectedProperty?.bedrooms;
                          const bathrooms = selectedProperty?.Bathrooms || selectedProperty?.bathrooms;
                          const propTypeRaw =
                            selectedProperty?.Type ||
                            selectedProperty?.type ||
                            selectedProperty?.BuildingType ||
                            selectedProperty?.buildingType ||
                            selectedProperty?.PropertyType ||
                            selectedProperty?.propertyType ||
                            '';
                          const typeLower = String(propTypeRaw).toLowerCase();
                          const inferredType = typeLower.includes('studio')
                            ? 'Studio'
                            : typeLower.includes('duplex')
                              ? 'Duplex'
                              : typeLower.includes('villa')
                                ? 'Villa'
                                : typeLower.includes('apartment')
                                  ? 'Apartment'
                                  : '';
                          setInventoryFormData(prev => ({
                            ...prev,
                            tenantName: selectedName,
                            propertyAddress: selectedPropertyAddress || prev.propertyAddress,
                            numberOfRooms: bedrooms ? Number(bedrooms) : prev.numberOfRooms,
                            numberOfBathrooms: bathrooms !== undefined ? Number(bathrooms) : prev.numberOfBathrooms,
                            propertyType: inferredType || prev.propertyType || (bedrooms ? 'Apartment' : prev.propertyType),
                          }));
                        }}
                        required
                      >
                        <option value="">Select tenant</option>
                        {(tenantOptions || []).map((t, idx) => {
                          const name = t.Name || t.name || t.Email || t.email || '';
                          const property = t.Property || t.property || t.Address || t.address || '';
                          return (
                            <option key={`${name}-${idx}`} value={name}>
                              {name} {property ? `- ${property}` : ''}
                            </option>
                          );
                        })}
                        {(!tenantOptions || tenantOptions.length === 0) && (
                          <option value="" disabled>No tenants available</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date *</label>
                      <input
                        type="date"
                        value={inventoryFormData.date}
                        onChange={(e) => setInventoryFormData({ ...inventoryFormData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Time *</label>
                      <input
                        type="time"
                        value={inventoryFormData.time || ''}
                        onChange={(e) => setInventoryFormData({ ...inventoryFormData, time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Name of the Technical Manager *</label>
                      <input
                        type="text"
                        value={inventoryFormData.technicianName}
                        onChange={(e) => setInventoryFormData({ ...inventoryFormData, technicianName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Sections Based on Property Type */}
                {inventoryFormData.propertyType && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>
                      B. STATE OF THE PREMISES – {inventoryFormData.propertyType.toUpperCase()}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '16px' }}>
                      {inventoryFormData.propertyType === 'Studio' && 'Evaluation of the unique piece and basic equipment.'}
                      {inventoryFormData.propertyType === 'Apartment' && 'Each room is automatically generated according to the number of bedrooms.'}
                      {(inventoryFormData.propertyType === 'Duplex' || inventoryFormData.propertyType === 'Villa') && 'Multi-level management and outdoor spaces.'}
                    </p>
                    
                    {/* Room-by-room inspection checklist */}
                    {getRoomList(inventoryFormData.propertyType, inventoryFormData.numberOfRooms).map((roomName) => (
                      <div key={roomName} style={{ marginBottom: '16px', padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <h5 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 600 }}>{roomName}</h5>
                        <div className="sa-table-wrapper" style={{ marginBottom: 0 }}>
                          <table className="sa-table">
                            <thead>
                              <tr>
                                <th style={{ width: '22%' }}>Item</th>
                                <th style={{ width: '22%' }}>Condition *</th>
                                <th>Remarks</th>
                                <th style={{ width: '22%' }}>Photos (optional)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {INSPECTION_ITEMS.map((item) => {
                                const itemState =
                                  inventoryFormData.formData?.rooms?.[roomName]?.[item.key] || { condition: '', comment: '', photos: [] };
                                return (
                                  <tr key={`${roomName}-${item.key}`}>
                                    <td>{item.label}</td>
                                    <td>
                                      <select
                                        value={itemState.condition}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setInventoryFormData(prev => ({
                                            ...prev,
                                            formData: {
                                              ...prev.formData,
                                              rooms: {
                                                ...prev.formData.rooms,
                                                [roomName]: {
                                                  ...(prev.formData.rooms?.[roomName] || {}),
                                                  [item.key]: {
                                                    ...(prev.formData.rooms?.[roomName]?.[item.key] || {}),
                                                    condition: value,
                                                  },
                                                },
                                              },
                                            },
                                          }));
                                        }}
                                        required
                                      >
                                        <option value="">Select</option>
                                        <option value="good">Good condition</option>
                                        <option value="poor">Poor condition</option>
                                        <option value="needs_repair">Needs repair</option>
                                      </select>
                                    </td>
                                    <td>
                                      <input
                                        type="text"
                                        value={itemState.comment}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setInventoryFormData(prev => ({
                                            ...prev,
                                            formData: {
                                              ...prev.formData,
                                              rooms: {
                                                ...prev.formData.rooms,
                                                [roomName]: {
                                                  ...(prev.formData.rooms?.[roomName] || {}),
                                                  [item.key]: {
                                                    ...(prev.formData.rooms?.[roomName]?.[item.key] || {}),
                                                    comment: value,
                                                  },
                                                },
                                              },
                                            },
                                          }));
                                        }}
                                        placeholder="e.g., damaged handle, peeling paint..."
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => {
                                          const files = Array.from(e.target.files || []);
                                          setInventoryFormData(prev => ({
                                            ...prev,
                                            formData: {
                                              ...prev.formData,
                                              rooms: {
                                                ...prev.formData.rooms,
                                                [roomName]: {
                                                  ...(prev.formData.rooms?.[roomName] || {}),
                                                  [item.key]: {
                                                    ...(prev.formData.rooms?.[roomName]?.[item.key] || {}),
                                                    photos: files,
                                                  },
                                                },
                                              },
                                            },
                                          }));
                                        }}
                                      />
                                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                                        {Array.isArray(itemState.photos) && itemState.photos.length > 0
                                          ? `${itemState.photos.length} selected`
                                          : 'No photos selected'}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* E. Meters & Equipment */}
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>E. Meters & Equipment</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Index Electricity Meter</label>
                      <input
                        type="text"
                        placeholder="Enter meter reading"
                        value={inventoryFormData.formData?.meters?.electricity || ''}
                        onChange={(e) =>
                          setInventoryFormData(prev => ({
                            ...prev,
                            formData: { ...prev.formData, meters: { ...prev.formData.meters, electricity: e.target.value } },
                          }))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Index Water Meter</label>
                      <input
                        type="text"
                        placeholder="Enter meter reading"
                        value={inventoryFormData.formData?.meters?.water || ''}
                        onChange={(e) =>
                          setInventoryFormData(prev => ({
                            ...prev,
                            formData: { ...prev.formData, meters: { ...prev.formData.meters, water: e.target.value } },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Gas (if applicable)</label>
                      <input
                        type="text"
                        placeholder="Enter gas meter reading"
                        value={inventoryFormData.formData?.meters?.gas || ''}
                        onChange={(e) =>
                          setInventoryFormData(prev => ({
                            ...prev,
                            formData: { ...prev.formData, meters: { ...prev.formData.meters, gas: e.target.value } },
                          }))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Number of Keys Handed In</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Enter number of keys"
                        value={inventoryFormData.formData?.meters?.keys || ''}
                        onChange={(e) =>
                          setInventoryFormData(prev => ({
                            ...prev,
                            formData: { ...prev.formData, meters: { ...prev.formData.meters, keys: e.target.value } },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* F. Observations */}
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>F. Observations</h4>
                  <div className="form-group">
                    <label>Comments from the Technical Manager</label>
                    <textarea
                      rows="3"
                      placeholder="Enter comments..."
                      value={inventoryFormData.formData?.observations?.technician || ''}
                      onChange={(e) =>
                        setInventoryFormData(prev => ({
                          ...prev,
                          formData: { ...prev.formData, observations: { ...prev.formData.observations, technician: e.target.value } },
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Observations of the Tenant</label>
                    <textarea
                      rows="3"
                      placeholder="Enter tenant observations..."
                      value={inventoryFormData.formData?.observations?.tenant || ''}
                      onChange={(e) =>
                        setInventoryFormData(prev => ({
                          ...prev,
                          formData: { ...prev.formData, observations: { ...prev.formData.observations, tenant: e.target.value } },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* G. Exit - Estimation of Degradations (only for Exit) */}
                {inventoryFormData.type === 'Exit' && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>G. OUTPUT – ESTIMATION OF DEGRADATIONS</h4>
                    <div className="form-group">
                      <label>Observed Degradations</label>
                      <textarea
                        rows="3"
                        placeholder="Describe observed degradations..."
                        value={inventoryFormData.formData?.exit?.degradations || ''}
                        onChange={(e) =>
                          setInventoryFormData(prev => ({
                            ...prev,
                            formData: { ...prev.formData, exit: { ...prev.formData.exit, degradations: e.target.value } },
                          }))
                        }
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Work to be Carried Out</label>
                        <textarea
                          rows="2"
                          placeholder="Describe work needed..."
                          value={inventoryFormData.formData?.exit?.workToBeCarriedOut || ''}
                          onChange={(e) =>
                            setInventoryFormData(prev => ({
                              ...prev,
                              formData: { ...prev.formData, exit: { ...prev.formData.exit, workToBeCarriedOut: e.target.value } },
                            }))
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Estimated Cost</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={inventoryFormData.formData?.exit?.estimatedCost || 0}
                          onChange={(e) =>
                            setInventoryFormData(prev => ({
                              ...prev,
                              formData: { ...prev.formData, exit: { ...prev.formData.exit, estimatedCost: parseFloat(e.target.value) || 0 } },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Impact on Bail</label>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name="bailImpact"
                            value="None"
                            checked={(inventoryFormData.formData?.exit?.bailImpact || 'None') === 'None'}
                            onChange={(e) =>
                              setInventoryFormData(prev => ({
                                ...prev,
                                formData: { ...prev.formData, exit: { ...prev.formData.exit, bailImpact: e.target.value } },
                              }))
                            }
                          />
                          None
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name="bailImpact"
                            value="Partial"
                            checked={(inventoryFormData.formData?.exit?.bailImpact || 'None') === 'Partial'}
                            onChange={(e) =>
                              setInventoryFormData(prev => ({
                                ...prev,
                                formData: { ...prev.formData, exit: { ...prev.formData.exit, bailImpact: e.target.value } },
                              }))
                            }
                          />
                          Partial
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name="bailImpact"
                            value="Total"
                            checked={(inventoryFormData.formData?.exit?.bailImpact || 'None') === 'Total'}
                            onChange={(e) =>
                              setInventoryFormData(prev => ({
                                ...prev,
                                formData: { ...prev.formData, exit: { ...prev.formData.exit, bailImpact: e.target.value } },
                              }))
                            }
                          />
                          Total
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* H. Digital Signature */}
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>H. DIGITAL SIGNATURE (MANDATORY)</h4>
                  <div className="form-group">
                    <label>Signature of the Technical Manager *</label>
                    <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '24px', textAlign: 'center', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Touch screen signature area (to be implemented)</p>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Signature of the Tenant *</label>
                    <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '24px', textAlign: 'center', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Touch screen signature area (to be implemented)</p>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
                      "I acknowledge the accuracy of the above information."
                    </p>
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary" 
                    onClick={() => setShowInventoryFormModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="action-button primary" 
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Finalize and Generate PDF'}
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

export default TechnicianDashboard;
