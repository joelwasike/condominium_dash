import React, { useState } from 'react';
import { Wrench, CheckCircle, AlertTriangle, Building, Calendar, User, Clock } from 'lucide-react';
import './TechnicianDashboard.css';

const TechnicianDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'inspections', label: 'Inspections', icon: CheckCircle },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'tasks', label: 'Tasks', icon: Calendar }
  ];

  const mockInspections = [
    { id: 1, property: '123 Main St, Apt 4B', type: 'Move-in', status: 'Completed', date: '2024-11-20', inspector: 'John Tech', notes: 'All systems functional' },
    { id: 2, property: '456 Oak Ave, Unit 2', type: 'Move-out', status: 'Scheduled', date: '2024-11-22', inspector: 'Jane Tech', notes: 'Scheduled for 10 AM' },
    { id: 3, property: '789 Pine Ln', type: 'Routine', status: 'In Progress', date: '2024-11-21', inspector: 'Mike Tech', notes: 'Checking HVAC system' },
    { id: 4, property: '321 Elm St, Apt 1A', type: 'Emergency', status: 'Completed', date: '2024-11-19', inspector: 'John Tech', notes: 'Fixed water leak' },
  ];

  const mockMaintenance = [
    { id: 1, property: '123 Main St, Apt 4B', issue: 'HVAC Maintenance', priority: 'High', status: 'In Progress', assigned: 'John Tech', date: '2024-11-21', estimatedHours: 4, estimatedCost: 450, quoteGenerated: true },
    { id: 2, property: '456 Oak Ave, Unit 2', issue: 'Plumbing Repair', priority: 'Urgent', status: 'Pending', assigned: 'Jane Tech', date: '2024-11-22', estimatedHours: 2, estimatedCost: 320, quoteGenerated: false },
    { id: 3, property: '789 Pine Ln', issue: 'Electrical Inspection', priority: 'Medium', status: 'Completed', assigned: 'Mike Tech', date: '2024-11-20', estimatedHours: 3, estimatedCost: 280, quoteGenerated: true },
    { id: 4, property: '321 Elm St, Apt 1A', issue: 'Appliance Repair', priority: 'Low', status: 'Scheduled', assigned: 'John Tech', date: '2024-11-23', estimatedHours: 1, estimatedCost: 150, quoteGenerated: false },
  ];

  const mockTasks = [
    { id: 1, title: 'Monthly HVAC Check', property: '123 Main St, Apt 4B', priority: 'Medium', dueDate: '2024-11-25', status: 'Pending', estimatedHours: 2 },
    { id: 2, title: 'Safety Equipment Inspection', property: '456 Oak Ave, Unit 2', priority: 'High', dueDate: '2024-11-22', status: 'In Progress', estimatedHours: 1 },
    { id: 3, title: 'Fire Safety Check', property: '789 Pine Ln', priority: 'Urgent', dueDate: '2024-11-21', status: 'Pending', estimatedHours: 3 },
    { id: 4, title: 'Quarterly Deep Clean', property: '321 Elm St, Apt 1A', priority: 'Low', dueDate: '2024-11-30', status: 'Scheduled', estimatedHours: 4 },
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Inspections Completed</h3>
            <p>This month</p>
            <span className="stat-value">18</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Wrench size={24} />
          </div>
          <div className="stat-content">
            <h3>Maintenance Tasks</h3>
            <p>Active assignments</p>
            <span className="stat-value">12</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>Urgent Issues</h3>
            <p>Requires immediate attention</p>
            <span className="stat-value">3</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>Average Resolution Time</h3>
            <p>Days to complete</p>
            <span className="stat-value">2.1</span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-button primary">
            <CheckCircle size={20} />
            Schedule Inspection
          </button>
          <button className="action-button secondary">
            <Wrench size={20} />
            Report Maintenance
          </button>
          <button className="action-button secondary">
            <AlertTriangle size={20} />
            Emergency Repair
          </button>
          <button className="action-button secondary">
            <Calendar size={20} />
            View Calendar
          </button>
        </div>
      </div>
    </div>
  );

  const renderInspections = () => (
    <div className="inspections-section">
      <div className="section-header">
        <h3>Property Inspections</h3>
        <p>Manage move-in, move-out, and routine inspections</p>
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

      <div className="inspections-table">
        <table>
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
            {mockInspections.map(inspection => (
              <tr key={inspection.id}>
                <td>{inspection.property}</td>
                <td>
                  <span className={`type-badge ${inspection.type.toLowerCase().replace('-', '-')}`}>
                    {inspection.type}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${inspection.status.toLowerCase().replace(' ', '-')}`}>
                    {inspection.status}
                  </span>
                </td>
                <td>{inspection.date}</td>
                <td>{inspection.inspector}</td>
                <td>{inspection.notes}</td>
                <td>
                  <button className="table-action-button view">View</button>
                  <button className="table-action-button edit">Edit</button>
                  {inspection.status === 'Scheduled' && (
                    <button className="table-action-button complete">Start</button>
                  )}
                </td>
              </tr>
            ))}
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
    <div className="maintenance-section">
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

      <div className="maintenance-table">
        <table>
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
            {mockMaintenance.map(maintenance => (
              <tr key={maintenance.id}>
                <td>{maintenance.property}</td>
                <td>{maintenance.issue}</td>
                <td>
                  <span className={`priority-badge ${maintenance.priority.toLowerCase()}`}>
                    {maintenance.priority}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${maintenance.status.toLowerCase().replace(' ', '-')}`}>
                    {maintenance.status}
                  </span>
                </td>
                <td>{maintenance.assigned}</td>
                <td>{maintenance.date}</td>
                <td>{maintenance.estimatedHours}h</td>
                <td>${maintenance.estimatedCost}</td>
                <td>
                  <span className={`quote-badge ${maintenance.quoteGenerated ? 'generated' : 'pending'}`}>
                    {maintenance.quoteGenerated ? 'Generated' : 'Pending'}
                  </span>
                </td>
                <td>
                  <button className="table-action-button view">View</button>
                  <button className="table-action-button edit">Edit</button>
                  {!maintenance.quoteGenerated && (
                    <button className="table-action-button quote">Generate Quote</button>
                  )}
                  {maintenance.status === 'Pending' && (
                    <button className="table-action-button start">Start</button>
                  )}
                </td>
              </tr>
            ))}
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

  const renderTasks = () => (
    <div className="tasks-section">
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

      <div className="tasks-table">
        <table>
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
            {mockTasks.map(task => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.property}</td>
                <td>
                  <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </td>
                <td>{task.dueDate}</td>
                <td>
                  <span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                    {task.status}
                  </span>
                </td>
                <td>{task.estimatedHours}h</td>
                <td>
                  <button className="table-action-button view">View</button>
                  <button className="table-action-button edit">Edit</button>
                  <button className="table-action-button complete">Complete</button>
                </td>
              </tr>
            ))}
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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'inspections':
        return renderInspections();
      case 'maintenance':
        return renderMaintenance();
      case 'tasks':
        return renderTasks();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="technician-dashboard">
      <div className="dashboard-header">
        <h1>Technical Manager Dashboard</h1>
        <p>Manage inspections, maintenance, and technical tasks</p>
      </div>

      <div className="dashboard-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="dashboard-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default TechnicianDashboard;