import React from 'react';
import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { API_CONFIG } from '../../config/api';

const OverviewTab = ({
  loading, overviewData, tenants, properties, advertisements,
  currentAdIndex, setCurrentAdIndex, carouselIntervalRef, setActiveTab
}) => {
  if (loading) {
    return <div className="sa-table-empty">Loading overview data...</div>;
  }

  const activeTenantsCount = overviewData?.activeTenants || tenants.filter(t =>
    (t.status || t.Status || '').toLowerCase() === 'active'
  ).length;

  const totalProps = overviewData?.totalPropertiesUnderManagement || properties.length;
  const occupiedProps = overviewData?.occupiedProperties || properties.filter(p =>
    (p.Status || p.status || '').toLowerCase() === 'occupied'
  ).length;
  const occupancyRate = totalProps > 0 ? ((occupiedProps / totalProps) * 100).toFixed(1) : 0;

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = currentUser.name || currentUser.Name || 'Landlord';

  return (
    <div className="sa-overview-page">
      <div className="sa-overview-top">
        <div className="sa-overview-chart-card">
          <div className="sa-card-header">
            <h2>Landlord Dashboard</h2>
            <span className="sa-card-subtitle">Welcome, {userName}!</span>
          </div>
          <div className="sa-mini-legend">
            <span className="sa-legend-item sa-legend-expected">Rent Collected (XOF)</span>
            <span className="sa-legend-item sa-legend-current">Net Payout (XOF)</span>
          </div>
          <div style={{ width: '100%', height: '200px', marginTop: '20px' }}>
            <ResponsiveContainer>
              <AreaChart
                data={(() => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                  const currentRent = overviewData?.totalRentCollected || 0;
                  const currentPayout = overviewData?.totalNetPayoutReceived || 0;
                  return months.map((month, index) => ({
                    month,
                    rent: Math.round(currentRent * (0.7 + (index * 0.05))),
                    payout: Math.round(currentPayout * (0.7 + (index * 0.05)))
                  }));
                })()}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorRentLandlord" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '8px 12px' }}
                  formatter={(value, name) => {
                    if (name === 'rent') return [`${value.toLocaleString()} XOF`, 'Rent Collected'];
                    if (name === 'payout') return [`${value.toLocaleString()} XOF`, 'Net Payout'];
                    return value;
                  }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="line" />
                <Area type="natural" dataKey="rent" stroke="#3b82f6" strokeWidth={3} fill="url(#colorRentLandlord)" dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} name="Rent Collected" />
                <Area type="natural" dataKey="payout" stroke="#10b981" strokeWidth={3} fill="url(#colorPayout)" dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} name="Net Payout" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sa-overview-metrics">
          <div className="sa-metric-card sa-metric-primary">
            <p className="sa-metric-label">Total Properties</p>
            <p className="sa-metric-period">Under Management</p>
            <p className="sa-metric-value">{overviewData?.totalPropertiesUnderManagement || properties.length || 0}</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Total Rent Collected</p>
            <p className="sa-metric-period">All Time</p>
            <p className="sa-metric-value">{(overviewData?.totalRentCollected || 0).toLocaleString()} XOF</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Net Payout Received</p>
            <p className="sa-metric-number">{(overviewData?.totalNetPayoutReceived || 0).toLocaleString()} XOF</p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">Active Tenants</p>
            <p className="sa-metric-number">{activeTenantsCount}</p>
          </div>
          {advertisements.length > 0 ? (
            <div style={{ gridColumn: 'span 2', minHeight: '400px', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '24px', overflow: 'hidden', position: 'relative' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>Advertisements</h3>
              <div style={{ position: 'relative', overflow: 'hidden', flex: 1 }}>
                <div style={{ display: 'flex', transform: `translateX(-${currentAdIndex * 100}%)`, transition: 'transform 0.5s ease-in-out', width: `${advertisements.length * 100}%` }}>
                  {advertisements.map((ad, index) => {
                    const imageUrl = ad.ImageURL || ad.imageUrl || ad.imageURL;
                    const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${API_CONFIG.BASE_URL}${imageUrl}`) : null;
                    return (
                      <div key={`ad-${ad.ID || ad.id || index}`} style={{ width: `${100 / advertisements.length}%`, padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flexShrink: 0 }}>
                        {fullImageUrl && (<img src={fullImageUrl} alt={ad.Title || ad.title || 'Advertisement'} style={{ width: '100%', height: 'auto', maxHeight: '250px', objectFit: 'contain', borderRadius: '8px', marginBottom: '16px' }} onError={(e) => { e.target.style.display = 'none'; }} />)}
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#1f2937', fontWeight: '600' }}>{ad.Title || ad.title || 'Untitled Advertisement'}</h3>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.5' }}>{ad.Text || ad.text || ad.description || ad.Description || 'No description available'}</p>
                        {ad.CreatedAt && (<span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Posted: {new Date(ad.CreatedAt).toLocaleDateString()}</span>)}
                      </div>
                    );
                  })}
                </div>
                {advertisements.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                    {advertisements.map((_, index) => (
                      <button key={`indicator-${index}`} onClick={() => { setCurrentAdIndex(index); if (carouselIntervalRef.current) clearInterval(carouselIntervalRef.current); carouselIntervalRef.current = setInterval(() => { setCurrentAdIndex((prevIndex) => (prevIndex + 1) % advertisements.length); }, 5000); }}
                        style={{ width: index === currentAdIndex ? '24px' : '8px', height: '8px', borderRadius: '4px', border: 'none', backgroundColor: index === currentAdIndex ? '#3b82f6' : '#d1d5db', cursor: 'pointer', transition: 'all 0.3s ease' }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="sa-banner-card"><div className="sa-banner-text"><h3>Property Management</h3><p>Manage your properties, tenants, and payments all in one place.</p></div></div>
          )}
        </div>
      </div>

      <div className="sa-section-card" style={{ marginTop: '24px' }}>
        <div className="sa-section-header"><h3>Quick Actions</h3><p>Manage your properties and view key metrics.</p></div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('properties')}><p className="sa-metric-label">Occupied Properties</p><p className="sa-metric-value">{overviewData?.occupiedProperties || occupiedProps}</p></div>
            <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('properties')}><p className="sa-metric-label">Occupancy Rate</p><p className="sa-metric-value">{occupancyRate}%</p></div>
            <div className="sa-metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('payments')}><p className="sa-metric-label">Payment Rate</p><p className="sa-metric-value">{overviewData?.paymentRate || 0}%</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
