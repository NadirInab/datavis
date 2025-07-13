const mongoose = require('mongoose');
const { SUBSCRIPTION_TIERS, USER_ROLES } = require('../utils/constants');

const usageTrackingSchema = new mongoose.Schema({
  userUid: {
    type: String,
    required: true,
    index: true
  },
  
  userRole: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: true,
    index: true
  },
  
  subscriptionTier: {
    type: String,
    enum: Object.values(SUBSCRIPTION_TIERS),
    required: true,
    index: true
  },
  
  // Time period tracking
  period: {
    year: {
      type: Number,
      required: true,
      index: true
    },
    month: {
      type: Number,
      required: true,
      index: true
    },
    week: {
      type: Number,
      required: true
    },
    day: {
      type: Number,
      required: true
    }
  },
  
  // File usage tracking
  fileUsage: {
    uploads: {
      count: {
        type: Number,
        default: 0
      },
      totalSize: {
        type: Number,
        default: 0
      },
      averageSize: {
        type: Number,
        default: 0
      }
    },
    deletions: {
      count: {
        type: Number,
        default: 0
      },
      totalSize: {
        type: Number,
        default: 0
      }
    },
    active: {
      count: {
        type: Number,
        default: 0
      },
      totalSize: {
        type: Number,
        default: 0
      }
    }
  },
  
  // Visualization usage
  visualizationUsage: {
    created: {
      type: Number,
      default: 0
    },
    viewed: {
      type: Number,
      default: 0
    },
    exported: {
      type: Number,
      default: 0
    },
    byType: {
      bar: { type: Number, default: 0 },
      line: { type: Number, default: 0 },
      pie: { type: Number, default: 0 },
      area: { type: Number, default: 0 },
      radar: { type: Number, default: 0 },
      scatter: { type: Number, default: 0 },
      histogram: { type: Number, default: 0 },
      heatmap: { type: Number, default: 0 }
    }
  },
  
  // Export usage
  exportUsage: {
    total: {
      type: Number,
      default: 0
    },
    byFormat: {
      png: { type: Number, default: 0 },
      pdf: { type: Number, default: 0 },
      csv: { type: Number, default: 0 },
      json: { type: Number, default: 0 },
      excel: { type: Number, default: 0 }
    },
    totalSize: {
      type: Number,
      default: 0
    }
  },
  
  // API usage (for enterprise users)
  apiUsage: {
    requests: {
      type: Number,
      default: 0
    },
    errors: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    }
  },
  
  // Session tracking
  sessionUsage: {
    sessions: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0 // in minutes
    },
    averageDuration: {
      type: Number,
      default: 0 // in minutes
    },
    bounceRate: {
      type: Number,
      default: 0 // percentage
    }
  },
  
  // Feature usage
  featureUsage: {
    dashboard: {
      views: { type: Number, default: 0 },
      timeSpent: { type: Number, default: 0 }
    },
    fileManager: {
      views: { type: Number, default: 0 },
      timeSpent: { type: Number, default: 0 }
    },
    visualizations: {
      views: { type: Number, default: 0 },
      timeSpent: { type: Number, default: 0 }
    },
    settings: {
      views: { type: Number, default: 0 },
      changes: { type: Number, default: 0 }
    }
  },
  
  // Performance metrics
  performance: {
    pageLoadTime: {
      average: { type: Number, default: 0 },
      median: { type: Number, default: 0 },
      p95: { type: Number, default: 0 }
    },
    fileProcessingTime: {
      average: { type: Number, default: 0 },
      median: { type: Number, default: 0 },
      p95: { type: Number, default: 0 }
    }
  },
  
  // Error tracking (renamed from 'errors' to avoid mongoose reserved field warning)
  errorTracking: {
    total: {
      type: Number,
      default: 0
    },
    byType: {
      upload: { type: Number, default: 0 },
      processing: { type: Number, default: 0 },
      visualization: { type: Number, default: 0 },
      export: { type: Number, default: 0 },
      authentication: { type: Number, default: 0 },
      payment: { type: Number, default: 0 }
    }
  },
  
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Raw event data (for detailed analysis)
  events: [{
    type: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed
    }
  }]
}, {
  timestamps: true
});

// Compound indexes for efficient querying
usageTrackingSchema.index({ userUid: 1, 'period.year': 1, 'period.month': 1 });
usageTrackingSchema.index({ subscriptionTier: 1, 'period.year': 1, 'period.month': 1 });
usageTrackingSchema.index({ userRole: 1, 'period.year': 1, 'period.month': 1 });
usageTrackingSchema.index({ 'period.year': 1, 'period.month': 1, 'period.day': 1 });

// System-wide analytics schema
const systemAnalyticsSchema = new mongoose.Schema({
  // Time period
  period: {
    year: {
      type: Number,
      required: true,
      index: true
    },
    month: {
      type: Number,
      required: true,
      index: true
    },
    day: {
      type: Number,
      required: true,
      index: true
    }
  },
  
  // User metrics
  userMetrics: {
    total: {
      type: Number,
      default: 0
    },
    new: {
      type: Number,
      default: 0
    },
    active: {
      type: Number,
      default: 0
    },
    churned: {
      type: Number,
      default: 0
    },
    byTier: {
      free: { type: Number, default: 0 },
      pro: { type: Number, default: 0 },
      enterprise: { type: Number, default: 0 }
    }
  },
  
  // Revenue metrics
  revenueMetrics: {
    total: {
      type: Number,
      default: 0
    },
    recurring: {
      type: Number,
      default: 0
    },
    newSubscriptions: {
      type: Number,
      default: 0
    },
    upgrades: {
      type: Number,
      default: 0
    },
    downgrades: {
      type: Number,
      default: 0
    },
    cancellations: {
      type: Number,
      default: 0
    },
    refunds: {
      type: Number,
      default: 0
    }
  },
  
  // System metrics
  systemMetrics: {
    totalFiles: {
      type: Number,
      default: 0
    },
    totalStorage: {
      type: Number,
      default: 0
    },
    totalVisualizations: {
      type: Number,
      default: 0
    },
    totalExports: {
      type: Number,
      default: 0
    },
    averageFileSize: {
      type: Number,
      default: 0
    },
    averageProcessingTime: {
      type: Number,
      default: 0
    }
  },
  
  // Performance metrics
  performanceMetrics: {
    uptime: {
      type: Number,
      default: 100 // percentage
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    errorRate: {
      type: Number,
      default: 0 // percentage
    },
    throughput: {
      type: Number,
      default: 0 // requests per minute
    }
  }
}, {
  timestamps: true
});

// Indexes for system analytics
systemAnalyticsSchema.index({ 'period.year': 1, 'period.month': 1, 'period.day': 1 });

// Static methods for usage tracking
usageTrackingSchema.statics.recordEvent = async function(userUid, eventType, eventData = {}) {
  const now = new Date();
  const period = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    week: Math.ceil(now.getDate() / 7),
    day: now.getDate()
  };
  
  // Find or create usage record for this period
  let usage = await this.findOne({ userUid, period });
  
  if (!usage) {
    // Get user info to create new record
    const User = mongoose.model('User');
    const user = await User.findOne({ firebaseUid: userUid });
    
    usage = new this({
      userUid,
      userRole: user?.role || 'user',
      subscriptionTier: user?.subscription?.tier || 'free',
      period
    });
  }
  
  // Add event to events array
  usage.events.push({
    type: eventType,
    timestamp: now,
    data: eventData
  });
  
  // Update specific usage counters based on event type
  switch (eventType) {
    case 'file_upload':
      usage.fileUsage.uploads.count += 1;
      usage.fileUsage.uploads.totalSize += eventData.size || 0;
      break;
    case 'visualization_created':
      usage.visualizationUsage.created += 1;
      if (eventData.type) {
        usage.visualizationUsage.byType[eventData.type] += 1;
      }
      break;
    case 'export':
      usage.exportUsage.total += 1;
      if (eventData.format) {
        usage.exportUsage.byFormat[eventData.format] += 1;
      }
      break;
    // Add more event types as needed
  }
  
  usage.lastUpdated = now;
  await usage.save();
  
  return usage;
};

// Method to get usage summary
usageTrackingSchema.methods.getSummary = function() {
  return {
    period: this.period,
    files: {
      uploaded: this.fileUsage.uploads.count,
      totalSize: this.fileUsage.uploads.totalSize,
      active: this.fileUsage.active.count
    },
    visualizations: {
      created: this.visualizationUsage.created,
      viewed: this.visualizationUsage.viewed,
      exported: this.visualizationUsage.exported
    },
    exports: {
      total: this.exportUsage.total,
      totalSize: this.exportUsage.totalSize
    },
    sessions: {
      count: this.sessionUsage.sessions,
      averageDuration: this.sessionUsage.averageDuration
    }
  };
};

const UsageTracking = mongoose.model('UsageTracking', usageTrackingSchema);
const SystemAnalytics = mongoose.model('SystemAnalytics', systemAnalyticsSchema);

module.exports = {
  UsageTracking,
  SystemAnalytics
};
