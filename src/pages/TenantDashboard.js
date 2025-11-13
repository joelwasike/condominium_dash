import React, { useState, useEffect, useMemo } from 'react';
import ReportSubmission from '../components/ReportSubmission';
import {
  Home,
  DollarSign,
  Wrench,
  Calendar,
  Camera,
  Upload,
  X,
  CreditCard,
  Smartphone,
  Banknote,
  Download,
  Settings,
  Plus
} from 'lucide-react';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import '../components/RoleLayout.css';
import '../pages/TechnicianDashboard.css';
import './TenantDashboard.css';
import { tenantService } from '../services/tenantService';

const TenantDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    photos: []
  });
  const [notifications, setNotifications] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: '',
    reference: ''
  });
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'payments', label: 'Payments', icon: DollarSign },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
      { id: 'settings', label: 'Profile Settings', icon: Settings }
    ],
    []
  );

  const addNotification = (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [overview, paymentsData, maintenanceData] = await Promise.all([
        tenantService.getOverview(),
        tenantService.listPayments(),
        tenantService.listMaintenance()
      ]);

      setOverviewData(overview);
      setPayments(paymentsData);
      setMaintenanceRequests(maintenanceData);
    } catch (error) {
      console.error('Error loading data:', error);
      addNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const maintenanceData = {
        property: 'Apartment 4B, 123 Main St',
        title: maintenanceForm.title,
        description: maintenanceForm.description,
        priority: maintenanceForm.priority,
        tenant: 'Current Tenant'
      };

      const newRequest = await tenantService.createMaintenance(maintenanceData);
      setMaintenanceRequests(prev => [newRequest, ...prev]);
      addNotification('Maintenance request submitted successfully!', 'success');

      setMaintenanceForm({ title: '', description: '', priority: 'medium', photos: [] });
      setShowMaintenanceModal(false);
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      addNotification('Failed to submit maintenance request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      preview: URL.createObjectURL(file)
    }));

    setMaintenanceForm(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
  };

  const removePhoto = (photoId) => {
    setMaintenanceForm(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo.id !== photoId)
    }));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const paymentData = {
        tenant: 'Current Tenant',
        property: 'Apartment 4B, 123 Main St',
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.paymentMethod,
        chargeType: 'rent',
        reference: paymentForm.reference
      };

      const newPayment = await tenantService.recordPayment(paymentData);
      setPayments(prev => [newPayment, ...prev]);
      addNotification('Payment submitted successfully!', 'success');

      setPaymentForm({ amount: '', paymentMethod: '', reference: '' });
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error submitting payment:', error);
      addNotification('Failed to submit payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (paymentId) => {
    try {
      const payment = payments.find(p => p.ID === paymentId);
      if (!payment) {
        addNotification('Payment not found', 'error');
        return;
      }

      await tenantService.generateReceipt(paymentId);

      const receiptText = `
RENT PAYMENT RECEIPT
===================
Payment ID: ${payment.ID}
Receipt Number: ${payment.ReceiptNumber}
Date: ${new Date(payment.Date).toLocaleDateString()}
Amount: ${payment.Amount} XOF
Description: ${payment.ChargeType}
Payment Method: ${payment.Method}
Status: ${payment.Status}

Thank you for your payment!
      `.trim();

      const blob = new Blob([receiptText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${payment.ReceiptNumber || paymentId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addNotification('Receipt downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      addNotification('Failed to download receipt', 'error');
    }
  };

  const renderOverview = () => (
    <div className="overview-section tenant-overview">
      <div className="section-header">
        <div>
          <h2>Tenant Dashboard Overview</h2>
          <p>Welcome, {overviewData?.tenant || 'Tenant'}! Here's a quick overview of your current property status and upcoming activities.</p>
        </div>
      </div>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="dashboard-overview">
          <div className="overview-card">
            <div className="card-label">
              <span>Current Lease</span>
            </div>
            <div className="card-value">
              <span>{overviewData?.lease?.property || 'Apartment 4B, 123 Main St'}</span>
              <small>Ends: {overviewData?.lease?.endDate || '2024-12-31'}</small>
            </div>
          </div>
          <div className="overview-card">
            <div className="card-label">
              <span>Next Rent Due</span>
            </div>
            <div className="card-value">
              <span>{overviewData?.nextRentDue?.amount || 1500} XOF</span>
              <small>Due: {overviewData?.nextRentDue?.date || '2024-11-01'}</small>
            </div>
          </div>
          <div className="overview-card">
            <div className="card-label">
              <span>Open Maintenance Tickets</span>
            </div>
            <div className="card-value">
              <span>{overviewData?.openMaintenanceTickets || 0}</span>
              <small>Active requests</small>
            </div>
          </div>
        </div>
      )}
      <div className="action-buttons" style={{ marginTop: '24px' }}>
        <ReportSubmission />
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="payments-section">
      <div className="section-header">
        <div>
          <h2>Payment Management</h2>
          <p>Make payments and view your payment history</p>
        </div>
        <button className="btn-primary" onClick={() => setShowPaymentModal(true)} disabled={loading}>
          <Plus size={18} />
          Make Payment
        </button>
      </div>

      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2>Payment History</h2>
          <p>View all your past payments and download receipts</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="no-data">No payments found</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={payment.ID || `payment-${index}`}>
                  <td>{new Date(payment.Date).toLocaleDateString()}</td>
                  <td>
                    <span className="row-primary">{payment.ChargeType}</span>
                  </td>
                  <td>{payment.Amount} XOF</td>
                  <td>{payment.Method}</td>
                  <td>
                    <span className={`status-badge ${(payment.Status || 'pending').toLowerCase().replace(' ', '-')}`}>
                      {payment.Status}
                    </span>
                  </td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button
                        className="table-action-button view"
                        onClick={() => downloadReceipt(payment.ID)}
                        title="Download Receipt"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderMaintenance = () => (
    <div className="maintenance-section">
      <div className="section-header">
        <div>
          <h2>Maintenance Requests</h2>
          <p>Submit new requests or check the status of existing ones</p>
        </div>
        <button className="btn-primary" onClick={() => setShowMaintenanceModal(true)} disabled={loading}>
          <Plus size={18} />
          Submit New Request
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading maintenance requests...</div>
      ) : maintenanceRequests.length === 0 ? (
        <div className="no-data">No maintenance requests found</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Priority</th>
                <th>Date</th>
                <th>Status</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {maintenanceRequests.map((request, index) => (
                <tr key={request.ID || `request-${index}`}>
                  <td>
                    <span className="row-primary">{request.Issue || request.Title || 'Maintenance Request'}</span>
                    {request.Description && (
                      <div className="row-secondary">{request.Description}</div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${(request.Priority || 'medium').toLowerCase()}`}>
                      {request.Priority || 'Medium'}
                    </span>
                  </td>
                  <td>{new Date(request.Date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${(request.Status || 'pending').toLowerCase().replace(' ', '-')}`}>
                      {request.Status}
                    </span>
                  </td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button
                        className="table-action-button view"
                        onClick={() => addNotification('Viewing maintenance request details', 'info')}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'overview':
        return renderOverview();
      case 'payments':
        return renderPayments();
      case 'maintenance':
        return renderMaintenance();
      case 'settings':
        return (
          <div className="embedded-settings">
            <SettingsPage />
          </div>
        );
      default:
        return renderOverview();
    }
  };

  const layoutMenu = useMemo(
    () =>
      tabs.map(tab => ({
        ...tab,
        onSelect: () => setActiveTab(tab.id),
        active: activeTab === tab.id
      })),
    [tabs, activeTab]
  );

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <>
      <RoleLayout
        brand={{ name: 'SAAF IMMO', caption: 'Tenant Portal', logo: 'SAAF', logoImage: `${process.env.PUBLIC_URL}/download.jpeg` }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}
      >
        {({ activeId }) => (
          <div className="content-body tenant-content">
            {renderContent(activeId)}
          </div>
        )}
      </RoleLayout>

      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map(notification => (
            <div key={notification.id} className={`notification notification-${notification.type}`}>
              <span>{notification.message}</span>
              <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Maintenance Request Modal */}
      {showMaintenanceModal && (
        <div className="modal-overlay" onClick={() => setShowMaintenanceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Maintenance Request</h3>
              <button className="modal-close" onClick={() => setShowMaintenanceModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleMaintenanceSubmit}>
                <div className="form-group">
                  <label htmlFor="title">Issue Title</label>
                  <input
                    type="text"
                    id="title"
                    value={maintenanceForm.title}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Leaky faucet in kitchen"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority Level</label>
                  <select
                    id="priority"
                    value={maintenanceForm.priority}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, priority: e.target.value }))}
                    required
                  >
                    <option value="low">Low - Can wait</option>
                    <option value="medium">Medium - Should be fixed soon</option>
                    <option value="high">High - Urgent</option>
                    <option value="emergency">Emergency - Immediate attention needed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Please describe the issue in detail..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="photos">Upload Photos (Optional)</label>
                  <div className="photo-upload-area">
                    <input
                      type="file"
                      id="photos"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="photos" className="photo-upload-button">
                      <Camera size={20} />
                      <span>Choose Photos</span>
                    </label>
                    <p className="photo-help-text">Upload photos to help describe the issue (max 5 photos)</p>
                  </div>

                  {maintenanceForm.photos.length > 0 && (
                    <div className="photo-preview-grid">
                      {maintenanceForm.photos.map(photo => (
                        <div key={photo.id} className="photo-preview-item">
                          <img src={photo.preview} alt={photo.name} />
                          <button
                            type="button"
                            className="remove-photo-button"
                            onClick={() => removePhoto(photo.id)}
                          >
                            <X size={16} />
                          </button>
                          <span className="photo-name">{photo.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowMaintenanceModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Make Payment</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handlePaymentSubmit}>
                <div className="form-group">
                  <label htmlFor="amount">Amount</label>
                  <input
                    type="number"
                    id="amount"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method</label>
                  <select
                    id="paymentMethod"
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    required
                  >
                    <option value="">Select payment method</option>
                    <option value="cash">Cash Payment</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="reference">Reference Number</label>
                  <input
                    type="text"
                    id="reference"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="Enter transaction reference"
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="action-button secondary" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TenantDashboard;
