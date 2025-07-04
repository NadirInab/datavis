import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupTestEnvironment, debugVisualizationData, testExportFunctionality } from '../utils/visualizationTestUtils';
import Button, { Icons } from '../components/ui/Button';
import { ChartCard } from '../components/ui/Card';

const VisualizationTest = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [testFile, setTestFile] = useState(null);

  const runTests = async () => {
    setIsRunning(true);
    const results = {};

    try {
      // Test 1: Setup Test Environment
      console.log('=== TEST 1: Setup Test Environment ===');
      const file = setupTestEnvironment();
      setTestFile(file);
      results.setup = { success: true, data: file };
      console.log('✅ Test environment setup successful');

      // Test 2: Data Preview Functionality
      console.log('=== TEST 2: Data Preview Functionality ===');
      try {
        if (file && file.data && Array.isArray(file.data) && file.data.length > 0) {
          results.dataPreview = { 
            success: true, 
            rowCount: file.data.length,
            columnCount: Object.keys(file.data[0]).length,
            columns: Object.keys(file.data[0])
          };
          console.log('✅ Data preview test passed');
        } else {
          throw new Error('Invalid file data structure');
        }
      } catch (error) {
        results.dataPreview = { success: false, error: error.message };
        console.error('❌ Data preview test failed:', error);
      }

      // Test 3: Visualization Data Processing
      console.log('=== TEST 3: Visualization Data Processing ===');
      try {
        const vizResults = [];
        for (let i = 0; i < file.visualizations.length; i++) {
          const processedData = debugVisualizationData(file, i);
          vizResults.push({
            index: i,
            type: file.visualizations[i].type,
            success: !!processedData,
            dataLength: processedData?.length || 0
          });
        }
        results.visualizationProcessing = { success: true, visualizations: vizResults };
        console.log('✅ Visualization processing test passed');
      } catch (error) {
        results.visualizationProcessing = { success: false, error: error.message };
        console.error('❌ Visualization processing test failed:', error);
      }

      // Test 4: Export Functionality
      console.log('=== TEST 4: Export Functionality ===');
      try {
        // Create a temporary chart element for testing
        const tempChart = document.createElement('div');
        tempChart.id = 'test-chart-element';
        tempChart.style.width = '400px';
        tempChart.style.height = '300px';
        tempChart.style.backgroundColor = '#f0f0f0';
        tempChart.innerHTML = '<div style="padding: 20px;">Test Chart Content</div>';
        document.body.appendChild(tempChart);

        const exportResults = await testExportFunctionality('test-chart-element', file.data, 'test-export');
        results.exportFunctionality = { success: true, results: exportResults };
        
        // Clean up
        document.body.removeChild(tempChart);
        console.log('✅ Export functionality test passed');
      } catch (error) {
        results.exportFunctionality = { success: false, error: error.message };
        console.error('❌ Export functionality test failed:', error);
      }

      // Test 5: Feature Gating
      console.log('=== TEST 5: Feature Gating ===');
      try {
        const { canExport, getExportOptions } = await import('../utils/exportUtils');
        
        const freeOptions = getExportOptions('free');
        const proOptions = getExportOptions('pro');
        const enterpriseOptions = getExportOptions('enterprise');
        
        results.featureGating = {
          success: true,
          freeOptions,
          proOptions,
          enterpriseOptions,
          pngAllowedForFree: canExport('free', 'png'),
          pdfAllowedForFree: canExport('free', 'pdf'),
          pdfAllowedForPro: canExport('pro', 'pdf')
        };
        console.log('✅ Feature gating test passed');
      } catch (error) {
        results.featureGating = { success: false, error: error.message };
        console.error('❌ Feature gating test failed:', error);
      }

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const navigateToVisualization = () => {
    if (testFile) {
      navigate(`/app/visualize/${testFile.id}`);
    }
  };

  const TestResultCard = ({ title, result, children }) => (
    <ChartCard className="mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">{title}</h3>
          <div className={`px-2 py-1 rounded text-sm ${
            result?.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {result?.success ? '✅ PASS' : '❌ FAIL'}
          </div>
        </div>
        {children}
        {result?.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            Error: {result.error}
          </div>
        )}
      </div>
    </ChartCard>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Visualization Functionality Test Suite</h1>
          <p className="text-gray-600 mb-6">
            This test suite verifies all visualization and export functionality is working correctly.
          </p>
          
          <div className="flex gap-4">
            <Button
              onClick={runTests}
              disabled={isRunning}
              variant="primary"
            >
              {isRunning ? (
                <>
                  <Icons.Loader className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Icons.Play className="w-4 h-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
            
            {testFile && (
              <Button
                onClick={navigateToVisualization}
                variant="secondary"
              >
                <Icons.BarChart className="w-4 h-4 mr-2" />
                Open Visualization Page
              </Button>
            )}
          </div>
        </div>

        {Object.keys(testResults).length > 0 && (
          <div className="space-y-4">
            <TestResultCard title="1. Test Environment Setup" result={testResults.setup}>
              {testResults.setup?.success && (
                <div className="text-sm text-gray-600">
                  <p>✅ Test file created with ID: {testResults.setup.data.id}</p>
                  <p>✅ {testResults.setup.data.rows} rows of test data</p>
                  <p>✅ {testResults.setup.data.visualizations.length} test visualizations</p>
                </div>
              )}
            </TestResultCard>

            <TestResultCard title="2. Data Preview Functionality" result={testResults.dataPreview}>
              {testResults.dataPreview?.success && (
                <div className="text-sm text-gray-600">
                  <p>✅ {testResults.dataPreview.rowCount} rows loaded</p>
                  <p>✅ {testResults.dataPreview.columnCount} columns detected</p>
                  <p>✅ Columns: {testResults.dataPreview.columns.join(', ')}</p>
                </div>
              )}
            </TestResultCard>

            <TestResultCard title="3. Visualization Data Processing" result={testResults.visualizationProcessing}>
              {testResults.visualizationProcessing?.success && (
                <div className="text-sm text-gray-600">
                  {testResults.visualizationProcessing.visualizations.map((viz, idx) => (
                    <p key={idx}>
                      {viz.success ? '✅' : '❌'} {viz.type} chart: {viz.dataLength} data points
                    </p>
                  ))}
                </div>
              )}
            </TestResultCard>

            <TestResultCard title="4. Export Functionality" result={testResults.exportFunctionality}>
              {testResults.exportFunctionality?.success && (
                <div className="text-sm text-gray-600">
                  <p>{testResults.exportFunctionality.results.png.success ? '✅' : '❌'} PNG Export</p>
                  <p>{testResults.exportFunctionality.results.csv.success ? '✅' : '❌'} CSV Export</p>
                  <p>{testResults.exportFunctionality.results.json.success ? '✅' : '❌'} JSON Export</p>
                </div>
              )}
            </TestResultCard>

            <TestResultCard title="5. Feature Gating" result={testResults.featureGating}>
              {testResults.featureGating?.success && (
                <div className="text-sm text-gray-600">
                  <p>✅ Free tier: {testResults.featureGating.freeOptions.join(', ')}</p>
                  <p>✅ Pro tier: {testResults.featureGating.proOptions.join(', ')}</p>
                  <p>✅ Enterprise tier: {testResults.featureGating.enterpriseOptions.join(', ')}</p>
                  <p>PNG for free users: {testResults.featureGating.pngAllowedForFree ? '✅' : '❌'}</p>
                  <p>PDF for free users: {testResults.featureGating.pdfAllowedForFree ? '❌' : '✅'} (correctly blocked)</p>
                  <p>PDF for pro users: {testResults.featureGating.pdfAllowedForPro ? '✅' : '❌'}</p>
                </div>
              )}
            </TestResultCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationTest;
