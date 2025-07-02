const mongoose = require('mongoose');
const logger = require('../utils/logger');
require('dotenv').config();

// Import models
const User = require('../models/User');
const File = require('../models/File');
const { SubscriptionPlan, UserSubscription } = require('../models/Subscription');
const { UsageTracking, SystemAnalytics } = require('../models/UsageTracking');

const connectDB = require('./connection');

// Sample data
const sampleUsers = [
  {
    firebaseUid: 'test_user_1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'user',
    subscription: {
      tier: 'free',
      status: 'active'
    },
    company: {
      name: 'Tech Startup Inc.',
      size: '11-50',
      industry: 'Technology'
    },
    preferences: {
      theme: 'light',
      defaultVisualization: 'bar',
      emailNotifications: true
    }
  },
  {
    firebaseUid: 'test_user_2',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    role: 'user',
    subscription: {
      tier: 'pro',
      status: 'active'
    },
    company: {
      name: 'Data Analytics Corp',
      size: '51-200',
      industry: 'Analytics'
    },
    preferences: {
      theme: 'dark',
      defaultVisualization: 'line',
      emailNotifications: true
    }
  },
  {
    firebaseUid: 'test_user_3',
    email: 'admin@csvdashboard.com',
    name: 'System Admin',
    role: 'admin',
    subscription: {
      tier: 'enterprise',
      status: 'active'
    },
    preferences: {
      theme: 'auto',
      defaultVisualization: 'pie',
      emailNotifications: true
    }
  }
];

const sampleFiles = [
  {
    filename: 'sales_data_2023.csv',
    originalName: 'sales_data_2023.csv',
    ownerUid: 'test_user_1',
    ownerType: 'user',
    size: 15420,
    mimetype: 'text/csv',
    path: '/uploads/sales_data_2023.csv',
    status: 'ready',
    dataInfo: {
      rows: 150,
      columns: 5,
      headers: [
        { name: 'date', type: 'date', nullable: false, unique: false },
        { name: 'product', type: 'string', nullable: false, unique: false },
        { name: 'sales', type: 'number', nullable: false, unique: false },
        { name: 'region', type: 'string', nullable: false, unique: false },
        { name: 'category', type: 'string', nullable: false, unique: false }
      ],
      sampleData: [
        { date: '2023-01-01', product: 'Widget A', sales: 1250, region: 'North', category: 'Electronics' },
        { date: '2023-01-02', product: 'Widget B', sales: 980, region: 'South', category: 'Electronics' },
        { date: '2023-01-03', product: 'Gadget X', sales: 1500, region: 'East', category: 'Gadgets' }
      ]
    },
    visualizations: [
      {
        id: 'viz_1',
        type: 'bar',
        title: 'Sales by Product',
        columns: {
          x: 'product',
          y: ['sales'],
          groupBy: 'category'
        },
        config: {
          colors: ['#5A827E', '#84AE92', '#B9D4AA'],
          showLegend: true,
          showGrid: true
        }
      }
    ],
    settings: {
      isPublic: false,
      allowDownload: true,
      tags: ['sales', 'analytics', '2023']
    }
  },
  {
    filename: 'customer_data.csv',
    originalName: 'customer_data.csv',
    ownerUid: 'test_user_2',
    ownerType: 'user',
    size: 28750,
    mimetype: 'text/csv',
    path: '/uploads/customer_data.csv',
    status: 'ready',
    dataInfo: {
      rows: 300,
      columns: 6,
      headers: [
        { name: 'customer_id', type: 'string', nullable: false, unique: true },
        { name: 'name', type: 'string', nullable: false, unique: false },
        { name: 'age', type: 'number', nullable: false, unique: false },
        { name: 'city', type: 'string', nullable: false, unique: false },
        { name: 'purchase_amount', type: 'number', nullable: false, unique: false },
        { name: 'signup_date', type: 'date', nullable: false, unique: false }
      ],
      sampleData: [
        { customer_id: 'CUST001', name: 'Alice Johnson', age: 28, city: 'New York', purchase_amount: 450, signup_date: '2023-01-15' },
        { customer_id: 'CUST002', name: 'Bob Wilson', age: 35, city: 'Los Angeles', purchase_amount: 320, signup_date: '2023-01-20' },
        { customer_id: 'CUST003', name: 'Carol Davis', age: 42, city: 'Chicago', purchase_amount: 680, signup_date: '2023-01-25' }
      ]
    },
    visualizations: [
      {
        id: 'viz_2',
        type: 'pie',
        title: 'Customers by City',
        columns: {
          x: 'city',
          y: ['customer_id'],
          groupBy: null
        },
        config: {
          colors: ['#5A827E', '#84AE92', '#B9D4AA', '#FAFFCA'],
          showLegend: true
        }
      }
    ],
    settings: {
      isPublic: true,
      allowDownload: true,
      tags: ['customers', 'demographics']
    }
  }
];

const sampleUsageData = [
  {
    userUid: 'test_user_1',
    userRole: 'user',
    subscriptionTier: 'free',
    period: {
      year: 2024,
      month: 1,
      week: 1,
      day: 15
    },
    fileUsage: {
      uploads: { count: 2, totalSize: 44170, averageSize: 22085 },
      deletions: { count: 0, totalSize: 0 },
      active: { count: 2, totalSize: 44170 }
    },
    visualizationUsage: {
      created: 3,
      viewed: 15,
      exported: 2,
      byType: { bar: 2, pie: 1, line: 0 }
    },
    exportUsage: {
      total: 2,
      byFormat: { png: 1, pdf: 1, csv: 0 },
      totalSize: 2048
    },
    sessionUsage: {
      sessions: 5,
      totalDuration: 120,
      averageDuration: 24
    }
  },
  {
    userUid: 'test_user_2',
    userRole: 'user',
    subscriptionTier: 'pro',
    period: {
      year: 2024,
      month: 1,
      week: 1,
      day: 15
    },
    fileUsage: {
      uploads: { count: 5, totalSize: 125000, averageSize: 25000 },
      deletions: { count: 1, totalSize: 15000 },
      active: { count: 4, totalSize: 110000 }
    },
    visualizationUsage: {
      created: 8,
      viewed: 45,
      exported: 12,
      byType: { bar: 3, pie: 2, line: 2, area: 1 }
    },
    exportUsage: {
      total: 12,
      byFormat: { png: 5, pdf: 4, csv: 2, json: 1 },
      totalSize: 8192
    },
    sessionUsage: {
      sessions: 12,
      totalDuration: 480,
      averageDuration: 40
    }
  }
];

const sampleSystemAnalytics = {
  period: {
    year: 2024,
    month: 1,
    day: 15
  },
  userMetrics: {
    total: 150,
    new: 12,
    active: 89,
    churned: 3,
    byTier: { free: 120, pro: 25, enterprise: 5 }
  },
  revenueMetrics: {
    total: 2500,
    recurring: 2200,
    newSubscriptions: 8,
    upgrades: 3,
    downgrades: 1,
    cancellations: 2,
    refunds: 0
  },
  systemMetrics: {
    totalFiles: 1250,
    totalStorage: 52428800, // 50MB
    totalVisualizations: 890,
    totalExports: 450,
    averageFileSize: 41943,
    averageProcessingTime: 2.5
  },
  performanceMetrics: {
    uptime: 99.9,
    averageResponseTime: 150,
    errorRate: 0.1,
    throughput: 45
  }
};

async function seedDatabase() {
  try {
    await connectDB();
    logger.info('Starting database seeding...');

    // Clear existing data (optional - comment out for production)
    if (process.env.NODE_ENV === 'development') {
      logger.info('Clearing existing data...');
      await User.deleteMany({ firebaseUid: { $regex: /^test_/ } });
      await File.deleteMany({ ownerUid: { $regex: /^test_/ } });
      await UsageTracking.deleteMany({ userUid: { $regex: /^test_/ } });
      await SystemAnalytics.deleteMany({});
      logger.info('✓ Existing test data cleared');
    }

    // Seed users
    logger.info('Seeding users...');
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      logger.info(`✓ Created user: ${user.email}`);
    }

    // Seed files
    logger.info('Seeding files...');
    for (const fileData of sampleFiles) {
      const file = new File(fileData);
      await file.save();
      logger.info(`✓ Created file: ${file.filename}`);
    }

    // Seed usage tracking data
    logger.info('Seeding usage tracking data...');
    for (const usageData of sampleUsageData) {
      const usage = new UsageTracking(usageData);
      await usage.save();
      logger.info(`✓ Created usage data for user: ${usage.userUid}`);
    }

    // Seed system analytics
    logger.info('Seeding system analytics...');
    const analytics = new SystemAnalytics(sampleSystemAnalytics);
    await analytics.save();
    logger.info('✓ Created system analytics data');

    // Update user file counts
    logger.info('Updating user file counts...');
    for (const userData of sampleUsers) {
      const fileCount = await File.countDocuments({ ownerUid: userData.firebaseUid });
      const totalSize = await File.aggregate([
        { $match: { ownerUid: userData.firebaseUid } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]);

      await User.updateOne(
        { firebaseUid: userData.firebaseUid },
        {
          'fileUsage.totalFiles': fileCount,
          'fileUsage.storageUsed': totalSize[0]?.totalSize || 0
        }
      );
      logger.info(`✓ Updated file counts for user: ${userData.email}`);
    }

    logger.info('Database seeding completed successfully!');
    logger.info('\n📊 Seeded data summary:');
    logger.info(`   Users: ${sampleUsers.length}`);
    logger.info(`   Files: ${sampleFiles.length}`);
    logger.info(`   Usage records: ${sampleUsageData.length}`);
    logger.info(`   System analytics: 1 record`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
}

async function clearDatabase() {
  try {
    await connectDB();
    logger.info('Clearing all test data...');

    await User.deleteMany({ firebaseUid: { $regex: /^test_/ } });
    await File.deleteMany({ ownerUid: { $regex: /^test_/ } });
    await UsageTracking.deleteMany({ userUid: { $regex: /^test_/ } });
    await SystemAnalytics.deleteMany({});

    logger.info('✓ All test data cleared');
    process.exit(0);
  } catch (error) {
    logger.error('Database clearing failed:', error);
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'seed':
      seedDatabase();
      break;
    case 'clear':
      clearDatabase();
      break;
    default:
      logger.info('Usage: node seed.js [seed|clear]');
      logger.info('  seed  - Populate database with sample data');
      logger.info('  clear - Remove all test data');
      process.exit(1);
  }
}

module.exports = {
  seedDatabase,
  clearDatabase,
  sampleUsers,
  sampleFiles
};
