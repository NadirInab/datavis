import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { barChartData } from '../../data/mockData';

const BarChartComponent = ({ data = null, dataKey = "value", nameKey = "name", title = "Bar Chart" }) => {
  // Use provided data or fall back to mock data
  const chartData = data || barChartData;

  // If using dynamic data, transform it to the expected format
  const transformedData = data ? data.map(item => ({
    name: item[nameKey] || item.name,
    value: item[dataKey] || item.value
  })) : chartData;

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={transformedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {data ? (
            <Bar dataKey="value" fill="#8884d8" />
          ) : (
            <>
              <Bar dataKey="online" fill="#8884d8" />
              <Bar dataKey="inStore" fill="#82ca9d" />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;