import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import fingerprintService from '../../services/fingerprintService';
import visitorTrackingService from '../../services/visitorTrackingService';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const FingerprintDebug = () => {
  const { visitorStats, fingerprintReady, getVisitorId } = useAuth();
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      const visitorId = await fingerprintService.getVisitorId();
      const visitorInfo = await fingerprintService.getVisitorInfo();
      const stats = await visitorTrackingService.getVisitorStats();
      const canUploadResult = await visitorTrackingService.canUpload(1024 * 1024); // 1MB test

      setDebugInfo({
        visitorId,
        visitorInfo,
        stats,
        canUpload: canUploadResult,
        fingerprintReady: fingerprintService.isReady(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to load debug info:', error);
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const resetVisitorData = async () => {
    try {
      await visitorTrackingService.resetVisitorData();
      fingerprintService.reset();
      await loadDebugInfo();
      alert('Visitor data reset successfully!');
    } catch (error) {
      console.error('Failed to reset visitor data:', error);
      alert('Failed to reset visitor data: ' + error.message);
    }
  };

  const testUpload = async () => {
    try {
      const result = await visitorTrackingService.recordUpload({
        name: 'test-file.csv',
        size: 1024 * 500, // 500KB
        type: 'text/csv'
      });
      
      if (result.success) {
        alert('Test upload recorded successfully!');
        await loadDebugInfo();
      } else {
        alert('Failed to record test upload: ' + result.error);
      }
    } catch (error) {
      console.error('Test upload failed:', error);
      alert('Test upload failed: ' + error.message);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">FingerprintJS Debug Panel</h2>
        <div className="flex space-x-2">
          <Button
            onClick={loadDebugInfo}
            variant="outline"
            size="sm"
            icon={Icons.RefreshCw}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            onClick={resetVisitorData}
            variant="danger"
            size="sm"
            icon={Icons.Trash}
          >
            Reset Data
          </Button>
          <Button
            onClick={testUpload}
            variant="secondary"
            size="sm"
            icon={Icons.Upload}
          >
            Test Upload
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading debug info...</span>
        </div>
      )}

      {debugInfo && !loading && (
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Icons.Shield className={`w-5 h-5 mr-2 ${fingerprintReady ? 'text-green-500' : 'text-red-500'}`} />
                <span className="font-medium">FingerprintJS</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {fingerprintReady ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <Icons.User className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-medium">Visitor ID</span>
              </div>
              <div className="text-sm text-gray-600 mt-1 font-mono">
                {debugInfo.visitorId ? debugInfo.visitorId.substring(0, 12) + '...' : 'Not available'}
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <Icons.Upload className="w-5 h-5 mr-2 text-orange-500" />
                <span className="font-medium">Upload Status</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {debugInfo.canUpload?.allowed ? 'Allowed' : 'Blocked'}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {debugInfo.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <Icons.AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="font-medium text-red-900">Error</span>
              </div>
              <div className="text-sm text-red-700 mt-1">{debugInfo.error}</div>
            </div>
          )}

          {/* Visitor Stats */}
          {debugInfo.stats && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Visitor Statistics</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(debugInfo.stats, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Upload Permission */}
          {debugInfo.canUpload && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Upload Permission Check</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(debugInfo.canUpload, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Visitor Info */}
          {debugInfo.visitorInfo && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Visitor Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Basic Info</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Visitor ID:</strong> {debugInfo.visitorInfo.visitorId}</div>
                      <div><strong>Confidence:</strong> {debugInfo.visitorInfo.confidence}</div>
                      <div><strong>Timestamp:</strong> {debugInfo.visitorInfo.timestamp}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Browser Components</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(debugInfo.visitorInfo.components || {}).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> {String(value).substring(0, 50)}
                          {String(value).length > 50 && '...'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Auth Context Stats */}
          {visitorStats && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Auth Context Stats</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(visitorStats, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Local Storage Data */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Local Storage Data</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify({
                  visitor_fingerprint: localStorage.getItem('visitor_fingerprint'),
                  visitor_upload_data: localStorage.getItem('visitor_upload_data'),
                  sessionId: localStorage.getItem('sessionId')
                }, null, 2)}
              </pre>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Last updated: {debugInfo.timestamp}
          </div>
        </div>
      )}
    </Card>
  );
};

export default FingerprintDebug;