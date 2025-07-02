import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Spinner, LoadingOverlay } from '../ui';

const DatabaseManager = () => {
  const { currentUser } = useAuth();
  const [dbStatus, setDbStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // API base URL
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

  // Check if user is admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">This page is restricted to administrators only.</p>
      </div>
    );
  }

  // Fetch database status and stats
  const fetchDatabaseInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch database status
      const statusResponse = await fetch(`${API_BASE}/admin/db/status`, { headers });
      const statusData = await statusResponse.json();

      if (statusData.success) {
        setDbStatus(statusData.data);
      }

      // Fetch collection stats
      const statsResponse = await fetch(`${API_BASE}/admin/db/stats`, { headers });
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

    } catch (error) {
      setError(`Failed to fetch database info: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Run seeder
  const runSeeder = async (type, options = {}) => {
    setOperationLoading(true);
    setError(null);
    setResults(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/admin/db/seed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, options })
      });

      const data = await response.json();

      if (data.success) {
        setResults({ type: 'success', message: data.message, data: data.data });
        // Refresh stats after seeding
        fetchDatabaseInfo();
      } else {
        setError(data.message || 'Seeder failed');
      }

    } catch (error) {
      setError(`Seeder failed: ${error.message}`);
    } finally {
      setOperationLoading(false);
    }
  };

  // Clear collection
  const clearCollection = async (collection) => {
    if (!confirm(`Are you sure you want to clear the '${collection}' collection? This action cannot be undone.`)) {
      return;
    }

    setOperationLoading(true);
    setError(null);
    setResults(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/admin/db/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ collection, confirm: true })
      });

      const data = await response.json();

      if (data.success) {
        setResults({ type: 'warning', message: data.message, data: data.data });
        // Refresh stats after clearing
        fetchDatabaseInfo();
      } else {
        setError(data.message || 'Clear operation failed');
      }

    } catch (error) {
      setError(`Clear operation failed: ${error.message}`);
    } finally {
      setOperationLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Manager</h1>
          <p className="text-gray-600 mt-1">Manage database connections, seeders, and test data</p>
        </div>
        <Button
          onClick={fetchDatabaseInfo}
          disabled={loading}
          icon={() => (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        >
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className={`border rounded-xl p-4 ${
          results.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center mb-2">
            <svg className={`w-5 h-5 mr-2 ${
              results.type === 'success' ? 'text-green-500' : 'text-yellow-500'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className={`font-medium ${
              results.type === 'success' ? 'text-green-700' : 'text-yellow-700'
            }`}>{results.message}</p>
          </div>
          {results.data && (
            <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
              {JSON.stringify(results.data, null, 2)}
            </pre>
          )}
        </div>
      )}

      <LoadingOverlay isLoading={loading} message="Loading database information...">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Database Status */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Status</h2>
              {dbStatus ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Connection:</span>
                    <span className={`font-medium ${
                      dbStatus.state === 'connected' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {dbStatus.state}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database:</span>
                    <span className="font-medium text-gray-900">{dbStatus.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Host:</span>
                    <span className="font-medium text-gray-900">{dbStatus.host}:{dbStatus.port}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Collections:</span>
                    <span className="font-medium text-gray-900">{dbStatus.collections?.length || 0}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              )}
            </div>
          </Card>

          {/* Collection Statistics */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Collection Statistics</h2>
              {stats ? (
                <div className="space-y-3">
                  {/* Add null checks for stats.counts */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Users:</span>
                    <span className="font-medium text-gray-900">{stats.counts?.users || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Files:</span>
                    <span className="font-medium text-gray-900">{stats.counts?.files || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subscription Plans:</span>
                    <span className="font-medium text-gray-900">{stats.counts?.subscriptionPlans || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Usage Records:</span>
                    <span className="font-medium text-gray-900">{stats.counts?.usage || 0}</span>
                  </div>
                  
                  {stats.recentActivity && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Last 24 Hours:</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">New Users:</span>
                        <span className="font-medium text-blue-600">{stats.recentActivity.newUsers || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">New Files:</span>
                        <span className="font-medium text-blue-600">{stats.recentActivity.newFiles || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              )}
            </div>
          </Card>
        </div>
      </LoadingOverlay>

      {/* Seeder Operations */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Seeders</h2>
          <p className="text-gray-600 mb-6">Populate the database with sample data for testing</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => runSeeder('subscription-plans')}
              disabled={operationLoading}
              className="justify-start"
            >
              Seed Subscription Plans
            </Button>
            
            <Button
              variant="outline"
              onClick={() => runSeeder('sample-users', { count: 10 })}
              disabled={operationLoading}
              className="justify-start"
            >
              Seed Sample Users (10)
            </Button>
            
            <Button
              variant="outline"
              onClick={() => runSeeder('sample-files', { count: 20 })}
              disabled={operationLoading}
              className="justify-start"
            >
              Seed Sample Files (20)
            </Button>
            
            <Button
              variant="outline"
              onClick={() => runSeeder('usage-data', { days: 30 })}
              disabled={operationLoading}
              className="justify-start"
            >
              Seed Usage Data (30 days)
            </Button>
            
            <Button
              variant="primary"
              onClick={() => runSeeder('all')}
              disabled={operationLoading}
              className="justify-start md:col-span-2"
            >
              {operationLoading ? <Spinner size="sm" /> : null}
              Seed All Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Viewer */}
      {stats && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Distribution</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Roles */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">User Roles</h3>
                <div className="space-y-2">
                  {stats.distributions.userRoles.map((role, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{role._id}:</span>
                      <span className="font-medium text-gray-900">{role.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscription Tiers */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Subscription Tiers</h3>
                <div className="space-y-2">
                  {stats.distributions.subscriptionTiers.map((tier, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{tier._id}:</span>
                      <span className="font-medium text-gray-900">{tier.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Statuses */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">File Statuses</h3>
                <div className="space-y-2">
                  {stats.distributions.fileStatuses.map((status, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{status._id}:</span>
                      <span className="font-medium text-gray-900">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Clear Operations */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Clear Collections</h2>
          <p className="text-gray-600 mb-6">⚠️ Warning: These operations will permanently delete data</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => clearCollection('users')}
              disabled={operationLoading}
              className="justify-start border-red-200 text-red-600 hover:bg-red-50"
            >
              Clear Users (Keep Admins)
            </Button>

            <Button
              variant="outline"
              onClick={() => clearCollection('files')}
              disabled={operationLoading}
              className="justify-start border-red-200 text-red-600 hover:bg-red-50"
            >
              Clear Files
            </Button>

            <Button
              variant="outline"
              onClick={() => clearCollection('subscriptions')}
              disabled={operationLoading}
              className="justify-start border-red-200 text-red-600 hover:bg-red-50"
            >
              Clear Subscriptions
            </Button>

            <Button
              variant="outline"
              onClick={() => clearCollection('usage')}
              disabled={operationLoading}
              className="justify-start border-red-200 text-red-600 hover:bg-red-50"
            >
              Clear Usage Data
            </Button>

            <Button
              variant="outline"
              onClick={() => clearCollection('all')}
              disabled={operationLoading}
              className="justify-start border-red-200 text-red-600 hover:bg-red-50 md:col-span-2"
            >
              {operationLoading ? <Spinner size="sm" /> : null}
              Clear All Data
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DatabaseManager;

