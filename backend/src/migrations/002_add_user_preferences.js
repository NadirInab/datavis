const mongoose = require('mongoose');

module.exports = {
  description: 'Add user preferences field to users collection',

  async up() {
    const db = mongoose.connection.db;
    
    // Add preferences field to all existing users
    await db.collection('users').updateMany(
      { preferences: { $exists: false } },
      {
        $set: {
          preferences: {
            theme: 'light',
            notifications: {
              email: true,
              browser: true,
              marketing: false
            },
            dashboard: {
              defaultView: 'grid',
              itemsPerPage: 10
            },
            privacy: {
              profileVisible: false,
              dataSharing: false
            }
          }
        }
      }
    );
    
    // Create index for preferences queries
    await db.collection('users').createIndex({ 'preferences.theme': 1 });
    
    console.log('✅ User preferences field added successfully');
  },

  async down() {
    const db = mongoose.connection.db;
    
    // Remove preferences field from all users
    await db.collection('users').updateMany(
      {},
      { $unset: { preferences: "" } }
    );
    
    // Drop the preferences index
    try {
      await db.collection('users').dropIndex({ 'preferences.theme': 1 });
    } catch (error) {
      // Index might not exist, ignore error
      console.log('Preferences index not found, skipping...');
    }
    
    console.log('✅ User preferences field removed successfully');
  }
};
