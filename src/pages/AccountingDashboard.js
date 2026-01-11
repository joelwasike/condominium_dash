import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DollarSign, TrendingUp, Building, Receipt, Download, Search, CreditCard, User, FileText, Plus, MessageCircle, Settings, Megaphone, Wallet, Smartphone, Banknote, Building2, Clock } from 'lucide-react';
import { accountingService } from '../services/accountingService';
import { messagingService } from '../services/messagingService';
import { API_CONFIG } from '../config/api';
import { isDemoMode, getAccountingDemoData } from '../utils/demoData';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import '../components/RoleLayout.css';
import './AccountingDashboard.css';
import jsPDF from 'jspdf';

const AccountingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [showLandlordPaymentModal, setShowLandlordPaymentModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [calculatedAmount, setCalculatedAmount] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showViewExpenseModal, setShowViewExpenseModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // API Data States
  const [overviewData, setOverviewData] = useState(null);
  const [tenantPayments, setTenantPayments] = useState([]);
  const [landlordPayments, setLandlordPayments] = useState([]);
  const [collections, setCollections] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [advertisements, setAdvertisements] = useState([]);
  const [landlords, setLandlords] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [selectedTenantForPayment, setSelectedTenantForPayment] = useState(null);
  const [selectedLandlord, setSelectedLandlord] = useState(null);
  const [landlordProperties, setLandlordProperties] = useState(null);
  const carouselIntervalRef = useRef(null);
  
  // History state
  const [historyPayments, setHistoryPayments] = useState([]);
  const [historyCanceledPayments, setHistoryCanceledPayments] = useState([]);
  const [historyUnpaidRents, setHistoryUnpaidRents] = useState([]);
  const [historyPendingPayments, setHistoryPendingPayments] = useState([]);
  const [historyExpenses, setHistoryExpenses] = useState([]);
  const [historyExpensesByProperty, setHistoryExpensesByProperty] = useState([]);
  const [historyWireTransfers, setHistoryWireTransfers] = useState([]);
  const [historyFinancialDocuments, setHistoryFinancialDocuments] = useState([]);
  
  // History pagination and search state
  const [historyPagination, setHistoryPagination] = useState({});
  const [historySearch, setHistorySearch] = useState({});
  
  // Reports state
  const [selectedReportType, setSelectedReportType] = useState('payments-by-period');
  const [reportStartDate, setReportStartDate] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [reportEndDate, setReportEndDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [reportData, setReportData] = useState(null);
  
  // Expense filters
  const [expenseBuildingFilter, setExpenseBuildingFilter] = useState('');
  const [expenseStartDateFilter, setExpenseStartDateFilter] = useState('');
  const [expenseEndDateFilter, setExpenseEndDateFilter] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [expenseScopeFilter, setExpenseScopeFilter] = useState('');
  const [expenseSearchText, setExpenseSearchText] = useState('');
  
  // Cashier state
  const [cashierAccounts, setCashierAccounts] = useState([]);
  const [cashierTransactions, setCashierTransactions] = useState([]);
  const [showCashierAccountModal, setShowCashierAccountModal] = useState(false);
  const [showCashierTransactionModal, setShowCashierTransactionModal] = useState(false);
  const [cashierAccountForm, setCashierAccountForm] = useState({
    name: '',
    type: 'cash_register',
    balance: 0,
    currency: 'XOF',
    description: ''
  });
  const [cashierTransactionForm, setCashierTransactionForm] = useState({
    accountId: '',
    type: 'deposit',
    amount: '',
    reference: '',
    description: '',
    toAccountId: ''
  });
  
  // Tenants state
  const [tenants, setTenants] = useState([]);
  const [tenantPaymentStatusFilter, setTenantPaymentStatusFilter] = useState('all'); // 'all', 'up-to-date', 'outstanding'
  
  // Deposits state
  const [deposits, setDeposits] = useState([]);
  const [depositFilter, setDepositFilter] = useState('all'); // 'all', 'payment', 'refund'
  const [showDepositPaymentModal, setShowDepositPaymentModal] = useState(false);
  const [showDepositRefundModal, setShowDepositRefundModal] = useState(false);
  const [depositPaymentForm, setDepositPaymentForm] = useState({
    tenant: '',
    property: '',
    tenantType: 'individual',
    monthlyRent: '',
    paymentMethod: 'mobile_money',
    reference: '',
    notes: ''
  });
  const [depositRefundForm, setDepositRefundForm] = useState({
    depositId: '',
    refundMethod: 'mobile_money',
    refundAccount: '',
    notes: ''
  });

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

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: DollarSign },
      { id: 'collections', label: 'Collections', icon: TrendingUp },
      { id: 'payments', label: 'Landlord Payments', icon: Building },
      { id: 'tenant-payments', label: 'Tenant Payments', icon: CreditCard },
      { id: 'reports', label: 'Reports', icon: Receipt },
      { id: 'expenses', label: 'Expenses', icon: FileText },
      { id: 'tenants', label: 'Tenants', icon: User },
      { id: 'history', label: 'History', icon: Clock },
      { id: 'cashier', label: 'Cashier', icon: Wallet },
      { id: 'advertisements', label: 'Advertisements', icon: Megaphone },
      { id: 'chat', label: 'Messages', icon: MessageCircle },
      { id: 'settings', label: 'Profile Settings', icon: Settings }
    ],
    []
  );

  // Load expenses with filters
  const loadExpenses = useCallback(async () => {
    try {
      const expenseFilters = {};
      if (expenseBuildingFilter) expenseFilters.building = expenseBuildingFilter;
      if (expenseStartDateFilter) expenseFilters.startDate = expenseStartDateFilter;
      if (expenseEndDateFilter) expenseFilters.endDate = expenseEndDateFilter;
      if (expenseCategoryFilter) expenseFilters.category = expenseCategoryFilter;

      const expensesData = await accountingService.getExpenses(expenseFilters);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      addNotification('Failed to load expenses', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseBuildingFilter, expenseStartDateFilter, expenseEndDateFilter, expenseCategoryFilter]); // addNotification is stable, no need to include

  // Load data from APIs
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading accounting dashboard data...');
      
      if (isDemoMode()) {
        // Use demo data
        const demoData = getAccountingDemoData();
        setOverviewData(demoData.overview);
        setTenantPayments(demoData.tenantPayments);
        setLandlordPayments(demoData.landlordPayments);
        setCollections(demoData.collections);
        setExpenses(demoData.expenses);
        setMonthlySummary(demoData.monthlySummary);
        setLandlords(demoData.landlords);
        setLoading(false);
        return;
      }
      
      const [overview, tenantPaymentsData, landlordPaymentsData, collectionsData, expensesData, summary, landlordsData] = await Promise.all([
        accountingService.getOverview(),
        accountingService.getTenantPayments(),
        accountingService.getLandlordPayments(),
        accountingService.getCollections(),
        accountingService.getExpenses({}),
        accountingService.getMonthlySummary(),
        accountingService.getLandlords().catch(() => [])
      ]);

      setOverviewData(overview);
      setTenantPayments(tenantPaymentsData);
      setLandlordPayments(landlordPaymentsData);
      setCollections(collectionsData);
      setExpenses(expensesData);
      setMonthlySummary(summary);
      setLandlords(Array.isArray(landlordsData) ? landlordsData : []);
      
      console.log('Accounting data loaded successfully:', { overview, tenantPaymentsData, landlordPaymentsData, collectionsData, expensesData, summary });
    } catch (error) {
      console.error('Failed to load accounting data:', error);
      if (!isDemoMode()) {
        addNotification('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reload expenses when filters change
  useEffect(() => {
    if (activeTab === 'expenses') {
      loadExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, expenseBuildingFilter, expenseStartDateFilter, expenseEndDateFilter, expenseCategoryFilter]); // Only reload when tab or filters change

  // Load cashier data
  const loadCashierData = useCallback(async () => {
    try {
      const [accounts, transactions] = await Promise.all([
        accountingService.getCashierAccounts().catch(() => []),
        accountingService.getCashierTransactions().catch(() => [])
      ]);
      setCashierAccounts(Array.isArray(accounts) ? accounts : []);
      setCashierTransactions(Array.isArray(transactions) ? transactions : []);
    } catch (error) {
      console.error('Error loading cashier data:', error);
      addNotification('Failed to load cashier data', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // addNotification is stable, no need to include

  useEffect(() => {
    if (activeTab === 'cashier') {
      loadCashierData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Only reload when tab changes, not when loadCashierData changes

  // Load tenants data
  const loadTenants = useCallback(async () => {
    try {
      const data = await accountingService.getTenantsWithPaymentStatus();
      setTenants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading tenants:', error);
      addNotification('Failed to load tenants', 'error');
      setTenants([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // addNotification is stable, no need to include

  useEffect(() => {
    if (activeTab === 'tenants') {
      loadTenants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Only reload when tab changes, not when loadTenants changes

  // Load deposits data
  const loadDeposits = useCallback(async () => {
    try {
      const filters = {};
      if (depositFilter !== 'all') {
        filters.type = depositFilter;
      }
      const data = await accountingService.getSecurityDeposits(filters);
      setDeposits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading deposits:', error);
      // Only show notification once, not on every retry
      if (deposits.length === 0) {
        addNotification('Failed to load deposits', 'error');
      }
      setDeposits([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depositFilter]); // Removed addNotification to prevent infinite loop

  useEffect(() => {
    if (activeTab === 'deposits') {
      loadDeposits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, depositFilter]); // Removed loadDeposits to prevent infinite loop

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // addNotification is stable, no need to include

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadChatForUser]); // addNotification is stable, no need to include

  // Load advertisements when advertisements or overview tab is active
  useEffect(() => {
    if (activeTab === 'advertisements' || activeTab === 'overview') {
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

  // Download receipt if it exists
  const downloadReceipt = async (payment) => {
    if (!payment.ReceiptNumber && !payment.ReceiptURL) {
      addNotification('No receipt available for this payment', 'warning');
      return;
    }

    try {
      // If receipt URL exists, download it directly
      if (payment.ReceiptURL || payment.receiptURL) {
        const receiptUrl = payment.ReceiptURL || payment.receiptURL;
        const a = document.createElement('a');
        a.href = receiptUrl;
        a.download = `receipt-${payment.ReceiptNumber || payment.ID}.pdf`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addNotification('Receipt downloaded!', 'success');
        return;
      }

      // Otherwise, generate downloadable receipt content
      const receiptContent = `
        RENTAL PAYMENT RECEIPT
        =====================
        
        Receipt No: ${payment.ReceiptNumber || 'N/A'}
        Date: ${payment.Date ? new Date(payment.Date).toLocaleDateString() : new Date().toLocaleDateString()}
        
        Tenant: ${payment.Tenant || 'N/A'}
        Property: ${payment.Property || 'N/A'}
        Amount Paid: ${payment.Amount?.toFixed(2) || '0.00'} XOF
        Charge Type: ${payment.ChargeType || payment.chargeType || 'Rent'}
        Payment Method: ${payment.Method || 'N/A'}
        Payment Date: ${payment.Date ? new Date(payment.Date).toLocaleDateString() : 'N/A'}
        Reference: ${payment.Reference || payment.reference || 'N/A'}
        
        Status: ${payment.Status || 'N/A'}
        
        Thank you for your payment!
        
        Generated by: Accounting Department
        Generated on: ${new Date().toLocaleString()}
      `;

      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${payment.ReceiptNumber || payment.ID}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addNotification('Receipt downloaded!', 'success');
    } catch (error) {
      console.error('Failed to download receipt:', error);
      addNotification('Failed to download receipt', 'error');
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

  // Print expense receipt as PDF matching BON DE CAISSE template
  const printExpenseReceipt = (expense) => {
    if (!expense) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;

    // Helper function to convert number to words in French
    const numberToWords = (num) => {
      const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
      const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
      
      if (num === 0) return 'zéro';
      if (num < 20) return ones[num];
      if (num < 100) {
        const ten = Math.floor(num / 10);
        const one = num % 10;
        if (ten === 7 || ten === 9) {
          return tens[ten] + '-' + ones[10 + one];
        }
        return tens[ten] + (one > 0 ? '-' + ones[one] : '');
      }
      if (num < 1000) {
        const hundred = Math.floor(num / 100);
        const remainder = num % 100;
        return ones[hundred] + ' cent' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
      }
      return num.toString(); // Simplified for larger numbers
    };

    // Header - Logo and Title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('sili', 20, yPos);
    pdf.setFontSize(20);
    pdf.text('SAAF IMMO', 20, yPos + 8);
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BON DE CAISSE SAAF IMMO', pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 25;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('B.F.F.', pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 20;
    
    // Request details section
    pdf.setFontSize(11);
    pdf.text('Demande de sortie de caisse présentée par Mr / Mlle / Mme', 20, yPos);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, yPos + 3, pageWidth - 20, yPos + 3);
    
    yPos += 12;
    pdf.text('Noms et prénoms :', 20, yPos);
    pdf.line(60, yPos - 3, pageWidth - 20, yPos - 3);
    
    yPos += 12;
    pdf.text('Motif :', 20, yPos);
    pdf.line(40, yPos - 3, pageWidth - 20, yPos - 3);
    yPos += 8;
    pdf.line(20, yPos - 3, pageWidth - 20, yPos - 3);
    
    yPos += 15;
    
    // Amount section
    pdf.text('La somme de', 20, yPos);
    pdf.text('(en lettre) :', 20, yPos + 6);
    const amount = expense.Amount || expense.amount || 0;
    const amountWords = numberToWords(Math.floor(amount)) + ' francs CFA';
    pdf.line(50, yPos - 3, pageWidth - 20, yPos - 3);
    pdf.text(amountWords, 55, yPos);
    
    yPos += 12;
    pdf.text('(en chiffre) :', 20, yPos);
    pdf.line(50, yPos - 3, pageWidth - 60, yPos - 3);
    pdf.text(amount.toFixed(2) + ' CFA', 55, yPos);
    
    yPos += 25;
    
    // Date and signatures section
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    pdf.text(`Fait à Abidjan, le ${dateStr}`, 20, yPos);
    
    yPos = pageHeight - 50;
    
    // Signature labels
    pdf.setFontSize(10);
    pdf.text('Caisse', 20, yPos);
    pdf.text('Direction financière', pageWidth / 2 - 30, yPos, { align: 'center' });
    pdf.text('Bénéficiaire', pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 20;
    pdf.line(20, yPos, 60, yPos);
    pdf.line(pageWidth / 2 - 50, yPos, pageWidth / 2 + 10, yPos);
    pdf.line(pageWidth - 60, yPos, pageWidth - 20, yPos);
    
    // Footer - Contact information
    yPos = pageHeight - 25;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Abidjan, Cocody Angré, 8e tranche, Immeuble King Déco, 4e étage, carrefour La Prière. Ilot 43, lot 664.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    pdf.text('Tel : 00 225 07 04 77 51 79 / 00 225 07 04 77 51 77', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    pdf.text('RCCM : CI-ABJ-2018-B-21320', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    pdf.text('N°CC : 1843184R', pageWidth / 2, yPos, { align: 'center' });
    
    // Expense details (can be added as notes)
    if (expense.Notes || expense.notes) {
      yPos = 120;
      pdf.setFontSize(9);
      pdf.text('Détails:', 20, yPos);
      yPos += 6;
      pdf.setFontSize(8);
      const notes = pdf.splitTextToSize(expense.Notes || expense.notes, pageWidth - 40);
      pdf.text(notes, 20, yPos);
    }
    
    // Save PDF
    const fileName = `bon-de-caisse-${expense.ID || expense.id || Date.now()}.pdf`;
    pdf.save(fileName);
    addNotification('Expense receipt generated successfully', 'success');
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

  // Export payments to CSV
  const exportPaymentsToCSV = () => {
    const headers = ['Tenant', 'Property', 'Amount', 'Method', 'Date', 'Status', 'Reference', 'Receipt Number'];
    const rows = tenantPayments
      .filter(payment => {
        const status = (payment.Status || '').toLowerCase();
        return status === 'successful' || status === 'failed' || status === 'approved' || status === 'rejected';
      })
      .map(payment => {
        const status = (payment.Status || '').toLowerCase();
        const displayStatus = status === 'approved' ? 'Successful' : status === 'rejected' ? 'Failed' : payment.Status || 'Unknown';
        
        return [
          payment.Tenant || '',
          payment.Property || '',
          payment.Amount?.toFixed(2) || '0.00',
          payment.Method || '',
          payment.Date ? new Date(payment.Date).toLocaleDateString() : '',
          displayStatus,
          payment.Reference || payment.reference || '',
          payment.ReceiptNumber || ''
        ];
      });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenant-payments-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addNotification('Payments exported to CSV successfully!', 'success');
  };

  // Import payments from file (CSV/Excel)
  const handleImportPayments = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      // Call import API
      const result = await accountingService.importPayments(formData);
      
      addNotification(`Successfully imported ${result.imported || 0} payment(s)!`, 'success');
      
      // Reload payments
      const tenantPaymentsData = await accountingService.getTenantPayments();
      setTenantPayments(Array.isArray(tenantPaymentsData) ? tenantPaymentsData : []);
    } catch (error) {
      console.error('Failed to import payments:', error);
      addNotification(error.message || 'Failed to import payments. Please check the file format.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (loading) {
      return <div className="sa-table-empty">Loading overview data...</div>;
    }

    // Get current month name for display
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = currentUser.name || currentUser.Name || 'Accountant';
    
    return (
      <div className="sa-overview-page">
        <div className="sa-overview-top">
          <div className="sa-overview-chart-card">
            <div className="sa-card-header">
              <h2>Accounting Dashboard</h2>
              <span className="sa-card-subtitle">Welcome, {userName}!</span>
            </div>
            <div className="sa-mini-legend">
              <span className="sa-legend-item sa-legend-expected">Collections (XOF)</span>
              <span className="sa-legend-item sa-legend-current">Expenses (XOF)</span>
            </div>
            <div style={{ width: '100%', height: '200px', marginTop: '20px' }}>
              <ResponsiveContainer>
                <AreaChart
                  data={(() => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                    const currentCollections = overviewData?.totalCollectedThisMonth || 0;
                    const currentExpenses = overviewData?.totalExpensesThisMonth || 0;
                    return months.map((month, index) => ({
                      month,
                      collections: Math.round(currentCollections * (0.7 + (index * 0.05))),
                      expenses: Math.round(currentExpenses * (0.7 + (index * 0.05)))
                    }));
                  })()}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
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
                      if (name === 'collections') return [`${value.toLocaleString()} XOF`, 'Collections'];
                      if (name === 'expenses') return [`${value.toLocaleString()} XOF`, 'Expenses'];
                      return value;
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="line"
                  />
                  <Area
                    type="natural"
                    dataKey="collections"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorCollections)"
                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name="Collections"
                  />
                  <Area
                    type="natural"
                    dataKey="expenses"
                    stroke="#dc2626"
                    strokeWidth={3}
                    fill="url(#colorExpenses)"
                    dot={{ fill: '#dc2626', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sa-overview-metrics">
            <div className="sa-metric-card sa-metric-primary">
              <p className="sa-metric-label">Total Available Balance</p>
              <p className="sa-metric-period">Current balance</p>
              <p className="sa-metric-value">
                {overviewData ? `${(overviewData.totalAvailableBalance || overviewData.globalBalance || 0).toFixed(2)} XOF` : '0 XOF'}
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Total Collected This Month</p>
              <p className="sa-metric-period">{currentMonth}</p>
              <p className="sa-metric-value">
                {overviewData ? `${(overviewData.totalCollectedThisMonth || 0).toFixed(2)} XOF` : '0 XOF'}
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Total Transferred to Landlords</p>
              <p className="sa-metric-number">
                {overviewData ? `${(overviewData.totalTransferredToLandlords || 0).toFixed(2)} XOF` : '0 XOF'}
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Company Commission Earned</p>
              <p className="sa-metric-number">
                {overviewData ? `${(overviewData.totalCompanyCommissionEarned || 0).toFixed(2)} XOF` : '0 XOF'}
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
                  <h3>Financial Management</h3>
                  <p>
                    Manage payments, expenses, and financial operations all in one place.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sa-section-card" style={{ marginTop: '24px' }}>
          <div className="sa-section-header">
            <h3>Quick Actions</h3>
            <p>Manage your financial operations and view key metrics.</p>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('tenant-payments')}>
                <p className="sa-metric-label">Pending Rent Amount</p>
                <p className="sa-metric-value" style={{ color: '#dc2626' }}>
                  {overviewData ? `${(overviewData.pendingRentAmount || 0).toFixed(2)} XOF` : '0 XOF'}
                </p>
              </div>
              <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('expenses')}>
                <p className="sa-metric-label">Total Expenses This Month</p>
                <p className="sa-metric-value">
                  {overviewData ? `${(overviewData.totalExpensesThisMonth || 0).toFixed(2)} XOF` : '0 XOF'}
                </p>
              </div>
            </div>
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

  // Load report data
  const loadReport = async () => {
    try {
      setLoading(true);
      let data = null;

      switch (selectedReportType) {
        case 'payments-by-period':
          data = await accountingService.getPaymentsByPeriodReport(reportStartDate, reportEndDate, reportPeriod);
          break;
        case 'commissions-by-period':
          data = await accountingService.getCommissionsByPeriodReport(reportStartDate, reportEndDate, reportPeriod);
          break;
        case 'refunds':
          data = await accountingService.getRefundsReport(reportStartDate, reportEndDate);
          break;
        case 'payments-by-building':
          data = await accountingService.getPaymentsByBuildingReport(reportStartDate, reportEndDate);
          break;
        case 'payments-by-tenant':
          data = await accountingService.getPaymentsByTenantReport(reportStartDate, reportEndDate);
          break;
        case 'expenses-by-period':
          data = await accountingService.getExpensesByPeriodReport(reportStartDate, reportEndDate);
          break;
        case 'collections-by-period':
          data = await accountingService.getCollectionsByPeriodReport(reportStartDate, reportEndDate);
          break;
        case 'building-performance':
          data = await accountingService.getBuildingPerformanceReport(reportStartDate, reportEndDate);
          break;
        case 'payment-status':
          data = await accountingService.getPaymentStatusReport(reportStartDate, reportEndDate);
          break;
        default:
          break;
      }

      setReportData(data);
    } catch (error) {
      console.error('Error loading report:', error);
      addNotification('Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Export report to CSV
  const exportReportToCSV = () => {
    if (!reportData) return;

    let headers = [];
    let rows = [];
    let filename = '';

    switch (selectedReportType) {
      case 'payments-by-period':
        headers = ['Period', 'Total Count', 'Total Amount', 'Successful Count', 'Successful Amount', 'Failed Count', 'Failed Amount'];
        rows = (reportData.summary || []).map(item => [
          item.period || '',
          item.totalCount || 0,
          item.totalAmount?.toFixed(2) || '0.00',
          item.successfulCount || 0,
          item.successfulAmount?.toFixed(2) || '0.00',
          item.failedCount || 0,
          item.failedAmount?.toFixed(2) || '0.00'
        ]);
        filename = `payments-by-period-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'commissions-by-period':
        headers = ['Period', 'Total Commission', 'Payment Count', 'Average Commission'];
        rows = (reportData.summary || []).map(item => [
          item.period || '',
          item.totalCommission?.toFixed(2) || '0.00',
          item.paymentCount || 0,
          item.averageCommission?.toFixed(2) || '0.00'
        ]);
        filename = `commissions-by-period-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'refunds':
        headers = ['Tenant', 'Property', 'Amount', 'Method', 'Date', 'Status'];
        rows = (reportData.refunds || []).map(item => [
          item.Tenant || item.tenant || '',
          item.Property || item.property || '',
          item.Amount?.toFixed(2) || '0.00',
          item.Method || item.method || '',
          item.Date ? new Date(item.Date || item.date).toLocaleDateString() : '',
          item.Status || item.status || ''
        ]);
        filename = `refunds-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'payments-by-building':
        headers = ['Building', 'Total Amount', 'Payment Count', 'Rent Amount', 'Deposit Amount', 'Other Amount'];
        rows = (reportData.summary || []).map(item => [
          item.building || '',
          item.totalAmount?.toFixed(2) || '0.00',
          item.paymentCount || 0,
          item.rentAmount?.toFixed(2) || '0.00',
          item.depositAmount?.toFixed(2) || '0.00',
          item.otherAmount?.toFixed(2) || '0.00'
        ]);
        filename = `payments-by-building-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'payments-by-tenant':
        headers = ['Tenant', 'Property', 'Total Amount', 'Payment Count', 'Last Payment Date'];
        rows = (reportData.summary || []).map(item => [
          item.tenant || '',
          item.property || '',
          item.totalAmount?.toFixed(2) || '0.00',
          item.paymentCount || 0,
          item.lastPaymentDate ? new Date(item.lastPaymentDate).toLocaleDateString() : ''
        ]);
        filename = `payments-by-tenant-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'expenses-by-period':
        headers = ['Period', 'Total Amount', 'Expense Count'];
        rows = (reportData.summary || []).map(item => [
          item.period || '',
          item.totalAmount?.toFixed(2) || '0.00',
          item.expenseCount || 0
        ]);
        filename = `expenses-by-period-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'collections-by-period':
        headers = ['Period', 'Total Amount', 'Collection Count'];
        rows = (reportData.summary || []).map(item => [
          item.period || '',
          item.totalAmount?.toFixed(2) || '0.00',
          item.collectionCount || 0
        ]);
        filename = `collections-by-period-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'building-performance':
        headers = ['Building', 'Total Collections', 'Total Expenses', 'Net Revenue', 'Occupancy Rate', 'Payment Collection Rate'];
        rows = (reportData.buildings || []).map(item => [
          item.building || '',
          item.totalCollections?.toFixed(2) || '0.00',
          item.totalExpenses?.toFixed(2) || '0.00',
          item.netRevenue?.toFixed(2) || '0.00',
          item.occupancyRate?.toFixed(2) || '0.00',
          item.paymentCollectionRate?.toFixed(2) || '0.00'
        ]);
        filename = `building-performance-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'payment-status':
        headers = ['Status', 'Count', 'Total Amount'];
        rows = (reportData.statusBreakdown || []).map(item => [
          item.status || '',
          item.count || 0,
          item.totalAmount?.toFixed(2) || '0.00'
        ]);
        filename = `payment-status-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      default:
        return;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addNotification('Report exported to CSV successfully!', 'success'    );
  };

  // Render Tenants section
  const renderTenants = () => {
    // Filter tenants based on payment status
    const filteredTenants = tenants.filter(tenant => {
      if (tenantPaymentStatusFilter === 'all') return true;
      if (tenantPaymentStatusFilter === 'up-to-date') {
        return (tenant.PaymentStatus || tenant.paymentStatus) === 'up-to-date';
      }
      if (tenantPaymentStatusFilter === 'outstanding') {
        return (tenant.PaymentStatus || tenant.paymentStatus) !== 'up-to-date';
      }
      return true;
    });

    const upToDateTenants = tenants.filter(t => (t.PaymentStatus || t.paymentStatus) === 'up-to-date');
    const outstandingTenants = tenants.filter(t => (t.PaymentStatus || t.paymentStatus) !== 'up-to-date');

    // Export function
    const exportToCSV = (tenantList, filename) => {
      if (tenantList.length === 0) {
        addNotification('No tenants to export', 'info');
        return;
      }

      const headers = ['Tenant Name', 'Email', 'Phone', 'Property', 'Building', 'Monthly Rent', 'Payment Status', 'Months in Arrears', 'Outstanding Amount', 'Last Payment Date', 'Next Payment Due'];
      const rows = tenantList.map(tenant => {
        const name = tenant.TenantName || tenant.tenantName || '';
        const email = tenant.Email || tenant.email || '';
        const phone = tenant.Phone || tenant.phone || '';
        const property = tenant.Property || tenant.property || '';
        const building = tenant.Building || tenant.building || '';
        const monthlyRent = (tenant.MonthlyRent || tenant.monthlyRent || 0).toFixed(2);
        const status = tenant.PaymentStatus || tenant.paymentStatus || '';
        const arrears = (tenant.MonthsInArrears || tenant.monthsInArrears || 0).toString();
        const outstanding = (tenant.OutstandingAmount || tenant.outstandingAmount || 0).toFixed(2);
        const lastPayment = tenant.LastPaymentDate || tenant.lastPaymentDate 
          ? new Date(tenant.LastPaymentDate || tenant.lastPaymentDate).toLocaleDateString()
          : 'N/A';
        const nextDue = tenant.NextPaymentDue || tenant.nextPaymentDue
          ? new Date(tenant.NextPaymentDue || tenant.nextPaymentDue).toLocaleDateString()
          : 'N/A';
        
        return [name, email, phone, property, building, monthlyRent, status, arrears, outstanding, lastPayment, nextDue];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addNotification(`Exported ${tenantList.length} tenants to ${filename}`, 'success');
    };

    return (
      <div>
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
              <h2>Tenants Management</h2>
              <p>View all tenants and their payment status</p>
        </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="sa-outline-button"
                onClick={() => exportToCSV(outstandingTenants, `outstanding-tenants-${new Date().toISOString().split('T')[0]}.csv`)}
                disabled={loading || outstandingTenants.length === 0}
              >
          <Download size={18} />
                Export Outstanding
              </button>
              <button
                className="sa-outline-button"
                onClick={() => exportToCSV(upToDateTenants, `up-to-date-tenants-${new Date().toISOString().split('T')[0]}.csv`)}
                disabled={loading || upToDateTenants.length === 0}
              >
                <Download size={18} />
                Export Up-to-Date
              </button>
              <button
                className="sa-primary-cta"
                onClick={() => exportToCSV(filteredTenants, `all-tenants-${new Date().toISOString().split('T')[0]}.csv`)}
                disabled={loading || filteredTenants.length === 0}
              >
                <Download size={18} />
                Export All
        </button>
            </div>
      </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Tenants</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#166534' }}>
                {tenants.length}
              </p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Up-to-Date</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#059669' }}>
                {upToDateTenants.length}
              </p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Outstanding</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#dc2626' }}>
                {outstandingTenants.length}
              </p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Outstanding</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#d97706' }}>
                {outstandingTenants.reduce((sum, t) => sum + (t.OutstandingAmount || t.outstandingAmount || 0), 0).toFixed(2)} XOF
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="sa-filters-section" style={{ marginBottom: '20px' }}>
            <select
              className="sa-filter-select"
              value={tenantPaymentStatusFilter}
              onChange={(e) => setTenantPaymentStatusFilter(e.target.value)}
            >
              <option value="all">All Tenants</option>
              <option value="up-to-date">Up-to-Date</option>
              <option value="outstanding">Outstanding</option>
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading tenants...</div>
          ) : filteredTenants.length === 0 ? (
            <div className="no-data">No tenants found</div>
          ) : (
            <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
                    <th>Tenant Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Property</th>
              <th>Building</th>
                    <th>Monthly Rent</th>
                    <th>Payment Status</th>
                    <th>Months in Arrears</th>
                    <th>Outstanding Amount</th>
                    <th>Last Payment</th>
                    <th>Next Payment Due</th>
              <th className="table-menu">Actions</th>
            </tr>
          </thead>
          <tbody>
                  {filteredTenants.map((tenant, index) => {
                    const status = tenant.PaymentStatus || tenant.paymentStatus || 'unknown';
                    const arrears = tenant.MonthsInArrears || tenant.monthsInArrears || 0;
                    const outstanding = tenant.OutstandingAmount || tenant.outstandingAmount || 0;
                    
                    let statusClass = 'up-to-date';
                    let statusLabel = 'Up-to-Date';
                    if (status === '1-month') {
                      statusClass = 'warning';
                      statusLabel = '1 Month';
                    } else if (status === '2-months') {
                      statusClass = 'warning';
                      statusLabel = '2 Months';
                    } else if (status === '3+months') {
                      statusClass = 'error';
                      statusLabel = '3+ Months';
                    }

                    return (
                      <tr key={tenant.TenantID || tenant.tenantId || index}>
                        <td><span className="sa-cell-title">{tenant.TenantName || tenant.tenantName || 'N/A'}</span></td>
                        <td>{tenant.Email || tenant.email || 'N/A'}</td>
                        <td>{tenant.Phone || tenant.phone || 'N/A'}</td>
                        <td>{tenant.Property || tenant.property || 'N/A'}</td>
                        <td>{tenant.Building || tenant.building || 'N/A'}</td>
                        <td>{(tenant.MonthlyRent || tenant.monthlyRent || 0).toFixed(2)} XOF</td>
                        <td>
                          <span className={`sa-status-pill ${statusClass}`}>
                            {statusLabel}
                          </span>
              </td>
                        <td>{arrears}</td>
                        <td style={{ color: outstanding > 0 ? '#dc2626' : '#059669', fontWeight: '600' }}>
                          {outstanding.toFixed(2)} XOF
                        </td>
                        <td>
                          {tenant.LastPaymentDate || tenant.lastPaymentDate
                            ? new Date(tenant.LastPaymentDate || tenant.lastPaymentDate).toLocaleDateString()
                            : 'N/A'}
              </td>
                        <td>
                          {tenant.NextPaymentDue || tenant.nextPaymentDue
                            ? new Date(tenant.NextPaymentDue || tenant.nextPaymentDue).toLocaleDateString()
                            : 'N/A'}
              </td>
                        <td>
                          <button
                            className="sa-primary-cta"
                            onClick={() => {
                              setSelectedTenantForPayment(tenant);
                              setShowCashPaymentModal(true);
                            }}
                          >
                            Record Cash Payment
                          </button>
              </td>
            </tr>
                    );
                  })}
          </tbody>
        </table>
      </div>
          )}
        </div>
      </div>
    );
  };

  // Render Deposits section
  const renderDeposits = () => {
    const filteredDeposits = deposits.filter(deposit => {
      if (depositFilter === 'all') return true;
      return (deposit.Type || deposit.type) === depositFilter;
    });

    const paymentDeposits = deposits.filter(d => (d.Type || d.type) === 'payment');
    const refundDeposits = deposits.filter(d => (d.Type || d.type) === 'refund');
    const totalPayments = paymentDeposits.reduce((sum, d) => sum + (d.Amount || d.amount || 0), 0);
    const totalRefunds = refundDeposits.reduce((sum, d) => sum + (d.Amount || d.amount || 0), 0);

    return (
        <div>
        <div className="sa-section-card">
          <div className="sa-section-header">
            <div>
              <h2>Security Deposits Management</h2>
              <p>Manage security deposit payments and refunds</p>
        </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="sa-outline-button"
                onClick={() => {
                  setDepositRefundForm({
                    depositId: '',
                    refundMethod: 'mobile_money',
                    refundAccount: '',
                    notes: ''
                  });
                  setShowDepositRefundModal(true);
                }}
                disabled={loading || paymentDeposits.length === 0}
              >
                Process Refund
              </button>
              <button
                className="sa-primary-cta"
                onClick={() => {
                  setDepositPaymentForm({
                    tenant: '',
                    property: '',
                    tenantType: 'individual',
                    monthlyRent: '',
                    paymentMethod: 'mobile_money',
                    reference: '',
                    notes: ''
                  });
                  setShowDepositPaymentModal(true);
                }}
                disabled={loading}
              >
                <Plus size={18} />
                Record Deposit Payment
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #93c5fd' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Payments</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#1e40af' }}>
                {paymentDeposits.length}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                {totalPayments.toFixed(2)} XOF
              </p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Refunds</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#166534' }}>
                {refundDeposits.length}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                {totalRefunds.toFixed(2)} XOF
              </p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Net Deposits</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#d97706' }}>
                {(totalPayments - totalRefunds).toFixed(2)} XOF
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Available deposits
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="sa-filters-section" style={{ marginBottom: '20px' }}>
            <select
              className="sa-filter-select"
              value={depositFilter}
              onChange={(e) => setDepositFilter(e.target.value)}
            >
              <option value="all">All Deposits</option>
              <option value="payment">Payments Only</option>
              <option value="refund">Refunds Only</option>
            </select>
      </div>

      {loading ? (
            <div className="loading">Loading deposits...</div>
          ) : filteredDeposits.length === 0 ? (
            <div className="no-data">No deposits found</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                    <th>Date</th>
                    <th>Tenant</th>
                    <th>Property</th>
                    <th>Type</th>
                    <th>Tenant Type</th>
                    <th>Monthly Rent</th>
                    <th>Months</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Reference</th>
                    <th>Status</th>
              </tr>
            </thead>
            <tbody>
                  {filteredDeposits.map((deposit, index) => {
                    const type = deposit.Type || deposit.type || 'payment';
                    const isPayment = type === 'payment';
                    const tenantType = deposit.TenantType || deposit.tenantType || 'individual';
                    const months = deposit.MonthsMultiplier || deposit.monthsMultiplier || 0;
                    
                    return (
                      <tr key={deposit.ID || deposit.id || index}>
                        <td>
                          {deposit.CreatedAt || deposit.createdAt
                            ? new Date(deposit.CreatedAt || deposit.createdAt).toLocaleDateString()
                            : 'N/A'}
                </td>
                        <td><span className="sa-cell-title">{deposit.Tenant || deposit.tenant || 'N/A'}</span></td>
                        <td>{deposit.Property || deposit.property || 'N/A'}</td>
                        <td>
                          <span className={`sa-status-pill ${isPayment ? 'success' : 'info'}`}>
                            {isPayment ? 'Payment' : 'Refund'}
                          </span>
                </td>
                        <td>{tenantType === 'company' ? 'Company' : 'Individual'}</td>
                        <td>{(deposit.MonthlyRent || deposit.monthlyRent || 0).toFixed(2)} XOF</td>
                        <td>{months} months</td>
                        <td style={{ fontWeight: '600', color: isPayment ? '#059669' : '#dc2626' }}>
                          {isPayment ? '+' : '-'}{(deposit.Amount || deposit.amount || 0).toFixed(2)} XOF
                        </td>
                        <td>{deposit.PaymentMethod || deposit.paymentMethod || deposit.RefundMethod || deposit.refundMethod || 'N/A'}</td>
                        <td>{deposit.Reference || deposit.reference || 'N/A'}</td>
                        <td>
                          <span className={`sa-status-pill ${(deposit.Status || deposit.status || 'pending').toLowerCase()}`}>
                            {deposit.Status || deposit.status || 'Pending'}
                          </span>
                </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Deposit Payment Modal */}
        {showDepositPaymentModal && (
          <div className="modal-overlay" onClick={() => setShowDepositPaymentModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Record Security Deposit Payment</h3>
                <button className="modal-close" onClick={() => setShowDepositPaymentModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setLoading(true);
                    await accountingService.recordDepositPayment({
                      ...depositPaymentForm,
                      monthlyRent: parseFloat(depositPaymentForm.monthlyRent)
                    });
                    addNotification('Security deposit payment recorded successfully!', 'success');
                    setShowDepositPaymentModal(false);
                    setDepositPaymentForm({
                      tenant: '',
                      property: '',
                      tenantType: 'individual',
                      monthlyRent: '',
                      paymentMethod: 'mobile_money',
                      reference: '',
                      notes: ''
                    });
                    await loadDeposits();
                  } catch (error) {
                    console.error('Error recording deposit payment:', error);
                    addNotification(error.message || 'Failed to record deposit payment', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}>
                  <div className="form-group">
                    <label htmlFor="depositTenant">Tenant Name *</label>
                    <input
                      type="text"
                      id="depositTenant"
                      value={depositPaymentForm.tenant}
                      onChange={(e) => setDepositPaymentForm({...depositPaymentForm, tenant: e.target.value})}
                      required
                      placeholder="Enter tenant name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="depositProperty">Property *</label>
                    <input
                      type="text"
                      id="depositProperty"
                      value={depositPaymentForm.property}
                      onChange={(e) => setDepositPaymentForm({...depositPaymentForm, property: e.target.value})}
                      required
                      placeholder="e.g., Apartment 4B or House 123"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="depositTenantType">Tenant Type *</label>
                    <select
                      id="depositTenantType"
                      value={depositPaymentForm.tenantType}
                      onChange={(e) => setDepositPaymentForm({...depositPaymentForm, tenantType: e.target.value})}
                      required
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                    </select>
                    <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                      {depositPaymentForm.tenantType === 'company' 
                        ? 'Company: 3 months deposit for apartments, 5 months for houses'
                        : 'Individual: 2 months deposit for apartments, 5 months for houses'}
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="depositMonthlyRent">Monthly Rent (XOF) *</label>
                    <input
                      type="number"
                      id="depositMonthlyRent"
                      step="0.01"
                      value={depositPaymentForm.monthlyRent}
                      onChange={(e) => setDepositPaymentForm({...depositPaymentForm, monthlyRent: e.target.value})}
                      required
                      placeholder="0.00"
                    />
                    {depositPaymentForm.monthlyRent && (
                      <small style={{ color: '#059669', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                        Deposit Amount: {
                          (parseFloat(depositPaymentForm.monthlyRent) * 
                          (depositPaymentForm.tenantType === 'company' ? 3 : 
                           depositPaymentForm.property.toLowerCase().includes('house') || 
                           depositPaymentForm.property.toLowerCase().includes('villa') ? 5 : 2)
                          ).toFixed(2)
                        } XOF
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="depositPaymentMethod">Payment Method *</label>
                    <select
                      id="depositPaymentMethod"
                      value={depositPaymentForm.paymentMethod}
                      onChange={(e) => setDepositPaymentForm({...depositPaymentForm, paymentMethod: e.target.value})}
                      required
                    >
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="depositReference">Reference</label>
                    <input
                      type="text"
                      id="depositReference"
                      value={depositPaymentForm.reference}
                      onChange={(e) => setDepositPaymentForm({...depositPaymentForm, reference: e.target.value})}
                      placeholder="Payment reference number"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="depositNotes">Notes</label>
                    <textarea
                      id="depositNotes"
                      value={depositPaymentForm.notes}
                      onChange={(e) => setDepositPaymentForm({...depositPaymentForm, notes: e.target.value})}
                      placeholder="Additional notes"
                      rows="3"
                    />
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="action-button secondary" onClick={() => setShowDepositPaymentModal(false)}>
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

        {/* Deposit Refund Modal */}
        {showDepositRefundModal && (
          <div className="modal-overlay" onClick={() => setShowDepositRefundModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Process Security Deposit Refund</h3>
                <button className="modal-close" onClick={() => setShowDepositRefundModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setLoading(true);
                    await accountingService.processDepositRefund({
                      depositId: parseInt(depositRefundForm.depositId),
                      refundMethod: depositRefundForm.refundMethod,
                      refundAccount: depositRefundForm.refundAccount,
                      notes: depositRefundForm.notes
                    });
                    addNotification('Security deposit refund processed successfully!', 'success');
                    setShowDepositRefundModal(false);
                    setDepositRefundForm({
                      depositId: '',
                      refundMethod: 'mobile_money',
                      refundAccount: '',
                      notes: ''
                    });
                    await loadDeposits();
                  } catch (error) {
                    console.error('Error processing deposit refund:', error);
                    addNotification(error.message || 'Failed to process deposit refund', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}>
                  <div className="form-group">
                    <label htmlFor="refundDepositId">Select Deposit to Refund *</label>
                    <select
                      id="refundDepositId"
                      value={depositRefundForm.depositId}
                      onChange={(e) => setDepositRefundForm({...depositRefundForm, depositId: e.target.value})}
                      required
                    >
                      <option value="">Select Deposit</option>
                      {paymentDeposits
                        .filter(d => (d.Status || d.status) !== 'refunded')
                        .map(deposit => {
                          const refunded = refundDeposits.some(r => 
                            (r.LeaseID || r.leaseId) === (deposit.LeaseID || deposit.leaseId)
                          );
                          if (refunded) return null;
                          return (
                            <option key={deposit.ID || deposit.id} value={deposit.ID || deposit.id}>
                              {deposit.Tenant || deposit.tenant} - {deposit.Property || deposit.property} - 
                              {(deposit.Amount || deposit.amount || 0).toFixed(2)} XOF
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="refundMethod">Refund Method *</label>
                    <select
                      id="refundMethod"
                      value={depositRefundForm.refundMethod}
                      onChange={(e) => setDepositRefundForm({...depositRefundForm, refundMethod: e.target.value})}
                      required
                    >
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="refundAccount">Refund Account Details *</label>
                    <input
                      type="text"
                      id="refundAccount"
                      value={depositRefundForm.refundAccount}
                      onChange={(e) => setDepositRefundForm({...depositRefundForm, refundAccount: e.target.value})}
                      required
                      placeholder="Phone number, bank account, or cash recipient name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="refundNotes">Notes</label>
                    <textarea
                      id="refundNotes"
                      value={depositRefundForm.notes}
                      onChange={(e) => setDepositRefundForm({...depositRefundForm, notes: e.target.value})}
                      placeholder="Additional notes about the refund"
                      rows="3"
                    />
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="action-button secondary" onClick={() => setShowDepositRefundModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="action-button primary" disabled={loading}>
                      {loading ? 'Processing...' : 'Process Refund'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReports = () => {
    const reportTypes = [
      { value: 'payments-by-period', label: 'Payments by Period' },
      { value: 'commissions-by-period', label: 'Commissions by Period' },
      { value: 'refunds', label: 'Refunds Report' },
      { value: 'payments-by-building', label: 'Payments by Building' },
      { value: 'payments-by-tenant', label: 'Payments by Tenant' },
      { value: 'expenses-by-period', label: 'Expenses by Period' },
      { value: 'collections-by-period', label: 'Collections by Period' },
      { value: 'building-performance', label: 'Building Performance' },
      { value: 'payment-status', label: 'Payment Status Breakdown' }
    ];

    return (
      <div>
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
              <h2>Financial Reports</h2>
              <p>Generate comprehensive reports on payments, commissions, refunds, and more</p>
        </div>
          </div>

          {/* Report Filters */}
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label>Report Type</label>
                <select
                  value={selectedReportType}
                  onChange={(e) => {
                    setSelectedReportType(e.target.value);
                    setReportData(null);
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {(selectedReportType === 'payments-by-period' || selectedReportType === 'commissions-by-period') && (
                <div className="form-group">
                  <label>Period</label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="sa-primary-cta"
                onClick={loadReport}
                disabled={loading}
              >
                Generate Report
              </button>
              {reportData && (
                <button
                  className="sa-outline-button"
                  onClick={exportReportToCSV}
                  disabled={loading}
                >
          <Download size={18} />
                  Export to CSV
        </button>
              )}
            </div>
      </div>

          {/* Report Display */}
          {loading ? (
            <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Generating report...</div>
          ) : reportData ? (
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '8px' }}>
                  {reportTypes.find(t => t.value === selectedReportType)?.label}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  Period: {reportData.startDate} to {reportData.endDate}
                  {reportData.period && ` | Grouped by: ${reportData.period}`}
                </p>
              </div>

              {/* Render report based on type */}
              {selectedReportType === 'payments-by-period' && renderPaymentsByPeriodReport()}
              {selectedReportType === 'commissions-by-period' && renderCommissionsByPeriodReport()}
              {selectedReportType === 'refunds' && renderRefundsReport()}
              {selectedReportType === 'payments-by-building' && renderPaymentsByBuildingReport()}
              {selectedReportType === 'payments-by-tenant' && renderPaymentsByTenantReport()}
              {selectedReportType === 'expenses-by-period' && renderExpensesByPeriodReport()}
              {selectedReportType === 'collections-by-period' && renderCollectionsByPeriodReport()}
              {selectedReportType === 'building-performance' && renderBuildingPerformanceReport()}
              {selectedReportType === 'payment-status' && renderPaymentStatusReport()}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              Select filters and click "Generate Report" to view report data
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render functions for each report type
  const renderPaymentsByPeriodReport = () => {
    if (!reportData?.summary) return null;
    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Total Count</th>
              <th>Total Amount</th>
              <th>Successful Count</th>
              <th>Successful Amount</th>
              <th>Failed Count</th>
              <th>Failed Amount</th>
              </tr>
          </thead>
          <tbody>
            {reportData.summary.map((item, index) => (
              <tr key={index}>
                <td>{item.period}</td>
                <td>{item.totalCount || 0}</td>
                <td>{(item.totalAmount || 0).toFixed(2)} XOF</td>
                <td>{item.successfulCount || 0}</td>
                <td>{(item.successfulAmount || 0).toFixed(2)} XOF</td>
                <td>{item.failedCount || 0}</td>
                <td>{(item.failedAmount || 0).toFixed(2)} XOF</td>
            </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCommissionsByPeriodReport = () => {
    if (!reportData?.summary) return null;
    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Total Commission</th>
              <th>Payment Count</th>
              <th>Average Commission</th>
            </tr>
          </thead>
          <tbody>
            {reportData.summary.map((item, index) => (
              <tr key={index}>
                <td>{item.period}</td>
                <td>{(item.totalCommission || 0).toFixed(2)} XOF</td>
                <td>{item.paymentCount || 0}</td>
                <td>{(item.averageCommission || 0).toFixed(2)} XOF</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRefundsReport = () => {
    if (!reportData) return null;
    return (
      <div>
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Refund Amount</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#dc2626' }}>
                {(reportData.totalRefundAmount || 0).toFixed(2)} XOF
              </p>
            </div>
            <div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Refund Count</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: '600' }}>
                {reportData.refundCount || 0}
              </p>
            </div>
          </div>
        </div>
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
              </tr>
            </thead>
            <tbody>
              {(reportData.refunds || []).map((refund, index) => (
                <tr key={index}>
                  <td>{refund.Tenant || refund.tenant || 'N/A'}</td>
                  <td>{refund.Property || refund.property || 'N/A'}</td>
                  <td>{(refund.Amount || refund.amount || 0).toFixed(2)} XOF</td>
                  <td>{refund.Method || refund.method || 'N/A'}</td>
                  <td>{refund.Date || refund.date ? new Date(refund.Date || refund.date).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`sa-status-pill ${(refund.Status || refund.status || '').toLowerCase()}`}>
                      {refund.Status || refund.status || 'N/A'}
                    </span>
                </td>
            </tr>
              ))}
          </tbody>
        </table>
                  </div>
      </div>
    );
  };

  const renderPaymentsByBuildingReport = () => {
    if (!reportData?.summary) return null;
    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Building</th>
              <th>Total Amount</th>
              <th>Payment Count</th>
              <th>Rent Amount</th>
              <th>Deposit Amount</th>
              <th>Other Amount</th>
              </tr>
          </thead>
          <tbody>
            {reportData.summary.map((item, index) => (
              <tr key={index}>
                <td><span className="sa-cell-title">{item.building || 'N/A'}</span></td>
                <td>{(item.totalAmount || 0).toFixed(2)} XOF</td>
                <td>{item.paymentCount || 0}</td>
                <td>{(item.rentAmount || 0).toFixed(2)} XOF</td>
                <td>{(item.depositAmount || 0).toFixed(2)} XOF</td>
                <td>{(item.otherAmount || 0).toFixed(2)} XOF</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
    );
  };

  const renderPaymentsByTenantReport = () => {
    if (!reportData?.summary) return null;
    return (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
              <th>Tenant</th>
              <th>Property</th>
              <th>Total Amount</th>
              <th>Payment Count</th>
              <th>Last Payment Date</th>
              </tr>
            </thead>
            <tbody>
            {reportData.summary.map((item, index) => (
              <tr key={index}>
                <td><span className="sa-cell-title">{item.tenant || 'N/A'}</span></td>
                <td>{item.property || 'N/A'}</td>
                <td>{(item.totalAmount || 0).toFixed(2)} XOF</td>
                <td>{item.paymentCount || 0}</td>
                <td>{item.lastPaymentDate ? new Date(item.lastPaymentDate).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderExpensesByPeriodReport = () => {
    if (!reportData) return null;
    return (
      <div>
        <div className="sa-table-wrapper" style={{ marginBottom: '20px' }}>
          <table className="sa-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Total Amount</th>
                <th>Expense Count</th>
              </tr>
            </thead>
            <tbody>
              {(reportData.summary || []).map((item, index) => (
                <tr key={index}>
                  <td>{item.period}</td>
                  <td>{(item.totalAmount || 0).toFixed(2)} XOF</td>
                  <td>{item.expenseCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
                  </div>
        {reportData.byCategory && Object.keys(reportData.byCategory).length > 0 && (
          <div>
            <h4 style={{ marginBottom: '12px' }}>Expenses by Category</h4>
            <div className="sa-table-wrapper">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Total Amount</th>
              </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.byCategory).map(([category, amount]) => (
                    <tr key={category}>
                      <td>{category}</td>
                      <td>{amount.toFixed(2)} XOF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      )}
    </div>
  );
  };

  const renderCollectionsByPeriodReport = () => {
    if (!reportData?.summary) return null;
    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Total Amount</th>
              <th>Collection Count</th>
            </tr>
          </thead>
          <tbody>
            {reportData.summary.map((item, index) => (
              <tr key={index}>
                <td>{item.period}</td>
                <td>{(item.totalAmount || 0).toFixed(2)} XOF</td>
                <td>{item.collectionCount || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
                  </div>
    );
  };

  const renderBuildingPerformanceReport = () => {
    if (!reportData?.buildings) return null;
    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Building</th>
              <th>Total Collections</th>
              <th>Total Expenses</th>
              <th>Net Revenue</th>
              <th>Occupancy Rate</th>
              <th>Payment Collection Rate</th>
              </tr>
          </thead>
          <tbody>
            {reportData.buildings.map((item, index) => (
              <tr key={index}>
                <td><span className="sa-cell-title">{item.building || 'N/A'}</span></td>
                <td>{(item.totalCollections || 0).toFixed(2)} XOF</td>
                <td>{(item.totalExpenses || 0).toFixed(2)} XOF</td>
                <td>{(item.netRevenue || 0).toFixed(2)} XOF</td>
                <td>{(item.occupancyRate || 0).toFixed(2)}%</td>
                <td>{(item.paymentCollectionRate || 0).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPaymentStatusReport = () => {
    if (!reportData?.statusBreakdown) return null;
    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {reportData.statusBreakdown.map((item, index) => (
              <tr key={index}>
                <td>
                  <span className={`sa-status-pill ${(item.status || '').toLowerCase()}`}>
                    {item.status || 'N/A'}
                  </span>
                </td>
                <td>{item.count || 0}</td>
                <td>{(item.totalAmount || 0).toFixed(2)} XOF</td>
              </tr>
            ))}
            </tbody>
          </table>
    </div>
  );
  };

  const renderTenantPayments = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h2>Tenant Payment Management</h2>
          <p>View tenant payments processed via API - Successful and Failed payments only</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
        <button 
            className="sa-outline-button" 
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.csv,.xlsx,.xls';
              input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                  await handleImportPayments(file);
                }
              };
              input.click();
            }}
          disabled={loading}
        >
            <Download size={18} />
            Import Payments
          </button>
          <button 
            className="sa-primary-cta" 
            onClick={() => {
              exportPaymentsToCSV();
            }}
            disabled={loading || tenantPayments.length === 0}
          >
            <Download size={18} />
            Export to CSV
        </button>
        </div>
      </div>

      <div className="sa-filters-section">
        <select className="sa-filter-select">
          <option value="">All Payments</option>
          <option value="successful">Successful</option>
          <option value="failed">Failed</option>
        </select>
        <select className="sa-filter-select">
          <option value="">All Methods</option>
          <option value="mobile_money">Mobile Money</option>
        </select>
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
                <th>Reference</th>
                <th className="table-menu">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenantPayments
                .filter(payment => {
                  const status = (payment.Status || '').toLowerCase();
                  return status === 'successful' || status === 'failed' || status === 'approved' || status === 'rejected';
                })
                .map((payment, index) => {
                  const status = (payment.Status || '').toLowerCase();
                  const displayStatus = status === 'approved' ? 'Successful' : status === 'rejected' ? 'Failed' : payment.Status || 'Unknown';
                  
                  return (
                <tr key={payment.ID || `payment-${index}`}>
                  <td>
                    <span className="sa-cell-title">{payment.Tenant || 'N/A'}</span>
                  </td>
                  <td>{payment.Property || 'N/A'}</td>
                  <td>{payment.Amount?.toFixed(2) || '0.00'} XOF</td>
                  <td>{payment.Method || 'N/A'}</td>
                  <td>{payment.Date ? new Date(payment.Date).toLocaleDateString() : 'N/A'}</td>
                  <td>
                        <span className={`sa-status-pill ${displayStatus.toLowerCase()}`}>
                          {displayStatus}
                    </span>
                  </td>
                  <td>
                        {payment.Reference || payment.reference || 'N/A'}
                  </td>
                  <td className="table-menu">
                    <div className="sa-row-actions">
                          {payment.ReceiptNumber && (
                      <button 
                        className="table-action-button view"
                              onClick={() => downloadReceipt(payment)}
                              title="Download Receipt"
                      >
                              <Download size={14} />
                              Download
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

  // Export expenses to CSV
  const exportExpensesToCSV = () => {
    const filteredExpenses = getFilteredExpenses();
    
    const headers = ['Date', 'Scope', 'Building', 'Category', 'Amount', 'Notes'];
    const rows = filteredExpenses.map(exp => [
      exp.Date || exp.date ? new Date(exp.Date || exp.date).toLocaleDateString() : '',
      exp.Scope || exp.scope || '',
      exp.Building || exp.building || '',
      exp.Category || exp.category || '',
      (exp.Amount || exp.amount || 0).toFixed(2),
      (exp.Notes || exp.notes || '').replace(/"/g, '""') // Escape quotes for CSV
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateRange = expenseStartDateFilter && expenseEndDateFilter 
      ? `${expenseStartDateFilter}-to-${expenseEndDateFilter}` 
      : new Date().toISOString().split('T')[0];
    a.download = `expenses-${dateRange}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addNotification('Expenses exported to CSV successfully!', 'success');
  };

  // Get filtered expenses
  const getFilteredExpenses = () => {
    let filtered = [...expenses];

    // Filter by scope
    if (expenseScopeFilter) {
      filtered = filtered.filter(exp => 
        (exp.Scope || exp.scope || '').toLowerCase() === expenseScopeFilter.toLowerCase()
      );
    }

    // Filter by search text
    if (expenseSearchText) {
      const searchLower = expenseSearchText.toLowerCase();
      filtered = filtered.filter(exp => 
        (exp.Building || exp.building || '').toLowerCase().includes(searchLower) ||
        (exp.Category || exp.category || '').toLowerCase().includes(searchLower) ||
        (exp.Notes || exp.notes || '').toLowerCase().includes(searchLower) ||
        (exp.Scope || exp.scope || '').toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const renderExpenses = () => {
    const filteredExpenses = getFilteredExpenses();
    
    // Get unique values for filter dropdowns
    const uniqueBuildings = [...new Set(expenses.map(exp => exp.Building || exp.building).filter(Boolean))];
    const uniqueCategories = [...new Set(expenses.map(exp => exp.Category || exp.category).filter(Boolean))];
    const uniqueScopes = [...new Set(expenses.map(exp => exp.Scope || exp.scope).filter(Boolean))];

    return (
      <>
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h2>Expense Management</h2>
          <p>Track expenses by building or for SAAF IMMO</p>
        </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="sa-outline-button" 
              onClick={exportExpensesToCSV}
              disabled={loading || filteredExpenses.length === 0}
            >
              <Download size={18} />
              Export to CSV
            </button>
        <button 
          className="sa-primary-cta" 
          onClick={() => setShowExpenseModal(true)}
          disabled={loading}
        >
          <Plus size={18} />
          Add Expense
        </button>
          </div>
        </div>

        {/* Filters */}
        <div className="sa-filters-section" style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <select 
            className="sa-filter-select"
            value={expenseBuildingFilter}
            onChange={(e) => setExpenseBuildingFilter(e.target.value)}
          >
            <option value="">All Buildings</option>
            {uniqueBuildings.map(building => (
              <option key={building} value={building}>{building}</option>
            ))}
          </select>

          <select 
            className="sa-filter-select"
            value={expenseCategoryFilter}
            onChange={(e) => setExpenseCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select 
            className="sa-filter-select"
            value={expenseScopeFilter}
            onChange={(e) => setExpenseScopeFilter(e.target.value)}
          >
            <option value="">All Scopes</option>
            {uniqueScopes.map(scope => (
              <option key={scope} value={scope}>{scope}</option>
            ))}
          </select>

          <input
            type="date"
            className="sa-filter-select"
            value={expenseStartDateFilter}
            onChange={(e) => setExpenseStartDateFilter(e.target.value)}
            placeholder="Start Date"
          />

          <input
            type="date"
            className="sa-filter-select"
            value={expenseEndDateFilter}
            onChange={(e) => setExpenseEndDateFilter(e.target.value)}
            placeholder="End Date"
          />

          <div className="sa-search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search expenses..."
              value={expenseSearchText}
              onChange={(e) => setExpenseSearchText(e.target.value)}
            />
          </div>

          {(expenseBuildingFilter || expenseCategoryFilter || expenseScopeFilter || expenseStartDateFilter || expenseEndDateFilter || expenseSearchText) && (
            <button
              className="sa-outline-button"
              onClick={() => {
                setExpenseBuildingFilter('');
                setExpenseCategoryFilter('');
                setExpenseScopeFilter('');
                setExpenseStartDateFilter('');
                setExpenseEndDateFilter('');
                setExpenseSearchText('');
              }}
              style={{ marginLeft: 'auto' }}
            >
              Clear Filters
            </button>
          )}
      </div>

      {loading ? (
        <div className="loading">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="no-data">
            {expenses.length === 0 ? 'No expenses found' : 'No expenses match the selected filters'}
          </div>
        ) : (
          <>
            <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Showing {filteredExpenses.length} of {expenses.length} expense(s)
                {filteredExpenses.length > 0 && (
                  <span style={{ marginLeft: '16px', fontWeight: '600' }}>
                    Total: {(filteredExpenses.reduce((sum, exp) => sum + (exp.Amount || exp.amount || 0), 0)).toFixed(2)} XOF
                  </span>
                )}
              </p>
            </div>
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
                  {filteredExpenses.map((exp, index) => (
                <tr key={exp.ID || exp.id || `expense-${index}`}>
                      <td>{exp.Date ? new Date(exp.Date).toLocaleDateString() : (exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A')}</td>
                  <td>{exp.Scope || exp.scope || 'N/A'}</td>
                  <td>
                    <span className="sa-cell-title">{exp.Building || exp.building || 'N/A'}</span>
                  </td>
                  <td>{exp.Category || exp.category || 'N/A'}</td>
                  <td>{(exp.Amount || exp.amount || 0).toFixed(2)} XOF</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exp.Notes || exp.notes || 'N/A'}
                      </td>
                  <td className="table-menu">
                    <div className="sa-row-actions">
                      <button 
                        className="table-action-button view"
                        onClick={() => {
                          setSelectedExpense(exp);
                          setShowViewExpenseModal(true);
                        }}
                      >
                        View
                      </button>
                      <button 
                        className="table-action-button edit"
                        onClick={() => {
                          setSelectedExpense(exp);
                          setShowEditExpenseModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="table-action-button delete"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
                            try {
                              setLoading(true);
                              await accountingService.deleteExpense(exp.ID || exp.id);
                              addNotification('Expense deleted successfully', 'success');
                              await loadExpenses();
                              // Refresh overview to update balances
                              try {
                                const overview = await accountingService.getOverview();
                                setOverviewData(overview);
                              } catch (err) {
                                console.error('Error refreshing overview:', err);
                              }
                            } catch (error) {
                              console.error('Error deleting expense:', error);
                              addNotification(error.message || 'Failed to delete expense', 'error');
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                      >
                        Delete
                      </button>
                      <button 
                        className="table-action-button"
                        onClick={() => {
                          setSelectedExpense(exp);
                          printExpenseReceipt(exp);
                        }}
                        style={{ backgroundColor: '#3b82f6', color: 'white', marginLeft: '4px' }}
                      >
                        Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </>
      )}
    </div>
      </>
    );
  };

  // Load History Data
  const loadHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isDemoMode()) {
        // Use demo data filtered for history
        const demoData = getAccountingDemoData();
        setHistoryPayments(demoData.tenantPayments?.filter(p => p.Status === 'Approved' || p.Status === 'Validated') || []);
        setHistoryCanceledPayments(demoData.tenantPayments?.filter(p => p.Status === 'Canceled' || p.Status === 'Cancelled') || []);
        setHistoryUnpaidRents([]);
        setHistoryPendingPayments(demoData.tenantPayments?.filter(p => p.Status === 'Pending') || []);
        setHistoryExpenses(demoData.expenses || []);
        setHistoryExpensesByProperty(demoData.expenses || []);
        setHistoryWireTransfers(demoData.landlordPayments || []);
        setHistoryFinancialDocuments(demoData.landlordPayments || []);
        setLoading(false);
        return;
      }

      // Load all history data from APIs
      const [tenantPaymentsData, landlordPaymentsData, expensesData] = await Promise.all([
        accountingService.getTenantPayments().catch(() => []),
        accountingService.getLandlordPayments().catch(() => []),
        accountingService.getExpenses({}).catch(() => [])
      ]);

      // Filter payments by status
      const allPayments = Array.isArray(tenantPaymentsData) ? tenantPaymentsData : [];
      setHistoryPayments(allPayments.filter(p => (p.Status || p.status) === 'Approved' || (p.Status || p.status) === 'Validated'));
      setHistoryCanceledPayments(allPayments.filter(p => (p.Status || p.status) === 'Canceled' || (p.Status || p.status) === 'Cancelled'));
      setHistoryPendingPayments(allPayments.filter(p => (p.Status || p.status) === 'Pending'));
      
      // Get unpaid rents (payments with status 'Unpaid' or 'Overdue')
      setHistoryUnpaidRents(allPayments.filter(p => {
        const status = (p.Status || p.status || '').toLowerCase();
        return status === 'unpaid' || status === 'overdue' || status === 'overdoe';
      }));

      // Expenses
      const allExpenses = Array.isArray(expensesData) ? expensesData : [];
      setHistoryExpenses(allExpenses);
      setHistoryExpensesByProperty(allExpenses);

      // Wire transfers (landlord payments)
      const allLandlordPayments = Array.isArray(landlordPaymentsData) ? landlordPaymentsData : [];
      setHistoryWireTransfers(allLandlordPayments);
      setHistoryFinancialDocuments(allLandlordPayments);
    } catch (error) {
      console.error('Failed to load history data:', error);
      addNotification('Failed to load history data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Load history data when history tab is active
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistoryData();
    }
  }, [activeTab, loadHistoryData]);

  // Render History section
  const renderHistory = () => {
    // Helper function to render a history table panel
    const renderHistoryPanel = (title, data, columns, renderRow) => {
      const [currentPage, setCurrentPage] = useState(1);
      const [searchTerm, setSearchTerm] = useState('');
      const itemsPerPage = 5;
      
      // Filter data based on search term
      const filteredData = data.filter(item => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return columns.some(col => {
          const value = col.accessor(item);
          return value && String(value).toLowerCase().includes(searchLower);
        });
      });

      const totalPages = Math.ceil(filteredData.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

      return (
        <div className="sa-section-card" style={{ marginBottom: '20px' }}>
          <div className="sa-section-header">
            <div>
              <h3>{title}</h3>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Saved &gt;</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '8px', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '8px 8px 8px 32px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    width: '200px'
                  }}
                />
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      background: 'white',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    &lt;
                  </button>
                  <span style={{ padding: '0 8px', fontSize: '0.875rem' }}>
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      background: 'white',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx}>{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="sa-table-empty">No data found</td>
                  </tr>
                ) : (
                  paginatedData.map((item, idx) => renderRow(item, idx))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div style={{ padding: '20px' }}>
        {/* Payment History */}
        {renderHistoryPanel(
          'Payment History',
          historyPayments,
          [
            { header: 'Date', accessor: (p) => p.Date || p.date },
            { header: 'Tenant', accessor: (p) => p.Tenant || p.tenant },
            { header: 'Property', accessor: (p) => p.Property || p.property },
            { header: 'Rent Period', accessor: () => 'Mars' },
            { header: 'Status', accessor: (p) => p.Status || p.status }
          ],
          (payment, idx) => (
            <tr key={payment.ID || payment.id || idx}>
              <td>{payment.Date ? new Date(payment.Date).toLocaleDateString('fr-FR') : (payment.date ? new Date(payment.date).toLocaleDateString('fr-FR') : 'N/A')}</td>
              <td>{payment.Tenant || payment.tenant || 'N/A'}</td>
              <td>{payment.Property || payment.property || 'N/A'}</td>
              <td>Mars</td>
              <td>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  fontSize: '0.75rem'
                }}>
                  {(payment.Status || payment.status || '').includes('Valid') ? 'Validated' : 'Approved'}
                </span>
              </td>
            </tr>
          )
        )}

        {/* Canceled Payments History */}
        {renderHistoryPanel(
          'Canceled Payments History',
          historyCanceledPayments,
          [
            { header: 'Date', accessor: (p) => p.Date || p.date },
            { header: 'Tenant', accessor: (p) => p.Tenant || p.tenant },
            { header: 'Amount Canceled', accessor: (p) => p.Amount || p.amount }
          ],
          (payment, idx) => (
            <tr key={payment.ID || payment.id || idx}>
              <td>{payment.Date ? new Date(payment.Date).toLocaleDateString('fr-FR') : (payment.date ? new Date(payment.date).toLocaleDateString('fr-FR') : 'N/A')}</td>
              <td>{payment.Tenant || payment.tenant || 'N/A'}</td>
              <td>{(payment.Amount || payment.amount || 0).toLocaleString('fr-FR')} XOF</td>
            </tr>
          )
        )}

        {/* Unpaid Rents History */}
        {renderHistoryPanel(
          'Unpaid Rents History',
          historyUnpaidRents,
          [
            { header: 'Tenant', accessor: (p) => p.Tenant || p.tenant },
            { header: 'Property', accessor: (p) => p.Property || p.property },
            { header: 'Unpaid Amount', accessor: (p) => p.Amount || p.amount },
            { header: 'Status', accessor: (p) => p.Status || p.status }
          ],
          (payment, idx) => {
            const status = (payment.Status || payment.status || '').toLowerCase();
            const statusColor = status === 'overdue' || status === 'overdoe' ? '#f59e0b' : '#ef4444';
            const statusText = status === 'overdue' || status === 'overdoe' ? 'Overdue' : 'Unpaid';
            return (
              <tr key={payment.ID || payment.id || idx}>
                <td>{payment.Tenant || payment.tenant || 'N/A'}</td>
                <td>{payment.Property || payment.property || 'N/A'}</td>
                <td>{(payment.Amount || payment.amount || 0).toLocaleString('fr-FR')} XOF</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: statusColor,
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    {statusText}
                  </span>
                </td>
              </tr>
            );
          }
        )}

        {/* Pending Payments History */}
        {renderHistoryPanel(
          'Pending Payments History',
          historyPendingPayments,
          [
            { header: 'Date', accessor: (p) => p.Date || p.date },
            { header: 'Tenant', accessor: (p) => p.Tenant || p.tenant },
            { header: 'Property', accessor: (p) => p.Property || p.property },
            { header: 'Amount Due', accessor: (p) => p.Amount || p.amount },
            { header: 'Received', accessor: () => '0' }
          ],
          (payment, idx) => (
            <tr key={payment.ID || payment.id || idx}>
              <td>{payment.Date ? new Date(payment.Date).toLocaleDateString('fr-FR') : (payment.date ? new Date(payment.date).toLocaleDateString('fr-FR') : 'N/A')}</td>
              <td>{payment.Tenant || payment.tenant || 'N/A'}</td>
              <td>{payment.Property || payment.property || 'N/A'}</td>
              <td>{(payment.Amount || payment.amount || 0).toLocaleString('fr-FR')} XOF</td>
              <td>0</td>
            </tr>
          )
        )}

        {/* Expense History */}
        {renderHistoryPanel(
          'Expense History',
          historyExpenses,
          [
            { header: 'Date', accessor: (e) => e.Date || e.date },
            { header: 'Property', accessor: (e) => e.Building || e.building },
            { header: 'Description', accessor: (e) => e.Notes || e.notes },
            { header: 'Type', accessor: (e) => e.Category || e.category },
            { header: 'Amount', accessor: (e) => e.Amount || e.amount }
          ],
          (expense, idx) => (
            <tr key={expense.ID || expense.id || idx}>
              <td>{expense.Date ? new Date(expense.Date).toLocaleDateString('fr-FR') : (expense.date ? new Date(expense.date).toLocaleDateString('fr-FR') : 'N/A')}</td>
              <td>{expense.Building || expense.building || 'N/A'}</td>
              <td>{expense.Notes || expense.notes || 'N/A'}</td>
              <td>{expense.Category || expense.category || 'N/A'}</td>
              <td>{((expense.Amount || expense.amount || 0) / 1000).toFixed(3).replace('.', ',')} CFA</td>
            </tr>
          )
        )}

        {/* Expenses by Property History */}
        {renderHistoryPanel(
          'Expenses by Property History',
          historyExpensesByProperty,
          [
            { header: 'Date', accessor: (e) => e.Date || e.date },
            { header: 'Property', accessor: (e) => e.Building || e.building },
            { header: 'Expense', accessor: (e) => e.Notes || e.notes },
            { header: 'Amount', accessor: (e) => e.Amount || e.amount }
          ],
          (expense, idx) => (
            <tr key={expense.ID || expense.id || idx}>
              <td>{expense.Date ? new Date(expense.Date).toLocaleDateString('fr-FR') : (expense.date ? new Date(expense.date).toLocaleDateString('fr-FR') : 'N/A')}</td>
              <td>{expense.Building || expense.building || 'N/A'}</td>
              <td>{expense.Notes || expense.notes || 'N/A'}</td>
              <td>{((expense.Amount || expense.amount || 0) / 1000).toFixed(3).replace('.', ',')} CFA</td>
            </tr>
          )
        )}

        {/* Wire Transfers to Owners History */}
        {renderHistoryPanel(
          'Wire Transfers to Owners History',
          historyWireTransfers,
          [
            { header: 'Date', accessor: (p) => p.Date || p.date },
            { header: 'Type', accessor: () => 'Receipt' },
            { header: 'Tenant/Owner', accessor: (p) => p.Landlord || p.landlord },
            { header: 'Status', accessor: (p) => p.Status || p.status }
          ],
          (payment, idx) => {
            const status = (payment.Status || payment.status || '').toLowerCase();
            const statusColor = status === 'paid' || status === 'validated' || status === 'validee' ? '#10b981' : '#f59e0b';
            return (
              <tr key={payment.ID || payment.id || idx}>
                <td>{payment.Date ? new Date(payment.Date).toLocaleDateString('fr-FR') : (payment.date ? new Date(payment.date).toLocaleDateString('fr-FR') : 'N/A')}</td>
                <td>Receipt</td>
                <td>{payment.Landlord || payment.landlord || 'N/A'}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: statusColor,
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    {payment.Status || payment.status || 'N/A'}
                  </span>
                </td>
              </tr>
            );
          }
        )}

        {/* Financial Documents History */}
        {renderHistoryPanel(
          'Financial Documents History',
          historyFinancialDocuments,
          [
            { header: 'Date', accessor: (p) => p.Date || p.date },
            { header: 'Owner', accessor: (p) => p.Landlord || p.landlord },
            { header: 'Property', accessor: (p) => p.Building || p.building },
            { header: 'Net Amount', accessor: (p) => p.NetAmount || p.netAmount }
          ],
          (payment, idx) => (
            <tr key={payment.ID || payment.id || idx}>
              <td>{payment.Date ? new Date(payment.Date).toLocaleDateString('fr-FR') : (payment.date ? new Date(payment.date).toLocaleDateString('fr-FR') : 'N/A')}</td>
              <td>{payment.Landlord || payment.landlord || 'N/A'}</td>
              <td>{payment.Building || payment.building || 'N/A'}</td>
              <td>{((payment.NetAmount || payment.netAmount || 0) / 1000).toFixed(3).replace('.', ',')} CFA</td>
            </tr>
          )
        )}
      </div>
    );
  };

  // Render Cashier section
  const renderCashier = () => {
    // Calculate total balance across all accounts
    const totalBalance = cashierAccounts
      .filter(acc => acc.IsActive !== false && acc.isActive !== false)
      .reduce((sum, acc) => sum + (acc.Balance || acc.balance || 0), 0);

    // Group accounts by type
    const accountsByType = {
      mobile_money: cashierAccounts.filter(acc => (acc.Type || acc.type) === 'mobile_money'),
      cash_register: cashierAccounts.filter(acc => (acc.Type || acc.type) === 'cash_register'),
      bank: cashierAccounts.filter(acc => (acc.Type || acc.type) === 'bank'),
      other: cashierAccounts.filter(acc => !['mobile_money', 'cash_register', 'bank'].includes(acc.Type || acc.type))
    };

    return (
      <div>
        <div className="sa-section-card">
          <div className="sa-section-header">
            <div>
              <h2>Cashier Management</h2>
              <p>Track balances across mobile money, cash register, bank accounts, and more</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="sa-outline-button" 
                onClick={() => {
                  setCashierTransactionForm({
                    accountId: '',
                    type: 'deposit',
                    amount: '',
                    reference: '',
                    description: '',
                    toAccountId: ''
                  });
                  setShowCashierTransactionModal(true);
                }}
                disabled={loading || cashierAccounts.length === 0}
              >
                <Plus size={18} />
                Add Transaction
              </button>
              <button 
                className="sa-primary-cta" 
                onClick={() => {
                  setCashierAccountForm({
                    name: '',
                    type: 'cash_register',
                    balance: 0,
                    currency: 'XOF',
                    description: ''
                  });
                  setShowCashierAccountModal(true);
                }}
                disabled={loading}
              >
                <Plus size={18} />
                Add Account
              </button>
            </div>
          </div>

          {/* Total Balance Summary */}
          <div style={{ 
            padding: '24px', 
            marginBottom: '24px', 
            backgroundColor: '#f0fdf4', 
            borderRadius: '8px',
            border: '1px solid #86efac'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Available Balance</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '2rem', fontWeight: '600', color: '#166534' }}>
                  {totalBalance.toFixed(2)} XOF
                </p>
              </div>
              <Wallet size={48} style={{ color: '#22c55e' }} />
            </div>
          </div>

          {/* Accounts by Type */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Mobile Money Accounts */}
            {accountsByType.mobile_money.length > 0 && (
              <div className="sa-section-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Smartphone size={24} style={{ color: '#3b82f6' }} />
                  <h3 style={{ margin: 0 }}>Mobile Money</h3>
                </div>
                {accountsByType.mobile_money.map((account, index) => {
                  const balance = account.Balance || account.balance || 0;
                  const name = account.Name || account.name || 'Unnamed';
                  return (
                    <div key={account.ID || account.id || index} style={{ 
                      padding: '16px', 
                      marginBottom: '12px', 
                      backgroundColor: '#f9fafb', 
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>{name}</p>
                          {account.Description && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                              {account.Description}
                            </p>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#059669' }}>
                          {balance.toFixed(2)} XOF
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cash Register Accounts */}
            {accountsByType.cash_register.length > 0 && (
              <div className="sa-section-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Banknote size={24} style={{ color: '#10b981' }} />
                  <h3 style={{ margin: 0 }}>Cash Register</h3>
                </div>
                {accountsByType.cash_register.map((account, index) => {
                  const balance = account.Balance || account.balance || 0;
                  const name = account.Name || account.name || 'Unnamed';
                  return (
                    <div key={account.ID || account.id || index} style={{ 
                      padding: '16px', 
                      marginBottom: '12px', 
                      backgroundColor: '#f9fafb', 
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>{name}</p>
                          {account.Description && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                              {account.Description}
                            </p>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#059669' }}>
                          {balance.toFixed(2)} XOF
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bank Accounts */}
            {accountsByType.bank.length > 0 && (
              <div className="sa-section-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Building2 size={24} style={{ color: '#8b5cf6' }} />
                  <h3 style={{ margin: 0 }}>Bank Accounts</h3>
                </div>
                {accountsByType.bank.map((account, index) => {
                  const balance = account.Balance || account.balance || 0;
                  const name = account.Name || account.name || 'Unnamed';
                  return (
                    <div key={account.ID || account.id || index} style={{ 
                      padding: '16px', 
                      marginBottom: '12px', 
                      backgroundColor: '#f9fafb', 
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>{name}</p>
                          {account.Description && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                              {account.Description}
                            </p>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#059669' }}>
                          {balance.toFixed(2)} XOF
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Other Accounts */}
            {accountsByType.other.length > 0 && (
              <div className="sa-section-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Wallet size={24} style={{ color: '#6b7280' }} />
                  <h3 style={{ margin: 0 }}>Other Accounts</h3>
                </div>
                {accountsByType.other.map((account, index) => {
                  const balance = account.Balance || account.balance || 0;
                  const name = account.Name || account.name || 'Unnamed';
                  return (
                    <div key={account.ID || account.id || index} style={{ 
                      padding: '16px', 
                      marginBottom: '12px', 
                      backgroundColor: '#f9fafb', 
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>{name}</p>
                          {account.Description && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                              {account.Description}
                            </p>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#059669' }}>
                          {balance.toFixed(2)} XOF
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {cashierAccounts.length === 0 && (
              <div style={{ 
                gridColumn: '1 / -1', 
                padding: '40px', 
                textAlign: 'center', 
                color: '#9ca3af' 
              }}>
                No cashier accounts found. Click "Add Account" to create one.
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="sa-section-card" style={{ marginTop: '24px' }}>
            <div className="sa-section-header">
              <div>
                <h3>Recent Transactions</h3>
                <p>View recent cashier transactions</p>
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading transactions...</div>
            ) : cashierTransactions.length === 0 ? (
              <div className="no-data">No transactions found</div>
            ) : (
              <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Account</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Reference</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashierTransactions.slice(0, 20).map((transaction, index) => {
                      const account = cashierAccounts.find(acc => 
                        (acc.ID || acc.id) === (transaction.AccountID || transaction.accountId)
                      );
                      const accountName = account ? (account.Name || account.name) : 'Unknown';
                      const type = transaction.Type || transaction.type || 'N/A';
                      const amount = transaction.Amount || transaction.amount || 0;
                      const isNegative = type === 'withdrawal' || type === 'transfer';

                      return (
                        <tr key={transaction.ID || transaction.id || index}>
                          <td>
                            {transaction.CreatedAt || transaction.createdAt 
                              ? new Date(transaction.CreatedAt || transaction.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td><span className="sa-cell-title">{accountName}</span></td>
                          <td>
                            <span className={`sa-status-pill ${type.toLowerCase()}`}>
                              {type}
                            </span>
                          </td>
                          <td style={{ color: isNegative ? '#dc2626' : '#059669', fontWeight: '600' }}>
                            {isNegative ? '-' : '+'}{amount.toFixed(2)} XOF
                          </td>
                          <td>{transaction.Reference || transaction.reference || 'N/A'}</td>
                          <td>{transaction.Description || transaction.description || 'N/A'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Account Modal */}
        {showCashierAccountModal && (
          <div className="modal-overlay" onClick={() => setShowCashierAccountModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Cashier Account</h3>
                <button className="modal-close" onClick={() => setShowCashierAccountModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setLoading(true);
                    await accountingService.createCashierAccount(cashierAccountForm);
                    addNotification('Cashier account created successfully!', 'success');
                    setShowCashierAccountModal(false);
                    setCashierAccountForm({
                      name: '',
                      type: 'cash_register',
                      balance: 0,
                      currency: 'XOF',
                      description: ''
                    });
                    await loadCashierData();
                  } catch (error) {
                    console.error('Error creating account:', error);
                    addNotification(error.message || 'Failed to create account', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}>
                  <div className="form-group">
                    <label htmlFor="accountName">Account Name *</label>
                    <input
                      type="text"
                      id="accountName"
                      value={cashierAccountForm.name}
                      onChange={(e) => setCashierAccountForm({...cashierAccountForm, name: e.target.value})}
                      required
                      placeholder="e.g., MTN Mobile Money"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="accountType">Account Type *</label>
                    <select
                      id="accountType"
                      value={cashierAccountForm.type}
                      onChange={(e) => setCashierAccountForm({...cashierAccountForm, type: e.target.value})}
                      required
                    >
                      <option value="mobile_money">Mobile Money</option>
                      <option value="cash_register">Cash Register</option>
                      <option value="bank">Bank Account</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="initialBalance">Initial Balance</label>
                    <input
                      type="number"
                      id="initialBalance"
                      step="0.01"
                      value={cashierAccountForm.balance}
                      onChange={(e) => setCashierAccountForm({...cashierAccountForm, balance: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="currency">Currency</label>
                    <select
                      id="currency"
                      value={cashierAccountForm.currency}
                      onChange={(e) => setCashierAccountForm({...cashierAccountForm, currency: e.target.value})}
                    >
                      <option value="XOF">XOF</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      value={cashierAccountForm.description}
                      onChange={(e) => setCashierAccountForm({...cashierAccountForm, description: e.target.value})}
                      placeholder="Optional description"
                      rows="3"
                    />
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="action-button secondary" onClick={() => setShowCashierAccountModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="action-button primary" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Transaction Modal */}
        {showCashierTransactionModal && (
          <div className="modal-overlay" onClick={() => setShowCashierTransactionModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Transaction</h3>
                <button className="modal-close" onClick={() => setShowCashierTransactionModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setLoading(true);
                    const transactionData = {
                      accountId: parseInt(cashierTransactionForm.accountId),
                      type: cashierTransactionForm.type,
                      amount: parseFloat(cashierTransactionForm.amount),
                      reference: cashierTransactionForm.reference,
                      description: cashierTransactionForm.description
                    };
                    
                    if (cashierTransactionForm.type === 'transfer' && cashierTransactionForm.toAccountId) {
                      transactionData.toAccountId = parseInt(cashierTransactionForm.toAccountId);
                    }

                    await accountingService.createCashierTransaction(transactionData);
                    addNotification('Transaction created successfully!', 'success');
                    setShowCashierTransactionModal(false);
                    setCashierTransactionForm({
                      accountId: '',
                      type: 'deposit',
                      amount: '',
                      reference: '',
                      description: '',
                      toAccountId: ''
                    });
                    await loadCashierData();
                  } catch (error) {
                    console.error('Error creating transaction:', error);
                    addNotification(error.message || 'Failed to create transaction', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}>
                  <div className="form-group">
                    <label htmlFor="transactionAccount">Account *</label>
                    <select
                      id="transactionAccount"
                      value={cashierTransactionForm.accountId}
                      onChange={(e) => setCashierTransactionForm({...cashierTransactionForm, accountId: e.target.value})}
                      required
                    >
                      <option value="">Select Account</option>
                      {cashierAccounts.filter(acc => acc.IsActive !== false && acc.isActive !== false).map(account => (
                        <option key={account.ID || account.id} value={account.ID || account.id}>
                          {account.Name || account.name} - {(account.Balance || account.balance || 0).toFixed(2)} XOF
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="transactionType">Transaction Type *</label>
                    <select
                      id="transactionType"
                      value={cashierTransactionForm.type}
                      onChange={(e) => setCashierTransactionForm({...cashierTransactionForm, type: e.target.value})}
                      required
                    >
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal">Withdrawal</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>

                  {cashierTransactionForm.type === 'transfer' && (
                    <div className="form-group">
                      <label htmlFor="toAccount">To Account *</label>
                      <select
                        id="toAccount"
                        value={cashierTransactionForm.toAccountId}
                        onChange={(e) => setCashierTransactionForm({...cashierTransactionForm, toAccountId: e.target.value})}
                        required={cashierTransactionForm.type === 'transfer'}
                      >
                        <option value="">Select Destination Account</option>
                        {cashierAccounts
                          .filter(acc => acc.IsActive !== false && acc.isActive !== false && (acc.ID || acc.id) !== parseInt(cashierTransactionForm.accountId))
                          .map(account => (
                            <option key={account.ID || account.id} value={account.ID || account.id}>
                              {account.Name || account.name} - {(account.Balance || account.balance || 0).toFixed(2)} XOF
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="transactionAmount">Amount *</label>
                    <input
                      type="number"
                      id="transactionAmount"
                      step="0.01"
                      value={cashierTransactionForm.amount}
                      onChange={(e) => setCashierTransactionForm({...cashierTransactionForm, amount: e.target.value})}
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="transactionReference">Reference</label>
                    <input
                      type="text"
                      id="transactionReference"
                      value={cashierTransactionForm.reference}
                      onChange={(e) => setCashierTransactionForm({...cashierTransactionForm, reference: e.target.value})}
                      placeholder="Optional reference number"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="transactionDescription">Description</label>
                    <textarea
                      id="transactionDescription"
                      value={cashierTransactionForm.description}
                      onChange={(e) => setCashierTransactionForm({...cashierTransactionForm, description: e.target.value})}
                      placeholder="Transaction description"
                      rows="3"
                    />
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="action-button secondary" onClick={() => setShowCashierTransactionModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="action-button primary" disabled={loading}>
                      {loading ? 'Processing...' : 'Create Transaction'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
      case 'tenants':
        return renderTenants();
      case 'history':
        return renderHistory();
      case 'deposits':
        return renderDeposits();
      case 'cashier':
        return renderCashier();
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

      {/* Cash Payment Modal (from Tenants tab) */}
      {showCashPaymentModal && selectedTenantForPayment && (
        <div className="modal-overlay" onClick={() => setShowCashPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Cash Payment</h3>
              <button className="modal-close" onClick={() => setShowCashPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selectedTenantForPayment) return;
                  try {
                    setLoading(true);
                    const formData = new FormData(e.target);
                    const amount = parseFloat(formData.get('amount'));
                    const chargeType = formData.get('chargeType') || 'Rent';
                    const reference = formData.get('reference') || '';

                    const tenantName =
                      selectedTenantForPayment.TenantName ||
                      selectedTenantForPayment.tenantName ||
                      '';
                    const propertyName =
                      selectedTenantForPayment.Property ||
                      selectedTenantForPayment.property ||
                      '';

                    const paymentData = {
                      tenant: tenantName,
                      property: propertyName,
                      amount,
                      method: 'Cash',
                      chargeType,
                      reference,
                      status: 'Approved', // cash payments are immediately approved and counted in totals
                    };

                    const newPayment = await accountingService.recordTenantPayment(paymentData);

                    // Refresh local data so totals and tables are up to date
                    try {
                      const [overview, tenantPaymentsData, tenantsData] = await Promise.all([
                        accountingService.getOverview(),
                        accountingService.getTenantPayments(),
                        accountingService.getTenantsWithPaymentStatus(),
                      ]);
                      setOverviewData(overview);
                      setTenantPayments(Array.isArray(tenantPaymentsData) ? tenantPaymentsData : []);
                      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
                    } catch (refreshError) {
                      console.error('Error refreshing data after cash payment:', refreshError);
                    }

                    addNotification('Cash payment recorded successfully!', 'success');
                    setShowCashPaymentModal(false);
                    setSelectedTenantForPayment(null);
                    e.target.reset();
                  } catch (error) {
                    console.error('Error recording cash payment:', error);
                    addNotification('Failed to record cash payment. Please try again.', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <div className="form-group">
                  <label>Tenant</label>
                  <input
                    type="text"
                    value={
                      selectedTenantForPayment.TenantName ||
                      selectedTenantForPayment.tenantName ||
                      'N/A'
                    }
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Property</label>
                  <input
                    type="text"
                    value={
                      selectedTenantForPayment.Property ||
                      selectedTenantForPayment.property ||
                      'N/A'
                    }
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <input type="text" value="Cash" readOnly />
                </div>
                <div className="form-group">
                  <label htmlFor="cashAmount">Amount</label>
                  <input
                    type="number"
                    id="cashAmount"
                    name="amount"
                    step="0.01"
                    required
                    placeholder="Enter cash amount received"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cashChargeType">Charge Type</label>
                  <select id="cashChargeType" name="chargeType" required>
                    <option value="Rent">Rent</option>
                    <option value="Deposit">Deposit</option>
                    <option value="Late Fee">Late Fee</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="cashReference">Reference (optional)</label>
                  <input
                    type="text"
                    id="cashReference"
                    name="reference"
                    placeholder="Receipt number or internal reference"
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="action-button secondary"
                    onClick={() => {
                      setShowCashPaymentModal(false);
                      setSelectedTenantForPayment(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Recording...' : 'Record Cash Payment'}
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
                <button type="button" className="action-button primary" onClick={async () => {
                  try {
                    setLoading(true);
                    await accountingService.approveTenantPayment(selectedPayment.id || selectedPayment.ID);
                    addNotification('Payment approved successfully!', 'success');
                    setShowApprovalModal(false);
                    setSelectedPayment(null);
                    // Reload payments
                    const updatedPayments = await accountingService.listTenantPayments();
                    setTenantPayments(Array.isArray(updatedPayments) ? updatedPayments : []);
                  } catch (error) {
                    console.error('Error approving payment:', error);
                    addNotification(error.message || 'Failed to approve payment', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}>
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
                    netAmount: parseFloat(formData.get('netAmount'))
                    // Commission is automatically calculated by the backend (10% of net amount)
                  };
                  
                  // Call the backend API
                  const newPayment = await accountingService.recordLandlordPayment(paymentData);
                  
                  // Update local state with the response from backend
                  setLandlordPayments(prev => [newPayment, ...prev]);
                  addNotification('Landlord payment recorded successfully!', 'success');
                  setShowLandlordPaymentModal(false);
                  
                  // Reset form and state
                  e.target.reset();
                  setSelectedBuilding('');
                  setCalculatedAmount(null);
                  setSelectedLandlord(null);
                  setLandlordProperties(null);
                } catch (error) {
                  console.error('Error recording landlord payment:', error);
                  addNotification('Failed to record landlord payment. Please try again.', 'error');
                } finally {
                  setLoading(false);
                }
              }}>
                <div className="form-group">
                  <label htmlFor="landlord">Landlord Name *</label>
                  <select 
                    name="landlord" 
                    required
                    onChange={async (e) => {
                      const landlordId = e.target.value;
                      if (landlordId) {
                        const landlord = landlords.find(l => (l.id || l.ID).toString() === landlordId);
                        setSelectedLandlord(landlord);
                        try {
                          setLoading(true);
                          const data = await accountingService.getLandlordProperties(landlordId);
                          setLandlordProperties(data);
                          // Reset building selection when landlord changes
                          setSelectedBuilding('');
                          setCalculatedAmount(null);
                          const buildingSelect = e.target.form?.querySelector('select[name="building"]');
                          if (buildingSelect) buildingSelect.value = '';
                          const netAmountInput = e.target.form?.querySelector('input[name="netAmount"]');
                          if (netAmountInput) netAmountInput.value = '';
                        } catch (error) {
                          console.error('Error loading landlord properties:', error);
                          addNotification('Failed to load landlord properties', 'error');
                          setLandlordProperties(null);
                        } finally {
                          setLoading(false);
                        }
                      } else {
                        setSelectedLandlord(null);
                        setLandlordProperties(null);
                        setSelectedBuilding('');
                        setCalculatedAmount(null);
                      }
                    }}
                  >
                    <option value="">Select Landlord</option>
                    {landlords.map((landlord) => (
                      <option key={landlord.id || landlord.ID} value={landlord.id || landlord.ID}>
                        {landlord.name || landlord.Name} {landlord.email ? `(${landlord.email || landlord.Email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show preferred payment method when landlord is selected */}
                {selectedLandlord && landlordProperties && (
                <div className="form-group">
                    <label>Preferred Payment Method</label>
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#0c4a6e',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {landlordProperties.landlord?.preferredPaymentMethod || 'mobile_money'}
                    </div>
                  </div>
                )}

                {/* Show properties when landlord is selected */}
                {selectedLandlord && landlordProperties && landlordProperties.properties && landlordProperties.properties.length > 0 && (
                  <div className="form-group">
                    <label>Properties & Income Details</label>
                    <div style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '12px'
                    }}>
                      {landlordProperties.properties.map((property, index) => (
                        <div 
                          key={property.property.ID || index}
                          style={{
                            marginBottom: '16px',
                            padding: '12px',
                            backgroundColor: property.availableAmount > 0 ? '#f0fdf4' : '#f9fafb',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: property.availableAmount > 0 ? 'pointer' : 'default'
                          }}
                          onClick={() => {
                            if (property.availableAmount > 0) {
                              setSelectedBuilding(property.property.Address);
                              const buildingSelect = document.querySelector('select[name="building"]');
                              if (buildingSelect) buildingSelect.value = property.property.Address;
                              const netAmountInput = document.querySelector('input[name="netAmount"]');
                              if (netAmountInput) netAmountInput.value = property.availableAmount.toFixed(2);
                              setCalculatedAmount({
                                totalRentCollected: property.totalRentCollected,
                                commission: property.commission,
                                netAmount: property.netAmount,
                                alreadyPaid: property.alreadyPaid,
                                availableNetAmount: property.availableAmount,
                                tenantsPaidCount: property.tenantsPaidCount
                              });
                            }
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <div>
                              <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                                {property.property.Address}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {property.property.Type} {property.property.BuildingType ? `(${property.property.BuildingType})` : ''}
                                {property.totalUnits > 0 && ` • ${property.occupiedUnits}/${property.totalUnits} units occupied`}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: '600', color: property.availableAmount > 0 ? '#059669' : '#6b7280' }}>
                                {property.availableAmount.toFixed(2)} XOF
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                Available
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>Total Rent Collected:</span>
                              <span style={{ fontWeight: '500' }}>{property.totalRentCollected.toFixed(2)} XOF</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>Tenants Paid ({property.tenantsPaidCount}):</span>
                              <span style={{ fontWeight: '500' }}>{property.tenantsPaidCount} payment(s)</span>
                            </div>
                            {property.tenantsPaid && property.tenantsPaid.length > 0 && (
                              <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid #d1d5db' }}>
                                {property.tenantsPaid.map((payment, pIdx) => (
                                  <div key={pIdx} style={{ marginBottom: '4px', fontSize: '0.7rem' }}>
                                    • {payment.tenantName}: {payment.amount.toFixed(2)} XOF ({new Date(payment.date).toLocaleDateString()})
                                  </div>
                                ))}
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', marginBottom: '4px' }}>
                              <span>Commission (10%):</span>
                              <span style={{ fontWeight: '500', color: '#dc2626' }}>-{property.commission.toFixed(2)} XOF</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>Net Amount:</span>
                              <span style={{ fontWeight: '500' }}>{property.netAmount.toFixed(2)} XOF</span>
                            </div>
                            {property.alreadyPaid > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#f59e0b' }}>
                                <span>Already Paid:</span>
                                <span style={{ fontWeight: '500' }}>-{property.alreadyPaid.toFixed(2)} XOF</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedLandlord && landlordProperties && (!landlordProperties.properties || landlordProperties.properties.length === 0) && (
                  <div className="form-group">
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#92400e'
                    }}>
                      No properties found for this landlord.
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="building">Building/Property *</label>
                  <select 
                    name="building" 
                    required
                    value={selectedBuilding}
                    disabled={!selectedLandlord || !landlordProperties || !landlordProperties.properties || landlordProperties.properties.length === 0}
                    onChange={async (e) => {
                      const building = e.target.value;
                      setSelectedBuilding(building);
                      
                      if (building) {
                        try {
                          setLoading(true);
                          const amountData = await accountingService.calculateBuildingPaymentAmount(building);
                          setCalculatedAmount(amountData);
                          
                          // Auto-populate net amount in the form (use available amount)
                          const netAmountInput = e.target.form?.querySelector('input[name="netAmount"]');
                          if (netAmountInput && amountData.availableNetAmount > 0) {
                            netAmountInput.value = amountData.availableNetAmount.toFixed(2);
                          }
                        } catch (error) {
                          console.error('Error calculating amount:', error);
                          addNotification('Failed to calculate payment amount', 'error');
                          setCalculatedAmount(null);
                        } finally {
                          setLoading(false);
                        }
                      } else {
                        setCalculatedAmount(null);
                        const netAmountInput = e.target.form?.querySelector('input[name="netAmount"]');
                        if (netAmountInput) {
                          netAmountInput.value = '';
                        }
                      }
                    }}
                  >
                    <option value="">
                      {!selectedLandlord 
                        ? 'Select a landlord first' 
                        : (!landlordProperties || !landlordProperties.properties || landlordProperties.properties.length === 0)
                        ? 'No properties found for this landlord'
                        : 'Select Building/Property'}
                    </option>
                    {landlordProperties && landlordProperties.properties && landlordProperties.properties.length > 0 ? (
                      landlordProperties.properties.map((property) => (
                        <option key={property.property.ID} value={property.property.Address}>
                          {property.property.Address} - {property.availableAmount.toFixed(2)} XOF available
                        </option>
                      ))
                    ) : null}
                  </select>
                  {!selectedLandlord && (
                    <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      Please select a landlord first to see their properties.
                    </small>
                  )}
                  {calculatedAmount && calculatedAmount.availableNetAmount > 0 && (
                    <div style={{
                      marginTop: '8px',
                      padding: '12px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}>
                      <div style={{ color: '#166534', fontWeight: '600', marginBottom: '4px' }}>
                        Automatic Payment Calculation
                </div>
                      <div style={{ color: '#15803d', marginBottom: '2px' }}>
                        Total Rent Collected: {calculatedAmount.totalRentCollected?.toFixed(2) || '0.00'} XOF
                      </div>
                      <div style={{ color: '#15803d', marginBottom: '2px' }}>
                        Commission (10%): {calculatedAmount.commission?.toFixed(2) || '0.00'} XOF
                      </div>
                      <div style={{ color: '#15803d', marginBottom: '2px' }}>
                        Net Amount (after commission): {calculatedAmount.netAmount?.toFixed(2) || '0.00'} XOF
                      </div>
                      {calculatedAmount.alreadyPaid > 0 && (
                        <div style={{ color: '#f59e0b', marginBottom: '2px' }}>
                          Already Paid: {calculatedAmount.alreadyPaid?.toFixed(2) || '0.00'} XOF
                        </div>
                      )}
                      <div style={{ color: '#166534', fontWeight: '600', marginTop: '4px', borderTop: '1px solid #86efac', paddingTop: '4px' }}>
                        Available to Pay: {calculatedAmount.availableNetAmount?.toFixed(2) || '0.00'} XOF
                      </div>
                      {calculatedAmount.tenantsPaidCount > 0 && (
                        <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px' }}>
                          Based on {calculatedAmount.tenantsPaidCount} tenant payment(s) for this month
                        </div>
                      )}
                    </div>
                  )}
                  {calculatedAmount && calculatedAmount.availableNetAmount <= 0 && calculatedAmount.totalRentCollected > 0 && (
                    <div style={{
                      marginTop: '8px',
                      padding: '12px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#92400e'
                    }}>
                      All available amount has been paid for this building this month.
                      <div style={{ marginTop: '4px' }}>
                        Total rent collected: {calculatedAmount.totalRentCollected?.toFixed(2) || '0.00'} XOF
                      </div>
                      <div>
                        Already paid: {calculatedAmount.alreadyPaid?.toFixed(2) || '0.00'} XOF
                      </div>
                    </div>
                  )}
                  {calculatedAmount && calculatedAmount.totalRentCollected === 0 && (
                    <div style={{
                      marginTop: '8px',
                      padding: '12px',
                      backgroundColor: '#fee2e2',
                      border: '1px solid #fca5a5',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#991b1b'
                    }}>
                      No approved rent payments found for this building this month.
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="netAmount">Net Amount ($) *</label>
                  <input 
                    type="number" 
                    name="netAmount" 
                    step="0.01" 
                    required 
                    placeholder="Auto-calculated when building is selected" 
                    readOnly={!!calculatedAmount && calculatedAmount.netAmount > 0}
                    style={calculatedAmount && calculatedAmount.netAmount > 0 ? { backgroundColor: '#f0fdf4', cursor: 'not-allowed' } : {}}
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {calculatedAmount && calculatedAmount.availableNetAmount > 0 
                      ? 'Amount automatically calculated from approved rent payments. Commission (10%) is automatically deducted from total rent collected.'
                      : 'Select a building to automatically calculate the amount, or enter manually. Commission will be automatically calculated and deducted.'}
                  </small>
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
                  const accountId = formData.get('accountId');
                  const expenseData = {
                    scope: formData.get('scope'),
                    building: formData.get('scope') === 'SAAF IMMO' ? '-' : formData.get('building'),
                    category: formData.get('category'),
                    amount: parseFloat(formData.get('amount')),
                    date: formData.get('date'),
                    notes: formData.get('notes'),
                    accountId: accountId ? parseInt(accountId) : null
                  };
                  
                  // Call the backend API
                  const newExpense = await accountingService.addExpense(expenseData);
                  
                  // Update local state with the response from backend
                  setExpenses(prev => [newExpense, ...prev]);
                  
                  // Reload cashier accounts if account was selected (to reflect balance change)
                  if (accountId) {
                    try {
                      const [accounts, transactions] = await Promise.all([
                        accountingService.getCashierAccounts().catch(() => []),
                        accountingService.getCashierTransactions().catch(() => [])
                      ]);
                      setCashierAccounts(Array.isArray(accounts) ? accounts : []);
                      setCashierTransactions(Array.isArray(transactions) ? transactions : []);
                    } catch (error) {
                      console.error('Error reloading cashier data:', error);
                    }
                  }
                  
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
                  <label>Cashier Account (to deduct from)</label>
                  <select name="accountId">
                    <option value="">No deduction (manual entry)</option>
                    {cashierAccounts.filter(acc => acc.IsActive !== false && acc.isActive !== false).map(account => (
                      <option key={account.ID || account.id} value={account.ID || account.id}>
                        {account.Name || account.name} - {(account.Balance || account.balance || 0).toFixed(2)} {account.Currency || account.currency || 'XOF'}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Select a cashier account to automatically deduct the expense amount from its balance. If no account is selected, the expense will be recorded without affecting any account balance.
                  </small>
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

      {/* View Expense Modal */}
      {showViewExpenseModal && selectedExpense && (
        <div className="modal-overlay" onClick={() => setShowViewExpenseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>View Expense</h3>
              <button className="modal-close" onClick={() => setShowViewExpenseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Date</label>
                <div>{selectedExpense.Date ? new Date(selectedExpense.Date).toLocaleDateString() : (selectedExpense.date ? new Date(selectedExpense.date).toLocaleDateString() : 'N/A')}</div>
              </div>
              <div className="form-group">
                <label>Scope</label>
                <div>{selectedExpense.Scope || selectedExpense.scope || 'N/A'}</div>
              </div>
              <div className="form-group">
                <label>Building</label>
                <div>{selectedExpense.Building || selectedExpense.building || 'N/A'}</div>
              </div>
              <div className="form-group">
                <label>Category</label>
                <div>{selectedExpense.Category || selectedExpense.category || 'N/A'}</div>
              </div>
              <div className="form-group">
                <label>Amount</label>
                <div>{(selectedExpense.Amount || selectedExpense.amount || 0).toFixed(2)} XOF</div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <div>{selectedExpense.Notes || selectedExpense.notes || 'N/A'}</div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-button secondary" onClick={() => setShowViewExpenseModal(false)}>
                  Close
                </button>
                <button 
                  type="button" 
                  className="action-button primary" 
                  onClick={() => {
                    setShowViewExpenseModal(false);
                    setShowEditExpenseModal(true);
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditExpenseModal && selectedExpense && (
        <div className="modal-overlay" onClick={() => setShowEditExpenseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Expense</h3>
              <button className="modal-close" onClick={() => {
                setShowEditExpenseModal(false);
                setSelectedExpense(null);
              }}>×</button>
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
                  
                  await accountingService.updateExpense(selectedExpense.ID || selectedExpense.id, expenseData);
                  addNotification('Expense updated successfully!', 'success');
                  setShowEditExpenseModal(false);
                  setSelectedExpense(null);
                  await loadExpenses();
                  // Refresh overview to update balances
                  try {
                    const overview = await accountingService.getOverview();
                    setOverviewData(overview);
                  } catch (err) {
                    console.error('Error refreshing overview:', err);
                  }
                } catch (error) {
                  console.error('Error updating expense:', error);
                  addNotification('Failed to update expense. Please try again.', 'error');
                } finally {
                  setLoading(false);
                }
              }}>
                <div className="form-group">
                  <label>Scope</label>
                  <select name="scope" defaultValue={selectedExpense.Scope || selectedExpense.scope} required>
                    <option value="">Select Scope</option>
                    <option value="Building">Building</option>
                    <option value="SAAF IMMO">SAAF IMMO</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Building (if Building scope)</label>
                  <select name="building" defaultValue={selectedExpense.Building || selectedExpense.building}>
                    <option value="">Select Building</option>
                    <option value="123 Main St">123 Main St</option>
                    <option value="456 Oak Ave">456 Oak Ave</option>
                    <option value="789 Pine Ln">789 Pine Ln</option>
                    <option value="321 Elm St">321 Elm St</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" defaultValue={selectedExpense.Category || selectedExpense.category} required>
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
                  <input type="number" name="amount" step="0.01" defaultValue={selectedExpense.Amount || selectedExpense.amount} required />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    name="date" 
                    defaultValue={selectedExpense.Date ? new Date(selectedExpense.Date).toISOString().split('T')[0] : (selectedExpense.date ? new Date(selectedExpense.date).toISOString().split('T')[0] : '')} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input type="text" name="notes" defaultValue={selectedExpense.Notes || selectedExpense.notes || ''} placeholder="Optional" />
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => {
                    setShowEditExpenseModal(false);
                    setSelectedExpense(null);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Expense'}
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