import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { lineChartData } from '../../data/mockData';

const LineChartComponent = ({ data = null, dataKey = "value", nameKey = "name", title = "Line Chart" }) => {
  // Use provided data or fall back to mock data
  const chartData = data || lineChartData;

  // If using dynamic data, transform it to the expected format
  const transformedData = data ? data.map(item => ({
    name: item[nameKey] || item.name,
    value: item[dataKey] || item.value
  })) : chartData;

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
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
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="visits"
                stroke="#8884d8"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="#82ca9d"
                strokeWidth={2}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartComponent;