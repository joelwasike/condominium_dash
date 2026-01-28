import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Wrench,
  CheckCircle,
  AlertTriangle,
  Building,
  Calendar,
  Mail,
  Send,
  FileText,
  BarChart2,
  MoreHorizontal,
  Settings,
  MessageCircle,
  Plus,
  Filter,
  Search,
  Megaphone,
  Phone,
  Edit,
  Trash2,
  ClipboardList,
  DollarSign,
  HardHat,
  LogIn,
  LogOut,
  History,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { technicianService } from '../services/technicianService';
import { messagingService } from '../services/messagingService';
import { API_CONFIG } from '../config/api';
import { isDemoMode, getTechnicianDemoData } from '../utils/demoData';
import './TechnicianDashboard.css';
import './SuperAdminDashboard.css';
import SettingsPage from './SettingsPage';
import RoleLayout from '../components/RoleLayout';
import { t, getLanguage } from '../utils/i18n';
import '../components/RoleLayout.css';

const TechnicianDashboard = () => {
  const INSPECTION_ITEMS = useMemo(
    () => [
      { key: 'doorHandles', label: 'Door handles' },
      { key: 'doors', label: 'Doors (bedrooms, bathrooms, closets)' },
      { key: 'closets', label: 'Closets and storage' },
      { key: 'walls', label: 'Walls and paintwork' },
      { key: 'floors', label: 'Floors' },
      { key: 'fixtures', label: 'Visible fixtures and fittings' },
    ],
    []
  );

  const getRoomList = useCallback((propertyType, numberOfRooms) => {
    if (!propertyType) return [];
    const rooms = [];
    if (propertyType === 'Studio') {
      rooms.push('Main Room', 'Kitchenette', 'Bathroom');
      return rooms;
    }
    // Common rooms for apartments/villas/duplex
    rooms.push('Living Room', 'Kitchen', 'Bathroom', 'Toilet', 'Corridor');
    const bedrooms = Math.max(1, Number(numberOfRooms) || 1);
    for (let i = 1; i <= bedrooms; i++) rooms.push(`Bedroom ${i}`);
    if (propertyType === 'Duplex') rooms.push('Stairs', 'Balcony/Terrace');
    if (propertyType === 'Villa') rooms.push('Terrace', 'Exterior');
    return rooms;
  }, []);

  // Ensure room/item structure exists in formData when property settings change
  useEffect(() => {
    if (!inventoryFormData.propertyType) return;
    const roomList = getRoomList(inventoryFormData.propertyType, inventoryFormData.numberOfRooms);
    if (roomList.length === 0) return;

    setInventoryFormData(prev => {
      const prevRooms = prev.formData?.rooms || {};
      let changed = false;
      const nextRooms = { ...prevRooms };

      roomList.forEach(roomName => {
        if (!nextRooms[roomName]) {
          nextRooms[roomName] = {};
          changed = true;
        }
        INSPECTION_ITEMS.forEach(item => {
          if (!nextRooms[roomName][item.key]) {
            nextRooms[roomName][item.key] = { condition: '', comment: '', photos: [] };
            changed = true;
          }
        });
      });

      if (!changed) return prev;
      return {
        ...prev,
        formData: {
          ...prev.formData,
          rooms: nextRooms,
        },
      };
    });
  }, [inventoryFormData.propertyType, inventoryFormData.numberOfRooms, INSPECTION_ITEMS, getRoomList]);

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    property: '',
    type: 'routine',
    inspector: '',
    notes: ''
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    status: '',
    estimatedHours: 0,
    estimatedCost: 0
  });
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [selectedInspectionForPhoto, setSelectedInspectionForPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [showMaintenanceViewModal, setShowMaintenanceViewModal] = useState(false);
  const [selectedMaintenanceRequest, setSelectedMaintenanceRequest] = useState(null);
  const [technicianContacts, setTechnicianContacts] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    category: '',
    customCategory: '',
    phone: '',
    email: '',
    address: '',
    description: ''
  });
  
  // New state for restructured sections
  const [quotes, setQuotes] = useState([]);
  const [works, setWorks] = useState([]);
  const [entryTenants, setEntryTenants] = useState([]);
  const [exitTenants, setExitTenants] = useState([]);
  const [companyProperties, setCompanyProperties] = useState([]);
  const [historyData, setHistoryData] = useState({
    queries: [],
    quotes: [],
    works: [],
    inventories: []
  });
  const [reportsData, setReportsData] = useState(null);
  const [showInventoryFormModal, setShowInventoryFormModal] = useState(false);
  const [inventoryFormData, setInventoryFormData] = useState({
    type: 'Entry', // Entry or Exit
    propertyType: '', // Studio, Apartment, Duplex, Villa
    numberOfRooms: 1,
    propertyAddress: '',
    tenantName: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    technicianName: '',
    // Dynamic form data will be stored here
    formData: {
      rooms: {},
      meters: { electricity: '', water: '', gas: '', keys: '' },
      observations: { technician: '', tenant: '' },
      exit: { degradations: '', workToBeCarriedOut: '', estimatedCost: 0, bailImpact: 'None' },
    }
  });
  
  // Filter states
  const [quoteStatusFilter, setQuoteStatusFilter] = useState('');
  const [workStatusFilter, setWorkStatusFilter] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('');
  const [historyPropertyFilter, setHistoryPropertyFilter] = useState('');
  
  // Helper data for Inventory Form (Entry / Exit)
  const currentInventoryTenants =
    inventoryFormData.type === 'Entry' ? entryTenants : exitTenants;

  const inventoryPropertyOptions = Array.from(
    new Set(
      (companyProperties && companyProperties.length > 0
        ? companyProperties.map(p => p.Address || p.address)
        : (currentInventoryTenants || []).map(t => t.Property || t.property)
      ).filter(Boolean)
    )
  );

  const inventoryTenantSuggestions =
    inventoryFormData.tenantName && currentInventoryTenants
      ? currentInventoryTenants.filter(t => {
          const name = (t.Name || t.name || '').toLowerCase();
          return name.includes(inventoryFormData.tenantName.toLowerCase());
        })
      : [];

  
  // Advertisements state
  const [advertisements, setAdvertisements] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const carouselIntervalRef = useRef(null);
  
  // Messaging states
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const isLoadingUsersRef = useRef(false);
  const messagesEndRef = useRef(null);
  const markReadTimeoutRef = useRef(null);
  const lastMarkedReadRef = useRef(null);
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  
  const addNotification = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  // Load data from backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        // Use demo data
        const demoData = getTechnicianDemoData();
        setOverviewData(demoData.overview);
        setInspections(demoData.inspections);
        setTasks(demoData.tasks);
        setLoading(false);
        return;
      }
      
      const [overview, inspection, task, maintenanceRequests, contacts, quotesData, worksData, entryData, exitData, historyDataRes, propertiesData] = await Promise.all([
        technicianService.getOverview().catch(() => null),
        technicianService.listInspections().catch(() => []),
        technicianService.listTasks().catch(() => []),
        technicianService.listMaintenanceRequests().catch(() => []),
        technicianService.getTechnicianContacts().catch(() => []),
        technicianService.listQuotes().catch(() => []),
        technicianService.getWorkProgress({}).catch(() => []),
        technicianService.getStateOfEntry().catch(() => []),
        technicianService.getStateOfExit().catch(() => []),
        technicianService.getHistory({}).catch(() => ({ queries: [], quotes: [], works: [], inventories: [] })),
        technicianService.getProperties().catch(() => [])
      ]);
      
      setOverviewData(overview);
      setInspections(Array.isArray(inspection) ? inspection : []);
      setTasks(Array.isArray(task) ? task : []);
      
      // Handle maintenance requests - could be array or object with maintenanceRequests property
      if (maintenanceRequests) {
        if (Array.isArray(maintenanceRequests)) {
          setRequests(maintenanceRequests);
        } else if (maintenanceRequests.maintenanceRequests && Array.isArray(maintenanceRequests.maintenanceRequests)) {
          setRequests(maintenanceRequests.maintenanceRequests);
        } else {
          setRequests([]);
        }
      } else {
        setRequests([]);
      }
      
      // Set technician contacts
      setTechnicianContacts(Array.isArray(contacts) ? contacts : []);
      
      // Set quotes
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      
      // Set works (maintenance requests that are work orders)
      setWorks(Array.isArray(worksData) ? worksData : []);
      
      // Set entry and exit states
      setEntryTenants(Array.isArray(entryData) ? entryData : []);
      setExitTenants(Array.isArray(exitData) ? exitData : []);

      setCompanyProperties(Array.isArray(propertiesData) ? propertiesData : []);
      
      // Set history data
      if (historyDataRes && typeof historyDataRes === 'object') {
        setHistoryData({
          queries: Array.isArray(historyDataRes.queries) ? historyDataRes.queries : [],
          quotes: Array.isArray(historyDataRes.quotes) ? historyDataRes.quotes : [],
          works: Array.isArray(historyDataRes.works) ? historyDataRes.works : [],
          inventories: Array.isArray(historyDataRes.inventories) ? historyDataRes.inventories : []
        });
      }
    } catch (error) {
      console.error('Error loading technician data:', error);
      if (!isDemoMode()) {
        addNotification('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ensure type is 'Move-in' or 'Move-out' for API
      const inspectionData = {
        ...inspectionForm,
        type: inspectionForm.type === 'move-in' ? 'Move-in' : 
              inspectionForm.type === 'move-out' ? 'Move-out' : 
              inspectionForm.type,
      };
      await technicianService.createInspection(inspectionData);
      addNotification('Inspection created successfully', 'success');
      setShowInspectionModal(false);
      setInspectionForm({ property: '', type: 'Move-in', inspector: '', notes: '' });
      loadData(); // Reload data to show new inspection
    } catch (error) {
      console.error('Error creating inspection:', error);
      addNotification(error.message || 'Failed to create inspection', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photoFile || !selectedInspectionForPhoto) return;
    
    setLoading(true);
    try {
      const inspectionId = selectedInspectionForPhoto.id || selectedInspectionForPhoto.ID;
      await technicianService.uploadInspectionPhoto(inspectionId, photoFile);
      addNotification('Photo uploaded successfully', 'success');
      setShowPhotoUploadModal(false);
      setSelectedInspectionForPhoto(null);
      setPhotoFile(null);
      loadData(); // Reload data to show updated inspection with photo
    } catch (error) {
      console.error('Error uploading photo:', error);
      addNotification(error.message || 'Failed to upload photo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhotoClick = (inspection) => {
    setSelectedInspectionForPhoto(inspection);
    setPhotoFile(null);
    setShowPhotoUploadModal(true);
  };

  const handleTaskView = (task) => {
    setSelectedTask(task);
    setTaskForm({
      status: task.Status || task.status || 'Pending',
      estimatedHours: task.EstimatedHours || task.estimatedHours || 0,
      estimatedCost: task.EstimatedCost || task.estimatedCost || 0,
      property: task.Property || task.property || '',
      issue: task.Issue || task.issue || '',
      priority: task.Priority || task.priority || 'normal',
      assigned: task.Assigned || task.assigned || ''
    });
    setShowTaskModal(true);
  };

  const handleTaskUpdate = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const taskId = selectedTask?.id || selectedTask?.ID;
      if (taskId) {
        // Update existing task
        await technicianService.updateTask(taskId, taskForm);
        addNotification('Task updated successfully', 'success');
      } else {
        // Create new task
        const taskData = {
          property: taskForm.property || '',
          issue: taskForm.issue || 'Maintenance Task',
          priority: taskForm.priority || 'normal',
          estimatedHours: taskForm.estimatedHours || 0,
          estimatedCost: taskForm.estimatedCost || 0,
          assigned: taskForm.assigned || '',
        };
        await technicianService.createTask(taskData);
        addNotification('Task created successfully', 'success');
      }
      setShowTaskModal(false);
      setSelectedTask(null);
      setTaskForm({ status: '', estimatedHours: 0, estimatedCost: 0 });
      loadData(); // Reload data to show updated/created task
    } catch (error) {
      console.error('Error updating/creating task:', error);
      addNotification(error.message || 'Failed to save task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (task) => {
    setLoading(true);
    try {
      const taskId = task.id || task.ID;
      await technicianService.updateTask(taskId, { status: 'Completed' });

      // When a maintenance task is marked as completed, automatically
      // create a pending quote (if one has not already been generated)
      // so that it appears in the Quotes page for validation by the
      // owner or agency admin.
      const alreadyGenerated = task.quoteGenerated || task.QuoteGenerated;
      if (!alreadyGenerated) {
        const quoteData = {
          maintenanceId: taskId,
          property: task.Property || task.property || '',
          issue: task.Issue || task.issue || 'Maintenance Task',
          amount: task.EstimatedCost || task.estimatedCost || 0,
          recipient: 'management@example.com',
        };
        try {
          await technicianService.submitQuote(quoteData);
          addNotification('Task completed and quote submitted for validation', 'success');
        } catch (quoteError) {
          console.error('Error submitting quote for completed task:', quoteError);
          addNotification('Task completed, but failed to submit quote', 'warning');
        }
      } else {
        addNotification('Task marked as completed', 'success');
      }
      loadData(); // Reload data to show updated task
    } catch (error) {
      console.error('Error completing task:', error);
      addNotification('Failed to complete task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('demo_mode');
    window.location.href = '/';
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
      console.log('Loading chat for user:', userId);
      const messages = await messagingService.getConversation(userId);
      console.log('Loaded messages:', messages);
      
      // Normalize messages array
      const normalizedMessages = Array.isArray(messages) ? messages : [];
      console.log('Normalized messages:', normalizedMessages);
      setChatMessages(normalizedMessages);
      
      // Mark messages as read with debouncing to avoid rate limiting
      // Only mark as read if we haven't marked this user recently
      const userIdStr = String(userId);
      if (lastMarkedReadRef.current !== userIdStr) {
        // Clear any pending timeout
        if (markReadTimeoutRef.current) {
          clearTimeout(markReadTimeoutRef.current);
        }
        
        // Mark this user as being processed to prevent duplicate calls
        lastMarkedReadRef.current = userIdStr;
        
        // Debounce the mark as read call with a longer delay to avoid rate limiting
        markReadTimeoutRef.current = setTimeout(async () => {
          try {
            await messagingService.markMessagesAsRead(userId);
            console.log('Marked messages as read for user:', userId);
          } catch (readError) {
            // Silently ignore rate limit errors - they're expected if called too frequently
            if (!readError.message || !readError.message.includes('Rate limit')) {
              console.error('Error marking messages as read:', readError);
            }
            // Reset the last marked ref on error so we can retry later
            if (readError.message && readError.message.includes('Rate limit')) {
              lastMarkedReadRef.current = null;
            }
          }
        }, 2000); // Wait 2 seconds before marking as read to avoid rate limiting
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      console.error('Error details:', error.message, error.stack);
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

  // Load users when chat tab is active (only once per tab switch)
  useEffect(() => {
    if (activeTab === 'chat' && !isLoadingUsersRef.current) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Only depend on activeTab, not loadUsers

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedUserId) return;
    
    const content = chatInput.trim();
    const tempMessageId = `temp-${Date.now()}`;
    
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
    
    // Optimistic update: add message immediately to UI
    const optimisticMessage = {
      id: tempMessageId,
      fromUserId: currentUserId,
      toUserId: selectedUserId,
      content: content,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    setChatMessages(prev => [...prev, optimisticMessage]);
    setChatInput('');
    
    try {
      console.log('Sending message:', { fromUserId: currentUserId, toUserId: selectedUserId, content });
      const newMessage = await messagingService.sendMessage({
        fromUserId: currentUserId,
        toUserId: selectedUserId,
        content: content
      });
      
      console.log('Message sent successfully, server response:', newMessage);
      
      // Replace optimistic message with actual message from server
      // Check if newMessage has the expected structure
      if (newMessage && (newMessage.id || newMessage.ID)) {
        console.log('Replacing optimistic message with server response');
        setChatMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === tempMessageId ? newMessage : msg
          );
          console.log('Updated messages:', updated);
          return updated;
        });
      } else {
        console.log('Server response format unexpected, reloading chat after delay');
        // If server response format is unexpected, reload chat after a short delay
        // to give server time to process
        setTimeout(async () => {
          if (selectedUserId) {
            console.log('Reloading chat for user:', selectedUserId);
            await loadChatForUser(selectedUserId);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error.message, error.stack);
      addNotification(error.message || 'Failed to send message', 'error');
      // Remove optimistic message on error
      setChatMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      // Restore input
      setChatInput(content);
    }
  };

  // Load advertisements when advertisements or overview tab is active
  useEffect(() => {
    if (activeTab === 'advertisements' || activeTab === 'overview') {
      loadAdvertisements();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps


  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: Building },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
      { id: 'quotes', label: 'The Quotes', icon: DollarSign },
      { id: 'works', label: 'Works', icon: HardHat },
      { id: 'state-entry', label: 'State of the Entry', icon: LogIn },
      { id: 'state-exit', label: 'State of Affairs of Exit', icon: LogOut },
      { id: 'worker-contacts', label: 'Contact of Workers', icon: Phone },
      { id: 'history', label: 'History', icon: History },
      { id: 'reports', label: 'Reports', icon: FileCheck },
      { id: 'inventory-form', label: 'Inventory Form', icon: ClipboardList },
      { id: 'advertisements', label: 'Advertisements', icon: Megaphone },
      { id: 'chat', label: 'Messages', icon: MessageCircle },
      { id: 'settings', label: 'Settings', icon: Settings }
    ],
    []
  );

  const renderOverview = () => {
    if (loading) {
      return <div className="sa-table-empty">Loading overview data...</div>;
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = currentUser.name || currentUser.Name || 'Technician';

    return (
      <div className="sa-overview-page">
        <div className="sa-overview-top">
          <div className="sa-overview-chart-card">
            <div className="sa-card-header">
              <h2>Technician Dashboard</h2>
              <span className="sa-card-subtitle">Welcome, {userName}!</span>
            </div>
            <div className="sa-mini-legend">
              <span className="sa-legend-item sa-legend-expected">Open Tickets</span>
              <span className="sa-legend-item sa-legend-current">Resolution Time</span>
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
            {/* Pending Requests */}
            <div className="sa-metric-card sa-metric-primary" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('maintenance')}>
              <p className="sa-metric-label">Pending Requests</p>
              <p className="sa-metric-period">Awaiting processing</p>
              <p className="sa-metric-value">{requests.filter(r => (r.Status || r.status) === 'Pending').length}</p>
            </div>
            
            {/* Quotes to be Validated */}
            <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('quotes')}>
              <p className="sa-metric-label">Quotes to be Validated</p>
              <p className="sa-metric-period">Awaiting validation</p>
              <p className="sa-metric-value">{quotes.filter(q => (q.Status || q.status) === 'Sent' || (q.Status || q.status) === 'Pending').length}</p>
            </div>
            
            {/* Urgent Work */}
            <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('works')}>
              <p className="sa-metric-label">Urgent Work</p>
              <p className="sa-metric-period">High priority</p>
              <p className="sa-metric-value">{overviewData?.urgentTicketsPending || 0}</p>
            </div>
            
            {/* Important Alerts */}
            <div className="sa-metric-card">
              <p className="sa-metric-label">Important Alerts</p>
              <p className="sa-metric-period">Requires attention</p>
              <p className="sa-metric-value">{requests.filter(r => {
                const priority = (r.Priority || r.priority || '').toLowerCase();
                return priority === 'urgent' && (r.Status || r.status) !== 'Completed';
              }).length}</p>
            </div>
            
            {/* Monthly Indicators */}
            <div className="sa-metric-card">
              <p className="sa-metric-label">Monthly Requests</p>
              <p className="sa-metric-period">This month</p>
              <p className="sa-metric-value">{requests.filter(r => {
                const date = r.CreatedAt || r.createdAt || r.Date || r.date;
                if (!date) return false;
                const reqDate = new Date(date);
                const now = new Date();
                return reqDate.getMonth() === now.getMonth() && reqDate.getFullYear() === now.getFullYear();
              }).length}</p>
            </div>
            
            <div className="sa-metric-card">
              <p className="sa-metric-label">Average Resolution Time</p>
              <p className="sa-metric-number">{overviewData?.averageResolutionTime ? `${overviewData.averageResolutionTime.toFixed(1)} days` : 'N/A'}</p>
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
                  <h3>Maintenance Management</h3>
                  <p>
                    Manage inspections, tasks, and maintenance operations all in one place.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sa-section-card" style={{ marginTop: '24px' }}>
          <div className="sa-section-header">
            <h3>Quick Actions</h3>
            <p>Manage your maintenance operations and view key metrics.</p>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('tasks')}>
                <p className="sa-metric-label">Total Cost of Ongoing Repairs</p>
                <p className="sa-metric-value">${(overviewData?.totalCostOfOngoingRepairs || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  const renderInspections = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
        <h3>Property Inspections</h3>
        <p>Manage move-in, move-out, and routine inspections</p>
        </div>
        <button 
          className="sa-primary-cta"
          onClick={() => setShowInspectionModal(true)}
        >
          <Plus size={16} />
          Add Inspection
        </button>
      </div>

      <div className="sa-filters-section">
        <select className="sa-filter-select">
            <option value="">All Inspection Types</option>
          <option value="Move-in">Move-in</option>
          <option value="Move-out">Move-out</option>
            <option value="routine">Routine</option>
            <option value="emergency">Emergency</option>
          </select>
        <select className="sa-filter-select">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="scheduled">Scheduled</option>
            <option value="pending">Pending</option>
          </select>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Property</th>
              <th>Inspection Type</th>
              <th>Date</th>
              <th>Inspector</th>
              <th>Notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {inspections.length === 0 ? (
              <tr>
                <td colSpan="7" className="sa-table-empty">
                  No inspections found
                </td>
              </tr>
            ) : (
              inspections.map((inspection, index) => {
                const inspectionId = inspection.id || inspection.ID;
                const property = inspection.property || inspection.Property;
                const type = inspection.type || inspection.Type;
                const date = inspection.date || inspection.Date;
                const inspector = inspection.inspector || inspection.Inspector;
                const notes = inspection.notes || inspection.Notes;
                const photos = inspection.photos || inspection.Photos;
                
                return (
                  <tr key={inspectionId}>
                    <td>{index + 1}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{property}</span>
                  </td>
                  <td>
                      <span className={`sa-status-pill ${(type || 'routine').toLowerCase().replace('-', '-')}`}>
                        {type || 'Routine'}
                    </span>
                  </td>
                    <td>{date ? new Date(date).toLocaleDateString() : 'N/A'}</td>
                    <td>{inspector || 'Unassigned'}</td>
                    <td>
                      <span className="sa-cell-sub">{notes || 'No notes'}</span>
                    </td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" onClick={() => handleUploadPhotoClick(inspection)} title="Upload Photo">📷</button>
                      {photos && Array.isArray(photos) && photos.length > 0 && (
                        <span className="sa-cell-sub" style={{ marginLeft: '8px', fontSize: '0.75rem' }}>
                          ({photos.length})
                        </span>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMaintenance = () => {
    const handleProcessRequest = async (maintenance) => {
      try {
        setLoading(true);
        await technicianService.updateMaintenanceRequest(maintenance.ID || maintenance.id, {
          status: 'In Progress'
        });
        addNotification('Request processed successfully', 'success');
        loadData();
      } catch (error) {
        console.error('Error processing request:', error);
        addNotification('Failed to process request', 'error');
      } finally {
        setLoading(false);
      }
    };

    const handleRefuseRequest = async (maintenance) => {
      if (!window.confirm('Are you sure you want to refuse this maintenance request?')) {
        return;
      }
      try {
        setLoading(true);
        await technicianService.updateMaintenanceRequest(maintenance.ID || maintenance.id, {
          status: 'Refused'
        });
        addNotification('Request refused successfully', 'success');
        loadData();
      } catch (error) {
        console.error('Error refusing request:', error);
        addNotification('Failed to refuse request', 'error');
      } finally {
        setLoading(false);
      }
    };

    const handleUpdateMaintenance = async (maintenance) => {
      // Reuse the task modal to update estimated hours/cost and status
      setShowTaskModal(true);
      setSelectedTask(maintenance);
      setTaskForm({
        property: maintenance.property || maintenance.Property || '',
        issue: maintenance.issue || maintenance.Issue || '',
        priority: (maintenance.priority || maintenance.Priority || 'normal').toLowerCase(),
        status: maintenance.status || maintenance.Status || 'Pending',
        estimatedHours: maintenance.estimatedHours || maintenance.EstimatedHours || 0,
        estimatedCost: maintenance.estimatedCost || maintenance.EstimatedCost || 0,
        assigned: maintenance.assigned || maintenance.Assigned || maintenance.assignedTo || maintenance.AssignedTo || '',
      });
    };

    const handleSubmitQuote = async (maintenance) => {
      try {
        const quoteData = {
          maintenanceId: maintenance.id || maintenance.ID,
          property: maintenance.property || maintenance.Property,
          issue: maintenance.issue || maintenance.Issue,
          amount: maintenance.estimatedCost || maintenance.EstimatedCost || 0,
          recipient: 'management@example.com',
        };
        await technicianService.submitQuote(quoteData);
        addNotification('Quote submitted successfully', 'success');
        loadData();
      } catch (error) {
        console.error('Error submitting quote:', error);
        addNotification('Failed to submit quote', 'error');
      }
    };

    // Only show non-completed maintenance in this table.
    const visibleRequests = requests.filter(m => {
      const rawStatus = m.status || m.Status || '';
      const status = String(rawStatus).trim().toLowerCase();
      const completedStatuses = ['completed', 'complete', 'done', 'finished', 'closed', 'resolved'];
      return !completedStatuses.some(s => status === s || status.startsWith(s));
    });

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Maintenance</h3>
            <p>Receipt of tenant requests - Analyze and define if they should be processed or refused</p>
          </div>
          <button
            className="sa-primary-cta"
            onClick={() => {
              // Open the generic task modal in "create" mode so the technician
              // can add a new maintenance task.
              setSelectedTask(null);
              setTaskForm({
                property: '',
                issue: '',
                priority: 'normal',
                status: 'Pending',
                estimatedHours: 0,
                estimatedCost: 0,
                assigned: '',
              });
              setShowTaskModal(true);
            }}
            disabled={loading}
          >
            <Plus size={18} />
            Add Maintenance
          </button>
        </div>

        <div className="sa-filters-section">
          <select 
            className="sa-filter-select"
            value=""
            onChange={() => {}}
          >
          <option value="">All Priority Levels</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
            <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
          <select 
            className="sa-filter-select"
            value=""
            onChange={() => {}}
          >
          <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
        </select>
      </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Property</th>
              <th>Issue</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Date</th>
              <th>Est. Hours</th>
              <th>Est. Cost</th>
              <th>Quote</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visibleRequests.length === 0 ? (
              <tr>
                  <td colSpan={11} className="sa-table-empty">
                  No maintenance requests found
                </td>
              </tr>
            ) : (
                visibleRequests.map((maintenance, index) => {
                  const maintenanceId = maintenance.id || maintenance.ID;
                  const property = maintenance.property || maintenance.Property;
                  const issue = maintenance.title || maintenance.Title || maintenance.issue || maintenance.Issue || 'Maintenance Request';
                  const description = maintenance.description || maintenance.Description || '';
                  const priority = (maintenance.priority || maintenance.Priority || 'normal').toLowerCase();
                  const status = maintenance.status || maintenance.Status || 'Pending';
                  const assigned = maintenance.assigned || maintenance.Assigned || maintenance.assignedTo || maintenance.AssignedTo || 'Unassigned';
                  const date = maintenance.date || maintenance.Date || maintenance.createdAt || maintenance.CreatedAt;
                  const estimatedHours = maintenance.estimatedHours || maintenance.EstimatedHours || 0;
                  const estimatedCost = maintenance.estimatedCost || maintenance.EstimatedCost || 0;
                  const quoteGenerated = maintenance.quoteGenerated || maintenance.QuoteGenerated || false;
                  const photos = maintenance.photos || maintenance.Photos || maintenance.photoURLs || maintenance.PhotoURLs || [];
                  
                  return (
                    <tr key={maintenanceId}>
                      <td>{index + 1}</td>
                      <td className="sa-cell-main">
                        <span className="sa-cell-title">{property}</span>
                      </td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{issue}</span>
                          {description && (
                            <span className="sa-cell-sub" style={{ fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {description}
                            </span>
                          )}
                          {photos && Array.isArray(photos) && photos.length > 0 && (
                            <span className="sa-cell-sub" style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '4px' }}>
                              📷 {photos.length} photo{photos.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                  </td>
                  <td>
                        <span className={`sa-status-pill ${priority}`}>
                          {priority}
                    </span>
                  </td>
                  <td>
                        <span className={`sa-status-pill ${status.toLowerCase().replace(' ', '-')}`}>
                          {status}
                    </span>
                  </td>
                      <td>{assigned}</td>
                      <td>{date ? new Date(date).toLocaleDateString() : 'N/A'}</td>
                      <td>{estimatedHours}h</td>
                      <td>${estimatedCost.toLocaleString()}</td>
                      <td>
                        <span className={`sa-status-pill ${quoteGenerated ? 'sent' : 'pending'}`}>
                          {quoteGenerated ? 'Generated' : 'Pending'}
                        </span>
                      </td>
                      <td className="sa-row-actions">
                        <button 
                          className="sa-icon-button" 
                          onClick={() => {
                            setSelectedMaintenanceRequest(maintenance);
                            setShowMaintenanceViewModal(true);
                          }} 
                          title="View Details"
                        >
                          👁️
                        </button>
                        {status === 'Pending' && (
                          <>
                            <button 
                              className="sa-icon-button" 
                              onClick={() => handleProcessRequest(maintenance)} 
                              title="Process Request"
                              style={{ color: '#16a34a', marginLeft: '8px' }}
                            >
                              ✓
                            </button>
                            <button 
                              className="sa-icon-button" 
                              onClick={() => handleRefuseRequest(maintenance)} 
                              title="Refuse Request"
                              style={{ color: '#ef4444', marginLeft: '8px' }}
                            >
                              ✗
                            </button>
                          </>
                        )}
                        <button className="sa-icon-button" onClick={() => handleUpdateMaintenance(maintenance)} title="Edit" style={{ marginLeft: '8px' }}>✏️</button>
                        {!quoteGenerated && status !== 'Refused' && (
                          <button className="sa-icon-button" onClick={() => handleSubmitQuote(maintenance)} title="Generate Quote" style={{ color: '#2563eb', marginLeft: '8px' }}>💰</button>
                        )}
                      </td>
                </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  };

  const renderInventories = () => {
    const inventoryInspections = inspections.filter(i => {
      const type = i.type || i.Type;
      return type === 'Move-in' || type === 'Move-out';
    });

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
        <h3>Move-in and Move-out Inventories</h3>
        <p>Create and manage detailed inventory reports</p>
          </div>
      </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Property</th>
              <th>Type</th>
              <th>Date</th>
              <th>Inspector</th>
              <th>Notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
              {inventoryInspections.length === 0 ? (
              <tr>
                  <td colSpan={7} className="sa-table-empty">
                  No inventory inspections found
                </td>
              </tr>
            ) : (
                inventoryInspections.map((inv, index) => {
                  const invId = inv.id || inv.ID;
                  const property = inv.property || inv.Property;
                  const type = inv.type || inv.Type;
                  const date = inv.date || inv.Date;
                  const inspector = inv.inspector || inv.Inspector;
                  const notes = inv.notes || inv.Notes;
                  
                  return (
                    <tr key={`inv-${invId}`}>
                      <td>{index + 1}</td>
                      <td className="sa-cell-main">
                        <span className="sa-cell-title">{property}</span>
                  </td>
                  <td>
                        <span className={`sa-status-pill ${(type || 'move-in').toLowerCase().replace(' ', '-')}`}>
                          {type || 'Move-in'}
                        </span>
                  </td>
                      <td>{date ? new Date(date).toLocaleDateString() : 'N/A'}</td>
                      <td>{inspector || 'Unassigned'}</td>
                  <td>
                        <span className="sa-cell-sub">{notes || 'No notes'}</span>
                      </td>
                      <td className="sa-row-actions">
                        <button className="sa-icon-button" title="View">👁️</button>
                        <button className="sa-icon-button" title="Edit">✏️</button>
                  </td>
                </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  };

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
                  key={user.userId}
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
                Select a conversation on the left to start chatting.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="sa-chat-input-row">
            <input
              type="text"
              placeholder="Type a message..."
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
                    <strong>Name:</strong> {user.name || 'User'}
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
            <p>Select a user to view details.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
        <h3>Work Progress Report</h3>
        <p>Monitor progress of ongoing maintenance tasks</p>
      </div>
      </div>

      <div className="sa-filters-section">
        <select 
          className="sa-filter-select"
          value=""
          onChange={() => {}}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select 
          className="sa-filter-select"
          value=""
          onChange={() => {}}
        >
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {null && (
        <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Total Ongoing</p>
              <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 600, color: '#111827' }}>
                {0}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Total Completed</p>
              <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 600, color: '#111827' }}>
                {0}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Total Ongoing Cost</p>
              <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 600, color: '#111827' }}>
                ${(0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Property</th>
              <th>Issue</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            {[].length === 0 ? (
              <tr>
                <td colSpan={7} className="sa-table-empty">
                  No maintenance requests found
                </td>
              </tr>
            ) : (
              [].map((m, index) => {
                const maintenanceId = m.id || m.ID;
                const property = m.property || m.Property;
                const issue = m.issue || m.Issue;
                const priority = (m.priority || m.Priority || 'normal').toLowerCase();
                const status = m.status || m.Status || 'Pending';
                const assigned = m.assigned || m.Assigned || 'Unassigned';
                const estimatedCost = m.estimatedCost || m.EstimatedCost || 0;
                
                return (
                  <tr key={`prog-${maintenanceId}`}>
                    <td>{index + 1}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{property}</span>
                    </td>
                    <td>{issue}</td>
                    <td>
                      <span className={`sa-status-pill ${priority}`}>
                        {priority}
                      </span>
                  </td>
                    <td>
                      <span className={`sa-status-pill ${status.toLowerCase().replace(' ', '-')}`}>
                        {status}
                      </span>
                    </td>
                    <td>{assigned}</td>
                    <td>${estimatedCost.toLocaleString()}</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
        <h3>Task Management</h3>
        <p>Manage scheduled tasks and maintenance calendar</p>
        </div>
        <button 
          className="sa-primary-cta"
          onClick={() => {
            setSelectedTask(null);
            setTaskForm({ status: 'Pending', estimatedHours: 0, estimatedCost: 0 });
            setShowTaskModal(true);
          }}
        >
          <Plus size={16} />
          Create Task
        </button>
      </div>

      <div className="sa-filters-section">
        <select className="sa-filter-select">
          <option value="">All Priority Levels</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <select className="sa-filter-select">
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Task Title</th>
              <th>Property</th>
              <th>Priority</th>
              <th>Date</th>
              <th>Status</th>
              <th>Est. Hours</th>
              <th>Est. Cost</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={9} className="sa-table-empty">
                  No tasks found
                </td>
              </tr>
            ) : (
              tasks.map((task, index) => {
                const taskId = task.id || task.ID;
                const issue = task.issue || task.Issue || 'Maintenance Task';
                const property = task.property || task.Property;
                const priority = (task.priority || task.Priority || 'normal').toLowerCase();
                const date = task.date || task.Date || task.createdAt || task.CreatedAt;
                const status = task.status || task.Status || 'Pending';
                const estimatedHours = task.estimatedHours || task.EstimatedHours || 0;
                const estimatedCost = task.estimatedCost || task.EstimatedCost || 0;
                
                return (
                  <tr key={taskId}>
                    <td>{index + 1}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{issue}</span>
                    </td>
                    <td>{property}</td>
                  <td>
                      <span className={`sa-status-pill ${priority}`}>
                        {priority}
                    </span>
                  </td>
                    <td>{date ? new Date(date).toLocaleDateString() : 'N/A'}</td>
                  <td>
                      <span className={`sa-status-pill ${status.toLowerCase().replace(' ', '-')}`}>
                        {status}
                    </span>
                  </td>
                    <td>{estimatedHours}h</td>
                    <td>${estimatedCost.toLocaleString()}</td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" onClick={() => handleTaskView(task)} title="View/Edit">✏️</button>
                      {status !== 'Completed' && (
                    <button 
                          className="sa-icon-button" 
                        onClick={() => handleTaskComplete(task)}
                        disabled={loading}
                          title="Complete"
                          style={{ color: '#16a34a', marginLeft: '8px' }}
                      >
                          ✓
                      </button>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Load advertisements
  const loadAdvertisements = async () => {
    try {
      const ads = await technicianService.getAdvertisements();
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

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const contactId = selectedContact?.ID || selectedContact?.id;
      const payload = {
        ...contactForm,
        category:
          contactForm.category === 'other' && contactForm.customCategory.trim()
            ? contactForm.customCategory.trim()
            : contactForm.category,
      };
      if (contactId) {
        await technicianService.updateTechnicianContact(contactId, payload);
        addNotification('Contact updated successfully', 'success');
      } else {
        await technicianService.createTechnicianContact(payload);
        addNotification('Contact added successfully', 'success');
      }
      setShowContactModal(false);
      setSelectedContact(null);
      setContactForm({ name: '', category: '', customCategory: '', phone: '', email: '', address: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Error saving contact:', error);
      addNotification(error.message || 'Failed to save contact', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }
    setLoading(true);
    try {
      await technicianService.deleteTechnicianContact(contactId);
      addNotification('Contact deleted successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error deleting contact:', error);
      addNotification(error.message || 'Failed to delete contact', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = (contact) => {
    setSelectedContact(contact);
    setContactForm({
      name: contact.Name || contact.name || '',
      category: contact.Category || contact.category || '',
      customCategory: '',
      phone: contact.Phone || contact.phone || '',
      email: contact.Email || contact.email || '',
      address: contact.Address || contact.address || '',
      description: contact.Description || contact.description || ''
    });
    setShowContactModal(true);
  };

  const renderTechnicianContacts = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h2>Technician Contacts Management</h2>
            <p>Add and manage technician contacts (plumbers, electricians, etc.) for tenants</p>
          </div>
          <button 
            className="sa-primary-cta" 
            onClick={() => {
              setSelectedContact(null);
              setContactForm({ name: '', category: '', customCategory: '', phone: '', email: '', address: '', description: '' });
              setShowContactModal(true);
            }} 
            disabled={loading}
          >
            <Plus size={18} />
            Add Contact
          </button>
        </div>

        {loading ? (
          <div className="sa-table-empty">Loading contacts...</div>
        ) : technicianContacts.length === 0 ? (
          <div className="sa-table-empty">No technician contacts added yet</div>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {technicianContacts.map((contact, index) => {
                  const contactId = contact.ID || contact.id;
                  return (
                    <tr key={contactId}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{contact.Name || contact.name || 'N/A'}</span>
                          {contact.Description && (
                            <span className="sa-cell-sub">{contact.Description || contact.description}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          fontSize: '0.75rem',
                          textTransform: 'capitalize'
                        }}>
                          {contact.Category || contact.category || 'N/A'}
                        </span>
                      </td>
                      <td>{contact.Phone || contact.phone || 'N/A'}</td>
                      <td>{contact.Email || contact.email || 'N/A'}</td>
                      <td>{contact.Address || contact.address || 'N/A'}</td>
                      <td>
                        <div className="sa-row-actions">
                          <button
                            className="table-action-button edit"
                            onClick={() => handleEditContact(contact)}
                            title="Edit Contact"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button
                            className="table-action-button delete"
                            onClick={() => handleDeleteContact(contactId)}
                            title="Delete Contact"
                          >
                            <Trash2 size={14} />
                            Delete
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
  };

  // Render Quotes Section - List quotes being validated and validated quotes
  const renderQuotes = () => {
    const quotesToValidate = quotes.filter(q => {
      const status = (q.Status || q.status || '').toLowerCase();
      return status === 'sent' || status === 'pending';
    });
    const validatedQuotes = quotes.filter(q => {
      const status = (q.Status || q.status || '').toLowerCase();
      return status === 'approved' || status === 'validated';
    });

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>The Quotes</h3>
            <p>Manage quotes awaiting validation and view validated quotes</p>
          </div>
        </div>

        <div className="sa-filters-section">
          <select 
            className="sa-filter-select"
            value={quoteStatusFilter}
            onChange={(e) => setQuoteStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Sent">Being Validated</option>
            <option value="Approved">Validated</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Quotes Being Validated Tab */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>Quotes Being Validated</h4>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Date</th>
                  <th>Property</th>
                  <th>Issue</th>
                  <th>Amount</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {quotesToValidate.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="sa-table-empty">No quotes awaiting validation</td>
                  </tr>
                ) : (
                  quotesToValidate.map((q, index) => (
                    <tr key={q.ID || q.id}>
                      <td>{index + 1}</td>
                      <td>{q.Date || q.date ? new Date(q.Date || q.date).toLocaleDateString() : 'N/A'}</td>
                      <td>{q.Property || q.property || 'N/A'}</td>
                      <td>{q.Issue || q.issue || 'N/A'}</td>
                      <td>${(q.Amount || q.amount || 0).toLocaleString()}</td>
                      <td>{q.Recipient || q.recipient || 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${(q.Status || q.status || 'sent').toLowerCase()}`}>
                          {q.Status || q.status || 'Sent'}
                        </span>
                      </td>
                      <td>
                        {/* Check if super urgent - requires single validation */}
                        <span className="sa-status-pill urgent">Super Urgent</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Validated Quotes Tab */}
        <div>
          <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>Validated Quotes</h4>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Date</th>
                  <th>Property</th>
                  <th>Issue</th>
                  <th>Amount</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Validated By</th>
                </tr>
              </thead>
              <tbody>
                {validatedQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="sa-table-empty">No validated quotes</td>
                  </tr>
                ) : (
                  validatedQuotes.map((q, index) => (
                    <tr key={q.ID || q.id}>
                      <td>{index + 1}</td>
                      <td>{q.Date || q.date ? new Date(q.Date || q.date).toLocaleDateString() : 'N/A'}</td>
                      <td>{q.Property || q.property || 'N/A'}</td>
                      <td>{q.Issue || q.issue || 'N/A'}</td>
                      <td>${(q.Amount || q.amount || 0).toLocaleString()}</td>
                      <td>{q.Recipient || q.recipient || 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${(q.Status || q.status || 'approved').toLowerCase()}`}>
                          {q.Status || q.status || 'Approved'}
                        </span>
                      </td>
                      <td>{q.ValidatedBy || q.validatedBy || 'N/A'}</td>
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

  // Render Works Section - List work in progress, in pause, and completed
  const renderWorks = () => {
    const worksInProgress = works.filter(w => (w.Status || w.status) === 'In Progress');
    const worksInPause = works.filter(w => (w.Status || w.status) === 'Paused' || (w.Status || w.status) === 'On Hold');
    const completedWorks = works.filter(w => (w.Status || w.status) === 'Completed');

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Works</h3>
            <p>Manage work orders: in progress, paused, and completed</p>
          </div>
        </div>

        <div className="sa-filters-section">
          <select 
            className="sa-filter-select"
            value={workStatusFilter}
            onChange={(e) => setWorkStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="In Progress">In Progress</option>
            <option value="Paused">In Pause</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Work In Progress */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>Work In Progress</h4>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Property</th>
                  <th>Issue</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Est. Cost</th>
                  <th>Date Started</th>
                </tr>
              </thead>
              <tbody>
                {worksInProgress.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="sa-table-empty">No work in progress</td>
                  </tr>
                ) : (
                  worksInProgress.map((w, index) => (
                    <tr key={w.ID || w.id}>
                      <td>{index + 1}</td>
                      <td>{w.Property || w.property || 'N/A'}</td>
                      <td>{w.Issue || w.issue || 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${(w.Priority || w.priority || 'normal').toLowerCase()}`}>
                          {w.Priority || w.priority || 'Normal'}
                        </span>
                      </td>
                      <td>{w.Assigned || w.assigned || 'Unassigned'}</td>
                      <td>${(w.EstimatedCost || w.estimatedCost || 0).toLocaleString()}</td>
                      <td>{w.Date || w.date ? new Date(w.Date || w.date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Work In Pause */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>Work In Pause</h4>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Property</th>
                  <th>Issue</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Est. Cost</th>
                  <th>Date Paused</th>
                </tr>
              </thead>
              <tbody>
                {worksInPause.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="sa-table-empty">No work in pause</td>
                  </tr>
                ) : (
                  worksInPause.map((w, index) => (
                    <tr key={w.ID || w.id}>
                      <td>{index + 1}</td>
                      <td>{w.Property || w.property || 'N/A'}</td>
                      <td>{w.Issue || w.issue || 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${(w.Priority || w.priority || 'normal').toLowerCase()}`}>
                          {w.Priority || w.priority || 'Normal'}
                        </span>
                      </td>
                      <td>{w.Assigned || w.assigned || 'Unassigned'}</td>
                      <td>${(w.EstimatedCost || w.estimatedCost || 0).toLocaleString()}</td>
                      <td>{w.Date || w.date ? new Date(w.Date || w.date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Completed Works */}
        <div>
          <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>Completed Works</h4>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Property</th>
                  <th>Issue</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Final Cost</th>
                  <th>Date Completed</th>
                </tr>
              </thead>
              <tbody>
                {completedWorks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="sa-table-empty">No completed work</td>
                  </tr>
                ) : (
                  completedWorks.map((w, index) => (
                    <tr key={w.ID || w.id}>
                      <td>{index + 1}</td>
                      <td>{w.Property || w.property || 'N/A'}</td>
                      <td>{w.Issue || w.issue || 'N/A'}</td>
                      <td>
                        <span className={`sa-status-pill ${(w.Priority || w.priority || 'normal').toLowerCase()}`}>
                          {w.Priority || w.priority || 'Normal'}
                        </span>
                      </td>
                      <td>{w.Assigned || w.assigned || 'Unassigned'}</td>
                      <td>${(w.EstimatedCost || w.estimatedCost || 0).toLocaleString()}</td>
                      <td>{w.CompletedAt || w.completedAt ? new Date(w.CompletedAt || w.completedAt).toLocaleDateString() : 'N/A'}</td>
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

  // Render State of Entry - List tenants who paid deposit and requested inventory
  const renderStateEntry = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>State of the Entry</h3>
            <p>List of tenants who paid the deposit at the accountant's and requested inventory of premises</p>
          </div>
          <button 
            className="sa-primary-cta"
            onClick={() => {
              setInventoryFormData({ ...inventoryFormData, type: 'Entry' });
              setShowInventoryFormModal(true);
            }}
          >
            <Plus size={16} />
            Create Entry Inventory
          </button>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Tenant Name</th>
                <th>Property</th>
                <th>Unit Number</th>
                <th>Deposit Paid Date</th>
                <th>Inventory Request Date</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entryTenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="sa-table-empty">
                    No entry inventory requests found. Tenants who have paid deposits and requested inventory will appear here.
                  </td>
                </tr>
              ) : (
                entryTenants.map((tenant, index) => (
                  <tr key={tenant.ID || tenant.id}>
                    <td>{index + 1}</td>
                    <td>{tenant.Name || tenant.name || 'N/A'}</td>
                    <td>{tenant.Property || tenant.property || 'N/A'}</td>
                    <td>{tenant.UnitNumber || tenant.unitNumber || 'N/A'}</td>
                    <td>{tenant.DepositPaidDate ? new Date(tenant.DepositPaidDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{tenant.InventoryRequestDate ? new Date(tenant.InventoryRequestDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`sa-status-pill ${(tenant.Status || tenant.status || 'pending').toLowerCase()}`}>
                        {tenant.Status || tenant.status || 'Pending'}
                      </span>
                    </td>
                    <td className="sa-row-actions">
                      <button 
                        className="sa-icon-button" 
                        onClick={() => {
                          setInventoryFormData({ ...inventoryFormData, type: 'Entry', tenantName: tenant.Name || tenant.name, propertyAddress: tenant.Property || tenant.property });
                          setShowInventoryFormModal(true);
                        }}
                        title="Create Inventory"
                      >
                        📋
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render State of Exit - List tenants who requested contract termination
  const renderStateExit = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>State of Affairs of Exit</h3>
            <p>List of tenants who have requested to terminate their contract</p>
          </div>
          <button 
            className="sa-primary-cta"
            onClick={() => {
              setInventoryFormData({ ...inventoryFormData, type: 'Exit' });
              setShowInventoryFormModal(true);
            }}
          >
            <Plus size={16} />
            Create Exit Inventory
          </button>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Tenant Name</th>
                <th>Property</th>
                <th>Unit Number</th>
                <th>Termination Request Date</th>
                <th>Exit Inventory Status</th>
                <th>Deposit Refund Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {exitTenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="sa-table-empty">
                    No exit requests found. Tenants who have requested contract termination will appear here.
                  </td>
                </tr>
              ) : (
                exitTenants.map((tenant, index) => (
                  <tr key={tenant.ID || tenant.id}>
                    <td>{index + 1}</td>
                    <td>{tenant.Name || tenant.name || 'N/A'}</td>
                    <td>{tenant.Property || tenant.property || 'N/A'}</td>
                    <td>{tenant.UnitNumber || tenant.unitNumber || 'N/A'}</td>
                    <td>{tenant.TerminationRequestDate ? new Date(tenant.TerminationRequestDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`sa-status-pill ${(tenant.ExitInventoryStatus || tenant.exitInventoryStatus || 'pending').toLowerCase()}`}>
                        {tenant.ExitInventoryStatus || tenant.exitInventoryStatus || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span className={`sa-status-pill ${(tenant.DepositRefundStatus || tenant.depositRefundStatus || 'pending').toLowerCase()}`}>
                        {tenant.DepositRefundStatus || tenant.depositRefundStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="sa-row-actions">
                      <button 
                        className="sa-icon-button" 
                        onClick={() => {
                          setInventoryFormData({ ...inventoryFormData, type: 'Exit', tenantName: tenant.Name || tenant.name, propertyAddress: tenant.Property || tenant.property });
                          setShowInventoryFormModal(true);
                        }}
                        title="Create Exit Inventory"
                      >
                        📋
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render History Section - Query history, Quote history, Work history, Inventory reports history
  const renderHistory = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>History</h3>
            <p>View query history, quote history, work history, and inventory reports history</p>
          </div>
        </div>

        <div className="sa-filters-section">
          <input
            type="date"
            className="sa-filter-select"
            value={historyDateFilter}
            onChange={(e) => setHistoryDateFilter(e.target.value)}
            placeholder="Filter by date"
          />
          <select 
            className="sa-filter-select"
            value={historyTypeFilter}
            onChange={(e) => setHistoryTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="query">Query History</option>
            <option value="quote">Quote History</option>
            <option value="work">Work History</option>
            <option value="inventory">Inventory Reports</option>
          </select>
          <input
            type="text"
            className="sa-filter-select"
            value={historyPropertyFilter}
            onChange={(e) => setHistoryPropertyFilter(e.target.value)}
            placeholder="Filter by property"
          />
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Type</th>
                <th>Property</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Combine all history data
                const allHistory = [
                  ...historyData.queries.map(q => ({ ...q, type: 'Query' })),
                  ...historyData.quotes.map(q => ({ ...q, type: 'Quote' })),
                  ...historyData.works.map(w => ({ ...w, type: 'Work' })),
                  ...historyData.inventories.map(i => ({ ...i, type: 'Inventory' }))
                ].filter(item => {
                  if (historyDateFilter) {
                    const itemDate = new Date(item.Date || item.date || item.CreatedAt || item.createdAt);
                    const filterDate = new Date(historyDateFilter);
                    if (itemDate.toDateString() !== filterDate.toDateString()) return false;
                  }
                  if (historyTypeFilter) {
                    if (item.type.toLowerCase() !== historyTypeFilter.toLowerCase()) return false;
                  }
                  if (historyPropertyFilter) {
                    const property = item.Property || item.property || '';
                    if (!property.toLowerCase().includes(historyPropertyFilter.toLowerCase())) return false;
                  }
                  return true;
                }).sort((a, b) => {
                  const dateA = new Date(a.Date || a.date || a.CreatedAt || a.createdAt);
                  const dateB = new Date(b.Date || b.date || b.CreatedAt || b.createdAt);
                  return dateB - dateA;
                });

                if (allHistory.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} className="sa-table-empty">No history records found</td>
                    </tr>
                  );
                }

                return allHistory.map((item, index) => (
                  <tr key={`${item.type}-${item.ID || item.id || index}`}>
                    <td>{index + 1}</td>
                    <td>
                      <span className="sa-status-pill" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                        {item.type}
                      </span>
                    </td>
                    <td>{item.Property || item.property || 'N/A'}</td>
                    <td>{item.Issue || item.issue || item.Description || item.description || 'N/A'}</td>
                    <td>{item.Date || item.date || item.CreatedAt || item.createdAt ? new Date(item.Date || item.date || item.CreatedAt || item.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`sa-status-pill ${(item.Status || item.status || 'completed').toLowerCase()}`}>
                        {item.Status || item.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Reports Section
  const renderReports = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Reports</h3>
            <p>Generate and view various reports</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '20px' }} onClick={() => {
            // Generate monthly report of requests
            addNotification('Monthly report of requests feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Monthly Report of Requests</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Generate monthly summary of maintenance requests</p>
          </div>

          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '20px' }} onClick={() => {
            // Generate quotes report
            addNotification('Quotes report feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Report of the Quotes</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>View all quotes and their validation status</p>
          </div>

          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '20px' }} onClick={() => {
            // Generate work report
            addNotification('Work report feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Report of the Work Carried Out</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Summary of completed work orders</p>
          </div>

          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '20px' }} onClick={() => {
            // Generate emergency report
            addNotification('Emergency report feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Emergency Report</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Urgent and emergency maintenance requests</p>
          </div>

          <div className="sa-metric-card" style={{ cursor: 'pointer', padding: '20px' }} onClick={() => {
            // Generate property/building report
            addNotification('Property report feature coming soon', 'info');
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Report by Property or Building</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Detailed report for specific property</p>
          </div>
        </div>
      </div>
    );
  };

  // Render Inventory Form - Comprehensive dynamic form
  const renderInventoryForm = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Inventory Form (Entry / Exit)</h3>
            <p>Create detailed inventory reports for property entry or exit</p>
          </div>
          <button 
            className="sa-primary-cta"
            onClick={() => {
              setInventoryFormData({
                type: 'Entry',
                propertyType: '',
                numberOfRooms: 1,
                propertyAddress: '',
                tenantName: '',
                date: new Date().toISOString().split('T')[0],
                technicianName: '',
                formData: {}
              });
              setShowInventoryFormModal(true);
            }}
          >
            <Plus size={16} />
            New Inventory Form
          </button>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Type</th>
                <th>Property</th>
                <th>Tenant</th>
                <th>Property Type</th>
                <th>Date</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {inspections.filter(i => {
                const type = i.Type || i.type;
                return type === 'Move-in' || type === 'Move-out';
              }).length === 0 ? (
                <tr>
                  <td colSpan={8} className="sa-table-empty">
                    No inventory forms created yet. Click "New Inventory Form" to create one.
                  </td>
                </tr>
              ) : (
                inspections.filter(i => {
                  const type = i.Type || i.type;
                  return type === 'Move-in' || type === 'Move-out';
                }).map((inv, index) => (
                  <tr key={inv.ID || inv.id}>
                    <td>{index + 1}</td>
                    <td>
                      <span className={`sa-status-pill ${(inv.Type || inv.type || 'move-in').toLowerCase().replace(' ', '-')}`}>
                        {inv.Type || inv.type || 'Move-in'}
                      </span>
                    </td>
                    <td>{inv.Property || inv.property || 'N/A'}</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>{inv.Date || inv.date ? new Date(inv.Date || inv.date).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className="sa-status-pill completed">Completed</span>
                    </td>
                    <td className="sa-row-actions">
                      <button className="sa-icon-button" title="View">👁️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'maintenance':
        return renderMaintenance();
      case 'quotes':
        return renderQuotes();
      case 'works':
        return renderWorks();
      case 'state-entry':
        return renderStateEntry();
      case 'state-exit':
        return renderStateExit();
      case 'worker-contacts':
        return renderTechnicianContacts(); // Reuse existing function
      case 'history':
        return renderHistory();
      case 'reports':
        return renderReports();
      case 'inventory-form':
        return renderInventoryForm();
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

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Operations', logo: 'SAAF', logoImage: `${process.env.PUBLIC_URL}/download.jpeg` }}
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
          <div key={`notification-${notification.id}`} className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>×</button>
                    </div>
        ))}
                  </div>

      {/* Add Inspection Modal */}
      {showInspectionModal && (
        <div className="modal-overlay" onClick={() => setShowInspectionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Inspection</h3>
              <button 
                className="modal-close"
                onClick={() => setShowInspectionModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
            <form onSubmit={handleInspectionSubmit} className="modal-form">
                <div className="form-row">
              <div className="form-group">
                    <label htmlFor="inspection-property">Property *</label>
                <input
                  type="text"
                      id="inspection-property"
                  value={inspectionForm.property}
                  onChange={(e) => setInspectionForm({...inspectionForm, property: e.target.value})}
                  placeholder="Enter property address"
                  required
                />
              </div>
              <div className="form-group">
                    <label htmlFor="inspection-type">Inspection Type *</label>
                <select
                      id="inspection-type"
                  value={inspectionForm.type}
                  onChange={(e) => setInspectionForm({...inspectionForm, type: e.target.value})}
                  required
                >
                  <option value="routine">Routine</option>
                  <option value="move-in">Move-in</option>
                  <option value="move-out">Move-out</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
                </div>
                <div className="form-row">
              <div className="form-group">
                    <label htmlFor="inspection-inspector">Inspector *</label>
                <input
                  type="text"
                      id="inspection-inspector"
                  value={inspectionForm.inspector}
                  onChange={(e) => setInspectionForm({...inspectionForm, inspector: e.target.value})}
                  placeholder="Enter inspector name"
                  required
                />
                  </div>
              </div>
              <div className="form-group">
                  <label htmlFor="inspection-notes">Notes</label>
                <textarea
                    id="inspection-notes"
                  value={inspectionForm.notes}
                  onChange={(e) => setInspectionForm({...inspectionForm, notes: e.target.value})}
                  placeholder="Enter inspection notes"
                  rows="3"
                />
              </div>
                <div className="modal-footer">
                <button 
                  type="button" 
                    className="action-button secondary"
                  onClick={() => setShowInspectionModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                    className="action-button primary"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Inspection'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Management Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
          setTaskForm({ status: 'Pending', estimatedHours: 0, estimatedCost: 0 });
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedTask ? `Task Details - ${selectedTask.Issue || selectedTask.issue || 'Maintenance Task'}` : 'Create New Task'}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowTaskModal(false);
                  setSelectedTask(null);
                  setTaskForm({ status: 'Pending', estimatedHours: 0, estimatedCost: 0 });
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
            <form onSubmit={handleTaskUpdate} className="modal-form">
                <div className="form-row">
              <div className="form-group">
                    <label htmlFor="task-property">Property {!selectedTask && '*'}</label>
                <input
                  type="text"
                      id="task-property"
                      value={selectedTask ? (selectedTask.Property || selectedTask.property || '') : (taskForm.property || '')}
                      onChange={(e) => {
                        if (selectedTask) return; // Disabled for existing tasks
                        setTaskForm({...taskForm, property: e.target.value});
                      }}
                      disabled={!!selectedTask}
                      className={selectedTask ? "disabled-input" : ""}
                      required={!selectedTask}
                      placeholder="Enter property address"
                />
              </div>
              <div className="form-group">
                    <label htmlFor="task-priority">Priority {!selectedTask && '*'}</label>
                    {selectedTask ? (
                      <input
                        type="text"
                        id="task-priority"
                        value={selectedTask.Priority || selectedTask.priority || 'Medium'}
                  disabled
                  className="disabled-input"
                      />
                    ) : (
                      <select
                        id="task-priority"
                        value={taskForm.priority || 'normal'}
                        onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                        required
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                      </select>
                    )}
                  </div>
              </div>
              <div className="form-group">
                  <label htmlFor="task-issue">Issue {!selectedTask && '*'}</label>
                  <textarea
                    id="task-issue"
                    value={selectedTask ? (selectedTask.Issue || selectedTask.issue || 'Maintenance Task') : (taskForm.issue || '')}
                    onChange={(e) => {
                      if (selectedTask) return; // Disabled for existing tasks
                      setTaskForm({...taskForm, issue: e.target.value});
                    }}
                    disabled={!!selectedTask}
                    className={selectedTask ? "disabled-input" : ""}
                    rows="2"
                    required={!selectedTask}
                    placeholder="Describe the maintenance issue"
                />
              </div>
                <div className="form-row">
              <div className="form-group">
                    <label htmlFor="task-status">Status *</label>
                <select
                      id="task-status"
                      value={taskForm.status || 'Pending'}
                  onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </div>
                  {!selectedTask && (
              <div className="form-group">
                      <label htmlFor="task-assigned">Assigned To</label>
                      <input
                        type="text"
                        id="task-assigned"
                        value={taskForm.assigned || ''}
                        onChange={(e) => setTaskForm({...taskForm, assigned: e.target.value})}
                        placeholder="Enter technician name"
                      />
                    </div>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="task-hours">Estimated Hours</label>
                <input
                  type="number"
                      id="task-hours"
                      value={taskForm.estimatedHours || 0}
                  onChange={(e) => setTaskForm({...taskForm, estimatedHours: parseFloat(e.target.value) || 0})}
                  min="0"
                  step="0.5"
                      placeholder="0"
                />
              </div>
              <div className="form-group">
                    <label htmlFor="task-cost">Estimated Cost ($)</label>
                <input
                  type="number"
                      id="task-cost"
                      value={taskForm.estimatedCost || 0}
                  onChange={(e) => setTaskForm({...taskForm, estimatedCost: parseFloat(e.target.value) || 0})}
                  min="0"
                  step="0.01"
                      placeholder="0.00"
                />
              </div>
                </div>
                <div className="modal-footer">
                <button 
                  type="button" 
                    className="action-button secondary"
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedTask(null);
                      setTaskForm({ status: 'Pending', estimatedHours: 0, estimatedCost: 0 });
                  }}
                >
                    Cancel
                </button>
                <button 
                  type="submit" 
                    className="action-button primary"
                  disabled={loading}
                >
                    {loading ? (selectedTask ? 'Updating...' : 'Creating...') : (selectedTask ? 'Update Task' : 'Create Task')}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoUploadModal && selectedInspectionForPhoto && (
        <div className="modal-overlay" onClick={() => {
          setShowPhotoUploadModal(false);
          setSelectedInspectionForPhoto(null);
          setPhotoFile(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Inspection Photo</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowPhotoUploadModal(false);
                  setSelectedInspectionForPhoto(null);
                  setPhotoFile(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handlePhotoUpload} className="modal-form">
                <div className="form-group">
                  <label htmlFor="photo-inspection">Inspection</label>
                  <input
                    type="text"
                    id="photo-inspection"
                    value={`${selectedInspectionForPhoto.property || selectedInspectionForPhoto.Property || ''} - ${selectedInspectionForPhoto.type || selectedInspectionForPhoto.Type || ''}`}
                    disabled
                    className="disabled-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="photo-file">Photo *</label>
                  <input
                    type="file"
                    id="photo-file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                    required
                  />
                  {photoFile && (
                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#6b7280' }}>
                      Selected: {photoFile.name}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary"
                    onClick={() => {
                      setShowPhotoUploadModal(false);
                      setSelectedInspectionForPhoto(null);
                      setPhotoFile(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="action-button primary"
                    disabled={loading || !photoFile}
                  >
                    {loading ? 'Uploading...' : 'Upload Photo'}
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
                  <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Title/Issue</label>
                  <p style={{ margin: 0, color: '#1f2937' }}>
                    {selectedMaintenanceRequest.Title || selectedMaintenanceRequest.title || selectedMaintenanceRequest.Issue || selectedMaintenanceRequest.issue || 'N/A'}
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

                {(selectedMaintenanceRequest.Tenant || selectedMaintenanceRequest.tenant) && (
                  <div>
                    <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>Tenant</label>
                    <p style={{ margin: 0, color: '#1f2937' }}>
                      {selectedMaintenanceRequest.Tenant || selectedMaintenanceRequest.tenant}
                    </p>
                  </div>
                )}

                {/* Photos Section */}
                {(() => {
                  let photos = [];
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

                  return photos.length > 0 ? (
                    <div>
                      <label style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'block' }}>Photos ({photos.length})</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                        {photos.map((photoUrl, index) => (
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
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
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

      {/* Technician Contact Modal */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedContact ? 'Edit Technician Contact' : 'Add Technician Contact'}</h3>
              <button className="modal-close" onClick={() => setShowContactModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleContactSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="contactName">Name *</label>
                    <input
                      type="text"
                      id="contactName"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., John's Plumbing"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactCategory">Category *</label>
                    <select
                      id="contactCategory"
                      value={contactForm.category}
                      onChange={(e) => setContactForm(prev => ({ ...prev, category: e.target.value }))}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="plumber">Plumber</option>
                      <option value="electrician">Electrician</option>
                      <option value="carpenter">Carpenter</option>
                      <option value="painter">Painter</option>
                      <option value="hvac">HVAC Technician</option>
                      <option value="locksmith">Locksmith</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="contactPhone">Phone Number *</label>
                    <input
                      type="tel"
                      id="contactPhone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+225 07 12 34 56 78"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactEmail">Email</label>
                    <input
                      type="email"
                      id="contactEmail"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>

                {contactForm.category === 'other' && (
                  <div className="form-group">
                    <label htmlFor="contactCustomCategory">Custom Worker Type *</label>
                    <input
                      type="text"
                      id="contactCustomCategory"
                      value={contactForm.customCategory}
                      onChange={(e) => setContactForm(prev => ({ ...prev, customCategory: e.target.value }))}
                      placeholder="e.g., Roofer, Tiler, Welder"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="contactAddress">Address</label>
                  <input
                    type="text"
                    id="contactAddress"
                    value={contactForm.address}
                    onChange={(e) => setContactForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main Street, City"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactDescription">Description/Notes</label>
                  <textarea
                    id="contactDescription"
                    value={contactForm.description}
                    onChange={(e) => setContactForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional information about this technician..."
                    rows="3"
                  />
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary" 
                    onClick={() => {
                      setShowContactModal(false);
                      setSelectedContact(null);
                      setContactForm({ name: '', category: '', customCategory: '', phone: '', email: '', address: '', description: '' });
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="action-button primary" 
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (selectedContact ? 'Update Contact' : 'Add Contact')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Inventory Form Modal */}
      {showInventoryFormModal && (
        <div className="modal-overlay" onClick={() => setShowInventoryFormModal(false)}>
          <div className="modal-content" style={{ maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Inventory Form - {inventoryFormData.type === 'Entry' ? 'Entry' : 'Exit'}</h3>
              <button className="modal-close" onClick={() => setShowInventoryFormModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);

                  // Validate mandatory checklist fields + photos
                  const rooms = inventoryFormData.formData?.rooms || {};
                  const roomNames = Object.keys(rooms);
                  if (roomNames.length === 0) {
                    addNotification('Please select property type and rooms, then fill the checklist.', 'error');
                    return;
                  }

                  for (const roomName of roomNames) {
                    const items = rooms[roomName] || {};
                    for (const item of INSPECTION_ITEMS) {
                      const it = items[item.key] || {};
                      if (!it.condition) {
                        addNotification(`Missing condition: ${roomName} → ${item.label}`, 'error');
                        return;
                      }
                      const photos = it.photos || [];
                      if (!Array.isArray(photos) || photos.length === 0) {
                        addNotification(`Missing photo(s): ${roomName} → ${item.label}`, 'error');
                        return;
                      }
                    }
                  }

                  const scheduledAt =
                    inventoryFormData.date && inventoryFormData.time
                      ? `${inventoryFormData.date}T${inventoryFormData.time}`
                      : inventoryFormData.date;

                  const inspectionType = inventoryFormData.type === 'Entry' ? 'Move-in' : 'Move-out';

                  // Build report data without File objects
                  const reportData = {
                    appointment: {
                      property: inventoryFormData.propertyAddress,
                      tenant: inventoryFormData.tenantName,
                      scheduledAt,
                      inspectionType,
                    },
                    property: {
                      type: inventoryFormData.propertyType,
                      numberOfRooms: inventoryFormData.numberOfRooms,
                      address: inventoryFormData.propertyAddress,
                    },
                    rooms: {},
                    meters: inventoryFormData.formData?.meters || {},
                    observations: inventoryFormData.formData?.observations || {},
                    exit: inventoryFormData.type === 'Exit' ? (inventoryFormData.formData?.exit || {}) : undefined,
                  };

                  // Initialize empty photoUrls arrays for each item
                  for (const roomName of roomNames) {
                    reportData.rooms[roomName] = {};
                    for (const item of INSPECTION_ITEMS) {
                      const it = rooms[roomName]?.[item.key] || {};
                      reportData.rooms[roomName][item.key] = {
                        label: item.label,
                        condition: it.condition,
                        comment: it.comment || '',
                        photoUrls: [],
                      };
                    }
                  }

                  // Create inspection first
                  const created = await technicianService.createInspection({
                    property: inventoryFormData.propertyAddress,
                    type: inspectionType,
                    inspector: inventoryFormData.technicianName,
                    tenant: inventoryFormData.tenantName,
                    scheduledAt,
                    status: 'Completed',
                    notes: inventoryFormData.formData?.observations?.technician || '',
                    reportData,
                    photos: [],
                  });

                  const inspectionId = created?.id || created?.ID;
                  if (!inspectionId) {
                    addNotification('Failed to create inspection record (missing ID).', 'error');
                    return;
                  }

                  // Upload photos item-by-item, keep mapping into reportData
                  for (const roomName of roomNames) {
                    for (const item of INSPECTION_ITEMS) {
                      const it = rooms[roomName]?.[item.key] || {};
                      const files = it.photos || [];
                      for (const file of files) {
                        const uploadRes = await technicianService.uploadInspectionPhoto(inspectionId, file);
                        const photoUrl = uploadRes?.photoUrl || uploadRes?.photoURL || uploadRes?.PhotoUrl;
                        if (photoUrl) {
                          reportData.rooms[roomName][item.key].photoUrls.push(photoUrl);
                        }
                      }
                    }
                  }

                  // Update inspection with final reportData (with photo URLs)
                  await technicianService.updateInspection(inspectionId, {
                    tenant: inventoryFormData.tenantName,
                    scheduledAt,
                    status: 'Completed',
                    reportData,
                  });

                  // Finalize to generate printable report file
                  const finalized = await technicianService.finalizeInspection(inspectionId);
                  const reportUrl = finalized?.reportUrl || finalized?.reportURL || finalized?.ReportUrl;

                  addNotification('Inventory report saved successfully.', 'success');
                  if (reportUrl) {
                    // Open report for download/print (user can "Save as PDF")
                    window.open(`${API_CONFIG.BASE_URL}${reportUrl}`, '_blank');
                  }

                  setShowInventoryFormModal(false);
                } catch (error) {
                  console.error('Error submitting inventory form:', error);
                  addNotification(error.message || 'Failed to submit inventory form', 'error');
                } finally {
                  setLoading(false);
                }
              }} className="modal-form">
                
                {/* A. General Information */}
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>A. General Information</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Type of State of Affairs *</label>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name="inventoryType"
                            value="Entry"
                            checked={inventoryFormData.type === 'Entry'}
                            onChange={(e) => setInventoryFormData({ ...inventoryFormData, type: e.target.value })}
                            required
                          />
                          Entry
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name="inventoryType"
                            value="Exit"
                            checked={inventoryFormData.type === 'Exit'}
                            onChange={(e) => setInventoryFormData({ ...inventoryFormData, type: e.target.value })}
                            required
                          />
                          Exit
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Type of Property *</label>
                      <select
                        value={inventoryFormData.propertyType}
                        onChange={(e) => setInventoryFormData({ ...inventoryFormData, propertyType: e.target.value, numberOfRooms: e.target.value === 'Studio' ? 1 : inventoryFormData.numberOfRooms })}
                        required
                      >
                        <option value="">Select Property Type</option>
                        <option value="Studio">Studio</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Duplex">Duplex</option>
                        <option value="Villa">Villa</option>
                      </select>
                    </div>
                    {inventoryFormData.propertyType && inventoryFormData.propertyType !== 'Studio' && (
                      <div className="form-group">
                        <label>Number of Rooms *</label>
                        <input
                          type="number"
                          min="1"
                          value={inventoryFormData.numberOfRooms}
                          onChange={(e) => setInventoryFormData({ ...inventoryFormData, numberOfRooms: parseInt(e.target.value) || 1 })}
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Property *</label>
                      <select
                        value={inventoryFormData.propertyAddress}
                        onChange={(e) =>
                          setInventoryFormData(prev => {
                            const selectedAddress = e.target.value;
                            const selectedProperty = (companyProperties || []).find(
                              p => (p.Address || p.address) === selectedAddress
                            );
                            const bedrooms = selectedProperty?.Bedrooms || selectedProperty?.bedrooms;
                            const propTypeRaw =
                              selectedProperty?.Type ||
                              selectedProperty?.type ||
                              selectedProperty?.BuildingType ||
                              selectedProperty?.buildingType ||
                              selectedProperty?.PropertyType ||
                              selectedProperty?.propertyType ||
                              '';
                            const typeLower = String(propTypeRaw).toLowerCase();
                            const inferredType = typeLower.includes('studio')
                              ? 'Studio'
                              : typeLower.includes('duplex')
                                ? 'Duplex'
                                : typeLower.includes('villa')
                                  ? 'Villa'
                                  : typeLower.includes('apartment')
                                    ? 'Apartment'
                                    : '';
                            return {
                              ...prev,
                              propertyAddress: selectedAddress,
                              numberOfRooms: bedrooms ? Number(bedrooms) : prev.numberOfRooms,
                              propertyType: inferredType || prev.propertyType || (bedrooms ? 'Apartment' : prev.propertyType),
                            };
                          })
                        }
                        required
                      >
                        <option value="">Select Property</option>
                        {inventoryPropertyOptions.map(address => (
                          <option key={address} value={address}>
                            {address}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ position: 'relative' }}>
                      <label>Tenant Name *</label>
                      <input
                        type="text"
                        value={inventoryFormData.tenantName}
                        onChange={(e) =>
                          setInventoryFormData({
                            ...inventoryFormData,
                            tenantName: e.target.value,
                          })
                        }
                        required
                        placeholder="Start typing tenant name..."
                        autoComplete="off"
                      />
                      {inventoryTenantSuggestions.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 20,
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0 0 0.5rem 0.5rem',
                            maxHeight: '180px',
                            overflowY: 'auto',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                          }}
                        >
                          {inventoryTenantSuggestions.slice(0, 5).map((t, idx) => {
                            const name = t.Name || t.name || '';
                            const property = t.Property || t.property || '';
                            return (
                              <button
                                key={`${name}-${idx}`}
                                type="button"
                                onClick={() =>
                                  setInventoryFormData({
                                    ...inventoryFormData,
                                    tenantName: name,
                                    propertyAddress:
                                      inventoryFormData.propertyAddress || property,
                                  })
                                }
                                style={{
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '6px 10px',
                                  border: 'none',
                                  borderBottom: '1px solid #f3f4f6',
                                  background: '#fff',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                }}
                              >
                                <div style={{ fontWeight: 500 }}>{name}</div>
                                {property && (
                                  <div
                                    style={{
                                      fontSize: '0.75rem',
                                      color: '#6b7280',
                                    }}
                                  >
                                    {property}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date *</label>
                      <input
                        type="date"
                        value={inventoryFormData.date}
                        onChange={(e) => setInventoryFormData({ ...inventoryFormData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Time *</label>
                      <input
                        type="time"
                        value={inventoryFormData.time || ''}
                        onChange={(e) => setInventoryFormData({ ...inventoryFormData, time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Name of the Technical Manager *</label>
                      <input
                        type="text"
                        value={inventoryFormData.technicianName}
                        onChange={(e) => setInventoryFormData({ ...inventoryFormData, technicianName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Sections Based on Property Type */}
                {inventoryFormData.propertyType && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>
                      B. STATE OF THE PREMISES – {inventoryFormData.propertyType.toUpperCase()}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '16px' }}>
                      {inventoryFormData.propertyType === 'Studio' && 'Evaluation of the unique piece and basic equipment.'}
                      {inventoryFormData.propertyType === 'Apartment' && 'Each room is automatically generated according to the number of rooms.'}
                      {(inventoryFormData.propertyType === 'Duplex' || inventoryFormData.propertyType === 'Villa') && 'Multi-level management and outdoor spaces.'}
                    </p>
                    
                    {/* Room-by-room inspection checklist */}
                    {getRoomList(inventoryFormData.propertyType, inventoryFormData.numberOfRooms).map((roomName) => (
                      <div key={roomName} style={{ marginBottom: '16px', padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <h5 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 600 }}>{roomName}</h5>
                        <div className="sa-table-wrapper" style={{ marginBottom: 0 }}>
                          <table className="sa-table">
                            <thead>
                              <tr>
                                <th style={{ width: '22%' }}>Item</th>
                                <th style={{ width: '22%' }}>Condition *</th>
                                <th>Remarks</th>
                                <th style={{ width: '22%' }}>Photos *</th>
                              </tr>
                            </thead>
                            <tbody>
                              {INSPECTION_ITEMS.map((item) => {
                                const itemState =
                                  inventoryFormData.formData?.rooms?.[roomName]?.[item.key] || { condition: '', comment: '', photos: [] };
                                return (
                                  <tr key={`${roomName}-${item.key}`}>
                                    <td>{item.label}</td>
                                    <td>
                                      <select
                                        value={itemState.condition}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setInventoryFormData(prev => ({
                                            ...prev,
                                            formData: {
                                              ...prev.formData,
                                              rooms: {
                                                ...prev.formData.rooms,
                                                [roomName]: {
                                                  ...(prev.formData.rooms?.[roomName] || {}),
                                                  [item.key]: {
                                                    ...(prev.formData.rooms?.[roomName]?.[item.key] || {}),
                                                    condition: value,
                                                  },
                                                },
                                              },
                                            },
                                          }));
                                        }}
                                        required
                                      >
                                        <option value="">Select</option>
                                        <option value="good">Good condition</option>
                                        <option value="poor">Poor condition</option>
                                        <option value="needs_repair">Needs repair</option>
                                      </select>
                                    </td>
                                    <td>
                                      <input
                                        type="text"
                                        value={itemState.comment}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setInventoryFormData(prev => ({
                                            ...prev,
                                            formData: {
                                              ...prev.formData,
                                              rooms: {
                                                ...prev.formData.rooms,
                                                [roomName]: {
                                                  ...(prev.formData.rooms?.[roomName] || {}),
                                                  [item.key]: {
                                                    ...(prev.formData.rooms?.[roomName]?.[item.key] || {}),
                                                    comment: value,
                                                  },
                                                },
                                              },
                                            },
                                          }));
                                        }}
                                        placeholder="e.g., damaged handle, peeling paint..."
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => {
                                          const files = Array.from(e.target.files || []);
                                          setInventoryFormData(prev => ({
                                            ...prev,
                                            formData: {
                                              ...prev.formData,
                                              rooms: {
                                                ...prev.formData.rooms,
                                                [roomName]: {
                                                  ...(prev.formData.rooms?.[roomName] || {}),
                                                  [item.key]: {
                                                    ...(prev.formData.rooms?.[roomName]?.[item.key] || {}),
                                                    photos: files,
                                                  },
                                                },
                                              },
                                            },
                                          }));
                                        }}
                                        required
                                      />
                                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                                        {Array.isArray(itemState.photos) && itemState.photos.length > 0
                                          ? `${itemState.photos.length} selected`
                                          : 'No photos selected'}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* E. Meters & Equipment */}
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>E. Meters & Equipment</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Index Electricity Meter</label>
                      <input
                        type="text"
                        placeholder="Enter meter reading"
                        value={inventoryFormData.formData?.meters?.electricity || ''}
                        onChange={(e) =>
                          setInventoryFormData(prev => ({
                            ...prev,
                            formData: { ...prev.formData, meters: { ...prev.formData.meters, electricity: e.target.value } },
                          }))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Index Water Meter</label>
                      <input
                        type="text"
                        placeholder="Enter meter reading"
                        value={inventoryFormData.formData?.meters?.water || ''}
                        onChange={(e) =>
                          setInventoryFormData(prev => ({
                            ...prev,
                            formData: { ...prev.formData, meters: { ...prev.formData.meters, water: e.target.value } },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Gas (if applicable)</label>
                      <input
                        type="text"
                        placeholder="Enter gas meter reading"
                        value={inventoryFormData.formData?.meters?.gas || ''}
                        onChange={(e) =>
                          setInventoryFormData(prev => ({
                            ...prev,
                            formData: { ...prev.formData, meters: { ...prev.formData.meters, gas: e.target.value } },
                          }))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Number of Keys Handed In</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Enter number of keys"
                        value={inventoryFormData.formData?.meters?.keys || ''}
                        onChange={(e) =>
                          setInventoryFormData(prev => ({
                            ...prev,
                            formData: { ...prev.formData, meters: { ...prev.formData.meters, keys: e.target.value } },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* F. Observations */}
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>F. Observations</h4>
                  <div className="form-group">
                    <label>Comments from the Technical Manager</label>
                    <textarea
                      rows="3"
                      placeholder="Enter comments..."
                      value={inventoryFormData.formData?.observations?.technician || ''}
                      onChange={(e) =>
                        setInventoryFormData(prev => ({
                          ...prev,
                          formData: { ...prev.formData, observations: { ...prev.formData.observations, technician: e.target.value } },
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Observations of the Tenant</label>
                    <textarea
                      rows="3"
                      placeholder="Enter tenant observations..."
                      value={inventoryFormData.formData?.observations?.tenant || ''}
                      onChange={(e) =>
                        setInventoryFormData(prev => ({
                          ...prev,
                          formData: { ...prev.formData, observations: { ...prev.formData.observations, tenant: e.target.value } },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* G. Exit - Estimation of Degradations (only for Exit) */}
                {inventoryFormData.type === 'Exit' && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>G. OUTPUT – ESTIMATION OF DEGRADATIONS</h4>
                    <div className="form-group">
                      <label>Observed Degradations</label>
                      <textarea
                        rows="3"
                        placeholder="Describe observed degradations..."
                        value={inventoryFormData.formData?.exit?.degradations || ''}
                        onChange={(e) =>
                          setInventoryFormData(prev => ({
                            ...prev,
                            formData: { ...prev.formData, exit: { ...prev.formData.exit, degradations: e.target.value } },
                          }))
                        }
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Work to be Carried Out</label>
                        <textarea
                          rows="2"
                          placeholder="Describe work needed..."
                          value={inventoryFormData.formData?.exit?.workToBeCarriedOut || ''}
                          onChange={(e) =>
                            setInventoryFormData(prev => ({
                              ...prev,
                              formData: { ...prev.formData, exit: { ...prev.formData.exit, workToBeCarriedOut: e.target.value } },
                            }))
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Estimated Cost</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={inventoryFormData.formData?.exit?.estimatedCost || 0}
                          onChange={(e) =>
                            setInventoryFormData(prev => ({
                              ...prev,
                              formData: { ...prev.formData, exit: { ...prev.formData.exit, estimatedCost: parseFloat(e.target.value) || 0 } },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Impact on Bail</label>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name="bailImpact"
                            value="None"
                            checked={(inventoryFormData.formData?.exit?.bailImpact || 'None') === 'None'}
                            onChange={(e) =>
                              setInventoryFormData(prev => ({
                                ...prev,
                                formData: { ...prev.formData, exit: { ...prev.formData.exit, bailImpact: e.target.value } },
                              }))
                            }
                          />
                          None
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name="bailImpact"
                            value="Partial"
                            checked={(inventoryFormData.formData?.exit?.bailImpact || 'None') === 'Partial'}
                            onChange={(e) =>
                              setInventoryFormData(prev => ({
                                ...prev,
                                formData: { ...prev.formData, exit: { ...prev.formData.exit, bailImpact: e.target.value } },
                              }))
                            }
                          />
                          Partial
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name="bailImpact"
                            value="Total"
                            checked={(inventoryFormData.formData?.exit?.bailImpact || 'None') === 'Total'}
                            onChange={(e) =>
                              setInventoryFormData(prev => ({
                                ...prev,
                                formData: { ...prev.formData, exit: { ...prev.formData.exit, bailImpact: e.target.value } },
                              }))
                            }
                          />
                          Total
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* H. Digital Signature */}
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>H. DIGITAL SIGNATURE (MANDATORY)</h4>
                  <div className="form-group">
                    <label>Signature of the Technical Manager *</label>
                    <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '24px', textAlign: 'center', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Touch screen signature area (to be implemented)</p>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Signature of the Tenant *</label>
                    <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '24px', textAlign: 'center', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Touch screen signature area (to be implemented)</p>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
                      "I acknowledge the accuracy of the above information."
                    </p>
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary" 
                    onClick={() => setShowInventoryFormModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="action-button primary" 
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Finalize and Generate PDF'}
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

export default TechnicianDashboard;