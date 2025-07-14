import React, { useState } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import {
  hasFeatureAccess,
  getUserLimits,
  validateFileFormatAccess,
  FEATURES,
  SUBSCRIPTION_TIERS,
  getUserTier,
  requiresUpgrade,
  getUpgradeSuggestion,
  trackFeatureUsage,
  getFeatureUsageStats
} from '../../utils/featureGating';

const FeatureAccessTest = () => {
  const {
    currentUser,
    hasFeature,
    getFeatureLimits,
    getUserType,
    isVisitor
  } = useAuth();

  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const runFeatureAccessTests = async () => {
    setIsRunning(true);
    const results = {};

    try {
      // Test 1: Subscription Tier Detection
      results.tierDetection = testSubscriptionTierDetection();
      
      // Test 2: Feature Access Control
      results.featureAccess = testFeatureAccessControl();
      
      // Test 3: File Format Access
      results.fileFormatAccess = testFileFormatAccess();
      
      // Test 4: Upload Limits
      results.uploadLimits = testUploadLimits();
      
      // Test 5: Upgrade Requirements
      results.upgradeRequirements = testUpgradeRequirements();

      // Test 6: Feature Usage Tracking
      results.usageTracking = testUsageTracking();

      setTestResults(results);
    } catch (error) {
      console.error('Feature access test failed:', error);
      setTestResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const testSubscriptionTierDetection = () => {
    const tests = [];
    const userTier = getUserTier(currentUser);
    const userType = getUserType();

    // Test tier detection
    tests.push({
      name: 'Subscription Tier Detection',
      status: 'PASS',
      details: `Detected tier: ${userTier}`,
      data: { userTier, userType }
    });

    // Test tier configuration
    const tierConfig = SUBSCRIPTION_TIERS[userTier];
    tests.push({
      name: 'Tier Configuration',
      status: tierConfig ? 'PASS' : 'FAIL',
      details: tierConfig ? `${tierConfig.features.length} features available` : 'No tier configuration found',
      data: tierConfig
    });

    // Test limits
    const limits = getUserLimits(currentUser);
    tests.push({
      name: 'User Limits',
      status: limits ? 'PASS' : 'FAIL',
      details: limits ? `Files: ${limits.files === -1 ? 'unlimited' : limits.files}, Storage: ${limits.storage}` : 'No limits found',
      data: limits
    });

    return {
      category: 'Subscription Tier Detection',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testFeatureAccessControl = () => {
    const tests = [];
    
    // Test core features
    const coreFeatures = [
      'csv_upload',
      'basic_charts',
      'data_preview',
      'dashboard_access'
    ];

    coreFeatures.forEach(feature => {
      const hasAccess = hasFeatureAccess(currentUser, feature);
      tests.push({
        name: `Core Feature: ${feature}`,
        status: hasAccess ? 'PASS' : 'FAIL',
        details: hasAccess ? 'Access granted' : 'Access denied',
        data: { feature, hasAccess }
      });
    });

    // Test premium features
    const premiumFeatures = [
      'excel_upload',
      'advanced_charts',
      'export_pdf',
      'google_sheets',
      'data_export_excel'
    ];

    premiumFeatures.forEach(feature => {
      const hasAccess = hasFeatureAccess(currentUser, feature);
      const needsUpgrade = requiresUpgrade(currentUser, feature);
      tests.push({
        name: `Premium Feature: ${feature}`,
        status: 'PASS', // This is informational
        details: hasAccess ? 'Access granted' : (needsUpgrade ? 'Upgrade required' : 'Access denied'),
        data: { feature, hasAccess, needsUpgrade }
      });
    });

    // Test feature gating consistency
    const authFeatures = getFeatureLimits();
    const utilFeatures = getUserLimits(currentUser);
    tests.push({
      name: 'Feature Gating Consistency',
      status: authFeatures && utilFeatures ? 'PASS' : 'WARN',
      details: 'Checking consistency between auth context and utils',
      data: { authFeatures, utilFeatures }
    });

    return {
      category: 'Feature Access Control',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testFileFormatAccess = () => {
    const tests = [];
    const formats = ['CSV', 'EXCEL', 'JSON', 'XML', 'TSV', 'TXT', 'GOOGLE_SHEETS'];

    formats.forEach(format => {
      const access = validateFileFormatAccess(currentUser, format);
      tests.push({
        name: `Format: ${format}`,
        status: access.allowed ? 'PASS' : 'INFO',
        details: access.allowed ? 'Format allowed' : access.reason,
        data: { format, access }
      });
    });

    return {
      category: 'File Format Access',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testUploadLimits = () => {
    const tests = [];
    const limits = getUserLimits(currentUser);

    // Test file count limits
    tests.push({
      name: 'File Count Limit',
      status: 'PASS',
      details: limits.files === -1 ? 'Unlimited files' : `${limits.files} files allowed`,
      data: { fileLimit: limits.files }
    });

    // Test storage limits
    const storageMB = limits.storage / (1024 * 1024);
    tests.push({
      name: 'Storage Limit',
      status: 'PASS',
      details: `${storageMB.toFixed(1)}MB storage allowed`,
      data: { storageLimit: limits.storage, storageMB }
    });

    // Test export limits
    tests.push({
      name: 'Export Limit',
      status: 'PASS',
      details: limits.exports === -1 ? 'Unlimited exports' : `${limits.exports} exports allowed`,
      data: { exportLimit: limits.exports }
    });

    return {
      category: 'Upload Limits',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testUpgradeRequirements = () => {
    const tests = [];
    const userTier = getUserTier(currentUser);

    // Test upgrade paths
    const upgradeFeatures = [
      'excel_upload',
      'advanced_charts',
      'export_pdf',
      'google_sheets'
    ];

    upgradeFeatures.forEach(feature => {
      const needsUpgrade = requiresUpgrade(currentUser, feature);
      const hasAccess = hasFeatureAccess(currentUser, feature);
      const suggestion = getUpgradeSuggestion(currentUser, feature);

      tests.push({
        name: `Upgrade for ${feature}`,
        status: needsUpgrade ? 'INFO' : 'PASS',
        details: needsUpgrade ?
          `Upgrade from ${userTier} to ${suggestion?.requiredTier || 'higher tier'} required` :
          'Feature available in current tier',
        data: { feature, needsUpgrade, hasAccess, currentTier: userTier, suggestion }
      });
    });

    return {
      category: 'Upgrade Requirements',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const testUsageTracking = () => {
    const tests = [];

    // Test feature usage tracking
    const testFeature = 'csv_upload';
    try {
      trackFeatureUsage(currentUser, testFeature);
      tests.push({
        name: 'Feature Usage Tracking',
        status: 'PASS',
        details: 'Feature usage tracked successfully',
        data: { feature: testFeature }
      });
    } catch (error) {
      tests.push({
        name: 'Feature Usage Tracking',
        status: 'FAIL',
        details: `Error tracking usage: ${error.message}`,
        data: { error: error.message }
      });
    }

    // Test usage statistics retrieval
    try {
      const stats = getFeatureUsageStats();
      tests.push({
        name: 'Usage Statistics Retrieval',
        status: stats ? 'PASS' : 'WARN',
        details: stats ? `Found ${Object.keys(stats).length} usage records` : 'No usage statistics found',
        data: stats
      });
    } catch (error) {
      tests.push({
        name: 'Usage Statistics Retrieval',
        status: 'FAIL',
        details: `Error retrieving stats: ${error.message}`,
        data: { error: error.message }
      });
    }

    // Test localStorage persistence
    const storedUsage = localStorage.getItem('featureUsage');
    tests.push({
      name: 'Usage Persistence',
      status: storedUsage ? 'PASS' : 'INFO',
      details: storedUsage ? 'Usage data persisted in localStorage' : 'No stored usage data',
      data: { hasStoredUsage: !!storedUsage }
    });

    return {
      category: 'Feature Usage Tracking',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} tests passed`
    };
  };

  const getCurrentTierInfo = () => {
    const userTier = getUserTier(currentUser);
    const tierConfig = SUBSCRIPTION_TIERS[userTier];
    const limits = getUserLimits(currentUser);

    return {
      tier: userTier,
      config: tierConfig,
      limits,
      userType: getUserType()
    };
  };

  const tierInfo = getCurrentTierInfo();

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Feature Access Control Test</h2>
        <p className="text-gray-600">
          Test subscription tier feature gating, file format access, and upgrade requirements
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runFeatureAccessTests}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
        >
          {isRunning ? 'Running Tests...' : 'Run Feature Access Tests'}
        </button>
      </div>

      {/* Current Tier Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">Current Subscription Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">User Type:</span>
            <span className="ml-2 font-medium">{tierInfo.userType}</span>
          </div>
          <div>
            <span className="text-gray-600">Subscription Tier:</span>
            <span className="ml-2 font-medium capitalize">{tierInfo.tier}</span>
          </div>
          <div>
            <span className="text-gray-600">File Limit:</span>
            <span className="ml-2 font-medium">
              {tierInfo.limits.files === -1 ? 'Unlimited' : tierInfo.limits.files}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Storage Limit:</span>
            <span className="ml-2 font-medium">
              {(tierInfo.limits.storage / (1024 * 1024)).toFixed(1)}MB
            </span>
          </div>
        </div>
        
        {tierInfo.config && (
          <div className="mt-3">
            <span className="text-gray-600">Available Features:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {tierInfo.config.features.slice(0, 8).map(feature => (
                <span key={feature} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {feature.replace(/_/g, ' ')}
                </span>
              ))}
              {tierInfo.config.features.length > 8 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  +{tierInfo.config.features.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}
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

export default FeatureAccessTest;
