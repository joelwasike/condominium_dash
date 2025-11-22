import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReportSubmission from '../components/ReportSubmission';
import {
  Home,
  DollarSign,
  Wrench,
  Calendar,
  Camera,
  Upload,
  X,
  CreditCard,
  Smartphone,
  Banknote,
  Download,
  Settings,
  Plus,
  MessageCircle,
  Megaphone
} from 'lucide-react';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import { tenantService } from '../services/tenantService';
import { messagingService } from '../services/messagingService';
import { API_CONFIG } from '../config/api';
import '../components/RoleLayout.css';
import './SalesManagerDashboard.css';

const TenantDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    photos: []
  });
  const [notifications, setNotifications] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: '',
    reference: ''
  });
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  
  // Messaging states
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const isLoadingUsersRef = useRef(false);
  const messagesEndRef = useRef(null);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'payments', label: 'Payments', icon: DollarSign },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
      { id: 'advertisements', label: 'Advertisements', icon: Megaphone },
      { id: 'chat', label: 'Messages', icon: MessageCircle },
      { id: 'settings', label: 'Profile Settings', icon: Settings }
    ],
    []
  );

  const addNotification = (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [overview, paymentsData, maintenanceData] = await Promise.all([
        tenantService.getOverview().catch(() => null),
        tenantService.listPayments().catch(() => []),
        tenantService.listMaintenance().catch(() => [])
      ]);

      setOverviewData(overview);
      // Ensure payments is an array
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
      setPayments(paymentsArray);
      // Ensure maintenance is an array
      const maintenanceArray = Array.isArray(maintenanceData) ? maintenanceData : [];
      setMaintenanceRequests(maintenanceArray);
    } catch (error) {
      console.error('Error loading data:', error);
      addNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load payments separately
  const loadPayments = async () => {
    try {
      const paymentsData = await tenantService.listPayments();
      // Ensure payments is an array
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
      setPayments(paymentsArray);
      console.log('Loaded payments:', paymentsArray);
    } catch (error) {
      console.error('Error loading payments:', error);
      addNotification('Failed to load payments', 'error');
      setPayments([]);
    }
  };

  // Load advertisements
  const loadAdvertisements = async () => {
    try {
      const ads = await tenantService.getAdvertisements();
      setAdvertisements(Array.isArray(ads) ? ads : []);
    } catch (error) {
      console.error('Failed to load advertisements:', error);
      addNotification('Failed to load advertisements', 'error');
      setAdvertisements([]);
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
      addNotification(`Failed to load conversation: ${error.message || 'Unknown error'}`, 'error');
      setChatMessages([]);
    }
  }, [addNotification]);

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
      
      // Get conversations to update unread counts
      try {
        const conversations = await messagingService.getConversations();
        if (Array.isArray(conversations)) {
          conversations.forEach(conv => {
            const chatUser = chatUsersList.find(u => {
              const uId = String(u.userId);
              const convId = String(conv.userId);
              return uId === convId;
            });
            if (chatUser && conv.unreadCount) {
              chatUser.unreadCount = conv.unreadCount;
            }
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
  }, [loadChatForUser, addNotification]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedUserId) return;
    
    const content = chatInput.trim();
    const tempMessageId = `temp-${Date.now()}`;
    
    // Optimistic update - add message immediately
    const optimisticMessage = {
      id: tempMessageId,
      content: content,
      senderId: null, // Will be set by backend
      receiverId: selectedUserId,
      createdAt: new Date().toISOString(),
      isOptimistic: true
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

  useEffect(() => {
    loadData();
  }, []);

  // Load advertisements when advertisements tab is active
  useEffect(() => {
    if (activeTab === 'advertisements') {
      loadAdvertisements();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load users when chat tab is active (only once per tab switch)
  useEffect(() => {
    if (activeTab === 'chat' && !isLoadingUsersRef.current) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Only depend on activeTab, not loadUsers

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const maintenanceData = {
        property: 'Apartment 4B, 123 Main St',
        title: maintenanceForm.title,
        description: maintenanceForm.description,
        priority: maintenanceForm.priority,
        tenant: 'Current Tenant'
      };

      const newRequest = await tenantService.createMaintenance(maintenanceData);
      setMaintenanceRequests(prev => [newRequest, ...prev]);
      addNotification('Maintenance request submitted successfully!', 'success');

      setMaintenanceForm({ title: '', description: '', priority: 'medium', photos: [] });
      setShowMaintenanceModal(false);
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      addNotification('Failed to submit maintenance request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      preview: URL.createObjectURL(file)
    }));

    setMaintenanceForm(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
  };

  const removePhoto = (photoId) => {
    setMaintenanceForm(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo.id !== photoId)
    }));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const paymentData = {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.paymentMethod,
        chargeType: 'rent',
        reference: paymentForm.reference
      };

      await tenantService.recordPayment(paymentData);
      addNotification('Payment submitted successfully!', 'success');

      // Reset form and close modal
      setPaymentForm({ amount: '', paymentMethod: '', reference: '' });
      setShowPaymentModal(false);

      // Reload payments from server to ensure we have the latest data
      await loadPayments();
    } catch (error) {
      console.error('Error submitting payment:', error);
      addNotification(error.message || 'Failed to submit payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (paymentId) => {
    try {
      const payment = payments.find(p => p.ID === paymentId);
      if (!payment) {
        addNotification('Payment not found', 'error');
        return;
      }

      await tenantService.generateReceipt(paymentId);

      const receiptText = `
RENT PAYMENT RECEIPT
===================
Payment ID: ${payment.ID}
Receipt Number: ${payment.ReceiptNumber}
Date: ${new Date(payment.Date).toLocaleDateString()}
Amount: ${payment.Amount} XOF
Description: ${payment.ChargeType}
Payment Method: ${payment.Method}
Status: ${payment.Status}

Thank you for your payment!
      `.trim();

      const blob = new Blob([receiptText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${payment.ReceiptNumber || paymentId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addNotification('Receipt downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      addNotification('Failed to download receipt', 'error');
    }
  };

  const renderOverview = () => {
    if (loading) {
      return <div className="sa-table-empty">Loading overview data...</div>;
    }

    const data = overviewData || {
      lease: { property: 'Apartment 4B, 123 Main St', endDate: '2024-12-31' },
      nextRentDue: { amount: 1500, date: '2024-11-01' },
      openMaintenanceTickets: 0,
      tenant: 'Tenant'
    };

    return (
      <div className="sa-overview-page">
        <div className="sa-overview-top">
          <div className="sa-overview-chart-card">
            <div className="sa-card-header">
              <h2>Tenant Dashboard</h2>
              <span className="sa-card-subtitle">Welcome, {data.tenant || 'Tenant'}!</span>
            </div>
            <div className="sa-mini-legend">
              <span className="sa-legend-item sa-legend-expected">Current Lease</span>
              <span className="sa-legend-item sa-legend-current">Rent Due</span>
            </div>
            <div className="sa-chart-placeholder">
              <div className="sa-chart-line sa-chart-line-expected" />
              <div className="sa-chart-line sa-chart-line-current" />
            </div>
            <div className="sa-chart-footer">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>

          <div className="sa-overview-metrics">
            <div className="sa-metric-card sa-metric-primary">
              <p className="sa-metric-label">Next Rent Due</p>
              <p className="sa-metric-period">Due: {data.nextRentDue?.date || '2024-11-01'}</p>
              <p className="sa-metric-value">
                {data.nextRentDue?.amount || 1500} XOF
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Current Lease</p>
              <p className="sa-metric-number">
                {data.lease?.property ? 'Active' : 'N/A'}
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Open Maintenance</p>
              <p className="sa-metric-value">
                {data.openMaintenanceTickets || 0}
              </p>
            </div>
            <div className="sa-banner-card">
              <div className="sa-banner-text">
                <h3>Property Management</h3>
                <p>
                  Manage your lease, payments, and maintenance requests all in one place.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sa-section-card" style={{ marginTop: '24px' }}>
          <div className="sa-section-header">
            <h3>Quick Actions</h3>
            <p>Submit reports and manage your property.</p>
          </div>
          <div style={{ padding: '20px' }}>
            <ReportSubmission />
          </div>
        </div>
      </div>
    );
  };

  const renderPayments = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h2>Payment Management</h2>
          <p>Make payments and view your payment history</p>
        </div>
        <button className="sa-primary-cta" onClick={() => setShowPaymentModal(true)} disabled={loading}>
          <Plus size={18} />
          Make Payment
        </button>
      </div>

      {loading ? (
        <div className="sa-table-empty">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="sa-table-empty">No payments found</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => {
                // Handle both uppercase and lowercase field names from API
                const paymentId = payment.ID || payment.id;
                const paymentDate = payment.Date || payment.date || payment.createdAt || payment.CreatedAt;
                const chargeType = payment.ChargeType || payment.chargeType || 'Rent';
                const amount = payment.Amount || payment.amount || 0;
                const method = payment.Method || payment.method || 'N/A';
                const status = payment.Status || payment.status || 'Pending';
                
                return (
                  <tr key={paymentId || `payment-${index}`}>
                    <td>{index + 1}</td>
                    <td>{paymentDate ? new Date(paymentDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{chargeType}</span>
                        {payment.reference && (
                          <span className="sa-cell-sub">Ref: {payment.reference}</span>
                        )}
                      </div>
                    </td>
                    <td>{typeof amount === 'number' ? amount.toLocaleString() : amount} XOF</td>
                    <td>{method}</td>
                    <td>
                      <span className={`sa-status-pill ${status.toLowerCase().replace(' ', '-')}`}>
                        {status}
                      </span>
                    </td>
                    <td className="table-menu">
                      <div className="table-actions">
                        <button
                          className="table-action-button view"
                          onClick={() => downloadReceipt(paymentId)}
                          title="Download Receipt"
                        >
                          <Download size={14} />
                          Download
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

  const renderMaintenance = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h2>Maintenance Requests</h2>
          <p>Submit new requests or check the status of existing ones</p>
        </div>
        <button className="sa-primary-cta" onClick={() => setShowMaintenanceModal(true)} disabled={loading}>
          <Plus size={18} />
          Submit New Request
        </button>
      </div>

      {loading ? (
        <div className="sa-table-empty">Loading maintenance requests...</div>
      ) : maintenanceRequests.length === 0 ? (
        <div className="sa-table-empty">No maintenance requests found</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Issue</th>
                <th>Priority</th>
                <th>Date</th>
                <th>Status</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {maintenanceRequests.map((request, index) => (
                <tr key={request.ID || request.id || `request-${index}`}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{request.Issue || request.Title || request.title || 'Maintenance Request'}</span>
                      {request.Description && (
                        <span className="sa-cell-sub">{request.Description || request.description}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`sa-status-pill ${(request.Priority || request.priority || 'medium').toLowerCase()}`}>
                      {request.Priority || request.priority || 'Medium'}
                    </span>
                  </td>
                  <td>{new Date(request.Date || request.date || request.CreatedAt || request.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`sa-status-pill ${(request.Status || request.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                      {request.Status || request.status || 'Pending'}
                    </span>
                  </td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button
                        className="table-action-button view"
                        onClick={() => addNotification('Viewing maintenance request details', 'info')}
                      >
                        View
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

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'payments':
        return renderPayments();
      case 'maintenance':
        return renderMaintenance();
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
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Tenant Portal', logo: 'SAAF', logoImage: `${process.env.PUBLIC_URL}/download.jpeg` }}
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

      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map(notification => (
            <div key={notification.id} className={`notification notification-${notification.type}`}>
              <span>{notification.message}</span>
              <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Maintenance Request Modal */}
      {showMaintenanceModal && (
        <div className="modal-overlay" onClick={() => setShowMaintenanceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Maintenance Request</h3>
              <button className="modal-close" onClick={() => setShowMaintenanceModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleMaintenanceSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="title">Issue Title</label>
                    <input
                      type="text"
                      id="title"
                      value={maintenanceForm.title}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Leaky faucet in kitchen"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="priority">Priority Level</label>
                    <select
                      id="priority"
                      value={maintenanceForm.priority}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, priority: e.target.value }))}
                      required
                    >
                      <option value="low">Low - Can wait</option>
                      <option value="medium">Medium - Should be fixed soon</option>
                      <option value="high">High - Urgent</option>
                      <option value="emergency">Emergency - Immediate attention needed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Please describe the issue in detail..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="photos">Upload Photos (Optional)</label>
                  <div className="photo-upload-area">
                    <input
                      type="file"
                      id="photos"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="photos" className="photo-upload-button">
                      <Camera size={20} />
                      <span>Choose Photos</span>
                    </label>
                    <p className="photo-help-text">Upload photos to help describe the issue (max 5 photos)</p>
                  </div>

                  {maintenanceForm.photos.length > 0 && (
                    <div className="photo-preview-grid">
                      {maintenanceForm.photos.map(photo => (
                        <div key={photo.id} className="photo-preview-item">
                          <img src={photo.preview} alt={photo.name} />
                          <button
                            type="button"
                            className="remove-photo-button"
                            onClick={() => removePhoto(photo.id)}
                          >
                            <X size={16} />
                          </button>
                          <span className="photo-name">{photo.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowMaintenanceModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Make Payment</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handlePaymentSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="amount">Amount</label>
                    <input
                      type="number"
                      id="amount"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Enter amount"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="paymentMethod">Payment Method</label>
                    <select
                      id="paymentMethod"
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      required
                    >
                      <option value="">Select payment method</option>
                      <option value="cash">Cash Payment</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reference">Reference Number</label>
                  <input
                    type="text"
                    id="reference"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="Enter transaction reference"
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Payment'}
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

export default TenantDashboard;

