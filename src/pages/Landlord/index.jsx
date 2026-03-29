import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Home,
  FileText,
  DollarSign,
  Users,
  Plus,
  TrendingUp,
  Wrench,
  ClipboardList,
  Receipt,
  CreditCard,
  FileEdit,
  Package,
  BarChart3,
  Settings,
  Megaphone,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  FileCheck,
  StickyNote,
  MessageSquare,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import Modal from '../../components/Modal';
import ReportSubmission from '../../components/ReportSubmission';
import RoleLayout from '../../components/RoleLayout';
import SettingsPage from '../SettingsPage';
import { t, getLanguage } from '../../utils/i18n';
import '../LandlordDashboard.css';
import '../SalesManagerDashboard.css';
import '../../components/RoleLayout.css';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { landlordService } from '../../services/landlordService';
import { messagingService } from '../../services/messagingService';
import { API_CONFIG } from '../../config/api';
import { isDemoMode, getLandlordDemoData } from '../../utils/demoData';
import { MessageCircle } from 'lucide-react';

const LandlordDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // API Data States
  const [overviewData, setOverviewData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [rents, setRents] = useState(null);
  const [netPayments, setNetPayments] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [pendingExpensesForApproval, setPendingExpensesForApproval] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [maintenanceQuotes, setMaintenanceQuotes] = useState([]);
  const [claims, setClaims] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [businessTracking, setBusinessTracking] = useState(null);
  const [advertisements, setAdvertisements] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const carouselIntervalRef = useRef(null);

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
  
  // Messaging states
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const isLoadingUsersRef = useRef(false);
  const messagesEndRef = useRef(null);
  
  // Filter states
  const [netPaymentStatusFilter, setNetPaymentStatusFilter] = useState('');
  const [netPaymentStartDate, setNetPaymentStartDate] = useState('');
  const [netPaymentEndDate, setNetPaymentEndDate] = useState('');
  const [expensePropertyFilter, setExpensePropertyFilter] = useState('');
  const [expenseStartDate, setExpenseStartDate] = useState('');
  const [expenseEndDate, setExpenseEndDate] = useState('');
  const [paymentSubTab, setPaymentSubTab] = useState('net');
  const [tenantNameFilter, setTenantNameFilter] = useState('');
  const [tenantPropertyFilter, setTenantPropertyFilter] = useState('');

  // Property/Asset flow: buildings list → building detail (apartments, images)
  const [pmView, setPmView] = useState('list'); // 'list' | 'building-detail' | 'villa-detail'
  const [buildingDetail, setBuildingDetail] = useState(null);
  const [pmBuildingName, setPmBuildingName] = useState('');
  const [pmPropertyId, setPmPropertyId] = useState(null);
  const [pmLoading, setPmLoading] = useState(false);

  // Tenant detail (same flow as Sales Manager)
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [tenantDetail, setTenantDetail] = useState(null);
  const [tenantDetailLoading, setTenantDetailLoading] = useState(false);

  // Maintenance detail (Works & Claims - click to view full details)
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  // Quote detail (Pending Maintenance Quotes - click to view full details)
  const [selectedQuote, setSelectedQuote] = useState(null);

  const addNotification = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  // Load data from APIs
  const loadData = async () => {
    try {
      setLoading(true);
      
      if (isDemoMode()) {
        // Use demo data
        const demoData = getLandlordDemoData();
        setOverviewData(demoData.overview);
        setProperties(demoData.properties);
        setTenants(demoData.tenants);
        setPayments(demoData.payments);
        setRents(demoData.rents || demoData.overview);
        setWorkOrders(demoData.workOrders);
        setMaintenances(demoData.maintenances || []);
        setClaims(demoData.claims);
        setInventory(demoData.inventory);
        setBusinessTracking(demoData.businessTracking);
        setExpenses(demoData.expenses);
        setLoading(false);
        return;
      }
      
      const [overview, propertiesData, tenantsData, paymentsData, rentsData, workOrdersData, maintenancesData, claimsData, inventoryData, trackingData, expensesData, quotesData] = await Promise.all([
        landlordService.getOverview(),
        landlordService.getProperties().catch(() => []),
        landlordService.getTenants().catch(() => []),
        landlordService.getPayments(),
        landlordService.getRents().catch(() => null),
        landlordService.getWorkOrders(),
        landlordService.getMaintenances().catch(() => []),
        landlordService.getClaims(),
        landlordService.getInventory(),
        landlordService.getBusinessTracking(),
        landlordService.getExpenses({
          property: expensePropertyFilter || undefined,
          startDate: expenseStartDate || undefined,
          endDate: expenseEndDate || undefined,
        }).catch(() => []),
        landlordService.getMaintenanceQuotes().catch(() => []),
      ]);
      
      setOverviewData(overview);
      let props = Array.isArray(propertiesData) ? propertiesData : (propertiesData?.properties ?? propertiesData?.data ?? []);
      if (!Array.isArray(props)) props = [];
      if (props.length === 0) {
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const ownerId = user.ownerId ?? user.landlordId ?? user.id ?? user.ID;
          if (ownerId) {
            const { salesManagerService } = await import('../../services/salesManagerService');
            const ownerAssets = await salesManagerService.getOwnerAssets(ownerId);
            const assets = ownerAssets?.assets ?? ownerAssets?.properties ?? [];
            if (Array.isArray(assets) && assets.length > 0) props = assets;
          }
        } catch (e) {
          console.warn('Landlord properties fallback failed:', e);
        }
      }
      setProperties(props);
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setRents(rentsData);
      setWorkOrders(Array.isArray(workOrdersData) ? workOrdersData : []);
      setMaintenances(Array.isArray(maintenancesData) ? maintenancesData : []);
      setClaims(Array.isArray(claimsData) ? claimsData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setBusinessTracking(trackingData);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setMaintenanceQuotes(Array.isArray(quotesData) ? quotesData : []);
    } catch (error) {
      console.error('Error loading landlord data:', error);
      setProperties([]);
      if (!isDemoMode()) {
        addNotification('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Load net payments
  const loadNetPayments = async () => {
    try {
      const data = await landlordService.getNetPayments({
        status: netPaymentStatusFilter || undefined,
        startDate: netPaymentStartDate || undefined,
        endDate: netPaymentEndDate || undefined,
      });
      setNetPayments(data);
    } catch (error) {
      console.error('Error loading net payments:', error);
      addNotification('Failed to load net payments', 'error');
    }
  };
  
  // Load payment history
  const loadPaymentHistory = async () => {
    try {
      const data = await landlordService.getPaymentHistory({
        startDate: netPaymentStartDate || undefined,
        endDate: netPaymentEndDate || undefined,
      });
      setPaymentHistory(data);
    } catch (error) {
      console.error('Error loading payment history:', error);
      addNotification('Failed to load payment history', 'error');
    }
  };
  
  // Load advertisements when advertisements or overview tab is active
  useEffect(() => {
    if (activeTab === 'advertisements' || activeTab === 'overview') {
      loadAdvertisements();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps


  // Load expenses
  const loadExpenses = async () => {
    try {
      const data = await landlordService.getExpenses({
        property: expensePropertyFilter || undefined,
        startDate: expenseStartDate || undefined,
        endDate: expenseEndDate || undefined,
      });
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading expenses:', error);
      addNotification('Failed to load expenses', 'error');
    }
  };

  // Load building expenses pending owner approval
  const loadPendingExpensesForApproval = async () => {
    try {
      const data = await landlordService.getPendingExpensesForApproval();
      setPendingExpensesForApproval(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading pending expenses:', error);
      setPendingExpensesForApproval([]);
    }
  };

  const handleApproveExpense = async (expenseId) => {
    if (!window.confirm('Approve this expense?')) return;
    try {
      setLoading(true);
      await landlordService.approveExpense(expenseId);
      addNotification('Expense approved successfully', 'success');
      await loadPendingExpensesForApproval();
      await loadExpenses();
    } catch (error) {
      addNotification(error.message || 'Failed to approve expense', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectExpense = async (expenseId) => {
    if (!window.confirm('Reject this expense?')) return;
    try {
      setLoading(true);
      await landlordService.rejectExpense(expenseId);
      addNotification('Expense rejected', 'success');
      await loadPendingExpensesForApproval();
      await loadExpenses();
    } catch (error) {
      addNotification(error.message || 'Failed to reject expense', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);
  
  // Load net payments when filters change
  useEffect(() => {
    if (activeTab === 'payments') {
      loadNetPayments();
      loadPaymentHistory();
    }
  }, [netPaymentStatusFilter, netPaymentStartDate, netPaymentEndDate, activeTab]);
  
  // Load expenses and pending expenses when filters change
  useEffect(() => {
    if (activeTab === 'expenses') {
      loadExpenses();
      loadPendingExpensesForApproval();
    }
  }, [expensePropertyFilter, expenseStartDate, expenseEndDate, activeTab]);

  // Fetch full tenant details when a tenant is selected (same as Sales Manager)
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
        const data = await landlordService.getTenant(selectedTenantId);
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

  // Send message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedUserId) return;
    
    const content = chatInput.trim();
    const tempMessageId = `temp-${Date.now()}`;
    
    // Optimistic update
    const storedUser = localStorage.getItem('user');
    let currentUserId = null;
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        currentUserId = user.id || user.ID;
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    
    const tempMessage = {
      id: tempMessageId,
      fromUserId: currentUserId,
      toUserId: selectedUserId,
      content: content,
      read: false,
      createdAt: new Date().toISOString(),
      type: 'message',
    };
    
    setChatMessages(prev => [...prev, tempMessage]);
    setChatInput('');
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    try {
      const message = await messagingService.sendMessage({
        toUserId: selectedUserId,
        content: content,
      });
      
      // Replace temp message with actual message
      setChatMessages(prev => prev.map(msg => 
        msg.id === tempMessageId ? message : msg
      ));
      
      // Reload chat to get updated conversation
      await loadChatForUser(selectedUserId);
    } catch (error) {
      console.error('Error sending message:', error);
      addNotification(error.message || 'Failed to send message', 'error');
      // Remove optimistic message on error
      setChatMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      setChatInput(content); // Restore input on error
    }
  };
  
  // Load users when chat tab is active (only once per tab switch)
  useEffect(() => {
    if (activeTab === 'chat' && !isLoadingUsersRef.current) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Only depend on activeTab, not loadUsers
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Action handlers
  const handleAddProperty = async (propertyData) => {
    try {
      await landlordService.addProperty(propertyData);
      addNotification('Property added successfully', 'success');
      setShowPropertyModal(false);
      loadData();
    } catch (error) {
      console.error('Error adding property:', error);
      addNotification('Failed to add property', 'error');
    }
  };

  const handleCreateWorkOrder = async (workOrderData) => {
    try {
      await landlordService.createWorkOrder(workOrderData);
      addNotification('Work order created successfully', 'success');
      setShowWorkOrderModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating work order:', error);
      addNotification('Failed to create work order', 'error');
    }
  };

  const handleCreateClaim = async (claimData) => {
    try {
      await landlordService.createClaim(claimData);
      addNotification('Claim created successfully', 'success');
      setShowClaimModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating claim:', error);
      addNotification('Failed to create claim', 'error');
    }
  };

  const handleAddInventory = async (inventoryData) => {
    try {
      await landlordService.addInventory(inventoryData);
      addNotification('Inventory added successfully', 'success');
      setShowInventoryModal(false);
      loadData();
    } catch (error) {
      console.error('Error adding inventory:', error);
      addNotification('Failed to add inventory', 'error');
    }
  };

  const handleGenerateReceipt = async (receiptData) => {
    try {
      const receipt = await landlordService.generateReceipt(receiptData);
      addNotification('Receipt generated successfully', 'success');
      setShowReceiptModal(false);
      // You could also trigger a download here
      console.log('Generated receipt:', receipt);
    } catch (error) {
      console.error('Error generating receipt:', error);
      addNotification('Failed to generate receipt', 'error');
    }
  };

  // Generate Receipt Function
  const generateReceipt = () => {
    const receiptData = {
      receiptNumber: `RCP-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      landlord: 'John Doe',
      property: '123 Main Street',
      tenant: 'Jane Smith',
      amount: '1,200.00 XOF',
      period: 'November 2024',
      description: 'Monthly Rent Payment'
    };

    // Create receipt content
    const receiptContent = `
      REAL ESTATE RENTAL RECEIPT
      =========================
      
      Receipt No: ${receiptData.receiptNumber}
      Date: ${receiptData.date}
      
      Landlord: ${receiptData.landlord}
      Property: ${receiptData.property}
      Tenant: ${receiptData.tenant}
      
      Description: ${receiptData.description}
      Period: ${receiptData.period}
      Amount: ${receiptData.amount}
      
      Payment Method: Bank Transfer
      Status: Received
      
      Thank you for your payment!
      
      Generated on: ${new Date().toLocaleString()}
    `;

    // Create and download the receipt
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addNotification('Receipt generated and downloaded!', 'success');
  };

  // Generate Lease Function
  const generateLease = () => {
    const leaseData = {
      leaseId: `LEASE-${Date.now()}`,
      landlord: 'John Doe',
      tenant: 'Jane Smith',
      property: '123 Main Street',
      rent: '1,200.00 XOF',
      deposit: '2,400.00 XOF',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    };

    const leaseContent = `
      RESIDENTIAL LEASE AGREEMENT
      ==========================
      
      Lease ID: ${leaseData.leaseId}
      
      LANDLORD: ${leaseData.landlord}
      TENANT: ${leaseData.tenant}
      PROPERTY: ${leaseData.property}
      
      TERMS:
      - Monthly Rent: ${leaseData.rent}
      - Security Deposit: ${leaseData.deposit}
      - Lease Start: ${leaseData.startDate}
      - Lease End: ${leaseData.endDate}
      
      This lease agreement is generated automatically.
      Please review and sign accordingly.
      
      Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([leaseContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lease-${leaseData.leaseId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addNotification('Lease agreement generated and downloaded!', 'success');
  };

  // Other button functions
  const handleScheduleVisit = () => {
    addNotification('Visit scheduling feature opened!', 'info');
  };

  const handleMobilePayment = () => {
    addNotification('Mobile payment portal opened!', 'info');
  };

  const handlePOSPayment = () => {
    addNotification('POS terminal opened!', 'info');
  };


  const handleGenerateReport = () => {
    const reportContent = `
      MONTHLY FINANCIAL REPORT
      ========================
      
      Report Date: ${new Date().toLocaleDateString()}
      Period: November 2024
      
      INCOME:
      - Total Rent Collected: 6,000.00 XOF
      - Late Fees: 0.00 XOF
      - Other Income: 0.00 XOF
      Total Income: 6,000.00 XOF
      
      EXPENSES:
      - Maintenance: 400.00 XOF
      - Management Fee: 600.00 XOF
      - Insurance: 150.00 XOF
      - Utilities: 200.00 XOF
      Total Expenses: 1,350.00 XOF
      
      NET INCOME: 4,650.00 XOF
      
      Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().slice(0, 7)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addNotification('Financial report generated and downloaded!', 'success');
  };

  // State to force re-render when language changes
  const [language, setLanguage] = useState(getLanguage());
  
  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(getLanguage());
    };
    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: t('nav.overview'), icon: Home },
      { id: 'properties', label: t('nav.propertyAsset'), icon: Home },
      { id: 'tenants', label: t('nav.tenants'), icon: Users },
      { id: 'payments', label: t('nav.paymentsCashFlow'), icon: DollarSign },
      { id: 'rents', label: t('nav.rentsTracking'), icon: DollarSign },
      { id: 'expenses', label: t('nav.expenses'), icon: FileText },
      { id: 'works', label: t('nav.worksClaims'), icon: Wrench },
      { id: 'tracking', label: t('nav.businessTracking'), icon: BarChart3 },
      { id: 'advertisements', label: t('nav.advertisements'), icon: Megaphone },
      { id: 'chat', label: t('nav.messaging'), icon: MessageCircle },
      { id: 'settings', label: t('nav.profileSettings'), icon: Settings }
    ],
    [language]
  );

  const renderOverview = () => {
    if (loading) {
      return <div className="sa-table-empty">Loading overview data...</div>;
    }

    // Calculate active tenants from tenants array (fallback if not in overview)
    const activeTenantsCount = overviewData?.activeTenants || tenants.filter(t => 
      (t.status || t.Status || '').toLowerCase() === 'active'
    ).length;
    
    // Calculate occupancy rate if not provided
    const totalProps = overviewData?.totalPropertiesUnderManagement || properties.length;
    const occupiedProps = overviewData?.occupiedProperties || properties.filter(p => 
      (p.Status || p.status || '').toLowerCase() === 'occupied'
    ).length;
    const occupancyRate = totalProps > 0 ? ((occupiedProps / totalProps) * 100).toFixed(1) : 0;
    
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = currentUser.name || currentUser.Name || 'Landlord';

    return (
      <div className="sa-overview-page">
        <div className="sa-overview-top">
          <div className="sa-overview-chart-card">
            <div className="sa-card-header">
              <h2>Landlord Dashboard</h2>
              <span className="sa-card-subtitle">Welcome, {userName}!</span>
          </div>
            <div className="sa-mini-legend">
              <span className="sa-legend-item sa-legend-expected">Rent Collected (XOF)</span>
              <span className="sa-legend-item sa-legend-current">Net Payout (XOF)</span>
          </div>
            <div style={{ width: '100%', height: '200px', marginTop: '20px' }}>
              <ResponsiveContainer>
                <AreaChart
                  data={(() => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                    const currentRent = overviewData?.totalRentCollected || 0;
                    const currentPayout = overviewData?.totalNetPayoutReceived || 0;
                    return months.map((month, index) => ({
                      month,
                      rent: Math.round(currentRent * (0.7 + (index * 0.05))),
                      payout: Math.round(currentPayout * (0.7 + (index * 0.05)))
                    }));
                  })()}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorRentLandlord" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
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
                      if (name === 'payout') return [`${value.toLocaleString()} XOF`, 'Net Payout'];
                      return value;
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="line"
                  />
                  <Area
                    type="natural"
                    dataKey="rent"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorRentLandlord)"
                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name="Rent Collected"
                  />
                  <Area
                    type="natural"
                    dataKey="payout"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#colorPayout)"
                    dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name="Net Payout"
                  />
                </AreaChart>
              </ResponsiveContainer>
          </div>
          </div>

          <div className="sa-overview-metrics">
            <div className="sa-metric-card sa-metric-primary">
              <p className="sa-metric-label">Total Properties</p>
              <p className="sa-metric-period">Under Management</p>
              <p className="sa-metric-value">{overviewData?.totalPropertiesUnderManagement || properties.length || 0}</p>
          </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Total Rent Collected</p>
              <p className="sa-metric-period">All Time</p>
              <p className="sa-metric-value">{(overviewData?.totalRentCollected || 0).toLocaleString()} XOF</p>
          </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Net Payout Received</p>
              <p className="sa-metric-number">{(overviewData?.totalNetPayoutReceived || 0).toLocaleString()} XOF</p>
          </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Active Tenants</p>
              <p className="sa-metric-number">{activeTenantsCount}</p>
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
                  <h3>Property Management</h3>
                  <p>
                    Manage your properties, tenants, and payments all in one place.
                  </p>
            </div>
          </div>
            )}
            </div>
            </div>

        <div className="sa-section-card" style={{ marginTop: '24px' }}>
          <div className="sa-section-header">
            <h3>Quick Actions</h3>
            <p>Manage your properties and view key metrics.</p>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('properties')}>
                <p className="sa-metric-label">Occupied Properties</p>
                <p className="sa-metric-value">{overviewData?.occupiedProperties || occupiedProps}</p>
            </div>
              <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('properties')}>
                <p className="sa-metric-label">Occupancy Rate</p>
                <p className="sa-metric-value">{occupancyRate}%</p>
            </div>
              <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('payments')}>
                <p className="sa-metric-label">Payment Rate</p>
                <p className="sa-metric-value">{overviewData?.paymentRate || 0}%</p>
          </div>
            </div>
            </div>
          </div>

          </div>
        );
  };
      
  const handleViewBuilding = async (property) => {
    const propId = property.id ?? property.ID;
    if (!propId) return;
    setPmLoading(true);
    try {
      const data = await landlordService.getPropertyBuildingDetail(propId);
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
    const propId = property.id ?? property.ID;
    if (!propId) return;
    setPmLoading(true);
    try {
      const data = await landlordService.getPropertyBuildingDetail(propId);
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

  const renderProperties = () => {
    // Building/Villa detail view – apartments table with images (read-only for landlord)
    if (pmView === 'building-detail' && buildingDetail) {
      const units = buildingDetail.units || [];
      const totalApartments = buildingDetail.totalApartments ?? units.length;
      const images = buildingDetail.images || [];
      const firstImage = images[0];
      return (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="button" className="sa-primary-cta" style={{ padding: '8px 12px' }} onClick={() => { setPmView('list'); setBuildingDetail(null); setPmPropertyId(null); setPmBuildingName(''); }}>
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
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {images.slice(1, 5).map((img, i) => (
                  <img key={i} src={img} alt={`${pmBuildingName} ${i + 2}`} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                ))}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{pmBuildingName.toUpperCase()}</h3>
              <p style={{ margin: 0, color: '#6b7280' }}>Total of apartments: <strong>{totalApartments}</strong></p>
            </div>
          </div>
          <div className="sa-section-card" style={{ marginTop: '20px' }}>
      <div className="sa-table-wrapper">
        <table className="sa-table">
            <thead>
              <tr>
                    <th>Apartments</th>
                <th>Type</th>
                    <th>Tenant</th>
                <th>Rent</th>
                    <th>Enter date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
                  {units.map((row, i) => (
                    <tr key={row.id || i}>
                      <td>{row.unitNumber || row.name || `Apartment ${i + 1}`}</td>
                      <td>{row.type || '—'}</td>
                      <td>{row.tenant || '—'}</td>
                      <td>{typeof row.rentPrice === 'number' ? row.rentPrice.toLocaleString() : row.rentPrice || '—'} F CFA</td>
                      <td>{row.enterDate || '—'}</td>
                      <td>{row.status || row.statut || '—'}</td>
              </tr>
                  ))}
                </tbody>
              </table>
                    </div>
          </div>
        </div>
      );
    }

    if (pmView === 'villa-detail' && buildingDetail) {
      const units = buildingDetail.units || [];
      const totalApartments = buildingDetail.totalApartments ?? units.length;
      const images = buildingDetail.images || [];
      const firstImage = images[0];
      return (
        <div className="sa-clients-page">
          <div className="sa-clients-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="button" className="sa-primary-cta" style={{ padding: '8px 12px' }} onClick={() => { setPmView('list'); setBuildingDetail(null); setPmPropertyId(null); setPmBuildingName(''); }}>
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
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {images.slice(1, 5).map((img, i) => (
                  <img key={i} src={img} alt={`${pmBuildingName} ${i + 2}`} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                ))}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{pmBuildingName.toUpperCase()}</h3>
              <p style={{ margin: 0, color: '#6b7280' }}>Total of apartments: <strong>{totalApartments}</strong></p>
            </div>
          </div>
          <div className="sa-section-card" style={{ marginTop: '20px' }}>
            <div className="sa-table-wrapper">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Villa</th>
                    <th>Type</th>
                    <th>Tenant</th>
                    <th>Rent</th>
                    <th>Enter date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((row, i) => (
                    <tr key={row.id || i}>
                      <td>{row.unitNumber || row.name || 'VILLA'}</td>
                      <td>{row.type || '—'}</td>
                      <td>{row.tenant || '—'}</td>
                      <td>{typeof row.rentPrice === 'number' ? row.rentPrice.toLocaleString() : row.rentPrice || '—'} F CFA</td>
                      <td>{row.enterDate || '—'}</td>
                      <td>{row.status || row.statut || '—'}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
            </div>
        </div>
    </div>
  );
    }

    // Buildings list – click to see apartments
    const propType = (p) => (p.Type || p.type || p.PropertyType || p.propertyType || '').toString().toLowerCase();
    const isBuilding = (p) => ['building', 'apartment', 'condo', 'house', 'studio'].some(t => propType(p).includes(t));
    const isVilla = (p) => propType(p).includes('villa');
    const buildings = properties.filter(isBuilding);
    const villas = properties.filter(isVilla);
    const others = properties.filter(p => !isBuilding(p) && !isVilla(p));

    return (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
            <h2>Property & Asset Management</h2>
            <p>{properties.length} properties found – click a building or villa to see apartments</p>
        </div>
      </div>
        {pmLoading && <p style={{ marginTop: 8 }}>Loading…</p>}
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Apartments</th>
                  <th>Rent</th>
                  <th>Income</th>
                  <th>Location</th>
                  <th>Occupancy</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
                {[...buildings, ...villas, ...others].map((property, index) => {
                  const type = propType(property);
                  const isV = type.includes('villa');
                  const handleClick = () => isV ? handleViewVilla(property) : handleViewBuilding(property);
                  const apartmentsDisplay = property.apartmentsDisplay ?? property.apartments ?? property.NumberOfUnits ?? property.numberOfUnits ?? '—';
                  return (
                    <tr
                      key={property.ID || property.id || `property-${index}`}
                      style={{ cursor: 'pointer' }}
                      onClick={handleClick}
                      className="clickable-row"
                    >
                  <td className="sa-cell-main">
                        <span className="sa-cell-title">{property.Address || property.address || property.name || property.building || 'Unknown'}</span>
                  </td>
                      <td>{property.Type || property.type || 'N/A'}</td>
                      <td>{apartmentsDisplay}</td>
                      <td>{typeof property.rentPrice === 'number' ? property.rentPrice.toLocaleString() : property.Rent?.toLocaleString() || property.rent?.toLocaleString() || '—'}</td>
                      <td>{(property.income ?? property.Income ?? 0).toLocaleString()} XOF</td>
                      <td>{property.location || property.localisation || property.Address || property.address || '—'}</td>
                      <td>{property.occupancy ?? '—'}</td>
                      <td>{property.statut || property.Status || property.status || '—'}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="sa-icon-button" title="View" onClick={handleClick}>👁️</button>
                  </td>
                </tr>
                  );
                })}
                {properties.length === 0 && !pmLoading && (
                  <tr>
                    <td colSpan={9} className="sa-table-empty">No properties found</td>
                  </tr>
            )}
          </tbody>
        </table>
          </div>
      </div>
    </div>
  );
  };

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
          <button type="button" className="sa-outline-button sa-tenant-detail-back-btn" onClick={() => { setSelectedTenantId(null); setTenantDetail(null); }} style={{ marginBottom: '16px' }}>
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
          <button type="button" className="sa-outline-button sa-tenant-detail-back-btn" onClick={() => { setSelectedTenantId(null); setTenantDetail(null); }}>
            <ArrowLeft size={16} />
            Back to list
          </button>
        </div>
        <div className="sa-section-card" style={{ marginBottom: '24px' }}>
          <div className="sa-tenant-detail-hero">
            <div className="sa-tenant-detail-avatar">{(name || 'T').charAt(0).toUpperCase()}</div>
            <div>
              <h2>{name}</h2>
              <span className={`sa-status-pill ${(status || '').toLowerCase().replace(/\s+/g, '-')}`} style={{ marginRight: '8px' }}>{status}</span>
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
            <h3><Users size={18} /> Personal information</h3>
            <dl className="sa-tenant-detail-dl">
              <div><dt>Name</dt><dd>{name}</dd></div>
              {email && <div><dt>Email</dt><dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {email}</dd></div>}
              {phone && <div><dt>Phone</dt><dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {phone}</dd></div>}
              <div><dt>Status</dt><dd><span className={`sa-status-pill ${(status || '').toLowerCase().replace(/\s+/g, '-')}`}>{status}</span></dd></div>
              {createdAt && <div><dt>Member since</dt><dd>{new Date(createdAt).toLocaleDateString()}</dd></div>}
            </dl>
            <h4 style={{ margin: '16px 0 8px', fontSize: '0.9rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}><FileCheck size={16} /> Files & documents</h4>
            <p className="sa-cell-sub" style={{ margin: 0 }}>No files uploaded yet.</p>
          </div>
          <div className="sa-section-card sa-tenant-detail-card">
            <h3><DollarSign size={18} /> Rent & payment</h3>
            <dl className="sa-tenant-detail-dl">
              <div><dt>Property</dt><dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {propertyAddr}</dd></div>
              {unitNumber && unitNumber !== '—' && <div><dt>Unit</dt><dd>{unitNumber}</dd></div>}
              <div><dt>Monthly rent</dt><dd className="sa-tenant-detail-value-bold">{Number(amount).toLocaleString()} XOF</dd></div>
              <div><dt>Last payment</dt><dd>{lastPayment ? new Date(lastPayment).toLocaleDateString() : '—'}</dd></div>
            </dl>
          </div>
          {prop && (
            <div className="sa-section-card sa-tenant-detail-card">
              <h3><Building size={18} /> Property details</h3>
              <dl className="sa-tenant-detail-dl">
                <div><dt>Type</dt><dd>{prop.type || prop.Type || '—'}</dd></div>
                {(prop.bedrooms ?? prop.Bedrooms) != null && <div><dt>Bedrooms</dt><dd>{prop.bedrooms ?? prop.Bedrooms}</dd></div>}
                {(prop.bathrooms ?? prop.Bathrooms) != null && <div><dt>Bathrooms</dt><dd>{prop.bathrooms ?? prop.Bathrooms}</dd></div>}
                <div><dt>Property status</dt><dd><span className={`sa-status-pill ${(prop.status || prop.Status || '').toLowerCase()}`}>{prop.status || prop.Status || '—'}</span></dd></div>
              </dl>
            </div>
          )}
          <div className="sa-section-card sa-tenant-detail-card" style={alertList.length ? undefined : { gridColumn: '1 / -1' }}>
            <h3><AlertTriangle size={18} /> Alerts & activity</h3>
            {alertList.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alertList.map((alert, idx) => (
                  <li key={alert.ID || alert.id || idx} className="sa-tenant-detail-alert-item">
                    <div className="sa-tenant-detail-alert-title">{alert.Title || alert.title || 'Alert'}</div>
                    {alert.Message && <div className="sa-cell-sub" style={{ marginBottom: '4px' }}>{alert.Message}</div>}
                    <div className="sa-tenant-detail-alert-meta">{(alert.Urgency || alert.urgency || '').toLowerCase()} · {alert.Status || alert.status || 'Open'}{alert.Amount != null && ` · ${Number(alert.Amount).toLocaleString()} XOF`}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sa-cell-sub">No alerts for this tenant.</p>
            )}
          </div>
          <div className="sa-section-card sa-tenant-detail-card">
            <h3><Wrench size={18} /> Maintenances requested</h3>
            {maintenancesList.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {maintenancesList.map((m, idx) => (
                  <li key={m.ID ?? m.id ?? idx} className="sa-tenant-detail-alert-item">
                    <div className="sa-tenant-detail-alert-title">{m.Issue || m.issue || 'Maintenance'}</div>
                    <div className="sa-tenant-detail-alert-meta">{(m.Status || m.status || '—')} · {(m.Priority || m.priority || '—')}{m.CreatedAt && ` · ${new Date(m.CreatedAt).toLocaleDateString()}`}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sa-cell-sub">No maintenance requests for this tenant.</p>
            )}
          </div>
          <div className="sa-section-card sa-tenant-detail-card">
            <h3><Receipt size={18} /> Recent payment history</h3>
            {paymentsList.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {paymentsList.slice(0, 10).map((p, idx) => (
                  <li key={p.ID || p.id || idx} className="sa-tenant-detail-alert-item" style={{ borderLeftColor: (p.Status || p.status) === 'Approved' ? '#16a34a' : '#f59e0b' }}>
                    <div className="sa-tenant-detail-alert-title">{Number(p.Amount ?? p.amount ?? 0).toLocaleString()} XOF · {(p.Status || p.status || '—')}</div>
                    <div className="sa-tenant-detail-alert-meta">{p.Date ? new Date(p.Date).toLocaleDateString() : (p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString() : '—')}{(p.Method || p.method) && ` · ${p.Method || p.method}`}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sa-cell-sub">No payment history for this tenant.</p>
            )}
          </div>
          <div className="sa-section-card sa-tenant-detail-card">
            <h3><StickyNote size={18} /> Private notes</h3>
            {privateNotesList.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {privateNotesList.map((n) => (
                  <li key={n.id ?? n.ID} className="sa-tenant-detail-alert-item" style={{ borderLeftColor: '#6366f1' }}>
                    <div className="sa-tenant-detail-alert-title">{n.note ?? n.Note}</div>
                    <div className="sa-tenant-detail-alert-meta">{n.createdAt ? new Date(n.createdAt).toLocaleString() : (n.CreatedAt ? new Date(n.CreatedAt).toLocaleString() : '')}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sa-cell-sub">No private notes yet.</p>
            )}
          </div>
          <div className="sa-section-card sa-tenant-detail-card">
            <h3><AlertCircle size={18} /> Quick actions</h3>
            <div className="sa-tenant-detail-quick-actions">
              <button type="button" className="sa-outline-button" onClick={() => addNotification('Generate Receipt – feature coming soon', 'info')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Receipt size={16} /> Generate Receipt</button>
              <button type="button" className="sa-outline-button" onClick={() => addNotification('Send Reminder SMS – feature coming soon', 'info')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><MessageSquare size={16} /> Send Reminder SMS</button>
            </div>
          </div>
        </div>
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-tenant-detail-footer">
            <span className="sa-tenant-detail-updated">Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderTenants = () => {
    if (selectedTenantId) return renderTenantDetail();
    const filteredTenants = tenants.filter(t => {
      const name = (t.name ?? t.Name ?? '').toLowerCase();
      const prop = (t.property ?? t.Property ?? '');
      const nameMatch = !tenantNameFilter || name.includes(tenantNameFilter.toLowerCase().trim());
      const propMatch = !tenantPropertyFilter || prop === tenantPropertyFilter;
      return nameMatch && propMatch;
    });
    const tenantProps = tenants.map(t => t.property ?? t.Property).filter(Boolean);
    const landlordProps = properties.map(p => p.Address ?? p.address ?? p.name).filter(Boolean);
    const uniqueProperties = [...new Set([...tenantProps, ...landlordProps])].filter(Boolean).sort();
    return (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
            <h2>Tenant Management</h2>
            <p>{filteredTenants.length} tenants found – click a tenant to see full details</p>
                      </div>
        <div className="sa-clients-header-right">
            <div className="sa-filters-section">
            <input
              type="text"
              className="sa-filter-select"
              placeholder="Filter by name..."
              value={tenantNameFilter}
              onChange={(e) => setTenantNameFilter(e.target.value)}
            />
            <select
              className="sa-filter-select"
              value={tenantPropertyFilter}
              onChange={(e) => setTenantPropertyFilter(e.target.value)}
            >
              <option value="">All Properties</option>
              {uniqueProperties.map(addr => (
                <option key={addr} value={addr}>{addr}</option>
              ))}
            </select>
        </div>
                    </div>
        </div>
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
                  <th>Tenant Name</th>
                  <th>Property</th>
                  <th>Rent Amount</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
                {filteredTenants.map((tenant, index) => {
                  const tenantId = tenant.id ?? tenant.ID;
                  const tenantName = tenant.name ?? tenant.Name ?? 'N/A';
                  return (
                    <tr
                      key={tenantId ?? index}
                      style={{ cursor: 'pointer' }}
                      onClick={() => tenantId && setSelectedTenantId(String(tenantId))}
                      className="clickable-row"
                    >
                      <td>{index + 1}</td>
                      <td className="sa-cell-main"><span className="sa-cell-title">{tenantName}</span></td>
                      <td>{tenant.property ?? tenant.Property ?? 'N/A'}</td>
                      <td>{(tenant.amount ?? tenant.Amount ?? 0).toLocaleString()} XOF</td>
                      <td><span className={`sa-status-pill ${(tenant.status ?? tenant.Status ?? 'active').toLowerCase().replace(/\s+/g, '-')}`}>{tenant.status ?? tenant.Status ?? 'Active'}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="sa-icon-button" title="View" onClick={() => tenantId && setSelectedTenantId(String(tenantId))}>👁️</button>
              </td>
            </tr>
                  );
                })}
                {filteredTenants.length === 0 && (
                  <tr><td colSpan={6} className="sa-table-empty">No tenants found</td></tr>
                )}
          </tbody>
        </table>
          </div>
                </div>
              </div>
  );
  };

  const renderPayments = () => {
    return (
      <div className="sa-transactions-page">
        <div className="sa-transactions-header">
      <h2>Rent Repayments (Agency to Landlord)</h2>
        </div>
        
        <div className="sa-transactions-tabs">
          <button 
            className={`sa-subtab-button ${paymentSubTab === 'net' ? 'active' : ''}`}
            onClick={() => {
              setPaymentSubTab('net');
              loadNetPayments();
            }}
          >
            Net Payments
          </button>
          <button 
            className={`sa-subtab-button ${paymentSubTab === 'history' ? 'active' : ''}`}
            onClick={() => {
              setPaymentSubTab('history');
              loadPaymentHistory();
            }}
          >
            Payment History
          </button>
        </div>

        {paymentSubTab === 'net' && (
          <div className="sa-clients-page">
            <div className="sa-clients-header">
        <div>
                <h2>Net Payments After Commission</h2>
                <p>View net payments after commission deduction</p>
              </div>
              <div className="sa-clients-header-right">
                <div className="sa-filters-section">
                  <select 
                    className="sa-filter-select"
                    value={netPaymentStatusFilter}
                    onChange={(e) => setNetPaymentStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                  <input
                    type="date"
                    className="sa-filter-select"
                    value={netPaymentStartDate}
                    onChange={(e) => setNetPaymentStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    className="sa-filter-select"
                    value={netPaymentEndDate}
                    onChange={(e) => setNetPaymentEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                </div>
        </div>
      </div>
      
            {netPayments && (
              <>
                <div className="sa-overview-metrics" style={{ marginBottom: '24px' }}>
                  <div className="sa-metric-card">
                    <p className="sa-metric-label">Total Net Amount</p>
                    <p className="sa-metric-value">{netPayments.totalNetAmount?.toLocaleString() || 0} XOF</p>
                  </div>
                  <div className="sa-metric-card">
                    <p className="sa-metric-label">Total Commission</p>
                    <p className="sa-metric-value">{netPayments.totalCommission?.toLocaleString() || 0} XOF</p>
                  </div>
                </div>

                <div className="sa-table-wrapper">
                  <table className="sa-table">
            <thead>
              <tr>
                        <th>No</th>
                        <th>Date</th>
                        <th>Landlord</th>
                        <th>Building</th>
                        <th>Net Amount</th>
                        <th>Commission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
                      {(!netPayments.payments || netPayments.payments.length === 0) ? (
                        <tr>
                          <td colSpan={7} className="sa-table-empty">No net payments found</td>
              </tr>
                      ) : (
                        netPayments.payments.map((payment, index) => (
                          <tr key={payment.id || payment.ID || `net-payment-${index}`}>
                            <td>{index + 1}</td>
                            <td>{new Date(payment.date || payment.Date).toLocaleDateString()}</td>
                            <td className="sa-cell-main">
                              <span className="sa-cell-title">{payment.landlord || payment.Landlord || 'Unknown'}</span>
                </td>
                            <td>{payment.building || payment.Building || 'Unknown'}</td>
                            <td>{(payment.netAmount || payment.NetAmount || 0).toLocaleString()} XOF</td>
                            <td>{(payment.commission || payment.Commission || 0).toLocaleString()} XOF</td>
                            <td>
                              <span className={`sa-status-pill ${(payment.status || payment.Status || 'pending').toLowerCase()}`}>
                                {payment.status || payment.Status || 'Pending'}
                    </span>
                </td>
              </tr>
                        ))
                      )}
            </tbody>
          </table>
                  </div>
              </>
      )}
          </div>
        )}

        {paymentSubTab === 'history' && (
          <div className="sa-clients-page">
            <div className="sa-clients-header">
        <div>
                <h2>Payment & Payout History</h2>
                <p>View payment and payout history</p>
              </div>
              <div className="sa-clients-header-right">
                <div className="sa-filters-section">
                  <input
                    type="date"
                    className="sa-filter-select"
                    value={netPaymentStartDate}
                    onChange={(e) => setNetPaymentStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    className="sa-filter-select"
                    value={netPaymentEndDate}
                    onChange={(e) => setNetPaymentEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                </div>
              </div>
            </div>
                
            {paymentHistory && paymentHistory.payouts && paymentHistory.payouts.length > 0 ? (
              <>
                <div className="sa-section-card">
                  <div className="sa-section-header">
                    <div>
                      <h3>Payouts</h3>
                      <p>Net payments after commission</p>
                    </div>
                  </div>
                  <div className="sa-table-wrapper">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Date</th>
                          <th>Landlord</th>
                          <th>Building</th>
                          <th>Net Amount</th>
                          <th>Commission</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.payouts.map((payout, index) => (
                          <tr key={payout.id || payout.ID || `payout-${index}`}>
                            <td>{index + 1}</td>
                            <td>{new Date(payout.date || payout.Date).toLocaleDateString()}</td>
                            <td className="sa-cell-main">
                              <span className="sa-cell-title">{payout.landlord || payout.Landlord || 'Unknown'}</span>
                            </td>
                            <td>{payout.building || payout.Building || 'Unknown'}</td>
                            <td>{(payout.netAmount || payout.NetAmount || 0).toLocaleString()} XOF</td>
                            <td>{(payout.commission || payout.Commission || 0).toLocaleString()} XOF</td>
                            <td>
                              <span className={`sa-status-pill ${(payout.status || payout.Status || 'pending').toLowerCase()}`}>
                                {payout.status || payout.Status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="sa-section-card">
                <div className="sa-table-empty">No payouts found</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRentalManagement = () => (
    <div className="sa-overview-page">
      <div className="sa-overview-metrics" style={{ width: '100%' }}>
        <div className="sa-metric-card sa-metric-primary">
          <p className="sa-metric-label">Generation of Lease Agreements</p>
          <p className="sa-metric-value">Active</p>
          </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Rent Reviews</p>
          <p className="sa-metric-number">Track</p>
                </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Adjustment of Charges</p>
          <p className="sa-metric-number">Available</p>
                </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Tenant Interface</p>
          <p className="sa-metric-number">Active</p>
                </div>
      </div>
                  </div>
  );

  const renderMaintenanceDetail = () => {
    const m = selectedMaintenance;
    if (!m) return null;

    let photos = [];
    try {
      const raw = m.Photos || m.photos || m.PhotoURLs || m.photoURLs;
      if (Array.isArray(raw)) {
        photos = raw;
      } else if (typeof raw === 'string' && raw.trim()) {
        photos = JSON.parse(raw) || [];
      }
    } catch (_) {
      photos = [];
    }

    const status = (m.Status || m.status || '').toLowerCase();
    const canApprove = status !== 'approved' && status !== 'completed';

    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header" style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className="sa-outline-button sa-tenant-detail-back-btn"
            onClick={() => setSelectedMaintenance(null)}
          >
            <ArrowLeft size={16} />
            Back to list
          </button>
        </div>
        <div className="sa-section-card" style={{ marginBottom: '24px' }}>
          <div className="sa-section-header" style={{ marginBottom: '24px' }}>
            <div>
              <h2>Maintenance Request Details</h2>
              <p>Review all details and approve to authorize work</p>
            </div>
            {canApprove && (
              <button
                className="sa-primary-cta"
                style={{ backgroundColor: '#16a34a' }}
                disabled={loading}
                onClick={async () => {
                  try {
                    await landlordService.approveMaintenance(m.ID || m.id);
                    addNotification('Maintenance approved successfully', 'success');
                    setSelectedMaintenance(null);
                    loadData();
                  } catch (err) {
                    console.error('Error approving maintenance:', err);
                    addNotification(err?.message || 'Failed to approve maintenance', 'error');
                  }
                }}
              >
                <FileCheck size={18} />
                Approve Maintenance
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Issue / Description</label>
              <p style={{ margin: 0, color: '#1f2937', whiteSpace: 'pre-wrap', fontSize: '1rem' }}>
                {m.Issue || m.issue || 'N/A'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Property</label>
                <p style={{ margin: 0, color: '#1f2937' }}>{m.Property || m.property || '—'}</p>
              </div>
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Tenant</label>
                <p style={{ margin: 0, color: '#1f2937' }}>{m.Tenant || m.tenant || '—'}</p>
              </div>
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Priority</label>
                <span className={`sa-status-pill ${(m.Priority || m.priority || 'medium').toLowerCase()}`}>
                  {m.Priority || m.priority || 'Medium'}
                </span>
              </div>
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Status</label>
                <span className={`sa-status-pill ${status || 'pending'}`}>
                  {m.Status || m.status || 'Pending'}
                </span>
              </div>
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Date</label>
                <p style={{ margin: 0, color: '#1f2937' }}>
                  {m.Date || m.date || m.CreatedAt || m.createdAt
                    ? new Date(m.Date || m.date || m.CreatedAt || m.createdAt).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Estimated Cost</label>
                <p style={{ margin: 0, color: '#1f2937' }}>
                  {((m.EstimatedCost ?? m.estimatedCost) || 0).toLocaleString()} XOF
                </p>
              </div>
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Estimated Hours</label>
                <p style={{ margin: 0, color: '#1f2937' }}>
                  {m.EstimatedHours ?? m.estimatedHours ?? 0} h
                </p>
              </div>
              {(m.Assigned || m.assigned) && (
                <div>
                  <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Assigned To</label>
                  <p style={{ margin: 0, color: '#1f2937' }}>{m.Assigned || m.assigned}</p>
                </div>
              )}
            </div>

            {photos.length > 0 && (
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'block' }}>Photos ({photos.length})</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                  {photos.map((photoUrl, index) => {
                    const url = typeof photoUrl === 'string' ? photoUrl : (photoUrl?.url || photoUrl?.src || '');
                    if (!url) return null;
                    return (
                      <div
                        key={index}
                        style={{
                          position: 'relative',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          aspectRatio: '1',
                          backgroundColor: '#f3f4f6',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        <img
                          src={url}
                          alt={`Maintenance photo ${index + 1}`}
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
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderQuoteDetail = () => {
    const q = selectedQuote;
    if (!q) return null;

    // Photos come from: 1) quote.maintenance (API now includes it), 2) linked maintenance from maintenances list
    let photos = [];
    const maint = q.maintenance ?? q.Maintenance;
    if (maint) {
      const raw = maint.Photos ?? maint.photos ?? maint.PhotoURLs ?? maint.photoURLs;
      if (Array.isArray(raw)) photos = raw;
      else if (typeof raw === 'string' && raw.trim()) {
        try { photos = JSON.parse(raw) || []; } catch (_) { photos = []; }
      }
    }
    if (photos.length === 0) {
      const maintenanceId = q.MaintenanceID ?? q.maintenanceId ?? q.MaintenanceId;
      const linkedMaintenance = maintenanceId && Array.isArray(maintenances)
        ? maintenances.find((m) => String(m.ID ?? m.id) === String(maintenanceId))
        : null;
      if (linkedMaintenance) {
        const raw = linkedMaintenance.Photos ?? linkedMaintenance.photos ?? linkedMaintenance.PhotoURLs ?? linkedMaintenance.photoURLs;
        if (Array.isArray(raw)) photos = raw;
        else if (typeof raw === 'string' && raw.trim()) {
          try { photos = JSON.parse(raw) || []; } catch (_) { photos = []; }
        }
      }
    }

    const status = (q.Status || q.status || '').toLowerCase();
    const canApprove = status !== 'approved' && status !== 'rejected';

    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header" style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className="sa-outline-button sa-tenant-detail-back-btn"
            onClick={() => setSelectedQuote(null)}
          >
            <ArrowLeft size={16} />
            Back to list
          </button>
        </div>
        <div className="sa-section-card" style={{ marginBottom: '24px' }}>
          <div className="sa-section-header" style={{ marginBottom: '24px' }}>
            <div>
              <h2>Maintenance Quote Details</h2>
              <p>Review quote details and approve or reject</p>
            </div>
            {canApprove && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="sa-primary-cta"
                  style={{ backgroundColor: '#16a34a' }}
                  disabled={loading}
                  onClick={async () => {
                    try {
                      await landlordService.approveMaintenanceQuote(q.ID || q.id);
                      addNotification('Quote approved successfully', 'success');
                      setSelectedQuote(null);
                      loadData();
                    } catch (err) {
                      console.error('Error approving quote:', err);
                      addNotification(err?.message || 'Failed to approve quote', 'error');
                    }
                  }}
                >
                  <FileCheck size={18} />
                  Approve Quote
                </button>
                <button
                  className="sa-primary-cta"
                  style={{ backgroundColor: '#dc2626' }}
                  disabled={loading}
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to reject this quote?')) return;
                    try {
                      await landlordService.rejectMaintenanceQuote(q.ID || q.id);
                      addNotification('Quote rejected successfully', 'success');
                      setSelectedQuote(null);
                      loadData();
                    } catch (err) {
                      console.error('Error rejecting quote:', err);
                      addNotification(err?.message || 'Failed to reject quote', 'error');
                    }
                  }}
                >
                  Reject Quote
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Issue / Description</label>
              <p style={{ margin: 0, color: '#1f2937', whiteSpace: 'pre-wrap', fontSize: '1rem' }}>
                {q.Issue || q.issue || 'N/A'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Property</label>
                <p style={{ margin: 0, color: '#1f2937' }}>{q.Property || q.property || '—'}</p>
              </div>
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Amount</label>
                <p style={{ margin: 0, color: '#1f2937' }}>{((q.Amount ?? q.amount) || 0).toLocaleString()} XOF</p>
              </div>
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Recipient</label>
                <p style={{ margin: 0, color: '#1f2937' }}>{q.Recipient || q.recipient || '—'}</p>
              </div>
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Status</label>
                <span className={`sa-status-pill ${status || 'pending'}`}>
                  {q.Status || q.status || 'Pending'}
                </span>
              </div>
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Date</label>
                <p style={{ margin: 0, color: '#1f2937' }}>
                  {q.Date || q.date || q.CreatedAt || q.createdAt
                    ? new Date(q.Date || q.date || q.CreatedAt || q.createdAt).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              {(q.ValidatedBy || q.validatedBy) && (
                <div>
                  <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Validated By</label>
                  <p style={{ margin: 0, color: '#1f2937' }}>{q.ValidatedBy || q.validatedBy}</p>
                </div>
              )}
            </div>

            {photos.length > 0 && (
              <div>
                <label style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'block' }}>Photos from maintenance ({photos.length})</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                  {photos.map((photoUrl, index) => {
                    const url = typeof photoUrl === 'string' ? photoUrl : (photoUrl?.url || photoUrl?.src || '');
                    if (!url) return null;
                    return (
                      <div
                        key={index}
                        style={{
                          position: 'relative',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          aspectRatio: '1',
                          backgroundColor: '#f3f4f6',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        <img
                          src={url}
                          alt={`Quote maintenance ${index + 1}`}
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
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWorksAndClaims = () => {
    if (selectedMaintenance) {
      return renderMaintenanceDetail();
    }
    if (selectedQuote) {
      return renderQuoteDetail();
    }

    return (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
      <h2>Works & Interventions Management</h2>
      <p>Track maintenance works, interventions, and automatic claims management</p>
        </div>
                </div>
                
          {/* Maintenance Requests (from Technician) - Landlord can approve */}
          {maintenances && maintenances.length > 0 && (
            <div className="sa-section-card" style={{ marginBottom: '24px' }}>
              <div className="sa-section-header">
                <div>
                  <h3>Maintenance Requests</h3>
                  <p>Maintenance requests from technicians for your properties – click a row to view details and approve</p>
                </div>
              </div>
              <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Date</th>
                      <th>Property</th>
                      <th>Tenant</th>
                      <th>Issue</th>
                      <th>Priority</th>
                      <th>Est. Cost</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {maintenances.map((m, index) => {
                      const status = (m.Status || m.status || '').toLowerCase();
                      const canApprove = status !== 'approved' && status !== 'completed';
                      return (
                        <tr
                          key={m.ID || m.id || `maint-${index}`}
                          className="clickable-row"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedMaintenance(m)}
                        >
                          <td>{index + 1}</td>
                          <td>{m.Date || m.date ? new Date(m.Date || m.date).toLocaleDateString() : 'N/A'}</td>
                          <td>{m.Property || m.property || 'N/A'}</td>
                          <td>{m.Tenant || m.tenant || '—'}</td>
                          <td className="sa-cell-main">
                            <span className="sa-cell-title">{m.Issue || m.issue || 'N/A'}</span>
                          </td>
                          <td>
                            <span className={`sa-status-pill ${(m.Priority || m.priority || 'medium').toLowerCase()}`}>
                              {m.Priority || m.priority || 'Medium'}
                            </span>
                          </td>
                          <td>{((m.EstimatedCost ?? m.estimatedCost) || 0).toLocaleString()} XOF</td>
                          <td>
                            <span className={`sa-status-pill ${status || 'pending'}`}>
                              {m.Status || m.status || 'Pending'}
                            </span>
                          </td>
                          <td className="sa-row-actions" onClick={(e) => e.stopPropagation()}>
                            {canApprove && (
                              <button
                                className="table-action-button edit"
                                style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px' }}
                                disabled={loading}
                                onClick={async () => {
                                  try {
                                    await landlordService.approveMaintenance(m.ID || m.id);
                                    addNotification('Maintenance approved successfully', 'success');
                                    loadData();
                                  } catch (err) {
                                    console.error('Error approving maintenance:', err);
                                    addNotification(err?.message || 'Failed to approve maintenance', 'error');
                                  }
                                }}
                              >
                                Approve
        </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
        </div>
                </div>
          )}
                
          {/* Pending Maintenance Quotes for Approval */}
          {maintenanceQuotes && maintenanceQuotes.length > 0 && (
            <div className="sa-section-card" style={{ marginBottom: '24px' }}>
              <div className="sa-section-header">
                <div>
                  <h3>Pending Maintenance Quotes</h3>
                  <p>Click a row to view details, photos, and approve or reject</p>
                </div>
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
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceQuotes.map((quote, index) => {
                      const status = (quote.Status || quote.status || '').toLowerCase();
                      return (
                        <tr
                          key={quote.ID || quote.id || `quote-${index}`}
                          className="clickable-row"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedQuote(quote)}
                        >
                          <td>{index + 1}</td>
                          <td>{quote.Date || quote.date ? new Date(quote.Date || quote.date).toLocaleDateString() : 'N/A'}</td>
                          <td>{quote.Property || quote.property || 'N/A'}</td>
                          <td>{quote.Issue || quote.issue || 'N/A'}</td>
                          <td>{(quote.Amount || quote.amount || 0).toLocaleString()} XOF</td>
                          <td>
                            <span className={`sa-status-pill ${status || 'pending'}`}>
                              {quote.Status || quote.status || 'Pending'}
                            </span>
                          </td>
                          <td>{quote.ValidatedBy || quote.validatedBy || '—'}</td>
                          <td className="sa-row-actions" onClick={(e) => e.stopPropagation()}>
                            {status !== 'approved' && status !== 'rejected' && (
                              <>
                                <button
                                  className="table-action-button edit"
                                  style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px' }}
                                  disabled={loading}
                                  onClick={async () => {
                                    try {
                                      await landlordService.approveMaintenanceQuote(quote.ID || quote.id);
                                      addNotification('Quote approved successfully', 'success');
                                      loadData();
                                    } catch (error) {
                                      console.error('Error approving quote:', error);
                                      addNotification('Failed to approve quote', 'error');
                                    }
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  className="table-action-button delete"
                                  style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', marginLeft: '8px' }}
                                  disabled={loading}
                                  onClick={async () => {
                                    if (!window.confirm('Are you sure you want to reject this quote?')) return;
                                    try {
                                      await landlordService.rejectMaintenanceQuote(quote.ID || quote.id);
                                      addNotification('Quote rejected successfully', 'success');
                                      loadData();
                                    } catch (error) {
                                      console.error('Error rejecting quote:', error);
                                      addNotification('Failed to reject quote', 'error');
                                    }
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {workOrders.length > 0 && (
        <div className="sa-section-card" style={{ marginBottom: '24px' }}>
          <div className="sa-section-header">
                <div>
              <h3>Work Orders</h3>
                  <p>Maintenance and intervention requests</p>
                </div>
              </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
                  <thead>
                    <tr>
                  <th>No</th>
                      <th>Title</th>
                      <th>Property</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Date</th>
                  <th />
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((work, index) => (
                      <tr key={work.ID || `work-${index}`}>
                    <td>{index + 1}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{work.Title || work.title || 'N/A'}</span>
                        </td>
                        <td>{work.Property || work.property || 'N/A'}</td>
                        <td>
                      <span className="sa-cell-sub">{work.Description || work.description || 'N/A'}</span>
                    </td>
                    <td>
                      <span className={`sa-status-pill ${(work.Status || work.status || 'pending').toLowerCase()}`}>
                            {work.Status || work.status || 'Pending'}
                          </span>
                        </td>
                        <td>{work.Date ? new Date(work.Date).toLocaleDateString() : (work.date ? new Date(work.date).toLocaleDateString() : 'N/A')}</td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" title="View">👁️</button>
                      <button className="sa-icon-button" title="Edit">✏️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

      <div className="sa-section-card">
        <div className="sa-section-header">
            <div>
            <h3>Claims</h3>
                  <p>Property claims and requests</p>
              </div>
              </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
                  <thead>
                    <tr>
                <th>No</th>
                      <th>Title</th>
                      <th>Property</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Date</th>
                <th />
                    </tr>
                  </thead>
                  <tbody>
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="sa-table-empty">No claims found</td>
                </tr>
              ) : (
                claims.map((claim, index) => (
                      <tr key={claim.ID || `claim-${index}`}>
                    <td>{index + 1}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{claim.Title || claim.title || 'N/A'}</span>
                        </td>
                        <td>{claim.Property || claim.property || 'N/A'}</td>
                        <td>
                      <span className="sa-cell-sub">{claim.Description || claim.description || 'N/A'}</span>
                    </td>
                    <td>
                      <span className={`sa-status-pill ${(claim.Status || claim.status || 'pending').toLowerCase()}`}>
                            {claim.Status || claim.status || 'Pending'}
                          </span>
                        </td>
                        <td>{claim.Date ? new Date(claim.Date).toLocaleDateString() : (claim.date ? new Date(claim.date).toLocaleDateString() : 'N/A')}</td>
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
          </div>
        );
  };
      
  const renderInventory = () => (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
      <h2>Inventory Management</h2>
          <p>{inventory.length} inventory items found</p>
        </div>
        <div className="sa-clients-header-right">
          <button className="sa-primary-cta" onClick={() => setShowInventoryModal(true)} disabled={loading}>
            <Plus size={16} />
          Add New Inventory
        </button>
        </div>
                </div>
        
      <div className="sa-table-wrapper">
        <table className="sa-table">
            <thead>
              <tr>
              <th>No</th>
                <th>Property</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Condition</th>
                <th>Last Updated</th>
              <th />
              </tr>
            </thead>
            <tbody>
            {inventory.length === 0 ? (
              <tr>
                <td colSpan={8} className="sa-table-empty">No inventory found</td>
              </tr>
            ) : (
              inventory.map((item, index) => (
                <tr key={item.ID || item.id || `inventory-${index}`}>
                  <td>{index + 1}</td>
                  <td className="sa-cell-main">
                    <span className="sa-cell-title">{item.Property || item.property || 'N/A'}</span>
                  </td>
                  <td>{item.ItemName || item.itemName || item.Name || item.name || 'N/A'}</td>
                  <td>{item.Category || item.category || 'N/A'}</td>
                  <td>{item.Quantity || item.quantity || 0}</td>
                  <td>
                    <span className={`sa-status-pill ${(item.Condition || item.condition || 'good').toLowerCase()}`}>
                      {item.Condition || item.condition || 'Good'}
                    </span>
                  </td>
                  <td>{item.UpdatedAt ? new Date(item.UpdatedAt).toLocaleDateString() : (item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A')}</td>
                  <td className="sa-row-actions">
                    <button className="sa-icon-button" title="View">👁️</button>
                    <button className="sa-icon-button" title="Edit">✏️</button>
                    <button className="sa-icon-button" title="Delete" style={{ color: '#dc2626', marginLeft: '8px' }}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
                </div>
    </div>
  );

  const renderRents = () => (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Rents Tracking</h2>
          <p>Track collected and pending rents</p>
        </div>
        <div className="sa-clients-header-right">
          <button 
            className="sa-primary-cta" 
            onClick={async () => {
              try {
                await landlordService.downloadReport({ type: 'financial' });
                addNotification('Report downloaded successfully', 'success');
              } catch (error) {
                addNotification('Failed to download report', 'error');
              }
            }}
            disabled={loading}
          >
            <FileText size={16} />
            Download Report
          </button>
        </div>
      </div>

      {rents && (
        <>
          <div className="sa-overview-metrics" style={{ marginBottom: '24px' }}>
            <div className="sa-metric-card sa-metric-primary">
              <p className="sa-metric-label">Total Collected</p>
              <p className="sa-metric-value">{rents.totalCollected?.toLocaleString() || 0} XOF</p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Total Pending</p>
              <p className="sa-metric-value">{rents.totalPending?.toLocaleString() || 0} XOF</p>
            </div>
          </div>

          {rents.collectedRents && rents.collectedRents.length > 0 && (
            <div className="sa-section-card" style={{ marginBottom: '24px' }}>
              <div className="sa-section-header">
                <div>
                  <h3>Collected Rents</h3>
                  <p>{rents.collectedRents.length} collected rent payments</p>
                </div>
              </div>
              <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Date</th>
                      <th>Tenant</th>
                      <th>Property</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rents.collectedRents.map((rent, index) => (
                      <tr key={rent.id || rent.ID || `collected-${index}`}>
                        <td>{index + 1}</td>
                        <td>{new Date(rent.date || rent.Date).toLocaleDateString()}</td>
                        <td className="sa-cell-main">
                          <span className="sa-cell-title">{rent.tenant || rent.Tenant || 'Unknown'}</span>
                        </td>
                        <td>{rent.property || rent.Property || 'Unknown'}</td>
                        <td>{(rent.amount || rent.Amount || 0).toLocaleString()} XOF</td>
                        <td>{rent.method || rent.Method || 'Unknown'}</td>
                        <td>
                          <span className={`sa-status-pill ${(rent.status || rent.Status || 'approved').toLowerCase()}`}>
                            {rent.status || rent.Status || 'Approved'}
                          </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
              </div>
              </div>
          )}

          {rents.pendingRents && rents.pendingRents.length > 0 && (
            <div className="sa-section-card">
              <div className="sa-section-header">
                <div>
                  <h3>Tenants Who Have Not Paid</h3>
                  <p>{rents.pendingRents.length} unpaid rent payment(s) – Pending and Overdue</p>
                </div>
              </div>
              <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Tenant</th>
                      <th>Property</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Days Overdue</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rents.pendingRents.map((rent, index) => {
                      const daysOverdue = rent.daysOverdue ?? 0;
                      const dueDate = rent.date || rent.Date;
                      return (
                      <tr key={rent.id || rent.ID || `pending-${index}`}>
                        <td>{index + 1}</td>
                        <td className="sa-cell-main">
                          <span className="sa-cell-title">{rent.tenant || rent.Tenant || 'Unknown'}</span>
                        </td>
                        <td>{rent.property || rent.Property || 'Unknown'}</td>
                        <td>{(rent.amount || rent.Amount || 0).toLocaleString()} XOF</td>
                        <td>{dueDate ? new Date(dueDate).toLocaleDateString() : '—'}</td>
                        <td>
                          {daysOverdue > 0 ? (
                            <span style={{ color: '#dc2626', fontWeight: 500 }}>{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue</span>
                          ) : (
                            <span style={{ color: '#6b7280' }}>Due today</span>
                          )}
                        </td>
                        <td>
                          <span className={`sa-status-pill ${(rent.status || rent.Status || 'pending').toLowerCase()}`}>
                            {rent.status || rent.Status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
                  </div>
  );

  const renderExpenses = () => (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Expenses Management</h2>
          <p>Review expenses per property. Building expenses require your approval before they are recorded.</p>
        </div>
        <div className="sa-clients-header-right">
          <div className="sa-filters-section">
            <select 
              className="sa-filter-select"
              value={expensePropertyFilter}
              onChange={(e) => setExpensePropertyFilter(e.target.value)}
            >
              <option value="">All Properties</option>
              {properties.map(prop => (
                <option key={prop.id || prop.ID} value={prop.Address || prop.address}>
                  {prop.Address || prop.address}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="sa-filter-select"
              value={expenseStartDate}
              onChange={(e) => setExpenseStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <input
              type="date"
              className="sa-filter-select"
              value={expenseEndDate}
              onChange={(e) => setExpenseEndDate(e.target.value)}
              placeholder="End Date"
            />
          </div>
                  </div>
                </div>

      {/* Building expenses pending owner approval */}
      {pendingExpensesForApproval.length > 0 && (
        <div className="sa-section-card" style={{ marginBottom: '24px', border: '2px solid #f59e0b', background: '#fffbeb' }}>
          <div className="sa-section-header">
            <div>
              <h3>Expenses to Approve</h3>
              <p>{pendingExpensesForApproval.length} building expense(s) awaiting your approval</p>
            </div>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingExpensesForApproval.map((expense, index) => (
                  <tr key={expense.id || expense.ID || `pending-expense-${index}`}>
                    <td>{index + 1}</td>
                    <td>{expense.building || expense.Building || 'N/A'}</td>
                    <td>{expense.category || expense.Category || 'N/A'}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{expense.description || expense.Description || expense.notes || expense.Notes || 'N/A'}</span>
                    </td>
                    <td>{(expense.amount || expense.Amount || 0).toLocaleString()} XOF</td>
                    <td>
                      {expense.date || expense.Date
                        ? new Date(expense.date || expense.Date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
                
      {expenses.length > 0 && expenses[0].property ? (
        expenses.map((propertyGroup, groupIndex) => (
          <div key={propertyGroup.property || `property-${groupIndex}`} className="sa-section-card" style={{ marginBottom: '24px' }}>
            <div className="sa-section-header">
              <div>
                <h3>{propertyGroup.property || 'Unknown Property'}</h3>
                <p>Total: {propertyGroup.total?.toLocaleString() || 0} XOF</p>
                </div>
                </div>
            <div className="sa-table-wrapper">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyGroup.expenses && propertyGroup.expenses.length > 0 ? (
                    propertyGroup.expenses.map((expense, index) => (
                      <tr key={expense.id || expense.ID || `expense-${index}`}>
                        <td>{index + 1}</td>
                        <td>{new Date(expense.date || expense.Date).toLocaleDateString()}</td>
                        <td>{expense.category || expense.Category || 'N/A'}</td>
                        <td>{(expense.amount || expense.Amount || 0).toLocaleString()} XOF</td>
                        <td className="sa-cell-main">
                          <span className="sa-cell-sub">{expense.notes || expense.Notes || 'N/A'}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="sa-table-empty">No expenses for this property</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
          </div>
        ))
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Date</th>
                <th>Property</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="sa-table-empty">No expenses found</td>
                </tr>
              ) : (
                expenses.map((expense, index) => (
                  <tr key={expense.id || expense.ID || `expense-${index}`}>
                    <td>{index + 1}</td>
                    <td>{new Date(expense.date || expense.Date).toLocaleDateString()}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{expense.building || expense.Building || expense.property || expense.Property || 'Unknown'}</span>
                    </td>
                    <td>{expense.category || expense.Category || 'N/A'}</td>
                    <td>{(expense.amount || expense.Amount || 0).toLocaleString()} XOF</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-sub">{expense.notes || expense.Notes || 'N/A'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
      )}
        </div>
  );

  // Render messaging page
  const renderChat = () => (
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
      
  const renderBusinessTracking = () => {
    const revenueByMonth = businessTracking?.revenueByMonth || [];
    const expensesByMonth = businessTracking?.expensesByMonth || [];
    const occupancyByMonth = businessTracking?.occupancyByMonth || [];
    const chartData = revenueByMonth.map((r, i) => ({
      month: r.month,
      revenue: r.revenue ?? 0,
      expenses: expensesByMonth[i]?.expenses ?? 0,
      occupancy: occupancyByMonth[i]?.rate ?? 0
    }));
    const pieData = [
      { name: 'Revenue', value: businessTracking?.totalRevenue ?? 0, color: '#3b82f6' },
      { name: 'Expenses', value: businessTracking?.maintenanceCosts ?? 0, color: '#f59e0b' }
    ].filter(d => d.value > 0);

    return (
    <div className="sa-overview-page">
        <div className="sa-clients-header" style={{ marginBottom: '24px' }}>
          <div>
            <h2>Business Analytics</h2>
            <p>Track revenue, expenses, occupancy, and ROI over time</p>
          </div>
        </div>

        <div className="sa-overview-metrics" style={{ width: '100%', marginBottom: '24px' }}>
        <div className="sa-metric-card sa-metric-primary">
          <p className="sa-metric-label">Revenue Trends</p>
            <p className="sa-metric-value">{businessTracking?.revenueTrends ?? '+0%'}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Occupancy Rate</p>
            <p className="sa-metric-number">{Number(businessTracking?.occupancyRate ?? 0).toFixed(1)}%</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Maintenance Costs</p>
            <p className="sa-metric-number">{(businessTracking?.maintenanceCosts ?? 0).toLocaleString()} XOF</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">ROI</p>
            <p className="sa-metric-number">{Number(businessTracking?.roi ?? 0).toFixed(1)}%</p>
        </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Revenue</p>
            <p className="sa-metric-number">{(businessTracking?.totalRevenue ?? 0).toLocaleString()} XOF</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Net Profit</p>
            <p className="sa-metric-number">{(businessTracking?.netProfit ?? 0).toLocaleString()} XOF</p>
          </div>
        </div>

        {/* Revenue vs Expenses Chart */}
        <div className="sa-section-card" style={{ marginBottom: '24px' }}>
          <div className="sa-section-header">
            <h3>Revenue vs Expenses (Last 6 Months)</h3>
            <p>Monthly rent collected vs maintenance and other expenses</p>
          </div>
          <div style={{ width: '100%', height: '300px', padding: '20px' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorRevenueTracking" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpensesTracking" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} XOF`, '']} labelFormatter={(l) => `Month: ${l}`} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#colorRevenueTracking)" name="Revenue" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="#f59e0b" fill="url(#colorExpensesTracking)" name="Expenses" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>No chart data available yet</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          {/* Occupancy Rate Chart */}
          <div className="sa-section-card" style={{ flex: '1 1 400px', minWidth: '300px' }}>
            <div className="sa-section-header">
              <h3>Occupancy Rate by Month</h3>
              <p>Property occupancy over the last 6 months</p>
            </div>
            <div style={{ width: '100%', height: '280px', padding: '20px' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Occupancy']} />
                    <Bar dataKey="occupancy" fill="#10b981" name="Occupancy %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>No data</div>
              )}
            </div>
          </div>

          {/* Revenue vs Expenses Pie */}
          <div className="sa-section-card" style={{ flex: '1 1 400px', minWidth: '300px' }}>
            <div className="sa-section-header">
              <h3>Revenue vs Expenses (Total)</h3>
              <p>Overall income vs costs distribution</p>
            </div>
            <div style={{ width: '100%', height: '280px', padding: '20px' }}>
              {pieData.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} XOF`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>No data to display</div>
              )}
            </div>
          </div>
              </div>
          </div>
        );
  };
      
  // Load advertisements
  const loadAdvertisements = async () => {
    try {
      const ads = await landlordService.getAdvertisements();
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
      
  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'properties':
        return renderProperties();
      case 'tenants':
        return renderTenants();
      case 'payments':
        return renderPayments();
      case 'rents':
        return renderRents();
      case 'expenses':
        return renderExpenses();
      case 'works':
        return renderWorksAndClaims();
      case 'tracking':
        return renderBusinessTracking();
      case 'advertisements':
        return renderAdvertisements();
      case 'chat':
        return renderChat();
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
    localStorage.removeItem('demo_mode');
    window.location.href = '/';
  };

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Landlord Portal', logo: 'SAAF', logoImage: `/download.jpeg` }}
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
          <div key={notification.id} className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>×</button>
          </div>
        ))}
      </div>

      {/* Create Work Order Modal */}
      <Modal
        isOpen={showWorkOrderModal}
        onClose={() => setShowWorkOrderModal(false)}
        title="Create Work Order"
        size="lg"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const workOrderData = {
            property: formData.get('property'),
            type: formData.get('type'),
            priority: formData.get('priority'),
            description: formData.get('description'),
            assignedTo: formData.get('assignedTo') || null,
            amount: formData.get('amount') ? parseFloat(formData.get('amount')) : null
          };
          handleCreateWorkOrder(workOrderData);
        }}>
          <div className="form-group">
            <label>Property</label>
            <select name="property" required>
              <option value="">Select property</option>
              {properties.map(property => {
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
            <label>Work Type</label>
            <select name="type" required>
              <option value="maintenance">Maintenance</option>
              <option value="repair">Repair</option>
              <option value="renovation">Renovation</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select name="priority" required>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" rows="4" required></textarea>
          </div>
          <div className="form-group">
            <label>Assigned To (Optional)</label>
            <input type="text" name="assignedTo" />
          </div>
          <div className="form-group">
            <label>Estimated Cost (XOF)</label>
            <input type="number" name="amount" min="0" step="0.01" />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowWorkOrderModal(false)}>Cancel</button>
            <button type="submit" disabled={loading}>Create Work Order</button>
          </div>
        </form>
      </Modal>

      {/* Create Claim Modal */}
      <Modal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        title="Create Claim"
        size="lg"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const claimData = {
            property: formData.get('property'),
            type: formData.get('type'),
            description: formData.get('description'),
            amount: formData.get('amount') ? parseFloat(formData.get('amount')) : null
          };
          handleCreateClaim(claimData);
        }}>
          <div className="form-group">
            <label>Property</label>
            <select name="property" required>
              <option value="">Select property</option>
              {properties.map(property => {
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
            <label>Claim Type</label>
            <select name="type" required>
              <option value="damage">Damage</option>
              <option value="insurance">Insurance</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" rows="4" required></textarea>
          </div>
          <div className="form-group">
            <label>Claim Amount (XOF)</label>
            <input type="number" name="amount" min="0" step="0.01" />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowClaimModal(false)}>Cancel</button>
            <button type="submit" disabled={loading}>Create Claim</button>
          </div>
        </form>
      </Modal>

      {/* Add Inventory Modal */}
      <Modal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        title="Add Inventory"
        size="lg"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const inventoryData = {
            property: formData.get('property'),
            type: formData.get('type'),
            inspector: formData.get('inspector')
          };
          handleAddInventory(inventoryData);
        }}>
          <div className="form-group">
            <label>Property</label>
            <select name="property" required>
              <option value="">Select property</option>
              {properties.map(property => {
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
            <label>Inventory Type</label>
            <select name="type" required>
              <option value="move-in">Move-in</option>
              <option value="move-out">Move-out</option>
              <option value="routine">Routine</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div className="form-group">
            <label>Inspector</label>
            <input type="text" name="inspector" required />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowInventoryModal(false)}>Cancel</button>
            <button type="submit" disabled={loading}>Add Inventory</button>
          </div>
        </form>
      </Modal>

      {/* Generate Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Generate Receipt"
        size="lg"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const receiptData = {
            receiptNumber: formData.get('receiptNumber'),
            date: formData.get('date'),
            landlord: formData.get('landlord'),
            property: formData.get('property'),
            tenant: formData.get('tenant'),
            amount: parseFloat(formData.get('amount')),
            period: formData.get('period'),
            description: formData.get('description')
          };
          handleGenerateReceipt(receiptData);
        }}>
          <div className="form-group">
            <label>Receipt Number</label>
            <input type="text" name="receiptNumber" placeholder="Auto-generated if empty" />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" required />
          </div>
          <div className="form-group">
            <label>Landlord</label>
            <input type="text" name="landlord" required />
          </div>
          <div className="form-group">
            <label>Property</label>
            <select name="property" required>
              <option value="">Select property</option>
              {properties.map(property => {
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
            <label>Tenant</label>
            <input type="text" name="tenant" required />
          </div>
          <div className="form-group">
            <label>Amount (XOF)</label>
            <input type="number" name="amount" min="0" step="0.01" required />
          </div>
          <div className="form-group">
            <label>Period</label>
            <input type="text" name="period" placeholder="e.g., January 2024" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" rows="3"></textarea>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowReceiptModal(false)}>Cancel</button>
            <button type="submit" disabled={loading}>Generate Receipt</button>
          </div>
        </form>
      </Modal>

    </>
  );
};

export default LandlordDashboard;
