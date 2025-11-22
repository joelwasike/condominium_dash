import React, { useMemo, useState, useEffect } from 'react';
import { LifeBuoy, LogOut, Settings, Bell, Search, UserCircle, Menu, X } from 'lucide-react';
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
  subtitle
}) => {
  const [internalActive, setInternalActive] = useState(menu[0]?.id || null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentActiveId = activeId !== undefined ? activeId : internalActive;

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
          <div className="brand-logo">
            {brand.logoImage ? (
              <img src={brand.logoImage} alt={brand.name || 'Brand'} />
            ) : (
              brand.logo
            )}
          </div>
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
              <input type="text" placeholder="Search tasks, requests or properties" />
            </div>
          )}
          <div className="topbar-actions">
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
                <button className="icon-button">
                  <Settings size={18} />
                </button>
                <button className="icon-button">
                  <Bell size={18} />
                </button>
              </>
            )}
            <div className="topbar-profile">
              <span className="profile-details">
                <strong>{userProfile?.name || userProfile?.username || 'User'}</strong>
                <span>{roleLabel}</span>
              </span>
              <button className="profile-avatar" type="button" onClick={onLogout} title="Sign out">
                <UserCircle size={28} />
                <span className="logout-indicator">
                  <LogOut size={16} />
                </span>
              </button>
            </div>
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
