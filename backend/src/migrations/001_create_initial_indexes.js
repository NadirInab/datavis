const mongoose = require('mongoose');

module.exports = {
  description: 'Create initial database indexes for better performance',

  async up() {
    const db = mongoose.connection.db;
    
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ subscription: 1 });
    await db.collection('users').createIndex({ createdAt: -1 });
    
    // Files collection indexes
    await db.collection('files').createIndex({ userId: 1 });
    await db.collection('files').createIndex({ status: 1 });
    await db.collection('files').createIndex({ createdAt: -1 });
    await db.collection('files').createIndex({ userId: 1, createdAt: -1 });
    
    // Payments collection indexes
    await db.collection('payments').createIndex({ userId: 1 });
    await db.collection('payments').createIndex({ status: 1 });
    await db.collection('payments').createIndex({ planType: 1 });
    await db.collection('payments').createIndex({ createdAt: -1 });
    await db.collection('payments').createIndex({ userId: 1, createdAt: -1 });
    
    // Subscriptions collection indexes
    await db.collection('usersubscriptions').createIndex({ userId: 1 }, { unique: true });
    await db.collection('usersubscriptions').createIndex({ tier: 1 });
    await db.collection('usersubscriptions').createIndex({ status: 1 });
    await db.collection('usersubscriptions').createIndex({ endDate: 1 });
    
    console.log('✅ Initial indexes created successfully');
  },

  async down() {
    const db = mongoose.connection.db;
    
    // Drop indexes (keep unique email index for data integrity)
    await db.collection('users').dropIndex({ role: 1 });
    await db.collection('users').dropIndex({ subscription: 1 });
    await db.collection('users').dropIndex({ createdAt: -1 });
    
    await db.collection('files').dropIndex({ userId: 1 });
    await db.collection('files').dropIndex({ status: 1 });
    await db.collection('files').dropIndex({ createdAt: -1 });
    await db.collection('files').dropIndex({ userId: 1, createdAt: -1 });
    
    await db.collection('payments').dropIndex({ userId: 1 });
    await db.collection('payments').dropIndex({ status: 1 });
    await db.collection('payments').dropIndex({ planType: 1 });
    await db.collection('payments').dropIndex({ createdAt: -1 });
    await db.collection('payments').dropIndex({ userId: 1, createdAt: -1 });
    
    await db.collection('usersubscriptions').dropIndex({ tier: 1 });
    await db.collection('usersubscriptions').dropIndex({ status: 1 });
    await db.collection('usersubscriptions').dropIndex({ endDate: 1 });
    
    console.log('✅ Initial indexes removed successfully');
  }
};
