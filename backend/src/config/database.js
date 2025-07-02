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

// Subscription tier configurations
const subscriptionConfig = {
  tiers: {
    free: {
      name: 'Free',
      price: 0,
      currency: 'USD',
      interval: 'month',
      features: {
        files: parseInt(process.env.FREE_TIER_FILE_LIMIT) || 3,
        storage: parseInt(process.env.FREE_TIER_STORAGE_LIMIT) || 5242880, // 5MB
        exports: 10,
        visualizations: ['bar', 'line', 'pie'],
        support: 'community',
        dataRetention: 7 // days
      }
    },
    pro: {
      name: 'Pro',
      price: 1999, // $19.99 in cents
      currency: 'USD',
      interval: 'month',
      features: {
        files: parseInt(process.env.PRO_TIER_FILE_LIMIT) || 50,
        storage: parseInt(process.env.PRO_TIER_STORAGE_LIMIT) || 104857600, // 100MB
        exports: 100,
        visualizations: ['bar', 'line', 'pie', 'area', 'radar', 'scatter'],
        support: 'email',
        dataRetention: 30, // days
        pdfExports: true,
        teamSharing: true
      }
    },
    enterprise: {
      name: 'Enterprise',
      price: 9999, // $99.99 in cents
      currency: 'USD',
      interval: 'month',
      features: {
        files: parseInt(process.env.ENTERPRISE_TIER_FILE_LIMIT) || 1000,
        storage: parseInt(process.env.ENTERPRISE_TIER_STORAGE_LIMIT) || 1073741824, // 1GB
        exports: -1, // unlimited
        visualizations: 'all',
        support: 'priority',
        dataRetention: 365, // days
        pdfExports: true,
        teamSharing: true,
        customVisualizations: true,
        apiAccess: true,
        whiteLabel: true
      }
    }
  },
  
  // Stripe price IDs (to be set when creating products in Stripe)
  stripePriceIds: {
    pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    enterprise_monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    enterprise_yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID
  }
};

// Payment configuration
const paymentConfig = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: 'usd',
    successUrl: `${process.env.FRONTEND_URL}/subscription/success`,
    cancelUrl: `${process.env.FRONTEND_URL}/subscription/cancel`
  }
};

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
  subscription: subscriptionConfig,
  payment: paymentConfig,
  email: emailConfig
};
