const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoDBConnection() {
  console.log('🔍 Testing MongoDB Connection...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'undefined');
  console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
  console.log('- MONGODB_TEST_URI:', process.env.MONGODB_TEST_URI ? 'Set' : 'Not set');
  console.log('');

  let mongoURI;
  
  if (process.env.NODE_ENV === 'test') {
    mongoURI = process.env.MONGODB_TEST_URI;
  } else if (process.env.NODE_ENV === 'development') {
    mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/csv-dashboard';
  } else {
    mongoURI = process.env.MONGODB_URI;
  }

  console.log('Selected MongoDB URI:', mongoURI ? 'Set' : 'Not set');
  
  if (!mongoURI) {
    console.error('❌ MongoDB URI is not defined');
    process.exit(1);
  }

  // Test different connection options
  const connectionOptions = [
    {
      name: 'Basic Connection',
      options: {}
    },
    {
      name: 'With Timeout Options',
      options: {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10
      }
    },
    {
      name: 'Atlas Recommended Options',
      options: {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority'
      }
    }
  ];

  for (const config of connectionOptions) {
    console.log(`\n🧪 Testing: ${config.name}`);
    console.log('Options:', JSON.stringify(config.options, null, 2));
    
    try {
      const conn = await mongoose.connect(mongoURI, config.options);
      console.log('✅ Connection successful!');
      console.log('- Host:', conn.connection.host);
      console.log('- Database:', conn.connection.name);
      console.log('- Ready State:', conn.connection.readyState);
      
      // Test a simple operation
      const collections = await conn.connection.db.listCollections().toArray();
      console.log('- Collections found:', collections.length);
      
      await mongoose.disconnect();
      console.log('✅ Disconnected successfully');
      
      // If we get here, the connection works
      console.log('\n🎉 MongoDB connection is working with this configuration!');
      process.exit(0);
      
    } catch (error) {
      console.log('❌ Connection failed');
      console.log('- Error:', error.message);
      console.log('- Code:', error.code);
      console.log('- CodeName:', error.codeName);
      
      if (error.errorResponse) {
        console.log('- Error Response:', error.errorResponse);
      }
      
      // Try to disconnect if partially connected
      try {
        await mongoose.disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
    }
  }
  
  console.log('\n❌ All connection attempts failed');
  console.log('\n💡 Possible solutions:');
  console.log('1. Check your MongoDB Atlas credentials');
  console.log('2. Verify your IP address is whitelisted in MongoDB Atlas');
  console.log('3. Ensure your MongoDB cluster is running');
  console.log('4. Check if your network allows connections to MongoDB Atlas');
  console.log('5. Try creating a new database user with proper permissions');
  
  process.exit(1);
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

testMongoDBConnection();
