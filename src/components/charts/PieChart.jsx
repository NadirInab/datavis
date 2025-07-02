import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { pieChartData, COLORS } from '../../data/mockData';

const PieChartComponent = ({ data = null, dataKey = "value", nameKey = "name", title = "Pie Chart" }) => {
  // Use provided data or fall back to mock data
  const chartData = data || pieChartData;

  // If using dynamic data, transform it to the expected format
  const transformedData = data ? data.map(item => ({
    name: item[nameKey] || item.name,
    value: item[dataKey] || item.value
  })) : chartData;

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={transformedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {transformedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartComponent;