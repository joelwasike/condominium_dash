import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Briefcase, 
  Building, 
  Wallet, 
  Link as LinkIcon,
  ArrowLeftRight,
  User,
  Settings,
  Activity
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Activity },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/transactions', label: 'Transactions', icon: Briefcase },
    { path: '/settlements', label: 'Settlements', icon: Building },
    { path: '/wallet-transfers', label: 'Wallet Transfers', icon: Wallet },
    { path: '/payment-links', label: 'Payment Links', icon: LinkIcon },
    { path: '/forex', label: 'Forex', icon: ArrowLeftRight },
    { path: '/user-management', label: 'User Management', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Navigation</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
