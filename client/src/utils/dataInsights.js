import { inferDataType } from './fileParser';

export const generateDataSummary = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  const summary = {
    totalRows: data.length,
    totalColumns: Object.keys(data[0]).length,
    dataQuality: {
      score: 0,
      completeness: {},
      issues: []
    },
    columnInsights: {},
    suggestedCharts: []
  };

  // Calculate data quality and column insights
  const columns = Object.keys(data[0]);
  let totalCompleteness = 0;

  columns.forEach(column => {
    const values = data.map(row => row[column]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const uniqueValues = [...new Set(values)];
    
    // Calculate column completeness
    const completeness = (nonNullValues.length / values.length) * 100;
    totalCompleteness += completeness;

    // Get top 3 most common values
    const valueCounts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    const sortedValues = Object.entries(valueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([value, count]) => ({ value, count }));

    // Detect data type
    const dataType = inferDataType(nonNullValues[0]);

    // Check for anomalies
    const anomalies = [];
    if (completeness < 80) {
      anomalies.push('High missing data rate');
    }
    if (uniqueValues.length === values.length && values.length > 10) {
      anomalies.push('Potentially unique identifier');
    }

    summary.columnInsights[column] = {
      dataType,
      completeness: completeness.toFixed(1),
      uniqueValues: uniqueValues.length,
      topValues: sortedValues,
      anomalies
    };
  });

  // Calculate overall data quality score
  summary.dataQuality.score = (totalCompleteness / (columns.length * 100) * 100).toFixed(1);

  // Suggest charts based on data patterns
  summary.suggestedCharts = suggestCharts(data, summary.columnInsights);

  return summary;
};

const suggestCharts = (data, columnInsights) => {
  const suggestions = [];
  const columns = Object.keys(columnInsights);

  // Find numeric and categorical columns
  const numericColumns = columns.filter(col => 
    columnInsights[col].dataType === 'decimal' || 
    columnInsights[col].dataType === 'integer'
  );
  
  const categoricalColumns = columns.filter(col => 
    columnInsights[col].dataType === 'text' && 
    columnInsights[col].uniqueValues <= 10
  );

  // Bar Chart suggestion
  if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    suggestions.push({
      type: 'bar',
      title: `${numericColumns[0]} by ${categoricalColumns[0]}`,
      suitability: 'high',
      reason: 'Good for comparing numeric values across categories'
    });
  }

  // Pie Chart suggestion
  if (categoricalColumns.length > 0 && categoricalColumns[0] !== columns[0]) {
    suggestions.push({
      type: 'pie',
      title: `Distribution of ${categoricalColumns[0]}`,
      suitability: columnInsights[categoricalColumns[0]].uniqueValues <= 7 ? 'high' : 'medium',
      reason: 'Suitable for showing distribution of categorical data'
    });
  }

  // Line Chart suggestion
  const dateColumns = columns.filter(col => columnInsights[col].dataType === 'date');
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    suggestions.push({
      type: 'line',
      title: `${numericColumns[0]} over time`,
      suitability: 'high',
      reason: 'Perfect for showing trends over time'
    });
  }

  return suggestions;
};

export const detectDataAnomalies = (data, columnInsights) => {
  const anomalies = [];

  // Check for duplicate rows
  const stringifiedRows = data.map(row => JSON.stringify(row));
  const uniqueRows = new Set(stringifiedRows);
  if (uniqueRows.size < data.length) {
    anomalies.push({
      type: 'duplicates',
      severity: 'medium',
      message: `Found ${data.length - uniqueRows.size} duplicate rows`
    });
  }

  // Check for outliers in numeric columns
  Object.entries(columnInsights).forEach(([column, insight]) => {
    if (insight.dataType === 'decimal' || insight.dataType === 'integer') {
      const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
      
      const outliers = values.filter(v => Math.abs(v - mean) > 2 * stdDev);
      if (outliers.length > 0) {
        anomalies.push({
          type: 'outliers',
          column,
          severity: 'low',
          message: `Found ${outliers.length} potential outliers in ${column}`
        });
      }
    }
  });

  return anomalies;
};
