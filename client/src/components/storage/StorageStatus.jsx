import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HardDrive, AlertTriangle, CheckCircle, Trash2, 
  Zap, Crown, Info 
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import storageManager from '../../utils/storageManager';
import { useAuth } from '../../context/FirebaseAuthContext';

/**
 * Storage Status Component
 * Shows localStorage usage and provides cleanup options
 */
const StorageStatus = ({ onCleanup, className = '' }) => {
  const { currentUser, isVisitor } = useAuth();
  const [storageStats, setStorageStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    updateStorageStats();
  }, []);

  const updateStorageStats = () => {
    const stats = storageManager.getStorageStats();
    const recs = storageManager.getStorageRecommendations();
    setStorageStats(stats);
    setRecommendations(recs);
  };

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const userId = currentUser?.id || (isVisitor() ? 'visitor-session' : 'anonymous');
      const result = storageManager.cleanupOldFiles(userId, 3);
      
      if (result.cleaned > 0) {
        console.log(`Cleaned up ${result.cleaned} files`);
        updateStorageStats();
        onCleanup?.(result);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    } finally {
      setIsCleaningUp(false);
    }
  };

  if (!storageStats) {
    return null;
  }

  const getStatusColor = () => {
    if (storageStats.isAtLimit) return 'red';
    if (storageStats.isNearLimit) return 'yellow';
    return 'green';
  };

  const getStatusIcon = () => {
    if (storageStats.isAtLimit) return AlertTriangle;
    if (storageStats.isNearLimit) return AlertTriangle;
    return CheckCircle;
  };

  const StatusIcon = getStatusIcon();
  const statusColor = getStatusColor();

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium text-gray-900">Storage Usage</h3>
          </div>
          <div className={`flex items-center space-x-1 text-${statusColor}-600`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {storageStats.usagePercentage}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${storageStats.usagePercentage}%` }}
              transition={{ duration: 0.5 }}
              className={`h-2 rounded-full bg-${statusColor}-500`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{storageStats.formattedTotalSize} used</span>
            <span>{storageStats.formattedMaxSize} total</span>
          </div>
        </div>

        {/* File Count */}
        <div className="text-sm text-gray-600">
          {storageStats.itemCount} items stored locally
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border-l-4 ${
                  rec.type === 'critical' 
                    ? 'bg-red-50 border-red-400' 
                    : rec.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      rec.type === 'critical' 
                        ? 'text-red-800' 
                        : rec.type === 'warning'
                        ? 'text-yellow-800'
                        : 'text-blue-800'
                    }`}>
                      {rec.title}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      rec.type === 'critical' 
                        ? 'text-red-600' 
                        : rec.type === 'warning'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}>
                      {rec.description}
                    </p>
                  </div>
                  
                  {rec.action === 'cleanup' && (
                    <Button
                      onClick={handleCleanup}
                      variant="outline"
                      size="sm"
                      loading={isCleaningUp}
                      icon={Trash2}
                      className="ml-3"
                    >
                      Clean Up
                    </Button>
                  )}
                  
                  {rec.action === 'upgrade' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Crown}
                      className="ml-3"
                    >
                      Upgrade
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Info className="w-4 h-4" />
            <span>Local browser storage</span>
          </div>
          
          <div className="flex space-x-2">
            {storageStats.itemCount > 0 && (
              <Button
                onClick={handleCleanup}
                variant="ghost"
                size="sm"
                loading={isCleaningUp}
                icon={Trash2}
              >
                Clean Up
              </Button>
            )}
            
            {(isVisitor() || !currentUser) && (
              <Button
                variant="outline"
                size="sm"
                icon={Zap}
              >
                Sign Up for More
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * Compact Storage Indicator
 * Shows just the usage percentage and status
 */
export const StorageIndicator = ({ onClick, className = '' }) => {
  const [storageStats, setStorageStats] = useState(null);

  useEffect(() => {
    const stats = storageManager.getStorageStats();
    setStorageStats(stats);
  }, []);

  if (!storageStats) return null;

  const getStatusColor = () => {
    if (storageStats.isAtLimit) return 'red';
    if (storageStats.isNearLimit) return 'yellow';
    return 'green';
  };

  const statusColor = getStatusColor();

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-colors hover:bg-gray-100 ${className}`}
    >
      <HardDrive className="w-4 h-4 text-gray-500" />
      <div className="flex items-center space-x-1">
        <div className="w-12 bg-gray-200 rounded-full h-1">
          <div 
            className={`h-1 rounded-full bg-${statusColor}-500`}
            style={{ width: `${storageStats.usagePercentage}%` }}
          />
        </div>
        <span className={`text-${statusColor}-600 font-medium`}>
          {storageStats.usagePercentage}%
        </span>
      </div>
    </button>
  );
};

export default StorageStatus;
