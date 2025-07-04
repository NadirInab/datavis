#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// Test script to verify admin routes functionality
async function testAdminRoutes() {
  try {
    console.log('🔍 Testing Admin Routes Dependencies...\n');

    // Test 1: Database Connection
    console.log('1. Testing Database Connection...');
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/csv-dashboard';
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully');

    // Test 2: Check if required models exist
    console.log('\n2. Testing Model Imports...');
    try {
      const User = require('./src/models/User');
      console.log('✅ User model loaded');
    } catch (error) {
      console.log('❌ User model failed:', error.message);
    }

    try {
      const Migration = require('./src/models/Migration');
      console.log('✅ Migration model loaded');
    } catch (error) {
      console.log('❌ Migration model failed:', error.message);
    }

    // Test 3: Check migration manager
    console.log('\n3. Testing Migration Manager...');
    try {
      const migrationManager = require('./src/utils/migrationManager');
      console.log('✅ Migration manager loaded');
      
      // Test getting migration status
      const status = await migrationManager.getStatus();
      console.log(`✅ Migration status retrieved: ${status.currentVersion}`);
    } catch (error) {
      console.log('❌ Migration manager failed:', error.message);
    }

    // Test 4: Check logger
    console.log('\n4. Testing Logger...');
    try {
      const logger = require('./src/utils/logger');
      logger.info('Test log message');
      console.log('✅ Logger working');
    } catch (error) {
      console.log('❌ Logger failed:', error.message);
    }

    // Test 5: Check admin controller functions
    console.log('\n5. Testing Admin Controller Functions...');
    try {
      const adminController = require('./src/controllers/adminController');
      const requiredFunctions = [
        'getDatabaseStatus',
        'getCollectionStats',
        'runSeeder',
        'clearCollection',
        'getAllUsers',
        'updateUserStatus',
        'updateUserRole',
        'getSystemStatus',
        'getUsageAnalytics',
        'runMigrations',
        'getMigrationStatus',
        'getPerformanceMetrics',
        'getCollectionData'
      ];

      requiredFunctions.forEach(funcName => {
        if (typeof adminController[funcName] === 'function') {
          console.log(`✅ ${funcName} function exists`);
        } else {
          console.log(`❌ ${funcName} function missing`);
        }
      });
    } catch (error) {
      console.log('❌ Admin controller failed:', error.message);
    }

    // Test 6: Check collections
    console.log('\n6. Testing Database Collections...');
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      console.log(`✅ Found ${collections.length} collections:`);
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    } catch (error) {
      console.log('❌ Collections check failed:', error.message);
    }

    // Test 7: Test basic database operations
    console.log('\n7. Testing Basic Database Operations...');
    try {
      const db = mongoose.connection.db;
      
      // Test if we can count documents in users collection
      if (await db.collection('users').countDocuments) {
        const userCount = await db.collection('users').countDocuments();
        console.log(`✅ Users collection accessible: ${userCount} documents`);
      }
    } catch (error) {
      console.log('❌ Database operations failed:', error.message);
    }

    console.log('\n🎉 Admin Routes Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the test
testAdminRoutes();
