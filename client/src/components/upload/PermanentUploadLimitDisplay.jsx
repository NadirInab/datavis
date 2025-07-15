import React from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { Icons } from '../ui/Button';
import Card from '../ui/Card';

const PermanentUploadLimitDisplay = ({ className = '', variant = 'card' }) => {
  const { currentUser } = useAuth();

  // Don't show for visitors
  if (!currentUser) return null;

  const permanentLimit = 5;
  const totalUploadsCount = currentUser.fileUsage?.totalUploadsCount || 0;
  const remainingUploads = Math.max(0, permanentLimit - totalUploadsCount);
  const hasReachedLimit = totalUploadsCount >= permanentLimit;
  const progressPercentage = (totalUploadsCount / permanentLimit) * 100;

  const getProgressColor = () => {
    if (hasReachedLimit) return 'bg-red-500';
    if (progressPercentage >= 80) return 'bg-amber-500';
    if (progressPercentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (hasReachedLimit) return 'text-red-700';
    if (progressPercentage >= 80) return 'text-amber-700';
    return 'text-gray-700';
  };

  if (variant === 'banner' && hasReachedLimit) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Icons.AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800">
              Upload Limit Reached
            </h3>
            <p className="text-sm text-red-700 mt-1">
              You have used all {permanentLimit} lifetime uploads. Deleting files does not restore upload capacity.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 text-sm ${getTextColor()} ${className}`}>
        <Icons.Upload className="w-4 h-4" />
        <span>
          {totalUploadsCount} of {permanentLimit} lifetime uploads used
        </span>
        {hasReachedLimit && (
          <Icons.AlertTriangle className="w-4 h-4 text-red-500" />
        )}
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icons.Upload className="w-5 h-5 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              Lifetime Upload Limit
            </h3>
          </div>
          {hasReachedLimit && (
            <div className="flex items-center space-x-1 text-red-600">
              <Icons.AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">Limit Reached</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={getTextColor()}>
              {totalUploadsCount} of {permanentLimit} uploads used
            </span>
            <span className="text-xs text-gray-500">
              {remainingUploads} remaining
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Information */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-start space-x-2">
            <Icons.Info className="w-3 h-3 mt-0.5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-700">Important:</p>
              <p>This counter tracks all files you've ever uploaded and never decreases.</p>
              <p>Deleting files does not restore upload capacity.</p>
            </div>
          </div>
          
          {currentUser.fileUsage?.firstUploadDate && (
            <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
              <Icons.Calendar className="w-3 h-3 text-gray-400" />
              <span>
                First upload: {new Date(currentUser.fileUsage.firstUploadDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Warning for users approaching limit */}
        {!hasReachedLimit && remainingUploads <= 2 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <Icons.AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-amber-800">
                  Approaching Upload Limit
                </p>
                <p className="text-amber-700 mt-1">
                  You have {remainingUploads} upload{remainingUploads !== 1 ? 's' : ''} remaining. 
                  Plan your uploads carefully as this limit cannot be reset.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PermanentUploadLimitDisplay;
