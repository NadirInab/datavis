const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const Migration = require('../models/Migration');
const logger = require('./logger');

class MigrationManager {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../migrations');
    this.isRunning = false;
  }

  // Get all migration files
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.js'))
        .sort()
        .map(file => ({
          filename: file,
          name: file.replace('.js', ''),
          version: this.extractVersion(file),
          path: path.join(this.migrationsPath, file)
        }));
    } catch (error) {
      logger.error('Error reading migration files:', error);
      return [];
    }
  }

  // Extract version from filename (e.g., "001_create_users_table.js" -> "001")
  extractVersion(filename) {
    const match = filename.match(/^(\d+)_/);
    return match ? match[1] : '000';
  }

  // Calculate file checksum
  async calculateChecksum(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      logger.error('Error calculating checksum:', error);
      return null;
    }
  }

  // Load migration module
  async loadMigration(filePath) {
    try {
      // Clear require cache to ensure fresh load
      delete require.cache[require.resolve(filePath)];
      return require(filePath);
    } catch (error) {
      logger.error('Error loading migration:', error);
      throw new Error(`Failed to load migration: ${error.message}`);
    }
  }

  // Register migration in database
  async registerMigration(migrationFile) {
    const checksum = await this.calculateChecksum(migrationFile.path);
    const migration = await this.loadMigration(migrationFile.path);

    const existingMigration = await Migration.findOne({ name: migrationFile.name });
    
    if (existingMigration) {
      // Check if migration file has changed
      if (existingMigration.checksum !== checksum && existingMigration.status === 'completed') {
        logger.warn(`Migration ${migrationFile.name} has been modified after execution`);
      }
      return existingMigration;
    }

    // Create new migration record
    return Migration.create({
      name: migrationFile.name,
      version: migrationFile.version,
      description: migration.description || 'No description provided',
      checksum,
      status: 'pending'
    });
  }

  // Run migrations up
  async runUp(targetVersion = null) {
    if (this.isRunning) {
      throw new Error('Migration is already running');
    }

    this.isRunning = true;
    const results = [];

    try {
      const migrationFiles = await this.getMigrationFiles();
      const currentVersion = await Migration.getCurrentVersion();

      logger.info(`Current database version: ${currentVersion}`);

      for (const migrationFile of migrationFiles) {
        // Skip if we've reached target version
        if (targetVersion && migrationFile.version > targetVersion) {
          break;
        }

        // Skip if migration is already completed
        const migrationRecord = await this.registerMigration(migrationFile);
        if (migrationRecord.status === 'completed') {
          continue;
        }

        // Skip if version is not greater than current
        if (migrationFile.version <= currentVersion && migrationRecord.status !== 'failed') {
          continue;
        }

        logger.info(`Running migration: ${migrationFile.name}`);
        
        const startTime = Date.now();
        migrationRecord.status = 'running';
        await migrationRecord.save();

        try {
          const migration = await this.loadMigration(migrationFile.path);
          
          if (typeof migration.up !== 'function') {
            throw new Error('Migration must export an "up" function');
          }

          await migration.up();
          
          const executionTime = Date.now() - startTime;
          await migrationRecord.markCompleted(executionTime);
          
          results.push({
            name: migrationFile.name,
            version: migrationFile.version,
            status: 'completed',
            executionTime
          });

          logger.info(`Migration ${migrationFile.name} completed in ${executionTime}ms`);

        } catch (error) {
          await migrationRecord.markFailed(error.message);
          
          results.push({
            name: migrationFile.name,
            version: migrationFile.version,
            status: 'failed',
            error: error.message
          });

          logger.error(`Migration ${migrationFile.name} failed:`, error);
          
          // Stop on first failure
          break;
        }
      }

      return {
        success: true,
        results,
        currentVersion: await Migration.getCurrentVersion()
      };

    } catch (error) {
      logger.error('Migration process failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Run migrations down (rollback)
  async runDown(targetVersion = null) {
    if (this.isRunning) {
      throw new Error('Migration is already running');
    }

    this.isRunning = true;
    const results = [];

    try {
      const completedMigrations = await Migration.find({ 
        status: 'completed' 
      }).sort({ version: -1 });

      for (const migrationRecord of completedMigrations) {
        // Stop if we've reached target version
        if (targetVersion && migrationRecord.version <= targetVersion) {
          break;
        }

        logger.info(`Rolling back migration: ${migrationRecord.name}`);

        const migrationFiles = await this.getMigrationFiles();
        const migrationFile = migrationFiles.find(f => f.name === migrationRecord.name);

        if (!migrationFile) {
          logger.warn(`Migration file not found for: ${migrationRecord.name}`);
          continue;
        }

        const startTime = Date.now();

        try {
          const migration = await this.loadMigration(migrationFile.path);
          
          if (typeof migration.down !== 'function') {
            throw new Error('Migration must export a "down" function for rollback');
          }

          await migration.down();
          
          const executionTime = Date.now() - startTime;
          await migrationRecord.markRolledBack();
          
          results.push({
            name: migrationRecord.name,
            version: migrationRecord.version,
            status: 'rolled_back',
            executionTime
          });

          logger.info(`Migration ${migrationRecord.name} rolled back in ${executionTime}ms`);

          // If no target version specified, only rollback one migration
          if (!targetVersion) {
            break;
          }

        } catch (error) {
          results.push({
            name: migrationRecord.name,
            version: migrationRecord.version,
            status: 'rollback_failed',
            error: error.message
          });

          logger.error(`Rollback failed for ${migrationRecord.name}:`, error);
          
          // Stop on first failure
          break;
        }
      }

      return {
        success: true,
        results,
        currentVersion: await Migration.getCurrentVersion()
      };

    } catch (error) {
      logger.error('Rollback process failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Get migration status
  async getStatus() {
    const currentVersion = await Migration.getCurrentVersion();
    const pendingMigrations = await Migration.getPendingMigrations();
    const history = await Migration.getHistory(20);

    return {
      currentVersion,
      pendingCount: pendingMigrations.length,
      history: history.map(m => ({
        name: m.name,
        version: m.version,
        description: m.description,
        status: m.status,
        executedAt: m.executedAt,
        rolledBackAt: m.rolledBackAt,
        executionTime: m.executionTime,
        error: m.error
      }))
    };
  }
}

module.exports = new MigrationManager();
