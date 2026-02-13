import React, { useState, useEffect, Component } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import TenantDashboard from './pages/TenantDashboard';
import AdministrativeDashboard from './pages/AdministrativeDashboard';
import AccountingDashboard from './pages/AccountingDashboard';
import SalesManagerDashboard from './pages/SalesManagerDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import LandlordDashboard from './pages/LandlordDashboard';
import SystemDashboard from './pages/SystemDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AgencyDirectorDashboard from './pages/AgencyDirectorDashboard';
import SettingsPage from './pages/SettingsPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CheckoutPage from './pages/CheckoutPage';
import ReceiptPage from './pages/ReceiptPage';
import ChatBubble from './components/ChatBubble';

class AppErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message || 'Please refresh the page or try again later.'}</p>
          <button type="button" onClick={() => window.location.reload()} style={{ padding: '8px 16px', marginTop: '12px', cursor: 'pointer' }}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing login on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const demoMode = localStorage.getItem('demo_mode') === 'true';
    
    if (storedUser && (storedToken || demoMode)) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('demo_mode');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  // Role-based route mapping
  const getDashboardRoute = (role) => {
    switch (role) {
      case 'tenant': return '/tenant';
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

  const DashboardLayout = ({ children }) => (
    <div className="dashboard-layout">
      <div className="main-content">
        {children}
      </div>
      <ChatBubble />
    </div>
  );

  // Protected Route component
  const ProtectedRoute = ({ children, requiredRole }) => {
    const demoMode = localStorage.getItem('demo_mode') === 'true';
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    // Allow access if in demo mode OR if user is authenticated
    if (!demoMode && !storedUser && !storedToken) {
      return <Navigate to="/" replace />;
    }
    
    // In demo mode, allow access regardless of role matching
    if (demoMode) {
      return children;
    }
    
    // For real users, check role matching
    if (requiredRole && user && user.role !== requiredRole) {
      return <Navigate to={getDashboardRoute(user.role)} replace />;
    }
    
    return children;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AppErrorBoundary>
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={
              (() => {
                const storedUser = localStorage.getItem('user');
                const storedToken = localStorage.getItem('token');
                const demoMode = localStorage.getItem('demo_mode') === 'true';
                const hasAuth = storedUser && (storedToken || demoMode);
                
                if (hasAuth) {
                  try {
                    const userData = JSON.parse(storedUser);
                    return <Navigate to={getDashboardRoute(userData?.role || 'tenant')} replace />;
                  } catch (e) {
                    // Invalid user data, clear and show login
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    localStorage.removeItem('demo_mode');
                    return <LoginPage onLogin={handleLogin} />;
                  }
                }
                return <LoginPage onLogin={handleLogin} />;
              })()
            } 
          />
          
          {/* Public pages that don't require authentication */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/receipt" element={<ReceiptPage />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/tenant" element={
            <ProtectedRoute requiredRole="tenant">
              <DashboardLayout>
                <TenantDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/administrative" element={
            <ProtectedRoute requiredRole="admin">
              <DashboardLayout>
                <AdministrativeDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/accounting" element={
            <ProtectedRoute requiredRole="accounting">
              <DashboardLayout>
                <AccountingDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/sales-manager" element={
            <ProtectedRoute requiredRole="salesmanager">
              <DashboardLayout>
                <SalesManagerDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/technician" element={
            <ProtectedRoute requiredRole="technician">
              <DashboardLayout>
                <TechnicianDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/landlord" element={
            <ProtectedRoute requiredRole="landlord">
              <DashboardLayout>
                <LandlordDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/system" element={
            <ProtectedRoute requiredRole="superadmin">
              <DashboardLayout>
                <SystemDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/super-admin" element={
            <ProtectedRoute requiredRole="superadmin">
              <DashboardLayout>
                <SuperAdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/agency-director" element={
            <ProtectedRoute requiredRole="agency_director">
              <DashboardLayout>
                <AgencyDirectorDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
    </AppErrorBoundary>
  );
}

export default App;
