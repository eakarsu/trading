import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const AssetAllocationChart = ({ allocationData }) => {
  // Handle both array and object formats
  let chartData = [];
  
  if (Array.isArray(allocationData)) {
    // Array format: [{ asset: 'stocks', percent: 60 }, ...]
    chartData = allocationData.map((item, index) => ({
      name: item.asset,
      value: item.percent,
      color: `hsl(${index * 60}, 70%, 50%)`
    }));
  } else if (allocationData && typeof allocationData === 'object') {
    // Object format: { stocks: 60, bonds: 30, cash: 10 }
    chartData = Object.entries(allocationData).map(([asset, percent], index) => ({
      name: asset.charAt(0).toUpperCase() + asset.slice(1),
      value: percent,
      color: `hsl(${index * 60}, 70%, 50%)`
    }));
  }
  
  // Filter out zero values for cleaner chart
  chartData = chartData.filter(item => item.value > 0);

  return (
    <div className="asset-allocation-chart">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AssetAllocationChart;
