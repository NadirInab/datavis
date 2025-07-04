const mongoose = require('mongoose');

// Database configuration
const dbConfig = {
  development: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/csv-dashboard',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
    }
  },
  test: {
    uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/csv-dashboard-test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
    }
  },
  production: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
      ssl: true,
      sslValidate: true,
    }
  }
};

// Subscription tier configurations (commented out for now)
// const subscriptionConfig = {
//   ...
// };

// Payment configuration (commented out for now)
// const paymentConfig = {
//   stripe: {
//     secretKey: process.env.STRIPE_SECRET_KEY,
//     publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
//     webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
//     currency: 'usd',
//     successUrl: `${process.env.FRONTEND_URL}/subscription/success`,
//     cancelUrl: `${process.env.FRONTEND_URL}/subscription/cancel`
//   }
// };

// Email configuration
const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  from: process.env.EMAIL_FROM || 'noreply@csvdashboard.com',
  templates: {
    welcome: 'welcome',
    subscriptionConfirmation: 'subscription-confirmation',
    paymentFailed: 'payment-failed',
    subscriptionCancelled: 'subscription-cancelled'
  }
};

module.exports = {
  database: dbConfig[process.env.NODE_ENV || 'development'],
  // subscription: subscriptionConfig,
  // payment: paymentConfig,
  email: emailConfig
};
