const migrationService = require('../services/simpleMigrationService');
const userCreationService = require('../services/userCreationService');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Get all migrations with their status
 * @route GET /api/v1/admin/migrations
 * @access Admin
 */
const getMigrations = async (req, res) => {
  try {
    const migrations = await migrationService.getAllMigrations();
    
    res.json({
      success: true,
      data: {
        migrations,
        total: migrations.length,
        pending: migrations.filter(m => !m.executed).length,
        completed: migrations.filter(m => m.status === 'completed').length,
        failed: migrations.filter(m => m.status === 'failed').length
      }
    });
  } catch (error) {
    logger.error('Failed to get migrations:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve migrations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Execute a specific migration
 * @route POST /api/v1/admin/migrations/:name/execute
 * @access Admin
 */
const executeMigration = async (req, res) => {
  try {
    const { name } = req.params;
    const { createBackup = true, force = false } = req.body;

    const result = await migrationService.executeMigration(name, {
      createBackup,
      force
    });

    const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
    
    res.status(statusCode).json({
      success: result.success,
      data: result,
      message: result.success ? 'Migration executed successfully' : 'Migration execution failed'
    });
  } catch (error) {
    logger.error('Migration execution failed:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Migration execution failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Execute multiple migrations in batch
 * @route POST /api/v1/admin/migrations/batch
 * @access Admin
 */
const executeBatchMigrations = async (req, res) => {
  try {
    const { migrations, createBackup = true, stopOnError = true } = req.body;

    if (!Array.isArray(migrations) || migrations.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Migrations array is required and must not be empty'
      });
    }

    const result = await migrationService.executeBatchMigrations(migrations, {
      createBackup,
      stopOnError
    });

    const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
    
    res.status(statusCode).json({
      success: result.success,
      data: result,
      message: result.success ? 'Batch migrations completed' : 'Some migrations failed'
    });
  } catch (error) {
    logger.error('Batch migration execution failed:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Batch migration execution failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Rollback a migration
 * @route POST /api/v1/admin/migrations/:name/rollback
 * @access Admin
 */
const rollbackMigration = async (req, res) => {
  try {
    const { name } = req.params;

    const result = await migrationService.rollbackMigration(name);

    const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
    
    res.status(statusCode).json({
      success: result.success,
      data: result,
      message: result.success ? 'Migration rolled back successfully' : 'Migration rollback failed'
    });
  } catch (error) {
    logger.error('Migration rollback failed:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Migration rollback failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get database schema information
 * @route GET /api/v1/admin/migrations/schema
 * @access Admin
 */
const getDatabaseSchema = async (req, res) => {
  try {
    const schema = await migrationService.getDatabaseSchema();
    
    res.json({
      success: true,
      data: schema
    });
  } catch (error) {
    logger.error('Failed to get database schema:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve database schema',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Create database backup
 * @route POST /api/v1/admin/migrations/backup
 * @access Admin
 */
const createBackup = async (req, res) => {
  try {
    const { name = 'manual_backup' } = req.body;

    const backupPath = await migrationService.createDatabaseBackup(name);
    
    res.json({
      success: true,
      data: {
        backupPath,
        name,
        createdAt: new Date()
      },
      message: 'Database backup created successfully'
    });
  } catch (error) {
    logger.error('Failed to create database backup:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to create database backup',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get migration system status
 * @route GET /api/v1/admin/migrations/status
 * @access Admin
 */
const getSystemStatus = async (req, res) => {
  try {
    const status = await migrationService.getSystemStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get migration system status:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve system status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Verify Google user creation system
 * @route GET /api/v1/admin/migrations/verify-google-users
 * @access Admin
 */
const verifyGoogleUserCreation = async (req, res) => {
  try {
    const stats = await userCreationService.getUserCreationStats();
    
    // Get recent Google sign-ins for verification
    const User = require('../models/User');
    const recentGoogleUsers = await User.find({
      'profile.provider': 'google',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .select('firebaseUid email name photoURL createdAt lastLoginAt')
    .limit(10)
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        statistics: stats,
        recentGoogleUsers,
        verificationStatus: {
          userCreationWorking: stats.googleUsers > 0,
          recentActivity: recentGoogleUsers.length > 0,
          systemHealthy: true
        }
      },
      message: 'Google user creation verification completed'
    });
  } catch (error) {
    logger.error('Failed to verify Google user creation:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to verify Google user creation system',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Test user creation with sample data
 * @route POST /api/v1/admin/migrations/test-user-creation
 * @access Admin
 */
const testUserCreation = async (req, res) => {
  try {
    const { testMode = true } = req.body;

    if (!testMode) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Test mode must be enabled for this endpoint'
      });
    }

    // Sample Google OAuth token data for testing
    const sampleTokenData = {
      uid: `test_${Date.now()}`,
      email: `test.user.${Date.now()}@gmail.com`,
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
      email_verified: true,
      firebase: {
        sign_in_provider: 'google.com'
      }
    };

    const result = await userCreationService.createOrUpdateGoogleUser(sampleTokenData);

    // Clean up test user
    const User = require('../models/User');
    await User.findOneAndDelete({ firebaseUid: sampleTokenData.uid });

    res.json({
      success: true,
      data: {
        testResult: result,
        testUser: {
          firebaseUid: sampleTokenData.uid,
          email: sampleTokenData.email,
          name: sampleTokenData.name
        },
        cleanedUp: true
      },
      message: 'User creation test completed successfully'
    });
  } catch (error) {
    logger.error('User creation test failed:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'User creation test failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getMigrations,
  executeMigration,
  executeBatchMigrations,
  rollbackMigration,
  getDatabaseSchema,
  createBackup,
  getSystemStatus,
  verifyGoogleUserCreation,
  testUserCreation
};
