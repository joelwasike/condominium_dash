import React from 'react';
import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { API_CONFIG } from '../../config/api';
import { t } from '../../utils/i18n';

const OverviewTab = ({
  loading, overviewData, advertisements, currentAdIndex, setCurrentAdIndex, carouselIntervalRef
}) => {
  if (loading) {
    return <div className="sa-table-empty">Loading overview data...</div>;
  }

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = currentUser.name || currentUser.Name || 'Accountant';

  return (
    <div className="sa-overview-page">
      <div className="sa-overview-top">
        <div className="sa-overview-chart-card">
          <div className="sa-card-header">
            <h2>Accounting Dashboard</h2>
            <span className="sa-card-subtitle">Welcome, {userName}!</span>
          </div>
          <div className="sa-mini-legend">
            <span className="sa-legend-item sa-legend-expected">Collections (XOF)</span>
            <span className="sa-legend-item sa-legend-current">Expenses (XOF)</span>
          </div>
          <div style={{ width: '100%', height: '200px', marginTop: '20px' }}>
            <ResponsiveContainer>
              <AreaChart
                data={(() => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                  const currentCollections = overviewData?.totalCollectedThisMonth || 0;
                  const currentExpenses = overviewData?.totalExpensesThisMonth || 0;
                  return months.map((month, index) => ({
                    month,
                    collections: Math.round(currentCollections * (0.7 + (index * 0.05))),
                    expenses: Math.round(currentExpenses * (0.7 + (index * 0.05)))
                  }));
                })()}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '8px 12px' }}
                  formatter={(value, name) => {
                    if (name === 'collections') return [`${value.toLocaleString()} XOF`, t('accounting.collections')];
                    if (name === 'expenses') return [`${value.toLocaleString()} XOF`, t('accounting.expenses')];
                    return value;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="line" />
                <Area type="natural" dataKey="collections" stroke="#3b82f6" strokeWidth={3} fill="url(#colorCollections)" dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} name={t('accounting.collections')} />
                <Area type="natural" dataKey="expenses" stroke="#dc2626" strokeWidth={3} fill="url(#colorExpenses)" dot={{ fill: '#dc2626', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sa-overview-metrics">
          <div className="sa-metric-card sa-metric-primary">
            <p className="sa-metric-label">{t('accounting.cashBalance')}</p>
            <p className="sa-metric-period">Current balance</p>
            <p className="sa-metric-value">
              {overviewData ? `${(overviewData.totalAvailableBalance || overviewData.globalBalance || 0).toFixed(2)} XOF` : '0 XOF'}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">{t('accounting.totalRevenue')} ({t('dashboard.thisMonth')})</p>
            <p className="sa-metric-period">{currentMonth}</p>
            <p className="sa-metric-value">
              {overviewData ? `${(overviewData.totalCollectedThisMonth || 0).toFixed(2)} XOF` : '0 XOF'}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">{t('nav.landlordPayments')}</p>
            <p className="sa-metric-number">
              {overviewData ? `${(overviewData.totalTransferredToLandlords || 0).toFixed(2)} XOF` : '0 XOF'}
            </p>
          </div>
          <div className="sa-metric-card">
            <p className="sa-metric-label">{t('accounting.commission')}</p>
            <p className="sa-metric-number">
              {overviewData ? `${(overviewData.totalCompanyCommissionEarned || 0).toFixed(2)} XOF` : '0 XOF'}
            </p>
          </div>
          {advertisements.length > 0 ? (
            <div style={{ gridColumn: 'span 2', minHeight: '400px', padding: '0', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', flex: 1, minHeight: '400px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ display: 'flex', transform: `translateX(-${currentAdIndex * 100}%)`, transition: 'transform 0.5s ease-in-out', width: `${advertisements.length * 100}%`, height: '100%' }}>
                  {advertisements.map((ad, index) => {
                    const imageUrl = ad.ImageURL || ad.imageUrl || ad.imageURL;
                    const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${API_CONFIG.BASE_URL}${imageUrl}`) : null;
                    return (
                      <div key={`ad-${ad.ID || ad.id || index}`} style={{ width: `${100 / advertisements.length}%`, height: '100%', minHeight: '400px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
                        {fullImageUrl ? (
                          <img src={fullImageUrl} alt="" style={{ width: '100%', height: '100%', minHeight: '400px', objectFit: 'cover', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <div style={{ padding: '24px', color: '#6b7280', textAlign: 'center' }}>{ad.Title || ad.title || 'No image'}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {advertisements.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px', position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                    {advertisements.map((_, index) => (
                      <button
                        key={`indicator-${index}`}
                        onClick={() => {
                          setCurrentAdIndex(index);
                          if (carouselIntervalRef.current) clearInterval(carouselIntervalRef.current);
                          carouselIntervalRef.current = setInterval(() => { setCurrentAdIndex((prevIndex) => (prevIndex + 1) % advertisements.length); }, 5000);
                        }}
                        style={{ width: index === currentAdIndex ? '24px' : '8px', height: '8px', borderRadius: '4px', border: 'none', backgroundColor: index === currentAdIndex ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="sa-banner-card">
              <div className="sa-banner-text">
                <h3>{t('accounting.financialManagement')}</h3>
                <p>Manage payments, expenses, and financial operations all in one place.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
