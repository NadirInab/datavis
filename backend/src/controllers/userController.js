const User = require('../models/User');
const File = require('../models/File');
const { UsageTracking } = require('../models/UsageTracking');
const logger = require('../utils/logger');
const { PAGINATION } = require('../utils/constants');

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name, company, preferences } = req.body;

    // Update allowed fields
    if (name) user.name = name;
    if (company) user.company = { ...user.company, ...company };
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    // Record profile update event
    await UsageTracking.recordEvent(user.firebaseUid, 'profile_updated', {
      fields: Object.keys(req.body)
    });

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
          company: user.company,
          preferences: user.preferences,
          isEmailVerified: user.isEmailVerified
        }
      }
    });

  } catch (error) {
    logger.error('Update profile failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user dashboard data
// @route   GET /api/v1/users/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    console.log('📊 Dashboard request received for user:', {
      userId: req.user?._id,
      firebaseUid: req.user?.firebaseUid,
      email: req.user?.email
    });

    const user = req.user;

    if (!user || !user.firebaseUid) {
      console.error('❌ Dashboard request without valid user');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get user files with error handling
    let files = [];
    try {
      files = await File.find({ ownerUid: user.firebaseUid })
        .sort({ uploadedAt: -1 })
        .limit(5)
        .select('filename originalName size status uploadedAt dataInfo visualizations');
      console.log('✅ Found user files:', files.length);
    } catch (fileError) {
      console.error('⚠️ Error fetching user files:', fileError.message);
      files = [];
    }

    // Get usage statistics with error handling
    let usageStats = null;
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      usageStats = await UsageTracking.findOne({
        userUid: user.firebaseUid,
        'period.year': currentYear,
        'period.month': currentMonth
      });
      console.log('✅ Usage stats retrieved:', !!usageStats);
    } catch (usageError) {
      console.error('⚠️ Error fetching usage stats:', usageError.message);
      usageStats = null;
    }

    // Calculate storage usage with error handling
    let totalFiles = 0;
    let storageUsed = [];
    let recentFiles = [];

    try {
      totalFiles = await File.countDocuments({ ownerUid: user.firebaseUid });
      console.log('✅ Total files count:', totalFiles);
    } catch (countError) {
      console.error('⚠️ Error counting files:', countError.message);
      totalFiles = 0;
    }

    try {
      storageUsed = await File.aggregate([
        { $match: { ownerUid: user.firebaseUid } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]);
      console.log('✅ Storage calculation completed');
    } catch (storageError) {
      console.error('⚠️ Error calculating storage:', storageError.message);
      storageUsed = [];
    }

    // Get recent activity with error handling
    try {
      recentFiles = await File.find({ ownerUid: user.firebaseUid })
        .sort({ uploadedAt: -1 })
        .limit(10)
        .select('filename status uploadedAt');
      console.log('✅ Recent files retrieved:', recentFiles.length);
    } catch (recentError) {
      console.error('⚠️ Error fetching recent files:', recentError.message);
      recentFiles = [];
    }

    // Construct dashboard data with safe defaults
    const dashboardData = {
      user: {
        name: user.name || 'Unknown User',
        email: user.email || '',
        role: user.role || 'user',
        subscription: user.subscription || { tier: 'free', status: 'active' },
        subscriptionLimits: user.subscriptionLimits || {
          storage: 100 * 1024 * 1024, // 100MB default
          files: 10,
          visualizations: 5
        }
      },
      stats: {
        totalFiles,
        storageUsed: storageUsed[0]?.totalSize || 0,
        storageLimit: user.subscriptionLimits?.storage || 100 * 1024 * 1024,
        filesThisMonth: usageStats?.fileUsage?.uploads?.count || 0,
        visualizationsCreated: usageStats?.visualizationUsage?.created || 0,
        exportsThisMonth: usageStats?.exportUsage?.total || 0
      },
      recentFiles: files || [],
      recentActivity: recentFiles || [],
      usageTrends: null // Simplified to avoid getSummary() errors
    };

    console.log('✅ Dashboard data constructed successfully');

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('🚨 Dashboard error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      firebaseUid: req.user?.firebaseUid
    });

    logger.error('Get dashboard failed:', error);

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user files
// @route   GET /api/v1/users/files
// @access  Private
const getUserFiles = async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const status = req.query.status;
    const search = req.query.search;

    // Build query
    const query = { ownerUid: user.firebaseUid };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
        { 'settings.tags': { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Get files with pagination
    const files = await File.find(query)
      .sort({ uploadedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-data'); // Exclude large data field

    const total = await File.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        files,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get user files failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get usage statistics
// @route   GET /api/v1/users/usage
// @access  Private
const getUsageStats = async (req, res) => {
  try {
    const user = req.user;
    const { period = 'month' } = req.query;

    const now = new Date();
    let query = { userUid: user.firebaseUid };

    // Build period query
    switch (period) {
      case 'day':
        query['period.year'] = now.getFullYear();
        query['period.month'] = now.getMonth() + 1;
        query['period.day'] = now.getDate();
        break;
      case 'week':
        query['period.year'] = now.getFullYear();
        query['period.month'] = now.getMonth() + 1;
        query['period.week'] = Math.ceil(now.getDate() / 7);
        break;
      case 'month':
      default:
        query['period.year'] = now.getFullYear();
        query['period.month'] = now.getMonth() + 1;
        break;
    }

    const usageData = await UsageTracking.find(query).sort({ 'period.day': -1 });

    // Calculate totals
    const totals = usageData.reduce((acc, usage) => {
      acc.files += usage.fileUsage.uploads.count;
      acc.storage += usage.fileUsage.uploads.totalSize;
      acc.visualizations += usage.visualizationUsage.created;
      acc.exports += usage.exportUsage.total;
      acc.sessions += usage.sessionUsage.sessions;
      return acc;
    }, { files: 0, storage: 0, visualizations: 0, exports: 0, sessions: 0 });

    res.status(200).json({
      success: true,
      data: {
        period,
        totals,
        details: usageData.map(usage => usage.getSummary()),
        limits: user.subscriptionLimits
      }
    });

  } catch (error) {
    logger.error('Get usage stats failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/v1/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const role = req.query.role;
    const tier = req.query.tier;
    const search = req.query.search;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (tier) query['subscription.tier'] = tier;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-visitorSession'); // Exclude visitor session data

    const total = await User.countDocuments(query);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const fileCount = await File.countDocuments({ ownerUid: user.firebaseUid });
      const storageUsed = await File.aggregate([
        { $match: { ownerUid: user.firebaseUid } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]);

      return {
        ...user.toObject(),
        stats: {
          totalFiles: fileCount,
          storageUsed: storageUsed[0]?.totalSize || 0
        }
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get all users failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user by ID (Admin only)
// @route   GET /api/v1/users/:uid
// @access  Private (Admin)
const getUserById = async (req, res) => {
  try {
    const { uid } = req.params;

    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user files and usage stats
    const files = await File.find({ ownerUid: uid })
      .sort({ uploadedAt: -1 })
      .select('-data');

    const usageStats = await UsageTracking.find({ userUid: uid })
      .sort({ 'period.year': -1, 'period.month': -1 })
      .limit(12);

    res.status(200).json({
      success: true,
      data: {
        user: user.toObject(),
        files,
        usageHistory: usageStats.map(usage => usage.getSummary())
      }
    });

  } catch (error) {
    logger.error('Get user by ID failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  updateProfile,
  getDashboard,
  getUserFiles,
  getUsageStats,
  getAllUsers,
  getUserById
};
