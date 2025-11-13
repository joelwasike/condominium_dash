import React, { useState, useEffect, useMemo } from 'react';
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
  Settings
} from 'lucide-react';
import { technicianService } from '../services/technicianService';
import './TechnicianDashboard.css';
import SettingsPage from './SettingsPage';
import RoleLayout from '../components/RoleLayout';

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

  // Load data from backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overview, maintenance, inspection, task] = await Promise.all([
        technicianService.getOverview(),
        technicianService.listMaintenanceRequests(),
        technicianService.listInspections(),
        technicianService.listTasks()
      ]);
      
      setOverviewData(overview);
      setMaintenanceRequests(maintenance);
      setInspections(inspection);
      setTasks(task);
    } catch (error) {
      console.error('Error loading technician data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await technicianService.createInspection(inspectionForm);
      setShowInspectionModal(false);
      setInspectionForm({ property: '', type: 'routine', inspector: '', notes: '' });
      loadData(); // Reload data to show new inspection
    } catch (error) {
      console.error('Error creating inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskView = (task) => {
    setSelectedTask(task);
    setTaskForm({
      status: task.Status || 'Pending',
      estimatedHours: task.EstimatedHours || 0,
      estimatedCost: task.EstimatedCost || 0
    });
    setShowTaskModal(true);
  };

  const handleTaskUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    
    setLoading(true);
    try {
      await technicianService.updateTask(selectedTask.ID, taskForm);
      setShowTaskModal(false);
      setSelectedTask(null);
      loadData(); // Reload data to show updated task
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (task) => {
    setLoading(true);
    try {
      await technicianService.updateTask(task.ID, { status: 'Completed' });
      loadData(); // Reload data to show updated task
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: Building },
      { id: 'inspections', label: 'Inspections', icon: CheckCircle },
      { id: 'inventories', label: 'Inventories', icon: FileText },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
      { id: 'requests', label: 'Requests', icon: Mail },
      { id: 'quotes', label: 'Quotes', icon: Send },
      { id: 'progress', label: 'Progress', icon: BarChart2 },
      { id: 'tasks', label: 'Tasks', icon: Calendar },
      { id: 'settings', label: 'Settings', icon: Settings }
    ],
    []
  );

  const renderOverview = () => (
    <div className="overview-section">
      <div className="data-table-wrapper">
        <table className="data-table">
        <thead>
          <tr>
            <th className="table-select">
              <label className="checkbox">
                <input type="checkbox" />
                <span />
              </label>
            </th>
            <th>Date</th>
            <th>Tenant</th>
            <th>Property</th>
            <th>Work Type</th>
            <th>Severity</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="loading">Loading overview data...</td>
            </tr>
          ) : maintenanceRequests.length === 0 ? (
            <tr>
              <td colSpan={8} className="loading">No maintenance requests found</td>
            </tr>
          ) : (
            maintenanceRequests.slice(0, 6).map(request => (
              <tr key={request.ID}>
                <td className="table-select">
                  <label className="checkbox">
                    <input type="checkbox" />
                    <span />
                  </label>
                </td>
                <td>{new Date(request.Date).toLocaleDateString()}</td>
                <td>
                  <span className="row-primary">{request.Tenant || 'Tenant'}</span>
                  <span className="row-secondary">{request.Email || 'tenant@example.com'}</span>
                </td>
                <td>
                  <span className="row-primary">{request.Property}</span>
                  <span className="row-secondary">Unit #{request.Unit || '1A'}</span>
                </td>
                <td>{request.Category || 'Plumbing'}</td>
                <td>
                  <span className={`severity-chip ${(request.Priority || 'Medium').toLowerCase()}`}>
                    {request.Priority || 'Medium'}
                  </span>
                </td>
                <td>
                  <button type="button" className="status-pill">
                    View
                  </button>
                </td>
                <td className="table-menu">
                  <button type="button" className="dots-button" aria-label="More options">
                    <MoreHorizontal size={20} />
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

  const renderInspections = () => (
    <div className="inspections-section panel">
      <div className="section-header">
        <h3>Property Inspections</h3>
        <p>Manage move-in, move-out, and routine inspections</p>
        <button 
          className="btn-primary"
          onClick={() => setShowInspectionModal(true)}
        >
          <CheckCircle size={16} />
          Add Inspection
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-row">
          <select className="filter-select">
            <option value="">All Inspection Types</option>
            <option value="move-in">Move-in</option>
            <option value="move-out">Move-out</option>
            <option value="routine">Routine</option>
            <option value="emergency">Emergency</option>
          </select>
          <select className="filter-select">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="scheduled">Scheduled</option>
            <option value="pending">Pending</option>
          </select>
          <select className="filter-select">
            <option value="">All Properties</option>
            <option value="123-main">123 Main St</option>
            <option value="456-oak">456 Oak Ave</option>
            <option value="789-pine">789 Pine Ln</option>
            <option value="321-elm">321 Elm St</option>
          </select>
          <select className="filter-select">
            <option value="">All Inspectors</option>
            <option value="john-tech">John Tech</option>
            <option value="jane-tech">Jane Tech</option>
            <option value="mike-tech">Mike Tech</option>
          </select>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Inspection Type</th>
              <th>Status</th>
              <th>Date</th>
              <th>Inspector</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inspections.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  No inspections found
                </td>
              </tr>
            ) : (
              inspections.map(inspection => (
                <tr key={inspection.ID}>
                  <td>{inspection.Property}</td>
                  <td>
                    <span className={`type-badge ${inspection.Type?.toLowerCase().replace('-', '-') || 'routine'}`}>
                      {inspection.Type || 'Routine'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${inspection.Status?.toLowerCase().replace(' ', '-') || 'pending'}`}>
                      {inspection.Status || 'Pending'}
                    </span>
                  </td>
                  <td>{new Date(inspection.Date).toLocaleDateString()}</td>
                  <td>{inspection.Inspector || 'Unassigned'}</td>
                  <td>{inspection.Notes || 'No notes'}</td>
                  <td>
                    <button className="table-action-button view">View</button>
                    <button className="table-action-button edit">Edit</button>
                    {inspection.Status === 'Scheduled' && (
                      <button className="table-action-button complete">Start</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="inspection-stats">
        <div className="stat-item">
          <span className="stat-label">Completed This Month</span>
          <span className="stat-value">18</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending Inspections</span>
          <span className="stat-value">5</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average Inspection Time</span>
          <span className="stat-value">2.5 hrs</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Issues Found</span>
          <span className="stat-value">12</span>
        </div>
      </div>
    </div>
  );

  const renderMaintenance = () => (
    <div className="maintenance-section panel">
      <div className="section-header">
        <h3>Maintenance & Repairs</h3>
        <p>Track maintenance tasks and repair work</p>
      </div>

      <div className="maintenance-filters">
        <select className="filter-select">
          <option value="">All Priority Levels</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="filter-select">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="pending">Pending</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <select className="filter-select">
          <option value="">All Properties</option>
          <option value="123-main">123 Main St</option>
          <option value="456-oak">456 Oak Ave</option>
          <option value="789-pine">789 Pine Ln</option>
          <option value="321-elm">321 Elm St</option>
        </select>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Issue</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Date</th>
              <th>Est. Hours</th>
              <th>Est. Cost</th>
              <th>Quote</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {maintenanceRequests.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>
                  No maintenance requests found
                </td>
              </tr>
            ) : (
              maintenanceRequests.map(maintenance => (
                <tr key={maintenance.ID}>
                  <td>{maintenance.Property}</td>
                  <td>{maintenance.Issue}</td>
                  <td>
                    <span className={`priority-badge ${maintenance.Priority?.toLowerCase() || 'medium'}`}>
                      {maintenance.Priority || 'Medium'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${maintenance.Status?.toLowerCase().replace(' ', '-') || 'pending'}`}>
                      {maintenance.Status || 'Pending'}
                    </span>
                  </td>
                  <td>{maintenance.Assigned || 'Unassigned'}</td>
                  <td>{new Date(maintenance.Date).toLocaleDateString()}</td>
                  <td>{maintenance.EstimatedHours || 0}h</td>
                  <td>${maintenance.EstimatedCost || 0}</td>
                  <td>
                    <span className={`quote-badge ${maintenance.QuoteGenerated ? 'generated' : 'pending'}`}>
                      {maintenance.QuoteGenerated ? 'Generated' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <button className="table-action-button view">View</button>
                    <button className="table-action-button edit">Edit</button>
                    {!maintenance.QuoteGenerated && (
                      <button className="table-action-button quote">Generate Quote</button>
                    )}
                    {maintenance.Status === 'Pending' && (
                      <button className="table-action-button start">Start</button>
                    )}
                    {maintenance.QuoteGenerated && (
                      <>
                        <button className="table-action-button edit" title="Submit to Management" onClick={() => {
                          const q = { id: Date.now(), maintenanceId: maintenance.ID, property: maintenance.Property, issue: maintenance.Issue, amount: maintenance.EstimatedCost, recipient: 'Management', date: new Date().toLocaleDateString(), status: 'Sent' };
                          setQuotes(prev => [q, ...prev]);
                        }}>To Mgmt</button>
                        <button className="table-action-button edit" title="Submit to Owner" onClick={() => {
                          const q = { id: Date.now()+1, maintenanceId: maintenance.ID, property: maintenance.Property, issue: maintenance.Issue, amount: maintenance.EstimatedCost, recipient: 'Owner', date: new Date().toLocaleDateString(), status: 'Sent' };
                          setQuotes(prev => [q, ...prev]);
                        }}>To Owner</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="maintenance-summary">
        <div className="summary-card">
          <h4>Total Hours This Month</h4>
          <span className="amount">45.5h</span>
        </div>
        <div className="summary-card">
          <h4>Completed Tasks</h4>
          <span className="amount">28</span>
        </div>
        <div className="summary-card">
          <h4>Average Completion Time</h4>
          <span className="amount">2.1 days</span>
        </div>
        <div className="summary-card">
          <h4>Total Cost of Ongoing Repairs</h4>
          <span className="amount">$1,200</span>
        </div>
      </div>
    </div>
  );

  const renderInventories = () => (
    <div className="inspections-section panel">
      <div className="section-header">
        <h3>Move-in and Move-out Inventories</h3>
        <p>Create and manage detailed inventory reports</p>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Date</th>
              <th>Inspector</th>
              <th>Report</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inspections.filter(i => i.Type === 'Move-in' || i.Type === 'Move-out').length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  No inventory inspections found
                </td>
              </tr>
            ) : (
              inspections.filter(i => i.Type === 'Move-in' || i.Type === 'Move-out').map(inv => (
                <tr key={`inv-${inv.ID}`}>
                  <td>{inv.Property}</td>
                  <td>
                    <span className={`type-badge ${inv.Type?.toLowerCase().replace(' ', '-') || 'move-in'}`}>{inv.Type || 'Move-in'}</span>
                  </td>
                  <td>{new Date(inv.Date).toLocaleDateString()}</td>
                  <td>{inv.Inspector || 'Unassigned'}</td>
                  <td>
                    <button className="table-action-button view">View</button>
                  </td>
                  <td>
                    <button className="table-action-button edit">Edit</button>
                    <button className="table-action-button quote">Generate Report</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="inspections-section panel">
      <div className="section-header">
        <h3>Tenant Requests (Mail Inbox)</h3>
        <p>Receive and triage tenant maintenance requests</p>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Tenant</th>
              <th>Email</th>
              <th>Property</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id}>
                <td>{req.date}</td>
                <td>{req.tenant}</td>
                <td><Mail size={14} /> {req.email}</td>
                <td>{req.property}</td>
                <td>{req.subject}</td>
                <td>
                  <span className={`status-badge ${req.status.toLowerCase()}`}>{req.status}</span>
                </td>
                <td>
                  <button className="table-action-button view" onClick={() => setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Read' } : r))}>Mark Read</button>
                  <button className="table-action-button edit">Assign</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderQuotes = () => (
    <div className="inspections-section panel">
      <div className="section-header">
        <h3>Submitted Quotes</h3>
        <p>Track quotes sent to management and owners</p>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Recipient</th>
              <th>Property</th>
              <th>Issue</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map(q => (
              <tr key={q.id}>
                <td>{q.date}</td>
                <td>{q.recipient}</td>
                <td>{q.property}</td>
                <td>{q.issue}</td>
                <td>{q.amount} XOF</td>
                <td><span className="status-badge completed">{q.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="inspections-section panel">
      <div className="section-header">
        <h3>Work Progress Report</h3>
        <p>Monitor progress of ongoing maintenance tasks</p>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Issue</th>
              <th>Status</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {maintenanceRequests.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                  No maintenance requests found
                </td>
              </tr>
            ) : (
              maintenanceRequests.map(m => (
                <tr key={`prog-${m.ID}`}>
                  <td>{m.Property}</td>
                  <td>{m.Issue}</td>
                  <td><span className={`status-badge ${m.Status?.toLowerCase().replace(' ', '-') || 'pending'}`}>{m.Status || 'Pending'}</span></td>
                  <td>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: m.Status === 'Completed' ? '100%' : m.Status === 'In Progress' ? '60%' : m.Status === 'Scheduled' ? '20%' : '10%' }} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="tasks-section panel">
      <div className="section-header">
        <h3>Task Management</h3>
        <p>Manage scheduled tasks and maintenance calendar</p>
      </div>

      <div className="task-filters">
        <select className="filter-select">
          <option value="">All Priority Levels</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="filter-select">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="pending">Pending</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <input 
          type="date" 
          className="filter-select"
          placeholder="Due Date"
        />
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Property</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Est. Hours</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  No tasks found
                </td>
              </tr>
            ) : (
              tasks.map(task => (
                <tr key={task.ID}>
                  <td>{task.Issue || 'Maintenance Task'}</td>
                  <td>{task.Property}</td>
                  <td>
                    <span className={`priority-badge ${task.Priority?.toLowerCase() || 'medium'}`}>
                      {task.Priority || 'Medium'}
                    </span>
                  </td>
                  <td>{new Date(task.Date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${task.Status?.toLowerCase().replace(' ', '-') || 'pending'}`}>
                      {task.Status || 'Pending'}
                    </span>
                  </td>
                  <td>{task.EstimatedHours || 0}h</td>
                  <td>
                    <button 
                      className="table-action-button view"
                      onClick={() => handleTaskView(task)}
                    >
                      View
                    </button>
                    <button 
                      className="table-action-button edit"
                      onClick={() => handleTaskView(task)}
                    >
                      Edit
                    </button>
                    {task.Status !== 'Completed' && (
                      <button 
                        className="table-action-button complete"
                        onClick={() => handleTaskComplete(task)}
                        disabled={loading}
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="task-calendar">
        <h4>Upcoming Tasks</h4>
        <div className="calendar-items">
          <div className="calendar-item">
            <div className="calendar-date">
              <span className="day">21</span>
              <span className="month">Nov</span>
            </div>
            <div className="calendar-content">
              <h5>Fire Safety Check - 789 Pine Ln</h5>
              <p>Urgent • 3 hours estimated</p>
            </div>
            <button className="btn-primary">Start</button>
          </div>
          <div className="calendar-item">
            <div className="calendar-date">
              <span className="day">22</span>
              <span className="month">Nov</span>
            </div>
            <div className="calendar-content">
              <h5>Safety Equipment Inspection - 456 Oak Ave</h5>
              <p>High • 1 hour estimated</p>
            </div>
            <button className="btn-secondary">Schedule</button>
          </div>
          <div className="calendar-item">
            <div className="calendar-date">
              <span className="day">25</span>
              <span className="month">Nov</span>
            </div>
            <div className="calendar-content">
              <h5>Monthly HVAC Check - 123 Main St</h5>
              <p>Medium • 2 hours estimated</p>
            </div>
            <button className="btn-secondary">Schedule</button>
          </div>
        </div>
      </div>
    </div>
  );

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
      case 'requests':
        return renderRequests();
      case 'quotes':
        return renderQuotes();
      case 'progress':
        return renderProgress();
      case 'tasks':
        return renderTasks();
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
        {({ activeId }) => {
          const currentTab = activeId || activeTab;
          return (
            <>
              {currentTab === 'overview' && (
                <div className="dashboard-overview">
                  <div className="overview-card">
                    <div className="card-label">
                      <span>Quotes Created</span>
                      <span className="card-trend positive">
                        <CheckCircle size={16} />
                        {overviewData?.trendQuotes || '+10.6%'}
                      </span>
                    </div>
                    <div className="card-value">
                      <span>{overviewData?.quotes || 23}</span>
                      <small>This month</small>
                    </div>
                  </div>
                  <div className="overview-card">
                    <div className="card-label">
                      <span>Jobs In Progress</span>
                      <span className="card-trend positive">
                        <Wrench size={16} />
                        {overviewData?.trendJobs || '+14.2%'}
                      </span>
                    </div>
                    <div className="card-value">
                      <span>{overviewData?.activeMaintenance || 8}</span>
                      <small>Current workload</small>
                    </div>
                  </div>
                  <div className="overview-card">
                    <div className="card-label">
                      <span>Repair Requests</span>
                      <span className="card-trend neutral">
                        <AlertTriangle size={16} />
                        {overviewData?.trendRepairs || 'This week'}
                      </span>
                    </div>
                    <div className="card-value">
                      <span>{overviewData?.repairRequests || 72}</span>
                      <small>Awaiting review</small>
                    </div>
                  </div>
                  <div className="overview-card">
                    <div className="card-label">
                      <span>Portfolio Assets</span>
                      <span className="card-trend positive">
                        <Building size={16} />
                        {overviewData?.trendPortfolio || '+14.2%'}
                      </span>
                    </div>
                    <div className="card-value">
                      <span>{overviewData?.portfolio || 100}</span>
                      <small>Managed units</small>
                    </div>
                  </div>
                </div>
              )}

              <div className="content-body">
                {renderContent(currentTab)}
              </div>
            </>
          );
        }}
      </RoleLayout>

      {/* Add Inspection Modal */}
      {showInspectionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Inspection</h3>
              <button 
                className="modal-close"
                onClick={() => setShowInspectionModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleInspectionSubmit} className="modal-form">
              <div className="form-group">
                <label>Property</label>
                <input
                  type="text"
                  value={inspectionForm.property}
                  onChange={(e) => setInspectionForm({...inspectionForm, property: e.target.value})}
                  placeholder="Enter property address"
                  required
                />
              </div>
              <div className="form-group">
                <label>Inspection Type</label>
                <select
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
              <div className="form-group">
                <label>Inspector</label>
                <input
                  type="text"
                  value={inspectionForm.inspector}
                  onChange={(e) => setInspectionForm({...inspectionForm, inspector: e.target.value})}
                  placeholder="Enter inspector name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={inspectionForm.notes}
                  onChange={(e) => setInspectionForm({...inspectionForm, notes: e.target.value})}
                  placeholder="Enter inspection notes"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowInspectionModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Management Modal */}
      {showTaskModal && selectedTask && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Task Details - {selectedTask.Issue || 'Maintenance Task'}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowTaskModal(false);
                  setSelectedTask(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleTaskUpdate} className="modal-form">
              <div className="form-group">
                <label>Property</label>
                <input
                  type="text"
                  value={selectedTask.Property}
                  disabled
                  className="disabled-input"
                />
              </div>
              <div className="form-group">
                <label>Issue</label>
                <textarea
                  value={selectedTask.Issue || 'Maintenance Task'}
                  disabled
                  className="disabled-input"
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <input
                  type="text"
                  value={selectedTask.Priority || 'Medium'}
                  disabled
                  className="disabled-input"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Estimated Hours</label>
                <input
                  type="number"
                  value={taskForm.estimatedHours}
                  onChange={(e) => setTaskForm({...taskForm, estimatedHours: parseFloat(e.target.value) || 0})}
                  min="0"
                  step="0.5"
                />
              </div>
              <div className="form-group">
                <label>Estimated Cost ($)</label>
                <input
                  type="number"
                  value={taskForm.estimatedCost}
                  onChange={(e) => setTaskForm({...taskForm, estimatedCost: parseFloat(e.target.value) || 0})}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedTask(null);
                  }}
                >
                  Close
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TechnicianDashboard;