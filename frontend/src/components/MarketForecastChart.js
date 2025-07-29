import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MarketForecastChart = ({ forecastData }) => {
  // Check if forecastData is null, undefined, or empty
  if (!forecastData || !Array.isArray(forecastData) || forecastData.length === 0) {
    return (
      <div className="market-forecast-chart">
        <div className="chart-placeholder" style={{ 
          height: '400px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          color: '#6c757d'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>📈</div>
            <div>No forecast data available</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>Run a new prediction to generate forecast data</div>
          </div>
        </div>
      </div>
    );
  }

  // Transform the forecast data to the format expected by Recharts
  const chartData = forecastData.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    spx: item.spx || 0,
    ndx: item.ndx || 0,
    dji: item.dji || 0,
    rut: item.rut || 0
  }));

  return (
    <div className="market-forecast-chart">
      <ResponsiveContainer width="100%" height={400}>
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
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => {
              // Format the values to show with commas and two decimal places
              return [value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), name];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="spx" 
            name="S&P 500" 
            stroke="#8884d8" 
            activeDot={{ r: 8 }} 
          />
          <Line 
            type="monotone" 
            dataKey="ndx" 
            name="NASDAQ" 
            stroke="#82ca9d" 
          />
          <Line 
            type="monotone" 
            dataKey="dji" 
            name="DOW JONES" 
            stroke="#ffc658" 
          />
          <Line 
            type="monotone" 
            dataKey="rut" 
            name="RUSSELL 2000" 
            stroke="#ff7300" 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MarketForecastChart;
