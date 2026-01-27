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
  Building2
} from 'lucide-react';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import Modal from '../components/Modal';
import '../components/RoleLayout.css';
import './AdministrativeDashboard.css';
import { adminService } from '../services/adminService';
import { messagingService } from '../services/messagingService';
import { API_CONFIG } from '../config/api';
import { isDemoMode, getAdministrativeDemoData } from '../utils/demoData';
import { t, getLanguage } from '../utils/i18n';

const AdministrativeDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
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
  const [visits, setVisits] = useState([]); // Visits data
  const [negotiations, setNegotiations] = useState([]); // Negotiations data
  const [transfers, setTransfers] = useState([]); // Transfer requests
  const [transferTab, setTransferTab] = useState('pending'); // 'approved', 'pending', 'rejected'
  const [leaseTab, setLeaseTab] = useState('active'); // 'active', 'pending', 'expired'
  
  // New state for restructured sections
  const [newClients, setNewClients] = useState([]);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    type: 'individual', // 'individual' or 'company'
    name: '',
    email: '',
    phone: '',
    companyName: '',
    address: '',
    registrationNumber: '',
    contactPerson: ''
  });
  const [clientStatusFilter, setClientStatusFilter] = useState(''); // 'in-progress', 'accepted', 'refused'
  const [clientSearchText, setClientSearchText] = useState('');
  const [leaseSearchText, setLeaseSearchText] = useState('');
  const [mutationSearchText, setMutationSearchText] = useState('');
  const [mutationTab, setMutationTab] = useState('receipt'); // 'receipt', 'in-progress', 'accepted', 'refused'
  const [mutationBrotherTab, setMutationBrotherTab] = useState('receipt');
  const [terminations, setTerminations] = useState([]);
  const [terminationSearchText, setTerminationSearchText] = useState('');
  const [terminationTab, setTerminationTab] = useState('receipt'); // 'receipt', 'pending', 'made'
  const [historyData, setHistoryData] = useState({
    clients: [],
    leases: [],
    mutations: [],
    terminations: []
  });
  const [reportsData, setReportsData] = useState(null);
  
  // Filter states
  const [documentStatusFilter, setDocumentStatusFilter] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('');
  const [documentTenantFilter, setDocumentTenantFilter] = useState('');
  const [utilityStatusFilter, setUtilityStatusFilter] = useState('');
  const [leaseStatusFilter, setLeaseStatusFilter] = useState('');

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
        visitsData,
        negotiationsData,
        transfersData,
        newClientsData,
        terminationsData,
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
        adminService.getVisits().catch(() => []),
        adminService.getNegotiations().catch(() => []),
        adminService.getTransfers().catch(() => []),
        adminService.getNewClients().catch(() => []),
        adminService.getTerminations().catch(() => []),
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
      setVisits(Array.isArray(visitsData) ? visitsData : []);
      setNegotiations(Array.isArray(negotiationsData) ? negotiationsData : []);
      setTransfers(Array.isArray(transfersData) ? transfersData : []);
      
      // Set new data
      setNewClients(Array.isArray(newClientsData) ? newClientsData : []);
      setTerminations(Array.isArray(terminationsData) ? terminationsData : []);
      
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
          const status = leaseTab === 'active' ? 'Active' : leaseTab === 'pending' ? 'Pending' : 'Expired';
          const leasesData = await adminService.getLeases({ status });
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
      { id: 'demand-mutation-brother', label: 'Demand of Mutation (Brother)', icon: Building2 },
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

  const handleGenerateLeaseDocument = async (id) => {
    try {
      await adminService.generateLeaseDocument(id);
      addNotification('Lease document generated successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error generating lease document:', error);
      addNotification('Failed to generate lease document', 'error');
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
    if (loading) {
      return <div className="sa-table-empty">Loading overview data...</div>;
    }

    const stats = overviewData || {};
    
    // Calculate statistics from loaded data
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Number of new clients (this month)
    const newClientsCount = newClients.filter(client => {
      const regDate = client.registrationDate || client.RegistrationDate || client.createdAt || client.CreatedAt;
      if (!regDate) return false;
      const date = new Date(regDate);
      return date >= currentMonthStart;
    }).length;
    
    // Number of transfer requests accepted
    const transferRequestsAccepted = transfers.filter(t => {
      const status = (t.status || t.Status || '').toLowerCase();
      return status === 'approved' || status === 'accepted';
    }).length;
    
    // Number of termination requests accepted
    const terminationRequestsAccepted = terminations.filter(t => {
      const status = (t.status || t.Status || '').toLowerCase();
      return status === 'accepted' || status === 'completed';
    }).length;
    
    // Number of lease contracts completed
    const leaseContractsCompleted = leases.filter(l => {
      const status = (l.status || l.Status || '').toLowerCase();
      return status === 'completed' || status === 'valid' || status === 'active';
    }).length;
    
    // Number of lease contracts in progress
    const leaseContractsInProgress = leases.filter(l => {
      const status = (l.status || l.Status || '').toLowerCase();
      return status === 'pending' || status === 'in-progress' || status === 'draft';
    }).length;
    
    return (
      <div className="sa-overview-page">
        <div className="sa-overview-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '24px' }}>
          {/* Number of New Clients */}
          <div className="sa-metric-card sa-metric-primary" style={{ backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer' }} onClick={() => setActiveTab('new-client')}>
            <p className="sa-metric-label" style={{ color: '#fff', opacity: 0.9 }}>Number of New Clients</p>
            <p className="sa-metric-period" style={{ color: '#fff', opacity: 0.8 }}>This Month</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <p className="sa-metric-value" style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.numberOfNewClients || newClientsCount || 0}
              </p>
              <ArrowUp size={20} style={{ color: '#fff', opacity: 0.8 }} />
            </div>
          </div>

          {/* Number of Transfer Requests Accepted */}
          <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('demand-mutation')}>
            <p className="sa-metric-label">Number of Transfer Requests Accepted</p>
            <p className="sa-metric-period">Approved transfers</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <p className="sa-metric-value" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.transferRequestsAccepted || transferRequestsAccepted || 0}
              </p>
              <CheckCircle size={20} style={{ color: '#10b981' }} />
            </div>
          </div>

          {/* Number of Termination Requests Accepted */}
          <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('termination')}>
            <p className="sa-metric-label">Number of Termination Requests Accepted</p>
            <p className="sa-metric-period">Completed terminations</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <p className="sa-metric-value" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.terminationRequestsAccepted || terminationRequestsAccepted || 0}
              </p>
              <CheckCircle size={20} style={{ color: '#10b981' }} />
            </div>
          </div>

          {/* Number of Lease Contracts Completed */}
          <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('lease-contract')}>
            <p className="sa-metric-label">Number of Lease Contracts Completed</p>
            <p className="sa-metric-period">Valid contracts</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <p className="sa-metric-value" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.leaseContractsCompleted || leaseContractsCompleted || 0}
              </p>
              <CheckCircle size={20} style={{ color: '#10b981' }} />
            </div>
          </div>

          {/* Number of Lease Contracts In Progress */}
          <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('lease-contract')}>
            <p className="sa-metric-label">Number of Lease Contracts In Progress</p>
            <p className="sa-metric-period">Awaiting signatures</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <p className="sa-metric-value" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.leaseContractsInProgress || leaseContractsInProgress || 0}
              </p>
              <Clock size={20} style={{ color: '#f59e0b' }} />
            </div>
          </div>
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
        <input
          className="sa-search-input"
          type="text"
          placeholder="Search by tenant name..."
          value={documentTenantFilter}
          onChange={(e) => setDocumentTenantFilter(e.target.value)}
        />
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
      // Search filter
      if (leaseSearchText) {
        const search = leaseSearchText.toLowerCase();
        const tenant = (lease.tenant || lease.Tenant || '').toLowerCase();
        const property = (lease.property || lease.Property || '').toLowerCase();
        const contractTitle = (lease.contractTitle || lease.ContractTitle || '').toLowerCase();
        if (!tenant.includes(search) && !property.includes(search) && !contractTitle.includes(search)) return false;
      }
      
      // Status filter
      const status = (lease.status || lease.Status || 'Active').toLowerCase();
      if (leaseTab === 'active' || leaseTab === 'valid') return status === 'active' || status === 'valid' || status === 'completed';
      if (leaseTab === 'pending' || leaseTab === 'in-progress') return status === 'pending' || status === 'in-progress' || status === 'draft';
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

        <div className="sa-filters-section">
          <input
            type="text"
            className="sa-search-input"
            placeholder="Search by tenant, property, or contract title..."
            value={leaseSearchText}
            onChange={(e) => setLeaseSearchText(e.target.value)}
          />
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
                  
                  return (
                    <tr key={lease.id || lease.ID}>
                      <td>{index + 1}</td>
                      <td>{contractTitle}</td>
                      <td>{leaseType}</td>
                      <td>{tenant}</td>
                      <td>{property}</td>
                      <td>{landlord}</td>
                      <td>
                        <span className={`sa-status-pill ${status.toLowerCase().replace(' ', '-')}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className="sa-row-actions" style={{ gap: '8px' }}>
                          {documentURL ? (
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
                          ) : (
                            <button
                              className="table-action-button edit"
                              onClick={() => handleGenerateLeaseDocument(lease.id || lease.ID)}
                              style={{ backgroundColor: '#7c3aed', color: 'white', border: 'none', padding: '6px 12px' }}
                            >
                              Generate
                            </button>
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
              
              const storedUser = localStorage.getItem('user');
              let isOutgoing = false;
              if (storedUser) {
                try {
                  const user = JSON.parse(storedUser);
                  const currentUserId = user.id || user.ID;
                  isOutgoing = String(messageFromUserId) === String(currentUserId);
                } catch (e) {
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

  const renderTransfers = () => {
    // Determine which tab set to use based on active tab
    const currentTab = activeTab === 'demand-mutation-brother' ? mutationBrotherTab : mutationTab;
    const setCurrentTab = activeTab === 'demand-mutation-brother' ? setMutationBrotherTab : setMutationTab;
    const currentSearch = activeTab === 'demand-mutation-brother' ? mutationSearchText : mutationSearchText;
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
            <h3>Demand of Mutation{activeTab === 'demand-mutation-brother' ? ' (User wants to give apartments to brother)' : ''}</h3>
            <p>List of created mutations - Receipt of transfer requests (the tenant submits their request from their tenant account)</p>
          </div>
        </div>

        <div className="sa-filters-section">
          <input
            type="text"
            className="sa-search-input"
            placeholder="Search by property, current client, or new client..."
            value={currentSearch}
            onChange={(e) => setCurrentSearch(e.target.value)}
          />
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
                  <th>Files</th>
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
                  const files = transfer.files || transfer.Files || [];
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
                        {files && files.length > 0 ? (
                          <button
                            className="table-action-button view"
                            onClick={() => {
                              addNotification('Viewing files...', 'info');
                            }}
                            style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a', padding: '6px 12px' }}
                          >
                            View ({files.length})
                          </button>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
                      </td>
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
                        {isPending ? (
                          <div className="sa-row-actions" style={{ gap: '8px' }}>
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
                          </div>
                        ) : (
                          <span className="sa-cell-sub" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {status === 'Approved' || status === 'Accepted' ? '✓ Completed' : status === 'Rejected' || status === 'Refused' ? '✗ Refused' : status}
                          </span>
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
      if (terminationTab === 'receipt') return status === 'pending' || status === 'received';
      if (terminationTab === 'pending') return status === 'pending' || status === 'waiting-inventory';
      if (terminationTab === 'made') return status === 'completed' || status === 'made' || status === 'accepted';
      return true;
    });

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Termination</h3>
            <p>List of all cancellation requests - Receipt of termination requests</p>
          </div>
        </div>

        <div className="sa-filters-section">
          <input
            type="text"
            className="sa-search-input"
            placeholder="Search by tenant or property..."
            value={terminationSearchText}
            onChange={(e) => setTerminationSearchText(e.target.value)}
          />
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
                <th>Status</th>
                <th>Inventory Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredTerminations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="sa-table-empty">
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
                      <button className="sa-icon-button" title="View">👁️</button>
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

  // Render New Client Section
  const renderNewClient = () => {
    // Filter clients based on search and status
    const filteredClients = newClients.filter(client => {
      if (clientSearchText) {
        const search = clientSearchText.toLowerCase();
        const name = (client.name || client.Name || '').toLowerCase();
        const email = (client.email || client.Email || '').toLowerCase();
        if (!name.includes(search) && !email.includes(search)) return false;
      }
      if (clientStatusFilter) {
        const status = (client.status || client.Status || client.ApplicationStatus || client.applicationStatus || '').toLowerCase();
        if (clientStatusFilter === 'in-progress' && status !== 'pending' && status !== 'in-progress') return false;
        if (clientStatusFilter === 'accepted' && status !== 'accepted' && status !== 'approved') return false;
        if (clientStatusFilter === 'refused' && status !== 'refused' && status !== 'rejected') return false;
      }
      return true;
    });

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>New Client</h3>
            <p>List of new tenants received - Add new client (individual or company)</p>
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
              setShowNewClientModal(true);
            }}
          >
            <Plus size={18} />
            Add New Client
          </button>
        </div>

        <div className="sa-filters-section">
          <input
            type="text"
            className="sa-search-input"
            placeholder="Search by name or email..."
            value={clientSearchText}
            onChange={(e) => setClientSearchText(e.target.value)}
          />
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
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="sa-table-empty">
                    No new clients found
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, index) => (
                  <tr key={client.ID || client.id || index}>
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
                    <td>
                      <span className={`sa-status-pill ${(client.status || client.Status || client.ApplicationStatus || client.applicationStatus || 'in-progress').toLowerCase()}`}>
                        {client.status || client.Status || client.ApplicationStatus || client.applicationStatus || 'In Progress'}
                      </span>
                    </td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" title="View">👁️</button>
                      <button className="sa-icon-button" title="Edit">✏️</button>
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
      case 'demand-mutation-brother':
        return renderTransfers(); // Same structure, different filter
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

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Administrative Portal', logo: 'SAAF', logoImage: `${process.env.PUBLIC_URL}/download.jpeg` }}
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

      <Modal
        isOpen={showLeaseModal}
        onClose={() => setShowLeaseModal(false)}
        title="Create Lease Agreement"
        size="md"
      >
        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newLease = {
              contractTitle: formData.get('contractTitle') || undefined,
              tenant: formData.get('tenant'),
              property: formData.get('property'),
              landlord: formData.get('landlord'),
              leaseType: formData.get('leaseType'),
              startDate: formData.get('start'),
              endDate: formData.get('end'),
              rent: parseFloat(formData.get('rent')),
              status: 'Pending'
            };
            adminService.createLease(newLease).then(() => {
              addNotification('Lease created successfully', 'success');
              setShowLeaseModal(false);
              loadData();
            }).catch((error) => {
              addNotification('Failed to create lease', 'error');
              console.error(error);
            });
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
              <select id="lease-tenant" name="tenant" required>
                <option value="">Select Tenant from Database</option>
                {clients.filter(c => {
                  const status = (c.status || c.Status || c.ApplicationStatus || c.applicationStatus || '').toLowerCase();
                  return status === 'accepted' || status === 'approved' || status === 'active';
                }).map(client => (
                  <option key={client.ID || client.id} value={client.name || client.Name || client.email || client.Email}>
                    {client.name || client.Name || client.email || client.Email} {client.property ? `- ${client.property || client.Property}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="lease-landlord">Landlord</label>
              <input type="text" id="lease-landlord" name="landlord" placeholder="Landlord name" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lease-property">Property</label>
              <input type="text" id="lease-property" name="property" placeholder="Property address" required />
            </div>
            <div className="form-group">
              <label htmlFor="lease-rent">Monthly Rent</label>
              <input type="number" id="lease-rent" name="rent" min="0" step="0.01" placeholder="0.00 XOF" required />
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
        }}
        title="Add New Client"
        size="md"
      >
        <form
          className="modal-form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setLoading(true);
              await adminService.createNewClient(newClientForm);
              addNotification('New client created successfully', 'success');
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
              loadData();
            } catch (error) {
              console.error('Error creating new client:', error);
              addNotification(error.message || 'Failed to create new client', 'error');
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="form-group">
            <label>Client Type *</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="clientType"
                  value="individual"
                  checked={newClientForm.type === 'individual'}
                  onChange={(e) => setNewClientForm({ ...newClientForm, type: e.target.value })}
                  required
                />
                Individual
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="clientType"
                  value="company"
                  checked={newClientForm.type === 'company'}
                  onChange={(e) => setNewClientForm({ ...newClientForm, type: e.target.value })}
                  required
                />
                Company
              </label>
            </div>
          </div>

          {newClientForm.type === 'individual' ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="client-name">Name *</label>
                  <input
                    type="text"
                    id="client-name"
                    value={newClientForm.name}
                    onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                    required
                    placeholder="Enter full name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="client-email">Email *</label>
                  <input
                    type="email"
                    id="client-email"
                    value={newClientForm.email}
                    onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                    required
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="client-phone">Phone *</label>
                <input
                  type="tel"
                  id="client-phone"
                  value={newClientForm.phone}
                  onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                  required
                  placeholder="+225 07 12 34 56 78"
                />
              </div>
              <div className="form-group">
                <label htmlFor="client-address">Address</label>
                <input
                  type="text"
                  id="client-address"
                  value={newClientForm.address}
                  onChange={(e) => setNewClientForm({ ...newClientForm, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="client-company-name">Company Name *</label>
                <input
                  type="text"
                  id="client-company-name"
                  value={newClientForm.companyName}
                  onChange={(e) => setNewClientForm({ ...newClientForm, companyName: e.target.value })}
                  required
                  placeholder="Enter company name"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="client-registration">Registration Number *</label>
                  <input
                    type="text"
                    id="client-registration"
                    value={newClientForm.registrationNumber}
                    onChange={(e) => setNewClientForm({ ...newClientForm, registrationNumber: e.target.value })}
                    required
                    placeholder="Enter registration number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="client-contact-person">Contact Person *</label>
                  <input
                    type="text"
                    id="client-contact-person"
                    value={newClientForm.contactPerson}
                    onChange={(e) => setNewClientForm({ ...newClientForm, contactPerson: e.target.value })}
                    required
                    placeholder="Enter contact person name"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="client-email">Email *</label>
                  <input
                    type="email"
                    id="client-email"
                    value={newClientForm.email}
                    onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                    required
                    placeholder="email@example.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="client-phone">Phone *</label>
                  <input
                    type="tel"
                    id="client-phone"
                    value={newClientForm.phone}
                    onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                    required
                    placeholder="+225 07 12 34 56 78"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="client-address">Address</label>
                <input
                  type="text"
                  id="client-address"
                  value={newClientForm.address}
                  onChange={(e) => setNewClientForm({ ...newClientForm, address: e.target.value })}
                  placeholder="Enter company address"
                />
              </div>
            </>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="action-button secondary"
              onClick={() => {
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
              }}
            >
              Cancel
            </button>
            <button type="submit" className="action-button primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Client'}
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
