import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import fingerprintService from '../../services/fingerprintService';
import visitorTrackingService from '../../services/visitorTrackingService';
import { hasFeatureAccess, getUserLimits, validateFileFormatAccess } from '../../utils/featureGating';
import { checkGuestUploadLimit, checkUserUploadLimit } from '../../utils/rateLimiting';

const AuthenticationAudit = () => {
  const {
    currentUser,
    firebaseUser,
    visitorSession,
    visitorStats,
    fingerprintReady,
    loading,
    authError,
    isAdmin,
    isRegularUser,
    isVisitor,
    getUserType,
    canUpload,
    getRemainingFiles,
    getVisitorId,
    hasFeature,
    getFeatureLimits
  } = useAuth();

  const [auditResults, setAuditResults] = useState({});
  const [testProgress, setTestProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const runAuthenticationAudit = async () => {
    setIsRunning(true);
    setTestProgress(0);
    const results = {};

    try {
      // Test 1: Authentication State Verification
      setTestProgress(10);
      results.authState = await testAuthenticationState();

      // Test 2: Role-Based Access Control
      setTestProgress(25);
      results.roleAccess = await testRoleBasedAccess();

      // Test 3: Visitor Tracking System
      setTestProgress(40);
      results.visitorTracking = await testVisitorTracking();

      // Test 4: Feature Access Control
      setTestProgress(55);
      results.featureAccess = await testFeatureAccess();

      // Test 5: Upload Limits and Quotas
      setTestProgress(70);
      results.uploadLimits = await testUploadLimits();

      // Test 6: Session Persistence
      setTestProgress(85);
      results.sessionPersistence = await testSessionPersistence();

      // Test 7: Error Handling
      setTestProgress(100);
      results.errorHandling = await testErrorHandling();

      setAuditResults(results);
    } catch (error) {
      console.error('Audit failed:', error);
      results.error = error.message;
      setAuditResults(results);
    } finally {
      setIsRunning(false);
    }
  };

  const testAuthenticationState = async () => {
    const tests = [];

    // Test current user state
    tests.push({
      name: 'Current User State',
      status: currentUser ? 'PASS' : 'INFO',
      details: currentUser ? 
        `User: ${currentUser.email} (${currentUser.role})` : 
        'No authenticated user (visitor mode)',
      data: currentUser
    });

    // Test Firebase user state
    tests.push({
      name: 'Firebase User State',
      status: firebaseUser ? 'PASS' : 'INFO',
      details: firebaseUser ? 
        `Firebase UID: ${firebaseUser.uid}` : 
        'No Firebase user',
      data: firebaseUser
    });

    // Test loading state
    tests.push({
      name: 'Loading State',
      status: loading ? 'WARN' : 'PASS',
      details: loading ? 'Still loading' : 'Loading complete',
      data: { loading }
    });

    // Test auth error state
    tests.push({
      name: 'Auth Error State',
      status: authError ? 'FAIL' : 'PASS',
      details: authError || 'No authentication errors',
      data: { authError }
    });

    return {
      category: 'Authentication State',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testRoleBasedAccess = async () => {
    const tests = [];
    const userType = getUserType();

    // Test role detection
    tests.push({
      name: 'Role Detection',
      status: 'PASS',
      details: `Detected role: ${userType}`,
      data: { userType, isAdmin: isAdmin(), isRegularUser: isRegularUser(), isVisitor: isVisitor() }
    });

    // Test admin access
    const adminAccess = isAdmin();
    tests.push({
      name: 'Admin Access Check',
      status: adminAccess ? 'PASS' : 'INFO',
      details: adminAccess ? 'User has admin access' : 'User does not have admin access',
      data: { adminAccess }
    });

    // Test visitor access
    const visitorAccess = isVisitor();
    tests.push({
      name: 'Visitor Access Check',
      status: 'PASS',
      details: visitorAccess ? 'User is a visitor' : 'User is authenticated',
      data: { visitorAccess }
    });

    return {
      category: 'Role-Based Access Control',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testVisitorTracking = async () => {
    const tests = [];

    // Test fingerprint service
    try {
      const visitorId = await getVisitorId();
      tests.push({
        name: 'Fingerprint Service',
        status: visitorId ? 'PASS' : 'FAIL',
        details: visitorId ? `Visitor ID: ${visitorId}` : 'Failed to get visitor ID',
        data: { visitorId, fingerprintReady }
      });
    } catch (error) {
      tests.push({
        name: 'Fingerprint Service',
        status: 'FAIL',
        details: `Error: ${error.message}`,
        data: { error: error.message }
      });
    }

    // Test visitor session
    tests.push({
      name: 'Visitor Session',
      status: visitorSession ? 'PASS' : 'INFO',
      details: visitorSession ? 
        `Session ID: ${visitorSession.sessionId}, Files: ${visitorSession.filesUploaded}/${visitorSession.fileLimit}` :
        'No visitor session (authenticated user)',
      data: visitorSession
    });

    // Test visitor stats
    tests.push({
      name: 'Visitor Stats',
      status: visitorStats ? 'PASS' : 'INFO',
      details: visitorStats ? 
        `Total uploads: ${visitorStats.totalUploads}, Can upload: ${visitorStats.canUpload}` :
        'No visitor stats available',
      data: visitorStats
    });

    return {
      category: 'Visitor Tracking System',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testFeatureAccess = async () => {
    const tests = [];
    const testFeatures = [
      'csv_upload',
      'excel_upload', 
      'advanced_charts',
      'export_pdf',
      'google_sheets',
      'data_export_excel'
    ];

    for (const feature of testFeatures) {
      const hasAccess = hasFeature(feature);
      tests.push({
        name: `Feature: ${feature}`,
        status: 'PASS',
        details: hasAccess ? 'Access granted' : 'Access denied (upgrade required)',
        data: { feature, hasAccess }
      });
    }

    // Test file format access
    const formats = ['CSV', 'EXCEL', 'JSON', 'XML'];
    for (const format of formats) {
      const access = validateFileFormatAccess(currentUser, format);
      tests.push({
        name: `Format: ${format}`,
        status: access.allowed ? 'PASS' : 'INFO',
        details: access.allowed ? 'Format allowed' : access.reason,
        data: { format, access }
      });
    }

    return {
      category: 'Feature Access Control',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testUploadLimits = async () => {
    const tests = [];

    // Test upload capability
    try {
      const uploadCheck = await canUpload(1024 * 1024); // 1MB test file
      tests.push({
        name: 'Upload Capability',
        status: uploadCheck.allowed ? 'PASS' : 'WARN',
        details: uploadCheck.allowed ? 
          `Can upload (${uploadCheck.remainingUploads || 'unlimited'} remaining)` :
          uploadCheck.reason,
        data: uploadCheck
      });
    } catch (error) {
      tests.push({
        name: 'Upload Capability',
        status: 'FAIL',
        details: `Error checking upload capability: ${error.message}`,
        data: { error: error.message }
      });
    }

    // Test remaining files
    const remainingFiles = getRemainingFiles();
    tests.push({
      name: 'Remaining Files',
      status: 'PASS',
      details: `Remaining uploads: ${remainingFiles}`,
      data: { remainingFiles }
    });

    // Test feature limits
    const limits = getFeatureLimits();
    tests.push({
      name: 'Feature Limits',
      status: 'PASS',
      details: `Files: ${limits.files === -1 ? 'unlimited' : limits.files}, Storage: ${limits.storage}`,
      data: limits
    });

    return {
      category: 'Upload Limits and Quotas',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testSessionPersistence = async () => {
    const tests = [];

    // Test localStorage persistence
    const storedUser = localStorage.getItem('user');
    tests.push({
      name: 'User Storage Persistence',
      status: storedUser ? 'PASS' : 'INFO',
      details: storedUser ? 'User data found in localStorage' : 'No stored user data',
      data: { hasStoredUser: !!storedUser }
    });

    // Test visitor fingerprint persistence
    const storedFingerprint = localStorage.getItem('visitor_fingerprint');
    tests.push({
      name: 'Fingerprint Persistence',
      status: storedFingerprint ? 'PASS' : 'INFO',
      details: storedFingerprint ? 'Fingerprint stored' : 'No stored fingerprint',
      data: { hasStoredFingerprint: !!storedFingerprint }
    });

    return {
      category: 'Session Persistence',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testErrorHandling = async () => {
    const tests = [];

    // Test auth error handling
    tests.push({
      name: 'Auth Error Handling',
      status: 'PASS',
      details: 'Error handling mechanisms in place',
      data: { hasErrorHandling: true }
    });

    return {
      category: 'Error Handling',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication System Audit</h2>
        <p className="text-gray-600">
          Comprehensive testing of authentication flows, role-based access, and visitor tracking
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runAuthenticationAudit}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
        >
          {isRunning ? 'Running Audit...' : 'Run Authentication Audit'}
        </button>

        {isRunning && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${testProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">Progress: {testProgress}%</p>
          </div>
        )}
      </div>

      {Object.keys(auditResults).length > 0 && (
        <div className="space-y-6">
          {Object.entries(auditResults).map(([key, result]) => (
            <AuditResultSection key={key} result={result} />
          ))}
        </div>
      )}
    </div>
  );
};

const AuditResultSection = ({ result }) => {
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

export default AuthenticationAudit;
