import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';
import EnhancedDataViewer from './EnhancedDataViewer';

const EnhancedDatabaseManager = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dbStatus, setDbStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [migrations, setMigrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [dataViewer, setDataViewer] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  });

  // Fetch database information
  const fetchDatabaseInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = getAuthHeaders();

      // Fetch database status
      const statusResponse = await fetch(`${API_BASE}/admin/db/status`, { headers });
      const statusData = await statusResponse.json();
      if (statusData.success) setDbStatus(statusData.data);

      // Fetch collection stats
      const statsResponse = await fetch(`${API_BASE}/admin/db/stats`, { headers });
      const statsData = await statsResponse.json();
      if (statsData.success) setStats(statsData.data);

      // Fetch migration history
      const migrationsResponse = await fetch(`${API_BASE}/admin/db/migrations`, { headers });
      const migrationsData = await migrationsResponse.json();
      if (migrationsData.success) setMigrations(migrationsData.data);

    } catch (error) {
      setError(`Failed to fetch database info: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Run migration
  const runMigration = async (direction = 'up', version = null) => {
    setOperationLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`${API_BASE}/admin/db/migrate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ direction, version })
      });

      const data = await response.json();
      if (data.success) {
        setResults({ 
          type: 'success', 
          message: `Migration ${direction} completed successfully`,
          data: data.data 
        });
        fetchDatabaseInfo();
      } else {
        setError(data.message || 'Migration failed');
      }
    } catch (error) {
      setError(`Migration failed: ${error.message}`);
    } finally {
      setOperationLoading(false);
    }
  };

  // Run seeder
  const runSeeder = async (type, options = {}) => {
    setOperationLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`${API_BASE}/admin/db/seed`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type, options })
      });

      const data = await response.json();
      if (data.success) {
        setResults({ 
          type: 'success', 
          message: `Seeder '${type}' completed successfully`,
          data: data.data 
        });
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

  // Clear collection with confirmation
  const clearCollection = async (collection) => {
    setOperationLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`${API_BASE}/admin/db/clear`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ collection })
      });

      const data = await response.json();
      if (data.success) {
        setResults({ 
          type: 'success', 
          message: `Collection '${collection}' cleared successfully`,
          data: data.data 
        });
        fetchDatabaseInfo();
      } else {
        setError(data.message || 'Clear operation failed');
      }
    } catch (error) {
      setError(`Clear operation failed: ${error.message}`);
    } finally {
      setOperationLoading(false);
      setConfirmDialog(null);
    }
  };

  // Confirmation dialog component
  const ConfirmDialog = ({ title, message, onConfirm, onCancel, danger = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              danger ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <Icons.AlertCircle className={`w-6 h-6 ${
                danger ? 'text-red-600' : 'text-yellow-600'
              }`} />
            </div>
            <h3 className="text-lg font-semibold text-[#5A827E]">{title}</h3>
          </div>
          <p className="text-[#5A827E]/70 mb-6">{message}</p>
          <div className="flex space-x-3">
            <Button
              onClick={onCancel}
              variant="ghost"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              variant={danger ? "outline" : "primary"}
              className={danger ? "flex-1 text-red-600 border-red-600 hover:bg-red-50" : "flex-1"}
              disabled={operationLoading}
            >
              {operationLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Icons.Database },
    { id: 'migrations', name: 'Migrations', icon: Icons.ArrowUp },
    { id: 'seeders', name: 'Seeders', icon: Icons.Plus },
    { id: 'collections', name: 'Collections', icon: Icons.Table },
    { id: 'monitoring', name: 'Monitoring', icon: Icons.Activity }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#5A827E]">Database Management</h1>
          <p className="text-[#5A827E]/70 mt-1">Manage database operations, migrations, and monitoring</p>
        </div>
        <Button
          onClick={fetchDatabaseInfo}
          disabled={loading}
          icon={loading ? Icons.Loader : Icons.ArrowRight}
          variant="outline"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icons.AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {results && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icons.Check className="w-5 h-5 text-green-600" />
            <span className="text-green-700">{results.message}</span>
          </div>
          {results.data && (
            <pre className="mt-2 text-sm text-green-600 bg-green-100 p-2 rounded">
              {JSON.stringify(results.data, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-[#84AE92]/20">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive 
                    ? 'border-[#84AE92] text-[#5A827E]' 
                    : 'border-transparent text-[#5A827E]/60 hover:text-[#5A827E] hover:border-[#84AE92]/50'
                  }
                `}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database Status */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-[#5A827E] mb-4 flex items-center space-x-2">
                <Icons.Database className="w-5 h-5" />
                <span>Database Status</span>
              </h2>
              {dbStatus ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#5A827E]/70">Connection:</span>
                    <span className={`font-medium flex items-center space-x-1 ${
                      dbStatus.state === 'connected' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        dbStatus.state === 'connected' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="capitalize">{dbStatus.state}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A827E]/70">Database:</span>
                    <span className="font-medium text-[#5A827E]">{dbStatus.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A827E]/70">Host:</span>
                    <span className="font-medium text-[#5A827E]">{dbStatus.host}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A827E]/70">Collections:</span>
                    <span className="font-medium text-[#5A827E]">{dbStatus.collections}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Icons.Loader className="w-6 h-6 animate-spin text-[#84AE92]" />
                </div>
              )}
            </Card>

            {/* Collection Statistics */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-[#5A827E] mb-4 flex items-center space-x-2">
                <Icons.Table className="w-5 h-5" />
                <span>Collection Statistics</span>
              </h2>
              {stats ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#5A827E]/70">Users:</span>
                    <span className="font-medium text-[#5A827E]">{stats.counts?.users || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A827E]/70">Files:</span>
                    <span className="font-medium text-[#5A827E]">{stats.counts?.files || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A827E]/70">Subscriptions:</span>
                    <span className="font-medium text-[#5A827E]">{stats.counts?.subscriptions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A827E]/70">Payments:</span>
                    <span className="font-medium text-[#5A827E]">{stats.counts?.payments || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A827E]/70">Total Documents:</span>
                    <span className="font-medium text-[#5A827E]">{stats.totalDocuments || 0}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Icons.Loader className="w-6 h-6 animate-spin text-[#84AE92]" />
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Migrations Tab */}
        {activeTab === 'migrations' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#5A827E] flex items-center space-x-2">
                  <Icons.ArrowUp className="w-5 h-5" />
                  <span>Database Migrations</span>
                </h2>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => runMigration('up')}
                    disabled={operationLoading}
                    icon={Icons.ArrowUp}
                    variant="primary"
                  >
                    Run Migrations
                  </Button>
                  <Button
                    onClick={() => setConfirmDialog({
                      title: 'Rollback Migration',
                      message: 'Are you sure you want to rollback the last migration? This action cannot be undone.',
                      onConfirm: () => runMigration('down'),
                      danger: true
                    })}
                    disabled={operationLoading}
                    icon={Icons.ArrowLeft}
                    variant="outline"
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                  >
                    Rollback
                  </Button>
                </div>
              </div>

              {/* Migration History */}
              <div className="space-y-3">
                <h3 className="font-medium text-[#5A827E]">Migration History</h3>
                {migrations.length > 0 ? (
                  <div className="space-y-2">
                    {migrations.map((migration, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#FAFFCA]/30 rounded-lg border border-[#84AE92]/20">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            migration.status === 'completed' ? 'bg-green-500' :
                            migration.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <div>
                            <div className="font-medium text-[#5A827E]">{migration.name}</div>
                            <div className="text-sm text-[#5A827E]/70">
                              Version: {migration.version} • {new Date(migration.executedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            migration.status === 'completed' ? 'bg-green-100 text-green-800' :
                            migration.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {migration.status}
                          </span>
                          {migration.status === 'completed' && (
                            <Button
                              onClick={() => setConfirmDialog({
                                title: 'Rollback to Version',
                                message: `Are you sure you want to rollback to version ${migration.version}? This will undo all migrations after this point.`,
                                onConfirm: () => runMigration('down', migration.version),
                                danger: true
                              })}
                              variant="ghost"
                              size="sm"
                              icon={Icons.ArrowLeft}
                            >
                              Rollback to Here
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#5A827E]/60">
                    <Icons.Database className="w-12 h-12 mx-auto mb-3 text-[#84AE92]/50" />
                    <p>No migration history available</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Seeders Tab */}
        {activeTab === 'seeders' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-[#5A827E] mb-4 flex items-center space-x-2">
                <Icons.Plus className="w-5 h-5" />
                <span>Database Seeders</span>
              </h2>
              <p className="text-[#5A827E]/70 mb-6">
                Populate your database with sample data for testing and development.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => runSeeder('subscription-plans')}
                  disabled={operationLoading}
                  className="justify-start h-auto p-4 flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Icons.Crown className="w-4 h-4" />
                    <span className="font-medium">Subscription Plans</span>
                  </div>
                  <span className="text-sm text-left">Create default subscription tiers</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runSeeder('sample-users', { count: 10 })}
                  disabled={operationLoading}
                  className="justify-start h-auto p-4 flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Icons.User className="w-4 h-4" />
                    <span className="font-medium">Sample Users (10)</span>
                  </div>
                  <span className="text-sm text-left">Generate test user accounts</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runSeeder('sample-files', { count: 20 })}
                  disabled={operationLoading}
                  className="justify-start h-auto p-4 flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Icons.Upload className="w-4 h-4" />
                    <span className="font-medium">Sample Files (20)</span>
                  </div>
                  <span className="text-sm text-left">Create test CSV files and data</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runSeeder('usage-data', { days: 30 })}
                  disabled={operationLoading}
                  className="justify-start h-auto p-4 flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Icons.Activity className="w-4 h-4" />
                    <span className="font-medium">Usage Data (30 days)</span>
                  </div>
                  <span className="text-sm text-left">Generate analytics and usage metrics</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runSeeder('payment-history', { count: 50 })}
                  disabled={operationLoading}
                  className="justify-start h-auto p-4 flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Icons.CreditCard className="w-4 h-4" />
                    <span className="font-medium">Payment History (50)</span>
                  </div>
                  <span className="text-sm text-left">Create mock payment transactions</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runSeeder('complete-dataset')}
                  disabled={operationLoading}
                  className="justify-start h-auto p-4 flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Icons.Database className="w-4 h-4" />
                    <span className="font-medium">Complete Dataset</span>
                  </div>
                  <span className="text-sm text-left">Seed all collections with realistic data</span>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-[#5A827E] mb-4 flex items-center space-x-2">
                <Icons.Table className="w-5 h-5" />
                <span>Collection Management</span>
              </h2>
              <p className="text-[#5A827E]/70 mb-6">
                Manage database collections and perform maintenance operations.
              </p>

              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(stats.counts || {}).map(([collection, count]) => (
                    <div key={collection} className="bg-[#FAFFCA]/30 rounded-lg border border-[#84AE92]/20 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Icons.Database className="w-4 h-4 text-[#84AE92]" />
                          <span className="font-medium text-[#5A827E] capitalize">{collection}</span>
                        </div>
                        <span className="text-lg font-bold text-[#5A827E]">{count}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Icons.Eye}
                          onClick={() => setDataViewer(collection)}
                          className="flex-1"
                        >
                          View Data
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Icons.Trash}
                          onClick={() => setConfirmDialog({
                            title: 'Clear Collection',
                            message: `Are you sure you want to clear all data from the '${collection}' collection? This action cannot be undone.`,
                            onConfirm: () => clearCollection(collection),
                            danger: true
                          })}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Real-time Status */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-[#5A827E] mb-4 flex items-center space-x-2">
                  <Icons.Activity className="w-5 h-5" />
                  <span>Real-time Status</span>
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#FAFFCA]/30 rounded-lg">
                    <span className="text-[#5A827E]/70">Database Connection</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        dbStatus?.state === 'connected' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium text-[#5A827E]">
                        {dbStatus?.state || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#FAFFCA]/30 rounded-lg">
                    <span className="text-[#5A827E]/70">Total Collections</span>
                    <span className="text-sm font-medium text-[#5A827E]">
                      {dbStatus?.collections || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#FAFFCA]/30 rounded-lg">
                    <span className="text-[#5A827E]/70">Total Documents</span>
                    <span className="text-sm font-medium text-[#5A827E]">
                      {stats?.totalDocuments || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#FAFFCA]/30 rounded-lg">
                    <span className="text-[#5A827E]/70">Last Updated</span>
                    <span className="text-sm font-medium text-[#5A827E]">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Performance Metrics */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-[#5A827E] mb-4 flex items-center space-x-2">
                  <Icons.TrendingUp className="w-5 h-5" />
                  <span>Performance Metrics</span>
                </h2>
                <div className="space-y-4">
                  {stats?.performance ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-[#FAFFCA]/30 rounded-lg">
                        <span className="text-[#5A827E]/70">Average Query Time</span>
                        <span className="text-sm font-medium text-[#5A827E]">
                          {stats.performance.avgQueryTime}ms
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#FAFFCA]/30 rounded-lg">
                        <span className="text-[#5A827E]/70">Active Connections</span>
                        <span className="text-sm font-medium text-[#5A827E]">
                          {stats.performance.activeConnections}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#FAFFCA]/30 rounded-lg">
                        <span className="text-[#5A827E]/70">Memory Usage</span>
                        <span className="text-sm font-medium text-[#5A827E]">
                          {stats.performance.memoryUsage}MB
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-[#5A827E]/60">
                      <Icons.TrendingUp className="w-12 h-12 mx-auto mb-3 text-[#84AE92]/50" />
                      <p>Performance metrics not available</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Auto-refresh toggle */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[#5A827E]">Auto-refresh Monitoring</h3>
                  <p className="text-sm text-[#5A827E]/70">Automatically refresh database status every 30 seconds</p>
                </div>
                <Button
                  variant="outline"
                  icon={Icons.ArrowRight}
                  onClick={() => {
                    // TODO: Implement auto-refresh toggle
                    console.log('Auto-refresh toggled');
                  }}
                >
                  Enable Auto-refresh
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmDialog && (
          <ConfirmDialog
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(null)}
            danger={confirmDialog.danger}
          />
        )}
      </div>

      {/* Data Viewer Modal */}
      {dataViewer && (
        <EnhancedDataViewer
          collection={dataViewer}
          onClose={() => setDataViewer(null)}
        />
      )}
    </div>
  );
};

export default EnhancedDatabaseManager;
