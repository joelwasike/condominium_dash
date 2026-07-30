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
  RefreshCw,
  Upload,
  Image,
  Eye } from
'lucide-react';
import { CLOUDINARY_CONFIG } from '../config/cloudinary';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer } from
'recharts';
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
const cardBase = {
  background: '#fff',
  borderRadius: '20px',
  boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
  border: '1px solid #f1f5f9',
  padding: '24px'
};

const metricCardStyle = (accentColor) => ({
  ...cardBase,
  borderLeft: `4px solid ${accentColor}`,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
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
  padding: '8px 14px', flex: 1, maxWidth: '360px'
};

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const carouselIntervalRef = useRef(null);
  const [overviewStats, setOverviewStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [agencyAdmins, setAgencyAdmins] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [ads, setAds] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [agencyPayments, setAgencyPayments] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [companiesSearch, setCompaniesSearch] = useState('');
  const [companiesStatusFilter, setCompaniesStatusFilter] = useState('all');
  const [directorsSearch, setDirectorsSearch] = useState('');
  const [newAd, setNewAd] = useState({ title: '', text: '', link: '', image: null });
  const [chatInput, setChatInput] = useState('');
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({ name: '', email: '', phone: '', address: '', licenseNumber: '', logoURL: '', subscriptionFee: '', subscriptionCurrency: 'XOF' });
  const [logoUploading, setLogoUploading] = useState(false);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [companyDetailsLoading, setCompanyDetailsLoading] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [companyDetailsTab, setCompanyDetailsTab] = useState('overview');

  const openCompanyDetails = async (company) => {
    const companyId = company?.ID || company?.id;
    if (!companyId) return;
    setShowCompanyDetails(true);
    setCompanyDetailsTab('overview');
    setCompanyDetailsLoading(true);
    setCompanyDetails(null);
    try {
      if (isDemoMode()) {
        setCompanyDetails({ company, users: [], stats: {}, recent: { tenantPayments: [], expenses: [], deposits: [] }, subscriptionPayments: [] });
      } else {
        const details = await superAdminService.getCompanyDetails(companyId);
        setCompanyDetails(details);
      }
    } catch (err) {
      console.error('Load company details failed:', err);
      addNotification(err?.message || 'Failed to load company details', 'error');
      setShowCompanyDetails(false);
    } finally {
      setCompanyDetailsLoading(false);
    }
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addNotification('Please select an image file (JPG, PNG, etc.)', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addNotification('Logo must be under 5MB', 'error');
      return;
    }
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', 'agency-logos');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.secure_url) {
        setCompanyForm((prev) => ({ ...prev, logoURL: data.secure_url }));
        addNotification('Logo uploaded!', 'success');
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      addNotification('Failed to upload logo: ' + err.message, 'error');
    } finally {
      setLogoUploading(false);
    }
  };
  const [showAgencyAdminModal, setShowAgencyAdminModal] = useState(false);
  const [editingAgencyAdmin, setEditingAgencyAdmin] = useState(null);
  const [agencyAdminForm, setAgencyAdminForm] = useState({ name: '', email: '', company: '', role: 'agency_director', password: '', subscriptionFee: '', subscriptionCurrency: 'XOF' });
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 3000);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('demo_mode');
    window.location.href = '/';
  };
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
      superAdminService.getAgencyPayments().catch(() => [])]
      );

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

  useEffect(() => {loadData();}, [loadData]);
  const tabs = useMemo(() => [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'directors', label: 'Directors', icon: Users },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'ads', label: 'Advertisements', icon: Megaphone },
  { id: 'chat', label: 'Messages', icon: MessageCircle },
  { id: 'settings', label: 'Settings', icon: Settings }],
  []);

  const layoutMenu = useMemo(() =>
  tabs.map((tab) => ({ ...tab, onSelect: () => setActiveTab(tab.id), active: activeTab === tab.id })),
  [tabs, activeTab]
  );
  const revenueChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const totalRev = overviewStats?.totalRevenue || financialData?.totalRevenue || 0;
    const totalPay = overviewStats?.totalPayments || financialData?.totalPayments || 0;
    return months.map((month, i) => ({
      month,
      revenue: Math.round(totalRev * (0.6 + i * 0.08)),
      payments: Math.round(totalPay * (0.5 + i * 0.1))
    }));
  }, [overviewStats, financialData]);




  const renderOverview = () => {
    const totalAgencies = overviewStats?.totalAgencies || companies.length || 0;
    const activeAgencies = overviewStats?.activeAgencies || companies.filter((c) => (c.Status || c.status || '').toLowerCase() === 'active').length || 0;
    const totalRevenue = overviewStats?.totalRevenue || financialData?.totalRevenue || 0;
    const pendingPayments = overviewStats?.pendingPayments || 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          <div style={metricCardStyle('#3b82f6')}>
            <p style={metricLabel}>Total Agencies</p>
            <p style={metricValue}>{totalAgencies}</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>Registered companies</p>
          </div>
          <div style={metricCardStyle('#10b981')}>
            <p style={metricLabel}>Active Agencies</p>
            <p style={metricValue}>{activeAgencies}</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#10b981' }}>{totalAgencies > 0 ? Math.round(activeAgencies / totalAgencies * 100) : 0}% active</p>
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
                  formatter={(value, name) => [`${value.toLocaleString()} CFA`, name === 'revenue' ? 'Revenue' : 'Payments']} />
                
                <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="line" />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fill="url(#saColorRevenue)" dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} name="Revenue" />
                <Area type="monotone" dataKey="payments" stroke="#10b981" strokeWidth={3} fill="url(#saColorPayments)" dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} name="Payments" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
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
                  const sub = subscriptions.find((s) => (s.agencyId || s.companyId) === companyId);
                  const acctStatus = company.Status || company.status || 'Active';
                  const subStatus = sub?.paymentStatus || sub?.status || company.SubscriptionStatus || 'Paid';
                  return (
                    <tr key={`overview-co-${companyId || index}`} style={trHover}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{company.Name || company.name || 'N/A'}</span>
                      </td>
                      <td style={tdStyle}>{company.Email || company.email || '-'}</td>
                      <td style={tdStyle}><span style={statusPill(acctStatus)}>{acctStatus}</span></td>
                      <td style={tdStyle}><span style={statusPill(subStatus)}>{subStatus}</span></td>
                      <td style={tdStyle}>{(sub?.amount || company.SubscriptionAmount || 0).toLocaleString()} CFA</td>
                    </tr>);

                })}
                {companies.length === 0 &&
                <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No agency data available.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>);

  };




  const filteredCompanies = useMemo(() => {
    let list = companies || [];
    if (companiesSearch) {
      const q = companiesSearch.toLowerCase();
      list = list.filter((c) =>
      (c.Name || c.name || '').toLowerCase().includes(q) ||
      (c.Email || c.email || '').toLowerCase().includes(q) ||
      (c.Phone || c.phone || '').toLowerCase().includes(q)
      );
    }
    if (companiesStatusFilter !== 'all') {
      list = list.filter((c) => (c.Status || c.status || '').toLowerCase() === companiesStatusFilter);
    }
    return list;
  }, [companies, companiesSearch, companiesStatusFilter]);

  const handleOpenAddCompany = () => {
    setEditingCompany(null);
    setCompanyForm({ name: '', email: '', phone: '', address: '', licenseNumber: '', logoURL: '', subscriptionFee: '', subscriptionCurrency: 'XOF' });
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
      logoURL: company.LogoURL || company.logoURL || '',
      subscriptionFee: (company.subscriptionFee ?? company.SubscriptionFee ?? '')?.toString?.() || '',
      subscriptionCurrency: company.subscriptionCurrency || company.SubscriptionCurrency || 'XOF'
    });
    setShowCompanyModal(true);
  };

  const handleSubmitCompany = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...companyForm };
      if (payload.subscriptionFee !== '') payload.subscriptionFee = parseFloat(payload.subscriptionFee);
      if (editingCompany) {
        await superAdminService.updateCompany(editingCompany.ID || editingCompany.id, payload);
        addNotification('Company updated successfully!', 'success');
      } else {
        await superAdminService.addCompany(payload);
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

  const renderCompanies = () =>
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
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.88rem', flex: 1 }} />
          
          </div>
          <select
          value={companiesStatusFilter}
          onChange={(e) => setCompaniesStatusFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '140px' }}>
          
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
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
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
                        <button style={{ ...btnSmall, background: '#f1f5f9', color: '#0f172a' }} onClick={() => openCompanyDetails(company)} title="View details"><Eye size={14} /></button>
                        <button style={{ ...btnSmall, background: '#eff6ff', color: '#3b82f6' }} onClick={() => handleOpenEditCompany(company)} title="Edit"><Edit2 size={14} /></button>
                        <button style={{ ...btnSmall, background: isActive ? '#fef3c7' : '#dcfce7', color: isActive ? '#92400e' : '#166534' }} onClick={() => handleToggleCompanyStatus(company)} title={isActive ? 'Deactivate' : 'Reactivate'}>
                          {isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button style={{ ...btnSmall, background: '#fee2e2', color: '#dc2626' }} onClick={() => handleDeleteCompany(company)} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>);

            })}
              {filteredCompanies.length === 0 &&
            <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No agencies found.</td></tr>
            }
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={showCompanyModal} onClose={() => setShowCompanyModal(false)} title={editingCompany ? 'Edit Agency' : 'Add Agency'} size="md">
        <form onSubmit={handleSubmitCompany}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Company Name *</label>
            <input style={inputStyle} type="text" value={companyForm.name} onChange={(e) => setCompanyForm((prev) => ({ ...prev, name: e.target.value }))} required placeholder="Agency name" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" value={companyForm.email} onChange={(e) => setCompanyForm((prev) => ({ ...prev, email: e.target.value }))} required placeholder="company@email.com" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} type="text" value={companyForm.phone} onChange={(e) => setCompanyForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="+237 600 000 000" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Address</label>
            <input style={inputStyle} type="text" value={companyForm.address} onChange={(e) => setCompanyForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Company address" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>License Number</label>
            <input style={inputStyle} type="text" value={companyForm.licenseNumber} onChange={(e) => setCompanyForm((prev) => ({ ...prev, licenseNumber: e.target.value }))} placeholder="License / Registration number" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Monthly Subscription Fee</label>
            <input style={inputStyle} type="number" min="0" step="1" value={companyForm.subscriptionFee} onChange={(e) => setCompanyForm((prev) => ({ ...prev, subscriptionFee: e.target.value }))} placeholder="e.g., 30000" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Subscription Currency</label>
            <select style={inputStyle} value={companyForm.subscriptionCurrency} onChange={(e) => setCompanyForm((prev) => ({ ...prev, subscriptionCurrency: e.target.value }))}>
              <option value="XOF">XOF</option>
              <option value="USD">USD</option>
              <option value="KES">KES</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Agency Logo</label>
            {companyForm.logoURL ?
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <img src={companyForm.logoURL} alt="Agency logo" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff' }} onError={(e) => {e.target.src = '';e.target.style.display = 'none';}} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>Logo uploaded</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', wordBreak: 'break-all' }}>{companyForm.logoURL.substring(companyForm.logoURL.lastIndexOf('/') + 1).substring(0, 40)}...</p>
                </div>
                <button type="button" onClick={() => setCompanyForm((prev) => ({ ...prev, logoURL: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                  <XCircle size={20} />
                </button>
              </div> :

          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '24px 16px', borderRadius: '12px', border: '2px dashed #d1d5db',
            background: logoUploading ? '#f1f5f9' : '#fafbfc', cursor: logoUploading ? 'wait' : 'pointer',
            transition: 'all 0.2s', gap: '8px'
          }}
          onMouseEnter={(e) => {if (!logoUploading) e.currentTarget.style.borderColor = '#3b82f6';}}
          onMouseLeave={(e) => {e.currentTarget.style.borderColor = '#d1d5db';}}>
            
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {if (e.target.files[0]) handleLogoUpload(e.target.files[0]);}} disabled={logoUploading} />
                {logoUploading ?
            <>
                    <RefreshCw size={28} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 500 }}>Uploading...</span>
                  </> :

            <>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Image size={24} style={{ color: '#3b82f6' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Click to upload logo</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>JPG, PNG up to 5MB</span>
                  </>
            }
              </label>
          }
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" style={btnOutline} onClick={() => setShowCompanyModal(false)}>Cancel</button>
            <button type="submit" style={btnPrimary}>{editingCompany ? 'Update' : 'Create'} Agency</button>
          </div>
        </form>
      </Modal>
      <Modal
      isOpen={showCompanyDetails}
      onClose={() => {setShowCompanyDetails(false);setCompanyDetails(null);}}
      title={`Company Details${companyDetails?.company?.Name ? ` — ${companyDetails.company.Name}` : ''}`}
      size="xl">
      
        {companyDetailsLoading ?
      <div style={{ padding: '16px', color: '#64748b' }}>Loading company details…</div> :
      !companyDetails ?
      <div style={{ padding: '16px', color: '#64748b' }}>No data.</div> :

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ ...cardBase, padding: '14px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Users</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{(companyDetails.users || []).length}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Across all roles</div>
              </div>
              <div style={{ ...cardBase, padding: '14px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tenants</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{companyDetails.stats?.tenants ?? 0}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tenant accounts</div>
              </div>
              <div style={{ ...cardBase, padding: '14px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Properties</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  {(companyDetails.stats?.salesProperties ?? 0) + (companyDetails.stats?.systemProperties ?? 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sales + System</div>
              </div>
              <div style={{ ...cardBase, padding: '14px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tenant Payments</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  {Number(companyDetails.stats?.tenantPaymentsApprovedTotal ?? 0).toLocaleString()} XOF
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Approved: {companyDetails.stats?.tenantPaymentsApproved ?? 0} / {companyDetails.stats?.tenantPayments ?? 0}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
          { key: 'overview', label: 'Overview' },
          { key: 'users', label: 'Users' },
          { key: 'payments', label: 'Payments' },
          { key: 'expenses', label: 'Expenses' },
          { key: 'deposits', label: 'Deposits' },
          { key: 'subscription', label: 'Subscription' }].
          map((ti) =>
          <button
            key={ti.key}
            type="button"
            onClick={() => setCompanyDetailsTab(ti.key)}
            style={{
              ...btnSmall,
              padding: '8px 12px',
              background: companyDetailsTab === ti.key ? '#eff6ff' : '#f8fafc',
              color: companyDetailsTab === ti.key ? '#1d4ed8' : '#334155',
              border: companyDetailsTab === ti.key ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
            }}>
            
                  {ti.label}
                </button>
          )}
            </div>
            {companyDetailsTab === 'overview' &&
        <div style={{ ...cardBase, padding: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Name</div>
                    <div style={{ fontWeight: 700 }}>{companyDetails.company?.Name || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Email</div>
                    <div style={{ fontWeight: 600 }}>{companyDetails.company?.Email || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Phone</div>
                    <div style={{ fontWeight: 600 }}>{companyDetails.company?.Phone || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Status</div>
                    <div><span style={statusPill(companyDetails.company?.Status || companyDetails.company?.status || 'Unknown')}>{companyDetails.company?.Status || companyDetails.company?.status || 'Unknown'}</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Subscription</div>
                    <div><span style={statusPill(companyDetails.company?.SubscriptionStatus || '-')}>{companyDetails.company?.SubscriptionStatus || '-'}</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Monthly Fee</div>
                    <div style={{ fontWeight: 700 }}>
                      {Number(companyDetails.company?.SubscriptionFee ?? 0).toLocaleString()} {companyDetails.company?.SubscriptionCurrency || 'XOF'}
                    </div>
                  </div>
                </div>
                {Array.isArray(companyDetails.stats?.usersByRole) && companyDetails.stats.usersByRole.length > 0 &&
          <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>Users by role</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {companyDetails.stats.usersByRole.map((rc, idx) =>
              <div key={`${rc.role || rc.Role}-${idx}`} style={{ padding: '6px 10px', borderRadius: '999px', background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#334155' }}>
                          <strong>{rc.role || rc.Role}</strong>: {rc.count ?? rc.Count ?? 0}
                        </div>
              )}
                    </div>
                  </div>
          }
              </div>
        }

            {companyDetailsTab === 'users' &&
        <div style={{ ...cardBase, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Role</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(companyDetails.users || []).map((u) =>
                <tr key={`co-user-${u.id}`} style={trHover}>
                          <td style={tdStyle}><span style={{ fontWeight: 700 }}>{u.name}</span></td>
                          <td style={tdStyle}>{u.email}</td>
                          <td style={tdStyle}><span style={statusPill(u.role)}>{u.role}</span></td>
                          <td style={tdStyle}><span style={statusPill(u.status)}>{u.status}</span></td>
                          <td style={tdStyle}>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '-'}</td>
                        </tr>
                )}
                      {(companyDetails.users || []).length === 0 &&
                <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '28px' }}>No users found for this company.</td></tr>
                }
                    </tbody>
                  </table>
                </div>
              </div>
        }

            {companyDetailsTab === 'payments' &&
        <div style={{ ...cardBase, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={thStyle}>Tenant</th>
                        <th style={thStyle}>Property</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Method</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(companyDetails.recent?.tenantPayments || []).map((p) =>
                <tr key={`co-pay-${p.ID || p.id}`} style={trHover}>
                          <td style={tdStyle}>{p.Tenant || p.tenant || '-'}</td>
                          <td style={tdStyle}>{p.Property || p.property || '-'}</td>
                          <td style={tdStyle}>{Number(p.Amount || p.amount || 0).toLocaleString()} XOF</td>
                          <td style={tdStyle}>{p.Method || p.method || '-'}</td>
                          <td style={tdStyle}><span style={statusPill(p.Status || p.status || '-')}>{p.Status || p.status || '-'}</span></td>
                          <td style={tdStyle}>{p.Date ? new Date(p.Date).toLocaleString() : '-'}</td>
                        </tr>
                )}
                      {(companyDetails.recent?.tenantPayments || []).length === 0 &&
                <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '28px' }}>No tenant payments.</td></tr>
                }
                    </tbody>
                  </table>
                </div>
              </div>
        }

            {companyDetailsTab === 'expenses' &&
        <div style={{ ...cardBase, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={thStyle}>Category</th>
                        <th style={thStyle}>Building</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(companyDetails.recent?.expenses || []).map((e) =>
                <tr key={`co-exp-${e.ID || e.id}`} style={trHover}>
                          <td style={tdStyle}>{e.Category || e.category || '-'}</td>
                          <td style={tdStyle}>{e.Building || e.building || '-'}</td>
                          <td style={tdStyle}>{Number(e.Amount || e.amount || 0).toLocaleString()} XOF</td>
                          <td style={tdStyle}><span style={statusPill(e.Status || e.status || '-')}>{e.Status || e.status || '-'}</span></td>
                          <td style={tdStyle}>{e.Date ? new Date(e.Date).toLocaleString() : '-'}</td>
                        </tr>
                )}
                      {(companyDetails.recent?.expenses || []).length === 0 &&
                <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '28px' }}>No expenses.</td></tr>
                }
                    </tbody>
                  </table>
                </div>
              </div>
        }

            {companyDetailsTab === 'deposits' &&
        <div style={{ ...cardBase, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={thStyle}>Tenant</th>
                        <th style={thStyle}>Property</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(companyDetails.recent?.deposits || []).map((d) =>
                <tr key={`co-dep-${d.ID || d.id}`} style={trHover}>
                          <td style={tdStyle}>{d.Tenant || d.tenant || '-'}</td>
                          <td style={tdStyle}>{d.Property || d.property || '-'}</td>
                          <td style={tdStyle}>{Number(d.Amount || d.amount || 0).toLocaleString()} XOF</td>
                          <td style={tdStyle}>{d.Type || d.type || '-'}</td>
                          <td style={tdStyle}><span style={statusPill(d.Status || d.status || '-')}>{d.Status || d.status || '-'}</span></td>
                          <td style={tdStyle}>{d.CreatedAt ? new Date(d.CreatedAt).toLocaleString() : '-'}</td>
                        </tr>
                )}
                      {(companyDetails.recent?.deposits || []).length === 0 &&
                <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '28px' }}>No security deposits.</td></tr>
                }
                    </tbody>
                  </table>
                </div>
              </div>
        }

            {companyDetailsTab === 'subscription' &&
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                <div style={{ ...cardBase, padding: '14px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>Subscription Summary</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Status</div>
                      <div><span style={statusPill(companyDetails.company?.SubscriptionStatus || '-')}>{companyDetails.company?.SubscriptionStatus || '-'}</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Fee</div>
                      <div style={{ fontWeight: 700 }}>{Number(companyDetails.company?.SubscriptionFee ?? 0).toLocaleString()} {companyDetails.company?.SubscriptionCurrency || 'XOF'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Last Paid</div>
                      <div style={{ fontWeight: 600 }}>{companyDetails.company?.SubscriptionLastPaidAt ? new Date(companyDetails.company.SubscriptionLastPaidAt).toLocaleDateString() : '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Next Due</div>
                      <div style={{ fontWeight: 600 }}>{companyDetails.company?.SubscriptionNextDueAt ? new Date(companyDetails.company.SubscriptionNextDueAt).toLocaleDateString() : '-'}</div>
                    </div>
                  </div>
                </div>

                <div style={{ ...cardBase, padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, color: '#0f172a' }}>Payment History</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={thStyle}>Amount</th>
                          <th style={thStyle}>Provider</th>
                          <th style={thStyle}>Status</th>
                          <th style={thStyle}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(companyDetails.subscriptionPayments || []).map((p) =>
                  <tr key={`co-sub-${p.ID || p.id}`} style={trHover}>
                            <td style={tdStyle}>{Number(p.Amount || p.amount || 0).toLocaleString()} {p.Currency || p.currency || 'XOF'}</td>
                            <td style={tdStyle}>{p.Provider || p.provider || '-'}</td>
                            <td style={tdStyle}><span style={statusPill(p.Status || p.status || '-')}>{p.Status || p.status || '-'}</span></td>
                            <td style={tdStyle}>{p.PaymentDate ? new Date(p.PaymentDate).toLocaleString() : '-'}</td>
                          </tr>
                  )}
                        {(companyDetails.subscriptionPayments || []).length === 0 &&
                  <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '22px' }}>No subscription payments yet.</td></tr>
                  }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
        }
          </div>
      }
      </Modal>
    </div>;





  const filteredDirectors = useMemo(() => {
    const base = agencyAdmins || [];
    if (!directorsSearch) return base;
    const q = directorsSearch.toLowerCase();
    return base.filter((a) =>
    (a.Name || a.name || '').toLowerCase().includes(q) ||
    (a.Email || a.email || '').toLowerCase().includes(q) ||
    (a.Company || a.company || '').toLowerCase().includes(q)
    );
  }, [agencyAdmins, directorsSearch]);

  const handleOpenAddDirector = () => {
    setEditingAgencyAdmin(null);
    setAgencyAdminForm({ name: '', email: '', company: '', role: 'agency_director', password: '', subscriptionFee: '', subscriptionCurrency: 'XOF' });
    setShowAgencyAdminModal(true);
  };

  const handleOpenEditDirector = (admin) => {
    setEditingAgencyAdmin(admin);
    const role = (admin.Role || admin.role || 'agency_director').replace('-', '_');
    const companyDetails = admin.companyDetails || admin.CompanyDetails || {};
    setAgencyAdminForm({
      name: admin.Name || admin.name || '',
      email: admin.Email || admin.email || '',
      company: admin.Company || admin.company || '',
      role,
      password: '',
      subscriptionFee: (companyDetails.subscriptionFee ?? companyDetails.SubscriptionFee ?? '')?.toString?.() || '',
      subscriptionCurrency: companyDetails.subscriptionCurrency || companyDetails.SubscriptionCurrency || 'XOF'
    });
    setShowAgencyAdminModal(true);
  };

  const handleSubmitDirector = async (e) => {
    e.preventDefault();
    try {
      const userData = { name: agencyAdminForm.name, email: agencyAdminForm.email, company: agencyAdminForm.company, role: agencyAdminForm.role };
      if (agencyAdminForm.role === 'agency_director') {
        if (agencyAdminForm.subscriptionFee !== '') userData.subscriptionFee = parseFloat(agencyAdminForm.subscriptionFee);
        if (agencyAdminForm.subscriptionCurrency) userData.subscriptionCurrency = agencyAdminForm.subscriptionCurrency;
      }
      if (editingAgencyAdmin) {
        if (agencyAdminForm.password) userData.password = agencyAdminForm.password;
        await superAdminService.updateUser(editingAgencyAdmin.ID || editingAgencyAdmin.id, userData);
        addNotification('Director updated successfully!', 'success');
      } else {
        if (!agencyAdminForm.password) {addNotification('Password is required', 'warning');return;}
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

  const renderDirectors = () =>
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
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
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
                  </tr>);

            })}
              {filteredDirectors.length === 0 &&
            <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No directors found.</td></tr>
            }
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={showAgencyAdminModal} onClose={() => setShowAgencyAdminModal(false)} title={editingAgencyAdmin ? 'Edit Director' : 'Add Director'} size="md">
        <form onSubmit={handleSubmitDirector}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} type="text" value={agencyAdminForm.name} onChange={(e) => setAgencyAdminForm((prev) => ({ ...prev, name: e.target.value }))} required placeholder="Director name" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" value={agencyAdminForm.email} onChange={(e) => setAgencyAdminForm((prev) => ({ ...prev, email: e.target.value }))} required placeholder="email@example.com" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Company *</label>
            {companies.length > 0 ?
          <select style={inputStyle} value={agencyAdminForm.company} onChange={(e) => setAgencyAdminForm((prev) => ({ ...prev, company: e.target.value }))} required>
                <option value="">Select a company</option>
                {companies.map((c, i) =>
            <option key={`co-opt-${c.ID || c.id || i}`} value={c.Name || c.name}>{c.Name || c.name}</option>
            )}
              </select> :

          <input style={inputStyle} type="text" value={agencyAdminForm.company} onChange={(e) => setAgencyAdminForm((prev) => ({ ...prev, company: e.target.value }))} required placeholder="Company name" />
          }
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Role *</label>
            <select style={inputStyle} value={agencyAdminForm.role} onChange={(e) => setAgencyAdminForm((prev) => ({ ...prev, role: e.target.value }))} required>
              <option value="agency_director">Agency Director</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          {agencyAdminForm.role === 'agency_director' &&
        <>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Monthly Subscription Fee</label>
                <input style={inputStyle} type="number" min="0" step="1" value={agencyAdminForm.subscriptionFee} onChange={(e) => setAgencyAdminForm((prev) => ({ ...prev, subscriptionFee: e.target.value }))} placeholder="e.g., 30000" />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Subscription Currency</label>
                <select style={inputStyle} value={agencyAdminForm.subscriptionCurrency} onChange={(e) => setAgencyAdminForm((prev) => ({ ...prev, subscriptionCurrency: e.target.value }))}>
                  <option value="XOF">XOF</option>
                  <option value="USD">USD</option>
                  <option value="KES">KES</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </>
        }
          <div style={formGroupStyle}>
            <label style={labelStyle}>Password {editingAgencyAdmin ? '(leave blank to keep current)' : '*'}</label>
            <input style={inputStyle} type="password" value={agencyAdminForm.password} onChange={(e) => setAgencyAdminForm((prev) => ({ ...prev, password: e.target.value }))} required={!editingAgencyAdmin} placeholder={editingAgencyAdmin ? 'New password (optional)' : 'Enter password'} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" style={btnOutline} onClick={() => setShowAgencyAdminModal(false)}>Cancel</button>
            <button type="submit" style={btnPrimary}>{editingAgencyAdmin ? 'Update' : 'Create'} Director</button>
          </div>
        </form>
      </Modal>
    </div>;





  const renderFinancial = () => {
    const totalRevenue = financialData?.totalRevenue || overviewStats?.totalRevenue || 0;
    const activeSubs = subscriptions.filter((s) => (s.status || s.paymentStatus || '').toLowerCase() === 'active' || (s.status || s.paymentStatus || '').toLowerCase() === 'paid').length || overviewStats?.activeSubscriptions || 0;
    const overduePay = subscriptions.filter((s) => (s.status || s.paymentStatus || '').toLowerCase() === 'overdue' || (s.status || s.paymentStatus || '').toLowerCase() === 'pending').length || overviewStats?.overduePayments || 0;
    const netProfit = financialData?.netProfit || 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                  formatter={(value) => [`${value.toLocaleString()} CFA`, 'Revenue']} />
                
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fill="url(#saFinRevenue)" dot={{ fill: '#8b5cf6', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
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
                  const agency = item.agencyId ? companies.find((c) => (c.ID || c.id) === item.agencyId) : item;
                  const payDate = item.paymentDate || item.dueDate || item.createdAt || item.CreatedAt || agency?.CreatedAt;
                  const payStatus = item.paymentStatus || item.status || 'Paid';
                  return (
                    <tr key={`fin-sub-${item.id || item.ID || index}`} style={trHover}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={tdStyle}><span style={{ fontWeight: 600 }}>{agency?.Name || agency?.name || item.agencyName || 'N/A'}</span></td>
                      <td style={tdStyle}>{payDate ? new Date(payDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                      <td style={tdStyle}><span style={statusPill(payStatus)}>{payStatus}</span></td>
                      <td style={tdStyle}>{(item.amount || item.subscriptionAmount || agency?.SubscriptionAmount || 0).toLocaleString()} CFA</td>
                    </tr>);

                })}
                {subscriptions.length === 0 && companies.length === 0 &&
                <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No payment records.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        {agencyPayments.length > 0 &&
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
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={tdStyle}>{payment.agencyName || payment.AgencyName || 'N/A'}</td>
                        <td style={tdStyle}>{payment.reference || payment.Reference || '-'}</td>
                        <td style={tdStyle}>{payment.createdAt || payment.CreatedAt ? new Date(payment.createdAt || payment.CreatedAt).toLocaleDateString() : '-'}</td>
                        <td style={tdStyle}><span style={statusPill(pStatus)}>{pStatus}</span></td>
                        <td style={tdStyle}>{(payment.amount || payment.Amount || 0).toLocaleString()} CFA</td>
                      </tr>);

                })}
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>);

  };




  const [adPublishing, setAdPublishing] = useState(false);
  const [adImagePreview, setAdImagePreview] = useState(null);
  const adFileRef = useRef(null);

  const handleAdImageSelect = (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      addNotification('Invalid file type. Use JPG, PNG, GIF, or WebP.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addNotification('Image must be under 10MB', 'error');
      return;
    }
    setNewAd((prev) => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onload = (e) => setAdImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!newAd.title || !newAd.text) {addNotification('Please provide a title and description.', 'warning');return;}
    if (!newAd.image) {addNotification('Please upload an image.', 'warning');return;}
    setAdPublishing(true);
    try {
      await superAdminService.createAdvertisement(newAd);
      addNotification('Advertisement published!', 'success');
      setNewAd({ title: '', text: '', link: '', image: null });
      setAdImagePreview(null);
      if (adFileRef.current) adFileRef.current.value = '';
      await loadData();
    } catch (error) {
      console.error('Error creating ad:', error);
      addNotification(error.message || 'Failed to create advertisement', 'error');
    } finally {
      setAdPublishing(false);
    }
  };

  const renderAds = () =>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#1e293b' }}>Advertisements</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
          Manage global advertisements visible to all agencies ({ads.length} active)
        </p>
      </div>
	      <div style={{ ...cardBase, background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', border: '1px solid #dbeafe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Megaphone size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>Create New Advertisement</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>This will be visible to all agencies and their users</p>
          </div>
        </div>

        <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
	          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
	            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
	              <div>
	                <label style={{ ...labelStyle, marginBottom: '6px', display: 'block' }}>Title</label>
                <input
                style={inputStyle}
                type="text"
                placeholder="e.g. New Year Promotion"
                value={newAd.title}
                onChange={(e) => setNewAd((prev) => ({ ...prev, title: e.target.value }))} />
              
              </div>
	              <div>
	                <label style={{ ...labelStyle, marginBottom: '6px', display: 'block' }}>Description</label>
	                <textarea
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                placeholder="Describe the advertisement..."
                value={newAd.text}
                onChange={(e) => setNewAd((prev) => ({ ...prev, text: e.target.value }))} />
              
	              </div>
	              <div>
	                <label style={{ ...labelStyle, marginBottom: '6px', display: 'block' }}>Property Link (optional)</label>
	                <input
                style={inputStyle}
                type="url"
                placeholder="https://example.com/property/123"
                value={newAd.link || ''}
                onChange={(e) => setNewAd((prev) => ({ ...prev, link: e.target.value }))} />
              
	              </div>
	            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: '6px', display: 'block' }}>Image</label>
              {adImagePreview ?
            <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '2px solid #e2e8f0', height: '200px' }}>
                  <img src={adImagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                type="button"
                onClick={() => {setNewAd((prev) => ({ ...prev, image: null }));setAdImagePreview(null);if (adFileRef.current) adFileRef.current.value = '';}}
                style={{
                  position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                }}>
                
                    ×
                  </button>
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem' }}>
                    {newAd.image?.name}
                  </div>
                </div> :

            <label
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '200px', borderRadius: '14px', border: '2px dashed #cbd5e1',
                background: '#fff', cursor: 'pointer', transition: 'all 0.2s', gap: '10px'
              }}
              onMouseEnter={(e) => {e.currentTarget.style.borderColor = '#3b82f6';e.currentTarget.style.background = '#f0f7ff';}}
              onMouseLeave={(e) => {e.currentTarget.style.borderColor = '#cbd5e1';e.currentTarget.style.background = '#fff';}}
              onDragOver={(e) => {e.preventDefault();e.currentTarget.style.borderColor = '#3b82f6';e.currentTarget.style.background = '#f0f7ff';}}
              onDragLeave={(e) => {e.currentTarget.style.borderColor = '#cbd5e1';e.currentTarget.style.background = '#fff';}}
              onDrop={(e) => {e.preventDefault();e.currentTarget.style.borderColor = '#cbd5e1';e.currentTarget.style.background = '#fff';if (e.dataTransfer.files[0]) handleAdImageSelect(e.dataTransfer.files[0]);}}>
              
                  <input ref={adFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {if (e.target.files[0]) handleAdImageSelect(e.target.files[0]);}} />
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Upload size={24} style={{ color: '#3b82f6' }} />
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151' }}>Drop image here or click to browse</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>JPG, PNG, GIF, WebP — max 10MB</span>
                </label>
            }
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button type="submit" disabled={adPublishing} style={{
            ...btnPrimary,
            opacity: adPublishing ? 0.7 : 1,
            cursor: adPublishing ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px'
          }}>
              {adPublishing ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Megaphone size={16} />}
              {adPublishing ? 'Publishing...' : 'Publish Advertisement'}
            </button>
          </div>
        </form>
      </div>
      {ads.length > 0 ?
    <AdvertisementsList advertisements={ads} /> :

    <div style={{ ...cardBase, textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
          <Megaphone size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
          <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>No advertisements yet</p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Create your first advertisement above to reach all agencies.</p>
        </div>
    }
    </div>;





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
    if (String(selectedAdminId).startsWith('group:')) return;
    const storedUser = localStorage.getItem('user');
    let currentUserId = null;
    if (storedUser) {
      try {const user = JSON.parse(storedUser);currentUserId = user.id || user.ID;} catch (e) {}
    }
    if (!currentUserId) {addNotification('Unable to identify current user. Please log in again.', 'error');return;}

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
  (agencyAdmins || []).map((admin) => ({
    userId: admin.ID || admin.id,
    name: admin.Name || admin.name || 'Unknown',
    email: admin.Email || admin.email || '',
    role: admin.Role || admin.role || 'agency_director',
    company: admin.Company || admin.company || ''
  })),
  [agencyAdmins]
  );

  const renderChat = () =>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <MessagingPanel
      chatUsers={chatUsers}
      selectedUserId={selectedAdminId}
      chatMessages={chatMessages}
      chatInput={chatInput}
      setChatInput={setChatInput}
      loadChatForUser={loadChatForAdmin}
      handleSendMessage={handleSendMessage}
      messagesEndRef={messagesEndRef} />
    
    </div>;

  const renderContent = (tabId = activeTab) => {
    if (loading && tabId === 'overview') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#64748b' }}>
          <RefreshCw size={20} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} /> Loading data...
        </div>);

    }
    switch (tabId) {
      case 'overview':return renderOverview();
      case 'companies':return renderCompanies();
      case 'directors':return renderDirectors();
      case 'financial':return renderFinancial();
      case 'ads':return renderAds();
      case 'chat':return renderChat();
      case 'settings':return <div className="embedded-settings"><SettingsPage /></div>;
      default:return renderOverview();
    }
  };

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Super Admin', logo: 'SAAF', logoImage: '/download.jpeg' }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}>
        
        {({ activeId }) =>
        <div className="content-body super-admin-content">
            {renderContent(activeId)}
          </div>
        }
      </RoleLayout>
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notifications.map((notification) =>
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
          animation: 'slideIn 0.3s ease'
        }}>
            <span>{notification.message}</span>
            <button onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: 0 }}>×</button>
          </div>
        )}
      </div>
    </>);

};

export default SuperAdminDashboard;
