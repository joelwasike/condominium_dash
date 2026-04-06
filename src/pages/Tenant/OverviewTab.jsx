import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import ReportSubmission from '../../components/ReportSubmission';

const OverviewTab = ({ loading, overviewData, payments, maintenanceRequests }) => {
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading overview data...</div>;
  }

  const data = overviewData || {
    lease: { property: '', endDate: '' },
    nextRentDue: { amount: null, date: '' },
    openMaintenanceTickets: 0,
    tenant: ''
  };

  const openMaintenanceCount = maintenanceRequests.filter(m => {
    const status = (m.Status || m.status || '').toLowerCase();
    return status === 'pending' || status === 'in progress' || status === 'in-progress';
  }).length;

  const card = { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };

  const chartData = (() => {
    const now = new Date();
    const result = [];
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

      result.push({
        month: monthName,
        payments: Math.round(totalPaid),
        maintenance: monthMaintenance
      });
    }
    return result;
  })();

  const metricCards = [
    { label: 'Next Rent Due', sub: `Due: ${data.nextRentDue?.date || 'N/A'}`, value: data.nextRentDue?.amount ? `${Number(data.nextRentDue.amount).toLocaleString()} XOF` : 'N/A', color: '#3b82f6', bg: 'linear-gradient(135deg,#3b82f6,#2563eb)', white: true },
    { label: 'Current Lease', sub: data.lease?.property || 'No property', value: data.lease?.property ? 'Active' : 'N/A', color: '#10b981', bg: 'linear-gradient(135deg,#10b981,#059669)', white: true },
    { label: 'Open Maintenance', sub: 'Pending requests', value: openMaintenanceCount, color: '#f59e0b' },
    { label: 'Total Payments', sub: 'All time', value: payments.length, color: '#8b5cf6' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top row: chart + metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
        {/* Chart card */}
        <div style={{ ...card }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Tenant Dashboard</h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#94a3b8' }}>Welcome, {data.tenant || 'Tenant'}! — Payments vs Maintenance Requests</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
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
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
              <YAxis yAxisId="left" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '8px 12px' }}
                formatter={(value, name) => {
                  if (name === 'Payments (XOF)') return [`${value.toLocaleString()} XOF`, 'Payments'];
                  if (name === 'Maintenance Requests') return [value, 'Maintenance Requests'];
                  return value;
                }} />
              <Area yAxisId="left" type="monotone" dataKey="payments" stroke="#3b82f6" strokeWidth={3} fill="url(#colorPayments)" dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Payments (XOF)" />
              <Area yAxisId="right" type="monotone" dataKey="maintenance" stroke="#10b981" strokeWidth={3} fill="url(#colorMaintenance)" dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Maintenance Requests" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignContent: 'start' }}>
          {metricCards.map((m, i) => (
            <div key={i}
              style={{ ...card, ...(m.bg ? { background: m.bg } : {}), cursor: 'default', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.06)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: m.white ? 'rgba(255,255,255,0.2)' : `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.1rem', color: m.white ? '#fff' : m.color }}>
                    {i === 0 ? '\u{1F4B0}' : i === 1 ? '\u{1F3E0}' : i === 2 ? '\u{1F527}' : '\u{1F4B3}'}
                  </span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: m.white ? 'rgba(255,255,255,0.8)' : '#64748b' }}>{m.label}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: m.white ? 'rgba(255,255,255,0.6)' : '#94a3b8' }}>{m.sub}</p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: m.white ? '#fff' : '#1e293b' }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions / Report Submission */}
      <div style={{ ...card }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Quick Actions</h3>
        <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#94a3b8' }}>Submit reports and manage your property.</p>
        <ReportSubmission />
      </div>
    </div>
  );
};

export default OverviewTab;
