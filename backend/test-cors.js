const axios = require('axios');

console.log('🧪 Testing CORS Configuration...\n');

async function testCORS() {

  const baseURL = 'http://localhost:5000';
  const frontendOrigin = 'http://localhost:5174';

  // Test 1: Health endpoint
  try {
    console.log('1. Testing Health Endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`, {
      headers: {
        'Origin': frontendOrigin
      }
    });
    console.log('✅ Health endpoint accessible');
    console.log('   Status:', healthResponse.status);
    console.log('   CORS Headers:', {
      'Access-Control-Allow-Origin': healthResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Credentials': healthResponse.headers['access-control-allow-credentials']
    });
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
  }

  // Test 2: Auth verify endpoint (OPTIONS preflight)
  try {
    console.log('\n2. Testing Auth Verify Preflight (OPTIONS)...');
    const optionsResponse = await axios.options(`${baseURL}/api/v1/auth/verify`, {
      headers: {
        'Origin': frontendOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    console.log('✅ Preflight request successful');
    console.log('   Status:', optionsResponse.status);
    console.log('   CORS Headers:', {
      'Access-Control-Allow-Origin': optionsResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': optionsResponse.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': optionsResponse.headers['access-control-allow-headers']
    });
  } catch (error) {
    console.log('❌ Preflight request failed:', error.message);
  }

  // Test 3: Auth verify endpoint (POST)
  try {
    console.log('\n3. Testing Auth Verify POST...');
    const postResponse = await axios.post(`${baseURL}/api/v1/auth/verify`, {}, {
      headers: {
        'Origin': frontendOrigin,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ POST request successful');
    console.log('   Status:', postResponse.status);
  } catch (error) {
    if (error.response) {
      console.log('✅ POST request reached server (expected auth error)');
      console.log('   Status:', error.response.status);
      console.log('   CORS Headers:', {
        'Access-Control-Allow-Origin': error.response.headers['access-control-allow-origin'],
        'Access-Control-Allow-Credentials': error.response.headers['access-control-allow-credentials']
      });
    } else {
      console.log('❌ POST request failed:', error.message);
    }
  }

  console.log('\n🎯 CORS Test Complete!');
}

testCORS().catch(console.error);
