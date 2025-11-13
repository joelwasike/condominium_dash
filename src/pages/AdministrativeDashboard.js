import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Settings,
  Mail,
  Send,
  Bell,
  DollarSign,
  Download,
  Plus
} from 'lucide-react';
import RoleLayout from '../components/RoleLayout';
import SettingsPage from './SettingsPage';
import Modal from '../components/Modal';
import '../components/RoleLayout.css';
import '../pages/TechnicianDashboard.css';
import './AdministrativeDashboard.css';
import { adminService } from '../services/adminService';

const AdministrativeDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // API Data States
  const [inboxDocs, setInboxDocs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [utilities, setUtilities] = useState([]);
  const [debts, setDebts] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [leases, setLeases] = useState([]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  // Load data from APIs
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [inboxData, documentsData, utilitiesData, debtsData, remindersData, leasesData] = await Promise.all([
        adminService.getInbox(),
        adminService.getDocuments(),
        adminService.getUtilities(),
        adminService.getDebts(),
        adminService.getReminders(),
        adminService.getLeases()
      ]);
      
      setInboxDocs(inboxData.items || []);
      setDocuments(documentsData);
      setUtilities(utilitiesData.items || []);
      setDebts(debtsData.items || []);
      setReminders(remindersData);
      setLeases(leasesData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      addNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: FileText },
      { id: 'inbox', label: 'Inbox', icon: Mail },
      { id: 'documents', label: 'Documents', icon: FileText },
      { id: 'utilities', label: 'CIE/SODECI Transfers', icon: Send },
      { id: 'debt', label: 'Debt Collection', icon: DollarSign },
      { id: 'reminders', label: 'Reminders', icon: Bell },
      { id: 'leases', label: 'Leases', icon: FileText },
      { id: 'automation', label: 'Automation & Reports', icon: TrendingUp },
      { id: 'settings', label: 'Profile Settings', icon: Settings }
    ],
    []
  );

  const handleForwardInbox = async (id) => {
    try {
      await adminService.forwardInbox(id);
      addNotification('Document forwarded successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error forwarding document:', error);
      addNotification('Failed to forward document', 'error');
    }
  };

  const handleApproveDocument = async (id) => {
    try {
      await adminService.approveDocument(id);
      addNotification('Document approved successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error approving document:', error);
      addNotification('Failed to approve document', 'error');
    }
  };

  const handleRejectDocument = async (id) => {
    try {
      await adminService.rejectDocument(id);
      addNotification('Document rejected successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error rejecting document:', error);
      addNotification('Failed to reject document', 'error');
    }
  };

  const handleSendToUtility = async (id) => {
    try {
      await adminService.sendToUtility(id);
      addNotification('Document sent to utility successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error sending to utility:', error);
      addNotification('Failed to send to utility', 'error');
    }
  };

  const handleCreateReminder = () => {
    const reminder = {
      id: Date.now(),
      subject: 'Scheduled Reminder',
      description: 'Automated follow up',
      date: new Date().toLocaleDateString(),
      channel: 'Email',
      status: 'Scheduled'
    };
    setReminders(prev => [reminder, ...prev]);
    addNotification('Reminder scheduled', 'success');
  };

  const renderInbox = () => (
    <div className="inbox-section">
      <div className="section-header">
        <div>
          <h2>Received Documents</h2>
          <p>Incoming tenant documents (email/inbox)</p>
        </div>
      </div>
      {loading ? (
        <div className="loading">Loading inbox documents...</div>
      ) : inboxDocs.length === 0 ? (
        <div className="no-data">No documents in inbox</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Document Type</th>
                <th>Source</th>
                <th>Received</th>
                <th>Status</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {inboxDocs.map((doc, index) => (
                <tr key={doc.id || `doc-${index}`}>
                  <td>
                    <div className="row-primary">{doc.tenant || 'Unknown Tenant'}</div>
                    <div className="row-secondary">{doc.reference || doc.id || 'No reference'}</div>
                  </td>
                  <td>{doc.type || 'Unknown Type'}</td>
                  <td>{doc.from || 'Unknown'}</td>
                  <td>{doc.date || 'Unknown Date'}</td>
                  <td>
                    <span className={`status-badge ${(doc.status || 'new').toLowerCase()}`}>
                      {doc.status || 'New'}
                    </span>
                  </td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button
                        className="table-action-button edit"
                        onClick={() => addNotification('Document archived', 'success')}
                      >
                        Archive
                      </button>
                      <button
                        className="table-action-button view"
                        onClick={() => handleForwardInbox(doc.id)}
                        disabled={loading}
                      >
                        Forward
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

  const renderOverview = () => {
    const approvedCount = documents.filter(
      d => (d.status || '').toLowerCase() === 'approved'
    ).length;
    const pendingCount = documents.filter(
      d => (d.status || '').toLowerCase() === 'pending'
    ).length;
    const remindersCount = reminders.filter(
      r => (r.status || '').toLowerCase() === 'scheduled'
    ).length;

    return (
      <div className="overview-section">
        <div className="section-header">
          <div>
            <h2>Administrative Dashboard Overview</h2>
            <p>Track document verification, automation, and administrative tasks</p>
          </div>
        </div>

        <div className="dashboard-overview">
          <div className="overview-card">
            <div className="card-label">
              <span>Files Received</span>
            </div>
            <div className="card-value">
              <span>{inboxDocs.length + documents.length}</span>
              <small>Total documents</small>
            </div>
          </div>
          <div className="overview-card">
            <div className="card-label">
              <span>Files Approved</span>
            </div>
            <div className="card-value">
              <span>{approvedCount}</span>
              <small>Approved documents</small>
            </div>
          </div>
          <div className="overview-card">
            <div className="card-label">
              <span>Pending Review</span>
            </div>
            <div className="card-value">
              <span>{pendingCount}</span>
              <small>Awaiting verification</small>
            </div>
          </div>
          <div className="overview-card">
            <div className="card-label">
              <span>Active Reminders</span>
            </div>
            <div className="card-value">
              <span>{remindersCount}</span>
              <small>Scheduled reminders</small>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDocuments = () => (
    <div className="documents-section">
      <div className="section-header">
        <div>
          <h2>Document Verification</h2>
          <p>Review and approve tenant documents</p>
        </div>
      </div>

      <div className="filters-section" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select className="filter-select">
          <option value="">All Documents</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="filter-select">
          <option value="">All Types</option>
          <option value="id">ID Documents</option>
          <option value="income">Income Proof</option>
          <option value="reference">References</option>
        </select>
        <input
          className="search-input"
          type="text"
          placeholder="Search by client name..."
          style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(15, 31, 96, 0.12)', background: '#f7f8ff', minWidth: '200px' }}
        />
      </div>

      {loading ? (
        <div className="loading">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="no-data">No documents pending review</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Document</th>
                <th>Submitted</th>
                <th>Status</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, index) => (
                <tr key={doc.id || `document-${index}`}>
                  <td>
                    <div className="row-primary">{doc.tenant || 'Unknown Tenant'}</div>
                    <div className="row-secondary">{doc.email || doc.reference || 'No reference'}</div>
                  </td>
                  <td>
                    <div className="row-primary">{doc.documentType || doc.type || 'Document'}</div>
                    <div className="row-secondary">{doc.category || 'General'}</div>
                  </td>
                  <td>{doc.submittedAt || doc.date || 'Unknown'}</td>
                  <td>
                    <span className={`status-badge ${(doc.status || 'pending').toLowerCase()}`}>
                      {doc.status || 'Pending'}
                    </span>
                  </td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button
                        className="table-action-button view"
                        onClick={() => addNotification('Opening document viewer', 'info')}
                      >
                        View
                      </button>
                      <button
                        className="table-action-button edit"
                        onClick={() => handleApproveDocument(doc.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="table-action-button delete"
                        onClick={() => handleRejectDocument(doc.id)}
                      >
                        Reject
                      </button>
                      <button
                        className="table-action-button view"
                        onClick={() => handleSendToUtility(doc.id)}
                      >
                        Utility
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

  const renderUtilities = () => (
    <div className="utilities-section">
      <div className="section-header">
        <div>
          <h2>CIE / SODECI Transfers</h2>
          <p>Send tenant and lease details to utility companies</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => addNotification('Batch export started', 'success')}
          disabled={loading}
        >
          <Send size={18} />
          Send Batch
        </button>
      </div>
      {loading ? (
        <div className="loading">Loading utility transfers...</div>
      ) : utilities.length === 0 ? (
        <div className="no-data">No pending transfers</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property</th>
                <th>Utility Account</th>
                <th>Status</th>
                <th>Scheduled</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {utilities.map((item, index) => (
                <tr key={item.id || `utility-${index}`}>
                  <td>
                    <div className="row-primary">{item.tenant || 'Unknown Tenant'}</div>
                    <div className="row-secondary">{item.email || item.phone || '—'}</div>
                  </td>
                  <td>
                    <div className="row-primary">{item.property || 'Unknown property'}</div>
                    <div className="row-secondary">{item.city || item.reference || '—'}</div>
                  </td>
                  <td>{item.utilityAccount || item.meter || '—'}</td>
                  <td>
                    <span className={`status-badge ${(item.status || 'ready').toLowerCase()}`}>
                      {item.status || 'Ready'}
                    </span>
                  </td>
                  <td>{item.scheduled || item.date || '—'}</td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button
                        className="table-action-button view"
                        onClick={() => addNotification('Previewing payload', 'info')}
                      >
                        Preview
                      </button>
                      <button
                        className="table-action-button edit"
                        onClick={() => handleSendToUtility(item.id)}
                      >
                        Send
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

  const renderDebt = () => (
    <div className="debt-section">
      <div className="section-header">
        <div>
          <h2>Debt Collection</h2>
          <p>Track overdue balances and manage collections</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => addNotification('Debt report exported', 'success')}
          disabled={loading}
        >
          <Download size={18} />
          Export
        </button>
      </div>
      {loading ? (
        <div className="loading">Syncing balances...</div>
      ) : debts.length === 0 ? (
        <div className="no-data">No outstanding debts</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property</th>
                <th>Amount Due</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {debts.map(debt => (
                <tr key={debt.id}>
                  <td>
                    <div className="row-primary">{debt.tenant}</div>
                    <div className="row-secondary">{debt.email || debt.contact || '—'}</div>
                  </td>
                  <td>
                    <div className="row-primary">{debt.property}</div>
                    <div className="row-secondary">{debt.unit || debt.city || '—'}</div>
                  </td>
                  <td>
                    <div className="row-primary">{debt.amount || debt.balance}</div>
                    <div className="row-secondary">Reminders: {debt.reminders || 0}</div>
                  </td>
                  <td>{debt.dueDate}</td>
                  <td>
                    <span className={`status-badge ${(debt.status || 'pending').toLowerCase()}`}>
                      {debt.status}
                    </span>
                  </td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button
                        className="table-action-button view"
                        onClick={() =>
                          setDebts(prev =>
                            prev.map(d =>
                              d.id === debt.id ? { ...d, reminders: (d.reminders || 0) + 1 } : d
                            )
                          )
                        }
                      >
                        Reminder
                      </button>
                      <button
                        className="table-action-button edit"
                        onClick={() =>
                          setDebts(prev =>
                            prev.map(d => (d.id === debt.id ? { ...d, status: 'Paid' } : d))
                          )
                        }
                      >
                        Mark Paid
                      </button>
                      <button
                        className="table-action-button delete"
                        onClick={() => addNotification('Escalated to collections', 'warning')}
                      >
                        Escalate
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

  const renderReminders = () => (
    <div className="reminders-section">
      <div className="section-header">
        <div>
          <h2>Reminders</h2>
          <p>Create and manage payment and document reminders</p>
        </div>
        <button className="btn-primary" onClick={handleCreateReminder} disabled={loading}>
          <Plus size={18} />
          Schedule Reminder
        </button>
      </div>
      {reminders.length === 0 ? (
        <div className="no-data">No reminders scheduled</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reminder</th>
                <th>Channel</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {reminders.map(rem => (
                <tr key={rem.id}>
                  <td>
                    <div className="row-primary">{rem.subject}</div>
                    <div className="row-secondary">{rem.description || 'Automated follow up'}</div>
                  </td>
                  <td>{rem.channel}</td>
                  <td>{rem.date}</td>
                  <td>
                    <span className={`status-badge ${(rem.status || 'scheduled').toLowerCase()}`}>
                      {rem.status}
                    </span>
                  </td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button
                        className="table-action-button edit"
                        onClick={() => addNotification('Reminder updated', 'success')}
                      >
                        Edit
                      </button>
                      <button
                        className="table-action-button delete"
                        onClick={() => setReminders(prev => prev.filter(r => r.id !== rem.id))}
                      >
                        Cancel
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

  const renderLeases = () => (
    <div className="leases-section">
      <div className="section-header">
        <div>
          <h2>Lease Agreements</h2>
          <p>Generate and manage lease contracts for approved tenants</p>
        </div>
        <button className="btn-primary" onClick={() => setShowLeaseModal(true)} disabled={loading}>
          <Plus size={18} />
          Create Lease
        </button>
      </div>
      {leases.length === 0 ? (
        <div className="no-data">No leases created yet</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property</th>
                <th>Term</th>
                <th>Rent</th>
                <th>Status</th>
                <th className="table-menu"></th>
              </tr>
            </thead>
            <tbody>
              {leases.map(lease => (
                <tr key={lease.id}>
                  <td>
                    <div className="row-primary">{lease.tenant}</div>
                    <div className="row-secondary">{lease.email || '—'}</div>
                  </td>
                  <td>
                    <div className="row-primary">{lease.property}</div>
                    <div className="row-secondary">{lease.unit || lease.city || '—'}</div>
                  </td>
                  <td>
                    <div className="row-primary">
                      {lease.startDate} - {lease.endDate}
                    </div>
                    <div className="row-secondary">{lease.duration || '1 year'}</div>
                  </td>
                  <td>{lease.rent}</td>
                  <td>
                    <span className={`status-badge ${(lease.status || 'active').toLowerCase()}`}>
                      {lease.status || 'Active'}
                    </span>
                  </td>
                  <td className="table-menu">
                    <div className="table-actions">
                      <button
                        className="table-action-button view"
                        onClick={() => addNotification('Lease opened', 'info')}
                      >
                        View
                      </button>
                      <button
                        className="table-action-button edit"
                        onClick={() => addNotification('Lease downloaded', 'success')}
                      >
                        Download
                      </button>
                      <button
                        className="table-action-button delete"
                        onClick={() => addNotification('Lease termination initiated', 'warning')}
                      >
                        Terminate
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

  const renderAutomation = () => (
    <div className="automation-section">
      <div className="section-header">
        <div>
          <h2>Automation & Reports</h2>
          <p>Manage automated workflows and generate reports</p>
        </div>
        <button className="btn-primary" onClick={() => addNotification('Monthly report generated', 'success')}>
          <Download size={18} />
          Generate Monthly Report
        </button>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Automation Type</th>
              <th>Description</th>
              <th>Status</th>
              <th>Statistics</th>
              <th className="table-menu"></th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                title: 'Lease Generation',
                description: 'Automatically generate lease contracts based on approved applications.',
                stats: 'Generated: 15 this month | Success rate: 98%',
                status: 'active'
              },
              {
                title: 'Utility Company Notifications',
                description: 'Send tenant information to utility companies automatically.',
                stats: 'Sent: 8 this month | Success rate: 100%',
                status: 'active'
              },
              {
                title: 'Payment Reminders',
                description: 'Send automatic reminders for pending payments.',
                stats: 'Sent: 23 this month | Response rate: 78%',
                status: 'active'
              },
              {
                title: 'Financial Reports',
                description: 'Generate monthly financial reports for landlords.',
                stats: 'Last generated: Nov 1, 2024 | Next: Dec 1, 2024',
                status: 'pending'
              }
            ].map((card, index) => (
              <tr key={card.title || index}>
                <td>
                  <span className="row-primary">{card.title}</span>
                </td>
                <td>{card.description}</td>
                <td>
                  <span className={`status-badge ${card.status}`}>
                    {card.status === 'active' ? 'Active' : 'Pending'}
                  </span>
                </td>
                <td>{card.stats}</td>
                <td className="table-menu">
                  <div className="table-actions">
                    <button className="table-action-button view">View</button>
                    <button className="table-action-button edit">Configure</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContent = (currentTab = activeTab) => {
    switch (currentTab) {
      case 'overview':
        return renderOverview();
      case 'inbox':
        return renderInbox();
      case 'documents':
        return renderDocuments();
      case 'utilities':
        return renderUtilities();
      case 'debt':
        return renderDebt();
      case 'reminders':
        return renderReminders();
      case 'leases':
        return renderLeases();
      case 'automation':
        return renderAutomation();
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
        id: tab.id,
        label: tab.label,
        icon: tab.icon,
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
        brand={{ name: 'SAAF IMMO', caption: 'Administrative Portal', logo: 'SAAF', logoImage: `${process.env.PUBLIC_URL}/download.jpeg` }}
        menu={layoutMenu}
        activeId={activeTab}
        onActiveChange={setActiveTab}
        onLogout={handleLogout}
      >
        {({ activeId }) => (
          <div className="content-body administrative-content">
            {renderContent(activeId)}
          </div>
        )}
      </RoleLayout>

      <Modal
        isOpen={showLeaseModal}
        onClose={() => setShowLeaseModal(false)}
        title="Create Lease Agreement"
        size="md"
      >
        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newLease = {
              id: Date.now(),
              tenant: formData.get('tenant'),
              property: formData.get('property'),
              startDate: formData.get('start'),
              endDate: formData.get('end'),
              rent: formData.get('rent'),
              status: 'Active'
            };
            setLeases(prev => [newLease, ...prev]);
            addNotification('Lease created successfully', 'success');
            setShowLeaseModal(false);
          }}
        >
          <div className="form-grid">
            <div className="form-field">
              <label>Tenant</label>
              <input type="text" name="tenant" placeholder="Tenant name" required />
            </div>
            <div className="form-field">
              <label>Property</label>
              <input type="text" name="property" placeholder="Property address" required />
            </div>
            <div className="form-field">
              <label>Start Date</label>
              <input type="date" name="start" required />
            </div>
            <div className="form-field">
              <label>End Date</label>
              <input type="date" name="end" required />
            </div>
            <div className="form-field">
              <label>Monthly Rent</label>
              <input type="number" name="rent" min="0" step="0.01" placeholder="$0.00" required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="action-button secondary" onClick={() => setShowLeaseModal(false)}>
              Cancel
            </button>
            <button type="submit" className="action-button primary">
              Save Lease
            </button>
          </div>
        </form>
      </Modal>

      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification notification-${notification.type}`}>
            {notification.message}
          </div>
        ))}
      </div>
    </>
  );
};

export default AdministrativeDashboard;
