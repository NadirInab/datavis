const mongoose = require('mongoose');
const fs = require('fs-extra');
const path = require('path');
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

const Migration = mongoose.model('Migration', migrationSchema);

class MigrationService {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../migrations');
    this.backupsPath = path.join(__dirname, '../../backups');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    await fs.ensureDir(this.migrationsPath);
    await fs.ensureDir(this.backupsPath);
  }

  /**
   * Get all available migrations
   * @returns {Array} List of migration files and their status
   */
  async getAllMigrations() {
    try {
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await Migration.find({}).lean();
      
      const migrations = migrationFiles.map(file => {
        const executed = executedMigrations.find(m => m.name === file.name);
        return {
          ...file,
          executed: !!executed,
          executedAt: executed?.executedAt,
          status: executed?.status || 'pending',
          rollbackAvailable: executed?.rollbackAvailable || false,
          executionTime: executed?.executionTime
        };
      });

      return migrations.sort((a, b) => a.version.localeCompare(b.version));
    } catch (error) {
      logger.error('Failed to get migrations:', error);
      throw error;
    }
  }

  /**
   * Get migration files from filesystem
   * @returns {Array} Migration file information
   */
  async getMigrationFiles() {
    const files = await fs.readdir(this.migrationsPath);
    const migrationFiles = files.filter(file => file.endsWith('.js'));
    
    const migrations = [];
    for (const file of migrationFiles) {
      try {
        const filePath = path.join(this.migrationsPath, file);
        const migration = require(filePath);
        
        migrations.push({
          name: file.replace('.js', ''),
          filename: file,
          version: migration.version || '0.0.0',
          description: migration.description || 'No description',
          dependencies: migration.dependencies || [],
          rollbackSupported: typeof migration.down === 'function',
          filePath
        });
      } catch (error) {
        logger.warn(`Failed to load migration ${file}:`, error);
      }
    }
    
    return migrations;
  }

  /**
   * Execute a specific migration
   * @param {string} migrationName - Name of migration to execute
   * @param {Object} options - Execution options
   * @returns {Object} Execution result
   */
  async executeMigration(migrationName, options = {}) {
    const startTime = Date.now();
    let migrationRecord = null;
    let backupPath = null;

    try {
      // Check if migration exists
      const migrationFile = await this.getMigrationFile(migrationName);
      if (!migrationFile) {
        throw new Error(`Migration ${migrationName} not found`);
      }

      // Check if already executed
      const existing = await Migration.findOne({ name: migrationName });
      if (existing && existing.status === 'completed') {
        throw new Error(`Migration ${migrationName} already executed`);
      }

      // Create backup if requested
      if (options.createBackup !== false) {
        backupPath = await this.createDatabaseBackup(migrationName);
      }

      // Create or update migration record
      migrationRecord = await Migration.findOneAndUpdate(
        { name: migrationName },
        {
          name: migrationName,
          version: migrationFile.version,
          description: migrationFile.description,
          status: 'running',
          backupPath,
          rollbackAvailable: migrationFile.rollbackSupported
        },
        { upsert: true, new: true }
      );

      // Load and execute migration
      const migration = require(migrationFile.filePath);
      
      // Execute up function
      if (typeof migration.up !== 'function') {
        throw new Error(`Migration ${migrationName} missing up() function`);
      }

      await migration.up();

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
        backupPath,
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
        backupPath,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Rollback a migration
   * @param {string} migrationName - Name of migration to rollback
   * @returns {Object} Rollback result
   */
  async rollbackMigration(migrationName) {
    const startTime = Date.now();

    try {
      // Check migration record
      const migrationRecord = await Migration.findOne({ name: migrationName });
      if (!migrationRecord) {
        throw new Error(`Migration ${migrationName} not found in database`);
      }

      if (migrationRecord.status !== 'completed') {
        throw new Error(`Migration ${migrationName} is not in completed state`);
      }

      if (!migrationRecord.rollbackAvailable) {
        throw new Error(`Migration ${migrationName} does not support rollback`);
      }

      // Load migration file
      const migrationFile = await this.getMigrationFile(migrationName);
      const migration = require(migrationFile.filePath);

      if (typeof migration.down !== 'function') {
        throw new Error(`Migration ${migrationName} missing down() function`);
      }

      // Update status to rolling back
      await Migration.findByIdAndUpdate(migrationRecord._id, {
        status: 'running'
      });

      // Execute rollback
      await migration.down();

      // Update migration record
      await Migration.findByIdAndUpdate(migrationRecord._id, {
        status: 'rolled_back',
        executionTime: Date.now() - startTime
      });

      logger.info(`Migration ${migrationName} rolled back successfully`);

      return {
        success: true,
        migrationName,
        executionTime: Date.now() - startTime,
        message: 'Migration rolled back successfully'
      };

    } catch (error) {
      logger.error(`Rollback failed for ${migrationName}:`, error);
      
      return {
        success: false,
        migrationName,
        error: error.message,
        executionTime: Date.now() - startTime
      };
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
   * Create database backup
   * @param {string} migrationName - Migration name for backup naming
   * @returns {string} Backup file path
   */
  async createDatabaseBackup(migrationName) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${migrationName}_${timestamp}`;
      const backupPath = path.join(this.backupsPath, `${backupName}.json`);

      // Get all collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      const backup = {
        timestamp: new Date(),
        migrationName,
        collections: {}
      };

      // Backup each collection
      for (const collection of collections) {
        const collectionName = collection.name;
        const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
        backup.collections[collectionName] = data;
      }

      // Write backup file
      await fs.writeJson(backupPath, backup, { spaces: 2 });
      
      logger.info(`Database backup created: ${backupPath}`);
      return backupPath;

    } catch (error) {
      logger.error('Failed to create database backup:', error);
      throw error;
    }
  }

  /**
   * Get migration file information
   * @param {string} migrationName - Migration name
   * @returns {Object} Migration file info
   */
  async getMigrationFile(migrationName) {
    const migrationFiles = await this.getMigrationFiles();
    return migrationFiles.find(file => file.name === migrationName);
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
        backupsAvailable: (await fs.readdir(this.backupsPath)).length
      };
    } catch (error) {
      logger.error('Failed to get migration system status:', error);
      throw error;
    }
  }
}

module.exports = new MigrationService();
