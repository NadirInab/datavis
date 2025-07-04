// Visualization Testing and Debugging Utilities

export const createTestData = () => {
  return [
    { Name: 'John Doe', Age: 28, Salary: 50000, Department: 'Engineering', City: 'New York' },
    { Name: 'Jane Smith', Age: 32, Salary: 65000, Department: 'Marketing', City: 'Los Angeles' },
    { Name: 'Bob Johnson', Age: 45, Salary: 75000, Department: 'Engineering', City: 'Chicago' },
    { Name: 'Alice Brown', Age: 29, Salary: 55000, Department: 'Sales', City: 'Houston' },
    { Name: 'Charlie Wilson', Age: 38, Salary: 70000, Department: 'Marketing', City: 'Phoenix' },
    { Name: 'Diana Davis', Age: 26, Salary: 48000, Department: 'Sales', City: 'Philadelphia' },
    { Name: 'Frank Miller', Age: 41, Salary: 80000, Department: 'Engineering', City: 'San Antonio' },
    { Name: 'Grace Lee', Age: 33, Salary: 62000, Department: 'Marketing', City: 'San Diego' },
    { Name: 'Henry Taylor', Age: 36, Salary: 68000, Department: 'Sales', City: 'Dallas' },
    { Name: 'Ivy Chen', Age: 27, Salary: 52000, Department: 'Engineering', City: 'San Jose' }
  ];
};

export const createTestFile = (fileId = '1751492985358') => {
  const data = createTestData();
  
  return {
    id: fileId,
    name: 'test-data.csv',
    size: 1024,
    type: 'text/csv',
    data: data,
    rows: data.length,
    columns: Object.keys(data[0]).length,
    columnTypes: {
      'Name': 'string',
      'Age': 'number',
      'Salary': 'number',
      'Department': 'string',
      'City': 'string'
    },
    visualizations: [
      {
        id: 'viz-1',
        type: 'bar',
        title: 'Average Salary by Department',
        columns: {
          x: 'Department',
          y: 'Salary'
        }
      },
      {
        id: 'viz-2',
        type: 'pie',
        title: 'Employee Count by Department',
        columns: {
          name: 'Department',
          value: 'count'
        }
      },
      {
        id: 'viz-3',
        type: 'line',
        title: 'Age vs Salary',
        columns: {
          x: 'Age',
          y: 'Salary'
        }
      }
    ],
    uploadedAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
};

export const setupTestEnvironment = () => {
  const testFile = createTestFile();
  const userId = 'visitor-session';
  
  // Store test file in localStorage
  const existingFiles = JSON.parse(localStorage.getItem(`files_${userId}`) || '[]');
  const updatedFiles = existingFiles.filter(f => f.id !== testFile.id);
  updatedFiles.push(testFile);
  
  localStorage.setItem(`files_${userId}`, JSON.stringify(updatedFiles));
  localStorage.setItem('sessionId', userId);
  
  console.log('Test environment setup complete:', {
    fileId: testFile.id,
    userId,
    filesCount: updatedFiles.length
  });
  
  return testFile;
};

export const debugVisualizationData = (file, activeVizIndex = 0) => {
  console.log('=== VISUALIZATION DEBUG ===');
  console.log('File:', file);
  console.log('Active Viz Index:', activeVizIndex);
  
  if (!file) {
    console.error('No file provided');
    return null;
  }
  
  if (!file.data || !Array.isArray(file.data)) {
    console.error('Invalid file data:', file.data);
    return null;
  }
  
  if (!file.visualizations || !Array.isArray(file.visualizations)) {
    console.error('No visualizations found:', file.visualizations);
    return null;
  }
  
  if (activeVizIndex >= file.visualizations.length) {
    console.error('Invalid visualization index:', activeVizIndex, 'Max:', file.visualizations.length - 1);
    return null;
  }
  
  const currentViz = file.visualizations[activeVizIndex];
  console.log('Current Visualization:', currentViz);
  
  const data = [...file.data];
  console.log('Raw Data Sample:', data.slice(0, 3));
  
  // Test data processing for different chart types
  let processedData = null;
  
  try {
    if (currentViz.type === 'pie') {
      const { name, value } = currentViz.columns;
      console.log('Pie Chart Columns:', { name, value });
      
      if (value === 'count') {
        const counts = {};
        data.forEach(row => {
          const category = row[name];
          counts[category] = (counts[category] || 0) + 1;
        });
        processedData = Object.entries(counts).map(([name, value]) => ({ name, value }));
      } else {
        const sums = {};
        data.forEach(row => {
          const category = row[name];
          const val = parseFloat(row[value]) || 0;
          sums[category] = (sums[category] || 0) + val;
        });
        processedData = Object.entries(sums).map(([name, value]) => ({ name, value }));
      }
    } else if (['bar', 'line', 'area'].includes(currentViz.type)) {
      const { x, y } = currentViz.columns;
      console.log('Chart Columns:', { x, y });
      
      if (typeof y === 'string') {
        const grouped = {};
        const counts = {};
        
        data.forEach(row => {
          const xValue = row[x];
          const yValue = parseFloat(row[y]) || 0;
          
          if (!grouped[xValue]) {
            grouped[xValue] = 0;
            counts[xValue] = 0;
          }
          
          grouped[xValue] += yValue;
          counts[xValue]++;
        });
        
        processedData = Object.entries(grouped).map(([name, value]) => ({
          name,
          value: value / counts[name]
        }));
      }
    } else {
      processedData = data;
    }
    
    console.log('Processed Data:', processedData);
    console.log('=== DEBUG COMPLETE ===');
    
    return processedData;
  } catch (error) {
    console.error('Error processing visualization data:', error);
    return null;
  }
};

export const testExportFunctionality = async (chartElementId, data, filename = 'test') => {
  console.log('=== EXPORT FUNCTIONALITY TEST ===');
  
  const results = {
    png: { success: false, error: null },
    csv: { success: false, error: null },
    json: { success: false, error: null }
  };
  
  // Test PNG Export
  try {
    const element = document.getElementById(chartElementId);
    if (!element) {
      throw new Error(`Chart element not found: ${chartElementId}`);
    }
    console.log('Chart element found:', element);
    results.png.success = true;
  } catch (error) {
    console.error('PNG Export Test Failed:', error);
    results.png.error = error.message;
  }
  
  // Test CSV Export
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data available for CSV export');
    }
    console.log('CSV data available:', data.length, 'rows');
    results.csv.success = true;
  } catch (error) {
    console.error('CSV Export Test Failed:', error);
    results.csv.error = error.message;
  }
  
  // Test JSON Export
  try {
    if (!data) {
      throw new Error('No data available for JSON export');
    }
    const jsonString = JSON.stringify(data, null, 2);
    console.log('JSON export ready, size:', jsonString.length, 'characters');
    results.json.success = true;
  } catch (error) {
    console.error('JSON Export Test Failed:', error);
    results.json.error = error.message;
  }
  
  console.log('Export Test Results:', results);
  console.log('=== EXPORT TEST COMPLETE ===');
  
  return results;
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  window.visualizationDebug = {
    createTestData,
    createTestFile,
    setupTestEnvironment,
    debugVisualizationData,
    testExportFunctionality
  };
}
