import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Home,
  Building2,
  Calendar,
  Users,
  TrendingUp,
  Plus,
  Settings,
  ClipboardList,
  Megaphone
} from 'lucide-react';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import Modal from '../components/Modal';
import '../components/RoleLayout.css';
import './SalesDashboard.css';
import { commercialService } from '../services/commercialService';
import { API_CONFIG } from '../config/api';

const FETCH_TIMEOUT = 8000;

const SalesDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [showEditListingModal, setShowEditListingModal] = useState(false);
  const [showScheduleVisitModal, setShowScheduleVisitModal] = useState(false);
  const [showUpdateVisitStatusModal, setShowUpdateVisitStatusModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [visitProperty, setVisitProperty] = useState('');
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [listings, setListings] = useState([]);
  const [visits, setVisits] = useState({ upcoming: [], done: [], all: [] });
  const [requests, setRequests] = useState([]);
  const [interestedClients, setInterestedClients] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  
  // Filter states
  const [listingStatusFilter, setListingStatusFilter] = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState('');
  const [visitStatusFilter, setVisitStatusFilter] = useState('');
  const [visitTab, setVisitTab] = useState('all'); // 'all', 'upcoming', 'done'
  const [requestStatusFilter, setRequestStatusFilter] = useState('');

  const addNotification = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

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

  const loadData = useCallback(async () => {
    console.debug('[SalesDashboard] Loading commercial data...');
    try {
      setLoading(true);
      const [overview, listingsData, visitsData, requestsData, clientsData] = await Promise.all([
        fetchWithTimeout(commercialService.getOverview()).catch(() => null),
        fetchWithTimeout(commercialService.listListings({
          status: listingStatusFilter || undefined,
          type: listingTypeFilter || undefined,
        })).catch(() => []),
        fetchWithTimeout(commercialService.listVisits({
          status: visitStatusFilter || undefined,
        })).catch(() => ({ upcoming: [], done: [], all: [] })),
        fetchWithTimeout(commercialService.listRequests({
          status: requestStatusFilter || undefined,
        })).catch(() => []),
        fetchWithTimeout(commercialService.getInterestedClientsHistory()).catch(() => ({ clients: [] }))
      ]);

      console.debug('[SalesDashboard] Commercial data loaded', {
        overview,
        listingsCount: listingsData?.length,
        visitsData,
        requestsCount: requestsData?.length,
        clientsCount: clientsData?.clients?.length
      });

      setOverviewData(overview);
      setListings(Array.isArray(listingsData) ? listingsData : []);
      
      // Handle visits - can be array or object with upcoming/done/all
      if (Array.isArray(visitsData)) {
        setVisits({ upcoming: [], done: [], all: visitsData });
      } else if (visitsData && typeof visitsData === 'object') {
        setVisits({
          upcoming: Array.isArray(visitsData.upcoming) ? visitsData.upcoming : [],
          done: Array.isArray(visitsData.done) ? visitsData.done : [],
          all: Array.isArray(visitsData.all) ? visitsData.all : []
        });
      } else {
        setVisits({ upcoming: [], done: [], all: [] });
      }
      
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setInterestedClients(Array.isArray(clientsData?.clients) ? clientsData.clients : []);
    } catch (error) {
      console.error('[SalesDashboard] Error loading data', error);
      addNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, listingStatusFilter, listingTypeFilter, visitStatusFilter, requestStatusFilter]);

  // Load advertisements when advertisements tab is active
  useEffect(() => {
    if (activeTab === 'advertisements') {
      loadAdvertisements();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'listings', label: 'Listings', icon: Building2 },
      { id: 'visits', label: 'Visits', icon: Calendar },
      { id: 'requests', label: 'Requests', icon: Users },
      { id: 'advertisements', label: 'Advertisements', icon: Megaphone },
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
    setSelectedListing(null);
    setShowAddListingModal(true);
  };

  const openEditListing = (listing) => {
    setSelectedListing(listing);
    setShowEditListingModal(true);
  };

  const openScheduleVisit = (property = '') => {
    setVisitProperty(property);
    setShowScheduleVisitModal(true);
  };

  const openUpdateVisitStatus = (visit) => {
    setSelectedVisit(visit);
    setShowUpdateVisitStatusModal(true);
  };

  const openFollowUp = (request) => {
    setSelectedRequest(request);
    setShowFollowUpModal(true);
  };

  const closeEditListingModal = () => {
    setShowEditListingModal(false);
    setSelectedListing(null);
  };

  const closeScheduleVisitModal = () => {
    setShowScheduleVisitModal(false);
    setVisitProperty('');
  };

  const closeUpdateVisitStatusModal = () => {
    setShowUpdateVisitStatusModal(false);
    setSelectedVisit(null);
  };

  const closeFollowUpModal = () => {
    setShowFollowUpModal(false);
    setSelectedRequest(null);
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
      const listingId = selectedListing.ID || selectedListing.id;
      await commercialService.updateListing(listingId, listingData);
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

  const handleUpdateVisitStatus = useCallback(async (status, notes) => {
    if (!selectedVisit) return;
    setLoading(true);
    try {
      const visitId = selectedVisit.ID || selectedVisit.id;
      await commercialService.updateVisitStatus(visitId, status, notes);
      addNotification('Visit status updated successfully!', 'success');
      closeUpdateVisitStatusModal();
      loadData();
    } catch (error) {
      console.error('Error updating visit status:', error);
      addNotification('Failed to update visit status', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, loadData, selectedVisit]);

  const handleApproveRequest = useCallback(async (requestId) => {
    try {
      await commercialService.updateVisitRequest(requestId, 'Approved');
      addNotification('Request approved successfully!', 'success');
      loadData();
    } catch (error) {
      console.error('Error approving request:', error);
      addNotification('Failed to approve request', 'error');
    }
  }, [addNotification, loadData]);

  const handleFollowUpRequest = useCallback(async (message) => {
    if (!selectedRequest) return;
    try {
      const requestId = selectedRequest.ID || selectedRequest.id;
      await commercialService.followUpVisitRequest(requestId, message);
      addNotification('Follow-up sent successfully!', 'success');
      closeFollowUpModal();
      loadData();
    } catch (error) {
      console.error('Error sending follow-up:', error);
      addNotification('Failed to send follow-up', 'error');
    }
  }, [addNotification, loadData, selectedRequest]);

  const renderOverview = () => {
    const stats = overviewData || {};

    return (
      <div className="sa-overview-page">
        <div className="sa-section-card">
          <div className="sa-section-header">
            <div>
              <h3>Commercial Dashboard Overview</h3>
              <p>Track property listings, visits, and client relationships</p>
        </div>
        </div>

          <div className="sa-overview-metrics">
            <div className="sa-metric-card">
              <p className="sa-metric-label">Properties Listed</p>
              <p className="sa-metric-value">{stats.totalPropertiesListed || 0}</p>
              <span className="sa-metric-period">Total properties</span>
      </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Visits Today</p>
              <p className="sa-metric-value">{stats.visitsScheduledToday || 0}</p>
              <span className="sa-metric-period">Scheduled today</span>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Visits This Week</p>
              <p className="sa-metric-value">{stats.visitsScheduledThisWeek || 0}</p>
              <span className="sa-metric-period">Scheduled this week</span>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Total Visits</p>
              <p className="sa-metric-value">{stats.totalVisits || 0}</p>
              <span className="sa-metric-period">All-time visits</span>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Completed Visits</p>
              <p className="sa-metric-value">{stats.completedVisits || 0}</p>
              <span className="sa-metric-period">Done visits</span>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Upcoming Visits</p>
              <p className="sa-metric-value">{stats.upcomingVisits || 0}</p>
              <span className="sa-metric-period">Future scheduled</span>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Conversion Rate</p>
              <p className="sa-metric-value">{stats.visitToLeaseConversionRate ? `${stats.visitToLeaseConversionRate.toFixed(1)}%` : '0%'}</p>
              <span className="sa-metric-period">Visit to lease</span>
            </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Pending Requests</p>
              <p className="sa-metric-value">{stats.pendingVisitRequests || 0}</p>
              <span className="sa-metric-period">Awaiting response</span>
            </div>
          </div>
        </div>
    </div>
  );
  };

  const renderListings = () => {
    const displayListings = Array.isArray(listings) ? listings : [];
    
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
        <div>
        <h3>Property Listings</h3>
          <p>Manage portfolio availability and pricing</p>
      </div>
          <button className="sa-primary-cta" onClick={openAddListingModal}>
            <Plus size={18} />
            Add Listing
        </button>
      </div>

        <div className="sa-filters-section">
          <select 
            className="sa-filter-select"
            value={listingStatusFilter}
            onChange={(e) => setListingStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Sold">Sold</option>
            <option value="Rented">Rented</option>
          </select>
          <select 
            className="sa-filter-select"
            value={listingTypeFilter}
            onChange={(e) => setListingTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Apartment">Apartment</option>
            <option value="House">House</option>
            <option value="Studio">Studio</option>
            <option value="Condo">Condo</option>
          </select>
        </div>

        {loading ? (
          <div className="sa-table-empty">Loading listings...</div>
        ) : displayListings.length === 0 ? (
          <div className="sa-table-empty">No listings available</div>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Details</th>
                <th>Price</th>
                <th>Status</th>
                  <th></th>
              </tr>
            </thead>
            <tbody>
                {displayListings.map((listing, index) => {
                  const listingId = listing.ID || listing.id || `listing-${index}`;
                  const address = listing.Address || listing.address || 'Unnamed Property';
                  const city = listing.City || listing.city || listing.District || listing.district || 'N/A';
                  const type = listing.Type || listing.type || 'N/A';
                  const bedrooms = listing.Bedrooms || listing.bedrooms || 0;
                  const bathrooms = listing.Bathrooms || listing.bathrooms || 0;
                  const price = listing.Price || listing.price || 'N/A';
                  const status = listing.Status || listing.status || 'Published';
                  const updatedAt = listing.UpdatedAt || listing.updatedAt;
                  
                  return (
                    <tr key={listingId}>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{address}</span>
                          <span className="sa-cell-sub">{city}</span>
                        </div>
                  </td>
                  <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{type}</span>
                          <span className="sa-cell-sub">{bedrooms} bd / {bathrooms} ba</span>
              </div>
                  </td>
                  <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{price}</span>
                          <span className="sa-cell-sub">
                            {updatedAt ? `Updated ${new Date(updatedAt).toLocaleDateString()}` : 'Update pending'}
                          </span>
                </div>
                  </td>
                  <td>
                        <span className={`sa-status-pill ${status.toLowerCase()}`}>
                          {status}
                        </span>
                  </td>
                      <td>
                        <div className="sa-row-actions">
                    <button
                            className="table-action-button view"
                      onClick={() => addNotification('Opening listing details', 'info')}
                    >
                      View
                    </button>
                    <button
                            className="table-action-button edit"
                      onClick={() => openEditListing(listing)}
                    >
                      Edit
                  </button>
                    <button
                            className="table-action-button contact"
                            onClick={() => openScheduleVisit(address)}
                    >
                      Schedule
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

  const renderVisits = () => {
    const visitsToDisplay = visitTab === 'upcoming' ? visits.upcoming : 
                           visitTab === 'done' ? visits.done : 
                           visits.all;
    
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
        <div>
        <h3>Visit Management</h3>
          <p>Schedule and track property viewings</p>
      </div>
          <button className="sa-primary-cta" onClick={() => openScheduleVisit()}>
            <Plus size={18} />
            Schedule Visit
        </button>
      </div>

        <div className="sa-filters-section">
          <div className="sa-transactions-tabs">
            <button
              className={`sa-subtab-button ${visitTab === 'all' ? 'active' : ''}`}
              onClick={() => setVisitTab('all')}
            >
              All ({visits.all.length})
            </button>
            <button
              className={`sa-subtab-button ${visitTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setVisitTab('upcoming')}
            >
              Upcoming ({visits.upcoming.length})
            </button>
            <button
              className={`sa-subtab-button ${visitTab === 'done' ? 'active' : ''}`}
              onClick={() => setVisitTab('done')}
            >
              Done ({visits.done.length})
            </button>
          </div>
          <select 
            className="sa-filter-select"
            value={visitStatusFilter}
            onChange={(e) => setVisitStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No-show">No-show</option>
          </select>
        </div>

        {loading ? (
          <div className="sa-table-empty">Loading visits...</div>
        ) : visitsToDisplay.length === 0 ? (
          <div className="sa-table-empty">No visits scheduled</div>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Client</th>
                <th>Scheduled</th>
                <th>Status</th>
                  <th></th>
              </tr>
            </thead>
            <tbody>
                {visitsToDisplay.map((visit, index) => {
                  const visitId = visit.ID || visit.id || `visit-${index}`;
                  const property = visit.Property || visit.property || visit.Address || visit.address || 'Property';
                  const client = visit.Client || visit.client || visit.ClientName || visit.clientName || 'Client';
                  const clientEmail = visit.ClientEmail || visit.clientEmail || '';
                  const clientPhone = visit.ClientPhone || visit.clientPhone || '';
                  const visitDate = visit.VisitDate || visit.visitDate || visit.Date || visit.date || visit.ScheduledAt || visit.scheduledAt;
                  const visitTime = visit.VisitTime || visit.visitTime || visit.Time || visit.time;
                  const status = visit.Status || visit.status || 'Scheduled';
                  
                const formattedDate = visitDate ? new Date(visitDate).toLocaleDateString() : 'N/A';
                const formattedTime = visitTime
                  ? visitTime
                  : visitDate
                    ? new Date(visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A';

                return (
                    <tr key={visitId}>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{property}</span>
                          <span className="sa-cell-sub">{visit.Agent || visit.agent || 'Pending assignment'}</span>
                        </div>
                    </td>
                    <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{client}</span>
                          <span className="sa-cell-sub">{clientEmail || clientPhone || 'N/A'}</span>
                        </div>
                    </td>
                    <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{formattedDate}</span>
                          <span className="sa-cell-sub">{formattedTime}</span>
                        </div>
                    </td>
                    <td>
                        <span className={`sa-status-pill ${status.toLowerCase().replace('-', '')}`}>
                          {status}
                        </span>
                    </td>
                      <td>
                        <div className="sa-row-actions">
                          {status === 'Scheduled' && (
                      <button
                              className="table-action-button edit"
                              onClick={() => openUpdateVisitStatus(visit)}
                      >
                              Update Status
                      </button>
                          )}
                      <button
                            className="table-action-button view"
                            onClick={() => openScheduleVisit(property)}
                      >
                        Reschedule
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

  const renderRequests = () => {
    return (
      <div className="sa-section-card">
        <div className="sa-section-header">
        <div>
        <h3>Visit Requests</h3>
          <p>Manage incoming requests from prospective tenants</p>
        </div>
      </div>

        <div className="sa-filters-section">
          <select 
            className="sa-filter-select"
            value={requestStatusFilter}
            onChange={(e) => setRequestStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>

      {loading ? (
          <div className="sa-table-empty">Loading requests...</div>
      ) : requests.length === 0 ? (
          <div className="sa-table-empty">No requests received</div>
      ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Property</th>
                <th>Requested</th>
                <th>Status</th>
                  <th></th>
              </tr>
            </thead>
            <tbody>
                {requests.map((request, index) => {
                  const requestId = request.ID || request.id || `request-${index}`;
                  const clientName = request.ClientName || request.clientName || 'Client';
                  const clientEmail = request.ClientEmail || request.clientEmail || '';
                  const clientPhone = request.ClientPhone || request.clientPhone || '';
                  const property = request.Property || request.property || 'Property';
                  const status = request.Status || request.status || 'Pending';
                  const createdAt = request.CreatedAt || request.createdAt;
                  const preferredDate = request.PreferredDate || request.preferredDate;
                  const followUpCount = request.followUpCount || request.FollowUpCount || 0;
                  
                  return (
                    <tr key={requestId}>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{clientName}</span>
                          <span className="sa-cell-sub">{clientEmail || clientPhone || 'N/A'}</span>
                        </div>
                  </td>
                  <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{property}</span>
                          <span className="sa-cell-sub">{request.City || request.city || request.District || request.district || 'N/A'}</span>
                        </div>
                  </td>
                  <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">
                            {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                          <span className="sa-cell-sub">
                            {preferredDate ? `Preferred: ${new Date(preferredDate).toLocaleDateString()}` : ''}
                          </span>
                </div>
                  </td>
                  <td>
                        <span className={`sa-status-pill ${status.toLowerCase()}`}>
                          {status}
                        </span>
                        {followUpCount > 0 && (
                          <span className="sa-cell-sub" style={{ display: 'block', marginTop: '4px' }}>
                            {followUpCount} follow-up{followUpCount > 1 ? 's' : ''}
                          </span>
                        )}
                  </td>
                      <td>
                        <div className="sa-row-actions">
                          {status === 'Pending' && (
                            <>
                      <button
                                className="table-action-button edit"
                                onClick={() => handleApproveRequest(requestId)}
                      >
                        Approve
                      </button>
                              <button
                                className="table-action-button contact"
                                onClick={() => openFollowUp(request)}
                              >
                                Follow-up
                              </button>
                            </>
                    )}
                    <button 
                            className="table-action-button view"
                      onClick={() => addNotification('Opening request details', 'info')}
                    >
                      View
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

  // Load advertisements
  const loadAdvertisements = async () => {
    try {
      const ads = await commercialService.getAdvertisements();
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
      case 'advertisements':
        return renderAdvertisements();
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
      >
        {({ activeId }) => (
          <div className="content-body sales-content">
            {renderContent(activeId)}
          </div>
        )}
      </RoleLayout>

      {showAddListingModal && (
        <div className="modal-overlay" onClick={() => setShowAddListingModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Listing</h3>
              <button className="modal-close" onClick={() => setShowAddListingModal(false)}>×</button>
            </div>
            <div className="modal-body">
        <form
          className="modal-form"
          onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const listingData = {
                    address: formData.get('address'),
                    type: formData.get('type'),
                    bedrooms: Number(formData.get('bedrooms')),
                    bathrooms: Number(formData.get('bathrooms')),
                    price: formData.get('price'),
                    description: formData.get('description'),
                    status: formData.get('status') || 'Published'
                };
                handleAddListing(listingData);
          }}
        >
                <div className="form-group">
                  <label htmlFor="add-address">Property Address *</label>
                  <input 
                    id="add-address"
                    name="address" 
                    placeholder="e.g., 123 Main Street" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="add-type">Property Type *</label>
                  <select id="add-type" name="type" required>
                    <option value="">Select Type</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Studio">Studio</option>
                    <option value="Condo">Condo</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="add-bedrooms">Bedrooms *</label>
                    <input 
                      id="add-bedrooms"
                      name="bedrooms" 
                      type="number" 
                      min="0" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-bathrooms">Bathrooms *</label>
                    <input 
                      id="add-bathrooms"
                      name="bathrooms" 
                      type="number" 
                      min="0" 
                      step="0.5" 
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="add-price">Monthly Rent *</label>
                  <input 
                    id="add-price"
                    name="price" 
                    placeholder="e.g., $1,200/month" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="add-status">Status *</label>
                  <select id="add-status" name="status" required>
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Sold">Sold</option>
                    <option value="Rented">Rented</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="add-description">Description</label>
                  <textarea 
                    id="add-description"
                    name="description" 
                    rows="4" 
                    placeholder="Describe the property features, amenities, etc." 
                  />
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary" 
                    onClick={() => setShowAddListingModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="action-button primary" 
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}

      {showEditListingModal && selectedListing && (
        <div className="modal-overlay" onClick={closeEditListingModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Listing</h3>
              <button className="modal-close" onClick={closeEditListingModal}>×</button>
            </div>
            <div className="modal-body">
        <form
          className="modal-form"
          onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const listingData = {
                    address: formData.get('address'),
                    type: formData.get('type'),
                    bedrooms: Number(formData.get('bedrooms')),
                    bathrooms: Number(formData.get('bathrooms')),
                    price: formData.get('price'),
                    description: formData.get('description'),
                    status: formData.get('status')
                };
                handleEditListing(listingData);
          }}
        >
                <div className="form-group">
                  <label htmlFor="edit-address">Property Address *</label>
                  <input 
                    id="edit-address"
                    name="address" 
                    defaultValue={selectedListing.Address || selectedListing.address} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-type">Property Type *</label>
                  <select 
                    id="edit-type"
                    name="type" 
                    defaultValue={selectedListing.Type || selectedListing.type} 
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Studio">Studio</option>
                    <option value="Condo">Condo</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-bedrooms">Bedrooms *</label>
                    <input 
                      id="edit-bedrooms"
                      name="bedrooms" 
                      type="number" 
                      min="0" 
                      defaultValue={selectedListing.Bedrooms || selectedListing.bedrooms} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-bathrooms">Bathrooms *</label>
                    <input 
                      id="edit-bathrooms"
                      name="bathrooms" 
                      type="number" 
                      min="0" 
                      step="0.5" 
                      defaultValue={selectedListing.Bathrooms || selectedListing.bathrooms} 
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-price">Monthly Rent *</label>
                  <input 
                    id="edit-price"
                    name="price" 
                    defaultValue={selectedListing.Price || selectedListing.price} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-status">Status *</label>
                  <select 
                    id="edit-status"
                    name="status" 
                    defaultValue={selectedListing.Status || selectedListing.status} 
                    required
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Sold">Sold</option>
                    <option value="Rented">Rented</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-description">Description</label>
            <textarea
                    id="edit-description"
              name="description"
              rows="4"
                    defaultValue={selectedListing.Description || selectedListing.description}
              placeholder="Describe the property features, amenities, etc."
            />
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary" 
                    onClick={closeEditListingModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="action-button primary" 
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}

      {showScheduleVisitModal && (
        <div className="modal-overlay" onClick={closeScheduleVisitModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule Visit</h3>
              <button className="modal-close" onClick={closeScheduleVisitModal}>×</button>
            </div>
            <div className="modal-body">
        <form
          className="modal-form"
          onSubmit={(e) => {
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
          }}
        >
                <div className="form-group">
                  <label htmlFor="visit-property">Property *</label>
                  <select 
                    id="visit-property"
                    name="property" 
                    defaultValue={visitProperty} 
                    required
                  >
                    <option value="">Select Property</option>
                    {listings.map((listing, index) => {
                      const address = listing.Address || listing.address;
                      const listingId = listing.ID || listing.id || `listing-${index}`;
                      return (
                        <option key={listingId} value={address}>
                          {address}
                      </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="visit-client-name">Client Name *</label>
                  <input 
                    id="visit-client-name"
                    name="clientName" 
                    placeholder="Full name" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="visit-client-email">Client Email *</label>
                  <input 
                    id="visit-client-email"
                    name="clientEmail" 
                    type="email" 
                    placeholder="email@example.com" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="visit-client-phone">Client Phone *</label>
                  <input 
                    id="visit-client-phone"
                    name="clientPhone" 
                    type="tel" 
                    placeholder="Phone number" 
                    required 
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="visit-date">Visit Date *</label>
                    <input 
                      id="visit-date"
                      name="visitDate" 
                      type="date" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="visit-time">Visit Time *</label>
                    <input 
                      id="visit-time"
                      name="visitTime" 
                      type="time" 
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="visit-notes">Notes</label>
                  <textarea 
                    id="visit-notes"
                    name="notes" 
                    rows="3" 
                    placeholder="Any special requirements or notes for the visit" 
                  />
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary" 
                    onClick={closeScheduleVisitModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="action-button primary" 
                    disabled={loading}
                  >
                    {loading ? 'Scheduling...' : 'Schedule Visit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}

      {showUpdateVisitStatusModal && selectedVisit && (
        <div className="modal-overlay" onClick={closeUpdateVisitStatusModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Visit Status</h3>
              <button className="modal-close" onClick={closeUpdateVisitStatusModal}>×</button>
            </div>
            <div className="modal-body">
              <form
                className="modal-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const status = formData.get('status');
                  const notes = formData.get('notes');
                  handleUpdateVisitStatus(status, notes);
                }}
              >
                <div className="form-group">
                  <label htmlFor="visit-status">Status *</label>
                  <select id="visit-status" name="status" required>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No-show">No-show</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="visit-status-notes">Notes</label>
                  <textarea 
                    id="visit-status-notes"
                    name="notes" 
                    rows="3" 
                    placeholder="Additional notes about the visit status..." 
                  />
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary" 
                    onClick={closeUpdateVisitStatusModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="action-button primary" 
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}

      {showFollowUpModal && selectedRequest && (
        <div className="modal-overlay" onClick={closeFollowUpModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Follow-up</h3>
              <button className="modal-close" onClick={closeFollowUpModal}>×</button>
            </div>
            <div className="modal-body">
              <form
                className="modal-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const message = formData.get('message');
                  handleFollowUpRequest(message);
                }}
              >
                <div className="form-group">
                  <label htmlFor="follow-up-message">Message *</label>
                  <textarea 
                    id="follow-up-message"
                    name="message" 
                    rows="4" 
                    placeholder="Please let us know your preferred visit time..." 
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="action-button secondary" 
                    onClick={closeFollowUpModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="action-button primary" 
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Follow-up'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}

      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification notification-${notification.type}`}>
            {notification.message}
          </div>
        ))}
        </div>
    </>
  );
};

export default SalesDashboard;
