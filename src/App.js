import React, { useState } from 'react';
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
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CheckoutPage from './pages/CheckoutPage';
import ReceiptPage from './pages/ReceiptPage';

// Import Layout Components
import Header from './components/Header';
import ChatBubble from './components/ChatBubble';

function App() {
  const [userRole, setUserRole] = useState('tenant'); // Default role for demo
  const [userCompany, setUserCompany] = useState('Premium Properties Ltd'); // Default company for demo
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (loginData) => {
    setUserCompany(loginData.company);
    setUserRole(loginData.role);
  };

  const DashboardLayout = ({ children }) => (
    <div className="dashboard-layout">
      <Header 
        userRole={userRole} 
        onRoleChange={setUserRole}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        userCompany={userCompany}
      />
      <div className="main-content">
        {children}
      </div>
      <ChatBubble />
    </div>
  );

  return (
    <Router>
      <div className="App">
        <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/receipt" element={<ReceiptPage />} />
          
          {/* Dashboard Routes */}
          <Route path="/tenant" element={
            <DashboardLayout>
              <TenantDashboard />
            </DashboardLayout>
          } />
          
          <Route path="/sales" element={
            <DashboardLayout>
              <SalesDashboard />
            </DashboardLayout>
          } />
          
          <Route path="/administrative" element={
            <DashboardLayout>
              <AdministrativeDashboard />
            </DashboardLayout>
          } />
          
          <Route path="/accounting" element={
            <DashboardLayout>
              <AccountingDashboard />
            </DashboardLayout>
          } />
          
          <Route path="/sales-manager" element={
            <DashboardLayout>
              <SalesManagerDashboard />
            </DashboardLayout>
          } />
          
          <Route path="/technician" element={
            <DashboardLayout>
              <TechnicianDashboard />
            </DashboardLayout>
          } />
          
          <Route path="/landlord" element={
            <DashboardLayout>
              <LandlordDashboard />
            </DashboardLayout>
          } />
          
          <Route path="/system" element={
            <DashboardLayout>
              <SystemDashboard />
            </DashboardLayout>
          } />
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
