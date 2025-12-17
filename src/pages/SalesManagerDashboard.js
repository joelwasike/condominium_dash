import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TrendingUp, Users, AlertTriangle, Building, UserPlus, Upload, X, FileText, Filter, Search, Plus, MessageCircle, Settings, Megaphone, FileSpreadsheet, Copy, Check } from 'lucide-react';
import Modal from '../components/Modal';
import DocumentUpload from '../components/DocumentUpload';
import ContractUpload from '../components/ContractUpload';
import { salesManagerService } from '../services/salesManagerService';
import { messagingService } from '../services/messagingService';
import { cloudinaryService, validateFileType, validateFileSize } from '../services/cloudinaryService';
import { API_CONFIG } from '../config/api';
import { isDemoMode, getSalesManagerDemoData } from '../utils/demoData';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import '../components/RoleLayout.css';
import './SalesManagerDashboard.css';

// Password Display Component
const PasswordDisplayItem = ({ email, password }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
            Email
          </label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.9rem' }}>{email}</span>
            <button
              onClick={() => copyToClipboard(email, 'email')}
              style={{
                padding: '4px 8px',
                background: copied === 'email' ? '#10b981' : '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: copied === 'email' ? 'white' : '#374151',
                transition: 'all 0.2s'
              }}
              title="Copy email"
            >
              {copied === 'email' ? <Check size={14} /> : <Copy size={14} />}
              {copied === 'email' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
            Password
          </label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: '#fef3c7',
            borderRadius: '6px',
            border: '1px solid #fbbf24'
          }}>
            <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 600, color: '#92400e' }}>
              {password}
            </span>
            <button
              onClick={() => copyToClipboard(password, 'password')}
              style={{
                padding: '4px 8px',
                background: copied === 'password' ? '#10b981' : '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: copied === 'password' ? 'white' : '#374151',
                transition: 'all 0.2s'
              }}
              title="Copy password"
            >
              {copied === 'password' ? <Check size={14} /> : <Copy size={14} />}
              {copied === 'password' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SalesManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showTenantCreationModal, setShowTenantCreationModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [newTenantData, setNewTenantData] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Documents
  const [excelFile, setExcelFile] = useState(null);
  const [importMode, setImportMode] = useState('manual'); // 'manual' or 'excel'
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState(null); // { type: 'single' | 'bulk', user: {...} | users: [...] }
  
  // API Data States
  const [overviewData, setOverviewData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [waitingListClients, setWaitingListClients] = useState([]);
  const [unpaidRents, setUnpaidRents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [owners, setOwners] = useState([]); // Owners (landlords) for property assignment
  const [salesProperties, setSalesProperties] = useState([]); // Properties that are strictly for sale
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
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [clientStatusFilter, setClientStatusFilter] = useState('');
  const [clientPropertyFilter, setClientPropertyFilter] = useState('');
  const [clientSearchText, setClientSearchText] = useState('');
  const [propertyStatusFilter, setPropertyStatusFilter] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('');
  const [propertyUrgencyFilter, setPropertyUrgencyFilter] = useState('');
  const [alertTypeFilter, setAlertTypeFilter] = useState('');
  const [salesTypeFilter, setSalesTypeFilter] = useState(''); // Filter for sales properties by type
  
  // Edit states
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showUnpaidRentModal, setShowUnpaidRentModal] = useState(false);
  const [editingUnpaidRent, setEditingUnpaidRent] = useState(null);
  
  // Property states
  const [showCreatePropertyModal, setShowCreatePropertyModal] = useState(false);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [expandedOwnerId, setExpandedOwnerId] = useState(null); // For property management owner expansion
  const [showBuildingType, setShowBuildingType] = useState(false); // For showing building type field when type is Apartment
  
  // Messaging states
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const isLoadingUsersRef = useRef(false);
  const messagesEndRef = useRef(null);

  const addNotification = (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Load data from API
  const loadData = async () => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        // Use demo data
        const demoData = getSalesManagerDemoData();
        setOverviewData(demoData.overview);
        setProperties(demoData.properties);
        setClients(demoData.clients);
        setWaitingListClients(demoData.waitingListClients);
        setUnpaidRents(demoData.unpaidRents);
        setAlerts(demoData.alerts);
        setOwners(demoData.owners);
        setSalesProperties(demoData.salesProperties || []);
        setLoading(false);
        return;
      }
      
      const [overview, propertiesData, clientsData, waitingListData, unpaidRentsData, alertsData, ownersData, salesPropsData] = await Promise.all([
        salesManagerService.getOverview(),
        salesManagerService.getProperties({
          status: propertyStatusFilter || undefined,
          type: propertyTypeFilter || undefined,
          urgency: propertyUrgencyFilter || undefined,
        }),
        salesManagerService.getClients(),
        salesManagerService.getWaitingListClients().catch(() => []),
        salesManagerService.getUnpaidRents().catch(() => []),
        salesManagerService.getAlerts(alertTypeFilter || null),
        salesManagerService.getOwners().catch(() => []),
        salesManagerService.getSalesProperties().catch(() => []),
      ]);

      console.log('Loaded data:', { overview, propertiesData, clientsData, waitingListData, unpaidRentsData, alertsData, ownersData, salesPropsData });
      setOverviewData(overview);
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setWaitingListClients(Array.isArray(waitingListData) ? waitingListData : []);
      setUnpaidRents(Array.isArray(unpaidRentsData) ? unpaidRentsData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setOwners(Array.isArray(ownersData) ? ownersData : []);
      setSalesProperties(Array.isArray(salesPropsData) ? salesPropsData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      if (!isDemoMode()) {
        addNotification('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load advertisements
  const loadAdvertisements = async () => {
    try {
      const ads = await salesManagerService.getAdvertisements();
      setAdvertisements(Array.isArray(ads) ? ads : []);
    } catch (error) {
      console.error('Failed to load advertisements:', error);
      addNotification('Failed to load advertisements', 'error');
      setAdvertisements([]);
    }
  };

  // Reload data when filters change
  useEffect(() => {
    loadData();
  }, [propertyStatusFilter, propertyTypeFilter, propertyUrgencyFilter, alertTypeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load advertisements when advertisements or overview tab is active
  useEffect(() => {
    if (activeTab === 'advertisements' || activeTab === 'overview') {
      loadAdvertisements();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps


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
      
      // Handle company restriction error specifically
      if (error.message && error.message.includes('own company')) {
        addNotification('Cannot view conversations with users from different companies', 'warning');
        // Remove the user from the list if they're from a different company
        setChatUsers(prev => prev.filter(u => String(u.userId) !== String(userId)));
        setSelectedUserId(null);
        setChatMessages([]);
      } else {
        addNotification(`Failed to load conversation: ${error.message || 'Unknown error'}`, 'error');
        setChatMessages([]);
      }
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
      
      // Get current user ID and company to exclude from list and filter by company
      const storedUser = localStorage.getItem('user');
      let currentUserId = null;
      let currentUserCompany = null;
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          currentUserId = user.id || user.ID;
          currentUserCompany = user.company || user.Company;
          console.log('Current user ID:', currentUserId);
          console.log('Current user company:', currentUserCompany);
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
      
      // Map users to chat format and exclude current user
      // Also filter by company to ensure we only show users from the same company
      const chatUsersList = usersArray
        .filter(user => {
          const userId = user.id || user.ID;
          const userCompany = user.company || user.Company;
          
          // Convert both to strings for comparison to handle type mismatches
          const userIdStr = userId ? String(userId) : null;
          const currentUserIdStr = currentUserId ? String(currentUserId) : null;
          
          // Check if user is not the current user
          const isNotCurrentUser = userIdStr && userIdStr !== currentUserIdStr;
          
          // Check if user is from the same company (if company info is available)
          const isSameCompany = !currentUserCompany || !userCompany || currentUserCompany === userCompany;
          
          const shouldInclude = isNotCurrentUser && isSameCompany;
          
          if (!shouldInclude && userIdStr) {
            if (!isNotCurrentUser) {
              console.log(`Excluding user ${userIdStr} (current user: ${currentUserIdStr})`);
            } else if (!isSameCompany) {
              console.log(`Excluding user ${userIdStr} (different company: ${userCompany} vs ${currentUserCompany})`);
            }
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
              // BUT only if they're from the same company (to avoid 403 errors)
              const convUser = conv.user || {};
              const userId = conv.userId || conv.userID || convUser.id || convUser.ID;
              const userCompany = convUser.company || convUser.Company || conv.company || '';
              
              // Only add if it's not the current user AND from the same company
              const currentUserIdStr = currentUserId ? String(currentUserId) : null;
              const isSameCompany = !currentUserCompany || !userCompany || currentUserCompany === userCompany;
              
              if (userId && String(userId) !== currentUserIdStr && isSameCompany) {
                const newUser = {
                  userId: userId,
                  name: convUser.name || convUser.Name || conv.name || 'User',
                  email: convUser.email || convUser.Email || conv.email || '',
                  role: convUser.role || convUser.Role || conv.role || '',
                  company: userCompany,
                  status: convUser.status || convUser.Status || conv.status || 'Active',
                  unreadCount: conv.unreadCount || 0
                };
                chatUsersList.push(newUser);
                existingUsersMap.set(String(userId), newUser);
                console.log('Added user from conversation (same company):', newUser);
              } else if (userId && String(userId) !== currentUserIdStr && !isSameCompany) {
                console.log('Skipping user from different company:', {
                  userId,
                  userCompany,
                  currentUserCompany
                });
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
  }, [loadChatForUser, addNotification]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load users when chat tab is active (only once per tab switch)
  useEffect(() => {
    if (activeTab === 'chat' && !isLoadingUsersRef.current) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Only depend on activeTab, not loadUsers

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: TrendingUp },
      { id: 'occupancy', label: 'Occupancy', icon: Building },
      { id: 'sales-tracking', label: 'Sales Tracking', icon: FileText },
      { id: 'clients', label: 'Tenant Management', icon: Users },
      { id: 'property-management', label: 'Property Management', icon: Building },
      { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
      { id: 'advertisements', label: 'Advertisements', icon: Megaphone },
      { id: 'chat', label: 'Messages', icon: MessageCircle },
      { id: 'settings', label: 'Profile Settings', icon: Settings }
    ],
    []
  );

  // No mock data - using real API data only

  const handleKycUpload = async (file, userRole) => {
    // Validate file
    if (!validateFileType(file)) {
      addNotification('Invalid file type. Please upload PDF, DOC, DOCX, or image files.', 'error');
      return;
    }
    
    if (!validateFileSize(file)) {
      addNotification('File size too large. Please upload files smaller than 10MB.', 'error');
      return;
    }

    try {
      setLoading(true);
      const uploadResult = await cloudinaryService.uploadFile(file, 'real-estate-kyc');
      
      if (uploadResult.success) {
        setUploadedDocuments(prev => [...prev, { 
          type: 'KYC', 
          file: file, 
          name: file.name,
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          size: uploadResult.size,
          uploadedAt: uploadResult.uploadedAt
        }]);
        addNotification('KYC document uploaded successfully!', 'success');
        setShowKycModal(false);
      } else {
        addNotification(`Upload failed: ${uploadResult.error}`, 'error');
      }
    } catch (error) {
      console.error('KYC upload error:', error);
      addNotification('Failed to upload KYC document', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleContractUpload = async (files, contractDetails, userRole) => {
    // Validate files
    for (const file of files) {
      if (!validateFileType(file)) {
        addNotification(`Invalid file type for ${file.name}. Please upload PDF, DOC, DOCX, or image files.`, 'error');
        return;
      }
      
      if (!validateFileSize(file)) {
        addNotification(`File size too large for ${file.name}. Please upload files smaller than 10MB.`, 'error');
        return;
      }
    }

    try {
      setLoading(true);
      const uploadResults = await cloudinaryService.uploadMultipleFiles(files, 'real-estate-contracts');
      
      const successfulUploads = uploadResults.filter(result => result.success);
      const failedUploads = uploadResults.filter(result => !result.success);
      
      if (successfulUploads.length > 0) {
        const uploadedDocs = successfulUploads.map((result, index) => ({
          type: 'Contract',
          file: files[index],
          name: files[index].name,
          url: result.url,
          publicId: result.publicId,
          size: result.size,
          uploadedAt: result.uploadedAt,
          details: contractDetails
        }));
        
        setUploadedDocuments(prev => [...prev, ...uploadedDocs]);
        addNotification(`${successfulUploads.length} contract document(s) uploaded successfully!`, 'success');
        setShowContractModal(false);
      }
      
      if (failedUploads.length > 0) {
        addNotification(`${failedUploads.length} document(s) failed to upload`, 'error');
      }
    } catch (error) {
      console.error('Contract upload error:', error);
      addNotification('Failed to upload contract documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExcelFile(file);
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile) {
      addNotification('Please select a file first', 'error');
      return;
    }

    // Validate file type (Excel and CSV)
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
      'text/csv', // .csv
      'application/csv', // .csv (alternative MIME type)
      'text/plain', // .csv (some systems use this)
    ];
    
    const validExtensions = /\.(xlsx|xls|csv)$/i;
    
    if (!validTypes.includes(excelFile.type) && !excelFile.name.match(validExtensions)) {
      addNotification('Please upload a valid file (.xlsx, .xls, or .csv)', 'error');
      setExcelFile(null);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (excelFile.size > maxSize) {
      addNotification('File size too large. Please upload files smaller than 10MB.', 'error');
      setExcelFile(null);
      return;
    }

    try {
      setLoading(true);
      addNotification('Importing tenants from file...', 'info');
      
      const result = await salesManagerService.importClientsFromExcel(excelFile);
      
      console.log('Excel import result:', result);
      
      // Reload clients data
      await loadData();
      
      // Check if passwords are returned in the response
      if (result.createdUsers && Array.isArray(result.createdUsers) && result.createdUsers.length > 0) {
        // Filter users that have passwords (newly created)
        const usersWithPasswords = result.createdUsers.filter(user => user.password && !user.note);
        if (usersWithPasswords.length > 0) {
          setPasswordData({
            type: 'bulk',
            users: usersWithPasswords,
            success: result.success || usersWithPasswords.length,
            failed: result.failed || 0,
            errors: result.errors || []
          });
          setShowPasswordModal(true);
        }
      }
      
      // Show success notification
      const successCount = result.success || result.createdUsers?.length || 0;
      const failedCount = result.failed || 0;
      let notificationMessage = `Successfully imported ${successCount} tenant(s) from file!`;
      if (failedCount > 0) {
        notificationMessage += ` ${failedCount} failed.`;
      }
      if (result.errors && result.errors.length > 0) {
        notificationMessage += ` Check password modal for details.`;
      }
      addNotification(notificationMessage, 'success');
      
      // Close modal and reset
      setShowTenantCreationModal(false);
      setExcelFile(null);
      setImportMode('manual');
    } catch (error) {
      console.error('Excel import error:', error);
      addNotification(
        error.message || 'Failed to import file. Please check the file format and try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Validate required fields
    const firstName = formData.get('firstName')?.trim();
    const lastName = formData.get('lastName')?.trim();
    const email = formData.get('email')?.trim();
    const phone = formData.get('phone')?.trim();
    const property = formData.get('property')?.trim();
    const rent = formData.get('rent');
    const moveInDate = formData.get('moveInDate');
    
    if (!firstName || !lastName || !email || !phone || !property || !rent || !moveInDate) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }
    
    const tenantData = {
      name: `${firstName} ${lastName}`,
      property: property,
      email: email,
      phone: phone,
      amount: parseFloat(rent),
      moveInDate: moveInDate,
    };
    
        try {
          setLoading(true);
          console.log('Creating tenant with data:', tenantData);
          const newClient = await salesManagerService.createClient(tenantData);
          console.log('Created tenant response:', newClient);
          
          // Check if password is returned in the response
          if (newClient.user && newClient.user.password) {
            setPasswordData({
              type: 'single',
              user: newClient.user,
              client: newClient.client || newClient
            });
            setShowPasswordModal(true);
          }
          
          setNewTenantData({ ...tenantData, id: newClient.client?.id || newClient.id, documents: uploadedDocuments });
          setCurrentStep(2); // Move to document upload step
          addNotification(`Tenant "${tenantData.name}" created successfully!`, 'success');
        } catch (error) {
          console.error('Failed to create tenant:', error);
          addNotification(`Failed to create tenant: ${error.message || 'Unknown error'}`, 'error');
        } finally {
          setLoading(false);
        }
  };

  const finalizeTenantCreation = async () => {
    if (newTenantData) {
      try {
        setLoading(true);
        
        // Prepare document URLs for backend
        const documentUrls = uploadedDocuments.map(doc => ({
          type: doc.type,
          name: doc.name,
          url: doc.url,
          publicId: doc.publicId,
          size: doc.size,
          uploadedAt: doc.uploadedAt,
          details: doc.details || null
        }));

        // TODO: Send document URLs to backend when endpoint is created
        // const clientUpdateData = {
        //   ...newTenantData,
        //   documents: documentUrls
        // };

            // Reload data to get updated client list
            console.log('Reloading data after tenant creation...');
            await loadData();
        
        addNotification(`Tenant "${newTenantData.name}" created successfully with ${documentUrls.length} document(s)!`, 'success');
        
        // Reset states
        setShowTenantCreationModal(false);
        setNewTenantData(null);
        setUploadedDocuments([]);
        setCurrentStep(1);
      } catch (error) {
        console.error('Failed to finalize tenant creation:', error);
        addNotification('Failed to finalize tenant creation', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const removeDocument = (index) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
    addNotification('Document removed', 'info');
  };

  const handleUpdateAlert = async (alertId, status) => {
    try {
      await salesManagerService.updateAlert(alertId, status);
      addNotification('Alert updated successfully!', 'success');
      await loadData();
    } catch (error) {
      console.error('Failed to update alert:', error);
      addNotification('Failed to update alert', 'error');
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setShowEditClientModal(true);
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    if (!editingClient) return;

    const formData = new FormData(e.target);
    const updateData = {
      name: formData.get('name')?.trim() || editingClient.Name,
      email: formData.get('email')?.trim() || editingClient.Email,
      phone: formData.get('phone')?.trim() || editingClient.Phone,
      property: formData.get('property')?.trim() || editingClient.Property,
      amount: formData.get('amount') ? parseFloat(formData.get('amount')) : editingClient.Amount,
      status: formData.get('status') || editingClient.Status,
    };

    try {
      setLoading(true);
      await salesManagerService.updateClient(editingClient.ID || editingClient.id, updateData);
      addNotification('Client updated successfully!', 'success');
      setShowEditClientModal(false);
      setEditingClient(null);
      await loadData();
    } catch (error) {
      console.error('Failed to update client:', error);
      addNotification('Failed to update client', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUnpaidRent = (unpaidRent) => {
    setEditingUnpaidRent(unpaidRent);
    setShowUnpaidRentModal(true);
  };

  const handleUpdateUnpaidRent = async (e) => {
    e.preventDefault();
    if (!editingUnpaidRent) return;

    const formData = new FormData(e.target);
    const updateData = {
      status: formData.get('status') || 'Paid',
      amount: formData.get('amount') ? parseFloat(formData.get('amount')) : editingUnpaidRent.Amount,
      paidAmount: formData.get('paidAmount') ? parseFloat(formData.get('paidAmount')) : null,
      paymentDate: formData.get('paymentDate') || null,
      notes: formData.get('notes')?.trim() || null,
    };

    try {
      setLoading(true);
      await salesManagerService.updateUnpaidRent(editingUnpaidRent.ID || editingUnpaidRent.id, updateData);
      addNotification('Unpaid rent updated successfully!', 'success');
      setShowUnpaidRentModal(false);
      setEditingUnpaidRent(null);
      await loadData();
    } catch (error) {
      console.error('Failed to update unpaid rent:', error);
      addNotification('Failed to update unpaid rent', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const propertyData = {
      address: formData.get('address')?.trim(),
      type: formData.get('type')?.trim(),
      propertyType: formData.get('propertyType')?.trim(),
      buildingType: formData.get('buildingType')?.trim() || null,
      status: formData.get('status')?.trim(),
      rent: formData.get('rent') ? parseFloat(formData.get('rent')) : undefined,
      bedrooms: formData.get('bedrooms') ? parseInt(formData.get('bedrooms')) : undefined,
      bathrooms: formData.get('bathrooms') ? parseFloat(formData.get('bathrooms')) : undefined,
      urgency: formData.get('urgency')?.trim() || 'normal',
      tenant: formData.get('tenant')?.trim() || null,
      landlord_id: formData.get('owner') ? parseInt(formData.get('owner')) : null,
    };

    // Validate required fields
    if (!propertyData.address || !propertyData.type || !propertyData.propertyType || !propertyData.status || !propertyData.rent) {
      addNotification('Please fill in all required fields (Address, Type, Property Type, Status, Rent)', 'error');
      return;
    }

    // Validate building type if type is Apartment
    if (propertyData.type === 'Apartment' && !propertyData.buildingType) {
      addNotification('Building Type is required when Type is Apartment', 'error');
      return;
    }

    // Validate status
    if (propertyData.status !== 'Vacant' && propertyData.status !== 'Occupied') {
      addNotification('Status must be either "Vacant" or "Occupied"', 'error');
      return;
    }

    try {
      setLoading(true);
      await salesManagerService.createProperty(propertyData);
      addNotification('Property created successfully', 'success');
      setShowCreatePropertyModal(false);
      await loadData();
    } catch (error) {
      console.error('Error creating property:', error);
      addNotification(error.message || 'Failed to create property', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProperty = async (e) => {
    e.preventDefault();
    if (!editingProperty) return;

    const formData = new FormData(e.target);
    const updateData = {};
    
    // Only include fields that are provided
    if (formData.get('address')) updateData.address = formData.get('address').trim();
    if (formData.get('type')) updateData.type = formData.get('type').trim();
    if (formData.get('propertyType')) updateData.propertyType = formData.get('propertyType').trim();
    if (formData.get('buildingType')) {
      const buildingType = formData.get('buildingType').trim();
      updateData.buildingType = buildingType || null;
    }
    if (formData.get('status')) updateData.status = formData.get('status').trim();
    if (formData.get('rent')) updateData.rent = parseFloat(formData.get('rent'));
    if (formData.get('bedrooms')) updateData.bedrooms = parseInt(formData.get('bedrooms'));
    if (formData.get('bathrooms')) updateData.bathrooms = parseFloat(formData.get('bathrooms'));
    if (formData.get('urgency')) updateData.urgency = formData.get('urgency').trim();
    if (formData.get('tenant')) {
      const tenant = formData.get('tenant').trim();
      updateData.tenant = tenant || null;
    }

    // Validate status if provided
    if (updateData.status && updateData.status !== 'Vacant' && updateData.status !== 'Occupied') {
      addNotification('Status must be either "Vacant" or "Occupied"', 'error');
      return;
    }

    try {
      setLoading(true);
      const propertyId = editingProperty.ID || editingProperty.id;
      await salesManagerService.updateProperty(propertyId, updateData);
      addNotification('Property updated successfully', 'success');
      setShowEditPropertyModal(false);
      setEditingProperty(null);
      await loadData();
    } catch (error) {
      console.error('Error updating property:', error);
      addNotification(error.message || 'Failed to update property', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (loading) {
      return <div className="sa-table-empty">Loading overview data...</div>;
    }

    const data = overviewData || {
      globalOccupancyRate: 0,
      totalProperties: 0,
      occupiedProperties: 0,
      vacantProperties: 0,
      totalActiveTenants: 0,
      numberOfUnpaidAccounts: 0,
      totalUnpaidRentAmount: 0,
      // Legacy field names for backward compatibility
      occupancyRate: 0,
      activeClients: 0,
      unpaidCount: 0,
      unpaidAmount: 0,
    };

    // Use enhanced fields if available, fallback to legacy
    const occupancyRate = data.globalOccupancyRate || data.occupancyRate || 0;
    const activeTenants = data.totalActiveTenants || data.activeClients || 0;
    const unpaidCount = data.numberOfUnpaidAccounts || data.unpaidCount || 0;
    const unpaidAmount = data.totalUnpaidRentAmount || data.unpaidAmount || 0;
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    return (
      <div className="sa-overview-page">
        <div className="sa-overview-top">
          <div className="sa-overview-chart-card">
            <div className="sa-card-header">
              <h2>Sales Manager Dashboard</h2>
              <span className="sa-card-subtitle">Welcome, {currentUser?.name || currentUser?.Name || 'Sales Manager'}!</span>
            </div>
            <div className="sa-mini-legend">
              <span className="sa-legend-item sa-legend-expected">Occupancy Rate (%)</span>
              <span className="sa-legend-item sa-legend-current">Active Tenants</span>
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
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
            </div>

          <div className="sa-overview-metrics">
            <div className="sa-metric-card sa-metric-primary">
              <p className="sa-metric-label">Total Unpaid Amount</p>
              <p className="sa-metric-period">Outstanding Balance</p>
              <p className="sa-metric-value">
                {unpaidAmount.toLocaleString()} XOF
              </p>
          </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Active Tenants</p>
              <p className="sa-metric-number">
                {activeTenants}
                <span className="sa-metric-trend positive">+1.5%</span>
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Occupancy Rate</p>
              <p className="sa-metric-value">
                {occupancyRate.toFixed(0)}%
              </p>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Unpaid Accounts</p>
              <p className="sa-metric-number">
                {unpaidCount}
                <span className="sa-metric-trend negative">-1.5%</span>
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
                overflowX: 'auto'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '24px',
                  flexWrap: 'nowrap',
                  overflowX: 'auto',
                  paddingBottom: '16px',
                  width: '100%'
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
                          minWidth: '350px',
                          maxWidth: '450px',
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
              </div>
            ) : (
              <div className="sa-banner-card">
                <div className="sa-banner-text">
                  <h3>Increase your sales</h3>
                  <p>
                    Discover the proven methods to skyrocket your sales! Unleash the
                    potential of your business and achieve remarkable growth.
                  </p>
                  <button className="sa-banner-button">Learn More</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sa-section-card">
          <div className="sa-section-header">
        <h3>Priority Alerts</h3>
            <p>Track urgent alerts and overdue payments.</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th />
                  <th>Alert</th>
                  <th>Property</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
          {alerts.length > 0 ? (
            alerts.filter(alert => alert.Urgency === 'urgent' || alert.Urgency === 'high').map(alert => (
                    <tr key={alert.ID}>
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{alert.Title || 'N/A'}</span>
                          <span className="sa-cell-sub">{alert.Message || 'N/A'}</span>
                </div>
                      </td>
                      <td>{alert.Property || 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${(alert.Urgency || 'normal').toLowerCase()}`}>
                          {alert.Urgency || 'Normal'}
                        </span>
                      </td>
                      <td>
                        <span className={`sa-status-pill ${(alert.Status || 'open').toLowerCase()}`}>
                          {alert.Status || 'Open'}
                        </span>
                      </td>
                      <td>
                        {alert.Amount ? `${alert.Amount.toLocaleString()} XOF` : '—'}
                      </td>
                    </tr>
            ))
          ) : (
                  <tr>
                    <td colSpan={6} className="sa-table-empty">
                      No priority alerts at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
  };

  const renderOccupancy = () => {
    const totalProperties = properties.length;
    const occupiedCount = properties.filter(
      property => ((property.Status || '').toLowerCase() === 'occupied')
    ).length;
    const vacantCount = properties.filter(
      property => ((property.Status || '').toLowerCase() === 'vacant')
    ).length;
    const occupancyRate = totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : 0;

    return (
      <div className="sa-occupancy-page">
        <div className="sa-occupancy-header">
          <div>
            <h2>Property Occupancy Overview</h2>
          <p>Monitor occupancy status and manage vacant properties</p>
          </div>
        </div>

        <div className="sa-occupancy-metrics">
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Properties</p>
            <p className="sa-metric-value">{totalProperties}</p>
            </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Occupied</p>
            <p className="sa-metric-value">{occupiedCount}</p>
            </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Vacant</p>
            <p className="sa-metric-value">{vacantCount}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Occupancy Rate</p>
            <p className="sa-metric-value">{occupancyRate}%</p>
          </div>
        </div>

        <div className="sa-transactions-filters">
          <button className="sa-filter-button" onClick={() => {
            const filters = document.querySelector('.sa-property-filters');
            if (filters) filters.style.display = filters.style.display === 'none' ? 'flex' : 'none';
          }}>
            <Filter size={16} />
            Filter
          </button>
          <select 
            className="sa-filter-button"
            value={propertyStatusFilter}
            onChange={(e) => setPropertyStatusFilter(e.target.value)}
            style={{ padding: '8px 14px', cursor: 'pointer' }}
          >
            <option value="">All Status</option>
            <option value="Vacant">Vacant</option>
            <option value="Occupied">Occupied</option>
            </select>
          <select 
            className="sa-filter-button"
            value={propertyTypeFilter}
            onChange={(e) => setPropertyTypeFilter(e.target.value)}
            style={{ padding: '8px 14px', cursor: 'pointer' }}
          >
            <option value="">All Types</option>
            <option value="Apartment">Apartment</option>
            <option value="House">House</option>
            <option value="Condo">Condo</option>
            <option value="Studio">Studio</option>
            </select>
          <select 
            className="sa-filter-button"
            value={propertyUrgencyFilter}
            onChange={(e) => setPropertyUrgencyFilter(e.target.value)}
            style={{ padding: '8px 14px', cursor: 'pointer' }}
          >
            <option value="">All Urgency</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
            </select>
          <div className="sa-search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by Address, Type or Status"
            />
          </div>
        </div>

        <div className="sa-section-card">
          <div className="sa-section-header">
            <div>
              <h3>Properties</h3>
              <p>Manage all properties and their occupancy status.</p>
            </div>
            <button 
              className="sa-primary-cta"
              onClick={() => setShowCreatePropertyModal(true)}
            >
              <Plus size={16} />
              Create Property
            </button>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
            <thead>
              <tr>
                  <th />
                  <th>Property</th>
                <th>Type</th>
                <th>Status</th>
                <th>Property Type</th>
                <th>Tenant</th>
                <th>Rent</th>
                <th>Urgency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.length > 0 ? (
                  properties.map(property => {
                    const propertyId = property.ID || property.id;
                    return (
                      <tr key={propertyId}>
                        <td>
                          <input type="checkbox" />
                        </td>
                        <td>
                          <div className="sa-cell-main">
                            <span className="sa-cell-title">{property.Address || property.address || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="sa-cell-main">
                            <span className="sa-cell-title">{property.Type || property.type || 'N/A'}</span>
                            {property.BuildingType || property.buildingType ? (
                              <span className="sa-cell-sub">({property.BuildingType || property.buildingType})</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <span className={`sa-status-pill ${(property.Status || property.status || 'unknown').toLowerCase()}`}>
                            {property.Status || property.status || 'Unknown'}
                      </span>
                    </td>
                        <td>
                          <div className="sa-cell-main">
                            <span className="sa-cell-title">{property.PropertyType || property.propertyType || 'N/A'}</span>
                          </div>
                        </td>
                        <td>{property.Tenant || property.tenant || 'No tenant'}</td>
                        <td>{property.Rent || property.rent ? `${property.Rent || property.rent} XOF/month` : 'N/A'}</td>
                        <td>
                          {property.Urgency || property.urgency ? (
                            <span className={`sa-status-pill ${(property.Urgency || property.urgency).toLowerCase()}`}>
                              {property.Urgency || property.urgency}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                          <button
                            className="sa-action-button"
                            onClick={() => {
                              setEditingProperty(property);
                              setShowBuildingType((property.Type || property.type) === 'Apartment');
                              setShowEditPropertyModal(true);
                            }}
                            title="Edit Property"
                          >
                            ✏️
                      </button>
                    </td>
                  </tr>
                    );
                  })
              ) : (
                <tr>
                    <td colSpan={9} className="sa-table-empty">No properties found. Create your first property to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    );
  };

  // Property Management - Owners and their properties
  const renderPropertyManagement = () => {
    const getOwnerId = (owner) => owner.id || owner.ID;
    const getPropertyOwnerId = (property) =>
      property.LandlordID || property.landlordId || property.landlordID;

    const ownersWithProperties = owners.map((owner) => {
      const ownerId = getOwnerId(owner);
      const ownedProperties = properties.filter((property) => {
        const landlordId = getPropertyOwnerId(property);
        return landlordId && ownerId && String(landlordId) === String(ownerId);
      });
      return { owner, properties: ownedProperties };
    });

    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header">
          <div>
            <h2>Property Management</h2>
            <p>{owners.length} owners found</p>
          </div>
        </div>

        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-section-header">
            <div>
              <h3>Owners</h3>
              <p>Click an owner to view all properties they own.</p>
            </div>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Properties</th>
                </tr>
              </thead>
              <tbody>
                {ownersWithProperties.map(({ owner, properties: ownerProperties }, index) => {
                  const ownerId = getOwnerId(owner);
                  const isExpanded =
                    expandedOwnerId && ownerId && String(expandedOwnerId) === String(ownerId);
                  return (
                    <React.Fragment key={`owner-${ownerId || index}`}>
                      <tr
                        className="clickable-row"
                        onClick={() =>
                          setExpandedOwnerId((prev) =>
                            prev && ownerId && String(prev) === String(ownerId) ? null : ownerId
                          )
                        }
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{index + 1}</td>
                        <td className="sa-cell-main">
                          <span className="sa-cell-title">
                            {owner.name || owner.Name || 'N/A'}
                          </span>
                        </td>
                        <td>{owner.email || owner.Email || 'N/A'}</td>
                        <td>{owner.phone || owner.Phone || 'N/A'}</td>
                        <td>{ownerProperties.length}</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} style={{ background: '#f9fafb' }}>
                            {ownerProperties.length > 0 ? (
                              <div style={{ padding: '12px 8px' }}>
                                <h4
                                  style={{
                                    margin: '0 0 8px',
                                    fontSize: '0.95rem',
                                    color: '#374151',
                                  }}
                                >
                                  Properties owned by {owner.name || owner.Name || 'Owner'}
                                </h4>
                                <table className="sa-table nested-table">
                                  <thead>
                                    <tr>
                                      <th>Address</th>
                                      <th>Type</th>
                                      <th>Status</th>
                                      <th>Rent</th>
                                      <th>Bedrooms</th>
                                      <th>Bathrooms</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ownerProperties.map((property, pIndex) => (
                                      <tr key={`owner-${ownerId}-property-${pIndex}`}>
                                        <td>{property.Address || property.address || 'N/A'}</td>
                                        <td>{property.Type || property.type || 'N/A'}</td>
                                        <td>{property.Status || property.status || 'N/A'}</td>
                                        <td>
                                          {typeof (property.Rent || property.rent) === 'number'
                                            ? (property.Rent || property.rent).toLocaleString()
                                            : property.Rent || property.rent || 'N/A'}
                                        </td>
                                        <td>{property.Bedrooms || property.bedrooms || 0}</td>
                                        <td>{property.Bathrooms || property.bathrooms || 0}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="sa-table-empty" style={{ padding: '12px 8px' }}>
                                No properties linked to this owner yet.
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {owners.length === 0 && (
                  <tr>
                    <td colSpan={5} className="sa-table-empty">
                      No owners found. Ask the Agency Director to add property owners.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Sales Tracking - Properties that are strictly for sale
  const renderSalesTracking = () => {
    const normalizeType = (type) => (type || '').toLowerCase();

    const filteredSales = salesProperties.filter((property) => {
      if (!salesTypeFilter) return true;
      return normalizeType(property.Type || property.type) === salesTypeFilter;
    });

    const totalSales = salesProperties.length;
    const typeCounts = {
      house: salesProperties.filter((p) => normalizeType(p.Type || p.type) === 'house').length,
      apartment: salesProperties.filter((p) => normalizeType(p.Type || p.type) === 'apartment')
        .length,
      villa: salesProperties.filter((p) => normalizeType(p.Type || p.type) === 'villa').length,
      land: salesProperties.filter((p) => normalizeType(p.Type || p.type) === 'land').length,
    };

    return (
      <div className="sa-occupancy-page">
        <div className="sa-occupancy-header">
          <div>
            <h2>Sales Tracking</h2>
            <p>Monitor all properties that are strictly for sale.</p>
          </div>
        </div>

        <div className="sa-occupancy-metrics">
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total For Sale</p>
            <p className="sa-metric-value">{totalSales}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Houses</p>
            <p className="sa-metric-value">{typeCounts.house}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Apartments</p>
            <p className="sa-metric-value">{typeCounts.apartment}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Villas</p>
            <p className="sa-metric-value">{typeCounts.villa}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Land</p>
            <p className="sa-metric-value">{typeCounts.land}</p>
          </div>
        </div>

        <div className="sa-transactions-filters">
          <button
            className="sa-filter-button"
            onClick={() => setSalesTypeFilter('')}
          >
            All Types
          </button>
          <button
            className={`sa-filter-button ${salesTypeFilter === 'house' ? 'active' : ''}`}
            onClick={() => setSalesTypeFilter('house')}
          >
            Houses
          </button>
          <button
            className={`sa-filter-button ${salesTypeFilter === 'apartment' ? 'active' : ''}`}
            onClick={() => setSalesTypeFilter('apartment')}
          >
            Apartments
          </button>
          <button
            className={`sa-filter-button ${salesTypeFilter === 'villa' ? 'active' : ''}`}
            onClick={() => setSalesTypeFilter('villa')}
          >
            Villas
          </button>
          <button
            className={`sa-filter-button ${salesTypeFilter === 'land' ? 'active' : ''}`}
            onClick={() => setSalesTypeFilter('land')}
          >
            Land
          </button>
        </div>

        <div className="sa-section-card">
          <div className="sa-section-header">
            <h3>Properties for Sale</h3>
            <p>All houses, apartments, villas, and land that are currently for sale.</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Type</th>
                  <th>Bedrooms</th>
                  <th>Bathrooms</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((property, index) => (
                  <tr key={property.id || index}>
                    <td>{property.address || property.Address || 'N/A'}</td>
                    <td>{property.type || property.Type || 'N/A'}</td>
                    <td>{property.bedrooms || property.Bedrooms || 0}</td>
                    <td>{property.bathrooms || property.Bathrooms || 0}</td>
                    <td>{property.price || property.Price || 'N/A'}</td>
                    <td>{property.status || property.Status || 'N/A'}</td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="sa-table-empty">
                      No properties for sale found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Get unique properties from clients for filter dropdown
  const uniqueProperties = useMemo(() => {
    const props = new Set();
    clients.forEach(client => {
      if (client.Property) {
        props.add(client.Property);
      }
    });
    return Array.from(props).sort();
  }, [clients]);

  // Filter clients based on filters
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Status filter
      if (clientStatusFilter) {
        const clientStatus = ((client.Status || client.status) || '').toLowerCase().replace(' ', '-');
        const filterStatus = clientStatusFilter.toLowerCase();
        if (clientStatus !== filterStatus && !clientStatus.includes(filterStatus)) {
          return false;
        }
      }

      // Property filter
      if (clientPropertyFilter) {
        const clientProperty = ((client.Property || client.property) || '').toLowerCase();
        const filterProperty = clientPropertyFilter.toLowerCase();
        if (clientProperty !== filterProperty && !clientProperty.includes(filterProperty)) {
          return false;
        }
      }

      // Search text filter
      if (clientSearchText) {
        const searchLower = clientSearchText.toLowerCase();
        const name = ((client.Name || client.name) || '').toLowerCase();
        const email = ((client.Email || client.email) || '').toLowerCase();
        const phone = ((client.Phone || client.phone) || '').toLowerCase();
        
        if (!name.includes(searchLower) && !email.includes(searchLower) && !phone.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [clients, clientStatusFilter, clientPropertyFilter, clientSearchText]);

  const renderClients = () => (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Tenant List</h2>
          <p>{filteredClients.length} results found</p>
        </div>
        <div className="sa-clients-header-right">
          <button
            className="sa-primary-cta"
            onClick={() => {
              setImportMode('manual');
              setExcelFile(null);
              setShowTenantCreationModal(true);
            }}
          >
            <Plus size={16} />
            Add Tenant
          </button>
          <button
            type="button"
            className="sa-primary-cta secondary"
            style={{ marginLeft: '8px' }}
            onClick={() => {
              setImportMode('excel');
              setExcelFile(null);
              setShowTenantCreationModal(true);
            }}
          >
            <FileSpreadsheet size={16} style={{ marginRight: '4px' }} />
            Import from Excel
          </button>
          <button className="sa-sort-button">Sort: Creation Date</button>
          <button className="sa-date-button">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </button>
        </div>
      </div>

      <div className="sa-overview-metrics">
        <div className="sa-metric-card">
          <p className="sa-metric-label">Active Tenants</p>
          <p className="sa-metric-number">
            {filteredClients.filter(client => client.Status === 'Active').length}
            <span className="sa-metric-trend positive">+1.5%</span>
          </p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Overdue Accounts</p>
          <p className="sa-metric-number">
            {filteredClients.filter(client => client.Status === 'Overdue').length}
            <span className="sa-metric-trend negative">-1.5%</span>
          </p>
          </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Waiting List</p>
          <p className="sa-metric-value">
            {filteredClients.filter(client => client.Status === 'Waiting List').length}
          </p>
          </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Total Monthly Revenue</p>
          <p className="sa-metric-value">
              {filteredClients.reduce(
                (sum, client) => sum + (client.Amount || client.amount || 0),
                0
              ).toLocaleString()} XOF
          </p>
        </div>
      </div>

      <div className="sa-transactions-filters">
        <button className="sa-filter-button">
          <Filter size={16} />
          Filter
        </button>
        <div className="sa-search-input">
          <Search size={16} />
        <input 
          type="text" 
            placeholder="Search by Name, Email or Phone"
          value={clientSearchText}
          onChange={(e) => setClientSearchText(e.target.value)}
        />
        </div>
      </div>

      <div className="sa-section-card">
        <div className="sa-section-header">
          <h3>Tenants</h3>
          <p>Manage all tenant profiles and track their status.</p>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
          <thead>
            <tr>
                <th />
                <th>Client</th>
              <th>Property</th>
              <th>Status</th>
              <th>Last Payment</th>
              <th>Amount</th>
              <th>Contact</th>
                <th />
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map(client => (
              <tr key={client.ID}>
                <td>
                      <input type="checkbox" />
                </td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client.Name || client.name || 'N/A'}</span>
                        <span className="sa-cell-sub">{client.Email || client.email || 'N/A'}</span>
                  </div>
                </td>
                    <td>{client.Property || client.property || 'N/A'}</td>
                    <td>
                      <span className={`sa-status-pill ${(client.Status || client.status || 'unknown').toLowerCase().replace(' ', '-')}`}>
                        {client.Status || client.status || 'Unknown'}
                      </span>
                    </td>
                    <td>{(client.LastPayment || client.lastPayment) ? new Date(client.LastPayment || client.lastPayment).toLocaleDateString() : 'N/A'}</td>
                    <td>{(client.Amount || client.amount || 0).toLocaleString()} XOF</td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client.Phone || client.phone || 'N/A'}</span>
                        <span className="sa-cell-sub">{client.Email || client.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" onClick={() => handleEditClient(client)} title="Edit">✏️</button>
                </td>
              </tr>
            ))
            ) : (
              <tr>
                  <td colSpan={8} className="sa-table-empty">No tenants found. Start the backend to see real data.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Waiting List Section */}
      {waitingListClients.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '24px' }}>
          <div className="sa-section-header">
            <h3>Waiting List Tenants</h3>
            <p>Tenants waiting for available properties.</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th />
                  <th>Tenant</th>
                  <th>Contact</th>
                  <th>Preferred Property</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {waitingListClients.map(client => (
                  <tr key={client.ID || client.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client.Name || client.name || 'N/A'}</span>
                        <span className="sa-cell-sub">{client.Email || client.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{client.Phone || client.phone || 'N/A'}</td>
                    <td>{client.Property || client.property || 'Any'}</td>
                    <td>
                      <span className="sa-status-pill pending">
                        Waiting List
                      </span>
                    </td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" onClick={() => handleEditClient(client)} title="Edit">✏️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unpaid Rents Section */}
      {unpaidRents.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '24px' }}>
          <div className="sa-section-header">
            <h3>Unpaid Rents</h3>
            <p>Manage overdue payments and update payment status.</p>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th />
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {unpaidRents.map(unpaid => (
                  <tr key={unpaid.ID || unpaid.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{unpaid.Name || unpaid.ClientName || 'N/A'}</span>
                        <span className="sa-cell-sub">{unpaid.Email || unpaid.ClientEmail || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{unpaid.Property || 'N/A'}</td>
                    <td>{(unpaid.Amount || 0).toLocaleString()} XOF</td>
                    <td>{unpaid.DueDate ? new Date(unpaid.DueDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className="sa-status-pill overdue">
                        {unpaid.Status || 'Overdue'}
                      </span>
                    </td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" onClick={() => handleEditUnpaidRent(unpaid)} title="Update Payment">💰</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderAlerts = () => (
    <div className="sa-alerts-page">
      <div className="sa-alerts-header">
        <div>
          <h2>Unpaid Rent Alerts</h2>
        <p>Monitor and manage overdue payments</p>
        </div>
      </div>

      <div className="sa-transactions-filters">
        <button className="sa-filter-button">
          <Filter size={16} />
          Filter
        </button>
        <select 
          className="sa-filter-button"
          value={alertTypeFilter}
          onChange={(e) => setAlertTypeFilter(e.target.value)}
          style={{ padding: '8px 14px', cursor: 'pointer' }}
        >
          <option value="">All Alert Types</option>
          <option value="Payment Overdue">Payment Overdue</option>
          <option value="Vacant Property">Vacant Property</option>
          <option value="Maintenance">Maintenance</option>
        </select>
        <div className="sa-search-input">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by Title, Property or Message"
          />
        </div>
      </div>

      <div className="sa-section-card">
        <div className="sa-section-header">
          <h3>Alerts</h3>
          <p>Track all alerts and their current status.</p>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
          <thead>
            <tr>
                <th />
                <th>Alert</th>
              <th>Property</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Created</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length > 0 ? (
              alerts.map(alert => (
                <tr key={alert.ID}>
                  <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{alert.Title || 'N/A'}</span>
                        <span className="sa-cell-sub">{alert.Message || 'N/A'}</span>
                      </div>
                  </td>
                  <td>{alert.Property || 'N/A'}</td>
                  <td>
                      <span className={`sa-status-pill ${(alert.Urgency || 'normal').toLowerCase()}`}>
                      {alert.Urgency || 'Normal'}
                    </span>
                  </td>
                  <td>
                      <span className={`sa-status-pill ${(alert.Status || 'open').toLowerCase()}`}>
                      {alert.Status || 'Open'}
                    </span>
                  </td>
                  <td>{alert.CreatedAt ? new Date(alert.CreatedAt).toLocaleDateString() : 'N/A'}</td>
                    <td>{alert.Amount ? `${alert.Amount.toLocaleString()} XOF` : '—'}</td>
                </tr>
              ))
            ) : (
              <tr>
                  <td colSpan={7} className="sa-table-empty">No alerts found. Start the backend to see real data.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
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
      case 'occupancy':
        return renderOccupancy();
      case 'sales-tracking':
        return renderSalesTracking();
      case 'clients':
        return renderClients();
      case 'property-management':
        return renderPropertyManagement();
      case 'alerts':
        return renderAlerts();
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
        brand={{ name: 'SAAF IMMO', caption: 'Commercial Team', logo: 'SAAF', logoImage: `${process.env.PUBLIC_URL}/download.jpeg` }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}
      >
        {({ activeId }) => (
          <div className="content-body sales-manager-content">
              {renderContent(activeId || activeTab)}
          </div>
        )}
      </RoleLayout>

      {/* Password Display Modal */}
      {showPasswordModal && passwordData && (
        <div className="modal-overlay" onClick={() => {
          setShowPasswordModal(false);
          setPasswordData(null);
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {passwordData.type === 'bulk' 
                  ? `Tenant Passwords (${passwordData.users.length} created)`
                  : 'Tenant Password Created'}
              </h3>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ 
                padding: '16px', 
                background: '#fef3c7', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #fbbf24'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e', fontWeight: 500 }}>
                  ⚠️ Important: Passwords are only shown once. Please copy and securely share them with tenants.
                </p>
              </div>

              {passwordData.type === 'single' ? (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '12px', color: '#1f2937' }}>Tenant Information</h4>
                    <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                      <p style={{ margin: '4px 0' }}><strong>Name:</strong> {passwordData.user.name || passwordData.client?.name || 'N/A'}</p>
                      <p style={{ margin: '4px 0' }}><strong>Email:</strong> {passwordData.user.email || passwordData.client?.email || 'N/A'}</p>
                      {passwordData.client?.property && (
                        <p style={{ margin: '4px 0' }}><strong>Property:</strong> {passwordData.client.property}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '12px', color: '#1f2937' }}>Login Credentials</h4>
                    <PasswordDisplayItem 
                      email={passwordData.user.email} 
                      password={passwordData.user.password}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  {passwordData.failed > 0 && (
                    <div style={{ 
                      padding: '12px', 
                      background: '#fee2e2', 
                      borderRadius: '8px', 
                      marginBottom: '16px',
                      border: '1px solid #fca5a5'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b' }}>
                        <strong>Import Summary:</strong> {passwordData.success} succeeded, {passwordData.failed} failed
                      </p>
                    </div>
                  )}
                  
                  {passwordData.errors && passwordData.errors.length > 0 && (
                    <div style={{ 
                      padding: '12px', 
                      background: '#fee2e2', 
                      borderRadius: '8px', 
                      marginBottom: '16px',
                      border: '1px solid #fca5a5'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b', fontWeight: 500, marginBottom: '8px' }}>
                        Errors:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#991b1b' }}>
                        {passwordData.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ marginBottom: '12px', color: '#1f2937' }}>
                      Passwords for Newly Created Tenants ({passwordData.users.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {passwordData.users.map((user, index) => (
                        <div key={user.id || index} style={{ 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px', 
                          padding: '16px',
                          background: '#ffffff'
                        }}>
                          <div style={{ marginBottom: '12px' }}>
                            <p style={{ margin: '4px 0', fontWeight: 500, color: '#1f2937' }}>
                              {user.name || 'N/A'}
                            </p>
                            <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#6b7280' }}>
                              {user.email || 'N/A'}
                            </p>
                          </div>
                          <PasswordDisplayItem 
                            email={user.email} 
                            password={user.password}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="action-button primary" 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData(null);
                }}
              >
                I've Copied the Passwords
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>×</button>
          </div>
        ))}
      </div>

      {/* Tenant Creation Modal */}
      {showTenantCreationModal && (
        <div className="modal-overlay" onClick={() => {
          setShowTenantCreationModal(false);
          setCurrentStep(1);
          setNewTenantData(null);
          setUploadedDocuments([]);
          setExcelFile(null);
          setImportMode('manual');
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{currentStep === 1 ? (importMode === 'excel' ? 'Import Tenants from File' : 'Create New Tenant - Basic Information') : 'Create New Tenant - Upload Documents'}</h3>
              <button className="modal-close" onClick={() => {
                setShowTenantCreationModal(false);
                setCurrentStep(1);
                setNewTenantData(null);
                setUploadedDocuments([]);
                setExcelFile(null);
                setImportMode('manual');
              }}>×</button>
            </div>
            <div className="modal-body">
              {currentStep === 1 ? (
                <>
                  {/* Import Mode Selection */}
                  <div className="import-mode-selector" style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className={`action-button ${importMode === 'manual' ? 'primary' : 'secondary'}`}
                        onClick={() => setImportMode('manual')}
                        style={{ flex: 1 }}
                      >
                        <UserPlus size={18} />
                        Add Single Tenant
                      </button>
                      <button
                        type="button"
                        className={`action-button ${importMode === 'excel' ? 'primary' : 'secondary'}`}
                        onClick={() => setImportMode('excel')}
                        style={{ flex: 1 }}
                      >
                        <FileSpreadsheet size={18} />
                        Import from File
                      </button>
                    </div>
                  </div>

                  {importMode === 'excel' ? (
                    <div className="excel-upload-section">
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ marginBottom: '8px' }}>Upload File</h4>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '16px' }}>
                          Upload an Excel file (.xlsx, .xls) or CSV file (.csv) with tenant details. Required columns: Name, Property, Email, Phone, Amount, MoveInDate. Optional: Status (defaults to 'Active'). Date format: YYYY-MM-DD or DD/MM/YYYY
                        </p>
                      </div>
                      
                      <div className="file-upload-area" style={{
                        border: '2px dashed #d1d5db',
                        borderRadius: '12px',
                        padding: '32px',
                        textAlign: 'center',
                        background: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}>
                        <input
                          type="file"
                          id="excel-file-input"
                          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/csv"
                          onChange={handleExcelFileSelect}
                          style={{ display: 'none' }}
                          disabled={loading}
                        />
                        <label
                          htmlFor="excel-file-input"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <FileSpreadsheet size={48} color={loading ? '#9ca3af' : '#2563eb'} />
                          <div>
                            <strong style={{ color: loading ? '#9ca3af' : '#1f2937' }}>
                              {loading ? 'Uploading...' : 'Click to select Excel file'}
                            </strong>
                            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                              Supports .xlsx, .xls, and .csv files (max 10MB)
                            </p>
                          </div>
                        </label>
                        {excelFile && (
                          <div style={{ marginTop: '12px', padding: '8px 12px', background: '#eff6ff', borderRadius: '8px', display: 'inline-block' }}>
                            <FileSpreadsheet size={16} style={{ display: 'inline', marginRight: '8px' }} />
                            <span style={{ fontSize: '0.9rem' }}>{excelFile.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="modal-footer" style={{ marginTop: '24px' }}>
                        <button
                          type="button"
                          className="action-button secondary"
                          onClick={() => {
                            setShowTenantCreationModal(false);
                            setImportMode('manual');
                            setExcelFile(null);
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="action-button primary"
                          onClick={handleExcelUpload}
                          disabled={!excelFile || loading}
                        >
                          {loading ? 'Importing...' : 'Import Tenants'}
                        </button>
                      </div>
                    </div>
                  ) : (
                <form onSubmit={handleCreateTenant}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name</label>
                      <input type="text" name="firstName" required placeholder="Enter first name" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name</label>
                      <input type="text" name="lastName" required placeholder="Enter last name" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input type="email" name="email" required placeholder="tenant@example.com" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input type="tel" name="phone" required placeholder="+1-555-0000" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="property">Property</label>
                      <select name="property" required>
                        <option value="">Select Property</option>
                        {properties.length > 0 ? (
                          properties.map(property => {
                            const propertyId = property.ID || property.id;
                            const address = property.Address || property.address || 'Unnamed Property';
                            const type = property.Type || property.type || '';
                            const displayText = type ? `${address} - ${type}` : address;
                            return (
                              <option key={propertyId || `property-${address}`} value={address}>
                                {displayText}
                            </option>
                            );
                          })
                        ) : (
                          <option value="" disabled>No properties available. Start backend to load properties.</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="rent">Monthly Rent</label>
                      <input type="number" name="rent" step="0.01" required placeholder="0.00" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="moveInDate">Move-in Date</label>
                    <input type="date" name="moveInDate" required />
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="action-button secondary" onClick={() => {
                      setShowTenantCreationModal(false);
                      setCurrentStep(1);
                    }}>
                      Cancel
                    </button>
                    <button type="submit" className="action-button primary" disabled={loading}>
                      {loading ? 'Creating Tenant...' : 'Next: Upload Documents'}
                    </button>
                  </div>
                </form>
                  )}
                </>
              ) : (
                <div className="document-upload-step">
                  <div className="tenant-summary">
                    <h4>Tenant Information:</h4>
                    <p><strong>Name:</strong> {newTenantData?.name}</p>
                    <p><strong>Email:</strong> {newTenantData?.email}</p>
                    <p><strong>Property:</strong> {newTenantData?.property}</p>
                    <p><strong>Rent:</strong> {newTenantData?.amount?.toFixed(2)} XOF</p>
                  </div>

                  <div className="document-upload-section">
                    <h4>Upload Required Documents</h4>
                    <p>Please upload the tenant's KYC documents and lease contract</p>

                    <div className="upload-buttons">
                      <button className="action-button primary" onClick={() => setShowKycModal(true)}>
                        <Upload size={20} />
                        Upload KYC Documents
                      </button>
                      <button className="action-button primary" onClick={() => setShowContractModal(true)}>
                        <FileText size={20} />
                        Upload Lease Contract
                      </button>
                    </div>

                    {uploadedDocuments.length > 0 && (
                      <div className="uploaded-documents-list">
                        <h5>Uploaded Documents:</h5>
                        {uploadedDocuments.map((doc, index) => (
                          <div key={index} className="document-item">
                            <FileText size={16} />
                            <div className="document-info">
                              <span className="document-name">{doc.type}: {doc.name || doc.details?.contractType || 'Contract'}</span>
                              {doc.url && (
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="document-link"
                                >
                                  View Document
                                </a>
                              )}
                              {doc.size && (
                                <span className="document-size">({(doc.size / 1024).toFixed(1)} KB)</span>
                              )}
                            </div>
                            <button 
                              className="remove-doc-button"
                              onClick={() => removeDocument(index)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="action-button secondary" onClick={() => setCurrentStep(1)}>
                      Back
                    </button>
                    <button 
                      type="button" 
                      className="action-button primary" 
                      onClick={finalizeTenantCreation}
                      disabled={loading}
                    >
                      {loading ? 'Finalizing...' : 'Create Tenant Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KYC Upload Modal */}
      <Modal isOpen={showKycModal} onClose={() => setShowKycModal(false)}>
        <h2>Upload Tenant KYC Documents</h2>
        <DocumentUpload onFileUpload={(file) => handleKycUpload(file, 'tenant')} />
      </Modal>

      {/* Contract Upload Modal */}
      <Modal isOpen={showContractModal} onClose={() => setShowContractModal(false)}>
        <ContractUpload onContractUpload={handleContractUpload} />
      </Modal>

      {/* Edit Client Modal */}
      {showEditClientModal && editingClient && (
        <div className="modal-overlay" onClick={() => {
          setShowEditClientModal(false);
          setEditingClient(null);
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Tenant Profile</h3>
              <button className="modal-close" onClick={() => {
                setShowEditClientModal(false);
                setEditingClient(null);
              }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateClient}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-name">Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      id="edit-name"
                      defaultValue={editingClient.Name || editingClient.name || ''}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-email">Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      id="edit-email"
                      defaultValue={editingClient.Email || editingClient.email || ''}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-phone">Phone</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      id="edit-phone"
                      defaultValue={editingClient.Phone || editingClient.phone || ''}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-property">Property</label>
                    <input 
                      type="text" 
                      name="property" 
                      id="edit-property"
                      defaultValue={editingClient.Property || editingClient.property || ''}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-amount">Monthly Rent (XOF)</label>
                    <input 
                      type="number" 
                      name="amount" 
                      id="edit-amount"
                      step="0.01"
                      defaultValue={editingClient.Amount || editingClient.amount || 0}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-status">Status</label>
                    <select name="status" id="edit-status" defaultValue={editingClient.Status || editingClient.status || 'Active'}>
                      <option value="Active">Active</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Waiting List">Waiting List</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary" 
                    onClick={() => {
                      setShowEditClientModal(false);
                      setEditingClient(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Unpaid Rent Modal */}
      {showUnpaidRentModal && editingUnpaidRent && (
        <div className="modal-overlay" onClick={() => {
          setShowUnpaidRentModal(false);
          setEditingUnpaidRent(null);
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Unpaid Rent</h3>
              <button className="modal-close" onClick={() => {
                setShowUnpaidRentModal(false);
                setEditingUnpaidRent(null);
              }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateUnpaidRent}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="unpaid-status">Payment Status</label>
                    <select name="status" id="unpaid-status" defaultValue={editingUnpaidRent.Status || 'Overdue'}>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Partial">Partial</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="unpaid-amount">Total Amount (XOF)</label>
                    <input 
                      type="number" 
                      name="amount" 
                      id="unpaid-amount"
                      step="0.01"
                      defaultValue={editingUnpaidRent.Amount || 0}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="unpaid-paid-amount">Paid Amount (XOF)</label>
                    <input 
                      type="number" 
                      name="paidAmount" 
                      id="unpaid-paid-amount"
                      step="0.01"
                      defaultValue={editingUnpaidRent.PaidAmount || editingUnpaidRent.paidAmount || 0}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="unpaid-payment-date">Payment Date</label>
                    <input 
                      type="date" 
                      name="paymentDate" 
                      id="unpaid-payment-date"
                      defaultValue={editingUnpaidRent.PaymentDate ? new Date(editingUnpaidRent.PaymentDate).toISOString().split('T')[0] : ''}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="unpaid-notes">Notes</label>
                  <textarea 
                    name="notes" 
                    id="unpaid-notes"
                    rows="3"
                    defaultValue={editingUnpaidRent.Notes || editingUnpaidRent.notes || ''}
                    placeholder="Add any notes about this payment..."
                  />
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary" 
                    onClick={() => {
                      setShowUnpaidRentModal(false);
                      setEditingUnpaidRent(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Property Modal */}
      {showCreatePropertyModal && (
        <div className="modal-overlay" onClick={() => setShowCreatePropertyModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Property</h3>
              <button className="modal-close" onClick={() => setShowCreatePropertyModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateProperty}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="create-address">Address *</label>
                    <input
                      type="text"
                      name="address"
                      id="create-address"
                      required
                      placeholder="123 Main St, Apt 4B"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="create-type">Building Type *</label>
                    <select 
                      name="type" 
                      id="create-type" 
                      required
                      onChange={(e) => setShowBuildingType(e.target.value === 'Apartment')}
                    >
                      <option value="">Select Building Type</option>
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Condo">Condo</option>
                      <option value="Studio">Studio</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="create-property-type">Property Type (For Sale or Rent) *</label>
                    <select name="propertyType" id="create-property-type" required>
                      <option value="">Select Property Type</option>
                      <option value="For Sale">For Sale</option>
                      <option value="For Rent">For Rent</option>
                    </select>
                  </div>
                  {showBuildingType && (
                    <div className="form-group">
                      <label htmlFor="create-building-type">Building Type (if Apartment) *</label>
                      <select name="buildingType" id="create-building-type" required>
                        <option value="">Select Building Type</option>
                        <option value="High-rise">High-rise</option>
                        <option value="Low-rise">Low-rise</option>
                        <option value="Duplex">Duplex</option>
                        <option value="Townhouse">Townhouse</option>
                        <option value="Penthouse">Penthouse</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="create-status">Status *</label>
                    <select name="status" id="create-status" required>
                      <option value="">Select Status</option>
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="create-rent">Monthly Rent (XOF) *</label>
                    <input
                      type="number"
                      name="rent"
                      id="create-rent"
                      step="0.01"
                      min="0"
                      required
                      placeholder="1500.00"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="create-bedrooms">Bedrooms</label>
                    <input
                      type="number"
                      name="bedrooms"
                      id="create-bedrooms"
                      min="0"
                      placeholder="2"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="create-bathrooms">Bathrooms</label>
                    <input
                      type="number"
                      name="bathrooms"
                      id="create-bathrooms"
                      step="0.5"
                      min="0"
                      placeholder="1.5"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="create-urgency">Urgency</label>
                    <select name="urgency" id="create-urgency" defaultValue="normal">
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="create-tenant">Tenant (if Occupied)</label>
                    <input
                      type="text"
                      name="tenant"
                      id="create-tenant"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="create-owner">Owner *</label>
                    <select name="owner" id="create-owner" required>
                      <option value="">Select Owner</option>
                      {owners.map(owner => (
                        <option key={owner.id || owner.ID} value={owner.id || owner.ID}>
                          {owner.name || owner.Name} ({owner.email || owner.Email})
                        </option>
                      ))}
                    </select>
                    {owners.length === 0 && (
                      <small style={{ color: '#ef4444', display: 'block', marginTop: '4px' }}>
                        No owners available. Please ask Agency Director to add owners first.
                      </small>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="action-button secondary"
                    onClick={() => setShowCreatePropertyModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Property'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditPropertyModal && editingProperty && (
        <div className="modal-overlay" onClick={() => {
          setShowEditPropertyModal(false);
          setEditingProperty(null);
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Property</h3>
              <button className="modal-close" onClick={() => {
                setShowEditPropertyModal(false);
                setEditingProperty(null);
              }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateProperty}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-address">Address</label>
                    <input
                      type="text"
                      name="address"
                      id="edit-address"
                      defaultValue={editingProperty.Address || editingProperty.address || ''}
                      placeholder="123 Main St, Apt 4B"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-type">Building Type</label>
                    <select 
                      name="type" 
                      id="edit-type" 
                      defaultValue={editingProperty.Type || editingProperty.type || ''}
                      onChange={(e) => setShowBuildingType(e.target.value === 'Apartment')}
                    >
                      <option value="">Select Building Type</option>
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Condo">Condo</option>
                      <option value="Studio">Studio</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-property-type">Property Type (For Sale or Rent)</label>
                    <select name="propertyType" id="edit-property-type" defaultValue={editingProperty.PropertyType || editingProperty.propertyType || ''}>
                      <option value="">Select Property Type</option>
                      <option value="For Sale">For Sale</option>
                      <option value="For Rent">For Rent</option>
                    </select>
                  </div>
                  {(showBuildingType || (editingProperty.Type || editingProperty.type) === 'Apartment') && (
                    <div className="form-group">
                      <label htmlFor="edit-building-type">Building Type (if Apartment)</label>
                      <select name="buildingType" id="edit-building-type" defaultValue={editingProperty.BuildingType || editingProperty.buildingType || ''}>
                        <option value="">Select Building Type</option>
                        <option value="High-rise">High-rise</option>
                        <option value="Low-rise">Low-rise</option>
                        <option value="Duplex">Duplex</option>
                        <option value="Townhouse">Townhouse</option>
                        <option value="Penthouse">Penthouse</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-status">Status</label>
                    <select name="status" id="edit-status" defaultValue={editingProperty.Status || editingProperty.status || ''}>
                      <option value="">Select Status</option>
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-rent">Monthly Rent (XOF)</label>
                    <input
                      type="number"
                      name="rent"
                      id="edit-rent"
                      step="0.01"
                      min="0"
                      defaultValue={editingProperty.Rent || editingProperty.rent || ''}
                      placeholder="1500.00"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-bedrooms">Bedrooms</label>
                    <input
                      type="number"
                      name="bedrooms"
                      id="edit-bedrooms"
                      min="0"
                      defaultValue={editingProperty.Bedrooms || editingProperty.bedrooms || ''}
                      placeholder="2"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-bathrooms">Bathrooms</label>
                    <input
                      type="number"
                      name="bathrooms"
                      id="edit-bathrooms"
                      step="0.5"
                      min="0"
                      defaultValue={editingProperty.Bathrooms || editingProperty.bathrooms || ''}
                      placeholder="1.5"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-urgency">Urgency</label>
                    <select name="urgency" id="edit-urgency" defaultValue={editingProperty.Urgency || editingProperty.urgency || 'normal'}>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-tenant">Tenant</label>
                    <input
                      type="text"
                      name="tenant"
                      id="edit-tenant"
                      defaultValue={editingProperty.Tenant || editingProperty.tenant || ''}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="action-button secondary"
                    onClick={() => {
                      setShowEditPropertyModal(false);
                      setEditingProperty(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Property'}
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

export default SalesManagerDashboard;