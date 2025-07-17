import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Share2, TestTube, CheckCircle, AlertCircle, 
  User, Globe, Copy, ExternalLink 
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAuth } from '../../context/FirebaseAuthContext';

/**
 * Share Test Panel
 * Development component to test share functionality
 */
const ShareTestPanel = () => {
  const { currentUser } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (test, status, message, data = null) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      test,
      status,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runAuthTest = async () => {
    addTestResult('Authentication Check', 'running', 'Checking user authentication...');
    
    try {
      if (!currentUser) {
        addTestResult('Authentication Check', 'error', 'No user logged in');
        return false;
      }

      // Test token retrieval using proper Firebase auth
      let token = '';
      try {
        // Try to get token from Firebase auth directly
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const firebaseUser = auth.currentUser;

        if (firebaseUser) {
          token = await firebaseUser.getIdToken(true);
          addTestResult('Authentication Check', 'success', 'Firebase ID token retrieved successfully');
        } else if (currentUser?.accessToken) {
          token = currentUser.accessToken;
          addTestResult('Authentication Check', 'success', 'Access token found');
        } else {
          addTestResult('Authentication Check', 'warning', 'Using mock token for development');
          token = `mock-token-${currentUser.id || currentUser.uid || 'test'}`;
        }
      } catch (tokenError) {
        addTestResult('Authentication Check', 'error', `Token retrieval failed: ${tokenError.message}`);
        return false;
      }

      return token;
    } catch (error) {
      addTestResult('Authentication Check', 'error', `Auth failed: ${error.message}`);
      return false;
    }
  };

  const runServerTest = async () => {
    addTestResult('Server Connection', 'running', 'Testing backend server...');
    
    try {
      const response = await fetch('/api/v1/health', {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        addTestResult('Server Connection', 'success', 'Backend server is running');
        return true;
      } else {
        addTestResult('Server Connection', 'error', `Server error: ${response.status}`);
        return false;
      }
    } catch (error) {
      addTestResult('Server Connection', 'error', `Connection failed: ${error.message}`);
      return false;
    }
  };

  const runShareTest = async (token) => {
    addTestResult('Share API Test', 'running', 'Testing share link creation...');
    
    try {
      const testSettings = {
        defaultAccess: 'view',
        allowAnonymous: true,
        requireAuth: false,
        expiresAt: null
      };

      const response = await fetch('/api/v1/sharing/test-file-id/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testSettings)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        addTestResult('Share API Test', 'success', 'Share link created successfully', data.shareInfo);
        return data.shareInfo;
      } else {
        addTestResult('Share API Test', 'error', data.message || 'Share creation failed');
        return false;
      }
    } catch (error) {
      addTestResult('Share API Test', 'error', `API error: ${error.message}`);
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Test 1: Authentication
      const token = await runAuthTest();
      if (!token) {
        setIsRunning(false);
        return;
      }

      // Test 2: Server Connection
      const serverOk = await runServerTest();
      if (!serverOk) {
        setIsRunning(false);
        return;
      }

      // Test 3: Share API
      const shareResult = await runShareTest(token);
      
      if (shareResult) {
        addTestResult('Complete Test', 'success', 'All tests passed! Share functionality is working.');
      } else {
        addTestResult('Complete Test', 'error', 'Share functionality has issues.');
      }
    } catch (error) {
      addTestResult('Complete Test', 'error', `Test suite failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'running': return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'running': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TestTube className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Share Feature Test Panel</h3>
              <p className="text-sm text-gray-500">Test authentication and share functionality</p>
            </div>
          </div>
          
          <Button
            onClick={runAllTests}
            variant="primary"
            loading={isRunning}
            icon={TestTube}
            disabled={isRunning}
          >
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </Button>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <User className="w-5 h-5 text-gray-500" />
          <div>
            <div className="font-medium text-gray-900">
              {currentUser ? currentUser.displayName || currentUser.email || 'Authenticated User' : 'Not signed in'}
            </div>
            <div className="text-sm text-gray-500">
              {currentUser ? `UID: ${currentUser.uid}` : 'Please sign in to test share functionality'}
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Test Results</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 border rounded-lg ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{result.test}</div>
                        <div className="text-sm text-gray-600 mt-1">{result.message}</div>
                        {result.data && (
                          <div className="mt-2 p-2 bg-white rounded border text-xs font-mono">
                            <div>Share URL: {result.data.shareUrl}</div>
                            <div>Token: {result.data.shareToken}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{result.timestamp}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => window.open('/app/files', '_blank')}
              variant="outline"
              size="sm"
              icon={ExternalLink}
            >
              Open Files Page
            </Button>
            <Button
              onClick={() => window.open('/test/share-guide', '_blank')}
              variant="outline"
              size="sm"
              icon={Share2}
            >
              Share Guide
            </Button>
            <Button
              onClick={() => navigator.clipboard.writeText(window.location.origin + '/test/share-test')}
              variant="outline"
              size="sm"
              icon={Copy}
            >
              Copy Test URL
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ShareTestPanel;
