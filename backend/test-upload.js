const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testFileUpload() {
  const fetch = (await import('node-fetch')).default;
  try {
    console.log('🧪 Testing file upload endpoint...');
    
    // Create form data
    const form = new FormData();
    const filePath = path.join(__dirname, 'test-data.csv');
    const fileStream = fs.createReadStream(filePath);
    
    form.append('file', fileStream, {
      filename: 'test-data.csv',
      contentType: 'text/csv'
    });

    // Test as visitor (no auth)
    console.log('\n📤 Testing visitor upload...');
    const response = await fetch('http://localhost:5001/api/v1/files/upload', {
      method: 'POST',
      body: form,
      headers: {
        'X-Session-ID': 'test-visitor-session-123'
      }
    });

    const result = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ File upload successful!');
      
      // Test file listing (this will fail without auth, but let's see the error)
      console.log('\n📋 Testing file listing...');
      const listResponse = await fetch('http://localhost:5001/api/v1/files');
      const listResult = await listResponse.json();
      console.log('List Response:', listResult);
      
    } else {
      console.log('❌ File upload failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFileUpload();
