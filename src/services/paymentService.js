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
}

export default new PaymentService();



