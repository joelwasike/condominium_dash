import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Home,
  Building2,
  Calendar,
  Users,
  TrendingUp,
  Plus,
  Settings,
  ClipboardList
} from 'lucide-react';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import Modal from '../components/Modal';
import '../components/RoleLayout.css';
import '../pages/TechnicianDashboard.css';
import './SalesDashboard.css';
import { commercialService } from '../services/commercialService';

const FETCH_TIMEOUT = 8000;

const fallbackOverview = {
  totalListings: 4,
  totalVisits: 18,
  conversionRate: 27.5,
  pendingRequests: 3
};

const fallbackListings = [
  {
    ID: 'mock-1',
    Address: '221B Baker Street',
    City: 'London',
    Type: 'Apartment',
    Bedrooms: 3,
    Bathrooms: 2,
    Price: '£2,450/mo',
    Status: 'Available',
    UpdatedAt: new Date().toISOString()
  },
  {
    ID: 'mock-2',
    Address: '742 Evergreen Terrace',
    City: 'Springfield',
    Type: 'House',
    Bedrooms: 4,
    Bathrooms: 3,
    Price: '$3,100/mo',
    Status: 'Occupied',
    UpdatedAt: new Date().toISOString()
  }
];

const fallbackVisits = [
  {
    ID: 'visit-1',
    Property: '221B Baker Street',
    Client: 'Irene Adler',
    ClientEmail: 'irene@example.com',
    ClientPhone: '+44 20 7946 0958',
    VisitDate: new Date().toISOString(),
    VisitTime: '14:00',
    Status: 'Scheduled'
  },
  {
    ID: 'visit-2',
    Property: '742 Evergreen Terrace',
    Client: 'Ned Flanders',
    ClientEmail: 'ned@example.com',
    ClientPhone: '+1 555-1234',
    VisitDate: new Date().toISOString(),
    VisitTime: '11:30',
    Status: 'Completed'
  }
];

const fallbackRequests = [
  {
    ID: 'req-1',
    ClientName: 'Lisa Simpson',
    ClientEmail: 'lisa@example.com',
    Property: '742 Evergreen Terrace',
    CreatedAt: new Date().toISOString(),
    PreferredDate: new Date().toISOString(),
    Status: 'Pending'
  },
  {
    ID: 'req-2',
    ClientName: 'John Watson',
    ClientEmail: 'watson@example.com',
    Property: '221B Baker Street',
    CreatedAt: new Date().toISOString(),
    PreferredDate: new Date().toISOString(),
    Status: 'Approved'
  }
];

const fetchWithTimeout = async (promise, timeout = FETCH_TIMEOUT) => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Request timed out')), timeout);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timer);
  }
};

const SalesDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [showEditListingModal, setShowEditListingModal] = useState(false);
  const [showScheduleVisitModal, setShowScheduleVisitModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [visitProperty, setVisitProperty] = useState('');
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [listings, setListings] = useState([]);
  const [visits, setVisits] = useState([]);
  const [requests, setRequests] = useState([]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3200);
  }, []);

  const applyFallbackData = useCallback(() => {
    setOverviewData(fallbackOverview);
    setListings(fallbackListings);
    setVisits(fallbackVisits);
    setRequests(fallbackRequests);
    addNotification('Showing sample commercial data. Connect the backend to see live results.', 'info');
  }, [addNotification]);

  const loadData = useCallback(async () => {
    console.debug('[SalesDashboard] Loading commercial data...');
    try {
      setLoading(true);
      const [overview, listingsData, visitsData, requestsData] = await Promise.all([
        fetchWithTimeout(commercialService.getOverview()),
        fetchWithTimeout(commercialService.listListings()),
        fetchWithTimeout(commercialService.listVisits()),
        fetchWithTimeout(commercialService.listRequests())
      ]);

      console.debug('[SalesDashboard] Commercial data loaded', {
        overview,
        listingsCount: listingsData?.length,
        visitsCount: visitsData?.length,
        requestsCount: requestsData?.length
      });

      setOverviewData(overview);
      setListings(listingsData || []);
      setVisits(visitsData || []);
      setRequests(requestsData || []);
    } catch (error) {
      console.error('[SalesDashboard] Error loading data', error);
      addNotification('Unable to reach commercial API. Using sample data.', 'warning');
      applyFallbackData();
    } finally {
      setLoading(false);
    }
  }, [addNotification, applyFallbackData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'listings', label: 'Listings', icon: Building2 },
      { id: 'visits', label: 'Visits', icon: Calendar },
      { id: 'requests', label: 'Requests', icon: Users },
      { id: 'settings', label: 'Profile Settings', icon: Settings }
    ],
    []
  );

  const layoutMenu = useMemo(
    () =>
      tabs.map(tab => ({
        id: tab.id,
        label: tab.label,
        icon: tab.icon,
        active: activeTab === tab.id
      })),
    [tabs, activeTab]
  );

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const openAddListingModal = () => {
    console.debug('[SalesDashboard] Opening add listing modal');
    setSelectedListing(null);
    setShowAddListingModal(true);
  };

  const openEditListing = (listing) => {
    console.debug('[SalesDashboard] Editing listing', listing);
    setSelectedListing(listing);
    setShowEditListingModal(true);
  };

  const openScheduleVisit = (property = '') => {
    console.debug('[SalesDashboard] Scheduling visit for property', property);
    setVisitProperty(property);
    setShowScheduleVisitModal(true);
  };

  const closeEditListingModal = () => {
    setShowEditListingModal(false);
    setSelectedListing(null);
  };

  const closeScheduleVisitModal = () => {
    setShowScheduleVisitModal(false);
    setVisitProperty('');
  };

  const handleAddListing = useCallback(async (listingData) => {
    setLoading(true);
    try {
      await commercialService.createListing(listingData);
      addNotification('Listing added successfully!', 'success');
      setShowAddListingModal(false);
      loadData();
    } catch (error) {
      console.error('Error adding listing:', error);
      addNotification('Failed to add listing', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, loadData]);

  const handleEditListing = useCallback(async (listingData) => {
    if (!selectedListing) return;
    setLoading(true);
    try {
      await commercialService.updateListing(selectedListing.ID, listingData);
      addNotification('Listing updated successfully!', 'success');
      closeEditListingModal();
      loadData();
    } catch (error) {
      console.error('Error updating listing:', error);
      addNotification('Failed to update listing', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, loadData, selectedListing]);

  const handleScheduleVisit = useCallback(async (visitData) => {
    setLoading(true);
    try {
      await commercialService.scheduleVisit(visitData);
      addNotification('Visit scheduled successfully!', 'success');
      closeScheduleVisitModal();
      loadData();
    } catch (error) {
      console.error('Error scheduling visit:', error);
      addNotification('Failed to schedule visit', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, loadData]);

  const handleApproveRequest = useCallback(async (requestId) => {
    try {
      await commercialService.updateVisitRequest(requestId, 'approved');
      addNotification('Request approved successfully!', 'success');
      loadData();
    } catch (error) {
      console.error('Error approving request:', error);
      addNotification('Failed to approve request', 'error');
    }
  }, [addNotification, loadData]);

  const renderOverview = () => {
    const cards = [
      {
        label: 'Active Listings',
        value: overviewData?.totalListings || 0,
        subtitle: 'Properties in portfolio',
        icon: Building2
      },
      {
        label: 'Scheduled Visits',
        value: overviewData?.totalVisits || 0,
        subtitle: 'All-time visits',
        icon: Calendar
      },
      {
        label: 'Conversion Rate',
        value: `${overviewData?.conversionRate?.toFixed(1) || 0}%`,
        subtitle: 'Visit to lease',
        icon: TrendingUp
      },
      {
        label: 'Pending Requests',
        value: overviewData?.pendingRequests || 0,
        subtitle: 'Awaiting response',
        icon: ClipboardList
      }
    ];

    return (
      <div className="dashboard-overview">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="overview-card">
              <div className="card-label">
                <span>{card.label}</span>
                <span className="card-trend positive">
                  <Icon size={16} />
                </span>
        </div>
              <div className="card-value">
                <span>{card.value}</span>
                <small>{card.subtitle}</small>
        </div>
      </div>
          );
        })}
    </div>
  );
  };

  const renderListings = () => (
    <div className="panel">
      <div className="section-header">
        <div>
        <h3>Property Listings</h3>
          <p>Manage portfolio availability and pricing</p>
      </div>
        <button className="action-button primary" onClick={openAddListingModal}>
          <Plus size={16} />
          <span>Add Listing</span>
        </button>
      </div>
        {loading ? (
        <div className="loading">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="no-data">No listings available</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Details</th>
                <th>Price</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing, index) => (
                <tr key={listing.ID || `listing-${index}`}>
                  <td>
                    <div className="row-primary">{listing.Address || 'Unnamed Property'}</div>
                    <div className="row-secondary">{listing.City || listing.District || 'N/A'}</div>
                  </td>
                  <td>
                    <div className="row-primary">{listing.Type || 'N/A'}</div>
                    <div className="row-secondary">
                      {(listing.Bedrooms || 0)} bd / {(listing.Bathrooms || 0)} ba
              </div>
                  </td>
                  <td>
                    <div className="row-primary">{listing.Price || 'N/A'}</div>
                    <div className="row-secondary">
                      {listing.UpdatedAt ? `Updated ${new Date(listing.UpdatedAt).toLocaleDateString()}` : 'Update pending'}
                </div>
                  </td>
                  <td>
                    <span className="status-pill">{listing.Status || 'Available'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="table-action-button start"
                      onClick={() => addNotification('Opening listing details', 'info')}
                    >
                      View
                    </button>
                    <button
                      className="table-action-button view"
                      onClick={() => openEditListing(listing)}
                    >
                      Edit
                  </button>
                    <button
                      className="table-action-button edit"
                      onClick={() => openScheduleVisit(listing.Address)}
                    >
                      Schedule
                  </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
        )}
    </div>
  );

  const renderVisits = () => (
    <div className="panel">
      <div className="section-header">
        <div>
        <h3>Visit Management</h3>
          <p>Schedule and track property viewings</p>
      </div>
        <button className="action-button primary" onClick={() => openScheduleVisit()}>
          <Plus size={16} />
          <span>Schedule Visit</span>
        </button>
      </div>
        {loading ? (
        <div className="loading">Loading visits...</div>
      ) : visits.length === 0 ? (
        <div className="no-data">No visits scheduled</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Client</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit, index) => {
                const visitDate = visit.VisitDate || visit.Date || visit.ScheduledAt;
                const visitTime = visit.VisitTime || visit.Time;
                const formattedDate = visitDate ? new Date(visitDate).toLocaleDateString() : 'N/A';
                const formattedTime = visitTime
                  ? visitTime
                  : visitDate
                    ? new Date(visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A';

                return (
                  <tr key={visit.ID || `visit-${index}`}>
                    <td>
                      <div className="row-primary">{visit.Property || visit.Address || 'Property'}</div>
                      <div className="row-secondary">{visit.Agent || 'Pending assignment'}</div>
                    </td>
                    <td>
                      <div className="row-primary">{visit.Client || visit.ClientName || 'Client'}</div>
                      <div className="row-secondary">{visit.ClientEmail || visit.ClientPhone || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="row-primary">{formattedDate}</div>
                      <div className="row-secondary">{formattedTime}</div>
                    </td>
                    <td>
                      <span className="status-pill">{visit.Status || 'Scheduled'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="table-action-button view"
                        onClick={() => addNotification('Visit marked as completed', 'success')}
                      >
                        Complete
                      </button>
                      <button
                        className="table-action-button edit"
                        onClick={() => openScheduleVisit(visit.Property)}
                      >
                        Reschedule
                      </button>
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

  const renderRequests = () => (
    <div className="panel">
      <div className="section-header">
        <div>
        <h3>Visit Requests</h3>
          <p>Manage incoming requests from prospective tenants</p>
        </div>
      </div>
      {loading ? (
        <div className="loading">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="no-data">No requests received</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Property</th>
                <th>Requested</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request, index) => (
                <tr key={request.ID || `request-${index}`}>
                  <td>
                    <div className="row-primary">{request.ClientName || 'Client'}</div>
                    <div className="row-secondary">{request.ClientEmail || request.ClientPhone || 'N/A'}</div>
                  </td>
                  <td>
                    <div className="row-primary">{request.Property || 'Property'}</div>
                    <div className="row-secondary">{request.City || request.District || 'N/A'}</div>
                  </td>
                  <td>
                    <div className="row-primary">
                      {request.CreatedAt ? new Date(request.CreatedAt).toLocaleDateString() : 'N/A'}
      </div>
                    <div className="row-secondary">
                      {request.PreferredDate ? new Date(request.PreferredDate).toLocaleDateString() : ''}
                </div>
                  </td>
                  <td>
                    <span className="status-pill">{request.Status || 'Pending'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {request.Status?.toLowerCase() === 'pending' && (
                      <button
                        className="table-action-button view"
                        onClick={() => handleApproveRequest(request.ID)}
                      >
                        Approve
                      </button>
                    )}
                    <button 
                      className="table-action-button start"
                      onClick={() => addNotification('Opening request details', 'info')}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
        )}
    </div>
  );

  const renderContent = (currentTab = activeTab) => {
    switch (currentTab) {
      case 'overview':
        return renderOverview();
      case 'listings':
        return renderListings();
      case 'visits':
        return renderVisits();
      case 'requests':
        return renderRequests();
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

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Commercial Team', logo: 'SAAF', logoImage: `${process.env.PUBLIC_URL}/download.jpeg` }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}
        title="Commercial Dashboard"
        subtitle="Manage property listings, visits, and client relationships"
      >
        {({ activeId }) => (
          <div className="content-body sales-content">
            {renderContent(activeId)}
          </div>
        )}
      </RoleLayout>

      <Modal
        isOpen={showAddListingModal}
        onClose={() => setShowAddListingModal(false)}
        title="Add New Listing"
        size="lg"
      >
        <form
          className="modal-form"
          onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const listingData = {
                  Address: formData.get('address'),
                  Type: formData.get('type'),
              Bedrooms: Number(formData.get('bedrooms')),
              Bathrooms: Number(formData.get('bathrooms')),
                  Price: formData.get('price'),
                  Description: formData.get('description'),
                  Status: formData.get('status')
                };
                handleAddListing(listingData);
          }}
        >
                <div className="form-group">
                  <label>Property Address</label>
            <input name="address" placeholder="e.g., 123 Main Street" required />
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
              <input name="bedrooms" type="number" min="0" required />
                  </div>
                  <div className="form-group">
                    <label>Bathrooms</label>
              <input name="bathrooms" type="number" min="0" step="0.5" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Monthly Rent</label>
            <input name="price" placeholder="e.g., $1,200/month" required />
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
            <textarea name="description" rows="4" placeholder="Describe the property features, amenities, etc." />
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowAddListingModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Listing'}
                  </button>
                </div>
              </form>
      </Modal>

      <Modal
        isOpen={showEditListingModal}
        onClose={closeEditListingModal}
        title="Edit Listing"
        size="lg"
      >
        <form
          className="modal-form"
          onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const listingData = {
                  Address: formData.get('address'),
                  Type: formData.get('type'),
              Bedrooms: Number(formData.get('bedrooms')),
              Bathrooms: Number(formData.get('bathrooms')),
                  Price: formData.get('price'),
                  Description: formData.get('description'),
                  Status: formData.get('status')
                };
                handleEditListing(listingData);
          }}
        >
                <div className="form-group">
                  <label>Property Address</label>
            <input name="address" defaultValue={selectedListing?.Address} required />
                </div>
                <div className="form-group">
                  <label>Property Type</label>
                  <select name="type" defaultValue={selectedListing?.Type} required>
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
              <input name="bedrooms" type="number" min="0" defaultValue={selectedListing?.Bedrooms} required />
                  </div>
                  <div className="form-group">
                    <label>Bathrooms</label>
              <input name="bathrooms" type="number" min="0" step="0.5" defaultValue={selectedListing?.Bathrooms} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Monthly Rent</label>
            <input name="price" defaultValue={selectedListing?.Price} required />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={selectedListing?.Status} required>
                    <option value="">Select Status</option>
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Under Maintenance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
            <textarea
              name="description"
              rows="4"
              defaultValue={selectedListing?.Description}
              placeholder="Describe the property features, amenities, etc."
            />
                </div>
                <div className="modal-footer">
            <button type="button" className="action-button secondary" onClick={closeEditListingModal}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Listing'}
                  </button>
                </div>
              </form>
      </Modal>

      <Modal
        isOpen={showScheduleVisitModal}
        onClose={closeScheduleVisitModal}
        title="Schedule Visit"
        size="lg"
      >
        <form
          className="modal-form"
          onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const visitData = {
                  Property: formData.get('property'),
                  ClientName: formData.get('clientName'),
                  ClientEmail: formData.get('clientEmail'),
                  ClientPhone: formData.get('clientPhone'),
                  VisitDate: formData.get('visitDate'),
                  VisitTime: formData.get('visitTime'),
                  Notes: formData.get('notes')
                };
                handleScheduleVisit(visitData);
          }}
        >
                <div className="form-group">
                  <label>Property</label>
            <select name="property" defaultValue={visitProperty} required>
                    <option value="">Select Property</option>
                    {listings.map((listing, index) => (
                      <option key={listing.ID || `listing-${index}`} value={listing.Address}>
                        {listing.Address}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Client Name</label>
            <input name="clientName" placeholder="Full name" required />
                </div>
                <div className="form-group">
                  <label>Client Email</label>
            <input name="clientEmail" type="email" placeholder="email@example.com" required />
                </div>
                <div className="form-group">
                  <label>Client Phone</label>
            <input name="clientPhone" type="tel" placeholder="Phone number" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Visit Date</label>
              <input name="visitDate" type="date" required />
                  </div>
                  <div className="form-group">
                    <label>Visit Time</label>
              <input name="visitTime" type="time" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
            <textarea name="notes" rows="3" placeholder="Any special requirements or notes for the visit" />
                </div>
                <div className="modal-footer">
            <button type="button" className="action-button secondary" onClick={closeScheduleVisitModal}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Scheduling...' : 'Schedule Visit'}
                  </button>
                </div>
              </form>
      </Modal>

      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>×</button>
          </div>
        ))}
        </div>
    </>
  );
};

export default SalesDashboard;
