import React from 'react';
import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from
'recharts';
import AdCarousel from '../../components/AdCarousel';

const OverviewTab = ({
  loading, overviewData, tenants, properties, advertisements,
  currentAdIndex, setCurrentAdIndex, carouselIntervalRef, setActiveTab
}) => {
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading overview data...</div>;
  }

  const activeTenantsCount = overviewData?.activeTenants || tenants.filter((t) =>
  (t.status || t.Status || '').toLowerCase() === 'active'
  ).length;

  const totalProps = overviewData?.totalPropertiesUnderManagement || properties.length;
  const occupiedProps = overviewData?.occupiedProperties || properties.filter((p) =>
  (p.Status || p.status || '').toLowerCase() === 'occupied'
  ).length;
  const occupancyRate = totalProps > 0 ? (occupiedProps / totalProps * 100).toFixed(1) : 0;

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = currentUser.name || currentUser.Name || 'Landlord';

  const card = { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };

  const chartData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentRent = overviewData?.totalRentCollected || 0;
    const currentPayout = overviewData?.totalNetPayoutReceived || 0;
    return months.map((month, index) => ({
      month,
      rent: Math.round(currentRent * (0.7 + index * 0.05)),
      payout: Math.round(currentPayout * (0.7 + index * 0.05))
    }));
  })();

  const metricCards = [
  { label: 'Total Properties', sub: 'Under Management', value: overviewData?.totalPropertiesUnderManagement || properties.length || 0, color: '#3b82f6', bg: 'linear-gradient(135deg,#3b82f6,#2563eb)', white: true, tab: 'properties' },
  { label: 'Total Rent Collected', sub: 'All Time', value: `${(overviewData?.totalRentCollected || 0).toLocaleString()} XOF`, color: '#10b981', bg: 'linear-gradient(135deg,#10b981,#059669)', white: true, tab: 'payments' },
  { label: 'Net Payout Received', sub: 'All Time', value: `${(overviewData?.totalNetPayoutReceived || 0).toLocaleString()} XOF`, color: '#8b5cf6', tab: 'payments' },
  { label: 'Active Tenants', sub: 'Currently active', value: activeTenantsCount, color: '#f59e0b', tab: 'tenants' },
  { label: 'Occupancy Rate', sub: 'Occupied / Total', value: `${occupancyRate}%`, color: '#06b6d4', tab: 'properties' },
  { label: 'Payment Rate', sub: 'On-time payments', value: `${overviewData?.paymentRate || 0}%`, color: '#ec4899', tab: 'payments' }];


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
        <div style={{ ...card }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Landlord Dashboard</h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#94a3b8' }}>Welcome, {userName}! — Rent Collected vs Net Payout (XOF)</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <defs>
                <linearGradient id="colorRentLandlord" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '8px 12px' }}
              formatter={(value, name) => {
                if (name === 'Rent Collected') return [`${value.toLocaleString()} XOF`, 'Rent Collected'];
                if (name === 'Net Payout') return [`${value.toLocaleString()} XOF`, 'Net Payout'];
                return value;
              }} />
              <Area type="monotone" dataKey="rent" stroke="#3b82f6" strokeWidth={3} fill="url(#colorRentLandlord)" dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Rent Collected" />
              <Area type="monotone" dataKey="payout" stroke="#10b981" strokeWidth={3} fill="url(#colorPayout)" dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Net Payout" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignContent: 'start' }}>
          {metricCards.map((m, i) =>
          <div key={i}
          style={{ ...card, ...(m.bg ? { background: m.bg } : {}), cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
          onClick={() => setActiveTab(m.tab)}
          onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.12)';}}
          onMouseLeave={(e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.06)';}}>
            
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: m.white ? 'rgba(255,255,255,0.2)' : `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.1rem', color: m.white ? '#fff' : m.color }}>
                    {i === 0 ? '\u{1F3E0}' : i === 1 ? '\u{1F4B0}' : i === 2 ? '\u{1F4B3}' : i === 3 ? '\u{1F465}' : i === 4 ? '\u{1F4CA}' : '\u{2705}'}
                  </span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: m.white ? 'rgba(255,255,255,0.8)' : '#64748b' }}>{m.label}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: m.white ? 'rgba(255,255,255,0.6)' : '#94a3b8' }}>{m.sub}</p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: m.white ? '#fff' : '#1e293b' }}>{m.value}</p>
            </div>
          )}
        </div>
      </div>
      {advertisements.length > 0 &&
      <AdCarousel advertisements={advertisements} currentAdIndex={currentAdIndex} setCurrentAdIndex={setCurrentAdIndex} carouselIntervalRef={carouselIntervalRef} />
      }
      <div style={{ ...card }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Quick Actions</h3>
        <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#94a3b8' }}>Manage your properties and view key metrics.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div
            style={{ ...card, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onClick={() => setActiveTab('properties')}
            onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.12)';}}
            onMouseLeave={(e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.06)';}}>
            
            <p style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>Occupied Properties</p>
            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>{overviewData?.occupiedProperties || occupiedProps}</p>
          </div>
          <div
            style={{ ...card, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onClick={() => setActiveTab('properties')}
            onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.12)';}}
            onMouseLeave={(e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.06)';}}>
            
            <p style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>Occupancy Rate</p>
            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>{occupancyRate}%</p>
          </div>
          <div
            style={{ ...card, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onClick={() => setActiveTab('payments')}
            onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.12)';}}
            onMouseLeave={(e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.06)';}}>
            
            <p style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>Payment Rate</p>
            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>{overviewData?.paymentRate || 0}%</p>
          </div>
        </div>
      </div>
    </div>);

};

export default OverviewTab;
