import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';

const AnalyticsPage = ({ indicators, yearlyComparison, loading }) => {
  // Prepare data for charts
  const financialOverviewData = useMemo(() => {
    if (!yearlyComparison?.yearlyData) return [];
    const sortedYears = yearlyComparison.sortedYears || [];
    return sortedYears.map(year => {
      const data = yearlyComparison.yearlyData[year];
      return {
        year: year.toString(),
        revenue: data?.annualRevenue || 0,
        commissions: data?.annualCommissions || 0,
        expenses: data?.annualExpenses || 0,
        netIncome: data?.annualNetResult || 0
      };
    });
  }, [yearlyComparison]);

  const netProfitData = useMemo(() => {
    if (!yearlyComparison?.yearlyData) return [];
    const sortedYears = yearlyComparison.sortedYears || [];
    return sortedYears.map(year => {
      const data = yearlyComparison.yearlyData[year];
      return {
        year: year.toString(),
        profit: data?.annualNetResult || 0
      };
    });
  }, [yearlyComparison]);

  const commissionData = useMemo(() => {
    if (!yearlyComparison?.yearlyData) return [];
    const sortedYears = yearlyComparison.sortedYears || [];
    return sortedYears.map(year => {
      const data = yearlyComparison.yearlyData[year];
      return {
        year: year.toString(),
        commissions: data?.annualCommissions || 0,
        commissionRate: data?.commissionRate || 0
      };
    });
  }, [yearlyComparison]);

  const expenseData = useMemo(() => {
    if (!yearlyComparison?.yearlyData) return [];
    const sortedYears = yearlyComparison.sortedYears || [];
    return sortedYears.map(year => {
      const data = yearlyComparison.yearlyData[year];
      return {
        year: year.toString(),
        expenses: data?.annualExpenses || 0,
        expenseRatio: data?.annualRevenue > 0 ? (data.annualExpenses / data.annualRevenue * 100) : 0
      };
    });
  }, [yearlyComparison]);

  const top5ProfitableBuildings = useMemo(() => {
    if (!indicators?.profitability?.top5MostProfitable) return [];
    return indicators.profitability.top5MostProfitable.map(b => ({
      name: b.Address || b.address || 'N/A',
      value: b.NetIncome || b.netIncome || 0
    }));
  }, [indicators]);

  const top5ExpensiveBuildings = useMemo(() => {
    if (!indicators?.expensesControl?.mostExpensiveBuildings) return [];
    return indicators.expensesControl.mostExpensiveBuildings.map(b => ({
      name: b.Address || b.address || 'N/A',
      value: b.Amount || b.amount || 0
    }));
  }, [indicators]);

  const top5RegularTenants = useMemo(() => {
    if (!indicators?.decisionMaking?.top5MostRegularTenants) return [];
    return indicators.decisionMaking.top5MostRegularTenants.map(t => ({
      name: t.TenantName || t.tenantName || 'N/A',
      value: t.OnTimeRate || t.onTimeRate || 0
    }));
  }, [indicators]);

  const top5AtRiskTenants = useMemo(() => {
    if (!indicators?.decisionMaking?.top5TenantsAtRisk) return [];
    return indicators.decisionMaking.top5TenantsAtRisk.map(t => ({
      name: t.TenantName || t.tenantName || 'N/A',
      value: t.OnTimeRate || t.onTimeRate || 0
    }));
  }, [indicators]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (!indicators || !yearlyComparison) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>No analytics data available. Please ensure you have data in the system.</p>
      </div>
    );
  }

  const summary = yearlyComparison.summary || {};
  const paymentPerf = indicators.paymentPerformance || {};
  const costsMaint = indicators.costsMaintenance || {};
  const expensesCtrl = indicators.expensesControl || {};
  const profitability = indicators.profitability || {};
  const vacancy = indicators.rentalVacancy || {};
  const activity = indicators.overallActivity || {};
  const financial = indicators.financialHealth || {};
  const risks = indicators.risksAlerts || {};
  const decisions = indicators.decisionMaking || {};

  return (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Analytics Dashboard</h2>
          <p>Comprehensive financial and operational analytics with year-by-year comparison</p>
        </div>
      </div>

      {/* Top Header with Key KPIs */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '20px', 
        marginTop: '20px',
        marginBottom: '30px' 
      }}>
        <div className="sa-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Award size={24} color="#fbbf24" />
            <h3 style={{ margin: 0, fontSize: '14px' }}>Most Profitable Year</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {summary.mostProfitableYear || 'N/A'}
          </p>
        </div>

        <div className="sa-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Award size={24} color="#fbbf24" />
            <h3 style={{ margin: 0, fontSize: '14px' }}>Best Margin</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {summary.bestMarginYear || 'N/A'}
          </p>
        </div>

        <div className="sa-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Award size={24} color="#fbbf24" />
            <h3 style={{ margin: 0, fontSize: '14px' }}>Most Expensive Year</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {summary.mostExpensiveYear || 'N/A'}
          </p>
        </div>

        <div className="sa-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Award size={24} color="#fbbf24" />
            <h3 style={{ margin: 0, fontSize: '14px' }}>Most Stable Year</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {summary.mostStableYear || 'N/A'}
          </p>
        </div>

        <div className="sa-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            {summary.globalTrend === 'growth' ? (
              <TrendingUp size={24} color="#10b981" />
            ) : summary.globalTrend === 'regression' ? (
              <TrendingDown size={24} color="#ef4444" />
            ) : (
              <TrendingUp size={24} color="#f59e0b" />
            )}
            <h3 style={{ margin: 0, fontSize: '14px' }}>Global Trend</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, textTransform: 'capitalize' }}>
            {summary.globalTrend || 'Stagnation'}
          </p>
        </div>
      </div>

      {/* First Row: Financial Overview, Net Profit, Expense Analysis */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        {/* Financial Overview Chart */}
        <div className="sa-section-card">
          <div className="sa-section-header">
            <h3>Financial Overview</h3>
            <p>Revenue, expenses, commissions, and net income trends</p>
          </div>
          <div style={{ width: '100%', height: '300px', padding: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialOverviewData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} XOF`} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" name="Expenses" />
                <Area type="monotone" dataKey="commissions" stroke="#f59e0b" fillOpacity={0.6} fill="#f59e0b" name="Commissions" />
                <Area type="monotone" dataKey="netIncome" stroke="#3b82f6" fillOpacity={0.6} fill="#3b82f6" name="Net Income" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net Profit Evolution */}
        <div className="sa-section-card">
          <div className="sa-section-header">
            <h3>Net Profit Evolution</h3>
            <p>Annual net profit by year</p>
          </div>
          <div style={{ width: '100%', height: '300px', padding: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={netProfitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} XOF`} />
                <Bar dataKey="profit" fill="#10b981" name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ padding: '15px', fontSize: '12px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ margin: '5px 0' }}>
              Best Year: {summary.mostProfitableYear || 'N/A'}
            </p>
            <p style={{ margin: '5px 0' }}>
              Worst Year: {summary.leastProfitableYear || 'N/A'}
            </p>
            <p style={{ margin: '5px 0' }}>
              Profit Change: {netProfitData.length >= 2 ? 
                (((netProfitData[netProfitData.length - 1].profit - netProfitData[0].profit) / Math.abs(netProfitData[0].profit || 1)) * 100).toFixed(1) 
                : 0}%
            </p>
          </div>
        </div>

        {/* Expense Analysis */}
        <div className="sa-section-card">
          <div className="sa-section-header">
            <h3>Expense Analysis</h3>
            <p>Total expenses and ratios</p>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb' }}>
              <span>Total Consumes & Ratio</span>
              <span style={{ fontWeight: 'bold' }}>
                {expensesCtrl.totalExpenses?.toLocaleString() || 0} XOF
                {financial.monthlyRevenue > 0 && (
                  <span style={{ marginLeft: '10px', color: '#10b981' }}>
                    ↑ {((expensesCtrl.totalExpenses / financial.monthlyRevenue) * 100).toFixed(1)}%
                  </span>
                )}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb' }}>
              <span>Total Expenses & Ratio</span>
              <span style={{ fontWeight: 'bold' }}>
                {expensesCtrl.totalExpenses?.toLocaleString() || 0} XOF
                <span style={{ marginLeft: '10px', color: '#10b981' }}>↑</span>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Expenses</span>
              <span style={{ fontWeight: 'bold' }}>
                {expensesCtrl.totalExpenses?.toLocaleString() || 0} XOF
                <span style={{ marginLeft: '10px', color: '#10b981' }}>↑</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Commission Performance, Expense Analysis Chart, Operational Efficiency */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        {/* Commission Performance */}
        <div className="sa-section-card">
          <div className="sa-section-header">
            <h3>Commission Performance</h3>
            <p>Commissions & % of Revenue</p>
          </div>
          <div style={{ width: '100%', height: '300px', padding: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={commissionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'commissionRate') return `${value.toFixed(1)}%`;
                    return `${value.toLocaleString()} XOF`;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="commissions" fill="#f59e0b" name="Commissions" />
                <Line yAxisId="right" type="monotone" dataKey="commissionRate" stroke="#10b981" strokeWidth={2} name="% of Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Analysis Chart */}
        <div className="sa-section-card">
          <div className="sa-section-header">
            <h3>Expense Analysis</h3>
            <p>Total Expenses & Ratio</p>
          </div>
          <div style={{ width: '100%', height: '300px', padding: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} XOF`} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Efficiency */}
        <div className="sa-section-card">
          <div className="sa-section-header">
            <h3>Operational Efficiency</h3>
            <p>Key operational metrics</p>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}>Assets Managed</p>
                <p style={{ margin: '5px 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {activity.totalAssetsManaged || 0}
                </p>
              </div>
              <div>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}>Avg. Income/Property</p>
                <p style={{ margin: '5px 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {financial.monthlyRevenue && activity.totalAssetsManaged > 0 
                    ? (financial.monthlyRevenue / activity.totalAssetsManaged).toLocaleString() 
                    : 0} XOF
                </p>
              </div>
              <div>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}>Vacancy Rate</p>
                <p style={{ margin: '5px 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {vacancy.overallVacancyRate?.toFixed(1) || 0}%
                </p>
              </div>
              <div>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}>Vacancy Loss</p>
                <p style={{ margin: '5px 0', fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {vacancy.financialLossVacancy?.toLocaleString() || 0} XOF
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: Risks & Stability, Profitability Rankings */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        {/* Risks & Stability */}
        <div className="sa-section-card">
          <div className="sa-section-header">
            <h3>Risks & Stability</h3>
            <p>Risk indicators and stability metrics</p>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}>Total Unpaid</p>
                <p style={{ margin: '5px 0', fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  {risks.totalUnpaid?.toLocaleString() || 0} XOF
                </p>
              </div>
              <div>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}>Procedures</p>
                <p style={{ margin: '5px 0', fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                  {risks.ongoingProcedures || 0}
                </p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}>Delinquency Rate</p>
                <p style={{ margin: '5px 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {risks.totalUnpaid && financial.monthlyRevenue > 0 
                    ? ((risks.totalUnpaid / financial.monthlyRevenue) * 100).toFixed(1) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profitability Rankings - Top 5 Profitable */}
        <div className="sa-section-card">
          <div className="sa-section-header">
            <h3>Top 5 Profitable Buildings</h3>
            <p>Most profitable properties</p>
          </div>
          <div style={{ width: '100%', height: '250px', padding: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top5ProfitableBuildings} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => `${value.toLocaleString()} XOF`} />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profitability Rankings - Top 5 Expensive */}
        <div className="sa-section-card">
          <div className="sa-section-header">
            <h3>Top 5 Costly Buildings</h3>
            <p>Most expensive properties</p>
          </div>
          <div style={{ width: '100%', height: '250px', padding: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top5ExpensiveBuildings} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => `${value.toLocaleString()} XOF`} />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom: Yearly Performance Comparison */}
      <div className="sa-section-card" style={{ marginBottom: '20px' }}>
        <div className="sa-section-header">
          <h3>Yearly Performance Comparison</h3>
          <p>Comprehensive year-by-year financial analysis</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' }}>
          {/* Table */}
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Year</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Revenue</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Commissions</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Expenses</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Net Income</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Net Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyComparison.sortedYears?.map(year => {
                    const data = yearlyComparison.yearlyData[year];
                    return (
                      <tr key={year} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px' }}>{year}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {(data?.annualRevenue || 0).toLocaleString()} XOF
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {(data?.annualCommissions || 0).toLocaleString()} XOF
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {(data?.annualExpenses || 0).toLocaleString()} XOF
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {(data?.annualNetResult || 0).toLocaleString()} XOF
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {data?.netMargin?.toFixed(1) || 0}%
                          {data?.netMargin > 0 && <span style={{ color: '#10b981', marginLeft: '5px' }}>↑</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Combined Chart */}
          <div>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={financialOverviewData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} XOF`} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                <Bar dataKey="commissions" fill="#f59e0b" name="Commissions" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                <Line type="monotone" dataKey="netIncome" stroke="#10b981" strokeWidth={3} name="Net Income" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
