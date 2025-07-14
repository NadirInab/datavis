import React, { useState } from 'react';
import { authAPI, userAPI, fileAPI } from '../../services/api';
import { useAuth } from '../../context/FirebaseAuthContext';

const BackendAudit = () => {
  const { currentUser, getVisitorId } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const runBackendAudit = async () => {
    setIsRunning(true);
    const results = {};

    try {
      // Test 1: Authentication Endpoints
      results.authentication = await testAuthenticationEndpoints();
      
      // Test 2: Visitor Endpoints
      results.visitor = await testVisitorEndpoints();
      
      // Test 3: User Endpoints
      results.user = await testUserEndpoints();
      
      // Test 4: File Endpoints
      results.file = await testFileEndpoints();
      
      // Test 5: Rate Limiting
      results.rateLimiting = await testRateLimiting();

      setTestResults(results);
    } catch (error) {
      console.error('Backend audit failed:', error);
      setTestResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const testAuthenticationEndpoints = async () => {
    const tests = [];

    // Test health endpoint
    try {
      const response = await fetch('http://localhost:5001/health');
      const data = await response.json();
      tests.push({
        name: 'Health Endpoint',
        status: response.ok ? 'PASS' : 'FAIL',
        details: response.ok ? `Server status: ${data.status}` : 'Health check failed',
        data: data
      });
    } catch (error) {
      tests.push({
        name: 'Health Endpoint',
        status: 'FAIL',
        details: `Connection failed: ${error.message}`,
        data: { error: error.message }
      });
    }

    // Test visitor info endpoint
    try {
      const response = await authAPI.getVisitorInfo();
      tests.push({
        name: 'Visitor Info Endpoint',
        status: response.success ? 'PASS' : 'WARN',
        details: response.success ? 'Visitor info retrieved' : 'Visitor info failed',
        data: response
      });
    } catch (error) {
      tests.push({
        name: 'Visitor Info Endpoint',
        status: 'WARN',
        details: `Expected for unauthenticated requests: ${error.message}`,
        data: { error: error.message }
      });
    }

    return {
      category: 'Authentication Endpoints',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testVisitorEndpoints = async () => {
    const tests = [];

    // Test visitor session creation
    try {
      const visitorId = await getVisitorId();
      tests.push({
        name: 'Visitor ID Generation',
        status: visitorId ? 'PASS' : 'FAIL',
        details: visitorId ? `Visitor ID: ${visitorId}` : 'Failed to generate visitor ID',
        data: { visitorId }
      });
    } catch (error) {
      tests.push({
        name: 'Visitor ID Generation',
        status: 'FAIL',
        details: `Error: ${error.message}`,
        data: { error: error.message }
      });
    }

    return {
      category: 'Visitor Endpoints',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testUserEndpoints = async () => {
    const tests = [];

    if (currentUser) {
      // Test user dashboard endpoint
      try {
        const response = await userAPI.getDashboard();
        tests.push({
          name: 'User Dashboard',
          status: response.success ? 'PASS' : 'FAIL',
          details: response.success ? 'Dashboard data retrieved' : 'Dashboard failed',
          data: response
        });
      } catch (error) {
        tests.push({
          name: 'User Dashboard',
          status: 'FAIL',
          details: `Error: ${error.message}`,
          data: { error: error.message }
        });
      }

      // Test user files endpoint
      try {
        const response = await userAPI.getFiles();
        tests.push({
          name: 'User Files',
          status: response.success ? 'PASS' : 'FAIL',
          details: response.success ? `Found ${response.data?.files?.length || 0} files` : 'Files retrieval failed',
          data: response
        });
      } catch (error) {
        tests.push({
          name: 'User Files',
          status: 'FAIL',
          details: `Error: ${error.message}`,
          data: { error: error.message }
        });
      }
    } else {
      tests.push({
        name: 'User Endpoints',
        status: 'INFO',
        details: 'Not applicable - no authenticated user',
        data: { userType: 'visitor' }
      });
    }

    return {
      category: 'User Endpoints',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testFileEndpoints = async () => {
    const tests = [];

    // Test file upload validation (without actually uploading)
    tests.push({
      name: 'File Upload Validation',
      status: 'INFO',
      details: 'File upload validation requires actual file upload test',
      data: { note: 'Manual testing required' }
    });

    return {
      category: 'File Endpoints',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testRateLimiting = async () => {
    const tests = [];

    // Test rate limiting by making multiple requests
    try {
      const requests = Array(5).fill().map(() =>
        fetch('http://localhost:5001/health').then(r => r.status)
      );
      
      const responses = await Promise.all(requests);
      const allSuccessful = responses.every(status => status === 200);
      
      tests.push({
        name: 'Rate Limiting Test',
        status: allSuccessful ? 'PASS' : 'WARN',
        details: allSuccessful ? 
          'Multiple requests handled successfully' : 
          'Some requests were rate limited',
        data: { responses }
      });
    } catch (error) {
      tests.push({
        name: 'Rate Limiting Test',
        status: 'FAIL',
        details: `Error: ${error.message}`,
        data: { error: error.message }
      });
    }

    return {
      category: 'Rate Limiting',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Backend API Audit</h2>
        <p className="text-gray-600">
          Test backend endpoints, authentication, and API functionality
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runBackendAudit}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
        >
          {isRunning ? 'Running Backend Audit...' : 'Run Backend Audit'}
        </button>
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Backend Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">API Base URL:</span>
            <span className="ml-2 font-medium">http://localhost:5001/api/v1</span>
          </div>
          <div>
            <span className="text-gray-600">User Status:</span>
            <span className="ml-2 font-medium">{currentUser ? 'Authenticated' : 'Visitor'}</span>
          </div>
          <div>
            <span className="text-gray-600">Auth Token:</span>
            <span className="ml-2 font-medium">{localStorage.getItem('authToken') ? 'Present' : 'None'}</span>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="space-y-6">
          {Object.entries(testResults).map(([key, result]) => (
            <TestResultSection key={key} result={result} />
          ))}
        </div>
      )}
    </div>
  );
};

const TestResultSection = ({ result }) => {
  if (!result || !result.tests) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS': return 'text-green-600 bg-green-50';
      case 'FAIL': return 'text-red-600 bg-red-50';
      case 'WARN': return 'text-yellow-600 bg-yellow-50';
      case 'INFO': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{result.category}</h3>
      <p className="text-sm text-gray-600 mb-4">{result.summary}</p>
      
      <div className="space-y-2">
        {result.tests.map((test, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded border">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(test.status)}`}>
                  {test.status}
                </span>
                <span className="font-medium">{test.name}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{test.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BackendAudit;
