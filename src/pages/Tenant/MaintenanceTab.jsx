import React from 'react';
import { Plus } from 'lucide-react';

const MaintenanceTab = ({
  loading, maintenanceRequests, setShowMaintenanceModal,
  setSelectedMaintenanceRequest, setShowMaintenanceViewModal
}) => (
  <div className="sa-section-card">
    <div className="sa-section-header">
      <div>
        <h2>Maintenance Requests</h2>
        <p>Submit new requests or check the status of existing ones</p>
      </div>
      <button className="sa-primary-cta" onClick={() => setShowMaintenanceModal(true)} disabled={loading}>
        <Plus size={18} />
        Submit New Request
      </button>
    </div>

    {loading ? (
      <div className="sa-table-empty">Loading maintenance requests...</div>
    ) : maintenanceRequests.length === 0 ? (
      <div className="sa-table-empty">No maintenance requests found</div>
    ) : (
      <div className="sa-table-wrapper">
        <table className="sa-table">
          <thead>
            <tr><th>No</th><th>Issue</th><th>Priority</th><th>Date</th><th>Status</th><th className="table-menu"></th></tr>
          </thead>
          <tbody>
            {maintenanceRequests.map((request, index) => (
              <tr key={request.ID || request.id || `request-${index}`}>
                <td>{index + 1}</td>
                <td>
                  <div className="sa-cell-main">
                    <span className="sa-cell-title">{request.Issue || request.Title || request.title || 'Maintenance Request'}</span>
                    {request.Description && (<span className="sa-cell-sub">{request.Description || request.description}</span>)}
                  </div>
                </td>
                <td><span className={`sa-status-pill ${(request.Priority || request.priority || 'medium').toLowerCase()}`}>{request.Priority || request.priority || 'Medium'}</span></td>
                <td>{new Date(request.Date || request.date || request.CreatedAt || request.createdAt).toLocaleDateString()}</td>
                <td><span className={`sa-status-pill ${(request.Status || request.status || 'pending').toLowerCase().replace(' ', '-')}`}>{request.Status || request.status || 'Pending'}</span></td>
                <td className="table-menu">
                  <div className="table-actions">
                    <button className="table-action-button view" onClick={() => { setSelectedMaintenanceRequest(request); setShowMaintenanceViewModal(true); }}>View</button>
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

export default MaintenanceTab;
