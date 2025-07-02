#!/usr/bin/env node

require('dotenv').config();
const { initializeFirebase, verifyIdToken, getUserByUid, setCustomUserClaims } = require('../src/config/firebase');
const logger = require('../src/utils/logger');

async function testFirebaseIntegration() {
  console.log('🔥 Testing Firebase Admin SDK Integration');
  console.log('==========================================\n');

  try {
    // Test 1: Initialize Firebase
    console.log('1. 🚀 Initializing Firebase Admin SDK...');
    const app = initializeFirebase();
    console.log('   ✓ Firebase Admin SDK initialized successfully');
    console.log(`   ✓ Project ID: ${app.options.projectId}`);

    // Test 2: Check environment variables
    console.log('\n2. 🔧 Checking environment variables...');
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID'
    ];

    let allVarsPresent = true;
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`   ✓ ${varName}: Set`);
      } else {
        console.log(`   ✗ ${varName}: Missing`);
        allVarsPresent = false;
      }
    });

    if (!allVarsPresent) {
      console.log('\n❌ Some required environment variables are missing.');
      console.log('   Please run: node scripts/setup-firebase.js for instructions');
      process.exit(1);
    }

    // Test 3: Test token verification (with dummy token - will fail but shows the method works)
    console.log('\n3. 🔐 Testing token verification method...');
    try {
      await verifyIdToken('dummy-token');
    } catch (error) {
      if (error.code === 'auth/argument-error') {
        console.log('   ✓ Token verification method is working (expected error with dummy token)');
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.message}`);
      }
    }

    // Test 4: Test Firebase Auth service
    console.log('\n4. 🔍 Testing Firebase Auth service...');
    const { getAuth } = require('../src/config/firebase');
    const auth = getAuth();
    console.log('   ✓ Firebase Auth service accessible');

    // Test 5: Project configuration validation
    console.log('\n5. ✅ Validating project configuration...');
    const expectedProjectId = 'datavis-e9c61';
    if (app.options.projectId === expectedProjectId) {
      console.log(`   ✓ Project ID matches expected: ${expectedProjectId}`);
    } else {
      console.log(`   ⚠️  Project ID mismatch. Expected: ${expectedProjectId}, Got: ${app.options.projectId}`);
    }

    console.log('\n🎉 Firebase integration test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start your frontend with the Firebase client config');
    console.log('   2. Authenticate a user in the frontend');
    console.log('   3. Send the ID token to backend endpoints');
    console.log('   4. Check backend logs for successful token verification');

    console.log('\n🔗 Test endpoints:');
    console.log('   POST /api/v1/auth/verify - Verify Firebase token');
    console.log('   GET  /api/v1/auth/me     - Get authenticated user');

    process.exit(0);

  } catch (error) {
    console.log('\n❌ Firebase integration test failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.code === 'auth/invalid-credential') {
      console.log('\n💡 This usually means:');
      console.log('   • Service account credentials are incorrect');
      console.log('   • Private key format is wrong (check newlines)');
      console.log('   • Project ID doesn\'t match the service account');
    }

    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verify your service account JSON file');
    console.log('   2. Check .env file formatting (especially private key)');
    console.log('   3. Ensure project ID is "datavis-e9c61"');
    console.log('   4. Run: node scripts/setup-firebase.js for setup instructions');

    process.exit(1);
  }
}

// Test Firebase client configuration compatibility
function testClientConfigCompatibility() {
  console.log('\n6. 🔄 Testing client configuration compatibility...');
  
  const clientConfig = {
    apiKey: "AIzaSyC5GTTlDOilXfIyTRMozilCDGojS2l9XrQ",
    authDomain: "datavis-e9c61.firebaseapp.com",
    projectId: "datavis-e9c61",
    storageBucket: "datavis-e9c61.firebasestorage.app",
    messagingSenderId: "172462461511",
    appId: "1:172462461511:web:7896d73115f287808c5762",
    measurementId: "G-ZSD3EYCBVJ"
  };

  const backendProjectId = process.env.FIREBASE_PROJECT_ID || 'datavis-e9c61';
  
  if (clientConfig.projectId === backendProjectId) {
    console.log('   ✓ Client and backend project IDs match');
    console.log(`   ✓ Project: ${clientConfig.projectId}`);
    console.log(`   ✓ Auth Domain: ${clientConfig.authDomain}`);
  } else {
    console.log(`   ✗ Project ID mismatch! Client: ${clientConfig.projectId}, Backend: ${backendProjectId}`);
  }
}

if (require.main === module) {
  testFirebaseIntegration().then(() => {
    testClientConfigCompatibility();
  });
}

module.exports = { testFirebaseIntegration };
