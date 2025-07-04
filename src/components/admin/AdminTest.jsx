import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { getAllFeatures, getFeatureUsageStats } from '../../utils/featureGating';
import { EXPORT_FORMATS } from '../../utils/chartExport';

const AdminTest = () => {
  const { currentUser, isAdmin, isVisitor, hasFeature } = useAuth();
  const [testResults, setTestResults] = useState({
    auth: null,
    users: null,
    system: null,
    payments: null,
    features: null,
    exports: null,
    visitor: null
  });
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = {
      auth: null,
      users: null,
      system: null,
      payments: null,
      features: null,
      exports: null,
      visitor: null
    };

    try {
      // Test 1: Check authentication
      if (currentUser && isAdmin()) {
        const token = await currentUser.getIdToken();
        results.auth = {
          success: true,
          token: token.substring(0, 20) + '...',
          userType: 'admin',
          email: currentUser.email
        };
      } else if (currentUser) {
        results.auth = {
          success: true,
          userType: 'user',
          email: currentUser.email,
          error: 'Not admin - regular user'
        };
      } else if (isVisitor()) {
        results.auth = {
          success: true,
          userType: 'visitor',
          error: 'Visitor session'
        };
      } else {
        results.auth = { success: false, error: 'Not authenticated' };
      }

      // Test 2: Test users endpoint (admin only)
      if (currentUser && isAdmin()) {
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

      // Test 3: Test system status endpoint (admin only)
      if (currentUser && isAdmin()) {
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

      // Test 4: Test payments endpoint (admin only)
      if (currentUser && isAdmin()) {
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

      // Test 5: Test feature gating system
      try {
        const allFeatures = getAllFeatures();
        const usageStats = getFeatureUsageStats();

        // Test specific features
        const featureTests = {
          csv_upload: hasFeature ? hasFeature('csv_upload') : false,
          excel_upload: hasFeature ? hasFeature('excel_upload') : false,
          chart_export_png: hasFeature ? hasFeature('chart_export_png') : false,
          chart_export_pdf: hasFeature ? hasFeature('chart_export_pdf') : false
        };

        results.features = {
          success: true,
          totalFeatures: allFeatures.length,
          enabledFeatures: allFeatures.filter(f => f.enabled).length,
          userFeatures: featureTests,
          usageStats: Object.keys(usageStats).length
        };
      } catch (error) {
        results.features = { success: false, error: error.message };
      }

      // Test 6: Test export functionality
      try {
        const exportFormats = Object.values(EXPORT_FORMATS);
        const availableExports = exportFormats.filter(format =>
          hasFeature ? hasFeature(format.id) : false
        );

        results.exports = {
          success: true,
          totalFormats: exportFormats.length,
          availableFormats: availableExports.length,
          formats: availableExports.map(f => f.name)
        };
      } catch (error) {
        results.exports = { success: false, error: error.message };
      }

      // Test 7: Test visitor functionality
      if (isVisitor()) {
        try {
          const sessionId = localStorage.getItem('sessionId');
          const response = await fetch('/api/v1/auth/visitor', {
            headers: {
              'x-session-id': sessionId || 'test-session',
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();

          results.visitor = {
            success: response.ok,
            status: response.status,
            sessionId: sessionId,
            hasSession: !!sessionId,
            apiResponse: data.success,
            error: data.success ? null : data.message
          };
        } catch (error) {
          results.visitor = { success: false, error: error.message };
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
                <p>✓ User Type: {testResults.auth.userType}</p>
                {testResults.auth.token && <p>✓ Token: {testResults.auth.token}</p>}
                {testResults.auth.email && <p>✓ Email: {testResults.auth.email}</p>}
                <p>✓ Is Admin: {isAdmin() ? 'Yes' : 'No'}</p>
                <p>✓ Is Visitor: {isVisitor() ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <p>✗ {testResults.auth?.error || 'Not tested'}</p>
            )}
          </div>
        </div>

        {/* Feature Gating Test */}
        <div className="border border-[#84AE92]/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-[#5A827E]">Feature Gating System</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(testResults.features?.success)}`}>
              {testResults.features?.success ? 'PASS' : 'FAIL'}
            </span>
          </div>
          <div className="text-sm text-[#5A827E]/70">
            {testResults.features?.success ? (
              <div>
                <p>✓ Total Features: {testResults.features.totalFeatures}</p>
                <p>✓ Enabled Features: {testResults.features.enabledFeatures}</p>
                <p>✓ CSV Upload: {testResults.features.userFeatures?.csv_upload ? 'Available' : 'Locked'}</p>
                <p>✓ Excel Upload: {testResults.features.userFeatures?.excel_upload ? 'Available' : 'Locked'}</p>
                <p>✓ PNG Export: {testResults.features.userFeatures?.chart_export_png ? 'Available' : 'Locked'}</p>
                <p>✓ PDF Export: {testResults.features.userFeatures?.chart_export_pdf ? 'Available' : 'Locked'}</p>
                <p>✓ Usage Stats: {testResults.features.usageStats} tracked features</p>
              </div>
            ) : (
              <p>✗ {testResults.features?.error || 'Not tested'}</p>
            )}
          </div>
        </div>

        {/* Export System Test */}
        <div className="border border-[#84AE92]/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-[#5A827E]">Export System</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(testResults.exports?.success)}`}>
              {testResults.exports?.success ? 'PASS' : 'FAIL'}
            </span>
          </div>
          <div className="text-sm text-[#5A827E]/70">
            {testResults.exports?.success ? (
              <div>
                <p>✓ Total Export Formats: {testResults.exports.totalFormats}</p>
                <p>✓ Available Formats: {testResults.exports.availableFormats}</p>
                <p>✓ Formats: {testResults.exports.formats?.join(', ') || 'None'}</p>
              </div>
            ) : (
              <p>✗ {testResults.exports?.error || 'Not tested'}</p>
            )}
          </div>
        </div>

        {/* Visitor API Test */}
        {isVisitor() && (
          <div className="border border-[#84AE92]/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[#5A827E]">Visitor API</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(testResults.visitor?.success)}`}>
                {testResults.visitor?.success ? 'PASS' : 'FAIL'}
              </span>
            </div>
            <div className="text-sm text-[#5A827E]/70">
              {testResults.visitor?.success ? (
                <div>
                  <p>✓ Status: {testResults.visitor.status}</p>
                  <p>✓ Session ID: {testResults.visitor.hasSession ? 'Present' : 'Missing'}</p>
                  <p>✓ API Response: {testResults.visitor.apiResponse ? 'Valid' : 'Invalid'}</p>
                </div>
              ) : (
                <div>
                  <p>✗ Status: {testResults.visitor?.status || 'N/A'}</p>
                  <p>✗ Error: {testResults.visitor?.error || 'Not tested'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin-only Tests */}
        {isAdmin() && (
          <>
            {/* Users API Test */}
            <div className="border border-[#84AE92]/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-[#5A827E]">Users API (Admin Only)</h3>
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
                <h3 className="font-medium text-[#5A827E]">System Status API (Admin Only)</h3>
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
                <h3 className="font-medium text-[#5A827E]">Payments API (Admin Only)</h3>
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
          </>
        )}

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
    </div>
  );
};

export default AdminTest;
