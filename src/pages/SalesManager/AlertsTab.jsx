import React from 'react';
import { Filter } from 'lucide-react';

const AlertsTab = ({
  alerts,
  alertTypeFilter,
  setAlertTypeFilter,
}) => (
  <div className="sa-alerts-page">
    <div className="sa-alerts-header">
      <div>
        <h2>Unpaid Rent Alerts</h2>
      <p>Monitor and manage overdue payments</p>
      </div>
    </div>

    <div className="sa-transactions-filters">
      <button className="sa-filter-button">
        <Filter size={16} />
        Filter
      </button>
      <select
        className="sa-filter-button"
        value={alertTypeFilter}
        onChange={(e) => setAlertTypeFilter(e.target.value)}
        style={{ padding: '8px 14px', cursor: 'pointer' }}
      >
        <option value="">All Alert Types</option>
        <option value="Payment Overdue">Payment Overdue</option>
        <option value="Vacant Property">Vacant Property</option>
        <option value="Maintenance">Maintenance</option>
      </select>
    </div>

    <div className="sa-section-card">
      <div className="sa-section-header">
        <h3>Alerts</h3>
        <p>Track all alerts and their current status.</p>
      </div>
      <div className="sa-table-wrapper">
        <table className="sa-table">
        <thead>
          <tr>
              <th />
              <th>Alert</th>
            <th>Property</th>
            <th>Urgency</th>
            <th>Status</th>
            <th>Created</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {alerts.length > 0 ? (
            alerts.map(alert => (
              <tr key={alert.ID}>
                <td>
                    <input type="checkbox" />
                  </td>
                  <td>
                    <div className="sa-cell-main">
                      <span className="sa-cell-title">{alert.Title || 'N/A'}</span>
                      <span className="sa-cell-sub">{alert.Message || 'N/A'}</span>
                    </div>
                </td>
                <td>{alert.Property || 'N/A'}</td>
                <td>
                    <span className={`sa-status-pill ${(alert.Urgency || 'normal').toLowerCase()}`}>
                    {alert.Urgency || 'Normal'}
                  </span>
                </td>
                <td>
                    <span className={`sa-status-pill ${(alert.Status || 'open').toLowerCase()}`}>
                    {alert.Status || 'Open'}
                  </span>
                </td>
                <td>{alert.CreatedAt ? new Date(alert.CreatedAt).toLocaleDateString() : 'N/A'}</td>
                  <td>{alert.Amount ? `${alert.Amount.toLocaleString()} XOF` : '—'}</td>
              </tr>
            ))
          ) : (
            <tr>
                <td colSpan={7} className="sa-table-empty">No alerts found. Start the backend to see real data.</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  </div>
);

export default AlertsTab;
