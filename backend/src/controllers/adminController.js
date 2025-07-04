const User = require('../models/User');
const File = require('../models/File');
const { SubscriptionPlan, UserSubscription } = require('../models/Subscription');
const UsageTracking = require('../models/UsageTracking');
const Migration = require('../models/Migration');
const migrationManager = require('../utils/migrationManager');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// @desc    Get database connection status
// @route   GET /api/v1/admin/db/status
// @access  Admin
const getDatabaseStatus = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const collections = await mongoose.connection.db.listCollections().toArray();
    
    const status = {
      state: states[dbState],
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      collections: collections.map(col => ({
        name: col.name,
        type: col.type
      }))
    };

    res.status(200).json({
      success: true,
      message: 'Database status retrieved successfully',
      data: status
    });

  } catch (error) {
    logger.error('Database status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database status',
      error: error.message
    });
  }
};

// @desc    Get collection statistics
// @route   GET /api/v1/admin/db/stats
// @access  Admin
const getCollectionStats = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const conn = mongoose.connection;
    
    // Check if connection is established
    if (!conn || conn.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not established',
        readyState: conn ? conn.readyState : 'No connection'
      });
    }

    // Get collection names
    const collections = await conn.db.listCollections().toArray();
    
    // Initialize stats object with the structure expected by the frontend
    const stats = {
      counts: {
        users: 0,
        files: 0,
        subscriptionPlans: 0,
        usage: 0
      },
      distributions: {
        userRoles: [],
        subscriptionTiers: [],
        fileStatuses: []
      },
      recentActivity: {
        newUsers: 0,
        newFiles: 0
      }
    };

    // Get User collection stats if it exists
    if (collections.some(c => c.name === 'users')) {
      const User = mongoose.model('User');
      stats.counts.users = await User.countDocuments();
      
      // Get user role distribution
      const userRoles = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      stats.distributions.userRoles = userRoles;
      
      // Get recent users (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      stats.recentActivity.newUsers = await User.countDocuments({ createdAt: { $gte: oneDayAgo } });
    }

    // Get File collection stats if it exists
    if (collections.some(c => c.name === 'files')) {
      const File = mongoose.model('File');
      stats.counts.files = await File.countDocuments();
      
      // Get file status distribution
      const fileStatuses = await File.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      stats.distributions.fileStatuses = fileStatuses;
      
      // Get recent files (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      stats.recentActivity.newFiles = await File.countDocuments({ createdAt: { $gte: oneDayAgo } });
    }

    // Get SubscriptionPlan collection stats if it exists
    if (collections.some(c => c.name === 'subscriptionplans')) {
      const SubscriptionPlan = mongoose.model('SubscriptionPlan');
      stats.counts.subscriptionPlans = await SubscriptionPlan.countDocuments();
      
      // Get subscription tier distribution
      const subscriptionTiers = await SubscriptionPlan.aggregate([
        { $group: { _id: '$tier', count: { $sum: 1 } } }
      ]);
      stats.distributions.subscriptionTiers = subscriptionTiers;
    }

    // Get Usage collection stats if it exists
    if (collections.some(c => c.name === 'usage')) {
      const Usage = mongoose.model('Usage');
      stats.counts.usage = await Usage.countDocuments();
    }

    return res.status(200).json({
      success: true,
      message: 'Collection statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Collection stats error:', error);
    return res.status(500).json({
      success: false,
      message: `Collection stats retrieval failed: ${error.message}`,
      error: error.stack
    });
  }
};

// @desc    Run database seeder
// @route   POST /api/v1/admin/db/seed
// @access  Admin
const runSeeder = async (req, res) => {
  try {
    const { type, options = {} } = req.body;

    let result;
    switch (type) {
      case 'subscription-plans':
        result = await seedSubscriptionPlans(options);
        break;
      case 'sample-users':
        result = await seedSampleUsers(options);
        break;
      case 'sample-files':
        result = await seedSampleFiles(options);
        break;
      case 'usage-data':
        result = await seedUsageData(options);
        break;
      case 'all':
        result = await seedAll(options);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid seeder type',
          availableTypes: ['subscription-plans', 'sample-users', 'sample-files', 'usage-data', 'all']
        });
    }

    logger.info(`Seeder '${type}' completed successfully`, result);

    res.status(200).json({
      success: true,
      message: `Seeder '${type}' completed successfully`,
      data: result
    });

  } catch (error) {
    logger.error('Seeder execution failed:', error);
    res.status(500).json({
      success: false,
      message: 'Seeder execution failed',
      error: error.message
    });
  }
};

// @desc    Clear collection data
// @route   DELETE /api/v1/admin/db/clear
// @access  Admin
const clearCollection = async (req, res) => {
  try {
    const { collection, confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required for data deletion'
      });
    }

    let result;
    switch (collection) {
      case 'users':
        // Don't delete admin users
        result = await User.deleteMany({ role: { $ne: 'admin' } });
        break;
      case 'files':
        result = await File.deleteMany({});
        break;
      case 'subscriptions':
        result = await UserSubscription.deleteMany({});
        break;
      case 'usage':
        result = await UsageTracking.deleteMany({});
        break;
      case 'all':
        const users = await User.deleteMany({ role: { $ne: 'admin' } });
        const files = await File.deleteMany({});
        const subscriptions = await UserSubscription.deleteMany({});
        const usage = await UsageTracking.deleteMany({});
        result = { users: users.deletedCount, files: files.deletedCount, subscriptions: subscriptions.deletedCount, usage: usage.deletedCount };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid collection name',
          availableCollections: ['users', 'files', 'subscriptions', 'usage', 'all']
        });
    }

    logger.warn(`Collection '${collection}' cleared by admin`, { deletedCount: result.deletedCount || result });

    res.status(200).json({
      success: true,
      message: `Collection '${collection}' cleared successfully`,
      data: result
    });

  } catch (error) {
    logger.error('Collection clearing failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear collection',
      error: error.message
    });
  }
};

// Seeder functions
const seedSubscriptionPlans = async (options) => {
  const plans = [
    {
      name: 'Free',
      tier: 'free',
      description: 'Perfect for getting started with CSV analysis',
      pricing: {
        monthly: { amount: 0, currency: 'USD' },
        yearly: { amount: 0, currency: 'USD', discount: 0 }
      },
      features: {
        files: 5,
        storage: 10 * 1024 * 1024, // 10MB
        exports: 10, // Number instead of array
        visualizations: ['bar', 'line', 'pie'],
        support: 'community',
        dataRetention: 7, // Added required field
        pdfExports: false,
        teamSharing: false,
        customVisualizations: false,
        apiAccess: false,
        whiteLabel: false,
        prioritySupport: false
      },
      isActive: true,
      sortOrder: 1
    },
    {
      name: 'Pro',
      tier: 'pro',
      description: 'Advanced features for professional data analysis',
      pricing: {
        monthly: { amount: 1999, currency: 'USD' }, // $19.99
        yearly: { amount: 19990, currency: 'USD', discount: 17 } // $199.90 (17% discount)
      },
      features: {
        files: -1, // unlimited
        storage: 100 * 1024 * 1024, // 100MB
        exports: 100, // Number instead of array
        visualizations: ['bar', 'line', 'pie', 'area', 'radar', 'scatter'],
        support: 'email',
        dataRetention: 30, // Added required field
        pdfExports: true,
        teamSharing: true,
        customVisualizations: false,
        apiAccess: false,
        whiteLabel: false,
        prioritySupport: false
      },
      isActive: true,
      sortOrder: 2
    },
    {
      name: 'Enterprise',
      tier: 'enterprise',
      description: 'Complete solution for teams and organizations',
      pricing: {
        monthly: { amount: 9999, currency: 'USD' }, // $99.99
        yearly: { amount: 99990, currency: 'USD', discount: 17 } // $999.90 (17% discount)
      },
      features: {
        files: -1, // unlimited
        storage: 1024 * 1024 * 1024, // 1GB
        exports: -1, // unlimited
        visualizations: 'all',
        support: 'priority',
        dataRetention: 365, // Added required field
        pdfExports: true,
        teamSharing: true,
        customVisualizations: true,
        apiAccess: true,
        whiteLabel: true,
        prioritySupport: true
      },
      isActive: true,
      sortOrder: 3
    }
  ];

  if (options.clear) {
    await SubscriptionPlan.deleteMany({});
  }

  const created = await SubscriptionPlan.insertMany(plans);
  return { created: created.length, plans: created.map(p => ({ id: p._id, name: p.name, tier: p.tier })) };
};

const seedSampleUsers = async (options) => {
  const count = options.count || 10;
  const users = [];

  for (let i = 1; i <= count; i++) {
    users.push({
      firebaseUid: `sample_user_${i}_${Date.now()}`,
      email: `user${i}@example.com`,
      name: `Sample User ${i}`,
      role: i <= 2 ? 'admin' : 'user',
      subscription: {
        tier: i <= 3 ? 'enterprise' : i <= 6 ? 'pro' : 'free',
        status: 'active'
      },
      isEmailVerified: true,
      preferences: {
        theme: 'light',
        notifications: true
      }
    });
  }

  const created = await User.insertMany(users);
  return { created: created.length, users: created.map(u => ({ id: u._id, email: u.email, role: u.role })) };
};

const seedSampleFiles = async (options) => {
  const count = options.count || 20;
  const users = await User.find({ role: 'user' }).limit(10);
  
  if (users.length === 0) {
    throw new Error('No users found. Please seed users first.');
  }

  const files = [];
  const fileTypes = ['sales_data', 'user_analytics', 'financial_report', 'inventory', 'survey_results'];
  const statuses = ['processed', 'processing', 'failed'];

  for (let i = 1; i <= count; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    
    files.push({
      filename: `${fileType}_${i}.csv`,
      originalName: `${fileType}_${i}.csv`,
      size: Math.floor(Math.random() * 1000000) + 10000, // 10KB to 1MB
      mimetype: 'text/csv',
      owner: randomUser._id,
      ownerType: 'user',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      metadata: {
        rows: Math.floor(Math.random() * 10000) + 100,
        columns: Math.floor(Math.random() * 20) + 5,
        encoding: 'utf-8'
      },
      visualizations: [],
      accessCount: Math.floor(Math.random() * 50),
      lastAccessedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
    });
  }

  const created = await File.insertMany(files);
  return { created: created.length, files: created.map(f => ({ id: f._id, filename: f.filename, owner: f.owner })) };
};

const seedUsageData = async (options) => {
  const days = options.days || 30;
  const users = await User.find().limit(20);
  
  if (users.length === 0) {
    throw new Error('No users found. Please seed users first.');
  }

  const usageData = [];
  const now = new Date();

  for (let day = 0; day < days; day++) {
    const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
    
    for (const user of users) {
      usageData.push({
        userId: user._id,
        date: date,
        period: 'daily',
        metrics: {
          filesUploaded: Math.floor(Math.random() * 5),
          visualizationsCreated: Math.floor(Math.random() * 10),
          exportsGenerated: Math.floor(Math.random() * 3),
          apiCalls: Math.floor(Math.random() * 100),
          storageUsed: Math.floor(Math.random() * 1000000)
        }
      });
    }
  }

  const created = await UsageTracking.insertMany(usageData);
  return { created: created.length, days, users: users.length };
};

const seedAll = async (options) => {
  const results = {};
  
  results.subscriptionPlans = await seedSubscriptionPlans(options);
  results.sampleUsers = await seedSampleUsers(options);
  results.sampleFiles = await seedSampleFiles(options);
  results.usageData = await seedUsageData(options);
  
  return results;
};

// @desc    Get all users with management info
// @route   GET /api/v1/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;

    // Build filter query
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (status && status !== 'all') filter.isActive = status === 'active';
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-firebaseUid -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    // Get payment history for each user (placeholder for now)
    const usersWithPayments = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      userObj.paymentHistory = []; // Will be populated when payment system is implemented
      userObj.totalSpent = 0;
      return userObj;
    }));

    res.status(200).json({
      success: true,
      data: {
        users: usersWithPayments,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: users.length,
          totalUsers: total
        }
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
};

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/v1/admin/users/:id/status
// @access  Admin
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating admin users
    if (user.role === 'admin' && !isActive) {
      return res.status(403).json({
        success: false,
        message: 'Cannot deactivate admin users'
      });
    }

    user.isActive = isActive;
    await user.save();

    logger.info(`User ${user.email} ${isActive ? 'activated' : 'deactivated'} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

// @desc    Update user role
// @route   PUT /api/v1/admin/users/:id/role
// @access  Admin
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['visitor', 'user', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified',
        validRoles
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent changing own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    logger.info(`User ${user.email} role changed from ${oldRole} to ${role} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `User role updated from ${oldRole} to ${role}`,
      data: user
    });
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

// @desc    Get system monitoring data
// @route   GET /api/v1/admin/system/status
// @access  Admin
const getSystemStatus = async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Database status
    const dbStatus = {
      connected: mongoose.connection.readyState === 1,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      collections: await mongoose.connection.db.listCollections().toArray()
    };

    // Active users (last 24 hours)
    const activeUsers = await User.countDocuments({
      lastActivityAt: { $gte: oneDayAgo }
    });

    // File uploads today
    const uploadsToday = await File.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });

    // Total API calls (placeholder - would need request logging)
    const apiCalls = Math.floor(Math.random() * 10000) + 5000; // Mock data

    // Error logs (placeholder - would need error logging system)
    const recentErrors = []; // Mock data

    // Memory usage
    const memoryUsage = process.memoryUsage();

    // System uptime
    const uptime = process.uptime();

    const systemStatus = {
      server: {
        status: 'healthy',
        uptime: uptime,
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      },
      database: dbStatus,
      metrics: {
        activeUsers,
        uploadsToday,
        apiCalls,
        totalUsers: await User.countDocuments(),
        totalFiles: await File.countDocuments()
      },
      errors: recentErrors
    };

    res.status(200).json({
      success: true,
      data: systemStatus
    });
  } catch (error) {
    logger.error('System status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system status',
      error: error.message
    });
  }
};

// @desc    Get usage analytics
// @route   GET /api/v1/admin/analytics
// @access  Admin
const getUsageAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // User registrations over time
    const userRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // File uploads over time
    const fileUploads = await File.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // User role distribution
    const roleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Subscription tier distribution
    const subscriptionDistribution = await User.aggregate([
      { $group: { _id: '$subscription.tier', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        userRegistrations,
        fileUploads,
        roleDistribution,
        subscriptionDistribution
      }
    });
  } catch (error) {
    logger.error('Usage analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage analytics',
      error: error.message
    });
  }
};

// @desc    Run database migrations
// @route   POST /api/v1/admin/db/migrate
// @access  Admin
const runMigrations = async (req, res) => {
  try {
    const { direction = 'up', version = null } = req.body;

    logger.info(`Running migrations ${direction}`, {
      direction,
      version,
      adminUser: req.user.id
    });

    let result;
    if (direction === 'up') {
      result = await migrationManager.runUp(version);
    } else if (direction === 'down') {
      result = await migrationManager.runDown(version);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid migration direction. Use "up" or "down".'
      });
    }

    res.status(200).json({
      success: true,
      message: `Migrations ${direction} completed successfully`,
      data: result
    });

  } catch (error) {
    logger.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: `Migration failed: ${error.message}`,
      error: error.message
    });
  }
};

// @desc    Get migration status and history
// @route   GET /api/v1/admin/db/migrations
// @access  Admin
const getMigrationStatus = async (req, res) => {
  try {
    const status = await migrationManager.getStatus();

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Get migration status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get migration status',
      error: error.message
    });
  }
};

// @desc    Get database performance metrics
// @route   GET /api/v1/admin/db/performance
// @access  Admin
const getPerformanceMetrics = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const admin = db.admin();

    // Get server status
    const serverStatus = await admin.serverStatus();

    // Get database stats
    const dbStats = await db.stats();

    const metrics = {
      connections: {
        current: serverStatus.connections.current,
        available: serverStatus.connections.available,
        totalCreated: serverStatus.connections.totalCreated
      },
      memory: {
        resident: Math.round(serverStatus.mem.resident),
        virtual: Math.round(serverStatus.mem.virtual),
        mapped: Math.round(serverStatus.mem.mapped || 0)
      },
      operations: {
        insert: serverStatus.opcounters.insert,
        query: serverStatus.opcounters.query,
        update: serverStatus.opcounters.update,
        delete: serverStatus.opcounters.delete
      },
      database: {
        collections: dbStats.collections,
        objects: dbStats.objects,
        avgObjSize: Math.round(dbStats.avgObjSize || 0),
        dataSize: Math.round(dbStats.dataSize / 1024 / 1024), // MB
        storageSize: Math.round(dbStats.storageSize / 1024 / 1024), // MB
        indexSize: Math.round(dbStats.indexSize / 1024 / 1024) // MB
      },
      uptime: Math.round(serverStatus.uptime / 3600) // hours
    };

    res.status(200).json({
      success: true,
      data: metrics
    });

  } catch (error) {
    logger.error('Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
      error: error.message
    });
  }
};

// @desc    Get collection data with pagination
// @route   GET /api/v1/admin/db/data/:collection
// @access  Admin
const getCollectionData = async (req, res) => {
  try {
    const { collection } = req.params;
    const {
      page = 1,
      limit = 10,
      sort = '_id',
      order = -1,
      search = ''
    } = req.query;

    // Validate collection name
    const allowedCollections = ['users', 'files', 'usersubscriptions', 'subscriptionplans', 'usagetracking', 'migrations'];
    if (!allowedCollections.includes(collection.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection name',
        allowedCollections
      });
    }

    const db = mongoose.connection.db;

    // Check if collection exists
    const collections = await db.listCollections({ name: collection }).toArray();
    if (collections.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Collection '${collection}' not found`
      });
    }

    const collectionObj = db.collection(collection);

    // Build search filter
    let filter = {};
    if (search) {
      // Create a text search across multiple fields
      const searchRegex = { $regex: search, $options: 'i' };
      filter = {
        $or: [
          { email: searchRegex },
          { name: searchRegex },
          { title: searchRegex },
          { description: searchRegex },
          { status: searchRegex },
          { type: searchRegex },
          { tier: searchRegex }
        ]
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = parseInt(order);

    // Get total count
    const total = await collectionObj.countDocuments(filter);
    const pages = Math.ceil(total / parseInt(limit));

    // Get documents
    const documents = await collectionObj
      .find(filter)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    res.status(200).json({
      success: true,
      data: {
        documents,
        total,
        pages,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Get collection data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get collection data',
      error: error.message
    });
  }
};

const fs = require('fs');
const path = require('path');

// List all Markdown files in the project root
const getMarkdownFiles = async (req, res) => {
  try {
    const rootDir = path.resolve(__dirname, '../../../');
    const files = fs.readdirSync(rootDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    res.status(200).json({ success: true, files: mdFiles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list markdown files', error: error.message });
  }
};

// Get the content of a specific Markdown file
const getMarkdownFileContent = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename.endsWith('.md')) {
      return res.status(400).json({ success: false, message: 'Invalid file type' });
    }
    const rootDir = path.resolve(__dirname, '../../../');
    const filePath = path.join(rootDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    res.status(200).json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to read markdown file', error: error.message });
  }
};

module.exports = {
  getDatabaseStatus,
  getCollectionStats,
  runSeeder,
  clearCollection,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getSystemStatus,
  getUsageAnalytics,
  runMigrations,
  getMigrationStatus,
  getPerformanceMetrics,
  getCollectionData,
  getMarkdownFiles,
  getMarkdownFileContent
};





