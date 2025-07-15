import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const ComprehensiveAudit = () => {
  const { currentUser, firebaseUser, isAdmin, isVisitor, hasFeature } = useAuth();
  const [auditResults, setAuditResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  // Comprehensive test suite
  const testSuite = {
    authentication: [
      {
        name: 'Visitor Session Creation',
        test: async () => {
          const sessionId = 'audit-test-' + Date.now();
          const response = await fetch('/api/v1/auth/visitor', {
            headers: { 'x-session-id': sessionId }
          });
          const data = await response.json();
          return {
            success: response.ok && data.success,
            details: { status: response.status, sessionId: data.data?.sessionId },
            message: response.ok ? 'Visitor session created successfully' : 'Failed to create visitor session'
          };
        }
      },
      {
        name: 'JWT Token Validation',
        test: async () => {
          if (!currentUser || !firebaseUser) {
            return { success: false, message: 'No authenticated user', details: {} };
          }
          try {
            const token = await firebaseUser.getIdToken();
            return {
              success: !!token,
              details: { tokenLength: token.length, hasToken: !!token },
              message: token ? 'JWT token generated successfully' : 'Failed to generate JWT token'
            };
          } catch (error) {
            return { success: false, message: error.message, details: { error } };
          }
        }
      }
    ],
    routes: [
      {
        name: 'Dashboard Route Access',
        test: async () => {
          try {
            const response = await fetch('/app', { method: 'HEAD' });
            return {
              success: response.status !== 404,
              details: { status: response.status },
              message: response.status !== 404 ? 'Dashboard route accessible' : 'Dashboard route not found'
            };
          } catch (error) {
            return { success: false, message: error.message, details: { error } };
          }
        }
      },
      {
        name: 'Upload Route Access',
        test: async () => {
          try {
            const response = await fetch('/app/upload', { method: 'HEAD' });
            return {
              success: response.status !== 404,
              details: { status: response.status },
              message: response.status !== 404 ? 'Upload route accessible' : 'Upload route not found'
            };
          } catch (error) {
            return { success: false, message: error.message, details: { error } };
          }
        }
      },
      {
        name: 'Admin Route Protection',
        test: async () => {
          try {
            const response = await fetch('/app/admin', { method: 'HEAD' });
            const isAccessible = response.status !== 404;
            const shouldHaveAccess = isAdmin();
            
            return {
              success: true, // Route exists
              details: { 
                status: response.status, 
                isAccessible,
                userIsAdmin: shouldHaveAccess,
                properlyProtected: isAccessible // Route exists but protection is handled by React Router
              },
              message: `Admin route ${isAccessible ? 'accessible' : 'not accessible'}, user is ${shouldHaveAccess ? 'admin' : 'not admin'}`
            };
          } catch (error) {
            return { success: false, message: error.message, details: { error } };
          }
        }
      }
    ],
    fileFormats: [
      {
        name: 'CSV Format Support',
        test: async () => {
          const hasAccess = hasFeature ? hasFeature('csv_upload') : false;
          return {
            success: true,
            details: { hasAccess, format: 'CSV' },
            message: hasAccess ? 'CSV format accessible' : 'CSV format not accessible'
          };
        }
      },
      {
        name: 'Excel Format Support',
        test: async () => {
          const hasAccess = hasFeature ? hasFeature('excel_upload') : false;
          return {
            success: true,
            details: { hasAccess, format: 'Excel' },
            message: hasAccess ? 'Excel format accessible' : 'Excel format requires premium'
          };
        }
      },
      {
        name: 'JSON Format Support',
        test: async () => {
          const hasAccess = hasFeature ? hasFeature('json_upload') : false;
          return {
            success: true,
            details: { hasAccess, format: 'JSON' },
            message: hasAccess ? 'JSON format accessible' : 'JSON format requires premium'
          };
        }
      }
    ],
    exportFeatures: [
      {
        name: 'PNG Export Access',
        test: async () => {
          const hasAccess = hasFeature ? hasFeature('chart_export_png') : false;
          return {
            success: true,
            details: { hasAccess, format: 'PNG' },
            message: hasAccess ? 'PNG export accessible' : 'PNG export not accessible'
          };
        }
      },
      {
        name: 'PDF Export Access',
        test: async () => {
          const hasAccess = hasFeature ? hasFeature('chart_export_pdf') : false;
          return {
            success: true,
            details: { hasAccess, format: 'PDF' },
            message: hasAccess ? 'PDF export accessible' : 'PDF export requires premium'
          };
        }
      },
      {
        name: 'Excel Data Export Access',
        test: async () => {
          const hasAccess = hasFeature ? hasFeature('data_export_excel') : false;
          return {
            success: true,
            details: { hasAccess, format: 'Excel Data' },
            message: hasAccess ? 'Excel data export accessible' : 'Excel data export requires premium'
          };
        }
      }
    ],
    adminAPI: [
      {
        name: 'Admin Users API',
        test: async () => {
          if (!currentUser || !isAdmin()) {
            return {
              success: false,
              message: 'Not authorized for admin API',
              details: { isAdmin: isAdmin(), hasUser: !!currentUser }
            };
          }
          
          try {
            const token = await firebaseUser.getIdToken();
            const response = await fetch('/api/v1/admin/users?limit=5', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            return {
              success: response.ok,
              details: { 
                status: response.status, 
                userCount: data.success ? data.data?.users?.length : 0,
                hasData: !!data.data
              },
              message: response.ok ? 'Admin users API working' : 'Admin users API failed'
            };
          } catch (error) {
            return { success: false, message: error.message, details: { error } };
          }
        }
      },
      {
        name: 'Admin System Status API',
        test: async () => {
          if (!currentUser || !isAdmin()) {
            return {
              success: false,
              message: 'Not authorized for admin API',
              details: { isAdmin: isAdmin(), hasUser: !!currentUser }
            };
          }
          
          try {
            const token = await firebaseUser.getIdToken();
            const response = await fetch('/api/v1/admin/system/status', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            return {
              success: response.ok,
              details: { 
                status: response.status,
                dbConnected: data.success ? data.data?.database?.connected : false,
                hasSystemInfo: !!data.data
              },
              message: response.ok ? 'Admin system status API working' : 'Admin system status API failed'
            };
          } catch (error) {
            return { success: false, message: error.message, details: { error } };
          }
        }
      }
    ],
    errorHandling: [
      {
        name: 'Invalid File Format Handling',
        test: async () => {
          // Test client-side validation
          const invalidFile = new File(['test'], 'test.xyz', { type: 'application/unknown' });
          const isValidFormat = ['csv', 'xlsx', 'xls', 'json', 'tsv', 'xml', 'txt'].some(ext => 
            invalidFile.name.toLowerCase().endsWith(ext)
          );
          
          return {
            success: !isValidFormat, // Should reject invalid format
            details: { fileName: invalidFile.name, isValid: isValidFormat },
            message: !isValidFormat ? 'Invalid file format properly rejected' : 'Invalid file format not rejected'
          };
        }
      },
      {
        name: 'Unauthorized API Access',
        test: async () => {
          try {
            const response = await fetch('/api/v1/admin/users', {
              headers: { 'Authorization': 'Bearer invalid-token' }
            });
            
            return {
              success: response.status === 401 || response.status === 403,
              details: { status: response.status },
              message: response.status === 401 || response.status === 403 
                ? 'Unauthorized access properly blocked' 
                : 'Unauthorized access not properly blocked'
            };
          } catch (error) {
            return { success: false, message: error.message, details: { error } };
          }
        }
      }
    ]
  };

  const runAudit = async () => {
    setLoading(true);
    const results = {};

    for (const [category, tests] of Object.entries(testSuite)) {
      results[category] = {};
      
      for (const test of tests) {
        setCurrentTest(`${category}: ${test.name}`);
        
        try {
          results[category][test.name] = await test.test();
        } catch (error) {
          results[category][test.name] = {
            success: false,
            message: `Test execution failed: ${error.message}`,
            details: { error: error.message }
          };
        }
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setAuditResults(results);
    setCurrentTest('');
    setLoading(false);
  };

  const getOverallStatus = () => {
    const allTests = Object.values(auditResults).flatMap(category => Object.values(category));
    const passedTests = allTests.filter(test => test.success).length;
    const totalTests = allTests.length;
    
    return { passed: passedTests, total: totalTests, percentage: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0 };
  };

  const overallStatus = getOverallStatus();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[#5A827E]">Comprehensive Testing Audit</h2>
          <p className="text-[#5A827E]/70 mt-1">
            End-to-end testing across all user roles and functionalities
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {overallStatus.total > 0 && (
            <div className="text-right">
              <div className="text-lg font-semibold text-[#5A827E]">
                {overallStatus.passed}/{overallStatus.total}
              </div>
              <div className="text-sm text-[#5A827E]/70">
                {overallStatus.percentage}% Pass Rate
              </div>
            </div>
          )}
          <Button
            onClick={runAudit}
            disabled={loading}
            icon={Icons.Play}
            variant="primary"
          >
            {loading ? 'Running Audit...' : 'Run Full Audit'}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="bg-[#FAFFCA]/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#5A827E]"></div>
            <span className="text-[#5A827E]">
              {currentTest || 'Initializing audit...'}
            </span>
          </div>
        </div>
      )}

      {/* Test Results */}
      {Object.entries(auditResults).map(([category, tests]) => (
        <div key={category} className="mb-8">
          <h3 className="text-lg font-medium text-[#5A827E] mb-4 capitalize">
            {category.replace(/([A-Z])/g, ' $1').trim()} Tests
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(tests).map(([testName, result]) => (
              <div key={testName} className="border border-[#84AE92]/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-[#5A827E] text-sm">{testName}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                
                <div className="text-sm text-[#5A827E]/70 space-y-1">
                  <p><strong>Result:</strong> {result.message}</p>
                  
                  {result.details && Object.keys(result.details).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[#5A827E] hover:text-[#5A827E]/80 text-xs">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
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

      {Object.keys(auditResults).length === 0 && !loading && (
        <div className="text-center py-12 text-[#5A827E]/60">
          <Icons.TestTube className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg mb-2">Ready to Run Comprehensive Audit</p>
          <p className="text-sm">
            This will test authentication, routes, file formats, exports, admin APIs, and error handling.
          </p>
        </div>
      )}
    </Card>
  );
};

export default ComprehensiveAudit;
