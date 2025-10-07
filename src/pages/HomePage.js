import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Home, Users, FileText, DollarSign } from 'lucide-react';
import './HomePage.css';

const HomePage = () => {
  const dashboardCards = [
    {
      title: 'Tenant Dashboard',
      description: 'Manage your rental experience, upload documents, and track payments',
      icon: Users,
      path: '/tenant',
      color: '#4299e1'
    },
    {
      title: 'Landlord Dashboard',
      description: 'Manage properties, tenants, and track rental income',
      icon: Home,
      path: '/landlord',
      color: '#38a169'
    },
    {
      title: 'Sales Dashboard',
      description: 'Manage property listings, visits, and client relationships',
      icon: FileText,
      path: '/sales',
      color: '#d69e2e'
    },
    {
      title: 'Administrative Dashboard',
      description: 'Handle document verification and administrative tasks',
      icon: DollarSign,
      path: '/administrative',
      color: '#e53e3e'
    }
  ];

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Real Estate Management Dashboard</h1>
          <p>Streamline your property management with our comprehensive dashboard system</p>
          <div className="hero-actions">
            <Link to="/login" className="btn-primary">
              Get Started
              <ArrowRight size={20} />
            </Link>
            <Link to="/tenant" className="btn-secondary">
              View Demo
            </Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2>Choose Your Dashboard</h2>
          <p>Select the dashboard that matches your role in the property management system</p>
          
          <div className="dashboard-grid">
            {dashboardCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Link key={index} to={card.path} className="dashboard-card">
                  <div className="card-icon" style={{ backgroundColor: card.color }}>
                    <Icon size={32} />
                  </div>
                  <div className="card-content">
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                  <div className="card-arrow">
                    <ArrowRight size={20} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="info-section">
        <div className="container">
          <div className="info-grid">
            <div className="info-card">
              <h3>Document Management</h3>
              <p>Upload and manage KYC documents and essential contracts with our secure system</p>
            </div>
            <div className="info-card">
              <h3>Property Listings</h3>
              <p>Manage property listings, schedule visits, and track client interactions</p>
            </div>
            <div className="info-card">
              <h3>Financial Tracking</h3>
              <p>Track payments, generate reports, and manage financial records</p>
            </div>
            <div className="info-card">
              <h3>Automation</h3>
              <p>Automate workflows, generate contracts, and streamline processes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
