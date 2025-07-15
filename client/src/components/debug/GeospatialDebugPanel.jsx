import React, { useState } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { hasFeatureAccess, getUserLimits, getUserTier } from '../../utils/featureGating';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const GeospatialDebugPanel = ({
  data = [],
  columns = [],
  columnMapping = {},
  processedData = [],
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentUser } = useAuth();

  // Debug logging for prop types
  if (import.meta.env.DEV) {
    console.log('GeospatialDebugPanel props:', {
      dataType: typeof data,
      dataIsArray: Array.isArray(data),
      columnsType: typeof columns,
      columnsIsArray: Array.isArray(columns),
      columnsValue: columns,
      processedDataType: typeof processedData,
      processedDataIsArray: Array.isArray(processedData)
    });
  }

  if (!import.meta.env.DEV) {
    return null; // Only show in development
  }

  const userTier = getUserTier(currentUser);
  const userLimits = getUserLimits(currentUser);

  // Feature access checks
  const hasInteractiveAccess = hasFeatureAccess(currentUser, 'geospatial_interactive');
  const hasFullDatasetAccess = hasFeatureAccess(currentUser, 'geospatial_full_dataset');

  let debugInfo;
  try {
    debugInfo = {
    // Data Information
    dataLength: Array.isArray(data) ? data.length : 0,
    dataType: Array.isArray(data) ? 'array' : typeof data,
    columnsLength: Array.isArray(columns) ? columns.length : 0,
    columnsType: Array.isArray(columns) ? 'array' : typeof columns,
    processedDataLength: Array.isArray(processedData) ? processedData.length : 0,
    
    // Column Mapping
    columnMapping: {
      latitude: columnMapping.latitude || 'not set',
      longitude: columnMapping.longitude || 'not set',
      value: columnMapping.value || 'not set',
      label: columnMapping.label || 'not set'
    },
    
    // User & Permissions
    userTier,
    hasInteractiveAccess,
    hasFullDatasetAccess,
    geospatialPointLimit: userLimits.geospatialPoints,
    
    // Sample Data
    sampleDataRow: data?.[0] || null,
    sampleColumns: Array.isArray(columns) ? columns.slice(0, 5) : [],
    sampleProcessedData: Array.isArray(processedData) ? processedData.slice(0, 3) : [],
    
    // Environment
    isDev: import.meta.env.DEV,
    leafletLoaded: typeof window !== 'undefined' && window.L !== undefined,
    reactLeafletLoaded: typeof React !== 'undefined'
    };
  } catch (error) {
    console.error('Error creating debug info:', error);
    debugInfo = {
      error: error.message,
      dataType: typeof data,
      columnsType: typeof columns,
      processedDataType: typeof processedData
    };
  }

  const getStatusIcon = (condition) => {
    return condition ? (
      <Icons.CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <Icons.X className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusColor = (condition) => {
    return condition ? 'text-green-700' : 'text-red-700';
  };

  // Fallback for critical errors
  if (debugInfo.error && !debugInfo.dataType) {
    return (
      <div className={`fixed bottom-4 left-4 z-50 max-w-md ${className}`}>
        <div className="bg-red-900 text-white border border-red-700 rounded p-3">
          <h3 className="text-sm font-semibold text-red-300 mb-2">
            🚨 Debug Panel Error
          </h3>
          <p className="text-xs text-red-200">
            {debugInfo.error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 max-w-md ${className}`}>
      <Card className="bg-gray-900 text-white border-gray-700">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-yellow-400">
              🗺️ Geospatial Debug Panel
            </h3>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-300 hover:text-white"
            >
              {isExpanded ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
            </Button>
          </div>

          {/* Quick Status */}
          {/* Error Display */}
          {debugInfo.error && (
            <div className="mb-3 p-2 bg-red-900 border border-red-700 rounded text-red-300 text-xs">
              <strong>Debug Error:</strong> {debugInfo.error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="flex items-center space-x-1">
              {getStatusIcon(debugInfo.dataLength > 0)}
              <span className={getStatusColor(debugInfo.dataLength > 0)}>
                Data: {debugInfo.dataLength || 0}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {getStatusIcon(debugInfo.columnMapping?.latitude !== 'not set')}
              <span className={getStatusColor(debugInfo.columnMapping?.latitude !== 'not set')}>
                Lat: {debugInfo.columnMapping?.latitude || 'not set'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {getStatusIcon(debugInfo.columnMapping?.longitude !== 'not set')}
              <span className={getStatusColor(debugInfo.columnMapping?.longitude !== 'not set')}>
                Lng: {debugInfo.columnMapping?.longitude || 'not set'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {getStatusIcon(debugInfo.processedDataLength > 0)}
              <span className={getStatusColor(debugInfo.processedDataLength > 0)}>
                Processed: {debugInfo.processedDataLength || 0}
              </span>
            </div>
          </div>

          {isExpanded && (
            <div className="space-y-3 text-xs">
              {/* Data Section */}
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">Data Status</h4>
                <div className="space-y-1 text-gray-300">
                  <div>Raw Data: {debugInfo.dataLength} rows ({debugInfo.dataType})</div>
                  <div>Columns: {debugInfo.columnsLength} ({debugInfo.columnsType})</div>
                  <div>Processed: {debugInfo.processedDataLength} valid points</div>
                </div>
              </div>

              {/* Column Mapping */}
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">Column Mapping</h4>
                <div className="space-y-1 text-gray-300">
                  <div>Latitude: {debugInfo.columnMapping.latitude}</div>
                  <div>Longitude: {debugInfo.columnMapping.longitude}</div>
                  <div>Value: {debugInfo.columnMapping.value}</div>
                  <div>Label: {debugInfo.columnMapping.label}</div>
                </div>
              </div>

              {/* User & Permissions */}
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">User Access</h4>
                <div className="space-y-1 text-gray-300">
                  <div>Tier: {debugInfo.userTier}</div>
                  <div>Interactive: {debugInfo.hasInteractiveAccess ? 'Yes' : 'No'}</div>
                  <div>Full Dataset: {debugInfo.hasFullDatasetAccess ? 'Yes' : 'No'}</div>
                  <div>Point Limit: {debugInfo.geospatialPointLimit === -1 ? 'Unlimited' : debugInfo.geospatialPointLimit}</div>
                </div>
              </div>

              {/* Environment */}
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">Environment</h4>
                <div className="space-y-1 text-gray-300">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(debugInfo.leafletLoaded)}
                    <span>Leaflet: {debugInfo.leafletLoaded ? 'Loaded' : 'Missing'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(debugInfo.reactLeafletLoaded)}
                    <span>React-Leaflet: {debugInfo.reactLeafletLoaded ? 'Loaded' : 'Missing'}</span>
                  </div>
                </div>
              </div>

              {/* Sample Data */}
              {debugInfo.sampleDataRow && (
                <div>
                  <h4 className="font-semibold text-blue-400 mb-1">Sample Data</h4>
                  <div className="bg-gray-800 p-2 rounded text-xs">
                    <div>Columns: {Array.isArray(debugInfo.sampleColumns) ? debugInfo.sampleColumns.join(', ') : 'None'}</div>
                    <div className="mt-1">
                      First Row: {debugInfo.sampleDataRow ? JSON.stringify(debugInfo.sampleDataRow).substring(0, 100) + '...' : 'None'}
                    </div>
                    {Array.isArray(debugInfo.sampleProcessedData) && debugInfo.sampleProcessedData.length > 0 && (
                      <div className="mt-1">
                        Processed: {JSON.stringify(debugInfo.sampleProcessedData[0]).substring(0, 100)}...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2 border-t border-gray-700">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => console.log('Geospatial Debug Info:', debugInfo)}
                  className="text-gray-300 border-gray-600 hover:bg-gray-800"
                >
                  Log to Console
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))}
                  className="text-gray-300 border-gray-600 hover:bg-gray-800"
                >
                  Copy Debug Info
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default GeospatialDebugPanel;
