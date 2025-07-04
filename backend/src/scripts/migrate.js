#!/usr/bin/env node

const mongoose = require('mongoose');
const migrationManager = require('../utils/migrationManager');
const logger = require('../utils/logger');

// Database configuration
const dbConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/csv-dashboard',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
};

async function connectDatabase() {
  try {
    await mongoose.connect(dbConfig.uri, dbConfig.options);
    logger.info('Connected to MongoDB for migrations');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
}

async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
}

async function runMigrations() {
  const args = process.argv.slice(2);
  const command = args[0];
  const version = args[1];

  try {
    await connectDatabase();

    switch (command) {
      case 'up':
        logger.info('Running migrations up...');
        const upResult = await migrationManager.runUp(version);
        console.log('\n✅ Migration Results:');
        upResult.results.forEach(result => {
          const status = result.status === 'completed' ? '✅' : '❌';
          console.log(`${status} ${result.name} (${result.version}) - ${result.executionTime || 0}ms`);
          if (result.error) {
            console.log(`   Error: ${result.error}`);
          }
        });
        console.log(`\n📊 Current database version: ${upResult.currentVersion}`);
        break;

      case 'down':
        logger.info('Running migrations down...');
        const downResult = await migrationManager.runDown(version);
        console.log('\n✅ Rollback Results:');
        downResult.results.forEach(result => {
          const status = result.status === 'rolled_back' ? '✅' : '❌';
          console.log(`${status} ${result.name} (${result.version}) - ${result.executionTime || 0}ms`);
          if (result.error) {
            console.log(`   Error: ${result.error}`);
          }
        });
        console.log(`\n📊 Current database version: ${downResult.currentVersion}`);
        break;

      case 'status':
        logger.info('Getting migration status...');
        const status = await migrationManager.getStatus();
        console.log('\n📊 Migration Status:');
        console.log(`Current Version: ${status.currentVersion}`);
        console.log(`Pending Migrations: ${status.pendingCount}`);
        
        if (status.history.length > 0) {
          console.log('\n📋 Recent Migration History:');
          status.history.slice(0, 10).forEach(migration => {
            const statusIcon = migration.status === 'completed' ? '✅' : 
                              migration.status === 'failed' ? '❌' : 
                              migration.status === 'rolled_back' ? '🔄' : '⏳';
            const date = migration.executedAt ? new Date(migration.executedAt).toLocaleString() : 'Not executed';
            console.log(`${statusIcon} ${migration.name} (${migration.version}) - ${date}`);
            if (migration.error) {
              console.log(`   Error: ${migration.error}`);
            }
          });
        }
        break;

      case 'create':
        if (!version) {
          console.error('❌ Please provide a migration name: npm run migrate create <migration_name>');
          process.exit(1);
        }
        await createMigrationTemplate(version);
        break;

      default:
        console.log(`
🚀 CSV Dashboard Migration Tool

Usage:
  npm run migrate up [version]     - Run migrations up to specified version (or all)
  npm run migrate down [version]   - Rollback migrations down to specified version (or one)
  npm run migrate status           - Show migration status and history
  npm run migrate create <name>    - Create a new migration template

Examples:
  npm run migrate up               - Run all pending migrations
  npm run migrate up 003          - Run migrations up to version 003
  npm run migrate down             - Rollback the last migration
  npm run migrate down 001        - Rollback to version 001
  npm run migrate status           - Show current status
  npm run migrate create add_user_avatar - Create new migration
        `);
        break;
    }

  } catch (error) {
    logger.error('Migration command failed:', error);
    console.error(`❌ Migration failed: ${error.message}`);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

async function createMigrationTemplate(name) {
  const fs = require('fs').promises;
  const path = require('path');
  
  // Get next version number
  const migrationsPath = path.join(__dirname, '../migrations');
  const files = await fs.readdir(migrationsPath);
  const versions = files
    .filter(file => file.endsWith('.js'))
    .map(file => parseInt(file.split('_')[0]))
    .filter(v => !isNaN(v));
  
  const nextVersion = Math.max(0, ...versions) + 1;
  const versionStr = nextVersion.toString().padStart(3, '0');
  const filename = `${versionStr}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.js`;
  const filepath = path.join(migrationsPath, filename);
  
  const template = `const mongoose = require('mongoose');

module.exports = {
  description: '${name.replace(/_/g, ' ')}',

  async up() {
    const db = mongoose.connection.db;
    
    // TODO: Implement migration logic here
    // Example:
    // await db.collection('users').updateMany({}, { $set: { newField: 'defaultValue' } });
    
    console.log('✅ Migration ${filename} completed');
  },

  async down() {
    const db = mongoose.connection.db;
    
    // TODO: Implement rollback logic here
    // Example:
    // await db.collection('users').updateMany({}, { $unset: { newField: "" } });
    
    console.log('✅ Migration ${filename} rolled back');
  }
};`;

  await fs.writeFile(filepath, template);
  console.log(`✅ Created migration: ${filename}`);
  console.log(`📝 Edit the file at: ${filepath}`);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the migration command
runMigrations();
