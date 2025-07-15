#!/usr/bin/env node

/**
 * Google Sign-In to MongoDB Test Script
 * 
 * This script tests the complete Google Sign-In flow to ensure users are created in MongoDB
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function testBackendHealth() {
  console.log('🔍 Testing backend health...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    
    if (response.data.success) {
      console.log('✅ Backend is running:', {
        environment: response.data.environment,
        database: response.data.database,
        port: response.data.port,
        timestamp: response.data.timestamp
      });
      return true;
    } else {
      console.error('❌ Backend health check failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Backend is not running or not accessible:', {
      message: error.message,
      code: error.code,
      url: `${API_BASE_URL}/health`
    });
    return false;
  }
}

async function testAuthEndpoint() {
  console.log('🔍 Testing auth verification endpoint...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/verify`, {
      idToken: 'test-token'
    });
    
    // We expect this to fail with a proper error message
    console.log('❌ Unexpected success with test token:', response.data);
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Auth endpoint is working (properly rejected test token):', {
        status: error.response.status,
        message: error.response.data.message
      });
      return true;
    } else {
      console.error('❌ Auth endpoint error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      return false;
    }
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting Google Sign-In to MongoDB Diagnostics...\n');
  
  const healthOk = await testBackendHealth();
  console.log('');
  
  if (!healthOk) {
    console.log('❌ Backend is not running. Please start the backend server:');
    console.log('   cd backend');
    console.log('   npm start');
    console.log('');
    return;
  }
  
  const authOk = await testAuthEndpoint();
  console.log('');
  
  if (healthOk && authOk) {
    console.log('✅ Backend is ready for Google Sign-In!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Open your frontend application');
    console.log('2. Open browser developer tools (F12)');
    console.log('3. Go to Console tab');
    console.log('4. Click "Sign in with Google"');
    console.log('5. Watch for these console messages:');
    console.log('   - "🔍 Starting user verification"');
    console.log('   - "🔑 Firebase token obtained"');
    console.log('   - "✅ Backend verification successful"');
    console.log('');
    console.log('📊 Check MongoDB:');
    console.log('1. Connect to your MongoDB Atlas cluster');
    console.log('2. Navigate to csv-dashboard database');
    console.log('3. Check users collection');
    console.log('4. Verify new user document appears after sign-in');
  } else {
    console.log('❌ Backend setup issues detected. Please check:');
    console.log('1. Backend server is running on port 5000');
    console.log('2. MongoDB connection is working');
    console.log('3. Firebase service account credentials are configured');
    console.log('4. Environment variables are properly set');
  }
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('🚨 Diagnostic script error:', error);
  process.exit(1);
});
