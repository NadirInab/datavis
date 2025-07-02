import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';

const AdminTest = () => {
  const { currentUser, isAdmin } = useAuth();
  const [testResults, setTestResults] = useState({
    auth: null,
    users: null,
    system: null,
    payments: null
  });
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = { auth: null, users: null, system: null, payments: null };

    try {
      // Test 1: Check authentication
      if (currentUser && isAdmin()) {
        const token = await currentUser.getIdToken();
        results.auth = { success: true, token: token.substring(0, 20) + '...' };
      } else {
        results.auth = { success: false, error: 'Not authenticated as admin' };
      }

      // Test 2: Test users endpoint
      if (results.auth.success) {
        try {
          const token = await currentUser.getIdToken();
          const response = await fetch('/api/v1/admin/users?limit=5', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          results.users = { 
            success: response.ok, 
            status: response.status,
            userCount: data.success ? data.data.users.length : 0,
            error: data.success ? null : data.message
          };
        } catch (error) {
          results.users = { success: false, error: error.message };
        }
      }

      // Test 3: Test system status endpoint
      if (results.auth.success) {
        try {
          const token = await currentUser.getIdToken();
          const response = await fetch('/api/v1/admin/system/status', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          results.system = { 
            success: response.ok, 
            status: response.status,
            dbConnected: data.success ? data.data.database.connected : false,
            error: data.success ? null : data.message
          };
        } catch (error) {
          results.system = { success: false, error: error.message };
        }
      }

      // Test 4: Test payments endpoint
      if (results.auth.success) {
        try {
          const token = await currentUser.getIdToken();
          const response = await fetch('/api/v1/payments/admin/history?limit=5', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          results.payments = { 
            success: response.ok, 
            status: response.status,
            paymentCount: data.success ? data.data.payments.length : 0,
            error: data.success ? null : data.message
          };
        } catch (error) {
          results.payments = { success: false, error: error.message };
        }
      }

    } catch (error) {
      console.error('Test error:', error);
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      runTests();
    }
  }, [currentUser]);

  const getStatusColor = (success) => {
    return success ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#84AE92]/20 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#5A827E]">Admin API Test Results</h2>
        <button
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 bg-[#5A827E] text-white rounded-lg hover:bg-[#5A827E]/90 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Authentication Test */}
        <div className="border border-[#84AE92]/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-[#5A827E]">Authentication</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(testResults.auth?.success)}`}>
              {testResults.auth?.success ? 'PASS' : 'FAIL'}
            </span>
          </div>
          <div className="text-sm text-[#5A827E]/70">
            {testResults.auth?.success ? (
              <div>
                <p>✓ Admin user authenticated</p>
                <p>✓ Token: {testResults.auth.token}</p>
                <p>✓ User: {currentUser?.email}</p>
                <p>✓ Role: {currentUser?.role}</p>
              </div>
            ) : (
              <p>✗ {testResults.auth?.error || 'Not tested'}</p>
            )}
          </div>
        </div>

        {/* Users API Test */}
        <div className="border border-[#84AE92]/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-[#5A827E]">Users API</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(testResults.users?.success)}`}>
              {testResults.users?.success ? 'PASS' : 'FAIL'}
            </span>
          </div>
          <div className="text-sm text-[#5A827E]/70">
            {testResults.users?.success ? (
              <div>
                <p>✓ Status: {testResults.users.status}</p>
                <p>✓ Users fetched: {testResults.users.userCount}</p>
              </div>
            ) : (
              <div>
                <p>✗ Status: {testResults.users?.status || 'N/A'}</p>
                <p>✗ Error: {testResults.users?.error || 'Not tested'}</p>
              </div>
            )}
          </div>
        </div>

        {/* System Status API Test */}
        <div className="border border-[#84AE92]/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-[#5A827E]">System Status API</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(testResults.system?.success)}`}>
              {testResults.system?.success ? 'PASS' : 'FAIL'}
            </span>
          </div>
          <div className="text-sm text-[#5A827E]/70">
            {testResults.system?.success ? (
              <div>
                <p>✓ Status: {testResults.system.status}</p>
                <p>✓ DB Connected: {testResults.system.dbConnected ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <div>
                <p>✗ Status: {testResults.system?.status || 'N/A'}</p>
                <p>✗ Error: {testResults.system?.error || 'Not tested'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payments API Test */}
        <div className="border border-[#84AE92]/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-[#5A827E]">Payments API</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(testResults.payments?.success)}`}>
              {testResults.payments?.success ? 'PASS' : 'FAIL'}
            </span>
          </div>
          <div className="text-sm text-[#5A827E]/70">
            {testResults.payments?.success ? (
              <div>
                <p>✓ Status: {testResults.payments.status}</p>
                <p>✓ Payments fetched: {testResults.payments.paymentCount}</p>
              </div>
            ) : (
              <div>
                <p>✗ Status: {testResults.payments?.status || 'N/A'}</p>
                <p>✗ Error: {testResults.payments?.error || 'Not tested'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current User Info */}
      <div className="mt-6 pt-6 border-t border-[#84AE92]/20">
        <h3 className="font-medium text-[#5A827E] mb-3">Current User Info</h3>
        <div className="text-sm text-[#5A827E]/70 space-y-1">
          <p>Email: {currentUser?.email || 'Not logged in'}</p>
          <p>Name: {currentUser?.name || 'N/A'}</p>
          <p>Role: {currentUser?.role || 'N/A'}</p>
          <p>Is Admin: {isAdmin() ? 'Yes' : 'No'}</p>
          <p>Firebase UID: {currentUser?.uid || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminTest;
