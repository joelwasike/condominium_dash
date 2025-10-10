import React from 'react';
import { Bell, User, Building2 } from 'lucide-react';
import './Header.css';

const Header = ({ userRole, onRoleChange, onMenuClick, userCompany }) => {
  const handleRoleChange = (e) => {
    onRoleChange(e.target.value);
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'tenant': 'Tenant',
      'sales': 'Sales / Commercial',
      'administrative': 'Administrative Agent',
      'accounting': 'Accounting',
      'sales-manager': 'Sales Manager',
      'technician': 'Technical Manager',
      'landlord': 'Landlord (Portal)',
      'system': 'System (Automation)',
      'super-admin': 'Super Admin'
    };
    return roleMap[role] || role;
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1 className="header-title">Dashboard</h1>
      </div>
      
      <div className="header-right">
        {/* Company and Role Display */}
        {userCompany && (
          <div className="user-info-display">
            <div className="company-info">
              <Building2 size={16} />
              <span className="company-name">{userCompany}</span>
            </div>
            <div className="role-info">
              <User size={16} />
              <span className="role-name">{getRoleDisplayName(userRole)}</span>
            </div>
          </div>
        )}

        <button className="notification-button">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>
        
        <div className="user-menu">
          <button className="user-button">
            <User size={20} />
            <span>John Doe</span>
          </button>
          <select 
            value={userRole} 
            onChange={handleRoleChange}
            className="role-selector"
          >
            <option value="tenant">Tenant</option>
            <option value="sales">Sales / Commercial</option>
            <option value="administrative">Administrative Agent</option>
            <option value="accounting">Accounting</option>
            <option value="sales-manager">Sales Manager</option>
            <option value="technician">Technical Manager</option>
            <option value="landlord">Landlord (Portal)</option>
            <option value="system">System (Automation)</option>
            <option value="super-admin">Super Admin</option>
          </select>
        </div>
      </div>
    </header>
  );
};

export default Header;
