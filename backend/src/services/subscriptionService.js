const { SubscriptionPlan, UserSubscription } = require('../models/Subscription');
const { SUBSCRIPTION_TIERS, SUBSCRIPTION_STATUS, SUBSCRIPTION_LIMITS } = require('../utils/constants');
const logger = require('../utils/logger');

class SubscriptionService {
  /**
   * Initialize default subscription plans
   */
  async initializeDefaultPlans() {
    try {
      const existingPlans = await SubscriptionPlan.find();
      if (existingPlans.length > 0) {
        logger.info('Subscription plans already exist, skipping initialization');
        return existingPlans;
      }

      const defaultPlans = [
        {
          tier: SUBSCRIPTION_TIERS.FREE,
          name: 'Free',
          description: 'Perfect for getting started with data visualization',
          pricing: {
            monthly: { amount: 0, currency: 'USD' },
            yearly: { amount: 0, currency: 'USD', discount: 0 }
          },
          features: {
            files: 3,
            storage: 5 * 1024 * 1024, // 5MB
            exports: 10,
            visualizations: ['bar', 'line', 'pie'],
            support: 'community',
            dataRetention: 7,
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
          tier: SUBSCRIPTION_TIERS.PRO,
          name: 'Pro',
          description: 'Advanced features for professional data analysis',
          pricing: {
            monthly: { amount: 9.99, currency: 'USD' },
            yearly: { amount: 99.99, currency: 'USD', discount: 17 }
          },
          features: {
            files: 50,
            storage: 100 * 1024 * 1024, // 100MB
            exports: 100,
            visualizations: ['bar', 'line', 'pie', 'area', 'radar', 'scatter'],
            support: 'email',
            dataRetention: 30,
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
          tier: SUBSCRIPTION_TIERS.ENTERPRISE,
          name: 'Enterprise',
          description: 'Complete solution for teams and organizations',
          pricing: {
            monthly: { amount: 29.99, currency: 'USD' },
            yearly: { amount: 299.99, currency: 'USD', discount: 17 }
          },
          features: {
            files: -1, // unlimited
            storage: 1024 * 1024 * 1024, // 1GB
            exports: -1, // unlimited
            visualizations: 'all',
            support: 'priority',
            dataRetention: 365,
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

      const createdPlans = await SubscriptionPlan.insertMany(defaultPlans);
      logger.info(`Created ${createdPlans.length} default subscription plans`);
      return createdPlans;
    } catch (error) {
      logger.error('Failed to initialize default subscription plans:', error);
      throw error;
    }
  }

  /**
   * Get all active subscription plans
   */
  async getActivePlans() {
    try {
      const plans = await SubscriptionPlan.find({ isActive: true })
        .sort({ sortOrder: 1 });
      return plans;
    } catch (error) {
      logger.error('Failed to get active plans:', error);
      throw error;
    }
  }

  /**
   * Get plan by tier
   */
  async getPlanByTier(tier) {
    try {
      const plan = await SubscriptionPlan.findOne({ tier, isActive: true });
      return plan;
    } catch (error) {
      logger.error(`Failed to get plan for tier ${tier}:`, error);
      throw error;
    }
  }

  /**
   * Get user subscription
   */
  async getUserSubscription(userUid) {
    try {
      const subscription = await UserSubscription.findOne({ userUid })
        .populate('planDetails');
      return subscription;
    } catch (error) {
      logger.error(`Failed to get subscription for user ${userUid}:`, error);
      throw error;
    }
  }

  /**
   * Create user subscription
   */
  async createUserSubscription(userUid, tier, billingCycle = 'monthly', paymentMethod = 'mock') {
    try {
      const plan = await this.getPlanByTier(tier);
      if (!plan) {
        throw new Error(`Plan not found for tier: ${tier}`);
      }

      // Check if user already has a subscription
      const existingSubscription = await UserSubscription.findOne({ userUid });
      if (existingSubscription) {
        throw new Error('User already has a subscription');
      }

      const amount = plan.pricing[billingCycle].amount;
      const now = new Date();
      const periodEnd = new Date(now);
      
      if (billingCycle === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const subscriptionData = {
        userUid,
        tier,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        billingCycle,
        amount,
        currency: plan.pricing[billingCycle].currency,
        paymentMethod,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        usage: {
          files: { current: 0, peak: 0 },
          storage: { current: 0, peak: 0 },
          exports: { thisMonth: 0, total: 0 },
          lastUpdated: now
        }
      };

      const subscription = new UserSubscription(subscriptionData);
      await subscription.save();

      logger.info(`Created subscription for user ${userUid} with tier ${tier}`);
      return subscription;
    } catch (error) {
      logger.error(`Failed to create subscription for user ${userUid}:`, error);
      throw error;
    }
  }

  /**
   * Update user subscription
   */
  async updateUserSubscription(userUid, updates) {
    try {
      const subscription = await UserSubscription.findOneAndUpdate(
        { userUid },
        updates,
        { new: true, runValidators: true }
      ).populate('planDetails');

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      logger.info(`Updated subscription for user ${userUid}`);
      return subscription;
    } catch (error) {
      logger.error(`Failed to update subscription for user ${userUid}:`, error);
      throw error;
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelUserSubscription(userUid, reason = 'User requested cancellation') {
    try {
      const subscription = await UserSubscription.findOne({ userUid });
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const updates = {
        status: SUBSCRIPTION_STATUS.CANCELLED,
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        cancellationReason: reason
      };

      const updatedSubscription = await this.updateUserSubscription(userUid, updates);
      logger.info(`Cancelled subscription for user ${userUid}`);
      return updatedSubscription;
    } catch (error) {
      logger.error(`Failed to cancel subscription for user ${userUid}:`, error);
      throw error;
    }
  }

  /**
   * Upgrade/downgrade user subscription
   */
  async changeUserSubscription(userUid, newTier, billingCycle = 'monthly') {
    try {
      const currentSubscription = await UserSubscription.findOne({ userUid });
      if (!currentSubscription) {
        throw new Error('Current subscription not found');
      }

      const newPlan = await this.getPlanByTier(newTier);
      if (!newPlan) {
        throw new Error(`Plan not found for tier: ${newTier}`);
      }

      const updates = {
        previousTier: currentSubscription.tier,
        tier: newTier,
        billingCycle,
        amount: newPlan.pricing[billingCycle].amount,
        currency: newPlan.pricing[billingCycle].currency
      };

      const updatedSubscription = await this.updateUserSubscription(userUid, updates);
      logger.info(`Changed subscription for user ${userUid} from ${currentSubscription.tier} to ${newTier}`);
      return updatedSubscription;
    } catch (error) {
      logger.error(`Failed to change subscription for user ${userUid}:`, error);
      throw error;
    }
  }

  /**
   * Check if user has feature access
   */
  async checkFeatureAccess(userUid, featureName) {
    try {
      const subscription = await this.getUserSubscription(userUid);
      if (!subscription || !subscription.planDetails) {
        return { allowed: false, reason: 'No active subscription' };
      }

      const feature = subscription.planDetails.features[featureName];
      if (feature === undefined) {
        return { allowed: false, reason: 'Feature not found' };
      }

      if (typeof feature === 'boolean') {
        return { allowed: feature };
      }

      if (Array.isArray(feature) || feature === 'all') {
        return { allowed: true, value: feature };
      }

      return { allowed: true, value: feature };
    } catch (error) {
      logger.error(`Failed to check feature access for user ${userUid}:`, error);
      return { allowed: false, reason: 'Error checking access' };
    }
  }

  /**
   * Check usage limits
   */
  async checkUsageLimit(userUid, limitType) {
    try {
      const subscription = await this.getUserSubscription(userUid);
      if (!subscription || !subscription.planDetails) {
        return { allowed: false, reason: 'No active subscription' };
      }

      const limit = subscription.planDetails.features[limitType];
      const current = subscription.usage[limitType]?.current || 0;

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
    } catch (error) {
      logger.error(`Failed to check usage limit for user ${userUid}:`, error);
      return { allowed: false, reason: 'Error checking limit' };
    }
  }

  /**
   * Update usage
   */
  async updateUsage(userUid, usageType, amount = 1) {
    try {
      const subscription = await UserSubscription.findOne({ userUid });
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      subscription.updateUsage(usageType, amount);
      await subscription.save();

      logger.info(`Updated ${usageType} usage for user ${userUid} by ${amount}`);
      return subscription.usage;
    } catch (error) {
      logger.error(`Failed to update usage for user ${userUid}:`, error);
      throw error;
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics() {
    try {
      const analytics = await UserSubscription.aggregate([
        {
          $group: {
            _id: '$tier',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$amount' },
            activeSubscriptions: {
              $sum: {
                $cond: [{ $eq: ['$status', SUBSCRIPTION_STATUS.ACTIVE] }, 1, 0]
              }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      return analytics;
    } catch (error) {
      logger.error('Failed to get subscription analytics:', error);
      throw error;
    }
  }

  /**
   * Get plan comparison data
   */
  async getPlanComparison(currentTier = null) {
    try {
      const plans = await this.getActivePlans();
      
      return plans.map(plan => {
        const isCurrent = currentTier === plan.tier;
        const tierOrder = {
          [SUBSCRIPTION_TIERS.FREE]: 0,
          [SUBSCRIPTION_TIERS.PRO]: 1,
          [SUBSCRIPTION_TIERS.ENTERPRISE]: 2
        };
        
        const currentOrder = tierOrder[currentTier] || -1;
        const planOrder = tierOrder[plan.tier];
        
        return {
          id: plan.tier,
          name: plan.name,
          description: plan.description,
          price: plan.pricing.monthly.amount,
          yearlyPrice: plan.pricing.yearly.amount,
          interval: 'month',
          features: this.formatPlanFeatures(plan.features),
          isCurrent,
          isUpgrade: planOrder > currentOrder,
          isDowngrade: planOrder < currentOrder && currentOrder !== -1,
          sortOrder: plan.sortOrder
        };
      });
    } catch (error) {
      logger.error('Failed to get plan comparison:', error);
      throw error;
    }
  }

  /**
   * Format plan features for display
   */
  formatPlanFeatures(features) {
    const formatted = [];
    
    // Files
    if (features.files === -1) {
      formatted.push('Unlimited file uploads');
    } else {
      formatted.push(`${features.files} file uploads per month`);
    }
    
    // Storage
    const storageGB = features.storage / (1024 * 1024 * 1024);
    const storageMB = features.storage / (1024 * 1024);
    if (storageGB >= 1) {
      formatted.push(`${storageGB}GB storage`);
    } else {
      formatted.push(`${storageMB}MB storage`);
    }
    
    // Visualizations
    if (features.visualizations === 'all') {
      formatted.push('All visualization types');
    } else if (Array.isArray(features.visualizations)) {
      formatted.push(`${features.visualizations.length} visualization types`);
    }
    
    // Data retention
    if (features.dataRetention >= 365) {
      formatted.push('1 year data retention');
    } else if (features.dataRetention >= 30) {
      formatted.push('30 days data retention');
    } else {
      formatted.push(`${features.dataRetention} days data retention`);
    }
    
    // Exports
    if (features.exports === -1) {
      formatted.push('Unlimited exports');
    } else {
      formatted.push(`${features.exports} exports per month`);
    }
    
    // Additional features
    if (features.pdfExports) {
      formatted.push('PDF exports');
    }
    
    if (features.teamSharing) {
      formatted.push('Team sharing');
    }
    
    if (features.customVisualizations) {
      formatted.push('Custom visualizations');
    }
    
    if (features.apiAccess) {
      formatted.push('API access');
    }
    
    if (features.whiteLabel) {
      formatted.push('White label solution');
    }
    
    // Support
    switch (features.support) {
      case 'community':
        formatted.push('Community support');
        break;
      case 'email':
        formatted.push('Email support');
        break;
      case 'priority':
        formatted.push('Priority support');
        break;
      case 'dedicated':
        formatted.push('Dedicated support');
        break;
    }
    
    return formatted;
  }
}

module.exports = new SubscriptionService();