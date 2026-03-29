import React from 'react';

const RequestsTab = ({
  loading,
  requests,
  requestStatusFilter,
  setRequestStatusFilter,
  handleApproveRequest,
  openFollowUp,
}) => {
  return (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h3>Visit Requests</h3>
          <p>Manage incoming requests from prospective tenants</p>
        </div>
      </div>
      <div className="sa-filters-section">
        <select className="sa-filter-select" value={requestStatusFilter} onChange={(e) => setRequestStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Scheduled">Scheduled</option>
        </select>
      </div>
      {loading ? (
        <div className="sa-table-empty">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="sa-table-empty">No requests received</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Property</th>
                <th>Requested</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request, index) => {
                const requestId = request.ID || request.id || `request-${index}`;
                const clientName = request.ClientName || request.clientName || 'Client';
                const clientEmail = request.ClientEmail || request.clientEmail || '';
                const clientPhone = request.ClientPhone || request.clientPhone || '';
                const property = request.Property || request.property || 'Property';
                const status = request.Status || request.status || 'Pending';
                const createdAt = request.CreatedAt || request.createdAt;
                const preferredDate = request.PreferredDate || request.preferredDate;
                const followUpCount = request.followUpCount || request.FollowUpCount || 0;
                return (
                  <tr key={requestId}>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{clientName}</span>
                        <span className="sa-cell-sub">{clientEmail || clientPhone || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{property}</span>
                        <span className="sa-cell-sub">{request.City || request.city || request.District || request.district || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</span>
                        <span className="sa-cell-sub">{preferredDate ? `Preferred: ${new Date(preferredDate).toLocaleDateString()}` : ''}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`sa-status-pill ${status.toLowerCase()}`}>{status}</span>
                      {followUpCount > 0 && (
                        <span className="sa-cell-sub" style={{ display: 'block', marginTop: '4px' }}>{followUpCount} follow-up{followUpCount > 1 ? 's' : ''}</span>
                      )}
                    </td>
                    <td>
                      <div className="sa-row-actions">
                        {status === 'Pending' && (
                          <>
                            <button className="table-action-button edit" onClick={() => handleApproveRequest(requestId)}>Approve</button>
                            <button className="table-action-button contact" onClick={() => openFollowUp(request)}>Follow-up</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RequestsTab;
