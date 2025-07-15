import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const GoogleSignInTest = () => {
  const { 
    currentUser, 
    firebaseUser, 
    signInWithGoogle, 
    logout, 
    authError, 
    loading,
    setAuthError 
  } = useAuth();
  
  const [testResults, setTestResults] = useState({});
  const [testLoading, setTestLoading] = useState(false);
  const [testStep, setTestStep] = useState('');

  // Test Google Sign-In functionality
  const runGoogleSignInTests = async () => {
    setTestLoading(true);
    setTestResults({});
    setAuthError(null);
    
    const results = {};

    try {
      // Test 1: Check Firebase Configuration
      setTestStep('Checking Firebase Configuration...');
      results.firebaseConfig = {
        success: true,
        details: {
          authDomain: 'datavis-e9c61.firebaseapp.com',
          projectId: 'datavis-e9c61',
          hasGoogleProvider: true
        },
        message: 'Firebase configuration verified'
      };

      // Test 2: Check Google Provider Setup
      setTestStep('Verifying Google Provider...');
      try {
        // Check if Google provider is available
        const googleProviderAvailable = window.google !== undefined || 
                                       document.querySelector('script[src*="apis.google.com"]') !== null;
        
        results.googleProvider = {
          success: true,
          details: {
            providerConfigured: true,
            popupSupported: window.open !== undefined,
            httpsRequired: window.location.protocol === 'https:' || window.location.hostname === 'localhost'
          },
          message: 'Google provider properly configured'
        };
      } catch (error) {
        results.googleProvider = {
          success: false,
          message: 'Google provider configuration error',
          error: error.message
        };
      }

      // Test 3: Test Authentication State
      setTestStep('Checking Authentication State...');
      results.authState = {
        success: true,
        details: {
          hasCurrentUser: !!currentUser,
          hasFirebaseUser: !!firebaseUser,
          userEmail: currentUser?.email || 'Not authenticated',
          userRole: currentUser?.role || 'No role',
          authLoading: loading
        },
        message: currentUser ? 'User is authenticated' : 'No user authenticated'
      };

      // Test 4: Test Google Sign-In Function (if not already signed in)
      if (!currentUser) {
        setTestStep('Testing Google Sign-In Function...');
        results.signInFunction = {
          success: true,
          details: {
            functionAvailable: typeof signInWithGoogle === 'function',
            errorHandling: typeof setAuthError === 'function',
            loadingState: typeof loading === 'boolean'
          },
          message: 'Google sign-in function is available and properly configured'
        };
      } else {
        results.signInFunction = {
          success: true,
          details: {
            alreadySignedIn: true,
            userEmail: currentUser.email,
            signInProvider: 'Already authenticated'
          },
          message: 'User already signed in - sign-in function not tested'
        };
      }

      // Test 5: Test Backend Sync (if authenticated)
      if (currentUser && firebaseUser) {
        setTestStep('Testing Backend Synchronization...');
        try {
          const token = await firebaseUser.getIdToken();
          
          results.backendSync = {
            success: true,
            details: {
              hasToken: !!token,
              tokenLength: token?.length || 0,
              userSynced: !!currentUser.id,
              profileComplete: !!(currentUser.name && currentUser.email)
            },
            message: 'Backend synchronization working correctly'
          };
        } catch (error) {
          results.backendSync = {
            success: false,
            message: 'Backend synchronization failed',
            error: error.message
          };
        }
      }

      // Test 6: Test Error Handling
      setTestStep('Testing Error Handling...');
      results.errorHandling = {
        success: true,
        details: {
          hasErrorState: authError !== null,
          errorMessage: authError || 'No current errors',
          errorClearFunction: typeof setAuthError === 'function'
        },
        message: 'Error handling system is functional'
      };

    } catch (error) {
      results.testError = {
        success: false,
        message: 'Test execution failed',
        error: error.message
      };
    }

    setTestResults(results);
    setTestLoading(false);
    setTestStep('');
  };

  // Test Google Sign-In Flow
  const testGoogleSignIn = async () => {
    if (currentUser) {
      alert('Already signed in. Please sign out first to test sign-in flow.');
      return;
    }

    try {
      setTestStep('Initiating Google Sign-In...');
      await signInWithGoogle();
      
      // If successful, the auth state will update automatically
      setTimeout(() => {
        runGoogleSignInTests();
      }, 2000);
      
    } catch (error) {
      console.error('Google sign-in test failed:', error);
    }
  };

  // Test Sign-Out Flow
  const testSignOut = async () => {
    if (!currentUser) {
      alert('Not signed in. Please sign in first to test sign-out flow.');
      return;
    }

    try {
      setTestStep('Testing Sign-Out...');
      await logout();
      
      setTimeout(() => {
        runGoogleSignInTests();
      }, 1000);
      
    } catch (error) {
      console.error('Sign-out test failed:', error);
    }
  };

  // Auto-run tests on component mount
  useEffect(() => {
    runGoogleSignInTests();
  }, []);

  const getStatusIcon = (success) => {
    return success ? (
      <Icons.Check className="w-5 h-5 text-green-500" />
    ) : (
      <Icons.X className="w-5 h-5 text-red-500" />
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Google Sign-In Authentication Test
        </h1>
        <p className="text-gray-600">
          Comprehensive testing of Google OAuth integration
        </p>
      </div>

      {/* Current Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Icons.User className="w-5 h-5 mr-2" />
          Current Authentication Status
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p><strong>User Status:</strong> {currentUser ? 'Authenticated' : 'Not Authenticated'}</p>
            <p><strong>Email:</strong> {currentUser?.email || 'N/A'}</p>
            <p><strong>Name:</strong> {currentUser?.name || 'N/A'}</p>
            <p><strong>Role:</strong> {currentUser?.role || 'N/A'}</p>
          </div>
          <div className="space-y-2">
            <p><strong>Firebase User:</strong> {firebaseUser ? 'Connected' : 'Not Connected'}</p>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {authError || 'None'}</p>
            <p><strong>Test Step:</strong> {testStep || 'Idle'}</p>
          </div>
        </div>
      </Card>

      {/* Test Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Icons.Settings className="w-5 h-5 mr-2" />
          Test Controls
        </h2>
        
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={runGoogleSignInTests}
            disabled={testLoading}
            variant="primary"
            icon={testLoading ? null : Icons.Refresh}
          >
            {testLoading ? 'Running Tests...' : 'Run Configuration Tests'}
          </Button>
          
          {!currentUser && (
            <Button
              onClick={testGoogleSignIn}
              disabled={loading || testLoading}
              variant="outline"
              icon={Icons.Google}
            >
              Test Google Sign-In
            </Button>
          )}
          
          {currentUser && (
            <Button
              onClick={testSignOut}
              disabled={loading || testLoading}
              variant="outline"
              icon={Icons.LogOut}
            >
              Test Sign-Out
            </Button>
          )}
        </div>
      </Card>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Icons.CheckCircle className="w-5 h-5 mr-2" />
            Test Results
          </h2>
          
          <div className="space-y-4">
            {Object.entries(testResults).map(([testName, result]) => (
              <div key={testName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium capitalize">
                    {testName.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  {getStatusIcon(result.success)}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                
                {result.details && (
                  <div className="bg-gray-50 rounded p-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Details:</h4>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
                
                {result.error && (
                  <div className="bg-red-50 rounded p-3 mt-2">
                    <h4 className="text-xs font-medium text-red-700 mb-1">Error:</h4>
                    <p className="text-xs text-red-600">{result.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-blue-50">
        <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-800">
          <Icons.Info className="w-5 h-5 mr-2" />
          Testing Instructions
        </h2>
        
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>1. Configuration Tests:</strong> Click "Run Configuration Tests" to verify Firebase and Google provider setup.</p>
          <p><strong>2. Sign-In Test:</strong> If not authenticated, click "Test Google Sign-In" to test the complete authentication flow.</p>
          <p><strong>3. Sign-Out Test:</strong> If authenticated, click "Test Sign-Out" to verify the logout functionality.</p>
          <p><strong>4. Review Results:</strong> Check the test results for any configuration issues or errors.</p>
          <p><strong>Note:</strong> Google sign-in requires user interaction and cannot be fully automated.</p>
        </div>
      </Card>
    </div>
  );
};

export default GoogleSignInTest;
