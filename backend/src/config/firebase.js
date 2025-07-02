const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Firebase Admin SDK configuration
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      logger.info('Firebase Admin SDK already initialized');
      return admin.app();
    }

    // Firebase service account configuration for datavis-e9c61 project
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID || 'datavis-e9c61',
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    // Validate required environment variables
    const requiredFields = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID'
    ];

    const missingFields = requiredFields.filter(field => !process.env[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required Firebase environment variables: ${missingFields.join(', ')}`);
    }

    // Initialize Firebase Admin SDK for datavis-e9c61 project
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'datavis-e9c61'
    });

    logger.info('Firebase Admin SDK initialized successfully');
    return app;

  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
};

// Get Firebase Auth instance
const getAuth = () => {
  try {
    return admin.auth();
  } catch (error) {
    logger.error('Failed to get Firebase Auth instance:', error);
    throw error;
  }
};

// Get Firestore instance (if needed for additional data)
const getFirestore = () => {
  try {
    return admin.firestore();
  } catch (error) {
    logger.error('Failed to get Firestore instance:', error);
    throw error;
  }
};

// Verify Firebase ID token
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error('Failed to verify Firebase ID token:', error);
    throw error;
  }
};

// Create custom token (if needed)
const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    logger.error('Failed to create custom token:', error);
    throw error;
  }
};

// Get user by UID
const getUserByUid = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    logger.error('Failed to get user by UID:', error);
    throw error;
  }
};

// Update user claims (for role management)
const setCustomUserClaims = async (uid, customClaims) => {
  try {
    await admin.auth().setCustomUserClaims(uid, customClaims);
    logger.info(`Custom claims set for user ${uid}:`, customClaims);
  } catch (error) {
    logger.error('Failed to set custom user claims:', error);
    throw error;
  }
};

// Delete user
const deleteUser = async (uid) => {
  try {
    await admin.auth().deleteUser(uid);
    logger.info(`User ${uid} deleted from Firebase`);
  } catch (error) {
    logger.error('Failed to delete user:', error);
    throw error;
  }
};

// List users (for admin purposes)
const listUsers = async (maxResults = 1000, pageToken = undefined) => {
  try {
    const listUsersResult = await admin.auth().listUsers(maxResults, pageToken);
    return listUsersResult;
  } catch (error) {
    logger.error('Failed to list users:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  getAuth,
  getFirestore,
  verifyIdToken,
  createCustomToken,
  getUserByUid,
  setCustomUserClaims,
  deleteUser,
  listUsers,
  admin
};
