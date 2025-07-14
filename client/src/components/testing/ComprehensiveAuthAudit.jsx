import React, { useState } from 'react';
import AuthenticationAudit from './AuthenticationAudit';
import VisitorTrackingTest from './VisitorTrackingTest';
import FeatureAccessTest from './FeatureAccessTest';
import BackendAudit from './BackendAudit';
import CodeCleanupAudit from './CodeCleanupAudit';
import ErrorHandlingAudit from './ErrorHandlingAudit';
import UserJourneyTest from './UserJourneyTest';
import UpgradeFunctionalityAudit from './UpgradeFunctionalityAudit';
import PaymentServiceTest from './PaymentServiceTest';
import { useAuth } from '../../context/FirebaseAuthContext';

const ComprehensiveAuthAudit = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { currentUser, isVisitor, getUserType } = useAuth();

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'authentication', name: 'Authentication', icon: '🔐' },
    { id: 'visitor-tracking', name: 'Visitor Tracking', icon: '👤' },
    { id: 'feature-access', name: 'Feature Access', icon: '🎛️' },
    { id: 'backend-audit', name: 'Backend API', icon: '🔗' },
    { id: 'error-handling', name: 'Error Handling', icon: '🚨' },
    { id: 'user-journey', name: 'User Journey', icon: '🛤️' },
    { id: 'upgrade-functionality', name: 'Upgrade Functions', icon: '⬆️' },
    { id: 'payment-service', name: 'Payment Service', icon: '💳' },
    { id: 'code-cleanup', name: 'Code Quality', icon: '🧹' }
  ];

  const getSystemStatus = () => {
    const status = {
      userType: getUserType(),
      isAuthenticated: !!currentUser,
      isVisitor: isVisitor(),
      hasFirebaseAuth: !!currentUser?.id,
      hasVisitorSession: !!localStorage.getItem('visitor_fingerprint')
    };

    const healthScore = Object.values(status).filter(Boolean).length / Object.keys(status).length * 100;
    
    return { ...status, healthScore: Math.round(healthScore) };
  };

  const systemStatus = getSystemStatus();

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Health */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Overview</h3>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Health Score</span>
            <span className="text-sm font-medium text-gray-900">{systemStatus.healthScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                systemStatus.healthScore >= 80 ? 'bg-green-600' :
                systemStatus.healthScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
              }`}
              style={{ width: `${systemStatus.healthScore}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatusCard
            title="User Type"
            value={systemStatus.userType}
            status={systemStatus.userType ? 'good' : 'warning'}
          />
          <StatusCard
            title="Authentication"
            value={systemStatus.isAuthenticated ? 'Authenticated' : 'Visitor'}
            status={systemStatus.isAuthenticated ? 'good' : 'info'}
          />
          <StatusCard
            title="Firebase Auth"
            value={systemStatus.hasFirebaseAuth ? 'Connected' : 'Not Connected'}
            status={systemStatus.hasFirebaseAuth ? 'good' : 'warning'}
          />
          <StatusCard
            title="Visitor Tracking"
            value={systemStatus.hasVisitorSession ? 'Active' : 'Inactive'}
            status={systemStatus.hasVisitorSession ? 'good' : 'info'}
          />
          <StatusCard
            title="Session Type"
            value={systemStatus.isVisitor ? 'Visitor Session' : 'User Session'}
            status="info"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('authentication')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">🔐</div>
            <div className="font-medium text-gray-900">Test Authentication</div>
            <div className="text-sm text-gray-600">Verify auth flows and role-based access</div>
          </button>
          
          <button
            onClick={() => setActiveTab('visitor-tracking')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">👤</div>
            <div className="font-medium text-gray-900">Test Visitor Tracking</div>
            <div className="text-sm text-gray-600">Check fingerprinting and upload limits</div>
          </button>
          
          <button
            onClick={() => setActiveTab('feature-access')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">🎛️</div>
            <div className="font-medium text-gray-900">Test Feature Access</div>
            <div className="text-sm text-gray-600">Verify subscription tier gating</div>
          </button>

          <button
            onClick={() => setActiveTab('backend-audit')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">🔗</div>
            <div className="font-medium text-gray-900">Test Backend API</div>
            <div className="text-sm text-gray-600">Verify API endpoints and connectivity</div>
          </button>
        </div>
      </div>

      {/* Current User Info */}
      {currentUser && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current User Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-600">Email:</span> <span className="font-medium">{currentUser.email}</span></div>
            <div><span className="text-gray-600">Role:</span> <span className="font-medium">{currentUser.role}</span></div>
            <div><span className="text-gray-600">Subscription:</span> <span className="font-medium">{currentUser.subscription}</span></div>
            <div><span className="text-gray-600">Files:</span> <span className="font-medium">{currentUser.filesCount}/{currentUser.filesLimit === -1 ? 'unlimited' : currentUser.filesLimit}</span></div>
          </div>
        </div>
      )}

      {/* Visitor Info */}
      {isVisitor() && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitor Session Information</h3>
          <div className="text-sm text-gray-600">
            <p>You are currently browsing as a visitor. Visitor tracking and upload limits are active.</p>
            <p className="mt-2">
              <span className="font-medium">Fingerprint ID:</span> {localStorage.getItem('visitor_fingerprint') || 'Not set'}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Comprehensive Authentication & Access Control Audit
          </h1>
          <p className="text-gray-600">
            Complete testing suite for authentication flows, visitor tracking, and feature access control
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'authentication' && <AuthenticationAudit />}
          {activeTab === 'visitor-tracking' && <VisitorTrackingTest />}
          {activeTab === 'feature-access' && <FeatureAccessTest />}
          {activeTab === 'backend-audit' && <BackendAudit />}
          {activeTab === 'error-handling' && <ErrorHandlingAudit />}
          {activeTab === 'user-journey' && <UserJourneyTest />}
          {activeTab === 'upgrade-functionality' && <UpgradeFunctionalityAudit />}
          {activeTab === 'payment-service' && <PaymentServiceTest />}
          {activeTab === 'code-cleanup' && <CodeCleanupAudit />}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Authentication & Access Control Audit Tool v1.0</p>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

const StatusCard = ({ title, value, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor(status)}`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
};

export default ComprehensiveAuthAudit;
