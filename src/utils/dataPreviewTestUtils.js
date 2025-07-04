// Data Preview Testing Utilities

export const createEdgeCaseTestData = () => {
  return [
    // Test case 1: Normal data
    {
      name: 'Normal Data',
      data: [
        { Name: 'John', Age: 30, City: 'New York' },
        { Name: 'Jane', Age: 25, City: 'Los Angeles' },
        { Name: 'Bob', Age: 35, City: 'Chicago' }
      ],
      columnTypes: {
        'Name': 'string',
        'Age': 'number',
        'City': 'string'
      }
    },
    
    // Test case 2: Data with null values
    {
      name: 'Data with Nulls',
      data: [
        { Name: 'John', Age: null, City: 'New York' },
        { Name: null, Age: 25, City: null },
        { Name: 'Bob', Age: undefined, City: 'Chicago' }
      ],
      columnTypes: {
        'Name': 'string',
        'Age': 'number',
        'City': 'string'
      }
    },
    
    // Test case 3: Data with special characters
    {
      name: 'Special Characters',
      data: [
        { 'Name@#$': 'John', 'Age%^&': 30, 'City*()': 'New York' },
        { 'Name@#$': 'Jane', 'Age%^&': 25, 'City*()': 'Los Angeles' }
      ],
      columnTypes: {
        'Name@#$': 'string',
        'Age%^&': 'number',
        'City*()': 'string'
      }
    },
    
    // Test case 4: Data with very long values
    {
      name: 'Long Values',
      data: [
        { 
          Name: 'John', 
          Description: 'This is a very long description that should be truncated in the table view to prevent layout issues and ensure good user experience',
          Code: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.repeat(5)
        }
      ],
      columnTypes: {
        'Name': 'string',
        'Description': 'string',
        'Code': 'string'
      }
    },
    
    // Test case 5: Data with missing column types
    {
      name: 'Missing Column Types',
      data: [
        { Name: 'John', Age: 30, City: 'New York' },
        { Name: 'Jane', Age: 25, City: 'Los Angeles' }
      ],
      columnTypes: null
    },
    
    // Test case 6: Data with partial column types
    {
      name: 'Partial Column Types',
      data: [
        { Name: 'John', Age: 30, City: 'New York' },
        { Name: 'Jane', Age: 25, City: 'Los Angeles' }
      ],
      columnTypes: {
        'Name': 'string'
        // Missing Age and City types
      }
    },
    
    // Test case 7: Data with invalid column types
    {
      name: 'Invalid Column Types',
      data: [
        { Name: 'John', Age: 30, City: 'New York' }
      ],
      columnTypes: {
        'Name': null,
        'Age': undefined,
        'City': 123 // Invalid type
      }
    },
    
    // Test case 8: Empty data
    {
      name: 'Empty Data',
      data: [],
      columnTypes: {}
    },
    
    // Test case 9: Data with inconsistent structure
    {
      name: 'Inconsistent Structure',
      data: [
        { Name: 'John', Age: 30 },
        { Name: 'Jane', City: 'Los Angeles' },
        { Age: 25, City: 'Chicago', Country: 'USA' }
      ],
      columnTypes: {
        'Name': 'string',
        'Age': 'number',
        'City': 'string'
      }
    },
    
    // Test case 10: Data with complex objects
    {
      name: 'Complex Objects',
      data: [
        { 
          Name: 'John', 
          Details: { age: 30, city: 'New York' },
          Tags: ['developer', 'javascript']
        }
      ],
      columnTypes: {
        'Name': 'string',
        'Details': 'object',
        'Tags': 'array'
      }
    }
  ];
};

export const testDataPreviewRendering = (testCase) => {
  console.log(`=== Testing: ${testCase.name} ===`);
  
  const results = {
    name: testCase.name,
    success: true,
    errors: [],
    warnings: []
  };
  
  try {
    // Test 1: Data structure validation
    if (!Array.isArray(testCase.data)) {
      results.errors.push('Data is not an array');
      results.success = false;
    }
    
    // Test 2: Column extraction
    let headers = [];
    if (testCase.data.length > 0) {
      try {
        headers = Object.keys(testCase.data[0] || {});
        if (headers.length === 0) {
          results.warnings.push('No headers found in first row');
        }
      } catch (error) {
        results.errors.push(`Header extraction failed: ${error.message}`);
        results.success = false;
      }
    }
    
    // Test 3: Column type validation
    if (testCase.columnTypes) {
      try {
        if (typeof testCase.columnTypes !== 'object') {
          results.errors.push('Column types is not an object');
          results.success = false;
        } else {
          headers.forEach(header => {
            const columnType = testCase.columnTypes[header];
            if (columnType !== null && columnType !== undefined && typeof columnType !== 'string') {
              results.warnings.push(`Invalid column type for ${header}: ${typeof columnType}`);
            }
          });
        }
      } catch (error) {
        results.errors.push(`Column type validation failed: ${error.message}`);
        results.success = false;
      }
    }
    
    // Test 4: Cell value processing
    testCase.data.slice(0, 5).forEach((row, rowIndex) => {
      try {
        if (row && typeof row === 'object') {
          Object.values(row).forEach((cell, cellIndex) => {
            try {
              const cellValue = cell !== null && cell !== undefined ? String(cell) : '—';
              if (cellValue.length > 1000) {
                results.warnings.push(`Very long cell value at row ${rowIndex}, cell ${cellIndex}`);
              }
            } catch (error) {
              results.errors.push(`Cell processing failed at row ${rowIndex}, cell ${cellIndex}: ${error.message}`);
              results.success = false;
            }
          });
        } else {
          results.warnings.push(`Invalid row structure at index ${rowIndex}`);
        }
      } catch (error) {
        results.errors.push(`Row processing failed at index ${rowIndex}: ${error.message}`);
        results.success = false;
      }
    });
    
    console.log(`✅ Test completed: ${results.success ? 'PASS' : 'FAIL'}`);
    if (results.errors.length > 0) {
      console.log('❌ Errors:', results.errors);
    }
    if (results.warnings.length > 0) {
      console.log('⚠️ Warnings:', results.warnings);
    }
    
  } catch (error) {
    results.success = false;
    results.errors.push(`Test execution failed: ${error.message}`);
    console.error('❌ Test execution failed:', error);
  }
  
  return results;
};

export const runAllDataPreviewTests = () => {
  console.log('=== Running All Data Preview Tests ===');
  
  const testCases = createEdgeCaseTestData();
  const results = testCases.map(testCase => testDataPreviewRendering(testCase));
  
  const summary = {
    total: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    warnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
    errors: results.reduce((sum, r) => sum + r.errors.length, 0)
  };
  
  console.log('=== Test Summary ===');
  console.log(`Total Tests: ${summary.total}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Warnings: ${summary.warnings}`);
  console.log(`Errors: ${summary.errors}`);
  
  return { results, summary };
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  window.dataPreviewDebug = {
    createEdgeCaseTestData,
    testDataPreviewRendering,
    runAllDataPreviewTests
  };
}
