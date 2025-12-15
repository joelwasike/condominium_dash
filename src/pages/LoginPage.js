import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Play, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { API_CONFIG } from '../config/api';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const backgroundImage = `${process.env.PUBLIC_URL}/pexels-godless-humanist-739743-1587947.jpg`;

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);
  const demoDropdownRef = useRef(null);

  // Available roles for demo
  const demoRoles = [
    { value: 'tenant', label: 'Tenant' },
    { value: 'landlord', label: 'Landlord' },
    { value: 'salesmanager', label: 'Sales Manager' },
    { value: 'accounting', label: 'Accounting' },
    { value: 'technician', label: 'Technician' },
    { value: 'admin', label: 'Administrative Agent' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'superadmin', label: 'Super Admin' },
    { value: 'agency_director', label: 'Agency Director' }
  ];

  // Role to route mapping
  const getDashboardRoute = (role) => {
    switch (role) {
      case 'tenant': return '/tenant';
      case 'commercial': return '/sales';
      case 'admin': return '/administrative';
      case 'accounting': return '/accounting';
      case 'salesmanager': return '/sales-manager';
      case 'technician': return '/technician';
      case 'landlord': return '/landlord';
      case 'superadmin': return '/super-admin';
      case 'agency_director': return '/agency-director';
      default: return '/tenant';
    }
  };

  const handleDemoRoleSelect = (role) => {
    // Set demo mode in localStorage
    localStorage.setItem('demo_mode', 'true');
    
    // Create a demo user object
    const demoUser = {
      id: 999,
      name: `Demo ${demoRoles.find(r => r.value === role)?.label || 'User'}`,
      email: `demo.${role}@example.com`,
      role: role,
      company: 'Demo Company'
    };
    
    // Set demo user and token
    localStorage.setItem('user', JSON.stringify(demoUser));
    localStorage.setItem('token', 'demo_token_' + Date.now());
    
    // Navigate to the appropriate dashboard
    navigate(getDashboardRoute(role));
    
    // Close dropdown
    setShowDemoDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (demoDropdownRef.current && !demoDropdownRef.current.contains(event.target)) {
        setShowDemoDropdown(false);
      }
    };

    if (showDemoDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDemoDropdown]);

  const loginEndpoint = `${API_CONFIG.BASE_URL}/api/login`;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const rawText = await response.text();
      let data;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (parseErr) {
        data = { error: rawText?.slice(0, 200) || 'Server returned non-JSON response' };
      }

      if (response.ok && data?.token && data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        onLogin(data.user);
      } else {
        const message = data?.error || `Login failed (HTTP ${response.status})`;
        setError(message);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-layout">
        <div className="login-left">
          <div className="login-content">
            <div className="login-brand">
              <div className="brand-mark">
                <img src={`${process.env.PUBLIC_URL}/download.jpeg`} alt="SAAF IMMO" />
              </div>
              
            </div>

            <div className="login-header">
              <h1>Login</h1>
              <p>Sign in to manage properties, tenants, and daily operations.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="login-actions">
                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
                
                <div className="demo-section" ref={demoDropdownRef} style={{ position: 'relative', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="demo-button"
                    onClick={() => setShowDemoDropdown(!showDemoDropdown)}
                    disabled={loading}
                  >
                    View Demo
                    <ChevronDown size={16} style={{ marginLeft: '8px', transition: 'transform 0.2s', transform: showDemoDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                  
                  {showDemoDropdown && (
                    <div className="demo-dropdown">
                      {demoRoles.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          className="demo-role-item"
                          onClick={() => handleDemoRoleSelect(role.value)}
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="support-links">
                  <button type="button" className="link-button">Forgot password?</button>
                </div>
              </div>
            </form>

            <div className="login-footer">
              <p>Don't have an account? Contact your system administrator.</p>
            </div>
          </div>
        </div>

        <div className="login-right" style={{ backgroundImage: `url(${backgroundImage})` }}>
          <div className="login-overlay" />
          <div className="login-hero">
            <span className="hero-tagline">Start planning your journey</span>
            <h2>Your Condominium Management Solution</h2>
            <p>Manage your condominium with ease. Track performance across properties, coordinate teams, and keep every stakeholder informed in real-time.</p>
            <button type="button" className="hero-button">
              <Play size={18} />
              Watch overview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;