import React, { useState } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { testAPI } from '../../services/api';
import Button from '../ui/Button';

const AuthTest = () => {
  const { currentUser, firebaseUser, visitorSession, loading } = useAuth();
  const [testResults, setTestResults] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  // Only show in development
  if (import.meta.env.VITE_APP_ENVIRONMENT !== 'development') {
    return null;
  }

  const runFirebaseConfigTest = async () => {
    setTestLoading(true);
    try {
      const result = await testAPI.testFirebaseConfig();
      setTestResults({ type: 'config', data: result });
    } catch (error) {
      setTestResults({ type: 'config', error: error.message });
    } finally {
      setTestLoading(false);
    }
  };

  const runAuthTest = async () => {
    if (!firebaseUser) {
      setTestResults({ type: 'auth', error: 'No Firebase user found. Please sign in first.' });
      return;
    }

    setTestLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const result = await testAPI.testFirebaseAuth(token);
      setTestResults({ type: 'auth', data: result });
    } catch (error) {
      setTestResults({ type: 'auth', error: error.message });
    } finally {
      setTestLoading(false);
    }
  };

  const runVisitorTest = async () => {
    setTestLoading(true);
    try {
      const result = await testAPI.testVisitorSession();
      setTestResults({ type: 'visitor', data: result });
    } catch (error) {
      setTestResults({ type: 'visitor', error: error.message });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">🔧 Auth Debug</h3>
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">DEV</span>
      </div>

      {/* Current State */}
      <div className="space-y-2 mb-4 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Auth State:</span>
          <span className={`font-medium ${loading ? 'text-yellow-600' : currentUser ? 'text-green-600' : 'text-red-600'}`}>
            {loading ? 'Loading...' : currentUser ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </div>
        
        {currentUser && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">User:</span>
              <span className="font-medium text-gray-900 truncate max-w-32">{currentUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Role:</span>
              <span className="font-medium text-blue-600">{currentUser.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subscription:</span>
              <span className="font-medium text-purple-600">{currentUser.subscription}</span>
            </div>
          </>
        )}

        {visitorSession && !currentUser && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">Visitor Files:</span>
              <span className="font-medium text-orange-600">
                {visitorSession.filesUploaded}/{visitorSession.fileLimit}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Test Buttons */}
      <div className="space-y-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={runFirebaseConfigTest}
          disabled={testLoading}
        >
          Test Firebase Config
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={runAuthTest}
          disabled={testLoading || !firebaseUser}
        >
          Test Auth Token
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={runVisitorTest}
          disabled={testLoading}
        >
          Test Visitor Session
        </Button>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">
              {testResults.type.charAt(0).toUpperCase() + testResults.type.slice(1)} Test
            </span>
            <button
              onClick={() => setTestResults(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {testResults.error ? (
            <div className="text-red-600 bg-red-50 p-2 rounded">
              <strong>Error:</strong> {testResults.error}
            </div>
          ) : (
            <div className="text-green-600 bg-green-50 p-2 rounded">
              <strong>Success:</strong> Test completed successfully
              {testResults.data?.data && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-gray-600">View Details</summary>
                  <pre className="mt-1 text-xs text-gray-800 overflow-auto max-h-32">
                    {JSON.stringify(testResults.data.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthTest;
