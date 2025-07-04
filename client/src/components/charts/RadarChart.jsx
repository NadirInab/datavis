import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';
import { radarChartData } from '../../data/mockData';

const RadarChartComponent = ({ data = null, dataKey = "value", nameKey = "name", title = "Radar Chart" }) => {
  // Use provided data or fall back to mock data
  const chartData = data || radarChartData;

  // If using dynamic data, transform it to the expected format
  const transformedData = data ? data.map(item => ({
    subject: item[nameKey] || item.name || item.subject,
    value: item[dataKey] || item.value,
    A: item[dataKey] || item.value || item.A
  })) : chartData;

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={transformedData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, data ? Math.max(...transformedData.map(d => d.value)) : 100]} />
          {data ? (
            <Radar
              name="Data"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
          ) : (
            <>
              <Radar
                name="Current Period"
                dataKey="A"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Radar
                name="Previous Period"
                dataKey="B"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
              />
            </>
          )}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartComponent;