import React, { useState } from 'react';
import { Home, Users, Calendar, TrendingUp, Plus, Eye, CheckCircle } from 'lucide-react';
import './SalesDashboard.css';

const SalesDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [showEditListingModal, setShowEditListingModal] = useState(false);
  const [showScheduleVisitModal, setShowScheduleVisitModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleAddListing = (listingData) => {
    console.log('New listing added:', listingData);
    addNotification('Listing added successfully!', 'success');
    setShowAddListingModal(false);
  };

  const handleEditListing = (listingData) => {
    console.log('Listing updated:', listingData);
    addNotification('Listing updated successfully!', 'success');
    setShowEditListingModal(false);
    setSelectedListing(null);
  };

  const handleScheduleVisit = (visitData) => {
    console.log('Visit scheduled:', visitData);
    addNotification('Visit scheduled successfully!', 'success');
    setShowScheduleVisitModal(false);
  };

  const openEditListing = (listing) => {
    setSelectedListing(listing);
    setShowEditListingModal(true);
  };


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
        <button className="action-button primary" onClick={() => setShowAddListingModal(true)}>
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
              <button className="btn-primary" onClick={() => openEditListing({ id: 1, address: '123 Main Street', type: '3 Bedroom, 2 Bathroom Apartment', price: '$1,200/month', status: 'Available' })}>
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
              <button className="btn-primary" onClick={() => openEditListing({ id: 2, address: '456 Oak Avenue', type: '2 Bedroom, 1 Bathroom House', price: '$900/month', status: 'Occupied' })}>
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
        <button className="action-button primary" onClick={() => setShowScheduleVisitModal(true)}>
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
        <h1>Commercial Dashboard</h1>
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

      {/* Notification System */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>×</button>
          </div>
        ))}
      </div>

      {/* Add Listing Modal */}
      {showAddListingModal && (
        <div className="modal-overlay" onClick={() => setShowAddListingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Listing</h3>
              <button className="modal-close" onClick={() => setShowAddListingModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const listingData = {
                  address: formData.get('address'),
                  type: formData.get('type'),
                  bedrooms: formData.get('bedrooms'),
                  bathrooms: formData.get('bathrooms'),
                  price: formData.get('price'),
                  description: formData.get('description'),
                  status: formData.get('status')
                };
                handleAddListing(listingData);
              }}>
                <div className="form-group">
                  <label>Property Address</label>
                  <input type="text" name="address" required placeholder="e.g., 123 Main Street" />
                </div>
                <div className="form-group">
                  <label>Property Type</label>
                  <select name="type" required>
                    <option value="">Select Type</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="studio">Studio</option>
                    <option value="condo">Condo</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Bedrooms</label>
                    <input type="number" name="bedrooms" min="0" required />
                  </div>
                  <div className="form-group">
                    <label>Bathrooms</label>
                    <input type="number" name="bathrooms" min="0" step="0.5" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Monthly Rent</label>
                  <input type="text" name="price" required placeholder="e.g., $1,200/month" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" required>
                    <option value="">Select Status</option>
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Under Maintenance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" rows="4" placeholder="Describe the property features, amenities, etc."></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowAddListingModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary">
                    Add Listing
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {showEditListingModal && (
        <div className="modal-overlay" onClick={() => setShowEditListingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Listing</h3>
              <button className="modal-close" onClick={() => setShowEditListingModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const listingData = {
                  id: selectedListing.id,
                  address: formData.get('address'),
                  type: formData.get('type'),
                  bedrooms: formData.get('bedrooms'),
                  bathrooms: formData.get('bathrooms'),
                  price: formData.get('price'),
                  description: formData.get('description'),
                  status: formData.get('status')
                };
                handleEditListing(listingData);
              }}>
                <div className="form-group">
                  <label>Property Address</label>
                  <input type="text" name="address" defaultValue={selectedListing?.address} required />
                </div>
                <div className="form-group">
                  <label>Property Type</label>
                  <select name="type" defaultValue={selectedListing?.type?.includes('Apartment') ? 'apartment' : 'house'} required>
                    <option value="">Select Type</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="studio">Studio</option>
                    <option value="condo">Condo</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Bedrooms</label>
                    <input type="number" name="bedrooms" min="0" defaultValue={selectedListing?.type?.includes('3 Bedroom') ? '3' : '2'} required />
                  </div>
                  <div className="form-group">
                    <label>Bathrooms</label>
                    <input type="number" name="bathrooms" min="0" step="0.5" defaultValue={selectedListing?.type?.includes('2 Bathroom') ? '2' : '1'} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Monthly Rent</label>
                  <input type="text" name="price" defaultValue={selectedListing?.price} required />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={selectedListing?.status?.toLowerCase()} required>
                    <option value="">Select Status</option>
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Under Maintenance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" rows="4" placeholder="Describe the property features, amenities, etc."></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowEditListingModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary">
                    Update Listing
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Visit Modal */}
      {showScheduleVisitModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleVisitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule New Visit</h3>
              <button className="modal-close" onClick={() => setShowScheduleVisitModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const visitData = {
                  property: formData.get('property'),
                  clientName: formData.get('clientName'),
                  clientEmail: formData.get('clientEmail'),
                  clientPhone: formData.get('clientPhone'),
                  visitDate: formData.get('visitDate'),
                  visitTime: formData.get('visitTime'),
                  notes: formData.get('notes')
                };
                handleScheduleVisit(visitData);
              }}>
                <div className="form-group">
                  <label>Property</label>
                  <select name="property" required>
                    <option value="">Select Property</option>
                    <option value="123-main">123 Main Street</option>
                    <option value="456-oak">456 Oak Avenue</option>
                    <option value="789-pine">789 Pine Lane</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Client Name</label>
                  <input type="text" name="clientName" required placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label>Client Email</label>
                  <input type="email" name="clientEmail" required placeholder="email@example.com" />
                </div>
                <div className="form-group">
                  <label>Client Phone</label>
                  <input type="tel" name="clientPhone" required placeholder="Phone number" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Visit Date</label>
                    <input type="date" name="visitDate" required />
                  </div>
                  <div className="form-group">
                    <label>Visit Time</label>
                    <input type="time" name="visitTime" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea name="notes" rows="3" placeholder="Any special requirements or notes for the visit"></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowScheduleVisitModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary">
                    Schedule Visit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalesDashboard;
