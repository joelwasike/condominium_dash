import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DollarSign, TrendingUp, Building, Receipt, Download, Filter, Search, CreditCard, CheckCircle, XCircle, User, FileText, Mail, ArrowRightLeft, Plus, MessageCircle, Settings, Megaphone } from 'lucide-react';
import { accountingService } from '../services/accountingService';
import { messagingService } from '../services/messagingService';
import { API_CONFIG } from '../config/api';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import '../components/RoleLayout.css';
import './AccountingDashboard.css';

const AccountingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLandlordPaymentModal, setShowLandlordPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // API Data States
  const [overviewData, setOverviewData] = useState(null);
  const [tenantPayments, setTenantPayments] = useState([]);
  const [landlordPayments, setLandlordPayments] = useState([]);
  const [collections, setCollections] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [advertisements, setAdvertisements] = useState([]);
  
  // Messaging states
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const isLoadingUsersRef = useRef(false);
  const messagesEndRef = useRef(null);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: DollarSign },
      { id: 'collections', label: 'Collections', icon: TrendingUp },
      { id: 'payments', label: 'Landlord Payments', icon: Building },
      { id: 'tenant-payments', label: 'Tenant Payments', icon: CreditCard },
      { id: 'reports', label: 'Reports', icon: Receipt },
      { id: 'expenses', label: 'Expenses', icon: FileText },
      { id: 'advertisements', label: 'Advertisements', icon: Megaphone },
      { id: 'chat', label: 'Messages', icon: MessageCircle },
      { id: 'settings', label: 'Profile Settings', icon: Settings }
    ],
    []
  );

  // Load data from APIs
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading accounting dashboard data...');
      
      const [overview, tenantPaymentsData, landlordPaymentsData, collectionsData, expensesData, summary] = await Promise.all([
        accountingService.getOverview(),
        accountingService.getTenantPayments(),
        accountingService.getLandlordPayments(),
        accountingService.getCollections(),
        accountingService.getExpenses(),
        accountingService.getMonthlySummary()
      ]);

      setOverviewData(overview);
      setTenantPayments(tenantPaymentsData);
      setLandlordPayments(landlordPaymentsData);
      setCollections(collectionsData);
      setExpenses(expensesData);
      setMonthlySummary(summary);
      
      console.log('Accounting data loaded successfully:', { overview, tenantPaymentsData, landlordPaymentsData, collectionsData, expensesData, summary });
    } catch (error) {
      console.error('Failed to load accounting data:', error);
      addNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load advertisements
  const loadAdvertisements = async () => {
    try {
      const ads = await accountingService.getAdvertisements();
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

  // Load users for messaging
  const loadUsers = useCallback(async () => {
    if (isLoadingUsersRef.current) {
      console.log('Users already loading, skipping...');
      return;
    }

    try {
      isLoadingUsersRef.current = true;
      console.log('Loading users for messaging...');
      const users = await messagingService.getUsers();
      console.log('Users API response:', users);

      let usersArray = [];
      if (Array.isArray(users)) {
        usersArray = users;
      } else if (users && Array.isArray(users.users)) {
        usersArray = users.users;
      } else if (users && typeof users === 'object') {
        usersArray = Object.values(users).find(val => Array.isArray(val)) || [];
      }

      console.log('Processed users array:', usersArray);

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

      const chatUsersList = usersArray
        .filter(user => {
          const userId = user.id || user.ID;
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
            unreadCount: 0
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

  // Load advertisements when advertisements tab is active
  useEffect(() => {
    if (activeTab === 'advertisements') {
      loadAdvertisements();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load users when chat tab is active (only once per tab switch)
  useEffect(() => {
    if (activeTab === 'chat' && !isLoadingUsersRef.current) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Only depend on activeTab, not loadUsers

  const generateReceipt = async (payment) => {
    try {
      setLoading(true);
      const updatedPayment = await accountingService.generateReceipt(payment.ID);
      
      // Update local state
      setTenantPayments(prev => prev.map(p => 
        p.ID === payment.ID ? updatedPayment : p
      ));

      // Generate downloadable receipt
      const receiptContent = `
        RENTAL PAYMENT RECEIPT
        =====================
        
        Receipt No: ${updatedPayment.ReceiptNumber}
        Date: ${new Date().toLocaleDateString()}
        
        Tenant: ${payment.Tenant}
        Property: ${payment.Property}
        Amount Paid: ${payment.Amount.toFixed(2)} XOF
        Charge Type: ${payment.ChargeType || 'N/A'}
        Payment Method: ${payment.Method}
        Payment Date: ${new Date(payment.Date).toLocaleDateString()}
        
        Status: CONFIRMED
        
        Thank you for your payment!
        
        Generated by: Accounting Department
        Generated on: ${new Date().toLocaleString()}
      `;

      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${updatedPayment.ReceiptNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addNotification('Receipt generated and downloaded!', 'success');
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      addNotification('Failed to generate receipt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendReceipt = async (payment) => {
    if (!payment.ReceiptNumber) {
      addNotification('Generate receipt before sending.', 'warning');
      return;
    }
    
    try {
      setLoading(true);
      const email = prompt('Enter tenant email address:');
      if (email) {
        await accountingService.sendReceipt(payment.ID, email);
        addNotification(`Receipt sent to ${email}`, 'success');
      }
    } catch (error) {
      console.error('Failed to send receipt:', error);
      addNotification('Failed to send receipt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const transferToLandlord = async (paymentId) => {
    try {
      setLoading(true);
      await accountingService.transferToLandlord(paymentId);
      
      // Update local state
      setLandlordPayments(prev => prev.map(p => 
        p.ID === paymentId ? { ...p, Status: 'Paid' } : p
      ));
      
      addNotification(`Transfer to landlord completed for payment #${paymentId}.`, 'success');
    } catch (error) {
      console.error('Failed to transfer to landlord:', error);
      addNotification('Failed to transfer to landlord', 'error');
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (payment) => {
    try {
      setLoading(true);
      const updatedPayment = await accountingService.approveTenantPayment(payment.ID);
      
      // Update local state
      setTenantPayments(prev => prev.map(p => 
        p.ID === payment.ID ? updatedPayment : p
      ));
      
      addNotification(`Payment approved for ${payment.Tenant}`, 'success');
    } catch (error) {
      console.error('Failed to approve payment:', error);
      addNotification('Failed to approve payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmApproval = () => {
    if (selectedPayment) {
      setTenantPayments(prev => prev.map(p => 
        p.ID === selectedPayment.ID 
          ? { ...p, Status: 'Approved', ReceiptNumber: p.ReceiptNumber || `RCP-${Date.now()}` }
          : p
      ));

      addNotification(`Payment from ${selectedPayment.Tenant} approved successfully!`, 'success');
      setShowApprovalModal(false);
      setSelectedPayment(null);
    }
  };

  const rejectPayment = (payment) => {
    setTenantPayments(prev => prev.map(p => 
      p.ID === payment.ID 
        ? { ...p, Status: 'Rejected' }
        : p
    ));

    addNotification(`Payment from ${payment.Tenant} rejected.`, 'warning');
  };

  const renderOverview = () => {
    // Get current month name for display
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    
    return (
      <div className="sa-overview-page">
        <div className="sa-overview-metrics">
          <div className="sa-metric-card sa-metric-primary">
            <p className="sa-metric-label">Total Available Balance</p>
            <p className="sa-metric-period">Current balance</p>
            <p className="sa-metric-value">
              {overviewData ? `${(overviewData.totalAvailableBalance || overviewData.globalBalance || 0).toFixed(2)} XOF` : 'Loading...'}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Collected This Month</p>
            <p className="sa-metric-period">{currentMonth}</p>
            <p className="sa-metric-value">
              {overviewData ? `${(overviewData.totalCollectedThisMonth || 0).toFixed(2)} XOF` : 'Loading...'}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Transferred to Landlords</p>
            <p className="sa-metric-period">This month</p>
            <p className="sa-metric-value">
              {overviewData ? `${(overviewData.totalTransferredToLandlords || 0).toFixed(2)} XOF` : 'Loading...'}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Company Commission Earned</p>
            <p className="sa-metric-period">This month</p>
            <p className="sa-metric-value">
              {overviewData ? `${(overviewData.totalCompanyCommissionEarned || 0).toFixed(2)} XOF` : 'Loading...'}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Pending Rent Amount</p>
            <p className="sa-metric-period">Outstanding</p>
            <p className="sa-metric-value">
              {overviewData ? `${(overviewData.pendingRentAmount || 0).toFixed(2)} XOF` : 'Loading...'}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Expenses This Month</p>
            <p className="sa-metric-period">{currentMonth}</p>
            <p className="sa-metric-value">
              {overviewData ? `${(overviewData.totalExpensesThisMonth || 0).toFixed(2)} XOF` : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderCollections = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h2>Real-time Collections Tracking</h2>
          <p>Track rent and deposit payments per building</p>
        </div>
      </div>

      <div className="sa-filters-section">
        <select className="sa-filter-select">
          <option value="">All Buildings/Properties</option>
          <option value="123-main">123 Main St</option>
          <option value="456-oak">456 Oak Ave</option>
          <option value="789-pine">789 Pine Ln</option>
          <option value="321-elm">321 Elm St</option>
        </select>
        <select className="sa-filter-select">
          <option value="">All Landlords</option>
          <option value="john-smith">John Smith</option>
          <option value="jane-doe">Jane Doe</option>
          <option value="bob-johnson">Bob Johnson</option>
          <option value="alice-brown">Alice Brown</option>
        </select>
        <select className="sa-filter-select">
          <option value="">All Periods</option>
          <option value="current-month">Current Month</option>
          <option value="last-month">Last Month</option>
          <option value="last-3-months">Last 3 Months</option>
        </select>
        <select className="sa-filter-select">
          <option value="">All Payment Status</option>
          <option value="collected">Collected</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
        <select className="sa-filter-select">
          <option value="">All Charge Types</option>
          <option value="rent">Rent</option>
          <option value="deposit">Deposit</option>
          <option value="late-fee">Late Fee</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading collections...</div>
      ) : collections.length === 0 ? (
        <div className="no-data">No collections found</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Building/Property</th>
                <th>Landlord</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Charge Type</th>
                <th>Date</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection, index) => (
                <tr key={collection.ID || `collection-${index}`}>
                  <td>
                    <span className="sa-cell-title">{collection.Building || 'N/A'}</span>
                  </td>
                  <td>{collection.Landlord || 'N/A'}</td>
                  <td>{collection.Amount?.toFixed(2) || '0.00'} XOF</td>
                  <td>
                    <span className={`sa-status-pill ${(collection.Status || 'unknown').toLowerCase()}`}>
                      {collection.Status || 'Unknown'}
                    </span>
                  </td>
                  <td>{collection.ChargeType || 'N/A'}</td>
                  <td>{collection.Date ? new Date(collection.Date).toLocaleDateString() : 'N/A'}</td>
                  <td className="table-menu">
                    <div className="sa-row-actions">
                      <button className="table-action-button view">View</button>
                      <button className="table-action-button edit">Receipt</button>
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

  const renderPayments = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h2>Landlord Payment Table</h2>
          <p>Net payments after commission deduction</p>
        </div>
        <button 
          className="sa-primary-cta" 
          onClick={() => setShowLandlordPaymentModal(true)}
          disabled={loading}
        >
          <Plus size={18} />
          Record Payment
        </button>
      </div>

      <div className="sa-filters-section">
        <select className="sa-filter-select">
          <option value="">All Landlords</option>
          <option value="john-smith">John Smith</option>
          <option value="jane-doe">Jane Doe</option>
          <option value="bob-johnson">Bob Johnson</option>
        </select>
        <select className="sa-filter-select">
          <option value="">All Buildings</option>
          <option value="123-main">123 Main St</option>
          <option value="456-oak">456 Oak Ave</option>
          <option value="789-pine">789 Pine Ln</option>
        </select>
        <select className="sa-filter-select">
          <option value="">All Periods</option>
          <option value="current-month">Current Month</option>
          <option value="last-month">Last Month</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading landlord payments...</div>
      ) : landlordPayments.length === 0 ? (
        <div className="no-data">No landlord payments found</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Landlord</th>
                <th>Building</th>
                <th>Net Amount</th>
                <th>Commission</th>
                <th>Transaction Type</th>
                <th>Date</th>
                <th>Status</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {landlordPayments.map((payment, index) => (
                <tr key={payment.ID || `landlord-payment-${index}`}>
                  <td>
                    <span className="sa-cell-title">{payment.Landlord || 'N/A'}</span>
                  </td>
                  <td>{payment.Building || 'N/A'}</td>
                  <td>{payment.NetAmount?.toFixed(2) || '0.00'} XOF</td>
                  <td>{payment.Commission?.toFixed(2) || '0.00'} XOF</td>
                  <td>Payout</td>
                  <td>{payment.Date ? new Date(payment.Date).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`sa-status-pill ${(payment.Status || 'unknown').toLowerCase()}`}>
                      {payment.Status || 'Unknown'}
                    </span>
                  </td>
                  <td className="table-menu">
                    <div className="sa-row-actions">
                      <button className="table-action-button view">View</button>
                      <button className="table-action-button edit" onClick={() => transferToLandlord(payment.ID)} title="Automatic Transfer">
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

  const renderReports = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h2>Monthly Financial Reports</h2>
          <p>Generate and download comprehensive financial reports</p>
        </div>
        <button className="sa-primary-cta">
          <Download size={18} />
          Generate Monthly Report
        </button>
      </div>

      <div className="sa-table-wrapper" style={{ marginBottom: '32px' }}>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Building</th>
              <th>Rent Collected</th>
              <th>Deposits Collected</th>
              <th>Commission</th>
              <th>Net to Landlords</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="sa-cell-title">123 Main St</span>
              </td>
              <td>8,500 XOF</td>
              <td>1,200 XOF</td>
              <td>950 XOF</td>
              <td>8,750 XOF</td>
            </tr>
            <tr>
              <td>
                <span className="sa-cell-title">456 Oak Ave</span>
              </td>
              <td>6,200 XOF</td>
              <td>0 XOF</td>
              <td>620 XOF</td>
              <td>5,580 XOF</td>
            </tr>
            <tr>
              <td>
                <span className="sa-cell-title">789 Pine Ln</span>
              </td>
              <td>12,800 XOF</td>
              <td>500 XOF</td>
              <td>1,330 XOF</td>
              <td>11,970 XOF</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sa-section-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2>Recent Reports</h2>
          <p>Download previously generated reports</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading reports...</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Generated Date</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="sa-cell-title">November 2024 Financial Report</span>
                </td>
                <td>Nov 1, 2024</td>
                <td className="table-menu">
                  <div className="sa-row-actions">
                    <button className="table-action-button view">
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="sa-cell-title">October 2024 Building Performance</span>
                </td>
                <td>Oct 31, 2024</td>
                <td className="table-menu">
                  <div className="sa-row-actions">
                    <button className="table-action-button view">
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="sa-cell-title">Q3 2024 Commission Report</span>
                </td>
                <td>Oct 1, 2024</td>
                <td className="table-menu">
                  <div className="sa-row-actions">
                    <button className="table-action-button view">
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderTenantPayments = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h2>Tenant Payment Management</h2>
          <p>Review, approve, and manage tenant payments</p>
        </div>
        <button 
          className="sa-primary-cta" 
          onClick={() => setShowPaymentModal(true)}
          disabled={loading}
        >
          <Plus size={18} />
          Record New Payment
        </button>
      </div>

      <div className="sa-filters-section">
        <select className="sa-filter-select">
          <option value="">All Payments</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="sa-filter-select">
          <option value="">All Methods</option>
          <option value="cash">Cash</option>
          <option value="mobile">Mobile Money</option>
          <option value="bank">Bank Transfer</option>
        </select>
        <div className="sa-search-input-wrapper">
          <input type="text" placeholder="Search by tenant..." />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading tenant payments...</div>
      ) : tenantPayments.length === 0 ? (
        <div className="no-data">No tenant payments found</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                <th>Receipt</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {tenantPayments.map((payment, index) => (
                <tr key={payment.ID || `payment-${index}`}>
                  <td>
                    <span className="sa-cell-title">{payment.Tenant || 'N/A'}</span>
                  </td>
                  <td>{payment.Property || 'N/A'}</td>
                  <td>{payment.Amount?.toFixed(2) || '0.00'} XOF</td>
                  <td>{payment.Method || 'N/A'}</td>
                  <td>{payment.Date ? new Date(payment.Date).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`sa-status-pill ${(payment.Status || 'unknown').toLowerCase()}`}>
                      {payment.Status || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    {payment.ReceiptNumber ? (
                      <span className="sa-cell-title">{payment.ReceiptNumber}</span>
                    ) : (
                      <span style={{ color: 'rgba(15, 31, 96, 0.5)' }}>No Receipt</span>
                    )}
                  </td>
                  <td className="table-menu">
                    <div className="sa-row-actions">
                      {payment.Status === 'Pending' && (
                        <>
                          <button 
                            className="table-action-button edit"
                            onClick={() => approvePayment(payment)}
                            title="Approve Payment"
                          >
                            Approve
                          </button>
                          <button 
                            className="table-action-button delete"
                            onClick={() => rejectPayment(payment)}
                            title="Reject Payment"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button 
                        className="table-action-button view"
                        onClick={() => generateReceipt(payment)}
                        title="Generate Receipt"
                      >
                        Receipt
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

  const renderExpenses = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h2>Expense Management</h2>
          <p>Track expenses by building or for SAAF IMMO</p>
        </div>
        <button 
          className="sa-primary-cta" 
          onClick={() => setShowExpenseModal(true)}
          disabled={loading}
        >
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="no-data">No expenses found</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Scope</th>
                <th>Building</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Notes</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp, index) => (
                <tr key={exp.ID || exp.id || `expense-${index}`}>
                  <td>{exp.Date ? new Date(exp.Date).toLocaleDateString() : (exp.date || 'N/A')}</td>
                  <td>{exp.Scope || exp.scope || 'N/A'}</td>
                  <td>
                    <span className="sa-cell-title">{exp.Building || exp.building || 'N/A'}</span>
                  </td>
                  <td>{exp.Category || exp.category || 'N/A'}</td>
                  <td>{(exp.Amount || exp.amount || 0).toFixed(2)} XOF</td>
                  <td>{exp.Notes || exp.notes || 'N/A'}</td>
                  <td className="table-menu">
                    <div className="sa-row-actions">
                      <button className="table-action-button view">View</button>
                      <button className="table-action-button edit">Edit</button>
                      <button className="table-action-button delete">Delete</button>
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

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'collections':
        return renderCollections();
      case 'payments':
        return renderPayments();
      case 'tenant-payments':
        return renderTenantPayments();
      case 'reports':
        return renderReports();
      case 'expenses':
        return renderExpenses();
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
    window.location.href = '/';
  };

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Accounting', logo: 'SAAF', logoImage: `${process.env.PUBLIC_URL}/download.jpeg` }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}
      >
        {({ activeId }) => (
          <div className="accounting-content">
            {loading && <div className="loading-indicator">Loading data...</div>}
            {renderContent(activeId || activeTab)}
          </div>
        )}
      </RoleLayout>

      <div className="notifications-container">
        {notifications.map((notification, index) => (
          <div key={notification.id || `notification-${index}`} className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>×</button>
          </div>
        ))}
      </div>

      {/* Payment Recording Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record New Payment</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);
                  const formData = new FormData(e.target);
                  const paymentData = {
                    tenant: formData.get('tenant'),
                    property: formData.get('property'),
                    amount: parseFloat(formData.get('amount')),
                    method: formData.get('method'),
                    chargeType: formData.get('chargeType') || 'Rent'
                  };
                  
                  // Call the backend API
                  const newPayment = await accountingService.recordTenantPayment(paymentData);
                  
                  // Update local state with the response from backend
                  setTenantPayments(prev => [newPayment, ...prev]);
                  addNotification('Payment recorded successfully!', 'success');
                  setShowPaymentModal(false);
                  
                  // Reset form
                  e.target.reset();
                } catch (error) {
                  console.error('Error recording payment:', error);
                  addNotification('Failed to record payment. Please try again.', 'error');
                } finally {
                  setLoading(false);
                }
              }}>
                <div className="form-group">
                  <label htmlFor="tenant">Tenant Name</label>
                  <input type="text" name="tenant" required placeholder="Enter tenant name" />
                </div>
                <div className="form-group">
                  <label htmlFor="property">Property</label>
                  <select name="property" required>
                    <option value="">Select Property</option>
                    <option value="123 Main St">123 Main St</option>
                    <option value="456 Oak Ave">456 Oak Ave</option>
                    <option value="789 Pine Ln">789 Pine Ln</option>
                    <option value="321 Elm St">321 Elm St</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="amount">Amount</label>
                  <input type="number" name="amount" step="0.01" required placeholder="Enter amount" />
                </div>
                <div className="form-group">
                  <label htmlFor="method">Payment Method</label>
                  <select name="method" required>
                    <option value="">Select Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="chargeType">Charge Type</label>
                  <select name="chargeType" required>
                    <option value="">Select Charge</option>
                    <option value="Rent">Rent</option>
                    <option value="Deposit">Deposit</option>
                    <option value="Late Fee">Late Fee</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Approval Modal */}
      {showApprovalModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Payment Approval</h3>
              <button className="modal-close" onClick={() => setShowApprovalModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="approval-details">
                <h4>Payment Details:</h4>
                <p><strong>Tenant:</strong> {selectedPayment.tenant}</p>
                <p><strong>Property:</strong> {selectedPayment.property}</p>
                <p><strong>Amount:</strong> {selectedPayment.amount.toFixed(2)} XOF</p>
                <p><strong>Method:</strong> {selectedPayment.method}</p>
                <p><strong>Date:</strong> {selectedPayment.date}</p>
              </div>
              <p>Are you sure you want to approve this payment?</p>
              <div className="modal-footer">
                <button type="button" className="action-button secondary" onClick={() => setShowApprovalModal(false)}>
                  Cancel
                </button>
                <button type="button" className="action-button primary" onClick={confirmApproval}>
                  Approve Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Landlord Payment Recording Modal */}
      {showLandlordPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowLandlordPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Landlord Payment</h3>
              <button className="modal-close" onClick={() => setShowLandlordPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);
                  const formData = new FormData(e.target);
                  const paymentData = {
                    landlord: formData.get('landlord'),
                    building: formData.get('building'),
                    netAmount: parseFloat(formData.get('netAmount')),
                    commission: parseFloat(formData.get('commission'))
                  };
                  
                  // Call the backend API
                  const newPayment = await accountingService.recordLandlordPayment(paymentData);
                  
                  // Update local state with the response from backend
                  setLandlordPayments(prev => [newPayment, ...prev]);
                  addNotification('Landlord payment recorded successfully!', 'success');
                  setShowLandlordPaymentModal(false);
                  
                  // Reset form
                  e.target.reset();
                } catch (error) {
                  console.error('Error recording landlord payment:', error);
                  addNotification('Failed to record landlord payment. Please try again.', 'error');
                } finally {
                  setLoading(false);
                }
              }}>
                <div className="form-group">
                  <label htmlFor="landlord">Landlord Name</label>
                  <input type="text" name="landlord" required placeholder="Enter landlord name" />
                </div>
                <div className="form-group">
                  <label htmlFor="building">Building</label>
                  <select name="building" required>
                    <option value="">Select Building</option>
                    <option value="123 Main St">123 Main St</option>
                    <option value="456 Oak Ave">456 Oak Ave</option>
                    <option value="789 Pine Ln">789 Pine Ln</option>
                    <option value="321 Elm St">321 Elm St</option>
                    <option value="654 Maple Dr">654 Maple Dr</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="netAmount">Net Amount ($)</label>
                  <input type="number" name="netAmount" step="0.01" required placeholder="Enter net amount" />
                </div>
                <div className="form-group">
                  <label htmlFor="commission">Commission ($)</label>
                  <input type="number" name="commission" step="0.01" required placeholder="Enter commission amount" />
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowLandlordPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Expense</h3>
              <button className="modal-close" onClick={() => setShowExpenseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);
                  const formData = new FormData(e.target);
                  const expenseData = {
                    scope: formData.get('scope'),
                    building: formData.get('scope') === 'SAAF IMMO' ? '-' : formData.get('building'),
                    category: formData.get('category'),
                    amount: parseFloat(formData.get('amount')),
                    date: formData.get('date'),
                    notes: formData.get('notes')
                  };
                  
                  // Call the backend API
                  const newExpense = await accountingService.addExpense(expenseData);
                  
                  // Update local state with the response from backend
                  setExpenses(prev => [newExpense, ...prev]);
                  addNotification('Expense added successfully!', 'success');
                  setShowExpenseModal(false);
                  
                  // Reset form
                  e.target.reset();
                } catch (error) {
                  console.error('Error adding expense:', error);
                  addNotification('Failed to add expense. Please try again.', 'error');
                } finally {
                  setLoading(false);
                }
              }}>
                <div className="form-group">
                  <label>Scope</label>
                  <select name="scope" required>
                    <option value="">Select Scope</option>
                    <option value="Building">Building</option>
                    <option value="SAAF IMMO">SAAF IMMO</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Building (if Building scope)</label>
                  <select name="building">
                    <option value="">Select Building</option>
                    <option value="123 Main St">123 Main St</option>
                    <option value="456 Oak Ave">456 Oak Ave</option>
                    <option value="789 Pine Ln">789 Pine Ln</option>
                    <option value="321 Elm St">321 Elm St</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" required>
                    <option value="">Select Category</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Taxes">Taxes</option>
                    <option value="Software">Software</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input type="number" name="amount" step="0.01" required />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" name="date" required />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input type="text" name="notes" placeholder="Optional" />
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowExpenseModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Expense'}
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

export default AccountingDashboard;