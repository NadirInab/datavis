const express = require('express');
const router = express.Router();

const { protect, requireAdmin } = require('../middleware/auth');
const {
  getMigrations,
  executeMigration,
  executeBatchMigrations,
  rollbackMigration,
  getDatabaseSchema,
  createBackup,
  getSystemStatus,
  verifyGoogleUserCreation,
  testUserCreation
} = require('../controllers/migrationController');

// All migration routes require admin access
router.use(protect, requireAdmin);

// @route   GET /api/v1/admin/migrations
// @desc    Get all migrations with their status
// @access  Admin
router.get('/', getMigrations);

// @route   GET /api/v1/admin/migrations/status
// @desc    Get migration system status
// @access  Admin
router.get('/status', getSystemStatus);

// @route   GET /api/v1/admin/migrations/schema
// @desc    Get database schema information
// @access  Admin
router.get('/schema', getDatabaseSchema);

// @route   POST /api/v1/admin/migrations/backup
// @desc    Create database backup
// @access  Admin
router.post('/backup', createBackup);

// @route   POST /api/v1/admin/migrations/batch
// @desc    Execute multiple migrations in batch
// @access  Admin
router.post('/batch', executeBatchMigrations);

// @route   GET /api/v1/admin/migrations/verify-google-users
// @desc    Verify Google user creation system
// @access  Admin
router.get('/verify-google-users', verifyGoogleUserCreation);

// @route   POST /api/v1/admin/migrations/test-user-creation
// @desc    Test user creation with sample data
// @access  Admin
router.post('/test-user-creation', testUserCreation);

// @route   POST /api/v1/admin/migrations/:name/execute
// @desc    Execute a specific migration
// @access  Admin
router.post('/:name/execute', executeMigration);

// @route   POST /api/v1/admin/migrations/:name/rollback
// @desc    Rollback a specific migration
// @access  Admin
router.post('/:name/rollback', rollbackMigration);

module.exports = router;
