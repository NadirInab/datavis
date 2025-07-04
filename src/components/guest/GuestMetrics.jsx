import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Button';
import { getGuestMetrics, getUserMetrics } from '../../utils/rateLimiting';
import { useAuth } from '../../context/FirebaseAuthContext';

const GuestMetrics = ({ className = '' }) => {
  const { currentUser, isVisitor } = useAuth();
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const loadMetrics = () => {
      if (isVisitor() || !currentUser) {
        setMetrics(getGuestMetrics());
      } else {
        setMetrics(getUserMetrics(currentUser));
      }
    };

    loadMetrics();
    
    // Update metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser, isVisitor]);

  if (!metrics) return null;

  const isGuest = isVisitor() || !currentUser;
  const filesProgress = metrics.maxFiles === 'unlimited' ? 100 : (metrics.filesUploaded / metrics.maxFiles) * 100;
  const storageProgress = (metrics.totalStorage / metrics.maxStorage) * 100;

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 flex items-center">
          <Icons.BarChart className="w-4 h-4 mr-2 text-[#5A827E]" />
          {isGuest ? 'Guest Usage' : 'Your Usage'}
        </h3>
        {isGuest && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
            Guest
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Files Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">Files Uploaded</span>
            <span className="text-xs font-medium text-gray-900">
              {metrics.filesUploaded} / {metrics.maxFiles === -1 ? '∞' : metrics.maxFiles}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                filesProgress >= 100 ? 'bg-red-500' : 
                filesProgress >= 80 ? 'bg-yellow-500' : 
                'bg-[#5A827E]'
              }`}
              style={{ width: `${Math.min(filesProgress, 100)}%` }}
            ></div>
          </div>
          {isGuest && metrics.remainingFiles === 0 && (
            <p className="text-xs text-red-600 mt-1">
              Upload limit reached. Sign up for more uploads.
            </p>
          )}
        </div>

        {/* Storage Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">Storage Used</span>
            <span className="text-xs font-medium text-gray-900">
              {formatBytes(metrics.totalStorage)} / {formatBytes(metrics.maxStorage)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                storageProgress >= 100 ? 'bg-red-500' : 
                storageProgress >= 80 ? 'bg-yellow-500' : 
                'bg-[#84AE92]'
              }`}
              style={{ width: `${Math.min(storageProgress, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-600">First Upload</div>
            <div className="text-xs font-medium text-gray-900">
              {formatDate(metrics.firstUpload)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Last Upload</div>
            <div className="text-xs font-medium text-gray-900">
              {formatDate(metrics.lastUpload)}
            </div>
          </div>
        </div>

        {/* Session Info for Guests */}
        {isGuest && (
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-600 mb-1">Session ID</div>
            <div className="text-xs font-mono text-gray-500 truncate">
              {metrics.sessionId}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {metrics.uploadHistory && metrics.uploadHistory.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-600 mb-2">Recent Uploads</div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {metrics.uploadHistory.slice(-3).reverse().map((upload, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 truncate mr-2" title={upload.fileName}>
                    {upload.fileName.length > 15 ? upload.fileName.substring(0, 15) + '...' : upload.fileName}
                  </span>
                  <span className="text-gray-500 flex-shrink-0">
                    {formatBytes(upload.fileSize)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestMetrics;