import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer } from
'recharts';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Activity,
  DollarSign,
  Home,
  BarChart3,
  Percent,
  ArrowUpRight,
  ArrowDownRight } from
'lucide-react';

const AnalyticsPage = ({ indicators, yearlyComparison, monthlyComparison = [], loading }) => {
  const card = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
  const sectionTitle = { margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' };
  const sectionSub = { margin: '0 0 20px', fontSize: '0.8rem', color: '#94a3b8' };
  const tooltipStyle = { backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' };

  const fmt = (v) => (v != null ? Number(v).toLocaleString() : '0') + ' XOF';
  const pct = (v) => (v != null ? Number(v).toFixed(1) : '0.0') + '%';
  const yearlyChartData = useMemo(() => {
    if (!yearlyComparison?.yearlyData || !yearlyComparison?.sortedYears) return [];
    return yearlyComparison.sortedYears.map((year) => {
      const d = yearlyComparison.yearlyData[year] || {};
      return {
        year: String(year),
        revenue: d.annualRevenue || 0,
        expenses: d.annualExpenses || 0,
        netIncome: d.annualNetResult || 0
      };
    });
  }, [yearlyComparison]);

  if (loading) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 16, color: '#64748b', fontSize: '0.95rem' }}>Loading analytics data...</p>
      </div>);

  }

  if (!indicators) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>No analytics data available. Please ensure you have data in the system.</p>
      </div>);

  }

  const summary = yearlyComparison?.summary || {};
  const paymentPerf = indicators.paymentPerformance || {};
  const costsMaint = indicators.costsMaintenance || {};
  const expensesCtrl = indicators.expensesControl || {};
  const profitability = indicators.profitability || {};
  const vacancy = indicators.rentalVacancy || {};
  const activity = indicators.overallActivity || {};
  const financial = indicators.financialHealth || {};
  const risks = indicators.risksAlerts || {};
  const decisions = indicators.decisionMaking || {};
  const latestYear = yearlyComparison?.sortedYears?.[yearlyComparison.sortedYears.length - 1];
  const latestYearData = latestYear ? yearlyComparison?.yearlyData?.[latestYear] : null;

  const kpiCards = [
  {
    label: 'Most Profitable Year',
    value: summary.mostProfitableYear || 'N/A',
    icon: Award,
    accent: '#f59e0b',
    bg: '#fffbeb'
  },
  {
    label: 'Global Trend',
    value: summary.globalTrend ? summary.globalTrend.charAt(0).toUpperCase() + summary.globalTrend.slice(1) : 'Stable',
    icon: summary.globalTrend === 'growth' ? TrendingUp : summary.globalTrend === 'regression' ? TrendingDown : Activity,
    accent: summary.globalTrend === 'growth' ? '#10b981' : summary.globalTrend === 'regression' ? '#ef4444' : '#f59e0b',
    bg: summary.globalTrend === 'growth' ? '#ecfdf5' : summary.globalTrend === 'regression' ? '#fef2f2' : '#fffbeb'
  },
  {
    label: 'Net Margin',
    value: latestYearData ? pct(latestYearData.netMargin) : 'N/A',
    icon: Percent,
    accent: '#8b5cf6',
    bg: '#f5f3ff'
  },
  {
    label: 'Collection Rate',
    value: paymentPerf.collectionRate != null ? pct(paymentPerf.collectionRate) : 'N/A',
    icon: DollarSign,
    accent: '#3b82f6',
    bg: '#eff6ff'
  },
  {
    label: 'Occupancy Rate',
    value: vacancy.currentOccupancyRate != null ? pct(vacancy.currentOccupancyRate) : 'N/A',
    icon: Home,
    accent: '#06b6d4',
    bg: '#ecfeff'
  }];

  const financialIndicators = [
  { label: 'Payment Collection Rate', value: paymentPerf.collectionRate != null ? pct(paymentPerf.collectionRate) : 'N/A', good: paymentPerf.collectionRate > 80 },
  { label: 'Average Revenue per Property', value: financial.monthlyRevenue && activity.totalAssetsManaged > 0 ? fmt(financial.monthlyRevenue / activity.totalAssetsManaged) : 'N/A', good: true },
  { label: 'Commission Rate', value: profitability.commissionRate != null ? pct(profitability.commissionRate) : 'N/A', good: true },
  { label: 'Expense Ratio', value: expensesCtrl.expenseRatio != null ? pct(expensesCtrl.expenseRatio) : expensesCtrl.totalExpenses && financial.monthlyRevenue > 0 ? pct(expensesCtrl.totalExpenses / financial.monthlyRevenue * 100) : 'N/A', good: false }];

  const operationalIndicators = [
  { label: 'Occupancy Rate', value: vacancy.currentOccupancyRate != null ? pct(vacancy.currentOccupancyRate) : 'N/A', good: vacancy.currentOccupancyRate > 80 },
  { label: 'Avg Vacancy Duration', value: vacancy.averageVacancyDuration != null ? `${vacancy.averageVacancyDuration} days` : 'N/A', good: false },
  { label: 'Maintenance Cost / Property', value: costsMaint.maintenanceCostPerProperty != null ? fmt(costsMaint.maintenanceCostPerProperty) : 'N/A', good: true },
  { label: 'Active Properties', value: activity.totalAssetsManaged != null ? String(activity.totalAssetsManaged) : 'N/A', good: true }];


  const thStyle = { padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const tdStyle = { padding: '12px 16px', fontSize: '0.875rem', color: '#334155' };

  return (
    <div style={{ padding: '0', maxWidth: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>Analytics Dashboard</h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Comprehensive financial and operational analytics</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} style={{ ...card, padding: '20px', borderLeft: `4px solid ${kpi.accent}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={kpi.accent} />
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{kpi.label}</span>
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>{kpi.value}</span>
            </div>);

        })}
      </div>
      {yearlyChartData.length > 0 &&
      <div style={{ ...card, marginBottom: 28 }}>
          <h3 style={sectionTitle}>Revenue Overview</h3>
          <p style={sectionSub}>Yearly revenue, expenses, and net income trends</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={yearlyChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => fmt(value)} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#gRevenue)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f59e0b" fill="url(#gExpenses)" strokeWidth={2} />
              <Area type="monotone" dataKey="netIncome" name="Net Income" stroke="#10b981" fill="url(#gNet)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      }
      {monthlyComparison && monthlyComparison.length > 0 &&
      <div style={{ ...card, marginBottom: 28 }}>
          <h3 style={sectionTitle}>Monthly Performance</h3>
          <p style={sectionSub}>Month-over-month revenue, expenses, commissions, and net profit</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyComparison} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => fmt(Number(value))} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commissions" name="Commissions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="netProfit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 20, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={thStyle}>Month</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Revenue</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Expenses</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Commissions</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {monthlyComparison.map((row, idx) =>
              <tr key={idx} style={{ borderBottom: '1px solid #f8fafc', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={tdStyle}>{row.month || row.monthKey || '--'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(row.revenue || 0)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(row.expenses || 0)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(row.commissions || 0)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: (row.netProfit || 0) >= 0 ? '#10b981' : '#ef4444' }}>{fmt(row.netProfit || 0)}</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <DollarSign size={18} color="#3b82f6" />
            <h3 style={sectionTitle}>Financial Indicators</h3>
          </div>
          <p style={sectionSub}>Key financial performance metrics</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {financialIndicators.map((ind, i) =>
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < financialIndicators.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: '0.875rem', color: '#475569' }}>{ind.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>{ind.value}</span>
                  {ind.value !== 'N/A' && (
                ind.good ?
                <ArrowUpRight size={14} color="#10b981" /> :
                <ArrowDownRight size={14} color="#f59e0b" />)
                }
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <BarChart3 size={18} color="#8b5cf6" />
            <h3 style={sectionTitle}>Operational Indicators</h3>
          </div>
          <p style={sectionSub}>Key operational performance metrics</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {operationalIndicators.map((ind, i) =>
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < operationalIndicators.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: '0.875rem', color: '#475569' }}>{ind.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>{ind.value}</span>
                  {ind.value !== 'N/A' && (
                ind.good ?
                <ArrowUpRight size={14} color="#10b981" /> :
                <ArrowDownRight size={14} color="#f59e0b" />)
                }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {yearlyComparison?.sortedYears && yearlyComparison.sortedYears.length > 0 &&
      <div style={card}>
          <h3 style={sectionTitle}>Yearly Comparison</h3>
          <p style={sectionSub}>Side-by-side financial performance across all years</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={thStyle}>Year</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Revenue</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Commissions</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Expenses</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Net Income</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Net Margin</th>
                </tr>
              </thead>
              <tbody>
                {yearlyComparison.sortedYears.map((year, idx) => {
                const data = yearlyComparison.yearlyData[year] || {};
                return (
                  <tr key={year} style={{ borderBottom: '1px solid #f8fafc', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{year}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(data.annualRevenue || 0)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(data.annualCommissions || 0)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(data.annualExpenses || 0)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: (data.annualNetResult || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                        {fmt(data.annualNetResult || 0)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <span style={{ color: (data.netMargin || 0) >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                          {pct(data.netMargin || 0)}
                        </span>
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>);

};

export default AnalyticsPage;
