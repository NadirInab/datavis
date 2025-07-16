import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, WifiOff, AlertCircle, CheckCircle, 
  RefreshCw, Settings, X 
} from 'lucide-react';
import Button from '../ui/Button';

/**
 * Connection Status Component
 * Shows real-time collaboration connection status with troubleshooting
 */
const ConnectionStatus = ({ 
  isConnected, 
  collaborators = [], 
  onRetry,
  className = '' 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [lastConnected, setLastConnected] = useState(null);

  useEffect(() => {
    if (isConnected) {
      setLastConnected(new Date());
    }
  }, [isConnected]);

  const getStatusInfo = () => {
    if (isConnected) {
      return {
        icon: CheckCircle,
        color: 'green',
        text: 'Connected',
        description: `Real-time collaboration active${collaborators.length > 0 ? ` • ${collaborators.length} user${collaborators.length > 1 ? 's' : ''} online` : ''}`
      };
    } else {
      return {
        icon: WifiOff,
        color: 'red',
        text: 'Disconnected',
        description: 'Real-time features unavailable'
      };
    }
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div className={`relative ${className}`}>
      {/* Status Indicator */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-colors ${
          isConnected 
            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
            : 'bg-red-100 text-red-700 hover:bg-red-200'
        }`}
      >
        <StatusIcon className="w-4 h-4" />
        <span className="font-medium">{status.text}</span>
        {!isConnected && (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Detailed Status Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <StatusIcon className={`w-5 h-5 text-${status.color}-600`} />
                <h3 className="font-semibold text-gray-900">Connection Status</h3>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Status Details */}
            <div className="p-4 space-y-4">
              <div>
                <div className={`text-${status.color}-700 font-medium`}>
                  {status.text}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {status.description}
                </div>
              </div>

              {/* Connection Info */}
              {isConnected ? (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-500">Server:</span>
                    <span className="ml-2 font-mono text-green-600">localhost:5001</span>
                  </div>
                  {lastConnected && (
                    <div className="text-sm">
                      <span className="text-gray-500">Connected:</span>
                      <span className="ml-2">{lastConnected.toLocaleTimeString()}</span>
                    </div>
                  )}
                  {collaborators.length > 0 && (
                    <div className="text-sm">
                      <span className="text-gray-500">Active users:</span>
                      <div className="mt-1 space-y-1">
                        {collaborators.slice(0, 3).map((user, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: user.color || '#6B7280' }}
                            />
                            <span className="text-xs">{user.name}</span>
                          </div>
                        ))}
                        {collaborators.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{collaborators.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Real-time collaboration features are currently unavailable.
                  </div>
                  
                  {/* Troubleshooting */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Troubleshooting</span>
                    </div>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      <li>• Check if backend server is running on port 5001</li>
                      <li>• Verify network connectivity</li>
                      <li>• Try refreshing the page</li>
                    </ul>
                  </div>

                  {/* Retry Button */}
                  <Button
                    onClick={onRetry}
                    variant="outline"
                    size="sm"
                    icon={RefreshCw}
                    className="w-full"
                  >
                    Retry Connection
                  </Button>
                </div>
              )}

              {/* Quick Actions */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Button
                    onClick={() => window.open('/test/share-test', '_blank')}
                    variant="ghost"
                    size="sm"
                    icon={Settings}
                    className="flex-1 text-xs"
                  >
                    Test Connection
                  </Button>
                  <Button
                    onClick={() => window.open('http://localhost:5001/api/v1/health', '_blank')}
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    Server Health
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Simple Connection Indicator
 * Minimal status indicator for header/toolbar use
 */
export const ConnectionIndicator = ({ isConnected, className = '' }) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4 text-green-600" />
          <span className="text-xs text-green-600 font-medium">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">Offline</span>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;
