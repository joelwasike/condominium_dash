import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer } from
'recharts';
import { DollarSign, Users, TrendingUp, AlertTriangle, Building2, Home, DoorOpen } from 'lucide-react';
import AdCarousel from '../../components/AdCarousel';
const card = {
  background: '#fff',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
  border: '1px solid #f1f5f9',
  transition: 'transform 0.15s, box-shadow 0.15s'
};

const statusPill = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'urgent' || s === 'high')
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: '#fee2e2', color: '#991b1b' };
  if (s === 'resolved' || s === 'closed')
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534' };
  if (s === 'open' || s === 'pending')
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: '#fef9c3', color: '#854d0e' };
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#475569' };
};

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' };
const thStyle = { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' };
const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#334155' };

const OverviewTab = ({
  loading,
  overviewData,
  properties,
  clients,
  unpaidRents,
  alerts,
  advertisements,
  currentAdIndex,
  setCurrentAdIndex,
  carouselIntervalRef
}) => {
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading overview data...</div>;
  }

  const data = overviewData || {
    globalOccupancyRate: 0,
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    totalActiveTenants: 0,
    numberOfUnpaidAccounts: 0,
    totalUnpaidRentAmount: 0,
    occupancyRate: 0,
    activeClients: 0,
    unpaidCount: 0,
    unpaidAmount: 0
  };
  const totalPropertiesCount = properties.length || data.totalProperties || 0;
  const occupiedCount = properties.filter((p) => (p.status || p.Status || '').toLowerCase() === 'occupied').length || data.occupiedProperties || 0;
  const vacantCount = properties.filter((p) => (p.status || p.Status || '').toLowerCase() === 'vacant').length || data.vacantProperties || 0;
  const actualOccupancyRate = totalPropertiesCount > 0 ? occupiedCount / totalPropertiesCount * 100 : data.globalOccupancyRate || data.occupancyRate || 0;
  const occupancyRate = data.globalOccupancyRate || data.occupancyRate || actualOccupancyRate;
  const activeTenants = data.totalActiveTenants || data.activeClients || clients.filter((c) => (c.status || c.Status || '').toLowerCase() === 'active').length || 0;
  const unpaidCount = data.numberOfUnpaidAccounts || data.unpaidCount || unpaidRents.length || 0;
  const unpaidAmount = data.totalUnpaidRentAmount || data.unpaidAmount || unpaidRents.reduce((sum, r) => sum + (r.amount || r.Amount || 0), 0) || 0;

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  let chartData = [];
  if (data.historicalData && Array.isArray(data.historicalData) && data.historicalData.length > 0) {
    chartData = data.historicalData;
  } else {
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      chartData.push({
        month: monthName,
        occupancyRate: Math.round(actualOccupancyRate * 10) / 10,
        activeTenants: activeTenants
      });
    }
  }

  const metricCards = [
  { label: 'Total Unpaid Amount', sub: 'Outstanding Balance', value: `${unpaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XOF`, icon: DollarSign, color: '#dc2626', bg: 'linear-gradient(135deg,#dc2626,#b91c1c)', white: true },
  { label: 'Active Tenants', sub: 'Current count', value: activeTenants, icon: Users, color: '#3b82f6', bg: 'linear-gradient(135deg,#3b82f6,#2563eb)', white: true },
  { label: 'Occupancy Rate', sub: 'Overall', value: `${occupancyRate.toFixed(1)}%`, icon: TrendingUp, color: '#10b981' },
  { label: 'Unpaid Accounts', sub: 'Overdue', value: unpaidCount, icon: AlertTriangle, color: '#f59e0b' },
  { label: 'Total Properties', sub: 'All units', value: totalPropertiesCount, icon: Building2, color: '#8b5cf6' },
  { label: 'Occupied', sub: 'In use', value: occupiedCount, icon: Home, color: '#10b981' },
  { label: 'Vacant', sub: 'Available', value: vacantCount, icon: DoorOpen, color: '#64748b' }];


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
        <div style={{ ...card, cursor: 'default' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Sales Manager Dashboard</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>Welcome, {currentUser?.name || currentUser?.Name || 'Sales Manager'}!</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
              <span style={{ width: '12px', height: '3px', background: '#3b82f6', borderRadius: '2px', display: 'inline-block' }} /> Occupancy Rate (%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
              <span style={{ width: '12px', height: '3px', background: '#10b981', borderRadius: '2px', display: 'inline-block' }} /> Active Tenants
            </span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              
              <defs>
                <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }} />
              
              <YAxis
                yAxisId="left"
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                label={{ value: 'Occupancy %', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }} />
              
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                label={{ value: 'Tenants', angle: 90, position: 'insideRight', style: { fill: '#6b7280' } }} />
              
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
                }} />
              
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="line" />
              
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="occupancyRate"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorOccupancy)"
                dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                name="Occupancy Rate (%)" />
              
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="activeTenants"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#colorTenants)"
                dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                name="Active Tenants" />
              
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {metricCards.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} style={{ ...card, ...(m.bg ? { background: m.bg } : {}), cursor: 'default' }}
                onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.12)';}}
                onMouseLeave={(e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.06)';}}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: m.white ? 'rgba(255,255,255,0.2)' : `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} style={{ color: m.white ? '#fff' : m.color }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: m.white ? 'rgba(255,255,255,0.8)' : '#64748b' }}>{m.label}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: m.white ? 'rgba(255,255,255,0.6)' : '#94a3b8' }}>{m.sub}</p>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: m.white ? '#fff' : '#1e293b' }}>{m.value}</p>
                </div>);

            })}
          </div>
          {advertisements.length > 0 ?
          <AdCarousel advertisements={advertisements} currentAdIndex={currentAdIndex} setCurrentAdIndex={setCurrentAdIndex} carouselIntervalRef={carouselIntervalRef} /> :

          <div style={{ ...card, background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', border: '1px solid #dbeafe', cursor: 'default' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Increase your sales</h3>
              <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Discover the proven methods to skyrocket your sales! Unleash the
                potential of your business and achieve remarkable growth.
              </p>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Learn More</button>
            </div>
          }
        </div>
      </div>
      <div style={{ ...card, cursor: 'default' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Priority Alerts</h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>Track urgent alerts and overdue payments.</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle} />
                <th style={thStyle}>Alert</th>
                <th style={thStyle}>Property</th>
                <th style={thStyle}>Urgency</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length > 0 ?
              alerts.filter((alert) => alert.Urgency === 'urgent' || alert.Urgency === 'high').map((alert) =>
              <tr key={alert.ID}
              style={{ transition: 'background 0.15s' }}
              onMouseEnter={(e) => {e.currentTarget.style.background = '#f8fafc';}}
              onMouseLeave={(e) => {e.currentTarget.style.background = '';}}>
                
                    <td style={tdStyle}>
                      <input type="checkbox" />
                    </td>
                    <td style={tdStyle}>
                      <div>
                        <span style={{ display: 'block', fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>{alert.Title || 'N/A'}</span>
                        <span style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8' }}>{alert.Message || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>{alert.Property || 'N/A'}</td>
                    <td style={tdStyle}>
                      <span style={statusPill(alert.Urgency)}>
                        {alert.Urgency || 'Normal'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={statusPill(alert.Status)}>
                        {alert.Status || 'Open'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {alert.Amount ? `${alert.Amount.toLocaleString()} XOF` : '\u2014'}
                    </td>
                  </tr>
              ) :

              <tr>
                  <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                    No priority alerts at the moment.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>);

};

export default OverviewTab;
