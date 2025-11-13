import React from 'react';
import { Bell, User, Building2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ userRole, onLogout, onMenuClick, userCompany, userName }) => {
  const navigate = useNavigate();
  
  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const getRoleDisplayName = (role) => {
    const roleMap = {
      'tenant': 'Tenant',
      'commercial': 'Commercial Dashboard',
      'admin': 'Administrative Agent',
      'accounting': 'Accounting',
      'salesmanager': 'Sales Manager',
      'technician': 'Technical Manager',
      'landlord': 'Landlord',
      'superadmin': 'Super Admin'
    };
    return roleMap[role] || role;
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    // Update localStorage with new role
    const updatedUser = { ...user, role: newRole };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Navigate to the appropriate dashboard
    const roleRoutes = {
      'tenant': '/tenant',
      'commercial': '/sales',
      'admin': '/administrative',
      'accounting': '/accounting',
      'salesmanager': '/sales-manager',
      'technician': '/technician',
      'landlord': '/landlord',
      'superadmin': '/super-admin'
    };
    
    if (roleRoutes[newRole]) {
      navigate(roleRoutes[newRole]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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
            <span>{user.name || 'User'}</span>
          </button>
          <select 
            value={userRole} 
            onChange={handleRoleChange}
            className="role-selector"
          >
            <option value="tenant">Tenant</option>
            <option value="commercial">Commercial Dashboard</option>
            <option value="admin">Administrative Agent</option>
            <option value="accounting">Accounting</option>
            <option value="salesmanager">Sales Manager</option>
            <option value="technician">Technical Manager</option>
            <option value="landlord">Landlord</option>
            <option value="superadmin">Super Admin</option>
          </select>
          <button className="logout-button" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
