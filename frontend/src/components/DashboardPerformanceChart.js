import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DashboardPerformanceChart = ({ performanceData }) => {
  // Check if performanceData is null or undefined
  if (!performanceData) {
    return <div className="chart-placeholder">No performance data available</div>;
  }

  // Transform the performance data to the format expected by Recharts
  // We'll create a mock time series based on the performance periods
  const periods = Object.keys(performanceData);
  const chartData = periods.map((period, index) => ({
    period: period,
    value: performanceData[period]
  }));

  return (
    <div className="dashboard-performance-chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip 
            formatter={(value) => [`${value.toFixed(2)}%`, 'Performance']}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            name="Portfolio Performance" 
            stroke="#8884d8" 
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardPerformanceChart;
