import React, { useState } from 'react';
import { Home, Users, Calendar, TrendingUp, Plus, Eye, CheckCircle } from 'lucide-react';
import './SalesDashboard.css';

const SalesDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'listings', label: 'Listings', icon: Home },
    { id: 'visits', label: 'Visits', icon: Calendar },
    { id: 'requests', label: 'Requests', icon: Users }
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card modern-card">
          <h3>Total Properties Listed</h3>
          <p>Active listings</p>
          <span className="stat-value">24</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Visits Scheduled</h3>
          <p>Today / This week</p>
          <span className="stat-value">5 / 12</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Visit → Lease Conversion</h3>
          <p>Conversion rate</p>
          <span className="stat-value">35%</span>
        </div>
        <div className="stat-card modern-card">
          <h3>Pending Requests</h3>
          <p>Awaiting approval</p>
          <span className="stat-value">8</span>
        </div>
      </div>
      
      <div className="filters-section">
        <h4>Property Filters</h4>
        <div className="filter-row">
          <select className="filter-select">
            <option value="">All Cities</option>
            <option value="paris">Paris</option>
            <option value="lyon">Lyon</option>
            <option value="marseille">Marseille</option>
          </select>
          <select className="filter-select">
            <option value="">All Districts</option>
            <option value="1st">1st Arrondissement</option>
            <option value="2nd">2nd Arrondissement</option>
            <option value="3rd">3rd Arrondissement</option>
          </select>
          <select className="filter-select">
            <option value="">All Property Types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="studio">Studio</option>
          </select>
          <select className="filter-select">
            <option value="">All Price Ranges</option>
            <option value="0-1000">€0 - €1,000</option>
            <option value="1000-2000">€1,000 - €2,000</option>
            <option value="2000+">€2,000+</option>
          </select>
          <select className="filter-select">
            <option value="">All Availability</option>
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderListings = () => (
    <div className="listings-section">
      <div className="section-header">
        <h3>Property Listings</h3>
        <p>Manage your property listings and availability</p>
      </div>
      
      <div className="listing-actions">
        <button className="action-button primary">
          <Plus size={20} />
          Add New Listing
        </button>
      </div>

      <div className="listing-filters">
        <select className="filter-select">
          <option value="">All Properties</option>
          <option value="apartment">Apartments</option>
          <option value="house">Houses</option>
          <option value="studio">Studios</option>
        </select>
        <select className="filter-select">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Under Maintenance</option>
        </select>
      </div>

      <div className="listing-list">
        <div className="listing-item">
          <div className="listing-image">
            <div className="placeholder-image">123 Main St</div>
          </div>
          <div className="listing-info">
            <h4>123 Main Street</h4>
            <p>3 Bedroom, 2 Bathroom Apartment</p>
            <div className="listing-details">
              <span className="price">$1,200/month</span>
              <span className="status available">Available</span>
            </div>
            <div className="listing-actions">
              <button className="btn-secondary">
                <Eye size={16} />
                View Details
              </button>
              <button className="btn-primary">
                Edit Listing
              </button>
            </div>
          </div>
        </div>
        <div className="listing-item">
          <div className="listing-image">
            <div className="placeholder-image">456 Oak Ave</div>
          </div>
          <div className="listing-info">
            <h4>456 Oak Avenue</h4>
            <p>2 Bedroom, 1 Bathroom House</p>
            <div className="listing-details">
              <span className="price">$900/month</span>
              <span className="status occupied">Occupied</span>
            </div>
            <div className="listing-actions">
              <button className="btn-secondary">
                <Eye size={16} />
                View Details
              </button>
              <button className="btn-primary">
                Edit Listing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVisits = () => (
    <div className="visits-section">
      <div className="section-header">
        <h3>Visit Management</h3>
        <p>Schedule and manage property visits</p>
      </div>
      
      <div className="visit-actions">
        <button className="action-button primary">
          <Plus size={20} />
          Schedule New Visit
        </button>
      </div>

      <div className="visit-calendar">
        <h4>Today's Visits</h4>
        <div className="visit-item">
          <div className="visit-time">10:00 AM</div>
          <div className="visit-info">
            <span className="property">123 Main Street</span>
            <span className="client">John Doe</span>
          </div>
          <div className="visit-status scheduled">Scheduled</div>
        </div>
        <div className="visit-item">
          <div className="visit-time">2:00 PM</div>
          <div className="visit-info">
            <span className="property">456 Oak Avenue</span>
            <span className="client">Jane Smith</span>
          </div>
          <div className="visit-status completed">Completed</div>
        </div>
      </div>

      <div className="visit-stats">
        <div className="stat-item">
          <span className="stat-label">This Week</span>
          <span className="stat-value">12 visits</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Conversion Rate</span>
          <span className="stat-value">35%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending Follow-ups</span>
          <span className="stat-value">5</span>
        </div>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="requests-section">
      <div className="section-header">
        <h3>Visit Requests</h3>
        <p>Manage incoming visit requests from potential tenants</p>
      </div>
      
      <div className="request-filters">
        <select className="filter-select">
          <option value="">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="filter-select">
          <option value="">All Properties</option>
          <option value="123-main">123 Main Street</option>
          <option value="456-oak">456 Oak Avenue</option>
        </select>
      </div>

      <div className="request-list">
        <div className="request-item">
          <div className="request-header">
            <div className="request-info">
              <h4>Mike Johnson</h4>
              <p>123 Main Street - 3 Bedroom Apartment</p>
                </div>
            <div className="request-date">Nov 20, 2024</div>
                </div>
          <div className="request-details">
            <p>Interested in viewing the property this weekend. Prefers afternoon visits.</p>
            <div className="request-actions">
              <button className="btn-success">
                <CheckCircle size={16} />
                Approve
              </button>
              <button className="btn-secondary">
                View Details
              </button>
                </div>
                </div>
              </div>
        <div className="request-item">
          <div className="request-header">
            <div className="request-info">
              <h4>Sarah Wilson</h4>
              <p>456 Oak Avenue - 2 Bedroom House</p>
            </div>
            <div className="request-date">Nov 19, 2024</div>
          </div>
          <div className="request-details">
            <p>Looking for a pet-friendly property. Has 2 cats.</p>
            <div className="request-actions">
              <button className="btn-success">
                <CheckCircle size={16} />
                Approve
                  </button>
              <button className="btn-secondary">
                View Details
                  </button>
            </div>
          </div>
              </div>
            </div>
          </div>
        );
      
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'listings':
        return renderListings();
      case 'visits':
        return renderVisits();
      case 'requests':
        return renderRequests();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="sales-dashboard">
      <div className="dashboard-header modern-container">
        <h1>Sales Dashboard</h1>
        <p>Manage property listings, visits, and client relationships</p>
      </div>
      
      <div className="dashboard-tabs modern-container">
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

      <div className="dashboard-content modern-container">
        {renderContent()}
      </div>
    </div>
  );
};

export default SalesDashboard;
