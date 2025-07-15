import React, { useState } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import UserManagement from '../../components/admin/UserManagement';
import SystemMonitoring from '../../components/admin/SystemMonitoring';
import PaymentManagement from '../../components/admin/PaymentManagement';
import DatabaseManager from '../../components/admin/DatabaseManager';
import EnhancedDatabaseManager from '../../components/admin/EnhancedDatabaseManager';
import DatabaseManagerTest from '../../components/admin/DatabaseManagerTest';
import AdminTest from '../../components/admin/AdminTest';
import FeatureManagement from '../../components/admin/FeatureManagement';
import UsageAnalytics from '../../components/admin/UsageAnalytics';
import MigrationManager from '../../components/admin/MigrationManager';
import GoogleUserVerification from '../../components/admin/GoogleUserVerification';
import RoleBasedTester from '../../components/testing/RoleBasedTester';
import ComprehensiveAudit from '../../components/testing/ComprehensiveAudit';
import ComprehensiveAuthAudit from '../../components/testing/ComprehensiveAuthAudit';

const AdminDashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('test');

  // Redirect if not admin
  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFFCA]/30">
        <div className="bg-white rounded-2xl p-8 border border-[#84AE92]/20 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#5A827E] mb-2">Access Denied</h2>
          <p className="text-[#5A827E]/70">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'auth-audit', name: 'Auth Audit', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'audit', name: 'Full Audit', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'test', name: 'API Test', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'role-test', name: 'Role Testing', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547A1.934 1.934 0 004 17.5c0 .775.301 1.52.828 2.047l.724.724a2 2 0 002.828 0l4.096-4.096a2 2 0 012.828 0l4.096 4.096a2 2 0 002.828 0l.724-.724A2.934 2.934 0 0020 17.5a1.934 1.934 0 00-.572-1.072z' },
    { id: 'features', name: 'Features', icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z' },
    { id: 'analytics', name: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'overview', name: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'users', name: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
    { id: 'payments', name: 'Payments', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'system', name: 'System', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
    { id: 'database', name: 'Database', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
    { id: 'migrations', name: 'Migrations', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { id: 'google-users', name: 'Google Users', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'auth-audit':
        return <ComprehensiveAuthAudit />;
      case 'audit':
        return <ComprehensiveAudit />;
      case 'test':
        return <AdminTest />;
      case 'role-test':
        return <RoleBasedTester />;
      case 'features':
        return <FeatureManagement />;
      case 'analytics':
        return <UsageAnalytics />;
      case 'overview':
        return <SystemMonitoring />;
      case 'users':
        return <UserManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'system':
        return <SystemMonitoring />;
      case 'database':
        return <DatabaseManagerTest />;
      case 'migrations':
        return <MigrationManager />;
      case 'google-users':
        return <GoogleUserVerification />;
      default:
        return <ComprehensiveAuthAudit />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5A827E]/5 to-[#84AE92]/5 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#5A827E] mb-3">
              Admin Dashboard
            </h1>
            <p className="text-base sm:text-lg text-[#5A827E]/70">
              Manage users, monitor system performance, and oversee platform operations.
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
            <div className="bg-white rounded-xl p-4 border border-[#84AE92]/20">
              <div className="text-sm text-[#5A827E]/70">Logged in as</div>
              <div className="font-medium text-[#5A827E]">{currentUser?.name}</div>
              <div className="text-xs text-[#5A827E]/70 capitalize">{currentUser?.role} Access</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-[#84AE92]/20 shadow-sm">
        <div className="border-b border-[#84AE92]/20">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-[#5A827E] text-[#5A827E]'
                    : 'border-transparent text-[#5A827E]/70 hover:text-[#5A827E] hover:border-[#84AE92]'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                </svg>
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
