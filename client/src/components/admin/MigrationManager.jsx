import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';
import GoogleUserVerification from './GoogleUserVerification';

const MigrationManager = () => {
  const { getCurrentUserToken } = useAuth();
  const [migrations, setMigrations] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [databaseSchema, setDatabaseSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState({});
  const [selectedMigrations, setSelectedMigrations] = useState([]);
  const [showSchema, setShowSchema] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadMigrations();
    loadSystemStatus();
  }, []);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const apiCall = async (endpoint, options = {}) => {
    const token = await getCurrentUserToken();
    const response = await fetch(`/api/v1/admin/migrations${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  };

  const loadMigrations = async () => {
    try {
      setLoading(true);
      const result = await apiCall('');
      setMigrations(result.data.migrations);
      addLog(`Loaded ${result.data.migrations.length} migrations`);
    } catch (error) {
      addLog(`Failed to load migrations: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const result = await apiCall('/status');
      setSystemStatus(result.data);
      addLog('System status loaded');
    } catch (error) {
      addLog(`Failed to load system status: ${error.message}`, 'error');
    }
  };

  const loadDatabaseSchema = async () => {
    try {
      setLoading(true);
      const result = await apiCall('/schema');
      setDatabaseSchema(result.data);
      setShowSchema(true);
      addLog('Database schema loaded');
    } catch (error) {
      addLog(`Failed to load database schema: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const executeMigration = async (migrationName) => {
    try {
      setExecuting(prev => ({ ...prev, [migrationName]: true }));
      addLog(`Executing migration: ${migrationName}`, 'info');

      const result = await apiCall(`/${migrationName}/execute`, {
        method: 'POST',
        body: JSON.stringify({ createBackup: true })
      });

      if (result.success) {
        addLog(`Migration ${migrationName} completed successfully`, 'success');
        await loadMigrations();
      } else {
        addLog(`Migration ${migrationName} failed: ${result.data.error}`, 'error');
      }
    } catch (error) {
      addLog(`Migration execution failed: ${error.message}`, 'error');
    } finally {
      setExecuting(prev => ({ ...prev, [migrationName]: false }));
    }
  };

  const rollbackMigration = async (migrationName) => {
    if (!confirm(`Are you sure you want to rollback migration: ${migrationName}?`)) {
      return;
    }

    try {
      setExecuting(prev => ({ ...prev, [migrationName]: true }));
      addLog(`Rolling back migration: ${migrationName}`, 'info');

      const result = await apiCall(`/${migrationName}/rollback`, {
        method: 'POST'
      });

      if (result.success) {
        addLog(`Migration ${migrationName} rolled back successfully`, 'success');
        await loadMigrations();
      } else {
        addLog(`Migration rollback failed: ${result.data.error}`, 'error');
      }
    } catch (error) {
      addLog(`Migration rollback failed: ${error.message}`, 'error');
    } finally {
      setExecuting(prev => ({ ...prev, [migrationName]: false }));
    }
  };

  const executeBatchMigrations = async () => {
    if (selectedMigrations.length === 0) {
      addLog('No migrations selected for batch execution', 'warning');
      return;
    }

    if (!confirm(`Execute ${selectedMigrations.length} migrations in batch?`)) {
      return;
    }

    try {
      setLoading(true);
      addLog(`Executing ${selectedMigrations.length} migrations in batch`, 'info');

      const result = await apiCall('/batch', {
        method: 'POST',
        body: JSON.stringify({
          migrations: selectedMigrations,
          createBackup: true,
          stopOnError: true
        })
      });

      if (result.success) {
        addLog(`Batch execution completed: ${result.data.successCount} successful, ${result.data.failureCount} failed`, 'success');
      } else {
        addLog(`Batch execution failed: ${result.data.failureCount} migrations failed`, 'error');
      }

      await loadMigrations();
      setSelectedMigrations([]);
    } catch (error) {
      addLog(`Batch execution failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setLoading(true);
      addLog('Creating database backup...', 'info');

      const result = await apiCall('/backup', {
        method: 'POST',
        body: JSON.stringify({ name: `manual_backup_${Date.now()}` })
      });

      if (result.success) {
        addLog(`Backup created successfully: ${result.data.name}`, 'success');
      }
    } catch (error) {
      addLog(`Backup creation failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Icons.Check className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <Icons.X className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Icons.Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Icons.Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Migration Manager</h1>
          <p className="text-gray-600 mt-1">Manage database schema changes and migrations</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={createBackup}
            disabled={loading}
            variant="outline"
            icon={Icons.Download}
          >
            Create Backup
          </Button>
          <Button
            onClick={loadDatabaseSchema}
            disabled={loading}
            variant="outline"
            icon={Icons.Database}
          >
            View Schema
          </Button>
          <Button
            onClick={loadMigrations}
            disabled={loading}
            variant="primary"
            icon={Icons.Refresh}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status */}
      {systemStatus && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Icons.Activity className="w-5 h-5 mr-2" />
            System Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{systemStatus.totalMigrations}</div>
              <div className="text-sm text-gray-600">Total Migrations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{systemStatus.completedMigrations}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{systemStatus.pendingMigrations}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{systemStatus.failedMigrations}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
        </Card>
      )}

      {/* Batch Operations */}
      {selectedMigrations.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Icons.CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">
                {selectedMigrations.length} migration(s) selected
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setSelectedMigrations([])}
                variant="outline"
                size="sm"
              >
                Clear Selection
              </Button>
              <Button
                onClick={executeBatchMigrations}
                disabled={loading}
                variant="primary"
                size="sm"
                icon={Icons.Play}
              >
                Execute Batch
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Migrations List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Icons.List className="w-5 h-5 mr-2" />
          Migrations
        </h2>
        
        {loading && migrations.length === 0 ? (
          <div className="text-center py-8">
            <Icons.Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-600">Loading migrations...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {migrations.map((migration) => (
              <div
                key={migration.name}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedMigrations.includes(migration.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMigrations(prev => [...prev, migration.name]);
                        } else {
                          setSelectedMigrations(prev => prev.filter(name => name !== migration.name));
                        }
                      }}
                      disabled={migration.executed}
                      className="rounded"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{migration.name}</h3>
                      <p className="text-sm text-gray-600">{migration.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">Version: {migration.version}</span>
                        {migration.executedAt && (
                          <span className="text-xs text-gray-500">
                            Executed: {new Date(migration.executedAt).toLocaleString()}
                          </span>
                        )}
                        {migration.executionTime && (
                          <span className="text-xs text-gray-500">
                            Duration: {migration.executionTime}ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(migration.status)}`}>
                      {getStatusIcon(migration.status)}
                      <span className="ml-1">{migration.status}</span>
                    </span>
                    
                    <div className="flex space-x-2">
                      {!migration.executed && (
                        <Button
                          onClick={() => executeMigration(migration.name)}
                          disabled={executing[migration.name] || loading}
                          variant="primary"
                          size="sm"
                          icon={executing[migration.name] ? Icons.Clock : Icons.Play}
                        >
                          {executing[migration.name] ? 'Executing...' : 'Execute'}
                        </Button>
                      )}
                      
                      {migration.executed && migration.rollbackAvailable && migration.status === 'completed' && (
                        <Button
                          onClick={() => rollbackMigration(migration.name)}
                          disabled={executing[migration.name] || loading}
                          variant="outline"
                          size="sm"
                          icon={executing[migration.name] ? Icons.Clock : Icons.Undo}
                        >
                          {executing[migration.name] ? 'Rolling back...' : 'Rollback'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Activity Logs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Icons.FileText className="w-5 h-5 mr-2" />
            Activity Logs
          </h2>
          <Button
            onClick={() => setLogs([])}
            variant="outline"
            size="sm"
            icon={Icons.Trash}
          >
            Clear Logs
          </Button>
        </div>
        
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-400">No activity logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`mb-1 ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                log.type === 'warning' ? 'text-yellow-400' :
                'text-gray-300'
              }`}>
                <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Database Schema Modal */}
      {showSchema && databaseSchema && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Database Schema</h2>
              <Button
                onClick={() => setShowSchema(false)}
                variant="outline"
                size="sm"
                icon={Icons.X}
              >
                Close
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-medium text-gray-900">Database: {databaseSchema.database}</h3>
                  <p className="text-sm text-gray-600">Collections: {databaseSchema.collections.length}</p>
                </div>
              </div>
              
              {databaseSchema.collections.map((collection) => (
                <div key={collection.name} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{collection.name}</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Documents:</span> {collection.documentCount}
                    </div>
                    <div>
                      <span className="text-gray-600">Size:</span> {(collection.size / 1024).toFixed(2)} KB
                    </div>
                    <div>
                      <span className="text-gray-600">Indexes:</span> {collection.indexes}
                    </div>
                  </div>
                  
                  {Object.keys(collection.sampleSchema).length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Schema:</h5>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(collection.sampleSchema, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrationManager;
