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
  Megaphone
} from 'lucide-react';
import { technicianService } from '../services/technicianService';
import { messagingService } from '../services/messagingService';
import { API_CONFIG } from '../config/api';
import './TechnicianDashboard.css';
import './SuperAdminDashboard.css';
import SettingsPage from './SettingsPage';
import RoleLayout from '../components/RoleLayout';
import '../components/RoleLayout.css';

const TechnicianDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [quotes, setQuotes] = useState([]);
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
  
  // Filter states
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState('');
  const [maintenancePriorityFilter, setMaintenancePriorityFilter] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState('');
  const [progressStatusFilter, setProgressStatusFilter] = useState('');
  const [progressPriorityFilter, setProgressPriorityFilter] = useState('');
  
  // Progress report state
  const [progressReport, setProgressReport] = useState(null);
  
  // Advertisements state
  const [advertisements, setAdvertisements] = useState([]);
  
  // Messaging states
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const isLoadingUsersRef = useRef(false);
  const messagesEndRef = useRef(null);
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  
  const addNotification = (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Load data from backend
  useEffect(() => {
    loadData();
  }, [maintenanceStatusFilter, maintenancePriorityFilter, quoteStatusFilter, progressStatusFilter, progressPriorityFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overview, maintenance, inspection, task, quotesData, progressData, progressReportData] = await Promise.all([
        technicianService.getOverview(),
        technicianService.listMaintenanceRequests({
          status: maintenanceStatusFilter || undefined,
          priority: maintenancePriorityFilter || undefined,
        }),
        technicianService.listInspections(),
        technicianService.listTasks(),
        technicianService.listQuotes({
          status: quoteStatusFilter || undefined,
        }),
        technicianService.getWorkProgress({
          status: progressStatusFilter || undefined,
          priority: progressPriorityFilter || undefined,
        }),
        technicianService.getRepairProgressReport().catch(() => null),
      ]);
      
      setOverviewData(overview);
      setMaintenanceRequests(Array.isArray(maintenance) ? maintenance : []);
      setInspections(Array.isArray(inspection) ? inspection : []);
      setTasks(Array.isArray(task) ? task : []);
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      setProgressReport(progressReportData);
    } catch (error) {
      console.error('Error loading technician data:', error);
      addNotification('Failed to load dashboard data', 'error');
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
      addNotification('Task marked as completed', 'success');
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
    
    isLoadingUsersRef.current = true;
    try {
      const users = await messagingService.getUsers();
      console.log('Fetched users:', users);
      
      // Get current user ID
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
      
      // Filter out current user and normalize
      let normalizedUsers = Array.isArray(users) ? users : [];
      if (Array.isArray(normalizedUsers[0])) {
        normalizedUsers = normalizedUsers[0];
      }
      
      const filteredUsers = normalizedUsers.filter(user => {
        const userId = user.id || user.ID || user.userId;
        return userId && String(userId) !== String(currentUserId);
      });
      
      // Sort by name
      filteredUsers.sort((a, b) => {
        const nameA = (a.name || a.Name || '').toLowerCase();
        const nameB = (b.name || b.Name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      // Get conversations to update unread counts
      try {
        const conversations = await messagingService.getConversations();
        const conversationsMap = new Map();
        conversations.forEach(conv => {
          const userId = conv.userId || conv.userID;
          if (userId) {
            conversationsMap.set(String(userId), conv);
          }
        });
        
        // Update users with conversation data
        const usersWithUnread = filteredUsers.map(user => {
          const userId = String(user.id || user.ID || user.userId);
          const conv = conversationsMap.get(userId);
          return {
            ...user,
            userId: user.id || user.ID || user.userId,
            name: user.name || user.Name,
            email: user.email || user.Email,
            role: user.role || user.Role,
            unreadCount: conv?.unreadCount || 0,
          };
        });
        
        setChatUsers(usersWithUnread);
        
        // Auto-select first user if none selected
        if (!selectedUserId && usersWithUnread.length > 0) {
          setSelectedUserId(prev => prev || usersWithUnread[0].userId);
        }
      } catch (convError) {
        console.error('Error loading conversations:', convError);
        // Still set users even if conversations fail
        setChatUsers(filteredUsers.map(user => ({
          ...user,
          userId: user.id || user.ID || user.userId,
          name: user.name || user.Name,
          email: user.email || user.Email,
          role: user.role || user.Role,
          unreadCount: 0,
        })));
      }
    } catch (error) {
      console.error('Error loading users:', error);
      addNotification('Failed to load users for messaging', 'error');
      setChatUsers([]);
    } finally {
      isLoadingUsersRef.current = false;
    }
  }, [selectedUserId, addNotification]);

  // Load users when chat tab is active
  useEffect(() => {
    if (activeTab === 'chat' && !isLoadingUsersRef.current) {
      loadUsers();
    }
  }, [activeTab, loadUsers]);

  // Load chat when user is selected
  useEffect(() => {
    if (selectedUserId && activeTab === 'chat') {
      loadChatForUser(selectedUserId);
    }
  }, [selectedUserId, activeTab, loadChatForUser]);

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

  // Load advertisements when advertisements tab is active
  useEffect(() => {
    if (activeTab === 'advertisements') {
      loadAdvertisements();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: Building },
      { id: 'inspections', label: 'Inspections', icon: CheckCircle },
      { id: 'inventories', label: 'Inventories', icon: FileText },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
      { id: 'quotes', label: 'Quotes', icon: Send },
      { id: 'progress', label: 'Progress', icon: BarChart2 },
      { id: 'tasks', label: 'Tasks', icon: Calendar },
      { id: 'advertisements', label: 'Advertisements', icon: Megaphone },
      { id: 'chat', label: 'Messages', icon: MessageCircle },
      { id: 'settings', label: 'Settings', icon: Settings }
    ],
    []
  );

  const renderOverview = () => (
    <div className="sa-overview-page">
      <div className="sa-overview-metrics" style={{ width: '100%' }}>
        <div className="sa-metric-card sa-metric-primary">
          <p className="sa-metric-label">Total Open Tickets</p>
          <p className="sa-metric-value">{overviewData?.totalOpenTickets || 0}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Urgent Tickets Pending</p>
          <p className="sa-metric-number">{overviewData?.urgentTicketsPending || 0}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Average Resolution Time</p>
          <p className="sa-metric-number">{overviewData?.averageResolutionTime ? `${overviewData.averageResolutionTime} days` : 'N/A'}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Total Cost of Ongoing Repairs</p>
          <p className="sa-metric-value">${(overviewData?.totalCostOfOngoingRepairs || 0).toLocaleString()}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Total Inspections</p>
          <p className="sa-metric-number">{overviewData?.totalInspections || 0}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Total Quotes</p>
          <p className="sa-metric-number">{overviewData?.totalQuotes || 0}</p>
        </div>
      </div>
    </div>
  );

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
    const handleUpdateMaintenance = async (maintenance) => {
      setShowTaskModal(true);
      setSelectedTask(maintenance);
      setTaskForm({
        status: maintenance.status || maintenance.Status || 'Pending',
        estimatedHours: maintenance.estimatedHours || maintenance.EstimatedHours || 0,
        estimatedCost: maintenance.estimatedCost || maintenance.EstimatedCost || 0,
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

    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
        <h3>Maintenance & Repairs</h3>
        <p>Track maintenance tasks and repair work</p>
          </div>
      </div>

        <div className="sa-filters-section">
          <select 
            className="sa-filter-select"
            value={maintenancePriorityFilter}
            onChange={(e) => setMaintenancePriorityFilter(e.target.value)}
          >
          <option value="">All Priority Levels</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
            <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
          <select 
            className="sa-filter-select"
            value={maintenanceStatusFilter}
            onChange={(e) => setMaintenanceStatusFilter(e.target.value)}
          >
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
            {maintenanceRequests.length === 0 ? (
              <tr>
                  <td colSpan={11} className="sa-table-empty">
                  No maintenance requests found
                </td>
              </tr>
            ) : (
                maintenanceRequests.map((maintenance, index) => {
                  const maintenanceId = maintenance.id || maintenance.ID;
                  const property = maintenance.property || maintenance.Property;
                  const issue = maintenance.issue || maintenance.Issue;
                  const priority = (maintenance.priority || maintenance.Priority || 'normal').toLowerCase();
                  const status = maintenance.status || maintenance.Status || 'Pending';
                  const assigned = maintenance.assigned || maintenance.Assigned || 'Unassigned';
                  const date = maintenance.date || maintenance.Date || maintenance.createdAt || maintenance.CreatedAt;
                  const estimatedHours = maintenance.estimatedHours || maintenance.EstimatedHours || 0;
                  const estimatedCost = maintenance.estimatedCost || maintenance.EstimatedCost || 0;
                  const quoteGenerated = maintenance.quoteGenerated || maintenance.QuoteGenerated || false;
                  
                  return (
                    <tr key={maintenanceId}>
                      <td>{index + 1}</td>
                      <td className="sa-cell-main">
                        <span className="sa-cell-title">{property}</span>
                      </td>
                      <td>
                        <span className="sa-cell-title">{issue}</span>
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
                        <button className="sa-icon-button" onClick={() => handleUpdateMaintenance(maintenance)} title="Edit">✏️</button>
                        {!quoteGenerated && (
                          <button className="sa-icon-button" onClick={() => handleSubmitQuote(maintenance)} title="Generate Quote" style={{ color: '#16a34a', marginLeft: '8px' }}>💰</button>
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

  const renderQuotes = () => (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
        <h3>Submitted Quotes</h3>
        <p>Track quotes sent to management and owners</p>
      </div>
      </div>

      <div className="sa-filters-section">
        <select 
          className="sa-filter-select"
          value={quoteStatusFilter}
          onChange={(e) => setQuoteStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Sent">Sent</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Date</th>
              <th>Recipient</th>
              <th>Property</th>
              <th>Issue</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="sa-table-empty">
                  No quotes found
                </td>
              </tr>
            ) : (
              quotes.map((q, index) => {
                const quoteId = q.id || q.ID;
                const date = q.date || q.Date || q.createdAt || q.CreatedAt;
                const recipient = q.recipient || q.Recipient;
                const property = q.property || q.Property;
                const issue = q.issue || q.Issue;
                const amount = q.amount || q.Amount || 0;
                const status = (q.status || q.Status || 'Sent').toLowerCase();
                
                return (
                  <tr key={quoteId}>
                    <td>{index + 1}</td>
                    <td>{date ? new Date(date).toLocaleDateString() : 'N/A'}</td>
                    <td className="sa-cell-main">
                      <span className="sa-cell-title">{recipient}</span>
                    </td>
                    <td>{property}</td>
                    <td>{issue}</td>
                    <td>${amount.toLocaleString()}</td>
                    <td>
                      <span className={`sa-status-pill ${status}`}>
                        {status}
                      </span>
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
          value={progressStatusFilter}
          onChange={(e) => setProgressStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select 
          className="sa-filter-select"
          value={progressPriorityFilter}
          onChange={(e) => setProgressPriorityFilter(e.target.value)}
        >
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {progressReport && (
        <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Total Ongoing</p>
              <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 600, color: '#111827' }}>
                {progressReport.totalOngoing || 0}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Total Completed</p>
              <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 600, color: '#111827' }}>
                {progressReport.totalCompleted || 0}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Total Ongoing Cost</p>
              <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 600, color: '#111827' }}>
                ${(progressReport.totalOngoingCost || 0).toLocaleString()}
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
            {maintenanceRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="sa-table-empty">
                  No maintenance requests found
                </td>
              </tr>
            ) : (
              maintenanceRequests.map((m, index) => {
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

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'inspections':
        return renderInspections();
      case 'inventories':
        return renderInventories();
      case 'maintenance':
        return renderMaintenance();
      case 'quotes':
        return renderQuotes();
      case 'progress':
        return renderProgress();
      case 'tasks':
        return renderTasks();
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
    </>
  );
};

export default TechnicianDashboard;