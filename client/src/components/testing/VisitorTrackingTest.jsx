import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import fingerprintService from '../../services/fingerprintService';
import visitorTrackingService from '../../services/visitorTrackingService';

const VisitorTrackingTest = () => {
  const {
    currentUser,
    visitorSession,
    visitorStats,
    fingerprintReady,
    canUpload,
    recordVisitorUpload,
    getVisitorId,
    isVisitor
  } = useAuth();

  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState(null);
  const [uploadTest, setUploadTest] = useState(null);

  const runVisitorTrackingTests = async () => {
    setIsRunning(true);
    const results = {};

    try {
      // Test 1: Fingerprint Service
      results.fingerprint = await testFingerprintService();
      
      // Test 2: Visitor Session Management
      results.session = await testVisitorSession();
      
      // Test 3: Upload Tracking
      results.uploadTracking = await testUploadTracking();
      
      // Test 4: Limit Enforcement
      results.limitEnforcement = await testLimitEnforcement();
      
      // Test 5: Session Persistence
      results.persistence = await testSessionPersistence();

      setTestResults(results);
    } catch (error) {
      console.error('Visitor tracking test failed:', error);
      setTestResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const testFingerprintService = async () => {
    const tests = [];

    try {
      // Test fingerprint initialization
      const isReady = fingerprintService.isReady();
      tests.push({
        name: 'Fingerprint Service Ready',
        status: isReady ? 'PASS' : 'WARN',
        details: isReady ? 'Service initialized' : 'Service not ready',
        data: { isReady, fingerprintReady }
      });

      // Test visitor ID generation
      const visitorId = await getVisitorId();
      tests.push({
        name: 'Visitor ID Generation',
        status: visitorId ? 'PASS' : 'FAIL',
        details: visitorId ? `ID: ${visitorId}` : 'Failed to generate ID',
        data: { visitorId }
      });

      // Test visitor info
      const info = await fingerprintService.getVisitorInfo();
      setVisitorInfo(info);
      tests.push({
        name: 'Visitor Info Collection',
        status: info ? 'PASS' : 'FAIL',
        details: info ? `Confidence: ${info.confidence}` : 'Failed to collect info',
        data: info
      });

      // Test fallback mechanism
      const fallbackId = localStorage.getItem('visitor_fingerprint');
      tests.push({
        name: 'Fallback Mechanism',
        status: fallbackId ? 'PASS' : 'WARN',
        details: fallbackId ? 'Fallback ID stored' : 'No fallback ID',
        data: { fallbackId }
      });

      // Test race condition protection
      const multipleInitPromises = [
        fingerprintService.initialize(),
        fingerprintService.initialize(),
        fingerprintService.initialize()
      ];

      const results = await Promise.all(multipleInitPromises);
      const allSame = results.every(id => id === results[0]);

      tests.push({
        name: 'Race Condition Protection',
        status: allSame ? 'PASS' : 'FAIL',
        details: allSame ? 'Multiple initialization calls return same ID' : 'Race condition detected',
        data: { results, allSame }
      });

    } catch (error) {
      tests.push({
        name: 'Fingerprint Service Error',
        status: 'FAIL',
        details: error.message,
        data: { error: error.message }
      });
    }

    return {
      category: 'Fingerprint Service',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testVisitorSession = async () => {
    const tests = [];

    // Test visitor session existence
    tests.push({
      name: 'Visitor Session',
      status: visitorSession ? 'PASS' : (currentUser ? 'INFO' : 'FAIL'),
      details: visitorSession ? 
        `Session ID: ${visitorSession.sessionId}` : 
        (currentUser ? 'Authenticated user (no visitor session needed)' : 'No visitor session'),
      data: visitorSession
    });

    // Test visitor stats
    tests.push({
      name: 'Visitor Stats',
      status: visitorStats ? 'PASS' : (currentUser ? 'INFO' : 'WARN'),
      details: visitorStats ? 
        `Uploads: ${visitorStats.totalUploads}/${visitorStats.maxUploads}` :
        (currentUser ? 'Authenticated user' : 'No visitor stats'),
      data: visitorStats
    });

    // Test upload limits
    if (visitorSession) {
      const remaining = visitorSession.remainingFiles;
      tests.push({
        name: 'Upload Limits',
        status: remaining >= 0 ? 'PASS' : 'FAIL',
        details: `Remaining uploads: ${remaining}`,
        data: { remaining, fileLimit: visitorSession.fileLimit }
      });
    }

    // Test visitor features
    if (visitorSession && visitorSession.features) {
      tests.push({
        name: 'Visitor Features',
        status: visitorSession.features.length > 0 ? 'PASS' : 'WARN',
        details: `Available features: ${visitorSession.features.join(', ')}`,
        data: { features: visitorSession.features }
      });
    }

    return {
      category: 'Visitor Session Management',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testUploadTracking = async () => {
    const tests = [];

    // Test upload capability check
    try {
      const uploadCheck = await canUpload(1024 * 1024); // 1MB test
      tests.push({
        name: 'Upload Capability Check',
        status: 'PASS',
        details: uploadCheck.allowed ? 
          `Can upload (${uploadCheck.remainingUploads || 'unlimited'} remaining)` :
          uploadCheck.reason,
        data: uploadCheck
      });
    } catch (error) {
      tests.push({
        name: 'Upload Capability Check',
        status: 'FAIL',
        details: `Error: ${error.message}`,
        data: { error: error.message }
      });
    }

    // Test visitor tracking service methods
    if (isVisitor()) {
      try {
        const stats = await visitorTrackingService.getVisitorStats();
        tests.push({
          name: 'Visitor Stats Retrieval',
          status: stats ? 'PASS' : 'FAIL',
          details: stats ? `Total uploads: ${stats.totalUploads}` : 'Failed to get stats',
          data: stats
        });

        const canUploadCheck = await visitorTrackingService.canUpload(1024 * 1024);
        tests.push({
          name: 'Service Upload Check',
          status: 'PASS',
          details: canUploadCheck.allowed ? 'Upload allowed' : canUploadCheck.reason,
          data: canUploadCheck
        });
      } catch (error) {
        tests.push({
          name: 'Visitor Tracking Service',
          status: 'FAIL',
          details: `Error: ${error.message}`,
          data: { error: error.message }
        });
      }
    } else {
      tests.push({
        name: 'Visitor Tracking Service',
        status: 'INFO',
        details: 'Not applicable for authenticated users',
        data: { userType: 'authenticated' }
      });
    }

    return {
      category: 'Upload Tracking',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testLimitEnforcement = async () => {
    const tests = [];

    if (isVisitor()) {
      // Test file count limit
      const maxUploads = visitorSession?.fileLimit || visitorStats?.maxUploads || 3;
      const currentUploads = visitorSession?.filesUploaded || visitorStats?.totalUploads || 0;
      
      tests.push({
        name: 'File Count Limit',
        status: currentUploads <= maxUploads ? 'PASS' : 'FAIL',
        details: `Current: ${currentUploads}, Max: ${maxUploads}`,
        data: { currentUploads, maxUploads }
      });

      // Test file size limit (2MB for visitors)
      const maxFileSize = 2 * 1024 * 1024; // 2MB
      try {
        const sizeCheck = await visitorTrackingService.canUpload(maxFileSize + 1);
        tests.push({
          name: 'File Size Limit',
          status: !sizeCheck.allowed ? 'PASS' : 'FAIL',
          details: !sizeCheck.allowed ? 'Size limit enforced' : 'Size limit not enforced',
          data: { sizeCheck, maxFileSize }
        });
      } catch (error) {
        tests.push({
          name: 'File Size Limit',
          status: 'FAIL',
          details: `Error testing size limit: ${error.message}`,
          data: { error: error.message }
        });
      }

      // Test upgrade prompts
      if (currentUploads >= maxUploads) {
        tests.push({
          name: 'Upgrade Prompt',
          status: visitorSession?.upgradeMessage ? 'PASS' : 'WARN',
          details: visitorSession?.upgradeMessage || 'No upgrade message shown',
          data: { upgradeMessage: visitorSession?.upgradeMessage }
        });
      }
    } else {
      tests.push({
        name: 'Limit Enforcement',
        status: 'INFO',
        details: 'Not applicable for authenticated users',
        data: { userType: 'authenticated' }
      });
    }

    return {
      category: 'Limit Enforcement',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testSessionPersistence = async () => {
    const tests = [];

    // Test localStorage persistence
    const visitorData = localStorage.getItem('visitor_upload_data');
    tests.push({
      name: 'Upload Data Persistence',
      status: visitorData ? 'PASS' : 'INFO',
      details: visitorData ? 'Upload data stored in localStorage' : 'No stored upload data',
      data: { hasVisitorData: !!visitorData }
    });

    // Test fingerprint persistence
    const storedFingerprint = localStorage.getItem('visitor_fingerprint');
    tests.push({
      name: 'Fingerprint Persistence',
      status: storedFingerprint ? 'PASS' : 'WARN',
      details: storedFingerprint ? 'Fingerprint persisted' : 'No stored fingerprint',
      data: { storedFingerprint }
    });

    // Test session ID persistence
    const sessionId = visitorSession?.sessionId;
    tests.push({
      name: 'Session ID',
      status: sessionId ? 'PASS' : 'INFO',
      details: sessionId ? `Session ID: ${sessionId}` : 'No session ID',
      data: { sessionId }
    });

    return {
      category: 'Session Persistence',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const simulateUpload = async () => {
    if (!isVisitor()) {
      setUploadTest({ error: 'Upload simulation only available for visitors' });
      return;
    }

    try {
      const mockFile = {
        name: 'test-file.csv',
        size: 1024 * 500, // 500KB
        type: 'text/csv'
      };

      const result = await recordVisitorUpload(mockFile);
      setUploadTest({
        success: result.success,
        message: result.success ? 'Upload recorded successfully' : result.error,
        data: result
      });
    } catch (error) {
      setUploadTest({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Visitor Tracking System Test</h2>
        <p className="text-gray-600">
          Test fingerprint-based visitor tracking, upload limits, and session management
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <button
          onClick={runVisitorTrackingTests}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
        >
          {isRunning ? 'Running Tests...' : 'Run Visitor Tests'}
        </button>

        {isVisitor() && (
          <button
            onClick={simulateUpload}
            className="px-6 py-3 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            Simulate Upload
          </button>
        )}
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Current Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">User Type:</span>
            <span className="ml-2 font-medium">{isVisitor() ? 'Visitor' : 'Authenticated'}</span>
          </div>
          <div>
            <span className="text-gray-600">Fingerprint Ready:</span>
            <span className="ml-2 font-medium">{fingerprintReady ? 'Yes' : 'No'}</span>
          </div>
          {visitorSession && (
            <>
              <div>
                <span className="text-gray-600">Files Uploaded:</span>
                <span className="ml-2 font-medium">{visitorSession.filesUploaded}/{visitorSession.fileLimit}</span>
              </div>
              <div>
                <span className="text-gray-600">Can Upload:</span>
                <span className="ml-2 font-medium">{visitorSession.canUpload ? 'Yes' : 'No'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upload Test Result */}
      {uploadTest && (
        <div className={`mb-6 p-4 rounded-lg ${uploadTest.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className="font-semibold mb-2">Upload Simulation Result</h3>
          <p className={uploadTest.success ? 'text-green-700' : 'text-red-700'}>
            {uploadTest.message}
          </p>
        </div>
      )}

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

export default VisitorTrackingTest;
