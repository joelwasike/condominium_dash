import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const statsData = [
    {
      title: 'Total Transacted',
      value: '1,871,841 XOF',
      trend: '+59.3%',
      trendType: 'positive',
      subtitle: 'You made an extra 3,081,595 XOF this year',
      color: '#3b82f6'
    },
    {
      title: 'Total Transactions',
      value: '14,200',
      trend: '+70.5%',
      trendType: 'positive',
      subtitle: 'You made an extra 2782 this year',
      color: '#10b981'
    },
    {
      title: 'Pending Transactions',
      value: '2,782',
      trend: '+27.4%',
      trendType: 'warning',
      subtitle: 'You made an extra 3793 this year',
      color: '#f59e0b'
    },
    {
      title: 'Success Rate',
      value: '17.3%',
      trend: '+17.3%',
      trendType: 'warning',
      subtitle: 'You made an extra 2454 this year',
      color: '#ef4444'
    }
  ];

  const chartData = [
    { month: 'Jan', volume: 500, count: 200 },
    { month: 'Feb', volume: 800, count: 300 },
    { month: 'Mar', volume: 1200, count: 400 },
    { month: 'Apr', volume: 1500, count: 500 },
    { month: 'May', volume: 1800, count: 600 },
    { month: 'Jun', volume: 2000, count: 700 },
    { month: 'Jul', volume: 2200, count: 800 },
    { month: 'Aug', volume: 2500, count: 900 },
    { month: 'Sep', volume: 22000, count: 7000 },
    { month: 'Oct', volume: 22000, count: 7000 },
    { month: 'Nov', volume: 8000, count: 2500 },
    { month: 'Dec', volume: 5000, count: 1500 }
  ];

  const weeklyData = [
    { day: 'Mo', amount: 150000 },
    { day: 'Tu', amount: 80000 },
    { day: 'We', amount: 0 },
    { day: 'Th', amount: 0 },
    { day: 'Fr', amount: 0 },
    { day: 'Sa', amount: 0 },
    { day: 'Su', amount: 0 }
  ];

  const maxVolume = Math.max(...chartData.map(d => d.volume));
  const maxCount = Math.max(...chartData.map(d => d.count));
  const maxWeekly = Math.max(...weeklyData.map(d => d.amount));

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-header">
              <h3>{stat.title}</h3>
              <div className={`stat-trend ${stat.trendType}`}>
                {stat.trendType === 'positive' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{stat.trend}</span>
              </div>
            </div>
            <div className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="stat-subtitle">
              {stat.subtitle}
            </div>
          </div>
        ))}
      </div>

      <div className="analytics-section">
        <h2>Analytics</h2>
        <div className="chart-container">
          <div className="chart-area">
            <svg width="100%" height="300" viewBox="0 0 800 300">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="80" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 80 0 L 0 0 0 25" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Volume area */}
              <defs>
                <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.1"/>
                </linearGradient>
                <linearGradient id="countGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1"/>
                </linearGradient>
              </defs>
              
              {/* Volume area chart */}
              <path
                d={`M ${chartData.map((d, i) => `${60 + i * 60},${250 - (d.volume / maxVolume) * 200}`).join(' L ')} L ${60 + (chartData.length - 1) * 60},250 L 60,250 Z`}
                fill="url(#volumeGradient)"
              />
              
              {/* Count area chart */}
              <path
                d={`M ${chartData.map((d, i) => `${60 + i * 60},${250 - (d.count / maxCount) * 200}`).join(' L ')} L ${60 + (chartData.length - 1) * 60},250 L 60,250 Z`}
                fill="url(#countGradient)"
              />
              
              {/* Month labels */}
              {chartData.map((d, i) => (
                <text key={i} x={60 + i * 60} y={280} textAnchor="middle" className="chart-label">
                  {d.month}
                </text>
              ))}
              
              {/* Y-axis labels */}
              {[0, 5000, 10000, 15000, 20000, 25000].map((value, i) => (
                <text key={i} x={40} y={250 - (value / maxVolume) * 200} textAnchor="end" className="chart-label">
                  {value.toLocaleString()}
                </text>
              ))}
            </svg>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#14b8a6' }}></div>
              <span>Transaction Volume</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#06b6d4' }}></div>
              <span>Transaction Count</span>
            </div>
          </div>
        </div>
      </div>

      <div className="income-section">
        <div className="income-header">
          <h2>Income Overview</h2>
          <div className="period-toggle">
            <button 
              className={`toggle-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('month')}
            >
              Month
            </button>
            <button 
              className={`toggle-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('week')}
            >
              Week
            </button>
          </div>
        </div>
        
        <div className="income-chart">
          <h3>This Week Statistics</h3>
          <div className="income-total">439,321 XOF</div>
          
          <div className="bar-chart">
            {weeklyData.map((data, index) => (
              <div key={index} className="bar-container">
                <div 
                  className="bar" 
                  style={{ 
                    height: `${(data.amount / maxWeekly) * 100}%`,
                    backgroundColor: data.amount > 0 ? '#22c55e' : '#e5e7eb'
                  }}
                ></div>
                <span className="bar-label">{data.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
