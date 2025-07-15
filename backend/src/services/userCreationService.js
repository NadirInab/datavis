const User = require('../models/User');
const { UsageTracking } = require('../models/UsageTracking');
const { setCustomUserClaims } = require('../config/firebase');
const logger = require('../utils/logger');
const { USER_ROLES, SUBSCRIPTION_TIERS } = require('../utils/constants');

class UserCreationService {
  /**
   * Create or update user from Google OAuth data
   * @param {Object} decodedToken - Firebase decoded token
   * @returns {Object} User creation/update result
   */
  async createOrUpdateGoogleUser(decodedToken) {
    const startTime = Date.now();
    const result = {
      isNewUser: false,
      user: null,
      profileUpdated: false,
      errors: [],
      processingTime: 0
    };

    try {
      // Validate required token data
      this.validateTokenData(decodedToken);

      // Check if user exists
      let user = await User.findOne({ firebaseUid: decodedToken.uid });

      if (!user) {
        // Create new user
        result.user = await this.createNewGoogleUser(decodedToken);
        result.isNewUser = true;
        logger.info(`New Google user created: ${result.user.email} (${result.user.firebaseUid})`);
      } else {
        // Update existing user
        const updateResult = await this.updateExistingGoogleUser(user, decodedToken);
        result.user = updateResult.user;
        result.profileUpdated = updateResult.profileUpdated;
        logger.info(`Existing Google user updated: ${result.user.email} (${result.user.firebaseUid})`);
      }

      // Record usage tracking
      await this.recordUserActivity(result.user, decodedToken, result.isNewUser);

      result.processingTime = Date.now() - startTime;
      return result;

    } catch (error) {
      result.errors.push(error.message);
      result.processingTime = Date.now() - startTime;
      logger.error('User creation/update failed:', error);
      throw error;
    }
  }

  /**
   * Validate Firebase token data
   * @param {Object} decodedToken - Firebase decoded token
   */
  validateTokenData(decodedToken) {
    const requiredFields = ['uid', 'email'];
    const missingFields = requiredFields.filter(field => !decodedToken[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required token fields: ${missingFields.join(', ')}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(decodedToken.email)) {
      throw new Error('Invalid email format in token');
    }

    // Validate UID format
    if (decodedToken.uid.length < 10) {
      throw new Error('Invalid Firebase UID format');
    }
  }

  /**
   * Create new user from Google OAuth data
   * @param {Object} decodedToken - Firebase decoded token
   * @returns {Object} Created user
   */
  async createNewGoogleUser(decodedToken) {
    const userData = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email.toLowerCase().trim(),
      name: this.extractUserName(decodedToken),
      photoURL: decodedToken.picture || null,
      isEmailVerified: decodedToken.email_verified || false,
      role: USER_ROLES.USER,
      subscription: {
        tier: SUBSCRIPTION_TIERS.FREE,
        status: 'active',
        startDate: new Date(),
        features: this.getDefaultFeatures()
      },
      profile: {
        provider: 'google',
        locale: decodedToken.locale || 'en',
        timezone: null,
        preferences: this.getDefaultPreferences()
      },
      fileUsage: {
        totalFiles: 0,
        totalSize: 0,
        totalUploadsCount: 0
      },
      createdAt: new Date(),
      lastLoginAt: new Date(),
      lastActivityAt: new Date()
    };

    // Create user document
    console.log('📝 Creating user document:', {
      email: userData.email,
      firebaseUid: userData.firebaseUid
    });

    const user = new User(userData);
    await user.save();

    console.log('✅ User document saved to MongoDB:', {
      userId: user._id,
      email: user.email
    });

    // Set Firebase custom claims
    try {
      await this.setUserCustomClaims(user);
      console.log('✅ Firebase custom claims set');
    } catch (claimsError) {
      console.warn('⚠️ Failed to set Firebase custom claims:', claimsError.message);
      // Don't fail the entire process for custom claims
    }

    return user;
  }

  /**
   * Update existing user with Google OAuth data
   * @param {Object} user - Existing user document
   * @param {Object} decodedToken - Firebase decoded token
   * @returns {Object} Update result
   */
  async updateExistingGoogleUser(user, decodedToken) {
    const originalData = {
      name: user.name,
      photoURL: user.photoURL,
      isEmailVerified: user.isEmailVerified
    };

    // Update user fields
    const newName = this.extractUserName(decodedToken);
    const newPhotoURL = decodedToken.picture || user.photoURL;
    const newEmailVerified = decodedToken.email_verified || user.isEmailVerified;

    // Check if profile data changed
    const profileUpdated = (
      user.name !== newName ||
      user.photoURL !== newPhotoURL ||
      user.isEmailVerified !== newEmailVerified
    );

    if (profileUpdated) {
      user.name = newName;
      user.photoURL = newPhotoURL;
      user.isEmailVerified = newEmailVerified;
    }

    // Always update activity timestamps
    user.lastLoginAt = new Date();
    user.lastActivityAt = new Date();

    // Update profile metadata
    if (!user.profile) {
      user.profile = {};
    }
    user.profile.lastGoogleSync = new Date();
    user.profile.provider = 'google';

    await user.save();

    return {
      user,
      profileUpdated,
      originalData
    };
  }

  /**
   * Extract user name from token data
   * @param {Object} decodedToken - Firebase decoded token
   * @returns {string} User name
   */
  extractUserName(decodedToken) {
    if (decodedToken.name && decodedToken.name.trim()) {
      return decodedToken.name.trim();
    }
    
    // Fallback to email prefix
    const emailPrefix = decodedToken.email.split('@')[0];
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }

  /**
   * Set Firebase custom claims for user
   * @param {Object} user - User document
   */
  async setUserCustomClaims(user) {
    try {
      await setCustomUserClaims(user.firebaseUid, {
        role: user.role,
        subscriptionTier: user.subscription.tier,
        userId: user._id.toString(),
        emailVerified: user.isEmailVerified
      });
    } catch (error) {
      logger.warn(`Failed to set custom claims for user ${user.firebaseUid}:`, error);
      // Don't throw error as user creation was successful
    }
  }

  /**
   * Record user activity for analytics
   * @param {Object} user - User document
   * @param {Object} decodedToken - Firebase decoded token
   * @param {boolean} isNewUser - Whether this is a new user
   */
  async recordUserActivity(user, decodedToken, isNewUser) {
    try {
      const eventType = isNewUser ? 'user_registered' : 'user_login';
      const eventData = {
        email: user.email,
        provider: decodedToken.firebase?.sign_in_provider || 'google',
        userAgent: null, // Will be set by middleware if available
        ipAddress: null, // Will be set by middleware if available
        timestamp: new Date()
      };

      await UsageTracking.recordEvent(user.firebaseUid, eventType, eventData);
    } catch (error) {
      logger.warn(`Failed to record user activity for ${user.firebaseUid}:`, error);
      // Don't throw error as user creation/update was successful
    }
  }

  /**
   * Get default features for new users
   * @returns {Object} Default features
   */
  getDefaultFeatures() {
    return {
      fileUploads: true,
      basicCharts: true,
      dataExport: true,
      csvProcessing: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5
    };
  }

  /**
   * Get default preferences for new users
   * @returns {Object} Default preferences
   */
  getDefaultPreferences() {
    return {
      theme: 'light',
      notifications: {
        email: true,
        browser: true
      },
      privacy: {
        profileVisible: false,
        dataSharing: false
      }
    };
  }

  /**
   * Verify user creation in database
   * @param {string} firebaseUid - Firebase UID
   * @returns {Object} Verification result
   */
  async verifyUserCreation(firebaseUid) {
    try {
      const user = await User.findOne({ firebaseUid }).lean();
      
      if (!user) {
        return {
          success: false,
          message: 'User not found in database',
          user: null
        };
      }

      // Check required fields
      const requiredFields = ['firebaseUid', 'email', 'name', 'role', 'subscription'];
      const missingFields = requiredFields.filter(field => !user[field]);

      if (missingFields.length > 0) {
        return {
          success: false,
          message: `User missing required fields: ${missingFields.join(', ')}`,
          user,
          missingFields
        };
      }

      return {
        success: true,
        message: 'User verification successful',
        user,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      };
    } catch (error) {
      return {
        success: false,
        message: `Verification failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Get user creation statistics
   * @returns {Object} User creation statistics
   */
  async getUserCreationStats() {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            googleUsers: {
              $sum: {
                $cond: [{ $eq: ['$profile.provider', 'google'] }, 1, 0]
              }
            },
            verifiedUsers: {
              $sum: {
                $cond: ['$isEmailVerified', 1, 0]
              }
            },
            activeUsers: {
              $sum: {
                $cond: ['$isActive', 1, 0]
              }
            }
          }
        }
      ]);

      const recentUsers = await User.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).countDocuments();

      return {
        total: stats[0]?.totalUsers || 0,
        googleUsers: stats[0]?.googleUsers || 0,
        verifiedUsers: stats[0]?.verifiedUsers || 0,
        activeUsers: stats[0]?.activeUsers || 0,
        recentUsers,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Failed to get user creation stats:', error);
      throw error;
    }
  }
}

module.exports = new UserCreationService();
