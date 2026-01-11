import React, { useMemo, useState, useEffect } from 'react';
import { LifeBuoy, LogOut, Settings, Bell, Search, UserCircle, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';
import LanguageSelector from './LanguageSelector';
import { t } from '../utils/i18n';
import './RoleLayout.css';

const roleLabels = {
  technician: 'Technical Manager',
  admin: 'Administrative Agent',
  tenant: 'Tenant',
  landlord: 'Landlord',
  accounting: 'Accounting',
  salesmanager: 'Sales Manager',
  superadmin: 'Super Admin',
  commercial: 'Commercial Manager'
};

const RoleLayout = ({
  brand = { name: 'SAAF IMMO', caption: 'Operations', logo: 'SAAF', logoImage: null },
  menu = [],
  footerActions,
  children,
  onLogout,
  headerActions,
  hideSearch = false,
  activeId,
  onActiveChange,
  title,
  subtitle,
  onSearch,
  defaultDashboardRoute = '/'
}) => {
  const [internalActive, setInternalActive] = useState(menu[0]?.id || null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const currentActiveId = activeId !== undefined ? activeId : internalActive;

  // Handle logo click to return to dashboard
  const handleLogoClick = () => {
    const userProfile = JSON.parse(localStorage.getItem('user') || '{}');
    const role = userProfile?.role;
    
    // Navigate to appropriate dashboard based on role
    const roleRoutes = {
      'tenant': '/tenant',
      'commercial': '/sales',
      'admin': '/administrative',
      'accounting': '/accounting',
      'salesmanager': '/sales-manager',
      'technician': '/technician',
      'landlord': '/landlord',
      'superadmin': '/super-admin',
      'agency_director': '/agency-director'
    };
    
    const route = roleRoutes[role] || defaultDashboardRoute;
    navigate(route);
    // Reset to overview tab if possible
    if (onActiveChange && menu.length > 0) {
      onActiveChange(menu[0].id);
    }
  };

  // Handle search
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (onSearch) {
      onSearch(query);
    }
  };

  // Handle navigation to settings
  const handleNavigateToSettings = () => {
    const userProfile = JSON.parse(localStorage.getItem('user') || '{}');
    const role = userProfile?.role;
    
    const roleRoutes = {
      'tenant': '/tenant',
      'commercial': '/sales',
      'admin': '/administrative',
      'accounting': '/accounting',
      'salesmanager': '/sales-manager',
      'technician': '/technician',
      'landlord': '/landlord',
      'superadmin': '/super-admin',
      'agency_director': '/agency-director'
    };
    
    const route = roleRoutes[role] || '/';
    navigate(`${route}?tab=settings`);
    
    // Try to set active tab to settings if available
    if (onActiveChange) {
      onActiveChange('settings');
    }
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when menu item is clicked on mobile
  const handleMenuClick = (item) => {
    if (item.onSelect) {
      item.onSelect();
    }
    if (onActiveChange) {
      onActiveChange(item.id);
    }
    if (activeId === undefined) {
      setInternalActive(item.id);
    }
    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const userProfile = useMemo(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }, []);

  const roleLabel = userProfile?.role ? (roleLabels[userProfile.role] || userProfile.role) : 'User';

  return (
    <div className="role-layout technician-dashboard">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div 
          className="mobile-sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`role-sidebar technician-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <button
            className="brand-logo-button"
            onClick={handleLogoClick}
            title={`${t('nav.dashboard')} - ${brand.name}`}
          >
            <div className="brand-logo">
              {brand.logoImage ? (
                <img src={brand.logoImage} alt={brand.name || 'Brand'} />
              ) : (
                brand.logo
              )}
            </div>
            {brand.name && (
              <div className="brand-text">
                <span className="brand-name">{brand.name}</span>
                {brand.caption && <span className="brand-caption">{brand.caption}</span>}
              </div>
            )}
          </button>
        </div>

        <nav className="sidebar-menu sidebar-navigation">
          {menu.map(item => {
            const Icon = item.icon;
            const isActive = item.id === currentActiveId || item.active;
            return (
              <button
                key={item.id}
                type="button"
                className={`menu-item sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => handleMenuClick(item)}
              >
                {Icon && <Icon size={20} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {footerActions?.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                className={`footer-button ${action.variant || ''}`}
                onClick={action.onClick}
              >
                {Icon && <Icon size={18} />}
                <span>{action.label}</span>
              </button>
            );
          })}
          {!footerActions && (
            <>
              <button className="footer-button support sidebar-support">
                <LifeBuoy size={18} />
                <span>Support</span>
              </button>
              <button className="footer-button logout sidebar-logout" onClick={onLogout}>
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="role-main technician-main">
        <header className="role-topbar technician-topbar">
          <button 
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {!hideSearch && (
            <div className="topbar-search">
              <Search size={18} />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onSearch) {
                    onSearch(searchQuery);
                  }
                }}
              />
            </div>
          )}
          <div className="topbar-actions">
            <LanguageSelector />
            
            {headerActions?.map(action => {
              const Icon = action.icon;
              return (
                <button key={action.id} type="button" className="icon-button" onClick={action.onClick}>
                  {Icon ? <Icon size={18} /> : action.content}
                </button>
              );
            })}
            {!headerActions && (
              <>
                <NotificationDropdown userId={userProfile?.id || userProfile?.ID} />
              </>
            )}
            
            <ProfileDropdown
              userProfile={userProfile}
              onLogout={onLogout}
              onNavigateToSettings={handleNavigateToSettings}
            />
          </div>
        </header>

        <div className="role-content technician-content">
          {(title || subtitle) && (
            <div className="role-page-header">
              {title && <h1>{title}</h1>}
              {subtitle && <p>{subtitle}</p>}
            </div>
          )}
          {children({ activeId: currentActiveId })}
        </div>
      </div>
    </div>
  );
};

export default RoleLayout;
