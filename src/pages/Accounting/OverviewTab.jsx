import React from 'react';
import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from
'recharts';
import { Wallet, TrendingUp, ArrowRightLeft, BadgeDollarSign } from 'lucide-react';
import { t } from '../../utils/i18n';
import AdCarousel from '../../components/AdCarousel';
const card = {
  background: '#fff',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
  border: '1px solid #f1f5f9',
  transition: 'transform 0.15s, box-shadow 0.15s'
};

const OverviewTab = ({
  loading, overviewData, advertisements, currentAdIndex, setCurrentAdIndex, carouselIntervalRef
}) => {
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading overview data...</div>;
  }

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = currentUser.name || currentUser.Name || 'Accountant';
  const chartData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentCollections = overviewData?.totalCollectedThisMonth || 0;
    const currentExpenses = overviewData?.totalExpensesThisMonth || 0;
    return months.map((month, index) => ({
      month,
      collections: Math.round(currentCollections * (0.7 + index * 0.05)),
      expenses: Math.round(currentExpenses * (0.7 + index * 0.05))
    }));
  })();

  const metricCards = [
  {
    label: t('accounting.cashBalance'),
    sub: 'Current balance',
    value: overviewData ? `${(overviewData.totalAvailableBalance || overviewData.globalBalance || 0).toFixed(2)} XOF` : '0 XOF',
    icon: Wallet,
    color: '#3b82f6',
    bg: 'linear-gradient(135deg,#3b82f6,#2563eb)',
    white: true
  },
  {
    label: `${t('accounting.totalRevenue')} (${t('dashboard.thisMonth')})`,
    sub: currentMonth,
    value: overviewData ? `${(overviewData.totalCollectedThisMonth || 0).toFixed(2)} XOF` : '0 XOF',
    icon: TrendingUp,
    color: '#10b981',
    bg: 'linear-gradient(135deg,#10b981,#059669)',
    white: true
  },
  {
    label: t('nav.landlordPayments'),
    sub: 'Total transferred',
    value: overviewData ? `${(overviewData.totalTransferredToLandlords || 0).toFixed(2)} XOF` : '0 XOF',
    icon: ArrowRightLeft,
    color: '#8b5cf6'
  },
  {
    label: t('accounting.commission'),
    sub: 'Company earnings',
    value: overviewData ? `${(overviewData.totalCompanyCommissionEarned || 0).toFixed(2)} XOF` : '0 XOF',
    icon: BadgeDollarSign,
    color: '#f59e0b'
  }];


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
        <div style={{ ...card, cursor: 'default' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Accounting Dashboard</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>Welcome, {userName}!</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
              <span style={{ width: '12px', height: '3px', background: '#3b82f6', borderRadius: '2px', display: 'inline-block' }} /> Collections (XOF)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
              <span style={{ width: '12px', height: '3px', background: '#dc2626', borderRadius: '2px', display: 'inline-block' }} /> Expenses (XOF)
            </span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              
              <defs>
                <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
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
                }} />
              
              <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="line" />
              <Area type="monotone" dataKey="collections" stroke="#3b82f6" strokeWidth={3} fill="url(#colorCollections)" dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} name={t('accounting.collections')} />
              <Area type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={3} fill="url(#colorExpenses)" dot={{ fill: '#dc2626', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} name="Expenses" />
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
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{t('accounting.financialManagement')}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>Manage payments, expenses, and financial operations all in one place.</p>
            </div>
          }
        </div>
      </div>
    </div>);

};

export default OverviewTab;
