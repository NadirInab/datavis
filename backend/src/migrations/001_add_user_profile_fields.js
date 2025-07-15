/**
 * Migration: Add user profile fields
 * Version: 1.0.0
 * Description: Add profile fields to existing users for enhanced Google OAuth integration
 */

const mongoose = require('mongoose');

module.exports = {
  version: '1.0.0',
  description: 'Add user profile fields for enhanced Google OAuth integration',
  dependencies: [],

  /**
   * Execute migration
   */
  async up() {
    console.log('Starting migration: Add user profile fields');

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

      console.log(`Updated ${result.modifiedCount} users with profile fields`);

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

      console.log(`Updated ${googleResult.modifiedCount} Google users with correct provider`);

      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  /**
   * Rollback migration
   */
  async down() {
    console.log('Rolling back migration: Add user profile fields');

    try {
      // Remove profile fields from users
      const result = await mongoose.connection.db.collection('users').updateMany(
        {},
        {
          $unset: {
            profile: 1
          }
        }
      );

      console.log(`Removed profile fields from ${result.modifiedCount} users`);
      console.log('Migration rollback completed successfully');
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};
