const File = require('../models/File');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Smart File Management Service
 * Handles intelligent file size limits, tiered storage, data compression/sampling,
 * and cleanup mechanisms based on user subscription tiers
 */

// File size and data limits by subscription tier
const TIER_LIMITS = {
  visitor: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxDataRows: 500,
    maxFiles: 3,
    retentionDays: 7
  },
  free: {
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxDataRows: 1000,
    maxFiles: 5,
    retentionDays: 30
  },
  premium: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxDataRows: 5000,
    maxFiles: 50,
    retentionDays: 365
  },
  enterprise: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxDataRows: 10000,
    maxFiles: 200,
    retentionDays: 1095 // 3 years
  }
};

/**
 * Get file limits for a user based on their subscription tier
 */
const getUserFileLimits = (user) => {
  const tier = user?.subscription?.tier || (user?.role === 'visitor' ? 'visitor' : 'free');
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
};

/**
 * Check if user can upload a file based on size and count limits
 */
const canUserUploadFile = async (user, fileSize) => {
  const limits = getUserFileLimits(user);
  
  // Check file size limit
  if (fileSize > limits.maxFileSize) {
    return {
      canUpload: false,
      reason: 'file_too_large',
      limit: limits.maxFileSize,
      current: fileSize
    };
  }

  // Check file count limit
  const fileCount = await File.countDocuments({
    ownerUid: user.firebaseUid || user.visitorSession?.sessionId,
    status: { $ne: 'deleted' }
  });

  if (fileCount >= limits.maxFiles) {
    return {
      canUpload: false,
      reason: 'file_limit_reached',
      limit: limits.maxFiles,
      current: fileCount
    };
  }

  return {
    canUpload: true,
    limits
  };
};

/**
 * Apply intelligent data sampling based on user tier
 */
const applyDataSampling = (data, user) => {
  const limits = getUserFileLimits(user);
  
  if (!data || !Array.isArray(data)) {
    return data;
  }

  // If data is within limits, return as-is
  if (data.length <= limits.maxDataRows) {
    return data;
  }

  // Apply intelligent sampling
  const sampleSize = limits.maxDataRows;
  const step = Math.floor(data.length / sampleSize);
  
  if (step <= 1) {
    // Simple truncation if step is too small
    return data.slice(0, sampleSize);
  }

  // Systematic sampling to maintain data distribution
  const sampledData = [];
  for (let i = 0; i < data.length && sampledData.length < sampleSize; i += step) {
    sampledData.push(data[i]);
  }

  // Ensure we include the last row if it wasn't sampled
  if (sampledData.length < sampleSize && data.length > 0) {
    const lastRow = data[data.length - 1];
    if (!sampledData.includes(lastRow)) {
      sampledData.push(lastRow);
    }
  }

  logger.info('Data sampling applied:', {
    originalRows: data.length,
    sampledRows: sampledData.length,
    userTier: getUserFileLimits(user)
  });

  return sampledData;
};

/**
 * Compress file metadata to reduce storage size
 */
const compressFileMetadata = (metadata) => {
  if (!metadata) return metadata;

  // Remove redundant or large metadata fields for storage optimization
  const compressed = { ...metadata };
  
  // Limit sample data size
  if (compressed.sampleData && Array.isArray(compressed.sampleData)) {
    compressed.sampleData = compressed.sampleData.slice(0, 10);
  }

  // Compress statistics by removing detailed distributions
  if (compressed.statistics) {
    Object.keys(compressed.statistics).forEach(key => {
      const stat = compressed.statistics[key];
      if (stat && typeof stat === 'object') {
        // Keep only essential statistics
        compressed.statistics[key] = {
          type: stat.type,
          count: stat.count,
          unique: stat.unique,
          min: stat.min,
          max: stat.max,
          mean: stat.mean
        };
      }
    });
  }

  return compressed;
};

/**
 * Clean up old files based on retention policies
 */
const cleanupOldFiles = async () => {
  try {
    logger.info('Starting file cleanup process...');

    for (const [tier, limits] of Object.entries(TIER_LIMITS)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - limits.retentionDays);

      // Find files to delete
      const query = {
        uploadedAt: { $lt: cutoffDate },
        status: { $ne: 'deleted' }
      };

      // Add tier-specific conditions
      if (tier === 'visitor') {
        query.ownerType = 'visitor';
      } else {
        query.ownerType = 'user';
        query['$or'] = [
          { 'owner.subscription.tier': tier },
          { 'owner.subscription.tier': { $exists: false }, 'owner.role': { $ne: 'visitor' } } // Default to free
        ];
      }

      const filesToDelete = await File.find(query).select('_id filename ownerUid uploadedAt');
      
      if (filesToDelete.length > 0) {
        // Mark files as deleted (soft delete)
        await File.updateMany(
          { _id: { $in: filesToDelete.map(f => f._id) } },
          { 
            status: 'deleted',
            deletedAt: new Date(),
            // Clear data to free up space
            data: [],
            visualizations: []
          }
        );

        logger.info(`Cleaned up ${filesToDelete.length} files for tier: ${tier}`);
      }
    }

    logger.info('File cleanup process completed');
  } catch (error) {
    logger.error('File cleanup error:', error);
  }
};

/**
 * Get file storage statistics for a user
 */
const getUserStorageStats = async (user) => {
  const limits = getUserFileLimits(user);
  
  const stats = await File.aggregate([
    {
      $match: {
        ownerUid: user.firebaseUid || user.visitorSession?.sessionId,
        status: { $ne: 'deleted' }
      }
    },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        totalDataRows: { $sum: { $size: { $ifNull: ['$data', []] } } }
      }
    }
  ]);

  const current = stats[0] || { totalFiles: 0, totalSize: 0, totalDataRows: 0 };

  return {
    current,
    limits,
    usage: {
      files: {
        used: current.totalFiles,
        limit: limits.maxFiles,
        percentage: Math.round((current.totalFiles / limits.maxFiles) * 100)
      },
      storage: {
        used: current.totalSize,
        limit: limits.maxFileSize * limits.maxFiles, // Approximate total storage
        percentage: Math.round((current.totalSize / (limits.maxFileSize * limits.maxFiles)) * 100)
      },
      dataRows: {
        used: current.totalDataRows,
        limit: limits.maxDataRows * limits.maxFiles, // Approximate total rows
        percentage: Math.round((current.totalDataRows / (limits.maxDataRows * limits.maxFiles)) * 100)
      }
    }
  };
};

module.exports = {
  getUserFileLimits,
  canUserUploadFile,
  applyDataSampling,
  compressFileMetadata,
  cleanupOldFiles,
  getUserStorageStats,
  TIER_LIMITS
};
