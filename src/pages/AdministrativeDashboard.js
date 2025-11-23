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
  Megaphone
} from 'lucide-react';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import Modal from '../components/Modal';
import '../components/RoleLayout.css';
import './AdministrativeDashboard.css';
import { adminService } from '../services/adminService';
import { messagingService } from '../services/messagingService';
import { API_CONFIG } from '../config/api';

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
      const [
        overview,
        inboxData,
        documentsData,
        utilitiesData,
        debtsData,
        remindersData,
        leasesData,
        paymentFollowUpsData
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
        adminService.getPendingPaymentFollowUps().catch(() => [])
      ]);
      
      setOverviewData(overview);
      setInboxDocs(inboxData.items || []);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
      setUtilities(utilitiesData.items || []);
      setDebts(debtsData.items || []);
      setReminders(Array.isArray(remindersData) ? remindersData : []);
      setLeases(Array.isArray(leasesData) ? leasesData : []);
      setPendingPaymentFollowUps(Array.isArray(paymentFollowUpsData) ? paymentFollowUpsData : []);
    } catch (error) {
      console.error('Error loading admin data:', error);
      addNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, documentStatusFilter, documentTypeFilter, documentTenantFilter, utilityStatusFilter, leaseStatusFilter]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load advertisements when advertisements tab is active
  useEffect(() => {
    if (activeTab === 'advertisements') {
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
      { id: 'inbox', label: 'Inbox', icon: Mail },
      { id: 'documents', label: 'Documents', icon: FileText },
      { id: 'utilities', label: 'CIE/SODECI Transfers', icon: Send },
      { id: 'debt', label: 'Debt Collection', icon: DollarSign },
      { id: 'reminders', label: 'Reminders', icon: Bell },
      { id: 'leases', label: 'Leases', icon: FileText },
      { id: 'automation', label: 'Automation & Reports', icon: TrendingUp },
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
    const stats = overviewData || {};
    
    return (
      <div className="sa-overview-page">
        <div className="sa-section-card">
          <div className="sa-section-header">
            <div>
              <h3>Administrative Dashboard Overview</h3>
              <p>Track document verification, automation, and administrative tasks</p>
            </div>
          </div>

          <div className="sa-overview-metrics">
            <div className="sa-metric-card">
              <p className="sa-metric-label">Files Received</p>
              <p className="sa-metric-value">{stats.totalFilesReceived || 0}</p>
              <span className="sa-metric-period">Total documents</span>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Files Approved</p>
              <p className="sa-metric-value">{stats.filesApproved || 0}</p>
              <span className="sa-metric-period">Approved documents</span>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Pending Review</p>
              <p className="sa-metric-value">{stats.filesPending || 0}</p>
              <span className="sa-metric-period">Awaiting verification</span>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Files Rejected</p>
              <p className="sa-metric-value">{stats.filesRejected || 0}</p>
              <span className="sa-metric-period">Rejected documents</span>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Average Approval Time</p>
              <p className="sa-metric-value">{stats.averageApprovalTimeHours ? `${stats.averageApprovalTimeHours.toFixed(1)}h` : '0h'}</p>
              <span className="sa-metric-period">Hours per file</span>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Follow-ups Sent</p>
              <p className="sa-metric-value">{stats.numberOfFollowUpsSent || 0}</p>
              <span className="sa-metric-period">Total follow-ups</span>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Utility Documents</p>
              <p className="sa-metric-value">{stats.utilityDocumentsSent || 0}</p>
              <span className="sa-metric-period">Sent to utilities</span>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Pending Follow-ups</p>
              <p className="sa-metric-value">{stats.pendingFollowUpCount || 0}</p>
              <span className="sa-metric-period">Needing follow-up</span>
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

  const renderLeases = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h3>Lease Agreements</h3>
          <p>Generate and manage lease contracts for approved tenants</p>
        </div>
        <button className="sa-primary-cta" onClick={() => setShowLeaseModal(true)} disabled={loading}>
          <Plus size={18} />
          Create Lease
        </button>
      </div>
      
      <div className="sa-filters-section">
        <select 
          className="sa-filter-select"
          value={leaseStatusFilter}
          onChange={(e) => setLeaseStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {leases.length === 0 ? (
        <div className="sa-table-empty">No leases created yet</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property</th>
                <th>Term</th>
                <th>Rent</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leases.map(lease => (
                <tr key={lease.id}>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{lease.tenant}</span>
                      <span className="sa-cell-sub">{lease.email || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{lease.property}</span>
                      <span className="sa-cell-sub">{lease.unit || lease.city || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">
                        {lease.startDate} - {lease.endDate}
                      </span>
                      <span className="sa-cell-sub">{lease.duration || '1 year'}</span>
                    </div>
                  </td>
                  <td>{lease.rent}</td>
                  <td>
                    <span className={`sa-status-pill ${(lease.status || 'active').toLowerCase()}`}>
                      {lease.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="sa-row-actions">
                      <button
                        className="table-action-button view"
                        onClick={() => addNotification('Lease opened', 'info')}
                      >
                        View
                      </button>
                      {lease.status === 'Pending' && (
                        <button
                          className="table-action-button edit"
                          onClick={() => handleGenerateLeaseDocument(lease.id)}
                        >
                          Generate
                        </button>
                      )}
                      <button
                        className="table-action-button edit"
                        onClick={() => addNotification('Lease downloaded', 'success')}
                      >
                        Download
                      </button>
                      <button
                        className="table-action-button delete"
                        onClick={() => addNotification('Lease termination initiated', 'warning')}
                      >
                        Terminate
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

  const renderContent = (currentTab = activeTab) => {
    switch (currentTab) {
      case 'overview':
        return renderOverview();
      case 'inbox':
        return renderInbox();
      case 'documents':
        return renderDocuments();
      case 'utilities':
        return renderUtilities();
      case 'debt':
        return renderDebt();
      case 'reminders':
        return renderReminders();
      case 'leases':
        return renderLeases();
      case 'automation':
        return renderAutomation();
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
              tenant: formData.get('tenant'),
              property: formData.get('property'),
              startDate: formData.get('start'),
              endDate: formData.get('end'),
              rent: formData.get('rent'),
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
              <label htmlFor="lease-tenant">Tenant</label>
              <input type="text" id="lease-tenant" name="tenant" placeholder="Tenant name" required />
            </div>
            <div className="form-group">
              <label htmlFor="lease-property">Property</label>
              <input type="text" id="lease-property" name="property" placeholder="Property address" required />
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
          <div className="form-group">
            <label htmlFor="lease-rent">Monthly Rent</label>
            <input type="number" id="lease-rent" name="rent" min="0" step="0.01" placeholder="$0.00" required />
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
