const mongoose = require('mongoose');
const logger = require('../utils/logger');
require('dotenv').config();

// Import models to ensure they're registered
const User = require('../models/User');
const File = require('../models/File');
const { SubscriptionPlan, UserSubscription } = require('../models/Subscription');
const { UsageTracking, SystemAnalytics } = require('../models/UsageTracking');

const connectDB = require('./connection');

const migrations = [
  {
    version: '1.0.0',
    name: 'Initial Schema Setup',
    up: async () => {
      logger.info('Running migration: Initial Schema Setup');
      
      // Create indexes for User model
      await User.collection.createIndex({ firebaseUid: 1 }, { unique: true });
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ role: 1 });
      await User.collection.createIndex({ 'subscription.tier': 1 });
      await User.collection.createIndex({ 'subscription.stripeCustomerId': 1 });
      await User.collection.createIndex({ isActive: 1 });
      await User.collection.createIndex({ createdAt: -1 });
      await User.collection.createIndex({ lastActivityAt: -1 });
      await User.collection.createIndex({ 'visitorSession.sessionId': 1 });
      
      // Create indexes for File model
      await File.collection.createIndex({ ownerUid: 1, uploadedAt: -1 });
      await File.collection.createIndex({ ownerType: 1 });
      await File.collection.createIndex({ visitorSessionId: 1 });
      await File.collection.createIndex({ status: 1 });
      await File.collection.createIndex({ uploadedAt: -1 });
      await File.collection.createIndex({ expiresAt: 1 });
      await File.collection.createIndex({ 'settings.isPublic': 1 });
      
      // Create indexes for UserSubscription model
      await UserSubscription.collection.createIndex({ userUid: 1 }, { unique: true });
      await UserSubscription.collection.createIndex({ tier: 1 });
      await UserSubscription.collection.createIndex({ status: 1 });
      await UserSubscription.collection.createIndex({ stripeCustomerId: 1 });
      await UserSubscription.collection.createIndex({ stripeSubscriptionId: 1 });
      await UserSubscription.collection.createIndex({ currentPeriodEnd: 1 });
      
      // Create indexes for SubscriptionPlan model
      await SubscriptionPlan.collection.createIndex({ tier: 1 }, { unique: true });
      await SubscriptionPlan.collection.createIndex({ isActive: 1 });
      await SubscriptionPlan.collection.createIndex({ sortOrder: 1 });
      
      // Create indexes for UsageTracking model
      await UsageTracking.collection.createIndex({ userUid: 1, 'period.year': 1, 'period.month': 1 });
      await UsageTracking.collection.createIndex({ subscriptionTier: 1, 'period.year': 1, 'period.month': 1 });
      await UsageTracking.collection.createIndex({ userRole: 1, 'period.year': 1, 'period.month': 1 });
      await UsageTracking.collection.createIndex({ 'period.year': 1, 'period.month': 1, 'period.day': 1 });
      
      // Create indexes for SystemAnalytics model
      await SystemAnalytics.collection.createIndex({ 'period.year': 1, 'period.month': 1, 'period.day': 1 });
      
      logger.info('✓ All indexes created successfully');
    },
    down: async () => {
      logger.info('Rolling back migration: Initial Schema Setup');
      // Drop all indexes (except _id)
      await User.collection.dropIndexes();
      await File.collection.dropIndexes();
      await UserSubscription.collection.dropIndexes();
      await SubscriptionPlan.collection.dropIndexes();
      await UsageTracking.collection.dropIndexes();
      await SystemAnalytics.collection.dropIndexes();
      logger.info('✓ All indexes dropped');
    }
  },
  
  {
    version: '1.1.0',
    name: 'Add Subscription Plans',
    up: async () => {
      logger.info('Running migration: Add Subscription Plans');
      
      const plans = [
        {
          tier: 'free',
          name: 'Free',
          description: 'Perfect for getting started with CSV analysis',
          pricing: {
            monthly: { amount: 0, currency: 'USD' },
            yearly: { amount: 0, currency: 'USD', discount: 0 }
          },
          features: {
            files: 5,
            storage: 10 * 1024 * 1024, // 10MB
            exports: 10,
            visualizations: ['bar', 'line', 'pie'],
            support: 'community',
            dataRetention: 7,
            pdfExports: false,
            teamSharing: false,
            customVisualizations: false,
            apiAccess: false,
            whiteLabel: false,
            prioritySupport: false
          },
          isActive: true,
          sortOrder: 1
        },
        {
          tier: 'pro',
          name: 'Pro',
          description: 'Advanced features for professional data analysis',
          pricing: {
            monthly: { amount: 1999, currency: 'USD' }, // $19.99
            yearly: { amount: 19990, currency: 'USD', discount: 17 } // $199.90 (17% discount)
          },
          features: {
            files: -1, // unlimited
            storage: 100 * 1024 * 1024, // 100MB
            exports: 100,
            visualizations: ['bar', 'line', 'pie', 'area', 'radar', 'scatter'],
            support: 'email',
            dataRetention: 30,
            pdfExports: true,
            teamSharing: true,
            customVisualizations: false,
            apiAccess: false,
            whiteLabel: false,
            prioritySupport: false
          },
          isActive: true,
          sortOrder: 2
        },
        {
          tier: 'enterprise',
          name: 'Enterprise',
          description: 'Complete solution for teams and organizations',
          pricing: {
            monthly: { amount: 9999, currency: 'USD' }, // $99.99
            yearly: { amount: 99990, currency: 'USD', discount: 17 } // $999.90 (17% discount)
          },
          features: {
            files: -1, // unlimited
            storage: 1024 * 1024 * 1024, // 1GB
            exports: -1, // unlimited
            visualizations: 'all',
            support: 'priority',
            dataRetention: 365,
            pdfExports: true,
            teamSharing: true,
            customVisualizations: true,
            apiAccess: true,
            whiteLabel: true,
            prioritySupport: true
          },
          isActive: true,
          sortOrder: 3
        }
      ];
      
      for (const planData of plans) {
        await SubscriptionPlan.findOneAndUpdate(
          { tier: planData.tier },
          planData,
          { upsert: true, new: true }
        );
        logger.info(`✓ Created/updated subscription plan: ${planData.name}`);
      }
    },
    down: async () => {
      logger.info('Rolling back migration: Add Subscription Plans');
      await SubscriptionPlan.deleteMany({});
      logger.info('✓ All subscription plans removed');
    }
  },
  
  {
    version: '1.2.0',
    name: 'Add Admin User',
    up: async () => {
      logger.info('Running migration: Add Admin User');
      
      // Create admin user if it doesn't exist
      const adminUser = await User.findOne({ role: 'admin' });
      
      if (!adminUser) {
        const admin = new User({
          firebaseUid: 'admin_default',
          email: 'admin@csvdashboard.com',
          name: 'System Administrator',
          role: 'admin',
          isActive: true,
          subscription: {
            tier: 'enterprise',
            status: 'active'
          }
        });
        
        await admin.save();
        logger.info('✓ Admin user created');
      } else {
        logger.info('✓ Admin user already exists');
      }
    },
    down: async () => {
      logger.info('Rolling back migration: Add Admin User');
      await User.deleteOne({ firebaseUid: 'admin_default' });
      logger.info('✓ Admin user removed');
    }
  }
];

// Migration state tracking
const migrationSchema = new mongoose.Schema({
  version: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now },
  rollbackAt: { type: Date, default: null }
});

const Migration = mongoose.model('Migration', migrationSchema);

async function runMigrations() {
  try {
    await connectDB();
    logger.info('Starting database migrations...');
    
    // Get applied migrations
    const appliedMigrations = await Migration.find({}).sort({ appliedAt: 1 });
    const appliedVersions = appliedMigrations.map(m => m.version);
    
    // Run pending migrations
    for (const migration of migrations) {
      if (!appliedVersions.includes(migration.version)) {
        logger.info(`Running migration ${migration.version}: ${migration.name}`);
        
        try {
          await migration.up();
          
          // Record migration
          await Migration.create({
            version: migration.version,
            name: migration.name
          });
          
          logger.info(`✓ Migration ${migration.version} completed successfully`);
        } catch (error) {
          logger.error(`✗ Migration ${migration.version} failed:`, error);
          throw error;
        }
      } else {
        logger.info(`⏭ Migration ${migration.version} already applied`);
      }
    }
    
    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

async function rollbackMigration(version) {
  try {
    await connectDB();
    logger.info(`Rolling back migration ${version}...`);
    
    const migration = migrations.find(m => m.version === version);
    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }
    
    const appliedMigration = await Migration.findOne({ version });
    if (!appliedMigration) {
      throw new Error(`Migration ${version} was not applied`);
    }
    
    await migration.down();
    await Migration.deleteOne({ version });
    
    logger.info(`✓ Migration ${version} rolled back successfully`);
    process.exit(0);
  } catch (error) {
    logger.error('Rollback failed:', error);
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const version = process.argv[3];
  
  switch (command) {
    case 'up':
      runMigrations();
      break;
    case 'down':
      if (!version) {
        logger.error('Please specify a version to rollback');
        process.exit(1);
      }
      rollbackMigration(version);
      break;
    default:
      logger.info('Usage: node migrate.js [up|down] [version]');
      logger.info('  up    - Run all pending migrations');
      logger.info('  down  - Rollback a specific migration');
      process.exit(1);
  }
}

module.exports = {
  runMigrations,
  rollbackMigration,
  migrations
};
