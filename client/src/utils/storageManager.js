/**
 * Storage Manager Utility
 * Handles localStorage quota management and cleanup
 */

/**
 * Get localStorage usage statistics
 */
export const getStorageStats = () => {
  let totalSize = 0;
  let itemCount = 0;
  const items = {};

  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key);
      const size = new Blob([value]).size;
      totalSize += size;
      itemCount++;
      items[key] = {
        size,
        formattedSize: formatBytes(size)
      };
    }
  }

  const maxSize = 5 * 1024 * 1024; // 5MB typical limit
  const usagePercentage = (totalSize / maxSize) * 100;

  return {
    totalSize,
    formattedTotalSize: formatBytes(totalSize),
    maxSize,
    formattedMaxSize: formatBytes(maxSize),
    usagePercentage: Math.round(usagePercentage),
    itemCount,
    items,
    isNearLimit: usagePercentage > 80,
    isAtLimit: usagePercentage > 95
  };
};

/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if localStorage has enough space for new data
 */
export const checkStorageSpace = (dataSize) => {
  const stats = getStorageStats();
  const availableSpace = stats.maxSize - stats.totalSize;
  
  return {
    hasSpace: dataSize < availableSpace,
    availableSpace,
    formattedAvailableSpace: formatBytes(availableSpace),
    requiredSpace: dataSize,
    formattedRequiredSpace: formatBytes(dataSize)
  };
};

/**
 * Clean up old files to free space
 */
export const cleanupOldFiles = (userId, keepCount = 5) => {
  try {
    const filesKey = `files_${userId}`;
    const filesData = JSON.parse(localStorage.getItem(filesKey) || '[]');
    
    if (filesData.length <= keepCount) {
      return { cleaned: 0, remaining: filesData.length };
    }

    // Sort by upload date (newest first) and keep only the specified count
    const sortedFiles = filesData.sort((a, b) => 
      new Date(b.uploadedAt) - new Date(a.uploadedAt)
    );
    
    const filesToKeep = sortedFiles.slice(0, keepCount);
    const cleanedCount = filesData.length - filesToKeep.length;
    
    localStorage.setItem(filesKey, JSON.stringify(filesToKeep));
    
    console.log(`🧹 Cleaned up ${cleanedCount} old files, kept ${filesToKeep.length} recent files`);
    
    return { 
      cleaned: cleanedCount, 
      remaining: filesToKeep.length,
      freedSpace: calculateArraySize(filesData) - calculateArraySize(filesToKeep)
    };
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    return { cleaned: 0, remaining: 0, error: error.message };
  }
};

/**
 * Calculate the size of an array when JSON stringified
 */
const calculateArraySize = (array) => {
  return new Blob([JSON.stringify(array)]).size;
};

/**
 * Optimize file data to reduce storage size
 */
export const optimizeFileData = (fileRecord, maxRows = 500) => {
  const optimized = { ...fileRecord };
  
  // Reduce data rows if too many
  if (optimized.data && optimized.data.length > maxRows) {
    optimized.data = optimized.data.slice(0, maxRows);
    optimized.samplingInfo = {
      originalRows: fileRecord.rows || fileRecord.data?.length || 0,
      sampledRows: maxRows,
      samplingMethod: 'storage_optimization'
    };
  }

  // Remove or compress large metadata
  if (optimized.columnTypes) {
    // Keep only essential column type info
    const compressedTypes = {};
    Object.keys(optimized.columnTypes).forEach(key => {
      const type = optimized.columnTypes[key];
      compressedTypes[key] = {
        type: type.type,
        count: type.count,
        unique: type.unique
      };
    });
    optimized.columnTypes = compressedTypes;
  }

  // Compress visualizations
  if (optimized.visualizations) {
    optimized.visualizations = optimized.visualizations.map(viz => ({
      id: viz.id,
      type: viz.type,
      title: viz.title,
      columns: viz.columns,
      createdAt: viz.createdAt
    }));
  }

  return optimized;
};

/**
 * Smart save with automatic cleanup if needed
 */
export const smartSave = (key, data, userId) => {
  try {
    // First, try to save normally
    const jsonData = JSON.stringify(data);
    localStorage.setItem(key, jsonData);
    return { success: true, method: 'normal' };
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('⚠️ Storage quota exceeded, attempting cleanup...');
      
      // Try cleanup and save again
      const cleanupResult = cleanupOldFiles(userId, 3);
      
      if (cleanupResult.cleaned > 0) {
        try {
          // Try saving again after cleanup
          const jsonData = JSON.stringify(data);
          localStorage.setItem(key, jsonData);
          return { 
            success: true, 
            method: 'cleanup', 
            cleanupResult 
          };
        } catch (retryError) {
          console.error('❌ Save failed even after cleanup:', retryError);
        }
      }

      // Last resort: optimize the data and try again
      if (Array.isArray(data)) {
        const optimizedData = data.map(item => optimizeFileData(item, 100));
        try {
          const jsonData = JSON.stringify(optimizedData);
          localStorage.setItem(key, jsonData);
          return { 
            success: true, 
            method: 'optimized', 
            cleanupResult,
            warning: 'Data was optimized to fit storage limits'
          };
        } catch (optimizedError) {
          console.error('❌ Save failed even with optimized data:', optimizedError);
          return { 
            success: false, 
            error: 'Storage quota exceeded and cleanup failed',
            cleanupResult 
          };
        }
      }
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Get storage recommendations for user
 */
export const getStorageRecommendations = () => {
  const stats = getStorageStats();
  const recommendations = [];

  if (stats.isAtLimit) {
    recommendations.push({
      type: 'critical',
      title: 'Storage Almost Full',
      description: 'Delete old files or upgrade to premium for unlimited storage',
      action: 'cleanup'
    });
  } else if (stats.isNearLimit) {
    recommendations.push({
      type: 'warning',
      title: 'Storage Getting Full',
      description: 'Consider cleaning up old files to free space',
      action: 'cleanup'
    });
  }

  if (stats.itemCount > 10) {
    recommendations.push({
      type: 'info',
      title: 'Many Files Stored',
      description: 'Upgrade to premium for better file management and unlimited storage',
      action: 'upgrade'
    });
  }

  return recommendations;
};

export default {
  getStorageStats,
  checkStorageSpace,
  cleanupOldFiles,
  optimizeFileData,
  smartSave,
  getStorageRecommendations,
  formatBytes
};
