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
  ResponsiveContainer
} from 'recharts';
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
  Copy
} from 'lucide-react';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import { t, getLanguage } from '../utils/i18n';
import { tenantService } from '../services/tenantService';
import { messagingService } from '../services/messagingService';
import { API_CONFIG } from '../config/api';
import { isDemoMode, getTenantDemoData } from '../utils/demoData';
import { cloudinaryService } from '../services/cloudinaryService';
import '../components/RoleLayout.css';
import './SalesManagerDashboard.css';

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
  const [showTerminateLeaseModal, setShowTerminateLeaseModal] = useState(false);
  const [terminateLeaseForm, setTerminateLeaseForm] = useState({
    reason: '',
    terminationDate: '',
    comments: '',
    inventoryCheckDate: '',
    securityDepositRefundMethod: '',
    terminationLetter: null,
    supportingDocs: []
  });
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
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [leaseInfo, setLeaseInfo] = useState(null);
  const [payments, setPayments] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [showMaintenanceViewModal, setShowMaintenanceViewModal] = useState(false);
  const [selectedMaintenanceRequest, setSelectedMaintenanceRequest] = useState(null);
  const [technicianContacts, setTechnicianContacts] = useState([]);
  
  // Messaging states
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const isLoadingUsersRef = useRef(false);
  const messagesEndRef = useRef(null);

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
      { id: 'payments', label: t('nav.payments'), icon: DollarSign },
      { id: 'maintenance', label: t('technician.maintenance'), icon: Wrench },
      { id: 'technician-contacts', label: 'Technician Contacts', icon: Phone },
      { id: 'advertisements', label: t('nav.advertisements'), icon: Megaphone },
      { id: 'chat', label: t('nav.messages'), icon: MessageCircle },
      { id: 'settings', label: t('nav.profileSettings'), icon: Settings }
    ],
    [language]
  );

  const addNotification = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (isDemoMode()) {
        // Use demo data
        const demoData = getTenantDemoData();
        setOverviewData(demoData.overview);
        setLeaseInfo(demoData.leaseInfo);
        setPayments(demoData.payments);
        setMaintenanceRequests(demoData.maintenanceRequests);
        setLoading(false);
        return;
      }
      
      const [overview, paymentsData, maintenanceData, lease] = await Promise.all([
        tenantService.getOverview().catch(() => null),
        tenantService.listPayments().catch(() => []),
        tenantService.listMaintenance().catch(() => []),
        tenantService.getLeaseInfo().catch(() => null)
      ]);

      setOverviewData(overview);
      setLeaseInfo(lease);
      // Ensure payments is an array
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
      setPayments(paymentsArray);
      // Ensure maintenance is an array
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

  // Load payments separately
  const loadPayments = async () => {
    try {
      if (isDemoMode()) {
        const demoData = getTenantDemoData();
        setPayments(demoData.payments);
        return;
      }
      
      const paymentsData = await tenantService.listPayments();
      // Ensure payments is an array
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
      setPayments(paymentsArray);
      console.log('Loaded payments:', paymentsArray);
    } catch (error) {
      console.error('Error loading payments:', error);
      if (!isDemoMode()) {
        addNotification('Failed to load payments', 'error');
        setPayments([]);
      }
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

  // Load technician contacts
  const loadTechnicianContacts = async () => {
    try {
      if (isDemoMode()) {
        // Use demo data if available
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

  // Load technician contacts when technician-contacts tab is active
  useEffect(() => {
    if (activeTab === 'technician-contacts') {
      loadTechnicianContacts();
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
      
      // Get property from leaseInfo or overviewData
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
      
      // Get tenant name
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
      
      // Upload photos to Cloudinary first
      let photoUrls = [];
      if (maintenanceForm.photos && maintenanceForm.photos.length > 0) {
        addNotification('Uploading photos...', 'info');
        const uploadResults = await cloudinaryService.uploadMultipleFiles(
          maintenanceForm.photos.map(photo => photo.file),
          'real-estate-maintenance'
        );
        
        // Filter successful uploads
        photoUrls = uploadResults
          .filter(result => result.success)
          .map(result => result.url);
        
        if (uploadResults.some(result => !result.success)) {
          addNotification('Some photos failed to upload, but request will be submitted', 'warning');
        }
      }
      
      const maintenanceData = {
        property: property,
        title: maintenanceForm.title,
        description: maintenanceForm.description,
        priority: maintenanceForm.priority,
        tenant: tenantName,
        photos: photoUrls // Send array of photo URLs (empty array if no photos)
      };

      const newRequest = await tenantService.createMaintenance(maintenanceData);
      setMaintenanceRequests(prev => [newRequest, ...prev]);
      addNotification('Maintenance request submitted successfully!', 'success');

      // Clean up object URLs
      maintenanceForm.photos.forEach(photo => {
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
      e.target.value = ''; // Reset input
      return;
    }
    
    const filesToAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      addNotification(`Only ${remainingSlots} more photo(s) can be added (max ${maxPhotos})`, 'warning');
    }
    
    const newPhotos = filesToAdd.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      preview: URL.createObjectURL(file)
    }));

    setMaintenanceForm(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
    
    e.target.value = ''; // Reset input to allow selecting same file again
  };

  const removePhoto = (photoId) => {
    setMaintenanceForm(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo.id !== photoId)
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
        'Cash': 'Cash',
      };
      const normalizedRefundMethod =
        refundMethodMap[terminateLeaseForm.securityDepositRefundMethod] ||
        terminateLeaseForm.securityDepositRefundMethod;

      await tenantService.terminateLease({
        ...terminateLeaseForm,
        securityDepositRefundMethod: normalizedRefundMethod,
      });
      
      addNotification('Lease termination request submitted successfully!', 'success');
      
      setTerminateLeaseForm({
        reason: '',
        terminationDate: '',
        comments: '',
        inventoryCheckDate: '',
        securityDepositRefundMethod: '',
        terminationLetter: null,
        supportingDocs: [],
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
      
      // Get property from leaseInfo, overviewData, or use fallback
      let property = '';
      if (leaseInfo) {
        property = leaseInfo.property || leaseInfo.Property || leaseInfo.address || leaseInfo.Address || '';
      }
      if (!property && overviewData) {
        property =
          overviewData.property ||
          overviewData.Property ||
          (overviewData.lease && (overviewData.lease.property || overviewData.lease.Property || overviewData.lease.address || overviewData.lease.Address)) ||
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
      
      // Validate required fields according to backend API
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
      
      // Prepare transfer data according to backend API requirements
      const transferData = {
        property: property.trim(),
        recipientIdCard: transferPaymentForm.recipientIdCard.trim(),
        entryDate: transferPaymentForm.entryDate,
        // Optional fields (may be used by backend for notifications or records)
        recipientName: transferPaymentForm.recipientName.trim(),
        recipientEmail: transferPaymentForm.recipientEmail.trim(),
        recipientPhone: transferPaymentForm.recipientPhone.trim(),
        relationship: transferPaymentForm.relationship,
        reason: transferPaymentForm.reason.trim()
      };
      
      console.log('Submitting transfer request with data:', transferData);
      
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
      setShowTransferPaymentModal(false);
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
      
      // Get tenant name from user profile or overview data
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
      // Also check overviewData for tenant name
      if (overviewData && overviewData.tenant) {
        tenantName = overviewData.tenant;
      }
      
      // Get property from lease info, overview data, or use default
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
      
      // Backend expects lowercase field names and "Mobile Money" as method value
      // Validate payment method
      if (paymentForm.paymentMethod !== 'Mobile Money') {
        addNotification('Payment method must be Mobile Money', 'error');
        setLoading(false);
        return;
      }

      const paymentData = {
        tenant: tenantName,
        property: property,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.paymentMethod, // Must be "Mobile Money"
        chargeType: 'rent',
        reference: paymentForm.reference
      };

      console.log('Submitting payment with data:', paymentData);
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
      lease: { property: '', endDate: '' },
      nextRentDue: { amount: null, date: '' },
      openMaintenanceTickets: 0,
      tenant: ''
    };

    // Calculate open maintenance from actual requests (filter by status)
    const openMaintenanceCount = maintenanceRequests.filter(m => {
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
                    // Calculate payment history for last 6 months
                    const now = new Date();
                    const chartData = [];
                    
                    for (let i = 5; i >= 0; i--) {
                      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                      const monthName = monthDate.toLocaleString('default', { month: 'short' });
                      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
                      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
                      
                      // Count payments in this month
                      const monthPayments = payments.filter(p => {
                        const paymentDate = new Date(p.Date || p.date || p.createdAt || p.CreatedAt);
                        return paymentDate >= monthStart && paymentDate <= monthEnd;
                      });
                      const totalPaid = monthPayments.reduce((sum, p) => sum + (p.Amount || p.amount || 0), 0);
                      
                      // Count maintenance requests in this month
                      const monthMaintenance = maintenanceRequests.filter(m => {
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
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
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
                    yAxisId="left"
                    stroke="#6b7280" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    label={{ value: 'Payments (XOF)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#6b7280" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    label={{ value: 'Requests', angle: 90, position: 'insideRight', style: { fill: '#6b7280' } }}
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
                      if (name === 'payments') return [`${value.toLocaleString()} XOF`, 'Payments'];
                      if (name === 'maintenance') return [value, 'Maintenance Requests'];
                      return value;
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="line"
                  />
                  <Area
                    yAxisId="left"
                    type="natural"
                    dataKey="payments"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorPayments)"
                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name="Payments (XOF)"
                  />
                  <Area
                    yAxisId="right"
                    type="natural"
                    dataKey="maintenance"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#colorMaintenance)"
                    dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    name="Maintenance Requests"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sa-overview-metrics">
            <div className="sa-metric-card sa-metric-primary">
              <p className="sa-metric-label">Next Rent Due</p>
              <p className="sa-metric-period">Due: {data.nextRentDue?.date || '2024-11-01'}</p>
              <p className="sa-metric-value">
                {data.nextRentDue?.amount ? `${data.nextRentDue.amount} XOF` : 'N/A'}
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="sa-primary-cta" onClick={() => setShowPaymentModal(true)} disabled={loading}>
            <Plus size={18} />
            Make Payment
          </button>
          <button 
            className="sa-primary-cta" 
            onClick={() => setShowTerminateLeaseModal(true)} 
            disabled={loading}
            style={{ backgroundColor: '#ef4444' }}
          >
            <FileX size={18} />
            Terminate My Lease
          </button>
          <button 
            className="sa-primary-cta" 
            onClick={async () => {
              // Ensure leaseInfo is loaded before opening modal
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
            style={{ backgroundColor: '#3b82f6' }}
          >
            <UserPlus size={18} />
            Transfer Payment Request
          </button>
        </div>
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
                        onClick={() => {
                          setSelectedMaintenanceRequest(request);
                          setShowMaintenanceViewModal(true);
                        }}
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

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      addNotification('Phone number copied to clipboard!', 'success');
    } catch (error) {
      // Fallback for older browsers
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
    // Group contacts by category
    const groupedContacts = technicianContacts.reduce((acc, contact) => {
      const category = contact.Category || contact.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(contact);
      return acc;
    }, {});

    const categoryLabels = {
      plumber: 'Plumbers',
      electrician: 'Electricians',
      carpenter: 'Carpenters',
      painter: 'Painters',
      hvac: 'HVAC Technicians',
      locksmith: 'Locksmiths',
      other: 'Other Technicians'
    };

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h2>Technician Contacts</h2>
            <p>Find and contact technicians for your maintenance needs</p>
          </div>
        </div>

        {loading ? (
          <div className="sa-table-empty">Loading technician contacts...</div>
        ) : technicianContacts.length === 0 ? (
          <div className="sa-table-empty">No technician contacts available</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '24px' }}>
            {Object.entries(groupedContacts).map(([category, contacts]) => (
              <div key={category}>
                <h3 style={{ marginBottom: '16px', color: '#1f2937', fontSize: '1.25rem', fontWeight: '600' }}>
                  {categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                  gap: '16px' 
                }}>
                  {contacts.map((contact) => {
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
                          borderRadius: '8px',
                          padding: '20px',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {photoUrl && (
                              <img
                                src={photoUrl}
                                alt={`${name} photo`}
                                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                                onClick={() => window.open(photoUrl, '_blank')}
                              />
                            )}
                            <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem', fontWeight: '600' }}>
                              {name}
                            </h4>
                          </div>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            fontSize: '0.75rem',
                            textTransform: 'capitalize'
                          }}>
                            {categoryName}
                          </span>
                        </div>

                        {phone && (
                          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Phone size={16} color="#6b7280" />
                            <span style={{ color: '#374151', flex: 1 }}>{phone}</span>
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
                                fontSize: '0.875rem',
                                color: '#374151',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                e.currentTarget.style.borderColor = '#9ca3af';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                                e.currentTarget.style.borderColor = '#d1d5db';
                              }}
                              title="Copy phone number"
                            >
                              <Copy size={14} />
                              Copy
                            </button>
                          </div>
                        )}

                        {email && (
                          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Email:</span>
                            <a 
                              href={`mailto:${email}`}
                              style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem' }}
                            >
                              {email}
                            </a>
                          </div>
                        )}

                        {address && (
                          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Address:</span>
                            <span style={{ color: '#374151', fontSize: '0.875rem', flex: 1 }}>{address}</span>
                          </div>
                        )}

                        {description && (
                          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
                              {description}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
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
      case 'technician-contacts':
        return renderTechnicianContacts();
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
    localStorage.removeItem('demo_mode');
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
                    <div className="maintenance-photo-preview-grid">
                      {maintenanceForm.photos.map(photo => (
                        <div key={photo.id} className="maintenance-photo-preview-item">
                          <button
                            type="button"
                            className="maintenance-photo-placeholder"
                            onClick={() => window.open(photo.preview, '_blank')}
                            title={photo.name}
                          >
                            <span>Photo</span>
                            <span className="maintenance-photo-placeholder-name">
                              {photo.name || 'Attachment'}
                            </span>
                          </button>
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

      {/* Terminate Lease Modal */}
      {showTerminateLeaseModal && (
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
                    onChange={(e) => setTerminateLeaseForm(prev => ({ ...prev, reason: e.target.value }))}
                    required
                  >
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
                    onChange={(e) => setTerminateLeaseForm(prev => ({ ...prev, terminationDate: e.target.value }))}
                    min={minTerminationDate}
                    required
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Legal notice: minimum 3 months from today.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="comments">Additional Comments</label>
                  <textarea
                    id="comments"
                    value={terminateLeaseForm.comments}
                    onChange={(e) => setTerminateLeaseForm(prev => ({ ...prev, comments: e.target.value }))}
                    placeholder="Provide any additional details about your termination request..."
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="securityDepositRefundMethod">Security Deposit Refund Method *</label>
                  <select
                    id="securityDepositRefundMethod"
                    value={terminateLeaseForm.securityDepositRefundMethod}
                    onChange={(e) => setTerminateLeaseForm(prev => ({ ...prev, securityDepositRefundMethod: e.target.value }))}
                    required
                  >
                    <option value="">Select refund method</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Cash">Cash</option>
                  </select>
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    How would you like to receive your security deposit refund?
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="inventoryCheckDate">Inventory Check Date *</label>
                  <input
                    type="date"
                    id="inventoryCheckDate"
                    value={terminateLeaseForm.inventoryCheckDate}
                    onChange={(e) => setTerminateLeaseForm(prev => ({ ...prev, inventoryCheckDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Please schedule a date for the property inventory check before you move out.
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
                      setTerminateLeaseForm(prev => ({ ...prev, terminationLetter: file }));
                    }}
                  />
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
                      setTerminateLeaseForm(prev => ({ ...prev, supportingDocs: files }));
                    }}
                  />
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
      )}

      {/* Transfer Payment Request Modal */}
      {showTransferPaymentModal && (
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
                    onChange={(e) => setTransferPaymentForm(prev => ({ ...prev, recipientName: e.target.value }))}
                    placeholder="Enter recipient's full name"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="recipientEmail">Recipient Email *</label>
                    <input
                      type="email"
                      id="recipientEmail"
                      value={transferPaymentForm.recipientEmail}
                      onChange={(e) => setTransferPaymentForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                      placeholder="recipient@email.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="recipientPhone">Recipient Phone *</label>
                    <input
                      type="tel"
                      id="recipientPhone"
                      value={transferPaymentForm.recipientPhone}
                      onChange={(e) => setTransferPaymentForm(prev => ({ ...prev, recipientPhone: e.target.value }))}
                      placeholder="+1234567890"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="relationship">Relationship *</label>
                    <select
                      id="relationship"
                      value={transferPaymentForm.relationship}
                      onChange={(e) => setTransferPaymentForm(prev => ({ ...prev, relationship: e.target.value }))}
                      required
                    >
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
                      onChange={(e) => setTransferPaymentForm(prev => ({ ...prev, recipientIdCard: e.target.value }))}
                      placeholder="Enter recipient's ID card number"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="entryDate">Date When Recipient Will Enter *</label>
                  <input
                    type="date"
                    id="entryDate"
                    value={transferPaymentForm.entryDate}
                    onChange={(e) => setTransferPaymentForm(prev => ({ ...prev, entryDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Select the date when the recipient will enter/start.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Reason for Transfer *</label>
                  <textarea
                    id="reason"
                    value={transferPaymentForm.reason}
                    onChange={(e) => setTransferPaymentForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Explain why you're transferring this payment request..."
                    rows="3"
                    required
                  />
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
      )}

      {/* Maintenance Request View Modal */}
      {showMaintenanceViewModal && selectedMaintenanceRequest && (
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
                      {selectedMaintenanceRequest.Date || selectedMaintenanceRequest.date || selectedMaintenanceRequest.CreatedAt || selectedMaintenanceRequest.createdAt
                        ? new Date(selectedMaintenanceRequest.Date || selectedMaintenanceRequest.date || selectedMaintenanceRequest.CreatedAt || selectedMaintenanceRequest.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {(selectedMaintenanceRequest.Property || selectedMaintenanceRequest.property) && (
                  <div>
                    <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Property</label>
                    <p style={{ margin: 0, color: '#1f2937' }}>
                      {selectedMaintenanceRequest.Property || selectedMaintenanceRequest.property}
                    </p>
                  </div>
                )}

                {/* Photos Section */}
                {(selectedMaintenanceRequest.Photos || selectedMaintenanceRequest.photos || selectedMaintenanceRequest.PhotoURLs || selectedMaintenanceRequest.photoURLs) && (
                  <div>
                    <label style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'block' }}>Photos</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                      {(() => {
                        let photos = [];
                        try {
                          if (selectedMaintenanceRequest.Photos) {
                            photos = Array.isArray(selectedMaintenanceRequest.Photos) 
                              ? selectedMaintenanceRequest.Photos 
                              : (typeof selectedMaintenanceRequest.Photos === 'string' ? JSON.parse(selectedMaintenanceRequest.Photos || '[]') : []);
                          } else if (selectedMaintenanceRequest.photos) {
                            photos = Array.isArray(selectedMaintenanceRequest.photos) 
                              ? selectedMaintenanceRequest.photos 
                              : (typeof selectedMaintenanceRequest.photos === 'string' ? JSON.parse(selectedMaintenanceRequest.photos || '[]') : []);
                          } else if (selectedMaintenanceRequest.PhotoURLs) {
                            photos = Array.isArray(selectedMaintenanceRequest.PhotoURLs) 
                              ? selectedMaintenanceRequest.PhotoURLs 
                              : (typeof selectedMaintenanceRequest.PhotoURLs === 'string' ? JSON.parse(selectedMaintenanceRequest.PhotoURLs || '[]') : []);
                          } else if (selectedMaintenanceRequest.photoURLs) {
                            photos = Array.isArray(selectedMaintenanceRequest.photoURLs) 
                              ? selectedMaintenanceRequest.photoURLs 
                              : (typeof selectedMaintenanceRequest.photoURLs === 'string' ? JSON.parse(selectedMaintenanceRequest.photoURLs || '[]') : []);
                          }
                        } catch (error) {
                          console.error('Error parsing photos:', error);
                          photos = [];
                        }

                        return photos.length > 0 ? photos.map((photoUrl, index) => (
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
                              }}
                            />
                          </div>
                        )) : null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="action-button secondary" 
                onClick={() => setShowMaintenanceViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default TenantDashboard;

