import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer } from
'recharts';
import { DollarSign, TrendingUp, Building, Receipt, Download, Search, CreditCard, User, FileText, Plus, MessageCircle, Settings, Megaphone, Wallet, Smartphone, Banknote, Building2, Clock, ArrowLeftRight, Scale, ShieldCheck, Users, History, FileBarChart, ArrowLeft, Mail, Phone, MapPin, Wrench, FileCheck, AlertTriangle } from 'lucide-react';
import { accountingService } from '../services/accountingService';
import { salesManagerService } from '../services/salesManagerService';
import { messagingService } from '../services/messagingService';
import { API_CONFIG } from '../config/api';
import { isDemoMode, getAccountingDemoData } from '../utils/demoData';
import ReactDOM from 'react-dom/client';
import RoleLayout from '../components/RoleLayout';
import RentReceiptTemplate from '../components/RentReceiptTemplate';
import SettingsPage from './SettingsPage';
import { t, getLanguage } from '../utils/i18n';
import '../components/RoleLayout.css';
import './AccountingDashboard.css';
import jsPDF from 'jspdf';
import html2pdf from 'html2pdf.js';

const AccountingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
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
  const [showPaymentViewModal, setShowPaymentViewModal] = useState(false);
  const [selectedItemForView, setSelectedItemForView] = useState(null);
  const [loading, setLoading] = useState(false);
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
  const [ownerView, setOwnerView] = useState('owners');
  const [ownerPaymentsLandlordFilter, setOwnerPaymentsLandlordFilter] = useState('');
  const [ownerPaymentsBuildingFilter, setOwnerPaymentsBuildingFilter] = useState('');
  const [ownerPaymentsStartDate, setOwnerPaymentsStartDate] = useState('');
  const [ownerPaymentsEndDate, setOwnerPaymentsEndDate] = useState('');
  const [ownerPaymentsMonthFilter, setOwnerPaymentsMonthFilter] = useState('');
  const [selectedOwnerForPaymentsHistory, setSelectedOwnerForPaymentsHistory] = useState(null);
  const carouselIntervalRef = useRef(null);
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
  const [expenseBuildingFilter, setExpenseBuildingFilter] = useState('');
  const [expenseStartDateFilter, setExpenseStartDateFilter] = useState('');
  const [expenseEndDateFilter, setExpenseEndDateFilter] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [expenseScopeFilter, setExpenseScopeFilter] = useState('');
  const [expenseOwnerFilter, setExpenseOwnerFilter] = useState('');
  const [expenseSearchText, setExpenseSearchText] = useState('');
  const [expenseViewCard, setExpenseViewCard] = useState('total');
  const [expensesSummary, setExpensesSummary] = useState(null);
  const [expensesPerOwner, setExpensesPerOwner] = useState([]);
  const [rentSummary, setRentSummary] = useState(null);
  const [cashierAccounts, setCashierAccounts] = useState([]);
  const [cashierTransactions, setCashierTransactions] = useState([]);
  const [agencyBalance, setAgencyBalance] = useState(null);
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
  const [tenants, setTenants] = useState([]);
  const [tenantPaymentStatusFilter, setTenantPaymentStatusFilter] = useState('all');
  const [tenantNameFilter, setTenantNameFilter] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [validatedClients, setValidatedClients] = useState([]);
  const [selectedValidatedClientId, setSelectedValidatedClientId] = useState('');
  const [depositFilter, setDepositFilter] = useState('all');
  const [depositStartDateFilter, setDepositStartDateFilter] = useState('');
  const [depositEndDateFilter, setDepositEndDateFilter] = useState('');
  const [historyStartDateFilter, setHistoryStartDateFilter] = useState('');
  const [historyEndDateFilter, setHistoryEndDateFilter] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');
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
    refundAmount: null,
    depositAmount: 0,
    repairCost: 0,
    tenant: '',
    property: '',
    refundMethod: 'mobile_money',
    refundAccount: '',
    notes: ''
  });
  const [pendingRefunds, setPendingRefunds] = useState([]);
  const [showProcessDepositModal, setShowProcessDepositModal] = useState(false);
  const [processDepositItem, setProcessDepositItem] = useState(null);
  const [processDepositManualAmount, setProcessDepositManualAmount] = useState('');
  const [showCollectionPaymentModal, setShowCollectionPaymentModal] = useState(false);
  const [collectionPaymentType, setCollectionPaymentType] = useState(null);
  const [propertiesForSale, setPropertiesForSale] = useState([]);
  const [expenseProperties, setExpenseProperties] = useState([]);
  const [expenseFormScope, setExpenseFormScope] = useState('');
  const [expenseFormBuilding, setExpenseFormBuilding] = useState('');
  const [expenseFormUnits, setExpenseFormUnits] = useState([]);
  const [paymentView, setPaymentView] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentNameFilter, setPaymentNameFilter] = useState('');
  const [paymentDateStartFilter, setPaymentDateStartFilter] = useState('');
  const [paymentDateEndFilter, setPaymentDateEndFilter] = useState('');
  const [selectedOwnerForBalance, setSelectedOwnerForBalance] = useState(null);
  const [ownerBalancesOwners, setOwnerBalancesOwners] = useState([]);
  const [ownerBalancesLoading, setOwnerBalancesLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [collectionPaymentForm, setCollectionPaymentForm] = useState({
    building: '',
    landlord: '',
    amount: '',
    paymentType: 'rent',
    status: 'Collected',
    tenant: '',
    property: '',
    method: 'Cash',
    chargeType: 'Rent',
    reference: '',
    tenantType: 'individual',
    monthlyRent: '',
    paymentMethod: 'cash',
    notes: '',
    buyer: '',
    saleAmount: '',
    agencyCommission: ''
  });
  useEffect(() => {
    if (activeTab === 'overview' && advertisements.length > 1) {
      carouselIntervalRef.current = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % advertisements.length);
      }, 5000);

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
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const isLoadingUsersRef = useRef(false);
  const messagesEndRef = useRef(null);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);
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
    { id: 'overview', label: t('nav.overview'), icon: DollarSign },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'expenses', label: t('nav.expenses'), icon: FileText },
    { id: 'deposit-refunds', label: 'Deposit Refunds', icon: ArrowLeftRight },
    { id: 'tenant-management', label: 'Tenant Management', icon: Users },
    { id: 'account-balances', label: 'Account Balances', icon: Wallet },
    { id: 'owner-payments', label: 'Owner Payments', icon: Building },
    { id: 'transaction-history', label: 'Transaction History', icon: History },
    { id: 'states-taxes', label: 'Daily Report', icon: Scale },
    { id: 'reports', label: t('nav.reports'), icon: Receipt },
    { id: 'advertisements', label: t('nav.advertisements'), icon: Megaphone },
    { id: 'messages', label: t('nav.messages'), icon: MessageCircle },
    { id: 'settings', label: t('nav.profileSettings'), icon: Settings }],

    [language]
  );
  const loadExpenses = useCallback(async () => {
    try {
      const expenseFilters = {};
      if (expenseBuildingFilter) expenseFilters.building = expenseBuildingFilter;
      if (expenseStartDateFilter) expenseFilters.startDate = expenseStartDateFilter;
      if (expenseEndDateFilter) expenseFilters.endDate = expenseEndDateFilter;
      if (expenseCategoryFilter) expenseFilters.category = expenseCategoryFilter;
      if (expenseViewCard === 'agency') expenseFilters.scope = 'agency';else
      if (expenseViewCard === 'owner') expenseFilters.scope = 'owner';

      const expensesData = await accountingService.getExpenses(expenseFilters);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      addNotification('Failed to load expenses', 'error');
    }
  }, [expenseBuildingFilter, expenseStartDateFilter, expenseEndDateFilter, expenseCategoryFilter, expenseViewCard]);
  const loadExpensesSummary = useCallback(async () => {
    if (isDemoMode()) {
      const total = expenses.reduce((s, e) => s + (e.Amount || e.amount || 0), 0);
      const agency = expenses.filter((e) => (e.Scope || e.scope) === 'SAAF IMMO' || (e.Building || e.building) === '-').reduce((s, e) => s + (e.Amount || e.amount || 0), 0);
      const owner = expenses.filter((e) => (e.Scope || e.scope) === 'Building' && (e.Building || e.building) && (e.Building || e.building) !== '-').reduce((s, e) => s + (e.Amount || e.amount || 0), 0);
      setExpensesSummary({ totalExpenses: total, agencyExpenses: agency, ownerExpenses: owner });
      return;
    }
    try {
      const filters = {};
      if (expenseStartDateFilter) filters.startDate = expenseStartDateFilter;
      if (expenseEndDateFilter) filters.endDate = expenseEndDateFilter;
      const data = await accountingService.getExpensesSummary(filters);
      setExpensesSummary(data);
    } catch (error) {
      console.error('Failed to load expenses summary:', error);
      setExpensesSummary({ totalExpenses: 0, agencyExpenses: 0, ownerExpenses: 0 });
    }
  }, [expenseStartDateFilter, expenseEndDateFilter, expenses]);
  const loadExpensesPerOwner = useCallback(async () => {
    if (isDemoMode()) {
      const ownerExpenses = expenses.filter((e) => (e.Scope || e.scope) === 'Building' && (e.Building || e.building) && (e.Building || e.building) !== '-');
      const byOwner = {};
      ownerExpenses.forEach((exp) => {
        const owner = exp.Landlord || exp.landlord || 'Unknown';
        if (!byOwner[owner]) byOwner[owner] = { ownerId: 0, ownerName: owner, total: 0, expenses: [] };
        byOwner[owner].total += exp.Amount || exp.amount || 0;
        byOwner[owner].expenses.push(exp);
      });
      setExpensesPerOwner(Object.values(byOwner));
      return;
    }
    try {
      const filters = {};
      if (expenseStartDateFilter) filters.startDate = expenseStartDateFilter;
      if (expenseEndDateFilter) filters.endDate = expenseEndDateFilter;
      const data = await accountingService.getExpensesPerOwner(filters);
      setExpensesPerOwner(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load expenses per owner:', error);
      setExpensesPerOwner([]);
    }
  }, [expenseStartDateFilter, expenseEndDateFilter, expenses]);
  const loadRentSummary = useCallback(async () => {
    if (isDemoMode()) {
      const rentPayments = [...tenantPayments, ...collections].filter((p) => (p.ChargeType || p.chargeType || '').toLowerCase() === 'rent');
      const collected = rentPayments.filter((p) => ['Approved', 'Collected', 'Paid'].includes(p.Status || p.status || '')).reduce((s, p) => s + (p.Amount || p.amount || 0), 0);
      const expected = overviewData?.totalCollectedThisMonth ? overviewData.totalCollectedThisMonth + (overviewData.pendingRentAmount || 0) : collected + 50000;
      setRentSummary({ collectedRents: collected, expectedRentThisMonth: expected, paidRents: collected, unpaidRents: Math.max(0, expected - collected) });
      return;
    }
    try {
      const data = await accountingService.getRentSummary();
      setRentSummary(data);
    } catch (error) {
      console.error('Failed to load rent summary:', error);
      setRentSummary({ collectedRents: 0, expectedRentThisMonth: 0, paidRents: 0, unpaidRents: 0 });
    }
  }, [tenantPayments, collections, overviewData]);
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading accounting dashboard data...');

      if (isDemoMode()) {
        const demoData = getAccountingDemoData();
        setOverviewData(demoData.overview);
        setTenantPayments(demoData.tenantPayments);
        setLandlordPayments(demoData.landlordPayments);
        setCollections(demoData.collections);
        setExpenses(demoData.expenses);
        setMonthlySummary(demoData.monthlySummary);
        setLandlords(demoData.landlords);
        setAdvertisements(demoData.advertisements || []);
        setLoading(false);
        return;
      }

      const [overview, tenantPaymentsData, landlordPaymentsData, collectionsData, expensesData, summary, landlordsData, tenantsData, adsData, validatedClientsData] = await Promise.all([
      accountingService.getOverview(),
      accountingService.getTenantPayments(),
      accountingService.getLandlordPayments(),
      accountingService.getCollections(),
      accountingService.getExpenses({}),
      accountingService.getMonthlySummary(),
      accountingService.getOwners().catch(() => []),
      accountingService.getTenantsWithPaymentStatus().catch(() => []),
      accountingService.getAdvertisements().catch(() => []),
      salesManagerService.getApprovedClients().catch(() => [])]
      );

      setOverviewData(overview);
      setTenantPayments(Array.isArray(tenantPaymentsData) ? tenantPaymentsData : tenantPaymentsData?.payments ?? tenantPaymentsData?.tenantPayments ?? []);
      setLandlordPayments(Array.isArray(landlordPaymentsData) ? landlordPaymentsData : landlordPaymentsData?.payments ?? landlordPaymentsData?.landlordPayments ?? []);
      setCollections(Array.isArray(collectionsData) ? collectionsData : collectionsData?.collections ?? collectionsData?.data ?? []);
      setExpenses(Array.isArray(expensesData) ? expensesData : expensesData?.expenses ?? expensesData?.data ?? []);
      setMonthlySummary(summary);
      setLandlords(Array.isArray(landlordsData) ? landlordsData : landlordsData?.landlords ?? landlordsData?.data ?? []);
      setTenants(Array.isArray(tenantsData) ? tenantsData : tenantsData?.tenants ?? tenantsData?.data ?? []);
      setAdvertisements(Array.isArray(adsData) ? adsData : adsData?.advertisements ?? adsData?.data ?? []);
      setValidatedClients(Array.isArray(validatedClientsData) ? validatedClientsData : validatedClientsData?.clients ?? validatedClientsData?.data ?? []);

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
  useEffect(() => {
    if (activeTab === 'expenses') {
      loadExpensesSummary();
      if (expenseViewCard === 'owner') {
        loadExpensesPerOwner();
      } else {
        loadExpenses();
      }
    }
  }, [activeTab, expenseBuildingFilter, expenseStartDateFilter, expenseEndDateFilter, expenseCategoryFilter, expenseViewCard]);

  useEffect(() => {
    if (activeTab === 'payments') {
      loadRentSummary();
    }
  }, [activeTab]);
  const loadCashierData = useCallback(async () => {
    try {
      const [accounts, transactions, agencyBal] = await Promise.all([
      accountingService.getCashierAccounts().catch(() => []),
      accountingService.getCashierTransactions().catch(() => []),
      accountingService.getAgencyBalance().catch(() => ({ balance: 0 }))]
      );
      setCashierAccounts(Array.isArray(accounts) ? accounts : []);
      setCashierTransactions(Array.isArray(transactions) ? transactions : []);
      const bal = agencyBal?.balance ?? agencyBal?.agencyBalance ?? (typeof agencyBal === 'number' ? agencyBal : 0);
      setAgencyBalance(bal);
    } catch (error) {
      console.error('Error loading cashier data:', error);
      addNotification('Failed to load cashier data', 'error');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'account-balances') {
      loadCashierData();
    }
  }, [activeTab]);
  const loadOwners = useCallback(async () => {
    setOwnerBalancesLoading(true);
    try {
      const data = await accountingService.getOwners();
      setOwnerBalancesOwners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load owners:', err);
      addNotification('Failed to load owners', 'error');
      setOwnerBalancesOwners([]);
    } finally {
      setOwnerBalancesLoading(false);
    }
  }, []);

  useEffect(() => {
    const needsOwners = activeTab === 'account-balances' || activeTab === 'owner-payments';
    if (needsOwners) {
      loadOwners();
    }
  }, [activeTab]);
  const loadTenants = useCallback(async () => {
    try {
      const data = await accountingService.getTenantsWithPaymentStatus();
      setTenants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading tenants:', error);
      addNotification('Failed to load tenants', 'error');
      setTenants([]);
    }
  }, []);

  const validatedDepositClients = useMemo(() => {
    return validatedClients.filter((client) => {
      const paid =
      client.SecurityDepositPaid ||
      client.securityDepositPaid ||
      client.depositPaid ||
      client.DepositPaid;
      return !paid;
    });
  }, [validatedClients]);

  useEffect(() => {
    if (activeTab === 'tenant-management') {
      loadTenants();
    }
  }, [activeTab]);
  const loadDeposits = useCallback(async () => {
    try {
      const data = await accountingService.getSecurityDeposits({});
      setDeposits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading deposits:', error);
      addNotification('Failed to load deposits', 'error');
      setDeposits([]);
    }
  }, []);

  const loadDepositRefundsPending = useCallback(async () => {
    try {
      const data = await accountingService.getDepositRefundsPending();
      setPendingRefunds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading pending refunds:', error);
      addNotification('Failed to load pending refunds', 'error');
      setPendingRefunds([]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'deposit-refunds') {
      loadDeposits();
      loadDepositRefundsPending();
    }
  }, [activeTab, depositFilter]);
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
  useEffect(() => {
    if (showCollectionPaymentModal && collectionPaymentType === 'sale') {
      accountingService.getProperties().then((data) => {
        setPropertiesForSale(Array.isArray(data) ? data : []);
      }).catch(() => setPropertiesForSale([]));
    }
  }, [showCollectionPaymentModal, collectionPaymentType]);
  useEffect(() => {
    if (showCollectionPaymentModal && (collectionPaymentType === 'tenant' || collectionPaymentType === 'deposit')) {
      loadTenants();
    }
  }, [showCollectionPaymentModal, collectionPaymentType]);
  useEffect(() => {
    if (showExpenseModal) {
      accountingService.getProperties().then((data) => {
        setExpenseProperties(Array.isArray(data) ? data : []);
      }).catch(() => setExpenseProperties([]));
    }
  }, [showExpenseModal]);
  useEffect(() => {
    if (showExpenseModal && expenseFormScope === 'Building' && expenseFormBuilding) {
      const addr = typeof expenseFormBuilding === 'string' ? expenseFormBuilding : expenseFormBuilding?.address || expenseFormBuilding?.Address || '';
      accountingService.getPropertyUnits(addr).then((data) => {
        setExpenseFormUnits(Array.isArray(data) ? data : []);
      }).catch(() => setExpenseFormUnits([]));
    } else {
      setExpenseFormUnits([]);
    }
  }, [showExpenseModal, expenseFormScope, expenseFormBuilding]);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => {
    if (chatMessages.length > 0) {
      scrollToBottom();
    }
  }, [chatMessages, scrollToBottom]);
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
  }, []);
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
        usersArray = Object.values(users).find((val) => Array.isArray(val)) || [];
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

      const chatUsersList = usersArray.
      filter((user) => {
        const userId = user.id || user.ID;
        const userIdStr = userId ? String(userId) : null;
        const currentUserIdStr = currentUserId ? String(currentUserId) : null;
        const shouldInclude = userIdStr && userIdStr !== currentUserIdStr;
        if (!shouldInclude && userIdStr) {
          console.log(`Excluding user ${userIdStr} (current user: ${currentUserIdStr})`);
        }
        return shouldInclude;
      }).
      map((user) => {
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
      }).
      sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      console.log('Final chat users list:', chatUsersList);
      try {
        const conversations = await messagingService.getConversations();
        if (Array.isArray(conversations)) {
          const existingUsersMap = new Map();
          chatUsersList.forEach((u) => {
            existingUsersMap.set(String(u.userId), u);
          });
          conversations.forEach((conv) => {
            const convUserId = String(conv.userId || conv.userID);
            const existingUser = existingUsersMap.get(convUserId);

            if (existingUser) {
              if (conv.unreadCount) {
                existingUser.unreadCount = conv.unreadCount;
              }
            } else {
              const convUser = conv.user || {};
              const userId = conv.userId || conv.userID || convUser.id || convUser.ID;
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

      setSelectedUserId((prevSelected) => {
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
  }, [loadChatForUser]);
  useEffect(() => {
    if (activeTab === 'advertisements' || activeTab === 'overview') {
      loadAdvertisements();
    }
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === 'transaction-history') {
      loadData();
      loadCashierData();
      loadDeposits();
    }
  }, [activeTab]);
  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    if (activeTab === 'chat' && !isLoadingUsersRef.current) {
      loadUsers();
    }
  }, [activeTab]);
  const downloadReceipt = async (item) => {
    if (!item) return;
    try {
      if (item.ReceiptURL || item.receiptURL) {
        const receiptUrl = item.ReceiptURL || item.receiptURL;
        const a = document.createElement('a');
        a.href = receiptUrl;
        a.download = `receipt-${item.ReceiptNumber || item.ID}.pdf`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addNotification('Receipt downloaded!', 'success');
        return;
      }
      printPaymentReceipt(item);
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
  const printExpenseReceipt = (expense) => {
    if (!expense) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;
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
      return num.toString();
    };
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
    pdf.setFontSize(11);
    pdf.text('Demande de sortie de caisse présentée par Mr / Mlle / Mme', 20, yPos);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, yPos + 3, pageWidth - 20, yPos + 3);

    yPos += 12;
    pdf.text('Noms et prénoms :', 20, yPos);
    const requestedBy = expense.RequestedBy || expense.requestedBy || '';
    pdf.text(requestedBy || '-', 60, yPos);
    pdf.line(60, yPos - 3, pageWidth - 20, yPos - 3);

    yPos += 12;
    pdf.text('Motif :', 20, yPos);
    pdf.line(40, yPos - 3, pageWidth - 20, yPos - 3);
    yPos += 8;
    pdf.line(20, yPos - 3, pageWidth - 20, yPos - 3);

    yPos += 15;
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
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    pdf.text(`Fait à Abidjan, le ${dateStr}`, 20, yPos);

    yPos = pageHeight - 50;
    pdf.setFontSize(10);
    pdf.text('Caisse', 20, yPos);
    pdf.text('Direction financière', pageWidth / 2 - 30, yPos, { align: 'center' });
    pdf.text('Bénéficiaire', pageWidth - 20, yPos, { align: 'right' });

    yPos += 20;
    pdf.line(20, yPos, 60, yPos);
    pdf.line(pageWidth / 2 - 50, yPos, pageWidth / 2 + 10, yPos);
    pdf.line(pageWidth - 60, yPos, pageWidth - 20, yPos);
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
    if (expense.Notes || expense.notes) {
      yPos = 120;
      pdf.setFontSize(9);
      pdf.text('Détails:', 20, yPos);
      yPos += 6;
      pdf.setFontSize(8);
      const notes = pdf.splitTextToSize(expense.Notes || expense.notes, pageWidth - 40);
      pdf.text(notes, 20, yPos);
    }
    const fileName = `bon-de-caisse-${expense.ID || expense.id || Date.now()}.pdf`;
    pdf.save(fileName);
    addNotification('Expense receipt generated successfully', 'success');
  };
  const numberToWordsFr = (num) => {
    const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
    if (num === 0) return 'zéro';
    if (num < 20) return ones[num];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      if (ten === 7 || ten === 9) return tens[ten] + '-' + ones[10 + one];
      return tens[ten] + (one > 0 ? '-' + ones[one] : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      return ones[hundred] + ' cent' + (remainder > 0 ? ' ' + numberToWordsFr(remainder) : '');
    }
    return num.toString();
  };
  const printPaymentReceipt = async (item, isCollectionParam) => {
    if (!item) return;
    const isCollection = isCollectionParam ?? item.Building !== undefined;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#f0f0f0;z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow:auto;';
    document.body.appendChild(overlay);
    const container = document.createElement('div');
    overlay.appendChild(container);
    const root = ReactDOM.createRoot(container);
    root.render(
      <RentReceiptTemplate data={item} isCollection={isCollection} />
    );
    try {
      await new Promise((r) => setTimeout(r, 800));
      const receiptEl = container.querySelector('.receipt-container') || container.firstChild;
      if (!receiptEl) throw new Error('Receipt element not found');
      const opt = {
        margin: 0,
        filename: `rent-receipt-${item.ID || item.id || Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(receiptEl).save();
      addNotification('Receipt downloaded successfully', 'success');
    } catch (err) {
      console.error('Failed to generate receipt PDF:', err);
      addNotification('Failed to download receipt', 'error');
    } finally {
      root.unmount();
      document.body.removeChild(overlay);
    }
  };
  const printRefundReceipt = (refund) => {
    if (!refund) return;
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;

    const amount = refund.Amount ?? refund.amount ?? 0;
    const amountWords = numberToWordsFr(Math.floor(amount)) + ' francs CFA';
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('sili', 20, yPos);
    pdf.setFontSize(20);
    pdf.text('SAAF IMMO', 20, yPos + 8);
    pdf.setFontSize(18);
    pdf.text('QUITTANCE DE REMBOURSEMENT', pageWidth - 20, yPos, { align: 'right' });
    yPos += 25;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Remboursement dépôt de garantie', pageWidth - 20, yPos, { align: 'right' });
    yPos += 20;

    pdf.setFontSize(11);
    pdf.text('Bénéficiaire :', 20, yPos);
    pdf.text(refund.Tenant || refund.tenant || '-', 55, yPos);
    yPos += 10;
    pdf.text('Propriété :', 20, yPos);
    pdf.text(refund.Property || refund.property || '-', 55, yPos);
    yPos += 10;
    pdf.text('Méthode de remboursement :', 20, yPos);
    pdf.text(refund.RefundMethod || refund.refundMethod || '-', 70, yPos);
    yPos += 10;
    pdf.text('Date du remboursement :', 20, yPos);
    const refundDate = refund.RefundedAt || refund.refundedAt;
    pdf.text(refundDate ? new Date(refundDate).toLocaleDateString('fr-FR') : '-', 70, yPos);
    yPos += 15;

    pdf.text('La somme de', 20, yPos);
    pdf.text('(en lettre) :', 20, yPos + 6);
    pdf.line(50, yPos - 3, pageWidth - 20, yPos - 3);
    pdf.text(amountWords, 55, yPos);
    yPos += 12;
    pdf.text('(en chiffre) :', 20, yPos);
    pdf.line(50, yPos - 3, pageWidth - 60, yPos - 3);
    pdf.text((amount || 0).toFixed(2) + ' CFA', 55, yPos);
    yPos += 10;
    pdf.text('N° Reçu :', 20, yPos);
    pdf.text(refund.ReceiptNumber || refund.receiptNumber || `REF-${refund.ID || refund.id || Date.now()}`, 55, yPos);
    yPos += 25;

    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    pdf.text(`Fait à Abidjan, le ${dateStr}`, 20, yPos);

    yPos = pageHeight - 50;
    pdf.setFontSize(10);
    pdf.text('Caisse', 20, yPos);
    pdf.text('Direction financière', pageWidth / 2 - 30, yPos, { align: 'center' });
    pdf.text('Bénéficiaire', pageWidth - 20, yPos, { align: 'right' });
    yPos += 20;
    pdf.line(20, yPos, 60, yPos);
    pdf.line(pageWidth / 2 - 50, yPos, pageWidth / 2 + 10, yPos);
    pdf.line(pageWidth - 60, yPos, pageWidth - 20, yPos);

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

    const fileName = `remboursement-${refund.ID || refund.id || Date.now()}.pdf`;
    pdf.save(fileName);
    addNotification('Refund receipt downloaded', 'success');
  };

  const transferToLandlord = async (paymentId) => {
    try {
      setLoading(true);
      await accountingService.transferToLandlord(paymentId);
      setLandlordPayments((prev) => prev.map((p) =>
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
  const exportPaymentsToCSV = () => {
    const headers = ['Tenant', 'Property', 'Amount', 'Method', 'Date', 'Status', 'Reference', 'Receipt Number'];
    const rows = tenantPayments.
    filter((payment) => {
      const status = (payment.Status || '').toLowerCase();
      return status === 'successful' || status === 'failed' || status === 'approved' || status === 'rejected';
    }).
    map((payment) => {
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
      payment.ReceiptNumber || ''];

    });

    const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].
    join('\n');

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
  const handleImportPayments = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      const result = await accountingService.importPayments(formData);

      addNotification(`Successfully imported ${result.imported || 0} payment(s)!`, 'success');
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
                      collections: Math.round(currentCollections * (0.7 + index * 0.05)),
                      expenses: Math.round(currentExpenses * (0.7 + index * 0.05))
                    }));
                  })()}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  
                  <defs>
                    <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }} />
                  
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }} />
                  
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      padding: '8px 12px'
                    }}
                    formatter={(value, name) => {
                      if (name === 'collections') return [`${value.toLocaleString()} XOF`, t('accounting.collections')];
                      if (name === 'expenses') return [`${value.toLocaleString()} XOF`, t('accounting.expenses')];
                      return value;
                    }} />
                  
                  <Legend
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="line" />
                  
                  <Area
                    type="natural"
                    dataKey="collections"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorCollections)"
                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name={t('accounting.collections')} />
                  
                  <Area
                    type="natural"
                    dataKey="expenses"
                    stroke="#dc2626"
                    strokeWidth={3}
                    fill="url(#colorExpenses)"
                    dot={{ fill: '#dc2626', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name="Expenses" />
                  
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sa-overview-metrics">
            <div className="sa-metric-card sa-metric-primary">
              <p className="sa-metric-label">{t('accounting.cashBalance')}</p>
              <p className="sa-metric-period">Current balance</p>
              <p className="sa-metric-value">
                {overviewData ? `${(overviewData.totalAvailableBalance || overviewData.globalBalance || 0).toFixed(2)} XOF` : '0 XOF'}
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">{t('accounting.totalRevenue')} ({t('dashboard.thisMonth')})</p>
              <p className="sa-metric-period">{currentMonth}</p>
              <p className="sa-metric-value">
                {overviewData ? `${(overviewData.totalCollectedThisMonth || 0).toFixed(2)} XOF` : '0 XOF'}
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">{t('nav.landlordPayments')}</p>
              <p className="sa-metric-number">
                {overviewData ? `${(overviewData.totalTransferredToLandlords || 0).toFixed(2)} XOF` : '0 XOF'}
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">{t('accounting.commission')}</p>
              <p className="sa-metric-number">
                {overviewData ? `${(overviewData.totalCompanyCommissionEarned || 0).toFixed(2)} XOF` : '0 XOF'}
              </p>
            </div>
            {advertisements.length > 0 ?
            <div style={{
              gridColumn: 'span 2',
              minHeight: '400px',
              padding: '0',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}>
                <div style={{
                position: 'relative',
                flex: 1,
                minHeight: '400px',
                overflow: 'hidden',
                display: 'flex'
              }}>
                  <div style={{
                  display: 'flex',
                  transform: `translateX(-${currentAdIndex * 100}%)`,
                  transition: 'transform 0.5s ease-in-out',
                  width: `${advertisements.length * 100}%`,
                  height: '100%'
                }}>
                    {advertisements.map((ad, index) => {
                    const imageUrl = ad.ImageURL || ad.imageUrl || ad.imageURL;
                    const fullImageUrl = imageUrl ?
                    imageUrl.startsWith('http') ? imageUrl : `${API_CONFIG.BASE_URL}${imageUrl}` :
                    null;

                    return (
                      <div
                        key={`ad-${ad.ID || ad.id || index}`}
                        style={{
                          width: `${100 / advertisements.length}%`,
                          height: '100%',
                          minHeight: '400px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f9fafb'
                        }}>
                        
                          {fullImageUrl ?
                        <img
                          src={fullImageUrl}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            minHeight: '400px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }} /> :


                        <div style={{ padding: '24px', color: '#6b7280', textAlign: 'center' }}>
                              {ad.Title || ad.title || 'No image'}
                            </div>
                        }
                        </div>);

                  })}
                  </div>
                  {advertisements.length > 1 &&
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)'
                }}>
                      {advertisements.map((_, index) =>
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
                      backgroundColor: index === currentAdIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }} />

                  )}
                    </div>
                }
                </div>
              </div> :

            <div className="sa-banner-card">
                <div className="sa-banner-text">
                  <h3>{t('accounting.financialManagement')}</h3>
                  <p>
                    Manage payments, expenses, and financial operations all in one place.
                  </p>
                </div>
              </div>
            }
          </div>
        </div>

      </div>);

  };
  const renderPaymentsSection = () => {
    const nameLower = (paymentNameFilter || '').trim().toLowerCase();
    const dateStart = paymentDateStartFilter ? new Date(paymentDateStartFilter + 'T00:00:00') : null;
    const dateEnd = paymentDateEndFilter ? new Date(paymentDateEndFilter + 'T23:59:59') : null;

    const matchesStatus = (status) => {
      if (paymentStatusFilter === 'all') return true;
      const s = (status || '').toLowerCase();
      if (paymentStatusFilter === 'approved') return s === 'approved' || s === 'collected' || s === 'paid';
      if (paymentStatusFilter === 'pending') return s === 'pending' || s === 'awaiting';
      if (paymentStatusFilter === 'rejected') return s === 'rejected' || s === 'failed';
      return true;
    };
    const matchesName = (tenant, buyer, property, landlord) => {
      if (!nameLower) return true;
      const search = [tenant, buyer, property, landlord].filter(Boolean).join(' ').toLowerCase();
      return search.includes(nameLower);
    };
    const matchesDate = (dateStr) => {
      if (!dateStr) return !dateStart && !dateEnd;
      const d = new Date(dateStr);
      if (dateStart && d < dateStart) return false;
      if (dateEnd && d > dateEnd) return false;
      return true;
    };
    const filteredCollections = collections.filter((col) => {
      if (paymentView === 'tenant') return false;
      if (paymentView === 'all') {} else
      if (paymentView === 'rent' && col.ChargeType !== 'Rent') return false;else
      if (paymentView === 'deposit' && col.ChargeType !== 'Deposit') return false;else
      if (paymentView === 'sale' && col.ChargeType !== 'Sale') return false;
      if (!matchesStatus(col.Status)) return false;
      if (!matchesName(col.Tenant, col.Buyer, col.Building, col.Landlord)) return false;
      if (!matchesDate(col.Date)) return false;
      return true;
    });

    const filteredTenantPayments = paymentView === 'all' || paymentView === 'tenant' ?
    tenantPayments.filter((p) => {
      if (!matchesStatus(p.Status)) return false;
      if (!matchesName(p.Tenant, null, p.Property, null)) return false;
      if (!matchesDate(p.Date)) return false;
      return true;
    }) :
    [];

    const collected = rentSummary?.collectedRents ?? 0;
    const expected = rentSummary?.expectedRentThisMonth ?? 0;
    const paid = rentSummary?.paidRents ?? 0;
    const unpaid = rentSummary?.unpaidRents ?? 0;

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Collected Rents</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#059669' }}>{collected.toFixed(2)} XOF</p>
          </div>
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Expected Rent This Month</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#1e40af' }}>{expected.toFixed(2)} XOF</p>
          </div>
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Paid Rents</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#059669' }}>{paid.toFixed(2)} XOF</p>
          </div>
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Unpaid Rents</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#dc2626' }}>{unpaid.toFixed(2)} XOF</p>
          </div>
        </div>

        <div className="sa-section-card">
          <div className="sa-section-header">
            <div>
              <h2>Payments & Deposits</h2>
              <p>Manage rent payments, deposit payments, and property sales</p>
            </div>
            <button
              className="sa-primary-cta"
              onClick={() => setShowCollectionPaymentModal(true)}
              disabled={loading}>
              
              <Plus size={18} />
              Record Payment
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
            <button
              onClick={() => setPaymentView('all')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: paymentView === 'all' ? '#3b82f6' : 'transparent',
                color: paymentView === 'all' ? 'white' : '#6b7280',
                cursor: 'pointer',
                borderBottom: paymentView === 'all' ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: '-2px'
              }}>
              
              All Payments
            </button>
            <button
              onClick={() => setPaymentView('deposit')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: paymentView === 'deposit' ? '#3b82f6' : 'transparent',
                color: paymentView === 'deposit' ? 'white' : '#6b7280',
                cursor: 'pointer',
                borderBottom: paymentView === 'deposit' ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: '-2px'
              }}>
              
              Deposit Payments
            </button>
            <button
              onClick={() => setPaymentView('sale')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: paymentView === 'sale' ? '#3b82f6' : 'transparent',
                color: paymentView === 'sale' ? 'white' : '#6b7280',
                cursor: 'pointer',
                borderBottom: paymentView === 'sale' ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: '-2px'
              }}>
              
              Property Sales
            </button>
            <button
              onClick={() => setPaymentView('tenant')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: paymentView === 'tenant' ? '#3b82f6' : 'transparent',
                color: paymentView === 'tenant' ? 'white' : '#6b7280',
                cursor: 'pointer',
                borderBottom: paymentView === 'tenant' ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: '-2px'
              }}>
              
              Tenant Payments
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', whiteSpace: 'nowrap' }}>Status (verify payment):</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem', minWidth: '140px' }}>
                
                <option value="all">All</option>
                <option value="approved">Approved / Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} style={{ color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Filter by tenant, buyer, property..."
                value={paymentNameFilter}
                onChange={(e) => setPaymentNameFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem', minWidth: '200px' }} />
              
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', whiteSpace: 'nowrap' }}>Date from:</label>
              <input
                type="date"
                value={paymentDateStartFilter}
                onChange={(e) => setPaymentDateStartFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }} />
              
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', whiteSpace: 'nowrap' }}>Date to:</label>
              <input
                type="date"
                value={paymentDateEndFilter}
                onChange={(e) => setPaymentDateEndFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }} />
              
            </div>
            {(paymentStatusFilter !== 'all' || paymentNameFilter || paymentDateStartFilter || paymentDateEndFilter) &&
            <button
              type="button"
              onClick={() => {
                setPaymentStatusFilter('all');
                setPaymentNameFilter('');
                setPaymentDateStartFilter('');
                setPaymentDateEndFilter('');
              }}
              style={{ padding: '8px 12px', fontSize: '0.875rem', color: '#64748b', background: 'transparent', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>
              
                Clear filters
              </button>
            }
          </div>
          {loading ?
          <div className="loading">Loading payments...</div> :
          filteredCollections.length === 0 && filteredTenantPayments.length === 0 ?
          <div className="no-data">No payments found</div> :

          <div className="sa-table-wrapper">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Tenant/Buyer</th>
                    <th>Property/Building</th>
                    <th>Landlord</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="table-menu"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollections.map((collection, index) =>
                <tr key={`collection-${collection.ID || index}`}>
                      <td>
                        <span className="sa-status-pill" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                          {collection.ChargeType || 'Collection'}
                        </span>
                      </td>
                      <td>-</td>
                      <td>
                        <span className="sa-cell-title">{collection.Building || 'N/A'}</span>
                      </td>
                      <td>{collection.Landlord || 'N/A'}</td>
                      <td>{collection.Amount?.toFixed(2) || '0.00'} XOF</td>
                      <td>Cash</td>
                      <td>
                        <span className={`sa-status-pill ${(collection.Status || 'unknown').toLowerCase()}`}>
                          {collection.Status || 'Unknown'}
                        </span>
                      </td>
                      <td>{collection.Date ? new Date(collection.Date).toLocaleDateString() : 'N/A'}</td>
                      <td className="table-menu">
                        <div className="sa-row-actions">
                          <button
                        className="table-action-button view"
                        onClick={() => {
                          setSelectedItemForView({ type: 'collection', data: collection });
                          setShowPaymentViewModal(true);
                        }}>
                        
                            {t('common.view')}
                          </button>
                          <button
                        className="table-action-button edit"
                        onClick={() => printPaymentReceipt(collection, true)}>
                        
                            Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                )}
                  {filteredTenantPayments.map((payment, index) =>
                <tr key={`tenant-payment-${payment.ID || index}`}>
                      <td>
                        <span className="sa-status-pill" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                          Tenant Payment
                        </span>
                      </td>
                      <td>
                        <span className="sa-cell-title">{payment.Tenant || 'N/A'}</span>
                      </td>
                      <td>{payment.Property || 'N/A'}</td>
                      <td>-</td>
                      <td>{payment.Amount?.toFixed(2) || '0.00'} XOF</td>
                      <td>{payment.Method || 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${(payment.Status || 'unknown').toLowerCase()}`}>
                          {payment.Status || 'Unknown'}
                        </span>
                      </td>
                      <td>{payment.Date ? new Date(payment.Date).toLocaleDateString() : 'N/A'}</td>
                      <td className="table-menu">
                        <div className="sa-row-actions">
                          <button
                        className="table-action-button view"
                        onClick={() => {
                          setSelectedItemForView({ type: 'payment', data: payment });
                          setShowPaymentViewModal(true);
                        }}>
                        
                            {t('common.view')}
                          </button>
                          <button
                        className="table-action-button edit"
                        onClick={() => downloadReceipt(payment)}>
                        
                            Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>);

  };

  const renderCollections = () =>
  <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h2>Real-time Collections Tracking</h2>
          <p>Track rent and deposit payments per building</p>
        </div>
        <button
        className="sa-primary-cta"
        onClick={() => setShowCollectionPaymentModal(true)}
        disabled={loading}>
        
          <Plus size={18} />
          {t('accounting.recordPayment')}
        </button>
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

      {loading ?
    <div className="loading">Loading collections...</div> :
    collections.length === 0 ?
    <div className="no-data">No collections found</div> :

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
              {collections.map((collection, index) =>
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
                      <button
                  className="table-action-button view"
                  onClick={() => {
                    setSelectedItemForView({ type: 'collection', data: collection });
                    setShowPaymentViewModal(true);
                  }}>
                  
                        {t('common.view')}
                      </button>
                      <button
                  className="table-action-button edit"
                  onClick={() => printPaymentReceipt(collection, true)}>
                  
                        Receipt
                      </button>
                    </div>
                  </td>
                </tr>
          )}
            </tbody>
          </table>
        </div>
    }
    </div>;


  const renderPayments = () => {
    return (
      <div>
        <div className="sa-section-card" style={{ marginBottom: '24px' }}>
          <div className="sa-section-header">
            <div>
              <h2>Owner Payments</h2>
              <p>Manage transfers to property owners</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setOwnerView('owners')}
                className={ownerView === 'owners' ? 'sa-primary-cta' : 'sa-outline-button'}>
                
                List Owners
              </button>
              <button
                onClick={() => setOwnerView('payments')}
                className={ownerView === 'payments' ? 'sa-primary-cta' : 'sa-outline-button'}>
                
                Owner Payments
              </button>
            </div>
          </div>

          {selectedOwnerForPaymentsHistory ?
          <div>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                type="button"
                className="sa-outline-button"
                onClick={() => setSelectedOwnerForPaymentsHistory(null)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                
                  <ArrowLeft size={16} />
                  Back to {ownerView === 'owners' ? 'owners' : 'payments'}
                </button>
                <h3 style={{ margin: 0 }}>{selectedOwnerForPaymentsHistory} – Transaction History</h3>
              </div>
              {(() => {
              const owner = selectedOwnerForPaymentsHistory;
              const ownerPayments = landlordPayments.filter((p) => {
                const pLandlord = (p.Landlord || p.landlord || '').trim();
                return pLandlord && (pLandlord === owner || pLandlord.toLowerCase() === owner.toLowerCase());
              });
              const ownerCollections = collections.filter((c) => {
                const cLandlord = (c.Landlord || c.landlord || '').trim();
                return cLandlord && (cLandlord === owner || cLandlord.toLowerCase() === owner.toLowerCase());
              });
              const merged = [
              ...ownerPayments.map((p) => ({ ...p, _type: 'payout', _date: p.Date || p.date || p.CreatedAt || p.createdAt })),
              ...ownerCollections.map((c) => ({ ...c, _type: 'collection', _date: c.Date || c.date || c.CreatedAt || c.createdAt }))].
              sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0));
              if (merged.length === 0) return <div className="no-data">No transactions for this owner.</div>;
              return (
                <div className="sa-table-wrapper">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Building</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {merged.map((item, idx) => {
                        const isCollection = item._type === 'collection';
                        const amount = isCollection ? item.Amount || item.amount || 0 : item.NetAmount || item.netAmount || 0;
                        const building = item.Building || item.building || '—';
                        const date = item._date ? new Date(item._date).toLocaleDateString() : 'N/A';
                        const status = item.Status || item.status || (isCollection ? 'Collected' : '—');
                        return (
                          <tr key={idx}>
                              <td>{date}</td>
                              <td><span className={`sa-status-pill ${isCollection ? 'success' : 'info'}`}>{isCollection ? 'Collection' : 'Payout'}</span></td>
                              <td>{building}</td>
                              <td style={{ color: isCollection ? '#059669' : '#dc2626', fontWeight: '600' }}>{isCollection ? '+' : '-'}{amount.toFixed(2)} XOF</td>
                              <td>{status}</td>
                            </tr>);

                      })}
                      </tbody>
                    </table>
                  </div>);

            })()}
            </div> :
          ownerView === 'owners' ?
          <div>
              {ownerBalancesLoading ?
            <div className="loading">Loading owners...</div> :
            ownerBalancesOwners.length === 0 ?
            <div className="no-data">No owners found. Owners are loaded from the backend (same as Sales Manager).</div> :

            <div className="sa-table-wrapper">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>Owner Name</th>
                        <th>Email</th>
                        <th className="table-menu"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ownerBalancesOwners.map((owner, index) => {
                    const name = owner.Name || owner.name || owner.Landlord || owner.landlord || 'N/A';
                    return (
                      <tr
                        key={owner.ID || owner.id || index}
                        onClick={() => setSelectedOwnerForPaymentsHistory(name)}
                        style={{ cursor: 'pointer' }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();setSelectedOwnerForPaymentsHistory(name);}}}>
                        
                            <td><span className="sa-cell-title">{name}</span></td>
                            <td>{owner.Email || owner.email || 'N/A'}</td>
                            <td className="table-menu" onClick={(e) => e.stopPropagation()}>
                              <button
                            className="table-action-button edit"
                            onClick={() => {
                              setSelectedLandlord(owner);
                              setLandlordProperties(null);
                              setShowLandlordPaymentModal(true);
                            }}>
                            
                                Record Payment
                              </button>
                            </td>
                          </tr>);

                  })}
                    </tbody>
                  </table>
                </div>
            }
            </div> :
          null}

          {ownerView === 'payments' &&
          <div className="sa-section-card">
              {selectedOwnerForPaymentsHistory ?
            <>
                  <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                  type="button"
                  className="sa-outline-button"
                  onClick={() => setSelectedOwnerForPaymentsHistory(null)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  
                      <ArrowLeft size={16} />
                      Back to list
                    </button>
                    <h3 style={{ margin: 0 }}>{selectedOwnerForPaymentsHistory} – Transaction History</h3>
                  </div>
                  {(() => {
                const owner = selectedOwnerForPaymentsHistory;
                const ownerPayments = landlordPayments.filter((p) =>
                (p.Landlord || p.landlord || '').trim() === owner ||
                (p.Landlord || p.landlord || '').toLowerCase() === owner.toLowerCase()
                );
                const ownerCollections = collections.filter((c) =>
                (c.Landlord || c.landlord || '').trim() === owner ||
                (c.Landlord || c.landlord || '').toLowerCase() === owner.toLowerCase()
                );
                const merged = [
                ...ownerPayments.map((p) => ({ ...p, _type: 'payout', _date: p.Date || p.date || p.CreatedAt || p.createdAt })),
                ...ownerCollections.map((c) => ({ ...c, _type: 'collection', _date: c.Date || c.date || c.CreatedAt || c.createdAt }))].
                sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0));

                if (merged.length === 0) {
                  return <div className="no-data">No transactions for this owner.</div>;
                }
                return (
                  <div className="sa-table-wrapper">
                        <table className="sa-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Building</th>
                              <th>Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {merged.map((item, idx) => {
                          const isCollection = item._type === 'collection';
                          const amount = isCollection ? item.Amount || item.amount || 0 : item.NetAmount || item.netAmount || 0;
                          const building = item.Building || item.building || '—';
                          const date = item._date ? new Date(item._date).toLocaleDateString() : 'N/A';
                          const status = item.Status || item.status || (isCollection ? 'Collected' : '—');
                          return (
                            <tr key={idx}>
                                  <td>{date}</td>
                                  <td>
                                    <span className={`sa-status-pill ${isCollection ? 'success' : 'info'}`}>
                                      {isCollection ? 'Collection' : 'Payout'}
                                    </span>
                                  </td>
                                  <td>{building}</td>
                                  <td style={{ color: isCollection ? '#059669' : '#dc2626', fontWeight: '600' }}>
                                    {isCollection ? '+' : '-'}{amount.toFixed(2)} XOF
                                  </td>
                                  <td>{status}</td>
                                </tr>);

                        })}
                          </tbody>
                        </table>
                      </div>);

              })()}
                </> :

            <>
              <div className="sa-section-header">
                <div>
                  <h2>Owner Payment Table</h2>
                  <p>Net payments after commission deduction</p>
                </div>
                <button
                  className="sa-primary-cta"
                  onClick={() => setShowLandlordPaymentModal(true)}
                  disabled={loading}>
                  
                  <Plus size={18} />
                  Register Owner Payment
                </button>
              </div>

              <div className="sa-filters-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                <select
                  className="sa-filter-select"
                  value={ownerPaymentsLandlordFilter}
                  onChange={(e) => setOwnerPaymentsLandlordFilter(e.target.value)}>
                  
                  <option value="">All Owners</option>
                  {ownerBalancesOwners.map((o) => {
                    const name = o.Name || o.name || o.Landlord || o.landlord || '';
                    return name ? <option key={o.ID || o.id} value={name}>{name}</option> : null;
                  })}
                  {ownerBalancesOwners.length === 0 && [...new Set(landlordPayments.map((p) => p.Landlord || p.landlord).filter(Boolean))].map((name, i) =>
                  <option key={i} value={name}>{name}</option>
                  )}
                </select>
                <select
                  className="sa-filter-select"
                  value={ownerPaymentsBuildingFilter}
                  onChange={(e) => setOwnerPaymentsBuildingFilter(e.target.value)}>
                  
                  <option value="">All Buildings</option>
                  {[...new Set(landlordPayments.map((p) => p.Building || p.building).filter(Boolean))].sort().map((b, i) =>
                  <option key={i} value={b}>{b}</option>
                  )}
                </select>
                <input type="month" className="sa-filter-select" value={ownerPaymentsMonthFilter} onChange={(e) => setOwnerPaymentsMonthFilter(e.target.value)} placeholder="Month" title="Filter by month" />
                <input type="date" className="sa-filter-select" value={ownerPaymentsStartDate} onChange={(e) => setOwnerPaymentsStartDate(e.target.value)} placeholder="Start Date" title="Start date" />
                <input type="date" className="sa-filter-select" value={ownerPaymentsEndDate} onChange={(e) => setOwnerPaymentsEndDate(e.target.value)} placeholder="End Date" title="End date" />
              </div>

              {loading ?
              <div className="loading">Loading landlord payments...</div> :
              (() => {
                const isPaymentForOwner = (p) => {
                  const pVal = (p.Landlord || p.landlord || '').toString().trim();
                  if (!pVal) return false;
                  return ownerBalancesOwners.some((o) => {
                    const oId = String(o.id || o.ID || '');
                    const oName = (o.Name || o.name || o.Landlord || o.landlord || '').toString().trim();
                    return oId === pVal || oName === pVal || oName && oName.toLowerCase() === pVal.toLowerCase();
                  });
                };
                const getOwnerDisplayName = (p) => {
                  const pVal = (p.Landlord || p.landlord || '').toString().trim();
                  const owner = ownerBalancesOwners.find((o) => {
                    const oId = String(o.id || o.ID || '');
                    const oName = (o.Name || o.name || o.Landlord || o.landlord || '').toString().trim();
                    return oId === pVal || oName === pVal || oName && oName.toLowerCase() === pVal.toLowerCase();
                  });
                  return owner ? owner.Name || owner.name || owner.Landlord || owner.landlord || 'N/A' : 'N/A';
                };
                const filtered = landlordPayments.filter((p) => {
                  if (!isPaymentForOwner(p)) return false;
                  if (ownerPaymentsLandlordFilter) {
                    const selectedOwner = ownerBalancesOwners.find((o) =>
                    (o.Name || o.name || o.Landlord || o.landlord || '').toString().trim() === ownerPaymentsLandlordFilter
                    );
                    if (!selectedOwner) return false;
                    const pVal = (p.Landlord || p.landlord || '').toString().trim();
                    const oId = String(selectedOwner.id || selectedOwner.ID || '');
                    const oName = (selectedOwner.Name || selectedOwner.name || selectedOwner.Landlord || selectedOwner.landlord || '').toString().trim();
                    if (pVal !== oId && pVal !== oName && !(oName && pVal.toLowerCase() === oName.toLowerCase())) return false;
                  }
                  if (ownerPaymentsBuildingFilter && (p.Building || p.building) !== ownerPaymentsBuildingFilter) return false;
                  const d = p.Date || p.date || p.CreatedAt || p.createdAt;
                  if (ownerPaymentsMonthFilter && d) {
                    const pd = new Date(d);
                    const [y, m] = ownerPaymentsMonthFilter.split('-').map(Number);
                    if (pd.getFullYear() !== y || pd.getMonth() + 1 !== m) return false;
                  }
                  if (ownerPaymentsStartDate && d && new Date(d) < new Date(ownerPaymentsStartDate)) return false;
                  if (ownerPaymentsEndDate && d && new Date(d) > new Date(ownerPaymentsEndDate + 'T23:59:59')) return false;
                  return true;
                });
                return filtered.length === 0 ?
                <div className="no-data">No landlord payments found</div> :

                <>
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="sa-outline-button"
                      onClick={() => {
                        const headers = ['Date', 'Landlord', 'Building', 'Net Amount', 'Commission', 'Status'];
                        const getOwnerDisplayNameExport = (p) => {
                          const pVal = (p.Landlord || p.landlord || '').toString().trim();
                          const owner = ownerBalancesOwners.find((o) => {
                            const oId = String(o.id || o.ID || '');
                            const oName = (o.Name || o.name || o.Landlord || o.landlord || '').toString().trim();
                            return oId === pVal || oName === pVal || oName && oName.toLowerCase() === pVal.toLowerCase();
                          });
                          return owner ? owner.Name || owner.name || owner.Landlord || owner.landlord || 'N/A' : p.Landlord || p.landlord || 'N/A';
                        };
                        const rows = filtered.map((p) => [
                        p.Date || p.date ? new Date(p.Date || p.date).toLocaleDateString() : '',
                        getOwnerDisplayNameExport(p),
                        p.Building || p.building || '',
                        (p.NetAmount || p.netAmount || 0).toFixed(2),
                        (p.Commission || p.commission || 0).toFixed(2),
                        p.Status || p.status || '']
                        );
                        const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
                        const a = document.createElement('a');
                        a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
                        a.download = `owner-payments-export.csv`;
                        a.click();
                        addNotification('Owner payments exported', 'success');
                      }}
                      title="Export filtered payments to CSV">
                      
                      <Download size={16} />
                      Export
                    </button>
                  </div>
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
                        {filtered.map((payment, index) => {
                          const landlordName = getOwnerDisplayName(payment);
                          return (
                            <tr
                              key={payment.ID || `landlord-payment-${index}`}
                              onClick={() => setSelectedOwnerForPaymentsHistory(landlordName)}
                              style={{ cursor: 'pointer' }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();setSelectedOwnerForPaymentsHistory(landlordName);}}}>
                              
                              <td><span className="sa-cell-title">{landlordName}</span></td>
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
                              <td className="table-menu" onClick={(e) => e.stopPropagation()}>
                                <div className="sa-row-actions">
                                  {(() => {
                                    const status = (payment.Status || '').toLowerCase();
                                    const isDirector = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase() === 'agency_director';
                                    const needsApproval = ['pending', 'pending approval', 'pending director approval', 'pending_approval'].includes(status);
                                    if (needsApproval && isDirector) {
                                      return (
                                        <button
                                          className="table-action-button edit"
                                          onClick={(e) => {e.stopPropagation();(async () => {
                                              try {setLoading(true);await accountingService.approveLandlordPayment(payment.ID);const updated = await accountingService.getLandlordPayments();setLandlordPayments(Array.isArray(updated) ? updated : updated?.payments ?? updated?.landlordPayments ?? []);addNotification('Payment approved by director', 'success');} catch (err) {addNotification(err.message || 'Failed to approve', 'error');} finally {setLoading(false);}
                                            })();}}
                                          title="Director: Approve Payment">
                                          
                                          Approve
                                        </button>);

                                    }
                                    if (status !== 'paid' && status !== 'completed' && !needsApproval) {
                                      return (
                                        <button
                                          className="table-action-button edit"
                                          onClick={(e) => {e.stopPropagation();transferToLandlord(payment.ID);}}
                                          title="Mark as Completed">
                                          
                                          Mark Completed
                                        </button>);

                                    }
                                    if (status === 'paid' || status === 'completed') {
                                      return (
                                        <span className="sa-status-pill success" style={{ padding: '4px 12px' }}>
                                          Completed
                                        </span>);

                                    }
                                    return <span className="sa-status-pill" style={{ padding: '4px 12px' }}>Pending Approval</span>;
                                  })()}
                                </div>
                              </td>
                            </tr>);

                        })}
                      </tbody>
                    </table>
                  </div>
                  </>;

              })()}
                </>
            }
            </div>
          }
        </div>
      </div>);

  };
  const loadReport = async () => {
    try {
      setLoading(true);
      let data = null;

      switch (selectedReportType) {
        case 'global-financial':
        case 'rent-property-management':
        case 'deposit-report':
        case 'owner-report':
        case 'sales-report':
        case 'property-report':
        case 'tax-report':
        case 'management-summary':
          data = {
            startDate: reportStartDate,
            endDate: reportEndDate,
            period: reportPeriod
          };
          break;
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
  const exportReportToCSV = () => {
    if (!reportData) return;

    let headers = [];
    let rows = [];
    let filename = '';

    switch (selectedReportType) {
      case 'payments-by-period':
        headers = ['Period', 'Total Count', 'Total Amount', 'Successful Count', 'Successful Amount', 'Failed Count', 'Failed Amount'];
        rows = (reportData.summary || []).map((item) => [
        item.period || '',
        item.totalCount || 0,
        item.totalAmount?.toFixed(2) || '0.00',
        item.successfulCount || 0,
        item.successfulAmount?.toFixed(2) || '0.00',
        item.failedCount || 0,
        item.failedAmount?.toFixed(2) || '0.00']
        );
        filename = `payments-by-period-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'commissions-by-period':
        headers = ['Period', 'Total Commission', 'Payment Count', 'Average Commission'];
        rows = (reportData.summary || []).map((item) => [
        item.period || '',
        item.totalCommission?.toFixed(2) || '0.00',
        item.paymentCount || 0,
        item.averageCommission?.toFixed(2) || '0.00']
        );
        filename = `commissions-by-period-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'refunds':
        headers = ['Tenant', 'Property', 'Amount', 'Method', 'Date', 'Status'];
        rows = (reportData.refunds || []).map((item) => [
        item.Tenant || item.tenant || '',
        item.Property || item.property || '',
        item.Amount?.toFixed(2) || '0.00',
        item.Method || item.method || '',
        item.Date ? new Date(item.Date || item.date).toLocaleDateString() : '',
        item.Status || item.status || '']
        );
        filename = `refunds-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'payments-by-building':
        headers = ['Building', 'Total Amount', 'Payment Count', 'Rent Amount', 'Deposit Amount', 'Other Amount'];
        rows = (reportData.summary || []).map((item) => [
        item.building || '',
        item.totalAmount?.toFixed(2) || '0.00',
        item.paymentCount || 0,
        item.rentAmount?.toFixed(2) || '0.00',
        item.depositAmount?.toFixed(2) || '0.00',
        item.otherAmount?.toFixed(2) || '0.00']
        );
        filename = `payments-by-building-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'payments-by-tenant':
        headers = ['Tenant', 'Property', 'Total Amount', 'Payment Count', 'Last Payment Date'];
        rows = (reportData.summary || []).map((item) => [
        item.tenant || '',
        item.property || '',
        item.totalAmount?.toFixed(2) || '0.00',
        item.paymentCount || 0,
        item.lastPaymentDate ? new Date(item.lastPaymentDate).toLocaleDateString() : '']
        );
        filename = `payments-by-tenant-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'expenses-by-period':
        headers = ['Period', 'Total Amount', 'Expense Count'];
        rows = (reportData.summary || []).map((item) => [
        item.period || '',
        item.totalAmount?.toFixed(2) || '0.00',
        item.expenseCount || 0]
        );
        filename = `expenses-by-period-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'collections-by-period':
        headers = ['Period', 'Total Amount', 'Collection Count'];
        rows = (reportData.summary || []).map((item) => [
        item.period || '',
        item.totalAmount?.toFixed(2) || '0.00',
        item.collectionCount || 0]
        );
        filename = `collections-by-period-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'building-performance':
        headers = ['Building', 'Total Collections', 'Total Expenses', 'Net Revenue', 'Occupancy Rate', 'Payment Collection Rate'];
        rows = (reportData.buildings || []).map((item) => [
        item.building || '',
        item.totalCollections?.toFixed(2) || '0.00',
        item.totalExpenses?.toFixed(2) || '0.00',
        item.netRevenue?.toFixed(2) || '0.00',
        item.occupancyRate?.toFixed(2) || '0.00',
        item.paymentCollectionRate?.toFixed(2) || '0.00']
        );
        filename = `building-performance-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      case 'payment-status':
        headers = ['Status', 'Count', 'Total Amount'];
        rows = (reportData.statusBreakdown || []).map((item) => [
        item.status || '',
        item.count || 0,
        item.totalAmount?.toFixed(2) || '0.00']
        );
        filename = `payment-status-${reportStartDate}-to-${reportEndDate}.csv`;
        break;
      default:
        return;
    }

    const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].
    join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addNotification('Report exported to CSV successfully!', 'success');
  };
  const renderTenants = () => {
    const filteredTenants = tenants.filter((tenant) => {
      if (tenantPaymentStatusFilter === 'all') {} else if (tenantPaymentStatusFilter === 'up-to-date') {
        if ((tenant.PaymentStatus || tenant.paymentStatus) !== 'up-to-date') return false;
      } else if (tenantPaymentStatusFilter === 'outstanding') {
        if ((tenant.PaymentStatus || tenant.paymentStatus) === 'up-to-date') return false;
      }
      if (tenantNameFilter.trim()) {
        const name = (tenant.TenantName || tenant.tenantName || '').toLowerCase();
        const search = tenantNameFilter.trim().toLowerCase();
        if (!name.includes(search)) return false;
      }
      return true;
    });

    const upToDateTenants = tenants.filter((t) => (t.PaymentStatus || t.paymentStatus) === 'up-to-date');
    const outstandingTenants = tenants.filter((t) => (t.PaymentStatus || t.paymentStatus) !== 'up-to-date');
    const exportToCSV = (tenantList, filename) => {
      if (tenantList.length === 0) {
        addNotification('No tenants to export', 'info');
        return;
      }

      const headers = ['Tenant Name', 'Email', 'Phone', 'Property', 'Building', 'Monthly Rent', 'Payment Status', 'Months in Arrears', 'Outstanding Amount', 'Last Payment Date', 'Next Payment Due'];
      const rows = tenantList.map((tenant) => {
        const name = tenant.TenantName || tenant.tenantName || '';
        const email = tenant.Email || tenant.email || '';
        const phone = tenant.Phone || tenant.phone || '';
        const property = tenant.Property || tenant.property || '';
        const building = tenant.Building || tenant.building || '';
        const monthlyRent = (tenant.MonthlyRent || tenant.monthlyRent || 0).toFixed(2);
        const status = tenant.PaymentStatus || tenant.paymentStatus || '';
        const arrears = (tenant.MonthsInArrears || tenant.monthsInArrears || 0).toString();
        const outstanding = (tenant.OutstandingAmount || tenant.outstandingAmount || 0).toFixed(2);
        const lastPayment = tenant.LastPaymentDate || tenant.lastPaymentDate ?
        new Date(tenant.LastPaymentDate || tenant.lastPaymentDate).toLocaleDateString() :
        'N/A';
        const nextDue = tenant.NextPaymentDue || tenant.nextPaymentDue ?
        new Date(tenant.NextPaymentDue || tenant.nextPaymentDue).toLocaleDateString() :
        'N/A';

        return [name, email, phone, property, building, monthlyRent, status, arrears, outstanding, lastPayment, nextDue];
      });

      const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].
      join('\n');

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
              <p>{t('accounting.viewAllTenants')}</p>
        </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="sa-outline-button"
                onClick={() => exportToCSV(outstandingTenants, `outstanding-tenants-${new Date().toISOString().split('T')[0]}.csv`)}
                disabled={loading || outstandingTenants.length === 0}>
                
          <Download size={18} />
                Export Outstanding
              </button>
              <button
                className="sa-outline-button"
                onClick={() => exportToCSV(upToDateTenants, `up-to-date-tenants-${new Date().toISOString().split('T')[0]}.csv`)}
                disabled={loading || upToDateTenants.length === 0}>
                
                <Download size={18} />
                Export Up-to-Date
              </button>
              <button
                className="sa-primary-cta"
                onClick={() => exportToCSV(filteredTenants, `all-tenants-${new Date().toISOString().split('T')[0]}.csv`)}
                disabled={loading || filteredTenants.length === 0}>
                
                <Download size={18} />
                Export All
        </button>
            </div>
      </div>
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
          <div className="sa-filters-section" style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={16} style={{ color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Filter by name..."
                value={tenantNameFilter}
                onChange={(e) => setTenantNameFilter(e.target.value)}
                className="sa-filter-select"
                style={{ minWidth: '200px', padding: '8px 12px' }} />
              
            </div>
            <select
              className="sa-filter-select"
              value={tenantPaymentStatusFilter}
              onChange={(e) => setTenantPaymentStatusFilter(e.target.value)}>
              
              <option value="all">All Tenants</option>
              <option value="up-to-date">Up-to-Date</option>
              <option value="outstanding">Outstanding</option>
            </select>
          </div>

          {loading ?
          <div className="loading">Loading tenants...</div> :
          filteredTenants.length === 0 ?
          <div className="no-data">No tenants found</div> :

          <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
                    <th>Tenant Name</th>
                    <th>Email</th>
                    <th>Property</th>
                    <th>Monthly Rent</th>
                    <th>Payment Status</th>
                    <th>Months in Arrears</th>
                    <th>Outstanding Amount</th>
                    <th>Last Payment</th>
            </tr>
          </thead>
          <tbody>
                  {filteredTenants.map((tenant, index) => {
                  const status = tenant.PaymentStatus || tenant.paymentStatus || 'unknown';
                  const arrears = tenant.MonthsInArrears || tenant.monthsInArrears || 0;
                  const outstanding = tenant.OutstandingAmount || tenant.outstandingAmount || 0;

                  let statusClass = 'up-to-date';
                  let statusLabel = 'Paid';
                  if (status === '1-month') {
                    statusClass = 'warning';
                    statusLabel = 'Due';
                  } else if (status === '2-months') {
                    statusClass = 'warning';
                    statusLabel = 'Overdue';
                  } else if (status === '3+months') {
                    statusClass = 'error';
                    statusLabel = 'Overdue';
                  } else if (status === 'up-to-date') {
                    statusLabel = 'Paid';
                  }

                  return (
                    <tr
                      key={tenant.TenantID || tenant.tenantId || index}
                      onClick={() => setSelectedTenant(tenant)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();setSelectedTenant(tenant);}}}
                      style={{ cursor: 'pointer' }}>
                      
                        <td><span className="sa-cell-title">{tenant.TenantName || tenant.tenantName || 'N/A'}</span></td>
                        <td>{tenant.Email || tenant.email || 'N/A'}</td>
                        <td>{tenant.Property || tenant.property || 'N/A'}</td>
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
                          {tenant.LastPaymentDate || tenant.lastPaymentDate ?
                        new Date(tenant.LastPaymentDate || tenant.lastPaymentDate).toLocaleDateString() :
                        'N/A'}
              </td>
            </tr>);

                })}
          </tbody>
        </table>
      </div>
          }
        </div>
      </div>);

  };
  const renderTenantDetail = () => {
    const t = selectedTenant;
    if (!t) {
      return (
        <div className="sa-clients-page">
          <button
            type="button"
            className="sa-outline-button sa-tenant-detail-back-btn"
            onClick={() => setSelectedTenant(null)}
            style={{ marginBottom: '16px' }}>
            
            <ArrowLeft size={16} />
            Back to list
          </button>
          <div className="sa-section-card">
            <p className="sa-cell-sub" style={{ margin: 0 }}>Tenant not found.</p>
          </div>
        </div>);

    }

    const name = t.TenantName || t.tenantName || 'N/A';
    const email = t.Email || t.email || '';
    const phone = t.Phone || t.phone || '';
    const propertyAddr = t.Property || t.property || '—';
    const building = t.Building || t.building || '';
    const monthlyRent = t.MonthlyRent ?? t.monthlyRent ?? 0;
    const paymentStatus = t.PaymentStatus || t.paymentStatus || '—';
    const arrears = t.MonthsInArrears ?? t.monthsInArrears ?? 0;
    const outstanding = t.OutstandingAmount ?? t.outstandingAmount ?? 0;
    const lastPayment = t.LastPaymentDate || t.lastPaymentDate;
    const nextDue = t.NextPaymentDue || t.nextPaymentDue;
    let statusLabel = 'Paid';
    if (paymentStatus === '1-month') statusLabel = 'Due';else
    if (paymentStatus === '2-months' || paymentStatus === '3+months') statusLabel = 'Overdue';
    const tenantPaymentsFiltered = tenantPayments.filter((p) => {
      const pTenant = (p.Tenant || p.tenant || '').toLowerCase();
      const pProperty = (p.Property || p.property || '').toLowerCase();
      const tName = (name || '').toLowerCase();
      const tProp = (propertyAddr || '').toLowerCase();
      return pTenant.includes(tName) || tName.includes(pTenant) || pProperty.includes(tProp) || tProp.includes(pProperty);
    });

    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header" style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className="sa-outline-button sa-tenant-detail-back-btn"
            onClick={() => setSelectedTenant(null)}>
            
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
              <span className={`sa-status-pill ${(statusLabel || '').toLowerCase()}`} style={{ marginRight: '8px' }}>
                {statusLabel}
              </span>
              {propertyAddr && propertyAddr !== '—' &&
              <span className="sa-tenant-detail-meta">
                  <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {propertyAddr}{building ? ` · ${building}` : ''}
                </span>
              }
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
              {email &&
              <div>
                  <dt>Email</dt>
                  <dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} /> {email}
                  </dd>
                </div>
              }
              {phone &&
              <div>
                  <dt>Phone</dt>
                  <dd style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} /> {phone}
                  </dd>
                </div>
              }
              <div>
                <dt>Payment status</dt>
                <dd>
                  <span className={`sa-status-pill ${(statusLabel || '').toLowerCase()}`}>{statusLabel}</span>
                </dd>
              </div>
              <div>
                <dt>Months in arrears</dt>
                <dd>{arrears}</dd>
              </div>
            </dl>
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
              {building &&
              <div>
                  <dt>Building</dt>
                  <dd>{building}</dd>
                </div>
              }
              <div>
                <dt>Monthly rent</dt>
                <dd className="sa-tenant-detail-value-bold">{Number(monthlyRent).toLocaleString()} XOF</dd>
              </div>
              <div>
                <dt>Outstanding amount</dt>
                <dd style={{ color: outstanding > 0 ? '#dc2626' : '#059669', fontWeight: '600' }}>
                  {Number(outstanding).toLocaleString()} XOF
                </dd>
              </div>
              <div>
                <dt>Last payment</dt>
                <dd>{lastPayment ? new Date(lastPayment).toLocaleDateString() : '—'}</dd>
              </div>
              {nextDue &&
              <div>
                  <dt>Next payment due</dt>
                  <dd>{new Date(nextDue).toLocaleDateString()}</dd>
                </div>
              }
            </dl>
          </div>

          <div className="sa-section-card sa-tenant-detail-card" style={{ gridColumn: '1 / -1' }}>
            <h3>
              <Receipt size={18} />
              Recent payment history
            </h3>
            {tenantPaymentsFiltered.length > 0 ?
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tenantPaymentsFiltered.slice(0, 10).map((p, idx) =>
              <li key={p.ID || p.id || idx} className="sa-tenant-detail-alert-item" style={{ borderLeftColor: (p.Status || p.status) === 'Approved' ? '#16a34a' : '#f59e0b' }}>
                    <div className="sa-tenant-detail-alert-title">
                      {Number(p.Amount ?? p.amount ?? 0).toLocaleString()} XOF · {p.ChargeType || p.chargeType || '—'} · {p.Status || p.status || '—'}
                    </div>
                    <div className="sa-tenant-detail-alert-meta">
                      {p.Date ? new Date(p.Date).toLocaleDateString() : p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString() : '—'}
                      {(p.Method || p.method) && ` · ${p.Method || p.method}`}
                    </div>
                  </li>
              )}
              </ul> :

            <p className="sa-cell-sub">No payment history for this tenant.</p>
            }
          </div>
        </div>
      </div>);

  };
  const renderDeposits = () => {
    const filteredDeposits = deposits.filter((deposit) => {
      if (depositFilter !== 'all' && (deposit.Type || deposit.type) !== depositFilter) return false;
      const d = deposit.CreatedAt || deposit.createdAt;
      if (!d) return true;
      const date = new Date(d);
      if (depositStartDateFilter && date < new Date(depositStartDateFilter)) return false;
      if (depositEndDateFilter && date > new Date(depositEndDateFilter + 'T23:59:59')) return false;
      return true;
    });

    const paymentDeposits = deposits.filter((d) => (d.Type || d.type) === 'payment');
    const refundDeposits = deposits.filter((d) => (d.Type || d.type) === 'refund');
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
                disabled={loading || paymentDeposits.length === 0}>
                
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
                disabled={loading}>
                
                <Plus size={18} />
                Record Deposit Payment
              </button>
            </div>
          </div>
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
          <div className="sa-filters-section" style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="sa-filter-select"
              value={depositFilter}
              onChange={(e) => setDepositFilter(e.target.value)}>
              
              <option value="all">All Deposits</option>
              <option value="payment">Payments Only</option>
              <option value="refund">Refunds Only</option>
            </select>
            <input
              type="date"
              className="sa-filter-select"
              value={depositStartDateFilter}
              onChange={(e) => setDepositStartDateFilter(e.target.value)}
              placeholder="Start Date" />
            
            <input
              type="date"
              className="sa-filter-select"
              value={depositEndDateFilter}
              onChange={(e) => setDepositEndDateFilter(e.target.value)}
              placeholder="End Date" />
            
            <button
              className="sa-outline-button"
              onClick={() => {
                const filtered = filteredDeposits;
                const headers = ['Date', 'Tenant', 'Property', 'Type', 'Monthly Rent', 'Months', 'Amount', 'Method', 'Reference', 'Status'];
                const rows = filtered.map((d) => [
                d.CreatedAt || d.createdAt ? new Date(d.CreatedAt || d.createdAt).toLocaleDateString() : '',
                d.Tenant || d.tenant || '',
                d.Property || d.property || '',
                (d.Type || d.type) === 'payment' ? 'Payment' : 'Refund',
                (d.MonthlyRent || d.monthlyRent || 0).toFixed(2),
                d.MonthsMultiplier || d.monthsMultiplier || 0,
                (d.Amount || d.amount || 0).toFixed(2),
                d.PaymentMethod || d.paymentMethod || d.RefundMethod || d.refundMethod || '',
                d.Reference || d.reference || '',
                d.Status || d.status || '']
                );
                const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
                const a = document.createElement('a');
                a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
                a.download = `deposits-${depositStartDateFilter || 'all'}-to-${depositEndDateFilter || 'all'}.csv`;
                a.click();
                addNotification('Deposits exported to CSV', 'success');
              }}
              disabled={filteredDeposits.length === 0}>
              
              <Download size={16} />
              Export
            </button>
      </div>

      {loading ?
          <div className="loading">Loading deposits...</div> :
          filteredDeposits.length === 0 ?
          <div className="no-data">No deposits found</div> :

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
                          {deposit.CreatedAt || deposit.createdAt ?
                        new Date(deposit.CreatedAt || deposit.createdAt).toLocaleDateString() :
                        'N/A'}
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
                      </tr>);

                })}
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>);

  };
  const depositModals =
  <>
      {showDepositPaymentModal &&
    <div className="modal-overlay" onClick={() => setShowDepositPaymentModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{t('accounting.recordSecurityDepositPayment')}</h3>
                <button className="modal-close" onClick={() => setShowDepositPaymentModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              setLoading(true);
              const depositAmount = Number(depositPaymentForm.depositAmount || 0);
              await accountingService.recordDepositPayment({
                ...depositPaymentForm,
                monthlyRent: parseFloat(depositPaymentForm.monthlyRent),
                amount: depositAmount > 0 ? depositAmount : parseFloat(depositPaymentForm.monthlyRent) * 4.5,
                monthsMultiplier: 4.5
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
              loadDepositRefundsPending();
            } catch (error) {
              console.error('Error recording deposit payment:', error);
              addNotification(error.message || 'Failed to record deposit payment', 'error');
            } finally {
              setLoading(false);
            }
          }}>
                  <div className="form-group">
                    <label htmlFor="depositTenant">Tenant Name *</label>
                    <select
                id="depositTenant"
                value={depositPaymentForm.tenant}
                onChange={(e) => {
                  const name = e.target.value;
                  const t = tenants.find((x) => (x.tenantName || x.TenantName) === name);
                  setDepositPaymentForm({
                    ...depositPaymentForm,
                    tenant: name,
                    property: t ? t.property || t.Property || '' : ''
                  });
                }}
                required>
                
                      <option value="">Select tenant (with property)</option>
                      {tenants.filter((t) => t.property || t.Property).map((t) => {
                  const name = t.tenantName || t.TenantName || '';
                  return <option key={name} value={name}>{name} – {t.property || t.Property}</option>;
                })}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="depositProperty">Property *</label>
                    <input
                type="text"
                id="depositProperty"
                value={depositPaymentForm.property}
                onChange={(e) => setDepositPaymentForm({ ...depositPaymentForm, property: e.target.value })}
                required
                placeholder="Auto-filled when selecting tenant" />
              
                  </div>

                  <div className="form-group">
                    <label htmlFor="depositTenantType">Tenant Type *</label>
                    <select
                id="depositTenantType"
                value={depositPaymentForm.tenantType}
                onChange={(e) => setDepositPaymentForm({ ...depositPaymentForm, tenantType: e.target.value })}
                required>
                
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                    </select>
                    <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                      4.5 months deposit for all properties
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="depositMonthlyRent">Monthly Rent (XOF) *</label>
                    <input
                type="number"
                id="depositMonthlyRent"
                step="0.01"
                value={depositPaymentForm.monthlyRent}
                onChange={(e) => setDepositPaymentForm({ ...depositPaymentForm, monthlyRent: e.target.value })}
                required
                placeholder="0.00" />
              
                    {depositPaymentForm.monthlyRent &&
              <small style={{ color: '#059669', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                        Deposit Amount: {(parseFloat(depositPaymentForm.monthlyRent) * 4.5).toFixed(2)} XOF
                      </small>
              }
                  </div>

                  <div className="form-group">
                    <label htmlFor="depositPaymentMethod">Payment Method *</label>
                    <select
                id="depositPaymentMethod"
                value={depositPaymentForm.paymentMethod}
                onChange={(e) => setDepositPaymentForm({ ...depositPaymentForm, paymentMethod: e.target.value })}
                required>
                
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="depositReference">Reference</label>
                    <input
                type="text"
                id="depositReference"
                value={depositPaymentForm.reference}
                onChange={(e) => setDepositPaymentForm({ ...depositPaymentForm, reference: e.target.value })}
                placeholder="Payment reference number" />
              
                  </div>

                  <div className="form-group">
                    <label htmlFor="depositNotes">Notes</label>
                    <textarea
                id="depositNotes"
                value={depositPaymentForm.notes}
                onChange={(e) => setDepositPaymentForm({ ...depositPaymentForm, notes: e.target.value })}
                placeholder="Additional notes"
                rows="3" />
              
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="action-button secondary" onClick={() => setShowDepositPaymentModal(false)}>
                      {t('accounting.cancel')}
                    </button>
                    <button type="submit" className="action-button primary" disabled={loading}>
                      {loading ? t('accounting.recording') : t('accounting.recordPayment')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
    }
        {showProcessDepositModal && processDepositItem &&
    <div className="modal-overlay" onClick={() => {setShowProcessDepositModal(false);setProcessDepositItem(null);setProcessDepositManualAmount('');}}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="modal-header">
                <h3>Process Deposit Refund</h3>
                <button className="modal-close" onClick={() => {setShowProcessDepositModal(false);setProcessDepositItem(null);setProcessDepositManualAmount('');}}>×</button>
              </div>
              <div className="modal-body">
                {(() => {
            const depositAmt = (processDepositItem.depositAmount || 0) > 0 ?
            processDepositItem.depositAmount :
            parseFloat(processDepositManualAmount) || 0;
            const repairAmt = processDepositItem.repairCost || 0;
            const refundAmt = Math.max(0, depositAmt - repairAmt);
            return (
              <>
                      <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600' }}>Refund calculation</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', lineHeight: 1.6 }}>
                          <div><strong>Tenant:</strong> {processDepositItem.tenant || '—'}</div>
                          <div><strong>Property:</strong> {processDepositItem.property || '—'}</div>
                          {(processDepositItem.depositAmount || 0) <= 0 ?
                    <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>Deposit amount (XOF) *</label>
                              <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={processDepositManualAmount}
                        onChange={(e) => setProcessDepositManualAmount(e.target.value)}
                        placeholder="Enter deposit amount"
                        style={{ width: '100%', padding: '8px 12px' }} />
                      
                            </div> :

                    <div><strong>Deposit amount:</strong> {depositAmt.toFixed(2)} XOF</div>
                    }
                          <div><strong>Repair cost (deducted):</strong> {repairAmt.toFixed(2)} XOF</div>
                          <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '1.1rem', fontWeight: '600', color: '#059669' }}>
                            Amount to refund: {refundAmt.toFixed(2)} XOF
                          </div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' }}>
                        Approve to record the deposit and process the refund. Deny to cancel.
                      </p>
                      <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                    type="button"
                    className="action-button secondary"
                    onClick={() => {setShowProcessDepositModal(false);setProcessDepositItem(null);setProcessDepositManualAmount('');}}>
                    
                          Deny
                        </button>
                        <button
                    type="button"
                    className="action-button primary"
                    disabled={loading || depositAmt <= 0}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const monthlyRent = depositAmt / 4.5;
                        const depositRes = await accountingService.recordDepositPayment({
                          tenant: processDepositItem.tenant,
                          property: processDepositItem.property,
                          tenantType: 'individual',
                          monthlyRent,
                          amount: depositAmt,
                          paymentMethod: 'mobile_money',
                          reference: '',
                          notes: 'Recorded via Process deposit refund'
                        });
                        const newDepositId = depositRes?.ID ?? depositRes?.id;
                        if (newDepositId) {
                          await accountingService.processDepositRefund({
                            depositId: newDepositId,
                            refundAmount: refundAmt,
                            refundMethod: 'mobile_money',
                            refundAccount: '',
                            notes: ''
                          });
                        }
                        addNotification('Deposit recorded and refund processed successfully!', 'success');
                        setShowProcessDepositModal(false);
                        setProcessDepositItem(null);
                        setProcessDepositManualAmount('');
                        await loadDeposits();
                        loadDepositRefundsPending();
                        try {
                          const overview = await accountingService.getOverview();
                          setOverviewData(overview);
                        } catch (err) {console.error(err);}
                      } catch (error) {
                        console.error('Error processing deposit refund:', error);
                        addNotification(error.message || 'Failed to process deposit refund', 'error');
                      } finally {
                        setLoading(false);
                      }
                    }}>
                    
                          {loading ? 'Processing...' : 'Approve'}
                        </button>
                      </div>
                    </>);

          })()}
              </div>
            </div>
          </div>
    }
        {showDepositRefundModal &&
    <div className="modal-overlay" onClick={() => setShowDepositRefundModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{t('accounting.processSecurityDepositRefund')}</h3>
                <button className="modal-close" onClick={() => setShowDepositRefundModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              setLoading(true);
              const payload = {
                depositId: parseInt(depositRefundForm.depositId),
                refundMethod: depositRefundForm.refundMethod,
                refundAccount: depositRefundForm.refundAccount,
                notes: depositRefundForm.notes
              };
              if (depositRefundForm.refundAmount != null && depositRefundForm.refundAmount >= 0) {
                payload.refundAmount = depositRefundForm.refundAmount;
              }
              await accountingService.processDepositRefund(payload);
              addNotification('Security deposit refund processed successfully!', 'success');
              setShowDepositRefundModal(false);
              setDepositRefundForm({
                depositId: '',
                refundAmount: null,
                depositAmount: 0,
                repairCost: 0,
                tenant: '',
                property: '',
                refundMethod: 'mobile_money',
                refundAccount: '',
                notes: ''
              });
              await loadDeposits();
              loadDepositRefundsPending();
              try {
                const overview = await accountingService.getOverview();
                setOverviewData(overview);
              } catch (err) {
                console.error('Error refreshing overview:', err);
              }
            } catch (error) {
              console.error('Error processing deposit refund:', error);
              addNotification(error.message || 'Failed to process deposit refund', 'error');
            } finally {
              setLoading(false);
            }
          }}>
                  {depositRefundForm.depositId && depositRefundForm.refundAmount != null ?
            <div className="form-group" style={{ padding: '16px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Refund Summary</h4>
                      <p style={{ margin: '4px 0' }}><strong>Tenant:</strong> {depositRefundForm.tenant || '—'}</p>
                      <p style={{ margin: '4px 0' }}><strong>Property:</strong> {depositRefundForm.property || '—'}</p>
                      <p style={{ margin: '4px 0' }}><strong>Deposit Amount:</strong> {(depositRefundForm.depositAmount || 0).toFixed(2)} XOF</p>
                      <p style={{ margin: '4px 0' }}><strong>Repair Cost (deducted):</strong> {(depositRefundForm.repairCost || 0).toFixed(2)} XOF</p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#059669' }}>
                        Amount to Refund: {(depositRefundForm.refundAmount || 0).toFixed(2)} XOF
                      </p>
                    </div> :

            <div className="form-group">
                      <label htmlFor="refundDepositId">Select Deposit to Refund *</label>
                      <select
                id="refundDepositId"
                value={depositRefundForm.depositId}
                onChange={(e) => setDepositRefundForm({ ...depositRefundForm, depositId: e.target.value })}
                required>
                
                        <option value="">Select Deposit</option>
                        {deposits.
                filter((d) => {
                  const type = (d.Type || d.type || '').toLowerCase();
                  return type === 'payment';
                }).
                filter((deposit) => {
                  const refunded = deposits.some((r) => {
                    const refundType = (r.Type || r.type || '').toLowerCase();
                    return refundType === 'refund' &&
                    (r.Tenant || r.tenant) === (deposit.Tenant || deposit.tenant) &&
                    (r.Property || r.property) === (deposit.Property || deposit.property);
                  });
                  return !refunded;
                }).
                map((deposit) =>
                <option key={deposit.ID || deposit.id} value={deposit.ID || deposit.id}>
                              {deposit.Tenant || deposit.tenant} - {deposit.Property || deposit.property} -
                              {(deposit.Amount || deposit.amount || 0).toFixed(2)} XOF
                            </option>
                )}
                      </select>
                    </div>
            }

                  <div className="form-group">
                    <label htmlFor="refundMethod">Refund Method *</label>
                    <select
                id="refundMethod"
                value={depositRefundForm.refundMethod}
                onChange={(e) => setDepositRefundForm({ ...depositRefundForm, refundMethod: e.target.value })}
                required>
                
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="refundAccount">Refund Account Details *</label>
                    <input
                type="text"
                id="refundAccount"
                value={depositRefundForm.refundAccount}
                onChange={(e) => setDepositRefundForm({ ...depositRefundForm, refundAccount: e.target.value })}
                required
                placeholder="Phone number, bank account, or cash recipient name" />
              
                  </div>

                  <div className="form-group">
                    <label htmlFor="refundNotes">Notes</label>
                    <textarea
                id="refundNotes"
                value={depositRefundForm.notes}
                onChange={(e) => setDepositRefundForm({ ...depositRefundForm, notes: e.target.value })}
                placeholder="Additional notes about the refund"
                rows="3" />
              
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="action-button secondary" onClick={() => setShowDepositRefundModal(false)}>
                      {t('accounting.cancel')}
                    </button>
                    <button type="submit" className="action-button primary" disabled={loading}>
                      {loading ? 'Processing...' : 'Process Refund'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
    }
    </>;

  const renderDepositRefunds = () => {
    const processedRefunds = deposits.filter((d) => {
      const type = (d.Type || d.type || '').toLowerCase();
      return type === 'refund';
    });

    return (
      <div>
        <div className="sa-section-card">
          <div className="sa-section-header">
            <div>
              <h2>Deposit Refunds</h2>
              <p>Tenants with completed state of exit. Process refunds after deducting repair costs.</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Pending Refunds</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#d97706' }}>
                {pendingRefunds.length}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                State of exit completed
              </p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Processed Refunds</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#059669' }}>
                {processedRefunds.length}
              </p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #93c5fd' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Refunded</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#0284c7' }}>
                {processedRefunds.reduce((sum, d) => sum + (d.Amount || d.amount || 0), 0).toFixed(2)} XOF
              </p>
            </div>
          </div>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '16px' }}>Pending Refund Requests</h3>
            <p style={{ marginBottom: '16px', color: '#6b7280', fontSize: '0.875rem' }}>
              Only tenants for whom the technician has completed the state of exit appear here. The refund amount is calculated as deposit minus repair costs.
            </p>
            {loading ?
            <div className="loading">Loading refund requests...</div> :
            pendingRefunds.length === 0 ?
            <div className="no-data">No pending refund requests. Tenants will appear here after the technician completes the state of exit.</div> :

            <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Property</th>
                      <th>Deposit Amount</th>
                      <th>Repair Cost</th>
                      <th>Refund Amount</th>
                      <th>Exit Date</th>
                      <th className="table-menu">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRefunds.map((item, index) => {
                    const depositAmount = item.depositAmount ?? item.DepositAmount ?? 0;
                    const repairCost = item.repairCost ?? item.RepairCost ?? 0;
                    const refundAmount = item.refundAmount ?? item.RefundAmount ?? Math.max(0, depositAmount - repairCost);
                    const needsDeposit = item.needsDeposit === true;
                    const depositId = item.depositId ?? item.depositID ?? 0;
                    return (
                      <tr key={depositId || `refund-request-${index}`}>
                          <td>
                            <span className="sa-cell-title">{item.tenant || item.Tenant || 'N/A'}</span>
                          </td>
                          <td>{item.property || item.Property || 'N/A'}</td>
                          <td>{depositAmount > 0 ? `${depositAmount.toFixed(2)} XOF` : needsDeposit ? 'Not recorded' : '—'}</td>
                          <td>{repairCost.toFixed(2)} XOF</td>
                          <td><strong>{depositAmount > 0 ? `${Math.max(0, refundAmount).toFixed(2)} XOF` : needsDeposit ? '—' : '—'}</strong></td>
                          <td>{item.exitInventoryDate ? new Date(item.exitInventoryDate).toLocaleDateString() : item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</td>
                          <td className="table-menu">
                            <div className="sa-row-actions">
                              {needsDeposit ?
                            <button
                              className="table-action-button edit"
                              onClick={() => {
                                setProcessDepositItem({
                                  tenant: item.tenant || item.Tenant,
                                  property: item.property || item.Property,
                                  depositAmount,
                                  repairCost,
                                  refundAmount: Math.max(0, depositAmount - repairCost),
                                  exitInventoryDate: item.exitInventoryDate
                                });
                                setShowProcessDepositModal(true);
                              }}>
                              
                                  Process deposit
                                </button> :

                            <button
                              className="table-action-button edit"
                              onClick={() => {
                                setDepositRefundForm({
                                  depositId: depositId,
                                  refundAmount: Math.max(0, refundAmount),
                                  depositAmount,
                                  repairCost,
                                  tenant: item.tenant || item.Tenant,
                                  property: item.property || item.Property,
                                  refundMethod: 'mobile_money',
                                  refundAccount: '',
                                  notes: ''
                                });
                                setShowDepositRefundModal(true);
                              }}>
                              
                                  Process Refund
                                </button>
                            }
                            </div>
                          </td>
                        </tr>);

                  })}
                  </tbody>
                </table>
              </div>
            }
          </div>
          <div>
            <h3 style={{ marginBottom: '16px' }}>Processed Refunds</h3>
            {processedRefunds.length === 0 ?
            <div className="no-data">No processed refunds</div> :

            <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Property</th>
                      <th>Refund Amount</th>
                      <th>Refund Method</th>
                      <th>Refund Date</th>
                      <th>Status</th>
                      <th className="table-menu">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedRefunds.map((refund, index) =>
                  <tr key={refund.ID || `refund-${index}`}>
                        <td>
                          <span className="sa-cell-title">{refund.Tenant || 'N/A'}</span>
                        </td>
                        <td>{refund.Property || 'N/A'}</td>
                        <td>{(refund.Amount || refund.amount || 0).toFixed(2)} XOF</td>
                        <td>{refund.RefundMethod || refund.refundMethod || 'N/A'}</td>
                        <td>{refund.RefundedAt || refund.refundedAt ? new Date(refund.RefundedAt || refund.refundedAt).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <span className="sa-status-pill success">Refunded</span>
                        </td>
                        <td className="table-menu">
                          <button
                        className="table-action-button edit"
                        onClick={() => printRefundReceipt(refund)}
                        title="Download Receipt">
                        
                            <Download size={14} />
                            Receipt
                          </button>
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      </div>);

  };
  const renderStatesTaxes = () => {
    return (
      <div>
        <div className="sa-section-card">
          <div className="sa-section-header">
            <div>
              <h2>Daily Report</h2>
              <p>Daily accounting overview</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }} />
              
              <button className="sa-primary-cta" onClick={() => {
                addNotification('Monthly statement generation coming soon', 'info');
              }}>
                <Download size={18} />
                Generate Statement
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={{ padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #93c5fd' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Declared Turnover</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#0284c7' }}>
                {overviewData?.totalCollectedThisMonth?.toFixed(2) || '0.00'} XOF
              </p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Deductible Expenses</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#dc2626' }}>
                {overviewData?.totalExpensesThisMonth?.toFixed(2) || '0.00'} XOF
              </p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Taxable Income</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#059669' }}>
                {((overviewData?.totalCollectedThisMonth || 0) - (overviewData?.totalExpensesThisMonth || 0)).toFixed(2)} XOF
              </p>
            </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Monthly Financial Statement</h3>
            <div className="sa-table-wrapper">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount (XOF)</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total Revenue</td>
                    <td>{overviewData?.totalCollectedThisMonth?.toFixed(2) || '0.00'}</td>
                    <td>All collected payments</td>
                  </tr>
                  <tr>
                    <td>Total Expenses</td>
                    <td>{overviewData?.totalExpensesThisMonth?.toFixed(2) || '0.00'}</td>
                    <td>All recorded expenses</td>
                  </tr>
                  <tr>
                    <td>Net Profit</td>
                    <td>{((overviewData?.totalCollectedThisMonth || 0) - (overviewData?.totalExpensesThisMonth || 0)).toFixed(2)}</td>
                    <td>Revenue minus expenses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Tax Records</h3>
              <button
                className="sa-primary-cta"
                onClick={() => {
                  setShowExpenseModal(true);
                }}>
                
                <Plus size={18} />
                Add Tax Record
              </button>
            </div>
            {expenses.filter((e) => (e.Category || e.category) === 'Taxes').length === 0 ?
            <div className="no-data">No tax records found</div> :

            <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Property</th>
                      <th>Tax Type</th>
                      <th>Amount</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.filter((e) => (e.Category || e.category) === 'Taxes').map((tax, index) =>
                  <tr key={tax.ID || tax.id || index}>
                        <td>{tax.Date ? new Date(tax.Date).toLocaleDateString() : tax.date ? new Date(tax.date).toLocaleDateString() : 'N/A'}</td>
                        <td>{tax.Building || tax.building || 'Company-wide'}</td>
                        <td>{tax.Notes || tax.notes || 'Tax Payment'}</td>
                        <td>{(tax.Amount || tax.amount || 0).toFixed(2)} XOF</td>
                        <td>{tax.Notes || tax.notes || '-'}</td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            }
          </div>
          <div>
            <h3 style={{ marginBottom: '16px' }}>Declaration History</h3>
            <div className="no-data">No declaration history available</div>
          </div>
        </div>
      </div>);

  };

  const renderReports = () => {
    const reportTypes = [
    { value: 'global-financial', label: 'Global Financial Report' },
    { value: 'rent-property-management', label: 'Rent & Property Management' },
    { value: 'deposit-report', label: 'Deposit Report' },
    { value: 'owner-report', label: 'Owner Report' },
    { value: 'sales-report', label: 'Sales Report' },
    { value: 'property-report', label: 'Property Report' },
    { value: 'tax-report', label: 'Tax Report' },
    { value: 'management-summary', label: 'Management Summary' },
    { value: 'payments-by-period', label: t('accounting.paymentsByPeriod') },
    { value: 'commissions-by-period', label: t('accounting.commissionsByPeriod') },
    { value: 'refunds', label: t('accounting.refundsReport') },
    { value: 'payments-by-building', label: t('accounting.paymentsByBuilding') },
    { value: 'payments-by-tenant', label: t('accounting.paymentsByTenant') },
    { value: 'expenses-by-period', label: t('accounting.expensesByPeriod') },
    { value: 'collections-by-period', label: t('accounting.collectionsByPeriod') },
    { value: 'building-performance', label: t('accounting.buildingPerformance') },
    { value: 'payment-status', label: t('accounting.paymentStatusBreakdown') }];


    return (
      <div>
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
              <h2>Financial Reports</h2>
              <p>Generate comprehensive reports on payments, commissions, refunds, and more</p>
        </div>
          </div>
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
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  
                  {reportTypes.map((type) =>
                  <option key={type.value} value={type.value}>{type.label}</option>
                  )}
                </select>
              </div>

              {(selectedReportType === 'payments-by-period' || selectedReportType === 'commissions-by-period') &&
              <div className="form-group">
                  <label>Period</label>
                  <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              }

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="sa-primary-cta"
                onClick={loadReport}
                disabled={loading}>
                
                Generate Report
              </button>
              {reportData &&
              <button
                className="sa-outline-button"
                onClick={exportReportToCSV}
                disabled={loading}>
                
          <Download size={18} />
                  Export to CSV
        </button>
              }
            </div>
      </div>
          {loading ?
          <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Generating report...</div> :
          reportData ?
          <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '8px' }}>
                  {reportTypes.find((t) => t.value === selectedReportType)?.label}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  Period: {reportData.startDate} to {reportData.endDate}
                  {reportData.period && ` | Grouped by: ${reportData.period}`}
                </p>
              </div>
              {selectedReportType === 'payments-by-period' && renderPaymentsByPeriodReport()}
              {selectedReportType === 'commissions-by-period' && renderCommissionsByPeriodReport()}
              {selectedReportType === 'refunds' && renderRefundsReport()}
              {selectedReportType === 'payments-by-building' && renderPaymentsByBuildingReport()}
              {selectedReportType === 'payments-by-tenant' && renderPaymentsByTenantReport()}
              {selectedReportType === 'expenses-by-period' && renderExpensesByPeriodReport()}
              {selectedReportType === 'collections-by-period' && renderCollectionsByPeriodReport()}
              {selectedReportType === 'building-performance' && renderBuildingPerformanceReport()}
              {selectedReportType === 'payment-status' && renderPaymentStatusReport()}
            </div> :

          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              Select filters and click "Generate Report" to view report data
            </div>
          }
        </div>
      </div>);

  };
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
            {reportData.summary.map((item, index) =>
            <tr key={index}>
                <td>{item.period}</td>
                <td>{item.totalCount || 0}</td>
                <td>{(item.totalAmount || 0).toFixed(2)} XOF</td>
                <td>{item.successfulCount || 0}</td>
                <td>{(item.successfulAmount || 0).toFixed(2)} XOF</td>
                <td>{item.failedCount || 0}</td>
                <td>{(item.failedAmount || 0).toFixed(2)} XOF</td>
            </tr>
            )}
          </tbody>
        </table>
      </div>);

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
            {reportData.summary.map((item, index) =>
            <tr key={index}>
                <td>{item.period}</td>
                <td>{(item.totalCommission || 0).toFixed(2)} XOF</td>
                <td>{item.paymentCount || 0}</td>
                <td>{(item.averageCommission || 0).toFixed(2)} XOF</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>);

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
              {(reportData.refunds || []).map((refund, index) =>
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
              )}
          </tbody>
        </table>
                  </div>
      </div>);

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
            {reportData.summary.map((item, index) =>
            <tr key={index}>
                <td><span className="sa-cell-title">{item.building || 'N/A'}</span></td>
                <td>{(item.totalAmount || 0).toFixed(2)} XOF</td>
                <td>{item.paymentCount || 0}</td>
                <td>{(item.rentAmount || 0).toFixed(2)} XOF</td>
                <td>{(item.depositAmount || 0).toFixed(2)} XOF</td>
                <td>{(item.otherAmount || 0).toFixed(2)} XOF</td>
              </tr>
            )}
            </tbody>
          </table>
        </div>);

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
            {reportData.summary.map((item, index) =>
            <tr key={index}>
                <td><span className="sa-cell-title">{item.tenant || 'N/A'}</span></td>
                <td>{item.property || 'N/A'}</td>
                <td>{(item.totalAmount || 0).toFixed(2)} XOF</td>
                <td>{item.paymentCount || 0}</td>
                <td>{item.lastPaymentDate ? new Date(item.lastPaymentDate).toLocaleDateString() : 'N/A'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>);

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
              {(reportData.summary || []).map((item, index) =>
              <tr key={index}>
                  <td>{item.period}</td>
                  <td>{(item.totalAmount || 0).toFixed(2)} XOF</td>
                  <td>{item.expenseCount || 0}</td>
                </tr>
              )}
            </tbody>
          </table>
                  </div>
        {reportData.byCategory && Object.keys(reportData.byCategory).length > 0 &&
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
                  {Object.entries(reportData.byCategory).map(([category, amount]) =>
                <tr key={category}>
                      <td>{category}</td>
                      <td>{amount.toFixed(2)} XOF</td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
        </div>
        }
    </div>);

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
            {reportData.summary.map((item, index) =>
            <tr key={index}>
                <td>{item.period}</td>
                <td>{(item.totalAmount || 0).toFixed(2)} XOF</td>
                <td>{item.collectionCount || 0}</td>
              </tr>
            )}
          </tbody>
        </table>
                  </div>);

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
            {reportData.buildings.map((item, index) =>
            <tr key={index}>
                <td><span className="sa-cell-title">{item.building || 'N/A'}</span></td>
                <td>{(item.totalCollections || 0).toFixed(2)} XOF</td>
                <td>{(item.totalExpenses || 0).toFixed(2)} XOF</td>
                <td>{(item.netRevenue || 0).toFixed(2)} XOF</td>
                <td>{(item.occupancyRate || 0).toFixed(2)}%</td>
                <td>{(item.paymentCollectionRate || 0).toFixed(2)}%</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>);

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
            {reportData.statusBreakdown.map((item, index) =>
            <tr key={index}>
                <td>
                  <span className={`sa-status-pill ${(item.status || '').toLowerCase()}`}>
                    {item.status || 'N/A'}
                  </span>
                </td>
                <td>{item.count || 0}</td>
                <td>{(item.totalAmount || 0).toFixed(2)} XOF</td>
              </tr>
            )}
            </tbody>
          </table>
    </div>);

  };
  const renderGlobalFinancialReport = () => {
    if (!reportData) return null;
    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Total Revenue</th>
              <th>Total Expenses</th>
              <th>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Overall</td>
              <td>{(overviewData?.totalCollectedThisMonth || 0).toFixed(2)} XOF</td>
              <td>{(overviewData?.totalExpensesThisMonth || 0).toFixed(2)} XOF</td>
              <td>{((overviewData?.totalCollectedThisMonth || 0) - (overviewData?.totalExpensesThisMonth || 0)).toFixed(2)} XOF</td>
            </tr>
          </tbody>
        </table>
      </div>);

  };

  const renderRentPropertyManagementReport = () => {
    if (!reportData) return null;
    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Rent Collected</th>
              <th>Occupancy Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {collections.filter((c) => (c.ChargeType || c.chargeType) === 'Rent').map((collection, index) =>
            <tr key={index}>
                <td>{collection.Building || collection.building || 'N/A'}</td>
                <td>{(collection.Amount || collection.amount || 0).toFixed(2)} XOF</td>
                <td>85%</td>
                <td>
                  <span className={`sa-status-pill ${(collection.Status || 'unknown').toLowerCase()}`}>
                    {collection.Status || 'Unknown'}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>);

  };

  const renderDepositReport = () => {
    if (!reportData) return null;
    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Property</th>
              <th>Deposit Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {collections.filter((c) => (c.ChargeType || c.chargeType) === 'Deposit').map((collection, index) =>
            <tr key={index}>
                <td>-</td>
                <td>{collection.Building || collection.building || 'N/A'}</td>
                <td>{(collection.Amount || collection.amount || 0).toFixed(2)} XOF</td>
                <td>{collection.Date ? new Date(collection.Date).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <span className={`sa-status-pill ${(collection.Status || 'unknown').toLowerCase()}`}>
                    {collection.Status || 'Unknown'}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>);

  };

  const renderOwnerReport = () => {
    if (!reportData) return null;
    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Owner</th>
              <th>Properties</th>
              <th>Total Paid</th>
              <th>Pending</th>
            </tr>
          </thead>
          <tbody>
            {landlordPayments.map((payment, index) =>
            <tr key={index}>
                <td>{payment.Landlord || payment.landlord || 'N/A'}</td>
                <td>{payment.Building || payment.building || 'N/A'}</td>
                <td>{(payment.NetAmount || payment.netAmount || 0).toFixed(2)} XOF</td>
                <td>
                  {(payment.Status || '').toLowerCase() === 'paid' ? '0.00' : (payment.NetAmount || payment.netAmount || 0).toFixed(2)} XOF
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>);

  };

  const renderSalesReport = () => {
    if (!reportData) return null;
    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Sale Amount</th>
              <th>Commission</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {collections.filter((c) => (c.ChargeType || c.chargeType) === 'Sale').map((collection, index) =>
            <tr key={index}>
                <td>{collection.Building || collection.building || 'N/A'}</td>
                <td>{(collection.Amount || collection.amount || 0).toFixed(2)} XOF</td>
                <td>{(collection.Commission ?? collection.commission ?? 0).toFixed(2)} XOF</td>
                <td>{collection.Date ? new Date(collection.Date).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <span className={`sa-status-pill ${(collection.Status || 'unknown').toLowerCase()}`}>
                    {collection.Status || 'Unknown'}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>);

  };

  const renderPropertyReport = () => {
    if (!reportData) return null;
    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Owner</th>
              <th>Total Revenue</th>
              <th>Expenses</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((collection, index) =>
            <tr key={index}>
                <td>{collection.Building || collection.building || 'N/A'}</td>
                <td>{collection.Landlord || collection.landlord || 'N/A'}</td>
                <td>{(collection.Amount || collection.amount || 0).toFixed(2)} XOF</td>
                <td>-</td>
                <td>{(collection.Amount || collection.amount || 0).toFixed(2)} XOF</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>);

  };

  const renderTaxReport = () => {
    if (!reportData) return null;
    const taxableIncome = (overviewData?.totalCollectedThisMonth || 0) - (overviewData?.totalExpensesThisMonth || 0);
    return (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount (XOF)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Declared Turnover</td>
              <td>{(overviewData?.totalCollectedThisMonth || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Deductible Expenses</td>
              <td>{(overviewData?.totalExpensesThisMonth || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Taxable Income</td>
              <td>{taxableIncome.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>);

  };

  const renderManagementSummaryReport = () => {
    if (!reportData) return null;
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{ padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #93c5fd' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Collections</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#0284c7' }}>
              {(overviewData?.totalCollectedThisMonth || 0).toFixed(2)} XOF
            </p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Expenses</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#dc2626' }}>
              {(overviewData?.totalExpensesThisMonth || 0).toFixed(2)} XOF
            </p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Net Profit</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#059669' }}>
              {((overviewData?.totalCollectedThisMonth || 0) - (overviewData?.totalExpensesThisMonth || 0)).toFixed(2)} XOF
            </p>
          </div>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Properties</td>
                <td>{collections.length}</td>
              </tr>
              <tr>
                <td>Active Tenants</td>
                <td>{overviewData?.activeTenants || overviewData?.numberOfActiveTenants || tenants.length}</td>
              </tr>
              <tr>
                <td>Total Owners</td>
                <td>{landlords.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>);

  };

  const renderTenantPayments = () =>
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
          disabled={loading}>
          
            <Download size={18} />
            Import Payments
          </button>
          <button
          className="sa-primary-cta"
          onClick={() => {
            exportPaymentsToCSV();
          }}
          disabled={loading || tenantPayments.length === 0}>
          
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

      {loading ?
    <div className="loading">Loading tenant payments...</div> :
    tenantPayments.length === 0 ?
    <div className="no-data">No tenant payments found</div> :

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
              {tenantPayments.
          filter((payment) => {
            const status = (payment.Status || '').toLowerCase();
            return status === 'successful' || status === 'failed' || status === 'approved' || status === 'rejected';
          }).
          map((payment, index) => {
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
                      <button
                      className="table-action-button view"
                      onClick={() => {
                        setSelectedItemForView({ type: 'payment', data: payment });
                        setShowPaymentViewModal(true);
                      }}
                      title="View details">
                      
                        {t('common.view')}
                      </button>
                      <button
                      className="table-action-button edit"
                      onClick={() => downloadReceipt(payment)}
                      title="Download Receipt">
                      
                        <Download size={14} />
                        Receipt
                      </button>
                    </div>
                  </td>
                </tr>);

          })}
            </tbody>
          </table>
        </div>
    }
    </div>;

  const exportExpensesToCSV = () => {
    const filteredExpenses = getFilteredExpenses();

    const headers = ['Date', 'Scope', 'Building', 'Owner', 'Category', 'Requested by', 'Amount', 'Notes'];
    const rows = filteredExpenses.map((exp) => [
    exp.Date || exp.date ? new Date(exp.Date || exp.date).toLocaleDateString() : '',
    exp.Scope || exp.scope || '',
    exp.Building || exp.building || '',
    exp.Owner || exp.owner || exp.Landlord || exp.landlord || '',
    exp.Category || exp.category || '',
    (exp.RequestedBy || exp.requestedBy || '').replace(/"/g, '""'),
    (exp.Amount || exp.amount || 0).toFixed(2),
    (exp.Notes || exp.notes || '').replace(/"/g, '""')]
    );

    const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].
    join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateRange = expenseStartDateFilter && expenseEndDateFilter ?
    `${expenseStartDateFilter}-to-${expenseEndDateFilter}` :
    new Date().toISOString().split('T')[0];
    a.download = `expenses-${dateRange}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addNotification('Expenses exported to CSV successfully!', 'success');
  };
  const getFilteredExpenses = () => {
    let filtered = [...expenses];
    if (expenseBuildingFilter) {
      filtered = filtered.filter((exp) =>
      (exp.Building || exp.building || '').toString().trim() === expenseBuildingFilter
      );
    }
    if (expenseCategoryFilter) {
      filtered = filtered.filter((exp) =>
      (exp.Category || exp.category || '').toString().trim() === expenseCategoryFilter
      );
    }
    if (expenseScopeFilter) {
      filtered = filtered.filter((exp) =>
      (exp.Scope || exp.scope || '').toLowerCase() === expenseScopeFilter.toLowerCase()
      );
    }
    if (expenseOwnerFilter) {
      filtered = filtered.filter((exp) =>
      (exp.Owner || exp.owner || exp.Landlord || exp.landlord || '').toLowerCase().includes(expenseOwnerFilter.toLowerCase())
      );
    }
    if (expenseStartDateFilter) {
      filtered = filtered.filter((exp) => {
        const d = exp.Date || exp.date;
        return !d || new Date(d) >= new Date(expenseStartDateFilter);
      });
    }
    if (expenseEndDateFilter) {
      filtered = filtered.filter((exp) => {
        const d = exp.Date || exp.date;
        return !d || new Date(d) <= new Date(expenseEndDateFilter + 'T23:59:59');
      });
    }
    if (expenseSearchText) {
      const searchLower = expenseSearchText.toLowerCase();
      filtered = filtered.filter((exp) =>
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
    const uniqueBuildings = [...new Set(expenses.map((exp) => exp.Building || exp.building).filter(Boolean))];
    const uniqueCategories = [...new Set(expenses.map((exp) => exp.Category || exp.category).filter(Boolean))];
    const uniqueScopes = [...new Set(expenses.map((exp) => exp.Scope || exp.scope).filter(Boolean))];
    const uniqueOwners = [...new Set(expenses.map((exp) => exp.Owner || exp.owner || exp.Landlord || exp.landlord).filter(Boolean))];

    const totalExp = expensesSummary?.totalExpenses ?? 0;
    const agencyExp = expensesSummary?.agencyExpenses ?? 0;
    const ownerExp = expensesSummary?.ownerExpenses ?? 0;

    return (
      <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <div
            onClick={() => setExpenseViewCard('total')}
            style={{
              padding: '20px',
              borderRadius: '8px',
              border: `2px solid ${expenseViewCard === 'total' ? '#3b82f6' : '#e5e7eb'}`,
              backgroundColor: expenseViewCard === 'total' ? '#eff6ff' : '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
            
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Total Expenses</p>
        <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#1f2937' }}>
          {totalExp.toFixed(2)} XOF
        </p>
      </div>
      <div
            onClick={() => setExpenseViewCard('agency')}
            style={{
              padding: '20px',
              borderRadius: '8px',
              border: `2px solid ${expenseViewCard === 'agency' ? '#3b82f6' : '#e5e7eb'}`,
              backgroundColor: expenseViewCard === 'agency' ? '#eff6ff' : '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
            
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Agency Expenses</p>
        <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#1f2937' }}>
          {agencyExp.toFixed(2)} XOF
        </p>
      </div>
      <div
            onClick={() => setExpenseViewCard('owner')}
            style={{
              padding: '20px',
              borderRadius: '8px',
              border: `2px solid ${expenseViewCard === 'owner' ? '#3b82f6' : '#e5e7eb'}`,
              backgroundColor: expenseViewCard === 'owner' ? '#eff6ff' : '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
            
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Owner Expenses</p>
        <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: '#1f2937' }}>
          {ownerExp.toFixed(2)} XOF
        </p>
      </div>
    </div>

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
                disabled={loading || filteredExpenses.length === 0}>
                
              <Download size={18} />
              Export to CSV
            </button>
        <button
                className="sa-primary-cta"
                onClick={() => setShowExpenseModal(true)}
                disabled={loading}>
                
          <Plus size={18} />
          {t('accounting.addExpense')}
        </button>
          </div>
        </div>
        {expenseViewCard !== 'owner' &&
          <div className="sa-filters-section" style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <select
              className="sa-filter-select"
              value={expenseBuildingFilter}
              onChange={(e) => setExpenseBuildingFilter(e.target.value)}>
              
            <option value="">All Buildings</option>
            {uniqueBuildings.map((building) =>
              <option key={building} value={building}>{building}</option>
              )}
          </select>

          <select
              className="sa-filter-select"
              value={expenseCategoryFilter}
              onChange={(e) => setExpenseCategoryFilter(e.target.value)}>
              
            <option value="">All Categories</option>
            {uniqueCategories.map((category) =>
              <option key={category} value={category}>{category}</option>
              )}
          </select>

          <select
              className="sa-filter-select"
              value={expenseScopeFilter}
              onChange={(e) => setExpenseScopeFilter(e.target.value)}>
              
            <option value="">All Scopes</option>
            {uniqueScopes.map((scope) =>
              <option key={scope} value={scope}>{scope}</option>
              )}
          </select>

          <select
              className="sa-filter-select"
              value={expenseOwnerFilter}
              onChange={(e) => setExpenseOwnerFilter(e.target.value)}>
              
            <option value="">All Owners</option>
            {uniqueOwners.map((owner) =>
              <option key={owner} value={owner}>{owner}</option>
              )}
          </select>

          <input
              type="date"
              className="sa-filter-select"
              value={expenseStartDateFilter}
              onChange={(e) => setExpenseStartDateFilter(e.target.value)}
              placeholder="Start Date" />
            

          <input
              type="date"
              className="sa-filter-select"
              value={expenseEndDateFilter}
              onChange={(e) => setExpenseEndDateFilter(e.target.value)}
              placeholder="End Date" />
            

          {(expenseBuildingFilter || expenseCategoryFilter || expenseScopeFilter || expenseOwnerFilter || expenseStartDateFilter || expenseEndDateFilter) &&
            <button
              className="sa-outline-button"
              onClick={() => {
                setExpenseBuildingFilter('');
                setExpenseCategoryFilter('');
                setExpenseScopeFilter('');
                setExpenseOwnerFilter('');
                setExpenseStartDateFilter('');
                setExpenseEndDateFilter('');
              }}
              style={{ marginLeft: 'auto' }}>
              
              Clear Filters
            </button>
            }
      </div>
          }

      {expenseViewCard === 'owner' ?
          loading ?
          <div className="loading">Loading expenses per owner...</div> :
          expensesPerOwner.length === 0 ?
          <div className="no-data">No owner expenses found</div> :

          <div style={{ padding: '16px' }}>
            {expensesPerOwner.map((ownerGroup, idx) =>
            <div key={ownerGroup.ownerId || idx} style={{ marginBottom: '24px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>{ownerGroup.ownerName || 'Unknown'}</span>
                  <span style={{ fontWeight: 600, color: '#059669' }}>{(ownerGroup.total || 0).toFixed(2)} XOF</span>
                </div>
                <div className="sa-table-wrapper">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Building</th>
                        <th>Category</th>
                        <th>Requested by</th>
                        <th>Amount</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(ownerGroup.expenses || []).map((exp, i) =>
                    <tr key={exp.ID || exp.id || i}>
                          <td>{exp.Date ? new Date(exp.Date).toLocaleDateString() : exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'}</td>
                          <td>{exp.Building || exp.building || 'N/A'}</td>
                          <td>{exp.Category || exp.category || 'N/A'}</td>
                          <td>{exp.RequestedBy || exp.requestedBy || '—'}</td>
                          <td>{(exp.Amount || exp.amount || 0).toFixed(2)} XOF</td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.Notes || exp.notes || 'N/A'}</td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div> :

          loading ?
          <div className="loading">Loading expenses...</div> :
          filteredExpenses.length === 0 ?
          <div className="no-data">
            {expenses.length === 0 ? 'No expenses found' : 'No expenses match the selected filters'}
          </div> :

          <>
            <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Showing {filteredExpenses.length} of {expenses.length} expense(s)
                {filteredExpenses.length > 0 &&
                <span style={{ marginLeft: '16px', fontWeight: '600' }}>
                    Total: {filteredExpenses.reduce((sum, exp) => sum + (exp.Amount || exp.amount || 0), 0).toFixed(2)} XOF
                  </span>
                }
              </p>
            </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Scope</th>
                <th>Building</th>
                <th>Owner</th>
                <th>Category</th>
                <th>Requested by</th>
                <th>Amount</th>
                <th>Notes</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
                  {filteredExpenses.map((exp, index) =>
                  <tr key={exp.ID || exp.id || `expense-${index}`}>
                      <td>{exp.Date ? new Date(exp.Date).toLocaleDateString() : exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'}</td>
                  <td>{exp.Scope || exp.scope || 'N/A'}</td>
                  <td>
                    <span className="sa-cell-title">{exp.Building || exp.building || 'N/A'}</span>
                  </td>
                  <td>{exp.Owner || exp.owner || exp.Landlord || exp.landlord || '—'}</td>
                  <td>{exp.Category || exp.category || 'N/A'}</td>
                  <td>{exp.RequestedBy || exp.requestedBy || '—'}</td>
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
                          }}>
                          
                        View
                      </button>
                      <button
                          className="table-action-button"
                          onClick={() => {
                            setSelectedExpense(exp);
                            printExpenseReceipt(exp);
                          }}
                          style={{ backgroundColor: '#3b82f6', color: 'white', marginLeft: '4px' }}>
                          
                        Print
                      </button>
                    </div>
                  </td>
                </tr>
                  )}
            </tbody>
          </table>
        </div>
          </>
          }
    </div>
      </>);

  };
  const renderHistory = () => {
    const allTransactions = [];
    tenantPayments.forEach((payment) => {
      allTransactions.push({
        type: 'Tenant Payment',
        date: payment.Date || payment.date,
        tenant: payment.Tenant || payment.tenant,
        property: payment.Property || payment.property,
        amount: payment.Amount || payment.amount || 0,
        status: payment.Status || payment.status,
        method: payment.Method || payment.method,
        id: payment.ID || payment.id
      });
    });
    collections.forEach((collection) => {
      allTransactions.push({
        type: collection.ChargeType || collection.chargeType || 'Collection',
        date: collection.Date || collection.date,
        tenant: '-',
        property: collection.Building || collection.building,
        amount: collection.Amount || collection.amount || 0,
        status: collection.Status || collection.status,
        method: 'Cash',
        id: collection.ID || collection.id
      });
    });
    expenses.forEach((expense) => {
      allTransactions.push({
        type: 'Expense',
        date: expense.Date || expense.date,
        tenant: '-',
        property: expense.Building || expense.building,
        amount: -(expense.Amount || expense.amount || 0),
        status: 'Completed',
        method: expense.Category || expense.category,
        notes: expense.Notes || expense.notes,
        id: expense.ID || expense.id
      });
    });
    landlordPayments.forEach((payment) => {
      allTransactions.push({
        type: 'Owner Payment',
        date: payment.Date || payment.date,
        tenant: payment.Landlord || payment.landlord,
        property: payment.Building || payment.building,
        amount: -(payment.NetAmount || payment.netAmount || 0),
        status: payment.Status || payment.status,
        method: 'Transfer',
        id: payment.ID || payment.id
      });
    });
    cashierTransactions.forEach((transaction) => {
      const account = cashierAccounts.find((acc) => (acc.ID || acc.id) === (transaction.AccountID || transaction.accountId));
      const accountName = account ? account.Name || account.name : 'Unknown';
      const amount = (transaction.Type || transaction.type) === 'deposit' ?
      transaction.Amount || transaction.amount || 0 :
      -(transaction.Amount || transaction.amount || 0);

      allTransactions.push({
        type: 'Cashier Transaction',
        date: transaction.CreatedAt || transaction.createdAt,
        tenant: accountName,
        property: '-',
        amount: amount,
        status: 'Completed',
        method: transaction.Type || transaction.type,
        notes: transaction.Description || transaction.description,
        id: transaction.ID || transaction.id
      });
    });
    deposits.filter((d) => (d.Type || d.type) === 'refund').forEach((refund) => {
      allTransactions.push({
        type: 'Deposit Refund',
        date: refund.RefundedAt || refund.refundedAt || refund.CreatedAt,
        tenant: refund.Tenant || refund.tenant,
        property: refund.Property || refund.property,
        amount: -(refund.Amount || refund.amount || 0),
        status: 'Refunded',
        method: refund.RefundMethod || refund.refundMethod,
        id: refund.ID || refund.id
      });
    });
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });

    const filteredHistory = allTransactions.filter((t) => {
      if (historyTypeFilter !== 'all' && t.type !== historyTypeFilter) return false;
      const d = t.date;
      if (!d) return true;
      const date = new Date(d);
      if (historyStartDateFilter && date < new Date(historyStartDateFilter)) return false;
      if (historyEndDateFilter && date > new Date(historyEndDateFilter + 'T23:59:59')) return false;
      return true;
    });

    return (
      <div style={{ padding: '20px' }}>
        <div className="sa-section-card">
          <div className="sa-section-header">
            <div>
              <h2>Transaction History</h2>
              <p>Complete history of all financial transactions</p>
            </div>
          </div>

          <div className="sa-filters-section" style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="sa-filter-select" value={historyTypeFilter} onChange={(e) => setHistoryTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="Tenant Payment">Tenant Payment</option>
              <option value="Expense">Expense</option>
              <option value="Owner Payment">Owner Payment</option>
              <option value="Deposit Refund">Deposit Refund</option>
              <option value="Cashier Transaction">Cashier Transaction</option>
            </select>
            <input type="date" className="sa-filter-select" value={historyStartDateFilter} onChange={(e) => setHistoryStartDateFilter(e.target.value)} placeholder="Start Date" />
            <input type="date" className="sa-filter-select" value={historyEndDateFilter} onChange={(e) => setHistoryEndDateFilter(e.target.value)} placeholder="End Date" />
          </div>

          {loading ?
          <div className="loading">Loading transactions...</div> :
          filteredHistory.length === 0 ?
          <div className="no-data">No transactions found</div> :

          <div className="sa-table-wrapper">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Tenant/Owner/Account</th>
                    <th>Property</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Method/Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((transaction, index) =>
                <tr key={transaction.id || `transaction-${index}`}>
                      <td>
                        {transaction.date ?
                    new Date(transaction.date).toLocaleDateString() :
                    'N/A'}
                      </td>
                      <td>
                        <span className={`sa-status-pill ${transaction.type.toLowerCase().replace(' ', '-')}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td>{transaction.tenant || '-'}</td>
                      <td>{transaction.property || '-'}</td>
                      <td style={{
                    color: transaction.amount >= 0 ? '#059669' : '#dc2626',
                    fontWeight: '600'
                  }}>
                        {transaction.amount >= 0 ? '+' : ''}
                        {transaction.amount.toFixed(2)} XOF
                      </td>
                      <td>
                        <span className={`sa-status-pill ${(transaction.status || '').toLowerCase()}`}>
                          {transaction.status || 'N/A'}
                        </span>
                      </td>
                      <td>{transaction.method || transaction.notes || '-'}</td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>);

  };
  const renderCashier = () => {
    const totalBalance = cashierAccounts.
    filter((acc) => acc.IsActive !== false && acc.isActive !== false).
    reduce((sum, acc) => sum + (acc.Balance || acc.balance || 0), 0);
    const cashBalance = cashierAccounts.
    filter((acc) => (acc.Type || acc.type) === 'cash_register' && acc.IsActive !== false && acc.isActive !== false).
    reduce((sum, acc) => sum + (acc.Balance || acc.balance || 0), 0);
    const bankBalance = cashierAccounts.
    filter((acc) => (acc.Type || acc.type) === 'bank' && acc.IsActive !== false && acc.isActive !== false).
    reduce((sum, acc) => sum + (acc.Balance || acc.balance || 0), 0);
    const cashAccountIds = cashierAccounts.
    filter((acc) => (acc.Type || acc.type) === 'cash_register').
    map((acc) => acc.ID || acc.id);
    const bankAccountIds = cashierAccounts.
    filter((acc) => (acc.Type || acc.type) === 'bank').
    map((acc) => acc.ID || acc.id);
    const cashTransactions = cashierTransactions.filter((t) =>
    cashAccountIds.includes(t.AccountID || t.accountId)
    );
    const bankTransactions = cashierTransactions.filter((t) =>
    bankAccountIds.includes(t.AccountID || t.accountId)
    );
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = cashierTransactions.filter((t) => {
      const date = new Date(t.CreatedAt || t.createdAt);
      return date >= thirtyDaysAgo;
    });

    const inflows = recentTransactions.
    filter((t) => (t.Type || t.type) === 'deposit').
    reduce((sum, t) => sum + (t.Amount || t.amount || 0), 0);

    const outflows = recentTransactions.
    filter((t) => (t.Type || t.type) === 'withdrawal').
    reduce((sum, t) => sum + (t.Amount || t.amount || 0), 0);
    const accountsByType = {
      mobile_money: cashierAccounts.filter((acc) => (acc.Type || acc.type) === 'mobile_money'),
      cash_register: cashierAccounts.filter((acc) => (acc.Type || acc.type) === 'cash_register'),
      bank: cashierAccounts.filter((acc) => (acc.Type || acc.type) === 'bank'),
      other: cashierAccounts.filter((acc) => !['mobile_money', 'cash_register', 'bank'].includes(acc.Type || acc.type))
    };

    return (
      <div>
        <div className="sa-section-card">
          <div className="sa-section-header">
            <div>
              <h2>Account Balances</h2>
              <p>View physical cash balance, bank balance, inflows/outflows, and journals</p>
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
                disabled={loading || cashierAccounts.length === 0}>
                
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
                disabled={loading}>
                
                <Plus size={18} />
                Add Account
              </button>
            </div>
          </div>
          <div style={{
            padding: '16px 20px',
            marginBottom: '20px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #86efac'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Available Balance</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '1.5rem', fontWeight: '600', color: '#166534' }}>
                  {totalBalance.toFixed(2)} XOF
                </p>
              </div>
              <Wallet size={36} style={{ color: '#22c55e' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {accountsByType.mobile_money.length > 0 &&
            <div className="sa-section-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Smartphone size={20} style={{ color: '#3b82f6' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Mobile Money</h3>
                </div>
                {accountsByType.mobile_money.map((account, index) => {
                const balance = account.Balance || account.balance || 0;
                const name = account.Name || account.name || 'Unnamed';
                return (
                  <div key={account.ID || account.id || index} style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <p style={{ margin: 0, fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{name}</p>
                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#059669' }}>
                          {balance.toFixed(2)} XOF
                        </p>
                      </div>
                    </div>);

              })}
              </div>
            }
            {accountsByType.cash_register.length > 0 &&
            <div className="sa-section-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Banknote size={20} style={{ color: '#10b981' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Cash Register</h3>
                </div>
                {accountsByType.cash_register.map((account, index) => {
                const balance = account.Balance || account.balance || 0;
                const name = account.Name || account.name || 'Unnamed';
                return (
                  <div key={account.ID || account.id || index} style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <p style={{ margin: 0, fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{name}</p>
                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#059669' }}>
                          {balance.toFixed(2)} XOF
                        </p>
                      </div>
                    </div>);

              })}
              </div>
            }
            {accountsByType.bank.length > 0 &&
            <div className="sa-section-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Building2 size={20} style={{ color: '#8b5cf6' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Bank Accounts</h3>
                </div>
                {accountsByType.bank.map((account, index) => {
                const balance = account.Balance || account.balance || 0;
                const name = account.Name || account.name || 'Unnamed';
                return (
                  <div key={account.ID || account.id || index} style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <p style={{ margin: 0, fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{name}</p>
                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#059669' }}>
                          {balance.toFixed(2)} XOF
                        </p>
                      </div>
                    </div>);

              })}
              </div>
            }
            {accountsByType.other.length > 0 &&
            <div className="sa-section-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Wallet size={20} style={{ color: '#6b7280' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Other Accounts</h3>
                </div>
                {accountsByType.other.map((account, index) => {
                const balance = account.Balance || account.balance || 0;
                const name = account.Name || account.name || 'Unnamed';
                return (
                  <div key={account.ID || account.id || index} style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <p style={{ margin: 0, fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{name}</p>
                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#059669' }}>
                          {balance.toFixed(2)} XOF
                        </p>
                      </div>
                    </div>);

              })}
              </div>
            }
            <div className="sa-section-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Building2 size={20} style={{ color: '#f59e0b' }} />
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Agency Balance</h3>
              </div>
              <div style={{
                padding: '12px',
                backgroundColor: '#fffbeb',
                borderRadius: '6px',
                border: '1px solid #fde68a'
              }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Commission from tenant payments</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '1.25rem', fontWeight: '600', color: '#b45309' }}>
                  {(agencyBalance ?? 0).toFixed(2)} XOF
                </p>
              </div>
            </div>
            <div className="sa-section-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Banknote size={20} style={{ color: '#10b981' }} />
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Cash Balance</h3>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #86efac' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Physical Cash</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '1.25rem', fontWeight: 600, color: '#166534' }}>{cashBalance.toFixed(2)} XOF</p>
              </div>
            </div>
            <div className="sa-section-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Building2 size={20} style={{ color: '#8b5cf6' }} />
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Bank Balance</h3>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #93c5fd' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Bank Accounts Total</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '1.25rem', fontWeight: 600, color: '#0284c7' }}>{bankBalance.toFixed(2)} XOF</p>
              </div>
            </div>

            {cashierAccounts.length === 0 &&
            <div style={{
              gridColumn: '1 / -1',
              padding: '40px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
                {t('accounting.noCashierAccounts')}
              </div>
            }
          </div>
          <div className="sa-section-card" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Users size={24} style={{ color: '#6366f1' }} />
              <div>
                <h3 style={{ margin: 0 }}>Owner Balances</h3>
                <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Balance per owner (collections minus payments)</p>
              </div>
            </div>
            {!selectedOwnerForBalance ?
            ownerBalancesLoading ?
            <div className="loading">Loading owners...</div> :
            ownerBalancesOwners.length === 0 ?
            <div className="no-data">No owners found</div> :
            (() => {
              const ownerBalances = ownerBalancesOwners.map((ownerObj) => {
                const ownerName = ownerObj.Name || ownerObj.name || ownerObj.Landlord || ownerObj.landlord || 'N/A';
                const totalCollected = collections.filter((c) => {
                  const cLandlord = (c.Landlord || c.landlord || '').trim();
                  return cLandlord && (cLandlord === ownerName || cLandlord.toLowerCase() === ownerName.toLowerCase());
                }).reduce((sum, c) => sum + (c.Amount || c.amount || 0), 0);
                const ownerPaymentsList = landlordPayments.filter((p) => {
                  const pLandlord = (p.Landlord || p.landlord || '').trim();
                  return pLandlord && (pLandlord === ownerName || pLandlord.toLowerCase() === ownerName.toLowerCase());
                });
                const totalPaid = ownerPaymentsList.reduce((sum, p) => sum + (p.NetAmount || p.netAmount || 0), 0);
                const totalExpense = expenses.filter((exp) => {
                  const expOwner = (exp.Owner || exp.owner || exp.Landlord || exp.landlord || '').trim();
                  return expOwner && (expOwner === ownerName || expOwner.toLowerCase() === ownerName.toLowerCase());
                }).reduce((sum, e) => sum + (e.Amount || e.amount || 0), 0);
                const balance = totalCollected - totalPaid;
                const totalExpected = totalCollected;
                const urgencyCommission = ownerPaymentsList.filter((p) => ['pending', 'pending approval', 'pending director approval'].includes((p.Status || '').toLowerCase())).reduce((sum, p) => sum + (p.Commission || p.commission || 0), 0);
                return { owner: ownerName, ownerObj, totalCollected, totalPaid, totalExpense, balance, totalExpected: totalExpected || totalCollected, urgencyCommission };
              });
              return (
                <div className="sa-table-wrapper">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Owner</th>
                          <th>Total Collected</th>
                          <th>Total Paid</th>
                          <th>Total Expense</th>
                          <th>Total Expected</th>
                          <th>Urgency Commission</th>
                          <th>Balance (Owed)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ownerBalances.map((row, idx) =>
                      <tr
                        key={row.owner || idx}
                        onClick={() => setSelectedOwnerForBalance(row.owner)}
                        style={{ cursor: 'pointer' }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();setSelectedOwnerForBalance(row.owner);}}}>
                        
                            <td><span className="sa-cell-title">{row.owner}</span></td>
                            <td>{row.totalCollected.toFixed(2)} XOF</td>
                            <td>{row.totalPaid.toFixed(2)} XOF</td>
                            <td>{(row.totalExpense || 0).toFixed(2)} XOF</td>
                            <td>{(row.totalExpected ?? row.totalCollected).toFixed(2)} XOF</td>
                            <td style={row.urgencyCommission > 0 ? { color: '#dc2626', fontWeight: '600' } : {}}>{(row.urgencyCommission || 0).toFixed(2)} XOF</td>
                            <td style={{ color: row.balance >= 0 ? '#059669' : '#dc2626', fontWeight: '600' }}>{row.balance.toFixed(2)} XOF</td>
                          </tr>
                      )}
                      </tbody>
                    </table>
                  </div>);

            })() :

            <>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" className="sa-outline-button" onClick={() => setSelectedOwnerForBalance(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowLeft size={16} />
                    Back to owners
                  </button>
                  <h4 style={{ margin: 0 }}>{selectedOwnerForBalance} – Recent Transactions</h4>
                </div>
                {(() => {
                const owner = selectedOwnerForBalance;
                const ownerCollections = collections.filter((c) => (c.Landlord || c.landlord) === owner).map((c) => ({ ...c, _type: 'collection', _date: c.Date || c.date || c.CreatedAt || c.createdAt }));
                const ownerPayments = landlordPayments.filter((p) => (p.Landlord || p.landlord) === owner).map((p) => ({ ...p, _type: 'payout', _date: p.Date || p.date || p.CreatedAt || p.createdAt }));
                const merged = [...ownerCollections, ...ownerPayments].sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0)).slice(0, 50);
                if (merged.length === 0) return <div className="no-data">No transactions for this owner.</div>;
                return (
                  <div className="sa-table-wrapper">
                      <table className="sa-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Building</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {merged.map((item, idx) => {
                          const isCollection = item._type === 'collection';
                          const amount = isCollection ? item.Amount || item.amount || 0 : item.NetAmount || item.netAmount || 0;
                          const building = item.Building || item.building || '—';
                          const desc = isCollection ? item.ChargeType || item.chargeType || 'Rent' : 'Payout';
                          const date = item._date ? new Date(item._date).toLocaleDateString() : 'N/A';
                          const status = item.Status || item.status || (isCollection ? 'Collected' : '—');
                          return (
                            <tr key={idx}>
                                <td>{date}</td>
                                <td><span className={`sa-status-pill ${isCollection ? 'success' : 'info'}`}>{isCollection ? 'Collection' : 'Payout'}</span></td>
                                <td>{building}</td>
                                <td>{desc}</td>
                                <td style={{ color: isCollection ? '#059669' : '#dc2626', fontWeight: '600' }}>{isCollection ? '+' : '-'}{amount.toFixed(2)} XOF</td>
                                <td>{status}</td>
                              </tr>);

                        })}
                        </tbody>
                      </table>
                    </div>);

              })()}
              </>
            }
          </div>
          <div className="sa-section-card" style={{ marginTop: '24px' }}>
            <div className="sa-section-header">
              <div>
                <h3>{t('accounting.recentTransactions')}</h3>
                <p>Transfers made to owners</p>
              </div>
            </div>

            {(() => {
              const transfers = landlordPayments.
              filter((p) => (p.Status || p.status || '').toString().trim().toLowerCase() === 'paid').
              map((p) => ({ ...p, _date: p.Date || p.date || p.CreatedAt || p.createdAt })).
              sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0)).
              slice(0, 20);

              if (loading) return <div className="loading">Loading transfers...</div>;
              if (transfers.length === 0) return <div className="no-data">No owner transfers yet</div>;

              return (
                <div className="sa-table-wrapper">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Owner</th>
                        <th>Building</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((p, idx) =>
                      <tr key={p.ID || p.id || idx}>
                          <td>{p._date ? new Date(p._date).toLocaleDateString() : 'N/A'}</td>
                          <td><span className="sa-cell-title">{p.Landlord || p.landlord || '—'}</span></td>
                          <td>{p.Building || p.building || '—'}</td>
                          <td style={{ color: '#dc2626', fontWeight: 600 }}>-{Number(p.NetAmount || p.netAmount || 0).toFixed(2)} XOF</td>
                          <td><span className="sa-status-pill info">{p.Status || p.status || 'Paid'}</span></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>);

            })()}
          </div>
        </div>
        {showCashierAccountModal &&
        <div className="modal-overlay" onClick={() => setShowCashierAccountModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{t('accounting.addCashierAccount')}</h3>
                <button className="modal-close" onClick={() => setShowCashierAccountModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);
                  await accountingService.createCashierAccount(cashierAccountForm);
                  addNotification(t('accounting.cashierAccountCreated'), 'success');
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
                    onChange={(e) => setCashierAccountForm({ ...cashierAccountForm, name: e.target.value })}
                    required
                    placeholder="e.g., MTN Mobile Money" />
                  
                  </div>

                  <div className="form-group">
                    <label htmlFor="accountType">Account Type *</label>
                    <select
                    id="accountType"
                    value={cashierAccountForm.type}
                    onChange={(e) => setCashierAccountForm({ ...cashierAccountForm, type: e.target.value })}
                    required>
                    
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
                    onChange={(e) => setCashierAccountForm({ ...cashierAccountForm, balance: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00" />
                  
                  </div>

                  <div className="form-group">
                    <label htmlFor="currency">Currency</label>
                    <select
                    id="currency"
                    value={cashierAccountForm.currency}
                    onChange={(e) => setCashierAccountForm({ ...cashierAccountForm, currency: e.target.value })}>
                    
                      <option value="XOF">XOF</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                    id="description"
                    value={cashierAccountForm.description}
                    onChange={(e) => setCashierAccountForm({ ...cashierAccountForm, description: e.target.value })}
                    placeholder="Optional description"
                    rows="3" />
                  
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="action-button secondary" onClick={() => setShowCashierAccountModal(false)}>
                      {t('accounting.cancel')}
                    </button>
                    <button type="submit" className="action-button primary" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        }
        {showCashierTransactionModal &&
        <div className="modal-overlay" onClick={() => setShowCashierTransactionModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{t('accounting.addTransaction')}</h3>
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
                    onChange={(e) => setCashierTransactionForm({ ...cashierTransactionForm, accountId: e.target.value })}
                    required>
                    
                      <option value="">Select Account</option>
                      {cashierAccounts.filter((acc) => acc.IsActive !== false && acc.isActive !== false).map((account) =>
                    <option key={account.ID || account.id} value={account.ID || account.id}>
                          {account.Name || account.name} - {(account.Balance || account.balance || 0).toFixed(2)} XOF
                        </option>
                    )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="transactionType">Transaction Type *</label>
                    <select
                    id="transactionType"
                    value={cashierTransactionForm.type}
                    onChange={(e) => setCashierTransactionForm({ ...cashierTransactionForm, type: e.target.value })}
                    required>
                    
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal">Withdrawal</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>

                  {cashierTransactionForm.type === 'transfer' &&
                <div className="form-group">
                      <label htmlFor="toAccount">To Account *</label>
                      <select
                    id="toAccount"
                    value={cashierTransactionForm.toAccountId}
                    onChange={(e) => setCashierTransactionForm({ ...cashierTransactionForm, toAccountId: e.target.value })}
                    required={cashierTransactionForm.type === 'transfer'}>
                    
                        <option value="">Select Destination Account</option>
                        {cashierAccounts.
                    filter((acc) => acc.IsActive !== false && acc.isActive !== false && (acc.ID || acc.id) !== parseInt(cashierTransactionForm.accountId)).
                    map((account) =>
                    <option key={account.ID || account.id} value={account.ID || account.id}>
                              {account.Name || account.name} - {(account.Balance || account.balance || 0).toFixed(2)} XOF
                            </option>
                    )}
                      </select>
                    </div>
                }

                  <div className="form-group">
                    <label htmlFor="transactionAmount">Amount *</label>
                    <input
                    type="number"
                    id="transactionAmount"
                    step="0.01"
                    value={cashierTransactionForm.amount}
                    onChange={(e) => setCashierTransactionForm({ ...cashierTransactionForm, amount: e.target.value })}
                    required
                    placeholder="0.00" />
                  
                  </div>

                  <div className="form-group">
                    <label htmlFor="transactionReference">Reference</label>
                    <input
                    type="text"
                    id="transactionReference"
                    value={cashierTransactionForm.reference}
                    onChange={(e) => setCashierTransactionForm({ ...cashierTransactionForm, reference: e.target.value })}
                    placeholder="Optional reference number" />
                  
                  </div>

                  <div className="form-group">
                    <label htmlFor="transactionDescription">Description</label>
                    <textarea
                    id="transactionDescription"
                    value={cashierTransactionForm.description}
                    onChange={(e) => setCashierTransactionForm({ ...cashierTransactionForm, description: e.target.value })}
                    placeholder="Transaction description"
                    rows="3" />
                  
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="action-button secondary" onClick={() => setShowCashierTransactionModal(false)}>
                      {t('accounting.cancel')}
                    </button>
                    <button type="submit" className="action-button primary" disabled={loading}>
                      {loading ? 'Processing...' : 'Create Transaction'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        }
      </div>);

  };
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
      read: false,
      type: 'message'
    };

    setChatMessages((prev) => [...prev, optimisticMessage]);
    setChatInput('');

    try {
      const payload = {
        toUserId: selectedUserId,
        content
      };
      const sentMessage = await messagingService.sendMessage(payload);
      if (sentMessage && sentMessage.id) {
        setChatMessages((prev) =>
        prev.map((msg) =>
        msg.id === tempMessageId ? sentMessage : msg
        )
        );
      } else {
        await loadChatForUser(selectedUserId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addNotification(error.message || 'Failed to send message', 'error');
      setChatMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));
      setChatInput(content);
    }
  };
  const renderMessages = () =>
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
                onClick={() => loadChatForUser(user.userId)}>
                
                  <div className="sa-cell-main">
                    <span className="sa-cell-title">{user.name || 'User'}</span>
                    <span className="sa-cell-sub">{user.email || ''}</span>
                    {user.role &&
                  <span className="sa-cell-sub" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {user.role}
                      </span>
                  }
                    {user.unreadCount > 0 &&
                  <span className="sa-cell-sub" style={{ color: '#2563eb', fontWeight: 600, marginTop: '4px' }}>
                        {user.unreadCount} unread
                      </span>
                  }
                  </div>
                </li>);

          })}
            {chatUsers.length === 0 &&
          <li style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                No users available
              </li>
          }
          </ul>
        </div>
        
        <div className="sa-chat-conversation">
          <div className="sa-chat-header">
            <h3>Messages</h3>
            {selectedUserId &&
          <span className="sa-chat-subtitle">
                Chat with{' '}
                {
            (chatUsers.find((u) => u.userId === selectedUserId) || {}).
            name || 'User'
            }
              </span>
          }
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
                className={`sa-chat-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                
                  <p>{messageContent}</p>
                  <span className="sa-chat-meta">
                    {messageCreatedAt ?
                  new Date(messageCreatedAt).toLocaleString() :
                  ''}
                  </span>
                </div>);

          })}
            {chatMessages.length === 0 &&
          <div className="sa-table-empty">
                {selectedUserId ?
            'No messages yet. Start the conversation!' :
            'Select a conversation on the left to start messaging.'}
              </div>
          }
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
            disabled={!selectedUserId} />
          
            <button
            className="sa-primary-cta"
            onClick={handleSendMessage}
            disabled={!selectedUserId || !chatInput.trim()}>
            
              <MessageCircle size={16} />
              Send
            </button>
          </div>
        </div>
        
        <div className="sa-chat-details">
          <h4>Contact Details</h4>
          {selectedUserId ?
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
                  {user.company &&
              <p>
                      <strong>Company:</strong> {user.company}
                    </p>
              }
                </>);

        })() :

        <p>Select a conversation to view details.</p>
        }
        </div>
      </div>
    </div>;


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
          {advertisements.length > 0 ?
          advertisements.map((ad, index) => {
            const imageUrl = ad.ImageURL || ad.imageUrl || ad.imageURL;
            const fullImageUrl = imageUrl ?
            imageUrl.startsWith('http') ? imageUrl : `${API_CONFIG.BASE_URL}${imageUrl}` :
            null;

            return (
              <div key={`ad-${ad.ID || ad.id || index}`} className="sa-ad-card">
                  <div className="sa-ad-status-column">
                    <span className="sa-ad-status published">Active</span>
                  </div>
                  <div className="sa-ad-main">
                    {fullImageUrl &&
                  <img
                    src={fullImageUrl}
                    alt={ad.Title || ad.title || 'Advertisement'}
                    className="sa-ad-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }} />

                  }
                    <h3>{ad.Title || ad.title || 'Untitled Advertisement'}</h3>
                    <p>{ad.Text || ad.text || ad.description || ad.Description || 'No description available'}</p>
                    {ad.CreatedAt &&
                  <span className="sa-ad-date" style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px', display: 'block' }}>
                        Posted: {new Date(ad.CreatedAt).toLocaleDateString()}
                      </span>
                  }
                  </div>
                </div>);

          }) :

          <div className="sa-table-empty">
              No active advertisements available at this time.
            </div>
          }
        </div>
      </div>);

  };


  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'payments':
        return renderPaymentsSection();
      case 'expenses':
        return renderExpenses();
      case 'deposit-refunds':
        return renderDepositRefunds();
      case 'tenant-management':
        if (selectedTenant) return renderTenantDetail();
        return renderTenants();
      case 'account-balances':
        return renderCashier();
      case 'owner-payments':
        return renderPayments();
      case 'transaction-history':
        return renderHistory();
      case 'states-taxes':
        return renderStatesTaxes();
      case 'reports':
        return renderReports();
      case 'advertisements':
        return renderAdvertisements();
      case 'messages':
        return renderMessages();
      case 'settings':
        return (
          <div className="embedded-settings">
            <SettingsPage />
          </div>);

      case 'collections':
        return renderCollections();
      case 'tenant-payments':
        return renderTenantPayments();
      case 'tenants':
        return renderTenants();
      case 'history':
        return renderHistory();
      case 'cashier':
        return renderCashier();
      case 'chat':
        return renderMessages();
      default:
        return renderOverview();
    }
  };

  const layoutMenu = useMemo(
    () =>
    tabs.map((tab) => ({
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
        brand={{ name: 'SAAF IMMO', caption: 'Accounting', logo: 'SAAF', logoImage: `/download.jpeg` }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}>
        
        {({ activeId }) =>
        <div className="accounting-content">
            {loading && <div className="loading-indicator">Loading data...</div>}
            {renderContent(activeId || activeTab)}
          </div>
        }
      </RoleLayout>

      <div className="notifications-container">
        {notifications.map((notification, index) =>
        <div key={notification.id || `notification-${index}`} className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))}>×</button>
          </div>
        )}
      </div>
      {depositModals}
      {showApprovalModal && selectedPayment &&
      <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('accounting.confirmPaymentApproval')}</h3>
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
      }
      {showLandlordPaymentModal &&
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
                  netAmount: parseFloat(formData.get('netAmount'))
                };
                const newPayment = await accountingService.recordLandlordPayment(paymentData);
                setLandlordPayments((prev) => [newPayment, ...prev]);
                addNotification('Landlord payment recorded successfully!', 'success');
                setShowLandlordPaymentModal(false);
                e.target.reset();
                setSelectedLandlord(null);
              } catch (error) {
                console.error('Error recording landlord payment:', error);
                addNotification('Failed to record landlord payment. Please try again.', 'error');
              } finally {
                setLoading(false);
              }
            }}>
                <div className="form-group">
                  <label htmlFor="landlord">Owner / Landlord *</label>
                  <select
                  name="landlord"
                  required
                  defaultValue={selectedLandlord ? selectedLandlord.id || selectedLandlord.ID : ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    const ownersForModal = ownerBalancesOwners.length > 0 ? ownerBalancesOwners : landlords;
                    setSelectedLandlord(ownersForModal.find((o) => String(o.id || o.ID) === id) || null);
                  }}>
                  
                    <option value="">Select Owner</option>
                    {(ownerBalancesOwners.length > 0 ? ownerBalancesOwners : landlords).map((o) =>
                  <option key={o.id || o.ID} value={o.id || o.ID}>
                        {o.Name || o.name || o.Landlord || o.landlord || 'N/A'} {o.Email || o.email ? `(${o.Email || o.email})` : ''}
                      </option>
                  )}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="netAmount">Net Amount (XOF) *</label>
                  <input
                  type="number"
                  name="netAmount"
                  step="0.01"
                  required
                  placeholder="Enter amount" />
                
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Commission is automatically calculated and deducted by the backend.
                  </small>
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowLandlordPaymentModal(false)}>
                    {t('accounting.cancel')}
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? t('accounting.recording') : t('accounting.recordPayment')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
      {showCollectionPaymentModal &&
      <div className="modal-overlay" onClick={() => {
        setShowCollectionPaymentModal(false);
        setCollectionPaymentType(null);
      }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: collectionPaymentType ? '600px' : '500px' }}>
            <div className="modal-header">
              <h3>{collectionPaymentType ? 'Record Payment Details' : 'Select Payment Type'}</h3>
              <button className="modal-close" onClick={() => {
              setShowCollectionPaymentModal(false);
              setCollectionPaymentType(null);
            }}>×</button>
            </div>
            <div className="modal-body">
              {!collectionPaymentType ?
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 0' }}>
                  <button
                type="button"
                className="action-button primary"
                onClick={() => setCollectionPaymentType('tenant')}
                style={{ padding: '16px', fontSize: '16px', textAlign: 'left' }}>
                
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Record a Tenant's Payment</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>Record rent or other tenant payments</div>
                  </button>
                  <button
                type="button"
                className="action-button primary"
                onClick={() => setCollectionPaymentType('deposit')}
                style={{ padding: '16px', fontSize: '16px', textAlign: 'left' }}>
                
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Record a Security Deposit</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>Record security deposit payments from tenants</div>
                  </button>
                  <button
                type="button"
                className="action-button primary"
                onClick={() => setCollectionPaymentType('sale')}
                style={{ padding: '16px', fontSize: '16px', textAlign: 'left' }}>
                
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Record a Property Sale</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>Record property sale transactions</div>
                  </button>
                </div> :
            collectionPaymentType === 'tenant' ?
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const paymentData = {
                  tenant: collectionPaymentForm.tenant,
                  property: collectionPaymentForm.property,
                  amount: parseFloat(collectionPaymentForm.amount || '0'),
                  method: collectionPaymentForm.method,
                  chargeType: collectionPaymentForm.chargeType,
                  reference: collectionPaymentForm.reference,
                  status: 'Approved'
                };

                const newPayment = await accountingService.recordTenantPayment(paymentData);
                addNotification('Tenant payment recorded successfully!', 'success');
                try {
                  await accountingService.recordCollection({
                    building: collectionPaymentForm.property,
                    landlord: collectionPaymentForm.landlord || 'N/A',
                    amount: parseFloat(collectionPaymentForm.amount || '0'),
                    chargeType: collectionPaymentForm.chargeType,
                    status: 'Collected'
                  });
                } catch (collError) {
                  console.error('Error creating collection record:', collError);
                }
                const [overview, tenantPaymentsData, collectionsData] = await Promise.all([
                accountingService.getOverview(),
                accountingService.getTenantPayments(),
                accountingService.getCollections()]
                );
                setOverviewData(overview);
                setTenantPayments(Array.isArray(tenantPaymentsData) ? tenantPaymentsData : []);
                setCollections(Array.isArray(collectionsData) ? collectionsData : []);
                setCollectionPaymentForm({
                  building: '',
                  landlord: '',
                  amount: '',
                  paymentType: 'rent',
                  status: 'Collected',
                  tenant: '',
                  property: '',
                  method: 'Cash',
                  chargeType: 'Rent',
                  reference: '',
                  tenantType: 'individual',
                  monthlyRent: '',
                  paymentMethod: 'cash',
                  notes: '',
                  buyer: '',
                  saleAmount: '',
                  agencyCommission: ''
                });
                setSelectedValidatedClientId('');
                setCollectionPaymentType(null);
                setShowCollectionPaymentModal(false);
                e.target.reset();
              } catch (error) {
                console.error('Error recording tenant payment:', error);
                addNotification(error.message || 'Failed to record tenant payment', 'error');
              } finally {
                setLoading(false);
              }
            }}>
                  <div className="form-group">
                    <label htmlFor="tenantName">Tenant *</label>
                    <select
                  id="tenantName"
                  value={collectionPaymentForm.tenant}
                  onChange={(e) => {
                    const val = e.target.value;
                    const t = tenants.find((x) => (x.tenantName || x.TenantName) === val);
                    if (t) {
                      const name = t.tenantName || t.TenantName || '';
                      const prop = t.property || t.Property || t.building || t.Building || '';
                      const rent = t.monthlyRent ?? t.MonthlyRent ?? t.rent ?? t.Rent ?? '';
                      setCollectionPaymentForm({
                        ...collectionPaymentForm,
                        tenant: name,
                        property: prop,
                        amount: rent,
                        chargeType: collectionPaymentForm.chargeType
                      });
                    } else {
                      setCollectionPaymentForm({ ...collectionPaymentForm, tenant: val || '' });
                    }
                  }}
                  required>
                  
                      <option value="">Select tenant</option>
                      {tenants.filter((t) => t.property || t.Property).map((t) => {
                    const id = t.tenantId ?? t.TenantID ?? t.tenantName ?? t.TenantName;
                    const name = t.tenantName || t.TenantName || '';
                    return <option key={id} value={name}>{name} {t.property || t.Property ? ` (${t.property || t.Property})` : ''}</option>;
                  })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="tenantProperty">Property *</label>
                    <input
                  id="tenantProperty"
                  type="text"
                  value={collectionPaymentForm.property}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, property: e.target.value })}
                  readOnly={!!(collectionPaymentForm.tenant && collectionPaymentForm.property)}
                  required
                  placeholder="Select a tenant to auto-fill"
                  style={collectionPaymentForm.tenant && collectionPaymentForm.property ? { backgroundColor: '#f3f4f6', cursor: 'default' } : {}} />
                
                  </div>
                  {collectionPaymentForm.tenant && (() => {
                const sel = tenants.find((t) => (t.tenantName || t.TenantName) === collectionPaymentForm.tenant);
                const due = sel ? sel.outstandingAmount ?? sel.OutstandingAmount ?? 0 : 0;
                const months = sel ? sel.monthsInArrears ?? sel.MonthsInArrears ?? 0 : 0;
                const hasArrears = due > 0;
                return (
                  <div className="form-group" style={{
                    padding: '12px',
                    backgroundColor: hasArrears ? '#fef3c7' : '#f0fdf4',
                    borderRadius: '8px',
                    border: hasArrears ? '1px solid #f59e0b' : '1px solid #22c55e'
                  }}>
                        <label style={{ color: hasArrears ? '#92400e' : '#166534', fontWeight: '600' }}>Amount Due (Outstanding)</label>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600', color: hasArrears ? '#b45309' : '#15803d' }}>
                          {(due || 0).toLocaleString()} XOF
                          {months > 0 &&
                      <span style={{ fontSize: '0.85rem', fontWeight: '500', marginLeft: '8px' }}>
                              ({months} month{months > 1 ? 's' : ''} in arrears)
                            </span>
                      }
                          {!hasArrears && <span style={{ fontSize: '0.85rem', fontWeight: '500', marginLeft: '8px' }}>(Up to date)</span>}
                        </div>
                      </div>);

              })()}
                  <div className="form-group">
                    <label htmlFor="tenantAmount">Amount (XOF) *</label>
                    <input
                  id="tenantAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={collectionPaymentForm.amount}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, amount: e.target.value })}
                  required
                  placeholder="Enter payment amount" />
                
                    <small style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                      Can include arrears, current month, or months ahead
                    </small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="tenantMethod">Payment Method *</label>
                    <select
                  id="tenantMethod"
                  value={collectionPaymentForm.method}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, method: e.target.value })}
                  required>
                  
                      <option value="Cash">Cash</option>
                      <option value="Mobile Money">Mobile Money</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="tenantChargeType">Charge Type *</label>
                    <select
                  id="tenantChargeType"
                  value={collectionPaymentForm.chargeType}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, chargeType: e.target.value })}
                  required>
                  
                      <option value="Rent">Rent</option>
                      <option value="Deposit">Deposit</option>
                      <option value="Late Fee">Late Fee</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="tenantReference">Reference (optional)</label>
                    <input
                  id="tenantReference"
                  type="text"
                  value={collectionPaymentForm.reference}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, reference: e.target.value })}
                  placeholder="Receipt number or reference" />
                
                  </div>
                  <div className="modal-footer">
                    <button
                  type="button"
                  className="action-button secondary"
                  onClick={() => setCollectionPaymentType(null)}
                  disabled={loading}>
                  
                      Back
                    </button>
                    <button type="submit" className="action-button primary" disabled={loading}>
                      {loading ? t('accounting.recording') : t('accounting.recordPayment')}
                    </button>
                  </div>
                </form> :
            collectionPaymentType === 'deposit' ?
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const monthlyRent = parseFloat(collectionPaymentForm.monthlyRent || '0');
                const depositAmount = Number(collectionPaymentForm.depositAmount || 0);
                const depositData = {
                  tenant: collectionPaymentForm.tenant,
                  property: collectionPaymentForm.property,
                  tenantType: collectionPaymentForm.tenantType,
                  monthlyRent,
                  amount: depositAmount > 0 ? depositAmount : monthlyRent * 4.5,
                  monthsMultiplier: 4.5,
                  paymentMethod: collectionPaymentForm.paymentMethod
                };

                const deposit = await accountingService.recordDepositPayment(depositData);
                addNotification('Security deposit recorded successfully!', 'success');
                try {
                  await accountingService.recordCollection({
                    building: collectionPaymentForm.property,
                    landlord: collectionPaymentForm.landlord || 'N/A',
                    amount: deposit.deposit?.Amount || deposit.amount || depositAmount || parseFloat(collectionPaymentForm.monthlyRent || '0') * 4.5,
                    chargeType: 'Deposit',
                    status: 'Collected'
                  });
                } catch (collError) {
                  console.error('Error creating collection record:', collError);
                }
                const [overview, collectionsData] = await Promise.all([
                accountingService.getOverview(),
                accountingService.getCollections()]
                );
                setOverviewData(overview);
                setCollections(Array.isArray(collectionsData) ? collectionsData : []);
                setCollectionPaymentForm({
                  building: '',
                  landlord: '',
                  amount: '',
                  paymentType: 'rent',
                  status: 'Collected',
                  tenant: '',
                  property: '',
                  method: 'Cash',
                  chargeType: 'Rent',
                  reference: '',
                  tenantType: 'individual',
                  monthlyRent: '',
                  paymentMethod: 'cash',
                  notes: '',
                  buyer: '',
                  saleAmount: '',
                  agencyCommission: ''
                });
                setCollectionPaymentType(null);
                setShowCollectionPaymentModal(false);
                e.target.reset();
              } catch (error) {
                console.error('Error recording deposit:', error);
                addNotification(error.message || 'Failed to record security deposit', 'error');
              } finally {
                setLoading(false);
              }
            }}>
                  <div className="form-group">
                    <label htmlFor="depositTenant">Validated Client *</label>
                    <select
                  id="depositTenant"
                  value={selectedValidatedClientId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedValidatedClientId(val);
                    const t = validatedDepositClients.find((x) => String(x.ID || x.id) === String(val));
                    if (t) {
                      const name = t.name || t.Name || t.tenantName || t.TenantName || '';
                      const prop = t.property || t.Property || t.building || t.Building || t.address || t.Address || '';
                      const rent = t.monthlyRent ?? t.MonthlyRent ?? t.rent ?? t.Rent ?? '';
                      setCollectionPaymentForm({
                        ...collectionPaymentForm,
                        tenant: name,
                        property: prop,
                        monthlyRent: rent
                      });
                    } else {
                      setCollectionPaymentForm({ ...collectionPaymentForm, tenant: '', property: '', monthlyRent: '' });
                    }
                  }}
                  required>
                  
                      <option value="">Select validated client</option>
                      {validatedDepositClients.map((t) => {
                    const id = t.ID || t.id;
                    const name = t.name || t.Name || t.tenantName || t.TenantName || `Client ${id}`;
                    const property = t.property || t.Property || t.building || t.Building || t.address || t.Address || '';
                    return <option key={id} value={id}>{name} {property ? ` (${property})` : ''}</option>;
                  })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="depositProperty">Property *</label>
                    <input
                  id="depositProperty"
                  type="text"
                  value={collectionPaymentForm.property}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, property: e.target.value })}
                  readOnly={!!(selectedValidatedClientId && collectionPaymentForm.property)}
                  required
                  placeholder="Select a validated client to auto-fill"
                  style={selectedValidatedClientId && collectionPaymentForm.property ? { backgroundColor: '#f3f4f6', cursor: 'default' } : {}} />
                
                  </div>
                  <div className="form-group">
                    <label htmlFor="depositTenantType">Tenant Type *</label>
                    <select
                  id="depositTenantType"
                  value={collectionPaymentForm.tenantType}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, tenantType: e.target.value })}
                  required>
                  
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                    </select>
                    <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                      Deposit: 4.5 months rent for all properties
                    </small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="depositMonthlyRent">Monthly Rent (XOF) *</label>
                    <input
                  id="depositMonthlyRent"
                  type="number"
                  min="0"
                  step="0.01"
                  value={collectionPaymentForm.monthlyRent}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, monthlyRent: e.target.value })}
                  required
                  placeholder="Enter monthly rent amount" />
                
{collectionPaymentForm.monthlyRent &&
                <small style={{ color: '#059669', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                        Deposit Amount: {(parseFloat(collectionPaymentForm.monthlyRent) * 4.5).toFixed(2)} XOF
                      </small>
                }
                  </div>
                  <div className="form-group">
                    <label htmlFor="depositPaymentMethod">Payment Method *</label>
                    <select
                  id="depositPaymentMethod"
                  value={collectionPaymentForm.paymentMethod}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, paymentMethod: e.target.value })}
                  required>
                  
                      <option value="cash">Cash</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="modal-footer">
                    <button
                  type="button"
                  className="action-button secondary"
                  onClick={() => setCollectionPaymentType(null)}
                  disabled={loading}>
                  
                      Back
                    </button>
                    <button type="submit" className="action-button primary" disabled={loading}>
                      {loading ? t('accounting.recording') : t('accounting.recordPayment')}
                    </button>
                  </div>
                </form> :

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const saleData = {
                  building: collectionPaymentForm.property,
                  landlord: collectionPaymentForm.landlord,
                  amount: parseFloat(collectionPaymentForm.saleAmount || '0'),
                  chargeType: 'Sale',
                  status: 'Collected',
                  agencyCommission: parseFloat(collectionPaymentForm.agencyCommission || '0') || 0
                };

                const created = await accountingService.recordCollection(saleData);
                addNotification('Property sale recorded successfully!', 'success');
                const [overview, collectionsData] = await Promise.all([
                accountingService.getOverview(),
                accountingService.getCollections()]
                );
                setOverviewData(overview);
                setCollections(Array.isArray(collectionsData) ? collectionsData : []);
                setCollectionPaymentForm({
                  building: '',
                  landlord: '',
                  amount: '',
                  paymentType: 'rent',
                  status: 'Collected',
                  tenant: '',
                  property: '',
                  method: 'Cash',
                  chargeType: 'Rent',
                  reference: '',
                  tenantType: 'individual',
                  monthlyRent: '',
                  paymentMethod: 'cash',
                  notes: '',
                  buyer: '',
                  saleAmount: '',
                  agencyCommission: ''
                });
                setCollectionPaymentType(null);
                setShowCollectionPaymentModal(false);
                e.target.reset();
              } catch (error) {
                console.error('Error recording property sale:', error);
                addNotification(error.message || 'Failed to record property sale', 'error');
              } finally {
                setLoading(false);
              }
            }}>
                  <div className="form-group">
                    <label htmlFor="saleProperty">Property / Building *</label>
                    <select
                  id="saleProperty"
                  value={collectionPaymentForm.property}
                  onChange={(e) => {
                    const addr = e.target.value;
                    const p = propertiesForSale.find((x) => (x.address || x.Address) === addr);
                    if (p) {
                      setCollectionPaymentForm({
                        ...collectionPaymentForm,
                        property: addr,
                        landlord: p.landlord || p.Landlord || ''
                      });
                    } else {
                      setCollectionPaymentForm({ ...collectionPaymentForm, property: addr });
                    }
                  }}
                  required>
                  
                      <option value="">Select property</option>
                      {propertiesForSale.map((p) => {
                    const addr = p.address || p.Address || '';
                    return <option key={addr} value={addr}>{addr} {p.landlord || p.Landlord ? ` (${p.landlord || p.Landlord})` : ''}</option>;
                  })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="saleLandlord">Landlord / Seller *</label>
                    <input
                  id="saleLandlord"
                  type="text"
                  value={collectionPaymentForm.landlord}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, landlord: e.target.value })}
                  required
                  placeholder="Enter landlord/seller name" />
                
                  </div>
                  <div className="form-group">
                    <label htmlFor="saleBuyer">Buyer Name (optional)</label>
                    <input
                  id="saleBuyer"
                  type="text"
                  value={collectionPaymentForm.buyer}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, buyer: e.target.value })}
                  placeholder="Enter buyer name" />
                
                  </div>
                  <div className="form-group">
                    <label htmlFor="saleAmount">Sale Amount (XOF) *</label>
                    <input
                  id="saleAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={collectionPaymentForm.saleAmount}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, saleAmount: e.target.value, amount: e.target.value })}
                  required
                  placeholder="Enter sale amount" />
                
                  </div>
                  <div className="form-group">
                    <label htmlFor="agencyCommission">Agency Commission (XOF)</label>
                    <input
                  id="agencyCommission"
                  type="number"
                  min="0"
                  step="0.01"
                  value={collectionPaymentForm.agencyCommission}
                  onChange={(e) => setCollectionPaymentForm({ ...collectionPaymentForm, agencyCommission: e.target.value })}
                  placeholder="Enter agency commission (optional)" />
                
                  </div>
                  <div className="modal-footer">
                    <button
                  type="button"
                  className="action-button secondary"
                  onClick={() => setCollectionPaymentType(null)}
                  disabled={loading}>
                  
                      Back
                    </button>
                    <button type="submit" className="action-button primary" disabled={loading}>
                      {loading ? t('accounting.recording') : t('accounting.recordPayment')}
                    </button>
                  </div>
                </form>
            }
            </div>
          </div>
        </div>
      }
      {showExpenseModal &&
      <div className="modal-overlay" onClick={() => {
        setShowExpenseModal(false);
        setExpenseFormScope('');
        setExpenseFormBuilding('');
        setExpenseFormUnits([]);
      }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Expense</h3>
              <button className="modal-close" onClick={() => {
              setShowExpenseModal(false);
              setExpenseFormScope('');
              setExpenseFormBuilding('');
              setExpenseFormUnits([]);
            }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const formData = new FormData(e.target);
                const accountId = formData.get('accountId');
                const scope = formData.get('scope');
                const building = formData.get('building');
                const unit = formData.get('unit');
                const owner = formData.get('owner');
                const buildingValue = scope === 'SAAF IMMO' ? '-' : unit ? `${building} - ${unit}` : building || '-';
                const expenseData = {
                  scope,
                  building: buildingValue,
                  owner: owner || undefined,
                  category: formData.get('category'),
                  requestedBy: formData.get('requestedBy') || '',
                  amount: parseFloat(formData.get('amount')),
                  date: formData.get('date'),
                  notes: formData.get('notes'),
                  accountId: accountId ? parseInt(accountId) : null,
                  requiresOwnerApproval: scope === 'Building',
                  deductFrom: scope === 'Building' ? 'owner_balance' : 'commission_account'
                };
                const newExpense = await accountingService.addExpense(expenseData);
                setExpenses((prev) => [newExpense, ...prev]);
                if (accountId) {
                  try {
                    const [accounts, transactions] = await Promise.all([
                    accountingService.getCashierAccounts().catch(() => []),
                    accountingService.getCashierTransactions().catch(() => [])]
                    );
                    setCashierAccounts(Array.isArray(accounts) ? accounts : []);
                    setCashierTransactions(Array.isArray(transactions) ? transactions : []);
                  } catch (error) {
                    console.error('Error reloading cashier data:', error);
                  }
                }

                addNotification('Expense added successfully!', 'success');
                setShowExpenseModal(false);
                setExpenseFormScope('');
                setExpenseFormBuilding('');
                setExpenseFormUnits([]);
                await loadExpenses();
                try {
                  const overview = await accountingService.getOverview();
                  setOverviewData(overview);
                } catch (err) {
                  console.error('Error refreshing overview:', err);
                }
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
                  <select
                  name="scope"
                  required
                  value={expenseFormScope}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExpenseFormScope(val);
                    if (val === 'SAAF IMMO') {
                      setExpenseFormBuilding('');
                      setExpenseFormUnits([]);
                    }
                  }}>
                  
                    <option value="">Select Scope</option>
                    <option value="Building">Building</option>
                    <option value="SAAF IMMO">SAAF IMMO</option>
                  </select>
                  <small style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '6px', display: 'block', lineHeight: 1.4 }}>
                    <strong>Approval:</strong> Building → owner approves. Agency → director approves.<br />
                    <strong>Deduction:</strong> Building expense → reduces owner&apos;s balance. Agency expense → reduces commission account.
                  </small>
                </div>
                {expenseFormScope === 'Building' &&
              <>
                    <div className="form-group">
                      <label>Owner</label>
                      <select name="owner">
                        <option value="">Select Owner</option>
                        {landlords.map((l) => {
                      const name = l.Name || l.name || l.Landlord || l.landlord || l.Email || l.email || '—';
                      return <option key={l.ID || l.id} value={name}>{name}</option>;
                    })}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Building</label>
                      <select
                    name="building"
                    required
                    value={expenseFormBuilding}
                    onChange={(e) => {
                      setExpenseFormBuilding(e.target.value);
                    }}>
                    
                        <option value="">Select Building</option>
                        {expenseProperties.map((p) => {
                      const addr = p.address || p.Address || '';
                      return <option key={addr} value={addr}>{addr}</option>;
                    })}
                      </select>
                    </div>
                    {expenseFormBuilding &&
                <div className="form-group">
                        <label>Apartment / Unit (optional)</label>
                        <select name="unit">
                          <option value="">— Entire building —</option>
                          {expenseFormUnits.map((u) => {
                      const unitNum = u.UnitNumber || u.unitNumber || '';
                      return <option key={u.ID || u.id || unitNum} value={unitNum}>{unitNum}</option>;
                    })}
                        </select>
                        {expenseFormUnits.length === 0 &&
                  <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                            No units found for this property
                          </small>
                  }
                      </div>
                }
                  </>
              }
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
                {expenseFormScope !== 'Building' &&
              <div className="form-group">
                    <label>Requested by (name of person)</label>
                    <input
                  type="text"
                  name="requestedBy"
                  placeholder="Enter name of person who requested the payment" />
                
                  </div>
              }
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
                    {cashierAccounts.filter((acc) => acc.IsActive !== false && acc.isActive !== false).map((account) =>
                  <option key={account.ID || account.id} value={account.ID || account.id}>
                        {account.Name || account.name} - {(account.Balance || account.balance || 0).toFixed(2)} {account.Currency || account.currency || 'XOF'}
                      </option>
                  )}
                  </select>
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Select a cashier account to automatically deduct the expense amount from its balance. If no account is selected, the expense will be recorded without affecting any account balance.
                  </small>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input type="text" name="notes" placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label>Document (optional)</label>
                  <input type="file" name="document" accept=".pdf,image/*" />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Attach receipt or supporting document
                  </small>
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowExpenseModal(false)}>
                    {t('accounting.cancel')}
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? t('accounting.adding') : t('accounting.addExpense')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
      {showPaymentViewModal && selectedItemForView &&
      <div className="modal-overlay" onClick={() => setShowPaymentViewModal(false)}>
          <div className="modal-content modal-content-receipt" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>{selectedItemForView.type === 'collection' ? 'View Collection' : 'View Payment'}</h3>
              <button className="modal-close" onClick={() => setShowPaymentViewModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px', overflow: 'auto', maxHeight: '85vh', backgroundColor: '#f0f0f0' }}>
              <RentReceiptTemplate
              data={selectedItemForView.data}
              isCollection={selectedItemForView.type === 'collection'} />
            
              <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="action-button secondary" onClick={() => setShowPaymentViewModal(false)}>
                  Close
                </button>
                <button
                type="button"
                className="action-button primary"
                onClick={() => {
                  printPaymentReceipt(selectedItemForView.data, selectedItemForView.type === 'collection');
                  setShowPaymentViewModal(false);
                }}>
                
                  <Receipt size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Download Receipt PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      }
      {showViewExpenseModal && selectedExpense &&
      <div className="modal-overlay" onClick={() => setShowViewExpenseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>View Expense</h3>
              <button className="modal-close" onClick={() => setShowViewExpenseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Date</label>
                <div>{selectedExpense.Date ? new Date(selectedExpense.Date).toLocaleDateString() : selectedExpense.date ? new Date(selectedExpense.date).toLocaleDateString() : 'N/A'}</div>
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
                <label>Requested by</label>
                <div>{selectedExpense.RequestedBy || selectedExpense.requestedBy || '—'}</div>
              </div>
              <div className="form-group">
                <label>Amount</label>
                <div>{(selectedExpense.Amount || selectedExpense.amount || 0).toFixed(2)} XOF</div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <div>{selectedExpense.Notes || selectedExpense.notes || 'N/A'}</div>
              </div>
              {(selectedExpense.DocumentURL || selectedExpense.documentURL || selectedExpense.DocumentUrl || selectedExpense.documentUrl) &&
            <div className="form-group">
                  <label>Document</label>
                  <a
                href={selectedExpense.DocumentURL || selectedExpense.documentURL || selectedExpense.DocumentUrl || selectedExpense.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="action-button primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                
                    <Download size={16} />
                    View / Download Document
                  </a>
                </div>
            }
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
                }}>
                
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      }
      {showEditExpenseModal && selectedExpense &&
      <div className="modal-overlay" onClick={() => setShowEditExpenseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('accounting.editExpense')}</h3>
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
                  defaultValue={selectedExpense.Date ? new Date(selectedExpense.Date).toISOString().split('T')[0] : selectedExpense.date ? new Date(selectedExpense.date).toISOString().split('T')[0] : ''}
                  required />
                
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
      }
    </>);

};

export default AccountingDashboard;
