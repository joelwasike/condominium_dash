import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Users,
  Settings,
  BarChart3,
  DollarSign,
  MessageCircle,
  Megaphone,
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  CreditCard,
  TrendingUp,
  UserCheck,
  XCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { superAdminService } from '../services/superAdminService';
import { API_CONFIG } from '../config/api';
import { isDemoMode, getSuperAdminDemoData } from '../utils/demoData';
import RoleLayout from '../components/RoleLayout';
import Modal from '../components/Modal';
import AdvertisementsList from '../components/AdvertisementsList';
import MessagingPanel from '../components/MessagingPanel';
import SettingsPage from './SettingsPage';
import { t, getLanguage } from '../utils/i18n';
import '../components/RoleLayout.css';
import './SuperAdminDashboard.css';
import '../pages/TechnicianDashboard.css';

/* ─── inline style helpers ─── */
const cardBase = {
  background: '#fff',
  borderRadius: '20px',
  boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
  border: '1px solid #f1f5f9',
  padding: '24px',
};

const metricCardStyle = (accentColor) => ({
  ...cardBase,
  borderLeft: `4px solid ${accentColor}`,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

const metricLabel = { margin: 0, fontSize: '0.82rem', color: '#64748b', fontWeight: 500 };
const metricValue = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' };

const statusPill = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'paid' || s === 'approved' || s === 'completed')
    return { display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534' };
  if (s === 'inactive' || s === 'deactivated' || s === 'cancelled')
    return { display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: '#fee2e2', color: '#991b1b' };
  if (s === 'pending' || s === 'overdue' || s === 'en attente')
    return { display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: '#fef9c3', color: '#854d0e' };
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#475569' };
};

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' };
const thStyle = { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' };
const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#334155' };
const trHover = { transition: 'background 0.15s' };

const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' };
const btnOutline = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fff', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' };
const btnDanger = { ...btnOutline, color: '#dc2626', borderColor: '#dc2626' };
const btnSmall = { padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', border: 'none', cursor: 'pointer', fontWeight: 500 };

const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', marginBottom: '4px', fontSize: '0.82rem', fontWeight: 600, color: '#374151' };
const formGroupStyle = { marginBottom: '16px' };

const searchBarStyle = {
  display: 'flex', alignItems: 'center', gap: '8px',
  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
  padding: '8px 14px', flex: 1, maxWidth: '360px',
};

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const carouselIntervalRef = useRef(null);

  // Core data
  const [overviewStats, setOverviewStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [agencyAdmins, setAgencyAdmins] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [ads, setAds] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [agencyPayments, setAgencyPayments] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  // UI / filters
  const [companiesSearch, setCompaniesSearch] = useState('');
  const [companiesStatusFilter, setCompaniesStatusFilter] = useState('all');
  const [directorsSearch, setDirectorsSearch] = useState('');
  const [newAd, setNewAd] = useState({ title: '', text: '', image: null });
  const [chatInput, setChatInput] = useState('');

  // Company Modal
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({ name: '', email: '', phone: '', address: '', licenseNumber: '' });

  // Agency Admin Modal
  const [showAgencyAdminModal, setShowAgencyAdminModal] = useState(false);
  const [editingAgencyAdmin, setEditingAgencyAdmin] = useState(null);
  const [agencyAdminForm, setAgencyAdminForm] = useState({ name: '', email: '', company: '', role: 'agency_director', password: '' });

  // Notifications
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('demo_mode');
    window.location.href = '/';
  };

  /* ─── data loading ─── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        const demoData = getSuperAdminDemoData();
        setOverviewStats(demoData.overview);
        setCompanies(demoData.agencies || []);
        setAgencyAdmins([]);
        setFinancialData(demoData.overview);
        setAds([]);
        setSubscriptions([]);
        setAgencyPayments([]);
        setSelectedAdminId(null);
        setChatMessages([]);
        setLoading(false);
        return;
      }

      const [overview, companiesData, adminsData, financial, adsData, subscriptionsData, paymentsData] = await Promise.all([
        superAdminService.getOverview().catch(() => null),
        superAdminService.getCompanies().catch(() => []),
        superAdminService.getAgencyAdmins().catch(() => []),
        superAdminService.getFinancialOverview().catch(() => null),
        superAdminService.getAdvertisements().catch(() => []),
        superAdminService.getSubscriptions().catch(() => []),
        superAdminService.getAgencyPayments().catch(() => []),
      ]);

      setOverviewStats(overview);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setAgencyAdmins(Array.isArray(adminsData) ? adminsData : []);
      setFinancialData(financial);
      setAds(Array.isArray(adsData) ? adsData : []);
      setSubscriptions(Array.isArray(subscriptionsData) ? subscriptionsData : []);
      setAgencyPayments(Array.isArray(paymentsData) ? paymentsData : []);

      if (Array.isArray(adminsData) && adminsData.length > 0) {
        const firstAdminId = adminsData[0].ID || adminsData[0].id;
        setSelectedAdminId(firstAdminId);
        try {
          const chat = await superAdminService.getChatWithAdmin(firstAdminId);
          setChatMessages(Array.isArray(chat) ? chat : []);
        } catch (e) {
          console.error('Error loading initial chat:', e);
        }
      }
    } catch (error) {
      console.error('Error loading super admin data:', error);
      if (!isDemoMode()) addNotification('Failed to load data from server', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ─── tabs config ─── */
  const tabs = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'directors', label: 'Directors', icon: Users },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'ads', label: 'Advertisements', icon: Megaphone },
    { id: 'chat', label: 'Messages', icon: MessageCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ], []);

  const layoutMenu = useMemo(() =>
    tabs.map(tab => ({ ...tab, onSelect: () => setActiveTab(tab.id), active: activeTab === tab.id })),
    [tabs, activeTab]
  );

  /* ─── chart data helpers ─── */
  const revenueChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const totalRev = overviewStats?.totalRevenue || financialData?.totalRevenue || 0;
    const totalPay = overviewStats?.totalPayments || financialData?.totalPayments || 0;
    return months.map((month, i) => ({
      month,
      revenue: Math.round(totalRev * (0.6 + i * 0.08)),
      payments: Math.round(totalPay * (0.5 + i * 0.1)),
    }));
  }, [overviewStats, financialData]);

  /* ═════════════════════════════════════════════════
     1. OVERVIEW TAB
  ═════════════════════════════════════════════════ */
  const renderOverview = () => {
    const totalAgencies = overviewStats?.totalAgencies || companies.length || 0;
    const activeAgencies = overviewStats?.activeAgencies || companies.filter(c => (c.Status || c.status || '').toLowerCase() === 'active').length || 0;
    const totalRevenue = overviewStats?.totalRevenue || financialData?.totalRevenue || 0;
    const pendingPayments = overviewStats?.pendingPayments || 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          <div style={metricCardStyle('#3b82f6')}>
            <p style={metricLabel}>Total Agencies</p>
            <p style={metricValue}>{totalAgencies}</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>Registered companies</p>
          </div>
          <div style={metricCardStyle('#10b981')}>
            <p style={metricLabel}>Active Agencies</p>
            <p style={metricValue}>{activeAgencies}</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#10b981' }}>{totalAgencies > 0 ? Math.round((activeAgencies / totalAgencies) * 100) : 0}% active</p>
          </div>
          <div style={metricCardStyle('#8b5cf6')}>
            <p style={metricLabel}>Total Revenue</p>
            <p style={metricValue}>{totalRevenue.toLocaleString()} CFA</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>From subscriptions</p>
          </div>
          <div style={metricCardStyle('#f59e0b')}>
            <p style={metricLabel}>Pending Payments</p>
            <p style={metricValue}>{typeof pendingPayments === 'number' ? pendingPayments.toLocaleString() : pendingPayments} CFA</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#f59e0b' }}>Awaiting settlement</p>
          </div>
        </div>

        {/* Revenue chart */}
        <div style={{ ...cardBase, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Subscription Revenue</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Monthly revenue overview (last 6 months)</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <defs>
                  <linearGradient id="saColorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="saColorPayments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '8px 12px' }}
                  formatter={(value, name) => [`${value.toLocaleString()} CFA`, name === 'revenue' ? 'Revenue' : 'Payments']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="line" />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fill="url(#saColorRevenue)" dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} name="Revenue" />
                <Area type="monotone" dataKey="payments" stroke="#10b981" strokeWidth={3} fill="url(#saColorPayments)" dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} name="Payments" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agency subscriptions table */}
        <div style={cardBase}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Agency Subscriptions</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Track license payments from agencies</p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Agency</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Account Status</th>
                  <th style={thStyle}>Subscription</th>
                  <th style={thStyle}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(companies.length > 0 ? companies : []).map((company, index) => {
                  const companyId = company.ID || company.id;
                  const sub = subscriptions.find(s => (s.agencyId || s.companyId) === companyId);
                  const acctStatus = company.Status || company.status || 'Active';
                  const subStatus = sub?.paymentStatus || sub?.status || company.SubscriptionStatus || 'Paid';
                  return (
                    <tr key={`overview-co-${companyId || index}`} style={trHover}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{company.Name || company.name || 'N/A'}</span>
                      </td>
                      <td style={tdStyle}>{company.Email || company.email || '-'}</td>
                      <td style={tdStyle}><span style={statusPill(acctStatus)}>{acctStatus}</span></td>
                      <td style={tdStyle}><span style={statusPill(subStatus)}>{subStatus}</span></td>
                      <td style={tdStyle}>{(sub?.amount || company.SubscriptionAmount || 0).toLocaleString()} CFA</td>
                    </tr>
                  );
                })}
                {companies.length === 0 && (
                  <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No agency data available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ═════════════════════════════════════════════════
     2. COMPANIES TAB
  ═════════════════════════════════════════════════ */
  const filteredCompanies = useMemo(() => {
    let list = companies || [];
    if (companiesSearch) {
      const q = companiesSearch.toLowerCase();
      list = list.filter(c =>
        (c.Name || c.name || '').toLowerCase().includes(q) ||
        (c.Email || c.email || '').toLowerCase().includes(q) ||
        (c.Phone || c.phone || '').toLowerCase().includes(q)
      );
    }
    if (companiesStatusFilter !== 'all') {
      list = list.filter(c => (c.Status || c.status || '').toLowerCase() === companiesStatusFilter);
    }
    return list;
  }, [companies, companiesSearch, companiesStatusFilter]);

  const handleOpenAddCompany = () => {
    setEditingCompany(null);
    setCompanyForm({ name: '', email: '', phone: '', address: '', licenseNumber: '' });
    setShowCompanyModal(true);
  };

  const handleOpenEditCompany = (company) => {
    setEditingCompany(company);
    setCompanyForm({
      name: company.Name || company.name || '',
      email: company.Email || company.email || '',
      phone: company.Phone || company.phone || '',
      address: company.Address || company.address || '',
      licenseNumber: company.LicenseNumber || company.licenseNumber || '',
    });
    setShowCompanyModal(true);
  };

  const handleSubmitCompany = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await superAdminService.updateCompany(editingCompany.ID || editingCompany.id, companyForm);
        addNotification('Company updated successfully!', 'success');
      } else {
        await superAdminService.addCompany(companyForm);
        addNotification('Company created successfully!', 'success');
      }
      setShowCompanyModal(false);
      await loadData();
    } catch (error) {
      console.error('Error saving company:', error);
      addNotification(error.message || 'Failed to save company', 'error');
    }
  };

  const handleToggleCompanyStatus = async (company) => {
    const status = (company.Status || company.status || '').toLowerCase();
    const companyId = company.ID || company.id;
    try {
      if (status === 'active') {
        await superAdminService.deactivateCompany(companyId, 'Deactivated by admin');
        addNotification('Company deactivated', 'success');
      } else {
        await superAdminService.reactivateCompany(companyId);
        addNotification('Company reactivated', 'success');
      }
      await loadData();
    } catch (error) {
      console.error('Error toggling company status:', error);
      addNotification('Failed to update company status', 'error');
    }
  };

  const handleDeleteCompany = async (company) => {
    if (!window.confirm(`Delete "${company.Name || company.name}"? This cannot be undone.`)) return;
    try {
      await superAdminService.deleteCompany(company.ID || company.id);
      addNotification('Company deleted', 'success');
      await loadData();
    } catch (error) {
      console.error('Error deleting company:', error);
      addNotification('Failed to delete company', 'error');
    }
  };

  const renderCompanies = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#1e293b' }}>Companies / Agencies</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>{filteredCompanies.length} results</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={searchBarStyle}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search agencies..."
              value={companiesSearch}
              onChange={(e) => setCompaniesSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.88rem', flex: 1 }}
            />
          </div>
          <select
            value={companiesStatusFilter}
            onChange={(e) => setCompaniesStatusFilter(e.target.value)}
            style={{ ...inputStyle, width: 'auto', minWidth: '140px' }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <button style={btnPrimary} onClick={handleOpenAddCompany}><Plus size={16} /> Add Agency</button>
        </div>
      </div>

      <div style={{ ...cardBase, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Subscription</th>
                <th style={thStyle}>Created</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company, index) => {
                const companyId = company.ID || company.id;
                const status = company.Status || company.status || 'Active';
                const subStatus = company.SubscriptionStatus || company.subscriptionStatus || '-';
                const isActive = status.toLowerCase() === 'active';
                return (
                  <tr key={`company-${companyId || index}`} style={trHover}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{company.Name || company.name}</span>
                      {company.LicenseNumber && <br />}
                      {company.LicenseNumber && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>License: {company.LicenseNumber}</span>}
                    </td>
                    <td style={tdStyle}>{company.Email || company.email || '-'}</td>
                    <td style={tdStyle}>{company.Phone || company.phone || '-'}</td>
                    <td style={tdStyle}><span style={statusPill(status)}>{status}</span></td>
                    <td style={tdStyle}><span style={statusPill(subStatus)}>{subStatus}</span></td>
                    <td style={tdStyle}>{company.CreatedAt ? new Date(company.CreatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button style={{ ...btnSmall, background: '#eff6ff', color: '#3b82f6' }} onClick={() => handleOpenEditCompany(company)} title="Edit"><Edit2 size={14} /></button>
                        <button style={{ ...btnSmall, background: isActive ? '#fef3c7' : '#dcfce7', color: isActive ? '#92400e' : '#166534' }} onClick={() => handleToggleCompanyStatus(company)} title={isActive ? 'Deactivate' : 'Reactivate'}>
                          {isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button style={{ ...btnSmall, background: '#fee2e2', color: '#dc2626' }} onClick={() => handleDeleteCompany(company)} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCompanies.length === 0 && (
                <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No agencies found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Modal */}
      <Modal isOpen={showCompanyModal} onClose={() => setShowCompanyModal(false)} title={editingCompany ? 'Edit Agency' : 'Add Agency'} size="md">
        <form onSubmit={handleSubmitCompany}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Company Name *</label>
            <input style={inputStyle} type="text" value={companyForm.name} onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))} required placeholder="Agency name" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" value={companyForm.email} onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))} required placeholder="company@email.com" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} type="text" value={companyForm.phone} onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+237 600 000 000" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Address</label>
            <input style={inputStyle} type="text" value={companyForm.address} onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Company address" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>License Number</label>
            <input style={inputStyle} type="text" value={companyForm.licenseNumber} onChange={(e) => setCompanyForm(prev => ({ ...prev, licenseNumber: e.target.value }))} placeholder="License / Registration number" />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" style={btnOutline} onClick={() => setShowCompanyModal(false)}>Cancel</button>
            <button type="submit" style={btnPrimary}>{editingCompany ? 'Update' : 'Create'} Agency</button>
          </div>
        </form>
      </Modal>
    </div>
  );

  /* ═════════════════════════════════════════════════
     3. DIRECTORS TAB
  ═════════════════════════════════════════════════ */
  const filteredDirectors = useMemo(() => {
    const base = agencyAdmins || [];
    if (!directorsSearch) return base;
    const q = directorsSearch.toLowerCase();
    return base.filter(a =>
      (a.Name || a.name || '').toLowerCase().includes(q) ||
      (a.Email || a.email || '').toLowerCase().includes(q) ||
      (a.Company || a.company || '').toLowerCase().includes(q)
    );
  }, [agencyAdmins, directorsSearch]);

  const handleOpenAddDirector = () => {
    setEditingAgencyAdmin(null);
    setAgencyAdminForm({ name: '', email: '', company: '', role: 'agency_director', password: '' });
    setShowAgencyAdminModal(true);
  };

  const handleOpenEditDirector = (admin) => {
    setEditingAgencyAdmin(admin);
    const role = (admin.Role || admin.role || 'agency_director').replace('-', '_');
    setAgencyAdminForm({
      name: admin.Name || admin.name || '',
      email: admin.Email || admin.email || '',
      company: admin.Company || admin.company || '',
      role,
      password: '',
    });
    setShowAgencyAdminModal(true);
  };

  const handleSubmitDirector = async (e) => {
    e.preventDefault();
    try {
      const userData = { name: agencyAdminForm.name, email: agencyAdminForm.email, company: agencyAdminForm.company, role: agencyAdminForm.role };
      if (editingAgencyAdmin) {
        if (agencyAdminForm.password) userData.password = agencyAdminForm.password;
        await superAdminService.updateUser(editingAgencyAdmin.ID || editingAgencyAdmin.id, userData);
        addNotification('Director updated successfully!', 'success');
      } else {
        if (!agencyAdminForm.password) { addNotification('Password is required', 'warning'); return; }
        userData.password = agencyAdminForm.password;
        await superAdminService.addUser(userData);
        addNotification('Director created successfully!', 'success');
      }
      setShowAgencyAdminModal(false);
      await loadData();
    } catch (error) {
      console.error('Error saving director:', error);
      addNotification(error.message || 'Failed to save director', 'error');
    }
  };

  const handleDeleteDirector = async (admin) => {
    if (!window.confirm(`Delete ${admin.Name || admin.name}?`)) return;
    try {
      await superAdminService.deleteUser(admin.ID || admin.id);
      addNotification('Director deleted', 'success');
      await loadData();
    } catch (error) {
      console.error('Error deleting director:', error);
      addNotification('Failed to delete director', 'error');
    }
  };

  const renderDirectors = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#1e293b' }}>Agency Directors</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>{filteredDirectors.length} directors</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={searchBarStyle}>
            <Search size={16} color="#94a3b8" />
            <input type="text" placeholder="Search directors..." value={directorsSearch} onChange={(e) => setDirectorsSearch(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.88rem', flex: 1 }} />
          </div>
          <button style={btnPrimary} onClick={handleOpenAddDirector}><Plus size={16} /> Add Director</button>
        </div>
      </div>

      <div style={{ ...cardBase, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDirectors.map((admin, index) => {
                const companyName = admin.companyDetails?.name || admin.CompanyDetails?.name || admin.Company || admin.company || 'N/A';
                const status = admin.Status || admin.status || 'Active';
                const role = admin.Role || admin.role || 'agency_director';
                const roleLabel = role === 'superadmin' ? 'Super Admin' : role === 'agency_director' ? 'Agency Director' : role;
                return (
                  <tr key={`dir-${admin.ID || admin.id || index}`} style={trHover}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}>{index + 1}</td>
                    <td style={tdStyle}><span style={{ fontWeight: 600, color: '#1e293b' }}>{admin.Name || admin.name}</span></td>
                    <td style={tdStyle}>{admin.Email || admin.email}</td>
                    <td style={tdStyle}>{companyName}</td>
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: role === 'superadmin' ? '#fee2e2' : '#e0e7ff', color: role === 'superadmin' ? '#991b1b' : '#3730a3' }}>
                        {roleLabel}
                      </span>
                    </td>
                    <td style={tdStyle}><span style={statusPill(status)}>{status}</span></td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button style={{ ...btnSmall, background: '#eff6ff', color: '#3b82f6' }} onClick={() => handleOpenEditDirector(admin)} title="Edit"><Edit2 size={14} /></button>
                        <button style={{ ...btnSmall, background: '#fee2e2', color: '#dc2626' }} onClick={() => handleDeleteDirector(admin)} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredDirectors.length === 0 && (
                <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No directors found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Director Modal */}
      <Modal isOpen={showAgencyAdminModal} onClose={() => setShowAgencyAdminModal(false)} title={editingAgencyAdmin ? 'Edit Director' : 'Add Director'} size="md">
        <form onSubmit={handleSubmitDirector}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} type="text" value={agencyAdminForm.name} onChange={(e) => setAgencyAdminForm(prev => ({ ...prev, name: e.target.value }))} required placeholder="Director name" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" value={agencyAdminForm.email} onChange={(e) => setAgencyAdminForm(prev => ({ ...prev, email: e.target.value }))} required placeholder="email@example.com" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Company *</label>
            {companies.length > 0 ? (
              <select style={inputStyle} value={agencyAdminForm.company} onChange={(e) => setAgencyAdminForm(prev => ({ ...prev, company: e.target.value }))} required>
                <option value="">Select a company</option>
                {companies.map((c, i) => (
                  <option key={`co-opt-${c.ID || c.id || i}`} value={c.Name || c.name}>{c.Name || c.name}</option>
                ))}
              </select>
            ) : (
              <input style={inputStyle} type="text" value={agencyAdminForm.company} onChange={(e) => setAgencyAdminForm(prev => ({ ...prev, company: e.target.value }))} required placeholder="Company name" />
            )}
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Role *</label>
            <select style={inputStyle} value={agencyAdminForm.role} onChange={(e) => setAgencyAdminForm(prev => ({ ...prev, role: e.target.value }))} required>
              <option value="agency_director">Agency Director</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Password {editingAgencyAdmin ? '(leave blank to keep current)' : '*'}</label>
            <input style={inputStyle} type="password" value={agencyAdminForm.password} onChange={(e) => setAgencyAdminForm(prev => ({ ...prev, password: e.target.value }))} required={!editingAgencyAdmin} placeholder={editingAgencyAdmin ? 'New password (optional)' : 'Enter password'} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" style={btnOutline} onClick={() => setShowAgencyAdminModal(false)}>Cancel</button>
            <button type="submit" style={btnPrimary}>{editingAgencyAdmin ? 'Update' : 'Create'} Director</button>
          </div>
        </form>
      </Modal>
    </div>
  );

  /* ═════════════════════════════════════════════════
     4. FINANCIAL TAB
  ═════════════════════════════════════════════════ */
  const renderFinancial = () => {
    const totalRevenue = financialData?.totalRevenue || overviewStats?.totalRevenue || 0;
    const activeSubs = subscriptions.filter(s => (s.status || s.paymentStatus || '').toLowerCase() === 'active' || (s.status || s.paymentStatus || '').toLowerCase() === 'paid').length || overviewStats?.activeSubscriptions || 0;
    const overduePay = subscriptions.filter(s => (s.status || s.paymentStatus || '').toLowerCase() === 'overdue' || (s.status || s.paymentStatus || '').toLowerCase() === 'pending').length || overviewStats?.overduePayments || 0;
    const netProfit = financialData?.netProfit || 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          <div style={metricCardStyle('#3b82f6')}>
            <p style={metricLabel}>Total Revenue</p>
            <p style={metricValue}>{totalRevenue.toLocaleString()} CFA</p>
          </div>
          <div style={metricCardStyle('#10b981')}>
            <p style={metricLabel}>Active Subscriptions</p>
            <p style={metricValue}>{activeSubs}</p>
          </div>
          <div style={metricCardStyle('#f59e0b')}>
            <p style={metricLabel}>Overdue Payments</p>
            <p style={metricValue}>{overduePay}</p>
          </div>
          <div style={metricCardStyle('#8b5cf6')}>
            <p style={metricLabel}>Net Profit</p>
            <p style={metricValue}>{netProfit.toLocaleString()} CFA</p>
          </div>
        </div>

        {/* Revenue chart */}
        <div style={cardBase}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Revenue Trend</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <defs>
                  <linearGradient id="saFinRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '8px 12px' }}
                  formatter={(value) => [`${value.toLocaleString()} CFA`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fill="url(#saFinRevenue)" dot={{ fill: '#8b5cf6', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription payments table */}
        <div style={cardBase}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Subscription Payments</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={thStyle}>Agency</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(subscriptions.length > 0 ? subscriptions : companies).map((item, index) => {
                  const agency = item.agencyId ? companies.find(c => (c.ID || c.id) === item.agencyId) : item;
                  const payDate = item.paymentDate || item.dueDate || item.createdAt || item.CreatedAt || agency?.CreatedAt;
                  const payStatus = item.paymentStatus || item.status || 'Paid';
                  return (
                    <tr key={`fin-sub-${item.id || item.ID || index}`} style={trHover}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={tdStyle}><span style={{ fontWeight: 600 }}>{agency?.Name || agency?.name || item.agencyName || 'N/A'}</span></td>
                      <td style={tdStyle}>{payDate ? new Date(payDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                      <td style={tdStyle}><span style={statusPill(payStatus)}>{payStatus}</span></td>
                      <td style={tdStyle}>{(item.amount || item.subscriptionAmount || agency?.SubscriptionAmount || 0).toLocaleString()} CFA</td>
                    </tr>
                  );
                })}
                {subscriptions.length === 0 && companies.length === 0 && (
                  <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No payment records.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agency payments table */}
        {agencyPayments.length > 0 && (
          <div style={cardBase}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Agency Payment Records</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={thStyle}>Agency</th>
                    <th style={thStyle}>Reference</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {agencyPayments.map((payment, index) => {
                    const pStatus = payment.status || payment.Status || 'Completed';
                    return (
                      <tr key={`ap-${payment.id || payment.ID || index}`} style={trHover}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={tdStyle}>{payment.agencyName || payment.AgencyName || 'N/A'}</td>
                        <td style={tdStyle}>{payment.reference || payment.Reference || '-'}</td>
                        <td style={tdStyle}>{payment.createdAt || payment.CreatedAt ? new Date(payment.createdAt || payment.CreatedAt).toLocaleDateString() : '-'}</td>
                        <td style={tdStyle}><span style={statusPill(pStatus)}>{pStatus}</span></td>
                        <td style={tdStyle}>{(payment.amount || payment.Amount || 0).toLocaleString()} CFA</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ═════════════════════════════════════════════════
     5. ADVERTISEMENTS TAB
  ═════════════════════════════════════════════════ */
  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!newAd.title || !newAd.text) { addNotification('Please provide a title and description.', 'warning'); return; }
    if (!newAd.image) { addNotification('Please upload an image file.', 'warning'); return; }
    try {
      await superAdminService.createAdvertisement(newAd);
      addNotification('Advertisement created successfully!', 'success');
      setNewAd({ title: '', text: '', image: null });
      const fileInput = document.querySelector('input[type="file"][name="ad-image"]');
      if (fileInput) fileInput.value = '';
      await loadData();
    } catch (error) {
      console.error('Error creating ad:', error);
      addNotification(error.message || 'Failed to create advertisement', 'error');
    }
  };

  const renderAds = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <AdvertisementsList advertisements={ads} />

      {/* Create Ad form */}
      <div style={cardBase}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Create New Advertisement</h3>
        <form onSubmit={handleCreateAd}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} type="text" placeholder="Advertisement title" value={newAd.title} onChange={(e) => setNewAd(prev => ({ ...prev, title: e.target.value }))} required />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Description *</label>
            <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Advertisement description..." value={newAd.text} onChange={(e) => setNewAd(prev => ({ ...prev, text: e.target.value }))} required />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Image *</label>
            <input
              style={inputStyle}
              type="file"
              name="ad-image"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                  if (!validTypes.includes(file.type)) {
                    addNotification('Invalid file type. Allowed: jpg, jpeg, png, gif, webp', 'error');
                    e.target.value = '';
                    return;
                  }
                  setNewAd(prev => ({ ...prev, image: file }));
                } else {
                  setNewAd(prev => ({ ...prev, image: null }));
                }
              }}
              required
            />
          </div>
          <button type="submit" style={btnPrimary}><Megaphone size={16} /> Publish Advertisement</button>
        </form>
      </div>
    </div>
  );

  /* ═════════════════════════════════════════════════
     6. MESSAGES TAB
  ═════════════════════════════════════════════════ */
  const loadChatForAdmin = useCallback(async (adminId) => {
    try {
      setSelectedAdminId(adminId);
      const chat = await superAdminService.getChatWithAdmin(adminId);
      setChatMessages(Array.isArray(chat) ? chat : []);
    } catch (error) {
      console.error('Error loading chat:', error);
      addNotification('Failed to load chat messages', 'error');
    }
  }, [addNotification]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedAdminId) return;
    const storedUser = localStorage.getItem('user');
    let currentUserId = null;
    if (storedUser) {
      try { const user = JSON.parse(storedUser); currentUserId = user.id || user.ID; } catch (e) { /* ignore */ }
    }
    if (!currentUserId) { addNotification('Unable to identify current user. Please log in again.', 'error'); return; }

    const content = chatInput.trim();
    setChatInput('');
    try {
      await superAdminService.sendChatMessage({ fromUserId: currentUserId, toUserId: selectedAdminId, content });
      if (selectedAdminId) await loadChatForAdmin(selectedAdminId);
    } catch (error) {
      console.error('Error sending message:', error);
      addNotification(error.message || 'Failed to send message', 'error');
    }
  };

  const chatUsers = useMemo(() =>
    (agencyAdmins || []).map(admin => ({
      userId: admin.ID || admin.id,
      name: admin.Name || admin.name || 'Unknown',
      email: admin.Email || admin.email || '',
      role: admin.Role || admin.role || 'agency_director',
      company: admin.Company || admin.company || '',
    })),
    [agencyAdmins]
  );

  const renderChat = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <MessagingPanel
        chatUsers={chatUsers}
        selectedUserId={selectedAdminId}
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        loadChatForUser={loadChatForAdmin}
        handleSendMessage={handleSendMessage}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );

  /* ─── render switch ─── */
  const renderContent = (tabId = activeTab) => {
    if (loading && tabId === 'overview') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#64748b' }}>
          <RefreshCw size={20} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} /> Loading data...
        </div>
      );
    }
    switch (tabId) {
      case 'overview': return renderOverview();
      case 'companies': return renderCompanies();
      case 'directors': return renderDirectors();
      case 'financial': return renderFinancial();
      case 'ads': return renderAds();
      case 'chat': return renderChat();
      case 'settings': return <div className="embedded-settings"><SettingsPage /></div>;
      default: return renderOverview();
    }
  };

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Super Admin', logo: 'SAAF', logoImage: '/download.jpeg' }}
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
      {/* Notification toasts */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notifications.map(notification => (
          <div key={`notification-${notification.id}`} style={{
            padding: '12px 20px',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '0.88rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            background: notification.type === 'success' ? '#16a34a' : notification.type === 'error' ? '#dc2626' : notification.type === 'warning' ? '#f59e0b' : '#3b82f6',
            animation: 'slideIn 0.3s ease',
          }}>
            <span>{notification.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: 0 }}>×</button>
          </div>
        ))}
      </div>
    </>
  );
};

export default SuperAdminDashboard;
