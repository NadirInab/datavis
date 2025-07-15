import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const GoogleUserVerification = () => {
  const { getCurrentUserToken } = useAuth();
  const [verificationData, setVerificationData] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadVerificationData();
  }, []);

  const apiCall = async (endpoint, options = {}) => {
    const token = await getCurrentUserToken();
    const response = await fetch(`/api/v1/admin/migrations${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  };

  const loadVerificationData = async () => {
    try {
      setLoading(true);
      const result = await apiCall('/verify-google-users');
      setVerificationData(result.data);
    } catch (error) {
      console.error('Failed to load verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runUserCreationTest = async () => {
    try {
      setTesting(true);
      const result = await apiCall('/test-user-creation', {
        method: 'POST',
        body: JSON.stringify({ testMode: true })
      });
      setTestResult(result.data);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status) => {
    return status ? (
      <Icons.Check className="w-5 h-5 text-green-500" />
    ) : (
      <Icons.X className="w-5 h-5 text-red-500" />
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Icons.Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-600">Loading Google user verification data...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center">
              <Icons.Google className="w-5 h-5 mr-2" />
              Google User Creation Verification
            </h2>
            <p className="text-gray-600 mt-1">
              Verify that Google OAuth integration is working correctly
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={runUserCreationTest}
              disabled={testing}
              variant="outline"
              icon={testing ? Icons.Clock : Icons.Play}
            >
              {testing ? 'Testing...' : 'Run Test'}
            </Button>
            <Button
              onClick={loadVerificationData}
              disabled={loading}
              variant="primary"
              icon={Icons.Refresh}
            >
              Refresh
            </Button>
          </div>
        </div>

        {verificationData && (
          <div className="space-y-6">
            {/* Statistics Overview */}
            <div>
              <h3 className="text-lg font-medium mb-4">User Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {verificationData.statistics.total}
                  </div>
                  <div className="text-sm text-blue-700">Total Users</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {verificationData.statistics.googleUsers}
                  </div>
                  <div className="text-sm text-green-700">Google Users</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {verificationData.statistics.verifiedUsers}
                  </div>
                  <div className="text-sm text-purple-700">Verified</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {verificationData.statistics.activeUsers}
                  </div>
                  <div className="text-sm text-yellow-700">Active</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {verificationData.statistics.recentUsers}
                  </div>
                  <div className="text-sm text-indigo-700">Recent (24h)</div>
                </div>
              </div>
            </div>

            {/* System Health Status */}
            <div>
              <h3 className="text-lg font-medium mb-4">System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">User Creation System</span>
                  {getStatusIcon(verificationData.verificationStatus.userCreationWorking)}
                  <span className={`text-sm ${
                    verificationData.verificationStatus.userCreationWorking 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {verificationData.verificationStatus.userCreationWorking ? 'Working' : 'Issues'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">Recent Activity</span>
                  {getStatusIcon(verificationData.verificationStatus.recentActivity)}
                  <span className={`text-sm ${
                    verificationData.verificationStatus.recentActivity 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {verificationData.verificationStatus.recentActivity ? 'Active' : 'No Activity'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">System Health</span>
                  {getStatusIcon(verificationData.verificationStatus.systemHealthy)}
                  <span className={`text-sm ${
                    verificationData.verificationStatus.systemHealthy 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {verificationData.verificationStatus.systemHealthy ? 'Healthy' : 'Issues'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Google Users */}
            <div>
              <h3 className="text-lg font-medium mb-4">Recent Google Sign-ups</h3>
              {verificationData.recentGoogleUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Firebase UID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {verificationData.recentGoogleUsers.map((user) => (
                        <tr key={user.firebaseUid}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {user.photoURL && (
                                <img
                                  className="h-8 w-8 rounded-full mr-3"
                                  src={user.photoURL}
                                  alt=""
                                />
                              )}
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {user.firebaseUid.substring(0, 20)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Icons.Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No recent Google sign-ups found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Icons.TestTube className="w-5 h-5 mr-2" />
            User Creation Test Results
          </h3>
          
          <div className={`p-4 rounded-lg ${
            testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center mb-3">
              {getStatusIcon(testResult.success)}
              <span className={`ml-2 font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.success ? 'Test Passed' : 'Test Failed'}
              </span>
            </div>
            
            {testResult.success ? (
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-green-800">Test User Created Successfully</h4>
                  <div className="mt-2 text-sm text-green-700">
                    <p><strong>Email:</strong> {testResult.testUser.email}</p>
                    <p><strong>Name:</strong> {testResult.testUser.name}</p>
                    <p><strong>Firebase UID:</strong> {testResult.testUser.firebaseUid}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-green-800">Creation Details</h4>
                  <div className="mt-2 text-sm text-green-700">
                    <p><strong>New User:</strong> {testResult.testResult.isNewUser ? 'Yes' : 'No'}</p>
                    <p><strong>Processing Time:</strong> {testResult.testResult.processingTime}ms</p>
                    <p><strong>Cleaned Up:</strong> {testResult.cleanedUp ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-medium text-red-800">Test Failed</h4>
                <p className="mt-2 text-sm text-red-700">{testResult.error}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default GoogleUserVerification;
