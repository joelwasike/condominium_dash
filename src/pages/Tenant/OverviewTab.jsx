import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import ReportSubmission from '../../components/ReportSubmission';

const OverviewTab = ({ loading, overviewData, payments, maintenanceRequests }) => {
  if (loading) {
    return <div className="sa-table-empty">Loading overview data...</div>;
  }

  const data = overviewData || {
    lease: { property: '', endDate: '' },
    nextRentDue: { amount: null, date: '' },
    openMaintenanceTickets: 0,
    tenant: ''
  };

  // Calculate open maintenance from actual requests (filter by status)
  const openMaintenanceCount = maintenanceRequests.filter(m => {
    const status = (m.Status || m.status || '').toLowerCase();
    return status === 'pending' || status === 'in progress' || status === 'in-progress';
  }).length;

  return (
    <div className="sa-overview-page">
      <div className="sa-overview-top">
        <div className="sa-overview-chart-card">
          <div className="sa-card-header">
            <h2>Tenant Dashboard</h2>
            <span className="sa-card-subtitle">Welcome, {data.tenant || 'Tenant'}!</span>
          </div>
          <div className="sa-mini-legend">
            <span className="sa-legend-item sa-legend-expected">Payments (XOF)</span>
            <span className="sa-legend-item sa-legend-current">Maintenance Requests</span>
          </div>
          <div style={{ width: '100%', height: '250px', marginTop: '20px' }}>
            <ResponsiveContainer>
              <AreaChart
                data={(() => {
                  const now = new Date();
                  const chartData = [];

                  for (let i = 5; i >= 0; i--) {
                    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthName = monthDate.toLocaleString('default', { month: 'short' });
                    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
                    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

                    const monthPayments = payments.filter(p => {
                      const paymentDate = new Date(p.Date || p.date || p.createdAt || p.CreatedAt);
                      return paymentDate >= monthStart && paymentDate <= monthEnd;
                    });
                    const totalPaid = monthPayments.reduce((sum, p) => sum + (p.Amount || p.amount || 0), 0);

                    const monthMaintenance = maintenanceRequests.filter(m => {
                      const maintDate = new Date(m.Date || m.date || m.CreatedAt || m.createdAt);
                      return maintDate >= monthStart && maintDate <= monthEnd;
                    }).length;

                    chartData.push({
                      month: monthName,
                      payments: Math.round(totalPaid),
                      maintenance: monthMaintenance
                    });
                  }

                  return chartData;
                })()}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
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
                  label={{ value: 'Payments (XOF)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  label={{ value: 'Requests', angle: 90, position: 'insideRight', style: { fill: '#6b7280' } }}
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
                    if (name === 'payments') return [`${value.toLocaleString()} XOF`, 'Payments'];
                    if (name === 'maintenance') return [value, 'Maintenance Requests'];
                    return value;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="line"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="payments"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#colorPayments)"
                  dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                  name="Payments (XOF)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="maintenance"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorMaintenance)"
                  dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                  name="Maintenance Requests"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sa-overview-metrics">
          <div className="sa-metric-card sa-metric-primary">
            <p className="sa-metric-label">Next Rent Due</p>
            <p className="sa-metric-period">Due: {data.nextRentDue?.date || '2024-11-01'}</p>
            <p className="sa-metric-value">
              {data.nextRentDue?.amount ? `${data.nextRentDue.amount} XOF` : 'N/A'}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Current Lease</p>
            <p className="sa-metric-number">
              {data.lease?.property ? 'Active' : 'N/A'}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Open Maintenance</p>
            <p className="sa-metric-value">
              {openMaintenanceCount}
            </p>
          </div>
          <div className="sa-banner-card">
            <div className="sa-banner-text">
              <h3>Property Management</h3>
              <p>
                Manage your lease, payments, and maintenance requests all in one place.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="sa-section-card" style={{ marginTop: '24px' }}>
        <div className="sa-section-header">
          <h3>Quick Actions</h3>
          <p>Submit reports and manage your property.</p>
        </div>
        <div style={{ padding: '20px' }}>
          <ReportSubmission />
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
