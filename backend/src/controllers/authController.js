const { verifyIdToken, setCustomUserClaims, getUserByUid } = require('../config/firebase');
const User = require('../models/User');
const { UsageTracking } = require('../models/UsageTracking');
const userCreationService = require('../services/userCreationService');
const logger = require('../utils/logger');
const { USER_ROLES, SUBSCRIPTION_TIERS } = require('../utils/constants');

// @desc    Verify Firebase token and get/create user
// @route   POST /api/v1/auth/verify
// @access  Public
const verifyToken = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    // Verify Firebase ID token
    const decodedToken = await verifyIdToken(idToken);

    // Use enhanced user creation service for Google OAuth users
    const userCreationResult = await userCreationService.createOrUpdateGoogleUser(decodedToken);
    const user = userCreationResult.user;

    // Log creation/update details
    if (userCreationResult.isNewUser) {
      logger.info(`New Google user created: ${user.email} (${userCreationResult.processingTime}ms)`);
    } else {
      logger.info(`Existing Google user updated: ${user.email} (${userCreationResult.processingTime}ms)`);
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          name: user.name,
          photoURL: user.photoURL,
          role: user.role,
          subscription: user.subscription,
          fileUsage: user.fileUsage,
          preferences: user.preferences,
          isEmailVerified: user.isEmailVerified,
          subscriptionLimits: user.subscriptionLimits
        },
        firebaseUser: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified
        }
      }
    });

  } catch (error) {
    logger.error('Token verification failed:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          name: user.name,
          photoURL: user.photoURL,
          role: user.role,
          subscription: user.subscription,
          fileUsage: user.fileUsage,
          exportUsage: user.exportUsage,
          preferences: user.preferences,
          company: user.company,
          isEmailVerified: user.isEmailVerified,
          subscriptionLimits: user.subscriptionLimits,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Get user profile failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/v1/auth/users/:uid/role
// @access  Private (Admin)
const updateUserRole = async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    if (!Object.values(USER_ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Find user
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update role
    const previousRole = user.role;
    user.role = role;
    await user.save();

    // Update Firebase custom claims
    await setCustomUserClaims(uid, {
      role: role,
      subscriptionTier: user.subscription.tier
    });

    // Record role change event
    await UsageTracking.recordEvent(uid, 'role_changed', {
      previousRole,
      newRole: role,
      changedBy: req.user.firebaseUid
    });

    logger.info(`User role updated: ${user.email} -> ${role}`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          name: user.name,
          role: user.role,
          subscription: user.subscription
        }
      }
    });

  } catch (error) {
    logger.error('Update user role failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get visitor session info
// @route   GET /api/v1/auth/visitor
// @access  Public
const getVisitorInfo = async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID required'
      });
    }

    // Use optimized visitor session service (no database pollution)
    const visitorSessionService = require('../services/visitorSessionService');
    const sessionData = visitorSessionService.getSession(sessionId);

    res.status(200).json({
      success: true,
      data: {
        sessionId: sessionData.sessionId,
        filesUploaded: sessionData.filesUploaded,
        fileLimit: sessionData.fileLimit,
        remainingFiles: sessionData.remainingFiles,
        isLimitReached: sessionData.isLimitReached,
        lastActivity: sessionData.lastActivity,
        features: sessionData.features,
        canUpload: sessionData.remainingFiles > 0,
        upgradeMessage: sessionData.isLimitReached ?
          'Create a free account to get 5 more uploads at no cost!' : null
      }
    });

  } catch (error) {
    logger.error('Get visitor info failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout user (clear session)
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const user = req.user;

    // Record logout event
    await UsageTracking.recordEvent(user.firebaseUid, 'user_logout');

    // Clear session cookie if exists
    res.clearCookie('sessionId');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/v1/auth/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const user = req.user;

    // Record account deletion event
    await UsageTracking.recordEvent(user.firebaseUid, 'account_deleted');

    // Delete user files
    const File = require('../models/File');
    await File.deleteMany({ ownerUid: user.firebaseUid });

    // Delete user subscriptions
    const { UserSubscription } = require('../models/Subscription');
    await UserSubscription.deleteOne({ userUid: user.firebaseUid });

    // Delete usage tracking data
    await UsageTracking.deleteMany({ userUid: user.firebaseUid });

    // Delete user record
    await User.deleteOne({ firebaseUid: user.firebaseUid });

    logger.info(`User account deleted: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    logger.error('Delete account failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  verifyToken,
  getMe,
  updateUserRole,
  getVisitorInfo,
  logout,
  deleteAccount
};
