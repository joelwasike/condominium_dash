import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Lock } from 'lucide-react';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const companies = [
    'Premium Properties Ltd',
    'Elite Real Estate Group',
    'Metro Property Management',
    'Urban Living Solutions',
    'Golden Gate Properties',
    'Skyline Real Estate'
  ];

  const roles = [
    { value: 'tenant', label: 'Tenant' },
    { value: 'sales', label: 'Sales / Commercial' },
    { value: 'administrative', label: 'Administrative Agent' },
    { value: 'accounting', label: 'Accounting' },
    { value: 'sales-manager', label: 'Sales Manager' },
    { value: 'technician', label: 'Technical Manager' },
    { value: 'landlord', label: 'Landlord (Portal)' },
    { value: 'system', label: 'System (Automation)' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically validate credentials
    // For demo purposes, we'll navigate to the appropriate dashboard
    if (formData.role && formData.company && formData.email && formData.password) {
      // Pass login data to parent component if callback is provided
      if (onLogin) {
        onLogin({
          company: formData.company,
          role: formData.role,
          email: formData.email
        });
      }
      navigate(`/${formData.role}`);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <Building2 size={40} />
            <h1>Real Estate Pro</h1>
          </div>
          <p>Multi-Agency Property Management System</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="company">
              <Building2 size={16} />
              Company
            </label>
            <select 
              id="company" 
              name="company" 
              value={formData.company}
              onChange={handleInputChange}
              required
            >
              <option value="">Select your company</option>
              {companies.map((company, index) => (
                <option key={index} value={company}>{company}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="role">
              <User size={16} />
              Role
            </label>
            <select 
              id="role" 
              name="role" 
              value={formData.role}
              onChange={handleInputChange}
              required
            >
              <option value="">Select your role</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={16} />
              Email
            </label>
            <input 
              type="email" 
              id="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email" 
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              <Lock size={16} />
              Password
            </label>
            <input 
              type="password" 
              id="password" 
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password" 
              required
            />
          </div>
          
          <button type="submit" className="login-button">
            Access Dashboard
          </button>
        </form>
        
        <div className="login-footer">
          <p>Need help? Contact your system administrator</p>
          <div className="demo-info">
            <p><strong>Demo:</strong> Use any email/password to access dashboards</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
