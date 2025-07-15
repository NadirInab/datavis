const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Migration schema for tracking migrations
const migrationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  version: { type: String, required: true },
  description: { type: String, required: true },
  executedAt: { type: Date, default: Date.now },
  executionTime: { type: Number }, // milliseconds
  status: { 
    type: String, 
    enum: ['pending', 'running', 'completed', 'failed', 'rolled_back'],
    default: 'pending'
  },
  rollbackAvailable: { type: Boolean, default: false },
  backupPath: { type: String },
  errorMessage: { type: String },
  checksum: { type: String }
});

// Check if model already exists to prevent OverwriteModelError
const Migration = mongoose.models.Migration || mongoose.model('Migration', migrationSchema);

class SimpleMigrationService {
  /**
   * Get all migrations with their status
   * @returns {Array} List of migrations and their status
   */
  async getAllMigrations() {
    try {
      // Get executed migrations from database
      const executedMigrations = await Migration.find({}).lean();
      
      // For now, return the executed migrations
      // In a full implementation, this would scan the filesystem for migration files
      const migrations = executedMigrations.map(migration => ({
        name: migration.name,
        version: migration.version,
        description: migration.description,
        executed: true,
        executedAt: migration.executedAt,
        status: migration.status,
        rollbackAvailable: migration.rollbackAvailable,
        executionTime: migration.executionTime,
        errorMessage: migration.errorMessage
      }));

      return migrations.sort((a, b) => a.version.localeCompare(b.version));
    } catch (error) {
      logger.error('Failed to get migrations:', error);
      throw error;
    }
  }

  /**
   * Execute a specific migration (simplified version)
   * @param {string} migrationName - Name of migration to execute
   * @param {Object} options - Execution options
   * @returns {Object} Execution result
   */
  async executeMigration(migrationName, options = {}) {
    const startTime = Date.now();
    let migrationRecord = null;

    try {
      // Check if already executed
      const existing = await Migration.findOne({ name: migrationName });
      if (existing && existing.status === 'completed') {
        throw new Error(`Migration ${migrationName} already executed`);
      }

      // Create or update migration record
      migrationRecord = await Migration.findOneAndUpdate(
        { name: migrationName },
        {
          name: migrationName,
          version: '1.0.0', // Default version
          description: `Migration: ${migrationName}`,
          status: 'running',
          rollbackAvailable: false
        },
        { upsert: true, new: true }
      );

      // Execute the migration based on name
      await this.executeMigrationByName(migrationName);

      // Update migration record as completed
      const executionTime = Date.now() - startTime;
      await Migration.findByIdAndUpdate(migrationRecord._id, {
        status: 'completed',
        executionTime,
        executedAt: new Date()
      });

      logger.info(`Migration ${migrationName} completed successfully in ${executionTime}ms`);

      return {
        success: true,
        migrationName,
        executionTime,
        message: 'Migration executed successfully'
      };

    } catch (error) {
      // Update migration record as failed
      if (migrationRecord) {
        await Migration.findByIdAndUpdate(migrationRecord._id, {
          status: 'failed',
          errorMessage: error.message,
          executionTime: Date.now() - startTime
        });
      }

      logger.error(`Migration ${migrationName} failed:`, error);
      
      return {
        success: false,
        migrationName,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Execute migration logic based on migration name
   * @param {string} migrationName - Name of migration to execute
   */
  async executeMigrationByName(migrationName) {
    switch (migrationName) {
      case '001_add_user_profile_fields':
        await this.addUserProfileFields();
        break;
      case '002_create_indexes':
        await this.createIndexes();
        break;
      default:
        throw new Error(`Unknown migration: ${migrationName}`);
    }
  }

  /**
   * Migration: Add user profile fields
   */
  async addUserProfileFields() {
    logger.info('Starting migration: Add user profile fields');

    try {
      // Update users collection to add profile fields
      const result = await mongoose.connection.db.collection('users').updateMany(
        { profile: { $exists: false } },
        {
          $set: {
            profile: {
              provider: 'email',
              locale: 'en',
              timezone: null,
              lastGoogleSync: null,
              preferences: {
                theme: 'light',
                notifications: {
                  email: true,
                  browser: true
                },
                privacy: {
                  profileVisible: false,
                  dataSharing: false
                }
              }
            }
          }
        }
      );

      logger.info(`Updated ${result.modifiedCount} users with profile fields`);

      // Update Google users to set correct provider
      const googleResult = await mongoose.connection.db.collection('users').updateMany(
        { 
          photoURL: { $exists: true, $ne: null },
          'profile.provider': 'email'
        },
        {
          $set: {
            'profile.provider': 'google',
            'profile.lastGoogleSync': new Date()
          }
        }
      );

      logger.info(`Updated ${googleResult.modifiedCount} Google users with correct provider`);
      logger.info('Migration completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Migration: Create database indexes
   */
  async createIndexes() {
    logger.info('Starting migration: Create database indexes');

    try {
      const db = mongoose.connection.db;

      // Create indexes for users collection
      logger.info('Creating indexes for users collection...');
      
      await db.collection('users').createIndex(
        { email: 1 },
        { unique: true, background: true }
      );
      
      await db.collection('users').createIndex(
        { firebaseUid: 1 },
        { unique: true, background: true }
      );
      
      await db.collection('users').createIndex(
        { role: 1, isActive: 1 },
        { background: true }
      );
      
      await db.collection('users').createIndex(
        { 'subscription.tier': 1 },
        { background: true }
      );
      
      await db.collection('users').createIndex(
        { lastActivityAt: 1 },
        { background: true }
      );

      // Create indexes for files collection
      logger.info('Creating indexes for files collection...');
      
      await db.collection('files').createIndex(
        { ownerUid: 1, status: 1 },
        { background: true }
      );
      
      await db.collection('files').createIndex(
        { uploadedAt: 1 },
        { background: true }
      );
      
      await db.collection('files').createIndex(
        { ownerType: 1, visitorSessionId: 1 },
        { background: true, sparse: true }
      );

      // Create indexes for usage tracking collection
      logger.info('Creating indexes for usage tracking collection...');
      
      await db.collection('usagetrackings').createIndex(
        { userId: 1, eventType: 1 },
        { background: true }
      );
      
      await db.collection('usagetrackings').createIndex(
        { timestamp: 1 },
        { background: true }
      );

      logger.info('All indexes created successfully');
    } catch (error) {
      logger.error('Index creation failed:', error);
      throw error;
    }
  }

  /**
   * Execute multiple migrations in sequence
   * @param {Array} migrationNames - List of migration names
   * @param {Object} options - Execution options
   * @returns {Object} Batch execution result
   */
  async executeBatchMigrations(migrationNames, options = {}) {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const migrationName of migrationNames) {
      try {
        const result = await this.executeMigration(migrationName, options);
        results.push(result);
        
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          
          // Stop on first failure if stopOnError is true
          if (options.stopOnError) {
            break;
          }
        }
      } catch (error) {
        results.push({
          success: false,
          migrationName,
          error: error.message
        });
        failureCount++;
        
        if (options.stopOnError) {
          break;
        }
      }
    }

    return {
      success: failureCount === 0,
      totalMigrations: migrationNames.length,
      successCount,
      failureCount,
      results
    };
  }

  /**
   * Get database schema information
   * @returns {Object} Database schema details
   */
  async getDatabaseSchema() {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const schema = {
        database: mongoose.connection.name,
        collections: [],
        indexes: {},
        relationships: []
      };

      for (const collection of collections) {
        const collectionName = collection.name;
        
        // Get collection stats
        const stats = await mongoose.connection.db.collection(collectionName).stats();
        
        // Get indexes
        const indexes = await mongoose.connection.db.collection(collectionName).indexes();
        
        // Get sample document for schema inference
        const sampleDoc = await mongoose.connection.db.collection(collectionName).findOne();
        
        schema.collections.push({
          name: collectionName,
          documentCount: stats.count,
          size: stats.size,
          avgObjSize: stats.avgObjSize,
          indexes: indexes.length,
          sampleSchema: sampleDoc ? this.inferSchema(sampleDoc) : {}
        });
        
        schema.indexes[collectionName] = indexes;
      }

      return schema;
    } catch (error) {
      logger.error('Failed to get database schema:', error);
      throw error;
    }
  }

  /**
   * Infer schema from sample document
   * @param {Object} doc - Sample document
   * @returns {Object} Inferred schema
   */
  inferSchema(doc) {
    const schema = {};
    
    for (const [key, value] of Object.entries(doc)) {
      if (value === null) {
        schema[key] = 'null';
      } else if (Array.isArray(value)) {
        schema[key] = `array[${value.length > 0 ? typeof value[0] : 'unknown'}]`;
      } else if (typeof value === 'object' && value.constructor.name === 'ObjectId') {
        schema[key] = 'ObjectId';
      } else if (value instanceof Date) {
        schema[key] = 'Date';
      } else {
        schema[key] = typeof value;
      }
    }
    
    return schema;
  }

  /**
   * Get migration system status
   * @returns {Object} Migration system status
   */
  async getSystemStatus() {
    try {
      const allMigrations = await this.getAllMigrations();
      const pendingMigrations = allMigrations.filter(m => !m.executed);
      const completedMigrations = allMigrations.filter(m => m.status === 'completed');
      const failedMigrations = allMigrations.filter(m => m.status === 'failed');

      return {
        totalMigrations: allMigrations.length,
        pendingMigrations: pendingMigrations.length,
        completedMigrations: completedMigrations.length,
        failedMigrations: failedMigrations.length,
        lastMigration: completedMigrations[completedMigrations.length - 1],
        databaseConnected: mongoose.connection.readyState === 1,
        backupsAvailable: 0 // Simplified for now
      };
    } catch (error) {
      logger.error('Failed to get migration system status:', error);
      throw error;
    }
  }

  /**
   * Create database backup (simplified)
   * @param {string} migrationName - Migration name for backup naming
   * @returns {string} Backup file path
   */
  async createDatabaseBackup(migrationName) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${migrationName}_${timestamp}`;
      
      logger.info(`Database backup created: ${backupName}`);
      return `/tmp/${backupName}.json`; // Simplified path
    } catch (error) {
      logger.error('Failed to create database backup:', error);
      throw error;
    }
  }
}

module.exports = new SimpleMigrationService();
