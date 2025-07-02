const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    let mongoURI;
    
    if (process.env.NODE_ENV === 'test') {
      mongoURI = process.env.MONGODB_TEST_URI;
    } else if (process.env.NODE_ENV === 'development') {
      mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/visi';
    } else {
      // Production environment - no fallback
      mongoURI = process.env.MONGODB_URI;
    }

    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    // Mask credentials in logs
    const maskedURI = mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    logger.info(`Attempting to connect to MongoDB at: ${maskedURI}`);

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(mongoURI, options);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    // More detailed error logging
    if (error.name === 'MongoServerSelectionError') {
      logger.error(`Cannot connect to MongoDB server: ${error.message}`);
    } else if (error.code === 18 || error.message.includes('Authentication failed')) {
      logger.error('MongoDB authentication failed. Please check your username and password');
    } else if (error.code === 8000) {
      logger.error('MongoDB authentication error. Please check credentials and database permissions');
    } else {
      logger.error(`Database connection failed: ${error.message}`, error);
    }
    
    // Don't exit process immediately to allow for retry
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }
};

module.exports = connectDB;




