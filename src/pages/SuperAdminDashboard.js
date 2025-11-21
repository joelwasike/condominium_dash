import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Settings,
  BarChart3,
  DollarSign,
  MessageSquarePlus,
  Megaphone,
  MessageCircle,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { superAdminService } from '../services/superAdminService';
import { API_CONFIG } from '../config/api';
import RoleLayout from '../components/RoleLayout';
import Modal from '../components/Modal';
import '../components/RoleLayout.css';
import './SuperAdminDashboard.css';
import '../pages/TechnicianDashboard.css';
import SettingsPage from './SettingsPage';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Core data for global Super Admin
  const [overviewStats, setOverviewStats] = useState(null); // agency subscription stats
  const [companies, setCompanies] = useState([]); // agencies
  const [agencyAdmins, setAgencyAdmins] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [ads, setAds] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]); // subscription/transaction history
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  // UI / filters
  const [transactionsTab, setTransactionsTab] = useState('all');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [clientsSearch, setClientsSearch] = useState('');
  const [adFilter, setAdFilter] = useState('all');
  const [newAd, setNewAd] = useState({ title: '', text: '', image: null });
  const [chatInput, setChatInput] = useState('');

  // Agency Admin Modal
  const [showAgencyAdminModal, setShowAgencyAdminModal] = useState(false);
  const [editingAgencyAdmin, setEditingAgencyAdmin] = useState(null);
  const [agencyAdminForm, setAgencyAdminForm] = useState({
    name: '',
    email: '',
    company: '',
    role: 'agency_director',
    password: ''
  });

  // Notifications
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Load data from backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        overview,
        companiesData,
        adminsData,
        financial,
        adsData,
        subscriptionsData,
      ] = await Promise.all([
        superAdminService.getOverview(),
        superAdminService.getCompanies(),
        superAdminService.getAgencyAdmins(),
        superAdminService.getFinancialOverview(),
        superAdminService.getAdvertisements(),
        superAdminService.getSubscriptions().catch(() => []), // Optional API
      ]);

      setOverviewStats(overview);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setAgencyAdmins(Array.isArray(adminsData) ? adminsData : []);
      setFinancialData(financial);
      setAds(Array.isArray(adsData) ? adsData : []);
      setSubscriptions(Array.isArray(subscriptionsData) ? subscriptionsData : []);

      // Default chat: first agency admin if any
      if (Array.isArray(adminsData) && adminsData.length > 0) {
        const firstAdminId = adminsData[0].ID || adminsData[0].id;
        setSelectedAdminId(firstAdminId);
        try {
          const chat = await superAdminService.getChatWithAdmin(firstAdminId);
          setChatMessages(Array.isArray(chat) ? chat : []);
        } catch (chatError) {
          console.error('Error loading initial chat messages:', chatError);
        }
      } else {
        setSelectedAdminId(null);
        setChatMessages([]);
      }
    } catch (error) {
      console.error('Error loading super admin data:', error);
      addNotification('Failed to load data from server', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: BarChart3 },
      { id: 'transactions', label: 'Transaction History', icon: DollarSign },
      { id: 'clients', label: 'Client List', icon: Users },
      { id: 'ads', label: 'Advertisements', icon: Megaphone },
      { id: 'chat', label: 'Messages', icon: MessageCircle },
      { id: 'settings', label: 'Profile Settings', icon: Settings }
    ],
    []
  );

  const layoutMenu = useMemo(
    () =>
      tabs.map(tab => ({
        ...tab,
        onSelect: () => setActiveTab(tab.id),
        active: activeTab === tab.id
      })),
    [tabs, activeTab]
  );

  const renderOverview = () => {
    return (
      <div className="sa-overview-page">
        <div className="sa-overview-top">
          <div className="sa-overview-chart-card">
            <div className="sa-card-header">
              <h2>Overview</h2>
              <span className="sa-card-subtitle">Weekly Subscriptions</span>
          </div>
            <div className="sa-mini-legend">
              <span className="sa-legend-item sa-legend-expected">Expected Cost (January)</span>
              <span className="sa-legend-item sa-legend-current">Current Subscription Amount</span>
          </div>
            <div className="sa-chart-placeholder">
              {/* Decorative lines only – no heavy chart library */}
              <div className="sa-chart-line sa-chart-line-expected" />
              <div className="sa-chart-line sa-chart-line-current" />
        </div>
            <div className="sa-chart-footer">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
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
              <p className="sa-metric-label">Total Received</p>
              <p className="sa-metric-period">This Week</p>
              <p className="sa-metric-value">
                CFA {overviewStats?.totalReceived?.toLocaleString() || overviewStats?.totalRevenue?.toLocaleString() || '0'}
              </p>
        </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Total Clients</p>
              <p className="sa-metric-number">
                {overviewStats?.totalClients || overviewStats?.totalAgencies || companies.length || 0}
                <span className="sa-metric-trend positive">+1.5%</span>
              </p>
          </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Total Cash</p>
              <p className="sa-metric-value">
                {overviewStats?.cashInHand
                  ? `${overviewStats.cashInHand.toLocaleString()} FCFA`
                  : financialData?.netProfit
                  ? `${financialData.netProfit.toLocaleString()} FCFA`
                  : '0 FCFA'}
              </p>
          </div>
            <div className="sa-metric-card">
              <p className="sa-metric-label">Total Ads</p>
              <p className="sa-metric-number">
                {ads.length || overviewStats?.totalAds || 0}
                <span className="sa-metric-trend negative">-1.5%</span>
              </p>
        </div>
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
        </div>
          </div>

        {/* Bottom table similar to subscriptions list in screenshot */}
        <div className="sa-section-card">
          <div className="sa-section-header">
            <h3>Agency Subscriptions</h3>
            <p>Track license payments from your client agencies.</p>
        </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
            <thead>
              <tr>
                  <th />
                  <th>Client</th>
                  <th>Account Status</th>
                  <th>Payment Status</th>
                  <th>Amount</th>
              </tr>
            </thead>
            <tbody>
                {(subscriptions.length > 0 ? subscriptions : companies || []).map((item, index) => {
                  const agency = item.agencyId ? companies.find(c => (c.ID || c.id) === item.agencyId) : item;
                  const subscription = subscriptions.find(s => (s.agencyId || s.companyId) === (agency?.ID || agency?.id));
                  return (
                    <tr key={`overview-agency-${agency?.ID || agency?.id || item.id || index}`}>
                      <td>
                      <input type="checkbox" />
                  </td>
                  <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{agency?.Name || agency?.name || item.agencyName || 'N/A'}</span>
                          <span className="sa-cell-sub">
                            {agency?.Email || agency?.email || item.email || 'example@email.com'}
                          </span>
                        </div>
                  </td>
                  <td>
                        <span className={`sa-status-pill ${(item.accountStatus || agency?.Status || agency?.status || 'active').toLowerCase()}`}>
                          {item.accountStatus || agency?.Status || agency?.status || 'Active'}
                    </span>
                  </td>
                      <td>
                        <span className={`sa-status-pill ${(item.paymentStatus || item.status || 'paid').toLowerCase()}`}>
                          {item.paymentStatus || item.status || 'Paid'}
                        </span>
                      </td>
                      <td>
                        {(item.amount || item.subscriptionAmount || agency?.SubscriptionAmount || 0).toLocaleString()} CFA
                  </td>
                </tr>
                  );
                })}
                {((!subscriptions || subscriptions.length === 0) && (!companies || companies.length === 0)) && (
                  <tr>
                    <td colSpan={5} className="sa-table-empty">
                      No subscription data available. Start the backend to see real data.
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

  // Transactions page – subscription history style
  const filteredTransactions = useMemo(() => {
    const base = subscriptions.length > 0 ? subscriptions : companies || [];
    return base.filter((item) => {
      if (transactionSearch) {
        const q = transactionSearch.toLowerCase();
        const agency = item.agencyId ? companies.find(c => (c.ID || c.id) === item.agencyId) : item;
        const name = (agency?.Name || agency?.name || item.agencyName || item.Name || item.name || '').toLowerCase();
        const email = (agency?.Email || agency?.email || item.email || item.Email || '').toLowerCase();
        const date = item.paymentDate || item.dueDate || item.createdAt || '';
        if (!name.includes(q) && !email.includes(q) && !date.includes(q)) return false;
      }
      if (transactionsTab === 'all') return true;
      const status = (item.paymentStatus || item.status || item.accountStatus || 'paid').toLowerCase();
      if (transactionsTab === 'paid') return status === 'paid' || status === 'approved';
      if (transactionsTab === 'pending') return status === 'pending' || status === 'en attente';
      if (transactionsTab === 'deactivated') return status === 'deactivated' || status === 'désactiver' || status === 'inactive';
      return true;
    });
  }, [subscriptions, companies, transactionSearch, transactionsTab]);

  const renderTransactions = () => (
    <div className="sa-transactions-page">
      <div className="sa-transactions-header">
        <h2>Transaction History</h2>
        <div className="sa-transactions-tabs">
          {['all', 'paid', 'pending', 'deactivated'].map((id) => (
            <button
              key={id}
              className={`sa-subtab-button ${transactionsTab === id ? 'active' : ''}`}
              onClick={() => setTransactionsTab(id)}
            >
              {id === 'all' && 'All'}
              {id === 'paid' && 'Paid'}
              {id === 'pending' && 'Pending'}
              {id === 'deactivated' && 'Deactivated'}
        </button>
          ))}
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
            placeholder="Search by Name, Email or Date"
            value={transactionSearch}
            onChange={(e) => setTransactionSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
            <thead>
              <tr>
              <th />
              <th>Agency</th>
              <th>Account Status</th>
              <th>Subscription Status</th>
              <th>Amount</th>
              </tr>
            </thead>
            <tbody>
            {filteredTransactions.map((item, index) => {
              const agency = item.agencyId ? companies.find(c => (c.ID || c.id) === item.agencyId) : item;
              return (
                <tr key={`transaction-${item.id || agency?.ID || agency?.id || index}`}>
                  <td>
                      <input type="checkbox" />
                  </td>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{agency?.Name || agency?.name || item.agencyName || 'N/A'}</span>
                      <span className="sa-cell-sub">
                        {agency?.Email || agency?.email || item.email || 'example@email.com'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`sa-status-pill ${(item.accountStatus || agency?.Status || agency?.status || 'active').toLowerCase()}`}>
                      {item.accountStatus || agency?.Status || agency?.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <span className={`sa-status-pill ${(item.paymentStatus || item.status || 'paid').toLowerCase()}`}>
                      {item.paymentStatus || item.status || 'Paid'}
                    </span>
                    {item.dueDate && (
                      <span className="sa-cell-sub">Due on {new Date(item.dueDate).toLocaleDateString()}</span>
                    )}
                  </td>
                  <td>
                    {(item.amount || item.subscriptionAmount || agency?.SubscriptionAmount || 0).toLocaleString()} CFA
                  </td>
                </tr>
              );
            })}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="sa-table-empty">
                  No transactions match your filters.
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
    </div>
  );

  // Clients page – list of agency admins / directors
  const filteredClients = useMemo(() => {
    const base = agencyAdmins || [];
    if (!clientsSearch) return base;
    const q = clientsSearch.toLowerCase();
    return base.filter((admin) => {
      const name = (admin.Name || admin.name || '').toLowerCase();
      const email = (admin.Email || admin.email || '').toLowerCase();
      const role = (admin.Role || admin.role || '').toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [agencyAdmins, clientsSearch]);

  const handleOpenAddAgencyAdmin = () => {
    setEditingAgencyAdmin(null);
    setAgencyAdminForm({
      name: '',
      email: '',
      company: '',
      role: 'agency_director',
      password: ''
    });
    setShowAgencyAdminModal(true);
  };

  const handleOpenEditAgencyAdmin = (admin) => {
    setEditingAgencyAdmin(admin);
    const role = admin.Role || admin.role || 'agency_director';
    // Convert hyphen to underscore if needed
    const normalizedRole = role.replace('-', '_');
    setAgencyAdminForm({
      name: admin.Name || admin.name || '',
      email: admin.Email || admin.email || '',
      company: admin.Company || admin.company || '',
      role: normalizedRole,
      password: '' // Don't pre-fill password
    });
    setShowAgencyAdminModal(true);
  };

  const handleAgencyAdminFormChange = (field, value) => {
    setAgencyAdminForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitAgencyAdmin = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        name: agencyAdminForm.name,
        email: agencyAdminForm.email,
        company: agencyAdminForm.company,
        role: agencyAdminForm.role // Must be "superadmin" or "agency_director"
      };

      if (editingAgencyAdmin) {
        // Update existing user
        if (agencyAdminForm.password) {
          userData.password = agencyAdminForm.password;
        }
        await superAdminService.updateUser(editingAgencyAdmin.ID || editingAgencyAdmin.id, userData);
        addNotification('Agency admin updated successfully!', 'success');
      } else {
        // Create new user
        if (!agencyAdminForm.password) {
          addNotification('Password is required for new admin', 'warning');
          return;
        }
        userData.password = agencyAdminForm.password;
        await superAdminService.addUser(userData);
        addNotification('Agency admin created successfully!', 'success');
      }
      setShowAgencyAdminModal(false);
      await loadData();
    } catch (error) {
      console.error('Error saving agency admin:', error);
      addNotification(editingAgencyAdmin ? 'Failed to update agency admin' : 'Failed to create agency admin', 'error');
    }
  };

  const handleDeleteAgencyAdmin = async (admin) => {
    if (window.confirm(`Are you sure you want to delete ${admin.Name || admin.name}?`)) {
      try {
        await superAdminService.deleteUser(admin.ID || admin.id);
        addNotification('Agency admin deleted successfully!', 'success');
        await loadData();
      } catch (error) {
        console.error('Error deleting agency admin:', error);
        addNotification('Failed to delete agency admin', 'error');
      }
    }
  };

  const renderClients = () => (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Client List</h2>
          <p>{filteredClients.length} results found</p>
        </div>
        <div className="sa-clients-header-right">
          <button className="sa-primary-cta" onClick={handleOpenAddAgencyAdmin}>
            <Plus size={16} />
            Add Agency Admin
        </button>
          <button className="sa-sort-button">Sort: Creation Date</button>
          <button className="sa-date-button">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</button>
        </div>
      </div>

      <div className="sa-table-wrapper">
        <table className="sa-table">
            <thead>
              <tr>
              <th>No</th>
              <th>Client</th>
              <th>Email</th>
                <th>Company</th>
              <th>Registration Date</th>
              <th>Role</th>
              <th />
              </tr>
            </thead>
            <tbody>
            {filteredClients.map((admin, index) => {
              const companyName = admin.companyDetails?.name || admin.CompanyDetails?.name || admin.Company || admin.company || 'N/A';
              return (
              <tr key={`client-${admin.ID || admin.id || index}`}>
                <td>{index + 1}</td>
                <td className="sa-cell-main">
                  <span className="sa-cell-title">{admin.Name || admin.name}</span>
                  </td>
                <td>{admin.Email || admin.email}</td>
                <td>{companyName}</td>
                  <td>
                  {admin.CreatedAt
                    ? new Date(admin.CreatedAt).toLocaleDateString()
                    : 'N/A'}
                  </td>
                <td>{admin.Role || admin.role || 'Director'}</td>
                <td className="sa-row-actions">
                  <button className="sa-icon-button" onClick={() => handleOpenEditAgencyAdmin(admin)} title="Edit">✏️</button>
                  <button className="sa-icon-button" onClick={() => handleDeleteAgencyAdmin(admin)} title="Delete">🗑️</button>
                  </td>
                </tr>
              );
            })}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={7} className="sa-table-empty">
                  No clients match your search.
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>

      {/* Agency Admin Modal */}
      <Modal
        isOpen={showAgencyAdminModal}
        onClose={() => setShowAgencyAdminModal(false)}
        title={editingAgencyAdmin ? 'Edit Agency Admin' : 'Add Agency Admin'}
        size="md"
      >
        <form onSubmit={handleSubmitAgencyAdmin} className="sa-form">
          <div className="sa-form-group">
            <label>Name *</label>
            <input
              type="text"
              value={agencyAdminForm.name}
              onChange={(e) => handleAgencyAdminFormChange('name', e.target.value)}
              required
              placeholder="Enter admin name"
            />
          </div>
          <div className="sa-form-group">
            <label>Email *</label>
            <input
              type="email"
              value={agencyAdminForm.email}
              onChange={(e) => handleAgencyAdminFormChange('email', e.target.value)}
              required
              placeholder="Enter email address"
            />
          </div>
          <div className="sa-form-group">
            <label>Company *</label>
            <input
              type="text"
              value={agencyAdminForm.company}
              onChange={(e) => handleAgencyAdminFormChange('company', e.target.value)}
              required
              placeholder="Enter company name"
            />
          </div>
          <div className="sa-form-group">
            <label>Role *</label>
            <select
              value={agencyAdminForm.role}
              onChange={(e) => handleAgencyAdminFormChange('role', e.target.value)}
              required
            >
              <option value="agency_director">Agency Director</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          <div className="sa-form-group">
            <label>Password {editingAgencyAdmin ? '(leave blank to keep current)' : '*'}</label>
            <input
              type="password"
              value={agencyAdminForm.password}
              onChange={(e) => handleAgencyAdminFormChange('password', e.target.value)}
              required={!editingAgencyAdmin}
              placeholder={editingAgencyAdmin ? "Enter new password (optional)" : "Enter password"}
            />
          </div>
          <div className="sa-form-actions">
            <button type="button" className="sa-outline-button" onClick={() => setShowAgencyAdminModal(false)}>
              Cancel
            </button>
            <button type="submit" className="sa-primary-cta">
              {editingAgencyAdmin ? 'Update' : 'Create'} Agency Admin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );

  // Advertisements page
  const filteredAds = useMemo(() => {
    if (adFilter === 'all') return ads || [];
    return (ads || []).filter((ad) =>
      (ad.Status || ad.status || 'active').toLowerCase() === adFilter
    );
  }, [ads, adFilter]);

  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!newAd.title || !newAd.text) {
      addNotification('Please provide a title and description for the advertisement.', 'warning');
      return;
    }
    if (!newAd.image) {
      addNotification('Please upload an image file for the advertisement.', 'warning');
      return;
    }
    try {
      await superAdminService.createAdvertisement(newAd);
      addNotification('Advertisement created successfully!', 'success');
      setNewAd({ title: '', text: '', image: null });
      // Reset file input
      const fileInput = document.querySelector('input[type="file"][name="ad-image"]');
      if (fileInput) fileInput.value = '';
      await loadData();
    } catch (error) {
      console.error('Error creating advertisement:', error);
      addNotification(error.message || 'Failed to create advertisement', 'error');
    }
  };

  const renderAds = () => (
    <div className="sa-ads-page">
      <div className="sa-ads-header">
        <h2>Advertisements Overview</h2>
        <button className="sa-primary-cta" onClick={() => document.querySelector('.sa-create-ad-form')?.scrollIntoView({ behavior: 'smooth' })}>
          <MessageSquarePlus size={16} />
          Create Ad
        </button>
            </div>

      <div className="sa-ads-list">
        {filteredAds.map((ad, index) => {
          const status = (ad.Status || ad.status || 'published').toLowerCase();
          const statusLabels = {
            published: 'Published',
            pause: 'Paused',
            scheduled: 'Scheduled',
            finished: 'Finished'
          };
          // Build full image URL with base URL
          const imageUrl = ad.ImageURL || ad.imageUrl || ad.imageURL;
          const fullImageUrl = imageUrl 
            ? (imageUrl.startsWith('http') ? imageUrl : `${API_CONFIG.BASE_URL}${imageUrl}`)
            : null;

          return (
            <div key={`ad-${ad.id || ad.ID || index}`} className="sa-ad-card">
              <div className="sa-ad-status-column">
                <span className={`sa-ad-status ${status}`}>ads | {statusLabels[status] || 'Published'}</span>
            </div>
              <div className="sa-ad-main">
                {fullImageUrl && (
                  <img 
                    src={fullImageUrl} 
                    alt={ad.title || ad.Title || 'Advertisement'} 
                    className="sa-ad-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <h3>{ad.title || ad.Title || 'Untitled Advertisement'}</h3>
                <span className="sa-ad-tag">
                  {ad.commissionLabel || ad.commission || '50% COMMISSION'}
                </span>
                <p>{ad.Text || ad.text || ad.description || ad.Description || 'No description available'}</p>
            </div>
              <div className="sa-ad-right">
                <button className="sa-outline-button" onClick={() => addNotification('View ad functionality coming soon', 'info')}>View Ad</button>
            </div>
          </div>
          );
        })}
        {filteredAds.length === 0 && (
          <div className="sa-table-empty">
            No advertisements yet. Use the form below to create your first campaign.
            </div>
      )}
      </div>

      <div className="sa-section-card sa-create-ad-card">
        <h3>Add Advertisement</h3>
        <form className="sa-create-ad-form" onSubmit={handleCreateAd}>
          <input
            type="text"
            placeholder="Advertisement Title"
            value={newAd.title}
            onChange={(e) => setNewAd((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <textarea
            placeholder="Text / Description"
            value={newAd.text}
            onChange={(e) => setNewAd((prev) => ({ ...prev, text: e.target.value }))}
            required
          />
          <input
            type="file"
            name="ad-image"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Validate file type
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                  addNotification('Invalid file type. Allowed types: jpg, jpeg, png, gif, webp', 'error');
                  e.target.value = '';
                  return;
                }
                setNewAd((prev) => ({ ...prev, image: file }));
              } else {
                setNewAd((prev) => ({ ...prev, image: null }));
              }
            }}
            required
          />
          <button type="submit" className="sa-primary-cta">
            <Megaphone size={16} />
            Publish
          </button>
        </form>
      </div>
    </div>
  );

  // Chat page
  const loadChatForAdmin = useCallback(
    async (adminId) => {
      try {
        setSelectedAdminId(adminId);
        const chat = await superAdminService.getChatWithAdmin(adminId);
        setChatMessages(Array.isArray(chat) ? chat : []);
      } catch (error) {
        console.error('Error loading chat for admin:', error);
        addNotification('Failed to load chat messages', 'error');
      }
    },
    [addNotification]
  );

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedAdminId) return;
    
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
    setChatInput('');
    try {
      const payload = {
        fromUserId: currentUserId,
        toUserId: selectedAdminId,
        content,
      };
      await superAdminService.sendChatMessage(payload);
      
      // Reload chat to get the latest messages from server (including the one we just sent)
      if (selectedAdminId) {
        await loadChatForAdmin(selectedAdminId);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      addNotification(error.message || 'Failed to send message', 'error');
    }
  };

  const renderChat = () => (
    <div className="sa-chat-page">
      <div className="sa-chat-layout">
        <div className="sa-chat-list">
          <h3>Conversations</h3>
          <ul>
            {(agencyAdmins || []).map((admin) => {
              const adminId = admin.ID || admin.id;
              const active = adminId === selectedAdminId;
              return (
                <li
                  key={`chat-admin-${adminId}`}
                  className={active ? 'active' : ''}
                  onClick={() => loadChatForAdmin(adminId)}
                >
                  <div className="sa-cell-main">
                    <span className="sa-cell-title">{admin.Name || admin.name}</span>
                    <span className="sa-cell-sub">{admin.Email || admin.email}</span>
          </div>
                </li>
              );
            })}
          </ul>
          </div>
          
        <div className="sa-chat-conversation">
          <div className="sa-chat-header">
            <h3>Messages</h3>
            {selectedAdminId && (
              <span className="sa-chat-subtitle">
                Chat with{' '}
                {
                  (agencyAdmins.find((a) => (a.ID || a.id) === selectedAdminId) || {})
                    .Name || 'Agency Admin'
                }
                        </span>
            )}
          </div>
          <div className="sa-chat-messages">
            {chatMessages.map((msg, index) => {
              // Handle both lowercase and camelCase field names
              const messageContent = msg.content || msg.Content || '';
              const messageCreatedAt = msg.createdAt || msg.CreatedAt || '';
              const messageFromUserId = msg.fromUserId || msg.FromUserId;
              const messageId = msg.id || msg.ID || index;
              
              // Determine if message is outgoing or incoming
              // Compare IDs as strings to handle type mismatches
              const storedUser = localStorage.getItem('user');
              let isOutgoing = false;
              if (storedUser) {
                try {
                  const user = JSON.parse(storedUser);
                  const currentUserId = user.id || user.ID;
                  // Convert both to strings for reliable comparison
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
                Select an agency admin on the left to start a conversation.
        </div>
      )}
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
            />
            <button className="sa-primary-cta" onClick={handleSendMessage}>
              <MessageCircle size={16} />
              Send
            </button>
          </div>
          </div>
          
        <div className="sa-chat-details">
          <h4>Contact Details</h4>
          {selectedAdminId ? (
            (() => {
              const admin =
                agencyAdmins.find((a) => (a.ID || a.id) === selectedAdminId) || {};
              return (
                <>
                  <p>
                    <strong>Name:</strong> {admin.Name || admin.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {admin.Email || admin.email}
                  </p>
                  <p>
                    <strong>Company:</strong> {admin.Company || admin.company}
                  </p>
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

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'transactions':
        return renderTransactions();
      case 'clients':
        return renderClients();
      case 'ads':
        return renderAds();
      case 'chat':
        return renderChat();
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
        brand={{ name: 'SAAF IMMO', caption: 'Super Admin', logo: 'SAAF', logoImage: `${process.env.PUBLIC_URL}/download.jpeg` }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}
      >
        {({ activeId }) => (
          <div className="content-body super-admin-content">
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
    </>
  );
};

export default SuperAdminDashboard;
