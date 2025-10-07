import React, { useState } from 'react';
import { Settings, Database, Bell, TrendingUp, RefreshCw, AlertTriangle } from 'lucide-react';
import './SystemDashboard.css';

const SystemDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'automation', label: 'Automation', icon: Settings },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'kpis', label: 'Real-time KPIs', icon: Database }
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Global Occupancy Rate</h3>
            <p>Properties occupied</p>
            <span className="stat-value">84%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Properties Under Management</h3>
            <p>Active properties</p>
            <span className="stat-value">156</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Bell size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Collected Revenue</h3>
            <p>This month</p>
            <span className="stat-value">$245,600</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Active Alerts</h3>
            <p>System alerts</p>
            <span className="stat-value">12</span>
          </div>
        </div>
      </div>

      <div className="automation-status">
        <h3>Automation Status</h3>
        <div className="status-list">
          <div className="status-item active">
            <div className="status-indicator"></div>
            <div className="status-content">
              <h4>Auto-calculate Landlord Payouts</h4>
              <p>Automatically calculating and processing landlord payments</p>
            </div>
            <span className="status-badge active">Active</span>
          </div>
          <div className="status-item active">
            <div className="status-indicator"></div>
            <div className="status-content">
              <h4>Auto-deduct Company Commission</h4>
              <p>Automatically deducting commission from landlord payments</p>
            </div>
            <span className="status-badge active">Active</span>
          </div>
          <div className="status-item active">
            <div className="status-indicator"></div>
            <div className="status-content">
              <h4>Generate Alerts</h4>
              <p>Monitoring and generating alerts for critical events</p>
            </div>
            <span className="status-badge active">Active</span>
          </div>
          <div className="status-item active">
            <div className="status-indicator"></div>
            <div className="status-content">
              <h4>Real-time KPIs Update</h4>
              <p>Updating key performance indicators in real-time</p>
            </div>
            <span className="status-badge active">Active</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAutomation = () => (
    <div className="automation-section">
      <div className="section-header">
        <h3>Automation & Processing</h3>
        <p>Manage automated workflows and system processes</p>
      </div>

      <div className="automation-grid">
        <div className="automation-card">
          <div className="card-header">
            <h4>Auto-calculate Landlord Payouts</h4>
            <div className="status-indicator active">Active</div>
          </div>
          <p>Automatically calculate net payouts to landlords after commission deduction</p>
          <div className="card-stats">
            <span>Processed: 45 this month</span>
            <span>Total Amount: $125,400</span>
            <span>Commission Deducted: $13,900</span>
          </div>
          <div className="card-actions">
            <button className="action-button primary">
              <RefreshCw size={16} />
              Run Now
            </button>
            <button className="action-button secondary">Configure</button>
          </div>
        </div>

        <div className="automation-card">
          <div className="card-header">
            <h4>Auto-deduct Company Commission</h4>
            <div className="status-indicator active">Active</div>
          </div>
          <p>Automatically deduct company commission from collected payments</p>
          <div className="card-stats">
            <span>Deductions: 156 this month</span>
            <span>Total Commission: $24,560</span>
            <span>Average Rate: 10%</span>
          </div>
          <div className="card-actions">
            <button className="action-button primary">
              <RefreshCw size={16} />
              Run Now
            </button>
            <button className="action-button secondary">Configure</button>
          </div>
        </div>

        <div className="automation-card">
          <div className="card-header">
            <h4>Auto-generated Financial Reports</h4>
            <div className="status-indicator active">Active</div>
          </div>
          <p>Generate monthly financial reports automatically</p>
          <div className="card-stats">
            <span>Generated: 12 reports</span>
            <span>Last Run: Nov 1, 2024</span>
            <span>Next Run: Dec 1, 2024</span>
          </div>
          <div className="card-actions">
            <button className="action-button primary">
              <RefreshCw size={16} />
              Generate Now
            </button>
            <button className="action-button secondary">Schedule</button>
          </div>
        </div>

        <div className="automation-card">
          <div className="card-header">
            <h4>Notifications to All Services</h4>
            <div className="status-indicator active">Active</div>
          </div>
          <p>Send notifications to all relevant services and stakeholders</p>
          <div className="card-stats">
            <span>Notifications Sent: 89</span>
            <span>Success Rate: 98%</span>
            <span>Last Sent: 2 hours ago</span>
          </div>
          <div className="card-actions">
            <button className="action-button primary">
              <RefreshCw size={16} />
              Send Test
            </button>
            <button className="action-button secondary">Configure</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="alerts-section">
      <div className="section-header">
        <h3>System Alerts & Notifications</h3>
        <p>Monitor and manage system-generated alerts</p>
      </div>

      <div className="alert-filters">
        <select className="filter-select">
          <option value="">All Alert Types</option>
          <option value="financial">Financial</option>
          <option value="occupancy">Occupancy</option>
          <option value="maintenance">Maintenance</option>
          <option value="system">System</option>
        </select>
        <select className="filter-select">
          <option value="">All Severity Levels</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select className="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="acknowledged">Acknowledged</option>
        </select>
      </div>

      <div className="alert-list">
        <div className="alert-item critical">
          <div className="alert-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="alert-content">
            <h4>Low Occupancy Rate Alert</h4>
            <p>Building 456 Oak Ave has been vacant for 30+ days</p>
            <span className="alert-timestamp">2 hours ago</span>
          </div>
          <div className="alert-actions">
            <button className="btn-primary">Acknowledge</button>
            <button className="btn-secondary">Resolve</button>
          </div>
        </div>

        <div className="alert-item warning">
          <div className="alert-icon">
            <Bell size={24} />
          </div>
          <div className="alert-content">
            <h4>Pending Payment Alert</h4>
            <p>3 tenants have overdue payments totaling $5,400</p>
            <span className="alert-timestamp">4 hours ago</span>
          </div>
          <div className="alert-actions">
            <button className="btn-primary">Acknowledge</button>
            <button className="btn-secondary">Resolve</button>
          </div>
        </div>

        <div className="alert-item info">
          <div className="alert-icon">
            <TrendingUp size={24} />
          </div>
          <div className="alert-content">
            <h4>Monthly Report Generated</h4>
            <p>November 2024 financial report has been generated successfully</p>
            <span className="alert-timestamp">1 day ago</span>
          </div>
          <div className="alert-actions">
            <button className="btn-secondary">View Report</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderKPIs = () => (
    <div className="kpis-section">
      <div className="section-header">
        <h3>Real-time Key Performance Indicators</h3>
        <p>Live updates of critical business metrics</p>
      </div>

      <div className="kpis-grid">
        <div className="kpi-card">
          <h4>Global Occupancy Rate</h4>
          <div className="kpi-value">84%</div>
          <div className="kpi-trend positive">+2.3% from last month</div>
          <div className="kpi-details">
            <span>Occupied: 131</span>
            <span>Vacant: 25</span>
          </div>
        </div>

        <div className="kpi-card">
          <h4>Total Properties Under Management</h4>
          <div className="kpi-value">156</div>
          <div className="kpi-trend positive">+5 new this month</div>
          <div className="kpi-details">
            <span>Active: 156</span>
            <span>Inactive: 3</span>
          </div>
        </div>

        <div className="kpi-card">
          <h4>Total Collected Revenue</h4>
          <div className="kpi-value">$245,600</div>
          <div className="kpi-trend positive">+8.2% from last month</div>
          <div className="kpi-details">
            <span>This Month: $245,600</span>
            <span>Last Month: $227,000</span>
          </div>
        </div>

        <div className="kpi-card">
          <h4>Total Active Alerts</h4>
          <div className="kpi-value">12</div>
          <div className="kpi-trend negative">+3 from yesterday</div>
          <div className="kpi-details">
            <span>Critical: 2</span>
            <span>Warning: 5</span>
            <span>Info: 5</span>
          </div>
        </div>
      </div>

      <div className="kpi-refresh">
        <button className="action-button primary">
          <RefreshCw size={20} />
          Refresh All KPIs
        </button>
        <span className="last-updated">Last updated: 2 minutes ago</span>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'automation':
        return renderAutomation();
      case 'alerts':
        return renderAlerts();
      case 'kpis':
        return renderKPIs();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="system-dashboard">
      <div className="dashboard-header">
        <h1>System Dashboard (Automation)</h1>
        <p>Automated workflows, alerts, and real-time KPI monitoring</p>
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

export default SystemDashboard;