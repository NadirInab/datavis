// Simplified payment service without Stripe
const PAYMENT_ENABLED = import.meta.env.VITE_PAYMENT_ENABLED === 'true';

// Export subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      '5 files maximum',
      '10MB storage limit',
      'Basic visualizations',
      '7-day data storage',
      'Community support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    features: [
      'Unlimited files',
      '100MB storage',
      'Advanced visualizations',
      '30-day data storage',
      'PDF exports',
      'Team sharing',
      'Email support'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29.99,
    interval: 'month',
    features: [
      'Unlimited files',
      '1GB storage',
      'All visualizations',
      '365-day data storage',
      'Custom visualizations',
      'API access',
      'White labeling',
      'Priority support'
    ]
  }
};

class PaymentService {
  constructor() {
    this.paymentEnabled = PAYMENT_ENABLED;
  }

  /**
   * Create a mock payment for subscription
   * @param {string} planType - Plan type ('pro' or 'enterprise')
   * @param {string} billingCycle - 'monthly' or 'yearly'
   * @returns {Promise<Object>} Payment result
   */
  async createMockPayment(planType, billingCycle = 'monthly') {
    try {
      if (!this.paymentEnabled) {
        throw new Error('Payment processing is disabled');
      }

      const plan = SUBSCRIPTION_PLANS[planType];
      if (!plan) {
        throw new Error('Invalid plan type');
      }

      const response = await fetch('/api/v1/payments/mock-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planType,
          billingCycle,
          amount: plan.price
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment processing failed');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Mock payment failed:', error);
      throw error;
    }
  }

  /**
   * Simulate payment processing (mock)
   * @param {string} planType - Plan type
   * @param {string} billingCycle - Billing cycle
   * @returns {Promise<Object>} Payment result
   */
  async processPayment(planType, billingCycle = 'monthly') {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock payment success
    return this.createMockPayment(planType, billingCycle);
  }

  /**
   * Create checkout session (redirects to mock payment page)
   * @param {string} planType - Plan type
   * @param {string} billingCycle - Billing cycle
   * @returns {Promise<Object>} Checkout session data
   */
  async createCheckoutSession(planType, billingCycle = 'monthly') {
    // Return mock session data for redirect
    return {
      id: `mock_session_${Date.now()}`,
      url: `/mock-payment?plan=${planType}&cycle=${billingCycle}`,
      planType,
      billingCycle
    };
  }

  /**
   * Redirect to mock checkout (for compatibility)
   * @param {string} sessionId - Session ID (unused in mock)
   */
  async redirectToCheckout(sessionId) {
    // This method exists for compatibility but doesn't do anything
    // since we handle redirects differently in the mock flow
    console.log('Mock redirect to checkout:', sessionId);
  }

  /**
   * Get current subscription
   * @returns {Promise<Object>} Subscription data
   */
  async getCurrentSubscription() {
    try {
      const response = await fetch('/api/v1/subscriptions/current', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get subscription');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get subscription failed:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelSubscription(reason = 'User requested cancellation') {
    try {
      const response = await fetch('/api/v1/payments/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel subscription');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Cancel subscription failed:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   * @returns {Promise<Object>} Payment history
   */
  async getPaymentHistory() {
    try {
      const response = await fetch('/api/v1/payments/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get payment history');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get payment history failed:', error);
      throw error;
    }
  }

  /**
   * Get subscription status for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Subscription status
   */
  async getSubscriptionStatus(userId) {
    try {
      // If payment is disabled, return mock data
      if (!this.paymentEnabled) {
        return {
          subscriptionId: null,
          planType: 'free',
          status: 'active',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          trialEnd: null,
          isTrialing: false,
          paymentMethod: null
        };
      }

      const response = await fetch(`/api/v1/subscriptions/status/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        // If user not found or no subscription, return free plan
        if (response.status === 404) {
          return {
            subscriptionId: null,
            planType: 'free',
            status: 'active',
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            trialEnd: null,
            isTrialing: false,
            paymentMethod: null
          };
        }

        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get subscription status');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get subscription status failed:', error);

      // Return fallback data instead of throwing
      return {
        subscriptionId: null,
        planType: 'free',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEnd: null,
        isTrialing: false,
        paymentMethod: null,
        error: error.message
      };
    }
  }

  /**
   * Get plan comparison data
   * @param {string} currentPlan - Current user's plan
   * @returns {Array} Array of plan objects with comparison data
   */
  getPlanComparison(currentPlan = 'free') {
    const planOrder = ['free', 'pro', 'enterprise'];
    const currentIndex = planOrder.indexOf(currentPlan);

    return planOrder.map((planId, index) => {
      const plan = SUBSCRIPTION_PLANS[planId];
      const isCurrent = planId === currentPlan;
      const isUpgrade = index > currentIndex;
      const isDowngrade = index < currentIndex;

      return {
        ...plan,
        isCurrent,
        isUpgrade,
        isDowngrade,
        canSelect: !isCurrent,
        recommended: planId === 'pro', // Mark Pro as recommended
        savings: planId !== 'free' ? this.calculateYearlySavings(plan.price) : null,
        monthlyPrice: plan.price,
        yearlyPrice: planId !== 'free' ? plan.price * 10 : 0, // 2 months free on yearly
        popularFeatures: this.getPopularFeatures(planId),
        limitations: this.getPlanLimitations(planId)
      };
    });
  }

  /**
   * Calculate yearly savings for a plan
   * @param {number} monthlyPrice - Monthly price
   * @returns {Object} Savings information
   */
  calculateYearlySavings(monthlyPrice) {
    const yearlyPrice = monthlyPrice * 10; // 2 months free
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - yearlyPrice;
    const savingsPercentage = Math.round((savings / monthlyCost) * 100);

    return {
      amount: savings,
      percentage: savingsPercentage,
      yearlyPrice,
      monthlyEquivalent: yearlyPrice / 12
    };
  }

  /**
   * Get popular features for a plan
   * @param {string} planId - Plan ID
   * @returns {Array} Array of popular features
   */
  getPopularFeatures(planId) {
    const popularFeatures = {
      free: ['Basic visualizations', 'Community support'],
      pro: ['Advanced visualizations', 'PDF exports', 'Team sharing'],
      enterprise: ['API access', 'White labeling', 'Priority support']
    };

    return popularFeatures[planId] || [];
  }

  /**
   * Get plan limitations
   * @param {string} planId - Plan ID
   * @returns {Array} Array of limitations
   */
  getPlanLimitations(planId) {
    const limitations = {
      free: ['Limited to 5 files', 'Basic support only', '7-day data retention'],
      pro: ['100MB storage limit', 'Email support only'],
      enterprise: [] // No limitations for enterprise
    };

    return limitations[planId] || [];
  }
}

export default new PaymentService();



