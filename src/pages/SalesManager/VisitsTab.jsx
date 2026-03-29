import React from 'react';
import { Plus } from 'lucide-react';

const VisitsTab = ({
  loading,
  visits,
  visitTab,
  setVisitTab,
  visitStatusFilter,
  setVisitStatusFilter,
  openScheduleVisit,
  openUpdateVisitStatus,
}) => {
  const visitsToDisplay = visitTab === 'upcoming' ? visits.upcoming : visitTab === 'done' ? visits.done : visits.all;
  return (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div>
          <h3>Visit Management</h3>
          <p>Schedule and track property viewings</p>
        </div>
        <button className="sa-primary-cta" onClick={() => openScheduleVisit()}>
          <Plus size={18} />
          Schedule Visit
        </button>
      </div>
      <div className="sa-filters-section">
        <div className="sa-transactions-tabs">
          <button className={`sa-subtab-button ${visitTab === 'all' ? 'active' : ''}`} onClick={() => setVisitTab('all')}>All ({visits.all.length})</button>
          <button className={`sa-subtab-button ${visitTab === 'upcoming' ? 'active' : ''}`} onClick={() => setVisitTab('upcoming')}>Upcoming ({visits.upcoming.length})</button>
          <button className={`sa-subtab-button ${visitTab === 'done' ? 'active' : ''}`} onClick={() => setVisitTab('done')}>Done ({visits.done.length})</button>
        </div>
        <select className="sa-filter-select" value={visitStatusFilter} onChange={(e) => setVisitStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="No-show">No-show</option>
        </select>
      </div>
      {loading ? (
        <div className="sa-table-empty">Loading visits...</div>
      ) : visitsToDisplay.length === 0 ? (
        <div className="sa-table-empty">No visits scheduled</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Client</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visitsToDisplay.map((visit, index) => {
                const visitId = visit.ID || visit.id || `visit-${index}`;
                const property = visit.Property || visit.property || visit.Address || visit.address || 'Property';
                const client = visit.Client || visit.client || visit.ClientName || visit.clientName || 'Client';
                const clientEmail = visit.ClientEmail || visit.clientEmail || '';
                const clientPhone = visit.ClientPhone || visit.clientPhone || '';
                const visitDate = visit.VisitDate || visit.visitDate || visit.Date || visit.date || visit.ScheduledAt || visit.scheduledAt;
                const visitTime = visit.VisitTime || visit.visitTime || visit.Time || visit.time;
                const status = visit.Status || visit.status || 'Scheduled';
                const formattedDate = visitDate ? new Date(visitDate).toLocaleDateString() : 'N/A';
                const formattedTime = visitTime ? visitTime : (visitDate ? new Date(visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A');
                return (
                  <tr key={visitId}>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{property}</span>
                        <span className="sa-cell-sub">{visit.Agent || visit.agent || 'Pending assignment'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{client}</span>
                        <span className="sa-cell-sub">{clientEmail || clientPhone || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="sa-cell-main">
                        <span className="sa-cell-title">{formattedDate}</span>
                        <span className="sa-cell-sub">{formattedTime}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`sa-status-pill ${status.toLowerCase().replace('-', '')}`}>{status}</span>
                    </td>
                    <td>
                      <div className="sa-row-actions">
                        {status === 'Scheduled' && (
                          <button className="table-action-button edit" onClick={() => openUpdateVisitStatus(visit)}>Update Status</button>
                        )}
                        <button className="table-action-button view" onClick={() => openScheduleVisit(property)}>Reschedule</button>
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

export default VisitsTab;
