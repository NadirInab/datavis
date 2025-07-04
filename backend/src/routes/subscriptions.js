const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { SubscriptionPlan, UserSubscription } = require('../models/Subscription');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { SUBSCRIPTION_STATUS, SUBSCRIPTION_TIERS } = require('../utils/constants');

// @route   GET /api/v1/subscriptions/current
// @desc    Get current user's subscription
// @access  Private
router.get('/current', protect, async (req, res) => {
  try {
    const userSubscription = await UserSubscription.findOne({ userUid: req.user._id });
    
    if (!userSubscription) {
      // Create a default free subscription if none exists
      const freePlan = await SubscriptionPlan.findOne({ tier: SUBSCRIPTION_TIERS.FREE });
      
      const newSubscription = new UserSubscription({
        userUid: req.user._id,
        tier: SUBSCRIPTION_TIERS.FREE,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        amount: 0,
        currency: 'USD',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      });
      
      await newSubscription.save();
      return res.json({ success: true, data: newSubscription });
    }
    
    res.json({ success: true, data: userSubscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/v1/subscriptions/create-intent
// @desc    Create subscription payment intent
// @access  Private
router.post('/create-intent', protect, async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;
    
    // Get subscription plan
    const plan = await SubscriptionPlan.findOne({ tier: planId });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }
    
    // Get or create Stripe customer
    let customer;
    if (req.user.subscription.stripeCustomerId) {
      customer = req.user.subscription.stripeCustomerId;
    } else {
      const newCustomer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: {
          userId: req.user._id.toString()
        }
      });
      
      // Update user with Stripe customer ID
      req.user.subscription.stripeCustomerId = newCustomer.id;
      await req.user.save();
      
      customer = newCustomer.id;
    }
    
    // Get price ID based on plan and billing cycle
    const priceId = billingCycle === 'yearly' 
      ? plan.pricing.yearly.stripePriceId 
      : plan.pricing.monthly.stripePriceId;
    
    if (!priceId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price ID for the selected plan and billing cycle'
      });
    }
    
    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer,
      items: [{
        price: priceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: req.user._id.toString(),
        planId: plan.tier,
        billingCycle
      }
    });
    
    // Create or update user subscription in our database
    const userSubscription = await UserSubscription.findOne({ userUid: req.user._id }) || new UserSubscription({
      userUid: req.user._id
    });
    
    userSubscription.tier = plan.tier;
    userSubscription.status = SUBSCRIPTION_STATUS.INCOMPLETE;
    userSubscription.billingCycle = billingCycle;
    userSubscription.amount = billingCycle === 'yearly' ? plan.pricing.yearly.amount : plan.pricing.monthly.amount;
    userSubscription.currency = billingCycle === 'yearly' ? plan.pricing.yearly.currency : plan.pricing.monthly.currency;
    userSubscription.stripeCustomerId = customer;
    userSubscription.stripeSubscriptionId = subscription.id;
    userSubscription.stripePriceId = priceId;
    userSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    userSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    
    await userSubscription.save();
    
    res.json({
      success: true,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      subscriptionId: subscription.id
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/v1/subscriptions/cancel
// @desc    Cancel subscription
// @access  Private
router.post('/cancel', protect, async (req, res) => {
  try {
    const userSubscription = await UserSubscription.findOne({ userUid: req.user._id });
    
    if (!userSubscription || !userSubscription.stripeSubscriptionId) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    
    // Cancel at period end in Stripe
    await stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });
    
    // Update our database
    userSubscription.cancelAtPeriodEnd = true;
    await userSubscription.save();
    
    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period'
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/v1/subscriptions/verify-payment
// @desc    Verify payment and activate subscription
// @access  Private
router.post('/verify-payment', protect, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }
    
    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment has not been completed'
      });
    }
    
    // Find subscription by payment intent
    const subscription = await UserSubscription.findOne({
      userUid: req.user._id
    }).sort({ createdAt: -1 });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    // Update subscription status if needed
    if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
      subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
      await subscription.save();
      
      // Update user subscription tier
      req.user.subscription.tier = subscription.tier;
      req.user.subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
      await req.user.save();
    }
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;



