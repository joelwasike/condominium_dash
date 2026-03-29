import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { API_CONFIG } from '../../config/api';

const OverviewTab = ({
  loading,
  overviewData,
  properties,
  clients,
  unpaidRents,
  alerts,
  advertisements,
}) => {
  if (loading) {
    return <div className="sa-table-empty">Loading overview data...</div>;
  }

  const data = overviewData || {
    globalOccupancyRate: 0,
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    totalActiveTenants: 0,
    numberOfUnpaidAccounts: 0,
    totalUnpaidRentAmount: 0,
    // Legacy field names for backward compatibility
    occupancyRate: 0,
    activeClients: 0,
    unpaidCount: 0,
    unpaidAmount: 0,
  };

  // Calculate actual metrics from loaded data
  const totalPropertiesCount = properties.length || data.totalProperties || 0;
  const occupiedCount = properties.filter(p => (p.status || p.Status || '').toLowerCase() === 'occupied').length || data.occupiedProperties || 0;
  const vacantCount = properties.filter(p => (p.status || p.Status || '').toLowerCase() === 'vacant').length || data.vacantProperties || 0;
  const actualOccupancyRate = totalPropertiesCount > 0 ? (occupiedCount / totalPropertiesCount * 100) : (data.globalOccupancyRate || data.occupancyRate || 0);

  // Use enhanced fields if available, fallback to legacy, then fallback to calculated values
  const occupancyRate = data.globalOccupancyRate || data.occupancyRate || actualOccupancyRate;
  const activeTenants = data.totalActiveTenants || data.activeClients || clients.filter(c => (c.status || c.Status || '').toLowerCase() === 'active').length || 0;
  const unpaidCount = data.numberOfUnpaidAccounts || data.unpaidCount || unpaidRents.length || 0;
  const unpaidAmount = data.totalUnpaidRentAmount || data.unpaidAmount || unpaidRents.reduce((sum, r) => sum + (r.amount || r.Amount || 0), 0) || 0;

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Use historical data from backend if available, otherwise calculate from current data
  let chartData = [];
  if (data.historicalData && Array.isArray(data.historicalData) && data.historicalData.length > 0) {
    chartData = data.historicalData;
  } else {
    // Fallback: Calculate historical occupancy data for the last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleString('default', { month: 'short' });

      // Use current occupancy rate for all months (fallback)
      chartData.push({
        month: monthName,
        occupancyRate: Math.round(actualOccupancyRate * 10) / 10,
        activeTenants: activeTenants
      });
    }
  }

  return (
    <div className="sa-overview-page">
      <div className="sa-overview-top">
        <div className="sa-overview-chart-card">
          <div className="sa-card-header">
            <h2>Sales Manager Dashboard</h2>
            <span className="sa-card-subtitle">Welcome, {currentUser?.name || currentUser?.Name || 'Sales Manager'}!</span>
          </div>
          <div className="sa-mini-legend">
            <span className="sa-legend-item sa-legend-expected">Occupancy Rate (%)</span>
            <span className="sa-legend-item sa-legend-current">Active Tenants</span>
          </div>
          <div style={{ width: '100%', height: '200px', marginTop: '20px' }}>
            <ResponsiveContainer>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  label={{ value: 'Occupancy %', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  label={{ value: 'Tenants', angle: 90, position: 'insideRight', style: { fill: '#6b7280' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    padding: '8px 12px'
                  }}
                  formatter={(value, name) => {
                    if (name === 'occupancyRate') return [`${value.toFixed(1)}%`, 'Occupancy Rate'];
                    if (name === 'activeTenants') return [value, 'Active Tenants'];
                    return value;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="line"
                />
                <Area
                  yAxisId="left"
                  type="natural"
                  dataKey="occupancyRate"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#colorOccupancy)"
                  dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                  name="Occupancy Rate (%)"
                />
                <Area
                  yAxisId="right"
                  type="natural"
                  dataKey="activeTenants"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorTenants)"
                  dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                  name="Active Tenants"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          </div>

        <div className="sa-overview-metrics">
          <div className="sa-metric-card sa-metric-primary">
            <p className="sa-metric-label">Total Unpaid Amount</p>
            <p className="sa-metric-period">Outstanding Balance</p>
            <p className="sa-metric-value">
              {unpaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XOF
            </p>
        </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Active Tenants</p>
            <p className="sa-metric-number">
              {activeTenants}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Occupancy Rate</p>
            <p className="sa-metric-value">
              {occupancyRate.toFixed(1)}%
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Unpaid Accounts</p>
            <p className="sa-metric-number">
              {unpaidCount}
            </p>
        </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Properties</p>
            <p className="sa-metric-number">
              {totalPropertiesCount}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Occupied Properties</p>
            <p className="sa-metric-number">
              {occupiedCount}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Vacant Properties</p>
            <p className="sa-metric-number">
              {vacantCount}
            </p>
          </div>
          {/* Advertisements Display - Replacing Banner Card */}
          {advertisements.length > 0 ? (
            <div style={{
              gridColumn: 'span 2',
              minHeight: '400px',
              padding: '32px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              overflowX: 'auto'
            }}>
              <div style={{
                display: 'flex',
                gap: '24px',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                paddingBottom: '16px',
                width: '100%'
              }}>
                {advertisements.map((ad, index) => {
                  const imageUrl = ad.ImageURL || ad.imageUrl || ad.imageURL;
                  const fullImageUrl = imageUrl
                    ? (imageUrl.startsWith('http') ? imageUrl : `${API_CONFIG.BASE_URL}${imageUrl}`)
                    : null;

                  return (
                    <div
                      key={`ad-${ad.ID || ad.id || index}`}
                      style={{
                        minWidth: '350px',
                        maxWidth: '450px',
                        padding: '20px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        flexShrink: 0
                      }}
                    >
                      {fullImageUrl && (
                        <img
                          src={fullImageUrl}
                          alt={ad.Title || ad.title || 'Advertisement'}
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '250px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            marginBottom: '16px'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '1.1rem',
                        color: '#1f2937',
                        fontWeight: '600'
                      }}>
                        {ad.Title || ad.title || 'Untitled Advertisement'}
                      </h3>
                      <p style={{
                        margin: '0 0 12px 0',
                        fontSize: '0.9rem',
                        color: '#6b7280',
                        lineHeight: '1.5'
                      }}>
                        {ad.Text || ad.text || ad.description || ad.Description || 'No description available'}
                      </p>
                      {ad.CreatedAt && (
                        <span style={{
                          fontSize: '0.8rem',
                          color: '#9ca3af'
                        }}>
                          Posted: {new Date(ad.CreatedAt).toLocaleDateString()}
                        </span>
                      )}
          </div>
                  );
                })}
          </div>
            </div>
          ) : (
            <div className="sa-banner-card">
              <div className="sa-banner-text">
                <h3>Increase your sales</h3>
                <p>
                  Discover the proven methods to skyrocket your sales! Unleash the
                  potential of your business and achieve remarkable growth.
                </p>
                <button className="sa-banner-button">Learn More</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sa-section-card">
        <div className="sa-section-header">
      <h3>Priority Alerts</h3>
          <p>Track urgent alerts and overdue payments.</p>
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
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
        {alerts.length > 0 ? (
          alerts.filter(alert => alert.Urgency === 'urgent' || alert.Urgency === 'high').map(alert => (
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
                    <td>
                      {alert.Amount ? `${alert.Amount.toLocaleString()} XOF` : '—'}
                    </td>
                  </tr>
          ))
        ) : (
                <tr>
                  <td colSpan={6} className="sa-table-empty">
                    No priority alerts at the moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>
    </div>
  </div>
);
};

export default OverviewTab;
