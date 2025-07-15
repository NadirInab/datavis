#!/usr/bin/env node

/**
 * Complete Data Flow Test Script
 * 
 * Tests both Google OAuth user creation and file upload persistence
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function testBackendHealth() {
  console.log('🔍 Testing backend health...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    
    if (response.data.success) {
      console.log('✅ Backend is running:', {
        environment: response.data.environment,
        database: response.data.database,
        port: response.data.port
      });
      return true;
    } else {
      console.error('❌ Backend health check failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Backend is not accessible:', {
      message: error.message,
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
    
    console.log('❌ Unexpected success with test token:', response.data);
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Auth endpoint is working (properly rejected test token)');
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

async function testFileUploadEndpoint() {
  console.log('🔍 Testing file upload endpoint...');
  
  try {
    // Create a test CSV file
    const testCsvContent = 'name,age,city\nJohn,25,New York\nJane,30,Los Angeles';
    const testFilePath = path.join(__dirname, 'test-upload.csv');
    fs.writeFileSync(testFilePath, testCsvContent);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('metadata', JSON.stringify({
      filename: 'test-upload.csv',
      size: testCsvContent.length,
      type: 'text/csv'
    }));
    
    const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    if (response.data.success) {
      console.log('✅ File upload endpoint is working:', {
        fileId: response.data.file.id,
        filename: response.data.file.filename
      });
      return true;
    } else {
      console.error('❌ File upload failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ File upload endpoint error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return false;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Data Flow Test...\n');
  
  // Test 1: Backend Health
  const healthOk = await testBackendHealth();
  console.log('');
  
  if (!healthOk) {
    console.log('❌ Backend is not running. Please start the backend server:');
    console.log('   cd backend');
    console.log('   npm start');
    return;
  }
  
  // Test 2: Auth Endpoint
  const authOk = await testAuthEndpoint();
  console.log('');
  
  // Test 3: File Upload Endpoint
  const fileUploadOk = await testFileUploadEndpoint();
  console.log('');
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log(`   Backend Health: ${healthOk ? '✅' : '❌'}`);
  console.log(`   Auth Endpoint: ${authOk ? '✅' : '❌'}`);
  console.log(`   File Upload: ${fileUploadOk ? '✅' : '❌'}`);
  console.log('');
  
  if (healthOk && authOk && fileUploadOk) {
    console.log('🎉 All backend endpoints are working!');
    console.log('');
    console.log('📋 Manual Testing Steps:');
    console.log('');
    console.log('🔐 Google OAuth Test:');
    console.log('1. Open frontend application');
    console.log('2. Open browser developer tools (F12) → Console');
    console.log('3. Click "Sign in with Google"');
    console.log('4. Watch for console logs:');
    console.log('   - "🔍 Starting user verification"');
    console.log('   - "✅ Backend verification successful"');
    console.log('5. Check MongoDB users collection for new user');
    console.log('');
    console.log('📁 File Upload Test:');
    console.log('1. Sign in with Google (if not already signed in)');
    console.log('2. Upload a CSV file');
    console.log('3. Watch for console logs:');
    console.log('   - "🚀 Starting file upload to backend"');
    console.log('   - "✅ File uploaded successfully to backend"');
    console.log('4. Check MongoDB files collection for new file');
    console.log('5. Sign out and sign back in');
    console.log('6. Verify file count persists');
    console.log('');
    console.log('🔍 Database Verification:');
    console.log('1. Connect to MongoDB Atlas');
    console.log('2. Navigate to csv-dashboard database');
    console.log('3. Check users collection for Google user');
    console.log('4. Check files collection for uploaded file');
    console.log('5. Verify ownerUid matches user firebaseUid');
  } else {
    console.log('❌ Some endpoints are not working. Please check:');
    console.log('1. Backend server is running on port 5000');
    console.log('2. MongoDB connection is working');
    console.log('3. Environment variables are properly configured');
    console.log('4. Firebase service account credentials are valid');
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(error => {
  console.error('🚨 Test script error:', error);
  process.exit(1);
});
