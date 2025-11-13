import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import Dashboard Components
import TenantDashboard from './pages/TenantDashboard';
import SalesDashboard from './pages/SalesDashboard';
import AdministrativeDashboard from './pages/AdministrativeDashboard';
import AccountingDashboard from './pages/AccountingDashboard';
import SalesManagerDashboard from './pages/SalesManagerDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import LandlordDashboard from './pages/LandlordDashboard';
import SystemDashboard from './pages/SystemDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SettingsPage from './pages/SettingsPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CheckoutPage from './pages/CheckoutPage';
import ReceiptPage from './pages/ReceiptPage';

// Import Layout  Components
import ChatBubble from './components/ChatBubble';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing login on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
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
      case 'commercial': return '/sales';
      case 'admin': return '/administrative';
      case 'accounting': return '/accounting';
      case 'salesmanager': return '/sales-manager';
      case 'technician': return '/technician';
      case 'landlord': return '/landlord';
      case 'superadmin': return '/super-admin';
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
    if (!user) {
      return <Navigate to="/" replace />;
    }
    
    if (requiredRole && user.role !== requiredRole) {
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
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={
              user ? (
                <Navigate to={getDashboardRoute(user.role)} replace />
              ) : (
                <LoginPage onLogin={handleLogin} />
              )
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
          
          <Route path="/sales" element={
            <ProtectedRoute requiredRole="commercial">
              <DashboardLayout>
                <SalesDashboard />
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
  );
}

export default App;
