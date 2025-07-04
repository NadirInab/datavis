import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Button';
import { getGuestMetrics, getUserMetrics } from '../../utils/rateLimiting';
import { useAuth } from '../../context/FirebaseAuthContext';

const GuestMetrics = ({ 
  className = '', 
  visitorId = null, 
  fingerprintReady = false, 
  customMetrics = null 
}) => {
  const { currentUser, isVisitor, visitorStats } = useAuth();
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const loadMetrics = () => {
      if (customMetrics) {
        // Use provided custom metrics (from fingerprint tracking)
        setMetrics(customMetrics);
      } else if (isVisitor() || !currentUser) {
        if (visitorStats) {
          // Use visitor stats from fingerprint tracking
          setMetrics({
            filesUploaded: visitorStats.totalUploads,
            maxFiles: visitorStats.maxUploads,
            remainingFiles: visitorStats.remainingUploads,
            totalStorage: 0, // Not tracked in visitor stats yet
            maxStorage: 2 * 1024 * 1024, // 2MB for guests
            firstUpload: visitorStats.firstVisit,
            lastUpload: visitorStats.lastActivity,
            sessionId: visitorStats.visitorId,
            uploadHistory: visitorStats.uploads || [],
            fingerprintReady,
            visitorId
          });
        } else {
          // Fallback to legacy guest metrics
          setMetrics(getGuestMetrics());
        }
      } else {
        setMetrics(getUserMetrics(currentUser));
      }
    };

    loadMetrics();
    
    // Update metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser, isVisitor, visitorStats, customMetrics, fingerprintReady, visitorId]);

  if (!metrics) return null;

  const isGuest = isVisitor() || !currentUser;
  const filesProgress = metrics.maxFiles === 'unlimited' || metrics.maxFiles === -1 ? 100 : (metrics.filesUploaded / metrics.maxFiles) * 100;
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

  const formatVisitorId = (id) => {
    if (!id) return 'Unknown';
    return id.length > 12 ? `${id.substring(0, 8)}...${id.substring(id.length - 4)}` : id;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 flex items-center">
          <Icons.BarChart className="w-4 h-4 mr-2 text-[#5A827E]" />
          {isGuest ? 'Guest Usage' : 'Your Usage'}
        </h3>
        <div className="flex items-center space-x-2">
          {isGuest && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              Guest
            </span>
          )}
          {fingerprintReady && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
              <Icons.Shield className="w-3 h-3 mr-1" />
              Tracked
            </span>
          )}
        </div>
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
          {isGuest && (metrics.remainingFiles === 0 || !metrics.canUpload) && (
            <p className="text-xs text-red-600 mt-1">
              Upload limit reached. Sign up for more uploads.
            </p>
          )}
          {isGuest && metrics.remainingFiles > 0 && (
            <p className="text-xs text-green-600 mt-1">
              {metrics.remainingFiles} upload{metrics.remainingFiles !== 1 ? 's' : ''} remaining
            </p>
          )}
        </div>

        {/* Storage Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">Storage Used</span>
            <span className="text-xs font-medium text-gray-900">
              {formatBytes(metrics.totalStorage || 0)} / {formatBytes(metrics.maxStorage)}
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
            <div className="text-xs text-gray-600">First Visit</div>
            <div className="text-xs font-medium text-gray-900">
              {formatDate(metrics.firstUpload || metrics.firstVisit)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Last Activity</div>
            <div className="text-xs font-medium text-gray-900">
              {formatDate(metrics.lastUpload || metrics.lastActivity)}
            </div>
          </div>
        </div>

        {/* Visitor ID Info for Guests */}
        {isGuest && (visitorId || metrics.visitorId || metrics.sessionId) && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-gray-600">
                {fingerprintReady ? 'Visitor ID' : 'Session ID'}
              </div>
              {fingerprintReady && (
                <Icons.Shield className="w-3 h-3 text-blue-500" />
              )}
            </div>
            <div className="text-xs font-mono text-gray-500 truncate">
              {formatVisitorId(visitorId || metrics.visitorId || metrics.sessionId)}
            </div>
            {fingerprintReady && (
              <div className="text-xs text-blue-600 mt-1">
                Persistent across sessions
              </div>
            )}
          </div>
        )}

        {/* Fingerprint Status */}
        {isGuest && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Tracking Status</span>
              <div className="flex items-center space-x-1">
                {fingerprintReady ? (
                  <>
                    <Icons.Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-600">Active</span>
                  </>
                ) : (
                  <>
                    <Icons.AlertCircle className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-yellow-600">Fallback</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {fingerprintReady 
                ? 'Upload limits persist across browser sessions'
                : 'Upload limits reset when browser data is cleared'
              }
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
                    {upload.fileName && upload.fileName.length > 15 
                      ? upload.fileName.substring(0, 15) + '...' 
                      : upload.fileName || 'Unknown file'}
                  </span>
                  <span className="text-gray-500 flex-shrink-0">
                    {formatBytes(upload.fileSize || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade Prompt for Guests */}
        {isGuest && (metrics.filesUploaded > 0 || !metrics.canUpload) && (
          <div className="pt-2 border-t border-gray-100">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <Icons.Star className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-xs font-medium text-blue-900">Upgrade Benefits</span>
              </div>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Upload up to 5 files</li>
                <li>• 5MB file size limit</li>
                <li>• Multiple file formats</li>
                <li>• Advanced visualizations</li>
                <li>• Data export options</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestMetrics;