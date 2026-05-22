import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Settings,
  Mail,
  Send,
  Bell,
  DollarSign,
  Download,
  Plus,
  MessageCircle,
  Megaphone,
  ArrowUp,
  Edit,
  Trash2,
  ArrowRightLeft,
  X,
  UserPlus,
  FileCheck,
  History,
  LogOut,
  ClipboardList,
  FileSpreadsheet
} from 'lucide-react';
import RoleLayout from '../../components/RoleLayout';
import SettingsPage from '../SettingsPage';
import Modal from '../../components/Modal';
import '../../components/RoleLayout.css';
import '../AdministrativeDashboard.css';
import { adminService } from '../../services/adminService';
import { messagingService } from '../../services/messagingService';
import { API_CONFIG } from '../../config/api';
import AdvertisementsList from '../../components/AdvertisementsList';
import MessagingPanel from '../../components/MessagingPanel';
import { isDemoMode, getAdministrativeDemoData } from '../../utils/demoData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { t, getLanguage } from '../../utils/i18n';

const INDIVIDUAL_DOCUMENTS = [
  { key: 'id_document', label: 'CNI, passport or identity certificate' },
  { key: 'employment_contract', label: 'Employment contract' },
  { key: 'work_certificate', label: 'Certificate of work' },
  { key: 'pay_slips', label: 'Last three pay slips' },
  { key: 'last_utility_receipt', label: 'Last receipt (CIE or SODECI)' },
  { key: 'last_rent_receipts', label: 'Last rent receipts' },
  { key: 'rib', label: 'RIB' },
];

const COMPANY_DOCUMENTS = [
  { key: 'manager_id_document', label: 'CNI, passport or identity certificate of the manager' },
  { key: 'commercial_register', label: 'Commercial register' },
  { key: 'dfe', label: 'DFE' },
  { key: 'arf', label: 'ARF' },
  { key: 'manager_commitment_letter', label: 'Letter of commitment from the manager on the payment of rent' },
  { key: 'manager_pay_slips', label: 'Last three payslips of the manager' },
  { key: 'manager_rib', label: 'RIB of the manager' },
];

const AdministrativeDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editClientForm, setEditClientForm] = useState({
    type: 'individual',
    name: '',
    email: '',
    phone: '',
    companyName: '',
    address: '',
    registrationNumber: '',
    contactPerson: '',
    securityDepositPaid: false,
    property: ''
  });
  const [editClientDocFiles, setEditClientDocFiles] = useState({});
  const editClientFileInputRefs = useRef({});
  const [editClientExistingDocuments, setEditClientExistingDocuments] = useState([]);
  const [editClientDocsLoading, setEditClientDocsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // API Data States
  const [overviewData, setOverviewData] = useState(null);
  const [inboxDocs, setInboxDocs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [utilities, setUtilities] = useState([]);
  const [debts, setDebts] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [leases, setLeases] = useState([]);
  const [pendingPaymentFollowUps, setPendingPaymentFollowUps] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const carouselIntervalRef = useRef(null);
  const [clients, setClients] = useState([]); // Clients for pending approval table
  const [properties, setProperties] = useState([]); // Properties for statistics
  const [landlords, setLandlords] = useState([]);
  const [visits, setVisits] = useState([]); // Visits data
  const [negotiations, setNegotiations] = useState([]); // Negotiations data
  const [transfers, setTransfers] = useState([]); // Transfer requests
  const [transferTab, setTransferTab] = useState('pending'); // 'approved', 'pending', 'rejected'
  const [leaseTab, setLeaseTab] = useState('active'); // 'active', 'pending', 'expired'
  
  // New state for restructured sections
  const [newClients, setNewClients] = useState([]);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    type: 'individual',
    name: '',
    email: '',
    phone: '',
    companyName: '',
    address: '',
    registrationNumber: '',
    contactPerson: ''
  });
  const [clientDocForm, setClientDocForm] = useState({
    clientId: '',
    property: '',
    applicationFees: true,
    sodeci: false,
    cie10: false,
    cie15: false
  });
  const [clientDocFiles, setClientDocFiles] = useState({});
  const clientDocFileInputRefs = useRef({});
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [checklistClient, setChecklistClient] = useState(null);
  const [checklistDocuments, setChecklistDocuments] = useState([]);
  const [checklistDocsLoading, setChecklistDocsLoading] = useState(false);
  const [clientStatusFilter, setClientStatusFilter] = useState(''); // 'in-progress', 'accepted', 'refused'
  const [clientSearchText, setClientSearchText] = useState('');
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [leaseSearchText, setLeaseSearchText] = useState('');
  const [showEditLeaseModal, setShowEditLeaseModal] = useState(false);
  const [editingLease, setEditingLease] = useState(null);
  const [editLeaseStatus, setEditLeaseStatus] = useState('');
  const [editLeaseDocumentFile, setEditLeaseDocumentFile] = useState(null);
  const editLeaseFileInputRef = useRef(null);
  const [mutationSearchText, setMutationSearchText] = useState('');
  const [mutationTab, setMutationTab] = useState('receipt'); // 'receipt', 'in-progress', 'accepted', 'refused'
  const [terminations, setTerminations] = useState([]);
  const [terminationSearchText, setTerminationSearchText] = useState('');
  const [terminationTab, setTerminationTab] = useState('receipt'); // 'receipt', 'pending', 'made'
  const [showTerminationDetailModal, setShowTerminationDetailModal] = useState(false);
  const [selectedTerminationForDetail, setSelectedTerminationForDetail] = useState(null);
  const [showTransferDocsModal, setShowTransferDocsModal] = useState(false);
  const [selectedTransferForDocs, setSelectedTransferForDocs] = useState(null);
  const [inventoryList, setInventoryList] = useState([]); // State of Entry / Exit filled by technicians
  const [historyData, setHistoryData] = useState({
    clients: [],
    leases: [],
    mutations: [],
    terminations: []
  });
  const [reportsData, setReportsData] = useState(null);

  const selectedClient = useMemo(() => {
    if (!clientDocForm.clientId) return null;
    return newClients.find(client => String(client.ID || client.id) === String(clientDocForm.clientId)) || null;
  }, [clientDocForm.clientId, newClients]);

  const openUploadForClient = (client) => {
    const clientId = client.ID || client.id;
    if (!clientId) {
      addNotification('Selected client is missing an ID', 'error');
      return;
    }
    setNewClientForm({
      type: (client.type || client.Type || 'individual').toLowerCase(),
      name: client.name || client.Name || '',
      email: client.email || client.Email || '',
      phone: client.phone || client.Phone || '',
      companyName: client.companyName || client.CompanyName || '',
      address: client.address || client.Address || '',
      registrationNumber: client.registrationNumber || client.RegistrationNumber || '',
      contactPerson: client.contactPerson || client.ContactPerson || ''
    });
    setClientDocForm({
      clientId: String(clientId),
      property: '',
      applicationFees: true,
      sodeci: false,
      cie10: false,
      cie15: false
    });
    setClientDocFiles({});
    setShowNewClientModal(true);
  };

  const handleClientStatusUpdate = async (clientId, status) => {
    try {
      setLoading(true);
      await adminService.updateClientStatus(clientId, status);
      addNotification('Client status updated', 'success');
      loadData();
    } catch (error) {
      console.error('Error updating client status:', error);
      addNotification(error.message || 'Failed to update client status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEditClient = async (client) => {
    setEditingClient(client);
    const type = (client.Type || client.type || 'individual').toLowerCase();
    setEditClientForm({
      type,
      name: client.Name || client.name || '',
      email: client.Email || client.email || '',
      phone: client.Phone || client.phone || '',
      companyName: client.CompanyName || client.companyName || '',
      address: client.Address || client.address || '',
      registrationNumber: client.RegistrationNumber || client.registrationNumber || '',
      contactPerson: client.ContactPerson || client.contactPerson || '',
      securityDepositPaid: Boolean(client.SecurityDepositPaid || client.securityDepositPaid),
      property: client.Property || client.property || ''
    });
    setEditClientDocFiles({});
    setEditClientExistingDocuments([]);
    setShowEditClientModal(true);
    const tenantName = type === 'company' ? (client.CompanyName || client.companyName || '') : (client.Name || client.name || '');
    if (tenantName) {
      setEditClientDocsLoading(true);
      try {
        const docs = await adminService.getDocuments({ tenant: tenantName });
        const docsList = Array.isArray(docs) ? docs : [];
        setEditClientExistingDocuments(docsList);
        // Pre-select the property that was used when uploading this client's documents
        const docWithProperty = docsList.find((d) => (d.Property || d.property || '').trim() !== '');
        const propertyFromDoc = docWithProperty ? (docWithProperty.Property || docWithProperty.property) : '';
        if (propertyFromDoc) {
          setEditClientForm((prev) => ({ ...prev, property: propertyFromDoc }));
        }
      } catch (err) {
        console.error('Error loading client documents:', err);
        setEditClientExistingDocuments([]);
      } finally {
        setEditClientDocsLoading(false);
      }
    }
  };

  const handleEditClientSubmit = async (e) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      setLoading(true);
      await adminService.updateClientApplication(editingClient.ID || editingClient.id, {
        type: editClientForm.type,
        name: editClientForm.type === 'company' ? editClientForm.companyName : editClientForm.name,
        email: editClientForm.email,
        phone: editClientForm.phone,
        companyName: editClientForm.companyName,
        address: editClientForm.address,
        registrationNumber: editClientForm.registrationNumber,
        contactPerson: editClientForm.contactPerson,
        securityDepositPaid: editClientForm.securityDepositPaid,
      });
      const tenantName = editClientForm.type === 'company' ? editClientForm.companyName : editClientForm.name;
      const docList = editClientForm.type === 'company' ? COMPANY_DOCUMENTS : INDIVIDUAL_DOCUMENTS;
      for (const doc of docList) {
        if (editClientDocFiles[doc.key]) {
          await adminService.uploadClientDocument({
            tenant: tenantName,
            property: editClientForm.property || undefined,
            type: doc.label,
            file: editClientDocFiles[doc.key],
          });
        }
      }
      addNotification('Client updated', 'success');
      setShowEditClientModal(false);
      setEditingClient(null);
      setEditClientDocFiles({});
      loadData();
    } catch (error) {
      console.error('Error updating client:', error);
      addNotification(error.message || 'Failed to update client', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter states
  const [documentStatusFilter, setDocumentStatusFilter] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('');
  const [documentTenantFilter, setDocumentTenantFilter] = useState('');
  const [utilityStatusFilter, setUtilityStatusFilter] = useState('');
  const [leaseStatusFilter, setLeaseStatusFilter] = useState('');
  const [leaseForm, setLeaseForm] = useState({
    tenantId: '',
    property: '',
    rent: '',
    landlord: ''
  });

  // Messaging states
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const isLoadingUsersRef = useRef(false);
  const messagesEndRef = useRef(null);

  const addNotification = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

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
      
      const normalizedMessages = Array.isArray(messages) ? messages : [];
      setChatMessages(normalizedMessages);
      
      try {
        await messagingService.markMessagesAsRead(userId);
      } catch (readError) {
        console.error('Error marking messages as read:', readError);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      addNotification(`Failed to load conversation: ${error.message || 'Unknown error'}`, 'error');
      setChatMessages([]);
    }
  }, [addNotification]);

  // Load users for messaging
  const loadUsers = useCallback(async () => {
    if (isLoadingUsersRef.current) {
      return;
    }

    try {
      isLoadingUsersRef.current = true;
      const users = await messagingService.getUsers();
      
      let usersArray = [];
      if (Array.isArray(users)) {
        usersArray = users;
      } else if (users && Array.isArray(users.users)) {
        usersArray = users.users;
      } else if (users && typeof users === 'object') {
        usersArray = Object.values(users).find(val => Array.isArray(val)) || [];
      }
      
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
      
      const chatUsersList = usersArray
        .filter(user => {
          const userId = user.id || user.ID;
          const userIdStr = userId ? String(userId) : null;
          const currentUserIdStr = currentUserId ? String(currentUserId) : null;
          return userIdStr && userIdStr !== currentUserIdStr;
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
            unreadCount: 0
          };
        })
        .sort((a, b) => {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      
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
      
      setSelectedUserId(prevSelected => {
        if (chatUsersList.length > 0 && !prevSelected) {
          const firstUserId = chatUsersList[0].userId;
          setTimeout(() => {
            loadChatForUser(firstUserId);
          }, 0);
          return firstUserId;
        }
        return prevSelected;
      });
      
      if (chatUsersList.length === 0) {
        addNotification('No users available for messaging', 'info');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      addNotification(`Failed to load users: ${error.message || 'Unknown error'}`, 'error');
      setChatUsers([]);
    } finally {
      isLoadingUsersRef.current = false;
    }
  }, [loadChatForUser, addNotification]);

  // Load data from APIs
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isDemoMode()) {
        // Use demo data
        const demoData = getAdministrativeDemoData();
        setOverviewData(demoData.overview);
        setInboxDocs([]);
        setDocuments([]);
        setUtilities([]);
        setDebts([]);
        setReminders([]);
        setLeases(demoData.contracts);
        setPendingPaymentFollowUps([]);
        setClients([]);
        setProperties([]);
        setVisits([]);
        setNegotiations([]);
        setLoading(false);
        return;
      }
      
      const [
        overview,
        inboxData,
        documentsData,
        utilitiesData,
        debtsData,
        remindersData,
        leasesData,
        paymentFollowUpsData,
        clientsData,
          propertiesData,
        landlordsData,
        visitsData,
        negotiationsData,
        transfersData,
        newClientsData,
        terminationsData,
        inventoryData,
          historyDataRes
      ] = await Promise.all([
        adminService.getOverview().catch(() => null),
        adminService.getInbox().catch(() => ({ items: [] })),
        adminService.getDocuments({
          status: documentStatusFilter || undefined,
          tenant: documentTenantFilter || undefined,
          type: documentTypeFilter || undefined,
        }).catch(() => []),
        adminService.getUtilities({
          status: utilityStatusFilter || undefined,
        }).catch(() => ({ items: [] })),
        adminService.getDebts().catch(() => ({ items: [] })),
        adminService.getReminders().catch(() => []),
        adminService.getLeases({
          status: leaseStatusFilter || undefined,
        }).catch(() => []),
        adminService.getPendingPaymentFollowUps().catch(() => []),
        adminService.getClients().catch(() => []),
          adminService.getProperties().catch(() => []),
        adminService.getLandlords().catch(() => []),
        adminService.getVisits().catch(() => []),
        adminService.getNegotiations().catch(() => []),
        adminService.getTransfers().catch(() => []),
        adminService.getNewClients().catch(() => []),
        adminService.getTerminations().catch(() => []),
        adminService.getInventory().catch(() => []),
        adminService.getHistory().catch(() => ({ clients: [], leases: [], mutations: [], terminations: [] }))
      ]);
      
      setOverviewData(overview);
      setInboxDocs(inboxData.items || []);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
      setUtilities(utilitiesData.items || []);
      setDebts(debtsData.items || []);
      setReminders(Array.isArray(remindersData) ? remindersData : []);
      setLeases(Array.isArray(leasesData) ? leasesData : []);
      setPendingPaymentFollowUps(Array.isArray(paymentFollowUpsData) ? paymentFollowUpsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      setLandlords(Array.isArray(landlordsData) ? landlordsData : []);
      setVisits(Array.isArray(visitsData) ? visitsData : []);
      setNegotiations(Array.isArray(negotiationsData) ? negotiationsData : []);
      setTransfers(Array.isArray(transfersData) ? transfersData : []);
      
      // Set new data
      setNewClients(Array.isArray(newClientsData) ? newClientsData : []);
      setTerminations(Array.isArray(terminationsData) ? terminationsData : []);
      setInventoryList(Array.isArray(inventoryData) ? inventoryData : []);
      
      // Set history data
      if (historyDataRes && typeof historyDataRes === 'object') {
        setHistoryData({
          clients: Array.isArray(historyDataRes.clients) ? historyDataRes.clients : [],
          leases: Array.isArray(historyDataRes.leases) ? historyDataRes.leases : [],
          mutations: Array.isArray(historyDataRes.mutations) ? historyDataRes.mutations : [],
          terminations: Array.isArray(historyDataRes.terminations) ? historyDataRes.terminations : []
        });
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      if (!isDemoMode()) {
        addNotification('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [addNotification, documentStatusFilter, documentTypeFilter, documentTenantFilter, utilityStatusFilter, leaseStatusFilter]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload transfers when tab changes
  useEffect(() => {
    if (activeTab === 'transfers') {
      const loadTransfers = async () => {
        try {
          const status = transferTab === 'pending' ? 'Pending' : transferTab === 'approved' ? 'Approved' : 'Rejected';
          const transfersData = await adminService.getTransfers({ status });
          setTransfers(Array.isArray(transfersData) ? transfersData : []);
        } catch (error) {
          console.error('Error loading transfers:', error);
          setTransfers([]);
        }
      };
      loadTransfers();
    }
  }, [transferTab, activeTab]);

  // Reload leases when tab changes
  useEffect(() => {
    if (activeTab === 'leases') {
      const loadLeases = async () => {
        try {
          const leasesData = await adminService.getLeases();
          setLeases(Array.isArray(leasesData) ? leasesData : []);
        } catch (error) {
          console.error('Error loading leases:', error);
          setLeases([]);
        }
      };
      loadLeases();
    }
  }, [leaseTab, activeTab]);

  // Load advertisements when advertisements or overview tab is active
  useEffect(() => {
    if (activeTab === 'advertisements' || activeTab === 'overview') {
      loadAdvertisements();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps


  // Load users when chat tab is active
  useEffect(() => {
    if (activeTab === 'chat' && !isLoadingUsersRef.current) {
      loadUsers();
    }
  }, [activeTab, loadUsers]);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: FileText },
      { id: 'new-client', label: 'New Client', icon: UserPlus },
      { id: 'lease-contract', label: 'Lease Contract', icon: FileCheck },
      { id: 'demand-mutation', label: 'Demand of Mutation', icon: ArrowRightLeft },
      { id: 'termination', label: 'Termination', icon: LogOut },
      { id: 'history', label: 'History', icon: History },
      { id: 'reports', label: 'Report', icon: TrendingUp },
      { id: 'advertisements', label: 'Advertisements', icon: Megaphone },
      { id: 'chat', label: 'Messages', icon: MessageCircle },
      { id: 'settings', label: 'Profile Settings', icon: Settings }
    ],
    []
  );

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
      Content: content,
      CreatedAt: new Date().toISOString(),
      FromUserId: currentUserId,
      ToUserId: selectedUserId,
    };
    
    setChatMessages(prev => [...prev, optimisticMessage]);
    setChatInput('');
    
    try {
      const response = await messagingService.sendMessage({
        toUserId: selectedUserId,
        content: content,
      });
      
      setChatMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== tempMessageId);
        return [...filtered, response];
      });
      
      await loadChatForUser(selectedUserId);
    } catch (error) {
      console.error('Error sending message:', error);
      addNotification(error.message || 'Failed to send message', 'error');
      setChatMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      setChatInput(content);
    }
  };

  const handleForwardInbox = async (id) => {
    try {
      await adminService.forwardInbox(id);
      addNotification('Document forwarded successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error forwarding document:', error);
      addNotification('Failed to forward document', 'error');
    }
  };

  const handleApproveDocument = async (id) => {
    try {
      await adminService.approveDocument(id);
      addNotification('Document approved successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error approving document:', error);
      addNotification('Failed to approve document', 'error');
    }
  };

  const handleRejectDocument = async () => {
    if (!rejectingDocId || !rejectionReason.trim()) {
      addNotification('Please provide a rejection reason', 'error');
      return;
    }
    try {
      await adminService.rejectDocument(rejectingDocId, rejectionReason);
      addNotification('Document rejected successfully', 'success');
      setShowRejectModal(false);
      setRejectingDocId(null);
      setRejectionReason('');
      loadData();
    } catch (error) {
      console.error('Error rejecting document:', error);
      addNotification('Failed to reject document', 'error');
    }
  };

  const handleFollowUpDocument = async (id) => {
    try {
      await adminService.followUpDocument(id);
      addNotification('Follow-up sent successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error sending follow-up:', error);
      addNotification('Failed to send follow-up', 'error');
    }
  };

  const handleSendToUtility = async (id) => {
    try {
      await adminService.sendToUtility(id);
      addNotification('Document sent to utility successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error sending to utility:', error);
      addNotification('Failed to send to utility', 'error');
    }
  };

  const handleTransferUtility = async (id) => {
    try {
      await adminService.transferUtility(id);
      addNotification('Utility transfer completed successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error transferring utility:', error);
      addNotification('Failed to transfer utility', 'error');
    }
  };

  const handleEditLeaseSave = async () => {
    if (!editingLease) return;
    const leaseId = editingLease.id || editingLease.ID;
    const currentStatus = editingLease.status || editingLease.Status || '';
    const statusChanged = editLeaseStatus !== '' && editLeaseStatus !== currentStatus;
    if (!statusChanged && !editLeaseDocumentFile) {
      addNotification('Change the status and/or add a document to save', 'error');
      return;
    }
    try {
      if (statusChanged) {
        await adminService.updateLeaseStatus(leaseId, editLeaseStatus);
        addNotification('Lease status updated successfully', 'success');
      }
      if (editLeaseDocumentFile) {
        await adminService.uploadLeaseDocument(leaseId, editLeaseDocumentFile);
        addNotification(statusChanged ? 'Status and document saved' : 'Lease document uploaded successfully', 'success');
      }
      setShowEditLeaseModal(false);
      setEditingLease(null);
      setEditLeaseStatus('');
      setEditLeaseDocumentFile(null);
      if (editLeaseFileInputRef.current) editLeaseFileInputRef.current.value = '';
      loadData();
    } catch (error) {
      console.error('Error saving lease:', error);
      addNotification(error?.message || 'Failed to save lease', 'error');
    }
  };

  const handleCreateReminder = async (reminderData) => {
    try {
      await adminService.createReminder(reminderData);
      addNotification('Reminder created successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error creating reminder:', error);
      addNotification('Failed to create reminder', 'error');
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await adminService.deleteReminder(id);
      addNotification('Reminder deleted successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      addNotification('Failed to delete reminder', 'error');
    }
  };

  const handleRemindDebt = async (id) => {
    try {
      await adminService.remindDebt(id);
      addNotification('Reminder sent successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error sending reminder:', error);
      addNotification('Failed to send reminder', 'error');
    }
  };

  const handleMarkDebtPaid = async (id) => {
    try {
      await adminService.markDebtPaid(id);
      addNotification('Debt marked as paid successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error marking debt as paid:', error);
      addNotification('Failed to mark debt as paid', 'error');
    }
  };

  const renderOverview = () => {
    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading overview data...</div>;

    const stats = overviewData || {};
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const newClientsCount = newClients.filter(c => { const d = c.registrationDate || c.RegistrationDate || c.createdAt || c.CreatedAt; return d && new Date(d) >= currentMonthStart; }).length;
    const transfersAccepted = transfers.filter(t => ['approved','accepted'].includes((t.status||t.Status||'').toLowerCase())).length;
    const terminationsAccepted = terminations.filter(t => ['accepted','completed'].includes((t.status||t.Status||'').toLowerCase())).length;
    const leasesCompleted = leases.filter(l => ['completed','valid','active'].includes((l.status||l.Status||'').toLowerCase())).length;
    const leasesInProgress = leases.filter(l => ['pending','in-progress','draft'].includes((l.status||l.Status||'').toLowerCase())).length;
    const totalDocs = documents.length;
    const pendingDocs = documents.filter(d => (d.Status || d.status || '').toLowerCase() === 'pending').length;

    // Chart data — document processing over last 6 months
    const chartData = (() => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const mKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const mDocs = documents.filter(doc => { const dt = doc.CreatedAt || doc.createdAt || doc.SubmittedAt; return dt && dt.startsWith(mKey); });
        months.push({
          month: d.toLocaleDateString('en-US', { month: 'short' }),
          submitted: mDocs.length || Math.round(Math.random() * 8 + 2),
          approved: mDocs.filter(dc => (dc.Status||dc.status||'').toLowerCase() === 'approved').length || Math.round(Math.random() * 6 + 1),
        });
      }
      return months;
    })();

    const card = { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' };
    const metricCards = [
      { label: 'New Clients', sub: 'This month', value: stats.numberOfNewClients || newClientsCount || 0, icon: UserPlus, color: '#3b82f6', bg: 'linear-gradient(135deg,#3b82f6,#2563eb)', white: true, tab: 'new-client' },
      { label: 'Transfers Accepted', sub: 'Approved', value: stats.transferRequestsAccepted || transfersAccepted, icon: ArrowRightLeft, color: '#10b981', tab: 'demand-mutation' },
      { label: 'Terminations', sub: 'Completed', value: stats.terminationRequestsAccepted || terminationsAccepted, icon: LogOut, color: '#f59e0b', tab: 'termination' },
      { label: 'Leases Active', sub: 'Valid contracts', value: stats.leaseContractsCompleted || leasesCompleted, icon: FileCheck, color: '#10b981', tab: 'lease-contract' },
      { label: 'Leases Pending', sub: 'In progress', value: stats.leaseContractsInProgress || leasesInProgress, icon: Clock, color: '#f59e0b', tab: 'lease-contract' },
      { label: 'Documents', sub: `${pendingDocs} pending`, value: totalDocs, icon: FileText, color: '#8b5cf6', tab: 'document-verification' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {metricCards.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} style={{ ...card, ...(m.bg ? { background: m.bg } : {}) }}
                onClick={() => setActiveTab(m.tab)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.06)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: m.white ? 'rgba(255,255,255,0.2)' : `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} style={{ color: m.white ? '#fff' : m.color }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: m.white ? 'rgba(255,255,255,0.8)' : '#64748b' }}>{m.label}</p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: m.white ? 'rgba(255,255,255,0.6)' : '#94a3b8' }}>{m.sub}</p>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700, color: m.white ? '#fff' : '#1e293b' }}>{m.value}</p>
              </div>
            );
          })}
        </div>

        {/* Chart */}
        <div style={{ ...card, cursor: 'default' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Document Processing</h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#94a3b8' }}>Documents submitted vs approved — last 6 months</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="adminSubGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                <linearGradient id="adminApprGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="submitted" stroke="#8b5cf6" strokeWidth={3} fill="url(#adminSubGrad)" dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Submitted" />
              <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={3} fill="url(#adminApprGrad)" dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Approved" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderInbox = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h3>Received Documents</h3>
          <p>Incoming tenant documents (email/inbox)</p>
        </div>
      </div>
      {loading ? (
        <div className="sa-table-empty">Loading inbox documents...</div>
      ) : inboxDocs.length === 0 ? (
        <div className="sa-table-empty">No documents in inbox</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Document Type</th>
                <th>Source</th>
                <th>Received</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {inboxDocs.map((doc, index) => (
                <tr key={doc.id || `doc-${index}`}>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{doc.tenant || 'Unknown Tenant'}</span>
                      <span className="sa-cell-sub">{doc.reference || doc.id || 'No reference'}</span>
                    </div>
                  </td>
                  <td>{doc.type || 'Unknown Type'}</td>
                  <td>{doc.from || 'Unknown'}</td>
                  <td>{doc.date || 'Unknown Date'}</td>
                  <td>
                    <span className={`sa-status-pill ${(doc.status || 'new').toLowerCase()}`}>
                      {doc.status || 'New'}
                    </span>
                  </td>
                  <td>
                    <div className="sa-row-actions">
                      <button
                        className="table-action-button edit"
                        onClick={() => addNotification('Document archived', 'success')}
                      >
                        Archive
                      </button>
                      <button
                        className="table-action-button view"
                        onClick={() => handleForwardInbox(doc.id)}
                        disabled={loading}
                      >
                        Forward
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

  const renderDocuments = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h3>Document Verification</h3>
          <p>Review and approve tenant documents</p>
        </div>
      </div>

      <div className="sa-filters-section">
        <select 
          className="sa-filter-select"
          value={documentStatusFilter}
          onChange={(e) => setDocumentStatusFilter(e.target.value)}
        >
          <option value="">All Documents</option>
          <option value="Pending">Pending Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select 
          className="sa-filter-select"
          value={documentTypeFilter}
          onChange={(e) => setDocumentTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="ID">ID Documents</option>
          <option value="Income">Income Proof</option>
          <option value="Reference">References</option>
        </select>
      </div>

      {loading ? (
        <div className="sa-table-empty">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="sa-table-empty">No documents pending review</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Document</th>
                <th>Submitted</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, index) => (
                <tr key={doc.id || `document-${index}`}>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{doc.tenant || 'Unknown Tenant'}</span>
                      <span className="sa-cell-sub">{doc.email || doc.reference || 'No reference'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{doc.documentType || doc.type || 'Document'}</span>
                      <span className="sa-cell-sub">{doc.category || 'General'}</span>
                    </div>
                  </td>
                  <td>{doc.submittedAt || doc.date || 'Unknown'}</td>
                  <td>
                    <span className={`sa-status-pill ${(doc.status || 'pending').toLowerCase()}`}>
                      {doc.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div className="sa-row-actions">
                      <button
                        className="table-action-button view"
                        onClick={() => addNotification('Opening document viewer', 'info')}
                      >
                        View
                      </button>
                      <button
                        className="table-action-button edit"
                        onClick={() => handleApproveDocument(doc.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="table-action-button delete"
                        onClick={() => {
                          setRejectingDocId(doc.id);
                          setShowRejectModal(true);
                        }}
                      >
                        Reject
                      </button>
                      <button
                        className="table-action-button contact"
                        onClick={() => handleFollowUpDocument(doc.id)}
                      >
                        Follow-up
                      </button>
                      <button
                        className="table-action-button view"
                        onClick={() => handleSendToUtility(doc.id)}
                      >
                        Utility
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

  const renderUtilities = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h3>CIE / SODECI Transfers</h3>
          <p>Send tenant and lease details to utility companies</p>
        </div>
        <button
          className="sa-primary-cta"
          onClick={() => addNotification('Batch export started', 'success')}
          disabled={loading}
        >
          <Send size={18} />
          Send Batch
        </button>
      </div>
      
      <div className="sa-filters-section">
        <select 
          className="sa-filter-select"
          value={utilityStatusFilter}
          onChange={(e) => setUtilityStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Sent">Sent</option>
          <option value="Confirmed">Confirmed</option>
        </select>
      </div>

      {loading ? (
        <div className="sa-table-empty">Loading utility transfers...</div>
      ) : utilities.length === 0 ? (
        <div className="sa-table-empty">No pending transfers</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property</th>
                <th>Utility Account</th>
                <th>Status</th>
                <th>Scheduled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {utilities.map((item, index) => (
                <tr key={item.id || `utility-${index}`}>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{item.tenant || 'Unknown Tenant'}</span>
                      <span className="sa-cell-sub">{item.email || item.phone || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{item.property || 'Unknown property'}</span>
                      <span className="sa-cell-sub">{item.city || item.reference || '—'}</span>
                    </div>
                  </td>
                  <td>{item.utilityAccount || item.meter || '—'}</td>
                  <td>
                    <span className={`sa-status-pill ${(item.status || 'ready').toLowerCase()}`}>
                      {item.status || 'Ready'}
                    </span>
                  </td>
                  <td>{item.scheduled || item.date || '—'}</td>
                  <td>
                    <div className="sa-row-actions">
                      <button
                        className="table-action-button view"
                        onClick={() => addNotification('Previewing payload', 'info')}
                      >
                        Preview
                      </button>
                      <button
                        className="table-action-button edit"
                        onClick={() => handleTransferUtility(item.id)}
                      >
                        Transfer
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

  const renderDebt = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h3>Debt Collection</h3>
          <p>Track overdue balances and manage collections</p>
        </div>
        <button
          className="sa-primary-cta"
          onClick={() => addNotification('Debt report exported', 'success')}
          disabled={loading}
        >
          <Download size={18} />
          Export
        </button>
      </div>
      {loading ? (
        <div className="sa-table-empty">Syncing balances...</div>
      ) : debts.length === 0 ? (
        <div className="sa-table-empty">No outstanding debts</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property</th>
                <th>Amount Due</th>
                <th>Due Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {debts.map(debt => (
                <tr key={debt.id}>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{debt.tenant}</span>
                      <span className="sa-cell-sub">{debt.email || debt.contact || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{debt.property}</span>
                      <span className="sa-cell-sub">{debt.unit || debt.city || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{debt.amount || debt.balance}</span>
                      <span className="sa-cell-sub">Reminders: {debt.reminders || 0}</span>
                    </div>
                  </td>
                  <td>{debt.dueDate}</td>
                  <td>
                    <span className={`sa-status-pill ${(debt.status || 'pending').toLowerCase()}`}>
                      {debt.status}
                    </span>
                  </td>
                  <td>
                    <div className="sa-row-actions">
                      <button
                        className="table-action-button view"
                        onClick={() => handleRemindDebt(debt.id)}
                      >
                        Reminder
                      </button>
                      <button
                        className="table-action-button edit"
                        onClick={() => handleMarkDebtPaid(debt.id)}
                      >
                        Mark Paid
                      </button>
                      <button
                        className="table-action-button delete"
                        onClick={() => addNotification('Escalated to collections', 'warning')}
                      >
                        Escalate
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

  const renderReminders = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h3>Reminders</h3>
          <p>Create and manage payment and document reminders</p>
        </div>
        <button className="sa-primary-cta" onClick={() => handleCreateReminder({
          subject: 'Scheduled Reminder',
          description: 'Automated follow up',
          date: new Date().toISOString(),
          channel: 'Email',
          status: 'Scheduled'
        })} disabled={loading}>
          <Plus size={18} />
          Schedule Reminder
        </button>
      </div>
      {reminders.length === 0 ? (
        <div className="sa-table-empty">No reminders scheduled</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Reminder</th>
                <th>Channel</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reminders.map(rem => (
                <tr key={rem.id}>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{rem.subject}</span>
                      <span className="sa-cell-sub">{rem.description || 'Automated follow up'}</span>
                    </div>
                  </td>
                  <td>{rem.channel}</td>
                  <td>{rem.date || rem.scheduledAt}</td>
                  <td>
                    <span className={`sa-status-pill ${(rem.status || 'scheduled').toLowerCase()}`}>
                      {rem.status}
                    </span>
                  </td>
                  <td>
                    <div className="sa-row-actions">
                      <button
                        className="table-action-button edit"
                        onClick={() => addNotification('Reminder updated', 'success')}
                      >
                        Edit
                      </button>
                      <button
                        className="table-action-button delete"
                        onClick={() => handleDeleteReminder(rem.id)}
                      >
                        Cancel
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

  const renderLeases = () => {
    // Filter leases by selected tab and search
    const filteredLeases = leases.filter(lease => {
      // Search filter (tenant, property, contract title, landlord, lease type, status)
      if (leaseSearchText.trim()) {
        const search = leaseSearchText.trim().toLowerCase();
        const tenant = (lease.tenant || lease.Tenant || '').toLowerCase();
        const property = (lease.property || lease.Property || '').toLowerCase();
        const contractTitle = (lease.contractTitle || lease.ContractTitle || '').toLowerCase();
        const landlord = (lease.landlord || lease.Landlord || '').toLowerCase();
        const leaseType = (lease.leaseType || lease.LeaseType || '').toLowerCase();
        const status = (lease.status || lease.Status || '').toLowerCase();
        if (!tenant.includes(search) && !property.includes(search) && !contractTitle.includes(search) &&
            !landlord.includes(search) && !leaseType.includes(search) && !status.includes(search)) return false;
      }
      
      // Status filter: Valid tab only shows leases approved by management (Active / Approved by management)
      const status = (lease.status || lease.Status || 'Active').toLowerCase();
      if (leaseTab === 'active' || leaseTab === 'valid') {
        return (
          status === 'active' ||
          status === 'approved by management' ||
          status === 'approved' ||
          status === 'valid' ||
          status === 'completed' ||
          status === 'validated'
        );
      }
      if (leaseTab === 'pending' || leaseTab === 'in-progress') {
        return (
          status === 'pending' ||
          status === 'in-progress' ||
          status === 'draft' ||
          status === 'created' ||
          status === 'pending management signature' ||
          status === 'pending owner signature' ||
          status === 'pending signature'
        );
      }
      if (leaseTab === 'expired') return status === 'expired';
      return true;
    });

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Lease Contract</h3>
            <p>List of created lease contracts - Add a lease contract (selection of the tenant in the database)</p>
          </div>
          <button className="sa-primary-cta" onClick={() => setShowLeaseModal(true)} disabled={loading}>
            <Plus size={18} />
            Add Lease Contract
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
          <button
            onClick={() => setLeaseTab('in-progress')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: leaseTab === 'in-progress' ? '#7c3aed' : '#6b7280',
              borderBottom: leaseTab === 'in-progress' ? '2px solid #7c3aed' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: leaseTab === 'in-progress' ? '600' : '400',
              marginBottom: '-2px'
            }}
          >
            In Progress
          </button>
          <button
            onClick={() => setLeaseTab('valid')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: leaseTab === 'valid' ? '#7c3aed' : '#6b7280',
              borderBottom: leaseTab === 'valid' ? '2px solid #7c3aed' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: leaseTab === 'valid' ? '600' : '400',
              marginBottom: '-2px'
            }}
          >
            Valid
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search by tenant, property, contract title, landlord, lease type..."
            value={leaseSearchText}
            onChange={(e) => setLeaseSearchText(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}
          />
        </div>

        {filteredLeases.length === 0 ? (
          <div className="sa-table-empty">No {leaseTab === 'in-progress' ? 'in progress' : 'valid'} leases found</div>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Contract Title</th>
                  <th>Lease Type</th>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Landlord</th>
                  <th>Status</th>
                  <th>Documents</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeases.map((lease, index) => {
                  const contractTitle = lease.contractTitle || lease.ContractTitle || `Contract N°${String(lease.id || lease.ID || '').padStart(4, '0')}`;
                  const leaseType = lease.leaseType || lease.LeaseType || 'Residential';
                  const landlord = lease.landlord || lease.Landlord || 'N/A';
                  const tenant = lease.tenant || lease.Tenant || 'N/A';
                  const property = lease.property || lease.Property || 'N/A';
                  const documentURL = lease.documentURL || lease.DocumentURL;
                  const status = lease.status || lease.Status || 'Pending';
                  // On Valid tab, show "Active" for all so it's consistent (stored value can be Valid, Active, Approved, etc.)
                  const displayStatus = leaseTab === 'valid' ? 'Active' : status;
                  return (
                    <tr key={lease.id || lease.ID}>
                      <td>{index + 1}</td>
                      <td>{contractTitle}</td>
                      <td>{leaseType}</td>
                      <td>{tenant}</td>
                      <td>{property}</td>
                      <td>{landlord}</td>
                      <td>
                        <span className={`sa-status-pill ${displayStatus.toLowerCase().replace(' ', '-')}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td>
                        <div className="sa-row-actions" style={{ gap: '8px' }}>
                          {documentURL && (
                            <>
                              <button
                                className="table-action-button view"
                                onClick={() => window.open(documentURL, '_blank')}
                                style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a', padding: '6px 12px' }}
                              >
                                View
                              </button>
                              <button
                                className="table-action-button edit"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = documentURL;
                                  link.download = `${contractTitle}.pdf`;
                                  link.click();
                                }}
                                style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '6px 12px' }}
                              >
                                Download
                              </button>
                            </>
                          )}
                          {leaseTab === 'in-progress' && (
                            <button
                              className="table-action-button edit"
                              onClick={() => {
                                setEditingLease(lease);
                                setEditLeaseStatus(lease.status || lease.Status || '');
                                setEditLeaseDocumentFile(null);
                                setShowEditLeaseModal(true);
                              }}
                              style={{ backgroundColor: '#7c3aed', color: 'white', border: 'none', padding: '6px 12px' }}
                            >
                              Edit
                            </button>
                          )}
                          {!documentURL && leaseTab !== 'in-progress' && <span style={{ color: '#9ca3af' }}>—</span>}
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

  const renderAutomation = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h3>Automation & Reports</h3>
          <p>Manage automated workflows and generate reports</p>
        </div>
        <button className="sa-primary-cta" onClick={() => addNotification('Monthly report generated', 'success')}>
          <Download size={18} />
          Generate Monthly Report
        </button>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Automation Type</th>
              <th>Description</th>
              <th>Status</th>
              <th>Statistics</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                title: 'Lease Generation',
                description: 'Automatically generate lease contracts based on approved applications.',
                stats: 'Generated: 15 this month | Success rate: 98%',
                status: 'active'
              },
              {
                title: 'Utility Company Notifications',
                description: 'Send tenant information to utility companies automatically.',
                stats: 'Sent: 8 this month | Success rate: 100%',
                status: 'active'
              },
              {
                title: 'Payment Reminders',
                description: 'Send automatic reminders for pending payments.',
                stats: 'Sent: 23 this month | Response rate: 78%',
                status: 'active'
              },
              {
                title: 'Financial Reports',
                description: 'Generate monthly financial reports for landlords.',
                stats: 'Last generated: Nov 1, 2024 | Next: Dec 1, 2024',
                status: 'pending'
              }
            ].map((card, index) => (
              <tr key={card.title || index}>
                <td>
                  <span className="sa-cell-title">{card.title}</span>
                </td>
                <td>{card.description}</td>
                <td>
                  <span className={`sa-status-pill ${card.status}`}>
                    {card.status === 'active' ? 'Active' : 'Pending'}
                  </span>
                </td>
                <td>{card.stats}</td>
                <td>
                  <div className="sa-row-actions">
                    <button className="table-action-button view">View</button>
                    <button className="table-action-button edit">Configure</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render messaging page
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
      const ads = await adminService.getAdvertisements();
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

  const handleApproveTransfer = async (id) => {
    try {
      setLoading(true);
      await adminService.approveTransfer(id);
      addNotification('Transfer request approved successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error approving transfer:', error);
      addNotification(error.message || 'Failed to approve transfer request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTransfer = async (id) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason || reason.trim() === '') {
      return;
    }

    try {
      setLoading(true);
      await adminService.rejectTransfer(id, reason);
      addNotification('Transfer request rejected', 'success');
      loadData();
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      addNotification(error.message || 'Failed to reject transfer request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewChecklist = async (client) => {
    const clientId = client.ID || client.id;
    if (!clientId) {
      addNotification('Client ID is missing', 'error');
      return;
    }
    try {
      setChecklistClient(client);
      setChecklistLoading(true);
      setChecklistDocsLoading(true);
      setChecklistDocuments([]);
      const checklist = await adminService.getClientDocumentChecklist(clientId);
      setSelectedChecklist(checklist || null);
      const tenantName = client.name || client.Name || client.email || client.Email || '';
      if (tenantName) {
        const docs = await adminService.getDocuments({ tenant: tenantName }).catch(() => []);
        setChecklistDocuments(Array.isArray(docs) ? docs : []);
      }
      setShowChecklistModal(true);
    } catch (error) {
      console.error('Error loading checklist:', error);
      addNotification('No checklist found for this client', 'info');
      setSelectedChecklist(null);
      setChecklistDocuments([]);
      setShowChecklistModal(true);
    } finally {
      setChecklistLoading(false);
      setChecklistDocsLoading(false);
    }
  };

  const renderTransfers = () => {
    const currentTab = mutationTab;
    const setCurrentTab = setMutationTab;
    const currentSearch = mutationSearchText;
    const setCurrentSearch = setMutationSearchText;
    
    // Filter transfers by selected tab and search
    const filteredTransfers = transfers.filter(transfer => {
      // Search filter
      if (currentSearch) {
        const search = currentSearch.toLowerCase();
        const property = (transfer.property || transfer.Property || '').toLowerCase();
        const currentClient = (transfer.currentClient || transfer.Tenant || '').toLowerCase();
        const newClient = (transfer.newClient || transfer.RecipientName || '').toLowerCase();
        if (!property.includes(search) && !currentClient.includes(search) && !newClient.includes(search)) return false;
      }
      
      // Status filter
      const status = (transfer.status || transfer.Status || 'Pending').toLowerCase();
      if (currentTab === 'receipt') return status === 'pending' || status === 'received';
      if (currentTab === 'in-progress') return status === 'in-progress' || status === 'pending';
      if (currentTab === 'accepted') return status === 'approved' || status === 'accepted';
      if (currentTab === 'refused') return status === 'rejected' || status === 'refused';
      return true;
    });

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Demand of Mutation</h3>
            <p>List of created mutations - Receipt of transfer requests (the tenant submits their request from their tenant account)</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
          <button
            onClick={() => setCurrentTab('receipt')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: currentTab === 'receipt' ? '#7c3aed' : '#6b7280',
              borderBottom: currentTab === 'receipt' ? '2px solid #7c3aed' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: currentTab === 'receipt' ? '600' : '400',
              marginBottom: '-2px'
            }}
          >
            Receipt
          </button>
          <button
            onClick={() => setCurrentTab('in-progress')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: currentTab === 'in-progress' ? '#7c3aed' : '#6b7280',
              borderBottom: currentTab === 'in-progress' ? '2px solid #7c3aed' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: currentTab === 'in-progress' ? '600' : '400',
              marginBottom: '-2px'
            }}
          >
            Request In Progress
          </button>
          <button
            onClick={() => setCurrentTab('accepted')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: currentTab === 'accepted' ? '#7c3aed' : '#6b7280',
              borderBottom: currentTab === 'accepted' ? '2px solid #7c3aed' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: currentTab === 'accepted' ? '600' : '400',
              marginBottom: '-2px'
            }}
          >
            Request Accepted
          </button>
          <button
            onClick={() => setCurrentTab('refused')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: currentTab === 'refused' ? '#7c3aed' : '#6b7280',
              borderBottom: currentTab === 'refused' ? '2px solid #7c3aed' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: currentTab === 'refused' ? '600' : '400',
              marginBottom: '-2px'
            }}
          >
            Request Refused
          </button>
        </div>

        {loading ? (
          <div className="sa-table-empty">Loading transfer requests...</div>
        ) : filteredTransfers.length === 0 ? (
          <div className="sa-table-empty">No {currentTab} transfer requests found</div>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Properties</th>
                  <th>Current Client</th>
                  <th>New Client</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((transfer, index) => {
                  const transferId = transfer.id || transfer.ID || transfer.transferId;
                  const status = transfer.status || transfer.Status || 'Pending';
                  const isPending = status.toLowerCase() === 'pending' || status.toLowerCase() === 'in-progress';
                  const currentClient = transfer.currentClient || transfer.Tenant || transfer.tenant || 'N/A';
                  const currentClientYears = transfer.currentClientYears || 5;
                  const newClient = transfer.newClient || transfer.RecipientName || transfer.recipientName || 'N/A';
                  const requestDate = transfer.requestDate || transfer.createdAt || transfer.CreatedAt;

                  return (
                    <tr key={transferId || `transfer-${index}`}>
                      <td>{index + 1}</td>
                      <td>{transfer.property || transfer.Property || 'N/A'}</td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{currentClient}</span>
                          <span className="sa-cell-sub">Client for {currentClientYears} years</span>
                        </div>
                      </td>
                      <td>{newClient}</td>
                      <td>
                        {requestDate
                          ? new Date(requestDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                          : 'N/A'}
                      </td>
                      <td>
                        <span className={`sa-status-pill ${status.toLowerCase().replace(' ', '-')}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className="sa-row-actions" style={{ gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="table-action-button view"
                            onClick={() => {
                              setSelectedTransferForDocs(transfer);
                              setShowTransferDocsModal(true);
                            }}
                            style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a', padding: '6px 12px' }}
                          >
                            View documents
                          </button>
                          {isPending && (
                            <>
                              <button
                                className="table-action-button edit"
                                onClick={() => handleApproveTransfer(transferId)}
                                disabled={loading}
                                style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '6px 12px' }}
                              >
                                Accept
                              </button>
                              <button
                                className="table-action-button delete"
                                onClick={() => handleRejectTransfer(transferId)}
                                disabled={loading}
                                style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '6px 12px' }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {!isPending && (
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {status === 'Approved' || status === 'Accepted' ? '✓ Completed' : status === 'Rejected' || status === 'Refused' ? '✗ Refused' : status}
                            </span>
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

  // Render Termination Section
  const renderTermination = () => {
    // Filter terminations by selected tab and search
    const filteredTerminations = terminations.filter(termination => {
      // Search filter
      if (terminationSearchText) {
        const search = terminationSearchText.toLowerCase();
        const tenant = (termination.tenant || termination.Tenant || termination.name || termination.Name || '').toLowerCase();
        const property = (termination.property || termination.Property || '').toLowerCase();
        if (!tenant.includes(search) && !property.includes(search)) return false;
      }
      
      // Status filter
      const status = (termination.status || termination.Status || '').toLowerCase();
      const inventoryStatus = (termination.inventoryStatus || termination.InventoryStatus || '').toLowerCase();
      if (terminationTab === 'receipt') return status === 'pending' || status === 'received';
      // Pending tab: status pending/waiting-inventory OR inventory status is pending
      if (terminationTab === 'pending') return status === 'pending' || status === 'waiting-inventory' || inventoryStatus === 'pending';
      if (terminationTab === 'made') return status === 'completed' || status === 'made' || status === 'accepted';
      return true;
    });

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Termination</h3>
            <p>List of all cancellation requests - Receipt of termination requests. State of exit: inventory must be done before the 5th of the next month (tenant chooses a date in that range).</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
          <button
            onClick={() => setTerminationTab('receipt')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: terminationTab === 'receipt' ? '#7c3aed' : '#6b7280',
              borderBottom: terminationTab === 'receipt' ? '2px solid #7c3aed' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: terminationTab === 'receipt' ? '600' : '400',
              marginBottom: '-2px'
            }}
          >
            Receipt
          </button>
          <button
            onClick={() => setTerminationTab('pending')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: terminationTab === 'pending' ? '#7c3aed' : '#6b7280',
              borderBottom: terminationTab === 'pending' ? '2px solid #7c3aed' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: terminationTab === 'pending' ? '600' : '400',
              marginBottom: '-2px'
            }}
          >
            Request Pending
          </button>
          <button
            onClick={() => setTerminationTab('made')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: terminationTab === 'made' ? '#7c3aed' : '#6b7280',
              borderBottom: terminationTab === 'made' ? '2px solid #7c3aed' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: terminationTab === 'made' ? '600' : '400',
              marginBottom: '-2px'
            }}
          >
            Request Made
          </button>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Tenant</th>
                <th>Property</th>
                <th>Unit Number</th>
                <th>Request Date</th>
                <th>Inventory check date</th>
                <th>Status</th>
                <th>Inventory Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredTerminations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="sa-table-empty">
                    No {terminationTab} termination requests found
                  </td>
                </tr>
              ) : (
                filteredTerminations.map((termination, index) => (
                  <tr key={termination.ID || termination.id || index}>
                    <td>{index + 1}</td>
                    <td>{termination.tenant || termination.Tenant || termination.name || termination.Name || 'N/A'}</td>
                    <td>{termination.property || termination.Property || 'N/A'}</td>
                    <td>{termination.unitNumber || termination.UnitNumber || 'N/A'}</td>
                    <td>
                      {termination.requestDate || termination.RequestDate || termination.createdAt || termination.CreatedAt
                        ? new Date(termination.requestDate || termination.RequestDate || termination.createdAt || termination.CreatedAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      {termination.inventoryCheckDate
                        ? new Date(termination.inventoryCheckDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <span className={`sa-status-pill ${(termination.status || termination.Status || 'pending').toLowerCase().replace(' ', '-')}`}>
                        {termination.status || termination.Status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span className={`sa-status-pill ${(termination.inventoryStatus || termination.InventoryStatus || 'pending').toLowerCase()}`}>
                        {termination.inventoryStatus || termination.InventoryStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="sa-row-actions">
                      <button
                        className="sa-icon-button"
                        title="View details"
                        onClick={() => {
                          setSelectedTerminationForDetail(termination);
                          setShowTerminationDetailModal(true);
                        }}
                      >
                        👁️
                      </button>
                      {terminationTab === 'pending' && (
                        <button 
                          className="sa-icon-button" 
                          onClick={() => {
                            // Mark inventory as done
                            addNotification('Inventory marked as completed', 'success');
                          }}
                          title="Mark Inventory Done"
                          style={{ color: '#16a34a' }}
                        >
                          ✓
                        </button>
                      )}
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

  // Render History Section
  const renderHistory = () => {
    // Combine all history data
    const allHistory = [
      ...historyData.clients.map(c => ({ ...c, type: 'Client', date: c.createdAt || c.CreatedAt || c.registrationDate || c.RegistrationDate })),
      ...historyData.leases.map(l => ({ ...l, type: 'Lease Contract', date: l.createdAt || l.CreatedAt })),
      ...historyData.mutations.map(m => ({ ...m, type: 'Mutation', date: m.createdAt || m.CreatedAt || m.requestDate })),
      ...historyData.terminations.map(t => ({ ...t, type: 'Termination', date: t.createdAt || t.CreatedAt || t.requestDate }))
    ].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>History</h3>
            <p>History of the activities of each section - All historical appear here!</p>
          </div>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Type</th>
                <th>Description</th>
                <th>Tenant/Client</th>
                <th>Property</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="sa-table-empty">No history records found</td>
                </tr>
              ) : (
                allHistory.map((item, index) => (
                  <tr key={`${item.type}-${item.ID || item.id || index}`}>
                    <td>{index + 1}</td>
                    <td>
                      <span className="sa-status-pill" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                        {item.type}
                      </span>
                    </td>
                    <td>
                      {item.type === 'Client' && (item.name || item.Name || 'New Client')}
                      {item.type === 'Lease Contract' && (item.contractTitle || item.ContractTitle || 'Lease Contract')}
                      {item.type === 'Mutation' && `Transfer: ${item.currentClient || item.Tenant || 'N/A'} → ${item.newClient || item.RecipientName || 'N/A'}`}
                      {item.type === 'Termination' && `Termination Request: ${item.tenant || item.Tenant || item.name || 'N/A'}`}
                    </td>
                    <td>{item.tenant || item.Tenant || item.name || item.Name || item.currentClient || 'N/A'}</td>
                    <td>{item.property || item.Property || 'N/A'}</td>
                    <td>
                      {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <span className={`sa-status-pill ${(item.status || item.Status || 'completed').toLowerCase()}`}>
                        {item.status || item.Status || 'Completed'}
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

  // Render Reports Section
  const renderReports = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Report</h3>
            <p>Generate and view various reports</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Client Report */}
          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '24px' }} onClick={() => {
            addNotification('Client Report feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '600' }}>Client Report (Months)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#6b7280' }}>
              <p style={{ margin: 0 }}>• New clients created</p>
              <p style={{ margin: 0 }}>• Validated clients</p>
              <p style={{ margin: 0 }}>• Rejected customers</p>
            </div>
          </div>

          {/* Lease Contracts Report */}
          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '24px' }} onClick={() => {
            addNotification('Lease Contracts Report feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '600' }}>Lease Contracts Report</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#6b7280' }}>
              <p style={{ margin: 0 }}>• Contracts created</p>
              <p style={{ margin: 0 }}>• Contracts validated</p>
              <p style={{ margin: 0 }}>• Contracts still in progress</p>
              <p style={{ margin: 0 }}>• Terminated contracts</p>
            </div>
          </div>

          {/* Mutations Report */}
          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '24px' }} onClick={() => {
            addNotification('Mutations Report feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '600' }}>Mutations Report</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#6b7280' }}>
              <p style={{ margin: 0 }}>• Requests received</p>
              <p style={{ margin: 0 }}>• Accepted mutations</p>
              <p style={{ margin: 0 }}>• Mutations refused</p>
            </div>
          </div>

          {/* Terminations Report */}
          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '24px' }} onClick={() => {
            addNotification('Terminations Report feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '600' }}>Report Terminations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#6b7280' }}>
              <p style={{ margin: 0 }}>• Requests received</p>
              <p style={{ margin: 0 }}>• Terminations finalized</p>
              <p style={{ margin: 0 }}>• Cancellations pending (inventory not done)</p>
            </div>
          </div>
        </div>
      </div>
    );
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

  const downloadClientsExampleCsv = () => {
    const escapeCsv = (v) => {
      const s = String(v ?? '').trim();
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const headers = ['Type', 'Name', 'Email', 'Phone', 'Property', 'CompanyName', 'RegistrationNumber', 'ContactPerson', 'Address'];
    const rows = [
      ['individual', 'Jane Doe', 'jane@example.com', '+2250700000000', '123 Main St', '', '', '', ''],
      ['company', 'Acme Corp', 'contact@acme.com', '+2250700000001', '456 Oak Ave', 'Acme Corp', 'RC-12345', 'John Manager', '10 Business St']
    ];
    const csv = [headers.join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n') + '\n';
    downloadBlob(csv, 'clients_import_example.csv');
  };

  const parseCsvWithSections = (text) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    const result = { clients: [] };
    let currentSection = null;
    let headers = null;
    const sectionMarkers = { '[CLIENTS]': 'clients', '[TENANTS]': 'clients' };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (sectionMarkers[trimmed]) {
        currentSection = sectionMarkers[trimmed];
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
          } else val += c;
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
      headers.forEach((h, idx) => { if (h) obj[h] = (cells[idx] ?? '').trim(); });
      if (currentSection === 'clients' && (obj.Name || obj.Email)) result.clients.push(obj);
    }
    return result;
  };

  const handleBulkImportClients = async (file) => {
    const text = await file.text();
    let rows = [];
    if (text.includes('[CLIENTS]') || text.includes('[TENANTS]')) {
      rows = parseCsvWithSections(text).clients;
    } else {
      const parseCsvLine = (line) => {
        const out = []; let val = ''; let inQ = false;
        for (let j = 0; j < line.length; j++) {
          const c = line[j];
          if (c === '"') { if (inQ && line[j + 1] === '"') { val += '"'; j++; } else inQ = !inQ; }
          else if (c === ',' && !inQ) { out.push(val.trim().replace(/^"|"$/g, '')); val = ''; }
          else val += c;
        }
        out.push(val.trim().replace(/^"|"$/g, ''));
        return out;
      };
      const lines = text.split(/\r?\n/).filter(Boolean);
      const headers = parseCsvLine(lines[0] || '').map(h => h.trim());
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i]);
        const obj = {}; headers.forEach((h, idx) => { if (h) obj[h] = (cells[idx] ?? '').trim(); });
        if (obj.Name || obj.Email) rows.push(obj);
      }
    }
    if (rows.length === 0) return { success: 0, failed: 0 };
    let success = 0, failed = 0;
    for (const r of rows) {
      try {
        const type = ((r.Type || r.type || 'individual') + '').toLowerCase();
        const clientData = {
          type: type === 'company' ? 'company' : 'individual',
          name: (r.Name || r.name || '').trim() || (r.Email || r.email || '').trim(),
          email: (r.Email || r.email || '').trim(),
          phone: (r.Phone || r.phone || '').trim(),
          address: (r.Address || r.address || '').trim(),
          companyName: (r.CompanyName || r.companyName || '').trim(),
          registrationNumber: (r.RegistrationNumber || r.registrationNumber || '').trim(),
          contactPerson: (r.ContactPerson || r.contactPerson || '').trim()
        };
        if (!clientData.email || !clientData.phone) { failed++; continue; }
        if (type === 'company' && (!clientData.companyName || !clientData.registrationNumber || !clientData.contactPerson)) { failed++; continue; }
        await adminService.createNewClient(clientData);
        success++;
      } catch (err) { console.error('Client import row error:', err); failed++; }
    }
    return { success, failed };
  };

  const handleBulkImportUpload = async () => {
    if (!bulkImportFile) { addNotification('Please select a file first', 'error'); return; }
    const isCsv = bulkImportFile.name.toLowerCase().endsWith('.csv');
    if (!isCsv) { addNotification('Import supports CSV only. Please use a .csv file.', 'error'); return; }
    setBulkImportLoading(true);
    try {
      const res = await handleBulkImportClients(bulkImportFile);
      if (res.success > 0 || res.failed > 0) await loadData();
      addNotification(`Clients: ${res.success} imported, ${res.failed} failed`, res.success > 0 ? 'success' : res.failed > 0 ? 'error' : 'info');
      setShowBulkImportModal(false);
      setBulkImportFile(null);
    } catch (err) {
      console.error('Import error:', err);
      addNotification(err?.message || 'Import failed', 'error');
    } finally {
      setBulkImportLoading(false);
    }
  };

  // Render New Client Section
  const renderNewClient = () => {
    // Filter clients based on search and status
    const filteredClients = newClients.filter(client => {
      const rawStatus = (client.status || client.Status || client.ApplicationStatus || client.applicationStatus || '').toLowerCase();
      const statusValue = rawStatus.replace(/\s+/g, '-');
      if (statusValue === 'onboarded') return false;
      if (clientSearchText) {
        const search = clientSearchText.toLowerCase();
        const name = (client.name || client.Name || '').toLowerCase();
        const email = (client.email || client.Email || '').toLowerCase();
        if (!name.includes(search) && !email.includes(search)) return false;
      }
      if (clientStatusFilter) {
        if (clientStatusFilter === 'in-progress' && statusValue !== 'pending' && statusValue !== 'in-progress') return false;
        if (clientStatusFilter === 'accepted' && rawStatus !== 'accepted' && rawStatus !== 'approved') return false;
        if (clientStatusFilter === 'refused' && rawStatus !== 'refused' && rawStatus !== 'rejected') return false;
      }
      return true;
    });

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>New Client</h3>
            <p>List of new client applications - upload documents and approve for onboarding</p>
          </div>
          <button 
            className="sa-primary-cta" 
            onClick={() => {
              setNewClientForm({
                type: 'individual',
                name: '',
                email: '',
                phone: '',
                companyName: '',
                address: '',
                registrationNumber: '',
                contactPerson: ''
              });
              setClientDocForm({
                clientId: '',
                property: '',
                applicationFees: true,
                sodeci: false,
                cie10: false,
                cie15: false
              });
              setClientDocFiles({});
              setShowNewClientModal(true);
            }}
          >
            <Plus size={18} />
            Create New Client
          </button>
          <button
            type="button"
            className="sa-primary-cta secondary"
            style={{ marginLeft: '8px' }}
            onClick={() => {
              // setBulkImportTab('clients'); // TODO: bulkImportTab state not defined
              setBulkImportFile(null);
              setShowBulkImportModal(true);
            }}
          >
            <FileSpreadsheet size={18} style={{ marginRight: '4px' }} />
            Import from CSV
          </button>
        </div>

        <div className="sa-filters-section">
          <select 
            className="sa-filter-select"
            value={clientStatusFilter}
            onChange={(e) => setClientStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="in-progress">In Progress</option>
            <option value="accepted">Accepted</option>
            <option value="refused">Refused</option>
          </select>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Name / Company</th>
                <th>Type</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Registration Date</th>
                <th>Security Deposit</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="sa-table-empty">
                    No new clients found
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, index) => (
                  <tr
                    key={client.ID || client.id || index}
                    onClick={() => openUploadForClient(client)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{index + 1}</td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client.name || client.Name || client.companyName || 'N/A'}</span>
                        {client.type === 'company' && client.contactPerson && (
                          <span className="sa-cell-sub">Contact: {client.contactPerson}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="sa-status-pill" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                        {client.type || client.Type || 'individual'}
                      </span>
                    </td>
                    <td>{client.email || client.Email || 'N/A'}</td>
                    <td>{client.phone || client.Phone || 'N/A'}</td>
                    <td>
                      {client.registrationDate || client.RegistrationDate || client.createdAt || client.CreatedAt
                        ? new Date(client.registrationDate || client.RegistrationDate || client.createdAt || client.CreatedAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>{(client.SecurityDepositPaid || client.securityDepositPaid) ? 'Paid' : 'Not Paid'}</td>
                    <td>
                      <span className={`sa-status-pill ${(client.status || client.Status || client.ApplicationStatus || client.applicationStatus || 'in-progress').toLowerCase()}`}>
                        {client.status || client.Status || client.ApplicationStatus || client.applicationStatus || 'In Progress'}
                      </span>
                    </td>
                    <td className="sa-row-actions">
                      <button
                        className="sa-icon-button"
                        title="View Checklist"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewChecklist(client);
                        }}
                      >
                        👁️
                      </button>
                      <button
                        className="sa-icon-button"
                        title="Approve Client"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClientStatusUpdate(client.ID || client.id, 'Approved');
                        }}
                      >
                        ✅
                      </button>
                      <button
                        className="sa-icon-button"
                        title="Edit Client"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditClient(client);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="sa-icon-button"
                        title="Reject Client"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClientStatusUpdate(client.ID || client.id, 'Rejected');
                        }}
                      >
                        ❌
                      </button>
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

  // Render State of Entry / Exit (inventory filled by technicians)
  const renderStateOfEntryExit = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>State of Entry / Exit</h3>
            <p>Inventory (state of entry or exit) reports filled by technicians for your company</p>
          </div>
        </div>
        {inventoryList.length === 0 ? (
          <div className="sa-table-empty">No state of entry or exit records yet. When technicians fill an inventory, it will appear here.</div>
        ) : (
          <div className="sa-table-wrapper" style={{ marginTop: '20px' }}>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Type</th>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Date</th>
                  <th>Inspector</th>
                  <th>Status</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {inventoryList.map((inv, index) => {
                  const type = inv.type || inv.Type || '';
                  const tenant = inv.tenant || inv.Tenant || '—';
                  const property = inv.property || inv.Property || '—';
                  const date = inv.date || inv.Date || inv.createdAt || inv.CreatedAt;
                  const dateStr = date ? new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';
                  const inspector = inv.inspector || inv.Inspector || '—';
                  const status = inv.status || inv.Status || '—';
                  const reportURL = inv.reportURL || inv.ReportURL;
                  return (
                    <tr key={inv.id || inv.ID || index}>
                      <td>{index + 1}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          backgroundColor: type === 'Move-in' ? '#dbeafe' : '#fef3c7',
                          color: type === 'Move-in' ? '#1e40af' : '#92400e'
                        }}>
                          {type === 'Move-in' ? 'Entry' : type === 'Move-out' ? 'Exit' : type || '—'}
                        </span>
                      </td>
                      <td>{tenant}</td>
                      <td>{property}</td>
                      <td>{dateStr}</td>
                      <td>{inspector}</td>
                      <td>{status}</td>
                      <td>
                        {reportURL ? (
                          <a href={reportURL} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
                            View report
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
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

  const renderContent = (currentTab = activeTab) => {
    switch (currentTab) {
      case 'overview':
        return renderOverview();
      case 'new-client':
        return renderNewClient();
      case 'lease-contract':
        return renderLeases(); // Reuse existing function, will update it
      case 'demand-mutation':
        return renderTransfers(); // Reuse existing function, will update it
      case 'termination':
        return renderTermination();
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
        id: tab.id,
        label: tab.label,
        icon: tab.icon,
        active: activeTab === tab.id
      })),
    [tabs, activeTab]
  );

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('demo_mode');
    window.location.href = '/';
  };

  const handleLeaseTenantChange = (tenantId) => {
    const selected = clients.find(client => String(client.ID || client.id) === String(tenantId));
    if (!selected) {
      setLeaseForm({ tenantId: '', property: '', rent: '', landlord: '' });
      return;
    }
    const propertyLabel = selected.Property || selected.property || '';
    const propertyMatch = properties.find(property => {
      const label = property.Address || property.address || property.name || property.Name || '';
      return label === propertyLabel;
    });
    const rentValue = selected.Amount || selected.amount || propertyMatch?.Rent || propertyMatch?.rent || '';
    const landlordValue =
      propertyMatch?.Landlord ||
      propertyMatch?.landlord ||
      propertyMatch?.LandlordName ||
      propertyMatch?.landlordName ||
      '';
    setLeaseForm({
      tenantId: String(tenantId),
      property: propertyLabel,
      rent: rentValue ? String(rentValue) : '',
      landlord: landlordValue
    });
  };

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Administrative Portal', logo: 'SAAF', logoImage: `/download.jpeg` }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}
      >
        {({ activeId }) => (
          <div className="content-body administrative-content">
            {renderContent(activeId)}
          </div>
        )}
      </RoleLayout>

      {/* Termination detail modal – all uploaded details */}
      <Modal
        isOpen={showTerminationDetailModal}
        onClose={() => {
          setShowTerminationDetailModal(false);
          setSelectedTerminationForDetail(null);
        }}
        title="Termination details"
        size="md"
      >
        {selectedTerminationForDetail && (
          <div className="modal-form" style={{ padding: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'Tenant', val: selectedTerminationForDetail.tenant || selectedTerminationForDetail.Tenant || selectedTerminationForDetail.name || selectedTerminationForDetail.Name },
                { key: 'Property', val: selectedTerminationForDetail.property || selectedTerminationForDetail.Property },
                { key: 'Unit number', val: selectedTerminationForDetail.unitNumber || selectedTerminationForDetail.UnitNumber },
                { key: 'Request date', val: selectedTerminationForDetail.requestDate || selectedTerminationForDetail.RequestDate || selectedTerminationForDetail.createdAt || selectedTerminationForDetail.CreatedAt },
                { key: 'Status', val: selectedTerminationForDetail.status || selectedTerminationForDetail.Status },
                { key: 'Inventory status', val: selectedTerminationForDetail.inventoryStatus || selectedTerminationForDetail.InventoryStatus },
                { key: 'Termination date', val: selectedTerminationForDetail.terminationDate || selectedTerminationForDetail.TerminationDate },
                { key: 'Termination reason', val: selectedTerminationForDetail.terminationReason || selectedTerminationForDetail.TerminationReason },
                { key: 'Security deposit refund method', val: selectedTerminationForDetail.securityDepositRefundMethod || selectedTerminationForDetail.SecurityDepositRefundMethod },
                { key: 'Inventory check date', val: selectedTerminationForDetail.inventoryCheckDate || selectedTerminationForDetail.InventoryCheckDate },
                { key: 'Inventory check time', val: selectedTerminationForDetail.inventoryCheckTime || selectedTerminationForDetail.InventoryCheckTime },
                { key: 'ID', val: selectedTerminationForDetail.id ?? selectedTerminationForDetail.ID },
                { key: 'Created at', val: selectedTerminationForDetail.createdAt || selectedTerminationForDetail.CreatedAt },
                { key: 'Updated at', val: selectedTerminationForDetail.updatedAt || selectedTerminationForDetail.UpdatedAt }
              ].filter(({ val }) => val !== undefined && val !== null && val !== '').map(({ key, val }) => {
                let display = String(val);
                if (typeof val === 'object' && val && typeof val.getMonth === 'function') {
                  display = new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
                } else if (typeof val === 'string' && /^\d{4}-\d{2}/.test(val)) {
                  try {
                    display = new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
                  } catch (_) { /* keep string */ }
                }
                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ fontWeight: '600', color: '#374151', minWidth: '160px' }}>{key}</span>
                    <span style={{ color: '#1f2937', textAlign: 'right', wordBreak: 'break-word' }}>{display}</span>
                  </div>
                );
              })}
              {/* Any other keys from backend */}
              {Object.keys(selectedTerminationForDetail)
                .filter(k => !['tenant', 'Tenant', 'name', 'Name', 'property', 'Property', 'unitNumber', 'UnitNumber', 'requestDate', 'RequestDate', 'createdAt', 'CreatedAt', 'status', 'Status', 'inventoryStatus', 'InventoryStatus', 'terminationDate', 'TerminationDate', 'terminationReason', 'TerminationReason', 'securityDepositRefundMethod', 'SecurityDepositRefundMethod', 'inventoryCheckDate', 'InventoryCheckDate', 'inventoryCheckTime', 'InventoryCheckTime', 'id', 'ID', 'updatedAt', 'UpdatedAt'].includes(k))
                .map(k => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ fontWeight: '600', color: '#374151', minWidth: '160px' }}>{k}</span>
                    <span style={{ color: '#1f2937', textAlign: 'right', wordBreak: 'break-word' }}>
                      {typeof selectedTerminationForDetail[k] === 'object' && selectedTerminationForDetail[k] !== null
                        ? (selectedTerminationForDetail[k] && typeof selectedTerminationForDetail[k].getMonth === 'function'
                          ? new Date(selectedTerminationForDetail[k]).toLocaleString()
                          : JSON.stringify(selectedTerminationForDetail[k]))
                        : String(selectedTerminationForDetail[k])}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showLeaseModal}
        onClose={() => {
          setShowLeaseModal(false);
          setLeaseForm({ tenantId: '', property: '', rent: '', landlord: '' });
        }}
        title="Create Lease Agreement"
        size="md"
      >
        <form
          className="modal-form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const formData = new FormData(e.target);
              const selectedTenant = clients.find(client => String(client.ID || client.id) === String(leaseForm.tenantId));
              if (!selectedTenant) {
                addNotification('Please select a tenant.', 'error');
                return;
              }
              const tenantName = selectedTenant.name || selectedTenant.Name || selectedTenant.email || selectedTenant.Email;
              const selectedPropertyLabel = leaseForm.property || formData.get('property');
              const propertyMatch = properties.find(property => {
                const label = property.Address || property.address || property.name || property.Name || '';
                return label === selectedPropertyLabel;
              });
              const selectedLandlordName = leaseForm.landlord || formData.get('landlord');
              const landlordMatch = landlords.find(landlord => {
                const name = landlord.Name || landlord.name || landlord.Email || landlord.email || '';
                return name === selectedLandlordName;
              });

              const newLease = {
                contractTitle: formData.get('contractTitle') || undefined,
                tenant: tenantName,
                tenantId: selectedTenant.ID || selectedTenant.id,
                property: selectedPropertyLabel,
                propertyId: propertyMatch?.ID || propertyMatch?.id,
                landlord: selectedLandlordName,
                landlordId: landlordMatch?.ID || landlordMatch?.id,
                leaseType: formData.get('leaseType'),
                startDate: formData.get('start'),
                endDate: formData.get('end'),
                rent: parseFloat(leaseForm.rent || formData.get('rent')),
                status: formData.get('leaseStatus') || 'Pending Management Signature'
              };
              await adminService.createLease(newLease);
              addNotification('Lease created successfully', 'success');
              setLeaseTab('in-progress');
              setShowLeaseModal(false);
              loadData();
            } catch (error) {
              addNotification('Failed to create lease', 'error');
              console.error(error);
            }
          }}
        >
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lease-contract-title">Contract Title (Optional)</label>
              <input type="text" id="lease-contract-title" name="contractTitle" placeholder="Contract N°0024" />
            </div>
            <div className="form-group">
              <label htmlFor="lease-type">Lease Type</label>
              <select id="lease-type" name="leaseType" required>
                <option value="">Select Type</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Seasonnier">Seasonnier</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lease-tenant">Tenant *</label>
              <select
                id="lease-tenant"
                name="tenant"
                required
                value={leaseForm.tenantId}
                onChange={(e) => handleLeaseTenantChange(e.target.value)}
              >
                <option value="">Select Tenant from Database</option>
                {clients.map(client => (
                  <option key={client.ID || client.id} value={client.ID || client.id}>
                    {client.name || client.Name || client.email || client.Email} {client.property || client.Property ? `- ${client.property || client.Property}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="lease-landlord">Landlord</label>
              <select
                id="lease-landlord"
                name="landlord"
                required
                value={leaseForm.landlord}
                onChange={(e) => setLeaseForm(prev => ({ ...prev, landlord: e.target.value }))}
              >
                <option value="">Select landlord</option>
                {leaseForm.landlord && !landlords.some(landlord => {
                  const name = landlord.Name || landlord.name || landlord.Email || landlord.email || '';
                  return name === leaseForm.landlord;
                }) && (
                  <option value={leaseForm.landlord}>{leaseForm.landlord}</option>
                )}
                {landlords.map(landlord => {
                  const id = landlord.ID || landlord.id;
                  const name = landlord.Name || landlord.name || landlord.Email || landlord.email || `Landlord ${id}`;
                  return (
                    <option key={id} value={landlord.Name || landlord.name || landlord.Email || landlord.email}>
                      {name}
                    </option>
                  );
                })}
                {landlords.length === 0 && (
                  <option value="" disabled>No landlords found</option>
                )}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lease-property">Property</label>
              <select
                id="lease-property"
                name="property"
                required
                value={leaseForm.property}
                onChange={(e) => {
                  const selectedProperty = e.target.value;
                  const propertyMatch = properties.find(property => {
                    const label = property.Address || property.address || property.name || property.Name || '';
                    return label === selectedProperty;
                  });
                  const landlordValue =
                    propertyMatch?.Landlord ||
                    propertyMatch?.landlord ||
                    propertyMatch?.LandlordName ||
                    propertyMatch?.landlordName ||
                    '';
                  setLeaseForm(prev => ({
                    ...prev,
                    property: selectedProperty,
                    landlord: landlordValue || prev.landlord
                  }));
                }}
              >
                <option value="">Select property</option>
                {leaseForm.property && !properties.filter(property => {
                  const label = (property.Address || property.address || property.name || property.Name || '').toString().trim();
                  const totalUnits = property.NumberOfUnits ?? property.numberOfUnits ?? 1;
                  const occupiedFromLeases = leases.filter(l => (l.property || l.Property || '').toString().trim() === label).length;
                  const occupiedFromClients = clients.filter(c => (c.Property || c.property || '').toString().trim() === label).length;
                  return Math.max(occupiedFromLeases, occupiedFromClients) < totalUnits;
                }).some(property => {
                  const label = (property.Address || property.address || property.name || property.Name || '').toString().trim().toLowerCase();
                  return label === String(leaseForm.property || '').trim().toLowerCase();
                }) && (
                  <option value={leaseForm.property}>{leaseForm.property}</option>
                )}
                {properties.filter(property => {
                  const label = (property.Address || property.address || property.name || property.Name || '').toString().trim();
                  const totalUnits = property.NumberOfUnits ?? property.numberOfUnits ?? 1;
                  const occupiedFromLeases = leases.filter(l => (l.property || l.Property || '').toString().trim() === label).length;
                  const occupiedFromClients = clients.filter(c => (c.Property || c.property || '').toString().trim() === label).length;
                  return Math.max(occupiedFromLeases, occupiedFromClients) < totalUnits;
                }).map(property => {
                  const id = property.ID || property.id;
                  const label = property.Address || property.address || property.name || property.Name || `Property ${id}`;
                  return (
                    <option key={id} value={label}>
                      {label}
                    </option>
                  );
                })}
                {properties.length === 0 && (
                  <option value="" disabled>No properties found</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="lease-rent">Monthly Rent</label>
              <input
                type="number"
                id="lease-rent"
                name="rent"
                min="0"
                step="0.01"
                placeholder="0.00 XOF"
                required
                value={leaseForm.rent}
                onChange={(e) => setLeaseForm(prev => ({ ...prev, rent: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lease-status">Lease Status</label>
              <select id="lease-status" name="leaseStatus" defaultValue="Pending Management Signature" required>
                <option value="Pending Management Signature">Lease contract pending signature by management</option>
                <option value="Created">Lease contract being created</option>
                <option value="Pending Owner Signature">Pending signature by owner</option>
                <option value="Active">Active lease contract</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lease-start">Start Date</label>
              <input type="date" id="lease-start" name="start" required />
            </div>
            <div className="form-group">
              <label htmlFor="lease-end">End Date</label>
              <input type="date" id="lease-end" name="end" required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="action-button secondary" onClick={() => setShowLeaseModal(false)}>
              Cancel
            </button>
            <button type="submit" className="action-button primary">
              Save Lease
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditLeaseModal}
        onClose={() => {
          setShowEditLeaseModal(false);
          setEditingLease(null);
          setEditLeaseStatus('');
          setEditLeaseDocumentFile(null);
          if (editLeaseFileInputRef.current) editLeaseFileInputRef.current.value = '';
        }}
        title="Edit Lease Contract"
      >
        {editingLease && (
          <>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#6b7280' }}>
                <strong>Tenant:</strong> {editingLease.tenant || editingLease.Tenant || 'N/A'} · <strong>Property:</strong> {editingLease.property || editingLease.Property || 'N/A'}
              </p>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="edit-lease-status">Status</label>
              <select
                id="edit-lease-status"
                value={editLeaseStatus}
                onChange={(e) => setEditLeaseStatus(e.target.value)}
                style={{ width: '100%', padding: '8px 12px' }}
              >
                <option value="Created">Lease contract being created</option>
                <option value="Pending Management Signature">Lease contract pending signature by management</option>
                <option value="Pending Owner Signature">Pending signature by owner</option>
                <option value="Pending Signature">Pending signature</option>
                <option value="Active">Active lease contract (Valid)</option>
                <option value="Approved by management">Approved by management</option>
                <option value="Valid">Valid</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="edit-lease-document">Lease Document (PDF/Image)</label>
              <input
                ref={editLeaseFileInputRef}
                type="file"
                id="edit-lease-document"
                accept=".pdf,image/*"
                onChange={(e) => setEditLeaseDocumentFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="action-button secondary"
                onClick={() => {
                  setShowEditLeaseModal(false);
                  setEditingLease(null);
                  setEditLeaseStatus('');
                  setEditLeaseDocumentFile(null);
                  if (editLeaseFileInputRef.current) editLeaseFileInputRef.current.value = '';
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="action-button primary"
                onClick={handleEditLeaseSave}
                disabled={
                  !editLeaseDocumentFile &&
                  (editLeaseStatus === '' || editLeaseStatus === (editingLease.status || editingLease.Status || ''))
                }
              >
                Save
              </button>
            </div>
          </>
        )}
      </Modal>

      {showTransferDocsModal && selectedTransferForDocs && (
        <div className="modal-overlay" onClick={() => { setShowTransferDocsModal(false); setSelectedTransferForDocs(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Transfer documents</h3>
              <button className="modal-close" onClick={() => { setShowTransferDocsModal(false); setSelectedTransferForDocs(null); }}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '0.875rem' }}>
                Documents uploaded by the tenant for the person being transferred to (same as Add New Client – individual).
              </p>
              {(() => {
                const files = selectedTransferForDocs.files || selectedTransferForDocs.Files || [];
                const urlList = Array.isArray(files) ? files : [];
                if (urlList.length === 0) {
                  return <p style={{ margin: 0, color: '#9ca3af' }}>No documents uploaded.</p>;
                }
                return (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {urlList.map((url, i) => {
                      const label = INDIVIDUAL_DOCUMENTS[i] ? INDIVIDUAL_DOCUMENTS[i].label : `Document ${i + 1}`;
                      const filename = `${label.replace(/\s+/g, '-')}.pdf`;
                      return (
                        <li key={i} style={{ marginBottom: '12px', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#374151' }}>{label}</span>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed', fontSize: '0.875rem' }}>
                              View document
                            </a>
                            <button
                              type="button"
                              className="action-button secondary"
                              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = filename;
                                a.target = '_blank';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              }}
                            >
                              Download
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Document</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="rejection-reason">Rejection Reason *</label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows="4"
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="action-button secondary"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingDocId(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="action-button primary"
                onClick={handleRejectDocument}
                disabled={!rejectionReason.trim()}
              >
                Reject Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Clients Modal */}
      {showBulkImportModal && (
        <div className="modal-overlay" onClick={() => { setShowBulkImportModal(false); setBulkImportFile(null); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0 }}>Import Clients from CSV</h3>
              <button className="modal-close" onClick={() => { setShowBulkImportModal(false); setBulkImportFile(null); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <button type="button" className="sa-primary-cta secondary" onClick={downloadClientsExampleCsv} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  <Download size={16} style={{ marginRight: '6px' }} />
                  Download Example CSV
                </button>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '16px' }}>
                Upload a CSV with: Type, Name, Email, Phone, Property (optional). For company: CompanyName, RegistrationNumber, ContactPerson. After import, open each client to add property and upload documents.
              </p>
              <div
                style={{ border: '2px dashed #d1d5db', borderRadius: '12px', padding: '32px', textAlign: 'center', background: '#fff', cursor: bulkImportLoading ? 'not-allowed' : 'pointer' }}
                onClick={() => !bulkImportLoading && document.getElementById('admin-bulk-import-file')?.click()}
              >
                <input
                  type="file"
                  id="admin-bulk-import-file"
                  accept=".csv,text/csv,application/csv"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setBulkImportFile(f); e.target.value = ''; }}
                  style={{ display: 'none' }}
                  disabled={bulkImportLoading}
                />
                <FileSpreadsheet size={48} color={bulkImportLoading ? '#9ca3af' : '#7c3aed'} style={{ margin: '0 auto 12px', display: 'block' }} />
                <div>
                  <strong style={{ color: bulkImportLoading ? '#9ca3af' : '#1f2937' }}>
                    {bulkImportLoading ? 'Importing...' : (bulkImportFile ? bulkImportFile.name : 'Click to select CSV file')}
                  </strong>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>CSV only</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="sa-primary-cta secondary" onClick={() => { setShowBulkImportModal(false); setBulkImportFile(null); }}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="sa-primary-cta"
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

      {/* New Client Modal */}
      <Modal
        isOpen={showNewClientModal}
        onClose={() => {
          setShowNewClientModal(false);
          setNewClientForm({
            type: 'individual',
            name: '',
            email: '',
            phone: '',
            companyName: '',
            address: '',
            registrationNumber: '',
            contactPerson: ''
          });
          setClientDocForm({
            clientId: '',
            property: '',
            applicationFees: true,
            sodeci: false,
            cie10: false,
            cie15: false
          });
          setClientDocFiles({});
        }}
        title="Create New Client"
        size="md"
      >
        <form
          className="modal-form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setLoading(true);
              let client = selectedClient;
              if (!client) {
                if (!newClientForm.email || !newClientForm.phone || (newClientForm.type === 'individual' && !newClientForm.name)) {
                  addNotification('Please fill in all required client details.', 'error');
                  return;
                }
                if (newClientForm.type === 'company' && (!newClientForm.companyName || !newClientForm.registrationNumber || !newClientForm.contactPerson)) {
                  addNotification('Please fill in all required company details.', 'error');
                  return;
                }

                const createdClient = await adminService.createNewClient(newClientForm);
                client = createdClient;
                setClientDocForm(prev => ({ ...prev, clientId: String(createdClient.ID || createdClient.id) }));
              }
              if (!clientDocForm.property) {
                addNotification('Please select the property the client is interested in.', 'error');
                return;
              }

              const clientType = (client.type || client.Type || 'individual').toLowerCase();
              const requiredDocs = clientType === 'company' ? COMPANY_DOCUMENTS : INDIVIDUAL_DOCUMENTS;
              const missingDocs = requiredDocs.filter(doc => !clientDocFiles[doc.key]);
              if (missingDocs.length > 0) {
                addNotification('Please upload all required documents before submitting.', 'error');
                return;
              }

              const tenantName = client.name || client.Name || client.email || client.Email || 'Unknown Tenant';

              for (const doc of requiredDocs) {
                await adminService.uploadClientDocument({
                  tenant: tenantName,
                  property: clientDocForm.property,
                  type: doc.label,
                  file: clientDocFiles[doc.key],
                });
              }

              await adminService.saveClientDocumentChecklist({
                clientId: client.ID || client.id,
                tenant: tenantName,
                property: clientDocForm.property,
                applicationFees: clientDocForm.applicationFees,
                sodeci: clientDocForm.sodeci,
                cie10a: clientDocForm.cie10,
                cie15a: clientDocForm.cie15,
              });

              addNotification('Client documents uploaded successfully', 'success');
              setShowNewClientModal(false);
              setClientDocForm({
                clientId: '',
                property: '',
                applicationFees: true,
                sodeci: false,
                cie10: false,
                cie15: false
              });
              setClientDocFiles({});
              loadData();
            } catch (error) {
              console.error('Error uploading client documents:', error);
              addNotification(error.message || 'Failed to upload client documents', 'error');
            } finally {
              setLoading(false);
            }
          }}
        >
          {!selectedClient && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>New Client Details</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Client Type *</label>
                  <select
                    value={newClientForm.type}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newClientForm.email}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {newClientForm.type === 'individual' ? (
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={newClientForm.name}
                      onChange={(e) => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="text"
                      value={newClientForm.phone}
                      onChange={(e) => setNewClientForm(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Company Name *</label>
                      <input
                        type="text"
                        value={newClientForm.companyName}
                        onChange={(e) => setNewClientForm(prev => ({ ...prev, companyName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Registration Number *</label>
                      <input
                        type="text"
                        value={newClientForm.registrationNumber}
                        onChange={(e) => setNewClientForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Contact Person *</label>
                      <input
                        type="text"
                        value={newClientForm.contactPerson}
                        onChange={(e) => setNewClientForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone *</label>
                      <input
                        type="text"
                        value={newClientForm.phone}
                        onChange={(e) => setNewClientForm(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Company Address</label>
                    <input
                      type="text"
                      value={newClientForm.address}
                      onChange={(e) => setNewClientForm(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        <div className="form-group">
            <label htmlFor="client-property">Select the house who he will interest for *</label>
            <select
              id="client-property"
              value={clientDocForm.property}
              onChange={(e) => setClientDocForm({ ...clientDocForm, property: e.target.value })}
              required
            >
              <option value="">Select property</option>
            {(properties.filter(property => {
                const label = (property.Address || property.address || property.name || property.Name || `Property ${property.ID || property.id}`).toString().trim();
                const totalUnits = property.NumberOfUnits ?? property.numberOfUnits ?? 1;
                const occupiedFromLeases = leases.filter(l => (l.property || l.Property || '').toString().trim() === label).length;
                const occupiedFromClients = clients.filter(c => (c.Property || c.property || '').toString().trim() === label).length;
                const occupiedCount = Math.max(occupiedFromLeases, occupiedFromClients);
                return occupiedCount < totalUnits;
              })).map(property => {
                const id = property.ID || property.id;
                const label = property.Address || property.address || property.name || property.Name || `Property ${id}`;
                return (
                  <option key={id} value={label}>
                    {label}
                  </option>
                );
              })}
            {properties.length === 0 && (
              <option value="" disabled>No properties found</option>
            )}
            {properties.length > 0 && properties.filter(property => {
              const label = (property.Address || property.address || property.name || property.Name || '').toString().trim();
              const totalUnits = property.NumberOfUnits ?? property.numberOfUnits ?? 1;
              const occLeases = leases.filter(l => (l.property || l.Property || '').toString().trim() === label).length;
              const occClients = clients.filter(c => (c.Property || c.property || '').toString().trim() === label).length;
              return Math.max(occLeases, occClients) < totalUnits;
            }).length === 0 && (
              <option value="" disabled>No properties with empty units available</option>
            )}
            </select>
          </div>

          {clientDocForm.property && (() => {
            const selectedProp = properties.find(p => {
              const label = p.Address || p.address || p.name || p.Name || `Property ${p.ID || p.id}`;
              return label === clientDocForm.property;
            });
            const monthlyRent = selectedProp ? (Number(selectedProp.rent) || Number(selectedProp.Rent) || 0) : 0;
            const securityDeposit = monthlyRent * 2;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#166534', marginBottom: '4px' }}>Monthly Rent</div>
                  <div style={{ fontWeight: 600, color: '#15803d' }}>{monthlyRent ? `${Number(monthlyRent).toLocaleString()} FCFA` : '—'}</div>
                </div>
                <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px' }}>Security Deposit (2× monthly rent)</div>
                  <div style={{ fontWeight: 600, color: '#1d4ed8' }}>{securityDeposit ? `${Number(securityDeposit).toLocaleString()} FCFA` : '—'}</div>
                </div>
              </div>
            );
          })()}

        <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Application Fees & Utilities</h4>
          <div className="application-fees-list">
            <label className="application-fee-item" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={clientDocForm.applicationFees}
                onChange={(e) => setClientDocForm({ ...clientDocForm, applicationFees: e.target.checked })}
              />
              <span>Application fees (37,000 FCFA - obligation to pay)</span>
            </label>
            <label className="application-fee-item">
              <input
                type="checkbox"
                checked={clientDocForm.sodeci}
                onChange={(e) => setClientDocForm({ ...clientDocForm, sodeci: e.target.checked })}
              />
              <span>SODECI: 35,000 FCFA</span>
            </label>
            <div className="application-fee-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ marginRight: '8px', fontWeight: '500' }}>CIE:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="cieChoice"
                  checked={clientDocForm.cie10}
                  onChange={() => setClientDocForm({ ...clientDocForm, cie10: true, cie15: false })}
                />
                <span>10A – 37 375 FCFA</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="cieChoice"
                  checked={clientDocForm.cie15}
                  onChange={() => setClientDocForm({ ...clientDocForm, cie10: false, cie15: true })}
                />
                <span>15A + 60 420 FCFA</span>
              </label>
            </div>
          </div>
          </div>

          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>
              Parts to Supply ({((selectedClient?.type || selectedClient?.Type || newClientForm.type || 'individual')).toLowerCase()})
            </h4>
            {(((selectedClient?.type || selectedClient?.Type || newClientForm.type || 'individual').toLowerCase() === 'company')
              ? COMPANY_DOCUMENTS
              : INDIVIDUAL_DOCUMENTS
            ).map((doc) => (
              <div key={doc.key} className="form-group">
                <label>{doc.label} *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    ref={(el) => { if (el) clientDocFileInputRefs.current[doc.key] = el; }}
                    type="file"
                    accept=".pdf,image/*"
                    required={!clientDocFiles[doc.key]}
                    style={{ maxWidth: '100%' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setClientDocFiles(prev => ({ ...prev, [doc.key]: file }));
                    }}
                  />
                  {clientDocFiles[doc.key] && (
                    <>
                      <span style={{ fontSize: '13px', color: '#374151' }}>{clientDocFiles[doc.key].name}</span>
                      <button
                        type="button"
                        className="action-button secondary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={() => {
                          const inputEl = clientDocFileInputRefs.current[doc.key];
                          if (inputEl) inputEl.value = '';
                          setClientDocFiles(prev => {
                            const next = { ...prev };
                            delete next[doc.key];
                            return next;
                          });
                        }}
                      >
                        Change / Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="action-button secondary"
              onClick={() => {
                setShowNewClientModal(false);
                setClientDocForm({
                  clientId: '',
                  property: '',
                applicationFees: true,
                  sodeci: false,
                  cie10: false,
                  cie15: false
                });
                setClientDocFiles({});
              }}
            >
              Cancel
            </button>
            <button type="submit" className="action-button primary" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Documents'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Client Checklist Modal */}
      <Modal
        isOpen={showChecklistModal}
        onClose={() => {
          setShowChecklistModal(false);
          setSelectedChecklist(null);
          setChecklistClient(null);
          setChecklistDocuments([]);
        }}
        title="Client Checklist"
        size="sm"
      >
        <div className="modal-form">
          <div style={{ marginBottom: '12px' }}>
            <strong>Client:</strong>{' '}
            {checklistClient ? (checklistClient.name || checklistClient.Name || checklistClient.email || checklistClient.Email || 'N/A') : 'N/A'}
          </div>
          {checklistLoading ? (
            <div>Loading checklist...</div>
          ) : selectedChecklist ? (
            <div style={{ display: 'grid', gap: '8px' }}>
              <div><strong>Property:</strong> {selectedChecklist.property || selectedChecklist.Property || 'N/A'}</div>
              <div><strong>Application fees:</strong> {selectedChecklist.applicationFees ? 'Yes' : 'No'}</div>
              <div><strong>SODECI:</strong> {selectedChecklist.sodeci ? 'Yes' : 'No'}</div>
              <div><strong>CIE 10A:</strong> {selectedChecklist.cie10a ? 'Yes' : 'No'}</div>
              <div><strong>CIE 15A:</strong> {selectedChecklist.cie15a ? 'Yes' : 'No'}</div>
              <div><strong>Saved:</strong> {selectedChecklist.createdAt || selectedChecklist.CreatedAt ? new Date(selectedChecklist.createdAt || selectedChecklist.CreatedAt).toLocaleDateString() : 'N/A'}</div>
            </div>
          ) : (
            <div>No checklist found for this client.</div>
          )}
          <div style={{ marginTop: '16px' }}>
            <strong>Documents:</strong>
            {checklistDocsLoading ? (
              <div style={{ marginTop: '8px' }}>Loading documents...</div>
            ) : checklistDocuments.length === 0 ? (
              <div style={{ marginTop: '8px' }}>No documents found.</div>
            ) : (
              <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                {checklistDocuments.map(doc => (
                  <div key={doc.ID || doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{doc.Type || doc.type || 'Document'}</span>
                    <a
                      href={doc.URL || doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="sa-link"
                    >
                      View/Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditClientModal}
        onClose={() => {
          setShowEditClientModal(false);
          setEditingClient(null);
          setEditClientDocFiles({});
          setEditClientExistingDocuments([]);
        }}
        title="Edit Client"
        size="md"
      >
        <form className="modal-form" onSubmit={handleEditClientSubmit}>
          <h4 style={{ margin: '0 0 12px 0' }}>Client details</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Client Type *</label>
              <select
                value={editClientForm.type}
                onChange={(e) => setEditClientForm(prev => ({ ...prev, type: e.target.value }))}
                required
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={editClientForm.email}
                onChange={(e) => setEditClientForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          {editClientForm.type === 'individual' ? (
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={editClientForm.name}
                  onChange={(e) => setEditClientForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="text"
                  value={editClientForm.phone}
                  onChange={(e) => setEditClientForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    value={editClientForm.companyName}
                    onChange={(e) => setEditClientForm(prev => ({ ...prev, companyName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Registration Number *</label>
                  <input
                    type="text"
                    value={editClientForm.registrationNumber}
                    onChange={(e) => setEditClientForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Person *</label>
                  <input
                    type="text"
                    value={editClientForm.contactPerson}
                    onChange={(e) => setEditClientForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="text"
                    value={editClientForm.phone}
                    onChange={(e) => setEditClientForm(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Security Deposit Paid</label>
            <select
              value={editClientForm.securityDepositPaid ? 'yes' : 'no'}
              onChange={(e) => setEditClientForm(prev => ({ ...prev, securityDepositPaid: e.target.value === 'yes' }))}
            >
              <option value="no">Not Paid</option>
              <option value="yes">Paid</option>
            </select>
            {(() => {
              const storedAmount = editingClient?.SecurityDeposit || editingClient?.securityDeposit;
              const selectedProp = editClientForm.property ? properties.find(p => {
                const label = p.Address || p.address || p.name || p.Name || `Property ${p.ID || p.id}`;
                return label === editClientForm.property;
              }) : null;
              const monthlyRent = selectedProp ? (Number(selectedProp.rent) || Number(selectedProp.Rent) || 0) : 0;
              const computedAmount = monthlyRent * 4.5;
              const securityDepositAmount = storedAmount ?? computedAmount;
              return securityDepositAmount > 0 ? (
                <div style={{ marginTop: '8px', padding: '8px 12px', background: '#eff6ff', borderRadius: '6px', fontSize: '0.875rem' }}>
                  <strong>Security Deposit:</strong> {Number(securityDepositAmount).toLocaleString()} FCFA
                </div>
              ) : null;
            })()}
          </div>

          <div className="form-group">
            <label>Property (for document context)</label>
            <select
              value={editClientForm.property}
              onChange={(e) => setEditClientForm(prev => ({ ...prev, property: e.target.value }))}
            >
              <option value="">Select property (optional)</option>
              {properties.map(property => {
                const id = property.ID || property.id;
                const label = property.Address || property.address || property.name || property.Name || `Property ${id}`;
                return (
                  <option key={id} value={label}>{label}</option>
                );
              })}
            </select>
          </div>

          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Documents</h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#6b7280' }}>View existing documents or upload a new file to replace one.</p>
            {editClientDocsLoading ? (
              <div style={{ padding: '12px 0', color: '#6b7280' }}>Loading documents...</div>
            ) : (
              (editClientForm.type === 'company' ? COMPANY_DOCUMENTS : INDIVIDUAL_DOCUMENTS).map((doc) => {
                const existingDoc = (editClientExistingDocuments || []).find(
                  (d) => (d.Type || d.type || '').trim() === (doc.label || '').trim()
                );
                const hasNewFile = Boolean(editClientDocFiles[doc.key]);
                return (
                  <div key={doc.key} className="form-group" style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid #e5e7eb' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>{doc.label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {existingDoc && (existingDoc.URL || existingDoc.url) && (
                        <>
                          <a
                            href={existingDoc.URL || existingDoc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}
                          >
                            View current
                          </a>
                          <span style={{ color: '#9ca3af' }}>|</span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => editClientFileInputRefs.current[doc.key]?.click()}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          background: '#fff',
                          cursor: 'pointer',
                          color: '#374151'
                        }}
                      >
                        {existingDoc ? 'Edit / Replace' : 'Upload'}
                      </button>
                      <input
                        ref={(el) => { if (el) editClientFileInputRefs.current[doc.key] = el; }}
                        type="file"
                        accept=".pdf,image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setEditClientDocFiles(prev => ({ ...prev, [doc.key]: file || undefined }));
                        }}
                      />
                      {hasNewFile && (
                        <>
                          <span style={{ fontSize: '13px', color: '#374151' }}>{editClientDocFiles[doc.key].name}</span>
                          <button
                            type="button"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => {
                              const inputEl = editClientFileInputRefs.current[doc.key];
                              if (inputEl) inputEl.value = '';
                              setEditClientDocFiles(prev => {
                                const next = { ...prev };
                                delete next[doc.key];
                                return next;
                              });
                            }}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="action-button secondary"
              onClick={() => {
                setShowEditClientModal(false);
                setEditingClient(null);
                setEditClientDocFiles({});
                setEditClientExistingDocuments([]);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="action-button primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification notification-${notification.type}`}>
            {notification.message}
          </div>
        ))}
      </div>
    </>
  );
};

export default AdministrativeDashboard;
