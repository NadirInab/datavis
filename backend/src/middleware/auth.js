const { verifyIdToken } = require('../config/firebase');
const User = require('../models/User');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Protect routes - require Firebase authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify Firebase ID token
      const decodedToken = await verifyIdToken(token);

      // Get or create user from database
      let user = await User.findOne({ firebaseUid: decodedToken.uid });

      if (!user) {
        // Create new user if doesn't exist
        user = new User({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email.split('@')[0],
          photoURL: decodedToken.picture || null,
          isEmailVerified: decodedToken.email_verified || false,
          role: 'user', // Default role
          subscription: {
            tier: 'free',
            status: 'active'
          }
        });
        await user.save();
        logger.info(`New user created: ${user.email}`);
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      // Update last activity
      user.lastActivityAt = new Date();
      await user.save();

      req.user = user;
      req.firebaseUser = decodedToken;
      next();
    } catch (error) {
      logger.error('Firebase token verification failed:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Check subscription limits
const checkSubscriptionLimits = (limitType) => {
  return async (req, res, next) => {
    try {
      // Skip subscription checks for visitors - they have their own limits
      if (!req.user) {
        return next();
      }

      const user = req.user;
      const subscription = user.subscription;

      // Define limits based on subscription tier
      const limits = {
        free: {
          files: parseInt(process.env.FREE_TIER_FILE_LIMIT) || 3,
          storage: parseInt(process.env.FREE_TIER_STORAGE_LIMIT) || 5242880, // 5MB
          exports: 10
        },
        pro: {
          files: parseInt(process.env.PRO_TIER_FILE_LIMIT) || 50,
          storage: parseInt(process.env.PRO_TIER_STORAGE_LIMIT) || 104857600, // 100MB
          exports: 100
        },
        enterprise: {
          files: parseInt(process.env.ENTERPRISE_TIER_FILE_LIMIT) || 1000,
          storage: parseInt(process.env.ENTERPRISE_TIER_STORAGE_LIMIT) || 1073741824, // 1GB
          exports: -1 // Unlimited
        }
      };

      const userLimits = limits[subscription.tier] || limits.free;

      // Check specific limit type
      switch (limitType) {
        case 'files':
          // First check permanent upload limit (applies to all users)
          if (user.hasReachedPermanentUploadLimit && user.hasReachedPermanentUploadLimit()) {
            return res.status(403).json({
              success: false,
              message: `Permanent upload limit reached. You have used all 5 lifetime uploads. Deletion does not restore upload capacity.`,
              limitType: 'permanent',
              permanentLimit: 5,
              totalUploadsCount: user.fileUsage?.totalUploadsCount || 0,
              isPermanentLimit: true
            });
          }

          // Then check subscription-based current file limit
          if (user.filesCount >= userLimits.files) {
            return res.status(403).json({
              success: false,
              message: `File limit reached. Upgrade your subscription to upload more files.`,
              limit: userLimits.files,
              current: user.filesCount,
              limitType: 'subscription'
            });
          }
          break;

        case 'storage':
          if (user.storageUsed >= userLimits.storage) {
            return res.status(403).json({
              success: false,
              message: `Storage limit reached. Upgrade your subscription for more storage.`,
              limit: userLimits.storage,
              current: user.storageUsed
            });
          }
          break;

        case 'exports':
          if (userLimits.exports !== -1 && user.exportsThisMonth >= userLimits.exports) {
            return res.status(403).json({
              success: false,
              message: `Export limit reached for this month. Upgrade your subscription.`,
              limit: userLimits.exports,
              current: user.exportsThisMonth
            });
          }
          break;

        default:
          break;
      }

      req.subscriptionLimits = userLimits;
      next();
    } catch (error) {
      logger.error('Subscription limit check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking subscription limits'
      });
    }
  };
};

// Track visitor sessions (for unauthenticated users)
const trackVisitor = async (req, res, next) => {
  try {
    // Skip if user is authenticated
    if (req.user) {
      return next();
    }

    // Get or create session ID
    let sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

    if (!sessionId) {
      sessionId = uuidv4();
      res.cookie('sessionId', sessionId, {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    // Find or create visitor record
    let visitor = await User.findOne({
      'visitorSession.sessionId': sessionId,
      firebaseUid: { $exists: false }
    });

    if (!visitor) {
      try {
        visitor = new User({
          firebaseUid: `visitor_${sessionId}`,
          email: `visitor_${sessionId}@temp.local`,
          name: 'Visitor',
          role: 'visitor',
          isActive: true,
          visitorSession: {
            sessionId,
            filesUploaded: 0,
            lastActivity: new Date()
          }
        });
        await visitor.save();
      } catch (error) {
        // If duplicate key error, try to find the existing visitor
        if (error.code === 11000) {
          visitor = await User.findOne({
            firebaseUid: `visitor_${sessionId}`
          });
        } else {
          throw error;
        }
      }
    } else {
      // Update last activity
      visitor.visitorSession.lastActivity = new Date();
      await visitor.save();
    }

    req.visitor = visitor;
    req.sessionId = sessionId;
    next();
  } catch (error) {
    logger.error('Visitor tracking error:', error);
    next(); // Continue without visitor tracking
  }
};

// Optional authentication - allows both authenticated and visitor access
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        // Verify Firebase ID token
        const decodedToken = await verifyIdToken(token);

        // Get user from database
        let user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (user && user.isActive) {
          user.lastActivityAt = new Date();
          await user.save();
          req.user = user;
          req.firebaseUser = decodedToken;
        }
      } catch (error) {
        logger.warn('Optional auth token verification failed:', error);
        // Continue as visitor
      }
    }

    // If no valid user, track as visitor
    if (!req.user) {
      await trackVisitor(req, res, () => {});
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};

// Check visitor upload limits
const checkVisitorLimits = async (req, res, next) => {
  try {
    // Skip if user is authenticated
    if (req.user && req.user.role !== 'visitor') {
      return next();
    }

    // For visitors, check upload limits
    const visitor = req.visitor || req.user;
    if (!visitor) {
      return res.status(401).json({
        success: false,
        message: 'Session required for file upload'
      });
    }

    const visitorFileLimit = visitor.visitorFileLimit || 3;
    const filesUploaded = visitor.visitorSession?.filesUploaded || 0;

    if (filesUploaded >= visitorFileLimit) {
      return res.status(403).json({
        success: false,
        message: 'Visitor upload limit reached. Please sign up for unlimited uploads.',
        limit: visitorFileLimit,
        current: filesUploaded,
        upgradeRequired: true
      });
    }

    req.visitorLimits = {
      fileLimit: visitorFileLimit,
      filesUploaded,
      remainingFiles: visitorFileLimit - filesUploaded
    };

    next();
  } catch (error) {
    logger.error('Visitor limit check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking visitor limits'
    });
  }
};

// Check permanent upload limits (applies to all authenticated users)
const checkPermanentUploadLimit = async (req, res, next) => {
  try {
    // Skip if user is not authenticated
    if (!req.user) {
      return next();
    }

    const user = req.user;

    // Check if user has reached permanent upload limit
    if (user.hasReachedPermanentUploadLimit && user.hasReachedPermanentUploadLimit()) {
      return res.status(403).json({
        success: false,
        message: 'Permanent upload limit reached. You have used all 5 lifetime uploads.',
        details: 'Deleting files does not restore upload capacity. This limit prevents abuse of the free service.',
        limitType: 'permanent',
        permanentLimit: 5,
        totalUploadsCount: user.fileUsage?.totalUploadsCount || 0,
        isPermanentLimit: true,
        upgradeRequired: false // This is a hard limit, not subscription-based
      });
    }

    // Add upload limit info to request for use in responses
    req.uploadLimitInfo = user.uploadLimitInfo || {
      totalUploadsCount: user.fileUsage?.totalUploadsCount || 0,
      permanentLimit: 5,
      remainingUploads: Math.max(0, 5 - (user.fileUsage?.totalUploadsCount || 0)),
      hasReachedLimit: (user.fileUsage?.totalUploadsCount || 0) >= 5
    };

    next();
  } catch (error) {
    logger.error('Permanent upload limit check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking upload limits'
    });
  }
};

module.exports = {
  protect,
  authorize,
  checkSubscriptionLimits,
  checkPermanentUploadLimit,
  trackVisitor,
  optionalAuth,
  checkVisitorLimits
};
