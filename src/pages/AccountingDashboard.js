import React, { useState } from 'react';
import { DollarSign, TrendingUp, Building, Receipt, Download, Filter, Search } from 'lucide-react';
import './AccountingDashboard.css';

const AccountingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DollarSign },
    { id: 'collections', label: 'Collections', icon: TrendingUp },
    { id: 'payments', label: 'Landlord Payments', icon: Building },
    { id: 'reports', label: 'Reports', icon: Receipt }
  ];

  const mockCollections = [
    { id: 1, building: '123 Main St', landlord: 'John Smith', amount: 1500, status: 'Collected', date: '2024-11-01', chargeType: 'Rent' },
    { id: 2, building: '456 Oak Ave', landlord: 'Jane Doe', amount: 1200, status: 'Pending', date: '2024-11-01', chargeType: 'Rent' },
    { id: 3, building: '789 Pine Ln', landlord: 'Bob Johnson', amount: 2000, status: 'Collected', date: '2024-10-31', chargeType: 'Rent' },
    { id: 4, building: '321 Elm St', landlord: 'Alice Brown', amount: 500, status: 'Collected', date: '2024-10-30', chargeType: 'Late Fee' },
  ];

  const mockLandlordPayments = [
    { id: 1, landlord: 'John Smith', building: '123 Main St', netAmount: 1350, commission: 150, date: '2024-11-05', status: 'Paid' },
    { id: 2, landlord: 'Jane Doe', building: '456 Oak Ave', netAmount: 1080, commission: 120, date: '2024-11-05', status: 'Paid' },
    { id: 3, landlord: 'Bob Johnson', building: '789 Pine Ln', netAmount: 1800, commission: 200, date: '2024-11-05', status: 'Pending' },
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Available Balance</h3>
            <p>Current balance</p>
            <span className="stat-value">$45,230</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Collected This Month</h3>
            <p>November 2024</p>
            <span className="stat-value">$28,450</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Building size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Transferred to Landlords</h3>
            <p>This month</p>
            <span className="stat-value">$25,605</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Receipt size={24} />
          </div>
          <div className="stat-content">
            <h3>Company Commission Earned</h3>
            <p>This month</p>
            <span className="stat-value">$2,845</span>
          </div>
        </div>
      </div>

      <div className="balance-breakdown">
        <h3>Balance by Building</h3>
        <div className="balance-list">
          <div className="balance-item">
            <span className="building">123 Main St</span>
            <span className="amount">$8,500</span>
          </div>
          <div className="balance-item">
            <span className="building">456 Oak Ave</span>
            <span className="amount">$6,200</span>
          </div>
          <div className="balance-item">
            <span className="building">789 Pine Ln</span>
            <span className="amount">$12,800</span>
          </div>
          <div className="balance-item">
            <span className="building">321 Elm St</span>
            <span className="amount">$4,730</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCollections = () => (
    <div className="collections-section">
      <div className="section-header">
        <h3>Real-time Collections Tracking</h3>
        <p>Track rent and deposit payments per building</p>
      </div>

      <div className="filters-section">
        <div className="filter-row">
          <select className="filter-select">
            <option value="">All Buildings/Properties</option>
            <option value="123-main">123 Main St</option>
            <option value="456-oak">456 Oak Ave</option>
            <option value="789-pine">789 Pine Ln</option>
            <option value="321-elm">321 Elm St</option>
          </select>
          <select className="filter-select">
            <option value="">All Landlords</option>
            <option value="john-smith">John Smith</option>
            <option value="jane-doe">Jane Doe</option>
            <option value="bob-johnson">Bob Johnson</option>
            <option value="alice-brown">Alice Brown</option>
          </select>
          <select className="filter-select">
            <option value="">All Periods</option>
            <option value="current-month">Current Month</option>
            <option value="last-month">Last Month</option>
            <option value="last-3-months">Last 3 Months</option>
          </select>
          <select className="filter-select">
            <option value="">All Payment Status</option>
            <option value="collected">Collected</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
          <select className="filter-select">
            <option value="">All Charge Types</option>
            <option value="rent">Rent</option>
            <option value="deposit">Deposit</option>
            <option value="late-fee">Late Fee</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      <div className="collections-table">
        <table>
          <thead>
            <tr>
              <th>Building/Property</th>
              <th>Landlord</th>
              <th>Amount</th>
              <th>Payment Status</th>
              <th>Charge Type</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockCollections.map(collection => (
              <tr key={collection.id}>
                <td>{collection.building}</td>
                <td>{collection.landlord}</td>
                <td>${collection.amount}</td>
                <td className={`status ${collection.status.toLowerCase()}`}>{collection.status}</td>
                <td>{collection.chargeType}</td>
                <td>{collection.date}</td>
                <td>
                  <button className="table-action-button view">View</button>
                  <button className="table-action-button receipt">Receipt</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="collection-stats">
        <div className="stat-item">
          <span className="stat-label">Pending Rent Amount</span>
          <span className="stat-value">$3,200</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Overdue Payments</span>
          <span className="stat-value">2</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Collection Rate</span>
          <span className="stat-value">94%</span>
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="payments-section">
      <div className="section-header">
        <h3>Landlord Payment Table</h3>
        <p>Net payments after commission deduction</p>
      </div>

      <div className="payment-filters">
        <select className="filter-select">
          <option value="">All Landlords</option>
          <option value="john-smith">John Smith</option>
          <option value="jane-doe">Jane Doe</option>
          <option value="bob-johnson">Bob Johnson</option>
        </select>
        <select className="filter-select">
          <option value="">All Buildings</option>
          <option value="123-main">123 Main St</option>
          <option value="456-oak">456 Oak Ave</option>
          <option value="789-pine">789 Pine Ln</option>
        </select>
        <select className="filter-select">
          <option value="">All Periods</option>
          <option value="current-month">Current Month</option>
          <option value="last-month">Last Month</option>
        </select>
      </div>

      <div className="payments-table">
        <table>
          <thead>
            <tr>
              <th>Landlord</th>
              <th>Building</th>
              <th>Net Amount</th>
              <th>Commission</th>
              <th>Transaction Type</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockLandlordPayments.map(payment => (
              <tr key={payment.id}>
                <td>{payment.landlord}</td>
                <td>{payment.building}</td>
                <td>${payment.netAmount}</td>
                <td>${payment.commission}</td>
                <td>Payout</td>
                <td>{payment.date}</td>
                <td className={`status ${payment.status.toLowerCase()}`}>{payment.status}</td>
                <td>
                  <button className="table-action-button view">View</button>
                  <button className="table-action-button transfer">Transfer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="payment-summary">
        <div className="summary-card">
          <h4>Total Commission This Month</h4>
          <span className="amount">$2,845</span>
        </div>
        <div className="summary-card">
          <h4>Total Net Payouts</h4>
          <span className="amount">$25,605</span>
        </div>
        <div className="summary-card">
          <h4>Pending Transfers</h4>
          <span className="amount">$1,800</span>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="reports-section">
      <div className="section-header">
        <h3>Monthly Financial Reports</h3>
        <p>Generate and download comprehensive financial reports</p>
      </div>

      <div className="report-actions">
        <button className="action-button primary">
          <Download size={20} />
          Generate Monthly Report
        </button>
        <button className="action-button secondary">
          <Building size={20} />
          Building Performance Report
        </button>
        <button className="action-button secondary">
          <TrendingUp size={20} />
          Revenue Analysis Report
        </button>
        <button className="action-button secondary">
          <Receipt size={20} />
          Commission Report
        </button>
      </div>

      <div className="recent-reports">
        <h4>Recent Reports</h4>
        <div className="report-list">
          <div className="report-item">
            <div className="report-info">
              <h5>November 2024 Financial Report</h5>
              <p>Generated on Nov 1, 2024</p>
            </div>
            <button className="btn-secondary">Download</button>
          </div>
          <div className="report-item">
            <div className="report-info">
              <h5>October 2024 Building Performance</h5>
              <p>Generated on Oct 31, 2024</p>
            </div>
            <button className="btn-secondary">Download</button>
          </div>
          <div className="report-item">
            <div className="report-info">
              <h5>Q3 2024 Commission Report</h5>
              <p>Generated on Oct 1, 2024</p>
            </div>
            <button className="btn-secondary">Download</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'collections':
        return renderCollections();
      case 'payments':
        return renderPayments();
      case 'reports':
        return renderReports();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="accounting-dashboard">
      <div className="dashboard-header modern-container">
        <h1>Accounting Dashboard</h1>
        <p>Track collections, manage landlord payments, and generate financial reports</p>
      </div>

      <div className="dashboard-tabs modern-container">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="dashboard-content modern-container">
        {renderContent()}
      </div>
    </div>
  );
};

export default AccountingDashboard;