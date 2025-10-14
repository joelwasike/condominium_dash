import React, { useState } from 'react';
import ReportSubmission from '../components/ReportSubmission';
import { Home, DollarSign, Wrench, Calendar, Camera, Upload, X, CreditCard, Smartphone, Banknote, Download } from 'lucide-react';
import './TenantDashboard.css';

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

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleMaintenanceSubmit = (e) => {
    e.preventDefault();
    
    const maintenanceRequest = {
      id: Date.now(),
      title: maintenanceForm.title,
      description: maintenanceForm.description,
      priority: maintenanceForm.priority,
      photos: maintenanceForm.photos,
      status: 'pending',
      date: new Date().toLocaleDateString(),
      tenant: 'Current Tenant'
    };

    console.log('Maintenance request submitted:', maintenanceRequest);
    addNotification('Maintenance request submitted successfully!', 'success');
    
    // Reset form
    setMaintenanceForm({
      title: '',
      description: '',
      priority: 'medium',
      photos: []
    });
    setShowMaintenanceModal(false);
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

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    const payment = {
      id: Date.now(),
      amount: paymentForm.amount,
      paymentMethod: paymentForm.paymentMethod,
      reference: paymentForm.reference,
      status: 'completed',
      date: new Date().toLocaleDateString(),
      description: 'Monthly Rent Payment'
    };

    console.log('Payment submitted:', payment);
    addNotification('Payment submitted successfully!', 'success');
    
    // Reset form
    setPaymentForm({
      amount: '',
      paymentMethod: '',
      reference: ''
    });
    setShowPaymentModal(false);
  };

  const downloadReceipt = (paymentId) => {
    // Simulate receipt download
    const receiptData = {
      paymentId: paymentId,
      date: new Date().toLocaleDateString(),
      amount: '$1,500',
      description: 'Monthly Rent Payment',
      paymentMethod: 'Bank Transfer',
      reference: 'REF123456789'
    };
    
    // Create a simple text receipt
    const receiptText = `
RENT PAYMENT RECEIPT
===================
Payment ID: ${receiptData.paymentId}
Date: ${receiptData.date}
Amount: ${receiptData.amount}
Description: ${receiptData.description}
Payment Method: ${receiptData.paymentMethod}
Reference: ${receiptData.reference}

Thank you for your payment!
    `.trim();
    
    // Create and download the file
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${paymentId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    addNotification('Receipt downloaded successfully!', 'success');
  };

        return (
    <div className="tenant-dashboard">
      <div className="dashboard-header modern-container">
        <h1>Tenant Dashboard</h1>
        <p>Manage your property, payments, and communicate with support</p>
      </div>

      <div className="tabs modern-container">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          <Home size={18} /> Overview
        </button>
        <button className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>
          <DollarSign size={18} /> Payments
        </button>
        <button className={activeTab === 'maintenance' ? 'active' : ''} onClick={() => setActiveTab('maintenance')}>
          <Wrench size={18} /> Maintenance
        </button>
      </div>

      <div className="tab-content modern-container">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Welcome, Tenant!</h2>
            <p>Here's a quick overview of your current property status and upcoming activities.</p>
            <div className="stats-grid">
              <div className="stat-card modern-card">
                <h3>Current Lease</h3>
                <p>Apartment 4B, 123 Main St</p>
                <p>Ends: 2024-12-31</p>
              </div>
              <div className="stat-card modern-card">
                <h3>Next Rent Due</h3>
                <p>$1,500 on 2024-11-01</p>
              </div>
              <div className="stat-card modern-card">
                <h3>Open Maintenance Tickets</h3>
                <p>2</p>
              </div>
            </div>
            <div className="action-buttons">
              <ReportSubmission />
            </div>
          </div>
        )}


        {activeTab === 'payments' && (
          <div className="payments-section">
            <h2>Payment Management</h2>
            <p>Make payments and view your payment history.</p>
            
            {/* Payment Options */}
            <div className="payment-options modern-card">
              <h3>Make a Payment</h3>
              <p>Choose your preferred payment method:</p>
              <div className="payment-methods">
                <button 
                  className="payment-method-btn" 
                  onClick={() => setShowPaymentModal(true)}
                >
                  <Banknote size={24} />
                  <span>Cash Payment</span>
                </button>
                <button 
                  className="payment-method-btn" 
                  onClick={() => setShowPaymentModal(true)}
                >
                  <Smartphone size={24} />
                  <span>Mobile Money</span>
                </button>
                <button 
                  className="payment-method-btn" 
                  onClick={() => setShowPaymentModal(true)}
                >
                  <CreditCard size={24} />
                  <span>Bank Transfer</span>
                </button>
              </div>
            </div>

            {/* Payment History */}
            <div className="payment-history">
              <h3>Payment History</h3>
              <div className="modern-card">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>2024-10-01</td>
                      <td>Monthly Rent</td>
                      <td>$1,500</td>
                      <td>Bank Transfer</td>
                      <td className="status paid">Paid</td>
                      <td>
                        <button 
                          className="download-btn" 
                          onClick={() => downloadReceipt('PAY001')}
                          title="Download Receipt"
                        >
                          <Download size={16} />
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>2024-09-01</td>
                      <td>Monthly Rent</td>
                      <td>$1,500</td>
                      <td>Mobile Money</td>
                      <td className="status paid">Paid</td>
                      <td>
                        <button 
                          className="download-btn" 
                          onClick={() => downloadReceipt('PAY002')}
                          title="Download Receipt"
                        >
                          <Download size={16} />
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>2024-08-01</td>
                      <td>Monthly Rent</td>
                      <td>$1,500</td>
                      <td>Cash</td>
                      <td className="status paid">Paid</td>
                      <td>
                        <button 
                          className="download-btn" 
                          onClick={() => downloadReceipt('PAY003')}
                          title="Download Receipt"
                        >
                          <Download size={16} />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="maintenance-section">
            <h2>Maintenance Requests</h2>
            <p>Submit new requests or check the status of existing ones.</p>
            <button className="action-button" onClick={() => setShowMaintenanceModal(true)}>Submit New Request</button>

            <div className="modern-card">
              <h3>Open Requests</h3>
              <ul>
                <li>Leaky Faucet - <span className="status pending">Pending</span></li>
                <li>AC Not Cooling - <span className="status in-progress">In Progress</span></li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Notification System */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>×</button>
          </div>
        ))}
      </div>

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
                  <button type="submit" className="action-button primary">
                    Submit Request
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
                  <button type="submit" className="action-button primary">
                    Submit Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;
