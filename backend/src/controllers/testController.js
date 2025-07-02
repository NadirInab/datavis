const { verifyIdToken, getUserByUid } = require('../config/firebase');
const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Test Firebase token verification
// @route   POST /api/v1/test/firebase-auth
// @access  Public
const testFirebaseAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required for testing'
      });
    }

    // Test 1: Verify Firebase ID token
    logger.info('Testing Firebase token verification...');
    const decodedToken = await verifyIdToken(idToken);

    // Test 2: Get Firebase user details
    logger.info('Getting Firebase user details...');
    const firebaseUser = await getUserByUid(decodedToken.uid);

    // Test 3: Check/create user in database
    logger.info('Checking user in database...');
    let dbUser = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!dbUser) {
      logger.info('Creating new user in database...');
      dbUser = new User({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        photoURL: decodedToken.picture || null,
        isEmailVerified: decodedToken.email_verified || false,
        role: 'user',
        subscription: {
          tier: 'free',
          status: 'active'
        }
      });
      await dbUser.save();
    }

    // Test results
    const testResults = {
      tokenVerification: {
        success: true,
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        provider: decodedToken.firebase.sign_in_provider,
        issuedAt: new Date(decodedToken.iat * 1000),
        expiresAt: new Date(decodedToken.exp * 1000)
      },
      firebaseUser: {
        success: true,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        disabled: firebaseUser.disabled,
        creationTime: firebaseUser.metadata.creationTime,
        lastSignInTime: firebaseUser.metadata.lastSignInTime
      },
      databaseUser: {
        success: true,
        id: dbUser._id,
        firebaseUid: dbUser.firebaseUid,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        subscription: dbUser.subscription,
        isNew: !dbUser.lastLoginAt,
        createdAt: dbUser.createdAt
      },
      integration: {
        projectId: decodedToken.aud,
        expectedProjectId: 'datavis-e9c61',
        projectMatch: decodedToken.aud === 'datavis-e9c61',
        tokenAge: Math.floor(Date.now() / 1000) - decodedToken.iat,
        timeToExpiry: decodedToken.exp - Math.floor(Date.now() / 1000)
      }
    };

    logger.info('Firebase authentication test completed successfully', {
      uid: decodedToken.uid,
      email: decodedToken.email
    });

    res.status(200).json({
      success: true,
      message: 'Firebase authentication test completed successfully',
      data: testResults
    });

  } catch (error) {
    logger.error('Firebase authentication test failed:', error);

    let errorDetails = {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };

    // Provide specific error guidance
    if (error.code === 'auth/id-token-expired') {
      errorDetails.guidance = 'Token has expired. Please refresh the token in your frontend.';
    } else if (error.code === 'auth/invalid-id-token') {
      errorDetails.guidance = 'Invalid token format. Ensure you\'re sending a valid Firebase ID token.';
    } else if (error.code === 'auth/project-not-found') {
      errorDetails.guidance = 'Project ID mismatch. Check your Firebase configuration.';
    } else if (error.code === 'auth/invalid-credential') {
      errorDetails.guidance = 'Invalid service account credentials. Check your backend Firebase configuration.';
    }

    res.status(401).json({
      success: false,
      message: 'Firebase authentication test failed',
      error: errorDetails
    });
  }
};

// @desc    Test visitor session tracking
// @route   GET /api/v1/test/visitor-session
// @access  Public
const testVisitorSession = async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

    let visitor = null;
    if (sessionId) {
      visitor = await User.findOne({
        'visitorSession.sessionId': sessionId,
        firebaseUid: { $regex: /^visitor_/ }
      });
    }

    const testResults = {
      sessionTracking: {
        sessionIdProvided: !!sessionId,
        sessionId: sessionId,
        visitorFound: !!visitor,
        visitorData: visitor ? {
          id: visitor._id,
          sessionId: visitor.visitorSession.sessionId,
          filesUploaded: visitor.visitorSession.filesUploaded,
          fileLimit: visitor.visitorFileLimit,
          remainingFiles: Math.max(0, visitor.visitorFileLimit - visitor.visitorSession.filesUploaded),
          lastActivity: visitor.visitorSession.lastActivity,
          createdAt: visitor.createdAt
        } : null
      },
      headers: {
        sessionId: req.headers['x-session-id'],
        userAgent: req.headers['user-agent'],
        ip: req.ip
      },
      cookies: req.cookies || {}
    };

    res.status(200).json({
      success: true,
      message: 'Visitor session test completed',
      data: testResults
    });

  } catch (error) {
    logger.error('Visitor session test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Visitor session test failed',
      error: error.message
    });
  }
};

// @desc    Get Firebase configuration status
// @route   GET /api/v1/test/firebase-config
// @access  Public
const getFirebaseConfig = async (req, res) => {
  try {
    const { admin } = require('../config/firebase');
    const app = admin.app();

    const configStatus = {
      firebase: {
        initialized: !!app,
        projectId: app?.options?.projectId,
        expectedProjectId: 'datavis-e9c61',
        projectMatch: app?.options?.projectId === 'datavis-e9c61'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        projectId: process.env.FIREBASE_PROJECT_ID,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasClientId: !!process.env.FIREBASE_CLIENT_ID
      },
      clientConfig: {
        projectId: 'datavis-e9c61',
        authDomain: 'datavis-e9c61.firebaseapp.com',
        apiKey: 'AIzaSyC5GTTlDOilXfIyTRMozilCDGojS2l9XrQ',
        appId: '1:172462461511:web:7896d73115f287808c5762'
      }
    };

    res.status(200).json({
      success: true,
      message: 'Firebase configuration status',
      data: configStatus
    });

  } catch (error) {
    logger.error('Firebase config test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Firebase configuration test failed',
      error: error.message
    });
  }
};

module.exports = {
  testFirebaseAuth,
  testVisitorSession,
  getFirebaseConfig
};
