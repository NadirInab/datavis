import React from 'react';
import ExportMenu from './ExportMenu';

// Test component to verify ExportMenu works with different prop combinations
const ExportMenuTest = () => {
  // Test data
  const testData = [
    { name: 'John', age: 30, city: 'New York' },
    { name: 'Jane', age: 25, city: 'Los Angeles' },
    { name: 'Bob', age: 35, city: 'Chicago' }
  ];

  const testVisualization = {
    type: 'bar',
    title: 'Test Chart',
    columns: ['name', 'age']
  };

  const testFile = {
    name: 'test-file.csv',
    data: testData,
    visualizations: [testVisualization]
  };

  const handleExportStart = (type) => {
    console.log('Export started:', type);
  };

  const handleExportComplete = (type) => {
    console.log('Export completed:', type);
  };

  const handleExportError = (error) => {
    console.error('Export error:', error);
  };

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold">ExportMenu Test Cases</h2>
      
      {/* Test Case 1: With all props */}
      <div className="border p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Test 1: With data and visualization props</h3>
        <ExportMenu
          data={testData}
          visualization={testVisualization}
          chartElementId="test-chart-1"
          filename="test-export-1"
          onExportStart={handleExportStart}
          onExportComplete={handleExportComplete}
          onExportError={handleExportError}
        />
      </div>

      {/* Test Case 2: With only file prop (should use fallback) */}
      <div className="border p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Test 2: With only file prop (fallback)</h3>
        <ExportMenu
          file={testFile}
          chartElementId="test-chart-2"
          filename="test-export-2"
          onExportStart={handleExportStart}
          onExportComplete={handleExportComplete}
          onExportError={handleExportError}
        />
      </div>

      {/* Test Case 3: With no data (should handle gracefully) */}
      <div className="border p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Test 3: With no data (should handle gracefully)</h3>
        <ExportMenu
          chartElementId="test-chart-3"
          filename="test-export-3"
          onExportStart={handleExportStart}
          onExportComplete={handleExportComplete}
          onExportError={handleExportError}
        />
      </div>

      {/* Test charts for export testing */}
      <div className="space-y-4">
        <div id="test-chart-1" className="w-64 h-32 bg-blue-100 border rounded flex items-center justify-center">
          Test Chart 1
        </div>
        <div id="test-chart-2" className="w-64 h-32 bg-green-100 border rounded flex items-center justify-center">
          Test Chart 2
        </div>
        <div id="test-chart-3" className="w-64 h-32 bg-red-100 border rounded flex items-center justify-center">
          Test Chart 3
        </div>
      </div>
    </div>
  );
};

export default ExportMenuTest;
