import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReportSubmission from '../components/ReportSubmission';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer } from
'recharts';
import {
  Home,
  DollarSign,
  Wrench,
  Calendar,
  Camera,
  Upload,
  X,
  Smartphone,
  Banknote,
  Download,
  Settings,
  Plus,
  MessageCircle,
  Megaphone,
  FileX,
  UserPlus,
  Phone,
  Copy,
  Search,
  FileCheck,
  Zap } from
'lucide-react';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import { t, getLanguage } from '../utils/i18n';
import { tenantService } from '../services/tenantService';
import { saveRentReceiptPdf } from '../utils/rentReceiptPdf';
import { messagingService } from '../services/messagingService';
import { API_CONFIG } from '../config/api';
import { isDemoMode, getTenantDemoData } from '../utils/demoData';
import { cloudinaryService } from '../services/cloudinaryService';
import '../components/RoleLayout.css';
import './SalesManagerDashboard.css';
const TRANSFER_INDIVIDUAL_DOCUMENTS = [
{ key: 'id_document', label: 'CNI, passport or identity certificate' },
{ key: 'employment_contract', label: 'Employment contract' },
{ key: 'work_certificate', label: 'Certificate of work' },
{ key: 'pay_slips', label: 'Last three pay slips' },
{ key: 'last_utility_receipt', label: 'Last receipt (CIE or SODECI)' },
{ key: 'last_rent_receipts', label: 'Last rent receipts' },
{ key: 'rib', label: 'RIB' }];


const TenantDashboard = () => {
  const addMonths = (date, months) => {
    const base = new Date(date);
    const day = base.getDate();
    base.setMonth(base.getMonth() + months);
    if (base.getDate() < day) {
      base.setDate(0);
    }
    return base;
  };
  const shiftBusinessDays = (date, offset) => {
    const result = new Date(date);
    const step = offset >= 0 ? 1 : -1;
    let remaining = Math.abs(offset);
    while (remaining > 0) {
      result.setDate(result.getDate() + step);
      const day = result.getDay();
      if (day !== 0 && day !== 6) {
        remaining -= 1;
      }
    }
    return result;
  };

  const minTerminationDate = addMonths(new Date(), 3).toISOString().split('T')[0];
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
  const [showBillsModal, setShowBillsModal] = useState(false);
  const [billsForm, setBillsForm] = useState({
    billType: 'water',
    amount: '',
    paymentMethod: '',
    reference: ''
  });
  const [showTerminateLeaseModal, setShowTerminateLeaseModal] = useState(false);
  const [terminateLeaseForm, setTerminateLeaseForm] = useState({
    reason: '',
    terminationDate: '',
    comments: '',
    inventoryCheckDate: '',
    inventoryCheckTime: '',
    securityDepositRefundMethod: '',
    mobileMoneyNumber: '',
    terminationLetter: null,
    supportingDocs: []
  });
  const [inventoryDateRange, setInventoryDateRange] = useState({ min: '', max: '' });
  const [showTransferPaymentModal, setShowTransferPaymentModal] = useState(false);
  const [transferPaymentForm, setTransferPaymentForm] = useState({
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    relationship: '',
    recipientIdCard: '',
    entryDate: '',
    reason: ''
  });
  const [transferDocFiles, setTransferDocFiles] = useState({});
  const transferDocFileInputRefs = useRef({});
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [leaseInfo, setLeaseInfo] = useState(null);
  const [payments, setPayments] = useState([]);
  const [transferRequests, setTransferRequests] = useState([]);
  const [paymentsTab, setPaymentsTab] = useState('payments');
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [showMaintenanceViewModal, setShowMaintenanceViewModal] = useState(false);
  const [selectedMaintenanceRequest, setSelectedMaintenanceRequest] = useState(null);
  const [technicianContacts, setTechnicianContacts] = useState([]);
  const [technicianContactSearch, setTechnicianContactSearch] = useState('');
  const [myInventory, setMyInventory] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const isLoadingUsersRef = useRef(false);
  const messagesEndRef = useRef(null);
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
    { id: 'payments', label: t('nav.payments'), icon: DollarSign },
    { id: 'maintenance', label: t('technician.maintenance'), icon: Wrench },
    { id: 'technician-contacts', label: 'Technician Contacts', icon: Phone },
    { id: 'state-of-entry-exit', label: 'State of Entry / Exit', icon: FileCheck },
    { id: 'advertisements', label: t('nav.advertisements'), icon: Megaphone },
    { id: 'chat', label: t('nav.messages'), icon: MessageCircle },
    { id: 'settings', label: t('nav.profileSettings'), icon: Settings }],

    [language]
  );

  const addNotification = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      if (isDemoMode()) {
        const demoData = getTenantDemoData();
        setOverviewData(demoData.overview);
        setLeaseInfo(demoData.leaseInfo);
        setPayments(demoData.payments);
        setMaintenanceRequests(demoData.maintenanceRequests);
        setLoading(false);
        return;
      }

      const [overview, paymentsData, transfersData, maintenanceData, lease] = await Promise.all([
      tenantService.getOverview().catch(() => null),
      tenantService.listPayments().catch(() => []),
      tenantService.listTransferRequests().catch(() => []),
      tenantService.listMaintenance().catch(() => []),
      tenantService.getLeaseInfo().catch(() => null)]
      );

      setOverviewData(overview);
      setLeaseInfo(lease);
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
      setPayments(paymentsArray);
      const transfersArray = Array.isArray(transfersData) ? transfersData : [];
      setTransferRequests(transfersArray);
      const maintenanceArray = Array.isArray(maintenanceData) ? maintenanceData : [];
      setMaintenanceRequests(maintenanceArray);
    } catch (error) {
      console.error('Error loading data:', error);
      if (!isDemoMode()) {
        addNotification('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  const loadPayments = async () => {
    try {
      if (isDemoMode()) {
        const demoData = getTenantDemoData();
        setPayments(demoData.payments || []);
        setTransferRequests(demoData.transferRequests || []);
        return;
      }
      const [paymentsData, transfersData] = await Promise.all([
      tenantService.listPayments(),
      tenantService.listTransferRequests()]
      );
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setTransferRequests(Array.isArray(transfersData) ? transfersData : []);
    } catch (error) {
      console.error('Error loading payments/transfers:', error);
      if (!isDemoMode()) {
        addNotification('Failed to load payment data', 'error');
        setPayments([]);
        setTransferRequests([]);
      }
    }
  };
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
  const loadTechnicianContacts = async () => {
    try {
      if (isDemoMode()) {
        const demoData = getTenantDemoData();
        setTechnicianContacts(demoData.technicianContacts || []);
        return;
      }

      const contacts = await tenantService.getTechnicianContacts();
      setTechnicianContacts(Array.isArray(contacts) ? contacts : []);
    } catch (error) {
      console.error('Failed to load technician contacts:', error);
      addNotification('Failed to load technician contacts', 'error');
      setTechnicianContacts([]);
    }
  };
  const loadMyInventory = async () => {
    try {
      if (isDemoMode()) {
        setMyInventory([]);
        return;
      }
      const list = await tenantService.getMyInventory();
      setMyInventory(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to load state of entry/exit:', error);
      addNotification('Failed to load state of entry/exit', 'error');
      setMyInventory([]);
    }
  };
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
      let currentRole = '';
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          currentUserId = user.id || user.ID;
          currentRole = (user.role || user.Role || '').toString().toLowerCase();
          console.log('Current user ID:', currentUserId);
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
      const tenantAllowedRoles = new Set(['admin', 'technician']);
      const chatUsersList = usersArray.
      filter((user) => {
        const userId = user.id || user.ID;
        const userIdStr = userId ? String(userId) : null;
        const currentUserIdStr = currentUserId ? String(currentUserId) : null;
        const shouldInclude = userIdStr && userIdStr !== currentUserIdStr;
        if (!shouldInclude && userIdStr) {
          console.log(`Excluding user ${userIdStr} (current user: ${currentUserIdStr})`);
        }
        if (!shouldInclude) return false;
        const role = (user.role || user.Role || '').toString().toLowerCase();
        if (currentRole === 'tenant' && !tenantAllowedRoles.has(role)) return false;
        return true;
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
              const convRole = (convUser.role || convUser.Role || conv.role || '').toString().toLowerCase();
              if (currentRole === 'tenant' && !tenantAllowedRoles.has(convRole)) return;

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

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedUserId) return;

    const content = chatInput.trim();
    const tempMessageId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempMessageId,
      content: content,
      senderId: null,
      receiverId: selectedUserId,
      createdAt: new Date().toISOString(),
      isOptimistic: true
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!terminateLeaseForm.terminationDate) {
      setInventoryDateRange({ min: '', max: '' });
      return;
    }
    const terminationDate = new Date(terminateLeaseForm.terminationDate);
    if (Number.isNaN(terminationDate.getTime())) {
      setInventoryDateRange({ min: '', max: '' });
      return;
    }
    const dayAfter = new Date(terminationDate);
    dayAfter.setDate(dayAfter.getDate() + 1);
    const minDate = dayAfter;
    const nextMonth = new Date(terminationDate.getFullYear(), terminationDate.getMonth() + 1, 1);
    const maxDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 4);
    const min = minDate.toISOString().split('T')[0];
    const max = maxDate.toISOString().split('T')[0];
    setInventoryDateRange({ min, max });

    if (
    terminateLeaseForm.inventoryCheckDate && (
    terminateLeaseForm.inventoryCheckDate < min ||
    terminateLeaseForm.inventoryCheckDate > max))
    {
      setTerminateLeaseForm((prev) => ({ ...prev, inventoryCheckDate: '', inventoryCheckTime: '' }));
    }
  }, [terminateLeaseForm.terminationDate]);
  useEffect(() => {
    if (activeTab === 'advertisements') {
      loadAdvertisements();
    }
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === 'technician-contacts') {
      loadTechnicianContacts();
    }
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === 'state-of-entry-exit') {
      loadMyInventory();
    }
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === 'chat' && !isLoadingUsersRef.current) {
      loadUsers();
    }
  }, [activeTab]);

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      let property = 'Apartment 4B, 123 Main St';
      if (leaseInfo && leaseInfo.property) {
        property = leaseInfo.property;
      } else if (overviewData) {
        if (overviewData.lease && overviewData.lease.property) {
          property = overviewData.lease.property;
        } else if (overviewData.property) {
          property = overviewData.property;
        }
      }
      let tenantName = 'Current Tenant';
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          tenantName = user.name || user.Name || tenantName;
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
      if (overviewData && overviewData.tenant) {
        tenantName = overviewData.tenant;
      }
      let photoUrls = [];
      if (maintenanceForm.photos && maintenanceForm.photos.length > 0) {
        addNotification('Uploading photos...', 'info');
        const uploadResults = await cloudinaryService.uploadMultipleFiles(
          maintenanceForm.photos.map((photo) => photo.file),
          'real-estate-maintenance'
        );
        photoUrls = uploadResults.
        filter((result) => result.success).
        map((result) => result.url);

        if (uploadResults.some((result) => !result.success)) {
          addNotification('Some photos failed to upload, but request will be submitted', 'warning');
        }
      }

      const maintenanceData = {
        property: property,
        title: maintenanceForm.title,
        description: maintenanceForm.description,
        priority: maintenanceForm.priority,
        tenant: tenantName,
        photos: photoUrls
      };

      const newRequest = await tenantService.createMaintenance(maintenanceData);
      setMaintenanceRequests((prev) => [newRequest, ...prev]);
      addNotification('Maintenance request submitted successfully!', 'success');
      maintenanceForm.photos.forEach((photo) => {
        if (photo.preview && photo.preview.startsWith('blob:')) {
          URL.revokeObjectURL(photo.preview);
        }
      });

      setMaintenanceForm({ title: '', description: '', priority: 'medium', photos: [] });
      setShowMaintenanceModal(false);
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      addNotification(error.message || 'Failed to submit maintenance request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxPhotos = 5;
    const currentPhotoCount = maintenanceForm.photos.length;
    const remainingSlots = maxPhotos - currentPhotoCount;

    if (remainingSlots <= 0) {
      addNotification(`Maximum ${maxPhotos} photos allowed`, 'warning');
      e.target.value = '';
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      addNotification(`Only ${remainingSlots} more photo(s) can be added (max ${maxPhotos})`, 'warning');
    }

    const newPhotos = filesToAdd.map((file) => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      preview: URL.createObjectURL(file)
    }));

    setMaintenanceForm((prev) => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));

    e.target.value = '';
  };

  const removePhoto = (photoId) => {
    setMaintenanceForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((photo) => photo.id !== photoId)
    }));
  };

  const handleTerminateLeaseSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (!terminateLeaseForm.terminationDate) {
        addNotification('Please select a termination date.', 'error');
        setLoading(false);
        return;
      }
      if (terminateLeaseForm.terminationDate < minTerminationDate) {
        addNotification('Termination date must be at least 3 months from today.', 'error');
        setLoading(false);
        return;
      }
      if (
      terminateLeaseForm.inventoryCheckDate &&
      inventoryDateRange.min && (
      terminateLeaseForm.inventoryCheckDate < inventoryDateRange.min ||
      terminateLeaseForm.inventoryCheckDate > inventoryDateRange.max))
      {
        addNotification('State of exit: inventory date must be before the 5th of the next month.', 'error');
        setLoading(false);
        return;
      }
      if (!terminateLeaseForm.terminationLetter) {
        addNotification('Termination letter is required.', 'error');
        setLoading(false);
        return;
      }

      const refundMethodMap = {
        mobile_money: 'Mobile Money',
        bank_transfer: 'Bank Transfer',
        cash: 'Cash',
        'Mobile Money': 'Mobile Money',
        'Bank Transfer': 'Bank Transfer',
        'Cash': 'Cash'
      };
      const normalizedRefundMethod =
      refundMethodMap[terminateLeaseForm.securityDepositRefundMethod] ||
      terminateLeaseForm.securityDepositRefundMethod;

      if (normalizedRefundMethod === 'Mobile Money' && !terminateLeaseForm.mobileMoneyNumber) {
        addNotification('Mobile money number is required for Mobile Money refunds.', 'error');
        setLoading(false);
        return;
      }

      await tenantService.terminateLease({
        ...terminateLeaseForm,
        securityDepositRefundMethod: normalizedRefundMethod
      });

      addNotification('Lease termination request submitted successfully!', 'success');

      setTerminateLeaseForm({
        reason: '',
        terminationDate: '',
        comments: '',
        inventoryCheckDate: '',
        inventoryCheckTime: '',
        securityDepositRefundMethod: '',
        mobileMoneyNumber: '',
        terminationLetter: null,
        supportingDocs: []
      });
      setShowTerminateLeaseModal(false);
    } catch (error) {
      console.error('Error submitting lease termination request:', error);
      addNotification(error.message || 'Failed to submit lease termination request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferPaymentSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      let property = '';
      if (leaseInfo) {
        property = leaseInfo.property || leaseInfo.Property || leaseInfo.address || leaseInfo.Address || '';
      }
      if (!property && overviewData) {
        property =
        overviewData.property ||
        overviewData.Property ||
        overviewData.lease && (overviewData.lease.property || overviewData.lease.Property || overviewData.lease.address || overviewData.lease.Address) ||
        '';
      }
      if (!property) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            property = user.property || user.Property || '';
          } catch (error) {
            console.error('Error parsing stored user:', error);
          }
        }
      }
      if (!property || property.trim() === '') {
        addNotification('Property information is required. Please ensure you have an active lease.', 'error');
        setLoading(false);
        return;
      }

      if (!transferPaymentForm.recipientIdCard || transferPaymentForm.recipientIdCard.trim() === '') {
        addNotification('Recipient ID Card Number is required', 'error');
        setLoading(false);
        return;
      }

      if (!transferPaymentForm.entryDate || transferPaymentForm.entryDate.trim() === '') {
        addNotification('Recipient Entry Date is required', 'error');
        setLoading(false);
        return;
      }

      const requiredDocs = TRANSFER_INDIVIDUAL_DOCUMENTS;
      const missingDocs = requiredDocs.filter((doc) => !transferDocFiles[doc.key]);
      if (missingDocs.length > 0) {
        addNotification('Please upload all required documents for the person being transferred to.', 'error');
        setLoading(false);
        return;
      }

      const fileUrls = [];
      for (const doc of requiredDocs) {
        const file = transferDocFiles[doc.key];
        if (file) {
          const result = await cloudinaryService.uploadFile(file, 'real-estate-transfer-docs');
          if (result.success && result.url) {
            fileUrls.push(result.url);
          } else {
            addNotification(result.error || `Failed to upload ${doc.label}`, 'error');
            setLoading(false);
            return;
          }
        }
      }

      const transferData = {
        property: property.trim(),
        recipientIdCard: transferPaymentForm.recipientIdCard.trim(),
        entryDate: transferPaymentForm.entryDate,
        recipientName: transferPaymentForm.recipientName.trim(),
        recipientEmail: transferPaymentForm.recipientEmail.trim(),
        recipientPhone: transferPaymentForm.recipientPhone.trim(),
        relationship: transferPaymentForm.relationship,
        reason: transferPaymentForm.reason.trim(),
        files: fileUrls
      };

      await tenantService.transferPaymentRequest(transferData);

      addNotification('Payment transfer request submitted successfully!', 'success');

      setTransferPaymentForm({
        recipientName: '',
        recipientEmail: '',
        recipientPhone: '',
        relationship: '',
        recipientIdCard: '',
        entryDate: '',
        reason: ''
      });
      setTransferDocFiles({});
      Object.values(transferDocFileInputRefs.current).forEach((el) => {if (el) el.value = '';});
      setShowTransferPaymentModal(false);
      await loadPayments();
    } catch (error) {
      console.error('Error submitting payment transfer request:', error);
      addNotification(error.message || 'Failed to submit payment transfer request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      let tenantName = 'Current Tenant';
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          tenantName = user.name || user.Name || tenantName;
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
      if (overviewData && overviewData.tenant) {
        tenantName = overviewData.tenant;
      }
      let property = 'Apartment 4B, 123 Main St';
      if (leaseInfo && leaseInfo.property) {
        property = leaseInfo.property;
      } else if (overviewData) {
        if (overviewData.lease && overviewData.lease.property) {
          property = overviewData.lease.property;
        } else if (overviewData.property) {
          property = overviewData.property;
        }
      }
      if (paymentForm.paymentMethod !== 'Mobile Money') {
        addNotification('Payment method must be Mobile Money', 'error');
        setLoading(false);
        return;
      }

      const paymentData = {
        tenant: tenantName,
        property: property,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.paymentMethod,
        chargeType: 'rent',
        reference: paymentForm.reference
      };

      console.log('Submitting payment with data:', paymentData);
      await tenantService.recordPayment(paymentData);
      addNotification('Payment submitted successfully!', 'success');
      setPaymentForm({ amount: '', paymentMethod: '', reference: '' });
      setShowPaymentModal(false);
      await loadPayments();
    } catch (error) {
      console.error('Error submitting payment:', error);
      addNotification(error.message || 'Failed to submit payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBillsSubmit = async (e) => {
    e.preventDefault();
    if (!billsForm.amount || !billsForm.paymentMethod || !billsForm.reference) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }
    if (billsForm.paymentMethod !== 'Mobile Money') {
      addNotification('Payment method must be Mobile Money', 'error');
      return;
    }
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantName = user.name || user.Name || user.tenant || 'Tenant';
      let property = '';
      if (isDemoMode()) {
        property = 'Demo Property';
      } else if (leaseInfo?.property) {
        property = leaseInfo.property;
      } else if (overviewData?.lease?.property) {
        property = overviewData.lease.property;
      } else if (overviewData?.property) {
        property = overviewData.property;
      }
      if (!property || !property.trim()) {
        addNotification('Missing property on your lease. Please contact support.', 'error');
        setLoading(false);
        return;
      }
      const chargeType = billsForm.billType === 'water' ? 'Water' : 'Electricity';
      const paymentData = {
        tenant: tenantName,
        property,
        amount: parseFloat(billsForm.amount),
        method: billsForm.paymentMethod,
        chargeType,
        reference: billsForm.reference
      };
      await tenantService.recordPayment(paymentData);
      addNotification(`${chargeType} bill payment submitted successfully!`, 'success');
      setBillsForm({ billType: 'water', amount: '', paymentMethod: '', reference: '' });
      setShowBillsModal(false);
      await loadPayments();
    } catch (error) {
      console.error('Error submitting bill payment:', error);
      addNotification(error.message || 'Failed to submit bill payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (paymentId) => {
    try {
      const payment = payments.find((p) => p.ID === paymentId);
      if (!payment) {
        addNotification('Payment not found', 'error');
        return;
      }

      const status = (payment.Status || payment.status || '').toLowerCase();
      const isApproved = status === 'approved' || status === 'completed' || status === 'paid';
      if (!isApproved) {
        addNotification('Receipt is available only after the payment is approved.', 'warning');
        return;
      }

      const fileName = `rent-receipt-${payment.ID || paymentId}.pdf`;
      await saveRentReceiptPdf({ item: payment, isCollection: false, filename: fileName });
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
      lease: { property: '', endDate: '' },
      nextRentDue: { amount: null, date: '' },
      openMaintenanceTickets: 0,
      tenant: ''
    };
    const nextRentDueAmount = Number(data.nextRentDue?.amount ?? 0);
    const leaseRentAmount = Number(data.lease?.rent ?? 0);
    const displayNextRentDueAmount = nextRentDueAmount > 0 ? nextRentDueAmount : leaseRentAmount;
    const openMaintenanceCount = maintenanceRequests.filter((m) => {
      const status = (m.Status || m.status || '').toLowerCase();
      return status === 'pending' || status === 'in progress' || status === 'in-progress';
    }).length;

    return (
      <div className="sa-overview-page">
        <div className="sa-overview-top">
          <div className="sa-overview-chart-card">
            <div className="sa-card-header">
              <h2>Tenant Dashboard</h2>
              <span className="sa-card-subtitle">Welcome, {data.tenant || 'Tenant'}!</span>
            </div>
            <div className="sa-mini-legend">
              <span className="sa-legend-item sa-legend-expected">Payments (XOF)</span>
              <span className="sa-legend-item sa-legend-current">Maintenance Requests</span>
            </div>
            <div style={{ width: '100%', height: '200px', marginTop: '20px' }}>
              <ResponsiveContainer>
                <AreaChart
                  data={(() => {
                    const now = new Date();
                    const chartData = [];

                    for (let i = 5; i >= 0; i--) {
                      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                      const monthName = monthDate.toLocaleString('default', { month: 'short' });
                      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
                      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
                      const monthPayments = payments.filter((p) => {
                        const paymentDate = new Date(p.Date || p.date || p.createdAt || p.CreatedAt);
                        return paymentDate >= monthStart && paymentDate <= monthEnd;
                      });
                      const totalPaid = monthPayments.reduce((sum, p) => sum + (p.Amount || p.amount || 0), 0);
                      const monthMaintenance = maintenanceRequests.filter((m) => {
                        const maintDate = new Date(m.Date || m.date || m.CreatedAt || m.createdAt);
                        return maintDate >= monthStart && maintDate <= monthEnd;
                      }).length;

                      chartData.push({
                        month: monthName,
                        payments: Math.round(totalPaid),
                        maintenance: monthMaintenance
                      });
                    }

                    return chartData;
                  })()}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  
                  <defs>
                    <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }} />
                  
                  <YAxis
                    yAxisId="left"
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    label={{ value: 'Payments (XOF)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }} />
                  
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    label={{ value: 'Requests', angle: 90, position: 'insideRight', style: { fill: '#6b7280' } }} />
                  
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      padding: '8px 12px'
                    }}
                    formatter={(value, name) => {
                      if (name === 'payments') return [`${value.toLocaleString()} XOF`, 'Payments'];
                      if (name === 'maintenance') return [value, 'Maintenance Requests'];
                      return value;
                    }} />
                  
                  <Legend
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="line" />
                  
                  <Area
                    yAxisId="left"
                    type="natural"
                    dataKey="payments"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorPayments)"
                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name="Payments (XOF)" />
                  
                  <Area
                    yAxisId="right"
                    type="natural"
                    dataKey="maintenance"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#colorMaintenance)"
                    dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name="Maintenance Requests" />
                  
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

            <div className="sa-overview-metrics">
            <div className="sa-metric-card sa-metric-primary">
              <p className="sa-metric-label">Next Rent Due</p>
              <p className="sa-metric-period">Due: {data.nextRentDue?.date || 'N/A'}</p>
              <p className="sa-metric-value">
                {displayNextRentDueAmount > 0 ?
                `${displayNextRentDueAmount.toLocaleString()} XOF` :
                'N/A'}
              </p>
              {data.nextRentDue?.status === 'ahead' && Number(data.nextRentDue?.aheadAmount || 0) > 0 &&
              <p className="sa-metric-period">Ahead by: {Number(data.nextRentDue.aheadAmount).toLocaleString()} XOF</p>
              }
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Current Lease</p>
              <p className="sa-metric-number">
                {data.lease?.status || (data.lease?.property ? 'Active' : 'N/A')}
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Open Maintenance</p>
              <p className="sa-metric-value">
                {openMaintenanceCount}
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
      </div>);

  };

  const renderPayments = () =>
  <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h2>Payment Management</h2>
          <p>Make payments, view payment history, and transfer payment requests</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="sa-primary-cta" onClick={() => setShowPaymentModal(true)} disabled={loading}>
            <Plus size={18} />
            Make Payment
          </button>
          <button className="sa-primary-cta" onClick={() => setShowBillsModal(true)} disabled={loading} style={{ backgroundColor: '#0ea5e9' }}>
            <Zap size={18} />
            Pay Bills
          </button>
          <button
          className="sa-primary-cta"
          onClick={() => setShowTerminateLeaseModal(true)}
          disabled={loading}
          style={{ backgroundColor: '#ef4444' }}>
          
            <FileX size={18} />
            Terminate My Lease
          </button>
          <button
          className="sa-primary-cta"
          onClick={async () => {
            if (!leaseInfo && !isDemoMode()) {
              try {
                const lease = await tenantService.getLeaseInfo();
                setLeaseInfo(lease);
              } catch (error) {
                console.error('Error loading lease info:', error);
              }
            }
            setShowTransferPaymentModal(true);
          }}
          disabled={loading}
          style={{ backgroundColor: '#3b82f6' }}>
          
            <UserPlus size={18} />
            Transfer Payment Request
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
        <button
        type="button"
        onClick={() => setPaymentsTab('payments')}
        style={{
          padding: '12px 24px',
          border: 'none',
          background: 'transparent',
          color: paymentsTab === 'payments' ? '#7c3aed' : '#6b7280',
          borderBottom: paymentsTab === 'payments' ? '2px solid #7c3aed' : '2px solid transparent',
          cursor: 'pointer',
          fontWeight: paymentsTab === 'payments' ? '600' : '400',
          marginBottom: '-2px'
        }}>
        
          Payment history
        </button>
        <button
        type="button"
        onClick={() => setPaymentsTab('transfers')}
        style={{
          padding: '12px 24px',
          border: 'none',
          background: 'transparent',
          color: paymentsTab === 'transfers' ? '#7c3aed' : '#6b7280',
          borderBottom: paymentsTab === 'transfers' ? '2px solid #7c3aed' : '2px solid transparent',
          cursor: 'pointer',
          fontWeight: paymentsTab === 'transfers' ? '600' : '400',
          marginBottom: '-2px'
        }}>
        
          Transfer payment requests
        </button>
      </div>

      {paymentsTab === 'payments' &&
    <>
          {loading ?
      <div className="sa-table-empty">Loading payments...</div> :
      payments.length === 0 ?
      <div className="sa-table-empty">No payments found</div> :

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
              const paymentId = payment.ID || payment.id;
              const paymentDate = payment.Date || payment.date || payment.createdAt || payment.CreatedAt;
              const chargeType = payment.ChargeType || payment.chargeType || 'Rent';
              const amount = payment.Amount || payment.amount || 0;
              const method = payment.Method || payment.method || 'N/A';
              const status = payment.Status || payment.status || 'Pending';
              const statusLower = String(status || '').toLowerCase();
              const canDownloadReceipt = statusLower === 'approved' || statusLower === 'completed' || statusLower === 'paid';
              return (
                <tr key={paymentId || `payment-${index}`}>
                        <td>{index + 1}</td>
                        <td>{paymentDate ? new Date(paymentDate).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <div className="sa-cell-main">
                            <span className="sa-cell-title">{chargeType}</span>
                            {payment.reference &&
                      <span className="sa-cell-sub">Ref: {payment.reference}</span>
                      }
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
                        onClick={() => {
                          if (!canDownloadReceipt) return;
                          downloadReceipt(paymentId);
                        }}
                        disabled={!canDownloadReceipt}
                        title="Download Receipt">
                        
                              <Download size={14} />
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>);

            })}
                </tbody>
              </table>
            </div>
      }
        </>
    }

      {paymentsTab === 'transfers' &&
    <>
          {loading ?
      <div className="sa-table-empty">Loading transfer requests...</div> :
      transferRequests.length === 0 ?
      <div className="sa-table-empty">No transfer requests yet. Use &quot;Transfer Payment Request&quot; to submit one.</div> :

      <div className="sa-table-wrapper">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Property</th>
                    <th>New client (recipient)</th>
                    <th>Request date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transferRequests.map((tr, index) => {
              const requestDate = tr.requestDate || tr.createdAt || tr.CreatedAt;
              const newClient = tr.newClient || tr.recipientName || tr.RecipientName || 'N/A';
              const status = tr.status || tr.Status || 'Pending';
              return (
                <tr key={tr.id || tr.ID || `transfer-${index}`}>
                        <td>{index + 1}</td>
                        <td>{tr.property || tr.Property || 'N/A'}</td>
                        <td>{newClient}</td>
                        <td>
                          {requestDate ?
                    new Date(requestDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) :
                    'N/A'}
                        </td>
                        <td>
                          <span className={`sa-status-pill ${status.toLowerCase().replace(' ', '-')}`}>
                            {status}
                          </span>
                        </td>
                      </tr>);

            })}
                </tbody>
              </table>
            </div>
      }
        </>
    }
    </div>;


  const renderMaintenance = () =>
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

      {loading ?
    <div className="sa-table-empty">Loading maintenance requests...</div> :
    maintenanceRequests.length === 0 ?
    <div className="sa-table-empty">No maintenance requests found</div> :

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
              {maintenanceRequests.map((request, index) =>
          <tr key={request.ID || request.id || `request-${index}`}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{request.Issue || request.Title || request.title || 'Maintenance Request'}</span>
                      {request.Description &&
                <span className="sa-cell-sub">{request.Description || request.description}</span>
                }
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
                  onClick={() => {
                    setSelectedMaintenanceRequest(request);
                    setShowMaintenanceViewModal(true);
                  }}>
                  
                        View
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

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      addNotification('Phone number copied to clipboard!', 'success');
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        addNotification('Phone number copied to clipboard!', 'success');
      } catch (err) {
        addNotification('Failed to copy phone number', 'error');
      }
      document.body.removeChild(textArea);
    }
  };

  const renderTechnicianContacts = () => {
    const searchTrim = (technicianContactSearch || '').trim().toLowerCase();
    const filteredContacts = searchTrim ?
    technicianContacts.filter((contact) => {
      const name = (contact.Name || contact.name || '').toLowerCase();
      const category = (contact.Category || contact.category || '').toLowerCase();
      return name.includes(searchTrim) || category.includes(searchTrim);
    }) :
    technicianContacts;

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h2>Technician Contacts</h2>
            <p>Find and contact technicians for your maintenance needs</p>
          </div>
        </div>

        {technicianContacts.length > 0 &&
        <div style={{ marginBottom: '20px', marginTop: '8px' }}>
            <div
            className="sa-search-input"
            style={{
              maxWidth: '400px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#f9fafb'
            }}>
            
              <Search size={18} color="#6b7280" />
              <input
              type="text"
              placeholder="Search by worker name or category..."
              value={technicianContactSearch}
              onChange={(e) => setTechnicianContactSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', flex: 1, fontSize: '0.9rem', outline: 'none' }} />
            
            </div>
          </div>
        }

        {loading ?
        <div className="sa-table-empty">Loading technician contacts...</div> :
        technicianContacts.length === 0 ?
        <div className="sa-table-empty">No technician contacts available</div> :
        filteredContacts.length === 0 ?
        <div className="sa-table-empty">No technicians match your search</div> :

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
            marginTop: '24px',
            alignItems: 'stretch'
          }}>
          
            {filteredContacts.map((contact) => {
            const contactId = contact.ID || contact.id;
            const name = contact.Name || contact.name || 'Unknown';
            const phone = contact.Phone || contact.phone || '';
            const email = contact.Email || contact.email || '';
            const address = contact.Address || contact.address || '';
            const description = contact.Description || contact.description || '';
            const categoryName = contact.Category || contact.category || '';
            const photoUrl = contact.PhotoURL || contact.photoURL || contact.photoUrl || '';

            return (
              <div
                key={contactId}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                  transition: 'box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                }}>
                
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      {photoUrl ?
                    <img
                      src={photoUrl}
                      alt={`${name}`}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      onClick={() => window.open(photoUrl, '_blank')} /> :


                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                      
                          {(name || 'U').charAt(0).toUpperCase()}
                        </div>
                    }
                      <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.05rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name}
                      </h4>
                    </div>
                    <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                      fontSize: '0.7rem',
                      textTransform: 'capitalize',
                      flexShrink: 0
                    }}>
                    
                      {categoryName || '—'}
                    </span>
                  </div>

                  {phone &&
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <Phone size={16} color="#6b7280" style={{ flexShrink: 0 }} />
                      <span style={{ color: '#374151', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{phone}</span>
                      <button
                    onClick={() => copyToClipboard(phone)}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem',
                      color: '#374151',
                      flexShrink: 0
                    }}
                    title="Copy phone number">
                    
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                }

                  {email &&
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ color: '#6b7280', fontSize: '0.8rem', flexShrink: 0 }}>Email:</span>
                      <a href={`mailto:${email}`} style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {email}
                      </a>
                    </div>
                }

                  {address &&
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px', flexShrink: 0 }}>
                      <span style={{ color: '#6b7280', fontSize: '0.8rem', flexShrink: 0 }}>Address:</span>
                      <span style={{ color: '#374151', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{address}</span>
                    </div>
                }

                  {description &&
                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {description}
                      </p>
                    </div>
                }
                </div>);

          })}
          </div>
        }
      </div>);

  };

  const renderStateOfEntryExit = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h2>State of Entry / Exit</h2>
            <p>View inventory (state of entry or exit) reports filled by the technician for your property</p>
          </div>
        </div>
        {myInventory.length === 0 ?
        <div className="sa-table-empty">No state of entry or exit records yet. When a technician fills an inventory for you, it will appear here.</div> :

        <div className="sa-table-wrapper" style={{ marginTop: '20px' }}>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Property</th>
                  <th>Date</th>
                  <th>Inspector</th>
                  <th>Status</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {myInventory.map((inv) => {
                const type = inv.type || inv.Type || '';
                const property = inv.property || inv.Property || '—';
                const date = inv.date || inv.Date || inv.createdAt || inv.CreatedAt;
                const dateStr = date ? new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';
                const inspector = inv.inspector || inv.Inspector || '—';
                const status = inv.status || inv.Status || '—';
                const reportURL = inv.reportURL || inv.ReportURL;
                return (
                  <tr key={inv.id || inv.ID}>
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
                      <td>{property}</td>
                      <td>{dateStr}</td>
                      <td>{inspector}</td>
                      <td>{status}</td>
                      <td>
                        {reportURL ?
                      <a
                        href={reportURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
                        
                            View report
                          </a> :

                      <span style={{ color: '#9ca3af' }}>—</span>
                      }
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        }
      </div>);

  };

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'payments':
        return renderPayments();
      case 'maintenance':
        return renderMaintenance();
      case 'technician-contacts':
        return renderTechnicianContacts();
      case 'state-of-entry-exit':
        return renderStateOfEntryExit();
      case 'advertisements':
        return renderAdvertisements();
      case 'chat':
        return renderMessages();
      case 'settings':
        return (
          <div className="embedded-settings">
            <SettingsPage />
          </div>);

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
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('demo_mode');
    window.location.href = '/';
  };

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Tenant Portal', logo: 'SAAF', logoImage: `/download.jpeg` }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}>
        
        {({ activeId }) =>
        <div className="content-body">
            {renderContent(activeId)}
          </div>
        }
      </RoleLayout>

      {notifications.length > 0 &&
      <div className="notifications-container">
          {notifications.map((notification) =>
        <div key={notification.id} className={`notification notification-${notification.type}`}>
              <span>{notification.message}</span>
              <button onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))}>×</button>
            </div>
        )}
        </div>
      }
      {showMaintenanceModal &&
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
                    onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Leaky faucet in kitchen"
                    required />
                  
                  </div>

                  <div className="form-group">
                    <label htmlFor="priority">Priority Level</label>
                    <select
                    id="priority"
                    value={maintenanceForm.priority}
                    onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, priority: e.target.value }))}
                    required>
                    
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
                  onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Please describe the issue in detail..."
                  rows="4"
                  required />
                
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
                    style={{ display: 'none' }} />
                  
                    <label htmlFor="photos" className="photo-upload-button">
                      <Camera size={20} />
                      <span>Choose Photos</span>
                    </label>
                    <p className="photo-help-text">Upload photos to help describe the issue (max 5 photos)</p>
                  </div>

                  {maintenanceForm.photos.length > 0 &&
                <div className="maintenance-photo-preview-grid">
                      {maintenanceForm.photos.map((photo) =>
                  <div key={photo.id} className="maintenance-photo-preview-item">
                          <button
                      type="button"
                      className="maintenance-photo-placeholder"
                      onClick={() => window.open(photo.preview, '_blank')}
                      title={photo.name}>
                      
                            <span>Photo</span>
                            <span className="maintenance-photo-placeholder-name">
                              {photo.name || 'Attachment'}
                            </span>
                          </button>
                          <button
                      type="button"
                      className="remove-photo-button"
                      onClick={() => removePhoto(photo.id)}>
                      
                            <X size={16} />
                          </button>
                          <span className="photo-name">{photo.name}</span>
                        </div>
                  )}
                    </div>
                }
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
      }
      {showPaymentModal &&
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
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                    required />
                  
                  </div>

                  <div className="form-group">
                    <label htmlFor="paymentMethod">Payment Method</label>
                    <select
                    id="paymentMethod"
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                    required>
                    
                      <option value="">Select payment method</option>
                      <option value="Mobile Money">Mobile Money</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reference">Reference Number</label>
                  <input
                  type="text"
                  id="reference"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))}
                  placeholder="Enter transaction reference"
                  required />
                
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
      }
      {showBillsModal &&
      <div className="modal-overlay" onClick={() => setShowBillsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pay Bills</h3>
              <button className="modal-close" onClick={() => setShowBillsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleBillsSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="billType">Bill Type</label>
                  <select
                  id="billType"
                  value={billsForm.billType}
                  onChange={(e) => setBillsForm((prev) => ({ ...prev, billType: e.target.value }))}>
                  
                    <option value="water">Water</option>
                    <option value="electricity">Electricity</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="billsAmount">Amount (XOF)</label>
                    <input
                    type="number"
                    id="billsAmount"
                    value={billsForm.amount}
                    onChange={(e) => setBillsForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                    required
                    min="1" />
                  
                  </div>
                  <div className="form-group">
                    <label htmlFor="billsPaymentMethod">Payment Method</label>
                    <select
                    id="billsPaymentMethod"
                    value={billsForm.paymentMethod}
                    onChange={(e) => setBillsForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                    required>
                    
                      <option value="">Select payment method</option>
                      <option value="Mobile Money">Mobile Money</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="billsReference">Reference Number</label>
                  <input
                  type="text"
                  id="billsReference"
                  value={billsForm.reference}
                  onChange={(e) => setBillsForm((prev) => ({ ...prev, reference: e.target.value }))}
                  placeholder="Enter transaction reference"
                  required />
                
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowBillsModal(false)}>
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
      }
      {showTerminateLeaseModal &&
      <div className="modal-overlay" onClick={() => setShowTerminateLeaseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Terminate My Lease</h3>
              <button className="modal-close" onClick={() => setShowTerminateLeaseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleTerminateLeaseSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="reason">Reason for Termination *</label>
                  <select
                  id="reason"
                  value={terminateLeaseForm.reason}
                  onChange={(e) => setTerminateLeaseForm((prev) => ({ ...prev, reason: e.target.value }))}
                  required>
                  
                    <option value="">Select a reason</option>
                    <option value="moving_out">Moving Out</option>
                    <option value="job_relocation">Job Relocation</option>
                    <option value="financial_hardship">Financial Hardship</option>
                    <option value="property_issues">Property Issues</option>
                    <option value="lease_expiry">Lease Expiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="terminationDate">Desired Termination Date *</label>
                  <input
                  type="date"
                  id="terminationDate"
                  value={terminateLeaseForm.terminationDate}
                  onChange={(e) => setTerminateLeaseForm((prev) => ({ ...prev, terminationDate: e.target.value }))}
                  min={minTerminationDate}
                  required />
                
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Legal notice: minimum 3 months from today.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="comments">Additional Comments</label>
                  <textarea
                  id="comments"
                  value={terminateLeaseForm.comments}
                  onChange={(e) => setTerminateLeaseForm((prev) => ({ ...prev, comments: e.target.value }))}
                  placeholder="Provide any additional details about your termination request..."
                  rows="4" />
                
                </div>

                <div className="form-group">
                  <label htmlFor="securityDepositRefundMethod">Security Deposit Refund Method *</label>
                  <select
                  id="securityDepositRefundMethod"
                  value={terminateLeaseForm.securityDepositRefundMethod}
                  onChange={(e) => setTerminateLeaseForm((prev) => ({ ...prev, securityDepositRefundMethod: e.target.value }))}
                  required>
                  
                    <option value="">Select refund method</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Cash">Cash</option>
                  </select>
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    How would you like to receive your security deposit refund?
                  </small>
                </div>
                {terminateLeaseForm.securityDepositRefundMethod === 'Mobile Money' &&
              <div className="form-group">
                    <label htmlFor="mobileMoneyNumber">Mobile Money Number *</label>
                    <input
                  type="tel"
                  id="mobileMoneyNumber"
                  value={terminateLeaseForm.mobileMoneyNumber}
                  onChange={(e) => setTerminateLeaseForm((prev) => ({ ...prev, mobileMoneyNumber: e.target.value }))}
                  placeholder="e.g., +225 07 12 34 56 78"
                  required />
                
                  </div>
              }

                <div className="form-group">
                  <label htmlFor="inventoryCheckDate">Inventory Check Date *</label>
                  <input
                  type="date"
                  id="inventoryCheckDate"
                  value={terminateLeaseForm.inventoryCheckDate}
                  onChange={(e) => setTerminateLeaseForm((prev) => ({ ...prev, inventoryCheckDate: e.target.value }))}
                  min={inventoryDateRange.min || undefined}
                  max={inventoryDateRange.max || undefined}
                  disabled={!terminateLeaseForm.terminationDate}
                  required />
                
                    <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {terminateLeaseForm.terminationDate ?
                  `State of exit: choose a date between ${inventoryDateRange.min} and ${inventoryDateRange.max} (inventory must be done before the 5th of the next month).` :
                  'Select a termination date first.'}
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="inventoryCheckTime">Inventory Check Time</label>
                  <input
                  type="time"
                  id="inventoryCheckTime"
                  value={terminateLeaseForm.inventoryCheckTime}
                  onChange={(e) => setTerminateLeaseForm((prev) => ({ ...prev, inventoryCheckTime: e.target.value }))}
                  disabled={!terminateLeaseForm.terminationDate} />
                
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Optional. Set the time for the inventory check appointment.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="terminationLetter">Termination Letter (Required) *</label>
                  <input
                  type="file"
                  id="terminationLetter"
                  accept=".pdf,image/*"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setTerminateLeaseForm((prev) => ({ ...prev, terminationLetter: file }));
                  }} />
                
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Upload the letter mentioning reason and desired departure date.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="supportingDocs">Supporting Documents (Optional)</label>
                  <input
                  type="file"
                  id="supportingDocs"
                  accept=".pdf,image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setTerminateLeaseForm((prev) => ({ ...prev, supportingDocs: files }));
                  }} />
                
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Transfer, professional reason, force majeure, etc.
                  </small>
                </div>

                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowTerminateLeaseModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading} style={{ backgroundColor: '#ef4444' }}>
                    {loading ? 'Submitting...' : 'Submit Termination Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
      {showTransferPaymentModal &&
      <div className="modal-overlay" onClick={() => setShowTransferPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Transfer Payment Request</h3>
              <button className="modal-close" onClick={() => setShowTransferPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleTransferPaymentSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="recipientName">Recipient Name *</label>
                  <input
                  type="text"
                  id="recipientName"
                  value={transferPaymentForm.recipientName}
                  onChange={(e) => setTransferPaymentForm((prev) => ({ ...prev, recipientName: e.target.value }))}
                  placeholder="Enter recipient's full name"
                  required />
                
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="recipientEmail">Recipient Email *</label>
                    <input
                    type="email"
                    id="recipientEmail"
                    value={transferPaymentForm.recipientEmail}
                    onChange={(e) => setTransferPaymentForm((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                    placeholder="recipient@email.com"
                    required />
                  
                  </div>

                  <div className="form-group">
                    <label htmlFor="recipientPhone">Recipient Phone *</label>
                    <input
                    type="tel"
                    id="recipientPhone"
                    value={transferPaymentForm.recipientPhone}
                    onChange={(e) => setTransferPaymentForm((prev) => ({ ...prev, recipientPhone: e.target.value }))}
                    placeholder="+1234567890"
                    required />
                  
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="relationship">Relationship *</label>
                    <select
                    id="relationship"
                    value={transferPaymentForm.relationship}
                    onChange={(e) => setTransferPaymentForm((prev) => ({ ...prev, relationship: e.target.value }))}
                    required>
                    
                      <option value="">Select relationship</option>
                      <option value="family_member">Family Member</option>
                      <option value="brother">Brother</option>
                      <option value="sister">Sister</option>
                      <option value="parent">Parent</option>
                      <option value="friend">Friend</option>
                      <option value="colleague">Colleague</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="recipientIdCard">Recipient ID Card Number *</label>
                    <input
                    type="text"
                    id="recipientIdCard"
                    value={transferPaymentForm.recipientIdCard}
                    onChange={(e) => setTransferPaymentForm((prev) => ({ ...prev, recipientIdCard: e.target.value }))}
                    placeholder="Enter recipient's ID card number"
                    required />
                  
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="entryDate">Date When Recipient Will Enter *</label>
                  <input
                  type="date"
                  id="entryDate"
                  value={transferPaymentForm.entryDate}
                  onChange={(e) => setTransferPaymentForm((prev) => ({ ...prev, entryDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required />
                
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Select the date when the recipient will enter/start.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Reason for Transfer *</label>
                  <textarea
                  id="reason"
                  value={transferPaymentForm.reason}
                  onChange={(e) => setTransferPaymentForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain why you're transferring this payment request..."
                  rows="3"
                  required />
                
                </div>

                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>Parts to Supply (individual)</h4>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Upload the same documents required to create a new client for the person being transferred to.
                  </p>
                  {TRANSFER_INDIVIDUAL_DOCUMENTS.map((doc) =>
                <div key={doc.key} className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px' }}>{doc.label} *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                      ref={(el) => {if (el) transferDocFileInputRefs.current[doc.key] = el;}}
                      type="file"
                      accept=".pdf,image/*"
                      required={!transferDocFiles[doc.key]}
                      style={{ maxWidth: '100%' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setTransferDocFiles((prev) => ({ ...prev, [doc.key]: file }));
                      }} />
                    
                        {transferDocFiles[doc.key] &&
                    <>
                            <span style={{ fontSize: '13px', color: '#374151' }}>{transferDocFiles[doc.key].name}</span>
                            <button
                        type="button"
                        className="action-button secondary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={() => {
                          const inputEl = transferDocFileInputRefs.current[doc.key];
                          if (inputEl) inputEl.value = '';
                          setTransferDocFiles((prev) => {
                            const next = { ...prev };
                            delete next[doc.key];
                            return next;
                          });
                        }}>
                        
                              Remove
                            </button>
                          </>
                    }
                      </div>
                    </div>
                )}
                </div>

                <div style={{
                padding: '12px',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                marginBottom: '16px',
                border: '1px solid #fbbf24'
              }}>
                  <small style={{ color: '#92400e', fontSize: '0.85rem', display: 'block' }}>
                    <strong>Note:</strong> The recipient will receive a notification about this payment request. 
                    They will need to accept and complete the payment on your behalf.
                  </small>
                </div>

                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowTransferPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Transfer Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
      {showMaintenanceViewModal && selectedMaintenanceRequest &&
      <div className="modal-overlay" onClick={() => setShowMaintenanceViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Maintenance Request Details</h3>
              <button className="modal-close" onClick={() => setShowMaintenanceViewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Title</label>
                  <p style={{ margin: 0, color: '#1f2937' }}>
                    {selectedMaintenanceRequest.Title || selectedMaintenanceRequest.title || selectedMaintenanceRequest.Issue || 'N/A'}
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
                      {selectedMaintenanceRequest.Date || selectedMaintenanceRequest.date || selectedMaintenanceRequest.CreatedAt || selectedMaintenanceRequest.createdAt ?
                    new Date(selectedMaintenanceRequest.Date || selectedMaintenanceRequest.date || selectedMaintenanceRequest.CreatedAt || selectedMaintenanceRequest.createdAt).toLocaleDateString() :
                    'N/A'}
                    </p>
                  </div>
                </div>

                {(selectedMaintenanceRequest.Property || selectedMaintenanceRequest.property) &&
              <div>
                    <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Property</label>
                    <p style={{ margin: 0, color: '#1f2937' }}>
                      {selectedMaintenanceRequest.Property || selectedMaintenanceRequest.property}
                    </p>
                  </div>
              }
                {(selectedMaintenanceRequest.Photos || selectedMaintenanceRequest.photos || selectedMaintenanceRequest.PhotoURLs || selectedMaintenanceRequest.photoURLs) &&
              <div>
                    <label style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'block' }}>Photos</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                      {(() => {
                    let photos = [];
                    try {
                      if (selectedMaintenanceRequest.Photos) {
                        photos = Array.isArray(selectedMaintenanceRequest.Photos) ?
                        selectedMaintenanceRequest.Photos :
                        typeof selectedMaintenanceRequest.Photos === 'string' ? JSON.parse(selectedMaintenanceRequest.Photos || '[]') : [];
                      } else if (selectedMaintenanceRequest.photos) {
                        photos = Array.isArray(selectedMaintenanceRequest.photos) ?
                        selectedMaintenanceRequest.photos :
                        typeof selectedMaintenanceRequest.photos === 'string' ? JSON.parse(selectedMaintenanceRequest.photos || '[]') : [];
                      } else if (selectedMaintenanceRequest.PhotoURLs) {
                        photos = Array.isArray(selectedMaintenanceRequest.PhotoURLs) ?
                        selectedMaintenanceRequest.PhotoURLs :
                        typeof selectedMaintenanceRequest.PhotoURLs === 'string' ? JSON.parse(selectedMaintenanceRequest.PhotoURLs || '[]') : [];
                      } else if (selectedMaintenanceRequest.photoURLs) {
                        photos = Array.isArray(selectedMaintenanceRequest.photoURLs) ?
                        selectedMaintenanceRequest.photoURLs :
                        typeof selectedMaintenanceRequest.photoURLs === 'string' ? JSON.parse(selectedMaintenanceRequest.photoURLs || '[]') : [];
                      }
                    } catch (error) {
                      console.error('Error parsing photos:', error);
                      photos = [];
                    }

                    return photos.length > 0 ? photos.map((photoUrl, index) =>
                    <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', backgroundColor: '#f3f4f6' }}>
                            <img
                        src={photoUrl}
                        alt={`Maintenance photo ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(photoUrl, '_blank')}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af;">Image not available</div>';
                        }} />
                      
                          </div>
                    ) : null;
                  })()}
                    </div>
                  </div>
              }
              </div>
            </div>
            <div className="modal-footer">
              <button
              type="button"
              className="action-button secondary"
              onClick={() => setShowMaintenanceViewModal(false)}>
              
                Close
              </button>
            </div>
          </div>
        </div>
      }

    </>);

};

export default TenantDashboard;
