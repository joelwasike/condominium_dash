import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DollarSign, CreditCard, FileText, ArrowLeftRight, Users, Wallet, Building, History, Scale, Receipt, Megaphone, MessageCircle, Settings } from 'lucide-react';
import { accountingService } from '../../services/accountingService';
import { messagingService } from '../../services/messagingService';
import { isDemoMode, getAccountingDemoData } from '../../utils/demoData';
import ReactDOM from 'react-dom/client';
import RoleLayout from '../../components/RoleLayout';
import RentReceiptTemplate from '../../components/RentReceiptTemplate';
import SettingsPage from '../SettingsPage';
import { t, getLanguage } from '../../utils/i18n';
import '../../components/RoleLayout.css';
import '../AccountingDashboard.css';
import jsPDF from 'jspdf';
import html2pdf from 'html2pdf.js';

import OverviewTab from './OverviewTab';
import PaymentsTab from './PaymentsTab';
import ExpensesTab from './ExpensesTab';
import DepositRefundsTab from './DepositRefundsTab';
import TenantManagementTab from './TenantManagementTab';
import AccountBalancesTab from './AccountBalancesTab';
import OwnerPaymentsTab from './OwnerPaymentsTab';
import TransactionHistoryTab from './TransactionHistoryTab';
import StatesTaxesTab from './StatesTaxesTab';
import ReportsTab from './ReportsTab';
import AdvertisementsTab from './AdvertisementsTab';
import MessagesTab from './MessagesTab';

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

  // API Data States
  const [overviewData, setOverviewData] = useState(null);
  const [tenantPayments, setTenantPayments] = useState([]);
  const [landlordPayments, setLandlordPayments] = useState([]);
  const [collections, setCollections] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [workingDisbursements, setWorkingDisbursements] = useState([]);
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
  const [expenseOwnerFilter, setExpenseOwnerFilter] = useState('');
  const [expenseSearchText, setExpenseSearchText] = useState('');
  const [expenseViewCard, setExpenseViewCard] = useState('total');
  const [expensePanelMode, setExpensePanelMode] = useState('expenses');
  const [expensesSummary, setExpensesSummary] = useState(null);
  const [expensesPerOwner, setExpensesPerOwner] = useState([]);
  const [rentSummary, setRentSummary] = useState(null);
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Cashier state
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

  // Tenants state
  const [tenants, setTenants] = useState([]);
  const [depositEligibleTenants, setDepositEligibleTenants] = useState([]);
  const [tenantPaymentStatusFilter, setTenantPaymentStatusFilter] = useState('all');
  const [tenantNameFilter, setTenantNameFilter] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Deposits state
  const [deposits, setDeposits] = useState([]);
  const [depositFilter, setDepositFilter] = useState('all');
  const [depositStartDateFilter, setDepositStartDateFilter] = useState('');
  const [depositEndDateFilter, setDepositEndDateFilter] = useState('');
  const [historyStartDateFilter, setHistoryStartDateFilter] = useState('');
  const [historyEndDateFilter, setHistoryEndDateFilter] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');
  const [historyNameFilter, setHistoryNameFilter] = useState('');
  const [showDepositPaymentModal, setShowDepositPaymentModal] = useState(false);
  const [showDepositRefundModal, setShowDepositRefundModal] = useState(false);
  const [depositPaymentForm, setDepositPaymentForm] = useState({
    tenant: '',
    property: '',
    tenantType: 'individual',
    monthlyRent: '',
    applicationFees: false,
    paymentMethod: 'mobile_money',
    paymentProvider: '',
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

  // Collections manual payment state
  const [showCollectionPaymentModal, setShowCollectionPaymentModal] = useState(false);
  const [collectionPaymentType, setCollectionPaymentType] = useState(null);
  const [propertiesForSale, setPropertiesForSale] = useState([]);
  const [expenseProperties, setExpenseProperties] = useState([]);
  const [expenseFormScope, setExpenseFormScope] = useState('Building');
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
    applicationFees: false,
    paymentMethod: 'cash',
    paymentProvider: '',
    notes: '',
    buyer: '',
    saleAmount: '',
    agencyCommission: '',
  });

  // Auto-slide carousel for advertisements on overview page
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
      { id: 'settings', label: t('nav.profileSettings'), icon: Settings }
    ],
    [language]
  );

  // Load expenses with filters
  const loadExpenses = useCallback(async () => {
    try {
      const expenseFilters = {};
      if (expenseBuildingFilter) expenseFilters.building = expenseBuildingFilter;
      if (expenseStartDateFilter) expenseFilters.startDate = expenseStartDateFilter;
      if (expenseEndDateFilter) expenseFilters.endDate = expenseEndDateFilter;
      if (expenseCategoryFilter) expenseFilters.category = expenseCategoryFilter;
      if (expenseViewCard === 'agency') expenseFilters.scope = 'agency';
      else if (expenseViewCard === 'owner') expenseFilters.scope = 'owner';

      const expensesData = await accountingService.getExpenses(expenseFilters);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      addNotification('Failed to load expenses', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseBuildingFilter, expenseStartDateFilter, expenseEndDateFilter, expenseCategoryFilter, expenseViewCard]);

  const loadWorkingDisbursements = useCallback(async () => {
    if (isDemoMode()) {
      const pending = expenses.filter(exp => String(exp.Status || exp.status || '').toLowerCase() === 'approved' && !exp.PaidAt && !exp.paidAt);
      setWorkingDisbursements(pending);
      return;
    }
    try {
      const data = await accountingService.getWorkingDisbursements();
      setWorkingDisbursements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load working disbursements:', error);
      setWorkingDisbursements([]);
    }
  }, [expenses]);

  const markExpenseAsPaid = useCallback(async (expenseId) => {
    return accountingService.markExpenseAsPaid(expenseId);
  }, []);

  // Load expenses summary
  const loadExpensesSummary = useCallback(async () => {
    if (isDemoMode()) {
      const total = expenses.reduce((s, e) => s + (e.Amount || e.amount || 0), 0);
      const agency = expenses.filter(e => (e.Scope || e.scope) === 'SAAF IMMO' || (e.Building || e.building) === '-').reduce((s, e) => s + (e.Amount || e.amount || 0), 0);
      const owner = expenses.filter(e => (e.Scope || e.scope) === 'Building' && (e.Building || e.building) && (e.Building || e.building) !== '-').reduce((s, e) => s + (e.Amount || e.amount || 0), 0);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseStartDateFilter, expenseEndDateFilter, expenses]);

  // Load expenses per owner
  const loadExpensesPerOwner = useCallback(async () => {
    if (isDemoMode()) {
      const ownerExpenses = expenses.filter(e => (e.Scope || e.scope) === 'Building' && (e.Building || e.building) && (e.Building || e.building) !== '-');
      const byOwner = {};
      ownerExpenses.forEach(exp => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseStartDateFilter, expenseEndDateFilter, expenses]);

  // Load rent summary
  const loadRentSummary = useCallback(async () => {
    if (isDemoMode()) {
      const rentPayments = [...tenantPayments, ...collections].filter(p => (p.ChargeType || p.chargeType || '').toLowerCase() === 'rent');
      const collected = rentPayments.filter(p => ['Approved', 'Collected', 'Paid'].includes((p.Status || p.status || ''))).reduce((s, p) => s + (p.Amount || p.amount || 0), 0);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantPayments, collections, overviewData]);

  // Load data from APIs
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

      const [overview, tenantPaymentsData, landlordPaymentsData, collectionsData, expensesData, summary, landlordsData, tenantsData, eligibleDepositTenantsData, adsData] = await Promise.all([
        accountingService.getOverview(),
        accountingService.getTenantPayments(),
        accountingService.getLandlordPayments(),
        accountingService.getCollections(),
        accountingService.getExpenses({}),
        accountingService.getMonthlySummary(),
        accountingService.getOwners().catch(() => []),
        accountingService.getTenantsWithPaymentStatus().catch(() => []),
        accountingService.getDepositEligibleTenants().catch(() => []),
        accountingService.getAdvertisements().catch(() => [])
      ]);

      setOverviewData(overview);
      setTenantPayments(Array.isArray(tenantPaymentsData) ? tenantPaymentsData : (tenantPaymentsData?.payments ?? tenantPaymentsData?.tenantPayments ?? []));
      setLandlordPayments(Array.isArray(landlordPaymentsData) ? landlordPaymentsData : (landlordPaymentsData?.payments ?? landlordPaymentsData?.landlordPayments ?? []));
      setCollections(Array.isArray(collectionsData) ? collectionsData : (collectionsData?.collections ?? collectionsData?.data ?? []));
      setExpenses(Array.isArray(expensesData) ? expensesData : (expensesData?.expenses ?? expensesData?.data ?? []));
      setMonthlySummary(summary);
      setLandlords(Array.isArray(landlordsData) ? landlordsData : (landlordsData?.landlords ?? landlordsData?.data ?? []));
      setTenants(Array.isArray(tenantsData) ? tenantsData : (tenantsData?.tenants ?? tenantsData?.data ?? []));
      setDepositEligibleTenants(Array.isArray(eligibleDepositTenantsData) ? eligibleDepositTenantsData : []);
      setAdvertisements(Array.isArray(adsData) ? adsData : (adsData?.advertisements ?? adsData?.data ?? []));

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
      loadExpensesSummary();
      if (expenseViewCard === 'owner') {
        loadExpensesPerOwner();
      } else {
        loadExpenses();
      }
      loadWorkingDisbursements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, expenseBuildingFilter, expenseStartDateFilter, expenseEndDateFilter, expenseCategoryFilter, expenseViewCard]);

  useEffect(() => {
    if (activeTab === 'payments') {
      loadRentSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load cashier data
  const loadCashierData = useCallback(async () => {
    try {
      const [accounts, transactions, agencyBal] = await Promise.all([
        accountingService.getCashierAccounts().catch(() => []),
        accountingService.getCashierTransactions().catch(() => []),
        accountingService.getAgencyBalance().catch(() => ({ balance: 0 }))
      ]);
      setCashierAccounts(Array.isArray(accounts) ? accounts : []);
      setCashierTransactions(Array.isArray(transactions) ? transactions : []);
      const bal = agencyBal?.balance ?? agencyBal?.agencyBalance ?? (typeof agencyBal === 'number' ? agencyBal : 0);
      setAgencyBalance(bal);
    } catch (error) {
      console.error('Error loading cashier data:', error);
      addNotification('Failed to load cashier data', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'account-balances') {
      loadCashierData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load owners
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const needsOwners = activeTab === 'account-balances' || activeTab === 'owner-payments';
    if (needsOwners) {
      loadOwners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load tenants data
  const loadTenants = useCallback(async () => {
    try {
      const data = await accountingService.getTenantsWithPaymentStatus();
      setTenants(Array.isArray(data) ? data : []);
      const eligible = await accountingService.getDepositEligibleTenants().catch(() => []);
      setDepositEligibleTenants(Array.isArray(eligible) ? eligible : []);
    } catch (error) {
      console.error('Error loading tenants:', error);
      addNotification('Failed to load tenants', 'error');
      setTenants([]);
      setDepositEligibleTenants([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'tenant-management') {
      loadTenants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load deposits data
  const loadDeposits = useCallback(async () => {
    try {
      const data = await accountingService.getSecurityDeposits({});
      setDeposits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading deposits:', error);
      addNotification('Failed to load deposits', 'error');
      setDeposits([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, depositFilter]);

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

  // Load properties when opening property sale form
  useEffect(() => {
    if (showCollectionPaymentModal && collectionPaymentType === 'sale') {
      accountingService.getProperties().then(data => {
        setPropertiesForSale(Array.isArray(data) ? data : []);
      }).catch(() => setPropertiesForSale([]));
    }
  }, [showCollectionPaymentModal, collectionPaymentType]);

  // Ensure tenants are loaded when opening tenant or deposit payment form
  useEffect(() => {
    if (showCollectionPaymentModal && (collectionPaymentType === 'tenant' || collectionPaymentType === 'deposit')) {
      loadTenants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCollectionPaymentModal, collectionPaymentType]);

  // Load properties when opening Add Expense modal
  useEffect(() => {
    if (showExpenseModal) {
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setExpenseFormScope('Building');
      accountingService.getProperties().then(data => {
        setExpenseProperties(Array.isArray(data) ? data : []);
      }).catch(() => setExpenseProperties([]));
    }
  }, [showExpenseModal]);

  // Load units when building is selected in Add Expense form
  useEffect(() => {
    if (showExpenseModal && expenseFormBuilding) {
      const addr = typeof expenseFormBuilding === 'string' ? expenseFormBuilding : (expenseFormBuilding?.address || expenseFormBuilding?.Address || '');
      accountingService.getPropertyUnits(addr).then(data => {
        setExpenseFormUnits(Array.isArray(data) ? data : []);
      }).catch(() => setExpenseFormUnits([]));
    } else {
      setExpenseFormUnits([]);
    }
  }, [showExpenseModal, expenseFormBuilding]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load users for messaging
  const loadUsers = useCallback(async () => {
    if (isLoadingUsersRef.current) return;
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
          const userRole = (user.role || user.Role || '').toString().toLowerCase();
          const userIdStr = userId ? String(userId) : null;
          const currentUserIdStr = currentUserId ? String(currentUserId) : null;
          const isNotCurrentUser = userIdStr && userIdStr !== currentUserIdStr;
          const isNotTenant = userRole !== 'tenant';
          return isNotCurrentUser && isNotTenant;
        })
        .map(user => {
          const userId = user.id || user.ID;
          return {
            userId,
            name: user.name || user.Name || 'User',
            email: user.email || user.Email || '',
            role: user.role || user.Role || '',
            company: user.company || user.Company || '',
            status: user.status || user.Status || 'Active',
            unreadCount: 0
          };
        })
        .sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));

      try {
        const conversations = await messagingService.getConversations();
        if (Array.isArray(conversations)) {
          const existingUsersMap = new Map();
          chatUsersList.forEach(u => existingUsersMap.set(String(u.userId), u));

          conversations.forEach(conv => {
            const convUserId = String(conv.userId || conv.userID);
            const existingUser = existingUsersMap.get(convUserId);
            if (existingUser) {
              if (conv.unreadCount) existingUser.unreadCount = conv.unreadCount;
            } else {
              const convUser = conv.user || {};
              const userId = conv.userId || conv.userID || convUser.id || convUser.ID;
              const userRole = (convUser.role || convUser.Role || conv.role || '').toString().toLowerCase();
              const currentUserIdStr = currentUserId ? String(currentUserId) : null;
              if (userId && String(userId) !== currentUserIdStr && userRole !== 'tenant') {
                const newUser = {
                  userId,
                  name: convUser.name || convUser.Name || conv.name || 'User',
                  email: convUser.email || convUser.Email || conv.email || '',
                  role: convUser.role || convUser.Role || conv.role || '',
                  company: convUser.company || convUser.Company || conv.company || '',
                  status: convUser.status || convUser.Status || conv.status || 'Active',
                  unreadCount: conv.unreadCount || 0
                };
                chatUsersList.push(newUser);
                existingUsersMap.set(String(userId), newUser);
              }
            }
          });
          chatUsersList.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
        }
      } catch (convError) {
        console.error('Error loading conversations for unread counts:', convError);
      }

      setChatUsers(chatUsersList);
      setSelectedUserId(prevSelected => {
        if (chatUsersList.length > 0 && !prevSelected) {
          const firstUserId = chatUsersList[0].userId;
          setTimeout(() => loadChatForUser(firstUserId), 0);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadChatForUser]);

  // Load advertisements when advertisements or overview tab is active
  useEffect(() => {
    if (activeTab === 'advertisements' || activeTab === 'overview') {
      loadAdvertisements();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load all transaction data when transaction-history tab is active
  useEffect(() => {
    if (activeTab === 'transaction-history') {
      loadData();
      loadCashierData();
      loadDeposits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load users when chat tab is active
  useEffect(() => {
    if (activeTab === 'chat' && !isLoadingUsersRef.current) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Download receipt
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

  // Print expense receipt as PDF
  const printExpenseReceipt = (expense) => {
    if (!expense) return;
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;

    const numberToWords = (num) => {
      const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
      const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
      if (num === 0) return 'zero';
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
        return ones[hundred] + ' cent' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
      }
      return num.toString();
    };

    pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.text('sili', 20, yPos);
    pdf.setFontSize(20); pdf.text('SAAF IMMO', 20, yPos + 8);
    pdf.setFontSize(18); pdf.text('BON DE CAISSE SAAF IMMO', pageWidth - 20, yPos, { align: 'right' });
    yPos += 25;
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.text('B.F.F.', pageWidth - 20, yPos, { align: 'right' });
    yPos += 20;
    pdf.setFontSize(11);
    pdf.text('Demande de sortie de caisse presentee par Mr / Mlle / Mme', 20, yPos);
    pdf.setDrawColor(200, 200, 200); pdf.line(20, yPos + 3, pageWidth - 20, yPos + 3);
    yPos += 12;
    pdf.text('Noms et prenoms :', 20, yPos);
    pdf.text((expense.RequestedBy || expense.requestedBy || '-'), 60, yPos);
    pdf.line(60, yPos - 3, pageWidth - 20, yPos - 3);
    yPos += 12;
    pdf.text('Motif :', 20, yPos); pdf.line(40, yPos - 3, pageWidth - 20, yPos - 3);
    yPos += 8; pdf.line(20, yPos - 3, pageWidth - 20, yPos - 3);
    yPos += 15;
    const amount = expense.Amount || expense.amount || 0;
    const amountWords = numberToWords(Math.floor(amount)) + ' francs CFA';
    pdf.text('La somme de', 20, yPos); pdf.text('(en lettre) :', 20, yPos + 6);
    pdf.line(50, yPos - 3, pageWidth - 20, yPos - 3); pdf.text(amountWords, 55, yPos);
    yPos += 12;
    pdf.text('(en chiffre) :', 20, yPos);
    pdf.line(50, yPos - 3, pageWidth - 60, yPos - 3); pdf.text(amount.toFixed(2) + ' CFA', 55, yPos);
    yPos += 25;
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    pdf.text(`Fait a Abidjan, le ${dateStr}`, 20, yPos);
    yPos = pageHeight - 50;
    pdf.setFontSize(10);
    pdf.text('Caisse', 20, yPos); pdf.text('Direction financiere', pageWidth / 2 - 30, yPos, { align: 'center' }); pdf.text('Beneficiaire', pageWidth - 20, yPos, { align: 'right' });
    yPos += 20;
    pdf.line(20, yPos, 60, yPos); pdf.line(pageWidth / 2 - 50, yPos, pageWidth / 2 + 10, yPos); pdf.line(pageWidth - 60, yPos, pageWidth - 20, yPos);
    yPos = pageHeight - 25;
    pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
    pdf.text('Abidjan, Cocody Angre, 8e tranche, Immeuble King Deco, 4e etage, carrefour La Priere. Ilot 43, lot 664.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4; pdf.text('Tel : 00 225 07 04 77 51 79 / 00 225 07 04 77 51 77', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4; pdf.text('RCCM : CI-ABJ-2018-B-21320', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4; pdf.text('N CC : 1843184R', pageWidth / 2, yPos, { align: 'center' });
    if (expense.Notes || expense.notes) {
      yPos = 120; pdf.setFontSize(9); pdf.text('Details:', 20, yPos); yPos += 6;
      pdf.setFontSize(8); const notes = pdf.splitTextToSize(expense.Notes || expense.notes, pageWidth - 40); pdf.text(notes, 20, yPos);
    }
    pdf.save(`bon-de-caisse-${expense.ID || expense.id || Date.now()}.pdf`);
    addNotification('Expense receipt generated successfully', 'success');
  };

  // Helper: number to words in French
  const numberToWordsFr = (num) => {
    const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
    if (num === 0) return 'zero';
    if (num < 20) return ones[num];
    if (num < 100) {
      const ten = Math.floor(num / 10); const one = num % 10;
      if (ten === 7 || ten === 9) return tens[ten] + '-' + ones[10 + one];
      return tens[ten] + (one > 0 ? '-' + ones[one] : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100); const remainder = num % 100;
      return ones[hundred] + ' cent' + (remainder > 0 ? ' ' + numberToWordsFr(remainder) : '');
    }
    return num.toString();
  };

  // Print payment/collection receipt as PDF
  const printPaymentReceipt = async (item, isCollectionParam) => {
    if (!item) return;
    const isCollection = isCollectionParam ?? (item.Building !== undefined);
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#f0f0f0;z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow:auto;';
    document.body.appendChild(overlay);
    const container = document.createElement('div');
    overlay.appendChild(container);
    const root = ReactDOM.createRoot(container);
    root.render(<RentReceiptTemplate data={item} isCollection={isCollection} />);
    try {
      await new Promise(r => setTimeout(r, 800));
      const receiptEl = container.querySelector('.receipt-container') || container.firstChild;
      if (!receiptEl) throw new Error('Receipt element not found');
      const opt = { margin: 0, filename: `rent-receipt-${item.ID || item.id || Date.now()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, logging: false }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
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

  // Print deposit refund receipt as PDF
  const printRefundReceipt = (refund) => {
    if (!refund) return;
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;
    const amount = refund.Amount ?? refund.amount ?? 0;
    const amountWords = numberToWordsFr(Math.floor(amount)) + ' francs CFA';
    pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.text('sili', 20, yPos);
    pdf.setFontSize(20); pdf.text('SAAF IMMO', 20, yPos + 8);
    pdf.setFontSize(18); pdf.text('QUITTANCE DE REMBOURSEMENT', pageWidth - 20, yPos, { align: 'right' });
    yPos += 25;
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.text('Remboursement depot de garantie', pageWidth - 20, yPos, { align: 'right' });
    yPos += 20;
    pdf.setFontSize(11);
    pdf.text('Beneficiaire :', 20, yPos); pdf.text(refund.Tenant || refund.tenant || '-', 55, yPos); yPos += 10;
    pdf.text('Propriete :', 20, yPos); pdf.text(refund.Property || refund.property || '-', 55, yPos); yPos += 10;
    pdf.text('Methode de remboursement :', 20, yPos); pdf.text(refund.RefundMethod || refund.refundMethod || '-', 70, yPos); yPos += 10;
    pdf.text('Date du remboursement :', 20, yPos);
    const refundDate = refund.RefundedAt || refund.refundedAt;
    pdf.text(refundDate ? new Date(refundDate).toLocaleDateString('fr-FR') : '-', 70, yPos); yPos += 15;
    pdf.text('La somme de', 20, yPos); pdf.text('(en lettre) :', 20, yPos + 6);
    pdf.line(50, yPos - 3, pageWidth - 20, yPos - 3); pdf.text(amountWords, 55, yPos); yPos += 12;
    pdf.text('(en chiffre) :', 20, yPos);
    pdf.line(50, yPos - 3, pageWidth - 60, yPos - 3); pdf.text((amount || 0).toFixed(2) + ' CFA', 55, yPos); yPos += 10;
    pdf.text('N Recu :', 20, yPos); pdf.text(refund.ReceiptNumber || refund.receiptNumber || `REF-${refund.ID || refund.id || Date.now()}`, 55, yPos); yPos += 25;
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    pdf.text(`Fait a Abidjan, le ${dateStr}`, 20, yPos);
    yPos = pageHeight - 50;
    pdf.setFontSize(10);
    pdf.text('Caisse', 20, yPos); pdf.text('Direction financiere', pageWidth / 2 - 30, yPos, { align: 'center' }); pdf.text('Beneficiaire', pageWidth - 20, yPos, { align: 'right' });
    yPos += 20;
    pdf.line(20, yPos, 60, yPos); pdf.line(pageWidth / 2 - 50, yPos, pageWidth / 2 + 10, yPos); pdf.line(pageWidth - 60, yPos, pageWidth - 20, yPos);
    yPos = pageHeight - 25;
    pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
    pdf.text('Abidjan, Cocody Angre, 8e tranche, Immeuble King Deco, 4e etage, carrefour La Priere. Ilot 43, lot 664.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4; pdf.text('Tel : 00 225 07 04 77 51 79 / 00 225 07 04 77 51 77', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4; pdf.text('RCCM : CI-ABJ-2018-B-21320', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4; pdf.text('N CC : 1843184R', pageWidth / 2, yPos, { align: 'center' });
    pdf.save(`remboursement-${refund.ID || refund.id || Date.now()}.pdf`);
    addNotification('Refund receipt downloaded', 'success');
  };

  const transferToLandlord = async (paymentId) => {
    try {
      setLoading(true);
      await accountingService.transferToLandlord(paymentId);
      setLandlordPayments(prev => prev.map(p => p.ID === paymentId ? { ...p, Status: 'Paid' } : p));
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
      .filter(payment => { const status = (payment.Status || '').toLowerCase(); return status === 'successful' || status === 'failed' || status === 'approved' || status === 'rejected'; })
      .map(payment => {
        const status = (payment.Status || '').toLowerCase();
        const displayStatus = status === 'approved' ? 'Successful' : status === 'rejected' ? 'Failed' : payment.Status || 'Unknown';
        return [payment.Tenant || '', payment.Property || '', payment.Amount?.toFixed(2) || '0.00', payment.Method || '', payment.Date ? new Date(payment.Date).toLocaleDateString() : '', displayStatus, payment.Reference || payment.reference || '', payment.ReceiptNumber || ''];
      });
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `tenant-payments-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    addNotification('Payments exported to CSV successfully!', 'success');
  };

  // Import payments from file
  const handleImportPayments = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData(); formData.append('file', file);
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

  // Handle send message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedUserId) return;
    if (String(selectedUserId).startsWith('group:')) return;
    const storedUser = localStorage.getItem('user');
    let currentUserId = null;
    if (storedUser) { try { const user = JSON.parse(storedUser); currentUserId = user.id || user.ID; } catch (error) { console.error('Error parsing stored user:', error); } }
    if (!currentUserId) { addNotification('Unable to identify current user. Please log in again.', 'error'); return; }
    const content = chatInput.trim();
    const tempMessageId = `temp-${Date.now()}`;
    const optimisticMessage = { id: tempMessageId, ID: tempMessageId, fromUserId: currentUserId, toUserId: selectedUserId, content, createdAt: new Date().toISOString(), read: false, type: 'message' };
    setChatMessages(prev => [...prev, optimisticMessage]);
    setChatInput('');
    try {
      const sentMessage = await messagingService.sendMessage({ toUserId: selectedUserId, content });
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

  // Load report data
  const loadReport = async () => {
    try {
      setLoading(true);
      let data = null;
      switch (selectedReportType) {
        case 'global-financial': case 'rent-property-management': case 'deposit-report': case 'owner-report': case 'sales-report': case 'property-report': case 'tax-report': case 'management-summary':
          data = { startDate: reportStartDate, endDate: reportEndDate, period: reportPeriod }; break;
        case 'payments-by-period': data = await accountingService.getPaymentsByPeriodReport(reportStartDate, reportEndDate, reportPeriod); break;
        case 'commissions-by-period': data = await accountingService.getCommissionsByPeriodReport(reportStartDate, reportEndDate, reportPeriod); break;
        case 'refunds': data = await accountingService.getRefundsReport(reportStartDate, reportEndDate); break;
        case 'payments-by-building': data = await accountingService.getPaymentsByBuildingReport(reportStartDate, reportEndDate); break;
        case 'payments-by-tenant': data = await accountingService.getPaymentsByTenantReport(reportStartDate, reportEndDate); break;
        case 'expenses-by-period': data = await accountingService.getExpensesByPeriodReport(reportStartDate, reportEndDate); break;
        case 'collections-by-period': data = await accountingService.getCollectionsByPeriodReport(reportStartDate, reportEndDate); break;
        case 'building-performance': data = await accountingService.getBuildingPerformanceReport(reportStartDate, reportEndDate); break;
        case 'payment-status': data = await accountingService.getPaymentStatusReport(reportStartDate, reportEndDate); break;
        default: break;
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
    let headers = [], rows = [], filename = '';
    switch (selectedReportType) {
      case 'payments-by-period':
        headers = ['Period', 'Total Count', 'Total Amount', 'Successful Count', 'Successful Amount', 'Failed Count', 'Failed Amount'];
        rows = (reportData.summary || []).map(item => [item.period || '', item.totalCount || 0, item.totalAmount?.toFixed(2) || '0.00', item.successfulCount || 0, item.successfulAmount?.toFixed(2) || '0.00', item.failedCount || 0, item.failedAmount?.toFixed(2) || '0.00']);
        filename = `payments-by-period-${reportStartDate}-to-${reportEndDate}.csv`; break;
      case 'commissions-by-period':
        headers = ['Period', 'Total Commission', 'Payment Count', 'Average Commission'];
        rows = (reportData.summary || []).map(item => [item.period || '', item.totalCommission?.toFixed(2) || '0.00', item.paymentCount || 0, item.averageCommission?.toFixed(2) || '0.00']);
        filename = `commissions-by-period-${reportStartDate}-to-${reportEndDate}.csv`; break;
      case 'refunds':
        headers = ['Tenant', 'Property', 'Amount', 'Method', 'Date', 'Status'];
        rows = (reportData.refunds || []).map(item => [item.Tenant || item.tenant || '', item.Property || item.property || '', item.Amount?.toFixed(2) || '0.00', item.Method || item.method || '', item.Date ? new Date(item.Date || item.date).toLocaleDateString() : '', item.Status || item.status || '']);
        filename = `refunds-${reportStartDate}-to-${reportEndDate}.csv`; break;
      case 'payments-by-building':
        headers = ['Building', 'Total Amount', 'Payment Count', 'Rent Amount', 'Deposit Amount', 'Other Amount'];
        rows = (reportData.summary || []).map(item => [item.building || '', item.totalAmount?.toFixed(2) || '0.00', item.paymentCount || 0, item.rentAmount?.toFixed(2) || '0.00', item.depositAmount?.toFixed(2) || '0.00', item.otherAmount?.toFixed(2) || '0.00']);
        filename = `payments-by-building-${reportStartDate}-to-${reportEndDate}.csv`; break;
      case 'payments-by-tenant':
        headers = ['Tenant', 'Property', 'Total Amount', 'Payment Count', 'Last Payment Date'];
        rows = (reportData.summary || []).map(item => [item.tenant || '', item.property || '', item.totalAmount?.toFixed(2) || '0.00', item.paymentCount || 0, item.lastPaymentDate ? new Date(item.lastPaymentDate).toLocaleDateString() : '']);
        filename = `payments-by-tenant-${reportStartDate}-to-${reportEndDate}.csv`; break;
      case 'expenses-by-period':
        headers = ['Period', 'Total Amount', 'Expense Count'];
        rows = (reportData.summary || []).map(item => [item.period || '', item.totalAmount?.toFixed(2) || '0.00', item.expenseCount || 0]);
        filename = `expenses-by-period-${reportStartDate}-to-${reportEndDate}.csv`; break;
      case 'collections-by-period':
        headers = ['Period', 'Total Amount', 'Collection Count'];
        rows = (reportData.summary || []).map(item => [item.period || '', item.totalAmount?.toFixed(2) || '0.00', item.collectionCount || 0]);
        filename = `collections-by-period-${reportStartDate}-to-${reportEndDate}.csv`; break;
      case 'building-performance':
        headers = ['Building', 'Total Collections', 'Total Expenses', 'Net Revenue', 'Occupancy Rate', 'Payment Collection Rate'];
        rows = (reportData.buildings || []).map(item => [item.building || '', item.totalCollections?.toFixed(2) || '0.00', item.totalExpenses?.toFixed(2) || '0.00', item.netRevenue?.toFixed(2) || '0.00', item.occupancyRate?.toFixed(2) || '0.00', item.paymentCollectionRate?.toFixed(2) || '0.00']);
        filename = `building-performance-${reportStartDate}-to-${reportEndDate}.csv`; break;
      case 'payment-status':
        headers = ['Status', 'Count', 'Total Amount'];
        rows = (reportData.statusBreakdown || []).map(item => [item.status || '', item.count || 0, item.totalAmount?.toFixed(2) || '0.00']);
        filename = `payment-status-${reportStartDate}-to-${reportEndDate}.csv`; break;
      default: return;
    }
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    addNotification('Report exported to CSV successfully!', 'success');
  };

  // Get filtered expenses
  const getFilteredExpenses = () => {
    let filtered = [...expenses];
    if (expenseBuildingFilter) filtered = filtered.filter(exp => (exp.Building || exp.building || '').toString().trim() === expenseBuildingFilter);
    if (expenseCategoryFilter) filtered = filtered.filter(exp => (exp.Category || exp.category || '').toString().trim() === expenseCategoryFilter);
    if (expenseScopeFilter) filtered = filtered.filter(exp => (exp.Scope || exp.scope || '').toLowerCase() === expenseScopeFilter.toLowerCase());
    if (expenseOwnerFilter) filtered = filtered.filter(exp => (exp.Owner || exp.owner || exp.Landlord || exp.landlord || '').toLowerCase().includes(expenseOwnerFilter.toLowerCase()));
    if (expenseStartDateFilter) filtered = filtered.filter(exp => { const d = exp.Date || exp.date; return !d || new Date(d) >= new Date(expenseStartDateFilter); });
    if (expenseEndDateFilter) filtered = filtered.filter(exp => { const d = exp.Date || exp.date; return !d || new Date(d) <= new Date(expenseEndDateFilter + 'T23:59:59'); });
    if (expenseSearchText) {
      const searchLower = expenseSearchText.toLowerCase();
      filtered = filtered.filter(exp => (exp.Building || exp.building || '').toLowerCase().includes(searchLower) || (exp.Category || exp.category || '').toLowerCase().includes(searchLower) || (exp.Notes || exp.notes || '').toLowerCase().includes(searchLower) || (exp.Scope || exp.scope || '').toLowerCase().includes(searchLower));
    }
    return filtered;
  };

  // Export expenses to CSV
  const exportExpensesToCSV = () => {
    const filteredExpenses = getFilteredExpenses();
    const headers = ['Date', 'Scope', 'Building', 'Owner', 'Category', 'Requested by', 'Amount', 'Notes'];
    const rows = filteredExpenses.map(exp => [
      exp.Date || exp.date ? new Date(exp.Date || exp.date).toLocaleDateString() : '', exp.Scope || exp.scope || '', exp.Building || exp.building || '', exp.Owner || exp.owner || exp.Landlord || exp.landlord || '', exp.Category || exp.category || '', (exp.RequestedBy || exp.requestedBy || '').replace(/"/g, '""'), (exp.Amount || exp.amount || 0).toFixed(2), (exp.Notes || exp.notes || '').replace(/"/g, '""')
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    const dateRange = expenseStartDateFilter && expenseEndDateFilter ? `${expenseStartDateFilter}-to-${expenseEndDateFilter}` : new Date().toISOString().split('T')[0];
    a.download = `expenses-${dateRange}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    addNotification('Expenses exported to CSV successfully!', 'success');
  };

  // Shared props passed to all tab components
  const sharedProps = {
    loading, setLoading, addNotification,
    overviewData, setOverviewData, tenantPayments, setTenantPayments, landlordPayments, setLandlordPayments,
    collections, setCollections, expenses, setExpenses, workingDisbursements, setWorkingDisbursements, monthlySummary, advertisements, landlords,
    currentAdIndex, setCurrentAdIndex, carouselIntervalRef,
    tenants, setTenants, deposits, setDeposits, pendingRefunds, setPendingRefunds,
    cashierAccounts, setCashierAccounts, cashierTransactions, setCashierTransactions, agencyBalance,
    ownerBalancesOwners, ownerBalancesLoading, selectedOwnerForBalance, setSelectedOwnerForBalance,
    selectedOwnerForPaymentsHistory, setSelectedOwnerForPaymentsHistory,
    ownerView, setOwnerView, ownerPaymentsLandlordFilter, setOwnerPaymentsLandlordFilter,
    ownerPaymentsBuildingFilter, setOwnerPaymentsBuildingFilter, ownerPaymentsStartDate, setOwnerPaymentsStartDate,
    ownerPaymentsEndDate, setOwnerPaymentsEndDate, ownerPaymentsMonthFilter, setOwnerPaymentsMonthFilter,
    selectedLandlord, setSelectedLandlord, landlordProperties, setLandlordProperties,
    showLandlordPaymentModal, setShowLandlordPaymentModal,
    selectedTenant, setSelectedTenant, tenantPaymentStatusFilter, setTenantPaymentStatusFilter,
    tenantNameFilter, setTenantNameFilter,
    depositEligibleTenants, setDepositEligibleTenants,
    depositFilter, setDepositFilter, depositStartDateFilter, setDepositStartDateFilter,
    depositEndDateFilter, setDepositEndDateFilter,
    showDepositPaymentModal, setShowDepositPaymentModal, showDepositRefundModal, setShowDepositRefundModal,
    depositPaymentForm, setDepositPaymentForm, depositRefundForm, setDepositRefundForm,
    showProcessDepositModal, setShowProcessDepositModal, processDepositItem, setProcessDepositItem,
    processDepositManualAmount, setProcessDepositManualAmount,
    showCollectionPaymentModal, setShowCollectionPaymentModal, collectionPaymentType, setCollectionPaymentType,
    collectionPaymentForm, setCollectionPaymentForm, propertiesForSale,
    paymentView, setPaymentView, paymentStatusFilter, setPaymentStatusFilter,
    paymentNameFilter, setPaymentNameFilter, paymentDateStartFilter, setPaymentDateStartFilter,
    paymentDateEndFilter, setPaymentDateEndFilter,
    showExpenseModal, setShowExpenseModal, showViewExpenseModal, setShowViewExpenseModal,
    showEditExpenseModal, setShowEditExpenseModal, selectedExpense, setSelectedExpense,
    expenseBuildingFilter, setExpenseBuildingFilter, expenseCategoryFilter, setExpenseCategoryFilter,
    expenseScopeFilter, setExpenseScopeFilter, expenseOwnerFilter, setExpenseOwnerFilter,
    expenseStartDateFilter, setExpenseStartDateFilter, expenseEndDateFilter, setExpenseEndDateFilter,
    expenseSearchText, setExpenseSearchText, expenseViewCard, setExpenseViewCard, expensePanelMode, setExpensePanelMode,
    expensesSummary, expensesPerOwner,
    expenseProperties, expenseFormScope, setExpenseFormScope, expenseFormBuilding, setExpenseFormBuilding, expenseFormUnits, setExpenseFormUnits, expenseDate, setExpenseDate,
    showCashierAccountModal, setShowCashierAccountModal, showCashierTransactionModal, setShowCashierTransactionModal,
    cashierAccountForm, setCashierAccountForm, cashierTransactionForm, setCashierTransactionForm,
    showApprovalModal, setShowApprovalModal, selectedPayment, setSelectedPayment,
    showPaymentViewModal, setShowPaymentViewModal, selectedItemForView, setSelectedItemForView,
    historyStartDateFilter, setHistoryStartDateFilter, historyEndDateFilter, setHistoryEndDateFilter,
    historyTypeFilter, setHistoryTypeFilter, historyNameFilter, setHistoryNameFilter,
    selectedMonth, setSelectedMonth, rentSummary,
    selectedReportType, setSelectedReportType, reportStartDate, setReportStartDate,
    reportEndDate, setReportEndDate, reportPeriod, setReportPeriod, reportData, setReportData,
    chatUsers, selectedUserId, chatMessages, chatInput, setChatInput, messagesEndRef,
    // Functions
    downloadReceipt, sendReceipt, printExpenseReceipt, printPaymentReceipt, printRefundReceipt,
    transferToLandlord, exportPaymentsToCSV, handleImportPayments, handleSendMessage,
    loadChatForUser, loadExpenses, loadWorkingDisbursements, loadCashierData, loadDeposits, loadDepositRefundsPending,
    loadReport, exportReportToCSV, getFilteredExpenses, exportExpensesToCSV,
    markExpenseAsPaid,
    loadData,
  };

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview': return <OverviewTab {...sharedProps} />;
      case 'payments': return <PaymentsTab {...sharedProps} />;
      case 'expenses': return <ExpensesTab {...sharedProps} />;
      case 'deposit-refunds': return <DepositRefundsTab {...sharedProps} />;
      case 'tenant-management':
        return <TenantManagementTab {...sharedProps} />;
      case 'account-balances': return <AccountBalancesTab {...sharedProps} />;
      case 'owner-payments': return <OwnerPaymentsTab {...sharedProps} />;
      case 'transaction-history': return <TransactionHistoryTab {...sharedProps} />;
      case 'states-taxes': return <StatesTaxesTab {...sharedProps} />;
      case 'reports': return <ReportsTab {...sharedProps} />;
      case 'advertisements': return <AdvertisementsTab {...sharedProps} />;
      case 'messages': return <MessagesTab {...sharedProps} />;
      case 'settings': return <div className="embedded-settings"><SettingsPage /></div>;
      // Legacy support
      case 'collections': return <PaymentsTab {...sharedProps} />;
      case 'tenant-payments': return <PaymentsTab {...sharedProps} />;
      case 'tenants': return <TenantManagementTab {...sharedProps} />;
      case 'history': return <TransactionHistoryTab {...sharedProps} />;
      case 'cashier': return <AccountBalancesTab {...sharedProps} />;
      case 'chat': return <MessagesTab {...sharedProps} />;
      default: return <OverviewTab {...sharedProps} />;
    }
  };

  const layoutMenu = useMemo(
    () => tabs.map(tab => ({ ...tab, onSelect: () => setActiveTab(tab.id), active: activeTab === tab.id })),
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
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>x</button>
          </div>
        ))}
      </div>

      {/* Deposit modals */}
      <DepositRefundsTab.Modals {...sharedProps} />

      {/* Payment Approval Modal */}
      {showApprovalModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('accounting.confirmPaymentApproval')}</h3>
              <button className="modal-close" onClick={() => setShowApprovalModal(false)}>x</button>
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
                <button type="button" className="action-button secondary" onClick={() => setShowApprovalModal(false)}>Cancel</button>
                <button type="button" className="action-button primary" onClick={async () => {
                  try {
                    setLoading(true);
                    await accountingService.approveTenantPayment(selectedPayment.id || selectedPayment.ID);
                    addNotification('Payment approved successfully!', 'success');
                    setShowApprovalModal(false); setSelectedPayment(null);
                    const updatedPayments = await accountingService.listTenantPayments();
                    setTenantPayments(Array.isArray(updatedPayments) ? updatedPayments : []);
                  } catch (error) {
                    console.error('Error approving payment:', error);
                    addNotification(error.message || 'Failed to approve payment', 'error');
                  } finally { setLoading(false); }
                }}>Approve Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Landlord Payment Recording Modal */}
      {showLandlordPaymentModal && <OwnerPaymentsTab.LandlordModal {...sharedProps} />}

      {/* Collections Payment Recording Modal */}
      {showCollectionPaymentModal && <PaymentsTab.CollectionModal {...sharedProps} />}

      {/* Expense Modal */}
      {showExpenseModal && <ExpensesTab.AddModal {...sharedProps} />}

      {/* View Payment/Collection Modal */}
      {showPaymentViewModal && selectedItemForView && <PaymentsTab.ViewModal {...sharedProps} />}

      {/* View Expense Modal */}
      {showViewExpenseModal && selectedExpense && <ExpensesTab.ViewModal {...sharedProps} />}

      {/* Edit Expense Modal */}
      {showEditExpenseModal && selectedExpense && <ExpensesTab.EditModal {...sharedProps} />}

      {/* Cashier modals */}
      {showCashierAccountModal && <AccountBalancesTab.AccountModal {...sharedProps} />}
      {showCashierTransactionModal && <AccountBalancesTab.TransactionModal {...sharedProps} />}
    </>
  );
};

export default AccountingDashboard;
