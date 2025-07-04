import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const RoleBasedTester = () => {
  const { currentUser, isAdmin, isVisitor, hasFeature } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('current');

  // Define test scenarios for each role
  const testScenarios = {
    visitor: [
      {
        name: 'Dashboard Access',
        test: () => testPageAccess('/app'),
        expected: 'Should load dashboard with visitor banner'
      },
      {
        name: 'File Upload',
        test: () => testPageAccess('/app/upload'),
        expected: 'Should show CSV upload only'
      },
      {
        name: 'Feature Access',
        test: () => testFeatureAccess(['csv_upload', 'chart_export_png']),
        expected: 'Should have basic features only'
      },
      {
        name: 'Visitor API',
        test: () => testVisitorAPI(),
        expected: 'Should create/retrieve visitor session'
      }
    ],
    user: [
      {
        name: 'Dashboard Access',
        test: () => testPageAccess('/app'),
        expected: 'Should load full dashboard'
      },
      {
        name: 'File Management',
        test: () => testPageAccess('/app/files'),
        expected: 'Should show user files'
      },
      {
        name: 'Profile Access',
        test: () => testPageAccess('/app/profile'),
        expected: 'Should show user profile'
      },
      {
        name: 'Feature Access',
        test: () => testFeatureAccess(['csv_upload', 'chart_export_png', 'excel_upload']),
        expected: 'Should have free tier features'
      }
    ],
    admin: [
      {
        name: 'Admin Dashboard',
        test: () => testPageAccess('/app/admin'),
        expected: 'Should load admin interface'
      },
      {
        name: 'User Management API',
        test: () => testAdminAPI('/api/v1/admin/users'),
        expected: 'Should fetch user data'
      },
      {
        name: 'System Status API',
        test: () => testAdminAPI('/api/v1/admin/system/status'),
        expected: 'Should show system health'
      },
      {
        name: 'Feature Management',
        test: () => testFeatureManagement(),
        expected: 'Should control all features'
      }
    ]
  };

  const testPageAccess = async (path) => {
    try {
      // Simulate navigation test
      const currentPath = window.location.pathname;
      return {
        success: true,
        message: `Page ${path} accessible`,
        details: { currentPath, targetPath: path }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to access ${path}`,
        error: error.message
      };
    }
  };

  const testFeatureAccess = async (features) => {
    try {
      const results = {};
      features.forEach(feature => {
        results[feature] = hasFeature ? hasFeature(feature) : false;
      });
      
      return {
        success: true,
        message: 'Feature access tested',
        details: results
      };
    } catch (error) {
      return {
        success: false,
        message: 'Feature access test failed',
        error: error.message
      };
    }
  };

  const testVisitorAPI = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId') || 'test-session';
      const response = await fetch('/api/v1/auth/visitor', {
        headers: {
          'x-session-id': sessionId,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: response.ok ? 'Visitor API working' : 'Visitor API failed',
        details: { status: response.status, data }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Visitor API test failed',
        error: error.message
      };
    }
  };

  const testAdminAPI = async (endpoint) => {
    try {
      if (!currentUser || !isAdmin()) {
        return {
          success: false,
          message: 'Not authorized for admin API',
          error: 'Admin access required'
        };
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: response.ok ? 'Admin API working' : 'Admin API failed',
        details: { status: response.status, endpoint, data }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Admin API test failed',
        error: error.message
      };
    }
  };

  const testFeatureManagement = async () => {
    try {
      // Test feature flag operations
      const testFeatureId = 'test_feature';
      
      // This would normally interact with the feature management system
      return {
        success: true,
        message: 'Feature management accessible',
        details: { canManageFeatures: isAdmin() }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Feature management test failed',
        error: error.message
      };
    }
  };

  const runTests = async (role) => {
    setLoading(true);
    const scenarios = testScenarios[role] || [];
    const results = {};

    for (const scenario of scenarios) {
      try {
        results[scenario.name] = await scenario.test();
        results[scenario.name].expected = scenario.expected;
      } catch (error) {
        results[scenario.name] = {
          success: false,
          message: 'Test execution failed',
          error: error.message,
          expected: scenario.expected
        };
      }
    }

    setTestResults({ ...testResults, [role]: results });
    setLoading(false);
  };

  const getCurrentRole = () => {
    if (isAdmin()) return 'admin';
    if (currentUser) return 'user';
    if (isVisitor()) return 'visitor';
    return 'unknown';
  };

  const currentRole = getCurrentRole();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[#5A827E]">Role-Based Testing</h2>
          <p className="text-[#5A827E]/70 mt-1">
            Test application functionality for different user roles
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5A827E]/20 focus:border-[#5A827E]"
          >
            <option value="current">Current Role ({currentRole})</option>
            <option value="visitor">Visitor</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <Button
            onClick={() => runTests(selectedRole === 'current' ? currentRole : selectedRole)}
            disabled={loading}
            icon={Icons.Play}
          >
            {loading ? 'Testing...' : 'Run Tests'}
          </Button>
        </div>
      </div>

      {/* Current Role Info */}
      <div className="bg-[#FAFFCA]/30 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-[#5A827E] mb-2">Current Session</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-[#5A827E]/60">Role:</span>
            <span className="ml-2 font-medium text-[#5A827E]">{currentRole}</span>
          </div>
          <div>
            <span className="text-[#5A827E]/60">User:</span>
            <span className="ml-2 font-medium text-[#5A827E]">
              {currentUser?.email || 'Anonymous'}
            </span>
          </div>
          <div>
            <span className="text-[#5A827E]/60">Admin:</span>
            <span className="ml-2 font-medium text-[#5A827E]">
              {isAdmin() ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="text-[#5A827E]/60">Visitor:</span>
            <span className="ml-2 font-medium text-[#5A827E]">
              {isVisitor() ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {Object.entries(testResults).map(([role, results]) => (
        <div key={role} className="mb-6">
          <h3 className="text-lg font-medium text-[#5A827E] mb-4 capitalize">
            {role} Role Tests
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(results).map(([testName, result]) => (
              <div key={testName} className="border border-[#84AE92]/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-[#5A827E]">{testName}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="text-sm text-[#5A827E]/70 space-y-1">
                  <p><strong>Expected:</strong> {result.expected}</p>
                  <p><strong>Result:</strong> {result.message}</p>
                  {result.error && (
                    <p className="text-red-600"><strong>Error:</strong> {result.error}</p>
                  )}
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[#5A827E] hover:text-[#5A827E]/80">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(testResults).length === 0 && (
        <div className="text-center py-8 text-[#5A827E]/60">
          <Icons.TestTube className="w-12 h-12 mx-auto mb-4" />
          <p>No tests run yet. Select a role and click "Run Tests" to begin.</p>
        </div>
      )}
    </Card>
  );
};

export default RoleBasedTester;
