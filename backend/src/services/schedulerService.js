const cron = require('node-cron');
const fileManagementService = require('./fileManagementService');
const logger = require('../utils/logger');

/**
 * Scheduler Service
 * Handles automated tasks like file cleanup, maintenance, etc.
 */

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize all scheduled jobs
   */
  init() {
    if (this.isInitialized) {
      logger.warn('Scheduler already initialized');
      return;
    }

    try {
      // Daily file cleanup at 2 AM
      this.scheduleFileCleanup();
      
      // Weekly storage optimization at Sunday 3 AM
      this.scheduleStorageOptimization();
      
      // Hourly health check
      this.scheduleHealthCheck();

      this.isInitialized = true;
      logger.info('Scheduler service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize scheduler:', error);
    }
  }

  /**
   * Schedule daily file cleanup
   */
  scheduleFileCleanup() {
    const job = cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Starting scheduled file cleanup...');
        await fileManagementService.cleanupOldFiles();
        logger.info('Scheduled file cleanup completed');
      } catch (error) {
        logger.error('Scheduled file cleanup failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.jobs.set('fileCleanup', job);
    
    // Start the job only in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
      job.start();
      logger.info('File cleanup job scheduled (daily at 2 AM UTC)');
    } else {
      logger.info('File cleanup job created but not started (development mode)');
    }
  }

  /**
   * Schedule storage optimization
   */
  scheduleStorageOptimization() {
    const job = cron.schedule('0 3 * * 0', async () => {
      try {
        logger.info('Starting scheduled storage optimization...');
        await this.optimizeStorage();
        logger.info('Scheduled storage optimization completed');
      } catch (error) {
        logger.error('Scheduled storage optimization failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.jobs.set('storageOptimization', job);
    
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
      job.start();
      logger.info('Storage optimization job scheduled (weekly on Sunday at 3 AM UTC)');
    } else {
      logger.info('Storage optimization job created but not started (development mode)');
    }
  }

  /**
   * Schedule health check
   */
  scheduleHealthCheck() {
    const job = cron.schedule('0 * * * *', async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('Health check failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.jobs.set('healthCheck', job);
    
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
      job.start();
      logger.info('Health check job scheduled (hourly)');
    }
  }

  /**
   * Optimize storage by compacting data and removing redundancies
   */
  async optimizeStorage() {
    const File = require('../models/File');
    
    try {
      // Find files that could benefit from optimization
      const files = await File.find({
        status: 'ready',
        'dataInfo.rows': { $gt: 1000 }, // Files with more than 1000 rows
        lastOptimized: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Not optimized in last 7 days
      }).limit(100); // Process in batches

      let optimizedCount = 0;

      for (const file of files) {
        try {
          // Re-apply data sampling if user tier changed
          const owner = await require('../models/User').findOne({ firebaseUid: file.ownerUid });
          if (owner) {
            const optimizedData = fileManagementService.applyDataSampling(file.data, owner);
            const optimizedMetadata = fileManagementService.compressFileMetadata(file.dataInfo);

            if (optimizedData.length < file.data.length || JSON.stringify(optimizedMetadata) !== JSON.stringify(file.dataInfo)) {
              file.data = optimizedData;
              file.dataInfo = optimizedMetadata;
              file.lastOptimized = new Date();
              await file.save();
              optimizedCount++;
            }
          }
        } catch (fileError) {
          logger.warn(`Failed to optimize file ${file._id}:`, fileError);
        }
      }

      logger.info(`Storage optimization completed: ${optimizedCount} files optimized`);
    } catch (error) {
      logger.error('Storage optimization error:', error);
    }
  }

  /**
   * Perform system health check
   */
  async performHealthCheck() {
    try {
      const File = require('../models/File');
      const User = require('../models/User');

      // Check database connectivity
      const fileCount = await File.countDocuments();
      const userCount = await User.countDocuments();

      // Check for stuck processing files
      const stuckFiles = await File.countDocuments({
        status: 'processing',
        uploadedAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } // Processing for more than 30 minutes
      });

      if (stuckFiles > 0) {
        logger.warn(`Found ${stuckFiles} files stuck in processing state`);
        
        // Auto-recover stuck files
        await File.updateMany(
          {
            status: 'processing',
            uploadedAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) }
          },
          {
            status: 'error',
            errorMessage: 'Processing timeout - automatically recovered'
          }
        );
      }

      // Log health metrics (only in development for debugging)
      if (process.env.NODE_ENV === 'development') {
        logger.info('Health check metrics:', {
          files: fileCount,
          users: userCount,
          stuckFiles,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Health check error:', error);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped scheduled job: ${name}`);
    });
    this.isInitialized = false;
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running || false,
        scheduled: job.scheduled || false
      };
    });
    return status;
  }

  /**
   * Manually trigger file cleanup (for testing/admin)
   */
  async triggerFileCleanup() {
    try {
      logger.info('Manually triggering file cleanup...');
      await fileManagementService.cleanupOldFiles();
      return { success: true, message: 'File cleanup completed' };
    } catch (error) {
      logger.error('Manual file cleanup failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Manually trigger storage optimization (for testing/admin)
   */
  async triggerStorageOptimization() {
    try {
      logger.info('Manually triggering storage optimization...');
      await this.optimizeStorage();
      return { success: true, message: 'Storage optimization completed' };
    } catch (error) {
      logger.error('Manual storage optimization failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;
