import React from 'react';
import { Area, AreaChart, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrackingTab = ({ businessTracking }) => {
  const revenueByMonth = businessTracking?.revenueByMonth || [];
  const expensesByMonth = businessTracking?.expensesByMonth || [];
  const occupancyByMonth = businessTracking?.occupancyByMonth || [];
  const chartData = revenueByMonth.map((r, i) => ({ month: r.month, revenue: r.revenue ?? 0, expenses: expensesByMonth[i]?.expenses ?? 0, occupancy: occupancyByMonth[i]?.rate ?? 0 }));
  const pieData = [{ name: 'Revenue', value: businessTracking?.totalRevenue ?? 0, color: '#3b82f6' }, { name: 'Expenses', value: businessTracking?.maintenanceCosts ?? 0, color: '#f59e0b' }].filter(d => d.value > 0);

  return (
    <div className="sa-overview-page">
      <div className="sa-clients-header" style={{ marginBottom: '24px' }}><div><h2>Business Analytics</h2><p>Track revenue, expenses, occupancy, and ROI over time</p></div></div>
      <div className="sa-overview-metrics" style={{ width: '100%', marginBottom: '24px' }}>
        <div className="sa-metric-card sa-metric-primary"><p className="sa-metric-label">Revenue Trends</p><p className="sa-metric-value">{businessTracking?.revenueTrends ?? '+0%'}</p></div>
        <div className="sa-metric-card"><p className="sa-metric-label">Occupancy Rate</p><p className="sa-metric-number">{Number(businessTracking?.occupancyRate ?? 0).toFixed(1)}%</p></div>
        <div className="sa-metric-card"><p className="sa-metric-label">Maintenance Costs</p><p className="sa-metric-number">{(businessTracking?.maintenanceCosts ?? 0).toLocaleString()} XOF</p></div>
        <div className="sa-metric-card"><p className="sa-metric-label">ROI</p><p className="sa-metric-number">{Number(businessTracking?.roi ?? 0).toFixed(1)}%</p></div>
        <div className="sa-metric-card"><p className="sa-metric-label">Total Revenue</p><p className="sa-metric-number">{(businessTracking?.totalRevenue ?? 0).toLocaleString()} XOF</p></div>
        <div className="sa-metric-card"><p className="sa-metric-label">Net Profit</p><p className="sa-metric-number">{(businessTracking?.netProfit ?? 0).toLocaleString()} XOF</p></div>
      </div>
      <div className="sa-section-card" style={{ marginBottom: '24px' }}>
        <div className="sa-section-header"><h3>Revenue vs Expenses (Last 6 Months)</h3><p>Monthly rent collected vs maintenance and other expenses</p></div>
        <div style={{ width: '100%', height: '300px', padding: '20px' }}>
          {chartData.length > 0 ? (<ResponsiveContainer><AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}><defs><linearGradient id="colorRevenueTracking" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient><linearGradient id="colorExpensesTracking" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} /><YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} /><Tooltip formatter={(value) => [`${Number(value).toLocaleString()} XOF`, '']} labelFormatter={(l) => `Month: ${l}`} /><Legend /><Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#colorRevenueTracking)" name="Revenue" strokeWidth={2} /><Area type="monotone" dataKey="expenses" stroke="#f59e0b" fill="url(#colorExpensesTracking)" name="Expenses" strokeWidth={2} /></AreaChart></ResponsiveContainer>) : (<div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>No chart data available yet</div>)}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <div className="sa-section-card" style={{ flex: '1 1 400px', minWidth: '300px' }}>
          <div className="sa-section-header"><h3>Occupancy Rate by Month</h3></div>
          <div style={{ width: '100%', height: '280px', padding: '20px' }}>{chartData.length > 0 ? (<ResponsiveContainer><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} /><Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Occupancy']} /><Bar dataKey="occupancy" fill="#10b981" name="Occupancy %" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>) : (<div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>No data</div>)}</div>
        </div>
        <div className="sa-section-card" style={{ flex: '1 1 400px', minWidth: '300px' }}>
          <div className="sa-section-header"><h3>Revenue vs Expenses (Total)</h3></div>
          <div style={{ width: '100%', height: '280px', padding: '20px' }}>{pieData.length > 0 ? (<ResponsiveContainer><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip formatter={(value) => [`${Number(value).toLocaleString()} XOF`, '']} /></PieChart></ResponsiveContainer>) : (<div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>No data</div>)}</div>
        </div>
      </div>
    </div>
  );
};

export default TrackingTab;
