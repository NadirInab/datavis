import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const DatabaseManagerTest = () => {
  const { currentUser } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState({});

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  });

  const testEndpoint = async (endpoint, name) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          success: data.success,
          data: data.data || data.message
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [name]: {
          status: 'error',
          success: false,
          error: error.message
        }
      }));
    }
  };

  const runTests = async () => {
    setLoading(true);
    setError(null);
    setTestResults({});

    try {
      await testEndpoint('/admin/db/status', 'Database Status');
      await testEndpoint('/admin/db/stats', 'Database Stats');
      await testEndpoint('/admin/db/migrations', 'Migrations');
      await testEndpoint('/admin/db/performance', 'Performance');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#5A827E]">Database Manager Test</h1>
          <p className="text-[#5A827E]/70 mt-1">Testing database endpoints and functionality</p>
        </div>
        <Button
          onClick={runTests}
          disabled={loading}
          icon={loading ? Icons.Loader : Icons.ArrowRight}
          variant="outline"
        >
          {loading ? 'Testing...' : 'Run Tests'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icons.AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(testResults).map(([name, result]) => (
          <Card key={name} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[#5A827E]">{name}</h3>
              <div className={`w-3 h-3 rounded-full ${
                result.success ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
            <div className="text-sm space-y-1">
              <div>Status: <span className="font-mono">{result.status}</span></div>
              <div>Success: <span className="font-mono">{result.success?.toString()}</span></div>
              {result.error && (
                <div className="text-red-600">Error: {result.error}</div>
              )}
              {result.data && (
                <div className="mt-2">
                  <div className="text-xs text-[#5A827E]/70">Response:</div>
                  <pre className="text-xs bg-[#FAFFCA]/30 p-2 rounded mt-1 overflow-auto max-h-32">
                    {typeof result.data === 'object' 
                      ? JSON.stringify(result.data, null, 2)
                      : result.data
                    }
                  </pre>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Icon Test */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-[#5A827E] mb-4">Icon Test</h2>
        <div className="grid grid-cols-6 gap-4">
          {[
            'Database', 'Table', 'ArrowUp', 'ArrowLeft', 'Activity', 'TrendingUp',
            'Plus', 'Crown', 'User', 'Upload', 'CreditCard', 'Eye', 'Trash',
            'AlertCircle', 'Check', 'Loader', 'ArrowRight', 'X'
          ].map(iconName => {
            const IconComponent = Icons[iconName];
            return (
              <div key={iconName} className="flex flex-col items-center space-y-1">
                {IconComponent ? (
                  <IconComponent className="w-6 h-6 text-[#5A827E]" />
                ) : (
                  <div className="w-6 h-6 bg-red-200 rounded flex items-center justify-center">
                    <span className="text-xs text-red-600">?</span>
                  </div>
                )}
                <span className="text-xs text-center">{iconName}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Authentication Test */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-[#5A827E] mb-4">Authentication Test</h2>
        <div className="space-y-2">
          <div>Current User: {currentUser?.email || 'Not logged in'}</div>
          <div>Auth Token: {localStorage.getItem('authToken') ? 'Present' : 'Missing'}</div>
          <div>API Base: {API_BASE}</div>
        </div>
      </Card>
    </div>
  );
};

export default DatabaseManagerTest;
