const mongoose = require('mongoose');
const { SUBSCRIPTION_TIERS, SUBSCRIPTION_STATUS, PAYMENT_STATUS } = require('../utils/constants');

const subscriptionPlanSchema = new mongoose.Schema({
  tier: {
    type: String,
    enum: Object.values(SUBSCRIPTION_TIERS),
    required: true,
    unique: true
    // No index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  pricing: {
    monthly: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        default: 'USD'
      },

    },
    yearly: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        default: 'USD'
      },

      discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    }
  },
  features: {
    files: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    storage: {
      type: Number, // in bytes
      required: true
    },
    exports: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    visualizations: {
      type: mongoose.Schema.Types.Mixed, // Array or 'all'
      required: true
    },
    support: {
      type: String,
      enum: ['community', 'email', 'priority', 'dedicated'],
      required: true
    },
    dataRetention: {
      type: Number, // in days
      required: true
    },
    pdfExports: {
      type: Boolean,
      default: false
    },
    teamSharing: {
      type: Boolean,
      default: false
    },
    customVisualizations: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    whiteLabel: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const userSubscriptionSchema = new mongoose.Schema({
  // User identification
  userUid: {
    type: String,
    required: true,
    unique: true
    // No index: true
  },

  // Subscription details
  tier: {
    type: String,
    enum: Object.values(SUBSCRIPTION_TIERS),
    required: true
    // No index: true
  },

  status: {
    type: String,
    enum: Object.values(SUBSCRIPTION_STATUS),
    required: true
  },
  
  // Billing information
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['mock', 'manual', 'admin'],
    default: 'mock'
  },
  
  // Subscription periods
  currentPeriodStart: {
    type: Date,
    required: true
  },
  
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  
  // Trial information
  trialStart: {
    type: Date,
    default: null
  },
  
  trialEnd: {
    type: Date,
    default: null
  },
  
  // Cancellation
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  
  canceledAt: {
    type: Date,
    default: null
  },
  
  cancellationReason: {
    type: String,
    default: null
  },
  
  // Upgrade/downgrade tracking
  previousTier: {
    type: String,
    enum: Object.values(SUBSCRIPTION_TIERS),
    default: null
  },
  
  upgradeDate: {
    type: Date,
    default: null
  },
  
  downgradeDate: {
    type: Date,
    default: null
  },
  
  // Usage tracking
  usage: {
    files: {
      current: {
        type: Number,
        default: 0
      },
      peak: {
        type: Number,
        default: 0
      }
    },
    storage: {
      current: {
        type: Number,
        default: 0
      },
      peak: {
        type: Number,
        default: 0
      }
    },
    exports: {
      thisMonth: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      }
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Payment history reference
  paymentHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  
  // Metadata
  notes: {
    type: String,
    default: null
  },
  
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// REMOVE ALL THESE EXPLICIT INDEX DEFINITIONS
// subscriptionPlanSchema.index({ tier: 1 }, { unique: true });
// subscriptionPlanSchema.index({ isActive: 1 });
// subscriptionPlanSchema.index({ sortOrder: 1 });
// userSubscriptionSchema.index({ tier: 1, status: 1 });
// userSubscriptionSchema.index({ stripeCustomerId: 1 });
// userSubscriptionSchema.index({ stripeSubscriptionId: 1 });
// userSubscriptionSchema.index({ currentPeriodEnd: 1 });

// Virtual for subscription plan details
userSubscriptionSchema.virtual('planDetails', {
  ref: 'SubscriptionPlan',
  localField: 'tier',
  foreignField: 'tier',
  justOne: true
});

// Virtual for days remaining
userSubscriptionSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = this.currentPeriodEnd;
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for trial status
userSubscriptionSchema.virtual('isInTrial').get(function() {
  if (!this.trialEnd) return false;
  return new Date() < this.trialEnd;
});

// Virtual for subscription active status
userSubscriptionSchema.virtual('isActive').get(function() {
  return this.status === SUBSCRIPTION_STATUS.ACTIVE || this.isInTrial;
});

// Method to check if subscription is expired
userSubscriptionSchema.methods.isExpired = function() {
  return new Date() > this.currentPeriodEnd && this.status !== SUBSCRIPTION_STATUS.ACTIVE;
};

// Method to check feature access
userSubscriptionSchema.methods.hasFeature = function(featureName) {
  // Get plan details (this would need to be populated)
  const planFeatures = this.planDetails?.features;
  if (!planFeatures) return false;
  
  return planFeatures[featureName] === true;
};

// Method to check usage limits
userSubscriptionSchema.methods.checkUsageLimit = function(limitType) {
  const planFeatures = this.planDetails?.features;
  if (!planFeatures) return { allowed: false, reason: 'No plan found' };
  
  const limit = planFeatures[limitType];
  const current = this.usage[limitType]?.current || 0;
  
  // Unlimited access
  if (limit === -1) {
    return { allowed: true, unlimited: true };
  }
  
  // Check limit
  if (current >= limit) {
    return { 
      allowed: false, 
      reason: 'Limit exceeded',
      current,
      limit
    };
  }
  
  return { 
    allowed: true, 
    current,
    limit,
    remaining: limit - current
  };
};

// Method to update usage
userSubscriptionSchema.methods.updateUsage = function(usageType, amount = 1) {
  if (!this.usage[usageType]) {
    this.usage[usageType] = { current: 0, peak: 0 };
  }
  
  this.usage[usageType].current += amount;
  
  // Update peak if necessary
  if (this.usage[usageType].current > this.usage[usageType].peak) {
    this.usage[usageType].peak = this.usage[usageType].current;
  }
  
  this.usage.lastUpdated = new Date();
};

// Pre-save middleware
userSubscriptionSchema.pre('save', function(next) {
  // Set upgrade/downgrade dates
  if (this.isModified('tier') && this.previousTier) {
    const tierOrder = {
      [SUBSCRIPTION_TIERS.FREE]: 0,
      [SUBSCRIPTION_TIERS.PRO]: 1,
      [SUBSCRIPTION_TIERS.ENTERPRISE]: 2
    };
    
    const currentOrder = tierOrder[this.tier];
    const previousOrder = tierOrder[this.previousTier];
    
    if (currentOrder > previousOrder) {
      this.upgradeDate = new Date();
    } else if (currentOrder < previousOrder) {
      this.downgradeDate = new Date();
    }
  }
  
  next();
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);

module.exports = {
  SubscriptionPlan,
  UserSubscription
};


