/**
 * Migration: Create database indexes
 * Version: 1.1.0
 * Description: Create performance indexes for better query performance
 */

const mongoose = require('mongoose');

module.exports = {
  version: '1.1.0',
  description: 'Create performance indexes for better query performance',
  dependencies: ['001_add_user_profile_fields'],

  /**
   * Execute migration
   */
  async up() {
    console.log('Starting migration: Create database indexes');

    try {
      const db = mongoose.connection.db;

      // Create indexes for users collection
      console.log('Creating indexes for users collection...');
      
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
      console.log('Creating indexes for files collection...');
      
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
      console.log('Creating indexes for usage tracking collection...');
      
      await db.collection('usagetrackings').createIndex(
        { userId: 1, eventType: 1 },
        { background: true }
      );
      
      await db.collection('usagetrackings').createIndex(
        { timestamp: 1 },
        { background: true }
      );

      // Create indexes for migrations collection
      console.log('Creating indexes for migrations collection...');
      
      await db.collection('migrations').createIndex(
        { name: 1 },
        { unique: true, background: true }
      );
      
      await db.collection('migrations').createIndex(
        { status: 1, executedAt: 1 },
        { background: true }
      );

      console.log('All indexes created successfully');
    } catch (error) {
      console.error('Index creation failed:', error);
      throw error;
    }
  },

  /**
   * Rollback migration
   */
  async down() {
    console.log('Rolling back migration: Create database indexes');

    try {
      const db = mongoose.connection.db;

      // Drop custom indexes (keep default _id indexes)
      console.log('Dropping custom indexes...');

      // Users collection indexes
      try {
        await db.collection('users').dropIndex({ email: 1 });
        await db.collection('users').dropIndex({ firebaseUid: 1 });
        await db.collection('users').dropIndex({ role: 1, isActive: 1 });
        await db.collection('users').dropIndex({ 'subscription.tier': 1 });
        await db.collection('users').dropIndex({ lastActivityAt: 1 });
      } catch (error) {
        console.warn('Some user indexes may not exist:', error.message);
      }

      // Files collection indexes
      try {
        await db.collection('files').dropIndex({ ownerUid: 1, status: 1 });
        await db.collection('files').dropIndex({ uploadedAt: 1 });
        await db.collection('files').dropIndex({ ownerType: 1, visitorSessionId: 1 });
      } catch (error) {
        console.warn('Some file indexes may not exist:', error.message);
      }

      // Usage tracking indexes
      try {
        await db.collection('usagetrackings').dropIndex({ userId: 1, eventType: 1 });
        await db.collection('usagetrackings').dropIndex({ timestamp: 1 });
      } catch (error) {
        console.warn('Some usage tracking indexes may not exist:', error.message);
      }

      // Migration indexes
      try {
        await db.collection('migrations').dropIndex({ name: 1 });
        await db.collection('migrations').dropIndex({ status: 1, executedAt: 1 });
      } catch (error) {
        console.warn('Some migration indexes may not exist:', error.message);
      }

      console.log('Index rollback completed');
    } catch (error) {
      console.error('Index rollback failed:', error);
      throw error;
    }
  }
};
