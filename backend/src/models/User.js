const mongoose = require('mongoose');
const { SUBSCRIPTION_TIERS, USER_ROLES, SUBSCRIPTION_STATUS } = require('../utils/constants');

const userSchema = new mongoose.Schema({
  // Firebase UID as primary identifier
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },

  // User basic information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  photoURL: {
    type: String,
    default: null
  },
  
  // User role system
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.USER
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Subscription information (commented out for now)
  // subscription: {
  //   tier: {
  //     type: String,
  //     enum: Object.values(SUBSCRIPTION_TIERS),
  //     default: SUBSCRIPTION_TIERS.FREE
  //   },
  //   status: {
  //     type: String,
  //     enum: Object.values(SUBSCRIPTION_STATUS),
  //     default: SUBSCRIPTION_STATUS.ACTIVE
  //   },
  //   stripeCustomerId: {
  //     type: String,
  //     default: null
  //   },
  //   stripeSubscriptionId: {
  //     type: String,
  //     default: null
  //   },
  //   currentPeriodStart: {
  //     type: Date,
  //     default: Date.now
  //   },
  //   currentPeriodEnd: {
  //     type: Date,
  //     default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  //   },
  //   cancelAtPeriodEnd: {
  //     type: Boolean,
  //     default: false
  //   },
  //   trialEnd: {
  //     type: Date,
  //     default: null
  //   }
  // },
  
  // File upload tracking
  fileUsage: {
    totalFiles: {
      type: Number,
      default: 0,
      min: 0
    },
    filesThisMonth: {
      type: Number,
      default: 0,
      min: 0
    },
    storageUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    },
    // Permanent upload counter - NEVER decreases
    totalUploadsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    firstUploadDate: {
      type: Date,
      default: null
    },
    lastUploadDate: {
      type: Date,
      default: null
    }
  },
  
  // Export tracking
  exportUsage: {
    exportsThisMonth: {
      type: Number,
      default: 0,
      min: 0
    },
    lastExportDate: {
      type: Date,
      default: null
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Dashboard preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    defaultVisualization: {
      type: String,
      enum: ['bar', 'line', 'pie', 'area', 'radar', 'scatter'],
      default: 'bar'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    marketingEmails: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Company information (optional)
  company: {
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
      default: null
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  
  // Visitor tracking (for unauthenticated users)
  visitorSession: {
    sessionId: {
      type: String,
      default: null
    },
    filesUploaded: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  
  // Metadata
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  
  ipAddress: {
    type: String,
    default: null
  },
  
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance (only non-duplicate ones)
userSchema.index({ role: 1, isActive: 1 });
// userSchema.index({ 'subscription.stripeCustomerId': 1 }); // commented out
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActivityAt: -1 });

// Virtuals and methods related to subscription plans are commented out for now
// userSchema.virtual('subscriptionLimits').get(function() {
//   const limits = {
//     [SUBSCRIPTION_TIERS.FREE]: {
//       files: 5, // 2 visitor + 3 authenticated
//       storage: 10 * 1024 * 1024, // 10MB
//       exports: 10,
//       visualizations: ['bar', 'line', 'pie']
//     },
//     [SUBSCRIPTION_TIERS.PRO]: {
//       files: -1, // unlimited
//       storage: 100 * 1024 * 1024, // 100MB
//       exports: 100,
//       visualizations: ['bar', 'line', 'pie', 'area', 'radar', 'scatter']
//     },
//     [SUBSCRIPTION_TIERS.ENTERPRISE]: {
//       files: -1, // unlimited
//       storage: 1024 * 1024 * 1024, // 1GB
//       exports: -1, // unlimited
//       visualizations: 'all'
//     }
//   };
//   
//   return limits[this.subscription.tier] || limits[SUBSCRIPTION_TIERS.FREE];
// });

// userSchema.virtual('visitorFileLimit').get(function() {
//   return 2; // Visitors can upload up to 2 files
// });

// userSchema.virtual('authenticatedUserBonus').get(function() {
//   return 3; // Authenticated users get 3 additional files
// });

// userSchema.methods.canUploadFile = function() {
//   const limits = this.subscriptionLimits;
//   
//   // Unlimited files for paid tiers
//   if (limits.files === -1) {
//     return { canUpload: true, reason: 'unlimited' };
//   }
//   
//   // Check file limit
//   if (this.fileUsage.totalFiles >= limits.files) {
//     return { 
//       canUpload: false, 
//       reason: 'file_limit_exceeded',
//       current: this.fileUsage.totalFiles,
//       limit: limits.files
//     };
//   }
//   
//   return { canUpload: true, reason: 'within_limits' };
// };

// userSchema.methods.canUploadFileSize = function(fileSize) {
//   const limits = this.subscriptionLimits;
//   
//   if (this.fileUsage.storageUsed + fileSize > limits.storage) {
//     return {
//       canUpload: false,
//       reason: 'storage_limit_exceeded',
//       current: this.fileUsage.storageUsed,
//       limit: limits.storage,
//       required: fileSize
//     };
//   }
//   
//   return { canUpload: true, reason: 'within_limits' };
// };

// userSchema.methods.resetMonthlyUsage = function() {
//   const now = new Date();
//   const lastReset = this.fileUsage.lastResetDate;
//   
//   // Reset if it's a new month
//   if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
//     this.fileUsage.filesThisMonth = 0;
//     this.fileUsage.lastResetDate = now;
//     this.exportUsage.exportsThisMonth = 0;
//     this.exportUsage.lastResetDate = now;
//   }
// };

// Method to increment permanent upload counter
userSchema.methods.incrementUploadCounter = function() {
  this.fileUsage.totalUploadsCount += 1;
  this.fileUsage.lastUploadDate = new Date();

  // Set first upload date if this is the first upload
  if (!this.fileUsage.firstUploadDate) {
    this.fileUsage.firstUploadDate = new Date();
  }

  return this.save();
};

// Method to check if user has reached permanent upload limit
userSchema.methods.hasReachedPermanentUploadLimit = function() {
  const PERMANENT_UPLOAD_LIMIT = 5;
  return this.fileUsage.totalUploadsCount >= PERMANENT_UPLOAD_LIMIT;
};

// Method to get remaining permanent uploads
userSchema.methods.getRemainingPermanentUploads = function() {
  const PERMANENT_UPLOAD_LIMIT = 5;
  return Math.max(0, PERMANENT_UPLOAD_LIMIT - this.fileUsage.totalUploadsCount);
};

// Virtual for upload limit info
userSchema.virtual('uploadLimitInfo').get(function() {
  const PERMANENT_UPLOAD_LIMIT = 5;
  return {
    totalUploadsCount: this.fileUsage.totalUploadsCount,
    permanentLimit: PERMANENT_UPLOAD_LIMIT,
    remainingUploads: this.getRemainingPermanentUploads(),
    hasReachedLimit: this.hasReachedPermanentUploadLimit(),
    firstUploadDate: this.fileUsage.firstUploadDate,
    lastUploadDate: this.fileUsage.lastUploadDate
  };
});

// userSchema.pre('save', function(next) {
//   this.lastActivityAt = new Date();
//   this.resetMonthlyUsage();
//   next();
// });

module.exports = mongoose.model('User', userSchema);






