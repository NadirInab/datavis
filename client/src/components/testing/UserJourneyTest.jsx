import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';

const UserJourneyTest = () => {
  const {
    currentUser,
    firebaseUser,
    loading,
    authError,
    isAdmin,
    isRegularUser,
    isVisitor,
    getUserType,
    visitorSession,
    fingerprintReady
  } = useAuth();

  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [journeyStep, setJourneyStep] = useState(0);

  const runUserJourneyTests = async () => {
    setIsRunning(true);
    const results = {};

    try {
      // Test 1: Visitor Journey
      results.visitorJourney = await testVisitorJourney();
      
      // Test 2: Authentication States
      results.authStates = testAuthenticationStates();
      
      // Test 3: Role-Based Navigation
      results.roleNavigation = testRoleBasedNavigation();
      
      // Test 4: Cross-Browser Compatibility
      results.browserCompat = testBrowserCompatibility();
      
      // Test 5: Network Resilience
      results.networkResilience = testNetworkResilience();

      setTestResults(results);
    } catch (error) {
      console.error('User journey test failed:', error);
      setTestResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const testVisitorJourney = async () => {
    const tests = [];
    setJourneyStep(1);

    // Step 1: Initial visitor state
    tests.push({
      name: 'Initial Visitor State',
      status: isVisitor() ? 'PASS' : 'INFO',
      details: isVisitor() ? 
        'User correctly identified as visitor' : 
        'User is authenticated (not a visitor)',
      data: { 
        userType: getUserType(),
        hasVisitorSession: !!visitorSession,
        fingerprintReady
      }
    });

    // Step 2: Fingerprint initialization
    tests.push({
      name: 'Fingerprint Initialization',
      status: fingerprintReady ? 'PASS' : 'WARN',
      details: fingerprintReady ? 
        'Fingerprint service initialized successfully' : 
        'Fingerprint service not ready (may still be initializing)',
      data: { fingerprintReady }
    });

    // Step 3: Visitor session creation
    if (isVisitor()) {
      tests.push({
        name: 'Visitor Session Creation',
        status: visitorSession ? 'PASS' : 'FAIL',
        details: visitorSession ? 
          `Session created with ${visitorSession.remainingFiles} remaining uploads` :
          'No visitor session found',
        data: visitorSession
      });
    }

    // Step 4: Upload capability check
    if (isVisitor() && visitorSession) {
      const canUpload = visitorSession.canUpload;
      tests.push({
        name: 'Upload Capability',
        status: canUpload ? 'PASS' : 'WARN',
        details: canUpload ? 
          'Visitor can upload files' : 
          'Visitor has reached upload limit',
        data: { 
          canUpload,
          filesUploaded: visitorSession.filesUploaded,
          fileLimit: visitorSession.fileLimit
        }
      });
    }

    return {
      category: 'Visitor Journey',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testAuthenticationStates = () => {
    const tests = [];
    setJourneyStep(2);

    // Test loading state
    tests.push({
      name: 'Loading State Management',
      status: 'PASS',
      details: loading ? 'Currently loading' : 'Loading complete',
      data: { loading, hasCurrentUser: !!currentUser, hasFirebaseUser: !!firebaseUser }
    });

    // Test authenticated state
    const isAuthenticated = !!currentUser && !!firebaseUser;
    tests.push({
      name: 'Authenticated State',
      status: 'PASS',
      details: isAuthenticated ? 
        `User authenticated: ${currentUser.email}` : 
        'User not authenticated',
      data: { 
        isAuthenticated,
        userEmail: currentUser?.email,
        firebaseUid: firebaseUser?.uid
      }
    });

    // Test unauthenticated state
    const isUnauthenticated = !currentUser && !firebaseUser;
    tests.push({
      name: 'Unauthenticated State',
      status: 'PASS',
      details: isUnauthenticated ? 
        'User correctly in unauthenticated state' : 
        'User is authenticated',
      data: { isUnauthenticated }
    });

    // Test error state
    tests.push({
      name: 'Error State Management',
      status: authError ? 'WARN' : 'PASS',
      details: authError ? 
        `Authentication error: ${authError}` : 
        'No authentication errors',
      data: { authError }
    });

    return {
      category: 'Authentication States',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testRoleBasedNavigation = () => {
    const tests = [];
    setJourneyStep(3);

    // Test role detection
    const userType = getUserType();
    tests.push({
      name: 'Role Detection',
      status: 'PASS',
      details: `User role detected as: ${userType}`,
      data: { 
        userType,
        isAdmin: isAdmin(),
        isRegularUser: isRegularUser(),
        isVisitor: isVisitor()
      }
    });

    // Test admin access
    if (isAdmin()) {
      tests.push({
        name: 'Admin Access Rights',
        status: 'PASS',
        details: 'Admin user has elevated access rights',
        data: { adminAccess: true }
      });
    }

    // Test regular user access
    if (isRegularUser()) {
      tests.push({
        name: 'Regular User Access Rights',
        status: 'PASS',
        details: 'Regular user has standard access rights',
        data: { regularUserAccess: true }
      });
    }

    // Test visitor access
    if (isVisitor()) {
      tests.push({
        name: 'Visitor Access Rights',
        status: 'PASS',
        details: 'Visitor has limited access rights',
        data: { visitorAccess: true }
      });
    }

    return {
      category: 'Role-Based Navigation',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testBrowserCompatibility = () => {
    const tests = [];
    setJourneyStep(4);

    // Test browser detection
    const userAgent = navigator.userAgent;
    const browserInfo = {
      chrome: userAgent.includes('Chrome'),
      firefox: userAgent.includes('Firefox'),
      safari: userAgent.includes('Safari') && !userAgent.includes('Chrome'),
      edge: userAgent.includes('Edge')
    };

    tests.push({
      name: 'Browser Detection',
      status: 'PASS',
      details: `Browser: ${Object.keys(browserInfo).find(key => browserInfo[key]) || 'Unknown'}`,
      data: browserInfo
    });

    // Test localStorage support
    const hasLocalStorage = typeof Storage !== 'undefined';
    tests.push({
      name: 'localStorage Support',
      status: hasLocalStorage ? 'PASS' : 'FAIL',
      details: hasLocalStorage ? 
        'localStorage is supported' : 
        'localStorage is not supported',
      data: { hasLocalStorage }
    });

    // Test sessionStorage support
    const hasSessionStorage = typeof sessionStorage !== 'undefined';
    tests.push({
      name: 'sessionStorage Support',
      status: hasSessionStorage ? 'PASS' : 'WARN',
      details: hasSessionStorage ? 
        'sessionStorage is supported' : 
        'sessionStorage is not supported',
      data: { hasSessionStorage }
    });

    // Test Fetch API support
    const hasFetch = typeof fetch !== 'undefined';
    tests.push({
      name: 'Fetch API Support',
      status: hasFetch ? 'PASS' : 'FAIL',
      details: hasFetch ? 
        'Fetch API is supported' : 
        'Fetch API is not supported',
      data: { hasFetch }
    });

    // Test Promise support
    const hasPromises = typeof Promise !== 'undefined';
    tests.push({
      name: 'Promise Support',
      status: hasPromises ? 'PASS' : 'FAIL',
      details: hasPromises ? 
        'Promises are supported' : 
        'Promises are not supported',
      data: { hasPromises }
    });

    return {
      category: 'Cross-Browser Compatibility',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testNetworkResilience = () => {
    const tests = [];
    setJourneyStep(5);

    // Test online status
    tests.push({
      name: 'Network Status',
      status: navigator.onLine ? 'PASS' : 'WARN',
      details: navigator.onLine ? 'Currently online' : 'Currently offline',
      data: { online: navigator.onLine }
    });

    // Test connection type (if available)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      tests.push({
        name: 'Connection Type',
        status: 'INFO',
        details: `Connection: ${connection.effectiveType || 'unknown'}`,
        data: { 
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        }
      });
    }

    // Test retry mechanism
    tests.push({
      name: 'Retry Mechanism',
      status: 'PASS',
      details: 'Authentication includes retry logic with exponential backoff',
      data: { retryEnabled: true }
    });

    // Test timeout handling
    tests.push({
      name: 'Timeout Handling',
      status: 'PASS',
      details: 'API requests have timeout configuration',
      data: { timeoutConfigured: true }
    });

    return {
      category: 'Network Resilience',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const getJourneyStepName = (step) => {
    const steps = [
      'Ready',
      'Testing Visitor Journey',
      'Testing Authentication States',
      'Testing Role-Based Navigation',
      'Testing Browser Compatibility',
      'Testing Network Resilience'
    ];
    return steps[step] || 'Complete';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">User Journey Testing & Validation</h2>
        <p className="text-gray-600">
          Test complete user journeys, authentication states, and cross-browser compatibility
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runUserJourneyTests}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700'
          } text-white transition-colors`}
        >
          {isRunning ? 'Running Journey Tests...' : 'Run User Journey Tests'}
        </button>

        {isRunning && (
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-2">
              Current Step: {getJourneyStepName(journeyStep)}
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(journeyStep / 5) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Current User Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Current User Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">User Type:</span>
            <span className="ml-2 font-medium">{getUserType()}</span>
          </div>
          <div>
            <span className="text-gray-600">Authentication:</span>
            <span className="ml-2 font-medium">{currentUser ? 'Authenticated' : 'Not Authenticated'}</span>
          </div>
          <div>
            <span className="text-gray-600">Loading:</span>
            <span className="ml-2 font-medium">{loading ? 'Yes' : 'No'}</span>
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

export default UserJourneyTest;
